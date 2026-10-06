-- Migration: 20261006000200_canonical_travel_intents_and_watch.sql
-- Fulfills REQ-DATA-001..010, REQ-WATCH-013..018, REQ-NOTIF-001..006, REQ-SNAP-007..008

BEGIN;

-- 1. REQ-DATA-001: Durable TravelIntent table
CREATE TABLE IF NOT EXISTS public.travel_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_version INT NOT NULL DEFAULT 1,
  origin_scope_type TEXT NOT NULL DEFAULT 'EXACT_AIRPORT',
  origin_codes TEXT[] NOT NULL,
  destination_scope_type TEXT NOT NULL DEFAULT 'EXACT_AIRPORT',
  destination_codes TEXT[] NOT NULL,
  journey_type TEXT NOT NULL DEFAULT 'ROUND_TRIP',
  outbound_from DATE,
  outbound_to DATE,
  return_from DATE,
  return_to DATE,
  trip_length_min INT,
  trip_length_max INT,
  adults INT NOT NULL DEFAULT 1,
  children INT NOT NULL DEFAULT 0,
  infants INT NOT NULL DEFAULT 0,
  cabin TEXT NOT NULL DEFAULT 'ECONOMY',
  max_stops INT,
  currency TEXT NOT NULL DEFAULT 'VND',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.travel_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to travel_intents"
  ON public.travel_intents FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to travel_intents"
  ON public.travel_intents FOR INSERT
  WITH CHECK (true);

-- 2. REQ-DATA-002: Migrate user_alerts towards canonical Watch schema
ALTER TABLE public.user_alerts
  ADD COLUMN IF NOT EXISTS travel_intent_id UUID REFERENCES public.travel_intents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS travel_intent_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_successful_check_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS latest_eligible_price NUMERIC,
  ADD COLUMN IF NOT EXISTS last_matched_price NUMERIC,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE';

-- 3. REQ-DATA-003: Watch evaluation history
CREATE TABLE IF NOT EXISTS public.watch_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_id UUID NOT NULL REFERENCES public.user_alerts(id) ON DELETE CASCADE,
  generation_id UUID,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'STARTED' CHECK (status IN ('STARTED', 'SUCCESS', 'INCOMPLETE', 'DEGRADED', 'FAILED')),
  eligible_count INT NOT NULL DEFAULT 0,
  best_price NUMERIC,
  error_code TEXT,
  release_sha TEXT
);

ALTER TABLE public.watch_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own watch evaluations"
  ON public.watch_evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_alerts ua
      WHERE ua.id = watch_evaluations.watch_id
      AND (ua.user_id = auth.uid() OR ua.email = auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Service role can insert watch evaluations"
  ON public.watch_evaluations FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- 4. REQ-DATA-004: Durable condition episodes
CREATE TABLE IF NOT EXISTS public.watch_condition_episodes (
  id TEXT PRIMARY KEY,
  watch_id UUID NOT NULL REFERENCES public.user_alerts(id) ON DELETE CASCADE,
  condition_fingerprint TEXT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  state TEXT NOT NULL CHECK (state IN ('ENTERED', 'STILL_INSIDE', 'MATERIAL_IMPROVEMENT', 'EXITED', 'REENTERED')),
  entry_price NUMERIC NOT NULL,
  best_price NUMERIC NOT NULL,
  last_event_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generation_id UUID
);

ALTER TABLE public.watch_condition_episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own condition episodes"
  ON public.watch_condition_episodes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_alerts ua
      WHERE ua.id = watch_condition_episodes.watch_id
      AND (ua.user_id = auth.uid() OR ua.email = auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Service role can manage condition episodes"
  ON public.watch_condition_episodes FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- 5. REQ-DATA-005 & REQ-NOTIF-001: Notification Outbox
CREATE TABLE IF NOT EXISTS public.notification_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_id UUID REFERENCES public.user_alerts(id) ON DELETE SET NULL,
  episode_id TEXT REFERENCES public.watch_condition_episodes(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'EMAIL',
  dedupe_key TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'RETRYABLE_FAILED', 'PERMANENT_FAILED')),
  attempt_count INT NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage notification outbox"
  ON public.notification_outbox FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- 6. REQ-DATA-006: Notification delivery attempts
CREATE TABLE IF NOT EXISTS public.notification_delivery_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outbox_id UUID NOT NULL REFERENCES public.notification_outbox(id) ON DELETE CASCADE,
  attempt_no INT NOT NULL,
  provider TEXT NOT NULL,
  provider_message_id TEXT,
  status TEXT NOT NULL,
  error_code TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_delivery_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage delivery attempts"
  ON public.notification_delivery_attempts FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- 7. REQ-DATA-007 & REQ-DATA-008: Observed Fare Generations Registry
CREATE TABLE IF NOT EXISTS public.observed_fare_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL DEFAULT 'CANDIDATE' CHECK (state IN ('CANDIDATE', 'ACTIVE', 'RETIRED', 'QUARANTINED')),
  source_run_id TEXT,
  row_count INT NOT NULL DEFAULT 0,
  coverage_status TEXT NOT NULL DEFAULT 'COMPLETE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  retire_after TIMESTAMPTZ,
  release_sha TEXT
);

ALTER TABLE public.observed_fare_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active generations"
  ON public.observed_fare_generations FOR SELECT
  USING (state = 'ACTIVE');

CREATE POLICY "Service role manage generations"
  ON public.observed_fare_generations FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- 8. REQ-DATA-010: Query indexes
CREATE INDEX IF NOT EXISTS idx_travel_intents_scopes
  ON public.travel_intents (origin_scope_type, destination_scope_type);

CREATE INDEX IF NOT EXISTS idx_watch_evaluations_watch_id
  ON public.watch_evaluations (watch_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_watch_condition_episodes_watch_id
  ON public.watch_condition_episodes (watch_id, state);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_pending
  ON public.notification_outbox (status, next_attempt_at)
  WHERE status IN ('PENDING', 'RETRYABLE_FAILED');

CREATE INDEX IF NOT EXISTS idx_observed_fare_generations_state
  ON public.observed_fare_generations (state);

COMMIT;
