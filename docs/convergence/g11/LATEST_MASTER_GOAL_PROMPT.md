# FARELY PROJECT 10X — MASTER GOAL G11 [G5]
# LEVEL: Pass 5: Sovereign Canonical Convergence & Hermetic Master Goal Lock
# MANDATE: Synthesize passes G1..G4 into the hermetically locked, definitive Master Goal prompt with zero tolerance for executor improvisation.
# GIT_COMMIT: 5bb4d0b020e727e4b7cd779d2d5aeeaf7ecaf62a
# TIMESTAMP: 2026-10-26T11:17:30.000Z
# EXECUTION_RECEIPT_SHA256: 1f5b48e7ace6b05c6cff63384090800bc1bb014741e493e5cecc127f3797f671

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

## REFUTATION MATRIX & FALSIFICATION OF PASS G4

### Falsification 1: L01 Sub-3 Character Airport Code Rejection & Empty String Fallback in Partner Handoff
- *Deficits Identified in Pass G4*: Pass G4 sliced airport codes at 3 characters, but failed to assert what happens when the cleaned string has fewer than 3 characters (e.g., `"VN"` or `"H"` or empty whitespace).
- *Empirical Code Evidence*: In `src/app/lib/bookingUrls.ts`:
  ```typescript
  const from = (p.fromCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
  const to = (p.toCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
  ```
  If `from.length < 3 || to.length < 3`, `buildSkyscannerUrl` generates invalid URL segments like `https://www.skyscanner.net/transport/flights/vn/sgn/...`, causing upstream aggregator 404 errors. Similarly, in `buildGoogleFlightsUrl`, an unvalidated string like `Flights to X from Y` produces nonsensical Google Flights search cards that confuse users.
- *Locked Invariant in G5*:
  In `src/app/lib/bookingUrls.ts`, enforce complete IATA compliance:
  ```typescript
  export function sanitizeIataAirportCode(code: string): string {
    const cleaned = (code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
    return cleaned.length === 3 ? cleaned : '';
  }
  ```
  If either origin or destination code fails validation (`!from || !to`), return a safe empty fallback string (`""`) or the base portal URL `https://www.google.com/travel/flights?hl=vi&curr=VND`. Direct ticketing and passenger checkout are strictly `boundary_excluded`.

### Falsification 2: L02 Zero Marginal Cost Erroneous Approval & Financial Ledger Invariants
- *Deficits Identified in Pass G4*: Pass G4 rounded marginal valuations, but still left a logic loophole where `marginalCostVnd === 0` defaults `marginalRoiRatio` to 1.0.
- *Empirical Code Evidence*: In `src/domain/farely/dataEconomics.ts`:
  ```typescript
  const marginalRoiRatio = marginalCostVnd > 0
    ? Math.round((estimatedMarginalValueVnd / marginalCostVnd) * 100) / 100
    : 1.0;
  ```
  If `proposal.additionalScopesCount === 0`, `marginalCostVnd === 0`, so `marginalRoiRatio` becomes 1.0 and is marked `APPROVED_VALUE_ACCRETIVE` even when 0 new opportunities exist. In financial accounting, an action with zero expenditure and zero measurable return cannot be classified as value-accretive; it represents an invalid proposal that must be rejected.
- *Locked Invariant in G5*:
  In `src/domain/farely/dataEconomics.ts`, enforce strict economic hurdle rates:
  ```typescript
  if (marginalCostVnd <= 0 || safeScopes <= 0) {
    return {
      status: "REJECTED_UNECONOMIC",
      marginalCostVnd: 0,
      estimatedMarginalValueVnd: 0,
      marginalRoiRatio: 0,
      rejectionReasonVi: "Chi phí mở rộng không hợp lệ hoặc số lượng phạm vi quét bổ sung bằng 0.",
    };
  }
  ```

