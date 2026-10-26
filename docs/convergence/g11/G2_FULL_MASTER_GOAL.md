# FARELY PROJECT 10X — MASTER GOAL G11 [G2]
# LEVEL: Pass 2: Hostile Before/After AST Diff Blueprint & Code Mutation Contracts
# MANDATE: Subject baseline G1 to adversarial stress testing across all 12 lenses. Establish rigorous code-level AST diff blueprints.
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

## REFUTATION MATRIX & AUDIT OF PASS G1

### Falsification 1: L02 Zero Variance Zero Division Vulnerability
- *Deficit in G1*: Pass G1 specified Bessel-corrected sample variance $(N - 1)$, but overlooked cohorts where all historical prices are identical.
- *Falsification & Falsification Vector*: If 5 historical fares are identical (e.g., promotional fixed fare of 500,000 VND), sample variance $\sum (x_i - \mu)^2$ is 0. Dividing by standard deviation $\sigma = 0$ yields `NaN` or `Infinity`, crashing downstream ranking filters.
- *Correction in G2*: In `src/domain/farely/priceAnomaly.ts`, guard variance calculations: if $\sigma \le 0.05 \mu$ or variance is 0, return `modifiedZScore: 0` with classification `SPARSE_DATA_ABSTENTION`.

### Falsification 2: L03 Metro Airport Change Buffer Asymmetry
- *Deficit in G1*: Pass G1 proposed a 360-minute buffer for inter-airport transfers, but did not define directional transit pairs.
- *Falsification & Falsification Vector*: Transit from Haneda (HND) to Narita (NRT) requires different clearance times than Narita to Haneda due to customs layout and Narita Express rail schedules.
- *Correction in G2*: In `src/domain/farely/multiCityItinerary.ts`, implement bidirectional pair checks: `(from === 'HND' && to === 'NRT') || (from === 'NRT' && to === 'HND')` and `(from === 'DMK' && to === 'BKK') || (from === 'BKK' && to === 'DMK')`.

### Falsification 3: L01 Indicative Link Formatting Under Currency Deserialization
- *Deficit in G1*: Pass G1 mandated outlink sanitization, but failed to specify currency parameter conversions for international carriers.
- *Falsification & Falsification Vector*: Sending raw VND integers (`price=2500000`) to foreign partner endpoints expecting USD or THB results in checkout 400 Bad Request errors.
- *Correction in G2*: In `src/domain/farely/providerRights.ts`, ensure partner links sanitize currency query parameters to the provider's native ISO currency code.

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

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX (G2 AST BLUEPRINTS)

### L01: Product Truth & Founder Scope Integrity
In `src/domain/farely/providerRights.ts`, enforce strict non-OTA scope boundaries without admitting booking execution.

### L02: Price, Historical Baseline & Data Integrity
In `src/domain/farely/priceAnomaly.ts`, ensure `calculateSampleVariance()` divides by $(N - 1)$ for unbiased sample variance estimation.

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
In `src/domain/farely/multiCityItinerary.ts`, verify that `isMetropolitanAirportTransfer()` properly flags transit between different airports in the same metropolitan area.

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
`supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql` guarantees that all watch evaluations enforce `auth.uid() = user_id` row-level tenancy.

### L05: Provider Drift, Circuit Breakers & Kill Switches
`src/domain/farely/providerCapabilities.ts` registers fallback rate-limiting windows and default quotas to safeguard downstream services against runaway concurrency.

### L06: Freshness, Stale Degradation & UX Honesty
`src/domain/farely/pwaOfflineFreshness.ts` enforces `evictExpiredOfflineDeals` with explicit temporal filtering and Vietnamese warning banners on `src/app/pages/DealsPage.tsx`.

### L07: Observability, Secret Scrubbing & Error Boundaries
`src/app/lib/analytics.ts` uses recursive depth traversal with object identity tracking to sanitize diagnostic reports without circular crash vectors.

### L08: Database Architecture, Schema Drift & Migration Provenance
`scripts/verify-certification-integrity.node-test.mjs` asserts migration immutability across 47 schema revisions.

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
`src/domain/farely/productionSmokeTruth.ts` documents that local verification represents C1 code proof, leaving production deployment verification to live C3 smoke jobs.

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
`scripts/acceptance-anti-shrinkage.node-test.mjs` tests all 267 gates against regression.

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
`scripts/convergence/transactional-task-manager.mjs` encapsulates state transitions within explicit transactional rollback frames.

### L12: Zero-Trust Release & Remote Git Synchronization
`scripts/convergence/watchdog-convergence.mjs` verifies that every committed artifact matches upstream git tracking branches.

---

## AST MUTATION SPECIFICATIONS FOR CYCLE G73

### WP01: AST BLUEPRINT FOR `src/domain/farely/priceAnomaly.ts`
```typescript
// AST Addition: Bessel-corrected sample standard deviation
export function calculateSampleStandardDeviation(prices: number[]): {
  mean: number;
  sampleVariance: number;
  sampleStdDev: number;
} {
  const n = prices.length;
  if (n < 2) return { mean: prices[0] ?? 0, sampleVariance: 0, sampleStdDev: 0 };
  const mean = prices.reduce((a, b) => a + b, 0) / n;
  const sumSquaredDiffs = prices.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0);
  const sampleVariance = sumSquaredDiffs / (n - 1); // Bessel's correction
  return {
    mean,
    sampleVariance,
    sampleStdDev: Math.sqrt(sampleVariance),
  };
}
```

### WP02: AST BLUEPRINT FOR `src/domain/farely/multiCityItinerary.ts`
```typescript
// AST Addition: Metropolitan split-airport transfer risk detection
export const METROPOLITAN_AIRPORT_PAIRS = new Set([
  'HND-NRT', 'NRT-HND', // Tokyo
  'DMK-BKK', 'BKK-DMK', // Bangkok
  'GMP-ICN', 'ICN-GMP', // Seoul
  'LHR-LGW', 'LGW-LHR', // London
  'JFK-EWR', 'EWR-JFK', // New York
]);

export function isMetropolitanAirportChange(fromAirport: string, toAirport: string): boolean {
  return METROPOLITAN_AIRPORT_PAIRS.has(`${fromAirport}-${toAirport}`);
}
```

### WP03: AST BLUEPRINT FOR `src/domain/farely/tripBudgetEstimator.ts`
```typescript
// AST Addition: Round-trip baggage calculation helper
export function estimateRoundTripBaggageCost(airlineCode: string, checkedBags: number = 1): number {
  const normalized = airlineCode.toUpperCase();
  const surcharges = DOMESTIC_ANCILLARY_SURCHARGES[normalized];
  if (!surcharges) return 0;
  return surcharges.baggagePerPieceVND * checkedBags * 2;
}
```
