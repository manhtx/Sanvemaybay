# FARELY V21 BASELINE AUDIT REPORT
**Audit Date**: 2026-10-05
**Environment**: Production (`https://farely.manhtx.com`) & Canonical Git Repository (`https://github.com/manhtx/Sanvemaybay`)
**Start Local / Remote SHA**: `2f399a58d3476747f57b4ec0f0708fc13925a9ed`
**Branch**: `main` (clean working tree)

---

## 1. System Inventory & Runtime State

### 1.1 Git & Vercel Frontend
- **Local HEAD**: `2f399a58d3476747f57b4ec0f0708fc13925a9ed`
- **Remote `origin/main`**: `2f399a58d3476747f57b4ec0f0708fc13925a9ed`
- **Production URL**: `https://farely.manhtx.com`
- **Frontend Serving SHA**: `2f399a58d3476747f57b4ec0f0708fc13925a9ed` (verified via `https://farely.manhtx.com/release.json`)

### 1.2 Supabase Database & Migrations
- **Project Ref**: `yefbpmqfsstcaeqfrmyn`
- **Local Migrations**: 41 files in `supabase/migrations/` (latest: `20261005000000_saved_opportunities_and_watch.sql`)
- **Key Tables Audited**:
  - `observed_fare_snapshots` (PK `dedupe_key`, column `generation_id`)
  - `active_observed_generation` (columns: `id`, `active_generation_id`, `row_count`, `published_at`)
  - `user_saved_opportunities` (columns: `id`, `user_id`, `opportunity_id`, `snapshot_data`, `saved_at`)
  - `user_alerts` (columns include `target_price`, `latest_price`, `max_stops`, `last_checked_at`, `last_match_at`)
  - `notification_deliveries` (columns include `alert_id`, `deal_id`, `opportunity_id`, `channel`, `status`)

### 1.3 Supabase Edge Functions
- **Total Local Functions**: 16 functions in `supabase/functions/`
- **Live Deployed Identity**: `observed-fares` on live production reports `release_sha: "7b81ffb2bbedc12dcd1ccd377c45d952ddd88af1"`
- **Release Drift**: Edge Functions runtime is lagging behind the frontend release SHA (`7b81ffb...` vs `2f399a5...`).

---

## 2. Reproduction Analysis of High-Risk Findings

Every audit finding from Section 9 was freshly tested against the actual codebase:

### 2.1 Release Convergence
- **Issue**: Frontend source newer than production Edge runtime; no unified release pipeline covering Migrations + Functions + Frontend.
- **Evidence**: `package.json` `"release"` script only runs git push and frontend checks; Edge Functions deploy via a separate un-triggered workflow. Live function reports SHA `7b81ffb...` while frontend serves `2f399a5...`.
- **Verdict**: `REPRODUCED`.
- **Severity**: P0.

### 2.2 Snapshot Atomicity & Active Pointer Isolation
- **Issue**: `active_observed_generation` reader uses wrong pointer column (`generation_id` instead of `active_generation_id`). Candidate generations potentially readable before activation.
- **Evidence**: `supabase/functions/observed-fares/index.ts` line 42 does `.select("generation_id")`. In the migration `20261005000000_saved_opportunities_and_watch.sql`, the column is named `active_generation_id`. As a result, `activeGen?.generation_id` is always `undefined`, so the `.eq("generation_id", ...)` filter is NEVER applied. The reader reads unactivated candidate generations. Furthermore, `observed_fare_snapshots` primary key is `dedupe_key`, causing in-place overwriting of rows during candidate compilation.
- **Verdict**: `REPRODUCED`.
- **Severity**: P0.

### 2.3 Analyzer Exhaustive Execution
- **Issue**: Bounded processing with continuation not consumed by orchestration.
- **Evidence**: In `.github/workflows/fast-flights-pipeline.yml`, `analyze-price` is called with `--data '{}'` once. If more than 5,000 observations exist or if `has_more: true` is returned, the continuation cursor `(cursor_timestamp, cursor_id)` is never sent in a follow-up call.
- **Verdict**: `REPRODUCED`.
- **Severity**: P0.

