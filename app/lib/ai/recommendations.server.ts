// =============================================================================
// AI Service (Google Gemini API Integration)
// =============================================================================
// Server-side AI service for generating YouTube content ideas

import type { TrendItem } from "~/common/types/project.types";
import {
  YOUTUBE_CATEGORY_VALUES_KO,
  YOUTUBE_CATEGORY_VALUES_EN,
  DEFAULT_YOUTUBE_CATEGORY_KO,
  normalizeYouTubeCategory,
} from "~/common/types/trend.types";
import { getClient } from "./client.server";
import { withRetry } from "./retry.server";
import { MOCK_RECOMMENDATIONS } from "./__mocks__/fixtures";
import { AI_MODELS } from "./models.server";

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
  category: string;
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

각 추천은 다음 JSON 필드를 포함해야 합니다:
- title: 매력적인 영상 제목
- reason: 추천 이유 (10-20자)
- description: 영상 컨셉 설명 (50-100자)
- hooks: 오프닝 훅 아이디어 3개 (배열)
- targetAudience: 타겟 시청자
- estimatedViews: 예상 조회수 범위 (예: "50K-100K")
- difficulty: "easy" | "medium" | "hard"
- videoType: "short" | "medium" | "long"
- contentTone: 콘텐츠 톤 (자유 형식)
- growthRate: 예상 성장률 (예: "+85%")
- score: 추천 점수 0-100
- basedOnTrends: 참고한 트렌드 제목들 (배열)
- category: YouTube 카테고리 (${YOUTUBE_CATEGORY_VALUES_KO.join(", ")} 중 하나)`;

const SYSTEM_PROMPT_EN = `You are a YouTube content strategy expert. Analyze current trends and recommend engaging content ideas for YouTubers.

Each recommendation must include these JSON fields:
- title: Engaging video title
- reason: Recommendation reason (10-20 chars)
- description: Video concept description (50-100 chars)
- hooks: 3 opening hook ideas (array)
- targetAudience: Target audience
- estimatedViews: Expected view range (e.g., "50K-100K")
- difficulty: "easy" | "medium" | "hard"
- videoType: "short" | "medium" | "long"
- contentTone: Content tone (free-form)
- growthRate: Expected growth rate (e.g., "+85%")
- score: Recommendation score 0-100
- basedOnTrends: Referenced trend titles (array)
- category: YouTube category (one of: ${YOUTUBE_CATEGORY_VALUES_EN.join(", ")})`;

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

  const ai = getClient();
  if (!ai) {
    console.warn("GEMINI_API_KEY not set, returning empty recommendations");
    return [];
  }

  // Build trend context with full metadata
  const trendContext = trends
    .slice(0, 10) // Limit to top 10 trends
    .map((t, i) => {
      const tags = t.tags?.length ? `태그: ${t.tags.slice(0, 5).join(", ")}` : "";
      const desc = t.description ? `설명: ${t.description.slice(0, 150)}` : "";
      const details = [
        `카테고리: ${t.category}`,
        `조회수: ${t.views}`,
        `성장률: ${t.growth}`,
        tags,
        desc,
      ].filter(Boolean).join(" | ");
      return `${i + 1}. "${t.title}" (${details})`;
    })
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
      ? `다음 트렌드를 분석하고, 이 트렌드와 직접적으로 관련된 ${count}개의 콘텐츠 아이디어를 추천해주세요.

현재 트렌드:
${trendContext}
${userContext}

중요:
1. 각 아이디어는 반드시 위 트렌드의 주제, 카테고리, 태그와 직접 연관되어야 합니다
2. 트렌드의 제목과 설명을 참고하여 구체적인 아이디어를 만드세요
3. basedOnTrends 필드에 참고한 트렌드 제목을 정확히 기재하세요
4. 예상 조회수와 성장률은 현실적으로 산정해주세요`
      : `Analyze the following trends and recommend ${count} content ideas directly related to these trends.

Current Trends:
${trendContext}
${userContext}

