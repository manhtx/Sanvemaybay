BEGIN;

ALTER TABLE public.notification_deliveries
  ADD COLUMN IF NOT EXISTS attempt_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

ALTER TABLE public.notification_deliveries
  DROP CONSTRAINT IF EXISTS notification_deliveries_attempt_count_check,
  ADD CONSTRAINT notification_deliveries_attempt_count_check CHECK (attempt_count >= 0);

COMMIT;
