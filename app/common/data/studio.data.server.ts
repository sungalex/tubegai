// =============================================================================
// Studio Data Access Layer (Server-side)
// =============================================================================
// This layer handles all Supabase database operations for the Studio feature.

import { eq, asc, and, desc, count as drizzleCount } from "drizzle-orm";
import { db, schema } from "~/lib/db.server";
import { formatDistanceToNow } from "date-fns";
import type {
  ScriptSegment,
  SceneScriptSegment,
  SceneVideo,
  StudioProject,
  SubtitleSegment,
  StockVideo,
  BRollSceneContext,
  BRollColor,
  SceneHint,
  RoughCutSegment,
  RoughCutTimeline,
  RoughCutVersion,
} from "../types/studio.types";

import { BROLL_COLORS } from "../constants/colors";

// =============================================================================
// Session Management
// =============================================================================

/**
 * Get the active session for a project (there can be at most one).
 */
export async function getActiveSession(
  projectId: string,
): Promise<{ id: string; version: number; aspectRatio: string | null } | null> {
  const session = await db.query.studioSessions.findFirst({
    where: and(
      eq(schema.studioSessions.projectId, projectId),
      eq(schema.studioSessions.status, "active"),
    ),
    columns: { id: true, version: true, aspectRatio: true },
  });
  return session ?? null;
}

/**
 * Create a new active session for a project.
 * Archives the existing active session first if one exists.
 */
export async function createSession({
  projectId,
  userId,
  name,
}: {
  projectId: string;
  userId: string;
  name?: string;
}): Promise<string> {
  // Archive existing active session
  const existing = await getActiveSession(projectId);
  let nextVersion = 1;

  if (existing) {
    await db
      .update(schema.studioSessions)
      .set({ status: "archived", archivedAt: new Date() })
      .where(eq(schema.studioSessions.id, existing.id));
    nextVersion = existing.version + 1;
  }

  // Create new active session
  const [session] = await db
    .insert(schema.studioSessions)
    .values({
      projectId,
      userId,
      version: nextVersion,
      status: "active",
      name: name ?? null,
    })
    .returning({ id: schema.studioSessions.id });

  return session.id;
}

/**
 * Get or create the active session for a project.
 * Returns the existing active session ID, or creates a new one.
 */
export async function getOrCreateActiveSession(
  projectId: string,
  userId: string,
): Promise<string> {
  const existing = await getActiveSession(projectId);
  if (existing) return existing.id;
  return createSession({ projectId, userId });
}

/**
 * Update the aspect ratio for a session.
 */
export async function updateSessionAspectRatio(
  sessionId: string,
  aspectRatio: string,
): Promise<void> {
  await db
    .update(schema.studioSessions)
    .set({ aspectRatio })
    .where(eq(schema.studioSessions.id, sessionId));
}

/**
 * Archive the active session for a project (if any).
 */
export async function archiveActiveSession(
  projectId: string,
): Promise<void> {
  const existing = await getActiveSession(projectId);
  if (existing) {
    await db
      .update(schema.studioSessions)
      .set({ status: "archived", archivedAt: new Date() })
      .where(eq(schema.studioSessions.id, existing.id));
  }
}

/**
 * Get session history for a project (newest first).
 */
export async function getSessionHistory(
  projectId: string,
): Promise<Array<{ id: string; version: number; status: string; name: string | null; createdAt: Date; archivedAt: Date | null }>> {
  return db.query.studioSessions.findMany({
    where: eq(schema.studioSessions.projectId, projectId),
    orderBy: [desc(schema.studioSessions.version)],
    columns: {
      id: true,
      version: true,
      status: true,
      name: true,
      createdAt: true,
      archivedAt: true,
    },
  });
}

/**
 * Get a storyboard scene by its ID (for data layer access from generate-scene-image).
 */
export async function getStoryboardSceneById(
  sceneId: string,
): Promise<{ id: string; projectId: string; sessionId: string | null; sceneNumber: number; visualPrompt: string | null } | null> {
  const scene = await db.query.storyboards.findFirst({
    where: eq(schema.storyboards.id, sceneId),
    columns: {
      id: true,
      projectId: true,
      sessionId: true,
      sceneNumber: true,
      visualPrompt: true,
    },
  });
  return scene ?? null;
}

// =============================================================================
// Types
// =============================================================================

export interface ScriptWithSegments {
  id: string;
  projectId: string;
  sessionId: string | null;
  prompt: string | null;
  targetDuration: number | null;
  savedAt: Date | null;
  // Pre-Production fields
  hooks: string[] | null;
  scriptGuidelines: unknown | null;
  seoKeywords: string[] | null;
  preProductionStatus: string | null;
  segments: ScriptSegment[];
}

