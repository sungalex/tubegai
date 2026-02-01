CREATE TYPE "public"."content_tone" AS ENUM('informative', 'funny', 'dramatic', 'casual', 'professional');--> statement-breakpoint
CREATE TYPE "public"."video_length" AS ENUM('short', 'medium', 'long');--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "hooks" text[];--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "target_audience" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "estimated_views" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "difficulty" "idea_difficulty";--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "content_tone" "content_tone";--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "video_length" "video_length";--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "based_on_trend" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "based_on_trend_id" integer;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "source_idea_id" uuid;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "ai_context" jsonb;