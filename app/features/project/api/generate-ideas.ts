// =============================================================================
// API Route: POST /api/generate-ideas
// =============================================================================
// Generates AI content ideas from a trend

import type { Route } from "./+types/generate-ideas";
import { requireAuth } from "~/lib/auth.server";
import { generateIdeasFromTrend } from "~/common/data/idea.data.server";
import type { GenerateIdeasRequest } from "~/common/types/ideation.types";

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);

  if (request.method !== "POST") {
    return { error: "Method not allowed" };
  }

  try {
    const body = (await request.json()) as GenerateIdeasRequest;

    if (!body.trendTitle || !body.trendCategory) {
      return { error: "Missing required fields" };
    }

    const ideas = await generateIdeasFromTrend({
      trendTitle: body.trendTitle,
      trendCategory: body.trendCategory,
      trendTags: body.trendTags || [],
      trendId: body.trendId,
      options: body.options,
    });

    return { ideas };
  } catch (error) {
    console.error("Failed to generate ideas:", error);
    return { error: "Failed to generate ideas" };
  }
}
