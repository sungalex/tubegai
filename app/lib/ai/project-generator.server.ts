// =============================================================================
// AI Project Context Generator
// =============================================================================
// Server-side service for generating project context from trends using Gemini API
// Supports 3-step verification workflow:
// 1. Prompt preview (user can review and modify)
// 2. AI generation (returns editable results)
// 3. Apply to project (user confirms final values)

import type { TrendSnapshot } from "~/common/types/trend.types";
import { getTextModel } from "./client.server";
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
  "suggestedTone": "informative 또는 funny 또는 dramatic 또는 casual 또는 professional",
  "suggestedDifficulty": "easy 또는 medium 또는 hard"
}`;

const SYSTEM_PROMPT_EN = `You are a YouTube content strategist.
Analyze the given trend information and generate project context.

Response must be valid JSON format. Return pure JSON without markdown code blocks.

JSON schema:
{
  "title": "Optimized video title (SEO-friendly, under 50 chars)",
  "description": "Video description draft (under 150 chars)",
  "targetAudience": "Detailed target audience description",
  "estimatedViews": "Expected view range (e.g., 50K-100K)",
  "suggestedTone": "informative or funny or dramatic or casual or professional",
  "suggestedDifficulty": "easy or medium or hard"
}`;

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

    lines.push("\n## 사용자 설정");
    lines.push(`- 선호 톤: ${options.preferredTone || "자동 선택"}`);
    lines.push(`- 영상 길이: ${options.videoLength || "자동 선택"}`);
    lines.push(`- 타겟 시청자 힌트: ${options.targetAudienceHint || "일반 시청자"}`);

    if (options.customInstructions) {
      lines.push("\n## 추가 지시사항");
      lines.push(options.customInstructions);
    }

    lines.push("\n위 트렌드를 기반으로 유튜브 영상 프로젝트 컨텍스트를 생성해주세요.");
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

    lines.push("\n## User Preferences");
    lines.push(`- Preferred Tone: ${options.preferredTone || "Auto select"}`);
    lines.push(`- Video Length: ${options.videoLength || "Auto select"}`);
    lines.push(`- Target Audience Hint: ${options.targetAudienceHint || "General audience"}`);

    if (options.customInstructions) {
      lines.push("\n## Additional Instructions");
      lines.push(options.customInstructions);
    }

    lines.push("\nGenerate YouTube video project context based on the trend above.");
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

  const systemPrompt = input.options.language === "ko" ? SYSTEM_PROMPT_KO : SYSTEM_PROMPT_EN;
  const model = getTextModel(AI_MODELS.text.lite, systemPrompt);

  if (!model) {
    console.warn("[AI Project Generator] Gemini API key not configured, using mock data");
    return generateMockOutput(input);
  }

  const prompt = buildProjectGenerationPrompt(input);

  try {
    console.log("[AI Project Generator] Calling Gemini API...");

    const result = await withRetry(() =>
      model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    );
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    const parsed = JSON.parse(text.trim()) as AIProjectGenerationOutput;

    // Validate required fields
    if (!parsed.title || !parsed.targetAudience) {
      throw new Error("Missing required fields in AI response");
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
    category: trend.category,
    tags: trend.tags ?? [],
    viewsCount: trend.views,
    growthRate: trend.growthRate,
    externalUrl: trend.externalUrl,
  };
}
