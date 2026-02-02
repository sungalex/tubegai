-- Add unique constraint to external_id for upsert support
-- This enables ON CONFLICT DO UPDATE for YouTube video deduplication

CREATE UNIQUE INDEX IF NOT EXISTS "trend_external_id_unique" ON "tubegai"."trend" ("external_id") WHERE "external_id" IS NOT NULL;
