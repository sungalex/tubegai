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
