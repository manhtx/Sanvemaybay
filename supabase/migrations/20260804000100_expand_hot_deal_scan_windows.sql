BEGIN;

-- Keep the launch route set, but collect multiple future travel windows so
-- the 1,000-hot-deal target can represent distinct dates and prices.
ALTER TABLE public.tracked_routes
  ALTER COLUMN departure_offsets_days SET DEFAULT ARRAY[7, 14, 30, 45, 60, 90, 180, 270];

UPDATE public.tracked_routes
SET departure_offsets_days = ARRAY[7, 14, 30, 45, 60, 90, 180, 270],
    updated_at = NOW()
WHERE enabled = TRUE;

COMMIT;
