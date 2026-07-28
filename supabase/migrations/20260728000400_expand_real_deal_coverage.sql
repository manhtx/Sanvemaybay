BEGIN;

ALTER TABLE public.tracked_routes
  ADD COLUMN IF NOT EXISTS departure_offsets_days INT[] NOT NULL DEFAULT ARRAY[14, 30, 60, 90],
  ADD COLUMN IF NOT EXISTS deal_threshold_percent INT NOT NULL DEFAULT 10;

ALTER TABLE public.tracked_routes
  ADD CONSTRAINT tracked_routes_departure_offsets_check
    CHECK (cardinality(departure_offsets_days) BETWEEN 1 AND 8),
  ADD CONSTRAINT tracked_routes_deal_threshold_check
    CHECK (deal_threshold_percent BETWEEN 5 AND 50);

COMMIT;
