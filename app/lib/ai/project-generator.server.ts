// =============================================================================
// AI Project Context Generator
// =============================================================================
// Server-side service for generating project context from trends using Gemini API
// Supports 3-step verification workflow:
// 1. Prompt preview (user can review and modify)
// 2. AI generation (returns editable results)
// 3. Apply to project (user confirms final values)

import type { TrendSnapshot } from "~/common/types/trend.types";
import {
  YOUTUBE_CATEGORY_VALUES_KO,
  YOUTUBE_CATEGORY_VALUES_EN,
  DEFAULT_YOUTUBE_CATEGORY_KO,
  normalizeYouTubeCategory,
} from "~/common/types/trend.types";
import { getClient } from "./client.server";
import { withRetry } from "./retry.server";
import { MOCK_PROJECT_CONTEXT } from "./__mocks__/fixtures";
import { AI_MODELS } from "./models.server";

// =============================================================================
// Types
// =============================================================================

export interface AIProjectGenerationInput {
  trend: {
    title: string;
    category: string;
    tags?: string[];
    views: string;
    growthRate: string;
    description?: string;
    externalUrl?: string;
  };
  options: {
    language: "ko" | "en";
    videoType?: string;
    preferredTone?: string;
    videoLength?: string;
    targetAudienceHint?: string;
    customInstructions?: string;
  };
}

export interface AIProjectGenerationOutput {
  title: string;
  description: string;
  targetAudience: string;
  estimatedViews: string;
  suggestedTone: string;
  suggestedDifficulty: "easy" | "medium" | "hard";
  suggestedVideoLength: "short" | "medium" | "long";
  suggestedCategory: string;
}

// =============================================================================
// Prompt Templates
// =============================================================================

const SYSTEM_PROMPT_KO = `당신은 유튜브 콘텐츠 전략가입니다.
주어진 트렌드 정보를 분석하여 프로젝트 컨텍스트를 생성합니다.

응답은 반드시 유효한 JSON 형식이어야 합니다. 마크다운 코드 블록 없이 순수 JSON만 반환하세요.

JSON 스키마:
{
  "title": "최적화된 영상 제목 (검색 친화적, 50자 이내)",
  "description": "영상 설명 초안 (150자 이내)",
  "targetAudience": "상세 타겟 시청자 설명",
  "estimatedViews": "예상 조회수 범위 (예: 50K-100K)",
  "suggestedTone": "콘텐츠에 가장 적합한 톤 (예: informative, funny, dramatic, casual, professional, cinematic, storytelling 등 자유 형식)",
  "suggestedDifficulty": "easy 또는 medium 또는 hard",
  "suggestedVideoLength": "short (60초 이하) 또는 medium (2-10분) 또는 long (10분+)",
  "suggestedCategory": "YouTube 콘텐츠 카테고리 (다음 중 하나: ${YOUTUBE_CATEGORY_VALUES_KO.join(", ")})"
}

사용자가 선택하지 않은 항목(자동 선택)은 트렌드 분석을 기반으로 최적의 값을 추천하세요.`;

const SYSTEM_PROMPT_EN = `You are a YouTube content strategist.
Analyze the given trend information and generate project context.

Response must be valid JSON format. Return pure JSON without markdown code blocks.

JSON schema:
{
  "title": "Optimized video title (SEO-friendly, under 50 chars)",
  "description": "Video description draft (under 150 chars)",
  "targetAudience": "Detailed target audience description",
  "estimatedViews": "Expected view range (e.g., 50K-100K)",
  "suggestedTone": "Best fitting content tone (e.g., informative, funny, dramatic, casual, professional, cinematic, storytelling — free-form)",
  "suggestedDifficulty": "easy or medium or hard",
  "suggestedVideoLength": "short (under 60s) or medium (2-10min) or long (10min+)",
  "suggestedCategory": "YouTube content category (one of: ${YOUTUBE_CATEGORY_VALUES_EN.join(", ")})"
}

For any user preference set to "Auto select", recommend the optimal value based on trend analysis.`;

// =============================================================================
// Prompt Builder (Exposed for verification)
// =============================================================================

