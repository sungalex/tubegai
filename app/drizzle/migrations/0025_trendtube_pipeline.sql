-- ============================================
-- Migration: TrendTube Pipeline Tables
-- ============================================
-- Creates TrendTube session, result, and media tables
-- for the Studio Dashboard AI pipeline feature.

-- 1. Create enums
CREATE TYPE "public"."trendtube_pipeline_status" AS ENUM(
  'pending', 'extracting', 'generating_ideas', 'generating_media', 'completed', 'failed'
);

CREATE TYPE "public"."trendtube_media_type" AS ENUM(
  'video_image', 'background_music', 'voiceover'
);

-- 2. Create session table
CREATE TABLE IF NOT EXISTS "public"."trendtube_session" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL REFERENCES "public"."project"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  "trends_url" text NOT NULL,
  "user_idea" text NOT NULL,
  "reference_image_url" text,
  "voice_option" text DEFAULT 'female_ko',
  "status" "trendtube_pipeline_status" DEFAULT 'pending' NOT NULL,
  "current_step" integer DEFAULT 0 NOT NULL,
  "error_message" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp
);

-- 3. Create result table
CREATE TABLE IF NOT EXISTS "public"."trendtube_result" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL REFERENCES "public"."trendtube_session"("id") ON DELETE CASCADE,
  "extracted_trends" text,
  "video_ideas" text,
  "narration_script" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- 4. Create media table
CREATE TABLE IF NOT EXISTS "public"."trendtube_media" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL REFERENCES "public"."trendtube_session"("id") ON DELETE CASCADE,
  "media_type" "trendtube_media_type" NOT NULL,
  "media_asset_id" uuid REFERENCES "public"."media_asset"("id") ON DELETE SET NULL,
  "public_url" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_trendtube_session_project ON "public"."trendtube_session"("project_id");
CREATE INDEX IF NOT EXISTS idx_trendtube_session_user ON "public"."trendtube_session"("user_id");
CREATE INDEX IF NOT EXISTS idx_trendtube_result_session ON "public"."trendtube_result"("session_id");
CREATE INDEX IF NOT EXISTS idx_trendtube_media_session ON "public"."trendtube_media"("session_id");