export interface SaveScriptInput {
  projectId: string;
  sessionId?: string;
  sourceTrendtubeSessionId?: string;
  prompt?: string | null;
  targetDuration?: number | null;
  segments: Array<{
    id?: string;
    type: "hook" | "intro" | "body" | "cta" | "outro";
    content: string;
    estimatedDuration?: number;
    visualNotes?: string;
    emotionalTone?: string;
    keywords?: string[];
    sceneHints?: unknown;
  }>;
}

// =============================================================================
// Script Data Functions
// =============================================================================

/**
 * Get or create a script record for a project
 */
export async function getOrCreateScript(projectId: string): Promise<string> {
  // Check if script exists
  const existing = await db.query.scripts.findFirst({
    where: eq(schema.scripts.projectId, projectId),
  });

  if (existing) {
    return existing.id;
  }

  // Create new script
  const [script] = await db
    .insert(schema.scripts)
    .values({ projectId })
    .returning({ id: schema.scripts.id });

  return script.id;
}

/**
 * Fetch script with segments for a project
 */
export async function getScriptWithSegments(
  projectId: string
): Promise<ScriptWithSegments | null> {
  const script = await db.query.scripts.findFirst({
    where: eq(schema.scripts.projectId, projectId),
    with: {
      segments: {
        orderBy: [asc(schema.scriptSegments.orderIndex)],
      },
    },
  });

  if (!script) {
    return null;
  }

  return {
    id: script.id,
    projectId: script.projectId,
    sessionId: script.sessionId,
    prompt: script.prompt,
    targetDuration: script.targetDuration,
    savedAt: script.savedAt,
    hooks: script.hooks,
    scriptGuidelines: script.scriptGuidelines,
    seoKeywords: script.seoKeywords,
    preProductionStatus: script.preProductionStatus,
    segments: script.segments.map((seg) => ({
      id: seg.id,
      type: seg.type as ScriptSegment["type"],
      content: seg.content,
      duration: seg.estimatedDuration ?? 0,
      visualNotes: seg.visualNotes ?? undefined,
      emotionalTone: seg.emotionalTone ?? undefined,
      keywords: seg.keywords ?? undefined,
      sceneHints: seg.sceneHints as SceneHint[] | undefined,
    })),
  };
}

/**
 * Save script with segments (upsert operation)
 */
export async function saveScript(input: SaveScriptInput): Promise<void> {
  const { projectId, sessionId, sourceTrendtubeSessionId, prompt, targetDuration, segments } = input;

  // Get or create script
  let script = await db.query.scripts.findFirst({
    where: eq(schema.scripts.projectId, projectId),
  });

  if (script) {
    // Update existing script
    const updateData: Record<string, unknown> = {
      prompt: prompt ?? script.prompt,
      targetDuration: targetDuration ?? script.targetDuration,
      sessionId: sessionId ?? script.sessionId,
      savedAt: new Date(),
    };
    if (sourceTrendtubeSessionId !== undefined) {
      updateData.sourceTrendtubeSessionId = sourceTrendtubeSessionId;
    }
    await db
      .update(schema.scripts)
      .set(updateData)
      .where(eq(schema.scripts.id, script.id));
  } else {
    // Create new script
    const [newScript] = await db
      .insert(schema.scripts)
      .values({
        projectId,
        sessionId,
        prompt,
        targetDuration,
        sourceTrendtubeSessionId: sourceTrendtubeSessionId ?? null,
        savedAt: new Date(),
      })
      .returning();
    script = newScript;
  }

  // Delete existing segments
  await db
    .delete(schema.scriptSegments)
    .where(eq(schema.scriptSegments.scriptId, script.id));

  // Insert new segments
  if (segments.length > 0) {
    await db.insert(schema.scriptSegments).values(
      segments.map((seg, index) => ({
        scriptId: script.id,
        orderIndex: index,
        type: seg.type,
        content: seg.content,
        estimatedDuration: seg.estimatedDuration ?? Math.ceil(seg.content.length / 15),
        visualNotes: seg.visualNotes ?? null,
        emotionalTone: seg.emotionalTone ?? null,
        keywords: seg.keywords ?? null,
        sceneHints: seg.sceneHints ?? null,
      }))
    );
  }
}

/**
 * Update a single script segment
 */
