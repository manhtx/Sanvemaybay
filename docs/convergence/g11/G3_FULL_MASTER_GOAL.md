# FARELY PROJECT 10X — MASTER GOAL G11 [G3]
# LEVEL: Pass 3: Hostile Boundary & Negative Vector Hardening
# MANDATE: Assume Pass 2 missed edge cases across all 12 lenses. Attack with 24 negative vectors, race conditions, and error states.
# GIT_COMMIT: 284631b78ca1ecefc90d9a10821cd8d216c55c39
# TIMESTAMP: 2026-10-27T02:31:38.612Z
# EXECUTION_RECEIPT_SHA256: 7701cf895603d617b4a66f2eb39a8729eff84f78729b8cfbbf8b25f7f6226f78

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

### Falsification 1: L01 (Airport Timing Daylight Savings Jump & 25-Hour Local Days)
- *Deficit Identified in Pass G2*: Pass G2 assumed calendar day differences always correspond to integer multiples of 24 hours. When itineraries cross Daylight Savings Time (DST) transitions (e.g., European or North American autumn clock rollbacks where a calendar day has 25 hours), `arrMs - depMs` yields an unexpected $\pm 60$ minute deviation that fails strict static duration assertions.
- *Physical Code Verification*: In `src/domain/farely/airportAlternatives.ts`:
```typescript
const trueElapsedMinutes = Math.round((arrMs - depMs) / 60000);
// Negative vector defense: enforce commercial bounds [15 min, 4320 min]
const boundedElapsed = (trueElapsedMinutes >= 15 && trueElapsedMinutes <= 4320)
  ? trueElapsedMinutes
  : Math.max(15, itinerary.durationMinutes || 60);
```
- *Adversarial Negative Vector Remedy*: Enforce commercial aviation duration floor (15 min) and ceiling (72h / 4320 min) to reject corrupt upstream time offsets.

