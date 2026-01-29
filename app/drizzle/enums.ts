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
]);

export const exportResolutionEnum = tubegaiSchema.enum("export_resolution", [
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
// DISABLED: Phase 2+ Enums
// ============================================

/*
// Channel
export const channelStatusEnum = tubegaiSchema.enum("channel_status", [
  "active", "disconnected", "error"
]);

// Pipeline
export const pipelinePhaseEnum = tubegaiSchema.enum("pipeline_phase", [
  "planning", "production", "post_production", "review", "completed"
]);
export const stepStatusEnum = tubegaiSchema.enum("step_status", [
  "pending", "in_progress", "completed"
]);

// B-Roll
export const bRollProviderEnum = tubegaiSchema.enum("b_roll_provider", [
  "pexels", "pixabay", "unsplash", "custom"
]);

// Timeline (Rough Cut)
export const timelineTrackTypeEnum = tubegaiSchema.enum("timeline_track_type", [
  "video", "audio"
]);
export const timelineResourceTypeEnum = tubegaiSchema.enum("timeline_resource_type", [
  "scene", "b_roll", "upload", "audio"
]);

// Thumbnail
export const thumbnailOverlayTypeEnum = tubegaiSchema.enum("thumbnail_overlay_type", [
  "text", "image"
]);

// Settings: Subscription
export const subscriptionPlanEnum = tubegaiSchema.enum("subscription_plan", [
  "free", "pro", "enterprise"
]);
export const subscriptionStatusEnum = tubegaiSchema.enum("subscription_status", [
  "active", "canceled", "past_due"
]);
export const billingCycleEnum = tubegaiSchema.enum("billing_cycle", [
  "monthly", "yearly"
]);
export const paymentStatusEnum = tubegaiSchema.enum("payment_status", [
  "paid", "pending", "failed"
]);

// Settings: Integration
export const integrationProviderEnum = tubegaiSchema.enum("integration_provider", [
  "youtube", "gemini", "pexels", "openai", "elevenlabs"
]);
export const integrationStatusEnum = tubegaiSchema.enum("integration_status", [
  "active", "inactive", "error"
]);
export const mcpStatusEnum = tubegaiSchema.enum("mcp_status", [
  "connected", "disconnected", "error"
]);

// AI Cache
export const aiGenerationTypeEnum = tubegaiSchema.enum("ai_generation_type", [
  "image", "video", "script", "seo"
]);
*/