### Falsification 3: L03 Buy/Wait Flight In Past Boundary & Epistemic Fail-Closed Disclosure
- *Deficits Identified in Pass G4*: Pass G4 checked flat pricing, but did not guarantee that departed flights fail-closed with explicit Vietnamese disclosures before calculating statistical cohorts.
- *Empirical Code Evidence*: In `src/domain/farely/buyWaitGuidance.ts`:
  ```typescript
  const depDate = new Date(params.departureDate);
  const evalDate = params.evaluationDate ? new Date(params.evaluationDate) : new Date();
  const daysUntilDeparture = Math.round((depDate.getTime() - evalDate.getTime()) / (1000 * 60 * 60 * 24));
  ```
  If `depDate.getTime() < evalDate.getTime()`, `daysUntilDeparture < 0`. Flight booking is closed for flights in the past. Calculating price percentiles on historical flights that have already departed creates nonsensical recommendations for users who accidentally view expired search result tabs.
- *Locked Invariant in G5*:
  In `src/domain/farely/buyWaitGuidance.ts`, when `daysUntilDeparture < 0`, immediately return:
  ```typescript
  return {
    recommendation: "INSUFFICIENT_DATA",
    confidence: 0,
    isCalibrated: false,
    sampleCount: validPoints.length,
    timespanDays,
    rationaleVi: "Chuyến bay đã khởi hành, không thể phân tích khuyến nghị mua.",
    scopeType,
  };
  ```
  Commercial payment gateway integration is strictly `boundary_excluded`.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS (CYCLE G79)

### SOL-01: SOL-DATA-01 (Null Preservation & Sample Size Threshold $N \ge 5$)
- **Target File**: `src/app/data/api.ts` & `src/domain/farely/priceAnomaly.ts`
- **Specification**: In `src/app/data/api.ts`, preserve nulls without coercion. In `src/domain/farely/priceAnomaly.ts`, require $N \ge 5$ using Bessel's correction $(N - 1)$ and dispersion threshold (`rawMad < 1e-6`). Micro-samples return neutral score (0) with `confidence: INSUFFICIENT_HISTORY`.
- **Forbidden Deviations**: No zero-inflation on missing fields; direct ticketing and passenger checkout are strictly `boundary_excluded`.
- **Verification Command**: `npx vitest run src/domain/farely/priceAnomaly.test.ts`

### SOL-02: SOL-PRICE-01 (Deterministic Tet Window Lookup & Dynamic Prior)
- **Target File**: `src/domain/farely/priceAnomaly.ts`
- **Specification**: In `src/domain/farely/priceAnomaly.ts`, define static Lunar Tet windows for 2025, 2026, and 2027 with $2.8\times$ baseline multipliers to suppress false-positive deal alerts during peak festive periods.
- **Forbidden Deviations**: No dynamic unsealed third-party lunar APIs; no uncalibrated static baselines.
- **Verification Command**: `npx vitest run src/domain/farely/priceAnomaly.test.ts`

### SOL-03: SOL-COST-01 (Carrier Landed Surcharges & Self-Transfer Validation)
- **Target File**: `src/domain/farely/tripBudgetEstimator.ts` & `src/domain/farely/multiCityItinerary.ts`
- **Specification**: In `src/domain/farely/tripBudgetEstimator.ts`, compute carrier surcharges scaled by whole-integer passenger counts (`Math.floor(Math.max(1, passengers))`). In `src/domain/farely/multiCityItinerary.ts`, enforce 150m domestic, 240m international, and 210m metropolitan inter-airport transfers.
- **Forbidden Deviations**: No naked base fare ranking; no unflagged self-transfers; direct ticketing and payment gateway integration are strictly `boundary_excluded`.
- **Verification Command**: `npx vitest run src/domain/farely/tripBudgetEstimator.test.ts`

