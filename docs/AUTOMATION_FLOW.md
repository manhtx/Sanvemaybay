# ⚙️ Automation Flow — FlyCheap AI

**Version:** 1.0  
**Status:** Draft  
**Document Type:** Workflow & Automation Specification

## 1. Purpose

Mô tả toàn bộ luồng tự động hóa từ thu thập dữ liệu, chuẩn hóa, phát hiện deal, phân tích, lưu trữ, xuất bản lên website đến gửi thông báo.

Automation phải đảm bảo dữ liệu được chuẩn bị trước khi người dùng truy cập, tác vụ nặng chạy background, lỗi được cô lập, workflow idempotent, AI không tạo hoặc đoán giá vé, và mọi execution có logging, retry cùng trạng thái rõ ràng.

## 2. Automation Principles

- **Pre-fetch Before User Access:** thu thập và xử lý trước; website đọc dữ liệu đã có, không scrape khi mở trang.
- **Background First:** Fetch, Normalize, Historical Calculation, Deal Detection, Route Optimization, AI, Notification và Statistics chạy nền.
- **Data Before AI:** AI chỉ được gọi sau khi dữ liệu đã thu thập, chuẩn hóa, xác thực, lưu và tính bằng logic hệ thống. AI không tạo giá, đoán dữ liệu, thay Deal Detection hoặc Cost Calculation.
- **Idempotent Workflows:** cùng input/source/route/time bucket phải update hoặc bỏ qua, không tạo bản ghi trùng.
- **Fail Independently:** AI lỗi không làm mất deal; Notification lỗi được retry; một source lỗi không dừng source khác và dùng dữ liệu gần nhất.

## 3. Automation Architecture

```text
Scheduler → Job Dispatcher
              ├── Flight Data Collection
              ├── Promotion Collection
              ├── Currency Update
              └── External Context Collection
                         ↓
                 Normalize → Validate → Store Price
                         ↓
                   Deal Detection
                    ├── Cost Analysis
                    └── Route Optimization
                         ↓
                    AI Analysis
                         ↓
                  Deal Publication
                    ├── Website API Cache
                    └── Notification
```

## 4. Workflow Status Model

```text
PENDING | RUNNING | SUCCEEDED | PARTIALLY_SUCCEEDED
FAILED | RETRYING | CANCELLED
```

Mỗi execution lưu Job ID, Workflow Type, Trigger Source, Start/End Time, Status, Retry Count, Input/Output Reference, Error Code/Message và Execution Metadata.

## 5. Flight Data Collection

**Triggers:** Cron, Admin manual trigger, route monitoring, data recovery hoặc new route onboarding.

**Schedule:** mặc định mỗi 6 giờ; popular route mỗi 3 giờ; low-priority route mỗi 12–24 giờ. Tất cả cấu hình được.

**Input:** origin, destination, departure date range, trip type, passengers, cabin class, currency và source IDs.

**Steps:** tạo Fetch Job → kiểm tra route và lần fetch gần nhất → kiểm tra rate limit → chọn source → request → nhận raw response → lưu raw response nếu được phép → chuyển Normalize → cập nhật status.

**Errors:** `RATE_LIMITED`, `TIMEOUT`, `SOURCE_UNAVAILABLE`, `AUTHENTICATION_FAILED`, `INVALID_RESPONSE`, `BLOCKED_REQUEST`, `EMPTY_RESPONSE`, `PARSING_ERROR`, `UNKNOWN_ERROR`.

**Retry:** timeout tối đa 3 lần sau 1/5/15 phút; rate limit chờ theo provider; source unavailable retry sau 15 phút rồi fallback; authentication failed không tự retry và báo Admin.

## 6. Data Normalization

Chuẩn hóa IATA airport code, airline code, currency, timezone/UTC datetime, duration (phút), stops, baggage, cabin class, fare type, tax, base/total fare, booking URL, refund/change condition.

Output chuẩn cần có source, offer ID, route, departure/arrival, duration, stops, airline/flight number, fare, currency, baggage, refundability, booking URL và fetched time.

## 7. Data Validation

Bản ghi hợp lệ khi origin/destination tồn tại và khác nhau, departure trước arrival, price > 0, currency/source hợp lệ, duration hợp lý, fetched time không ở tương lai, booking URL hợp lệ nếu có và đủ required fields.

Đánh dấu `SUSPICIOUS` nếu giá giảm trên 80% so với median, thấp hơn thuế thông thường, duration bất hợp lý, currency có thể parse sai hoặc chênh lệch quá lớn giữa source. Dữ liệu suspicious không gửi alert tự động.

