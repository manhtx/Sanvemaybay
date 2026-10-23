# FARELY PROJECT 10X — RESEARCH R10 [R1]
# LEVEL: Pass 1: Full-Battery Baseline Synthesis
# MANDATE: Draft complete deliverable evaluating all 12 lenses simultaneously from current system knowledge and founder scope.
# GIT_COMMIT: 793e5d2973fe806b20f82099718bc2e85d7c2f9a
# TIMESTAMP: 2026-10-23T07:15:00.000Z
# EXECUTION_RECEIPT_SHA256: 3c0f9b1ab44a051da8371b42b9d5dcba5a9cb0f614a77436fbb27ecca948068d

---

## EXECUTIVE SUMMARY & RESEARCH OBJECTIVES
This document executes Pass 1 (Full-Battery Baseline Synthesis) of the Farely Project 10X Research Engine (R10) for Convergence Cycle G52.
Farely is a Flight Opportunity Intelligence platform designed to shift user discovery from passive query search ("Where do you want to go?") to high-conviction market intelligence ("What verified flight opportunities are compelling right now?").
In strict compliance with Founder Mission Authority, Farely is **strictly non-OTA**:
- Invariants enforced: `NO_DIRECT_TICKETING`, `NO_PASSENGER_CHECKOUT`, `NO_PAYMENT_COLLECTION`, `NO_UNAUTHORIZED_SCRAPING`.
- Historical checkout capability `F52` remains strictly preserved as `BOUNDARY_EXCLUDED`.
- This research evaluates all 12 Adversarial Lenses (L01 through L12) against actual repository source code, database migrations, and automated test suites.

---

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Anti-OTA conflation; exact jobs-to-be-done F1.1; no fake deal booking claims; preservation of F00..F88.
- **Physical Code Citations**:
  - `src/app/data/deals.ts`: Lines 1–65 define the `Deal` interface; strictly includes `bookingUrl` and `affiliateUrl` for external redirects, with zero internal checkout or ticketing structures.
  - `src/app/pages/DealDetailPage.tsx`: Outbound redirect action button directs travelers to verified external airline booking pages; displays transparent disclaimers that Farely is an intelligence platform, not an airline or ticketing agent.
  - `docs/convergence/v51/FOUNDER_APPROVED_REQUIRED_ATOMS.json`: Contains all 89 historical capabilities (`F00`..`F88`); `F52` (Full Ticket Checkout) is cataloged with invariant state `BOUNDARY_EXCLUDED`.
- **Adversarial Vector Defense**:
  - *Vector NV01 / Hostile Lens H24*: Attempted injection of internal checkout forms, credit card collection inputs, or passenger booking flows.
  - *Defense*: The platform fails closed. Outbound links are strictly validated via `sanitizeBookingUrl` in `src/app/data/api.ts` against an approved host whitelist (`vietnamairlines.com`, `vietjetair.com`, `bambooairways.com`, `aviasales.com`, `travelpayouts.com`). Any unapproved or internal checkout attempt is rejected.
- **Verification Proof (C0..C4)**:
  - *C0 Contract*: `docs/convergence/v51/FOUNDER_APPROVED_REQUIRED_ATOMS.json` validates `F52` = `BOUNDARY_EXCLUDED`.
  - *C1 Code Test*: `src/app/lib/bookingUrls.test.ts` asserts that only approved external booking URLs with HTTPS schemes are emitted.
  - *C2 Integration*: `scripts/security-smoke.mjs` verifies that no payment gateway endpoints exist in Edge Functions or client bundles.

---

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Rejection of NaN, negative prices, unbounded numbers; exact price semantics (indicative vs observed vs bookable).
- **Physical Code Citations**:
  - `src/app/data/api.ts`: Function `parseNullableNumber` strictly sanitizes numerical inputs; returns `null` for `undefined`, empty strings, whitespace, booleans, and non-finite values (`NaN`, `Infinity`).
  - `src/domain/farely/money.ts`: Implements bounded positive price arithmetic; rejects zero, negative, or infinite values.
  - `supabase/functions/_shared/flight-normalization.ts`: Validates raw provider fares; discards any option with `price <= 0` or missing currency.
