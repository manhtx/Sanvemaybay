BEGIN;

DROP POLICY IF EXISTS "public can record anonymous product events" ON public.product_events;
REVOKE INSERT ON TABLE public.product_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.product_events FROM PUBLIC, anon, authenticated;

ALTER TABLE public.product_events
  DROP CONSTRAINT IF EXISTS product_events_entity_id_length_check,
  ADD CONSTRAINT product_events_entity_id_length_check
    CHECK (entity_id IS NULL OR char_length(entity_id) <= 120),
  DROP CONSTRAINT IF EXISTS product_events_metadata_size_check,
  ADD CONSTRAINT product_events_metadata_size_check
    CHECK (pg_column_size(metadata) <= 2048);

GRANT ALL ON TABLE public.product_events TO service_role;

COMMIT;
