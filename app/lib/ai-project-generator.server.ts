// =============================================================================
// AI Project Context Generator
// =============================================================================
// Server-side service for generating project context from trends using Gemini API
// Supports 3-step verification workflow:
// 1. Prompt preview (user can review and modify)
// 2. AI generation (returns editable results)
// 3. Apply to project (user confirms final values)

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { TrendSnapshot, ScriptGuidelines } from "~/common/types/trend.types";

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
  hooks: string[];
  targetAudience: string;
  estimatedViews: string;
  scriptGuidelines: ScriptGuidelines;
  keywords: string[];
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
  "hooks": ["오프닝 훅 1", "오프닝 훅 2", "오프닝 훅 3"],
  "targetAudience": "상세 타겟 시청자 설명",
  "estimatedViews": "예상 조회수 범위 (예: 50K-100K)",
  "scriptGuidelines": {
    "openingStrategy": "도입부 전략 설명",
    "mainPoints": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
    "ctaStrategy": "CTA 전략 설명",
    "closingStrategy": "마무리 전략 설명"
  },
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
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
  "hooks": ["Opening hook 1", "Opening hook 2", "Opening hook 3"],
  "targetAudience": "Detailed target audience description",
  "estimatedViews": "Expected view range (e.g., 50K-100K)",
  "scriptGuidelines": {
    "openingStrategy": "Opening strategy description",
    "mainPoints": ["Main point 1", "Main point 2", "Main point 3"],
    "ctaStrategy": "CTA strategy description",
    "closingStrategy": "Closing strategy description"
  },
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
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
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    console.warn("[AI Project Generator] Gemini API key not configured, using mock data");
    return generateMockOutput(input);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = buildProjectGenerationPrompt(input);
  const systemPrompt = input.options.language === "ko" ? SYSTEM_PROMPT_KO : SYSTEM_PROMPT_EN;

  try {
    const fullPrompt = `${systemPrompt}\n\n${prompt}`;

    console.log("[AI Project Generator] Calling Gemini API...");

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonText = text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonText) as AIProjectGenerationOutput;

    // Validate required fields
    if (!parsed.title || !parsed.hooks || !parsed.scriptGuidelines) {
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
    hooks: isKorean
      ? [
          `"${trend.title}" 왜 지금 모두가 주목하는 걸까요?`,
          `이 영상을 끝까지 보시면, ${trend.category}에 대한 시각이 완전히 바뀔 겁니다.`,
          `${trend.views} 조회수를 기록한 이 트렌드, 그 비밀을 파헤쳐봅니다.`,
        ]
      : [
          `Why is everyone talking about "${trend.title}" right now?`,
          `By the end of this video, your perspective on ${trend.category} will completely change.`,
          `This trend hit ${trend.views} views. Let's uncover the secret.`,
        ],
    targetAudience: isKorean
      ? `${trend.category}에 관심 있는 20-40대, 새로운 트렌드를 빠르게 파악하고 싶은 시청자`
      : `Ages 20-40 interested in ${trend.category}, viewers who want to stay ahead of trends`,
    estimatedViews: "50K-150K",
    scriptGuidelines: {
      openingStrategy: isKorean
        ? "강렬한 질문으로 시작하여 시청자의 호기심을 자극"
        : "Start with a powerful question to spark curiosity",
      mainPoints: isKorean
        ? [
            `${trend.title}이 주목받는 이유 분석`,
            "실제 사례와 데이터로 뒷받침",
            "시청자가 적용할 수 있는 실용적 팁",
          ]
        : [
            `Analysis of why ${trend.title} is gaining attention`,
            "Supporting with real cases and data",
            "Practical tips viewers can apply",
          ],
      ctaStrategy: isKorean
        ? "댓글로 의견 공유 유도, 구독과 알림 설정 권장"
        : "Encourage sharing opinions in comments, recommend subscription",
      closingStrategy: isKorean
        ? "핵심 내용 요약 후 다음 영상 예고로 기대감 조성"
        : "Summarize key points and tease the next video",
    },
    keywords: (trend.tags ?? []).slice(0, 5).length > 0
      ? (trend.tags ?? []).slice(0, 5)
      : [trend.category, trend.title.split(" ")[0], "trend", "guide", "tips"],
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
