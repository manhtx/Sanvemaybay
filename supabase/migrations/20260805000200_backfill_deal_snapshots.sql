BEGIN;

INSERT INTO public.deal_snapshots (
  deal_id, itinerary_key, from_code, to_code, depart_date, return_date,
  price, normal_price, discount, deal_score, confidence, currency,
  booking_url, source, observed_at, valid_until, payload
)
SELECT
  d.id,
  COALESCE(d.itinerary_key, d.id::text),
  d.from_code,
  d.to_code,
  d.depart_date,
  d.return_date,
  d.price,
  d.normal_price,
  d.discount,
  COALESCE(d.deal_score, 0),
  d.confidence,
  d.currency,
  d.booking_url,
  COALESCE(d.source, 'historical_provider_record'),
  COALESCE(d.observed_at, d.created_at),
  COALESCE(d.valid_until, d.updated_at, NOW()),
  to_jsonb(d)
FROM public.deals d
WHERE d.id IS NOT NULL
ON CONFLICT (itinerary_key, observed_at) DO NOTHING;

COMMIT;
