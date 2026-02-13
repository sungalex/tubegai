// =============================================================================
// Google Cloud Text-to-Speech Service
// =============================================================================
// Server-side TTS service for generating voiceover narration

import type { TrendTubeVoiceOption } from "~/common/types/trendtube.types";

// Voice mapping for Google Cloud TTS API
const VOICE_MAP: Record<
  TrendTubeVoiceOption,
  { languageCode: string; name: string }
> = {
  male_ko: { languageCode: "ko-KR", name: "ko-KR-Standard-C" },
  female_ko: { languageCode: "ko-KR", name: "ko-KR-Standard-A" },
  male_en: { languageCode: "en-US", name: "en-US-Standard-B" },
  female_en: { languageCode: "en-US", name: "en-US-Standard-C" },
};

export interface VoiceoverResult {
  audioBase64: string;
  mimeType: string;
  estimatedDuration: number;
}

/**
 * Generate voiceover audio from narration script using Google Cloud TTS API
 */
export async function generateVoiceover(
  script: string,
  voiceOption: TrendTubeVoiceOption = "female_ko",
  options?: { targetDuration?: number },
): Promise<VoiceoverResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
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

  const voice = VOICE_MAP[voiceOption];

  const requestBody = {
    input: { text: truncated },
    voice: {
      languageCode: voice.languageCode,
      name: voice.name,
      ssmlGender: voiceOption.startsWith("male") ? "MALE" : "FEMALE",
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: 1.0,
      pitch: 0,
    },
  };

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("TTS API error:", errorText);
    return createPlaceholderVoiceover(script);
  }

  const data = (await response.json()) as { audioContent: string };

  // Estimate duration: ~150 words per minute for Korean, ~160 for English
  const wordCount = truncated.split(/\s+/).length;
  const isKorean = voiceOption.endsWith("_ko");
  const charCount = truncated.length;
  const estimatedDuration = isKorean
    ? Math.ceil(charCount / 5) // Korean: ~5 chars per second
    : Math.ceil((wordCount / 160) * 60); // English: ~160 wpm

  return {
    audioBase64: data.audioContent,
    mimeType: "audio/mp3",
    estimatedDuration,
  };
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
    mimeType: "audio/mp3",
    estimatedDuration,
  };
}