## 8. Flight Price Storage

Không overwrite lịch sử. Mỗi observation mới được lưu hoặc update theo idempotency key:

```text
source + source_offer_id + departure_at + return_at
+ passenger_count + cabin_class + fetched_time_bucket
```

MVP dùng bucket 6 giờ: 00–05:59, 06–11:59, 12–17:59, 18–23:59.

## 9. Deal Detection

Chạy sau khi lưu dữ liệu mới, khi route đủ lịch sử, Admin yêu cầu recalculate hoặc scoring logic thay đổi.

Reference data gồm current price, median/average, lowest, observation count, route, date, airline, stops, fare, freshness. So sánh theo nhóm tương đương: route, one-way/round-trip, departure month, duration, cabin, stops, baggage và airline khi cần.

```text
discount_percent = (reference_price - current_price)
                    / reference_price × 100
```

Ưu tiên reference: median nhóm tương đương → median 30 ngày → median 90 ngày → market baseline.

**Classification:** `NORMAL` (<10%), `WATCH` (10–19%), `GOOD_DEAL` (20–29%), `STRONG_DEAL` (30–39%), `EXTREME_DEAL` (≥40%), `SUSPICIOUS`. Ngưỡng phải cấu hình được.

Deal Score gồm Price Advantage, Historical Rarity, Data Confidence, Travel Convenience, True Cost Advantage, Freshness và Risk Penalty.

## 10. Hidden Cost Analysis

Chạy khi offer đủ điều kiện thành deal, mở Deal Detail, so sánh offer hoặc fare rule thay đổi.

Tính Base Fare, Tax, Checked/Cabin Baggage, Seat, Payment Fee, Airport Transfer, Transit Visa, Transit Hotel, Meal, Self-transfer Buffer và Currency Conversion Fee.

Giữ hai giá trị: `Default Estimated Total` và `Personalized Estimated Total`. Output phải gồm display price, extra cost, estimated total, cost confidence, included items và estimated items.

## 11. Route Optimization

Chạy cho route quốc tế, direct price cao hơn baseline, khi bật Multi-leg/Self-transfer hoặc phát hiện hub. Hub cấu hình được, ví dụ Seoul, Taipei, Tokyo, Shanghai, Hong Kong, Bangkok, Kuala Lumpur, Singapore, Istanbul, Doha và Dubai.

Steps: lấy direct baseline → tạo hub candidates → tìm từng leg → ghép ngày/giờ → kiểm tra connection, visa, sân bay, hành lý → tính cost/time/risk → so sánh direct → lưu option có giá trị.

Không tự động đề xuất nếu nối chuyến quá ngắn, đổi sân bay thiếu thời gian, visa chưa xác minh, leg sau khởi hành trước leg trước hạ cánh, buffer không đủ hoặc một leg đã stale. Self-transfer phải có `requires_user_confirmation: true` khi phù hợp.

## 12. AI Deal Analysis

Chỉ gọi khi deal pass validation, đủ input, Deal Score vượt ngưỡng, chưa có analysis hợp lệ hoặc input thay đổi đáng kể.

**Input:** route, current/reference price, discount, price history, dates, airline, stops, estimated total, risk, external context và updated time.

**Output:** Summary, possible reasons kèm evidence level, Recommendation, Confidence, Uncertainties, Risk Notes và Generated At.

Sau khi nhận output, validate JSON schema, confidence 0–1, giá trị phải tồn tại trong input, không khẳng định thiếu bằng chứng, recommendation hợp lệ và không mâu thuẫn Risk Score. Internal AI calls phải dùng service authentication; không expose AI endpoint cho browser. Nếu lỗi, repair prompt một lần; nếu vẫn lỗi, ẩn explanation và log `AI_OUTPUT_INVALID`.

## 13. Buy Decision

Rule engine quyết định trước; AI chỉ giải thích. Actions: `BUY_NOW`, `BUY_SOON`, `MONITOR`, `WAIT`, `AVOID`, `INSUFFICIENT_DATA`.

Inputs gồm Deal Score, price percentile, historical minimum, days before departure, volatility, confidence, fare flexibility, route risk, total cost và availability. Ví dụ bottom 10%, departure dưới 45 ngày và confidence > 0.8 → BUY_NOW; lịch sử dưới ngưỡng → INSUFFICIENT_DATA.

## 14. Deal Publication

Publish khi validation hợp lệ, booking link/source reference có, deal chưa hết hạn, freshness đạt, Score vượt ngưỡng, không suspicious, total cost đã tính hoặc có disclaimer và risk data tồn tại cho self-transfer.

