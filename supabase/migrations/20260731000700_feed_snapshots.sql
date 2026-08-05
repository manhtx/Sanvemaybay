BEGIN;

CREATE TABLE IF NOT EXISTS public.feed_snapshots (
  snapshot_key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.feed_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public can read feed snapshots" ON public.feed_snapshots;
CREATE POLICY "public can read feed snapshots"
  ON public.feed_snapshots FOR SELECT TO anon, authenticated USING (true);

COMMIT;
