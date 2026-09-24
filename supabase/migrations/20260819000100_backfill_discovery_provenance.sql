BEGIN;

UPDATE public.flights
SET link_kind = 'indicative', affiliate_network = NULL, affiliate_url = NULL
WHERE link_kind = 'live_source'
  AND (source = 'fast_flights_google' OR source ILIKE 'travelpayouts%');

UPDATE public.deals
SET link_kind = 'indicative', affiliate_network = NULL, affiliate_url = NULL
WHERE link_kind = 'live_source'
  AND (source = 'fast_flights_google' OR source ILIKE 'travelpayouts%');

UPDATE public.deal_snapshots
SET link_kind = 'indicative', affiliate_network = NULL, affiliate_url = NULL
WHERE link_kind = 'live_source'
  AND (source = 'fast_flights_google' OR source ILIKE 'travelpayouts%');

COMMIT;
