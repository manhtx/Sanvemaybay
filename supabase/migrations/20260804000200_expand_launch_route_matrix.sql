BEGIN;

-- Expand source-backed coverage; existing routes remain untouched.
INSERT INTO public.tracked_routes (
  origin_code, destination_code, origin_name, destination_name,
  country, region, trip_length_days, departure_offsets_days, deal_threshold_percent
)
VALUES
  ('HAN','KUL','Hà Nội','Kuala Lumpur','Malaysia','asia',4,ARRAY[7,14,30,45,60,90,180,270],10),
  ('HAN','TPE','Hà Nội','Đài Bắc','Đài Loan','asia',5,ARRAY[7,14,30,45,60,90,180,270],10),
  ('HAN','HKG','Hà Nội','Hồng Kông','Hồng Kông','asia',4,ARRAY[7,14,30,45,60,90,180,270],10),
  ('HAN','NRT','Hà Nội','Tokyo','Nhật Bản','asia',6,ARRAY[7,14,30,45,60,90,180,270],10),
  ('HAN','KIX','Hà Nội','Osaka','Nhật Bản','asia',6,ARRAY[7,14,30,45,60,90,180,270],10),
  ('HAN','SYD','Hà Nội','Sydney','Úc','oceania',8,ARRAY[7,14,30,45,60,90,180,270],10),
  ('HAN','MEL','Hà Nội','Melbourne','Úc','oceania',8,ARRAY[7,14,30,45,60,90,180,270],10),
  ('HAN','DXB','Hà Nội','Dubai','UAE','middle_east',7,ARRAY[7,14,30,45,60,90,180,270],10),
  ('HAN','DOH','Hà Nội','Doha','Qatar','middle_east',7,ARRAY[7,14,30,45,60,90,180,270],10),
  ('HAN','IST','Hà Nội','Istanbul','Thổ Nhĩ Kỳ','europe',8,ARRAY[7,14,30,45,60,90,180,270],10),
  ('HAN','CDG','Hà Nội','Paris','Pháp','europe',8,ARRAY[7,14,30,45,60,90,180,270],10),
  ('HAN','AMS','Hà Nội','Amsterdam','Hà Lan','europe',8,ARRAY[7,14,30,45,60,90,180,270],10),
  ('SGN','KUL','TP. Hồ Chí Minh','Kuala Lumpur','Malaysia','asia',4,ARRAY[7,14,30,45,60,90,180,270],10),
  ('SGN','TPE','TP. Hồ Chí Minh','Đài Bắc','Đài Loan','asia',5,ARRAY[7,14,30,45,60,90,180,270],10),
  ('SGN','HKG','TP. Hồ Chí Minh','Hồng Kông','Hồng Kông','asia',4,ARRAY[7,14,30,45,60,90,180,270],10),
  ('SGN','NRT','TP. Hồ Chí Minh','Tokyo','Nhật Bản','asia',6,ARRAY[7,14,30,45,60,90,180,270],10),
  ('SGN','KIX','TP. Hồ Chí Minh','Osaka','Nhật Bản','asia',6,ARRAY[7,14,30,45,60,90,180,270],10),
  ('SGN','SYD','TP. Hồ Chí Minh','Sydney','Úc','oceania',8,ARRAY[7,14,30,45,60,90,180,270],10),
  ('SGN','MEL','TP. Hồ Chí Minh','Melbourne','Úc','oceania',8,ARRAY[7,14,30,45,60,90,180,270],10),
  ('SGN','DXB','TP. Hồ Chí Minh','Dubai','UAE','middle_east',7,ARRAY[7,14,30,45,60,90,180,270],10),
  ('SGN','DOH','TP. Hồ Chí Minh','Doha','Qatar','middle_east',7,ARRAY[7,14,30,45,60,90,180,270],10),
  ('SGN','IST','TP. Hồ Chí Minh','Istanbul','Thổ Nhĩ Kỳ','europe',8,ARRAY[7,14,30,45,60,90,180,270],10),
  ('SGN','CDG','TP. Hồ Chí Minh','Paris','Pháp','europe',8,ARRAY[7,14,30,45,60,90,180,270],10),
  ('SGN','AMS','TP. Hồ Chí Minh','Amsterdam','Hà Lan','europe',8,ARRAY[7,14,30,45,60,90,180,270],10),
  ('DAD','SIN','Đà Nẵng','Singapore','Singapore','asia',4,ARRAY[7,14,30,45,60,90,180,270],10),
  ('DAD','KUL','Đà Nẵng','Kuala Lumpur','Malaysia','asia',4,ARRAY[7,14,30,45,60,90,180,270],10),
  ('DAD','TPE','Đà Nẵng','Đài Bắc','Đài Loan','asia',5,ARRAY[7,14,30,45,60,90,180,270],10),
  ('DAD','HKG','Đà Nẵng','Hồng Kông','Hồng Kông','asia',4,ARRAY[7,14,30,45,60,90,180,270],10),
  ('DAD','NRT','Đà Nẵng','Tokyo','Nhật Bản','asia',6,ARRAY[7,14,30,45,60,90,180,270],10),
  ('DAD','KIX','Đà Nẵng','Osaka','Nhật Bản','asia',6,ARRAY[7,14,30,45,60,90,180,270],10),
  ('DAD','SYD','Đà Nẵng','Sydney','Úc','oceania',8,ARRAY[7,14,30,45,60,90,180,270],10),
  ('DAD','MEL','Đà Nẵng','Melbourne','Úc','oceania',8,ARRAY[7,14,30,45,60,90,180,270],10),
  ('PQC','HAN','Phú Quốc','Hà Nội','Việt Nam','domestic',4,ARRAY[7,14,30,45,60,90,180,270],10),
  ('PQC','SGN','Phú Quốc','TP. Hồ Chí Minh','Việt Nam','domestic',4,ARRAY[7,14,30,45,60,90,180,270],10),
  ('PQC','DAD','Phú Quốc','Đà Nẵng','Việt Nam','domestic',4,ARRAY[7,14,30,45,60,90,180,270],10),
  ('PQC','BKK','Phú Quốc','Bangkok','Thái Lan','asia',4,ARRAY[7,14,30,45,60,90,180,270],10),
  ('PQC','SIN','Phú Quốc','Singapore','Singapore','asia',4,ARRAY[7,14,30,45,60,90,180,270],10),
  ('PQC','KUL','Phú Quốc','Kuala Lumpur','Malaysia','asia',4,ARRAY[7,14,30,45,60,90,180,270],10),
  ('PQC','TPE','Phú Quốc','Đài Bắc','Đài Loan','asia',5,ARRAY[7,14,30,45,60,90,180,270],10),
  ('PQC','ICN','Phú Quốc','Seoul','Hàn Quốc','asia',5,ARRAY[7,14,30,45,60,90,180,270],10)
ON CONFLICT (origin_code, destination_code) DO UPDATE SET
  enabled = TRUE,
  departure_offsets_days = EXCLUDED.departure_offsets_days,
  updated_at = NOW();

COMMIT;
