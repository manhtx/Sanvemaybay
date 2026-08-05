# 🏛 Technical Architecture — FlyCheap AI

**Version:** 1.0  
**Status:** Draft

## 1. Purpose

Tài liệu định nghĩa cấu trúc kỹ thuật của FlyCheap AI: system components, service boundaries, API, database, AI, queue, cache, background jobs, deployment và security. Tài liệu không mô tả business logic; mọi implementation phải tuân theo kiến trúc này.

## 2. Architecture Principles

- **Modular:** mỗi service chỉ có một trách nhiệm.
- **Stateless API:** backend không lưu session; mọi request độc lập.
- **API First:** frontend chỉ giao tiếp qua API, không truy cập database trực tiếp.
- **Background Processing:** Crawl, AI Analysis, Historical Calculation và Notification chạy nền, không block request.
- **Event Driven:** dữ liệu mới phát Event để service liên quan tự xử lý.
- **Scalable:** có thể scale từng service độc lập.

## 3. High-level Architecture

```text
User → Web / Mobile → API Gateway
                         ├── Flight API
                         ├── User API
                         └── Search API
                               ↓
                         Business Layer
                         ├── Deal Engine
                         └── AI Engine
                               ↓
                         Database Layer
                         ├── Flight DB
                         ├── Historical DB
                         └── User DB
                               ↑
                         Background Workers
                               ↑
                    External Data Sources
```

## 4. Service Architecture

### Flight Service

Flight Search, Flight Details và Airport Information. Không xử lý AI hoặc Deal.

### Deal Service

Detect Deal, Calculate Deal Score và Rank Deal.

### AI Service

Explain, Compare, Predict và Recommend. AI không truy cập database trực tiếp từ frontend; mọi internal invocation phải qua authenticated service boundary.

### User Service

Authentication, Preference, Saved Deal và Alerts.

### Notification Service

Telegram, Email và Push Notification.

### Analytics Service

The client-side price analytics contract derives median, percentile, volatility and cheapest observed weekday only from validated `price_history` observations. Promotion matching is a pure domain boundary (`matchPromotions`) that can consume a future normalized promotion feed without coupling provider credentials to the browser.

Preference dates use ISO `YYYY-MM-DD` values at the client boundary and are persisted in `user_preferences.departure_from/departure_to` by migration `20260731000600_user_preference_dates.sql`; the database constraint and client normalization both reject reversed ranges.

Forecasting remains a guarded domain baseline: `forecastPrice` requires at least 14 valid dated observations and returns bounded direction/probability/confidence metadata plus a limitation; it is not an AI or guaranteed-price service.

Feed reads use the `feed-snapshot` Edge Function and `feed_snapshots` singleton table with a 15-minute TTL. Refresh failures serve the last snapshot when available; the browser then retains its own cache fallback. Provider/service-role deployment is required for runtime use.

The homepage section layer is deterministic and client-safe: score-ranked hot deals, newest valid `observed_at`, biggest discount, transparent preference ranking and one top deal per destination. It does not call AI or promote unavailable external context. Search applies the validated `maxFlightTimeMinutes` preference to parseable duration evidence; unknown duration remains visible. Comparison carries optional `refund_policy` and renders an explicit missing-data state when the provider has not supplied terms.

Product events use a client whitelist/scrubber and bounded local queue; configured clients attempt insert-only persistence to `product_events`, while analytics failures are non-blocking. The migration includes an RLS check preventing anonymous events from claiming another user.

Historical Price, Trend và Statistics.

## 5. API Architecture

REST API với versioning `/api/v1/`.

**Endpoints mẫu:** `/flights`, `/deals`, `/history`, `/alerts`, `/preferences`. `price_history` được ghi từ các observation đã validate trong `analyze-price` và được đọc theo `from_code/to_code` ở Deal Detail; dữ liệu lỗi hoặc không dương bị loại ở cả pipeline và client.

**Success response:**

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "error": null
}
```

**Error response:**

```json
{
  "success": false,
  "error": { "code": "", "message": "" }
}
```

## 6. Database Architecture

**Main tables:** Flight, Airport, Airline, Route, Historical Price, Deal, Deal Score, AI Summary, User, Alert và Preference.

```text
Airport → Route → Flight → Historical Price → Deal → AI Summary
```

## 7. Background Jobs

Jobs gồm Fetch Price, Normalize Data, Detect Deal, Generate AI Summary, Send Notification, Calculate Statistics và Generate Trend.

**Scheduler:** Cron, chạy mỗi 6 giờ.

## 8. Queue

| Queue | Purpose |
|---|---|
| `flight.fetch` | Lấy dữ liệu giá |
| `deal.detect` | Phát hiện deal |
| `ai.analysis` | Phân tích AI |
| `notification.send` | Gửi thông báo |
| `statistics.calculate` | Tính thống kê |

Mỗi job retry 3 lần; Dead Letter Queue được bật.

## 9. AI Architecture

AI chỉ chịu trách nhiệm Explain, Summarize, Recommend và Predict. AI không Fetch, Store, Detect Deal hoặc Authenticate.

**Input:** Historical Data, Deal, Price, Trend và Preference.  
**Output:** Summary, Confidence, Recommendation, Reason và Risk.

## 10. Cache

| Resource | Cache |
|---|---:|
| Homepage | 5 phút |
| Deal Detail | 30 phút |
| Airport | 24 giờ |
| Historical Statistics | 1 giờ |

## 11. Logging và Monitoring

Log API, Worker, AI, Notification, Database Error và External API Error. Không log Password, Token hoặc Personal Information.

Theo dõi Response Time, API Error, Crawler Success/Failure, AI Success/Failure và Notification Success/Failure.

## 12. Security

HTTPS Only, JWT Authentication, Rate Limiting, Input Validation, SQL Injection Protection, XSS Protection và CSRF Protection.

## 13. Folder Structure

```text
/src
  /api
  /services
  /modules
  /database
  /workers
  /jobs
  /prompts
  /utils
  /config
  /tests
```

## 14. Coding Standards

Áp dụng Clean Architecture, SOLID, Dependency Injection, Repository Pattern và Service Layer. Không đặt business logic trong Controller.

## 15. Deployment

```text
Frontend → CDN → API → Workers → Database → Storage
```

## 16. Scalability

Kiến trúc cho phép mở rộng thành Microservices, sử dụng Redis, Message Queue, nhiều AI Models, nhiều Crawlers và Horizontal Scaling.

## 17. Technology Independence

Technical Architecture không phụ thuộc framework. Có thể triển khai bằng NodeJS, Python, Go, Java hoặc Rust miễn đáp ứng đúng các interface và service boundary.

## 18. Definition of Done

Implementation chỉ được coi là hoàn thành khi:

- Tuân thủ Architecture.
- Có Unit Test.
- Có Logging và Error Handling.
- Có Retry và Monitoring.
- Có Documentation.
- Không phá vỡ Service Boundary.
