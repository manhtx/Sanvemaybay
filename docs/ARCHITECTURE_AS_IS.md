# FlyCheap AI — Architecture As-Is

**Updated:** 2026-08-20  
**Scope:** trạng thái repository sau remediation cycle hiện tại  
**Authority:** tài liệu này mô tả code hiện có; trạng thái runtime phải xem thêm
`REMEDIATION_EXECUTION_STATUS.md`.

## 1. System boundary

FlyCheap AI là SPA React/Vite đọc dữ liệu qua Supabase Edge Functions. Việc quét
giá là tác vụ nền; request của người dùng không trực tiếp kích hoạt provider
scan. Đây là ranh giới bắt buộc để kiểm soát chi phí, độ trễ và chống abuse.

```text
Scheduled workflow
  -> provider worker / flight-ingest
  -> flights (raw observations)
  -> refresh-observed-fares (score + confidence)
  -> observed_fare_snapshots (public read model)
  -> observed-fares Edge Function
  -> React UI
```

`live_deals` là inventory live đã qua hợp đồng xác minh riêng. Dữ liệu quan sát
hoặc indicative không được tự động nâng thành live deal.

## 2. Components and ownership

| Layer | Components | Responsibility |
|---|---|---|
| Web | `src/app/pages`, `components`, `domain`, `data/api.ts` | Render, filter state, truth language, client interaction |
| Public API | `observed-fares`, `feed-snapshot`, `flight-search`, `setup-alert`, `manage-alert`, `deal-redirect` | Validate request, enforce public contract, return bounded responses |
| Internal jobs | `refresh-observed-fares`, `flight-ingest`, `alert-processor`, Python worker | Scan, normalize, score, snapshot and notify |
| Shared domain | `supabase/functions/_shared` | Deal truth, normalization, confidence, retry, observability and abuse controls |
| Storage | Supabase Postgres | Raw observations, live inventory, read models, alerts, budgets, scan telemetry |
| Delivery | GitHub Actions, Supabase Functions, frontend deploy script | Repeatable build/deploy inputs and scheduled refresh |

The web data layer keeps `api.ts` as a compatibility facade while alert writes
and tracked-route reads live in `alertApi.ts` and `routeApi.ts`. New domains
should not be added to the facade implementation when they can remain in a
bounded module.

## 3. Data truth classes

1. **Raw observation:** provider result normalized into `flights`; evidence, not
   a user-facing claim by itself.
2. **Observed fare:** a scored snapshot with discount, confidence, algorithm
   version and freshness. It may appear immediately but low confidence caps the
   marketing label.
3. **Live deal:** future, fresh, approved-provider inventory with a valid
   booking URL and complete required fields.
4. **Historical deal:** expired/archive evidence; never mixed into active live
   inventory.

Consumers must preserve these classes. UI copy cannot promote class 1 or 2 to
“live” merely because a price is low.
The web mapper also reapplies the confidence gate so an older or malformed
runtime cannot inject a strong claim alongside low confidence.

## 4. Read and refresh path

- Scheduled ingestion records provider observations and scan telemetry.
- `refresh-observed-fares` reads a bounded raw window, computes baseline,
  discount, score and confidence, then upserts the public snapshot model.
- `observed-fares` performs filters, discount-first ordering and pagination in
  Postgres. It does not rescore thousands of raw rows per public request.
- Freshness is classified from the latest observation: healthy <=120 minutes,
  degraded 121–360 minutes, stale-only >360 minutes.
- Responses expose correlation ID and deployed commit where configured.

## 5. Scoring contract

Algorithm `observed-v2-confidence-gated` combines discount and evidence quality.
The UI sorts the greatest discounts first and uses green/yellow/red visual
strength. Labels remain evidence-gated: weak confidence cannot produce “Deal
cực nóng”, regardless of nominal discount.

Any scoring change requires:

- a new algorithm version;
- deterministic unit fixtures;
- shadow/backtest evidence before production activation;
- a claim-violation audit after activation.

## 6. Security and privacy boundaries

- Public clients never receive service-role credentials.
- Internal endpoints require the internal authorization contract.
- Alert setup and product analytics consume atomic, salted, hashed request
  budgets; missing rate-limit configuration fails closed.
- Anonymous clients cannot insert directly into `product_events`; validated,
  size-bounded events pass through `track-event` and are written by service role.
- Raw email/IP values must not be written to the rate-limit table.
- CAPTCHA remains an activation gate requiring an approved vendor and keys.
- Data categories, retention and user-right gaps are inventoried in
  `DATA_INVENTORY_AND_RETENTION.md`.

## 7. Reliability and observability

- Worker runs record run/release identifiers, duration, route windows,
  provider results, accepted/rejected/deduplicated counts and failure classes.
- Public read/refresh failures emit structured logs with safe request IDs.
- Browser service failures pass through `clientDiagnostics.ts`, which accepts
  only reviewed low-cardinality codes and intentionally cannot accept caught
  error objects or free-form context. Public UI copy must come from typed,
  reviewed errors rather than provider/database messages.
- `operational_scan_health` supplies a service-only operational view.
- `INCIDENT_RESPONSE_RUNBOOK.md` is the response authority.

Repository instrumentation is not equivalent to a working dashboard or alert.
Those require migration deployment, log sink configuration and a game day.

## 8. Frontend delivery and SEO

- Routes are lazy-loaded.
- The Recharts price-history bundle is loaded only when a deal has history;
  the base detail route remains small.
- Route metadata updates title, description, robots, Open Graph and canonical
  URL at navigation time.
- Build emits robots rules and only creates a sitemap when the canonical public
  origin is a configured non-local HTTPS URL.
- CLS, INP and LCP are session-sampled, dynamically loaded and sent through the
  same validated/rate-limited product-event boundary.
- Client-only metadata is an interim solution. Search-critical expansion must
  choose SSR/prerender and validate crawler-rendered HTML before claiming SEO
  completeness.

## 9. Known constraints

- No approved commercial provider/parity evidence is present.
- Migrations and functions added in this cycle are not yet staging-applied.
- CAPTCHA, remote RLS/auth audit, load test and query plans remain runtime gates.
- Production freshness, SLOs, alert delivery and booking redirects are not
  proven by local tests.
- The current working tree contains unrelated user work; release preparation
  must isolate and review the intended change set.

## 10. Change rules

Architecture changes must update this file before implementation. A release may
be called production-verified only when the exact reviewed commit is deployed
and the runtime gates in `REMEDIATION_EXECUTION_STATUS.md` pass.