### 2.4 Refresh Completeness & Scalability
- **Issue**: Production displaying old 1000-row behavior; safety ceiling without complete operational continuation.
- **Evidence**: Deployed Edge Function `refresh-observed-fares` runs legacy SHA `7b81ffb...` with a hard `.limit(1000)` query.
- **Verdict**: `REPRODUCED`.
- **Severity**: P0.

### 2.5 Coverage & Fair Route Scheduling
- **Issue**: Configured routes larger than routes actually scanned; first-N starvation.
- **Evidence**: In `scripts/fast-flights-worker.py` line 310, `routes_url = f"{BASE_URL}/rest/v1/tracked_routes?select=*&enabled=eq.true&limit={ROUTE_LIMIT}"` has no ordering and no state tracking. It perpetually queries the first 20 rows returned by Postgres, starving remaining routes (e.g. routes 21 to 88).
- **Verdict**: `REPRODUCED`.
- **Severity**: P0.

### 2.6 Watch Activation, Matching & Deduplication
- **Issues**:
  - Remote activation failure still returns success: `src/app/data/watchApi.ts` line 209 returns `{ success: true }` unconditionally after catching errors.
  - Anonymous Watch remains local-only while pretending to be active.
  - New Watch receives fake `lastCheckedAt`: `watchApi.ts` line 133 sets `lastCheckedAt = new Date().toISOString()` and line 164 persists `last_checked_at: now` immediately.
  - Target-price Watch secretly requires discount threshold: `watchApi.ts` line 181 sets `discount_threshold: 20`, and `alert-matching.ts` line 35 enforces `Number(deal.discount) >= alert.discount_threshold`.
  - Alert processor bounded to 500 rows: `alert-processor/index.ts` line 114 limits observed snapshots to 500.
  - Alert matching not restricted to active generation: no `generation_id` filter.
  - Generation-specific identity used in notification dedupe: `alert-processor/index.ts` line 134 uses `row.dedupe_key` (which changes every generation) as `opportunity_id` in `notification_deliveries`.
  - Multiple matching offers produce excessive notifications: sends one email for each matching offer without cooldown or best-match filtering.
- **Verdict**: `REPRODUCED`.
- **Severity**: P0.

### 2.7 Saved Opportunity Durability & Epistemics
- **Issues**:
  - Remote functions treat Supabase errors as success: `bookmarks.ts` lines 88-97 does not check `error` returned by `supabase.from("user_saved_opportunities").upsert()`.
  - UI saves observation UUID instead of stable Opportunity ID.
  - `snapshot_data` unused: `bookmarks.ts` does not write snapshot data.
  - Saved item disappears after 7-day observation retention: `SavedDealsPage.tsx` depends on live observation existence via `getDealById`.
  - Saved UI reuses `DealCard` instead of showing longitudinal memory (price when saved vs current price).
- **Verdict**: `REPRODUCED`.
- **Severity**: P0.

### 2.8 Comparable Cohort & Comparator Truth
- **Issues**:
  - Comparable cohort function receives route-history points (date + price) rather than travel-offer observations: `DealDetailPage.tsx` line 129 constructs fake observations from `price_history`.
  - Insufficient cohort creates fake reference median: `opportunityCohort.ts` line 164 sets `cohortMedian: currentPrice` when sample size < 5.
- **Verdict**: `REPRODUCED`.
- **Severity**: P0.

### 2.9 Search & Filter Correctness
- **Issues**:
  - BKK / DMK ambiguity: `travelEntities.ts` line 154 has `"don mueang"` in `BKK` aliases.
  - NRT / HND ambiguity: `travelEntities.ts` line 202 has `"haneda"` and `"hnd"` in `NRT` aliases; `HND` has no independent entry.
  - Deals page global filters operate on bounded client page: `DealsPage.tsx` lines 37-41 fetches 60 rows from server and applies origin, budget, and month filters in React `useMemo` (lines 79-91), hiding matching items at rank >60.
