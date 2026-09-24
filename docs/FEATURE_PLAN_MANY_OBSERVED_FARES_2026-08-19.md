# Feature Plan — Hiển thị nhiều giá vé quan sát

Date: 2026-08-19  
Status: Implemented and verified locally; production API/data active; hourly GitHub schedule awaiting push

## 1. Product requirement

Trang `/deals` phải có nhiều lựa chọn giá vé để người dùng khám phá. “Không có
deal live” không đồng nghĩa với việc phải ẩn toàn bộ dữ liệu quan sát hữu ích.
Tuy nhiên, giá tham khảo không được trình bày như offer đã xác minh hoặc cam kết
còn chỗ.

## 2. Current evidence

- Production có 242 quan sát `fast_flights_google`, nhưng chúng đã cũ và được
  phân loại đúng là `indicative`.
- Dry-run hiện tại với chỉ 1 tuyến và 1 cửa sổ ngày đã trả 60 quan sát mới,
  không có lỗi.
- Pipeline hiện hỗ trợ tối đa 40 tuyến × 4 cửa sổ và chạy mỗi 12 giờ.
- Active live feed cố ý chỉ nhận `live_source/live_affiliate`, nên không thể sử
  dụng trực tiếp để phục vụ trang khám phá nhiều giá.

## 3. Proposed UX

Trang chính đổi thành “Giá Vé Đang Được Quan Sát”, gồm ba chế độ:

1. **Tất cả giá quan sát** — mặc định; hiển thị các quan sát `indicative` mới,
   cùng deal live nếu có.
2. **Deal live đã xác minh** — chỉ `live_source/live_affiliate` và giữ nguyên
   truth gate nghiêm ngặt.
3. **Lịch sử** — dữ liệu archive/hết hạn, chỉ dùng nghiên cứu xu hướng.

Card indicative phải có:

- badge “Giá tham khảo — kiểm tra lại”;
- thời điểm quan sát;
- nguồn;
- không hiển thị phần trăm giảm, số ghế hoặc khuyến nghị mua ngay nếu chưa có
  baseline đủ tin cậy;
- nút “Mở Google Flights để kiểm tra”, không gọi là link đặt vé đã xác minh.

## 4. Technical design

### Public observed-fares API

Tạo Edge Function `observed-fares` đọc server-side từ `flights` và chỉ trả:

- `link_kind=indicative`;
- ưu tiên quan sát mới nhất nhưng không ẩn một giá hợp lệ chỉ vì vượt một
  freshness threshold cứng;
- ngày bay trong tương lai;
- giá/thời lượng/tuyến/hãng hợp lệ;
- HTTPS source URL thuộc allowlist;
- dedupe theo tuyến, ngày, hãng, giờ và giá;
- pagination 60 hàng/trang, giới hạn cứng 120;
- mặc định sort theo phần trăm thấp hơn baseline nhiều nhất, sau đó Deal Score,
  độ mới và giá.

Response có `status`, `generated_at`, `total`, `next_cursor`, provenance và age.
Không mở public RLS trực tiếp trên toàn bộ bảng `flights`.

### Client

- Thêm `getObservedFares()` và mapping riêng cho dữ liệu indicative.
- Deals page mặc định tải trang đầu 60 card, có “Xem thêm”.
- Filter vùng, điểm đến, tháng, hãng, direct flight hoạt động trên dataset quan
  sát.
- Tab live sử dụng `getDealsResult()` hiện tại; không trộn semantics.
- Empty/error state độc lập cho observed feed và live feed.

### Pipeline

- Trigger workflow với 40 tuyến × 4 cửa sổ sau khi API/UI đã sẵn sàng.
- Chạy nền mỗi giờ với batch 20 tuyến × 2 cửa sổ; người dùng đọc DB ngay thay
  vì chờ provider trong request. UI tự refresh mỗi 5 phút.
- Giữ tối đa 7 ngày raw discovery rows để chặn tăng trưởng không giới hạn.
- Không chạy analyzer để biến `indicative` thành deal live.
- Archive/dọn quan sát quá cũ khỏi surface, không cần xóa bằng chứng lịch sử.

