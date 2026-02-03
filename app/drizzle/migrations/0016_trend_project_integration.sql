-- ============================================
-- Migration: Trend-Project Integration (Phase 1)
-- ============================================
-- This migration adds:
-- 1. Filtering fields to trends table
-- 2. Usage tracking fields to trends table
-- 3. User bookmark (saved) fields to trends table
-- 4. basedOnTrendUuid FK to projects table
-- 5. trendSnapshot JSONB to projects table
-- 6. scriptGuidelines JSONB to projects table

-- ============================================
-- 1. Trends Table: Filtering Fields
-- ============================================
ALTER TABLE "public"."trend"
ADD COLUMN IF NOT EXISTS "region_code" TEXT DEFAULT 'KR';

ALTER TABLE "public"."trend"
ADD COLUMN IF NOT EXISTS "language_code" TEXT DEFAULT 'ko';

ALTER TABLE "public"."trend"
ADD COLUMN IF NOT EXISTS "video_duration" TEXT;

-- ============================================
-- 2. Trends Table: Usage Tracking
-- ============================================
ALTER TABLE "public"."trend"
ADD COLUMN IF NOT EXISTS "usage_count" INTEGER DEFAULT 0;

ALTER TABLE "public"."trend"
ADD COLUMN IF NOT EXISTS "last_used_at" TIMESTAMP;

-- ============================================
-- 3. Trends Table: User Saved (Bookmark)
-- ============================================
ALTER TABLE "public"."trend"
ADD COLUMN IF NOT EXISTS "is_saved" BOOLEAN DEFAULT FALSE;

ALTER TABLE "public"."trend"
ADD COLUMN IF NOT EXISTS "saved_by_user_id" UUID REFERENCES "public"."user"("id") ON DELETE SET NULL;

ALTER TABLE "public"."trend"
ADD COLUMN IF NOT EXISTS "saved_at" TIMESTAMP;

-- ============================================
-- 4. Projects Table: Trend UUID Reference
-- ============================================
ALTER TABLE "public"."project"
ADD COLUMN IF NOT EXISTS "based_on_trend_uuid" UUID REFERENCES "public"."trend"("id") ON DELETE SET NULL;

-- ============================================
-- 5. Projects Table: Trend Snapshot
-- ============================================
ALTER TABLE "public"."project"
ADD COLUMN IF NOT EXISTS "trend_snapshot" JSONB;

-- ============================================
-- 6. Projects Table: Script Guidelines
-- ============================================
ALTER TABLE "public"."project"
ADD COLUMN IF NOT EXISTS "script_guidelines" JSONB;

-- ============================================
-- 7. Create Index for filtering
-- ============================================
CREATE INDEX IF NOT EXISTS "trend_region_code_idx" ON "public"."trend" ("region_code");
CREATE INDEX IF NOT EXISTS "trend_category_idx" ON "public"."trend" ("category");
CREATE INDEX IF NOT EXISTS "trend_is_saved_idx" ON "public"."trend" ("is_saved") WHERE "is_saved" = TRUE;
CREATE INDEX IF NOT EXISTS "project_based_on_trend_uuid_idx" ON "public"."project" ("based_on_trend_uuid");

-- ============================================
-- 8. Cleanup orphaned references before adding FK
-- ============================================
UPDATE "public"."project"
SET "based_on_trend_uuid" = NULL
WHERE "based_on_trend_uuid" IS NOT NULL
  AND "based_on_trend_uuid" NOT IN (SELECT id FROM "public"."trend");

-- ============================================
-- 9. Add FK constraints (defined here to avoid circular imports in Drizzle schema)
-- ============================================
-- Note: These constraints may already exist in some form. Using DO block to handle gracefully.
DO $$
BEGIN
  -- FK: project.based_on_trend_uuid -> trend.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'project_based_on_trend_uuid_fkey'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE "public"."project"
    ADD CONSTRAINT "project_based_on_trend_uuid_fkey"
    FOREIGN KEY ("based_on_trend_uuid") REFERENCES "public"."trend"("id") ON DELETE SET NULL;
  END IF;
END $$;
