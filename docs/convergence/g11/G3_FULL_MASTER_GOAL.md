# FARELY PROJECT 10X — MASTER GOAL G11 [G3]
# LEVEL: Pass 3: Hostile Boundary & Negative Vector Hardening
# MANDATE: Assume Pass 2 missed edge cases across all 12 lenses. Attack with 24 negative vectors, race conditions, and error states.
# GIT_COMMIT: f9df38ffe1b06e2c3a86dc82336779c861db188e
# TIMESTAMP: 2026-10-27T02:47:12.511Z
# EXECUTION_RECEIPT_SHA256: 1be502e0794fe6707a1c03d707ec22095017c71d36c6635f96079bc1d44dd29c

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

## SECTION C: HOSTILE AUDIT & FALSIFICATION OF PASS G2

### Falsification 1: L01 (Multi-City Circular Routing & Self-Loop Traversal)
- *Deficit Identified in Pass G2*: Pass G2 checked chronological monotonic ordering between slices, but in `src/domain/farely/multiCityItinerary.ts`, if an input slice array contains a zero-duration or circular self-loop where origin equals destination on an intermediate leg (e.g., `HAN -> SGN` followed by `SGN -> SGN`), layover validation completes without detecting the degenerate leg, causing erroneous routing advice.
- *Physical Code Verification*: In `src/domain/farely/multiCityItinerary.ts`:
```typescript
export function validateSliceEndpoints(slice: NormalizedSlice): boolean {
  return slice.originAirport.toUpperCase() !== slice.destinationAirport.toUpperCase();
}
```
- *Adversarial Vector Remedy*: Reject any individual slice where departure airport equals arrival airport.

### Falsification 2: L02 (Data Economics Float Truncation & Non-Integer Subscriber Volumes)
- *Deficit Identified in Pass G2*: Pass G2 guarded unit costs, but did not guard against floating-point subscriber counts (e.g., `activeSubscribers = 10.5` or `0.0001`) from analytical sampling models. In `src/domain/farely/dataEconomics.ts`, dividing by fractional subscribers produces inflated non-deterministic unit quotes.
- *Physical Code Verification*: In `src/domain/farely/dataEconomics.ts`:
```typescript
export function sanitizeSubscriberCount(subscribers: number): number {
  if (!Number.isFinite(subscribers) || subscribers <= 0) return 1;
  return Math.floor(subscribers);
}
```
- *Adversarial Vector Remedy*: Enforce discrete positive integer subscriber counts (`Math.floor(Math.max(1, subscribers))`).

### Falsification 3: L03 (Buy/Wait Trend Regression Degeneracy on Bimodal Price Distributions)
- *Deficit Identified in Pass G2*: Pass G2 abstained on cohorts under 3 items, but did not handle bimodal price distributions where business class fares ($10\text{M}$) and economy fares ($1.5\text{M}$) are mixed in the same historical cohort without cabin class segmentation. In `src/domain/farely/buyWaitGuidance.ts`, the linear trend slope oscillates wildly based on which cabin was queried most recently.
- *Physical Code Verification*: In `src/domain/farely/buyWaitGuidance.ts`:
```typescript
// Filter historical observations to match candidate cabin class strictly
export function filterCohortByCabin(prices: FlightObservation[], targetCabin: string): number[] {
  return prices.filter(p => (p.cabinClass || 'economy').toLowerCase() === targetCabin.toLowerCase()).map(p => p.price);
}
```
- *Adversarial Vector Remedy*: Enforce strict cabin class isolation before calculating buy/wait statistics.

### Falsification 4: L05 (Circuit Breaker Outbound Request Timeout Leakage)
- *Deficit Identified in Pass G2*: Pass G2 tracked half-open failure states, but did not bind an explicit `AbortController` signal to outbound HTTP requests in `src/domain/farely/providerRights.ts`. When an upstream partner hangs without returning HTTP headers, the node socket remains open indefinitely, exhausting connection pools.
- *Physical Code Verification*: In `src/domain/farely/providerRights.ts`:
```typescript
export function createGuardedFetch(timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, cleanup: () => clearTimeout(timer) };
}
```
- *Adversarial Vector Remedy*: Standardize 8000ms hard abort timeouts on all partner network calls.

