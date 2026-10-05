# FARELY V21 ACCEPTANCE CONTRACT
**Frozen Release Acceptance Contract**
**Release Target**: Farely V21 — Product Convergence Release
**Status**: FROZEN (Pre-Implementation Baseline)
**Rule**: No weakening of tests or acceptance criteria. Fix the product, not the test.

---

## 1. Evidence Levels Reference

| Level | Identifier | Description |
|---|---|---|
| E0 | `CLAIM` | Unsupported claim or assertion without artifact proof. |
| E1 | `SOURCE_INSPECTED` | Implementation confirmed by code inspection in repository. |
| E2 | `UNIT_PROVEN` | Validated by deterministic automated unit / domain test. |
| E3 | `INTEGRATION_PROVEN` | Validated across database schema, RPC, or API integration boundary. |
| E4 | `PRODUCTION_SYNTHETIC_PROVEN` | Verified by safe synthetic probe against live production environment. |
| E5 | `ORGANIC_USER_PROVEN` | Proven by organic customer outcome or behavioral retention. |

---

## 2. Verdict Standards

Every acceptance gate can only receive one of the following verdicts:
- `PASS`: Criteria completely satisfied with required evidence level.
- `PARTIAL`: Incomplete coverage or degraded operational state.
- `FAIL`: Criteria not satisfied, regression detected, or negative control failed.
- `BLOCKED_EXTERNAL`: Third-party external dependency (e.g. external provider API key) unavailable; cannot be fabricated.
- `UNVERIFIED`: Not yet executed or measured.

---

## 3. Critical Claims, Negative Controls, and Acceptance Gates

### Gate 1: Release Convergence & Component Identity (P0)
- **Claim**: Source code, migrations, Edge Functions, and frontend are unified under a reproducible release process with verifiable deployment identities. Mutable environment variables are never used alone as proof of deployed code.
- **Required Evidence**: E1 (Release workflow inspection), E2 (Build & verification tests), E3 (Migration verification), E4 (Live release identity inspection on production).
- **Negative Control**:
  - Running data ingestion from a new Git SHA *without* deploying Edge Functions must leave backend deployment identity and fingerprint unchanged.
  - Deploying Edge Functions changes the backend release identity and behavioral fingerprint in lockstep.
- **PASS Condition**: Frontend `release.json` reports current commit SHA; database migrations match canonical migration chain; Edge Functions report matching release identity; release process deploys all tiers deterministically.
- **FAIL Condition**: Frontend SHA newer than Edge Function runtime without explicit documentation; Edge Functions report obsolete SHA; silent failure to deploy Edge Functions.
- **Allowed Blocker State**: `BLOCKED_EXTERNAL` permitted for optional Edge Functions (e.g., third-party email token) if documented honestly; core functions must deploy.

---

### Gate 2: Snapshot Atomicity & Active Pointer Isolation (P0)
- **Claim**: Observed fares reader queries ONLY the active generation specified by `active_observed_generation.active_generation_id`. Candidate generations are fully isolated during compilation and cannot be read before publication.
- **Required Evidence**: E1 (Schema & function code inspection), E2 (Snapshot atomicity tests), E3 (Database migration integration).
- **Negative Control**:
  - Generation A is active.
  - Begin building Generation B (write partial candidate rows).
  - Simulate failure or interruption before publication.
  - Reader queries during and after failure: MUST return ONLY complete Generation A.
  - Upon successful publication of Generation B via atomic switch, reader sees ONLY complete Generation B.
  - Never a blend of A + partial B.
- **PASS Condition**: Reader uses correct pointer column (`active_generation_id`); candidate rows do not overwrite active rows; generation publication is atomic.
- **FAIL Condition**: Reader selects wrong column (`generation_id`), or reads unactivated candidate generations, or candidate write mutates active generation rows.
- **Allowed Blocker State**: None (Internal P0).

---

### Gate 3: Analyzer Exhaustive Execution & Continuation (P0)
- **Claim**: `analyze-price` keyset pagination processes all eligible observations without dropping rows when continuation is signaled. Orchestrator consumes continuation until completion or flags PARTIAL.
- **Required Evidence**: E1 (Function & workflow code inspection), E2 (Keyset pagination unit tests), E3 (Multi-batch analyzer test).
- **Negative Control**:
  - Feed >5,000 eligible rows with identical timestamps to the analyzer.
  - All rows are processed exactly once across sequential batches, OR the run remains explicitly flagged as `PARTIAL` with a durable continuation cursor.
