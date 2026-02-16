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
  TrendTubeResults,
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
  clipNumber?: number;
  prompt?: string;
}) {
  const [media] = await db
    .insert(schema.trendtubeMedia)
    .values({
      sessionId: input.sessionId,
      mediaType: input.mediaType,
      publicUrl: input.publicUrl ?? null,
      mediaAssetId: input.mediaAssetId ?? null,
      metadata: input.metadata ?? null,
      clipNumber: input.clipNumber ?? null,
      prompt: input.prompt ?? null,
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

// =============================================================================
// Session with Ownership Verification
// =============================================================================

export async function getTrendTubeSessionForUser(
  sessionId: string,
  userId: string
) {
  const session = await db.query.trendtubeSessions.findFirst({
    where: and(
      eq(schema.trendtubeSessions.id, sessionId),
      eq(schema.trendtubeSessions.userId, userId)
    ),
    with: {
      result: true,
      media: true,
    },
  });
  return session ?? null;
}

// =============================================================================
// Session Progress Derivation
// =============================================================================

export function deriveSessionProgress(session: {
  status: string;
  result?: { extractedTrends?: string | null; videoIdeas?: string | null; narrationScript?: string | null } | null;
  media?: Array<{ mediaType: string; publicUrl?: string | null }>;
}): { completedSteps: number[]; nextStep: number | null } {
  const completed: number[] = [];

  if (session.result?.extractedTrends) completed.push(1);
  if (session.result?.videoIdeas) completed.push(2);

  const mediaTypes = new Set(
    (session.media ?? [])
      .filter((m) => m.publicUrl)
      .map((m) => m.mediaType)
  );

  if (mediaTypes.has("generated_video")) completed.push(3);
  if (mediaTypes.has("background_music")) completed.push(4);
  if (session.result?.narrationScript) completed.push(5);
  if (mediaTypes.has("voiceover")) completed.push(6);
  if (mediaTypes.has("composited_video")) completed.push(7);

  if (session.status === "completed" || session.status === "failed") {
    return { completedSteps: completed, nextStep: null };
  }

  // Determine next step based on 4-step grouping
  if (!completed.includes(1)) return { completedSteps: completed, nextStep: 1 };
  if (!completed.includes(2)) return { completedSteps: completed, nextStep: 2 };
  if (
    !completed.includes(3) ||
    !completed.includes(4) ||
    !completed.includes(5) ||
    !completed.includes(6)
  ) {
    return { completedSteps: completed, nextStep: 3 };
  }
  if (!completed.includes(7)) return { completedSteps: completed, nextStep: 4 };
  return { completedSteps: completed, nextStep: null };
}

// =============================================================================
// Build TrendTubeResults from Session Data
// =============================================================================

export function buildResultsFromSession(session: {
  result?: {
    extractedTrends?: string | null;
    videoIdeas?: string | null;
    narrationScript?: string | null;
  } | null;
  media?: Array<{
    mediaType: string;
    publicUrl?: string | null;
    metadata?: unknown;
    clipNumber?: number | null;
    createdAt: Date;
  }>;
}): TrendTubeResults {
  const result = session.result;
  const media = session.media ?? [];

  const findLatestMedia = (type: string) =>
    media
      .filter((m) => m.mediaType === type && m.publicUrl)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  // Collect all video clips sorted by clipNumber
  const videoClips = media
    .filter((m) => m.mediaType === "generated_video" && m.publicUrl)
    .sort((a, b) => (a.clipNumber ?? 0) - (b.clipNumber ?? 0));

  const video = findLatestMedia("generated_video");
  const music = findLatestMedia("background_music");
  const voiceover = findLatestMedia("voiceover");
  const composited = findLatestMedia("composited_video");

  // Build clip URLs array if multiple clips exist
  const videoClipUrls = videoClips.length > 1
    ? videoClips.map((c) => c.publicUrl!).filter(Boolean)
    : undefined;
  const clipCount = videoClips.length > 1 ? videoClips.length : undefined;
  const totalDuration = clipCount ? clipCount * 8 : undefined;

  return {
    extractedTrends: result?.extractedTrends ?? "",
    videoIdeas: result?.videoIdeas ?? "",
    narrationScript: result?.narrationScript ?? "",
    videoUrl: video?.publicUrl ?? undefined,
    videoClipUrls,
    clipCount,
    totalDuration,
    musicUrl: music?.publicUrl ?? undefined,
    musicDuration: (music?.metadata as Record<string, unknown> | null)?.duration as number | undefined,
    voiceoverUrl: voiceover?.publicUrl ?? undefined,
    voiceoverDuration: (voiceover?.metadata as Record<string, unknown> | null)?.duration as number | undefined,
    compositedVideoUrl: composited?.publicUrl ?? undefined,
    compositedDuration: (composited?.metadata as Record<string, unknown> | null)?.duration as number | undefined,
  };
}
