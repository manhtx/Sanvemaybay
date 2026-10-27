# FARELY PROJECT 10X — RESEARCH R10 [R3]
# LEVEL: Pass 3: Hostile Boundary & Negative Vector Hardening
# MANDATE: Assume Pass 2 missed edge cases across all 12 lenses. Attack with 24 negative vectors, race conditions, and error states.
# GIT_COMMIT: f9df38ffe1b06e2c3a86dc82336779c861db188e
# TIMESTAMP: 2026-10-27T02:42:44.305Z
# EXECUTION_RECEIPT_SHA256: c2b98973ee47afbd65cd92b9f97ede03975c953f58061b71e262487037dc6eec

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

## SECTION III: HOSTILE FALSIFICATION & RIGOROUS AUDIT OF PASS R2

### Falsification 1: L01 (Airport Transfer Feeder Loop & Negative Transit Elapsed Intervals)
- *Deficit Identified in Pass R2*: Pass R2 examined connection times between slices, but omitted co-terminal transit layover calculations where a connecting flight departs from an alternate airport in the same metro area (e.g., arrival at `BKK` and onward departure from `DMK`). A simple 45-minute minimum connection time is physically impossible when cross-metro bus or taxi transfer requires at least 60-90 minutes under Bangkok traffic conditions.
- *Physical Code Verification*: In `src/domain/farely/multiCityItinerary.ts` and `src/domain/farely/airportAlternatives.ts`:
```typescript
export function calculateCrossMetroLayoverMct(arrCode: string, nextDepCode: string): number {
  if (arrCode.toUpperCase() === nextDepCode.toUpperCase()) return 45; // Same terminal MCT
  const transfer = findGroundTransfer(arrCode, nextDepCode);
  return (transfer?.typicalMinutes || 90) + 60; // Transit latency + 60m baggage re-check
}
```
- *Adversarial Vector Defense*: Enforce dynamic MCT calculation incorporating ground transfer transit buffers for co-terminal inter-airport connections.

### Falsification 2: L02 (Data Economics Negative Query Count & NaN Wholesale Rates)
- *Deficit Identified in Pass R2*: Pass R2 enforced a $1 \text{ VND}$ floor on marginal cost, but did not guard against negative or fractional API query counts (e.g. `queries = -5` or `queries = 1.7`) in wholesale contract estimations. In `src/domain/farely/dataEconomics.ts`, evaluating batch discounts with non-integer query counts produces invalid fractional currency quotes that break deterministic billing oracles.
- *Physical Code Verification*: In `src/domain/farely/dataEconomics.ts`:
```typescript
export function calculateWholesaleBatchDiscount(queryCount: number, unitCostVnd: number): number {
  const safeQueries = Math.floor(Math.max(0, Number.isFinite(queryCount) ? queryCount : 0));
  const safeUnitCost = Math.round(Math.max(0, Number.isFinite(unitCostVnd) ? unitCostVnd : 0));
  // Compute tiered pricing monotonically
}
```
- *Adversarial Vector Defense*: Enforce non-negative integer sanitization (`Math.floor(Math.max(0, ...))`) across all query counts and fee scalars.

### Falsification 3: L03 (Buy/Wait Guidance Flat Cohort Boundary Under Sampling Scarcity)
- *Deficit Identified in Pass R2*: Pass R2 dampened confidence on volatility, but in `src/domain/farely/buyWaitGuidance.ts`, when an incoming price history array contains identical values except for a single erroneous zero (e.g. `[2M, 2M, 2M, 0, 2M]`), filtering out `<= 0` leaves a flat array of 4 items, which falls below the sample size threshold ($N < 5$), triggering uncalibrated default fallback instead of `WAIT_AND_WATCH`.
- *Physical Code Verification*: In `src/domain/farely/buyWaitGuidance.ts`:
```typescript
// Sanitized cohort extraction must precede flatness analysis
const validPrices = (priceHistory || []).filter(p => Number.isFinite(p) && p > 0);
if (validPrices.length < 5) return { recommendation: 'WAIT_AND_WATCH', confidence: 0.5 };
```
- *Adversarial Vector Defense*: Strictly decouple dirty price sanitation from statistical trend and flatness detection.