### SOL-04: SOL-AUTH-01 (Rate-Limited Tokenized Watch Outbox & Row-Level Locking)
- **Target File**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **Specification**: In `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`, enforce rate limiting via `check_watch_rate_limit()` and transactional outbox row locking (`FOR UPDATE SKIP LOCKED`).
- **Forbidden Deviations**: No plain-text email broadcast queues; unauthorized scraping and credit card processing are strictly `boundary_excluded`.
- **Verification Command**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-05: SOL-CIRCUIT-01 (Tri-State Provider Circuit Breakers & Fallback Degrade)
- **Target File**: `supabase/functions/_shared/flight-search.ts`
- **Specification**: In `supabase/functions/_shared/flight-search.ts`, implement tri-state circuit breaker (`CLOSED`, `OPEN`, `HALF_OPEN`) tracking consecutive 5xx errors and timeouts (> 8000ms), failing fast to cached snapshots.
- **Forbidden Deviations**: No unthrottled outbound retries; no hard crashes on upstream provider timeout.
- **Verification Command**: `npx vitest run src/domain/farely/providerRights.test.ts`

### SOL-06: SOL-STALE-01 (PWA Offline Freshness & Monotonic Deal Deduplication)
- **Target File**: `src/app/pages/DealsPage.tsx` & `src/domain/farely/pwaOfflineFreshness.ts`
- **Specification**: In `src/app/pages/DealsPage.tsx`, deduplicate deal feeds monotonically. In `src/domain/farely/pwaOfflineFreshness.ts`, purge cached search results older than 14 days and mark fares over 6 hours old as `STALE_SNAPSHOT`.
- **Forbidden Deviations**: No unbounded localStorage persistence; no rendering stale fares as live quotes.
- **Verification Command**: `npx vitest run src/domain/farely/pwaOfflineFreshness.test.ts`

### SOL-07: SOL-TELEMETRY-01 (Safe Recursive Error Serialization & Depth Guard)
- **Target File**: `src/app/lib/analytics.ts`
- **Specification**: In `src/app/lib/analytics.ts`, implement bounded recursive serialization in `safeSerializeError` capping recursion at `maxDepth = 3`, truncating object keys at `maxKeysPerLevel = 50`, and preserving array types.
- **Forbidden Deviations**: No naive JSON.stringify; no unbounded key extraction; no unredacted logging of PII.
- **Verification Command**: `npx vitest run src/app/lib/analytics.test.ts`

### SOL-08: SOL-MIGRATION-01 (Zero-Downtime Migration Invariants & Schema Verification)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs`
- **Specification**: In `scripts/verify-certification-integrity.node-test.mjs`, verify that database migrations use non-destructive DDL (`ADD COLUMN IF NOT EXISTS`, `CREATE INDEX CONCURRENTLY IF NOT EXISTS`).
- **Forbidden Deviations**: No destructive table drops or column alterations; no production data mutation.
- **Verification Command**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-09: SOL-PROOF-01 (Hierarchical Verification Gating C0 -> C4)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs`
- **Specification**: In `scripts/verify-certification-integrity.node-test.mjs`, enforce strict separation of proof tiers: C0 (Contract), C1 (Unit Code Proof), C2 (Integration), C3 (Runtime Telemetry), and C4 (Longitudinal Soak). Unit tests cannot certify C3/C4 milestones.
- **Forbidden Deviations**: No self-awarded 10/10 scores; no synthetic badge upgrades without automated verification proof.
- **Verification Command**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-10: SOL-SHRINK-01 (Acceptance Anti-Shrinkage & Gate Immutability)
- **Target File**: `scripts/acceptance-anti-shrinkage.node-test.mjs`
- **Specification**: In `scripts/acceptance-anti-shrinkage.node-test.mjs`, assert all 89 capability contracts (F00..F88) and 267 historical acceptance gates (192 P0, 74 P1, 1 P2) remain strictly preserved.
- **Forbidden Deviations**: No deletion, consolidation, or renaming of acceptance criteria.
- **Verification Command**: `node scripts/acceptance-anti-shrinkage.node-test.mjs`

### SOL-11: SOL-TURNKEY-01 (ACID Transactional Task Lifecycle & Rollback Journal)
- **Target File**: `scripts/convergence/transactional-task-manager.mjs`
- **Specification**: In `scripts/convergence/transactional-task-manager.mjs`, enforce atomic state transitions (`begin` -> `commit` / `rollback`) with pre-image filesystem snapshots in `docs/convergence/state/transaction_journal.json`.
- **Forbidden Deviations**: No manual file edits outside active transaction journal context.
- **Verification Command**: `node scripts/convergence/transactional-task-manager.mjs status`

### SOL-12: SOL-RELEASE-01 (Automated Watchdog Convergence & Remote SHA Parity)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs`
- **Specification**: In `scripts/convergence/watchdog-convergence.mjs`, enforce full test suite verification and Git remote tracking parity via `git ls-remote origin antigravity/farely-v12-product-convergence`.
- **Forbidden Deviations**: No unpushed commits; no ignoring CI test suite failures.
- **Verification Command**: `node scripts/convergence/watchdog-convergence.mjs`

