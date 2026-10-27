# FARELY PROJECT 10X — RESEARCH R10 [R4]
# LEVEL: Pass 4: Production SRE Rigor & Zero-Mock Verification
# MANDATE: Assume Pass 3 relied on mock safety across all 12 lenses. Enforce deterministic oracles, real integrations, and zero-loss rollbacks.
# GIT_COMMIT: 284631b78ca1ecefc90d9a10821cd8d216c55c39
# TIMESTAMP: 2026-10-26T11:27:00.000Z
# EXECUTION_RECEIPT_SHA256: 1023df9b0fc51028e98b9b5bbf21b5c1bf4c41f5acf6aa86d689fd0633aabd70

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

## SECTION III: HOSTILE FALSIFICATION & RIGOROUS AUDIT OF PASS R3

### Falsification 1: L01 (Airport Alternatives Daylight Savings & Cross-Midnight Turnaround)
- *Deficit Identified in Pass R3*: Pass R3 noted that arrival before departure in UTC produces negative elapsed durations, but only checked `trueElapsedMinutes < 0`. It failed to account for multi-leg itineraries spanning cross-midnight international dateline transitions where local departure time string lacks timezone offset (`2026-12-01T23:45:00`), leading to silent UTC fallback that calculates a negative duration under standard `new Date()` parsing in non-UTC browser environments.
- *Empirical Code Evidence*: In `src/domain/farely/airportAlternatives.ts` line 44:
```typescript
const depMs = new Date(itinerary.departureTime).getTime();
const arrMs = new Date(itinerary.arrivalTime).getTime();
const trueElapsedMinutes = Math.round((arrMs - depMs) / 60000);
```
- *SRE Production Remedy*: When `isNaN(depMs)` or `isNaN(arrMs)` or `arrMs < depMs`, or when the time difference is physically impossible for commercial passenger aviation (> 72 hours or < 15 minutes for distinct origin/destination), the function must fallback safely to `flightMinutes: itinerary.durationMinutes || 0` and log a structured telemetry warning without crashing the alternative airport recommendation engine.

### Falsification 2: L02 (Tet Anomaly Multi-Year Epoch Leap & Solar Calendar Drift)
- *Deficit Identified in Pass R3*: Pass R3 proposed replacing `/` with `-` in `isTetDeparture`. However, in `src/domain/farely/priceAnomaly.ts`, the Tet window table `TET_WINDOWS` hardcodes Gregorian calendar date bounds for lunar years 2025, 2026, and 2027. If an incoming flight search has a departure date in 2028 or beyond, `isTetDeparture` returns `false` by omission, causing Lunar New Year peak pricing in 2028+ to be incorrectly classified as an extreme price anomaly (surge spike) rather than a scheduled seasonal peak.
- *Empirical Code Evidence*: In `src/domain/farely/priceAnomaly.ts` lines 28-36:
```typescript
const TET_WINDOWS: { start: string; end: string }[] = [
  { start: '2025-01-20', end: '2025-02-15' },
  { start: '2026-02-10', end: '2026-03-05' },
  { start: '2027-01-30', end: '2027-02-25' },
];
```
- *SRE Production Remedy*: The price anomaly detector must dynamically calculate seasonal confidence intervals. If a date falls outside known `TET_WINDOWS`, it must check if the date is within 30 days of the estimated Lunar New Year (or flag `seasonality_unknown: true`) rather than falsely asserting high-confidence anomaly spikes.

### Falsification 3: L03 (Deal Dominance & Co-terminal Airport Conflation)
- *Deficit Identified in Pass R3*: Pass R3 addressed `stops === null` vs `stops === 0` in `src/app/domain/dealComparison.ts`. However, it ignored multi-airport metro co-terminal dominance. For example, comparing a flight to Tokyo Haneda (HND) against Tokyo Narita (NRT), or London Heathrow (LHR) against London Stansted (STN): treating them as identical destinations without considering surface ground transfer costs ($50-$100) leads to false "dominated deal" flags where a slightly cheaper flight to a remote secondary airport is incorrectly marked as strictly superior to a downtown non-stop flight.
- *Empirical Code Evidence*: In `src/app/domain/dealComparison.ts`:
```typescript
export function isDealDominated(candidate: CandidateDeal, baseline: CandidateDeal): boolean {
  if (candidate.destination !== baseline.destination) return false;
  // Naive comparison ignores airport ground transfer latency and cost
}
```
- *SRE Production Remedy*: Strict airport exact matching (`originAirport` and `destinationAirport` 3-letter IATA codes) must be enforced for price dominance assertions unless an explicit co-terminal ground transfer offset is factored into the total cost model.

---

## SECTION IV: THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Non-OTA boundary enforcement; boundary_excluded capabilities (direct ticketing, passenger checkout, payment gateway integration, credit card processing, unauthorized scraping are strictly excluded). Preservation of core intelligence contracts F00..F88.
- **Physical Code Citations**: `src/app/lib/bookingUrls.ts`, `src/domain/farely/multiCityItinerary.ts`, `src/domain/farely/providerRights.ts`
- **Adversarial Vector Defense**: Defend against deep-link injection attacks where malicious affiliate parameters or malformed passenger counts are injected into airline outbound transfer URLs.
- **Verification Proof (C0..C4)**: C1 Unit test suite `npx vitest run src/app/lib/bookingUrls.test.ts` verifying safe parameter encoding, IATA sanitization, and chronological date assertions.

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Elimination of non-positive prices, NaN valuations, negative fuel surcharges, and fractional Dong currency artifacts.
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
- **Physical Code Citations**: `supabase/migrations/20260407000000_initial_schema.sql`, `src/domain/farely/fareAlertEngine.ts`
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

### SOL-01: SOL-TIMING-01 (Defensive Airport Timing & Elapsed Minutes Guard)
- **Target File**: `src/domain/farely/airportAlternatives.ts`
- **Specification**: In `calculateTimezoneAwareTiming`, sanitize input timestamps (`departureTime`, `arrivalTime`), enforce `trueElapsedMinutes >= 0`, clamp negative durations to `itinerary.durationMinutes || 0`, and return valid timing objects even when dates are malformed.
- **Forbidden Deviations**: Do not invent new timezone calculation libraries; do not delete existing alternative scoring criteria.
- **Verification Command**: `npx vitest run src/domain/farely/airportAlternatives.test.ts`

### SOL-02: SOL-TET-01 (Tet Holiday Date Normalization & Separator Robustness)
- **Target File**: `src/domain/farely/priceAnomaly.ts`
- **Specification**: In `isTetDeparture`, normalize input date strings by replacing forward slashes (`/`) with hyphens (`-`), validate 10-character `YYYY-MM-DD` formatting, and guard against non-string departure date inputs.
- **Forbidden Deviations**: Do not delete existing `TET_WINDOWS` definitions; do not alter statistical anomaly score formulas.
- **Verification Command**: `npx vitest run src/domain/farely/priceAnomaly.test.ts`

### SOL-03: SOL-DEAL-01 (Deal Comparison Non-Positive Price Guard & Strict Stop Differentiation)
- **Target File**: `src/app/domain/dealComparison.ts`
- **Specification**: In `isDealDominated`, guard against non-positive prices (`candidate.price <= 0 || baseline.price <= 0`), reject comparisons where prices are invalid, and distinguish strictly between direct non-stop flights (`stops === 0`) and unverified stop counts (`stops === null || stops === undefined`).
- **Forbidden Deviations**: Do not remove baseline deal comparison logic; do not relax dominance criteria.
- **Verification Command**: `npx vitest run src/app/domain/dealComparison.test.ts`
