BEGIN;

ALTER TABLE public.flights
  ADD COLUMN IF NOT EXISTS return_date DATE,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'VND',
  ADD COLUMN IF NOT EXISTS flight_number TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS booking_url TEXT,
  ADD COLUMN IF NOT EXISTS itinerary_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS flights_observation_unique
  ON public.flights (itinerary_key, "timestamp");

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS itinerary_key TEXT,
  ADD COLUMN IF NOT EXISTS observed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS deals_itinerary_unique
  ON public.deals (itinerary_key);

CREATE OR REPLACE VIEW public.route_market_stats AS
SELECT
  origin_code,
  destination_code,
  AVG(price) FILTER (WHERE "timestamp" > NOW() - INTERVAL '7 days') AS avg_7d,
  AVG(price) FILTER (WHERE "timestamp" > NOW() - INTERVAL '30 days') AS avg_30d,
  MIN(price) AS hist_min,
  COUNT(DISTINCT "timestamp") FILTER (
    WHERE "timestamp" > NOW() - INTERVAL '30 days'
  ) AS samples_30d
FROM public.flights
GROUP BY origin_code, destination_code;

COMMIT;
