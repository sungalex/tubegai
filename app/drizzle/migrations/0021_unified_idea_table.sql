-- ============================================
-- Migration: Unified Idea Table
-- ============================================
-- Merges ai_recommendation and saved_idea into a single 'idea' table
--
-- Changes:
-- 1. Create idea_source enum
-- 2. Create new idea table
-- 3. Migrate data from saved_idea and ai_recommendation
-- 4. Drop old tables
-- ============================================

-- Step 1: Create the idea_source enum
DO $$ BEGIN
  CREATE TYPE "public"."idea_source" AS ENUM('ai_generated', 'user_created');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create the unified idea table
CREATE TABLE IF NOT EXISTS "public"."idea" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "hooks" text[] DEFAULT '{}',
  "target_audience" text,
  "estimated_views" text,
  "difficulty" "public"."idea_difficulty" DEFAULT 'medium',
  "source" "public"."idea_source" NOT NULL,
  "based_on_trends" text[] DEFAULT '{}',
  "trend_id" uuid,
  "reason" text,
  "growth_rate" text,
  "score" integer,
  "content_tone" "public"."content_tone",
  "video_type" "public"."video_length",
  "category" text,
  "is_saved" boolean DEFAULT false NOT NULL,
  "is_used" boolean DEFAULT false NOT NULL,
  "used_for_project_id" uuid,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Step 3: Add foreign key constraints
DO $$ BEGIN
  ALTER TABLE "public"."idea"
    ADD CONSTRAINT "idea_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "public"."idea"
    ADD CONSTRAINT "idea_used_for_project_id_project_id_fk"
    FOREIGN KEY ("used_for_project_id") REFERENCES "public"."project"("id") ON DELETE set null;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "public"."idea"
    ADD CONSTRAINT "idea_trend_id_trend_id_fk"
    FOREIGN KEY ("trend_id") REFERENCES "public"."trend"("id") ON DELETE set null;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_idea_user_id" ON "public"."idea" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_idea_source_saved" ON "public"."idea" ("source", "is_saved");
CREATE INDEX IF NOT EXISTS "idx_idea_expires_at" ON "public"."idea" ("expires_at") WHERE "expires_at" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_idea_user_created_at" ON "public"."idea" ("user_id", "created_at" DESC);

-- Step 5: Migrate data from saved_idea (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saved_idea') THEN
    INSERT INTO "public"."idea" (
      "id", "user_id", "title", "description", "hooks", "target_audience", "estimated_views",
      "difficulty", "source", "based_on_trends", "is_saved", "is_used", "used_for_project_id",
      "created_at", "updated_at"
    )
    SELECT
      "id", "user_id", "title", "description", "hooks", "target_audience", "estimated_views",
      "difficulty", 'user_created'::"public"."idea_source", ARRAY["based_on_trend"], true, "is_used", "used_for_project_id",
      "created_at", "updated_at"
    FROM "public"."saved_idea"
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Step 6: Migrate data from ai_recommendation (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_recommendation') THEN
    INSERT INTO "public"."idea" (
      "id", "user_id", "title", "description", "hooks", "target_audience", "estimated_views",
      "difficulty", "source", "based_on_trends", "trend_id", "reason", "growth_rate", "score",
      "content_tone", "video_type", "category", "is_saved", "is_used", "used_for_project_id",
      "expires_at", "created_at", "updated_at"
    )
    SELECT
      "id", "user_id", "title", "description", "hooks", "target_audience", "estimated_views",
      CASE
        WHEN "difficulty" = 'easy' THEN 'easy'::"public"."idea_difficulty"
        WHEN "difficulty" = 'hard' THEN 'hard'::"public"."idea_difficulty"
        ELSE 'medium'::"public"."idea_difficulty"
      END,
      'ai_generated'::"public"."idea_source", "based_on_trends", "trend_id", "reason", "growth_rate", "score",
      CASE
        WHEN "content_tone" = 'informative' THEN 'informative'::"public"."content_tone"
        WHEN "content_tone" = 'funny' THEN 'funny'::"public"."content_tone"
        WHEN "content_tone" = 'dramatic' THEN 'dramatic'::"public"."content_tone"
        WHEN "content_tone" = 'casual' THEN 'casual'::"public"."content_tone"
        WHEN "content_tone" = 'professional' THEN 'professional'::"public"."content_tone"
        ELSE NULL
      END,
      CASE
        WHEN "video_type" = 'short' THEN 'short'::"public"."video_length"
        WHEN "video_type" = 'medium' THEN 'medium'::"public"."video_length"
        WHEN "video_type" = 'long' THEN 'long'::"public"."video_length"
        ELSE NULL
      END,
      "category",
      false, -- AI recommendations are not saved by default
      ("is_used" = 1), "used_for_project_id",
      "expires_at", "created_at", "updated_at"
    FROM "public"."ai_recommendation"
    WHERE "expires_at" > now() OR "is_used" = 1  -- Only migrate non-expired or used recommendations
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Step 7: Update project.source_idea_id FK to reference idea table
-- (This is handled by the legacy alias in the schema, no SQL change needed)

-- Step 8: Enable Row Level Security
ALTER TABLE "public"."idea" ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies
DO $$ BEGIN
  CREATE POLICY "idea_select_own" ON "public"."idea"
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "idea_insert_own" ON "public"."idea"
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "idea_update_own" ON "public"."idea"
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "idea_delete_own" ON "public"."idea"
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 10: Drop old tables (CAUTION: Only run after verifying data migration)
-- Uncomment these lines when ready to finalize the migration
-- DROP TABLE IF EXISTS "public"."saved_idea" CASCADE;
-- DROP TABLE IF EXISTS "public"."ai_recommendation" CASCADE;