## 5. Impacted modules

- `scripts/fast-flights-worker.py`
- `.github/workflows/fast-flights-pipeline.yml`
- new `supabase/functions/observed-fares/`
- `src/app/data/api.ts`
- `src/app/pages/DealsPage.tsx`
- `src/app/components/DealCard.tsx`
- E2E/unit/Deno contracts and production runbook

## 6. Risks and controls

- Google/fast-flights may change or throttle: surface becomes degraded but live
  contract remains unaffected.
- Thousands of rows can overload the browser: server pagination and bounded
  page size are mandatory.
- Duplicate fares can dominate: deterministic dedupe before response.
- Users may mistake indicative price for bookable inventory: provenance badge,
  timestamp and action copy are mandatory.
- Route-template URL may not preserve an exact observed itinerary: label action
  as rechecking a search, never booking the observed fare.

## 7. Test strategy

- Deno tests: freshness, future-date, allowlist, indicative-only, dedupe,
  pagination and malformed rows.
- Client tests: envelope mapping, source/freshness labels and pagination merge.
- E2E desktop/mobile: default observed list, live tab empty, filters, load more,
  degraded observed source and no misleading live claims.
- Production acceptance: run discovery, confirm at least 500 fresh observations,
  inspect 20 random cards against returned payload, verify no archive row and no
  indicative card says “đã xác minh” or “mua ngay”.

## 8. Completion criteria

- Default page displays at least 60 fresh observed fares and can paginate to at
  least 500 when production inventory exists.
- Verified-live count remains independently truthful, including zero.
- All cards expose provenance and observation time.
- No stale/archive row appears in the default observed surface.
- Local gates and production browser acceptance pass.

## 9. Approved scoring and color contract

Mọi giá hợp lệ được hiển thị ngay. Khi chưa đủ ba mẫu tương đương, API trả
`discount_percent=null`, confidence thấp và nhãn “Đang tích lũy mặt bằng”,
thay vì loại hàng.

Baseline ưu tiên median của cùng tuyến, ngày đi, độ dài chuyến và nhóm số điểm
dừng. Nếu nhóm chi tiết chưa đủ ba mẫu, fallback sang cùng tuyến/ngày đi. Deal
Score gồm discount 45%, percentile 20%, freshness 15%, sample confidence 15%
và direct-flight quality 5%.

| Deal Score | Label |
|---|---|
| dưới 60 | Giá quan sát |
| 60–69 | Giá đáng chú ý |
| 70–79 | Deal ngon |
| 80–89 | Deal rất ngon |
| 90–100 | Deal cực nóng |

Phần trăm chênh lệch luôn hiển thị khi có baseline và dùng ba màu:

- xanh: dưới 15%;
- vàng: 15–29%;
- đỏ: từ 30% trở lên.

Màu là tín hiệu cường độ, không thay thế con số. Giá tham khảo vẫn phải có
provenance, thời điểm quan sát và hành động “Kiểm tra giá hiện tại”.

## 10. Implementation evidence

- Supabase Edge Function `observed-fares` đã deploy và trả `healthy`.
- Production acceptance ngày 2026-08-19 trả 623 giá đã dedupe; trang đầu có 60
  giá và `next_page=2`.
- Thứ tự mặc định là discount giảm dần; browser acceptance xác nhận giá đầu
  SGN–DXB giảm 46.4%, baseline 26,903,882 VND, giá quan sát 14,414,971 VND.
- UI local hiển thị đúng ba màu phần trăm, Deal Score, provenance, thời điểm
  quan sát, phân trang và tự refresh 5 phút.
- Local gates pass: 63 Vitest, 3 Node truth tests, 26 Deno tests, function
  checks, build và 30/30 Playwright desktop/mobile.
- Workflow quét mỗi giờ và retention 7 ngày đã hoàn thiện trong workspace.
  Chưa kích hoạt lịch GitHub production vì phiên này không được yêu cầu
  commit/push và nhánh remote vẫn chứa worker cũ không đạt truth contract.
