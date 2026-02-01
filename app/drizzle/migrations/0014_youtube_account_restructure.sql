-- Migration: Restructure YouTube Account and Channel relationship
-- 1 User : 1 YouTube Account : N Channels

-- Step 1: Create youtube_account table
CREATE TABLE IF NOT EXISTS "public"."youtube_account" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL UNIQUE REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  "google_id" text NOT NULL UNIQUE,
  "google_email" text NOT NULL,
  "google_name" text,
  "google_avatar_url" text,
  "access_token" text,
  "refresh_token" text,
  "token_expires_at" timestamp,
  "is_connected" boolean DEFAULT true NOT NULL,
  "last_synced_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Step 2: Migrate existing channel data to youtube_account
-- Create a youtube_account for each unique user_id in channels
INSERT INTO "public"."youtube_account" ("user_id", "google_id", "google_email", "is_connected", "last_synced_at", "created_at", "updated_at")
SELECT DISTINCT
  c."user_id",
  COALESCE(c."google_email", 'google_' || c."user_id"::text),
  COALESCE(c."google_email", 'unknown@example.com'),
  COALESCE(c."is_oauth_connected", false),
  c."last_synced_at",
  c."created_at",
  c."updated_at"
FROM "public"."channel" c
WHERE c."user_id" IS NOT NULL
ON CONFLICT ("user_id") DO NOTHING;

-- Step 3: Add youtube_account_id column to channel table
ALTER TABLE "public"."channel" ADD COLUMN IF NOT EXISTS "youtube_account_id" uuid;

-- Step 4: Add banner_url column to channel table
ALTER TABLE "public"."channel" ADD COLUMN IF NOT EXISTS "banner_url" text;

-- Step 5: Update channel.youtube_account_id based on user_id
UPDATE "public"."channel" c
SET "youtube_account_id" = ya."id"
FROM "public"."youtube_account" ya
WHERE c."user_id" = ya."user_id";

-- Step 6: Make youtube_account_id NOT NULL and add foreign key
-- First, delete any orphaned channels (channels without matching youtube_account)
DELETE FROM "public"."channel" WHERE "youtube_account_id" IS NULL;

-- Then add the constraint
ALTER TABLE "public"."channel" ALTER COLUMN "youtube_account_id" SET NOT NULL;
ALTER TABLE "public"."channel" ADD CONSTRAINT "channel_youtube_account_id_fkey"
  FOREIGN KEY ("youtube_account_id") REFERENCES "public"."youtube_account"("id") ON DELETE CASCADE;

-- Step 7: Drop old columns from channel table
ALTER TABLE "public"."channel" DROP COLUMN IF EXISTS "user_id";
ALTER TABLE "public"."channel" DROP COLUMN IF EXISTS "google_email";
ALTER TABLE "public"."channel" DROP COLUMN IF EXISTS "is_oauth_connected";

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS "youtube_account_user_id_idx" ON "public"."youtube_account" ("user_id");
CREATE INDEX IF NOT EXISTS "channel_youtube_account_id_idx" ON "public"."channel" ("youtube_account_id");
