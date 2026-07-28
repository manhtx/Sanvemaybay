-- Create raw flights table for data collection (Module 1)
CREATE TABLE IF NOT EXISTS public.flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin TEXT NOT NULL,
  origin_code TEXT NOT NULL,
  destination TEXT NOT NULL,
  destination_code TEXT NOT NULL,
  price BIGINT NOT NULL,
  date DATE NOT NULL,
  airline TEXT NOT NULL,
  airline_code TEXT NOT NULL,
  stops INT NOT NULL DEFAULT 0,
  duration TEXT NOT NULL,
  "timestamp" TIMESTAMPTZ DEFAULT NOW()
);

-- Add analysis columns to deals table (Module 2 & 5)
ALTER TABLE public.deals 
  ADD COLUMN IF NOT EXISTS confidence FLOAT,
  ADD COLUMN IF NOT EXISTS deal_score INT,
  ADD COLUMN IF NOT EXISTS ai_reasoning TEXT,
  ADD COLUMN IF NOT EXISTS market_stats JSONB DEFAULT '{}'::jsonb;

-- Create a view for calculating market averages per route (Module 2.1)
CREATE OR REPLACE VIEW public.route_market_stats AS
SELECT 
    origin_code, 
    destination_code, 
    AVG(price) FILTER (WHERE "timestamp" > NOW() - INTERVAL '7 days') as avg_7d,
    AVG(price) FILTER (WHERE "timestamp" > NOW() - INTERVAL '30 days') as avg_30d,
    MIN(price) as hist_min
FROM public.flights
GROUP BY origin_code, destination_code;

-- RLS for new table
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;
