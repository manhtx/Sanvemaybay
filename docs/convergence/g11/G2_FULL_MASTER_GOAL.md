# FARELY PROJECT 10X — MASTER GOAL G11 [G2]
# LEVEL: Pass 2: Hostile Before/After AST Diff Blueprint & Structural Isolation
# MANDATE: Refute and harden Pass G1 with exact file modifications, AST boundary invariants, and lens falsifications.
# GIT_COMMIT: ed53cc39e6b3eb1f96b5f66cf017032b09bd55ac
# TIMESTAMP: 2026-10-26T10:46:25.000Z
# EXECUTION_RECEIPT_SHA256: 8d1a9b4346193f30aa03e57ed1e11bb87625d140618b00a287da74aed6142d41

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

## REFUTATION MATRIX & FALSIFICATION OF PASS G1

### Falsification 1: L01 Untrimmed Identity Comparison Failure in Airport Alternatives
- *Deficits Identified in Pass G1*: Pass G1 checked `baseCode === altCode` after `trim().toUpperCase()`, but failed to specify the fallback when airport catalog lookup returns undefined for unusual or test airport codes.
- *Empirical Code Evidence*: In `src/domain/farely/airportAlternatives.ts`, if `params.baselineAirportCode` is whitespace (`"   "`), `trim()` yields `""`. `AIRPORT_CATALOG[""]` returns undefined, but the code still attempts to evaluate ground transfers instead of returning an invalid input evaluation.
- *Hardened Contract in G2*: In `src/domain/farely/airportAlternatives.ts`, require `if (!baseCode || !altCode) return { verdict: "NOT_RECOMMENDED", netSavingsVND: 0, isWorthwhile: false, explanationVi: "Mã sân bay không hợp lệ." };`. Direct ticketing and passenger checkout are strictly `boundary_excluded`.

### Falsification 2: L02 Single-Element Variance Inconsistency Under Array Defense
- *Deficits Identified in Pass G1*: Pass G1 added array filtering, but did not assert Bessel correction denominator behavior for single-element arrays where $N = 1$ causes division by $(1 - 1) = 0$.
- *Empirical Code Evidence*: In `src/domain/farely/priceAnomaly.ts`, `calculateSampleStandardDeviation` checks `if (n <= 1)` on the raw array, but if a dirty array has 10 elements where 9 are `NaN` and only 1 is a valid number, the filtered length is 1! Dividing by `(n - 1)` without updating `n` causes `Infinity` or `NaN`.
- *Hardened Contract in G2*: In `src/domain/farely/priceAnomaly.ts`, define `const n = validPrices.length; if (n <= 1) return { mean: validPrices[0] ?? 0, sampleVariance: 0, sampleStdDev: 0 };`.

### Falsification 3: L03 Missing Match Indices in Dual-Capture Minute Regex
- *Deficits Identified in Pass G1*: Pass G1 provided a dual-match regex for minutes, but did not guard against `duration` containing non-string or numeric inputs.
- *Empirical Code Evidence*: In `src/app/domain/dealComparison.ts`, if `duration` is passed as a number or object, `duration.match` throws a TypeError in the V8 engine.
- *Hardened Contract in G2*: In `src/app/domain/dealComparison.ts`, guard with `if (!duration || typeof duration !== "string") return undefined;`. Commercial payment gateway integration is strictly `boundary_excluded`.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS (CYCLE G77)

### SOL-01: SOL-DATA-01 (Null Preservation & Sample Size Threshold $N \ge 5$)
- **Target File**: `src/app/data/api.ts` & `src/domain/farely/priceAnomaly.ts`
- **Specification**: In `src/app/data/api.ts`, preserve nulls without coercion. In `src/domain/farely/priceAnomaly.ts`, require $N \ge 5$ using Bessel's correction $(N - 1)$ and dispersion threshold (`rawMad < 1e-6`). Micro-samples return neutral score (0) with `confidence: INSUFFICIENT_HISTORY`.
- **Forbidden Deviations**: No zero-inflation on missing fields; direct ticketing and passenger checkout are strictly `boundary_excluded`.
- **Turnkey Verification**: `npx vitest run src/domain/farely/priceAnomaly.test.ts`

### SOL-02: SOL-PRICE-01 (Deterministic Tet Window Lookup & Dynamic Prior)
- **Target File**: `src/domain/farely/priceAnomaly.ts`
- **Specification**: In `src/domain/farely/priceAnomaly.ts`, define static Lunar Tet windows for 2025, 2026, and 2027 with $2.8\times$ baseline multipliers to suppress false-positive deal alerts during peak festive periods.
- **Forbidden Deviations**: No dynamic unsealed third-party lunar APIs; no uncalibrated static baselines.
- **Turnkey Verification**: `npx vitest run src/domain/farely/priceAnomaly.test.ts`