### Falsification 4: L05 (Circuit Breaker Half-Open Flapping Cascade)
- *Deficit Identified in Pass R2*: Pass R2 mentioned consecutive successes, but did not specify failure threshold isolation during the `HALF_OPEN` trial state. If an upstream partner API succeeds once and fails on the next trial call, without an explicit single-failure re-open rule, the circuit breaker remains trapped in `HALF_OPEN`, allowing unthrottled traffic to inundate an unstable provider.
- *Physical Code Verification*: In `src/domain/farely/providerRights.ts`:
```typescript
// In HALF_OPEN state, ANY single failure must immediately trip the circuit back to OPEN
if (currentBreaker.state === 'HALF_OPEN' && isFailure) {
  currentBreaker.state = 'OPEN';
  currentBreaker.lastFailureTimeMs = Date.now();
}
```
- *Adversarial Vector Defense*: Enforce zero-tolerance failure re-tripping in `HALF_OPEN` state.

### Falsification 5: L07 (Telemetry Buffer Overflow on High-Frequency Error Spikes)
- *Deficit Identified in Pass R2*: Pass R2 masked sensitive keys, but did not impose a rate-limiting ring buffer on client telemetry dispatch. Under sustained network failure, hundreds of rapid UI retry loops dispatch hundreds of analytics events per second, causing client memory exhaustion and browser tab freezing.
- *Physical Code Verification*: In `src/app/lib/analytics.ts`:
```typescript
// Ring-buffer rate limit: maximum 10 telemetry events per 1000ms window
const MAX_EVENTS_PER_SECOND = 10;
```
- *Adversarial Vector Defense*: Rate-limit analytical event emission via sliding window counters.

---

## SECTION IV: THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Non-OTA boundary enforcement; boundary_excluded capabilities (direct ticketing, passenger checkout, payment gateway integration, credit card processing, unauthorized scraping are strictly excluded). Preservation of core intelligence contracts F00..F88.
- **Physical Code Citations**: `src/app/lib/bookingUrls.ts`, `src/domain/farely/multiCityItinerary.ts`, `src/domain/farely/providerRights.ts`
- **Adversarial Vector Defense**: Defend against deep-link injection attacks where malicious affiliate parameters or malformed passenger counts are injected into airline outbound transfer URLs.
- **Verification Proof (C0..C4)**: C1 Unit test suite `npx vitest run src/app/lib/bookingUrls.test.ts` verifying safe parameter encoding, IATA sanitization, and chronological date assertions.

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Elimination of non-positive prices, NaN valuations, negative fuel surcharges, and fractional Dong currency artifacts. Mathematical invariant: $\forall p \in \text{Fares}: p \in \mathbb{N}^+ \land p \equiv 0 \pmod 1$.
- **Physical Code Citations**: `src/domain/farely/priceAnomaly.ts`, `src/domain/farely/multiCityItinerary.ts`, `src/domain/farely/dataEconomics.ts`
- **Adversarial Vector Defense**: Defend against hostile JSON payloads with `price: -1`, `price: 0`, `price: 1e99`, or `price: "FREE"`.
- **Verification Proof (C0..C4)**: C1 Unit test suite `npx vitest run src/domain/farely/priceAnomaly.test.ts` asserting whole-number VND clamping and rejection of negative values.

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Confidence intervals derived from historical sample volume; monotonic discount scoring; total cost of travel (fare + baggage + fees).
- **Physical Code Citations**: `src/app/domain/dealComparison.ts`, `src/domain/farely/buyWaitGuidance.ts`
- **Adversarial Vector Defense**: Defend against zero-sample deal scores where a single outlier fare generates a 99/100 deal score.
- **Verification Proof (C0..C4)**: C1 Unit test suite `npx vitest run src/app/domain/dealComparison.test.ts` verifying sample thresholds and non-domination criteria.

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
- **Focus**: Supabase PostgreSQL Row Level Security (RLS) enforcement; zero credential leakage; isolated user alert subscriptions.
- **Physical Code Citations**: `supabase/migrations/20260407000000_initial_schema.sql`, `supabase/migrations/20260407000200_user_prefs.sql`, `src/domain/farely/fareAlertEngine.ts`
- **Adversarial Vector Defense**: Defend against cross-tenant price alert snooping where user A queries user B's route monitors via manipulated UUIDs.
- **Verification Proof (C0..C4)**: C1/C2 Node regression test `node scripts/verify-certification-integrity.node-test.mjs` verifying RLS policies on all public tables.

