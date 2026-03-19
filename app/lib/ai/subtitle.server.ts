// =============================================================================
// AI Subtitle Generation Service (Google Gemini API)
// =============================================================================
// Generates timed subtitle segments from script content and storyboard scenes

import { getClient } from "./client.server";
import { withRetry } from "./retry.server";
import { AI_MODELS } from "./models.server";
import { MOCK_SUBTITLES } from "./__mocks__/fixtures";

// =============================================================================
// Types
// =============================================================================

export interface GenerateSubtitlesInput {
  segments: Array<{
    id: string;
    type: string;
    content: string;
    duration: number;
    emotionalTone?: string;
  }>;
  scenes: Array<{
    scriptSegmentId: string;
    sceneNumber: number;
    description: string;
    duration: number;
  }>;
  language?: "ko" | "en";
}

export interface GeneratedSubtitle {
  scriptSegmentId: string;
  startTime: number;
  endTime: number;
  text: string;
}

// =============================================================================
// Prompts
// =============================================================================

const SYSTEM_PROMPT_KO = `당신은 영상 자막 전문가입니다. 영상 대본(스크립트)을 자막용 텍스트로 분할합니다.

## 규칙
1. 각 자막은 한 줄에 20~40자 이내 (한국어 기준)
2. 자막 표시 시간은 2~5초
3. 문장의 자연스러운 끊김 지점에서 분할 (의미 단위)
4. 각 스크립트 세그먼트의 duration을 기준으로 누적 시작 시간 계산
5. 씬 전환 지점에서는 반드시 자막 경계를 설정
6. 말하기 속도: 한국어 기준 약 분당 300자

## 출력 형식
JSON 배열로 반환:
[
  {
    "scriptSegmentId": "세그먼트 ID",
    "startTime": 0.0,
    "endTime": 3.5,
    "text": "자막 텍스트"
  }
]

## 주의사항
- startTime/endTime은 영상 전체 기준 절대 시간 (초 단위, 소수점 1자리)
- 자막 간 간격은 0.1~0.3초
- 감정적 강조가 필요한 부분은 더 짧은 자막으로 분할하여 임팩트 부여`;

const SYSTEM_PROMPT_EN = `You are a professional video subtitle specialist. You split video scripts into subtitle segments.

## Rules
1. Each subtitle should be 40-60 characters per line (English)
2. Subtitle display time: 2-5 seconds
3. Split at natural pause points (semantic boundaries)
4. Calculate cumulative start times based on each script segment's duration
5. Always set subtitle boundaries at scene transition points
6. Speech rate: approximately 150 words per minute (English)

## Output Format
Return as JSON array:
[
  {
    "scriptSegmentId": "segment ID",
    "startTime": 0.0,
    "endTime": 3.5,
    "text": "Subtitle text"
  }
]

## Notes
- startTime/endTime are absolute times in seconds (1 decimal place)
- Gap between subtitles: 0.1-0.3 seconds
- Emotionally impactful parts should use shorter subtitles for emphasis`;

// =============================================================================
// Main Generation Function
// =============================================================================

export async function generateSubtitles(
  input: GenerateSubtitlesInput
): Promise<GeneratedSubtitle[]> {
  const { segments, scenes, language = "ko" } = input;

  if (process.env.GEMINI_MOCK === "true") {
    // Map mock subtitles to use actual segment IDs if available
    if (segments.length > 0) {
      return buildMockSubtitles(segments);
    }
    return MOCK_SUBTITLES;
  }

  const ai = getClient();
  if (!ai) {
    console.warn("GEMINI_API_KEY not set, returning mock subtitles");
    return buildMockSubtitles(segments);
  }

  const systemPrompt =
    language === "ko" ? SYSTEM_PROMPT_KO : SYSTEM_PROMPT_EN;
  const userPrompt = buildUserPrompt(segments, scenes, language);

  try {
    const response = await withRetry(() =>
      ai.models.generateContent({
        model: AI_MODELS.text.lite,
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.3,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      })
    );

    const text = response.text;

    if (!text) {
      console.error("No text content in Gemini subtitle response");
      return buildMockSubtitles(segments);
    }

    return parseSubtitleResponse(text, segments);
  } catch (error) {
    console.error(
      "Failed to generate subtitles:",
      error instanceof Error ? error.message : error
    );
    return buildMockSubtitles(segments);
  }
}

// =============================================================================
// Prompt Builder
// =============================================================================

