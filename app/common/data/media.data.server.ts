// =============================================================================
// Media Asset Data Access Layer (Server-side)
// =============================================================================
// This layer handles all Supabase database operations for media assets.

import { eq } from "drizzle-orm";
import { db, schema } from "~/lib/db.server";

// =============================================================================
// Types
// =============================================================================

export interface CreateMediaAssetInput {
  userId: string;
  projectId: string;
  type: "image" | "video" | "audio";
  storageKey: string;
  publicUrl: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface MediaAsset {
  id: string;
  userId: string;
  projectId: string | null;
  type: "image" | "video" | "audio";
  storageKey: string;
  publicUrl: string;
  fileSize: number;
  mimeType: string;
  width: number | null;
  height: number | null;
  duration: number | null;
  createdAt: Date;
}

// =============================================================================
// Media Asset Functions
// =============================================================================

/**
 * Create a new media asset record
 */
export async function createMediaAsset(
  input: CreateMediaAssetInput
): Promise<string> {
  const [asset] = await db
    .insert(schema.mediaAssets)
    .values({
      userId: input.userId,
      projectId: input.projectId,
      type: input.type,
      storageKey: input.storageKey,
      publicUrl: input.publicUrl,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      width: input.width,
      height: input.height,
      duration: input.duration,
    })
    .returning({ id: schema.mediaAssets.id });

  return asset.id;
}

/**
 * Get a media asset by ID
 */
export async function getMediaAssetById(
  assetId: string
): Promise<MediaAsset | null> {
  const asset = await db.query.mediaAssets.findFirst({
    where: eq(schema.mediaAssets.id, assetId),
  });

  if (!asset) {
    return null;
  }

  return {
    id: asset.id,
    userId: asset.userId,
    projectId: asset.projectId,
    type: asset.type as "image" | "video" | "audio",
    storageKey: asset.storageKey,
    publicUrl: asset.publicUrl,
    fileSize: Number(asset.fileSize),
    mimeType: asset.mimeType,
    width: asset.width,
    height: asset.height,
    duration: asset.duration,
    createdAt: asset.createdAt,
  };
}

/**
 * Delete a media asset by ID
 */
export async function deleteMediaAsset(assetId: string): Promise<void> {
  await db
    .delete(schema.mediaAssets)
    .where(eq(schema.mediaAssets.id, assetId));
}

/**
 * Link an image asset to a storyboard scene
 */
export async function linkImageToStoryboard(
  storyboardId: string,
  imageAssetId: string
): Promise<void> {
  await db
    .update(schema.storyboards)
    .set({ imageAssetId })
    .where(eq(schema.storyboards.id, storyboardId));
}

/**
 * Get the storyboard scene by ID with its image asset
 */
export async function getStoryboardSceneWithImage(sceneId: string) {
  const scene = await db.query.storyboards.findFirst({
    where: eq(schema.storyboards.id, sceneId),
    with: {
      imageAsset: true,
    },
  });

  return scene;
}
