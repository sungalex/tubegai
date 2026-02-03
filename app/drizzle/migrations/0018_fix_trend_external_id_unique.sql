-- Fix external_id unique constraint for ON CONFLICT support
-- Drop the partial index and create a regular unique constraint

DROP INDEX IF EXISTS "public"."trend_external_id_unique";

-- Create a regular unique index (not partial) that works with ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS "trend_external_id_idx" ON "public"."trend" ("external_id");
