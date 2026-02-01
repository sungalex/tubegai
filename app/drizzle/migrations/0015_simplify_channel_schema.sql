-- Migration: Simplify Channel Schema
-- Remove youtube_accounts table, channels directly reference users
-- Users can have multiple channels from different YouTube accounts

-- Step 1: Add user_id column to channel (nullable first for migration)
ALTER TABLE "public"."channel" ADD COLUMN IF NOT EXISTS "user_id" uuid;

-- Step 2: Add OAuth token columns to channel
ALTER TABLE "public"."channel" ADD COLUMN IF NOT EXISTS "access_token" text;
ALTER TABLE "public"."channel" ADD COLUMN IF NOT EXISTS "refresh_token" text;
ALTER TABLE "public"."channel" ADD COLUMN IF NOT EXISTS "token_expires_at" timestamp;

-- Step 3: Migrate data - copy user_id from youtube_account to channel
UPDATE "public"."channel" c
SET "user_id" = ya."user_id"
FROM "public"."youtube_account" ya
WHERE c."youtube_account_id" = ya."id";

-- Step 4: For any channels without user_id, try to get from existing data
-- If still null, we'll need to delete orphaned channels
DELETE FROM "public"."channel" WHERE "user_id" IS NULL;

-- Step 5: Make user_id NOT NULL and add foreign key
ALTER TABLE "public"."channel" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "public"."channel" ADD CONSTRAINT "channel_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Step 6: Drop youtube_account_id column and its constraint
ALTER TABLE "public"."channel" DROP CONSTRAINT IF EXISTS "channel_youtube_account_id_fkey";
ALTER TABLE "public"."channel" DROP COLUMN IF EXISTS "youtube_account_id";

-- Step 7: Drop youtube_account table
DROP TABLE IF EXISTS "public"."youtube_account";

-- Step 8: Create index for performance
CREATE INDEX IF NOT EXISTS "channel_user_id_idx" ON "public"."channel" ("user_id");