export async function updateScriptSegment(
  segmentId: string,
  content: string
): Promise<void> {
  await db
    .update(schema.scriptSegments)
    .set({
      content,
      estimatedDuration: Math.ceil(content.length / 15),
    })
    .where(eq(schema.scriptSegments.id, segmentId));
}

/**
 * Delete a script segment
 */
export async function deleteScriptSegment(segmentId: string): Promise<void> {
  await db
    .delete(schema.scriptSegments)
    .where(eq(schema.scriptSegments.id, segmentId));
}

/**
 * Add a new segment to a script
 */
export async function addScriptSegment(
  scriptId: string,
  segment: {
    type: "hook" | "intro" | "body" | "cta" | "outro";
    content: string;
    orderIndex: number;
  }
): Promise<string> {
  const [newSegment] = await db
    .insert(schema.scriptSegments)
    .values({
      scriptId,
      type: segment.type,
      content: segment.content,
      orderIndex: segment.orderIndex,
      estimatedDuration: Math.ceil(segment.content.length / 15),
    })
    .returning({ id: schema.scriptSegments.id });

  return newSegment.id;
}

/**
 * Update script prompt (AI generation settings)
 */
export async function updateScriptPrompt(
  projectId: string,
  prompt: string,
  targetDuration?: number
): Promise<void> {
  const script = await db.query.scripts.findFirst({
    where: eq(schema.scripts.projectId, projectId),
  });

  if (script) {
    await db
      .update(schema.scripts)
      .set({ prompt, targetDuration })
      .where(eq(schema.scripts.id, script.id));
  } else {
    await db.insert(schema.scripts).values({
      projectId,
      prompt,
      targetDuration,
    });
  }
}

// =============================================================================
// Storyboard Types
// =============================================================================

export interface StoryboardSceneData {
  id: string;
  sceneNumber: number;
  description: string;
  visualPrompt: string;
  duration: number;
  imageUrl?: string;
  emotionalTone?: string;
  cameraAngle?: string;
}

export interface StoryboardSegmentData {
  id: string;
  scriptSegmentId: string;
  content: string;
  scenes: StoryboardSceneData[];
}

export interface StoryboardWithScenes {
  projectId: string;
  savedAt: Date | null;
  segments: StoryboardSegmentData[];
}

export interface SaveStoryboardInput {
  projectId: string;
  sessionId?: string;
  scenes: Array<{
    scriptSegmentId: string;
    sceneNumber: number;
    orderIndex: number;
    description: string;
    visualPrompt: string;
    duration: number;
    emotionalTone?: string;
    cameraAngle?: string;
  }>;
}

// =============================================================================
// Storyboard Data Functions
// =============================================================================

/**
 * Fetch storyboard with scenes for a project
 * Groups scenes by their associated script segment
 */
export async function getStoryboardWithScenes(
  projectId: string
): Promise<StoryboardWithScenes | null> {
  // First, get the script with segments
  const script = await db.query.scripts.findFirst({
    where: eq(schema.scripts.projectId, projectId),
    with: {
      segments: {
        orderBy: [asc(schema.scriptSegments.orderIndex)],
      },
    },
  });

  if (!script || script.segments.length === 0) {
    return null;
  }

  // Get all storyboards for this project
  const storyboards = await db.query.storyboards.findMany({
    where: eq(schema.storyboards.projectId, projectId),
    orderBy: [asc(schema.storyboards.sceneNumber)],
    with: {
      imageAsset: true,
    },
  });

  // Group storyboards by script segment
  const segmentMap = new Map<string, StoryboardSceneData[]>();

  for (const sb of storyboards) {
    const segmentId = sb.scriptSegmentId;
    if (!segmentMap.has(segmentId)) {
      segmentMap.set(segmentId, []);
    }
    segmentMap.get(segmentId)!.push({
      id: sb.id,
      sceneNumber: sb.sceneNumber,
      description: sb.description ?? "",
      visualPrompt: sb.visualPrompt ?? "",
      duration: sb.duration ?? 5,
      imageUrl: sb.imageAsset?.publicUrl ?? undefined,
      emotionalTone: sb.emotionalTone ?? undefined,
      cameraAngle: sb.cameraAngle ?? undefined,
    });
  }

  // Build segments array
  const segments: StoryboardSegmentData[] = script.segments.map((seg) => ({
    id: seg.id,
    scriptSegmentId: seg.id,
    content: seg.content,
    scenes: segmentMap.get(seg.id) ?? [],
  }));

  return {
    projectId,
    savedAt: script.savedAt,
    segments,
  };
}

/**
 * Save storyboard scenes (upsert operation)
 */