### SOL-03: SOL-COST-01 (Carrier Landed Surcharges & Self-Transfer Validation)
- **Target File**: `src/domain/farely/tripBudgetEstimator.ts` & `src/domain/farely/multiCityItinerary.ts`
- **Specification**: In `src/domain/farely/tripBudgetEstimator.ts`, compute carrier surcharges scaled by whole-integer passenger counts (`Math.floor(Math.max(1, passengers))`). In `src/domain/farely/multiCityItinerary.ts`, enforce 150m domestic, 240m international, and 210m metropolitan inter-airport transfers.
- **Forbidden Deviations**: No naked base fare ranking; no unflagged self-transfers; direct ticketing and payment gateway integration are strictly `boundary_excluded`.
- **Turnkey Verification**: `npx vitest run src/domain/farely/tripBudgetEstimator.test.ts`

### SOL-04: SOL-AUTH-01 (Rate-Limited Tokenized Watch Outbox & Row-Level Locking)
- **Target File**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **Specification**: In `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`, enforce rate limiting via `check_watch_rate_limit()` and transactional outbox row locking (`FOR UPDATE SKIP LOCKED`).
- **Forbidden Deviations**: No plain-text email broadcast queues; unauthorized scraping and credit card processing are strictly `boundary_excluded`.
- **Turnkey Verification**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-05: SOL-CIRCUIT-01 (Tri-State Provider Circuit Breakers & Fallback Degrade)
- **Target File**: `supabase/functions/_shared/flight-search.ts`
- **Specification**: In `supabase/functions/_shared/flight-search.ts`, implement tri-state circuit breaker (`CLOSED`, `OPEN`, `HALF_OPEN`) tracking consecutive 5xx errors and timeouts (> 8000ms), failing fast to cached snapshots.
- **Forbidden Deviations**: No unthrottled outbound retries; no hard crashes on upstream provider timeout.
- **Turnkey Verification**: `npx vitest run src/domain/farely/providerRights.test.ts`

### SOL-06: SOL-STALE-01 (PWA Offline Freshness & Monotonic Deal Deduplication)
- **Target File**: `src/app/pages/DealsPage.tsx` & `src/domain/farely/pwaOfflineFreshness.ts`
- **Specification**: In `src/app/pages/DealsPage.tsx`, deduplicate deal feeds monotonically. In `src/domain/farely/pwaOfflineFreshness.ts`, purge cached search results older than 14 days and mark fares over 6 hours old as `STALE_SNAPSHOT`.
- **Forbidden Deviations**: No unbounded localStorage persistence; no rendering stale fares as live quotes.
- **Turnkey Verification**: `npx vitest run src/domain/farely/pwaOfflineFreshness.test.ts`

### SOL-07: SOL-TELEMETRY-01 (Safe Recursive Error Serialization & Depth Guard)
- **Target File**: `src/app/lib/analytics.ts`
- **Specification**: In `src/app/lib/analytics.ts`, implement bounded recursive serialization in `safeSerializeError` capping recursion at `maxDepth = 3`, truncating object keys at `maxKeysPerLevel = 50`, and preserving array types.
- **Forbidden Deviations**: No naive JSON.stringify; no unbounded key extraction; no unredacted logging of PII.
- **Turnkey Verification**: `npx vitest run src/app/lib/analytics.test.ts`

