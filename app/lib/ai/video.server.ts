// =============================================================================
// Veo 3 Video Generation Service
// =============================================================================
// Server-side AI service for generating 8-second videos from video ideas
// Uses @google/genai SDK with veo-3.1-generate-preview model

import { getGenAIClient, getTextModel } from "./client.server";
import { withRetry } from "./retry.server";
import { MOCK_VIDEO_RESULT } from "./__mocks__/fixtures";
import { AI_MODELS } from "./models.server";

export interface VideoGenerationResult {
  url: string;
  duration: number;
  prompt: string;
}

export interface VideoGenerationOptions {
  durationSeconds?: number;
  aspectRatio?: string;
  referenceImageBuffer?: Buffer;
}

export interface VideoBufferResult {
  buffer: Buffer;
  duration: number;
  mimeType: string;
}

/**
 * Generate an 8-second video from video ideas using Veo 3 API
 * (Legacy API — used by TrendTube pipeline)
 */
export async function generateVideo(
  videoIdeas: string,
  options?: VideoGenerationOptions,
): Promise<VideoGenerationResult> {
  if (process.env.GEMINI_MOCK === "true") {
    return MOCK_VIDEO_RESULT;
  }

  const targetDuration = options?.durationSeconds ?? 8;

  // Step 1: Generate video prompt from ideas using Gemini
  const videoPrompt = await generateVideoPrompt(videoIdeas);

  // Step 2: Call Veo 3 API and get buffer
  const result = await callVeo3({
    prompt: videoPrompt,
    duration: targetDuration,
    aspectRatio: options?.aspectRatio,
    referenceImageBuffer: options?.referenceImageBuffer,
  });

  if (!result) {
    return createPlaceholderVideo(videoPrompt, targetDuration);
  }

  const dataUrl = `data:${result.mimeType};base64,${result.buffer.toString("base64")}`;

  return {
    url: dataUrl,
    duration: targetDuration,
    prompt: videoPrompt,
  };
}

/**
 * Generate a scene video clip (returns Buffer for Storage upload)
 * Used by Scene Video SSE pipeline with reference image chaining
 */
export async function generateSceneVideo(
  prompt: string,
  options?: VideoGenerationOptions,
): Promise<VideoBufferResult> {
  const duration = options?.durationSeconds ?? 8;

  if (process.env.GEMINI_MOCK === "true") {
    return {
      buffer: Buffer.alloc(0),
      duration,
      mimeType: "video/mp4",
    };
  }

  const result = await callVeo3({
    prompt,
    duration,
    aspectRatio: options?.aspectRatio,
    referenceImageBuffer: options?.referenceImageBuffer,
  });

  if (!result) {
    throw new Error("비디오 생성 실패: Veo3 API 응답 없음");
  }

  return result;
}

/**
 * Core Veo 3 API call — shared by generateVideo and generateSceneVideo
 */
