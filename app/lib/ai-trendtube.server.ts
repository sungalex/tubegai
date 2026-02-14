// =============================================================================
// TrendTube AI Pipeline Service (Google Gemini API)
// =============================================================================
// Server-side AI pipeline for TrendTube: trend extraction, idea generation,
// and narration script writing (8-second format).

import { getGeminiClient, getTextModel } from "./gemini-client.server";
import { withRetry } from "./gemini-retry.server";
import {
  MOCK_EXTRACTED_TRENDS,
  MOCK_VIDEO_IDEAS,
  MOCK_NARRATION_SCRIPT,
} from "./__mocks__/ai-fixtures";

// =============================================================================
// Step 1: Extract YouTube Trends
// =============================================================================

export async function extractYouTubeTrends(
  url: string,
  userIdea?: string
): Promise<string> {
  if (process.env.GEMINI_MOCK === "true") {
    return MOCK_EXTRACTED_TRENDS;
  }

  if (!getGeminiClient()) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다");
  }

  const systemInstruction = "당신은 YouTube 트렌드 분석 전문가입니다. 트렌드를 분석하고 구조화된 한국어 텍스트로 결과를 작성합니다.";
  const model = getTextModel("gemini-2.5-flash", systemInstruction)!;

  const prompt = `사용자가 제공한 YouTube 트렌드 URL: ${url}

${userIdea ? `사용자의 영상 아이디어: ${userIdea}` : ""}

이 URL은 YouTube 인기 급상승 또는 트렌드 페이지를 가리킵니다.
해당 URL의 트렌드 콘텐츠를 분석하여 다음을 추출해주세요:

1. **인기 주제 5개**: 현재 가장 인기 있는 주제/카테고리
2. **키워드 트렌드**: 자주 등장하는 키워드 10개
3. **콘텐츠 패턴**: 인기 영상들의 공통 패턴 (제목 스타일, 길이, 포맷)
4. **시청자 관심사**: 시청자들이 관심을 보이는 주요 관심사
5. **바이럴 요소**: 높은 조회수를 기록한 영상들의 공통 바이럴 요소

${userIdea ? `특히 "${userIdea}"와 관련된 트렌드에 집중하여 분석해주세요.` : ""}

결과를 구조화된 한국어 텍스트로 작성해주세요.`;

  const result = await withRetry(() =>
    model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    }),
  );

  const text = result.response.text();
  if (!text) throw new Error("트렌드 추출 응답이 비어있습니다");
  return text;
}

// =============================================================================
// Step 2: Generate Video Ideas
// =============================================================================

export async function generateVideoIdeas(
  extractedTrends: string,
  referenceImageDescription?: string
): Promise<string> {
  if (process.env.GEMINI_MOCK === "true") {
    return MOCK_VIDEO_IDEAS;
  }

  if (!getGeminiClient()) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다");
  }

  const systemInstruction = "당신은 바이럴 YouTube 콘텐츠 기획 전문가입니다. 트렌드를 바탕으로 바이럴 영상 아이디어를 생성합니다.";
  const model = getTextModel("gemini-2.5-flash", systemInstruction)!;

  const prompt = `## 분석된 트렌드:
${extractedTrends}

${referenceImageDescription ? `## 참고 이미지 설명:\n${referenceImageDescription}` : ""}

위 트렌드 분석을 바탕으로 **3개의 바이럴 영상 아이디어**를 생성해주세요.

각 아이디어에 다음을 포함해주세요:
1. **영상 제목**: 클릭을 유도하는 매력적인 제목
2. **영상 컨셉**: 영상의 전체 컨셉과 스토리라인 (3-5문장)
3. **오프닝 훅**: 시청자를 끌어들이는 첫 5초 대사/장면
4. **핵심 장면 구성**: 3-5개의 주요 장면 설명
5. **비주얼 스타일**: 영상의 시각적 톤과 분위기
6. **타겟 시청자**: 주요 타겟 층
7. **예상 영상 길이**: 추천 길이

가장 바이럴될 가능성이 높은 순서로 정렬해주세요.
결과를 구조화된 한국어 텍스트로 작성해주세요.`;

  const result = await withRetry(() =>
    model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 6144 },
    }),
  );

  const text = result.response.text();
  if (!text) throw new Error("영상 아이디어 생성 응답이 비어있습니다");
  return text;
}

// =============================================================================
// Step 5: Generate Narration Script (8-second format)
// =============================================================================

export async function generateNarrationScript(
  videoIdeas: string
): Promise<string> {
  if (process.env.GEMINI_MOCK === "true") {
    return MOCK_NARRATION_SCRIPT;
  }

  if (!getGeminiClient()) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다");
  }

  const systemInstruction = "당신은 프로페셔널 YouTube 나레이션 작가입니다. 영상 오프닝 나레이션을 작성합니다.";
  const model = getTextModel("gemini-2.5-flash-lite", systemInstruction)!;

  const prompt = `## 영상 아이디어:
${videoIdeas}

위 아이디어 중 첫 번째 아이디어를 기반으로 **8초 분량의 오프닝 나레이션**을 작성해주세요.

### 스크립트 요구사항:
- **총 길이**: 정확히 8초 분량 (한국어 약 40자, 영어 약 20단어)
- **목적**: 영상 첫 8초의 강력한 오프닝 훅
- **스타일**: 시청자를 즉시 끌어들이는 질문이나 놀라운 사실
- 자연스러운 구어체 사용
- 보이스오버에 최적화된 짧은 문장
- 감정 표현 지시 포함 (예: [열정적으로], [차분하게])

### 예시:
[열정적으로] "AI가 당신의 월급을 대체할 수 있다면, 어떻게 하시겠습니까?"

한국어로 작성해주세요. 스크립트 텍스트만 반환하세요.`;

  const result = await withRetry(() =>
    model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    }),
  );

  const text = result.response.text();
  if (!text) throw new Error("나레이션 스크립트 생성 응답이 비어있습니다");
  return text;
}
