BEGIN;

ALTER TABLE public.user_alerts
  ADD COLUMN IF NOT EXISTS date_from DATE,
  ADD COLUMN IF NOT EXISTS date_to DATE;

ALTER TABLE public.user_alerts
  DROP CONSTRAINT IF EXISTS user_alerts_date_range_check,
  ADD CONSTRAINT user_alerts_date_range_check
    CHECK (date_from IS NULL OR date_to IS NULL OR date_from <= date_to);

COMMIT;
