// =============================================================================
// Veo 3 Video Generation Service
// =============================================================================
// Server-side AI service for generating 8-second videos from video ideas
// Uses @google/genai SDK with veo-3.1-generate-001 model

import { GoogleGenAI } from "@google/genai";
import { getTextModel } from "./gemini-client.server";
import { withRetry } from "./gemini-retry.server";
import { MOCK_VIDEO_RESULT } from "./__mocks__/ai-fixtures";

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;

const genaiClient = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface VideoGenerationResult {
  url: string;
  duration: number;
  prompt: string;
}

/**
 * Generate an 8-second video from video ideas using Veo 3 API
 */
export async function generateVideo(
  videoIdeas: string,
  options?: { durationSeconds?: number; aspectRatio?: string },
): Promise<VideoGenerationResult> {
  if (process.env.GEMINI_MOCK === "true") {
    return MOCK_VIDEO_RESULT;
  }

  const targetDuration = options?.durationSeconds ?? 8;

  // Step 1: Generate video prompt from ideas using Gemini
  const videoPrompt = await generateVideoPrompt(videoIdeas);

  // Step 2: Call Veo 3 API
  if (!genaiClient) {
    console.warn("GOOGLE_GENAI_API_KEY not set, returning placeholder video");
    return createPlaceholderVideo(videoPrompt, targetDuration);
  }

  try {
    let operation = await genaiClient.models.generateVideos({
      model: "veo-3.1-generate-001",
      prompt: videoPrompt,
      config: {
        aspectRatio: (options?.aspectRatio as "16:9" | "9:16") ?? "16:9",
        numberOfVideos: 1,
      },
    });

    // Poll until complete (max 3 minutes)
    const maxAttempts = 18;
    let attempts = 0;
    while (!operation.done && attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 10000));
      operation = await genaiClient.operations.getVideosOperation({
        operation,
      });
      attempts++;
    }

    if (!operation.done) {
      console.error("Veo 3: Video generation timed out after 3 minutes");
      return createPlaceholderVideo(videoPrompt, targetDuration);
    }

    // Extract video from response
    const generatedVideos = operation.response?.generatedVideos;
    if (!generatedVideos || generatedVideos.length === 0) {
      console.error("Veo 3: No videos in response");
      return createPlaceholderVideo(videoPrompt, targetDuration);
    }

    const video = generatedVideos[0].video;
    if (!video?.uri) {
      console.error("Veo 3: No video URI in response");
      return createPlaceholderVideo(videoPrompt, targetDuration);
    }

    return {
      url: video.uri,
      duration: targetDuration,
      prompt: videoPrompt,
    };
  } catch (error) {
    console.error("Veo 3 generation error:", error);
    return createPlaceholderVideo(videoPrompt, targetDuration);
  }
}

/**
 * Generate a video prompt from video ideas using Gemini
 */
async function generateVideoPrompt(videoIdeas: string): Promise<string> {
  const systemInstruction = "You are a visual director. Create concise English video prompts for AI video generation. Return ONLY the prompt text.";
  const model = getTextModel("gemini-2.5-flash-lite", systemInstruction);

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