Important:
1. Each idea MUST be directly related to the topics, categories, and tags of the trends above
2. Reference the trend titles and descriptions to create specific ideas
3. Accurately list referenced trend titles in basedOnTrends field
4. Estimate views and growth rates realistically`;

  try {
    const response = await withRetry(() =>
      ai.models.generateContent({
        model: AI_MODELS.text.primary,
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.8,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
    );

    const text = response.text;

    if (!text) {
      console.error("No text content in Gemini response");
      return [];
    }

    // Parse JSON response with cleanup
    let recommendations: AIGeneratedRecommendation[];
    try {
      recommendations = JSON.parse(text.trim());
    } catch {
      const cleanedJson = cleanJsonResponse(text);
      try {
        recommendations = JSON.parse(cleanedJson);
      } catch {
        console.error("Failed to parse Gemini response as JSON");
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
      category: normalizeYouTubeCategory(rec.category || DEFAULT_YOUTUBE_CATEGORY_KO),
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
// Single-Trend AI Idea Generation
// =============================================================================

export interface GenerateIdeasFromTrendInput {
  trend: {
    title: string;
    category: string;
    tags?: string[];
    views: string;
    growth: string;
    description?: string;
    videoUrl?: string;
  };
  options: {
    language: "ko" | "en";
    contentTone?: string;
    videoType?: string;
    targetAudienceHint?: string;
    customPrompt?: string;
    count: number;
  };
}

export async function generateIdeasFromTrendAI(
  input: GenerateIdeasFromTrendInput
): Promise<AIGeneratedRecommendation[]> {
  const { trend, options } = input;
  const { language = "ko", count = 3 } = options;

  if (process.env.GEMINI_MOCK === "true") {
    return MOCK_RECOMMENDATIONS.slice(0, count);
  }

  const ai = getClient();
  if (!ai) {
    console.warn("GEMINI_API_KEY not set, returning empty ideas");
    return [];
  }

  // Build single trend context
  const tags = trend.tags?.length ? `태그: ${trend.tags.slice(0, 5).join(", ")}` : "";
  const desc = trend.description ? `설명: ${trend.description.slice(0, 150)}` : "";
  const details = [
    `카테고리: ${trend.category}`,
    `조회수: ${trend.views}`,
    `성장률: ${trend.growth}`,
    tags,
    desc,
  ].filter(Boolean).join(" | ");
  const trendContext = `1. "${trend.title}" (${details})`;

  // Build user preference context
  const prefLines: string[] = [];
  if (options.contentTone) {
    prefLines.push(language === "ko"
      ? `선호 톤: ${options.contentTone}`
      : `Preferred tone: ${options.contentTone}`);
  }
  if (options.videoType) {
    prefLines.push(language === "ko"
      ? `영상 타입: ${options.videoType === "short" ? "쇼츠/릴스 (60초 이하)" : options.videoType === "long" ? "롱폼 (10분+)" : "미디엄 (2-10분)"}`
      : `Video type: ${options.videoType}`);
  }
  if (options.targetAudienceHint && options.targetAudienceHint !== "general") {
    prefLines.push(language === "ko"
      ? `타겟 오디언스: ${options.targetAudienceHint}`
      : `Target audience: ${options.targetAudienceHint}`);
  }
  if (options.customPrompt) {
    prefLines.push(language === "ko"
      ? `추가 요청: ${options.customPrompt}`
      : `Additional request: ${options.customPrompt}`);
  }
  const userContext = prefLines.length > 0 ? `\n${prefLines.join("\n")}` : "";

  const systemPrompt = language === "ko" ? SYSTEM_PROMPT_KO : SYSTEM_PROMPT_EN;

  const userPrompt = language === "ko"
    ? `다음 트렌드를 분석하고, 이 트렌드와 직접적으로 관련된 ${count}개의 콘텐츠 아이디어를 추천해주세요.

현재 트렌드:
${trendContext}
${userContext}

중요:
1. 각 아이디어는 반드시 위 트렌드의 주제, 카테고리, 태그와 직접 연관되어야 합니다
2. 트렌드의 제목과 설명을 참고하여 구체적인 아이디어를 만드세요
3. basedOnTrends 필드에 참고한 트렌드 제목을 정확히 기재하세요
4. 예상 조회수와 성장률은 현실적으로 산정해주세요`
    : `Analyze the following trend and recommend ${count} content ideas directly related to it.

Current Trend:
${trendContext}
${userContext}

Important:
1. Each idea MUST be directly related to the topic, category, and tags of the trend above
2. Reference the trend title and description to create specific ideas
3. Accurately list the trend title in basedOnTrends field
4. Estimate views and growth rates realistically`;

  try {
    const response = await withRetry(() =>
      ai.models.generateContent({
        model: AI_MODELS.text.lite,
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.8,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
    );

    const text = response.text;

    if (!text) {
      console.error("[generateIdeasFromTrendAI] No text content in Gemini response");
      return [];
    }

    let recommendations: AIGeneratedRecommendation[];
    try {
      recommendations = JSON.parse(text.trim());
    } catch {
      const cleanedJson = cleanJsonResponse(text);
      try {
        recommendations = JSON.parse(cleanedJson);
      } catch {
        console.error("[generateIdeasFromTrendAI] Failed to parse response");
        return [];
      }
    }

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
      basedOnTrends: Array.isArray(rec.basedOnTrends) ? rec.basedOnTrends : [trend.title],
      category: normalizeYouTubeCategory(rec.category || trend.category || DEFAULT_YOUTUBE_CATEGORY_KO),
    }));
  } catch (error) {
    console.error("[generateIdeasFromTrendAI] Failed:", error instanceof Error ? error.message : error);
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
