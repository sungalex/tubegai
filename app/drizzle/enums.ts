/**
 * ============================================
 * Drizzle Enums - MVP Version
 * ============================================
 *
 * MVP Enums:
 * - Media: mediaTypeEnum, mediaProviderEnum
 * - Project: projectTypeEnum, projectToneEnum, projectVisibilityEnum, projectStatusEnum
 * - Studio: scriptSegmentTypeEnum, sceneVideoStatusEnum
 * - Export: exportFormatEnum, exportResolutionEnum, exportStatusEnum, uploadStatusEnum
 *
 * DISABLED (Phase 2+):
 * - Channel, Pipeline, B-Roll, Timeline, Thumbnail, Settings enums
 */

import { tubegaiSchema } from "./schema-def";

// ============================================
// MVP Enums: Media
// ============================================

export const mediaTypeEnum = tubegaiSchema.enum("media_type", [
  "image",
  "video",
  "audio",
]);

export const mediaProviderEnum = tubegaiSchema.enum("media_provider", [
  "s3",
  "r2",
  "local",
]);

// ============================================
// MVP Enums: Project Core
// ============================================

export const projectTypeEnum = tubegaiSchema.enum("project_type", [
  "short",
  "long",
]);

export const projectToneEnum = tubegaiSchema.enum("project_tone", [
  "informative",
  "funny",
  "cinematic",
  "vlog",
]);

export const projectVisibilityEnum = tubegaiSchema.enum("project_visibility", [
  "public",
  "private",
]);

export const projectStatusEnum = tubegaiSchema.enum("project_status", [
  "draft",
  "in_progress",
  "completed",
  "archived",
]);

// ============================================
// MVP Enums: Studio (Script, Storyboard, Scene)
// ============================================

export const scriptSegmentTypeEnum = tubegaiSchema.enum("script_segment_type", [
  "hook",
  "intro",
  "body",
  "cta",
  "outro",
]);

export const sceneVideoStatusEnum = tubegaiSchema.enum("scene_video_status", [
  "pending",
  "generating",
  "completed",
  "failed",
]);

// ============================================
// MVP Enums: Delivery (Export)
// ============================================

export const exportFormatEnum = tubegaiSchema.enum("export_format", [
  "mp4",
  "mov",
  "webm", // Phase 2: Added webm format
]);

export const exportResolutionEnum = tubegaiSchema.enum("export_resolution", [
  "720p", // Phase 2: Added 720p resolution
  "1080p",
  "4k",
]);

export const exportStatusEnum = tubegaiSchema.enum("export_status", [
  "pending",
  "completed",
  "failed",
]);

export const uploadStatusEnum = tubegaiSchema.enum("upload_status", [
  "not_uploaded",
  "uploaded",
]);

// ============================================
// Phase 1 Enums (MVP Critical)
// ============================================

export const channelStatusEnum = tubegaiSchema.enum("channel_status", [
  "active",
  "error",
  "syncing",
]);

export const trendSourceEnum = tubegaiSchema.enum("trend_source", [
  "youtube_api",
  "ai_generated",
  "manual",
]);

// ============================================
// Phase 2+ Enums (Enabled for MVP)
// ============================================

// B-Roll
export const bRollProviderEnum = tubegaiSchema.enum("b_roll_provider", [
  "pexels",
  "pixabay",
  "unsplash",
  "custom",
]);

// AI Cache
export const aiGenerationTypeEnum = tubegaiSchema.enum("ai_generation_type", [
  "image",
  "video",
  "script",
  "seo",
]);