function buildUserPrompt(
  segments: GenerateSubtitlesInput["segments"],
  scenes: GenerateSubtitlesInput["scenes"],
  language: string
): string {
  // Calculate cumulative start times
  let cumulativeTime = 0;
  const segmentTimings = segments.map((seg) => {
    const start = cumulativeTime;
    cumulativeTime += seg.duration;
    return {
      ...seg,
      segmentStartTime: start,
      segmentEndTime: cumulativeTime,
    };
  });

  const segmentInfo = segmentTimings
    .map(
      (seg) =>
        `[세그먼트: ${seg.id}]
타입: ${seg.type}
시간: ${seg.segmentStartTime.toFixed(1)}초 ~ ${seg.segmentEndTime.toFixed(1)}초 (${seg.duration}초)
감정톤: ${seg.emotionalTone ?? "neutral"}
내용:
${seg.content}`
    )
    .join("\n\n");

  const sceneInfo =
    scenes.length > 0
      ? scenes
          .map(
            (scene) =>
              `씬 ${scene.sceneNumber}: ${scene.description} (${scene.duration}초, 세그먼트: ${scene.scriptSegmentId})`
          )
          .join("\n")
      : "씬 정보 없음";

  if (language === "ko") {
    return `다음 영상 대본을 자막으로 분할해주세요.

## 스크립트 세그먼트
${segmentInfo}

## 스토리보드 씬 정보
${sceneInfo}

총 영상 길이: ${cumulativeTime.toFixed(1)}초

위 대본을 자막 단위로 분할하여 JSON 배열로 반환해주세요.`;
  }

  return `Please split the following video script into subtitle segments.

## Script Segments
${segmentInfo}

## Storyboard Scene Information
${sceneInfo}

Total video length: ${cumulativeTime.toFixed(1)} seconds

Split the script into subtitle units and return as a JSON array.`;
}

// =============================================================================
// Response Parser
// =============================================================================

function parseSubtitleResponse(
  text: string,
  segments: GenerateSubtitlesInput["segments"]
): GeneratedSubtitle[] {
  try {
    const parsed = JSON.parse(text);
    const arr = Array.isArray(parsed) ? parsed : parsed.subtitles ?? [];

    const validSegmentIds = new Set(segments.map((s) => s.id));

    return arr
      .filter(
        (item: Record<string, unknown>) =>
          typeof item.startTime === "number" &&
          typeof item.endTime === "number" &&
          typeof item.text === "string" &&
          item.text.trim().length > 0
      )
      .map((item: Record<string, unknown>) => ({
        scriptSegmentId: validSegmentIds.has(item.scriptSegmentId as string)
          ? (item.scriptSegmentId as string)
          : segments[0]?.id ?? "",
        startTime: Math.round((item.startTime as number) * 10) / 10,
        endTime: Math.round((item.endTime as number) * 10) / 10,
        text: (item.text as string).trim(),
      }));
  } catch (error) {
    console.error("Failed to parse subtitle response:", error);
    return buildMockSubtitles(segments);
  }
}

// =============================================================================
// Mock Subtitle Builder (fallback)
// =============================================================================

function buildMockSubtitles(
  segments: GenerateSubtitlesInput["segments"]
): GeneratedSubtitle[] {
  const subtitles: GeneratedSubtitle[] = [];
  let currentTime = 0;

  for (const seg of segments) {
    // Split content into ~30 character chunks at sentence boundaries
    const sentences = seg.content
      .replace(/([.!?。！？])\s*/g, "$1|")
      .split("|")
      .filter((s) => s.trim().length > 0);

    const timePerSentence = seg.duration / Math.max(sentences.length, 1);

    for (const sentence of sentences) {
      // Further split long sentences
      const chunks = splitIntoChunks(sentence.trim(), 40);
      const chunkDuration = timePerSentence / chunks.length;

      for (const chunk of chunks) {
        const startTime = Math.round(currentTime * 10) / 10;
        const endTime =
          Math.round((currentTime + chunkDuration - 0.1) * 10) / 10;
        subtitles.push({
          scriptSegmentId: seg.id,
          startTime,
          endTime: Math.max(endTime, startTime + 1),
          text: chunk,
        });
        currentTime += chunkDuration;
      }
    }
  }

  return subtitles;
}

function splitIntoChunks(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > maxLength) {
    // Find a good break point
    let breakIndex = remaining.lastIndexOf(" ", maxLength);
    if (breakIndex === -1 || breakIndex < maxLength / 2) {
      breakIndex = remaining.lastIndexOf(",", maxLength);
    }
    if (breakIndex === -1 || breakIndex < maxLength / 2) {
      breakIndex = maxLength;
    }
    chunks.push(remaining.slice(0, breakIndex).trim());
    remaining = remaining.slice(breakIndex).trim();
  }

  if (remaining.length > 0) {
    chunks.push(remaining);
  }

  return chunks;
}
