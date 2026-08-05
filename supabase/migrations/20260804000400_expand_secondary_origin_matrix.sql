BEGIN;

INSERT INTO public.tracked_routes (
  origin_code, destination_code, origin_name, destination_name,
  country, region, trip_length_days, departure_offsets_days, deal_threshold_percent
)
VALUES
  ('CXR','HAN','Nha Trang','Hà Nội','Việt Nam','domestic',4,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('CXR','SGN','Nha Trang','TP. Hồ Chí Minh','Việt Nam','domestic',4,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('CXR','DAD','Nha Trang','Đà Nẵng','Việt Nam','domestic',4,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('CXR','PQC','Nha Trang','Phú Quốc','Việt Nam','domestic',4,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('CXR','BKK','Nha Trang','Bangkok','Thái Lan','asia',4,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('CXR','SIN','Nha Trang','Singapore','Singapore','asia',4,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('CXR','KUL','Nha Trang','Kuala Lumpur','Malaysia','asia',4,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('CXR','ICN','Nha Trang','Seoul','Hàn Quốc','asia',5,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('VDO','HAN','Vân Đồn','Hà Nội','Việt Nam','domestic',4,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('VDO','SGN','Vân Đồn','TP. Hồ Chí Minh','Việt Nam','domestic',4,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('VDO','DAD','Vân Đồn','Đà Nẵng','Việt Nam','domestic',4,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('VDO','BKK','Vân Đồn','Bangkok','Thái Lan','asia',4,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('VDO','SIN','Vân Đồn','Singapore','Singapore','asia',4,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('VDO','ICN','Vân Đồn','Seoul','Hàn Quốc','asia',5,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('VDO','NRT','Vân Đồn','Tokyo','Nhật Bản','asia',6,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('VDO','TPE','Vân Đồn','Đài Bắc','Đài Loan','asia',5,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('HPH','SGN','Hải Phòng','TP. Hồ Chí Minh','Việt Nam','domestic',4,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('HPH','DAD','Hải Phòng','Đà Nẵng','Việt Nam','domestic',4,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('HPH','PQC','Hải Phòng','Phú Quốc','Việt Nam','domestic',4,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('HPH','BKK','Hải Phòng','Bangkok','Thái Lan','asia',4,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('HPH','SIN','Hải Phòng','Singapore','Singapore','asia',4,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('HPH','ICN','Hải Phòng','Seoul','Hàn Quốc','asia',5,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('HPH','KUL','Hải Phòng','Kuala Lumpur','Malaysia','asia',4,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('HPH','TPE','Hải Phòng','Đài Bắc','Đài Loan','asia',5,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('VCA','HAN','Cần Thơ','Hà Nội','Việt Nam','domestic',4,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('VCA','DAD','Cần Thơ','Đà Nẵng','Việt Nam','domestic',4,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('VCA','PQC','Cần Thơ','Phú Quốc','Việt Nam','domestic',4,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('VCA','BKK','Cần Thơ','Bangkok','Thái Lan','asia',4,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('VCA','SIN','Cần Thơ','Singapore','Singapore','asia',4,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('VCA','KUL','Cần Thơ','Kuala Lumpur','Malaysia','asia',4,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('VCA','ICN','Cần Thơ','Seoul','Hàn Quốc','asia',5,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10),
  ('VCA','TPE','Cần Thơ','Đài Bắc','Đài Loan','asia',5,ARRAY[7,14,30,45,60,90,120,150,180,210,240,270,300,330,365],10)
ON CONFLICT (origin_code, destination_code) DO UPDATE SET
  enabled = TRUE,
  departure_offsets_days = EXCLUDED.departure_offsets_days,
  updated_at = NOW();

COMMIT;