- **PASS Condition**: Stable keyset pagination on `(timestamp, id)`; workflow or script loops while `has_more=true` and `continuation` exists; no silent row omission.
- **FAIL Condition**: Orchestration ignores `continuation` or stops after single invocation while `has_more=true`; tied-timestamp rows skipped.
- **Allowed Blocker State**: None (Internal P0).

---

### Gate 4: Refresh Completeness & Scalable Corpus Processing (P0)
- **Claim**: `refresh-observed-fares` consumes the full candidate corpus using stable cutoff and keyset pagination up to the safety limit. If a safety ceiling is hit, system reports DEGRADED/PARTIAL, never quietly green.
- **Required Evidence**: E1 (Function inspection), E2 (Keyset pagination tests), E3 (Scalability benchmark test).
- **Negative Control**:
  - Corpus with >1,000 and >2,000 valid observations.
  - Pipeline must process all rows without truncating at 1,000 rows.
  - If safety ceiling (e.g., 50,000) is reached, operational status must be `partial_degraded`, not `completed`.
- **PASS Condition**: Zero arbitrary 1,000-row caps; all valid rows scored into candidate generation; clear degraded flag upon ceiling encounter.
- **FAIL Condition**: Silently dropping observations above 1,000; returning success=true / completed when corpus was truncated.
- **Allowed Blocker State**: None (Internal P0).

---

### Gate 5: Fair Route Coverage Scheduling (P0)
- **Claim**: Route scanner employs fair, deterministic scheduling across all enabled routes instead of perpetually picking only the first N routes in database storage order.
- **Required Evidence**: E1 (Worker script inspection), E2 (Scheduler fairness unit test), E3 (Multi-run route rotation verification).
- **Negative Control**:
  - 88 enabled routes configured, with `ROUTE_LIMIT=20`.
  - Over 5 consecutive scheduled runs, all 88 routes must be attempted (fair rotation), rather than the same 20 routes scanned 5 times.
- **PASS Condition**: Deterministic round-robin / staleness-based ordering (`order by last_attempt_at asc nulls first`); public monitored route count reflects only actually scanned/succeeded routes.
- **FAIL Condition**: Querying `select * from tracked_routes limit 20` without order or state tracking, starving routes 21–88.
- **Allowed Blocker State**: None (Internal P0).

---

### Gate 6: Canonical Domain & Identity Consistency (P0)
- **Claim**: System models distinct entities: `TravelIntent`, `OfferVariant`, `Observation`, `ComparableCohort`, `Opportunity`, `Watch`, `SavedOpportunity`, `Verification`. Opportunity identity is stable across snapshot generations and does NOT depend on transient observation UUIDs or prices.
- **Required Evidence**: E1 (Domain types inspection in `docs/v21/PRODUCT_MODEL.md` and `src/app/domain`), E2 (Identity stability tests).
- **Negative Control**:
  - Two snapshot generations containing the exact same flight (same route, dates, carrier, flight number, departure time).
  - Both generations MUST yield the identical canonical `opportunity_id`.
- **PASS Condition**: Logical Opportunity ID derived deterministically from travel attributes (`origin:destination:departDate:returnDate:airlineCode:flightNumber:stops`), independent of snapshot UUID.
- **FAIL Condition**: Using `observation_id`, snapshot generation UUID, or `dedupe_key` containing generation ID as logical Opportunity identity.
- **Allowed Blocker State**: None (Internal P0).

---

### Gate 7: Comparable Cohort Truth & No Fake Median (P0)
- **Claim**: Comparable cohorts are constructed strictly from multi-dimensional travel-offer attributes (route, trip type, departure month/period, duration bucket, stops). Insufficient cohort (< 5 observations) NEVER produces a fake reference median or a reference line equal to current price.
- **Required Evidence**: E1 (Domain code inspection), E2 (Cohort unit tests), E3 (Detail page integration test).
- **Negative Control**:
  - Observation evaluated against a cohort with only 2 matching samples.
  - Result MUST report `cohortMedian: null` (or 0) with explicit status `CHƯA ĐỦ DỮ LIỆU ĐỐI SÁNH` / `ĐANG TÍCH LŨY BẰNG CHỨNG`.
  - Result MUST NOT set `cohortMedian = currentPrice` or claim a discount percentage.
  - Route-history points lacking travel attributes (only date + price) MUST NOT be coerced into fake offer variants.