export async function saveStoryboard(input: SaveStoryboardInput): Promise<string[]> {
  const { projectId, sessionId, scenes } = input;

  // Delete existing storyboards for this project (scoped to session if provided)
  if (sessionId) {
    await db
      .delete(schema.storyboards)
      .where(
        and(
          eq(schema.storyboards.projectId, projectId),
          eq(schema.storyboards.sessionId, sessionId),
        ),
      );
  } else {
    await db
      .delete(schema.storyboards)
      .where(eq(schema.storyboards.projectId, projectId));
  }

  // Insert new scenes and return IDs
  let savedIds: string[] = [];
  if (scenes.length > 0) {
    const inserted = await db.insert(schema.storyboards).values(
      scenes.map((scene) => ({
        projectId,
        sessionId,
        scriptSegmentId: scene.scriptSegmentId,
        sceneNumber: scene.sceneNumber,
        orderIndex: scene.orderIndex,
        description: scene.description,
        visualPrompt: scene.visualPrompt,
        duration: scene.duration,
        emotionalTone: scene.emotionalTone ?? null,
        cameraAngle: scene.cameraAngle ?? null,
      }))
    ).returning({ id: schema.storyboards.id });
    savedIds = inserted.map((r) => r.id);
  }

  // Update script savedAt timestamp
  const script = await db.query.scripts.findFirst({
    where: eq(schema.scripts.projectId, projectId),
  });

  if (script) {
    await db
      .update(schema.scripts)
      .set({ savedAt: new Date() })
      .where(eq(schema.scripts.id, script.id));
  }

  return savedIds;
}

/**
 * Update a single storyboard scene
 */
export async function updateStoryboardScene(
  sceneId: string,
  data: {
    description?: string;
    visualPrompt?: string;
    duration?: number;
  }
): Promise<void> {
  await db
    .update(schema.storyboards)
    .set(data)
    .where(eq(schema.storyboards.id, sceneId));
}

/**
 * Delete a storyboard scene
 */
export async function deleteStoryboardScene(sceneId: string): Promise<void> {
  await db
    .delete(schema.storyboards)
    .where(eq(schema.storyboards.id, sceneId));
}

/**
 * Add a new scene to storyboard
 */
export async function addStoryboardScene(
  projectId: string,
  scene: {
    scriptSegmentId: string;
    sceneNumber: number;
    orderIndex: number;
    description: string;
    visualPrompt: string;
    duration: number;
  }
): Promise<string> {
  const [newScene] = await db
    .insert(schema.storyboards)
    .values({
      projectId,
      scriptSegmentId: scene.scriptSegmentId,
      sceneNumber: scene.sceneNumber,
      orderIndex: scene.orderIndex,
      description: scene.description,
      visualPrompt: scene.visualPrompt,
      duration: scene.duration,
    })
    .returning({ id: schema.storyboards.id });

  return newScene.id;
}

// =============================================================================
// Scene Data Functions
// =============================================================================

/**
 * Fetch scene segments for the scene video page
 * Joins scripts → segments → storyboards → sceneVideos
 * Bug fix: loads videoAsset for URL + queries latest video per storyboard
 */
export async function getSceneSegments(
  projectId: string
): Promise<SceneScriptSegment[]> {
  // 1. Script with segments
  const script = await db.query.scripts.findFirst({
    where: eq(schema.scripts.projectId, projectId),
    with: {
      segments: { orderBy: [asc(schema.scriptSegments.orderIndex)] },
    },
  });
  if (!script || script.segments.length === 0) return [];

  // 2. Storyboards with imageAsset
  const storyboards = await db.query.storyboards.findMany({
    where: eq(schema.storyboards.projectId, projectId),
    orderBy: [asc(schema.storyboards.sceneNumber)],
    with: {
      imageAsset: true,
    },
  });

  // 3. Fetch all scene videos separately, ordered by createdAt DESC
  //    to guarantee we pick the latest video per storyboard
  const allVideos = await db.query.sceneVideos.findMany({
    where: eq(schema.sceneVideos.projectId, projectId),
    orderBy: [desc(schema.sceneVideos.createdAt)],
    with: {
      videoAsset: true,
    },
  });

  // Build storyboardId → latest video map (first entry wins = most recent)
  const latestVideoMap = new Map<string, (typeof allVideos)[0]>();
  for (const v of allVideos) {
    if (!latestVideoMap.has(v.storyboardId)) {
      latestVideoMap.set(v.storyboardId, v);
    }
  }

  // 4. Group by script segment
  const segmentMap = new Map<string, SceneVideo[]>();
  for (const sb of storyboards) {
    if (!segmentMap.has(sb.scriptSegmentId)) {
      segmentMap.set(sb.scriptSegmentId, []);
    }

    const video = latestVideoMap.get(sb.id);
    const videoUrl = video?.videoAsset?.publicUrl ?? undefined;
    const videoStatus = (video?.status as SceneVideo["status"]) ?? "pending";

    segmentMap.get(sb.scriptSegmentId)!.push({
      sceneId: sb.id,
      sceneNumber: sb.sceneNumber,
      description: sb.description ?? "",
      thumbnailUrl: sb.imageAsset?.publicUrl ?? "",
      duration: sb.duration ?? 8,
      status: video ? videoStatus : "pending",
      videoUrl,
    });
  }

  // 5. Build result
  return script.segments.map((seg, idx) => ({
    id: seg.id,
    order: idx + 1,
    content: seg.content,
    scenes: segmentMap.get(seg.id) ?? [],
  }));
}

