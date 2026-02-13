// =============================================================================
// Lyria 2 Music Generation Service
// =============================================================================
// Server-side AI service for generating 8-second background music
// Uses Vertex AI REST endpoint with lyria-002 model

import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const VERTEX_PROJECT = process.env.GOOGLE_CLOUD_PROJECT_ID;
const VERTEX_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";

export interface MusicGenerationResult {
  url: string;
  duration: number;
  prompt: string;
  genre: string;
}

/**
 * Generate 8-second background music from video ideas using Lyria 2 API
 */
export async function generateMusic(
  videoIdeas: string,
  options?: { durationSeconds?: number }
): Promise<MusicGenerationResult> {
  const targetDuration = options?.durationSeconds ?? 8;

  // Step 1: Generate music prompt and genre from ideas
  const { prompt: musicPrompt, genre } = await generateMusicPrompt(videoIdeas);

  // Step 2: Call Lyria 2 API via Vertex AI
  if (!VERTEX_PROJECT) {
    console.warn("GOOGLE_CLOUD_PROJECT_ID not set, returning placeholder music");
    return createPlaceholderMusic(musicPrompt, genre, targetDuration);
  }

  try {
    // Get access token via Application Default Credentials
    const accessToken = await getAccessToken();
    if (!accessToken) {
      console.warn("Could not obtain access token for Vertex AI");
      return createPlaceholderMusic(musicPrompt, genre, targetDuration);
    }

    const endpoint = `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${VERTEX_PROJECT}/locations/${VERTEX_LOCATION}/publishers/google/models/lyria-002:predict`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instances: [{ prompt: musicPrompt }],
        parameters: { sampleCount: 1 },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lyria 2 API error:", errorText);
      return createPlaceholderMusic(musicPrompt, genre, targetDuration);
    }

    const data = (await response.json()) as {
      predictions?: Array<{ audioContent?: string }>;
    };

    const audioContent = data.predictions?.[0]?.audioContent;
    if (!audioContent) {
      console.error("Lyria 2: No audio content in response");
      return createPlaceholderMusic(musicPrompt, genre, targetDuration);
    }

    const audioUrl = `data:audio/wav;base64,${audioContent}`;

    return {
      url: audioUrl,
      duration: targetDuration,
      prompt: musicPrompt,
      genre,
    };
  } catch (error) {
    console.error("Lyria 2 generation error:", error);
    return createPlaceholderMusic(musicPrompt, genre, targetDuration);
  }
}

/**
 * Generate a music prompt and genre from video ideas using Gemini
 */
async function generateMusicPrompt(
  videoIdeas: string
): Promise<{ prompt: string; genre: string }> {
  if (!geminiClient) {
    return {
      prompt: "Upbeat electronic background music for technology content",
      genre: "electronic",
    };
  }

  try {
    const model = geminiClient.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Based on these video ideas, suggest background music.
Return ONLY a JSON object with "prompt" (English music description for AI generation, 1 sentence) and "genre" (one word: electronic, acoustic, orchestral, ambient, or hiphop).

Video Ideas:
${videoIdeas.substring(0, 1000)}

Return ONLY valid JSON. No code blocks.`,
            },
          ],
        },
      ],
      generationConfig: { temperature: 0.5, maxOutputTokens: 256 },
    });

    const text = result.response.text().trim();
    const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned) as { prompt: string; genre: string };
    return {
      prompt: parsed.prompt || "Upbeat electronic background music",
      genre: parsed.genre || "electronic",
    };
  } catch {
    return {
      prompt: "Upbeat electronic background music for technology content",
      genre: "electronic",
    };
  }
}

/**
 * Get access token for Vertex AI via Application Default Credentials
 */
async function getAccessToken(): Promise<string | null> {
  try {
    // Try metadata server (Cloud Run, GCE, etc.)
    const response = await fetch(
      "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
      { headers: { "Metadata-Flavor": "Google" } }
    );
    if (response.ok) {
      const data = (await response.json()) as { access_token: string };
      return data.access_token;
    }
  } catch {
    // Not running on GCP
  }

  // Fallback: try gcloud CLI (development)
  try {
    const { execSync } = await import("child_process");
    const token = execSync("gcloud auth print-access-token", {
      encoding: "utf-8",
      timeout: 5000,
    }).trim();
    return token || null;
  } catch {
    return null;
  }
}

/**
 * Create a placeholder music result when Lyria API is not available
 */
function createPlaceholderMusic(
  prompt: string,
  genre: string,
  duration: number
): MusicGenerationResult {
  return {
    url: "",
    duration,
    prompt,
    genre,
  };
}