- **PASS Condition**: Zero fake reference medians; clear indication of data sufficiency; route-level history clearly labeled as route-level.
- **FAIL Condition**: Setting `cohortMedian = currentPrice` when sample size < 5; fabricating comparator numbers.
- **Allowed Blocker State**: None (Internal P0).

---

### Gate 8: True Cost Truth & Epistemic Honesty (P0)
- **Claim**: Costs follow epistemic states: `KNOWN`, `ESTIMATED`, `OPTIONAL`, `UNKNOWN`. Absence of fee data is UNKNOWN, never ZERO. Carrier identity alone does NOT mark checked baggage as KNOWN.
- **Required Evidence**: E1 (Domain code inspection), E2 (Epistemic cost tests), E3 (Detail page visual rendering).
- **Negative Control**:
  - Legacy carrier ticket (e.g., Vietnam Airlines, Singapore Airlines) with no explicit baggage inclusion metadata from provider.
  - Baggage state MUST be `UNKNOWN` (or `ESTIMATED` with clear disclaimer), NEVER `KNOWN = 0₫` (included).
  - Total label MUST be `TỔNG ƯỚC TÍNH` or `TỔNG TỐI THIỂU`, NEVER `Tổng thực tế phải trả`.
- **PASS Condition**: `UNKNOWN != ZERO`; no claims of "Đã bao gồm thuế phí" or "Hành lý bao gồm" without affirmative source evidence.
- **FAIL Condition**: Marking baggage `KNOWN` solely by carrier code; asserting finality of price without live verification.
- **Allowed Blocker State**: None (Internal P0).

---

### Gate 9: City vs Airport Disambiguation (P0)
- **Claim**: System cleanly distinguishes multi-airport metropolitan areas (City) from specific airport codes (Airport). Don Mueang (`DMK`) and Suvarnabhumi (`BKK`) are distinct; Haneda (`HND`) and Narita (`NRT`) are distinct.
- **Required Evidence**: E1 (Travel entity catalog inspection), E2 (City/Airport resolution tests), E3 (Search autocomplete integration).
- **Negative Control**:
  - Query "Don Mueang" or "DMK" -> MUST resolve to `DMK`, NOT `BKK`.
  - Query "Haneda" or "HND" -> MUST resolve to `HND`, NOT `NRT`.
  - Query "Bangkok" (City) -> Allows searching Bangkok metro (both BKK and DMK) or explicitly picking one.
- **PASS Condition**: Specific airport queries resolve to exact IATA code; no cross-airport aliasing.
- **FAIL Condition**: Resolving `HND` to `NRT` or `DMK` to `BKK`.
- **Allowed Blocker State**: None (Internal P0).

---

### Gate 10: Global Search & Filter Pipeline Correctness (P0)
- **Claim**: All product-significant filtering executes in the order `FILTER -> SORT -> PAGINATE`. Filtering is never performed client-side on an arbitrarily bounded first page.
- **Required Evidence**: E1 (Search & Deals page code inspection), E2 (Query generation tests), E3 (Large dataset search tests).
- **Negative Control**:
  - A matching flight exists at rank 150 (beyond page size 60 or 120).
  - Applying a specific filter (e.g., origin `SGN` or budget limit) MUST retrieve and display the flight, not return an empty state.
- **PASS Condition**: Global filters query the server or complete in-memory corpus before pagination; no false empty results.
- **FAIL Condition**: Fetching 60 rows from server and running `.filter()` locally, missing all matching rows beyond rank 60.
- **Allowed Blocker State**: None (Internal P0).

---

### Gate 11: Watch Monitoring Contract & Activation Truth (P0)
- **Claim**: Watch represents a durable server monitoring contract. Watch activation fails closed: if remote write fails, UI must never display "Đã bắt đầu theo dõi" as active. Newly created Watch has `lastCheckedAt = null`. Watch matches user's exact condition without hidden discount thresholds.
- **Required Evidence**: E1 (Watch API & Edge Function inspection), E2 (Watch domain tests), E3 (Watch integration tests).
- **Negative Controls**:
  - Remote activation fails (e.g. network 500 or RLS error): UI MUST show failure or pending retry, NEVER `ACTIVE`.
  - Brand new Watch: `lastCheckedAt` MUST be `null`; UI displays "Đang chờ lượt kiểm tra đầu tiên", NEVER "Vừa kiểm tra".
  - Watch with target price ≤ 4.5M: Offer at 4.2M with 10% discount MUST trigger match; system MUST NOT secretly require ≥ 20% discount.
  - Evaluation MUST query entire candidate corpus or active snapshot, not just first 500 rows.