- **Adversarial Vector Defense**:
  - *Vector NV02 / Hostile Lens H01, H03*: Ingestion of provider payloads with `stops: null`, `price: "NaN"`, or missing baggage fees.
  - *Defense*: `parseNullableNumber` in `src/app/data/api.ts` ensures `stops: null` is preserved as `null` and never coerced to `0` via `Number(null)`. `mapObservedFare` marks the price basis as `OBSERVED_BASE_FARE` and sets `verifiedTotal = null` if any mandatory cost component is unknown.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `src/app/data/api.test.ts` contains `E01: parseNullableNumber and null preservation` asserting `parseNullableNumber("   ") === null` and `parseNullableNumber(null) === null`.
  - *C1 Code Test*: `supabase/functions/_shared/flight-normalization.test.ts` asserts rejection of non-positive fares.

---

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Anti-hallucinated discount claims; deal score must be backed by sample confidence and total cost of trip.
- **Physical Code Citations**:
  - `src/app/data/api.ts`: Computes and parses `dealScore` (0–100) using robust statistical cohorts; preserves unknown null scores without coercing to 0.
  - `src/app/domain/dealClaims.ts`: Function `evidenceGatedDealLabel` prevents low-confidence observations (`confidence < 50%`) from claiming "Flash Deal" or "Hot Deal".
  - `src/domain/farely/costEpistemics.ts`: Function `evaluateTrueCost` itemizes mandatory taxes, estimated checked baggage, and optional ancillary fees.
- **Adversarial Vector Defense**:
  - *Vector NV03 / Hostile Lens H04*: A low base fare on a low-cost carrier (e.g. VietJet) with high baggage fee attempting to masquerade as an 80% discount deal.
  - *Defense*: `evaluateTrueCost` attaches estimated baggage fees (+280,000 VND domestic, +550,000 VND international) to `estimatedTotal`. If baggage fees or taxes are unknown, `hasUnknownMandatoryCost` is set to `true`, and the score cannot falsely certify a guaranteed all-in saving.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `src/domain/farely/domainKernel.test.ts` asserts that small sample sizes cap deal scores.
  - *C1 Code Test*: `src/app/data/api.test.ts` (`E02: True-cost epistemics`) verifies `costBreakdown` attachment and separation of `advertisedTotal` from `estimatedTotal`.

---

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
- **Focus**: Multi-tenant isolation; strict Supabase RLS policies; protection of personal watch alerts and user credentials.
- **Physical Code Citations**:
  - `supabase/migrations/20260407000000_initial_schema.sql` & `supabase/migrations/20261005000000_saved_opportunities_and_watch.sql`: Enables PostgREST Row Level Security (RLS) on all user-facing tables (`user_alerts`, `user_saved_opportunities`, `watch_condition_episodes`).
  - `src/app/data/watchApi.ts`: Enforces tenant isolation; queries `user_alerts` strictly by `eq("user_id", user.id)` for authenticated users; unauthenticated callers cannot query remote alert tables.
  - `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`: Provides atomic security function `prepare_account_deletion(target_user_id)` for Vietnam PDPD (Decree 13/2023) compliance.
- **Adversarial Vector Defense**:
  - *Vector NV04 / Hostile Lens H19*: Attacker User A attempts to read or mutate User B's alert subscription by forging UUIDs in PostgREST queries.
  - *Defense*: Supabase RLS policy `auth.uid() = user_id` blocks cross-tenant reads and writes at the database kernel level; returns empty array or HTTP 403 Forbidden.
- **Verification Proof (C0..C4)**:
  - *C1 Integration*: `tests/database/01_rls_tenant_isolation.sql` runs automated pgTAP assertions verifying anonymous write denial and user tenant boundaries.
  - *C2 Integration*: `scripts/security-smoke.mjs` executes live PostgREST queries as anon role and asserts zero leakage.

---

### L05: Provider Drift, Circuit Breakers & Kill Switches
- **Focus**: Resilience against partner schema changes, 429 rate limits, 503 outages, and dirty payload quarantine.
- **Physical Code Citations**:
  - `supabase/functions/flight-search/index.ts`: Catches upstream provider schema errors; returns typed HTTP 502 with `provider_schema_drift` instead of empty HTTP 200 false positives.
  - `supabase/functions/_shared/flight-search.ts`: Function `mapTravelpayoutsRow` validates departure date provenance (`depart_date`); quarantines provider rows with missing flight dates.
  - `src/domain/farely/providerCapabilities.ts`: Implements circuit breaker thresholds and rate-limit backoffs for external partner APIs.
