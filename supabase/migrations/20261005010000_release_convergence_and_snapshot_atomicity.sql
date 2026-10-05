BEGIN;

-- 1. Atomic publication RPC for observed fare generations
CREATE OR REPLACE FUNCTION public.publish_observed_generation(
  p_generation_id UUID,
  p_row_count INT,
  p_published_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_generation_id IS NULL THEN
    RAISE EXCEPTION 'generation_id is required';
  END IF;

  -- Atomically update or insert the single active generation record
  INSERT INTO public.active_observed_generation (id, active_generation_id, row_count, published_at)
  VALUES (1, p_generation_id, COALESCE(p_row_count, 0), COALESCE(p_published_at, NOW()))
  ON CONFLICT (id) DO UPDATE SET
    active_generation_id = EXCLUDED.active_generation_id,
    row_count = EXCLUDED.row_count,
    published_at = EXCLUDED.published_at;

  -- Clean up prior generations
  DELETE FROM public.observed_fare_snapshots
  WHERE generation_id IS NOT NULL AND generation_id <> p_generation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_observed_generation(UUID, INT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_observed_generation(UUID, INT, TIMESTAMPTZ) TO service_role;

-- 2. Update prepare_account_deletion to include user_saved_opportunities
CREATE OR REPLACE FUNCTION public.prepare_account_deletion(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  event_count INTEGER := 0;
  alert_count INTEGER := 0;
  bookmark_count INTEGER := 0;
  saved_count INTEGER := 0;
  preference_count INTEGER := 0;
  result JSONB;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user id is required';
  END IF;

  INSERT INTO public.account_deletion_requests (user_id, status, attempts)
  VALUES (p_user_id, 'requested', 1)
  ON CONFLICT (user_id) DO UPDATE SET
    status = 'requested',
    attempts = public.account_deletion_requests.attempts + 1,
    updated_at = now(),
    last_error_code = NULL;

  WITH deleted AS (
    DELETE FROM public.product_events WHERE user_id = p_user_id RETURNING 1
  ) SELECT count(*) INTO event_count FROM deleted;

  WITH deleted AS (
    DELETE FROM public.user_alerts WHERE user_id = p_user_id RETURNING 1
  ) SELECT count(*) INTO alert_count FROM deleted;

  WITH deleted AS (
    DELETE FROM public.user_bookmarks WHERE user_id = p_user_id RETURNING 1
  ) SELECT count(*) INTO bookmark_count FROM deleted;

  WITH deleted AS (
    DELETE FROM public.user_saved_opportunities WHERE user_id = p_user_id RETURNING 1
  ) SELECT count(*) INTO saved_count FROM deleted;

  WITH deleted AS (
    DELETE FROM public.user_preferences WHERE user_id = p_user_id RETURNING 1
  ) SELECT count(*) INTO preference_count FROM deleted;

  result := jsonb_build_object(
    'product_events', event_count,
    'alerts', alert_count,
    'bookmarks', bookmark_count,
    'saved_opportunities', saved_count,
    'preferences', preference_count
  );

  UPDATE public.account_deletion_requests
  SET status = 'data_deleted',
      data_deleted_at = COALESCE(data_deleted_at, now()),
      updated_at = now(),
      deletion_counts = jsonb_build_object(
        'product_events', COALESCE((deletion_counts->>'product_events')::INTEGER, 0) + event_count,
        'alerts', COALESCE((deletion_counts->>'alerts')::INTEGER, 0) + alert_count,
        'bookmarks', COALESCE((deletion_counts->>'bookmarks')::INTEGER, 0) + bookmark_count,
        'saved_opportunities', COALESCE((deletion_counts->>'saved_opportunities')::INTEGER, 0) + saved_count,
        'preferences', COALESCE((deletion_counts->>'preferences')::INTEGER, 0) + preference_count
      ),
      last_error_code = NULL
  WHERE user_id = p_user_id;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.prepare_account_deletion(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_account_deletion(UUID) TO service_role;

-- 3. Extend tracked_routes with operational scheduling columns
ALTER TABLE public.tracked_routes
  ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_success_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_failure_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failure_class TEXT,
  ADD COLUMN IF NOT EXISTS consecutive_failures INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS tracked_routes_schedule_idx
  ON public.tracked_routes (enabled, last_attempt_at ASC NULLS FIRST);

COMMIT;
