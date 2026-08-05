BEGIN;

ALTER TABLE public.flights
  ADD COLUMN IF NOT EXISTS link_kind TEXT NOT NULL DEFAULT 'live_source'
    CHECK (link_kind IN ('live_affiliate', 'live_source', 'indicative', 'historical', 'stale')),
  ADD COLUMN IF NOT EXISTS affiliate_network TEXT,
  ADD COLUMN IF NOT EXISTS affiliate_url TEXT;

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS link_kind TEXT NOT NULL DEFAULT 'live_source'
    CHECK (link_kind IN ('live_affiliate', 'live_source', 'indicative', 'historical', 'stale')),
  ADD COLUMN IF NOT EXISTS affiliate_network TEXT,
  ADD COLUMN IF NOT EXISTS affiliate_url TEXT;

ALTER TABLE public.deal_snapshots
  ADD COLUMN IF NOT EXISTS link_kind TEXT NOT NULL DEFAULT 'live_source'
    CHECK (link_kind IN ('live_affiliate', 'live_source', 'indicative', 'historical', 'stale')),
  ADD COLUMN IF NOT EXISTS affiliate_network TEXT,
  ADD COLUMN IF NOT EXISTS affiliate_url TEXT;

CREATE INDEX IF NOT EXISTS deals_active_link_kind_idx
  ON public.deals (link_kind, valid_until);

COMMENT ON COLUMN public.deals.booking_url IS
  'Provider/source URL. Do not treat as an affiliate URL unless link_kind=live_affiliate and affiliate_url is populated.';
COMMENT ON COLUMN public.deals.affiliate_url IS
  'Provider-issued or provider-approved affiliate redirect. Never construct from untrusted client input.';

COMMIT;
