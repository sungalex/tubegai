// =============================================================================
// API Route: /api/ai-recommendations
// =============================================================================
// GET: Fetch AI-generated recommendations for the current user
// POST: Force refresh recommendations

import type { Route } from "./+types/ai-recommendations";
import { requireAuth } from "~/lib/auth.server";
import { getYouTubeTrends } from "~/common/data/youtube.data.server";
import {
  getAIRecommendationsForUser,
  refreshRecommendations,
} from "~/common/data/ai-recommendation.data.server";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireAuth(request);

  // Get current trends for context
  const trends = await getYouTubeTrends("KR");

  // Get URL params
  const url = new URL(request.url);
  const language = (url.searchParams.get("language") as "ko" | "en") || "ko";
  const count = parseInt(url.searchParams.get("count") || "3", 10);

  // Get AI recommendations
  const recommendations = await getAIRecommendationsForUser(userId, trends, {
    count: Math.min(count, 5),
    language,
  });

  return { recommendations };
}

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireAuth(request);

  if (request.method === "POST") {
    try {
      const body = (await request.json()) as {
        language?: "ko" | "en";
      };

      // Get current trends
      const trends = await getYouTubeTrends("KR");

      // Force refresh recommendations
      const recommendations = await refreshRecommendations(
        userId,
        trends,
        body.language || "ko"
      );

      return { success: true, recommendations };
    } catch (error) {
      console.error("Failed to refresh recommendations:", error);
      return { error: "Failed to refresh recommendations" };
    }
  }

  return { error: "Method not allowed" };
}