// =============================================================================
// Scene Video Data Functions
// =============================================================================

/**
 * Create a scene video record for a storyboard scene
 */
export async function createSceneVideo({
  storyboardId,
  projectId,
  sessionId,
  duration,
}: {
  storyboardId: string;
  projectId: string;
  sessionId: string;
  duration: number;
}): Promise<string> {
  const [video] = await db
    .insert(schema.sceneVideos)
    .values({
      storyboardId,
      projectId,
      sessionId,
      duration,
      status: "generating",
    })
    .returning({ id: schema.sceneVideos.id });

  return video.id;
}

/**
 * Update a scene video's overall status
 */
export async function updateSceneVideoStatus(
  videoId: string,
  status: string,
): Promise<void> {
  await db
    .update(schema.sceneVideos)
    .set({ status: status as "pending" | "generating" | "completed" | "failed" })
    .where(eq(schema.sceneVideos.id, videoId));
}

/**
 * Get a storyboard scene with full details for video generation
 */
export async function getStoryboardSceneForVideo(
  sceneId: string,
): Promise<{
  id: string;
  projectId: string;
  sessionId: string | null;
  sceneNumber: number;
  description: string | null;
  visualPrompt: string | null;
  duration: number | null;
  imageAsset: { id: string; publicUrl: string; storageKey: string } | null;
} | null> {
  const scene = await db.query.storyboards.findFirst({
    where: eq(schema.storyboards.id, sceneId),
    with: {
      imageAsset: {
        columns: { id: true, publicUrl: true, storageKey: true },
      },
    },
  });
  if (!scene) return null;
  return {
    id: scene.id,
    projectId: scene.projectId,
    sessionId: scene.sessionId,
    sceneNumber: scene.sceneNumber,
    description: scene.description,
    visualPrompt: scene.visualPrompt,
    duration: scene.duration,
    imageAsset: scene.imageAsset
      ? { id: scene.imageAsset.id, publicUrl: scene.imageAsset.publicUrl, storageKey: scene.imageAsset.storageKey }
      : null,
  };
}

/**
 * Update a scene video's status and optionally link a video asset directly
 */
export async function updateSceneVideoAsset(
  videoId: string,
  data: { status: string; videoAssetId?: string },
): Promise<void> {
  await db
    .update(schema.sceneVideos)
    .set({
      status: data.status as "pending" | "generating" | "completed" | "failed",
      videoAssetId: data.videoAssetId ?? undefined,
    })
    .where(eq(schema.sceneVideos.id, videoId));
}

/**
 * Get video history for a storyboard scene (newest first)
 */
export async function getSceneVideoHistory(
  storyboardId: string,
): Promise<Array<{ id: string; status: string; videoUrl: string | null; createdAt: Date | null }>> {
  const videos = await db.query.sceneVideos.findMany({
    where: eq(schema.sceneVideos.storyboardId, storyboardId),
    orderBy: [desc(schema.sceneVideos.createdAt)],
    with: {
      videoAsset: true,
    },
  });
  return videos.map((v) => ({
    id: v.id,
    status: v.status ?? "pending",
    videoUrl: v.videoAsset?.publicUrl ?? null,
    createdAt: v.createdAt,
  }));
}

/**
 * Select a specific scene video version as the latest by updating its createdAt
 */
export async function selectSceneVideo(videoId: string): Promise<void> {
  await db
    .update(schema.sceneVideos)
    .set({ createdAt: new Date() })
    .where(eq(schema.sceneVideos.id, videoId));
}

// =============================================================================
// Studio Project Data Functions
// =============================================================================

