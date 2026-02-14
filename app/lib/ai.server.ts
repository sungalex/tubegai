// =============================================================================
// AI Service (Google Gemini API Integration)
// =============================================================================
// Server-side AI service for generating YouTube content ideas

import type { TrendItem } from "~/common/types/project.types";
import { getGeminiClient, getTextModel } from "./gemini-client.server";
import { withRetry } from "./gemini-retry.server";
import { MOCK_RECOMMENDATIONS } from "./__mocks__/ai-fixtures";

// =============================================================================
// Types
// =============================================================================

export interface AIGeneratedRecommendation {
  title: string;
  reason: string;
  description: string;
  hooks: string[];
  targetAudience: string;
  estimatedViews: string;
  difficulty: "easy" | "medium" | "hard";
  videoType: "short" | "medium" | "long";
  contentTone: string;
  growthRate: string;
  score: number;
  basedOnTrends: string[];
}

export interface GenerateRecommendationsInput {
  trends: TrendItem[];
  userPreferences?: {
    preferredCategories?: string[];
    channelDescription?: string;
    targetAudienceType?: string;
  };
  count?: number;
  language?: "ko" | "en";
}

// =============================================================================
// Prompts
// =============================================================================

const SYSTEM_PROMPT_KO = `당신은 유튜브 콘텐츠 전략 전문가입니다. 현재 트렌드를 분석하고 유튜버에게 매력적인 콘텐츠 아이디어를 추천합니다.

각 추천은 다음 필드를 포함해야 합니다:
- title: 매력적인 영상 제목 (클릭을 유도하는 제목)
- reason: 추천 이유 (왜 이 주제가 좋은지, 10-20자)
- description: 영상 컨셉 설명 (50-100자)
- hooks: 오프닝 훅 아이디어 3개 (배열)
- targetAudience: 타겟 시청자 (예: "IT 취준생", "20대 직장인")
- estimatedViews: 예상 조회수 범위 (예: "50K-100K", "100K-300K")
- difficulty: 제작 난이도 ("easy", "medium", "hard")
- videoType: 영상 길이 타입 ("short": 60초 이하, "medium": 2-10분, "long": 10분+)
- contentTone: 콘텐츠 톤 ("informative", "funny", "dramatic", "casual", "professional")
- growthRate: 예상 성장률 (예: "+85%", "+120%")
- score: 추천 점수 0-100
- basedOnTrends: 참고한 트렌드 제목들 (배열)

**중요: JSON 응답 규칙**
1. 응답은 반드시 순수 JSON 배열만 반환하세요
2. 코드블록(\`\`\`)을 절대 사용하지 마세요
3. 배열의 마지막 항목 뒤에 쉼표를 넣지 마세요
4. 문자열 내 따옴표는 반드시 이스케이프하세요 (예: \\"텍스트\\")
5. 줄바꿈 없이 한 줄로 작성하세요`;

const SYSTEM_PROMPT_EN = `You are a YouTube content strategy expert. Analyze current trends and recommend engaging content ideas for YouTubers.

Each recommendation must include these fields:
- title: Engaging video title (click-worthy)
- reason: Recommendation reason (why this topic is good, 10-20 chars)
- description: Video concept description (50-100 chars)
- hooks: 3 opening hook ideas (array)
- targetAudience: Target audience (e.g., "Tech enthusiasts", "College students")
- estimatedViews: Expected view range (e.g., "50K-100K", "100K-300K")
- difficulty: Production difficulty ("easy", "medium", "hard")
- videoType: Video length type ("short": under 60s, "medium": 2-10min, "long": 10min+)
- contentTone: Content tone ("informative", "funny", "dramatic", "casual", "professional")
- growthRate: Expected growth rate (e.g., "+85%", "+120%")
- score: Recommendation score 0-100
- basedOnTrends: Referenced trend titles (array)

**CRITICAL: JSON Response Rules**
1. Return ONLY a pure JSON array - no other text
2. NEVER use code blocks (\`\`\`)
3. NO trailing comma after the last array item
4. Escape quotes inside strings (use \\")
5. Write in a single line without line breaks`;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Clean and extract JSON array from potentially malformed AI response
 */
