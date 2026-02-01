ALTER TABLE "ai_recommendation" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "ai_recommendation" ADD COLUMN "hooks" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "ai_recommendation" ADD COLUMN "target_audience" text;--> statement-breakpoint
ALTER TABLE "ai_recommendation" ADD COLUMN "estimated_views" text;--> statement-breakpoint
ALTER TABLE "ai_recommendation" ADD COLUMN "difficulty" text;--> statement-breakpoint
ALTER TABLE "ai_recommendation" ADD COLUMN "video_type" text;--> statement-breakpoint
ALTER TABLE "ai_recommendation" ADD COLUMN "content_tone" text;--> statement-breakpoint
ALTER TABLE "ai_recommendation" ADD COLUMN "based_on_trends" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "ai_recommendation" ADD COLUMN "is_used" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "ai_recommendation" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;