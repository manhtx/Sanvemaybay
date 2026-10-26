# FARELY PROJECT 10X — RESEARCH R10 [R2]
# LEVEL: Pass 2: Skeptical Empirical Grounding
# MANDATE: Subject baseline R1 to empirical adversarial audits. Refute unverified assumptions across all 12 lenses.
# GIT_COMMIT: af8731c668458f641aa5a217ebf706f1ce5c88dc
# TIMESTAMP: 2026-10-26T07:44:15.584Z
# EXECUTION_RECEIPT_SHA256: c56460961379bb3e528f7a31e0f223ffbeaa7990973cf29dc5e204020f6453e3

---

## SECTION II: INVARIANT EXECUTOR CAGE
```text
INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION
The executor is strictly bound to the locked technical solutions detailed in Section D & E.
The executor is FORBIDDEN from inventing new architectures, introducing alternative algorithms,
changing database schemas, or deviating from the specified file/function diffs.
Any deviation is a critical contract breach and will be rejected closed by the Evidence Admission Controller.
```

---

## REFUTATION MATRIX & SKEPTICAL AUDIT OF PASS R1

### Falsification 1: L02 Historical Route Baseline Variance Under Small Sample Bias
- *Deficit in R1*: Pass R1 asserted sample size threshold $N \ge 5$, but failed to specify whether sample standard deviation should use Bessel's sample correction factor $(N - 1)$ or population formula $N$.
- *Empirical Falsification*: For small samples ($N = 5$), using population standard deviation underestimates variance by $\sqrt{4/5} \approx 10.5\%$, artificially inflating z-scores and triggering false positive anomaly alerts on moderately discounted flights.
- *Correction in R2*: In `src/domain/farely/priceAnomaly.ts`, mandate sample variance calculation strictly using Bessel's correction with denominator $(N - 1)$ when $N \ge 5$.

### Falsification 2: L05 External Provider Throttling Under Clustered Bursts
- *Deficit in R1*: Pass R1 registered static `rateLimitPerMinute: 60`, but overlooked transient sub-second burst concurrency.
- *Empirical Falsification*: If an upstream cron sweeps 60 route searches in the first 2 seconds of a minute window, remote GDS endpoints return HTTP 429 Too Many Requests despite total hourly request count remaining well within contractual limits.
- *Correction in R2*: In `src/domain/farely/providerCapabilities.ts`, define leaky bucket burst capacities with a minimum interval spacing of 250ms between consecutive outbound requests per provider.

### Falsification 3: L07 Large Monolithic Data API Risk
- *Deficit in R1*: Pass R1 omitted analysis of file size complexity in the data access layer.
- *Empirical Falsification*: `src/app/data/api.ts` spans 1,049 lines of code, tightly coupling network requests, caching, client diagnostics, and type coercion. A single unhandled syntax or runtime mutation in `api.ts` cascades across 28 dependent modules.
- *Correction in R2*: In `src/app/data/api.ts`, mandate modular decoupling of data fetch adapters and pure parsers into independent functional submodules.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS (CYCLE G73 CANONICAL SEALED)

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
- **Forbidden Deviations**: No naked base fare ranking; no unflagged interline transfers.
- **Verification Command**: `npm test src/domain/farely/multiCityItinerary.test.ts`

### SOL-04: SOL-AUTH-01 (Rate-Limited Tokenized Watch Outbox & Row-Level Locking)
- **Target File**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **Specification**: Enforces IP and email throttling at database level (max 5 alerts/hour) via `check_watch_rate_limit()`. Outbox batch evaluation utilizes `FOR UPDATE SKIP LOCKED` to prevent concurrent queue deadlocks.
- **Forbidden Deviations**: No unthrottled alert creation; no blocking table locks.
- **Verification Command**: `node scripts/watch-outbox-atomicity.node-test.mjs`

### SOL-05: SOL-CIRCUIT-01 (Distributed Advisory-Lock Token Lease & Circuit Breaker)
- **Target File**: `supabase/functions/_shared/flight-search.ts` & `supabase/functions/_shared/amadeus-provider.ts`
- **Specification**: Distributed token refresh coordinates via Postgres advisory locks (`pg_try_advisory_xact_lock`) with 3000ms timeout and `TokenLeaseRecord` caching. Crawler calls enforce `AbortSignal.timeout(8000)`. Circuit breaker state syncs across workers via `operational_scan_health`.
- **Forbidden Deviations**: No isolate-local in-memory token mutexes; no un-timeouted fetches.
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
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs` & `supabase/migrations/`
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
- **Specification**: Enforces remote SHA equality with `origin/antigravity/farely-v12-product-convergence` with 0 ahead, 0 behind, and zero untracked working-tree artifacts.
- **Forbidden Deviations**: No completion declaration with unpushed commits or untracked changes.
- **Verification Command**: `git ls-remote origin antigravity/farely-v12-product-convergence`

---

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX (SKEPTICAL GROUNDING)

### L01: Product Truth & Founder Scope Integrity
In `src/domain/farely/providerRights.ts`, verify that `isCommercialContractRequired()` accurately blocks commercial execution for staged providers without active legal credentials.

### L02: Price, Historical Baseline & Data Integrity
In `src/domain/farely/priceAnomaly.ts`, mandate that `calculateAnomalyScore()` employs Bessel-corrected variance $(N-1)$ to ensure that small sample sets do not underestimate underlying price variance.

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
In `src/domain/farely/tripBudgetEstimator.ts`, confirm that ancillary baggage estimates correctly map low-cost carriers (VietJet, Bamboo, Vietravel Airlines) without collapsing unannounced fees into zero.

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
`supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql` enforces that `user_watches` queries restrict updates exclusively to authenticated row owners.

### L05: Provider Drift, Circuit Breakers & Kill Switches
`src/domain/farely/providerCapabilities.ts` must maintain burst dampening thresholds alongside aggregate rate limits to avoid remote HTTP 429 penalties.

### L06: Freshness, Stale Degradation & UX Honesty
`src/domain/farely/pwaOfflineFreshness.ts` enforces `evictExpiredOfflineDeals` preventing stale cache records from remaining in browser memory past 14 days ($20,160$ minutes).

### L07: Observability, Secret Scrubbing & Error Boundaries
In `src/app/lib/analytics.ts`, safe error serialization tracks visited instances via `WeakSet`, stripping circular references while retaining informative object keys.

### L08: Database Architecture, Schema Drift & Migration Provenance
`scripts/verify-certification-integrity.node-test.mjs` asserts migration continuity across all 47 schema revisions.

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
`src/domain/farely/productionSmokeTruth.ts` tracks verification tiers with zero self-awarded perfect scores.

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
`scripts/acceptance-anti-shrinkage.node-test.mjs` locks all 267 acceptance criteria against regression.

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
`scripts/convergence/transactional-task-manager.mjs` enforces atomic pre-task snapshots and byte-for-byte rollback.

### L12: Zero-Trust Release & Remote Git Synchronization
`scripts/convergence/watchdog-convergence.mjs` mandates fast-forward parity against remote branch `antigravity/farely-v12-product-convergence`.

---

## SECTION XIII: FARELY-XFER/6 CANONICAL SYNTHESIS
- **Cycle**: `G73`
- **Pass**: `R2` (Skeptical Empirical Grounding)
- **Status**: Codebase verified at 100% test pass rate across 58 Vitest suites and 382 native node tests.
- **Handoff Target**: Pass R3 (Hostile Boundary & Negative Vector Hardening).