function cleanJsonResponse(text: string): string {
  // 1. Remove code block markers
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "");

  // 2. Extract JSON array
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) return "[]";

  cleaned = match[0];

  // 3. Fix common JSON errors
  // Remove trailing commas before ] or }
  cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");

  // Fix unescaped quotes in strings (basic heuristic)
  // This handles cases like "title": "Something "quoted" here"
  cleaned = cleaned.replace(
    /"([^"]*)":\s*"([^"]*)"/g,
    (match, key, value) => {
      // If value contains unescaped quotes, try to fix them
      const fixedValue = value.replace(/(?<!\\)"/g, '\\"');
      return `"${key}": "${fixedValue}"`;
    }
  );

  return cleaned;
}

// =============================================================================
// Main Function
// =============================================================================

export async function generateAIRecommendations(
  input: GenerateRecommendationsInput
): Promise<AIGeneratedRecommendation[]> {
  const { trends, userPreferences, count = 3, language = "ko" } = input;

  if (process.env.GEMINI_MOCK === "true") {
    return MOCK_RECOMMENDATIONS.slice(0, count);
  }

  if (!getGeminiClient()) {
    console.warn("GEMINI_API_KEY not set, returning empty recommendations");
    return [];
  }

  // Build trend context
  const trendContext = trends
    .slice(0, 10) // Limit to top 10 trends
    .map(
      (t, i) =>
        `${i + 1}. "${t.title}" (카테고리: ${t.category}, 조회수: ${t.views}, 성장률: ${t.growth})`
    )
    .join("\n");

  // Build user context
  let userContext = "";
  if (userPreferences) {
    if (userPreferences.preferredCategories?.length) {
      userContext += `\n선호 카테고리: ${userPreferences.preferredCategories.join(", ")}`;
    }
    if (userPreferences.channelDescription) {
      userContext += `\n채널 설명: ${userPreferences.channelDescription}`;
    }
    if (userPreferences.targetAudienceType) {
      userContext += `\n타겟 오디언스: ${userPreferences.targetAudienceType}`;
    }
  }

  const systemPrompt = language === "ko" ? SYSTEM_PROMPT_KO : SYSTEM_PROMPT_EN;

  const userPrompt =
    language === "ko"
      ? `다음 실시간 트렌드를 분석하고, 유튜버에게 ${count}개의 콘텐츠 아이디어를 추천해주세요.

현재 트렌드:
${trendContext}
${userContext}

중요:
1. 트렌드를 창의적으로 재해석하거나 여러 트렌드를 조합해주세요
2. 다양한 콘텐츠 톤과 난이도를 섞어주세요
3. 구체적이고 실행 가능한 아이디어를 제안해주세요
4. 예상 조회수와 성장률은 현실적으로 산정해주세요
5. JSON 배열만 반환하세요`
      : `Analyze the following real-time trends and recommend ${count} content ideas for YouTubers.

Current Trends:
${trendContext}
${userContext}

Important:
1. Creatively reinterpret trends or combine multiple trends
2. Mix different content tones and difficulty levels
3. Suggest specific, actionable ideas
4. Estimate views and growth rates realistically
5. Return only a JSON array`;

  try {
    const model = getTextModel("gemini-2.5-flash", systemPrompt)!;

    const result = await withRetry(() =>
      model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
    );

    const response = result.response;
    const text = response.text();

    if (!text) {
      console.error("No text content in Gemini response");
      return [];
    }

    // Parse JSON response with cleanup
    let recommendations: AIGeneratedRecommendation[];
    try {
      // Try direct parse first
      recommendations = JSON.parse(text.trim());
    } catch (parseError) {
      // Apply cleanup and try again
      const cleanedJson = cleanJsonResponse(text);
      try {
        recommendations = JSON.parse(cleanedJson);
      } catch (cleanupError) {
        console.error("Failed to parse Gemini response as JSON");
        console.error("Original text:", text.substring(0, 500));
        console.error("Cleaned JSON:", cleanedJson.substring(0, 500));
        return [];
      }
    }

    // Validate and normalize recommendations
    return recommendations.map((rec) => ({
      title: rec.title || "Untitled",
      reason: rec.reason || "AI 추천",
      description: rec.description || "",
      hooks: Array.isArray(rec.hooks) ? rec.hooks : [],
      targetAudience: rec.targetAudience || "일반 시청자",
      estimatedViews: rec.estimatedViews || "10K-50K",
      difficulty: validateDifficulty(rec.difficulty),
      videoType: validateVideoType(rec.videoType),
      contentTone: rec.contentTone || "informative",
      growthRate: rec.growthRate || "+50%",
      score: typeof rec.score === "number" ? Math.min(100, Math.max(0, rec.score)) : 75,
      basedOnTrends: Array.isArray(rec.basedOnTrends) ? rec.basedOnTrends : [],
    }));
  } catch (error) {
    console.error("Failed to generate AI recommendations:", error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error("Stack:", error.stack);
    }
    return [];
  }
}

// =============================================================================
// Helpers
// =============================================================================

function validateDifficulty(value: unknown): "easy" | "medium" | "hard" {
  if (value === "easy" || value === "medium" || value === "hard") {
    return value;
  }
  return "medium";
}

function validateVideoType(value: unknown): "short" | "medium" | "long" {
  if (value === "short" || value === "medium" || value === "long") {
    return value;
  }
  return "medium";
}
