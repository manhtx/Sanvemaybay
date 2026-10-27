# FARELY PROJECT 10X — RESEARCH R10 [R4]
# LEVEL: Pass 4: Production SRE Rigor & Zero-Mock Verification
# MANDATE: Assume Pass 3 relied on mock safety across all 12 lenses. Enforce deterministic oracles, real integrations, and zero-loss rollbacks.
# GIT_COMMIT: f9df38ffe1b06e2c3a86dc82336779c861db188e
# TIMESTAMP: 2026-10-27T02:43:37.983Z
# EXECUTION_RECEIPT_SHA256: cb469d0df043eb74e1e75168f5eb157d9e3e07988495f5b938f5d3dc775ff342

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

## SECTION III: PRODUCTION SRE AUDIT & FALSIFICATION OF PASS R3

### Falsification 1: L01 (Airport Transfer Feeder Loop & Negative Transit Elapsed Intervals)
- *Deficit Identified in Pass R3*: Pass R3 calculated layover MCT for co-terminals, but in `src/domain/farely/multiCityItinerary.ts`, if an itinerary contains a feeder segment that arrives after the scheduled departure of the second segment in local times across differing hemispheres or date lines (e.g. `HND` departure at 01:00 vs `NRT` arrival at 23:30 previous calendar date), standard integer hour arithmetic produces negative elapsed layovers.
- *Physical Code Verification*: In `src/domain/farely/multiCityItinerary.ts`:
```typescript
// SRE Invariant: Calculate layover instant in UTC milliseconds
const prevArrMs = new Date(prevSlice.arrivalTimeUtc).getTime();
const nextDepMs = new Date(nextSlice.departureTimeUtc).getTime();
const layoverMinutes = Math.round((nextDepMs - prevArrMs) / 60000);
```
- *Production SRE Remedy*: Assert that all inter-slice layovers are computed strictly from normalized UTC timestamps, never ungrounded local wall-clock strings.

### Falsification 2: L02 (Data Economics API Cost Budgeting & Micro-Cent Truncation)
- *Deficit Identified in Pass R3*: Pass R3 floored query counts to integers, but in `src/domain/farely/dataEconomics.ts`, under high-concurrency batch execution, multi-tenant billing aggregation can trigger integer overflow if cost calculations use standard 32-bit bitwise shifts (`a | 0`).
- *Physical Code Verification*: In `src/domain/farely/dataEconomics.ts`:
```typescript
// Enforce safe 64-bit float math with discrete integer rounding for VND
const totalBatchCostVnd = Math.round(Number(rawQueries) * Number(unitPriceVnd));
```
- *Production SRE Remedy*: Eliminate bitwise truncations in favor of safe mathematical integer bounds.

### Falsification 3: L03 (Buy/Wait Guidance Flat Cohort Boundary Under Sampling Scarcity)
- *Deficit Identified in Pass R3*: Pass R3 filtered `<= 0` prices, but did not handle extreme price spikes (e.g., $10\times$ median) corrupting the buy/wait trend regression line. In `src/domain/farely/buyWaitGuidance.ts`, an un-sanitized surge fare skews the slope positive, falsely advising users to `BUY_NOW` due to an artificial upward trajectory.
- *Physical Code Verification*: In `src/domain/farely/buyWaitGuidance.ts`:
```typescript
// Outlier filtering: exclude observations exceeding 5x median prior to trend regression
const medianPrice = calculateMedian(validPrices);
const unskewedPrices = validPrices.filter(p => p <= medianPrice * 5);
```
- *Production SRE Remedy*: Apply median-relative outlier rejection before computing regression slopes.

### Falsification 4: L08 (Migration Provenance & Concurrent Index Integrity)
- *Deficit Identified in Pass R3*: Pass R3 asserted non-destructive DDL, but did not verify transaction block isolation during PostgreSQL index generation. In Supabase PostgreSQL, executing `CREATE INDEX CONCURRENTLY` inside an active transaction block causes a database error, crashing automated deployment pipelines.
- *Physical Code Verification*: In `supabase/migrations/20260407000000_initial_schema.sql` and `scripts/verify-certification-integrity.node-test.mjs`.
- *Production SRE Remedy*: Verify that migrations containing `CONCURRENTLY` are authored as standalone transactional statements.

### Falsification 5: L11 (Rollback Journal Pre-Image Parity)
- *Deficit Identified in Pass R3*: Pass R3 verified status transitions in `transactional-task-manager.mjs`, but did not assert cryptographic SHA256 integrity of pre-image file snapshots before rollback restoration.
- *Physical Code Verification*: In `scripts/convergence/transactional-task-manager.mjs`.
- *Production SRE Remedy*: Compute and verify pre-image hash prior to executing transaction rollback.

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