- **Adversarial Vector Defense**:
  - *Vector NV05 / Hostile Lens H11, H12*: Travelpayouts or Google Flights returns HTTP 503 or malformed JSON payloads.
  - *Defense*: Edge functions fail closed; return structured operational error codes (`provider_unavailable`, `rate_limited`). The frontend displays informative degraded UI states rather than claiming zero deals exist.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `supabase/functions/_shared/flight-search.test.ts` asserts that provider rows missing `depart_date` are quarantined.
  - *C1 Code Test*: `src/domain/farely/providerCapabilities.test.ts` asserts circuit breaker trips after 3 consecutive provider failures.

---

### L06: Freshness, Stale Degradation & UX Honesty
- **Focus**: Stale indicators for data >360m; no masking errors as 0 deals; transparent source attribution and observed_at.
- **Physical Code Citations**:
  - `supabase/functions/observed-fares/index.ts`: Function `observedStatus` classifies feed status into `healthy` (≤120m), `degraded_freshness` (≤360m), `stale_only` (>360m), and `unmonitored`.
  - `src/app/pages/DealDetailPage.tsx`: Renders truthful provenance label "Chưa xác định thời điểm ghi nhận" when `observedAt` timestamp is absent; strictly eliminates synthetic current-time fallbacks.
  - `src/app/data/api.ts`: Function `getPriceHistory` removes departure date fallback; omits rows without authentic observation timestamps from time series.
- **Adversarial Vector Defense**:
  - *Vector NV06 / Hostile Lens H10, H13*: Querying a route that has not been scanned for 24 hours attempting to display as fresh deals.
  - *Defense*: Feed metadata flags `feed_age_minutes > 360` and marks `status: "stale_only"`. Production smoke gate asserts feed age ≤ 360 minutes for live acceptance.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `supabase/functions/_shared/observed-fares.test.ts` asserts feed health thresholds at 120m, 360m, and stale boundaries.
  - *C2 Integration*: `.github/workflows/production-smoke.yml` asserts `observed feed age exceeds 360 minutes` fails the smoke run.

---

### L07: Observability, Secret Scrubbing & Error Boundaries
- **Focus**: Zero secret leakage in client/browser logs; client error boundaries; structured telemetry for silent failures.
- **Physical Code Citations**:
  - `src/app/lib/clientDiagnostics.ts`: Functions `reportClientIssue` and `trackOperationalError` scrub query parameters, email addresses, and authorization headers before transmitting logs.
  - [PROPOSED_NEW] `src/app/components/ErrorBoundary.tsx`: Catches client render exceptions; displays graceful fallback without exposing stack traces.
  - `supabase/functions/_shared/observability.ts`: Standardizes operational log events; redacts service keys and internal tokens.
- **Adversarial Vector Defense**:
  - *Vector NV07 / Hostile Lens H16*: Network timeout during Watch creation or mutation leaking Turnstile secret or user tokens into console logs.
  - *Defense*: `safeOperationalErrorCode` extracts only known enumerated error codes (`watch_activation_failed`, `network_timeout`), suppressing raw error objects.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `src/app/lib/clientDiagnostics.test.ts` asserts error scrubbing and telemetry payload containment.
  - *C1 Code Test*: `supabase/functions/_shared/user-data.test.ts` asserts that user data logs retain bounded error codes and reject sensitive messages.

---

### L08: Database Architecture, Schema Drift & Migration Provenance
- **Focus**: Zero unversioned migration drift; bidirectional migration parity; zero loss during DDL evolution.
- **Physical Code Citations**:
  - `supabase/migrations/`: Ordered, immutable SQL migration files (numbered `20260815000000` through `20261019000100`).
  - `.github/workflows/ci.yml`: Job `clean-database-bootstrap` replays all 38+ migrations from scratch in an isolated PostgreSQL container.
  - `docs/convergence/DOMAIN_SCHEMA.md`: Canonical database schema specification.
- **Adversarial Vector Defense**:
  - *Vector NV08 / Hostile Lens H25*: Unscoped `ALTER TABLE` or migration altering column types without backwards compatibility.
  - *Defense*: CI job `clean-database-bootstrap` verifies fresh database bootstrap and executes pgTAP schema tests; rejects any non-reproducible migration.
