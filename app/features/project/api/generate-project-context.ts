// =============================================================================
// API Route: /api/generate-project-context
// =============================================================================
// GET: Preview the prompt that will be sent to AI (verification step 1)
// POST: Execute AI generation and return results (verification step 2)

import type { Route } from "./+types/generate-project-context";
import { requireAuth } from "~/lib/auth.server";
import {
  buildProjectGenerationPrompt,
  generateProjectContext,
  createTrendSnapshot,
  type AIProjectGenerationInput,
  type AIProjectGenerationOutput,
} from "~/lib/ai/project-generator.server";

// =============================================================================
// GET: Prompt Preview (Verification Step 1)
// =============================================================================

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);

  const url = new URL(request.url);
  const trendData = url.searchParams.get("trend");
  const optionsData = url.searchParams.get("options");

  if (!trendData) {
    return { error: "Trend data required" };
  }

  try {
    const trend = JSON.parse(trendData);
    const options = optionsData ? JSON.parse(optionsData) : { language: "ko" };

    const input: AIProjectGenerationInput = {
      trend,
      options,
    };

    // Build prompt for preview (no AI call)
    const prompt = buildProjectGenerationPrompt(input);

    return {
      success: true,
      prompt,
      input,
      estimatedTokens: Math.ceil(prompt.length / 4),
    };
  } catch (error) {
    console.error("[Generate Project Context] Failed to parse input:", error);
    return { error: "Invalid input data" };
  }
}

// =============================================================================
// POST: Execute AI Generation (Verification Step 2)
// =============================================================================

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);

  if (request.method !== "POST") {
    return { error: "Method not allowed" };
  }

  try {
    const body = await request.json() as {
      trend: AIProjectGenerationInput["trend"];
      options?: AIProjectGenerationInput["options"];
      customInstructions?: string;
    };

    if (!body.trend) {
      return { error: "Trend data required" };
    }

    const input: AIProjectGenerationInput = {
      trend: body.trend,
      options: {
        language: body.options?.language ?? "ko",
        preferredTone: body.options?.preferredTone,
        videoLength: body.options?.videoLength,
        targetAudienceHint: body.options?.targetAudienceHint,
        customInstructions: body.customInstructions || body.options?.customInstructions,
      },
    };

    // Execute AI generation
    const result = await generateProjectContext(input);

    // Create trend snapshot for project
    const trendSnapshot = createTrendSnapshot(input.trend);

    return {
      success: true,
      result,
      trendSnapshot,
      input, // Return input for potential regeneration
    };
  } catch (error) {
    console.error("[Generate Project Context] Failed to generate:", error);
    return {
      error: "AI 생성에 실패했습니다. 다시 시도해주세요.",
    };
  }
}

// =============================================================================
// Response Types (for client-side type safety)
// =============================================================================

export type GenerateProjectContextLoaderData = {
  success: true;
  prompt: string;
  input: AIProjectGenerationInput;
  estimatedTokens: number;
} | {
  error: string;
};

export type GenerateProjectContextActionData = {
  success: true;
  result: AIProjectGenerationOutput;
  trendSnapshot: ReturnType<typeof createTrendSnapshot>;
  input: AIProjectGenerationInput;
} | {
  error: string;
};