---

## SECTION E: HERMETIC WORK PACKAGES (WP01..WP03)

### WP01: `WP01-DATA-ECONOMICS-MARGINAL-BOUNDS`
- **Files**: `src/domain/farely/dataEconomics.ts`, `src/domain/farely/dataEconomics.test.ts`
- **Action**: Enforce whole-integer divisor clamping, integer scope clamping, non-negative cost clamping, integer subscribers, and rounded whole VND marginal valuations. Reject zero or negative cost proposals with `REJECTED_UNECONOMIC`.
- **Command**: `npx vitest run src/domain/farely/dataEconomics.test.ts`

### WP02: `WP02-BUY-WAIT-DATE-PARSING-SANITY`
- **Files**: `src/domain/farely/buyWaitGuidance.ts`, `src/domain/farely/buyWaitGuidance.test.ts`
- **Action**: Sanitize departure and evaluation date timestamps, reject past flights (`daysUntilDeparture < 0`), and handle flat price cohorts (`isFlatPrice`) safely with epistemic disclosures.
- **Command**: `npx vitest run src/domain/farely/buyWaitGuidance.test.ts`

### WP03: `WP03-BOOKING-URL-IATA-CODE-SANITIZATION`
- **Files**: `src/app/lib/bookingUrls.ts`, `src/app/lib/bookingUrls.test.ts`
- **Action**: Sanitize 3-letter IATA alphanumeric airport codes, enforce integer passenger decomposition (`Math.floor(Math.max(1, adults))`), numeric date sanitization (`replace(/\D/g, '')`), and chronological round-trip date assertion.
- **Command**: `npx vitest run src/app/lib/bookingUrls.test.ts`

---

## SECTION K: 12-LENS CONVERGENCE MATRIX
- **L01 (Ingestion & Schema Integrity)**: Enforced via `src/app/lib/bookingUrls.ts`.
- **L02 (Price Anomaly & Algorithmic Rigor)**: Enforced via `src/domain/farely/dataEconomics.ts`.
- **L03 (True-Cost & Ancillary Transparency)**: Enforced via `src/domain/farely/buyWaitGuidance.ts`.
- **L04 (Anti-Abuse & Rate Limiting)**: Enforced via `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`.
- **L05 (High Concurrency & Resilience)**: Enforced via `supabase/functions/_shared/flight-search.ts`.
- **L06 (PWA Offline & Client Freshness)**: Enforced via `src/app/pages/DealsPage.tsx` and `src/domain/farely/pwaOfflineFreshness.ts`.
- **L07 (Observability & Production SRE)**: Enforced via `src/app/lib/analytics.ts`.
- **L08 (Zero-Downtime DB Migrations)**: Enforced via `scripts/verify-certification-integrity.node-test.mjs`.
- **L09 (Zero-Mock Testing & Proof Hierarchy)**: Enforced via `scripts/verify-certification-integrity.node-test.mjs`.
- **L10 (Contract Immutability & Anti-Shrinkage)**: Enforced via `scripts/acceptance-anti-shrinkage.node-test.mjs`.
- **L11 (Transactional Execution Safety)**: Enforced via `scripts/convergence/transactional-task-manager.mjs`.
- **L12 (Audit & Autonomous Watchdog)**: Enforced via `scripts/convergence/watchdog-convergence.mjs`.