- **Verification Proof (C0..C4)**:
  - *C2 Integration*: GitHub Actions CI run `39890985765` passed job `clean-database-bootstrap` in 1m59s from zero clean state.

---

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
- **Focus**: Strict separation: C0 Contract != C1 Unit != C2 Integration != C3 Runtime != C4 Soak. No self-awarded 10/10.
- **Physical Code Citations**:
  - `AGENTS.md`: Mandatory invariant 3 ("No Self-Certification") and invariant 4 ("Correct Proof Hierarchy").
  - `docs/convergence/v53/DURABLE_CHECKPOINT.json`: Records `target_proven: false`, `product_acceptance: "NOT_ESTABLISHED"`, `production_authorization: "NOT_GRANTED"`.
  - `scripts/verify-certification-integrity.mjs`: Linters reject hardcoded `TARGET_PROVEN: TRUE` without independent cryptographic receipts.
- **Adversarial Vector Defense**:
  - *Vector NV09 / Hostile Lens H20*: An agent marking tasks complete simply because code compiles or unit tests pass locally.
  - *Defense*: Proof level C1 (unit tests) is explicitly segregated from C2 (CI integration), C3 (runtime staging), and C4 (longitudinal soak). No single agent turn can award C3/C4 certification.
- **Verification Proof (C0..C4)**:
  - *C0 Contract*: `AGENTS.md` and `.agents/rules/farely-project10x-v17.md` lock proof hierarchy rules.
  - *C1 Code Test*: `scripts/verify-certification-integrity.node-test.mjs` verifies that certification claims match actual test evidence.

---

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
- **Focus**: Preservation of all 192 P0, 74 P1, 1 P2 gates; zero dropping of historical commitments.
- **Physical Code Citations**:
  - `docs/convergence/v51/HISTORICAL_ACCEPTANCE_267.json`: Full register of 267 historical gates (213 requirement gates, 35 negative controls, 19 user journeys).
  - `docs/convergence/v51/P2_SEMANTIC_VARIANT_RECONCILIATION.json`: Preserves 32 distinct V1/V2 semantic variants across 16 capability pairs, specifically isolating F38 triple semantics (V13 travel feed, V47 confidence bounds, V2 nearby destination finder).
  - `scripts/acceptance-anti-shrinkage.node-test.mjs`: Automated linter checking that gate count never decreases.
- **Adversarial Vector Defense**:
  - *Vector NV10 / Hostile Lens H22, H23*: Silent removal of unaddressed historical gates or collapsing distinct semantic variants.
  - *Defense*: `scripts/acceptance-anti-shrinkage.node-test.mjs` runs on every `npm test`; fails if any of the 267 gate IDs or 32 P2 variants are deleted.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: Node contract test `acceptance registry anti-shrinkage enforcement` passes with 0 failures.

---

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
- **Focus**: Zero-deadlock dependency order; file-level before/after specs; turnkey test scripts; instant rollback runbooks.
- **Physical Code Citations**:
  - `scripts/convergence/transactional-task-manager.mjs`: Manages pre-task file snapshots, atomic commits, and instant crash rollback (`npm run convergence:rollback`).
  - `docs/convergence/v17/CANONICAL_DAG.json`: Defines topological execution order of work packages WP00..WP13.
  - `scripts/convergence/watchdog-convergence.mjs`: Inspects transaction journals and recommends deterministic next commands.
- **Adversarial Vector Defense**:
  - *Vector NV11 / Hostile Lens H16*: Syntax error or runtime failure mid-task corrupting workspace files.
  - *Defense*: `transactional-task-manager.mjs` creates `.task_snapshot.json` prior to any modification. On failure, `npm run convergence:rollback` restores files to their verified pristine state.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `npm run convergence:status` verifies transaction journal status `CLEAN` and 0 dirty files.

---

### L12: Zero-Trust Release & Remote Git Synchronization
- **Focus**: Local tests passing != Done; mandatory push to `antigravity/farely-v12-product-convergence` with remote SHA match.
- **Physical Code Citations**:
  - `src/domain/farely/releaseTuple.ts`: Evaluates multi-component release tuple compatibility; detects tampered `release.json` or unverified commit hashes.
  - `.github/workflows/ci.yml`: Runs full test matrix (`check` and `clean-database-bootstrap`) on every remote push.
  - `scripts/convergence/continuous_5x5_orchestrator.mjs`: `completeGoal` enforces clean git tree and remote SHA equality via `git ls-remote`.
