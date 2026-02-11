// =============================================================================
// TrendTube Data Layer
// =============================================================================
// Server-side CRUD operations for TrendTube pipeline sessions and results

import { db, schema } from "~/lib/db.server";
import { eq, desc, and } from "drizzle-orm";
import type {
  TrendTubePipelineStatus,
  TrendTubeMediaType,
  TrendTubeVoiceOption,
} from "~/common/types/trendtube.types";

// =============================================================================
// Session CRUD
// =============================================================================

export async function createTrendTubeSession(input: {
  projectId: string;
  userId: string;
  trendsUrl: string;
  userIdea: string;
  referenceImageUrl?: string;
  voiceOption?: TrendTubeVoiceOption;
}) {
  const [session] = await db
    .insert(schema.trendtubeSessions)
    .values({
      projectId: input.projectId,
      userId: input.userId,
      trendsUrl: input.trendsUrl,
      userIdea: input.userIdea,
      referenceImageUrl: input.referenceImageUrl ?? null,
      voiceOption: input.voiceOption ?? "female_ko",
      status: "pending",
      currentStep: 0,
    })
    .returning();

  return session;
}

export async function updateSessionStatus(
  sessionId: string,
  status: TrendTubePipelineStatus,
  currentStep: number,
  errorMessage?: string
) {
  const values: Record<string, unknown> = { status, currentStep };
  if (errorMessage !== undefined) {
    values.errorMessage = errorMessage;
  }
  if (status === "completed") {
    values.completedAt = new Date();
  }

  await db
    .update(schema.trendtubeSessions)
    .set(values)
    .where(eq(schema.trendtubeSessions.id, sessionId));
}

export async function getTrendTubeSession(sessionId: string) {
  return db.query.trendtubeSessions.findFirst({
    where: eq(schema.trendtubeSessions.id, sessionId),
    with: {
      result: true,
      media: true,
    },
  });
}

export async function getLatestTrendTubeSession(projectId: string) {
  return db.query.trendtubeSessions.findFirst({
    where: eq(schema.trendtubeSessions.projectId, projectId),
    orderBy: desc(schema.trendtubeSessions.createdAt),
    with: {
      result: true,
      media: true,
    },
  });
}

export async function getTrendTubeSessions(projectId: string) {
  return db.query.trendtubeSessions.findMany({
    where: eq(schema.trendtubeSessions.projectId, projectId),
    orderBy: desc(schema.trendtubeSessions.createdAt),
    with: {
      result: true,
      media: true,
    },
  });
}

// =============================================================================
// Result CRUD
// =============================================================================

export async function saveTrendTubeResult(input: {
  sessionId: string;
  extractedTrends?: string;
  videoIdeas?: string;
  narrationScript?: string;
}) {
  // Upsert: check if result already exists for session
  const existing = await db.query.trendtubeResults.findFirst({
    where: eq(schema.trendtubeResults.sessionId, input.sessionId),
  });

  if (existing) {
    const updateValues: Record<string, unknown> = {};
    if (input.extractedTrends !== undefined)
      updateValues.extractedTrends = input.extractedTrends;
    if (input.videoIdeas !== undefined)
      updateValues.videoIdeas = input.videoIdeas;
    if (input.narrationScript !== undefined)
      updateValues.narrationScript = input.narrationScript;

    await db
      .update(schema.trendtubeResults)
      .set(updateValues)
      .where(eq(schema.trendtubeResults.id, existing.id));

    return { ...existing, ...updateValues };
  }

  const [result] = await db
    .insert(schema.trendtubeResults)
    .values({
      sessionId: input.sessionId,
      extractedTrends: input.extractedTrends ?? null,
      videoIdeas: input.videoIdeas ?? null,
      narrationScript: input.narrationScript ?? null,
    })
    .returning();

  return result;
}

// =============================================================================
// Media CRUD
// =============================================================================

export async function saveTrendTubeMedia(input: {
  sessionId: string;
  mediaType: TrendTubeMediaType;
  publicUrl?: string;
  mediaAssetId?: string;
  metadata?: Record<string, unknown>;
}) {
  const [media] = await db
    .insert(schema.trendtubeMedia)
    .values({
      sessionId: input.sessionId,
      mediaType: input.mediaType,
      publicUrl: input.publicUrl ?? null,
      mediaAssetId: input.mediaAssetId ?? null,
      metadata: input.metadata ?? null,
    })
    .returning();

  return media;
}

export async function getTrendTubeMediaBySession(
  sessionId: string,
  mediaType?: TrendTubeMediaType
) {
  if (mediaType) {
    return db.query.trendtubeMedia.findMany({
      where: and(
        eq(schema.trendtubeMedia.sessionId, sessionId),
        eq(schema.trendtubeMedia.mediaType, mediaType)
      ),
    });
  }

  return db.query.trendtubeMedia.findMany({
    where: eq(schema.trendtubeMedia.sessionId, sessionId),
  });
}
