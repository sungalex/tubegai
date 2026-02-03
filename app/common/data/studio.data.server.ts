// =============================================================================
// Studio Data Access Layer (Server-side)
// =============================================================================
// This layer handles all Supabase database operations for the Studio feature.

import { eq, asc, and } from "drizzle-orm";
import { db, schema } from "~/lib/db.server";
import type { ScriptSegment } from "../types/studio.types";

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