- **Verdict**: `REPRODUCED`.
- **Severity**: P0.

### 2.10 True Cost Epistemic Truth
- **Issues**:
  - Carrier-only baggage assumption treated as `KNOWN`: `costEpistemic.ts` line 70 marks baggage `KNOWN` and `0₫` for all airlines in `isLegacy` (e.g. Vietnam Airlines), even for unverified economy-light fares.
- **Verdict**: `REPRODUCED`.
- **Severity**: P0.

### 2.11 Account Data Rights & Schema Tracking
- **Issues**:
  - `manage-user-data/index.ts` line 43 does not export `user_saved_opportunities`.
  - `prepare_account_deletion` RPC (`20260820000700_idempotent_account_deletion.sql`) does not delete from `user_saved_opportunities`.
- **Verdict**: `REPRODUCED`.
- **Severity**: P0.

### 2.12 Public Copy & Operational Health
- **Issues**:
  - `Root.tsx` lines 66-74 displays a hardcoded pulsating green "HỆ THỐNG TRỰC TUYẾN" with hardcoded "Theo dõi 2.800+ mức giá thời gian thực trên 88 tuyến bay".
  - Obsolete capability claims ("Đánh giá rủi ro & điểm dừng") in footer.
- **Verdict**: `REPRODUCED`.
- **Severity**: P0.

### 2.13 Frontend Visual Grammar
- **Issues**:
  - Overuse of dark slate canvas, bright blue buttons, 3-column card grids, Lucide icon soup, pills on every piece of text, font-black headings, generic AI SaaS aesthetic.
- **Verdict**: `REPRODUCED`.
- **Severity**: P0.

---

## 3. Classification of Issues (P0 vs P1)

| Category | Finding | Classification | Status |
|---|---|---|---|
| Release | Release pipeline divergence (Edge vs Frontend) | P0 | REPRODUCED |
| Snapshot | `active_observed_generation` wrong pointer column | P0 | REPRODUCED |
| Snapshot | In-place overwrite during candidate compilation | P0 | REPRODUCED |
| Analyzer | Bounded processing with unconsumed continuation | P0 | REPRODUCED |
| Refresh | Production 1000-row limit in Edge runtime | P0 | REPRODUCED |
| Coverage | Unordered first-N route starvation | P0 | REPRODUCED |
| Watch | Fake `lastCheckedAt` on create | P0 | REPRODUCED |
| Watch | Hidden 20% discount condition | P0 | REPRODUCED |
| Watch | Fail-closed activation & error handling | P0 | REPRODUCED |
| Watch | Generation-keyed deduplication & alert bursts | P0 | REPRODUCED |
| Watch | 500-row limit in alert-processor | P0 | REPRODUCED |
| Saved | Transient observation UUID used instead of Opportunity ID | P0 | REPRODUCED |
| Saved | Missing `snapshot_data` causing data loss on retention | P0 | REPRODUCED |
| Saved | Remote failure treated as success | P0 | REPRODUCED |
| Cohort | Route history points fed as fake offer observations | P0 | REPRODUCED |
| Cohort | Fake reference median equal to current price | P0 | REPRODUCED |
| Search | BKK/DMK and NRT/HND airport alias confusion | P0 | REPRODUCED |
| Search | Deals page local filtering on 60-row slice | P0 | REPRODUCED |
| True Cost | Carrier-only baggage marked as KNOWN | P0 | REPRODUCED |
| Privacy | `user_saved_opportunities` excluded from export & deletion | P0 | REPRODUCED |
| Copy | Hardcoded operational metrics & fake green pulse | P0 | REPRODUCED |
| UX/UI | Generic AI SaaS card grammar vs Farely Design DNA | P0 | REPRODUCED |
| Telemetry | Full lifecycle event instrumentation & synthetic separation | P1 | REPRODUCED |

---

## 4. Execution Readiness

All 23 primary findings are reproduced and grounded in source code.
Next action: Implement Step 14 (`docs/v21/PRODUCT_MODEL.md`) and systematically burn down all P0 defects.
