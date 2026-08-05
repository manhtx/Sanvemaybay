BEGIN;

-- Add more distinct future travel dates; the scanner still enforces its
-- one-year provider window and batches these offsets across live cycles.
ALTER TABLE public.tracked_routes
  DROP CONSTRAINT IF EXISTS tracked_routes_departure_offsets_check;

ALTER TABLE public.tracked_routes
  ADD CONSTRAINT tracked_routes_departure_offsets_check
  CHECK (cardinality(departure_offsets_days) BETWEEN 1 AND 15);

UPDATE public.tracked_routes
SET departure_offsets_days = ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],
    updated_at = NOW()
WHERE enabled = TRUE;

COMMIT;
