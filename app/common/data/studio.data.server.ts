// =============================================================================
// Studio Data Access Layer (Server-side)
// =============================================================================
// This layer handles all Supabase database operations for the Studio feature.

import { eq, asc, and, desc } from "drizzle-orm";
import { db, schema } from "~/lib/db.server";
import { formatDistanceToNow } from "date-fns";
import type {
  ScriptSegment,
  SceneScriptSegment,
  SceneVideo,
  VideoPart,
  StudioProject,
  SubtitleSegment,
  ColorPreset,
  StockVideo,
  BRollSceneContext,
  BRollColor,
} from "../types/studio.types";
import { BROLL_COLORS } from "../constants/colors";

// =============================================================================
// Types
// =============================================================================

export interface ScriptWithSegments {
  id: string;
  projectId: string;
  prompt: string | null;
  targetDuration: number | null;
  savedAt: Date | null;
  segments: ScriptSegment[];
}

export interface SaveScriptInput {
  projectId: string;
  prompt?: string | null;
  targetDuration?: number | null;
  segments: Array<{
    id?: string;
    type: "hook" | "intro" | "body" | "cta" | "outro";
    content: string;
    estimatedDuration?: number;
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
    prompt: script.prompt,
    targetDuration: script.targetDuration,
    savedAt: script.savedAt,
    segments: script.segments.map((seg) => ({
      id: seg.id,
      type: seg.type as ScriptSegment["type"],
      content: seg.content,
      duration: seg.estimatedDuration ?? 0,
    })),
  };
}

/**
 * Save script with segments (upsert operation)
 */
export async function saveScript(input: SaveScriptInput): Promise<void> {
  const { projectId, prompt, targetDuration, segments } = input;

  // Get or create script
  let script = await db.query.scripts.findFirst({
    where: eq(schema.scripts.projectId, projectId),
  });

  if (script) {
    // Update existing script
    await db
      .update(schema.scripts)
      .set({
        prompt: prompt ?? script.prompt,
        targetDuration: targetDuration ?? script.targetDuration,
        savedAt: new Date(),
      })
      .where(eq(schema.scripts.id, script.id));
  } else {
    // Create new script
    const [newScript] = await db
      .insert(schema.scripts)
      .values({
        projectId,
        prompt,
        targetDuration,
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
  scenes: Array<{
    scriptSegmentId: string;
    sceneNumber: number;
    orderIndex: number;
    description: string;
    visualPrompt: string;
    duration: number;
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
export async function saveStoryboard(input: SaveStoryboardInput): Promise<void> {
  const { projectId, scenes } = input;

  // Delete existing storyboards for this project
  await db
    .delete(schema.storyboards)
    .where(eq(schema.storyboards.projectId, projectId));

  // Insert new scenes
  if (scenes.length > 0) {
    await db.insert(schema.storyboards).values(
      scenes.map((scene) => ({
        projectId,
        scriptSegmentId: scene.scriptSegmentId,
        sceneNumber: scene.sceneNumber,
        orderIndex: scene.orderIndex,
        description: scene.description,
        visualPrompt: scene.visualPrompt,
        duration: scene.duration,
      }))
    );
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
 * Joins scripts → segments → storyboards → sceneVideos → videoParts
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

  // 2. Storyboards with sceneVideo + videoParts
  const storyboards = await db.query.storyboards.findMany({
    where: eq(schema.storyboards.projectId, projectId),
    orderBy: [asc(schema.storyboards.sceneNumber)],
    with: {
      imageAsset: true,
      sceneVideo: {
        with: {
          parts: { orderBy: [asc(schema.videoParts.partNumber)] },
          videoAsset: true,
        },
      },
    },
  });

  // 3. Group by script segment
  const segmentMap = new Map<string, SceneVideo[]>();
  for (const sb of storyboards) {
    if (!segmentMap.has(sb.scriptSegmentId)) {
      segmentMap.set(sb.scriptSegmentId, []);
    }

    let parts: VideoPart[];
    if (sb.sceneVideo && sb.sceneVideo.parts.length > 0) {
      parts = sb.sceneVideo.parts.map((p) => ({
        id: p.id,
        duration: p.duration,
        status: p.status as VideoPart["status"],
      }));
    } else {
      // No video/parts yet → default pending part
      parts = [{
        id: `pending-${sb.id}`,
        duration: sb.duration ?? 5,
        status: "pending" as const,
      }];
    }

    segmentMap.get(sb.scriptSegmentId)!.push({
      sceneId: sb.id,
      sceneNumber: sb.sceneNumber,
      description: sb.description ?? "",
      thumbnailUrl: sb.imageAsset?.publicUrl ?? "",
      totalDuration: sb.duration ?? 5,
      parts,
    });
  }

  // 4. Build result
  return script.segments.map((seg, idx) => ({
    id: seg.id,
    order: idx + 1,
    content: seg.content,
    scenes: segmentMap.get(seg.id) ?? [],
  }));
}

// =============================================================================
// Studio Project Data Functions
// =============================================================================

const STATUS_DISPLAY_MAP: Record<string, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  completed: "Completed",
  archived: "Archived",
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
      labels: { with: { label: { columns: { name: true } } } },
    },
  });

  return projectList.map((p) => ({
    id: p.id,
    title: p.title,
    status: STATUS_DISPLAY_MAP[p.status] ?? p.status,
    lastEdited: formatDistanceToNow(p.updatedAt, { addSuffix: true }),
    progress: p.progress,
    channel: p.channel?.name ?? "",
    labels: p.labels.map((pl) => pl.label.name),
  }));
}

// =============================================================================
// Phase 2+ Data Functions (Subtitles, Coloring, Thumbnail, SEO, B-Roll)
// =============================================================================

/**
 * Fetch subtitles for a project
 */
export async function getSubtitles(
  projectId: string
): Promise<SubtitleSegment[]> {
  const subs = await db.query.subtitles.findMany({
    where: eq(schema.subtitles.projectId, projectId),
    orderBy: [asc(schema.subtitles.startTime)],
  });
  return subs.map((s) => ({
    id: s.id,
    startTime: s.startTime,
    endTime: s.endTime,
    text: s.text,
  }));
}

/**
 * Fetch color grading presets
 */
export async function getColorPresets(): Promise<ColorPreset[]> {
  const presets = await db.query.coloringPresets.findMany();
  return presets.map((p) => ({
    id: p.id,
    name: p.name,
    filter: (p.filterParameters as { filter: string }).filter ?? "none",
    previewColor:
      (p.filterParameters as { previewColor: string }).previewColor ??
      "bg-zinc-500",
  }));
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