Statuses: `DRAFT`, `PENDING_VERIFICATION`, `PUBLISHED`, `EXPIRED`, `PRICE_CHANGED`, `SUSPENDED`, `ARCHIVED`. Kiểm tra lại khi stale, giá/link/fare class thay đổi hoặc chuyến bay không còn.

## 15. Homepage Feed

Sau deal mới/thay đổi, theo cron 5–15 phút hoặc khi ranking thay đổi: Load Published Deals → Freshness Filter → Risk Filter → Rank Deal Score → Deduplicate → Diversify Destinations → Generate Sections → Store Snapshot → Refresh Cache.

Sections hiện thực trong client gồm Top/Hot Deals, Biggest Price Drops, Newly Detected, preference recommendations và one top deal per destination. Các section phụ thuộc provider metadata (direct/multi-leg/low-risk/weekend/long-haul) chỉ được mở rộng khi dữ liệu tương ứng đã validated; không suy đoán section từ mock hoặc thiếu dữ liệu.

Website gọi `GET /api/v1/feed`, API đọc Feed Cache và trả JSON đã chuẩn bị; frontend không gọi nguồn bay trực tiếp.

## 16. Deal Detail Refresh

- **FRESH:** dưới 3 giờ, hiển thị ngay.
- **ACCEPTABLE:** 3–6 giờ, hiển thị và có thể refresh nền.
- **STALE:** 6–12 giờ, hiển thị cảnh báo và refresh nền.
- **EXPIRED:** trên 12 giờ, cảnh báo và urgent refresh.

Ngưỡng có thể khác theo source/route.

## 17. Notification

Gửi khi deal mới match preference, giá giảm đáng kể, sắp hết hạn, đạt target price, Strong/Extreme hoặc chưa gửi cùng deal. MVP dùng Telegram và Email; future Web Push, Mobile Push, WhatsApp.

Deduplicate theo deal/price/score và cooldown. Retry tối đa 3 lần, sau đó Notification DLQ; không tạo notification mới cho cùng event.

## 18. User Alert Subscription

Alert hỗ trợ Origin, Destination, Region, Budget, Date Range, Trip Duration, Discount, Direct-only, Max Stops, Baggage, Max Risk và One-way/Round-trip.

```text
New Deal Published → Load Active Alerts → Match Conditions
→ Apply Preference → Apply Cooldown → Create Notification → Send
```

## 19. Price Change Monitoring

Load Active Deals → Refresh Price → Compare → Update Deal → Recalculate Score → Update Status → Refresh Feed → Notify. Trạng thái gồm `PRICE_DROPPED`, `PRICE_INCREASED`, `EXPIRED`, `SUSPENDED` và `UNAVAILABLE`.

## 20. Promotions và External Context

Promotion workflow thu thập airline promotion, OTA coupon, bank discount, payment promotion, new-route và seasonal campaign; parse điều kiện, normalize, validate dates, match route/airline và tính saving.

The current code implements the validation/matching boundary in `promotionMatching.ts`: invalid dates, out-of-scope route/airline, unmet minimum fare and non-positive amounts are rejected; percentage/fixed savings are capped and ranked. Provider collection, credential access and authoritative campaign terms remain external dependencies.

External context gồm holiday, season, weather alert, event, new route, campaign, visa change và airport disruption. Chỉ dùng khi có nguồn xác thực, ngày cập nhật và liên quan trực tiếp; AI không được suy đoán thành sự thật.

## 21. Hidden City Analysis

Chỉ chạy khi người dùng bật Advanced Risk Mode và xác nhận cảnh báo. Không hiển thị mặc định, không mặc định recommend, không gửi notification chủ động; phải có Risk Level cao, cảnh báo hành lý, chặng sau và điều kiện hãng.

## 22. Data Freshness và Cleanup

Giữ lâu dài Price History, Deal History, Route Statistics, User Alert History và audit logs quan trọng. Có thể archive raw response cũ, temporary payload, expired cache, duplicate debug logs và failed payload không cần thiết.

Lịch: cache hàng giờ, temporary data hàng ngày, raw payload hàng tuần, old logs hàng tháng.

## 23. Admin Operations

Admin có thể trigger fetch, enable/disable route/source, rerun detection, verify suspicious deal, publish/suspend deal, retry job, update thresholds, xem source health/job history/AI failures, cập nhật hub list và airline fee rules.

## 24. Scheduling Summary