### L05: Provider Drift, Circuit Breakers & Kill Switches
- **Focus**: Defensive schema decoupling; circuit breaker states (`CLOSED`, `OPEN`, `HALF_OPEN`); upstream timeout isolation (8000ms max).
- **Physical Code Citations**: `supabase/functions/_shared/flight-search.ts`, `src/domain/farely/providerRights.ts`
- **Adversarial Vector Defense**: Defend against partner upstream cascade failures where airline GDS timeouts exhaust Edge Function memory and execution workers.
- **Verification Proof (C0..C4)**: C1 Unit test suite `npx vitest run src/domain/farely/providerRights.test.ts` validating rate limiting, commercial tier gating, and circuit break fallback.

### L06: Freshness, Stale Degradation & UX Honesty
- **Focus**: Transparent quote staleness (> 360m marked as `STALE_SNAPSHOT`); monotonic client-side deduplication; offline PWA caching limits.
- **Physical Code Citations**: `src/domain/farely/pwaOfflineFreshness.ts`, `src/app/pages/DealsPage.tsx`
- **Adversarial Vector Defense**: Defend against local cache poisoning where expired flash deals are rendered as bookable opportunities after airline fare expiration.
- **Verification Proof (C0..C4)**: C1 Unit test suite `npx vitest run src/domain/farely/pwaOfflineFreshness.test.ts` validating TTL eviction and stale metadata badges.

### L07: Observability, Secret Scrubbing & Error Boundaries
- **Focus**: Sentry/Console log sanitization; redaction of Bearer tokens, API keys, email addresses, and passport numbers; bounded error serialization.
- **Physical Code Citations**: `src/app/lib/analytics.ts`, `src/app/components/DealCard.tsx`
- **Adversarial Vector Defense**: Defend against circular error object serialization crashing telemetry handlers during unhandled promise rejections.
- **Verification Proof (C0..C4)**: C1 Unit test suite `npx vitest run src/app/lib/analytics.test.ts` asserting maximum depth clamping and sensitive key masking.

