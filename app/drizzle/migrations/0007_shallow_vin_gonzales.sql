-- Enum values already added via add-phase2-enums.ts
-- ALTER TYPE "public"."export_format" ADD VALUE 'webm';--> statement-breakpoint
-- ALTER TYPE "public"."export_resolution" ADD VALUE '720p' BEFORE '1080p';--> statement-breakpoint
ALTER TABLE "studio_storyboard" ALTER COLUMN "script_segment_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_export_history" ADD COLUMN "frame_rate" integer DEFAULT 30;--> statement-breakpoint
ALTER TABLE "studio_export_history" ADD COLUMN "quality" text DEFAULT 'high';--> statement-breakpoint
ALTER TABLE "studio_export_history" ADD COLUMN "hardware_acceleration" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "studio_export_history" ADD COLUMN "privacy" text;--> statement-breakpoint
ALTER TABLE "studio_export_history" ADD COLUMN "scheduled_at" timestamp;--> statement-breakpoint
ALTER TABLE "studio_storyboard" ADD COLUMN "duration" integer;--> statement-breakpoint

-- Phase 2: Performance Indexes
CREATE INDEX IF NOT EXISTS "idx_project_user_id" ON "project"("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_status" ON "project"("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_updated_at" ON "project"("updated_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_script_segment_script_id" ON "studio_script_segment"("script_id", "order_index");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_storyboard_project_id" ON "studio_storyboard"("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_storyboard_script_segment" ON "studio_storyboard"("script_segment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_video_storyboard" ON "studio_video"("storyboard_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_video_project" ON "studio_video"("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_video_part_video_id" ON "studio_video_part"("video_id", "part_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_export_project" ON "studio_export_history"("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_export_status" ON "studio_export_history"("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trend_user" ON "trend"("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trend_category" ON "trend"("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trend_unused" ON "trend"("used_for_project_id") WHERE "used_for_project_id" IS NULL;