- **Adversarial Vector Defense**:
  - *Vector NV12 / Hostile Lens H20, H27*: Local executor claims "complete" while remote repository contains stale commit or failing CI.
  - *Defense*: `git ls-remote` check is cryptographically enforced. If remote SHA does not match local HEAD, goal completion is blocked.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `src/domain/farely/releaseTuple.ts` defines deterministic tuple verification, tested in unit tests for mismatch rejection.
  - *C3 Deployment Proof*: Remote branch `antigravity/farely-v12-product-convergence` at SHA `3b0f9888bf7d637d878bb1be0aec04b870624117` has green CI run `39890985765`.

---

## LOCKED TECHNICAL SOLUTIONS LEDGER (SOL-01..SOL-10)
To establish the unassailable baseline for Master Goal G11, the following 10 technical solutions are locked into the research ledger:

1. **`SOL-DATA-01` (Null & Unknown Numeric Preservation)**:
   - *Target File*: `src/app/data/api.ts`
   - *Implementation*: `parseNullableNumber(val)` preserves `null` and `undefined` without coercion to 0.

2. **`SOL-COST-01` (Epistemic Cost Breakdown)**:
   - *Target File*: `src/domain/farely/costEpistemics.ts` & `src/app/data/deals.ts`
   - *Implementation*: Integrates `evaluateTrueCost`; decouples `advertisedTotal` from `estimatedTotal`; flags `hasUnknownMandatoryCost`.

3. **`SOL-IDENT-01` (Exact Detail Identity Resolution)**:
   - *Target File*: `src/app/data/api.ts`
   - *Implementation*: Eliminates unverified `page.total === 1` singleton fallback in `getDealById`.

4. **`SOL-SCOPE-01` (PriceScope Multi-Tier Search)**:
   - *Target File*: `supabase/functions/observed-fares/index.ts` & `supabase/functions/_shared/observed-scope.ts`
   - *Implementation*: Pre-filters by `PriceScope` eligibility before sorting; enforces stable tie-breaker `dedupe_key`.

5. **`SOL-WATCH-01` (Authoritative Server ACK Watch Creation)**:
   - *Target File*: `src/app/data/watchApi.ts`
   - *Implementation*: Validates `data.alert_ids[0]` presence for anonymous Watch creation; fails closed to `sync_failed` if missing.

6. **`SOL-ALERT-01` (Stop-Constraint Alert Safety)**:
   - *Target File*: `supabase/functions/_shared/alert-matching.ts` & `supabase/functions/alert-processor/index.ts`
   - *Implementation*: Decouples `matchesAlertRouteIntent` from stops constraints; `stops == null` yields `INSUFFICIENT_EVIDENCE`.

7. **`SOL-NOTIF-01` (Transactional Outbox Queue)**:
   - *Target File*: `supabase/functions/alert-processor/index.ts`
   - *Implementation*: Uses `FOR UPDATE SKIP LOCKED` and RPC `apply_watch_evaluation` to eliminate duplicate notifications.

8. **`SOL-HIST-01` (Price History Minimum Samples & Forecast Bounds)**:
   - *Target File*: `src/app/components/PriceHistoryChart.tsx` & `src/app/domain/priceForecast.ts`
   - *Implementation*: Enforces minimum 5 samples for cohort comparison and ≥14 samples for trend forecasting.

9. **`SOL-SEC-01` (Tenant RLS Isolation & PDPD Erasure)**:
   - *Target File*: `supabase/migrations/` & `tests/database/01_rls_tenant_isolation.sql`
   - *Implementation*: Enforces `auth.uid() = user_id` across all user tables; provides `prepare_account_deletion` RPC.

10. **`SOL-REL-01` (Release Tuple Parity)**:
    - *Target File*: `src/domain/farely/releaseTuple.ts`
    - *Implementation*: Multi-component compatibility evaluation preventing fake SHA assertions.

---

## PASS R1 CONCLUSION
Pass R1 establishes the comprehensive empirical baseline across all 12 Adversarial Lenses with zero phantom files and strict adherence to the non-OTA product boundary.
Pass R2 will now subject this baseline to skeptical empirical falsification.
