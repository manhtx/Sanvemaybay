BEGIN;

-- 1. Create durable cross-device saved opportunities table
CREATE TABLE IF NOT EXISTS public.user_saved_opportunities (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id TEXT NOT NULL,
  snapshot_data JSONB,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, opportunity_id)
);

ALTER TABLE public.user_saved_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own saved opportunities" ON public.user_saved_opportunities;
CREATE POLICY "Users can manage their own saved opportunities"
  ON public.user_saved_opportunities FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Extend user_alerts with Watch lifecycle columns
ALTER TABLE public.user_alerts
  ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_match_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS latest_price BIGINT,
  ADD COLUMN IF NOT EXISTS max_stops INT,
  ADD COLUMN IF NOT EXISTS target_price BIGINT;

-- 3. Extend notification_deliveries to support observed opportunities
ALTER TABLE public.notification_deliveries
  ALTER COLUMN deal_id DROP NOT NULL;

ALTER TABLE public.notification_deliveries
  ADD COLUMN IF NOT EXISTS opportunity_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS notification_deliveries_alert_opp_channel_idx
  ON public.notification_deliveries (alert_id, opportunity_id, channel)
  WHERE opportunity_id IS NOT NULL;

-- 4. Atomic Snapshot Generation for observed_fare_snapshots
ALTER TABLE public.observed_fare_snapshots
  ADD COLUMN IF NOT EXISTS generation_id UUID;

CREATE INDEX IF NOT EXISTS observed_fare_snapshot_generation_idx
  ON public.observed_fare_snapshots (generation_id);

CREATE TABLE IF NOT EXISTS public.active_observed_generation (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  active_generation_id UUID NOT NULL,
  row_count INT NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.active_observed_generation ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.active_observed_generation FROM anon, authenticated;

COMMIT;