const STATUS_DISPLAY_MAP: Record<string, string> = {
  draft: "초안",
  in_progress: "진행중",
  completed: "완료",
  archived: "보관",
};

/**
 * Fetch all projects for a user formatted for StudioProjectSelector
 */
export async function getStudioProjects(userId: string): Promise<StudioProject[]> {
  const projectList = await db.query.projects.findMany({
    where: eq(schema.projects.ownerId, userId),
    orderBy: [desc(schema.projects.updatedAt)],
    with: {
      channel: { columns: { name: true } },
      labels: { with: { label: { columns: { name: true, color: true } } } },
    },
  });

  return projectList.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description ?? undefined,
    thumbnail: p.thumbnailUrl ?? undefined,
    status: STATUS_DISPLAY_MAP[p.status] ?? p.status,
    lastEdited: formatDistanceToNow(p.updatedAt, { addSuffix: true }),
    progress: p.progress,
    channel: p.channel?.name ?? "",
    labels: p.labels.map((pl) => ({ name: pl.label.name, color: pl.label.color })),
    type: p.type as "short" | "long" | undefined,
    contentTone: p.contentTone ?? undefined,
    videoLength: p.videoLength ?? undefined,
    difficulty: p.difficulty ?? undefined,
    category: p.category ?? undefined,
    targetAudience: p.targetAudience ?? undefined,
    estimatedViews: p.estimatedViews ?? undefined,
    basedOnTrend: p.basedOnTrend ?? undefined,
  }));
}

// =============================================================================
// Phase 2+ Data Functions (Subtitles, Coloring, Thumbnail, SEO, B-Roll)
// =============================================================================

/**
 * Fetch subtitles for a project (with script segment context)
 */
export async function getSubtitles(
  projectId: string
): Promise<SubtitleSegment[]> {
  const subs = await db.query.subtitles.findMany({
    where: eq(schema.subtitles.projectId, projectId),
    orderBy: [
      asc(schema.subtitles.orderIndex),
      asc(schema.subtitles.startTime),
    ],
    with: {
      scriptSegment: {
        columns: { id: true, type: true, content: true },
      },
    },
  });
  return subs.map((s) => ({
    id: s.id,
    startTime: s.startTime,
    endTime: s.endTime,
    text: s.text,
    orderIndex: s.orderIndex,
    scriptSegmentId: s.scriptSegmentId ?? undefined,
    scriptSegmentType: s.scriptSegment?.type ?? undefined,
    scriptSegmentContent: s.scriptSegment?.content?.slice(0, 80) ?? undefined,
  }));
}

/**
 * Bulk save subtitles (replaces all for a project)
 */
export async function saveSubtitles(input: {
  projectId: string;
  sessionId?: string;
  subtitles: Array<{
    scriptSegmentId?: string;
    orderIndex: number;
    startTime: number;
    endTime: number;
    text: string;
  }>;
}): Promise<void> {
  const { projectId, sessionId, subtitles: subs } = input;

  // Delete existing subtitles for this project
  await db
    .delete(schema.subtitles)
    .where(eq(schema.subtitles.projectId, projectId));

  // Insert new subtitles
  if (subs.length > 0) {
    await db.insert(schema.subtitles).values(
      subs.map((sub) => ({
        projectId,
        sessionId: sessionId ?? null,
        scriptSegmentId: sub.scriptSegmentId ?? null,
        orderIndex: sub.orderIndex,
        startTime: sub.startTime,
        endTime: sub.endTime,
        text: sub.text,
      }))
    );
  }
}

/**
 * Update a single subtitle
 */
export async function updateSubtitle(
  subtitleId: string,
  data: { startTime?: number; endTime?: number; text?: string }
): Promise<void> {
  await db
    .update(schema.subtitles)
    .set(data)
    .where(eq(schema.subtitles.id, subtitleId));
}

/**
 * Delete a single subtitle
 */
export async function deleteSubtitle(subtitleId: string): Promise<void> {
  await db
    .delete(schema.subtitles)
    .where(eq(schema.subtitles.id, subtitleId));
}

/**
 * Add a single subtitle
 */
export async function addSubtitle(input: {
  projectId: string;
  sessionId?: string;
  scriptSegmentId?: string;
  orderIndex: number;
  startTime: number;
  endTime: number;
  text: string;
}): Promise<string> {
  const [sub] = await db
    .insert(schema.subtitles)
    .values({
      projectId: input.projectId,
      sessionId: input.sessionId ?? null,
      scriptSegmentId: input.scriptSegmentId ?? null,
      orderIndex: input.orderIndex,
      startTime: input.startTime,
      endTime: input.endTime,
      text: input.text,
    })
    .returning({ id: schema.subtitles.id });
  return sub.id;
}