### L08: Database Architecture, Schema Drift & Migration Provenance
- **Focus**: Idempotent DDL migrations; zero data loss during schema alteration; concurrent index generation; strict migration ordering.
- **Physical Code Citations**: `supabase/migrations/20260407000000_initial_schema.sql`, `scripts/verify-certification-integrity.node-test.mjs`
- **Adversarial Vector Defense**: Defend against non-concurrent table locking DDL migrations that block flight search queries in high-concurrency environments.
- **Verification Proof (C0..C4)**: C2 Integration test `node scripts/verify-certification-integrity.node-test.mjs` confirming 47 active versioned migrations.

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
- **Focus**: Absolute prohibition of synthetic score inflation; C0 Contract != C1 Unit Code Proof != C2 Integration != C3 Deployed Runtime != C4 Longitudinal Soak.
- **Physical Code Citations**: `scripts/verify-certification-integrity.node-test.mjs`, `docs/convergence/`
- **Adversarial Vector Defense**: Defend against automated agents claiming C3/C4 certification based solely on local Vitest runs.
- **Verification Proof (C0..C4)**: Independent test runner execution logging and deterministic assertion verification.

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
- **Focus**: Strict preservation of 89 capability contracts (F00..F88) and 267 historical acceptance gates (192 P0, 74 P1, 1 P2).
- **Physical Code Citations**: `scripts/acceptance-anti-shrinkage.node-test.mjs`, `docs/convergence/state/TOTAL_CODEBASE_AUDIT.json`
- **Adversarial Vector Defense**: Defend against subtle scope pruning, acceptance criterion deletion, or relaxed gate tolerances.
- **Verification Proof (C0..C4)**: C2 Assertion suite `node scripts/acceptance-anti-shrinkage.node-test.mjs` verifying exact count 267/267 green gates.

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
- **Focus**: ACID transactional work package execution; pre-image filesystem backups; instant rollback on test assertion failure.
- **Physical Code Citations**: `scripts/convergence/transactional-task-manager.mjs`, `docs/convergence/state/transaction_journal.json`
- **Adversarial Vector Defense**: Defend against partial writes or dirty working trees causing corrupted builds upon process interruption.
- **Verification Proof (C0..C4)**: C1 Tool verification `node scripts/convergence/transactional-task-manager.mjs status` ensuring clean transaction states.

### L12: Zero-Trust Release & Remote Git Synchronization
- **Focus**: Mandatory git commit and push to `antigravity/farely-v12-product-convergence`; local HEAD sha == remote origin sha.
- **Physical Code Citations**: `scripts/convergence/watchdog-convergence.mjs`, `package.json`
- **Adversarial Vector Defense**: Defend against orphan local commits that pass local checks but fail GitHub Actions CI environment.
- **Verification Proof (C0..C4)**: Real-time query `git ls-remote origin antigravity/farely-v12-product-convergence` confirming remote equality.

---

## SECTION V: CONVERGENCE SOLUTION SPECIFICATIONS (CAGE LOCKED)

### SOL-01: SOL-LAYOVER-01 (Multi-City Minimum Connection Time & Layover Bounds Guard)
- **Target File**: `src/domain/farely/multiCityItinerary.ts`
- **Specification**: In `multiCityItinerary.ts`, validate connection time between consecutive flight slices. Enforce minimum connection time ($\text{MCT} \ge 45 \text{ min}$) and maximum connection window ($\le 1440 \text{ min}$). Flag non-compliant connections without throwing unhandled exceptions.
- **Forbidden Deviations**: Do not invent new routing graph solvers; do not alter existing slice structure schemas.
- **Verification Command**: `npx vitest run src/domain/farely/multiCityItinerary.test.ts`

### SOL-02: SOL-BUDGET-01 (Data Economics Per-Query Marginal Cost Floor)
- **Target File**: `src/domain/farely/dataEconomics.ts`
- **Specification**: In `calculateDataEconomics`, enforce a minimum non-zero integer floor ($1 \text{ VND}$) on marginal query valuations to prevent zero-cost accounting under high subscriber divisor volumes.
- **Forbidden Deviations**: Do not remove subscriber divisor mechanics; do not modify return interfaces.
- **Verification Command**: `npx vitest run src/domain/farely/dataEconomics.test.ts`

### SOL-03: SOL-CONFIDENCE-01 (Buy/Wait Guidance Trend Confidence Volatility Calibration)
- **Target File**: `src/domain/farely/buyWaitGuidance.ts`
- **Specification**: In `calculateBuyWaitGuidance`, dampen guidance confidence using sample size scaling and coefficient of variation penalties when volatility is elevated.
- **Forbidden Deviations**: Do not alter verdict classifications (`BUY_NOW`, `WAIT_AND_WATCH`); do not remove flat price cohort safeguards.
- **Verification Command**: `npx vitest run src/domain/farely/buyWaitGuidance.test.ts`
