# FARELY PROJECT 10X — MASTER GOAL G11 [G5]
# LEVEL: Pass 5: Locked Sovereign Master Goal Prompt
# MANDATE: Final unassailable synthesis across all 12 lenses. 100% self-contained, turnkey Master Goal Prompt with invariant executor lock.
# GIT_COMMIT: af8731c668458f641aa5a217ebf706f1ce5c88dc
# TIMESTAMP: 2026-10-26T07:50:00.000Z
# EXECUTION_RECEIPT_SHA256: c56460961379bb3e528f7a31e0f223ffbeaa7990973cf29dc5e204020f6453e3

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

## REFUTATION MATRIX & AUDIT OF PASS G4

### Falsification 1: L01 Sovereign Contract Enforcement & OTA Boundary Exclusion
- *Deficit in G4*: Pass G4 reiterated domain rights rules, but omitted explicit structural validation verifying that outbound redirect links cannot inject hidden transaction fees.
- *Falsification & Falsification Vector*: Without URL query sanitization, malicious or corrupted partner URLs could append query flags simulating affiliate checkout, confusing end users.
- *Correction in G5*: In `src/domain/farely/providerRights.ts`, enforce strict whitelist URL query generation: outbound deep-links strictly pass origin, destination, departDate, and adult passengers, stripping all experimental or transaction-related query parameters.

### Falsification 2: L09 Strict Anti-Self-Certification Proof Level Distinction
- *Deficit in G4*: Pass G4 mandated C1 test verification, but left open the potential for an executor to conflate unit test success with deployed production outcome proof.
- *Falsification & Falsification Vector*: A passing vitest suite does not prove live carrier API uptime or real-world network resilience.
- *Correction in G5*: In `src/domain/farely/productionSmokeTruth.ts`, lock the proof hierarchy: C0 (Contract) -> C1 (Code) -> C2 (Integration) -> C3 (Runtime Smoke) -> C4 (Longitudinal Soak). Executors are programmatically barred from marking C3/C4 proven solely on local C1/C2 passes.

### Falsification 3: L11 Cryptographic Digest Checksum Verification on Recovery
- *Deficit in G4*: Pass G4 addressed file permission restoration, but omitted pre-rollback byte comparison to detect manual file edits during active transactions.
- *Falsification & Falsification Vector*: If an external editor modifies a file while a transaction is running, an unverified rollback silently overwrites external modifications without warning.
- *Correction in G5*: In `scripts/convergence/transactional-task-manager.mjs`, calculate SHA-256 digests before restoring files, recording exact before-and-after hashes in `transaction_journal.json`.

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

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX (G5 CANONICAL)

### L01: Product Truth & Founder Scope Integrity
Strict non-OTA intelligence platform. Merchant flight booking execution is prohibited. All provider source declarations clearly differentiate indicative consumer discovery from syndicated feeds in `src/domain/farely/providerRights.ts`.

### L02: Price, Historical Baseline & Data Integrity
Enforces zero tolerance for negative prices or NaN. Seasonal Tết epochs prevent false discount alerts in `src/domain/farely/priceAnomaly.ts`.

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
Landed cost includes domestic carrier ancillary surcharges. Self-transfer penalties ensure that multi-carrier connections under 180 minutes are penalized by 25 points in `src/domain/farely/tripBudgetEstimator.ts`.

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
`supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql` enforces strict tenant isolation and non-blocking outbox processing via `FOR UPDATE SKIP LOCKED`.

### L05: Provider Drift, Circuit Breakers & Kill Switches
`src/domain/farely/providerCapabilities.ts` defines explicit rate limits and circuit breaker trip thresholds for all integrated providers.

### L06: Freshness, Stale Degradation & UX Honesty
`src/domain/farely/pwaOfflineFreshness.ts` implements 14-day cache eviction and Vietnamese degradation banners on `src/app/pages/DealsPage.tsx`.

### L07: Observability, Secret Scrubbing & Error Boundaries
`src/app/lib/analytics.ts` uses circular-tolerant traversal to serialize diagnostic telemetry safely.

### L08: Database Architecture, Schema Drift & Migration Provenance
47 canonical migrations verified in `scripts/verify-certification-integrity.node-test.mjs`.

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
`src/domain/farely/productionSmokeTruth.ts` tracks verification tiers with zero self-awarded perfect scores.

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
`scripts/acceptance-anti-shrinkage.node-test.mjs` locks all 267 acceptance criteria against regression.

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
`scripts/convergence/transactional-task-manager.mjs` enforces atomic pre-task snapshots and byte-for-byte rollback.

### L12: Zero-Trust Release & Remote Git Synchronization
`scripts/convergence/watchdog-convergence.mjs` mandates fast-forward parity against remote branch `antigravity/farely-v12-product-convergence`.

---

## SECTION E: TURNKEY EXECUTION TASKS FOR CYCLE G73

### TASK 1: WP01-BESSEL-VARIANCE-ANOMALY
- **Target**: `src/domain/farely/priceAnomaly.ts` & `src/domain/farely/priceAnomaly.test.ts`
- **Actions**:
  1. Add `calculateSampleStandardDeviation()` with Bessel's correction $(N - 1)$ for $N \ge 2$, with zero variance guard when $N \le 1$.
  2. Export function and integrate into variance tests.
  3. Add unit test asserting correct variance on 5-element cohort.
- **Verification**: `npx vitest run src/domain/farely/priceAnomaly.test.ts`

### TASK 2: WP02-METRO-TRANSFER-RISK
- **Target**: `src/domain/farely/multiCityItinerary.ts` & `src/domain/farely/multiCityItinerary.test.ts`
- **Actions**:
  1. Define `METROPOLITAN_AIRPORT_PAIRS` set containing Tokyo (HND-NRT), Bangkok (DMK-BKK), Seoul (GMP-ICN), London (LHR-LGW), New York (JFK-EWR).
  2. Implement `isMetropolitanAirportChange(fromAirport, toAirport)` with uppercase normalization.
  3. Add unit test asserting accurate identification of metropolitan transfer pairs.
- **Verification**: `npx vitest run src/domain/farely/multiCityItinerary.test.ts`

### TASK 3: WP03-ANCILLARY-SURCHARGE-EXPANSION
- **Target**: `src/domain/farely/tripBudgetEstimator.ts` & `src/domain/farely/tripBudgetEstimator.test.ts`
- **Actions**:
  1. Implement `estimateRoundTripBaggageCost(airlineCode, checkedBags)` returning total baggage fee for round-trip travel.
  2. Export function and add unit tests.
- **Verification**: `npx vitest run src/domain/farely/tripBudgetEstimator.test.ts`
