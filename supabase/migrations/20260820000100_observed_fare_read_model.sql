BEGIN;

CREATE TABLE IF NOT EXISTS public.observed_fare_snapshots (
  dedupe_key TEXT PRIMARY KEY,
  observation_id UUID NOT NULL REFERENCES public.flights(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  origin_code TEXT NOT NULL,
  destination TEXT NOT NULL,
  destination_code TEXT NOT NULL,
  country TEXT,
  region TEXT,
  price BIGINT NOT NULL CHECK (price > 0),
  currency TEXT NOT NULL DEFAULT 'VND',
  depart_date DATE NOT NULL,
  return_date DATE,
  airline TEXT NOT NULL,
  airline_code TEXT NOT NULL,
  flight_number TEXT,
  stops INT NOT NULL DEFAULT 0 CHECK (stops >= 0),
  duration TEXT NOT NULL,
  booking_url TEXT NOT NULL,
  source TEXT NOT NULL,
  link_kind TEXT NOT NULL CHECK (link_kind = 'indicative'),
  observed_at TIMESTAMPTZ NOT NULL,
  baseline_price BIGINT,
  discount_percent NUMERIC(5,1),
  sample_size INT NOT NULL DEFAULT 0 CHECK (sample_size >= 0),
  percentile INT,
  deal_score INT NOT NULL CHECK (deal_score BETWEEN 0 AND 100),
  deal_label TEXT NOT NULL,
  confidence_percent INT NOT NULL CHECK (confidence_percent BETWEEN 0 AND 100),
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('low', 'medium', 'high')),
  discount_strength TEXT NOT NULL CHECK (discount_strength IN ('unknown', 'light', 'medium', 'strong')),
  algorithm_version TEXT NOT NULL,
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.observed_fare_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.observed_fare_snapshots FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS observed_fare_snapshot_rank_idx
  ON public.observed_fare_snapshots (discount_percent DESC NULLS LAST, deal_score DESC, observed_at DESC);
CREATE INDEX IF NOT EXISTS observed_fare_snapshot_filter_idx
  ON public.observed_fare_snapshots (origin_code, destination_code, region, depart_date);
CREATE INDEX IF NOT EXISTS observed_fare_snapshot_observed_idx
  ON public.observed_fare_snapshots (observed_at DESC);

COMMIT;
