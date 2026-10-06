BEGIN;

-- 1. Drop DEFAULT 20 on user_alerts.discount_threshold so target-price watches are not forced to have 20% discount
ALTER TABLE public.user_alerts
  ALTER COLUMN discount_threshold DROP DEFAULT;

UPDATE public.user_alerts
SET discount_threshold = NULL
WHERE budget IS NOT NULL AND discount_threshold = 20;

-- 2. Expand product_events event_type to include full canonical product event taxonomy
ALTER TABLE public.product_events
  DROP CONSTRAINT IF EXISTS product_events_event_type_check,
  ADD CONSTRAINT product_events_event_type_check
    CHECK (event_type IN (
      'detail_view',
      'bookmark',
      'share',
      'booking_click',
      'alert_created',
      'web_vital',
      'opportunity_impression',
      'opportunity_open',
      'evidence_engagement',
      'watch_created',
      'watch_matched',
      'verify_click',
      'verify_result',
      'alert_delivered',
      'page_view'
    ));

COMMIT;
