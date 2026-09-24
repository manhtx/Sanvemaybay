BEGIN;

ALTER TABLE public.product_events
  DROP CONSTRAINT IF EXISTS product_events_event_type_check,
  ADD CONSTRAINT product_events_event_type_check
    CHECK (event_type IN ('detail_view', 'bookmark', 'share', 'booking_click', 'alert_created', 'web_vital'));

COMMIT;
