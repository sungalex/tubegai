// =============================================================================
// API Route: /api/ideas
// =============================================================================
// Unified API for managing ideas (both AI-generated and user-created)
//
// GET: Fetch ideas with optional filtering
// POST: Create new idea or generate AI recommendations
// PATCH: Update an existing idea
// DELETE: Delete an idea

import type { Route } from "./+types/ideas";
import { requireAuth } from "~/lib/auth.server";
import {
  getIdeas,
  createIdea,
  updateIdea,
  deleteIdea,
  saveIdea,
  markIdeaAsUsed,
  getAIRecommendationsForUser,
  refreshAIRecommendations,
  generateIdeasFromTrendWithAI,
  searchIdeas,
} from "~/common/data/idea.data.server";
import {
  getYouTubeTrends,
  getTrendsByIds,
} from "~/common/data/youtube.data.server";
import type {
  IdeaSource,
  CreateIdeaInput,
  UpdateIdeaInput,
  IdeationOptions,
} from "~/common/types/ideation.types";
import { DEFAULT_IDEATION_OPTIONS } from "~/common/types/ideation.types";
import type { TrendItem } from "~/common/types/project.types";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireAuth(request);
  const url = new URL(request.url);

  // Parse query params
  const source = url.searchParams.get("source") as IdeaSource | null;
  const savedOnly = url.searchParams.get("saved") === "true";

  // Fetch ideas with filter
  const ideas = await getIdeas(userId, {
    source: source || undefined,
    isSaved: savedOnly || undefined,
  });

  return { ideas };
}

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireAuth(request);

  if (request.method === "POST") {
    try {
      const body = await request.json();
      const intent = body.intent as string;

      switch (intent) {
        // Generate AI recommendations
        case "generate": {
          const { language = "ko", trendIds, count = 3 } = body;

          // Fetch trends
          let trends;
          if (trendIds && trendIds.length > 0) {
            trends = await getTrendsByIds(trendIds);
          }
          if (!trends || trends.length === 0) {
            trends = await getYouTubeTrends("KR");
          }

          const ideas = await getAIRecommendationsForUser(userId, trends, {
            count: Math.min(count, 5),
            language,
          });

          return { success: true, ideas };
        }

        // Refresh AI recommendations (force regeneration)
        case "refresh": {
          const { language = "ko", trendIds } = body;

          let trends;
          if (trendIds && trendIds.length > 0) {
            trends = await getTrendsByIds(trendIds);
          }
          if (!trends || trends.length === 0) {
            trends = await getYouTubeTrends("KR");
          }

          const ideas = await refreshAIRecommendations(userId, trends, language);
          return { success: true, ideas };
        }

        // Generate AI ideas from a single trend
        case "generate-from-trend": {
          const trend = body.trend as TrendItem;
          if (!trend?.title) {
            return { error: "Trend data required" };
          }

          const options: IdeationOptions = {
            ...DEFAULT_IDEATION_OPTIONS,
            ...body.options,
          };

          const ideas = await generateIdeasFromTrendWithAI(userId, trend, options);
          return { success: true, ideas };
        }

        // Save (bookmark) an AI recommendation
        case "save": {
          const { ideaId } = body;
          if (!ideaId) {
            return { error: "Missing ideaId" };
          }

          const savedIdea = await saveIdea(userId, ideaId);
          if (!savedIdea) {
            return { error: "Idea not found" };
          }

          return { success: true, idea: savedIdea };
        }

        // Search ideas by keyword
        case "search": {
          const { query, source, isSaved } = body;
          if (typeof query !== "string") {
            return { error: "Missing or invalid query" };
          }

          const ideas = await searchIdeas(userId, query, {
            source: source || undefined,
            isSaved: isSaved ?? undefined,
          });

          return { success: true, ideas };
        }

        // Mark idea as used for a project
        case "use": {
          const { ideaId, projectId } = body;
          if (!ideaId || !projectId) {
            return { error: "Missing ideaId or projectId" };
          }

          const success = await markIdeaAsUsed(userId, ideaId, projectId);
          return { success };
        }

        // Create a new user-created idea
        case "create":
        default: {
          const input = body.idea as CreateIdeaInput;
          if (!input || !input.title) {
            return { error: "Missing idea data" };
          }

          // Ensure source is set for user-created ideas
          const ideaInput: CreateIdeaInput = {
            ...input,
            source: input.source || "user_created",
          };

          const idea = await createIdea(userId, ideaInput);
          return { success: true, idea };
        }
      }
    } catch (error) {
      console.error("Failed to process idea request:", error);
      return { error: "Failed to process request" };
    }
  }

  if (request.method === "PATCH") {
    try {
      const body = await request.json();
      const { ideaId, updates } = body as { ideaId: string; updates: UpdateIdeaInput };

      if (!ideaId) {
        return { error: "Missing ideaId" };
      }
      if (!updates) {
        return { error: "Missing updates" };
      }

      const updatedIdea = await updateIdea(userId, ideaId, updates);
      if (!updatedIdea) {
        return { error: "Idea not found" };
      }

      return { success: true, idea: updatedIdea };
    } catch (error) {
      console.error("Failed to update idea:", error);
      return { error: "Failed to update idea" };
    }
  }

  if (request.method === "DELETE") {
    try {
      const body = await request.json();
      const { ideaId } = body as { ideaId: string };

      if (!ideaId) {
        return { error: "Missing ideaId" };
      }

      const deleted = await deleteIdea(userId, ideaId);
      return { success: deleted };
    } catch (error) {
      console.error("Failed to delete idea:", error);
      return { error: "Failed to delete idea" };
    }
  }

  return { error: "Method not allowed" };
}
