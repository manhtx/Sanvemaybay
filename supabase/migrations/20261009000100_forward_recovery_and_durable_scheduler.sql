-- Migration: 20261009000100_forward_recovery_and_durable_scheduler.sql
-- Description: Forward-only corrective migration (Wave One / Section 07):
-- 1. Lossless itinerary segments preservation (W2 / D12 / REQ-DOM-010) on flights and observed_fare_snapshots.
-- 2. Atomic conditional outbox resolution preventing TOCTOU lease reclaim races (W5 / D21 / S04 / S05 / A10).
-- 3. Last-known-good generation rollback retention and atomic rollback RPC (W3 / D18 / S16 / A20).
-- 4. Durable schedule occurrences lifecycle extension: fairness lanes, worker leasing, heartbeat & watchdog recovery (W5 / D23 / S18 / A13).
-- 5. Database-side global RouteBest argmin RPC (W4 / D08 / D09 / REQ-ROUTE-001).

BEGIN;

-- 1. Lossless physical flight segments storage (W2 / D12 / REQ-DOM-010)
ALTER TABLE public.flights
  ADD COLUMN IF NOT EXISTS segments JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.observed_fare_snapshots
  ADD COLUMN IF NOT EXISTS segments JSONB DEFAULT '[]'::jsonb;

