-- Migration: 20261007000300_atomic_watch_evaluation_and_outbox.sql
-- Description: Atomic watch evaluation RPC, SKIP LOCKED outbox claim, and single open episode constraint
-- Covers: NODE OUTBOX-01, OUTBOX-03, WATCH-05, REQ-WATCH-013..018, REQ-NOTIF-001..003

BEGIN;

-- 1. NODE WATCH-05: Ensure no duplicate open episodes exist before creating constraint
WITH ranked_open AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY watch_id ORDER BY last_event_at DESC, opened_at DESC) as rn
  FROM public.watch_condition_episodes
  WHERE closed_at IS NULL
)
UPDATE public.watch_condition_episodes
SET closed_at = now(), state = 'EXITED'
WHERE id IN (
  SELECT id FROM ranked_open WHERE rn > 1
);

-- Partial unique index strictly preventing multiple concurrent open episodes per watch
CREATE UNIQUE INDEX IF NOT EXISTS idx_watch_condition_episodes_single_open
  ON public.watch_condition_episodes (watch_id)
  WHERE closed_at IS NULL;

-- 2. NODE OUTBOX-01: Atomic PostgreSQL RPC apply_watch_evaluation
-- Combines watch updates, condition episode state transition, evaluation history, and outbox insertion in 1 transaction
CREATE OR REPLACE FUNCTION public.apply_watch_evaluation(
  p_watch_id UUID,
  p_now TIMESTAMPTZ,
  p_generation_id UUID,
  p_eligible_count INT,
  p_best_price NUMERIC,
  p_episode_action TEXT, -- 'CREATE', 'UPDATE', 'CLOSE', 'NO_CHANGE'
  p_episode_id TEXT,
  p_condition_fingerprint TEXT,
  p_episode_state TEXT,
  p_entry_price NUMERIC,
  p_best_episode_price NUMERIC,
  p_outbox_items JSONB DEFAULT '[]'::jsonb,
  p_release_sha TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_outbox_inserted INT := 0;
  v_item JSONB;
BEGIN
  -- 1. Update user_alerts tracking columns
  UPDATE public.user_alerts
  SET
    last_checked_at = p_now,
    last_attempt_at = p_now,
    last_successful_check_at = p_now,
    last_match_at = CASE WHEN p_best_price IS NOT NULL THEN p_now ELSE last_match_at END,
    latest_eligible_price = p_best_price,
    last_matched_price = CASE WHEN p_best_price IS NOT NULL THEN p_best_price ELSE last_matched_price END,
    latest_price = CASE WHEN p_best_price IS NOT NULL THEN p_best_price::bigint ELSE latest_price END
  WHERE id = p_watch_id;

  -- 2. Handle Watch Condition Episode state transition
  IF p_episode_action = 'CLOSE' THEN
    UPDATE public.watch_condition_episodes
    SET
      closed_at = p_now,
      state = 'EXITED',
      last_event_at = p_now
    WHERE watch_id = p_watch_id
      AND closed_at IS NULL;
  ELSIF p_episode_action = 'CREATE' THEN
    -- Ensure any open episode is closed before inserting new (NODE WATCH-05)
    UPDATE public.watch_condition_episodes
    SET
      closed_at = p_now,
      state = 'EXITED',
      last_event_at = p_now
    WHERE watch_id = p_watch_id
      AND closed_at IS NULL;

    -- Insert new active episode
    INSERT INTO public.watch_condition_episodes (
      id,
      watch_id,
      condition_fingerprint,
      opened_at,
      closed_at,
      state,
      entry_price,
      best_price,
      last_event_at,
      generation_id
    ) VALUES (
      p_episode_id,
      p_watch_id,
      p_condition_fingerprint,
      p_now,
      NULL,
      p_episode_state,
      p_entry_price,
      p_best_episode_price,
      p_now,
      p_generation_id
    );
  ELSIF p_episode_action = 'UPDATE' THEN
    UPDATE public.watch_condition_episodes
    SET
      state = p_episode_state,
      best_price = p_best_episode_price,
      last_event_at = p_now,
      generation_id = COALESCE(p_generation_id, generation_id)
    WHERE id = p_episode_id;
  END IF;

  -- 3. Record Watch Evaluation History
  INSERT INTO public.watch_evaluations (
    watch_id,
    generation_id,
    started_at,
    completed_at,
    status,
    eligible_count,
    best_price,
    release_sha
  ) VALUES (
    p_watch_id,
    p_generation_id,
    p_now,
    p_now,
    CASE WHEN p_generation_id IS NOT NULL THEN 'SUCCESS' ELSE 'DEGRADED' END,
    p_eligible_count,
    p_best_price,
    p_release_sha
  );

  -- 4. Insert into notification_outbox if any outbox items provided
  IF p_outbox_items IS NOT NULL AND jsonb_array_length(p_outbox_items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_outbox_items) LOOP
      INSERT INTO public.notification_outbox (
        watch_id,
        episode_id,
        event_type,
        channel,
        dedupe_key,
        payload,
        status,
        next_attempt_at
      ) VALUES (
        p_watch_id,
        p_episode_id,
        v_item->>'event_type',
        COALESCE(v_item->>'channel', 'EMAIL'),
        v_item->>'dedupe_key',
        v_item->'payload',
        'PENDING',
        p_now
      )
      ON CONFLICT (dedupe_key) DO NOTHING;

      v_outbox_inserted := v_outbox_inserted + 1;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'watch_id', p_watch_id,
    'episode_id', p_episode_id,
    'episode_state', p_episode_state,
    'outbox_count', v_outbox_inserted
  );
END;
$$;

-- 3. NODE OUTBOX-03: Atomic queue claim with FOR UPDATE SKIP LOCKED
CREATE OR REPLACE FUNCTION public.claim_notification_outbox(
  p_batch_size INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  watch_id UUID,
  episode_id TEXT,
  event_type TEXT,
  channel TEXT,
  dedupe_key TEXT,
  payload JSONB,
  attempt_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH locked_rows AS (
    SELECT no.id
    FROM public.notification_outbox no
    WHERE no.status IN ('PENDING', 'RETRYABLE_FAILED')
      AND no.next_attempt_at <= now()
    ORDER BY no.next_attempt_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.notification_outbox no
  SET status = 'PROCESSING',
      attempt_count = no.attempt_count + 1
  FROM locked_rows lr
  WHERE no.id = lr.id
  RETURNING
    no.id,
    no.watch_id,
    no.episode_id,
    no.event_type,
    no.channel,
    no.dedupe_key,
    no.payload,
    no.attempt_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_watch_evaluation TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_notification_outbox TO service_role;

COMMIT;
