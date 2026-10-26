# FARELY PROJECT 10X — MASTER GOAL G11 [G3]
# LEVEL: Pass 3: Anti-Fake-Done Turnkey Verification Oracles
# MANDATE: Subject AST transformations to turnkey verification oracles, empirical assertions, and strict exit code validations.
# GIT_COMMIT: 8ada9173783ba6466c2aa867a31fb44319cd6a41
# TIMESTAMP: 2026-10-26T09:56:56.280Z
# EXECUTION_RECEIPT_SHA256: ec82db03479cd6d2743d1704f65b8f8781d060851a461aaaa79a6c727abd8014

---

## SECTION B: INVARIANT EXECUTOR CAGE
```text
INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION
The executor is strictly bound to the locked technical solutions detailed in Section D & E.
The executor is FORBIDDEN from inventing new architectures, introducing alternative algorithms,
changing database schemas, or deviating from the specified file/function diffs.
Any deviation is a critical contract breach and will be rejected closed by the Evidence Admission Controller.
```

---

## REFUTATION MATRIX & FALSIFICATION OF PASS G2

### Falsification 1: L02 Mocked Sample Variance in Test Oracles
- *Deficits Identified in G2*: Pass G2 specified AST transformations for zero-variance anomaly detection, but the proposed verification oracle relied on static mock arrays rather than metamorphic perturbations.
- *Adversarial Verification Falsification*: In `src/domain/farely/priceAnomaly.ts`, if tests only verify a constant 5-element array `[100, 100, 100, 100, 100]`, they fail to catch cases where an array contains 100 identical prices alongside `NaN` or non-numeric types injected by dirty scraper feeds.
- *Correction in G3*: In `src/domain/farely/priceAnomaly.test.ts`, mandate metamorphic property tests that inject `null`, `undefined`, and large homogeneous cohorts verifying that `classification === "INSUFFICIENT_DISPERSION_ABSTENTION"` holds deterministically.

### Falsification 2: L06 Client Eviction Timing Drifts Across Timezones
- *Deficits Identified in G2*: Pass G2 verified offline deal cache purging at 14 days ($20,160$ minutes), but omitted validating client-side system clock skew and local timezone shifts.
- *Adversarial Verification Falsification*: If a user travels across timezones (e.g. UTC+7 to UTC-5) or adjusts their device clock, simple timestamp subtraction `Date.now() - cachedAt` can yield negative age or premature purge.
- *Correction in G3*: In `src/domain/farely/pwaOfflineFreshness.ts`, enforce monotonic clamp `Math.max(0, now - cachedAt)` and verify that negative age is gracefully normalized to zero age (`FRESH`) rather than throwing an eviction exception.

### Falsification 3: L09 Conflation of Unit Assertion Exit Codes with Operational Readiness
- *Deficits Identified in G2*: Pass G2 treated test suite completion (`npm test` exit code 0) as sufficient proof of system convergence.
- *Adversarial Verification Falsification*: In `scripts/verify-certification-integrity.node-test.mjs`, unit tests can pass 100% while production smoke verification remains unexecuted. A green test runner is strictly Proof Level C1 (Code), never C3 (Runtime) or C4 (Outcome).
- *Correction in G3*: In `src/domain/farely/productionSmokeTruth.ts` and `scripts/verify-certification-integrity.node-test.mjs`, explicitly assert that C1 passes do not increment C3/C4 certification gates.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS (CYCLE G74)

### SOL-01: SOL-DATA-01 (Null Preservation & Sample Size Threshold $N \ge 5$)
- **Target File**: `src/app/data/api.ts` & `src/domain/farely/priceAnomaly.ts`
- **Specification**: Helper `parseNullableNumber(val)` preserves `null` and `undefined` without coercion to 0. In `src/domain/farely/priceAnomaly.ts`, require both sample variance $\sigma > 0.05 \mu$ AND sample size $N \ge 5$ using Bessel's correction $(N - 1)$ before calculating z-scores. Routes with $N < 5$ yield `confidence: INSUFFICIENT_HISTORY` and return neutral anomaly rating (0).
- **Forbidden Deviations**: No anomaly extrapolation on micro-samples ($N < 5$); no float math for currency.
- **Verification Command**: `npm test src/app/domain/differentialAndMetamorphic.test.ts`

### SOL-02: SOL-PRICE-01 (Deterministic Tet Window Lookup & Seasonal Multiplier)
- **Target File**: `src/domain/farely/priceAnomaly.ts`
- **Specification**: In `src/domain/farely/priceAnomaly.ts`, define static Tet travel epochs (2025: Jan 15 - Feb 15; 2026: Feb 03 - Mar 05; 2027: Jan 24 - Feb 24). Flight departures falling within these ranges apply a deterministic $2.8\times$ baseline multiplier to prevent false anomaly triggers.
- **Forbidden Deviations**: No dynamic unsealed third-party lunar dependencies; no static unseasoned baselines.
- **Verification Command**: `npm test src/domain/farely/priceAnomaly.test.ts`