/**
 * Fetch thumbnail candidate image URLs for a project
 */
export async function getThumbnailImages(
  projectId: string
): Promise<string[]> {
  const thumbnail = await db.query.thumbnails.findFirst({
    where: eq(schema.thumbnails.projectId, projectId),
    with: {
      candidates: { with: { imageAsset: true } },
    },
  });
  if (!thumbnail?.candidates) return [];
  return thumbnail.candidates
    .map((c) => c.imageAsset?.publicUrl)
    .filter((url): url is string => url != null);
}

/**
 * Fetch SEO title suggestions for a project
 * Returns saved title(s) from DB; AI-generated suggestions are transient
 */
export async function getSEOTitles(
  projectId: string
): Promise<string[]> {
  const seo = await db.query.seos.findFirst({
    where: eq(schema.seos.projectId, projectId),
  });
  return seo?.title ? [seo.title] : [];
}

/**
 * Fetch SEO tags for a project
 */
export async function getSEOTags(
  projectId: string
): Promise<string[]> {
  const seo = await db.query.seos.findFirst({
    where: eq(schema.seos.projectId, projectId),
  });
  return seo?.tags ?? [];
}

/**
 * Fetch stock videos (external API search results - not stored in DB)
 */
export async function getStockVideos(): Promise<StockVideo[]> {
  return [];
}

/**
 * Fetch B-Roll scene contexts for a project
 * Constructs from storyboard scenes with potential b-roll assignments
 */
export async function getBRollScenes(
  projectId: string
): Promise<BRollSceneContext[]> {
  const storyboardList = await db.query.storyboards.findMany({
    where: eq(schema.storyboards.projectId, projectId),
    orderBy: [asc(schema.storyboards.sceneNumber)],
  });
  return storyboardList.map((sb, idx) => ({
    id: sb.id,
    order: idx + 1,
    content: sb.description ?? "",
    keyword: (sb.description ?? "").split(" ").slice(0, 2).join(" "),
    assignedVideo: undefined,
  }));
}

/**
 * Get B-Roll color filter options (UI constant)
 */
export function getBRollColors(): BRollColor[] {
  return BROLL_COLORS;
}

// =============================================================================
// Rough Cut Data Functions
// =============================================================================

/**
 * Get or create the rough cut timeline for a project (1:1 per project).
 * Resolves publicUrl/thumbnailUrl for scene-type segments via storyboard → video → mediaAsset join.
 */
export async function getOrCreateRoughCutTimeline(
  projectId: string,
): Promise<RoughCutTimeline> {
  let timeline = await db.query.roughCutTimelines.findFirst({
    where: eq(schema.roughCutTimelines.projectId, projectId),
    with: {
      segments: {
        orderBy: [asc(schema.roughCutTimelineSegments.startTime)],
      },
    },
  });

  if (!timeline) {
    const [created] = await db
      .insert(schema.roughCutTimelines)
      .values({ projectId })
      .returning();
    timeline = { ...created, segments: [] };
  }

  // Resolve publicUrl/thumbnailUrl for scene segments
  const sceneResourceIds = timeline.segments
    .filter((s) => s.resourceType === "scene")
    .map((s) => s.resourceId);

  const resolvedMap = new Map<
    string,
    { publicUrl?: string; thumbnailUrl?: string; sceneNumber?: number }
  >();

  if (sceneResourceIds.length > 0) {
    // Fetch storyboards with imageAsset and latest video
    const storyboards = await db.query.storyboards.findMany({
      where: eq(schema.storyboards.projectId, projectId),
      orderBy: [asc(schema.storyboards.sceneNumber)],
      with: { imageAsset: true },
    });

    const allVideos = await db.query.sceneVideos.findMany({
      where: eq(schema.sceneVideos.projectId, projectId),
      orderBy: [desc(schema.sceneVideos.createdAt)],
      with: { videoAsset: true },
    });

    const latestVideoMap = new Map<string, (typeof allVideos)[0]>();
    for (const v of allVideos) {
      if (!latestVideoMap.has(v.storyboardId)) {
        latestVideoMap.set(v.storyboardId, v);
      }
    }

    for (const sb of storyboards) {
      const video = latestVideoMap.get(sb.id);
      resolvedMap.set(sb.id, {
        publicUrl: video?.videoAsset?.publicUrl ?? undefined,
        thumbnailUrl: sb.imageAsset?.publicUrl ?? undefined,
        sceneNumber: sb.sceneNumber,
      });
    }
  }

  const segments: RoughCutSegment[] = timeline.segments.map((s) => {
    const resolved = resolvedMap.get(s.resourceId);
    return {
      id: s.id,
      trackId: s.trackId,
      type: s.type as "video" | "audio",
      resourceType: s.resourceType as RoughCutSegment["resourceType"],
      resourceId: s.resourceId,
      startTime: s.startTime,
      duration: s.duration,
      trimStart: s.trimStart ?? 0,
      trimEnd: s.trimEnd ?? null,
      playbackSpeed: s.playbackSpeed ?? 1,
      volume: s.volume ?? 1,
      zIndex: s.zIndex ?? 0,
      publicUrl: resolved?.publicUrl,
      thumbnailUrl: resolved?.thumbnailUrl,
      label: resolved?.sceneNumber != null
        ? `씬 ${resolved.sceneNumber}`
        : undefined,
    };
  });

  return {
    id: timeline.id,
    projectId,
    zoomScale: timeline.zoomScale ?? 30,
    playheadPosition: timeline.playheadPosition ?? 0,
    segments,
  };
}

