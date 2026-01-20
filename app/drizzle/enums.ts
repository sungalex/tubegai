import { pgEnum } from "drizzle-orm/pg-core";

// Foundation & Identity
export const channelStatusEnum = pgEnum("channel_status", [
  "active",
  "disconnected",
  "error",
]);
export const mediaTypeEnum = pgEnum("media_type", ["image", "video", "audio"]);
export const mediaProviderEnum = pgEnum("media_provider", [
  "s3",
  "r2",
  "local",
]);

// Project Core
export const projectTypeEnum = pgEnum("project_type", ["short", "long"]);
export const projectToneEnum = pgEnum("project_tone", [
  "informative",
  "funny",
  "cinematic",
  "vlog",
]);
export const projectVisibilityEnum = pgEnum("project_visibility", [
  "public",
  "private",
]);
export const projectStatusEnum = pgEnum("project_status", [
  "draft",
  "in_progress",
  "completed",
  "archived",
]);

// Pipeline
export const pipelinePhaseEnum = pgEnum("pipeline_phase", [
  "planning",
  "production",
  "post_production",
  "review",
  "completed",
]);
export const stepStatusEnum = pgEnum("step_status", [
  "pending",
  "in_progress",
  "completed",
]);

// Studio: Pre-Production
export const scriptSegmentTypeEnum = pgEnum("script_segment_type", [
  "hook",
  "intro",
  "body",
  "cta",
  "outro",
]);

// Studio: Production (Assets)
export const sceneVideoStatusEnum = pgEnum("scene_video_status", [
  "generating",
  "completed",
  "failed",
]);
export const bRollProviderEnum = pgEnum("b_roll_provider", [
  "pexels",
  "pixabay",
  "unsplash",
  "custom",
]);

// Studio: Production (Rough Cut)
export const timelineTrackTypeEnum = pgEnum("timeline_track_type", [
  "video",
  "audio",
]);
export const timelineResourceTypeEnum = pgEnum("timeline_resource_type", [
  "scene",
  "b_roll",
  "upload",
  "audio",
]);

// Studio: Post-Production
export const thumbnailOverlayTypeEnum = pgEnum("thumbnail_overlay_type", [
  "text",
  "image",
]);

// Delivery
export const exportFormatEnum = pgEnum("export_format", ["mp4", "mov"]);
export const exportResolutionEnum = pgEnum("export_resolution", [
  "1080p",
  "4k",
]);
export const exportStatusEnum = pgEnum("export_status", [
  "pending",
  "completed",
  "failed",
]);
export const uploadStatusEnum = pgEnum("upload_status", [
  "not_uploaded",
  "uploaded",
]);

// Settings
export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "free",
  "pro",
  "enterprise",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
]);
export const billingCycleEnum = pgEnum("billing_cycle", ["monthly", "yearly"]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "paid",
  "pending",
  "failed",
]);
export const integrationProviderEnum = pgEnum("integration_provider", [
  "youtube",
  "gemini",
  "pexels",
  "openai",
  "elevenlabs",
]);
export const integrationStatusEnum = pgEnum("integration_status", [
  "active",
  "inactive",
  "error",
]);
export const mcpStatusEnum = pgEnum("mcp_status", [
  "connected",
  "disconnected",
  "error",
]);

// AI Resource Optimization
export const aiGenerationTypeEnum = pgEnum("ai_generation_type", [
  "image",
  "video",
  "script",
  "seo",
]);
