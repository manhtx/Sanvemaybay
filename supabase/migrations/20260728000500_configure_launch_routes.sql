BEGIN;

INSERT INTO public.tracked_routes (
  origin_code,
  destination_code,
  origin_name,
  destination_name,
  country,
  region,
  trip_length_days,
  departure_offsets_days,
  deal_threshold_percent
)
VALUES
  ('HAN', 'SGN', 'Hà Nội', 'TP. Hồ Chí Minh', 'Việt Nam', 'domestic', 4, ARRAY[14,45,90], 10),
  ('HAN', 'DAD', 'Hà Nội', 'Đà Nẵng', 'Việt Nam', 'domestic', 4, ARRAY[14,45,90], 10),
  ('HAN', 'PQC', 'Hà Nội', 'Phú Quốc', 'Việt Nam', 'domestic', 4, ARRAY[14,45,90], 10),
  ('HAN', 'BKK', 'Hà Nội', 'Bangkok', 'Thái Lan', 'asia', 4, ARRAY[14,45,90], 10),
  ('HAN', 'SIN', 'Hà Nội', 'Singapore', 'Singapore', 'asia', 4, ARRAY[14,45,90], 10),
  ('HAN', 'ICN', 'Hà Nội', 'Seoul', 'Hàn Quốc', 'asia', 5, ARRAY[14,45,90], 10),
  ('SGN', 'HAN', 'TP. Hồ Chí Minh', 'Hà Nội', 'Việt Nam', 'domestic', 4, ARRAY[14,45,90], 10),
  ('SGN', 'DAD', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Việt Nam', 'domestic', 4, ARRAY[14,45,90], 10),
  ('SGN', 'PQC', 'TP. Hồ Chí Minh', 'Phú Quốc', 'Việt Nam', 'domestic', 4, ARRAY[14,45,90], 10),
  ('SGN', 'BKK', 'TP. Hồ Chí Minh', 'Bangkok', 'Thái Lan', 'asia', 4, ARRAY[14,45,90], 10),
  ('SGN', 'SIN', 'TP. Hồ Chí Minh', 'Singapore', 'Singapore', 'asia', 4, ARRAY[14,45,90], 10),
  ('SGN', 'ICN', 'TP. Hồ Chí Minh', 'Seoul', 'Hàn Quốc', 'asia', 5, ARRAY[14,45,90], 10),
  ('DAD', 'HAN', 'Đà Nẵng', 'Hà Nội', 'Việt Nam', 'domestic', 4, ARRAY[14,45,90], 10),
  ('DAD', 'SGN', 'Đà Nẵng', 'TP. Hồ Chí Minh', 'Việt Nam', 'domestic', 4, ARRAY[14,45,90], 10),
  ('DAD', 'BKK', 'Đà Nẵng', 'Bangkok', 'Thái Lan', 'asia', 4, ARRAY[14,45,90], 10),
  ('DAD', 'ICN', 'Đà Nẵng', 'Seoul', 'Hàn Quốc', 'asia', 5, ARRAY[14,45,90], 10)
ON CONFLICT (origin_code, destination_code) DO UPDATE SET
  origin_name = EXCLUDED.origin_name,
  destination_name = EXCLUDED.destination_name,
  country = EXCLUDED.country,
  region = EXCLUDED.region,
  trip_length_days = EXCLUDED.trip_length_days,
  departure_offsets_days = EXCLUDED.departure_offsets_days,
  deal_threshold_percent = EXCLUDED.deal_threshold_percent,
  enabled = TRUE,
  updated_at = NOW();

COMMIT;
