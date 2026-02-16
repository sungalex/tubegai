// =============================================================================
// AI Pre-Production Service
// =============================================================================
// Server-side service for generating Pre-Production guide (hooks, scriptGuidelines,
// seoKeywords) from project context. Runs at Studio time, not at project creation.

import type { ScriptGuidelines } from "~/common/types/trend.types";
import type { ProjectFullDetail } from "~/common/data/project.data.server";
import { getTextModel } from "./client.server";
import { withRetry } from "./retry.server";
import { buildProjectContext } from "./context-builder.server";
import { MOCK_PRE_PRODUCTION } from "./__mocks__/fixtures";
import { AI_MODELS } from "./models.server";

// =============================================================================
// Types
// =============================================================================

export interface PreProductionInput {
  project: ProjectFullDetail;
  language?: "ko" | "en";
}

export interface PreProductionOutput {
  hooks: string[];
  scriptGuidelines: ScriptGuidelines;
  seoKeywords: string[];
}

// =============================================================================
// Prompt Templates
// =============================================================================

const SYSTEM_PROMPT_KO = `당신은 유튜브 콘텐츠 전략 전문가입니다.
프로젝트 정보를 분석하여 영상 제작 전 Pre-Production 가이드를 생성합니다.

응답은 반드시 유효한 JSON 형식이어야 합니다. 마크다운 코드 블록 없이 순수 JSON만 반환하세요.

JSON 스키마:
{
  "hooks": ["시청자 클릭을 유도하는 오프닝 훅 1", "오프닝 훅 2", "오프닝 훅 3"],
  "scriptGuidelines": {
    "openingStrategy": "도입부 전략 설명",
    "mainPoints": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
    "ctaStrategy": "CTA 전략 설명",
    "closingStrategy": "마무리 전략 설명",
    "targetLength": "목표 영상 길이 (예: 8-12분)",
    "keyMessages": ["핵심 메시지 1", "핵심 메시지 2"],
    "avoidTopics": ["피해야 할 주제 1"]
  },
  "seoKeywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
}

요구사항:
- hooks: 시청자가 클릭하고 싶어하는 강력한 오프닝 훅 3개. 감탄사, 질문, 놀라운 사실 활용
- scriptGuidelines: 대본 작성을 위한 구조화된 가이드라인. 프로젝트 주제에 맞는 구체적인 전략
- seoKeywords: YouTube 검색 최적화를 위한 SEO 키워드 5-10개. 경쟁이 적으면서 검색량이 높은 키워드`;

const SYSTEM_PROMPT_EN = `You are a YouTube content strategy expert.
Analyze project information and generate a Pre-Production guide for video creation.

Response must be valid JSON format. Return pure JSON without markdown code blocks.

JSON schema:
{
  "hooks": ["Compelling opening hook 1", "Opening hook 2", "Opening hook 3"],
  "scriptGuidelines": {
    "openingStrategy": "Opening strategy description",
    "mainPoints": ["Main point 1", "Main point 2", "Main point 3"],
    "ctaStrategy": "CTA strategy description",
    "closingStrategy": "Closing strategy description",
    "targetLength": "Target video length (e.g., 8-12 minutes)",
    "keyMessages": ["Key message 1", "Key message 2"],
    "avoidTopics": ["Topic to avoid 1"]
  },
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

Requirements:
- hooks: 3 powerful opening hooks that make viewers click. Use exclamations, questions, surprising facts
- scriptGuidelines: Structured guidelines for script writing, with specific strategies for the project topic
- seoKeywords: 5-10 SEO keywords optimized for YouTube search, balancing low competition with high search volume`;

// =============================================================================
// AI Generation Function
// =============================================================================

export async function generatePreProduction(
  input: PreProductionInput,
): Promise<PreProductionOutput> {
  if (process.env.GEMINI_MOCK === "true") {
    return MOCK_PRE_PRODUCTION;
  }

  const language = input.language ?? "ko";
  const systemPrompt = language === "ko" ? SYSTEM_PROMPT_KO : SYSTEM_PROMPT_EN;
  const model = getTextModel(AI_MODELS.text.primary, systemPrompt);

  if (!model) {
    console.warn("[AI Pre-Production] Gemini API key not configured, using mock data");
    return MOCK_PRE_PRODUCTION;
  }

  const projectContext = buildProjectContext(input.project, language);

  const userPrompt = language === "ko"
    ? `${projectContext}\n\n위 프로젝트 정보를 기반으로 영상 Pre-Production 가이드를 생성해주세요.\n- hooks: 시청자 클릭을 유도하는 강력한 오프닝 훅 3개\n- scriptGuidelines: 대본 작성을 위한 구조화된 가이드라인\n- seoKeywords: YouTube 검색 최적화를 위한 SEO 키워드 5-10개`
    : `${projectContext}\n\nBased on the project information above, generate a Pre-Production guide.\n- hooks: 3 compelling opening hooks to drive viewer clicks\n- scriptGuidelines: Structured guidelines for script writing\n- seoKeywords: 5-10 SEO keywords optimized for YouTube search`;

  try {
    console.log("[AI Pre-Production] Calling Gemini API...");

    const result = await withRetry(() =>
      model.generateContent({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    );

    const text = result.response.text();
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    const parsed = JSON.parse(text.trim()) as PreProductionOutput;

    // Validate required fields
    if (
      !parsed.hooks ||
      !Array.isArray(parsed.hooks) ||
      parsed.hooks.length === 0
    ) {
      throw new Error("Missing or invalid hooks in AI response");
    }
    if (!parsed.scriptGuidelines || !parsed.scriptGuidelines.openingStrategy) {
      throw new Error("Missing or invalid scriptGuidelines in AI response");
    }
    if (
      !parsed.seoKeywords ||
      !Array.isArray(parsed.seoKeywords) ||
      parsed.seoKeywords.length === 0
    ) {
      throw new Error("Missing or invalid seoKeywords in AI response");
    }

    console.log("[AI Pre-Production] Successfully generated Pre-Production guide");
    return parsed;
  } catch (error) {
    console.error("[AI Pre-Production] Failed to generate:", error);
    throw error;
  }
}
