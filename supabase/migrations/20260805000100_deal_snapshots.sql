BEGIN;

CREATE TABLE IF NOT EXISTS public.deal_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  itinerary_key TEXT NOT NULL,
  from_code TEXT NOT NULL,
  to_code TEXT NOT NULL,
  depart_date DATE NOT NULL,
  return_date DATE,
  price BIGINT NOT NULL,
  normal_price BIGINT NOT NULL,
  discount INT NOT NULL,
  deal_score INT NOT NULL,
  confidence FLOAT,
  currency TEXT NOT NULL DEFAULT 'VND',
  booking_url TEXT,
  source TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (itinerary_key, observed_at)
);

CREATE INDEX IF NOT EXISTS deal_snapshots_hot_idx
  ON public.deal_snapshots (deal_score DESC, discount DESC, observed_at DESC);
CREATE INDEX IF NOT EXISTS deal_snapshots_route_date_idx
  ON public.deal_snapshots (from_code, to_code, depart_date, observed_at DESC);

ALTER TABLE public.deal_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to deal snapshots"
  ON public.deal_snapshots FOR SELECT USING (true);

COMMIT;
