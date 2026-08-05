BEGIN;

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS home_airport TEXT DEFAULT 'HAN',
  ADD COLUMN IF NOT EXISTS max_stops INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS preferred_airlines TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS cabin_class TEXT DEFAULT 'ECONOMY',
  ADD COLUMN IF NOT EXISTS max_flight_time_minutes INT,
  ADD COLUMN IF NOT EXISTS allow_self_transfer BOOLEAN DEFAULT FALSE;

ALTER TABLE public.user_preferences
  DROP CONSTRAINT IF EXISTS user_preferences_max_stops_check,
  ADD CONSTRAINT user_preferences_max_stops_check CHECK (max_stops >= 0),
  DROP CONSTRAINT IF EXISTS user_preferences_cabin_class_check,
  ADD CONSTRAINT user_preferences_cabin_class_check CHECK (cabin_class IN ('ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'));

CREATE UNIQUE INDEX IF NOT EXISTS user_preferences_user_id_idx
  ON public.user_preferences (user_id)
  WHERE user_id IS NOT NULL;

COMMIT;
