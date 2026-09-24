# Bug Investigation — Trang Deals hiển thị 0 deal

Date: 2026-08-19  
Status: Repository and Supabase remediation complete; live-provider supply pending

## 1. Problem summary

`/deals` hiển thị `0 deal trên 0 quốc gia` dù Supabase vẫn có dữ liệu trong
bảng `deals`. Người dùng không phân biệt được hai trạng thái:

1. hệ thống hoạt động bình thường nhưng hiện chưa có deal đạt chuẩn; và
2. pipeline production/schema chưa sẵn sàng nên không thể đánh giá deal.

Không được sửa bằng cách đưa dữ liệu archive, hết hạn hoặc chưa xác minh trở
lại danh sách deal thật.

## 2. Root Cause Analysis

### Root cause A — Production schema chưa đồng bộ với contract hiện tại

Production thiếu các cột `link_kind`, `affiliate_network`, `affiliate_url` được
định nghĩa trong migration
`20260805000300_live_provider_affiliate_contract.sql`. Truy vấn trực tiếp cột
`deals.link_kind` trả PostgREST `42703`.

Trong khi đó code hiện tại chỉ công bố hàng có `link_kind=live_source` hoặc
`live_affiliate`. Hàng không có provenance mới bị loại theo nguyên tắc
fail-closed.

### Root cause B — Dữ liệu đang có không còn là live inventory

Đọc schema cũ vẫn trả dữ liệu, nhưng mẫu production quan sát được có:

- `source=serpapi_google_flights_archive`;
- `valid_until=2026-08-04...`, đã hết hạn;
- một số ngày bay đã qua;
- URL tìm kiếm Google Flights, không phải bằng chứng giá hiện tại có thể đặt.

Vì vậy số hàng trong database không đồng nghĩa với số deal hợp lệ. Việc màn
hình không hiển thị các hàng này là đúng về data truth.

### Root cause C — API/UI che khuất trạng thái degraded

`feed-snapshot` hiện trả HTTP 200 với `deals: []`. Client sau đó fallback đọc
`deals`, map hàng thiếu `link_kind` thành `undefined`, loại toàn bộ và trả cache
rỗng. UI chỉ nhận một mảng rỗng nên hiển thị empty state thông thường; không có
contract để phân biệt `healthy_empty`, `degraded_schema`, `provider_unavailable`
và `stale_only`.

## 3. Evidence

| Check | Observed result | Interpretation |
|---|---|---|
| Browser `/deals` | 0 deals, 0 countries; no console error | UI renders the empty array it receives |
| `feed-snapshot` | HTTP 200, `dealCount=0` | Public API masks degraded/empty distinction |
| Legacy `deals` select | HTTP 200 and rows exist | Database is not empty |
| New-contract select | HTTP 400, PostgREST `42703`, `column deals.link_kind does not exist` | Required migration is absent in production |
| Sample legacy rows | archive source and expired `valid_until` | Rows must not be republished as verified deals |

## 4. Scope of impact

- Deals page, home deal sections, explore, saved deals and advisor surfaces.
- Deal detail, redirect and alert processing, because they share the live-deal
  contract.
- Feed snapshot observability and release readiness.
- Production migration/function deployment and provider ingestion.

## 5. Proposed permanent solution

### Phase 1 — Restore contract parity

1. Back up/inspect production migration state.
2. Apply `20260805000300_live_provider_affiliate_contract.sql`.
3. Apply `20260811000100_fail_closed_link_kind_defaults.sql` so legacy/default
   rows are not promoted to live.
4. Configure `APPROVED_BOOKING_HOSTS`, deploy the matching shared helpers and
   Edge Functions as one release.
5. Run the production truth gate. Roll back/stop publication if schema or
   allowlist checks fail.

### Phase 2 — Restore a truthful live supply

1. Connect an approved live-price provider for the narrow launch cohort.
2. Ingest only current offers with future departure, unexpired validity,
   positive itinerary data, source identity and an approved HTTPS booking URL.
3. Require at least one qualified current deal before declaring the feed live.
4. Keep archive/cached discovery rows available only in historical/indicative
   experiences, never under “Deal được xác minh”.

### Phase 3 — Make degraded state explicit