async function callVeo3({
  prompt,
  duration,
  aspectRatio,
  referenceImageBuffer,
}: {
  prompt: string;
  duration: number;
  aspectRatio?: string;
  referenceImageBuffer?: Buffer;
}): Promise<VideoBufferResult | null> {
  const genaiClient = getGenAIClient();
  if (!genaiClient) {
    console.warn("Veo3: API key not set");
    return null;
  }

  try {
    // Build base request
    const baseRequest = {
      model: AI_MODELS.video.primary,
      prompt,
      config: {
        aspectRatio: (aspectRatio as "16:9" | "9:16") ?? "16:9",
        numberOfVideos: 1,
      },
    };

    // Add reference image if provided (for visual consistency)
    const requestParams = referenceImageBuffer
      ? {
          ...baseRequest,
          image: {
            imageBytes: referenceImageBuffer.toString("base64"),
            mimeType: "image/png",
          },
        }
      : baseRequest;

    let operation = await genaiClient.models.generateVideos(requestParams);

    // Poll until complete (max 5 minutes)
    const maxAttempts = 30;
    let attempts = 0;
    let consecutiveErrors = 0;

    while (operation.done !== true && attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 10000));
      try {
        operation = await genaiClient.operations.getVideosOperation({
          operation: operation,
        });
        consecutiveErrors = 0;
        attempts++;
      } catch (pollError) {
        consecutiveErrors++;
        attempts++;
        const pe = pollError as Error;
        console.warn(
          `Veo3: Poll ${attempts} failed (${consecutiveErrors}x): ${pe.message}`,
        );
        if (consecutiveErrors >= 5) {
          throw pollError;
        }
      }
    }

    if (operation.done !== true) {
      console.error("Veo3: Video generation timed out after 5 minutes");
      return null;
    }

    // Extract video from response
    const generatedVideos = operation.response?.generatedVideos;
    if (!generatedVideos || generatedVideos.length === 0) {
      console.error("Veo3: No videos in response");
      return null;
    }

    const video = generatedVideos[0].video;
    if (!video?.uri) {
      console.error("Veo3: No video URI in response");
      return null;
    }

    // Download video via authenticated fetch (video.uri requires API key)
    const downloadUrl = video.uri.includes("?")
      ? `${video.uri}&key=${process.env.GEMINI_API_KEY}`
      : `${video.uri}?key=${process.env.GEMINI_API_KEY}`;

    const downloadRes = await fetch(downloadUrl);
    if (!downloadRes.ok) {
      console.error(
        `Veo3: Download failed: ${downloadRes.status} ${downloadRes.statusText}`,
      );
      return null;
    }

    const arrayBuffer = await downloadRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = downloadRes.headers.get("content-type") || "video/mp4";

    return { buffer, duration, mimeType };
  } catch (error) {
    console.error("Veo3: Generation error:", error);
    return null;
  }
}

/**
 * Generate a single TrendTube clip from a pre-built prompt (returns Buffer for Storage)
 * Used by N-clip pipeline — prompt is already generated by generateVideoClipPrompts
 */
export async function generateTrendTubeClip(
  prompt: string,
  options?: VideoGenerationOptions,
): Promise<VideoBufferResult> {
  const duration = options?.durationSeconds ?? 8;

  if (process.env.GEMINI_MOCK === "true") {
    return {
      buffer: Buffer.alloc(0),
      duration,
      mimeType: "video/mp4",
    };
  }

  const result = await callVeo3({
    prompt,
    duration,
    aspectRatio: options?.aspectRatio,
    referenceImageBuffer: options?.referenceImageBuffer,
  });

  if (!result) {
    throw new Error("TrendTube 클립 생성 실패: Veo3 API 응답 없음");
  }

  return result;
}

/**
 * Generate a video prompt from video ideas using Gemini
 */
async function generateVideoPrompt(videoIdeas: string): Promise<string> {
  const systemInstruction =
    "You are a visual director. Create concise English video prompts for AI video generation. Return ONLY the prompt text.";
  const model = getTextModel(AI_MODELS.text.lite, systemInstruction);

  if (!model) {
    return "A dynamic, cinematic scene showcasing modern technology and AI tools with professional lighting";
  }

  try {
    const result = await withRetry(() =>
      model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Based on the following video ideas, create a single concise English video prompt (1-2 sentences) for AI video generation. The prompt should describe the visual scene for the first 8 seconds of the video. Focus on cinematic, dynamic visuals.

Video Ideas:
${videoIdeas.substring(0, 2000)}`,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 256 },
      }),
    );

    const text = result.response.text().trim();
    return (
      text ||
      "A dynamic, cinematic scene showcasing modern technology and AI tools"
    );
  } catch {
    return "A dynamic, cinematic scene showcasing modern technology and AI tools with professional lighting";
  }
}

/**
 * Create a placeholder video result when Veo API is not available
 */
function createPlaceholderVideo(
  prompt: string,
  duration: number,
): VideoGenerationResult {
  return {
    url: "",
    duration,
    prompt,
  };
}
