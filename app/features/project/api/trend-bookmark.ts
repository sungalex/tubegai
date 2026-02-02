// =============================================================================
// API Route: /api/trend-bookmark
// =============================================================================
// POST: Save (bookmark) a trend
// DELETE: Remove bookmark from a trend
// GET: Get saved trends for the current user

import type { Route } from "./+types/trend-bookmark";
import {
  saveTrend,
  unsaveTrend,
  getSavedTrends,
  getTrendByExternalId,
} from "~/common/data/youtube.data.server";
import { requireAuth } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireAuth(request);
  const savedTrends = await getSavedTrends(userId);
  return { savedTrends };
}

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireAuth(request);

  if (request.method === "POST") {
    try {
      const body = (await request.json()) as {
        trendId?: string;
        externalId?: string;
      };

      let trendId = body.trendId;

      // If externalId is provided, look up the trend UUID
      if (!trendId && body.externalId) {
        const trend = await getTrendByExternalId(body.externalId);
        if (!trend) {
          return { error: "Trend not found" };
        }
        trendId = trend.id;
      }

      if (!trendId) {
        return { error: "Missing trendId or externalId" };
      }

      await saveTrend(trendId, userId);
      return { success: true, message: "트렌드가 저장되었습니다." };
    } catch (error) {
      console.error("Failed to save trend:", error);
      return { error: "Failed to save trend" };
    }
  }

  if (request.method === "DELETE") {
    try {
      const body = (await request.json()) as { trendId: string };

      if (!body.trendId) {
        return { error: "Missing trendId" };
      }

      await unsaveTrend(body.trendId, userId);
      return { success: true, message: "트렌드 저장이 해제되었습니다." };
    } catch (error) {
      console.error("Failed to unsave trend:", error);
      return { error: "Failed to unsave trend" };
    }
  }

  return { error: "Method not allowed" };
}
