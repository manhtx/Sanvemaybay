BEGIN;

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  user_id UUID PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'data_deleted', 'auth_delete_failed', 'completed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_deleted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  deletion_counts JSONB NOT NULL DEFAULT '{}'::JSONB
    CHECK (jsonb_typeof(deletion_counts) = 'object'),
  last_error_code TEXT CHECK (last_error_code IS NULL OR char_length(last_error_code) <= 80)
);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.account_deletion_requests FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.account_deletion_requests TO service_role;

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
    DELETE FROM public.user_preferences WHERE user_id = p_user_id RETURNING 1
  ) SELECT count(*) INTO preference_count FROM deleted;

  result := jsonb_build_object(
    'product_events', event_count,
    'alerts', alert_count,
    'bookmarks', bookmark_count,
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
        'preferences', COALESCE((deletion_counts->>'preferences')::INTEGER, 0) + preference_count
      ),
      last_error_code = NULL
  WHERE user_id = p_user_id;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.prepare_account_deletion(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_account_deletion(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.cleanup_account_deletion_requests(p_dry_run BOOLEAN DEFAULT TRUE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  affected INTEGER := 0;
BEGIN
  IF p_dry_run THEN
    SELECT count(*) INTO affected
    FROM public.account_deletion_requests
    WHERE status = 'completed'
      AND completed_at < now() - interval '180 days';
  ELSE
    WITH deleted AS (
      DELETE FROM public.account_deletion_requests
      WHERE status = 'completed'
        AND completed_at < now() - interval '180 days'
      RETURNING 1
    ) SELECT count(*) INTO affected FROM deleted;
  END IF;

  RETURN jsonb_build_object(
    'dry_run', p_dry_run,
    'completed_account_deletion_requests', affected
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_account_deletion_requests(BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_account_deletion_requests(BOOLEAN) TO service_role;

COMMIT;
