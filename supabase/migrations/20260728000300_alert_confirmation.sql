BEGIN;

ALTER TABLE public.user_alerts
  ADD COLUMN IF NOT EXISTS confirmation_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS unsubscribe_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmation_expires_at TIMESTAMPTZ;

ALTER TABLE public.user_alerts
  DROP CONSTRAINT IF EXISTS user_alerts_status_check,
  ADD CONSTRAINT user_alerts_status_check
    CHECK (status IN ('pending_confirmation', 'active', 'paused', 'unsubscribed'));

CREATE UNIQUE INDEX IF NOT EXISTS user_alerts_confirmation_token_hash_idx
  ON public.user_alerts (confirmation_token_hash)
  WHERE confirmation_token_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS user_alerts_unsubscribe_token_hash_idx
  ON public.user_alerts (unsubscribe_token_hash)
  WHERE unsubscribe_token_hash IS NOT NULL;

GRANT SELECT ON TABLE public.deals TO anon, authenticated;
GRANT SELECT ON TABLE public.tracked_routes TO anon, authenticated;

ALTER TABLE public.deals ALTER COLUMN confidence DROP DEFAULT;
ALTER TABLE public.deals ALTER COLUMN deal_score DROP DEFAULT;
DROP POLICY IF EXISTS "Allow public read access to flights" ON public.flights;
REVOKE ALL ON TABLE public.flights FROM anon, authenticated;
REVOKE ALL ON TABLE public.scan_runs FROM anon, authenticated;

COMMIT;
