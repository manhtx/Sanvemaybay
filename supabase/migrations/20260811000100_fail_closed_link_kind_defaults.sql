BEGIN;

ALTER TABLE public.flights ALTER COLUMN link_kind SET DEFAULT 'indicative';
ALTER TABLE public.deals ALTER COLUMN link_kind SET DEFAULT 'indicative';
ALTER TABLE public.deal_snapshots ALTER COLUMN link_kind SET DEFAULT 'indicative';

UPDATE public.flights
SET link_kind = 'historical'
WHERE source ILIKE '%archive%' AND link_kind = 'live_source';

UPDATE public.deals
SET link_kind = 'historical'
WHERE source ILIKE '%archive%' AND link_kind = 'live_source';

UPDATE public.deal_snapshots
SET link_kind = 'historical'
WHERE source ILIKE '%archive%' AND link_kind = 'live_source';

COMMIT;
