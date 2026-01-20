import { tubegaiSchema } from "./schema-def";

// Foundation & Identity
export const channelStatusEnum = tubegaiSchema.enum("channel_status", [
  "active",
  "disconnected",
  "error",
]);
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

// Project Core
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

// Pipeline
export const pipelinePhaseEnum = tubegaiSchema.enum("pipeline_phase", [
  "planning",
  "production",
  "post_production",
  "review",
  "completed",
]);
export const stepStatusEnum = tubegaiSchema.enum("step_status", [
  "pending",
  "in_progress",
  "completed",
]);

// Studio: Pre-Production
export const scriptSegmentTypeEnum = tubegaiSchema.enum("script_segment_type", [
  "hook",
  "intro",
  "body",
  "cta",
  "outro",
]);

// Studio: Production (Assets)
export const sceneVideoStatusEnum = tubegaiSchema.enum("scene_video_status", [
  "generating",
  "completed",
  "failed",
]);
export const bRollProviderEnum = tubegaiSchema.enum("b_roll_provider", [
  "pexels",
  "pixabay",
  "unsplash",
  "custom",
]);

// Studio: Production (Rough Cut)
export const timelineTrackTypeEnum = tubegaiSchema.enum("timeline_track_type", [
  "video",
  "audio",
]);
export const timelineResourceTypeEnum = tubegaiSchema.enum(
  "timeline_resource_type",
  ["scene", "b_roll", "upload", "audio"],
);

// Studio: Post-Production
export const thumbnailOverlayTypeEnum = tubegaiSchema.enum(
  "thumbnail_overlay_type",
  ["text", "image"],
);

// Delivery
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

// Settings
export const subscriptionPlanEnum = tubegaiSchema.enum("subscription_plan", [
  "free",
  "pro",
  "enterprise",
]);
export const subscriptionStatusEnum = tubegaiSchema.enum(
  "subscription_status",
  ["active", "canceled", "past_due"],
);
export const billingCycleEnum = tubegaiSchema.enum("billing_cycle", [
  "monthly",
  "yearly",
]);
export const paymentStatusEnum = tubegaiSchema.enum("payment_status", [
  "paid",
  "pending",
  "failed",
]);
export const integrationProviderEnum = tubegaiSchema.enum(
  "integration_provider",
  ["youtube", "gemini", "pexels", "openai", "elevenlabs"],
);
export const integrationStatusEnum = tubegaiSchema.enum("integration_status", [
  "active",
  "inactive",
  "error",
]);
export const mcpStatusEnum = tubegaiSchema.enum("mcp_status", [
  "connected",
  "disconnected",
  "error",
]);

// AI Resource Optimization
export const aiGenerationTypeEnum = tubegaiSchema.enum("ai_generation_type", [
  "image",
  "video",
  "script",
  "seo",
]);
