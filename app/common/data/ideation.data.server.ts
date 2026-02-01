// =============================================================================
// Ideation Data Access Layer (Server-side)
// =============================================================================
// This layer handles AI idea generation and saved ideas management.
// Currently uses mock data - replace with OpenAI API calls when ready.

import { desc, eq, and } from "drizzle-orm";
import { db, schema } from "~/lib/db.server";
import type {
  GeneratedIdea,
  SavedIdea,
  GenerateIdeasRequest,
} from "../types/ideation.types";

// =============================================================================
// AI Idea Generation (Mock)
// =============================================================================

/**
 * Generate content ideas from a trend
 * TODO: Replace with OpenAI API call
 */
export async function generateIdeasFromTrend(
  request: GenerateIdeasRequest
): Promise<GeneratedIdea[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Mock AI-generated ideas based on trend
  const ideas: GeneratedIdea[] = [
    {
      id: crypto.randomUUID(),
      title: `${request.trendTitle} - Deep Dive Analysis`,
      description: `A comprehensive breakdown of ${request.trendTitle}, exploring the key moments, hidden details, and what makes it trending right now.`,
      hooks: [
        `Everyone's talking about ${request.trendTitle}, but here's what they're missing...`,
        `I spent 10 hours analyzing ${request.trendTitle} so you don't have to`,
        `The truth about ${request.trendTitle} that no one is telling you`,
      ],
      targetAudience: `${request.trendCategory} enthusiasts aged 18-35`,
      estimatedViews: "50K-150K",
      difficulty: "medium",
      basedOnTrend: request.trendTitle,
      trendId: request.trendId,
    },
    {
      id: crypto.randomUUID(),
      title: `Reacting to ${request.trendTitle}`,
      description: `A reaction video with live commentary and hot takes on ${request.trendTitle}. Perfect for engagement and comments.`,
      hooks: [
        `My honest reaction to ${request.trendTitle}`,
        `I can't believe what I just saw in ${request.trendTitle}`,
        `Reacting to the most viral ${request.trendCategory} content`,
      ],
      targetAudience: "General audience seeking entertainment",
      estimatedViews: "30K-80K",
      difficulty: "easy",
      basedOnTrend: request.trendTitle,
      trendId: request.trendId,
    },
    {
      id: crypto.randomUUID(),
      title: `${request.trendTitle}: Behind the Scenes`,
      description: `Explore the untold story behind ${request.trendTitle}. Research, interviews, and exclusive insights.`,
      hooks: [
        `What really happened behind ${request.trendTitle}`,
        `The story they don't want you to know about ${request.trendTitle}`,
        `How ${request.trendTitle} actually came together`,
      ],
      targetAudience: `Deep-dive viewers interested in ${request.trendCategory}`,
      estimatedViews: "80K-200K",
      difficulty: "hard",
      basedOnTrend: request.trendTitle,
      trendId: request.trendId,
    },
  ];

  return ideas;
}

// =============================================================================
// Saved Ideas CRUD Operations
// =============================================================================

/**
 * Save an idea to the database
 */
export async function saveIdea(
  userId: string,
  idea: GeneratedIdea
): Promise<SavedIdea> {
  const [savedIdea] = await db
    .insert(schema.savedIdeas)
    .values({
      userId,
      title: idea.title,
      description: idea.description,
      hooks: idea.hooks,
      targetAudience: idea.targetAudience,
      estimatedViews: idea.estimatedViews,
      difficulty: idea.difficulty,
      basedOnTrend: idea.basedOnTrend,
      trendId: idea.trendId,
    })
    .returning();

  return {
    id: savedIdea.id,
    userId: savedIdea.userId,
    title: savedIdea.title,
    description: savedIdea.description,
    hooks: savedIdea.hooks,
    targetAudience: savedIdea.targetAudience,
    estimatedViews: savedIdea.estimatedViews,
    difficulty: savedIdea.difficulty as SavedIdea["difficulty"],
    basedOnTrend: savedIdea.basedOnTrend,
    trendId: savedIdea.trendId ?? undefined,
    usedForProjectId: savedIdea.usedForProjectId ?? undefined,
    isUsed: savedIdea.isUsed,
    createdAt: savedIdea.createdAt,
    updatedAt: savedIdea.updatedAt,
  };
}

/**
 * Get all saved ideas for a user
 */
export async function getSavedIdeas(userId: string): Promise<SavedIdea[]> {
  const ideas = await db.query.savedIdeas.findMany({
    where: eq(schema.savedIdeas.userId, userId),
    orderBy: [desc(schema.savedIdeas.createdAt)],
  });

  return ideas.map((idea) => ({
    id: idea.id,
    userId: idea.userId,
    title: idea.title,
    description: idea.description,
    hooks: idea.hooks,
    targetAudience: idea.targetAudience,
    estimatedViews: idea.estimatedViews,
    difficulty: idea.difficulty as SavedIdea["difficulty"],
    basedOnTrend: idea.basedOnTrend,
    trendId: idea.trendId ?? undefined,
    usedForProjectId: idea.usedForProjectId ?? undefined,
    isUsed: idea.isUsed,
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
  }));
}

/**
 * Delete a saved idea
 */
export async function deleteSavedIdea(
  userId: string,
  ideaId: string
): Promise<boolean> {
  const result = await db
    .delete(schema.savedIdeas)
    .where(
      and(eq(schema.savedIdeas.id, ideaId), eq(schema.savedIdeas.userId, userId))
    )
    .returning({ id: schema.savedIdeas.id });

  return result.length > 0;
}

/**
 * Mark idea as used for a project
 */
export async function markIdeaAsUsed(
  userId: string,
  ideaId: string,
  projectId: string
): Promise<boolean> {
  const result = await db
    .update(schema.savedIdeas)
    .set({
      isUsed: true,
      usedForProjectId: projectId,
      updatedAt: new Date(),
    })
    .where(
      and(eq(schema.savedIdeas.id, ideaId), eq(schema.savedIdeas.userId, userId))
    )
    .returning({ id: schema.savedIdeas.id });

  return result.length > 0;
}