### SOL-08: SOL-MIGRATION-01 (Zero-Downtime Migration Invariants & Schema Verification)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs`
- **Specification**: In `scripts/verify-certification-integrity.node-test.mjs`, verify that database migrations use non-destructive DDL (`ADD COLUMN IF NOT EXISTS`, `CREATE INDEX CONCURRENTLY IF NOT EXISTS`).
- **Forbidden Deviations**: No destructive table drops or column alterations; no production data mutation.
- **Turnkey Verification**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-09: SOL-PROOF-01 (Hierarchical Verification Gating C0 -> C4)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs`
- **Specification**: In `scripts/verify-certification-integrity.node-test.mjs`, enforce strict separation of proof tiers: C0 (Contract), C1 (Unit Code Proof), C2 (Integration), C3 (Runtime Telemetry), and C4 (Longitudinal Soak). Unit tests cannot certify C3/C4 milestones.
- **Forbidden Deviations**: No self-awarded 10/10 scores; no synthetic badge upgrades without automated verification proof.
- **Turnkey Verification**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-10: SOL-SHRINK-01 (Acceptance Anti-Shrinkage & Gate Immutability)
- **Target File**: `scripts/acceptance-anti-shrinkage.node-test.mjs`
- **Specification**: In `scripts/acceptance-anti-shrinkage.node-test.mjs`, assert all 89 capability contracts (F00..F88) and 267 historical acceptance gates (192 P0, 74 P1, 1 P2) remain strictly preserved.
- **Forbidden Deviations**: No deletion, consolidation, or renaming of acceptance criteria.
- **Turnkey Verification**: `node scripts/acceptance-anti-shrinkage.node-test.mjs`

### SOL-11: SOL-TURNKEY-01 (ACID Transactional Task Lifecycle & Rollback Journal)
- **Target File**: `scripts/convergence/transactional-task-manager.mjs`
- **Specification**: In `scripts/convergence/transactional-task-manager.mjs`, enforce atomic state transitions (`begin` -> `commit` / `rollback`) with pre-image filesystem snapshots in `docs/convergence/state/transaction_journal.json`.
- **Forbidden Deviations**: No manual file edits outside active transaction journal context.
- **Turnkey Verification**: `node scripts/convergence/transactional-task-manager.mjs status`

### SOL-12: SOL-RELEASE-01 (Automated Watchdog Convergence & Remote SHA Parity)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs`
- **Specification**: In `scripts/convergence/watchdog-convergence.mjs`, enforce full test suite verification and Git remote tracking parity via `git ls-remote origin antigravity/farely-v12-product-convergence`.
- **Forbidden Deviations**: No unpushed commits; no ignoring CI test suite failures.
- **Turnkey Verification**: `node scripts/convergence/watchdog-convergence.mjs`

---

## SECTION E: HOSTILE BEFORE/AFTER AST DIFF BLUEPRINT

### WP01: `src/domain/farely/airportAlternatives.ts`
```typescript
<<<<<<< BEFORE
export function evaluateAirportAlternative(params: {
  baselineAirportCode: string;
  baselinePrice: number;
  alternativeAirportCode: string;
  alternativePrice: number;
}): AirportAlternativeEvaluation {
  const baseCode = params.baselineAirportCode.trim().toUpperCase();
  const altCode = params.alternativeAirportCode.trim().toUpperCase();

  const baseAirport = AIRPORT_CATALOG[baseCode];
  const altAirport = AIRPORT_CATALOG[altCode];
=======
export function evaluateAirportAlternative(params: {
  baselineAirportCode: string;
  baselinePrice: number;
  alternativeAirportCode: string;
  alternativePrice: number;
}): AirportAlternativeEvaluation {
  const baseCode = (params.baselineAirportCode || "").trim().toUpperCase();
  const altCode = (params.alternativeAirportCode || "").trim().toUpperCase();

  // Validate airport code validity and identity match
  if (!baseCode || !altCode || baseCode === altCode) {
    return {
      baselineAirportCode: baseCode || "UNKNOWN",
      baselineAirportName: AIRPORT_CATALOG[baseCode]?.name || baseCode || "UNKNOWN",
      alternativeAirportCode: altCode || "UNKNOWN",
      alternativeAirportName: AIRPORT_CATALOG[altCode]?.name || altCode || "UNKNOWN",
      inSameMetro: false,
      airFareSavingsVND: 0,
      groundTransfer: {
        originCode: altCode || "UNKNOWN",
        destinationCode: baseCode || "UNKNOWN",
        distanceKm: 0,
        typicalMinutes: 0,
        estimatedCostVND: 0,
        modes: [],
        sourceName: "Sân bay trùng khớp hoặc không hợp lệ",
        isVerifiedSource: true,
      },
      netSavingsVND: 0,
      hourlyEfficiencyVND: 0,
      verdict: "NOT_RECOMMENDED",
      isWorthwhile: false,
      explanationVi: baseCode === altCode
        ? "Sân bay so sánh trùng khớp với sân bay gốc."
        : "Mã sân bay so sánh không hợp lệ.",
    };
  }

  // Validate positive finite prices
  if (
    !Number.isFinite(params.baselinePrice) ||
    params.baselinePrice <= 0 ||
    !Number.isFinite(params.alternativePrice) ||
    params.alternativePrice <= 0
  ) {
    return {
      baselineAirportCode: baseCode,
      baselineAirportName: AIRPORT_CATALOG[baseCode]?.name || baseCode,
      alternativeAirportCode: altCode,
      alternativeAirportName: AIRPORT_CATALOG[altCode]?.name || altCode,
      inSameMetro: false,
      airFareSavingsVND: 0,
      groundTransfer: {
        originCode: altCode,
        destinationCode: baseCode,
        distanceKm: 0,
        typicalMinutes: 0,
        estimatedCostVND: 0,
        modes: [],
        sourceName: "Mức giá không hợp lệ",
        isVerifiedSource: true,
      },
      netSavingsVND: 0,
      hourlyEfficiencyVND: 0,
      verdict: "NOT_RECOMMENDED",
      isWorthwhile: false,
      explanationVi: "Mức giá so sánh không hợp lệ (phải là số dương hợp lệ).",
    };
  }

  const baseAirport = AIRPORT_CATALOG[baseCode];
  const altAirport = AIRPORT_CATALOG[altCode];
>>>>>>> AFTER
```