### SOL-03: SOL-COST-01 (Carrier Landed Surcharges & Self-Transfer Penalty)
- **Target File**: `src/domain/farely/tripBudgetEstimator.ts` & `src/domain/farely/multiCityItinerary.ts`
- **Specification**: Domestic surcharge dictionary: VJ (350k VND bag, 55k fee), QH (320k VND bag, 45k fee), VU (300k VND bag, 50k fee), VN (included bag, 0k fee). Multi-carrier self-transfers require 150m (domestic) or 240m (international). If below, deduct 25 points from deal score with flag `SELF_TRANSFER_HIGH_RISK`.
- **Forbidden Deviations**: No naked base fare ranking; no unflagged interline transfers; passenger checkout is strictly `boundary_excluded`.
- **Verification Command**: `npm test src/domain/farely/multiCityItinerary.test.ts`

### SOL-04: SOL-AUTH-01 (Rate-Limited Tokenized Watch Outbox & Row-Level Locking)
- **Target File**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **Specification**: Enforces IP and email throttling at database level (max 5 alerts/hour) via `check_watch_rate_limit()`. Outbox batch evaluation utilizes `FOR UPDATE SKIP LOCKED` to prevent concurrent queue deadlocks.
- **Forbidden Deviations**: No unthrottled alert creation; no blocking table locks.
- **Verification Command**: `node scripts/watch-outbox-atomicity.node-test.mjs`

### SOL-05: SOL-CIRCUIT-01 (Distributed Advisory-Lock Token Lease & Circuit Breaker)
- **Target File**: `supabase/functions/_shared/flight-search.ts` & `supabase/functions/_shared/amadeus-provider.ts`
- **Specification**: Distributed token refresh coordinates via Postgres advisory locks (`pg_try_advisory_xact_lock`) with 3000ms timeout and `TokenLeaseRecord` caching. Crawler calls enforce `AbortSignal.timeout(8000)`. Circuit breaker state syncs across workers via `operational_scan_health`.
- **Forbidden Deviations**: No isolate-local in-memory token mutexes; no un-timeouted fetches. Ticketing fulfillment is strictly `boundary_excluded`.
- **Verification Command**: `node scripts/provider-drift-and-killswitch.node-test.mjs`

### SOL-06: SOL-STALE-01 (Storage Exception Shield & 14-Day Eviction)
- **Target File**: `src/app/pages/DealsPage.tsx` & `src/domain/farely/pwaOfflineFreshness.ts`
- **Specification**: Sealed `createSafeStorageAdapter()` wraps IndexedDB access for private browsing safety, setting `isEphemeralStorage: true` on failure. Renders `FRESH` (<120m), `WARM` (120m–360m), and `STALE` (>360m) badges. Purges records older than 14 days ($20,160$ minutes).
- **Forbidden Deviations**: No unhandled `SecurityError` crashes on storage calls.
- **Verification Command**: `npm test src/domain/farely/pwaOfflineFreshness.test.ts`

### SOL-07: SOL-TELEMETRY-01 (Vite Code Splitting & Circular-Safe Telemetry)
- **Target File**: `src/app/lib/analytics.ts` & `src/app/data/api.ts`
- **Specification**: Safe error serializer traverses nested objects up to depth 3 with circular detection and 1,000-character string truncation. Enforces mobile bundle budget under 250KB gzipped by decoupling large type definitions from rendering components and lazy-loading heavy routes.
- **Forbidden Deviations**: No unhandled `JSON.stringify` exceptions; no bundle inflation >250KB.
- **Verification Command**: `node scripts/client-error-boundary.node-test.mjs`

### SOL-08: SOL-MIGRATION-01 (ForeignKey Index Parity & 47-Migration Parity)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs` & `scripts/migration-parity.node-test.mjs`
- **Specification**: Exactly 47 canonical migrations verified. Ensures all foreign key constraints are indexed (`idx_watch_notifications_watch_id`, `idx_user_watches_user_id`) to prevent table-level share locks during cascade deletions.
- **Forbidden Deviations**: No sequential full-table scans on search queries; no unindexed foreign keys.
- **Verification Command**: `node scripts/migration-parity.node-test.mjs`

### SOL-09: SOL-PROOF-01 (C0..C4 Proof Hierarchy & Anti-Self-Certification)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs` & `src/domain/farely/productionSmokeTruth.ts`
- **Specification**: Explicitly enforces `TARGET_PROVEN: FALSE`, `PRODUCT_ACCEPTANCE: NOT_ESTABLISHED`. Unit and integration test proofs strictly tagged as C1/C2, never elevated to C3/C4 without soak verification.
- **Forbidden Deviations**: Never emit self-awarded 10/10 scores; never treat C1 tests as C3 runtime proof.
- **Verification Command**: `node scripts/v17-adversarial-challenges.node-test.mjs`

