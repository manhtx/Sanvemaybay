BEGIN;

ALTER TABLE public.user_alerts
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS origin_code TEXT,
  ADD COLUMN IF NOT EXISTS destination_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_threshold INT DEFAULT 20,
  ADD COLUMN IF NOT EXISTS preferred_regions TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS frequency TEXT NOT NULL DEFAULT 'instant',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.user_alerts
  DROP CONSTRAINT IF EXISTS user_alerts_frequency_check,
  ADD CONSTRAINT user_alerts_frequency_check
    CHECK (frequency IN ('instant', 'daily')),
  DROP CONSTRAINT IF EXISTS user_alerts_status_check,
  ADD CONSTRAINT user_alerts_status_check
    CHECK (status IN ('active', 'paused', 'unsubscribed'));

CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES public.user_alerts(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'telegram')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  provider_message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (alert_id, deal_id, channel)
);

ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their notification deliveries"
  ON public.notification_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_alerts
      WHERE user_alerts.id = notification_deliveries.alert_id
        AND user_alerts.user_id = auth.uid()
    )
  );

COMMIT;