- **PASS Condition**: Watch status accurately reflects server reality; first evaluation timestamp is real; user criteria matched verbatim.
- **FAIL Condition**: Fake `lastCheckedAt` on create; silent 20% discount requirement; false active UI on server failure.
- **Allowed Blocker State**: `BLOCKED_EXTERNAL` if email delivery provider (Resend) credentials are not configured in environment.

---

### Gate 12: Notification Deduplication & Anti-Spam Signal Policy (P0)
- **Claim**: Watch notifications are deduplicated by stable logical Opportunity ID across generations. The alert processor sends only high-signal alerts (e.g., best match per evaluation cycle, cooldown), avoiding email bursts.
- **Required Evidence**: E1 (Alert processor code inspection), E2 (Deduplication unit tests), E3 (Notification pipeline test).
- **Negative Control**:
  - An active watch matches 5 offers simultaneously in one cycle.
  - System selects and sends ONLY the best match (lowest price / highest quality), NOT 5 separate emails.
  - In the next refresh cycle, the same logical Opportunity in a new generation MUST NOT generate a second notification within the cooldown window.
- **PASS Condition**: Logical Opportunity ID used in `notification_deliveries`; max 1 notification per cycle per watch; cooldown enforced.
- **FAIL Condition**: Using generation-keyed `dedupe_key` for delivery deduplication; blasting one email per matching row.
- **Allowed Blocker State**: `BLOCKED_EXTERNAL` for actual email transmission if provider keys missing; dedupe logic itself must PASS.

---

### Gate 13: Saved Opportunity Logical Identity & Durability (P0)
- **Claim**: Saved Opportunities store the stable `opportunity_id` and complete `snapshot_data`. Remote writes inspect Supabase errors and fail closed. Saved items remain readable and meaningful even if the underlying observation is purged by data retention.
- **Required Evidence**: E1 (Bookmarks / Saved API inspection), E2 (Saved domain tests), E3 (Persistence integration test).
- **Negative Controls**:
  - Remote save fails (error returned by Supabase): function returns `false`, UI reconciles failure.
  - Observation purged from `flights` / `observed_fare_snapshots` table: Saved page reconstructs the saved item from `snapshot_data`, displaying price when saved, and noting current price unverified if fresh data is absent.
- **PASS Condition**: `user_saved_opportunities` stores `snapshot_data`; remote save checks `error`; longitudinal context displayed (saved price vs current price).
- **FAIL Condition**: Storing only transient observation UUID; losing saved item when raw observation is cleaned up; treating Supabase error as success.
- **Allowed Blocker State**: None (Internal P0).

---

### Gate 14: Account Data Rights & Schema Tracking (P0)
- **Claim**: Data export and account deletion cover all user-owned tables in the current schema: `user_preferences`, `user_alerts`, `user_saved_opportunities`, `user_bookmarks`, `product_events`, and related `notification_deliveries`.
- **Required Evidence**: E1 (Data management Edge Function & migration inspection), E2 (Export/delete tests).
- **Negative Control**:
  - Create user with Saved Opportunities and Watches.
  - Trigger data export: result MUST contain `user_saved_opportunities`.
  - Trigger account deletion: `user_saved_opportunities` MUST be deleted.
- **PASS Condition**: `manage-user-data` export and `prepare_account_deletion` RPC include `user_saved_opportunities` and full watch attributes.
- **FAIL Condition**: Orphaned user records left in `user_saved_opportunities` after deletion; export missing saved items.
- **Allowed Blocker State**: None (Internal P0).

---

### Gate 15: Public Copy Honesty & Operational Telemetry (P0)
- **Claim**: Public copy contains no unsupported or misleading claims: no hardcoded "2,800+ real-time prices on 88 routes", no fake pulsating green system health, no "100% transparent / all fees included". Operational status is bound to real telemetry or omitted.
- **Required Evidence**: E1 (Page copy & footer inspection), E2 (Copy audit assertions), E4 (Browser inspection).
- **Negative Control**:
  - Background scanning worker fails or live verify returns 503.
  - System MUST NOT display a hardcoded green "HỆ THỐNG TRỰC TUYẾN" badge.
