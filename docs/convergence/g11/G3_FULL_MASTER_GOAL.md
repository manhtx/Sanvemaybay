# FARELY PROJECT 10X — MASTER GOAL G11 [G3]
# LEVEL: Pass 3: Anti-Fake-Done Turnkey Verification Oracles & Defense Matrix
# MANDATE: Subject AST diffs from G2 to automated adversarial verification oracles. Design deterministic negative vector tests.
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

## REFUTATION MATRIX & AUDIT OF PASS G2

### Falsification 1: L02 Single-Observation Standard Deviation Degeneracy
- *Deficit in G2*: Pass G2 introduced `calculateSampleStandardDeviation()`, but did not specify behavior when an array contains exactly 1 element ($N = 1$).
- *Falsification & Falsification Vector*: Under Bessel's formula with denominator $(N - 1)$, for $N = 1$ the denominator is $0$, resulting in division by zero (`0 / 0 = NaN`).
- *Correction in G3*: In `src/domain/farely/priceAnomaly.ts`, explicitly guard $N \le 1$: if $N \le 1$, return `sampleVariance: 0` and `sampleStdDev: 0` with zero division bypass.

### Falsification 2: L03 Case-Sensitivity in Metropolitan Airport Code Matching
- *Deficit in G2*: Pass G2 specified uppercase airport codes in `METROPOLITAN_AIRPORT_PAIRS`, but failed to normalize lowercase or whitespace-padded inputs.
- *Falsification & Falsification Vector*: If a feed parses an airport code as `"hnd"` or `"NRT "`, string lookup in the Set fails, omitting the critical 360-minute layover warning.
- *Correction in G3*: In `src/domain/farely/multiCityItinerary.ts`, normalize all input airport codes with `trim().toUpperCase()` before evaluating set containment.

### Falsification 3: L05 Unhandled Carrier Surcharge Fallback Invariance
- *Deficit in G2*: Pass G2 proposed roundtrip baggage estimation, but returned raw 0 when an unknown carrier code was provided without flagging the unverified state.
- *Falsification & Falsification Vector*: Returning 0 without a caveat leads the user to assume baggage is free, rather than acknowledging that carrier fees are unverified.
- *Correction in G3*: In `src/domain/farely/tripBudgetEstimator.ts`, return `{ estimatedCost: number; isKnownCarrier: boolean }` so caller components can render an unverified fee disclosure when carrier baggage policies are unlisted.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS (CYCLE G73)

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

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX (G3 ORACLES)

### L01: Product Truth & Founder Scope Integrity
Oracle validates that `src/domain/farely/providerRights.ts` never marks unverified indicative sources as certified live bookable feeds.

### L02: Price, Historical Baseline & Data Integrity
Oracle in `src/domain/farely/priceAnomaly.ts` asserts that Bessel-corrected standard deviation matches exact mathematical calculations across test cohorts.

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
Oracle in `src/domain/farely/multiCityItinerary.ts` verifies that itineraries with inter-airport transfers trigger `METRO_AIRPORT_CHANGE_HIGH_RISK` and 25-point score penalty.

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
Oracle in `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql` verifies that multi-tenant watch alert queues cannot leak cross-account recipient emails.

### L05: Provider Drift, Circuit Breakers & Kill Switches
Oracle in `src/domain/farely/providerCapabilities.ts` asserts that rate limit tripwires transition to backoff status upon receiving consecutive 429 or 503 response codes.

### L06: Freshness, Stale Degradation & UX Honesty
Oracle in `src/domain/farely/pwaOfflineFreshness.ts` verifies that expired records older than 14 days are completely omitted from the UI model on `src/app/pages/DealsPage.tsx`.

### L07: Observability, Secret Scrubbing & Error Boundaries
Oracle in `src/app/lib/analytics.ts` runs deeply nested and circular error objects through serialization, verifying zero memory leaks or unhandled exceptions.

### L08: Database Architecture, Schema Drift & Migration Provenance
Oracle in `scripts/verify-certification-integrity.node-test.mjs` verifies that every migration checksum matches git provenance history.

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
Oracle in `src/domain/farely/productionSmokeTruth.ts` programmatically blocks marking any capability `TARGET_PROVEN` solely from C1 unit test runs.

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
Oracle in `scripts/acceptance-anti-shrinkage.node-test.mjs` enforces invariant check across all 267 acceptance gates.

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
Oracle in `scripts/convergence/transactional-task-manager.mjs` verifies snapshot restoration parity upon synthetic task failure injection.

### L12: Zero-Trust Release & Remote Git Synchronization
Oracle in `scripts/convergence/watchdog-convergence.mjs` continuously asserts fast-forward parity against remote branch.

---

## TURNKEY VERIFICATION TEST SUITE SPECIFICATION

### ORACLE-01: Bessel-Corrected Sample Standard Deviation (`src/domain/farely/priceAnomaly.test.ts`)
```typescript
it('calculates unbiased Bessel-corrected sample standard deviation for N >= 2', () => {
  const prices = [1000000, 1200000, 1100000, 1300000, 1400000];
  const { mean, sampleVariance, sampleStdDev } = calculateSampleStandardDeviation(prices);
  expect(mean).toBe(1200000);
  expect(sampleVariance).toBe(25000000000); // sum diffs sq / 4 = 100e9 / 4
  expect(sampleStdDev).toBeCloseTo(158113.88, 1);
});
```

### ORACLE-02: Metropolitan Split-Airport Detection (`src/domain/farely/multiCityItinerary.test.ts`)
```typescript
it('identifies inter-airport transfers across metropolitan airport pairs', () => {
  expect(isMetropolitanAirportChange('HND', 'NRT')).toBe(true);
  expect(isMetropolitanAirportChange('DMK', 'BKK')).toBe(true);
  expect(isMetropolitanAirportChange('HAN', 'SGN')).toBe(false);
});
```

### ORACLE-03: Round-Trip Baggage Calculation (`src/domain/farely/tripBudgetEstimator.test.ts`)
```typescript
it('calculates round-trip baggage estimates for domestic carriers', () => {
  expect(estimateRoundTripBaggageCost('VJ', 1)).toBe(700000);
  expect(estimateRoundTripBaggageCost('VN', 1)).toBe(0);
});
```