/**
 * Save rough cut segments (full replace strategy).
 */
export async function saveRoughCutSegments(input: {
  timelineId: string;
  segments: Array<{
    trackId: string;
    type: "video" | "audio";
    resourceType: "scene" | "b_roll" | "upload" | "audio";
    resourceId: string;
    startTime: number;
    duration: number;
    trimStart?: number;
    trimEnd?: number | null;
    playbackSpeed?: number;
    volume?: number;
    zIndex?: number;
  }>;
}): Promise<void> {
  const { timelineId, segments } = input;

  // Delete existing segments
  await db
    .delete(schema.roughCutTimelineSegments)
    .where(eq(schema.roughCutTimelineSegments.timelineId, timelineId));

  // Insert new segments
  if (segments.length > 0) {
    await db.insert(schema.roughCutTimelineSegments).values(
      segments.map((seg) => ({
        timelineId,
        trackId: seg.trackId,
        type: seg.type,
        resourceType: seg.resourceType,
        resourceId: seg.resourceId,
        startTime: seg.startTime,
        duration: seg.duration,
        trimStart: seg.trimStart ?? 0,
        trimEnd: seg.trimEnd ?? undefined,
        playbackSpeed: seg.playbackSpeed ?? 1,
        volume: seg.volume ?? 1,
        zIndex: seg.zIndex ?? 0,
      })),
    );
  }

  // Update timeline updatedAt
  await db
    .update(schema.roughCutTimelines)
    .set({ updatedAt: new Date() })
    .where(eq(schema.roughCutTimelines.id, timelineId));
}

/**
 * Update rough cut timeline metadata (zoom scale, playhead position).
 */
export async function updateRoughCutTimelineMeta(
  timelineId: string,
  data: { zoomScale?: number; playheadPosition?: number },
): Promise<void> {
  await db
    .update(schema.roughCutTimelines)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.roughCutTimelines.id, timelineId));
}

/**
 * Create a new rough cut version after rendering.
 */
export async function createRoughCutVersion(input: {
  projectId: string;
  name: string;
  description?: string;
  videoAssetId: string;
  duration: number;
}): Promise<string> {
  const [countResult] = await db
    .select({ value: drizzleCount() })
    .from(schema.roughCutVersions)
    .where(eq(schema.roughCutVersions.projectId, input.projectId));

  const versionNumber = (countResult?.value ?? 0) + 1;

  const [version] = await db
    .insert(schema.roughCutVersions)
    .values({
      projectId: input.projectId,
      name: input.name,
      description: input.description ?? null,
      versionNumber,
      videoAssetId: input.videoAssetId,
      duration: input.duration,
    })
    .returning({ id: schema.roughCutVersions.id });

  return version.id;
}

/**
 * List rough cut versions for a project (newest first).
 */
export async function getRoughCutVersions(
  projectId: string,
): Promise<RoughCutVersion[]> {
  const versions = await db.query.roughCutVersions.findMany({
    where: eq(schema.roughCutVersions.projectId, projectId),
    orderBy: [desc(schema.roughCutVersions.createdAt)],
    with: {
      videoAsset: true,
    },
  });

  return versions.map((v) => ({
    id: v.id,
    name: v.name,
    versionNumber: v.versionNumber,
    duration: v.duration,
    videoUrl: v.videoAsset?.publicUrl ?? null,
    createdAt: v.createdAt?.toISOString() ?? null,
  }));
}
