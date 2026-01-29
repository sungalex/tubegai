ALTER TABLE "ai_generation_cache" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "channel_video" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "channel" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "label" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_label" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_pipeline" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_seo" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "billing_history" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "settings_integration" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "settings_mcp_server" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "settings_notification" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "settings_subscription" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "studio_b_roll" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "studio_coloring_preset" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "studio_coloring_setting" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "studio_thumbnail" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "studio_rough_cut_timeline" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "studio_rough_cut_version" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "studio_subtitle" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "studio_thumbnail_candidate" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "studio_thumbnail_overlay" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "studio_rough_cut_timeline_segment" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "ai_generation_cache" CASCADE;--> statement-breakpoint
DROP TABLE "channel_video" CASCADE;--> statement-breakpoint
DROP TABLE "channel" CASCADE;--> statement-breakpoint
DROP TABLE "label" CASCADE;--> statement-breakpoint
DROP TABLE "project_label" CASCADE;--> statement-breakpoint
DROP TABLE "project_pipeline" CASCADE;--> statement-breakpoint
DROP TABLE "project_seo" CASCADE;--> statement-breakpoint
DROP TABLE "billing_history" CASCADE;--> statement-breakpoint
DROP TABLE "settings_integration" CASCADE;--> statement-breakpoint
DROP TABLE "settings_mcp_server" CASCADE;--> statement-breakpoint
DROP TABLE "settings_notification" CASCADE;--> statement-breakpoint
DROP TABLE "settings_subscription" CASCADE;--> statement-breakpoint
DROP TABLE "studio_b_roll" CASCADE;--> statement-breakpoint
DROP TABLE "studio_coloring_preset" CASCADE;--> statement-breakpoint
DROP TABLE "studio_coloring_setting" CASCADE;--> statement-breakpoint
DROP TABLE "studio_thumbnail" CASCADE;--> statement-breakpoint
DROP TABLE "studio_rough_cut_timeline" CASCADE;--> statement-breakpoint
DROP TABLE "studio_rough_cut_version" CASCADE;--> statement-breakpoint
DROP TABLE "studio_subtitle" CASCADE;--> statement-breakpoint
DROP TABLE "studio_thumbnail_candidate" CASCADE;--> statement-breakpoint
DROP TABLE "studio_thumbnail_overlay" CASCADE;--> statement-breakpoint
DROP TABLE "studio_rough_cut_timeline_segment" CASCADE;--> statement-breakpoint
-- Note: project_channel_id_channel_id_fk already dropped by CASCADE when channel table was dropped
ALTER TABLE "project" DROP COLUMN IF EXISTS "channel_id";--> statement-breakpoint
DROP TYPE "public"."ai_generation_type";--> statement-breakpoint
DROP TYPE "public"."b_roll_provider";--> statement-breakpoint
DROP TYPE "public"."billing_cycle";--> statement-breakpoint
DROP TYPE "public"."channel_status";--> statement-breakpoint
DROP TYPE "public"."integration_provider";--> statement-breakpoint
DROP TYPE "public"."integration_status";--> statement-breakpoint
DROP TYPE "public"."mcp_status";--> statement-breakpoint
DROP TYPE "public"."payment_status";--> statement-breakpoint
DROP TYPE "public"."pipeline_phase";--> statement-breakpoint
DROP TYPE "public"."step_status";--> statement-breakpoint
DROP TYPE "public"."subscription_plan";--> statement-breakpoint
DROP TYPE "public"."subscription_status";--> statement-breakpoint
DROP TYPE "public"."thumbnail_overlay_type";--> statement-breakpoint
DROP TYPE "public"."timeline_resource_type";--> statement-breakpoint
DROP TYPE "public"."timeline_track_type";