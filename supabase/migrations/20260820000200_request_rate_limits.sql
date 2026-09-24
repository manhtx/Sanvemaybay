BEGIN;

CREATE TABLE IF NOT EXISTS public.request_rate_limits (
  action TEXT NOT NULL,
  bucket_key TEXT NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL,
  request_count INT NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (action, bucket_key)
);

ALTER TABLE public.request_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.request_rate_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_request_budget(
  p_action TEXT,
  p_bucket_key TEXT,
  p_limit INT,
  p_window_seconds INT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INT;
BEGIN
  IF p_action IS NULL OR p_bucket_key IS NULL OR p_limit < 1 OR p_window_seconds < 1 THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.request_rate_limits AS limits (
    action, bucket_key, window_started_at, request_count, updated_at
  ) VALUES (
    p_action, p_bucket_key, NOW(), 1, NOW()
  )
  ON CONFLICT (action, bucket_key) DO UPDATE SET
    window_started_at = CASE
      WHEN limits.window_started_at <= NOW() - make_interval(secs => p_window_seconds) THEN NOW()
      ELSE limits.window_started_at
    END,
    request_count = CASE
      WHEN limits.window_started_at <= NOW() - make_interval(secs => p_window_seconds) THEN 1
      ELSE limits.request_count + 1
    END,
    updated_at = NOW()
  RETURNING request_count INTO current_count;

  RETURN current_count <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_request_budget(TEXT, TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_request_budget(TEXT, TEXT, INT, INT) TO service_role;

CREATE INDEX IF NOT EXISTS request_rate_limits_updated_idx
  ON public.request_rate_limits (updated_at);

COMMIT;