1. Change feed response to include a typed status such as `healthy`,
   `healthy_empty`, `degraded_schema`, `provider_unavailable` or `stale_only`.
2. Return a non-success status for an unavailable feed instead of silently
   converting every backend failure to `200 []`.
3. Update client state from `Deal[]` to a result object containing deals,
   status, source and generated time.
4. Show an operational error/retry state for degraded responses and preserve
   the normal empty state only for a verified healthy feed with zero matches.
5. Add telemetry and an alert when qualified inventory stays at zero beyond
   the documented SLO.

## 6. Why this solution is preferred

- Fixes schema drift, supply and observability instead of hiding them.
- Preserves the product promise that displayed prices are current and verified.
- Prevents historical rows or guessed links from becoming false live deals.
- Gives users and operators an actionable explanation when the feed is down.
- Keeps deployment reversible and measurable through the production truth gate.

## 7. Preventive actions

- Make migration parity and the truth gate mandatory release checks.
- Contract-test every feed status and client rendering branch.
- Alert on schema error, snapshot age, ingestion age and zero qualified deals.
- Require provenance and validity at database write and every publication edge.
- Keep provider approval, host allowlist and production secrets documented and
  reviewed together.

## 8. Risks

- Applying only migrations without matching Functions/config can cause a
  partial-release outage.
- Backfilling legacy rows as live would expose stale or unverifiable prices.
- A live provider may require partnership approval, quota and credentials not
  present in the repository.
- Changing the feed response requires coordinated client and Edge Function
  deployment.
- Production writes/deployment require explicit authorization and a rollback
  checkpoint.

## 9. Test strategy

### Local and contract

- Unit tests for all typed feed statuses and fail-closed deal rules.
- Deno tests for missing column/provider/configuration and stale snapshot paths.
- Client tests proving degraded state is not rendered as normal zero inventory.
- Regression tests for home, deals, explore, detail, saved and alerts.

### Runtime acceptance

- Apply migrations in a staging/project clone and verify columns/defaults.
- Deploy matching Functions and verify feed status semantics.
- Run `npm run audit:production-truth` against 1–5 approved routes.
- Verify at least one current provider-backed offer and booking redirect price
  parity before labeling production ready.
- Browser-test desktop/mobile loading, healthy-empty, degraded, retry and
  populated states.

## 10. Completion criteria

- Production schema and deployed Functions match repository contracts.
- Feed exposes its health explicitly; schema/provider failures cannot become a
  silent empty list.
- At least one qualified current live deal passes the truth gate for the launch
  cohort, or the UI clearly reports provider unavailability.
- No archive/expired/unverified row appears as a verified deal.
- All affected unit, Deno, E2E and runtime checks pass with recorded evidence.

## 11. Implementation note

Production inspection after adding the contract columns found 242 legacy
`fast_flights_google` rows that inherited the old `live_source` default. They
were already expired and therefore not publishable, but their provenance was
still incorrect. Migration `20260819000100_backfill_discovery_provenance.sql`
reclassifies discovery/Travelpayouts cached rows as `indicative` and removes
affiliate metadata. This backfill is required before the feed release.

## 12. Final verification — 2026-08-19

- Production schema contains the new contract columns with fail-closed
  `indicative` defaults.
- Production provenance is now 242 `fast_flights_google=indicative` rows and
  202 `serpapi_google_flights_archive=historical` rows; none is relabelled live.
- `APPROVED_BOOKING_HOSTS` and six affected Edge Functions are deployed.
- Public `feed-snapshot` returns HTTP 200, `status=healthy_empty`, `source=live`
  and zero qualified deals instead of masking a schema failure.
- Production truth gate reads all 444 rows without schema error and reports
  zero qualified live deals with explicit rejection reasons.
- Local gates pass: 62 Vitest tests, 3 Node truth-gate tests, 23 Deno tests,
  nine Function type checks, production build, and 28/28 Playwright scenarios.
- Browser acceptance shows “Chưa có deal live đạt chuẩn lúc này”, removes the
  misleading zero-stat/filter state, and has no console warning/error.

The software defect and production schema drift are resolved. Populating the
screen with real cards remains dependent on a current approved provider offer;
that external inventory gate must not be bypassed with archive data.
