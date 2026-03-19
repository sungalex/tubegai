// =============================================================================
// Gemini TTS Service (via @google/genai SDK)
// =============================================================================
// Server-side TTS service for generating voiceover narration using Gemini TTS

import type { TrendTubeVoiceOption } from "~/common/types/trendtube.types";
import { getClient } from "./client.server";
import { AI_MODELS } from "./models.server";
import { withRetry } from "./retry.server";

// Voice mapping for Gemini TTS prebuilt voices
const VOICE_MAP: Record<TrendTubeVoiceOption, { voiceName: string }> = {
  male_ko: { voiceName: "Charon" },
  female_ko: { voiceName: "Kore" },
  male_en: { voiceName: "Puck" },
  female_en: { voiceName: "Sulafat" },
};

// PCM output format constants (Gemini TTS outputs raw PCM 24kHz mono 16-bit)
const TTS_SAMPLE_RATE = 24000;
const TTS_NUM_CHANNELS = 1;
const TTS_BITS_PER_SAMPLE = 16;

export interface VoiceoverResult {
  audioBase64: string;
  mimeType: string;
  estimatedDuration: number;
}

/**
 * Build a WAV file buffer from raw PCM base64 data.
 * Gemini TTS returns PCM 24kHz mono 16-bit; this wraps it in a WAV header.
 */
function buildTtsWavBuffer(pcmBase64: string): Buffer {
  const pcmBuffer = Buffer.from(pcmBase64, "base64");
  const dataSize = pcmBuffer.length;
  const headerSize = 44;
  const buffer = Buffer.alloc(headerSize + dataSize);

  const byteRate =
    TTS_SAMPLE_RATE * TTS_NUM_CHANNELS * (TTS_BITS_PER_SAMPLE / 8);
  const blockAlign = TTS_NUM_CHANNELS * (TTS_BITS_PER_SAMPLE / 8);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  // fmt chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(TTS_NUM_CHANNELS, 22);
  buffer.writeUInt32LE(TTS_SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(TTS_BITS_PER_SAMPLE, 34);
  // data chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcmBuffer.copy(buffer, headerSize);

  return buffer;
}

/**
 * Generate voiceover audio from narration script using Gemini TTS
 */
export async function generateVoiceover(
  script: string,
  voiceOption: TrendTubeVoiceOption = "female_ko",
  options?: { targetDuration?: number },
): Promise<VoiceoverResult> {
  const ai = getClient();

  if (!ai) {
    console.warn("GEMINI_API_KEY not set, returning placeholder");
    return createPlaceholderVoiceover(script);
  }

  // Clean script: remove stage directions like [열정적으로], timing markers, etc.
  let cleanedScript = script
    .replace(/\[.*?\]/g, "")
    .replace(/\*\*.*?\*\*/g, "")
    .replace(/#{1,3}\s/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // If target duration specified, truncate script to match
  if (options?.targetDuration) {
    const isKorean = voiceOption.endsWith("_ko");
    // Korean: ~5 chars/sec, English: ~15 chars/sec (~2.5 words/sec)
    const targetChars = isKorean
      ? options.targetDuration * 5
      : options.targetDuration * 15;
    cleanedScript = cleanedScript.substring(0, targetChars);
  }

  // Truncate to TTS limit (5000 bytes for standard voices)
  const truncated = cleanedScript.substring(0, 4500);

  try {
    const response = await withRetry(
      () =>
        ai.models.generateContent({
          model: AI_MODELS.tts.primary,
          contents: truncated,
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: VOICE_MAP[voiceOption].voiceName,
                },
              },
            },
          },
        }),
      { maxRetries: 2, baseDelay: 1000 },
    );

    const audioPart = response.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData?.mimeType?.startsWith("audio/"),
    );
    const audioBase64 = audioPart?.inlineData?.data;

    if (!audioBase64) {
      console.error("TTS response did not contain audio data");
      return createPlaceholderVoiceover(script);
    }

    // Convert raw PCM to WAV, then encode as base64
    const wavBuffer = buildTtsWavBuffer(audioBase64);
    const wavBase64 = wavBuffer.toString("base64");

    // Estimate duration: ~5 chars/sec for Korean, ~160 wpm for English
    const wordCount = truncated.split(/\s+/).length;
    const isKorean = voiceOption.endsWith("_ko");
    const charCount = truncated.length;
    const estimatedDuration = isKorean
      ? Math.ceil(charCount / 5) // Korean: ~5 chars per second
      : Math.ceil((wordCount / 160) * 60); // English: ~160 wpm

    return {
      audioBase64: wavBase64,
      mimeType: "audio/wav",
      estimatedDuration,
    };
  } catch (error) {
    console.error("TTS API error after retries:", error);
    return createPlaceholderVoiceover(script);
  }
}

/**
 * Create a placeholder voiceover result when TTS API is not available
 */
function createPlaceholderVoiceover(script: string): VoiceoverResult {
  const charCount = script
    .replace(/\[.*?\]/g, "")
    .replace(/\*\*.*?\*\*/g, "").length;
  const estimatedDuration = Math.ceil(charCount / 5);

  return {
    audioBase64: "",
    mimeType: "audio/wav",
    estimatedDuration,
  };
}