| Workflow | Frequency mặc định |
|---|---:|
| Flight Data Collection | 6 giờ |
| Popular Route Collection | 3 giờ |
| Deal Detection | Sau dữ liệu mới |
| Homepage Feed | 5–15 phút |
| Active Deal Refresh | 3–6 giờ |
| Promotion Collection | 12–24 giờ |
| Currency Update | 6–12 giờ |
| External Context | 12–24 giờ |
| Notification | Theo event |
| Cleanup | Hàng ngày |
| Analytics Recalculation | Hàng ngày |
| Source Health Check | Hàng giờ |

Tất cả tần suất phải cấu hình được.

## 25. Queues và Priority

Queues: `flight.fetch`, `flight.normalize`, `flight.validate`, `flight.store`, `deal.detect`, `cost.calculate`, `route.optimize`, `ai.analyze`, `deal.publish`, `feed.refresh`, `feed.snapshot`, `analytics.event`, `notification.match`, `notification.send`, `promotion.collect`, `context.collect`, `data.cleanup`.

Priority: `CRITICAL`, `HIGH`, `NORMAL`, `LOW`. User-requested refresh và active deal refresh là HIGH; scheduled fetch NORMAL; recalculation và cleanup LOW.

## 26. Concurrency và Rate Limit

Không chạy hai job cùng route/source/date range đồng thời. Lock key:

```text
fetch:{source}:{origin}:{destination}:{date_range}
```

Mỗi source cấu hình request limit, time window, concurrency, cooldown, retry-after, daily quota và failure threshold. Khi gần limit, giảm tần suất, ưu tiên route quan trọng và fallback; không tạo request bất thường để vượt giới hạn.

## 27. Source Health và Fallback

Health Score dựa trên success rate, response time, empty/invalid response, rate-limit, coverage và last successful fetch. Status: `HEALTHY`, `DEGRADED`, `UNSTABLE`, `UNAVAILABLE`, `DISABLED`.

```text
Primary Source → Secondary Source → Cached Latest Data → Mark Stale
```

Không hiển thị dữ liệu cũ như dữ liệu mới; website phải hiển thị thời điểm cập nhật.

## 28. Observability và Logging

Theo dõi số job, success/failure/retry rate, duration, queue wait, records processed, deals detected, AI token usage, notification delivery, source response time và stale data count.

Mỗi log có timestamp, job_id, workflow_name, route, source, status, duration, error_code và retry_count. Không log password, secret key, access token, private user information hoặc payment information.

## 29. Cost Control

Không gọi AI cho mọi chuyến bay; chỉ gọi cho deal đủ điều kiện, cache AI result, không phân tích lại nếu input chưa thay đổi, ưu tiên batch, giảm tần suất route ít quan trọng, giới hạn date/hub và dùng rule engine trước AI.

## 30. MVP Automation Scope

MVP gồm Route Scheduler, Flight Data Collection, Normalization, Validation, Price History Storage, Deal Detection, Basic Hidden Cost Calculation, Deal Publication, Homepage Feed, Telegram Notification và Error Logging. `analyze-price` ghi các flight observation hợp lệ vào `price_history` trước khi trả kết quả. Deal explanation ban đầu là deterministic, data-backed text generated from the same validated market facts; an optional AI enrichment worker may run separately when its internal authentication and provider configuration are healthy, but it must never be on the critical publish path. Notification delivery dùng backoff 1/5/15 phút, tối đa 3 attempts; sau đó giữ trạng thái failed để operator/DLQ xử lý.

Chưa cần Full Virtual Interlining, Hidden City Automation, Advanced Personalization, Realtime Price Prediction, nhiều notification channels, Complex External Context Engine hoặc Automated Booking.

## 31. Recommended MVP Flow

```text
Cron 6 giờ
→ Active Routes → Fetch → Normalize → Validate → Store History
→ Median/Discount → Deal Score
→ Nếu đủ điều kiện: Cost → AI Explanation → Validate AI
→ Publish → Refresh Feed → Match Alert → Telegram → Log
```

## 32. Website Realtime Experience

Website load feed từ cache, hiển thị thời điểm cập nhật, refresh deal gần stale ở background và tự cập nhật khi có kết quả mới. Không cần scrape realtime để tạo trải nghiệm nhanh.

## 33. Definition of Done

Workflow hoàn thành khi có trigger, input/output schema, validation, idempotency, retry, timeout, error handling, logging, monitoring, execution status, fallback, không block user, không tạo dữ liệu trùng và không để AI tạo dữ liệu thực tế; phải có test success và failure case.

## 34. One-line Automation Strategy

> **FlyCheap AI thu thập và xử lý dữ liệu ở background, chuẩn bị insight trước khi người dùng truy cập, sau đó chỉ sử dụng AI để giải thích những kết luận đã được xác định bằng dữ liệu và thuật toán.**
