-- ============================================
-- Migration: idea_trend junction table
-- ============================================
-- Replaces basedOnTrends array and trendId with proper N:M relationship

-- 1. Create junction table
CREATE TABLE IF NOT EXISTS public.idea_trend (
  idea_id uuid NOT NULL REFERENCES public.idea(id) ON DELETE CASCADE,
  trend_id uuid NOT NULL REFERENCES public.trend(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY (idea_id, trend_id)
);

-- 2. Create index for reverse lookup (trend → ideas)
CREATE INDEX IF NOT EXISTS idx_idea_trend_trend_id ON public.idea_trend(trend_id);

-- 3. Migrate existing data from based_on_trends array to junction table
-- Match trend titles (case-insensitive) to get trend UUIDs
INSERT INTO public.idea_trend (idea_id, trend_id, is_primary, created_at)
SELECT DISTINCT
  i.id AS idea_id,
  t.id AS trend_id,
  (row_number() OVER (PARTITION BY i.id ORDER BY t.created_at DESC) = 1) AS is_primary,
  i.created_at
FROM public.idea i
CROSS JOIN LATERAL unnest(i.based_on_trends) WITH ORDINALITY AS trend_title(title, ord)
JOIN public.trend t ON LOWER(t.title) = LOWER(trend_title.title)
WHERE i.based_on_trends IS NOT NULL
  AND array_length(i.based_on_trends, 1) > 0
ON CONFLICT (idea_id, trend_id) DO NOTHING;

-- 4. Also migrate from trendId if it exists and is not null
INSERT INTO public.idea_trend (idea_id, trend_id, is_primary, created_at)
SELECT
  i.id AS idea_id,
  i.trend_id AS trend_id,
  true AS is_primary,
  i.created_at
FROM public.idea i
WHERE i.trend_id IS NOT NULL
ON CONFLICT (idea_id, trend_id) DO UPDATE SET is_primary = true;

-- 5. Drop deprecated columns
ALTER TABLE public.idea DROP COLUMN IF EXISTS based_on_trends;
ALTER TABLE public.idea DROP COLUMN IF EXISTS trend_id;

-- 6. Add comments
COMMENT ON TABLE public.idea_trend IS 'Junction table for Idea ↔ Trend N:M relationship';
COMMENT ON COLUMN public.idea_trend.is_primary IS 'Indicates the primary/main trend for this idea';