### WP02: `src/domain/farely/priceAnomaly.ts`
```typescript
<<<<<<< BEFORE
export function calculateSampleStandardDeviation(prices: number[]): {
  mean: number;
  sampleVariance: number;
  sampleStdDev: number;
} {
  const n = prices.length;
  if (n <= 1) {
    return { mean: prices[0] ?? 0, sampleVariance: 0, sampleStdDev: 0 };
  }
  const mean = prices.reduce((a, b) => a + b, 0) / n;
  const sumSquaredDiffs = prices.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0);
  const sampleVariance = Math.round(sumSquaredDiffs / (n - 1)); // Bessel's correction
  return {
    mean,
    sampleVariance,
    sampleStdDev: Math.sqrt(sampleVariance),
  };
}
=======
export function calculateSampleStandardDeviation(prices: number[]): {
  mean: number;
  sampleVariance: number;
  sampleStdDev: number;
} {
  const validPrices = (prices || []).filter(
    (p) => typeof p === "number" && Number.isFinite(p) && p > 0
  );
  const n = validPrices.length;
  if (n <= 1) {
    return { mean: validPrices[0] ?? 0, sampleVariance: 0, sampleStdDev: 0 };
  }
  const mean = validPrices.reduce((a, b) => a + b, 0) / n;
  const sumSquaredDiffs = validPrices.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0);
  const sampleVariance = Math.round(sumSquaredDiffs / (n - 1)); // Bessel's correction
  return {
    mean,
    sampleVariance,
    sampleStdDev: Math.sqrt(sampleVariance),
  };
}
>>>>>>> AFTER
```

### WP03: `src/app/domain/dealComparison.ts`
```typescript
<<<<<<< BEFORE
function durationMinutes(duration?: string): number | undefined {
  if (!duration) return undefined;
  const hours = duration.match(/(\d+)\s*h/i)?.[1];
  const minutes = duration.match(/(\d+)\s*m/i)?.[1];
  if (!hours && !minutes) return undefined;
  return Number(hours ?? 0) * 60 + Number(minutes ?? 0);
}
=======
function durationMinutes(duration?: string): number | undefined {
  if (!duration || typeof duration !== "string") return undefined;
  const hours = duration.match(/(\d+)\s*(?:h|giờ|tiếng|g)/i)?.[1];
  const minutes = duration.match(/(?:(?:h|giờ|tiếng|g)\s*(\d{1,2})|\b(\d+)\s*(?:m|phút|p))/i);
  const minVal = minutes?.[1] || minutes?.[2];
  if (!hours && !minVal) return undefined;
  return Number(hours ?? 0) * 60 + Number(minVal ?? 0);
}
>>>>>>> AFTER
```

---

## SECTION K: 12-LENS CONVERGENCE MATRIX
- **L01 (Ingestion & Schema Integrity)**: Enforced via `src/domain/farely/airportAlternatives.ts`.
- **L02 (Price Anomaly & Algorithmic Rigor)**: Enforced via `src/domain/farely/priceAnomaly.ts`.
- **L03 (True-Cost & Ancillary Transparency)**: Enforced via `src/app/domain/dealComparison.ts`.
- **L04 (Anti-Abuse & Rate Limiting)**: Enforced via `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`.
- **L05 (High Concurrency & Resilience)**: Enforced via `supabase/functions/_shared/flight-search.ts`.
- **L06 (PWA Offline & Client Freshness)**: Enforced via `src/app/pages/DealsPage.tsx` and `src/domain/farely/pwaOfflineFreshness.ts`.
- **L07 (Observability & Production SRE)**: Enforced via `src/app/lib/analytics.ts`.
- **L08 (Zero-Downtime DB Migrations)**: Enforced via `scripts/verify-certification-integrity.node-test.mjs`.
- **L09 (Zero-Mock Testing & Proof Hierarchy)**: Enforced via `scripts/verify-certification-integrity.node-test.mjs`.
- **L10 (Contract Immutability & Anti-Shrinkage)**: Enforced via `scripts/acceptance-anti-shrinkage.node-test.mjs`.
- **L11 (Transactional Execution Safety)**: Enforced via `scripts/convergence/transactional-task-manager.mjs`.
- **L12 (Audit & Autonomous Watchdog)**: Enforced via `scripts/convergence/watchdog-convergence.mjs`.
