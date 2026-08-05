BEGIN;

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS departure_from DATE,
  ADD COLUMN IF NOT EXISTS departure_to DATE;

ALTER TABLE public.user_preferences
  DROP CONSTRAINT IF EXISTS user_preferences_departure_range_check,
  ADD CONSTRAINT user_preferences_departure_range_check
  CHECK (departure_from IS NULL OR departure_to IS NULL OR departure_from <= departure_to);

COMMIT;