### SOL-10: SOL-SHRINK-01 (267 Historical Gates & 32 P2 Semantic Preservation)
- **Target File**: `scripts/acceptance-anti-shrinkage.node-test.mjs` & `scripts/convergence/anti-evasion-linter.mjs`
- **Specification**: Asserts 192 P0, 74 P1, and 1 P2 gates with authentic test assertions across all historical manifests.
- **Forbidden Deviations**: No gate deletion, no priority demotion, no gate renaming.
- **Verification Command**: `node scripts/acceptance-anti-shrinkage.node-test.mjs`

### SOL-11: SOL-TURNKEY-01 (Transactional Execution & State Rollback Journal)
- **Target File**: `scripts/convergence/transactional-task-manager.mjs`
- **Specification**: Pre-task SHA-256 file hashing guarantees byte-for-byte rollback integrity. Rollback deletes newly created orphan files and releases PID write lock.
- **Forbidden Deviations**: No untracked file residue after task rollback.
- **Verification Command**: `node scripts/convergence/transactional-task-manager.mjs status`

### SOL-12: SOL-RELEASE-01 (Git Remote Fast-Forward & SHA Parity)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs` & `package.json`
- **Specification**: Enforces remote SHA equality with `origin/antigravity/farely-v12-product-convergence` with 0 ahead, 0 behind, and zero untracked working-tree artifacts. Payment gateway integration is strictly `boundary_excluded`.
- **Forbidden Deviations**: No completion declaration with unpushed commits or untracked changes.
- **Verification Command**: `git ls-remote origin antigravity/farely-v12-product-convergence`

---

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX (G3 ORACLE AUDIT)

### L01: Product Truth & Founder Scope Integrity
Non-OTA verified flight opportunity intelligence. Excludes all transactional booking engines. Handled via `src/domain/farely/providerRights.ts`.

### L02: Price, Historical Baseline & Data Integrity
In `src/domain/farely/priceAnomaly.ts`, Bayesian outlier estimation requires sample sizes $N \ge 5$ with Bessel's correction $(N-1)$ and seasonal Tết holiday priors.

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
In `src/domain/farely/multiCityItinerary.ts` and `src/domain/farely/tripBudgetEstimator.ts`, domestic surcharge dictionaries ensure landed price integrity.

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
`supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql` enforces atomic row-level security on watch queues.

### L05: Provider Drift, Circuit Breakers & Kill Switches
`supabase/functions/_shared/flight-search.ts` maintains rate limit tripwires and backoff parameters.

### L06: Freshness, Stale Degradation & UX Honesty
`src/domain/farely/pwaOfflineFreshness.ts` purges cached records older than 14 days ($20,160$ minutes) on `src/app/pages/DealsPage.tsx`.

### L07: Observability, Secret Scrubbing & Error Boundaries
`src/app/lib/analytics.ts` prevents recursive telemetry crashes through WeakSet traversal tracking.

### L08: Database Architecture, Schema Drift & Migration Provenance
47 migration scripts form a verified schema history in `scripts/verify-certification-integrity.node-test.mjs`.

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
`src/domain/farely/productionSmokeTruth.ts` blocks synthetic 10/10 self-awarded certifications.

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
`scripts/acceptance-anti-shrinkage.node-test.mjs` tracks all 267 acceptance criteria against regression.

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
`scripts/convergence/transactional-task-manager.mjs` guarantees atomic pre-task snapshots and byte-for-byte rollback.

### L12: Zero-Trust Release & Remote Git Synchronization
`scripts/convergence/watchdog-convergence.mjs` mandates branch parity with remote GitHub origin.

---

## TURNKEY VERIFICATION ORACLES (CYCLE G74)

### Oracle 1: Safe Error Serialization Depth Capping
```bash
npm test src/app/lib/analytics.test.ts
```
Expected output: All test cases pass, verifying:
1. `maxDepth = 3` replaces deeply nested subtrees with `"[MaxDepthExceeded]"`.
2. Circular object cycles are safely replaced with `"[Circular]"`.
3. Long strings over 1000 chars are truncated with `"...[TRUNCATED]"`.

### Oracle 2: Metropolitan Minimum Ground Transit Buffer
```bash
npm test src/domain/farely/multiCityItinerary.test.ts
```
Expected output: All test cases pass, verifying:
1. `getMetropolitanMinimumTransitMinutes` returns 210 for `HND-NRT`, `DMK-BKK`, `GMP-ICN`, `LHR-LGW`, `JFK-EWR`.
2. Surface connections under 210 minutes receive high connection risk.

### Oracle 3: Zero-Dispersion Abstention Defense
```bash
npm test src/domain/farely/priceAnomaly.test.ts
```
Expected output: All test cases pass, verifying:
1. Cohorts of identical prices trigger `INSUFFICIENT_DISPERSION_ABSTENTION`.
2. No division by zero or NaN propagation.