-- 2. Atomic conditional outbox resolution preventing TOCTOU lease reclaim races (W5 / D21)
CREATE OR REPLACE FUNCTION public.resolve_notification_outbox(
  p_id UUID,
  p_claim_token UUID,
  p_status TEXT,
  p_provider TEXT,
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

  IF p_status = 'SENT' THEN
    v_attempt_status := 'DELIVERED';
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

-- 3. Last-known-good generation rollback retention & atomic rollback RPC (W3 / D18)
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

-- 4. Durable schedule occurrences lifecycle extension (W5 / D23)
ALTER TABLE public.schedule_occurrences
  ADD COLUMN IF NOT EXISTS claimed_by TEXT,
  ADD COLUMN IF NOT EXISTS quality_result JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS recovery_policy TEXT DEFAULT 'RETRY_EXPONENTIAL',
  ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0;

ALTER TABLE public.schedule_occurrences
  DROP CONSTRAINT IF EXISTS schedule_occurrences_status_check;

ALTER TABLE public.schedule_occurrences
  ADD CONSTRAINT schedule_occurrences_status_check
  CHECK (status IN ('SCHEDULED', 'CLAIMED', 'RUNNING', 'COMPLETED', 'DEGRADED', 'MISSED', 'RETRYABLE_FAILED', 'TERMINAL_FAILED', 'FAILED'));

-- Worker claim with fairness-lane ordering and concurrency lock (D23)
CREATE OR REPLACE FUNCTION public.claim_schedule_occurrence(
  p_worker_id TEXT,
  p_lease_seconds INT DEFAULT 300
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rec RECORD;
  v_now TIMESTAMPTZ := now();
BEGIN
  SELECT *
  INTO v_rec
  FROM public.schedule_occurrences
  WHERE status = 'SCHEDULED'
    AND scheduled_for <= v_now
  ORDER BY
    CASE lane
      WHEN 'WATCH_CRITICAL' THEN 1
      WHEN 'BASELINE' THEN 2
      WHEN 'USER_DEMAND' THEN 3
      ELSE 4
    END ASC,
    scheduled_for ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  UPDATE public.schedule_occurrences
  SET status = 'RUNNING',
      claimed_by = p_worker_id,
      started_at = v_now,
      heartbeat_at = v_now,
      lease_until = v_now + make_interval(secs => p_lease_seconds)
  WHERE id = v_rec.id;

  RETURN jsonb_build_object(
    'id', v_rec.id,
    'job_name', v_rec.job_name,
    'lane', v_rec.lane,
    'scheduled_for', v_rec.scheduled_for,
    'expected_routes', v_rec.expected_routes,
    'claimed_by', p_worker_id,
    'lease_until', v_now + make_interval(secs => p_lease_seconds)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_schedule_occurrence(TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_schedule_occurrence(TEXT, INT) TO service_role;

-- Worker heartbeat with lease extension (D23)
CREATE OR REPLACE FUNCTION public.heartbeat_schedule_occurrence(
  p_occurrence_id UUID,
  p_worker_id TEXT,
  p_lease_seconds INT DEFAULT 300
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_updated INT := 0;
  v_now TIMESTAMPTZ := now();
BEGIN
  UPDATE public.schedule_occurrences
  SET heartbeat_at = v_now,
      lease_until = v_now + make_interval(secs => p_lease_seconds)
  WHERE id = p_occurrence_id
    AND claimed_by = p_worker_id
    AND status = 'RUNNING'
    AND lease_until >= v_now;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN (v_updated > 0);
END;
$$;

REVOKE ALL ON FUNCTION public.heartbeat_schedule_occurrence(UUID, TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.heartbeat_schedule_occurrence(UUID, TEXT, INT) TO service_role;

-- Worker completion or failure reporting (D23)
CREATE OR REPLACE FUNCTION public.complete_schedule_occurrence(
  p_occurrence_id UUID,
  p_worker_id TEXT,
  p_status TEXT,
  p_actual_work JSONB DEFAULT '{}'::jsonb,
  p_quality_result JSONB DEFAULT '{}'::jsonb,
  p_failure_classification TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_updated INT := 0;
  v_now TIMESTAMPTZ := now();
BEGIN
  IF p_status NOT IN ('COMPLETED', 'DEGRADED', 'RETRYABLE_FAILED', 'TERMINAL_FAILED', 'FAILED') THEN
    RAISE EXCEPTION 'Invalid completion status: %', p_status;
  END IF;

  UPDATE public.schedule_occurrences
  SET status = p_status,
      actual_work = p_actual_work,
      quality_result = p_quality_result,
      completed_at = v_now,
      failure_classification = p_failure_classification
  WHERE id = p_occurrence_id
    AND claimed_by = p_worker_id
    AND status = 'RUNNING'
    AND lease_until >= v_now;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN (v_updated > 0);
END;
$$;

REVOKE ALL ON FUNCTION public.complete_schedule_occurrence(UUID, TEXT, TEXT, JSONB, JSONB, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_schedule_occurrence(UUID, TEXT, TEXT, JSONB, JSONB, TEXT) TO service_role;

-- Watchdog missed occurrence & worker timeout detection (D23, A13)
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
  v_timeout_count INT := 0;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- 1. Overdue scheduled occurrences (producer never ran)
  WITH marked_missed AS (
    UPDATE public.schedule_occurrences
    SET status = 'MISSED',
        failure_classification = 'SCHEDULER_MISSED_RUN'
    WHERE status = 'SCHEDULED'
      AND scheduled_for < (v_now - make_interval(secs => p_grace_seconds))
    RETURNING 1
  )
  SELECT count(*) INTO v_missed_count FROM marked_missed;

  -- 2. Worker lease timeout (worker crashed or abandoned execution)
  WITH marked_timed_out AS (
    UPDATE public.schedule_occurrences
    SET status = 'RETRYABLE_FAILED',
        failure_classification = 'WORKER_HEARTBEAT_TIMEOUT',
        completed_at = v_now
    WHERE status = 'RUNNING'
      AND lease_until < v_now
    RETURNING 1
  )
  SELECT count(*) INTO v_timeout_count FROM marked_timed_out;

  RETURN v_missed_count + v_timeout_count;
END;
$$;

REVOKE ALL ON FUNCTION public.detect_missed_schedule_occurrences(INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.detect_missed_schedule_occurrences(INT) TO service_role;

-- 5. Database-side global RouteBest argmin RPC (W4 / D08 / D09)
CREATE OR REPLACE FUNCTION public.select_route_best(
  p_generation_id UUID,
  p_origin TEXT,
  p_destination TEXT,
  p_depart_date DATE DEFAULT NULL,
  p_max_stops INT DEFAULT NULL,
  p_cabin TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rec RECORD;
  v_eligible_count INT;
  v_total_count INT;
BEGIN
  SELECT count(*) INTO v_total_count
  FROM public.observed_fare_snapshots
  WHERE generation_id = p_generation_id
    AND origin_code = p_origin
    AND destination_code = p_destination
    AND (p_depart_date IS NULL OR depart_date = p_depart_date);

  SELECT count(*) INTO v_eligible_count
  FROM public.observed_fare_snapshots
  WHERE generation_id = p_generation_id
    AND origin_code = p_origin
    AND destination_code = p_destination
    AND (p_depart_date IS NULL OR depart_date = p_depart_date)
    AND price > 0
    AND (p_max_stops IS NULL OR (stops IS NOT NULL AND stops <= p_max_stops))
    AND (p_cabin IS NULL OR cabin = p_cabin);

  SELECT * INTO v_rec
  FROM public.observed_fare_snapshots
  WHERE generation_id = p_generation_id
    AND origin_code = p_origin
    AND destination_code = p_destination
    AND (p_depart_date IS NULL OR depart_date = p_depart_date)
    AND price > 0
    AND (p_max_stops IS NULL OR (stops IS NOT NULL AND stops <= p_max_stops))
    AND (p_cabin IS NULL OR cabin = p_cabin)
  ORDER BY price ASC, dedupe_key ASC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'valid_zero',
      'route_best', NULL,
      'eligible_candidate_count', 0,
      'total_candidate_count', v_total_count
    );
  END IF;

  RETURN jsonb_build_object(
    'status', 'healthy',
    'route_best', to_jsonb(v_rec),
    'eligible_candidate_count', v_eligible_count,
    'total_candidate_count', v_total_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.select_route_best(UUID, TEXT, TEXT, DATE, INT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.select_route_best(UUID, TEXT, TEXT, DATE, INT, TEXT) TO service_role, anon, authenticated;

COMMIT;