### Falsification 5: L07 (Telemetry PII Leakage in URL Query Strings)
- *Deficit Identified in Pass G2*: Pass G2 sanitized object keys, but did not scrub sensitive customer information embedded in deep-link URL query parameters (e.g., `?email=user@example.com&phone=0901234567`) before logging analytics page views.
- *Physical Code Verification*: In `src/app/lib/analytics.ts`:
```typescript
export function sanitizeTelemetryUrl(url: string): string {
  try {
    const parsed = new URL(url, 'https://farely.vn');
    parsed.searchParams.delete('email');
    parsed.searchParams.delete('phone');
    parsed.searchParams.delete('token');
    return parsed.pathname + (parsed.searchParams.toString() ? '?' + parsed.searchParams.toString() : '');
  } catch {
    return '[INVALID_URL]';
  }
}
```
- *Adversarial Vector Remedy*: Scrub PII query parameters from telemetry URLs.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS

### SOL-01: SOL-LAYOVER-01 (Multi-City Minimum Connection Time & Layover Bounds Guard)
- **SOL_ID**: SOL-LAYOVER-01
- **TARGET_FILES**: `src/domain/farely/multiCityItinerary.ts`
- **LOCKED_ALGORITHM**: In `computeSegmentLayovers`, calculate elapsed minutes between consecutive connecting slices using UTC timestamps. Assert chronological ordering (`nextDepDate >= prevDepDate`). Guard against self-loop endpoints (`origin !== destination`). Enforce minimum connection time ($\text{MCT} \ge 45 \text{ min}$ for domestic same-terminal, $\ge 90 \text{ min}$ for international) and maximum connection window ($\le 1440 \text{ min}$). Flag non-compliant or physically impossible connections without throwing unhandled exceptions.
- **FORBIDDEN_DEVIATIONS**: No unverified external dependencies; no signature modification; no removing existing slice validation logic.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/multiCityItinerary.test.ts`

### SOL-02: SOL-BUDGET-01 (Data Economics Per-Query Marginal Cost Floor)
- **SOL_ID**: SOL-BUDGET-01
- **TARGET_FILES**: `src/domain/farely/dataEconomics.ts`
- **LOCKED_ALGORITHM**: In `calculateDataEconomics`, sanitize `unitCostVnd` to positive finite integers. Floor subscriber volume to positive integers (`Math.floor(Math.max(1, subscribers))`). Enforce a minimum integer floor of $1 \text{ VND}$ on marginal query cost calculations when dividing by active subscribers (`Math.max(1, Math.round(batchCost / subscribers))`) to prevent zero-cost rate leakage.
- **FORBIDDEN_DEVIATIONS**: No unverified external dependencies; no deletion of existing formulas; no non-integer currency valuations.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/dataEconomics.test.ts`

### SOL-03: SOL-CONFIDENCE-01 (Buy/Wait Guidance Trend Confidence Volatility Calibration)
- **SOL_ID**: SOL-CONFIDENCE-01
- **TARGET_FILES**: `src/domain/farely/buyWaitGuidance.ts`
- **LOCKED_ALGORITHM**: In `calculateBuyWaitGuidance`, guard against sparse cohorts ($N < 3 \to \text{abstain}$). Scale recommendation confidence by sample size ratio (`validPrices.length / 30`) and apply coefficient of variation volatility dampening (`(sampleStdDev / mean) * 0.5`) to prevent false high-confidence recommendations on noisy time-series data.
- **FORBIDDEN_DEVIATIONS**: No unverified external dependencies; no removing baseline comparison criteria; no modifying return enum types.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/buyWaitGuidance.test.ts`

---

## SECTION E: THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

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
