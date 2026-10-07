-- Migration: 20261007000100_canonical_fare_observations.sql
-- Fulfills REQ-HIST-001..010, REQ-STATS-001..003, REQ-ID-001..006, REQ-SEC-001
-- Introduces Canonical Observation Ledger (fare_observations), Idempotent Fingerprinting,
-- Route Market Stats V2, and secures travel_intents against anonymous enumeration.

BEGIN;

-- 1. Canonical Observation Ledger (REQ-HIST-005..007)
CREATE TABLE IF NOT EXISTS public.fare_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  observation_schema_version INT NOT NULL DEFAULT 1,
  provider TEXT NOT NULL,
  source_observation_id TEXT,
  scan_run_id UUID,
  offer_variant_id TEXT NOT NULL,
  observation_fingerprint TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  origin_airport TEXT NOT NULL,
  destination_airport TEXT NOT NULL,
  depart_local_date DATE NOT NULL,
  return_local_date DATE,
  journey_type TEXT NOT NULL DEFAULT 'ONE_WAY',
  cabin TEXT NOT NULL DEFAULT 'ECONOMY',
  adults INT NOT NULL DEFAULT 1,
  children INT NOT NULL DEFAULT 0,
  infants INT NOT NULL DEFAULT 0,
  pricing_unit TEXT NOT NULL DEFAULT 'PER_TRAVELER',
  currency TEXT NOT NULL DEFAULT 'VND',
  price NUMERIC NOT NULL CHECK (price > 0),
  stops INT NOT NULL DEFAULT 0,
  duration_minutes INT,
  airline TEXT,
  airline_code TEXT,
  flight_number TEXT,
  source_quality TEXT NOT NULL DEFAULT 'PROVEN_PROVIDER',
  parser_version TEXT DEFAULT 'v1',
  payload_schema_fingerprint TEXT,
  release_sha TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fare_observations_unique_provider_fingerprint UNIQUE (provider, observation_fingerprint)
);

-- Performance & Coverage Indexes
CREATE INDEX IF NOT EXISTS idx_fare_obs_route_observed
  ON public.fare_observations (origin_airport, destination_airport, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_fare_obs_route_dates
  ON public.fare_observations (origin_airport, destination_airport, depart_local_date, return_local_date);

CREATE INDEX IF NOT EXISTS idx_fare_obs_offer_variant
  ON public.fare_observations (offer_variant_id);

CREATE INDEX IF NOT EXISTS idx_fare_obs_fingerprint
  ON public.fare_observations (observation_fingerprint);

-- RLS Policies on fare_observations
ALTER TABLE public.fare_observations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to fare observations" ON public.fare_observations;
CREATE POLICY "Allow public read access to fare observations"
  ON public.fare_observations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role manage fare observations" ON public.fare_observations;
CREATE POLICY "Service role manage fare observations"
  ON public.fare_observations FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- 2. Route Market Stats V2 (REQ-STATS-001..003)
-- Derived strictly from canonical unique fare_observations
CREATE OR REPLACE VIEW public.route_market_stats_v2 AS
SELECT
  origin_airport,
  destination_airport,
  COUNT(id) AS unique_observation_count,
  COUNT(DISTINCT scan_run_id) AS unique_scan_epoch_count,
  MAX(observed_at) AS latest_observed_at,
  AVG(price) FILTER (WHERE observed_at > NOW() - INTERVAL '7 days') AS avg_7d,
  AVG(price) FILTER (WHERE observed_at > NOW() - INTERVAL '30 days') AS avg_30d,
  MIN(price) AS hist_min,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) FILTER (WHERE observed_at > NOW() - INTERVAL '30 days') AS median_30d
FROM public.fare_observations
GROUP BY origin_airport, destination_airport;

GRANT SELECT ON public.route_market_stats_v2 TO anon, authenticated, service_role;

-- 3. Security Hardening on travel_intents (REQ-SEC-001, K050, K051)
-- Drop dangerous open anonymous policies that permitted table-wide enumeration and raw inserts
DROP POLICY IF EXISTS "Allow public read access to travel_intents" ON public.travel_intents;
DROP POLICY IF EXISTS "Allow public insert to travel_intents" ON public.travel_intents;

ALTER TABLE public.travel_intents
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_ephemeral BOOLEAN NOT NULL DEFAULT true;

-- Users may only read and manage their own persisted travel intents
CREATE POLICY "Users manage their own travel intents"
  ON public.travel_intents FOR ALL
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Service role retains full operational control for background jobs and watch evaluators
CREATE POLICY "Service role manage travel intents"
  ON public.travel_intents FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- 4. Mark legacy price_history as legacy reference (REQ-HIST-009)
COMMENT ON TABLE public.price_history IS 'LEGACY_UNTRUSTED: Subject to historical replay inflation. Do not use for statistical calculations.';

COMMIT;
