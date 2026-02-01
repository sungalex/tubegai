-- Drop old token columns (Supabase Auth now manages OAuth tokens)
ALTER TABLE "channel" DROP COLUMN IF EXISTS "access_token";--> statement-breakpoint
ALTER TABLE "channel" DROP COLUMN IF EXISTS "refresh_token";--> statement-breakpoint
-- Add new columns for OAuth integration
ALTER TABLE "channel" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "channel" ADD COLUMN "google_email" text;--> statement-breakpoint
ALTER TABLE "channel" ADD COLUMN "subscriber_count" integer;--> statement-breakpoint
ALTER TABLE "channel" ADD COLUMN "video_count" integer;--> statement-breakpoint
ALTER TABLE "channel" ADD COLUMN "view_count" bigint;--> statement-breakpoint
ALTER TABLE "channel" ADD COLUMN "is_oauth_connected" boolean DEFAULT false NOT NULL;
