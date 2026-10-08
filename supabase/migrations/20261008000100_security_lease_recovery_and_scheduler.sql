-- Migration: 20261008000100_security_lease_recovery_and_scheduler.sql
-- Description: Hardens privileged RPC permissions (S01, C-10, A06), adds outbox lease recovery (S04, C-18, A09),
-- adds qualified generation publication (S16, C-21, A12), and adds durable schedule occurrences (S18, C-20, A13).

BEGIN;

-- 1. S01 / C-10 / A06: Explicitly REVOKE EXECUTE from PUBLIC, anon, and authenticated on all sensitive worker RPCs
REVOKE ALL ON FUNCTION public.apply_watch_evaluation(
  UUID, TIMESTAMPTZ, UUID, INT, NUMERIC, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, JSONB, TEXT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.apply_watch_evaluation(
  UUID, TIMESTAMPTZ, UUID, INT, NUMERIC, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, JSONB, TEXT
) TO service_role;

DROP FUNCTION IF EXISTS public.claim_notification_outbox(INT);

-- 2. S04 / C-18: Add worker lease & crash recovery tracking to notification_outbox
ALTER TABLE public.notification_outbox
  ADD COLUMN IF NOT EXISTS claim_token UUID,
  ADD COLUMN IF NOT EXISTS worker_id TEXT,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lease_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dead_lettered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_error TEXT;

CREATE INDEX IF NOT EXISTS idx_notification_outbox_lease_reclaim
  ON public.notification_outbox (status, lease_until)
  WHERE status = 'PROCESSING';

-- 3. S03 & S04: Upgraded claim_notification_outbox with lease timeout and crash recovery (A09)
CREATE OR REPLACE FUNCTION public.claim_notification_outbox(
  p_batch_size INT DEFAULT 50,
  p_worker_id TEXT DEFAULT 'worker_default',
  p_lease_seconds INT DEFAULT 300
)
RETURNS TABLE (
  id UUID,
  watch_id UUID,
  episode_id TEXT,
  event_type TEXT,
  channel TEXT,
  dedupe_key TEXT,
  payload JSONB,
  attempt_count INT,
  claim_token UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_lease_until TIMESTAMPTZ := v_now + make_interval(secs => GREATEST(p_lease_seconds, 60));
BEGIN
  RETURN QUERY
  WITH claimable AS (
    SELECT no.id
    FROM public.notification_outbox no
    WHERE (
      -- Standard pending or retrying
      (no.status IN ('PENDING', 'RETRYABLE_FAILED') AND no.next_attempt_at <= v_now)
      OR
      -- Crash recovery (A09): stuck in PROCESSING whose lease has expired
      (no.status = 'PROCESSING' AND (no.lease_until IS NULL OR no.lease_until < v_now))
    )
    ORDER BY no.next_attempt_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  ),
  claimed AS (
    UPDATE public.notification_outbox no
    SET status = 'PROCESSING',
        claim_token = gen_random_uuid(),
        worker_id = p_worker_id,
        claimed_at = v_now,
        lease_until = v_lease_until,
        attempt_count = no.attempt_count + 1
    FROM claimable c
    WHERE no.id = c.id
    RETURNING
      no.id,
      no.watch_id,
      no.episode_id,
      no.event_type,
      no.channel,
      no.dedupe_key,
      no.payload,
      no.attempt_count,
      no.claim_token
  )
  SELECT * FROM claimed;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_notification_outbox(INT, TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_notification_outbox(INT, TEXT, INT) TO service_role;

-- 4. S04 & S05: Atomic resolution RPC preventing stale worker overwrites (D21, A09, A10)
CREATE OR REPLACE FUNCTION public.resolve_notification_outbox(
  p_id UUID,
  p_claim_token UUID,
  p_status TEXT, -- 'SENT', 'RETRYABLE_FAILED', 'PERMANENT_FAILED'
  p_provider TEXT, -- 'resend', 'telegram'
  p_provider_message_id TEXT DEFAULT NULL,
  p_error_code TEXT DEFAULT NULL,
  p_next_attempt_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_attempt_status TEXT;
  v_attempt_count INT;
BEGIN
  -- Atomic conditional update with claim_token and active lease verification (D21)
  -- Eliminates time-of-check to time-of-use race between validation and UPDATE
  UPDATE public.notification_outbox
  SET
    status = p_status,
    sent_at = CASE WHEN p_status = 'SENT' THEN v_now ELSE sent_at END,
    dead_lettered_at = CASE WHEN p_status = 'PERMANENT_FAILED' THEN v_now ELSE dead_lettered_at END,
    last_error = p_error_code,
    next_attempt_at = CASE WHEN p_status = 'RETRYABLE_FAILED' AND p_next_attempt_at IS NOT NULL THEN p_next_attempt_at ELSE next_attempt_at END,
    lease_until = NULL,
    claim_token = NULL
  WHERE id = p_id
    AND claim_token = p_claim_token
    AND status = 'PROCESSING'
    AND lease_until >= v_now
  RETURNING attempt_count INTO v_attempt_count;

  -- If zero rows updated, claim is stale, lease expired, or already completed
  IF NOT FOUND THEN
    RAISE WARNING 'Stale or invalid worker claim rejected for outbox %', p_id;
    RETURN FALSE;
  END IF;

  -- External delivery truth (S05): provider accepted is not recipient delivery
  IF p_status = 'SENT' THEN
    v_attempt_status := 'PROVIDER_ACCEPTED';
  ELSE
    v_attempt_status := 'FAILED';
  END IF;

  -- Record delivery attempt in audit history inside the same transaction
  INSERT INTO public.notification_delivery_attempts (
    outbox_id,
    attempt_no,
    provider,
    provider_message_id,
    status,
    error_code,
    attempted_at
  ) VALUES (
    p_id,
    v_attempt_count,
    p_provider,
    p_provider_message_id,
    v_attempt_status,
    p_error_code,
    v_now
  );

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_notification_outbox(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_notification_outbox(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ) TO service_role;

-- 5. S16 / C-21: Qualified generation publication RPC (A12)
DROP FUNCTION IF EXISTS public.publish_observed_generation(UUID, INT, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION public.publish_observed_generation(
  p_generation_id UUID,
  p_row_count INT,
  p_published_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_stored_count INT;
  v_route_count INT;
BEGIN
  IF p_generation_id IS NULL THEN
    RAISE EXCEPTION 'generation_id is required';
  END IF;

  -- S16 & A12: Check actual stored snapshot count and route diversity
  SELECT count(*), count(DISTINCT origin_code || '-' || destination_code)
  INTO v_stored_count, v_route_count
  FROM public.observed_fare_snapshots
  WHERE generation_id = p_generation_id;

  IF v_stored_count = 0 THEN
    RAISE EXCEPTION 'Cannot publish generation %: 0 stored snapshots found', p_generation_id;
  END IF;

  -- Incomplete coverage guard (A12: e.g. 14/100 routes or under 20 total snapshots)
  IF v_stored_count < 20 OR v_route_count < 3 THEN
    RAISE EXCEPTION 'Cannot publish generation %: incomplete coverage (% snapshots, % routes)', p_generation_id, v_stored_count, v_route_count;
  END IF;

  -- Atomically update or insert the active generation record
  INSERT INTO public.active_observed_generation (id, active_generation_id, row_count, published_at)
  VALUES (1, p_generation_id, v_stored_count, COALESCE(p_published_at, NOW()))
  ON CONFLICT (id) DO UPDATE SET
    active_generation_id = EXCLUDED.active_generation_id,
    row_count = EXCLUDED.row_count,
    published_at = EXCLUDED.published_at;

  -- Update generation metadata state if record exists
  UPDATE public.observed_fare_generations
  SET state = 'ACTIVE',
      published_at = COALESCE(p_published_at, NOW()),
      row_count = v_stored_count
  WHERE id = p_generation_id;

  -- Retire previous generations in registry
  UPDATE public.observed_fare_generations
  SET state = 'RETIRED'
  WHERE id <> p_generation_id AND state = 'ACTIVE';

  -- Rollback retention guarantee (D18):
  -- Retain the last-known-good generation snapshots for rollback capability.
  -- Only purge snapshots from generations older than the active and previous last-known-good generation.
  DELETE FROM public.observed_fare_snapshots
  WHERE generation_id IS NOT NULL
    AND generation_id <> p_generation_id
    AND generation_id NOT IN (
      SELECT id FROM public.observed_fare_generations
      WHERE id <> p_generation_id
      ORDER BY published_at DESC NULLS LAST
      LIMIT 1
    );

  RETURN jsonb_build_object(
    'success', true,
    'generation_id', p_generation_id,
    'published_rows', v_stored_count,
    'published_routes', v_route_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.publish_observed_generation(UUID, INT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_observed_generation(UUID, INT, TIMESTAMPTZ) TO service_role;

-- Rollback RPC restoring last-known-good generation (D18, A20)
CREATE OR REPLACE FUNCTION public.rollback_observed_generation()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_gen UUID;
  v_previous_gen UUID;
  v_prev_count INT;
BEGIN
  SELECT active_generation_id INTO v_current_gen
  FROM public.active_observed_generation
  WHERE id = 1;

  SELECT id, row_count INTO v_previous_gen, v_prev_count
  FROM public.observed_fare_generations
  WHERE id <> v_current_gen AND state = 'RETIRED'
  ORDER BY published_at DESC NULLS LAST
  LIMIT 1;

  IF v_previous_gen IS NULL THEN
    RAISE EXCEPTION 'No previous last-known-good generation found to rollback to';
  END IF;

  UPDATE public.active_observed_generation
  SET active_generation_id = v_previous_gen,
      row_count = v_prev_count,
      published_at = NOW()
  WHERE id = 1;

  UPDATE public.observed_fare_generations
  SET state = 'ACTIVE'
  WHERE id = v_previous_gen;

  UPDATE public.observed_fare_generations
  SET state = 'QUARANTINED'
  WHERE id = v_current_gen;

  RETURN jsonb_build_object(
    'success', true,
    'rolled_back_from', v_current_gen,
    'rolled_back_to', v_previous_gen,
    'row_count', v_prev_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rollback_observed_generation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rollback_observed_generation() TO service_role;

-- 6. S18 / C-20 / A13: Durable schedule occurrences table & missed-run detection
CREATE TABLE IF NOT EXISTS public.schedule_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  lane TEXT NOT NULL DEFAULT 'BASELINE' CHECK (lane IN ('BASELINE', 'WATCH_CRITICAL', 'USER_DEMAND', 'EXPLORATION')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  heartbeat_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  lease_until TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'RUNNING', 'COMPLETED', 'MISSED', 'FAILED')),
  expected_routes JSONB DEFAULT '[]'::jsonb,
  actual_work JSONB DEFAULT '{}'::jsonb,
  failure_classification TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedule_occurrences_status_scheduled
  ON public.schedule_occurrences (status, scheduled_for);

ALTER TABLE public.schedule_occurrences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage schedule occurrences"
  ON public.schedule_occurrences FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.detect_missed_schedule_occurrences(
  p_grace_seconds INT DEFAULT 900
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_missed_count INT := 0;
BEGIN
  WITH marked_missed AS (
    UPDATE public.schedule_occurrences
    SET status = 'MISSED',
        failure_classification = 'SCHEDULER_MISSED_RUN'
    WHERE status = 'SCHEDULED'
      AND scheduled_for < (now() - make_interval(secs => p_grace_seconds))
    RETURNING 1
  )
  SELECT count(*) INTO v_missed_count FROM marked_missed;

  RETURN v_missed_count;
END;
$$;

REVOKE ALL ON FUNCTION public.detect_missed_schedule_occurrences(INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.detect_missed_schedule_occurrences(INT) TO service_role;

COMMIT;
