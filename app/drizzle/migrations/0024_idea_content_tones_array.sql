-- Migration: Change content_tone and video_type from enum to text[] array
-- Reason: AI may return multiple values (e.g., "informative, funny, casual")

-- Step 1: Add new array columns
ALTER TABLE "public"."idea" ADD COLUMN "content_tones" text[] DEFAULT '{}';
ALTER TABLE "public"."idea" ADD COLUMN "video_types" text[] DEFAULT '{}';

-- Step 2: Migrate existing data (convert single enum value to array)
UPDATE "public"."idea"
SET "content_tones" = CASE
  WHEN "content_tone" IS NOT NULL THEN ARRAY["content_tone"::text]
  ELSE '{}'
END;

UPDATE "public"."idea"
SET "video_types" = CASE
  WHEN "video_type" IS NOT NULL THEN ARRAY["video_type"::text]
  ELSE '{}'
END;

-- Step 3: Drop old enum columns
ALTER TABLE "public"."idea" DROP COLUMN IF EXISTS "content_tone";
ALTER TABLE "public"."idea" DROP COLUMN IF EXISTS "video_type";