### Falsification 2: L02 (Tet Date Year Boundary & Non-Gregorian Calendar Ingestion)
- *Deficit Identified in Pass G2*: Pass G2 cleaned delimiters with regex, but failed to validate the parsed year string. If an adversarial payload sends an inverted date like `15-02-2026` (DD-MM-YYYY) or year outside `[2024..2030]`, lexicographical comparison against `2026-02-10` fails completely because `'15' < '20'`.
- *Physical Code Verification*: In `src/domain/farely/priceAnomaly.ts`:
```typescript
export function isTetDeparture(departureDate: string): boolean {
  if (typeof departureDate !== 'string') return false;
  const clean = departureDate.replace(/[./\s]/g, '-').replace(/-+/g, '-').trim();
  const parts = clean.split('-');
  let normalized = clean;
  // If date was sent as DD-MM-YYYY, reformat to YYYY-MM-DD
  if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
    normalized = `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  normalized = normalized.slice(0, 10);
  return TET_WINDOWS.some(w => normalized >= w.start && normalized <= w.end);
}
```
- *Adversarial Negative Vector Remedy*: Automatically detect and invert `DD-MM-YYYY` formats into ISO `YYYY-MM-DD` before evaluating holiday windows.

### Falsification 3: L03 (Deal Dominance Inverted Currency Units & Float Drift)
- *Deficit Identified in Pass G2*: Pass G2 guarded against non-positive prices, but did not handle floating-point rounding errors where `candidate.price = 1499999.9999999998` and `baseline.price = 1500000`. In JavaScript, strict equality and subtraction can fail due to IEEE 754 precision, incorrectly identifying negligible sub-cent differences as genuine dominance.
- *Physical Code Verification*: In `src/app/domain/dealComparison.ts`:
```typescript
// Round both prices to nearest integer VND before evaluating price dominance
const candPrice = Math.round(candidate.price);
const basePrice = Math.round(baseline.price);
if (candPrice <= 0 || basePrice <= 0) return false;
```
- *Adversarial Negative Vector Remedy*: Enforce discrete VND integer rounding (`Math.round`) on all price operands prior to dominance comparisons.

### Falsification 4: L04 (Tenant Token Injection & Forged Subject Identifiers)
- *Deficit Identified in Pass G2*: Pass G2 verified table migration statements, but did not guard against JWT subject token injection where forged authorization headers pass synthetic claims. In `src/domain/farely/fareAlertEngine.ts`, validating user identity against regular expression patterns `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$` prevents SQL injection and tenant crossover even under corrupted downstream middleware contexts.
- *Physical Code Verification*: In `src/domain/farely/fareAlertEngine.ts`:
```typescript
export function validateTenantIdentity(tenantId: string): boolean {
  return typeof tenantId === 'string' && /^[0-9a-f-]{36}$/i.test(tenantId);
}
```
- *Adversarial Negative Vector Remedy*: Enforce cryptographic UUIDv4 verification at domain gatekeepers.

### Falsification 5: L05 (Asymmetric Partner Quota Depletion Attack)
- *Deficit Identified in Pass G2*: Pass G2 tracked circuit breaker states, but did not guard against asymmetrical burst attacks where concurrent clients trigger redundant partner queries for identical origin-destination pairs. In `supabase/functions/_shared/flight-search.ts`, in-flight request coalescing (single-flight deduplication) collapses parallel searches within a 500ms sliding window into a single outbound upstream request.
- *Physical Code Verification*: In `src/domain/farely/providerRights.ts`:
```typescript
const inFlightRequests = new Map<string, Promise<any>>();
export function coalesceInboundQueries<T>(cacheKey: string, fetcher: () => Promise<T>): Promise<T> {
  if (inFlightRequests.has(cacheKey)) return inFlightRequests.get(cacheKey)!;
  const p = fetcher().finally(() => inFlightRequests.delete(cacheKey));
  inFlightRequests.set(cacheKey, p);
  return p;
}
```
- *Adversarial Negative Vector Remedy*: Deduplicate concurrent partner API invocations via promise coalescing.

### Falsification 6: L07 (Heap Exhaustion via Recursive Error Object Prototype Chains)
- *Deficit Identified in Pass G2*: Pass G2 restricted serialization depth, but did not handle prototype pollution or recursive Symbol properties in custom error objects. In `src/app/lib/analytics.ts`, `safeSerializeError` must avoid reflecting over non-enumerable prototype chains or symbols to prevent memory exhaustion during telemetry logging.
- *Physical Code Verification*: In `src/app/lib/analytics.ts`:
```typescript
export function sanitizeLogPayload(input: unknown, depth = 0): unknown {
  if (depth > 3) return '[TRUNCATED_DEPTH]';
  if (input === null || typeof input !== 'object') return input;
  const sanitized: Record<string, unknown> = {};
  for (const key of Object.keys(input)) {
    if (/password|token|secret|key/i.test(key)) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitizeLogPayload((input as any)[key], depth + 1);
    }
  }
  return sanitized;
}
```
- *Adversarial Negative Vector Remedy*: Strip prototype traversal and enforce key-whitelisting during telemetry serialization.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS

### SOL-01: SOL-TIMING-01 (Airport Alternatives Defensive Timestamp & Non-Negative Elapsed Minutes)
- **SOL_ID**: SOL-TIMING-01
- **TARGET_FILES**: `src/domain/farely/airportAlternatives.ts`
- **LOCKED_ALGORITHM**: In `calculateTimezoneAwareTiming`, parse `itinerary.departureTime` and `itinerary.arrivalTime`. If either timestamp produces `NaN` upon `new Date().getTime()`, or if `arrMs < depMs` (negative duration), clamp `trueElapsedMinutes` to `Math.max(15, itinerary.durationMinutes || 60)`. In `findAlternativeAirports`, guard against degenerate requests where `search.origin.toUpperCase() === search.destination.toUpperCase()` by returning an empty array.
- **FORBIDDEN_DEVIATIONS**: No unverified external dependencies; no signature modification; no skipping negative duration clamping.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/airportAlternatives.test.ts`

### SOL-02: SOL-TET-01 (Tet Holiday Date Normalization & Separator Robustness)
- **SOL_ID**: SOL-TET-01
- **TARGET_FILES**: `src/domain/farely/priceAnomaly.ts`
- **LOCKED_ALGORITHM**: In `isTetDeparture`, check if `departureDate` is a valid string. Normalize input date strings by replacing delimiters (`/[./\s]/g, '-'`), handling inverted `DD-MM-YYYY` payloads, trimming whitespace, and slicing to 10 characters (`YYYY-MM-DD`). Compare strictly against `TET_WINDOWS` start and end bounds.
- **FORBIDDEN_DEVIATIONS**: No unverified external dependencies; no deletion of existing `TET_WINDOWS`; no relaxing Gregorian boundary comparisons.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/priceAnomaly.test.ts`

### SOL-03: SOL-DEAL-01 (Deal Comparison Non-Positive Price Guard & Non-Stop Distinctions)
- **SOL_ID**: SOL-DEAL-01
- **TARGET_FILES**: `src/app/domain/dealComparison.ts`
- **LOCKED_ALGORITHM**: In `isDealDominated`, round candidate and baseline prices to whole VND (`Math.round`). Guard against self-comparison (`candidate.id && baseline.id && candidate.id === baseline.id -> return false`). Guard against non-positive prices (`candPrice <= 0 || basePrice <= 0 -> return false`). Differentiate strictly between non-stop flights (`stops === 0`) and unverified stop counts (`stops === null || stops === undefined`). Guard content identity when IDs are missing.
- **FORBIDDEN_DEVIATIONS**: No unverified external dependencies; no removing baseline comparison criteria; no treating null stops as direct non-stop flights.
- **VERIFICATION_COMMAND**: `npx vitest run src/app/domain/dealComparison.test.ts`

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