- **PASS Condition**: Footer simplified to essential brand, legal, support, and price disclaimers; no hardcoded false metrics; calm factual copy.
- **FAIL Condition**: Hardcoded marketing metrics; fake system status badges.
- **Allowed Blocker State**: None (Internal P0).

---

### Gate 16: UX/UI Reconstruction — Farely Design DNA (P0)
- **Claim**: The interface is reconstructed from generic dark Tailwind AI SaaS patterns into a calm, high-density, precise consumer price instrument centered around the Farely Design DNA (Route, Price, Comparator, Evidence, Freshness, Verification, Watch State).
- **Required Evidence**: E1 (Component structure inspection), E4 (Browser testing across 390px, 768px, 1440px viewports with before/after documentation).
- **Logo-Off Test**:
  - Remove logo, brand name, and brand color.
  - The interface must remain immediately recognizable as a coherent price instrument through route typography, price hierarchy, evidence blocks, and monitoring ledgers.
- **PASS Condition**: High-density Opportunity Ledger on Deals (8–12 items visible on typical desktop viewport); decision-note Detail view; quiet navigation; no Lucide icon clutter; responsive on mobile (390px) without horizontal scroll or tap target overlap.
- **FAIL Condition**: Generic 3-column large card grid with giant badges; AI startup buzzwords; rainbow accent colors; failed logo-off test.
- **Allowed Blocker State**: None (Internal P0).

---

### Gate 17: Telemetry Lifecycle & Synthetic Probe Isolation (P1)
- **Claim**: Lifecycle events (`opportunity_impression`, `opportunity_open`, `evidence_engagement`, `watch_created`, `watch_activation_succeeded`, `verify_click`, `saved_created`, `saved_removed`) are wired to factual events. Synthetic probes are tagged `synthetic=true` and excluded from organic success metrics.
- **Required Evidence**: E1 (Telemetry code inspection), E2 (Event serialization tests).
- **PASS Condition**: Telemetry fires on actual user/system actions; synthetic probes clearly tagged.
- **FAIL Condition**: Frontend fabricating backend events (`watch_matched` invented on client); untagged synthetic probes.
- **Allowed Blocker State**: None.

---

## 4. Frozen Acceptance Summary Table

| Gate | Category | Description | Target Level | Required Verdict |
|---|---|---|---|---|
| G1 | Release | Release convergence, migration validation, Edge deployment identity | E3 / E4 | PASS (or BLOCKED_EXTERNAL documented) |
| G2 | Snapshot | Generation pointer correction & atomic candidate isolation | E3 | PASS |
| G3 | Analyzer | Exhaustive keyset pagination & continuation consumption | E2 / E3 | PASS |
| G4 | Refresh | Scalable corpus processing without 1000-row cap | E2 / E3 | PASS |
| G5 | Coverage | Fair deterministic route scheduling across enabled routes | E2 / E3 | PASS |
| G6 | Domain | Canonical entities & stable Opportunity identity | E2 | PASS |
| G7 | Comparator | Multi-attribute cohort & zero fake medians | E2 | PASS |
| G8 | True Cost | Epistemic states (KNOWN/ESTIMATED/UNKNOWN != ZERO) | E2 | PASS |
| G9 | Airport | Clean City vs Airport disambiguation (DMK/BKK, HND/NRT) | E2 | PASS |
| G10 | Search | Global FILTER -> SORT -> PAGINATE without first-page clipping | E2 / E3 | PASS |
| G11 | Watch | Monitoring contract, fail-closed activation, real lastCheckedAt | E3 / E4 | PASS |
| G12 | Alert Dedupe | Stable opportunity identity deduplication & anti-spam signal policy | E2 / E3 | PASS |
| G13 | Saved | Stable opportunity ID, snapshot durability & longitudinal UI | E2 / E3 | PASS |
| G14 | Privacy | Data export and account deletion cover all current user tables | E3 | PASS |
| G15 | Copy | Factual copy, removal of hardcoded metrics & fake status | E1 / E4 | PASS |
| G16 | UX/UI | Farely-native design DNA, high-density ledger, logo-off test | E4 | PASS |
| G17 | Telemetry | Lifecycle event coverage & synthetic separation | E2 | PASS |

**Frozen Date**: 2026-10-05
**Reviewer**: Antigravity Autonomous Agent
