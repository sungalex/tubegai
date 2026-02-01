// =============================================================================
// API Route: /api/saved-ideas
// =============================================================================
// GET: Fetch saved ideas for the current user
// POST: Save a new idea
// DELETE: Delete a saved idea

import type { Route } from "./+types/saved-ideas";
import {
  saveIdea,
  getSavedIdeas,
  deleteSavedIdea,
} from "~/common/data/ideation.data.server";
import { requireAuth } from "~/lib/auth.server";
import type { GeneratedIdea } from "~/common/types/ideation.types";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireAuth(request);
  const ideas = await getSavedIdeas(userId);
  return { ideas };
}

// PostgreSQL integer max value
const MAX_INT = 2147483647;

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireAuth(request);

  if (request.method === "POST") {
    try {
      const body = (await request.json()) as { idea: GeneratedIdea };

      if (!body.idea) {
        return { error: "Missing idea data" };
      }

      // Sanitize trendId - set to undefined if it exceeds PostgreSQL integer range
      const sanitizedIdea = {
        ...body.idea,
        trendId: body.idea.trendId && body.idea.trendId <= MAX_INT
          ? body.idea.trendId
          : undefined,
      };

      const savedIdea = await saveIdea(userId, sanitizedIdea);
      return { success: true, idea: savedIdea };
    } catch (error) {
      console.error("Failed to save idea:", error);
      return { error: "Failed to save idea" };
    }
  }

  if (request.method === "DELETE") {
    try {
      const body = (await request.json()) as { ideaId: string };

      if (!body.ideaId) {
        return { error: "Missing ideaId" };
      }

      const deleted = await deleteSavedIdea(userId, body.ideaId);
      return { success: deleted };
    } catch (error) {
      console.error("Failed to delete idea:", error);
      return { error: "Failed to delete idea" };
    }
  }

  return { error: "Method not allowed" };
}
