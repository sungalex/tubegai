// =============================================================================
// Lyria RealTime Music Generation Service
// =============================================================================
// Server-side AI service for generating background music
// Uses Gemini API with lyria-realtime-exp model (WebSocket streaming)

import type { GoogleGenAI, LiveMusicServerMessage } from "@google/genai";
import { getClient, getAlphaClient } from "./client.server";
import { withRetry } from "./retry.server";
import { MOCK_MUSIC_RESULT } from "./__mocks__/fixtures";
import { AI_MODELS } from "./models.server";

// =============================================================================
// Types
// =============================================================================

export interface MusicGenerationResult {
  url: string;
  duration: number;
  prompt: string;
  genre: string;
}

// =============================================================================
// Lyria RealTime Client
// =============================================================================

const SAMPLE_RATE = 48000;
const NUM_CHANNELS = 2;
const BITS_PER_SAMPLE = 16;

// =============================================================================
// WAV Builder (no external dependency)
// =============================================================================

function buildWavBuffer(pcmData: Int16Array): Buffer {
  const dataSize = pcmData.length * 2; // 16-bit = 2 bytes per sample
  const headerSize = 44;
  const buffer = Buffer.alloc(headerSize + dataSize);

  const byteRate = SAMPLE_RATE * NUM_CHANNELS * (BITS_PER_SAMPLE / 8);
  const blockAlign = NUM_CHANNELS * (BITS_PER_SAMPLE / 8);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  // fmt chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(NUM_CHANNELS, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(BITS_PER_SAMPLE, 34);

  // data chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  // PCM data
  const pcmBuffer = Buffer.from(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength);
  pcmBuffer.copy(buffer, headerSize);

  return buffer;
}

// =============================================================================
// Music Generation via Lyria RealTime
// =============================================================================

/**
 * Generate background music from video ideas using Lyria RealTime API
 */
export async function generateMusic(
  videoIdeas: string,
  options?: { durationSeconds?: number }
): Promise<MusicGenerationResult> {
  if (process.env.GEMINI_MOCK === "true") {
    return MOCK_MUSIC_RESULT;
  }

  const targetDuration = options?.durationSeconds ?? 8;

  // Step 1: Generate music prompt and genre from ideas
  const { prompt: musicPrompt, genre } = await generateMusicPrompt(videoIdeas);

  // Step 2: Generate music via Lyria RealTime
  const client = getAlphaClient();
  if (!client) {
    console.warn("GEMINI_API_KEY not set, returning placeholder music");
    return createPlaceholderMusic(musicPrompt, genre, targetDuration);
  }

  try {
    const pcmData = await streamMusicChunks(client, musicPrompt, targetDuration, genre);

    if (pcmData.length === 0) {
      console.warn("Lyria RealTime: no audio data received");
      return createPlaceholderMusic(musicPrompt, genre, targetDuration);
    }

    const wavBuffer = buildWavBuffer(pcmData);
    const audioUrl = `data:audio/wav;base64,${wavBuffer.toString("base64")}`;

    return {
      url: audioUrl,
      duration: targetDuration,
      prompt: musicPrompt,
      genre,
    };
  } catch (error) {
    console.error("Lyria RealTime generation error:", error);
    return createPlaceholderMusic(musicPrompt, genre, targetDuration);
  }
}

/**
 * Stream music chunks from Lyria RealTime for a fixed duration
 */
async function streamMusicChunks(
  client: GoogleGenAI,
  prompt: string,
  durationSeconds: number,
  genre: string,
): Promise<Int16Array> {
  return new Promise((resolve, reject) => {
    const audioChunks: Int16Array[] = [];
    let resolved = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = (data: Int16Array) => {
      if (resolved) return;
      resolved = true;
      if (timer) clearTimeout(timer);
      resolve(data);
    };

    client.live.music
      .connect({
        model: AI_MODELS.music.primary,
        callbacks: {
          onmessage: (message: LiveMusicServerMessage) => {
            // Handle filtered prompts
            if (message.filteredPrompt) {
              console.warn("Lyria RealTime: prompt filtered:", message.filteredPrompt);
              return;
            }

            // Collect audio chunks via getter
            const chunk = message.audioChunk;
            if (chunk?.data) {
              const buf = Buffer.from(chunk.data, "base64");
              const int16 = new Int16Array(
                buf.buffer,
                buf.byteOffset,
                buf.length / Int16Array.BYTES_PER_ELEMENT,
              );
              audioChunks.push(int16);
            }
          },
          onerror: (event: ErrorEvent) => {
            console.error("Lyria RealTime error:", event.message);
            if (!resolved) {
              resolved = true;
              if (timer) clearTimeout(timer);
              reject(new Error(event.message || "Lyria RealTime WebSocket error"));
            }
          },
          onclose: () => {
            const combined = combineInt16Arrays(audioChunks);
            cleanup(combined);
          },
        },
      })
      .then(async (session) => {
        // Set music prompt
        await session.setWeightedPrompts({
          weightedPrompts: [{ text: prompt, weight: 1.0 }],
        });

        // Set generation config
        const bpm = genreToBpm(genre);
        await session.setMusicGenerationConfig({
          musicGenerationConfig: {
            bpm,
            temperature: 1.1,
            guidance: 4.0,
          },
        });

        // Start playback
        await session.play();

        // Stop after target duration
        timer = setTimeout(async () => {
          try {
            await session.close();
          } catch {
            // Session may already be closed
          }
          const combined = combineInt16Arrays(audioChunks);
          cleanup(combined);
        }, durationSeconds * 1000 + 500); // +500ms buffer for final chunks
      })
      .catch((err) => {
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      });
  });
}

function combineInt16Arrays(arrays: Int16Array[]): Int16Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Int16Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

function genreToBpm(genre: string): number {
  switch (genre.toLowerCase()) {
    case "ambient":
      return 70;
    case "acoustic":
      return 90;
    case "orchestral":
      return 85;
    case "hiphop":
      return 95;
    case "electronic":
    default:
      return 120;
  }
}

// =============================================================================
// Music Prompt Generation (via Gemini)
// =============================================================================

/**
 * Generate a music prompt and genre from video ideas using Gemini
 */
async function generateMusicPrompt(
  videoIdeas: string,
): Promise<{ prompt: string; genre: string }> {
  if (!getClient()) {
    return {
      prompt: "Upbeat electronic background music for technology content",
      genre: "electronic",
    };
  }

  try {
    const systemInstruction =
      "You are a music director. Suggest background music for videos. Return ONLY valid JSON with 'prompt' and 'genre' fields.";
    const ai = getClient()!;

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: AI_MODELS.text.lite,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Based on these video ideas, suggest background music.
Return a JSON object with "prompt" (English music description for AI generation, 1 sentence) and "genre" (one word: electronic, acoustic, orchestral, ambient, or hiphop).

Video Ideas:
${videoIdeas.substring(0, 1000)}`,
              },
            ],
          },
        ],
        config: {
          systemInstruction,
          temperature: 0.5,
          maxOutputTokens: 256,
          responseMimeType: "application/json",
        },
      }),
    );

    const text = (response.text?.trim() ?? "");
    const parsed = JSON.parse(text) as { prompt: string; genre: string };
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

// =============================================================================
// Placeholder
// =============================================================================

function createPlaceholderMusic(
  prompt: string,
  genre: string,
  duration: number,
): MusicGenerationResult {
  return {
    url: "",
    duration,
    prompt,
    genre,
  };
}
