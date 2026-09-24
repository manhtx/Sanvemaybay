BEGIN;

CREATE OR REPLACE FUNCTION public.run_retention_cleanup(p_dry_run BOOLEAN DEFAULT TRUE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result JSONB;
BEGIN
  IF p_dry_run THEN
    SELECT jsonb_build_object(
      'dry_run', TRUE,
      'flights', (SELECT count(*) FROM public.flights WHERE "timestamp" < now() - interval '7 days'),
      'request_rate_limits', (SELECT count(*) FROM public.request_rate_limits WHERE updated_at < now() - interval '2 days'),
      'product_events', (SELECT count(*) FROM public.product_events WHERE created_at < now() - interval '90 days'),
      'scan_runs', (SELECT count(*) FROM public.scan_runs WHERE started_at < now() - interval '90 days'),
      'notification_deliveries', (SELECT count(*) FROM public.notification_deliveries WHERE created_at < now() - interval '180 days'),
      'expired_alerts', (SELECT count(*) FROM public.user_alerts WHERE status = 'pending_confirmation' AND confirmation_expires_at < now() - interval '30 days'),
      'unsubscribed_alerts', (SELECT count(*) FROM public.user_alerts WHERE status = 'unsubscribed' AND updated_at < now() - interval '30 days')
    ) INTO result;
    RETURN result;
  END IF;

  WITH deleted AS (DELETE FROM public.notification_deliveries WHERE created_at < now() - interval '180 days' RETURNING 1)
  SELECT jsonb_build_object('notification_deliveries', count(*)) INTO result FROM deleted;

  WITH deleted AS (DELETE FROM public.user_alerts WHERE (status = 'pending_confirmation' AND confirmation_expires_at < now() - interval '30 days') OR (status = 'unsubscribed' AND updated_at < now() - interval '30 days') RETURNING 1)
  SELECT result || jsonb_build_object('alerts', count(*)) INTO result FROM deleted;

  WITH deleted AS (DELETE FROM public.product_events WHERE created_at < now() - interval '90 days' RETURNING 1)
  SELECT result || jsonb_build_object('product_events', count(*)) INTO result FROM deleted;

  WITH deleted AS (DELETE FROM public.request_rate_limits WHERE updated_at < now() - interval '2 days' RETURNING 1)
  SELECT result || jsonb_build_object('request_rate_limits', count(*)) INTO result FROM deleted;

  WITH deleted AS (DELETE FROM public.scan_runs WHERE started_at < now() - interval '90 days' RETURNING 1)
  SELECT result || jsonb_build_object('scan_runs', count(*)) INTO result FROM deleted;

  WITH deleted AS (DELETE FROM public.flights WHERE "timestamp" < now() - interval '7 days' RETURNING 1)
  SELECT result || jsonb_build_object('flights', count(*), 'dry_run', FALSE) INTO result FROM deleted;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.run_retention_cleanup(BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_retention_cleanup(BOOLEAN) TO service_role;

COMMIT;
