BEGIN;

CREATE TABLE IF NOT EXISTS public.tracked_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_code TEXT NOT NULL,
  destination_code TEXT NOT NULL,
  origin_name TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT NOT NULL CHECK (
    region IN ('asia', 'europe', 'americas', 'oceania', 'africa', 'middle_east', 'domestic')
  ),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  trip_length_days INT NOT NULL DEFAULT 4 CHECK (trip_length_days BETWEEN 1 AND 30),
  departure_offset_days INT NOT NULL DEFAULT 30 CHECK (departure_offset_days BETWEEN 1 AND 365),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (origin_code, destination_code)
);

CREATE TABLE IF NOT EXISTS public.scan_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.tracked_routes(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  response_payload JSONB,
  error_message TEXT,
  observations_saved INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.flights
  ADD COLUMN IF NOT EXISTS route_id UUID REFERENCES public.tracked_routes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS scan_run_id UUID REFERENCES public.scan_runs(id) ON DELETE SET NULL;

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS tracked_routes_enabled_idx
  ON public.tracked_routes (enabled);
CREATE INDEX IF NOT EXISTS scan_runs_route_started_idx
  ON public.scan_runs (route_id, started_at DESC);
CREATE INDEX IF NOT EXISTS deals_valid_until_idx
  ON public.deals (valid_until);

ALTER TABLE public.tracked_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to tracked routes"
  ON public.tracked_routes FOR SELECT
  USING (enabled = TRUE);

COMMIT;