export function buildProjectGenerationPrompt(input: AIProjectGenerationInput): string {
  const { trend, options } = input;
  const isKorean = options.language === "ko";
  const tags = trend.tags ?? [];

  const lines: string[] = [];

  if (isKorean) {
    lines.push("## 트렌드 정보");
    lines.push(`- 제목: ${trend.title}`);
    lines.push(`- 카테고리: ${trend.category}`);
    lines.push(`- 태그: ${tags.join(", ") || "없음"}`);
    lines.push(`- 조회수: ${trend.views}`);
    lines.push(`- 성장률: ${trend.growthRate}`);
    if (trend.description) {
      lines.push(`- 설명: ${trend.description.slice(0, 200)}...`);
    }
    if (trend.externalUrl) {
      lines.push(`- 영상 URL: ${trend.externalUrl}`);
    }

    lines.push("\n## 사용자 설정");
    const videoTypeLabel = options.videoType === "short" ? "쇼츠/릴스 (60초 이하)" : "일반 영상";
    lines.push(`- 영상 타입: ${videoTypeLabel}`);
    lines.push(`- 선호 톤: ${options.preferredTone || "자동 선택"}`);
    lines.push(`- 영상 길이: ${options.videoLength || "자동 선택"}`);
    lines.push(`- 타겟 시청자 힌트: ${options.targetAudienceHint || "자동 선택"}`);

    if (options.customInstructions) {
      lines.push("\n## 추가 지시사항");
      lines.push(options.customInstructions);
    }

    lines.push("\n위 트렌드를 기반으로 유튜브 영상 프로젝트 컨텍스트를 생성해주세요. 영상 타입에 맞는 제목과 구성을 만들어주세요. 영상 URL이 제공된 경우, 해당 영상의 주제와 콘텐츠를 참고하세요.");
  } else {
    lines.push("## Trend Information");
    lines.push(`- Title: ${trend.title}`);
    lines.push(`- Category: ${trend.category}`);
    lines.push(`- Tags: ${tags.join(", ") || "None"}`);
    lines.push(`- Views: ${trend.views}`);
    lines.push(`- Growth Rate: ${trend.growthRate}`);
    if (trend.description) {
      lines.push(`- Description: ${trend.description.slice(0, 200)}...`);
    }
    if (trend.externalUrl) {
      lines.push(`- Video URL: ${trend.externalUrl}`);
    }

    lines.push("\n## User Preferences");
    const videoTypeLabelEn = options.videoType === "short" ? "Shorts/Reels (under 60s)" : "Standard video";
    lines.push(`- Video Type: ${videoTypeLabelEn}`);
    lines.push(`- Preferred Tone: ${options.preferredTone || "Auto select"}`);
    lines.push(`- Video Length: ${options.videoLength || "Auto select"}`);
    lines.push(`- Target Audience Hint: ${options.targetAudienceHint || "Auto select"}`);

    if (options.customInstructions) {
      lines.push("\n## Additional Instructions");
      lines.push(options.customInstructions);
    }

    lines.push("\nGenerate YouTube video project context based on the trend above. Tailor the title and structure to the specified video type. If a video URL is provided, reference the video's topic and content.");
  }

  return lines.join("\n");
}

// =============================================================================
// AI Generation Function
// =============================================================================

export async function generateProjectContext(
  input: AIProjectGenerationInput
): Promise<AIProjectGenerationOutput> {
  if (process.env.GEMINI_MOCK === "true") {
    return MOCK_PROJECT_CONTEXT;
  }

  const ai = getClient();
  if (!ai) {
    console.warn("[AI Project Generator] Gemini API key not configured, using mock data");
    return generateMockOutput(input);
  }

  const systemPrompt = input.options.language === "ko" ? SYSTEM_PROMPT_KO : SYSTEM_PROMPT_EN;
  const prompt = buildProjectGenerationPrompt(input);

  try {
    console.log("[AI Project Generator] Calling Gemini API...");

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: AI_MODELS.text.lite,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
        },
      }),
    );
    const text = response.text;

    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    const parsed = JSON.parse(text.trim()) as AIProjectGenerationOutput;

    // Validate required fields
    if (!parsed.title || !parsed.targetAudience) {
      throw new Error("Missing required fields in AI response");
    }

    // Normalize AI-suggested category to standard format
    if (parsed.suggestedCategory) {
      parsed.suggestedCategory = normalizeYouTubeCategory(parsed.suggestedCategory);
    }

    console.log("[AI Project Generator] Successfully generated context with Gemini");
    return parsed;
  } catch (error) {
    console.error("[AI Project Generator] Failed to generate:", error);
    // Return mock data as fallback
    return generateMockOutput(input);
  }
}

// =============================================================================
// Mock Output (Fallback)
// =============================================================================

function generateMockOutput(input: AIProjectGenerationInput): AIProjectGenerationOutput {
  const { trend, options } = input;
  const isKorean = options.language === "ko";

  return {
    title: isKorean
      ? `${trend.title} - 완벽 가이드`
      : `${trend.title} - Complete Guide`,
    description: isKorean
      ? `${trend.category} 분야의 최신 트렌드를 분석하고, 핵심 인사이트를 공유합니다.`
      : `Analyzing the latest trends in ${trend.category} and sharing key insights.`,
    targetAudience: isKorean
      ? `${trend.category}에 관심 있는 20-40대, 새로운 트렌드를 빠르게 파악하고 싶은 시청자`
      : `Ages 20-40 interested in ${trend.category}, viewers who want to stay ahead of trends`,
    estimatedViews: "50K-150K",
    suggestedTone: options.preferredTone || "informative",
    suggestedDifficulty: "medium",
    suggestedVideoLength: (options.videoLength as "short" | "medium" | "long") || "medium",
    suggestedCategory: normalizeYouTubeCategory(trend.category || DEFAULT_YOUTUBE_CATEGORY_KO),
  };
}

// =============================================================================
// Helper: Create Trend Snapshot
// =============================================================================

export function createTrendSnapshot(
  trend: AIProjectGenerationInput["trend"]
): TrendSnapshot {
  return {
    capturedAt: new Date().toISOString(),
    title: trend.title,
    description: trend.description,
    category: normalizeYouTubeCategory(trend.category),
    tags: trend.tags ?? [],
    viewsCount: trend.views,
    growthRate: trend.growthRate,
    externalUrl: trend.externalUrl,
  };
}
