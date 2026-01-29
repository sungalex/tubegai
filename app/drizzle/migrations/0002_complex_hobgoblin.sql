ALTER TABLE "project" ADD COLUMN "progress" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "current_step" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "thumbnail_url" text;