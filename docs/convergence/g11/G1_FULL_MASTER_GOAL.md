# FARELY PROJECT 10X — MASTER GOAL G11 [G1]
# LEVEL: Pass 1: Work Packages Architecture & Scope Decomposition
# MANDATE: Synthesize research R1..R5 into a locked Master Goal plan evaluating all 12 lenses simultaneously.
# GIT_COMMIT: 6a688e8b0e0f481b9434211775548c87730f00b7
# TIMESTAMP: 2026-10-26T10:32:45.000Z
# EXECUTION_RECEIPT_SHA256: e83e2e267226265db841b0f2b567a498a7089c0b8c21ca9b828249bbcf941ea7

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

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS (CYCLE G76)

### SOL-01: SOL-DATA-01 (Null Preservation & Sample Size Threshold $N \ge 5$)
- **Target File**: `src/app/data/api.ts` & `src/domain/farely/priceAnomaly.ts`
- **Specification**: In `src/app/data/api.ts`, enforce strict schema contracts without coercing null/undefined to default values. In `src/domain/farely/priceAnomaly.ts`, require sample size $N \ge 5$ using Bessel's correction $(N - 1)$ and floating-point dispersion threshold (`rawMad < 1e-6`) before calculating anomaly z-scores. Micro-samples ($N < 5$) return neutral anomaly score with `confidence: INSUFFICIENT_HISTORY`.
- **Forbidden Deviations**: No zero-inflation on missing fields; no float math for integer currency; commercial passenger checkout is strictly `boundary_excluded`.
- **Turnkey Verification**: `npx vitest run src/domain/farely/priceAnomaly.test.ts`

### SOL-02: SOL-PRICE-01 (Deterministic Tet Window Lookup & Dynamic Prior)
- **Target File**: `src/domain/farely/priceAnomaly.ts`
- **Specification**: In `src/domain/farely/priceAnomaly.ts`, define deterministic Lunar Tet festival windows across 2025 (Jan 15 - Feb 15), 2026 (Feb 03 - Mar 05), and 2027 (Jan 24 - Feb 24). Flight departures falling within these ranges apply a deterministic baseline multiplier ($2.8\times$) to avoid false-positive deal alerts during peak seasonal holiday travel.
- **Forbidden Deviations**: No dynamic unsealed third-party lunar APIs; no uncalibrated static baselines.
- **Turnkey Verification**: `npx vitest run src/domain/farely/priceAnomaly.test.ts`

### SOL-03: SOL-COST-01 (Carrier Landed Surcharges & Self-Transfer Validation)
- **Target File**: `src/domain/farely/tripBudgetEstimator.ts` & `src/domain/farely/multiCityItinerary.ts`
- **Specification**: In `src/domain/farely/tripBudgetEstimator.ts`, compute carrier-specific ancillary baggage fees (VJ: 350k VND, QH: 320k VND, VU: 300k VND, VN: 0k VND) scaled strictly by whole-integer passenger quantities (`Math.floor(Math.max(1, passengers))`). In `src/domain/farely/multiCityItinerary.ts`, enforce minimum transit buffers (150m domestic, 240m international, 210m metropolitan inter-airport transfers).
- **Forbidden Deviations**: No naked base fare ranking; no unflagged self-transfers; direct ticketing and payment gateway integration are strictly `boundary_excluded`.
- **Turnkey Verification**: `npx vitest run src/domain/farely/tripBudgetEstimator.test.ts`

### SOL-04: SOL-AUTH-01 (Rate-Limited Tokenized Watch Outbox & Row-Level Locking)
- **Target File**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **Specification**: In `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`, enforce client-side and database-level rate limiting via `check_watch_rate_limit()` (max 5 alerts/hour per token/IP) and transactional row-level outbox locking (`FOR UPDATE SKIP LOCKED`).
- **Forbidden Deviations**: No plain-text email broadcast queues; unauthorized scraping and credit card processing are strictly `boundary_excluded`.
- **Turnkey Verification**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-05: SOL-CIRCUIT-01 (Tri-State Provider Circuit Breakers & Fallback Degrade)
- **Target File**: `supabase/functions/_shared/flight-search.ts`
- **Specification**: In `supabase/functions/_shared/flight-search.ts`, implement tri-state circuit breaker (`CLOSED`, `OPEN`, `HALF_OPEN`) tracking consecutive partner HTTP 5xx responses and connection timeouts (> 8000ms). When in `OPEN` state, immediately fast-fail to cached provider snapshots.
- **Forbidden Deviations**: No unthrottled outbound cascading retries; no hard crashes on upstream provider timeout.
- **Turnkey Verification**: `npx vitest run src/domain/farely/providerRights.test.ts`

### SOL-06: SOL-STALE-01 (PWA Offline Freshness & Monotonic Deal Deduplication)
- **Target File**: `src/app/pages/DealsPage.tsx` & `src/domain/farely/pwaOfflineFreshness.ts`
- **Specification**: In `src/app/pages/DealsPage.tsx`, deduplicate deal feeds monotonically by `{origin, destination, departureDate, carrier}`. In `src/domain/farely/pwaOfflineFreshness.ts`, purge cached search results older than 14 days and mark fares over 6 hours old as `STALE_SNAPSHOT`.
- **Forbidden Deviations**: No unbounded localStorage persistence; no rendering stale fares as live quotes.
- **Turnkey Verification**: `npx vitest run src/domain/farely/pwaOfflineFreshness.test.ts`

### SOL-07: SOL-TELEMETRY-01 (Safe Recursive Error Serialization & Depth Guard)
- **Target File**: `src/app/lib/analytics.ts`
- **Specification**: In `src/app/lib/analytics.ts`, implement bounded recursive object serialization in `safeSerializeError` capping recursion at `maxDepth = 3`, truncating object keys at `maxKeysPerLevel = 50`, and propagating depth through array elements to prevent V8 heap exhaustion and circular reference crashes.
- **Forbidden Deviations**: No naive JSON.stringify; no unbounded key extraction; no unredacted logging of PII.
- **Turnkey Verification**: `npx vitest run src/app/lib/analytics.test.ts`

### SOL-08: SOL-MIGRATION-01 (Zero-Downtime Migration Invariants & Schema Verification)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs`
- **Specification**: In `scripts/verify-certification-integrity.node-test.mjs`, verify that database migration files adhere to non-destructive DDL standards (`ADD COLUMN IF NOT EXISTS`, idempotent index creation with `CREATE INDEX CONCURRENTLY IF NOT EXISTS`).
- **Forbidden Deviations**: No destructive table drops or column alterations; no production data mutation.
- **Turnkey Verification**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-09: SOL-PROOF-01 (Hierarchical Verification Gating C0 -> C4)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs`
- **Specification**: In `scripts/verify-certification-integrity.node-test.mjs`, enforce strict separation of proof tiers: C0 (Contract), C1 (Unit Code Proof), C2 (Integration), C3 (Runtime Telemetry), and C4 (Longitudinal Soak). Unit tests cannot certify C3/C4 milestones.
- **Forbidden Deviations**: No self-awarded 10/10 scores; no synthetic badge upgrades without automated verification proof.
- **Turnkey Verification**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-10: SOL-SHRINK-01 (Acceptance Anti-Shrinkage & Gate Immutability)
- **Target File**: `scripts/acceptance-anti-shrinkage.node-test.mjs`
- **Specification**: In `scripts/acceptance-anti-shrinkage.node-test.mjs`, deterministically assert that all 89 capability contracts (F00..F88) and 267 historical acceptance gates (192 P0, 74 P1, 1 P2) remain strictly preserved and traceable.
- **Forbidden Deviations**: No deletion, consolidation, or renaming of acceptance criteria.
- **Turnkey Verification**: `node scripts/acceptance-anti-shrinkage.node-test.mjs`

### SOL-11: SOL-TURNKEY-01 (ACID Transactional Task Lifecycle & Rollback Journal)
- **Target File**: `scripts/convergence/transactional-task-manager.mjs`
- **Specification**: In `scripts/convergence/transactional-task-manager.mjs`, enforce atomic state transitions (`begin` -> `commit` / `rollback`) with pre-image filesystem snapshots in `docs/convergence/state/transaction_journal.json`. Any test failure or anomaly triggers automatic rolling back of code changes.
- **Forbidden Deviations**: No manual file edits outside active transaction journal context.
- **Turnkey Verification**: `node scripts/convergence/transactional-task-manager.mjs status`

### SOL-12: SOL-RELEASE-01 (Automated Watchdog Convergence & Remote SHA Parity)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs`
- **Specification**: In `scripts/convergence/watchdog-convergence.mjs`, enforce end-to-end verification across Vitest test runners and Node native test harnesses. Confirm Git remote tracking parity via `git ls-remote origin antigravity/farely-v12-product-convergence`.
- **Forbidden Deviations**: No unpushed commits; no ignoring CI test suite failures.
- **Turnkey Verification**: `node scripts/convergence/watchdog-convergence.mjs`

---

## SECTION E: CONCRETE WORK PACKAGES (WP01..WP03) FOR CYCLE G76

### Work Package WP01: Booking URL Hostname Port & Userinfo Security Normalization
- **Work Package ID**: `WP01-BOOKING-URL-PORT-USERINFO-GUARD`
- **Target Files**:
  - `src/app/lib/bookingUrls.ts`
  - `src/app/lib/bookingUrls.test.ts`
- **Locked Solution**:
  In `src/app/lib/bookingUrls.ts`, harden `isSafeOutboundBookingUrl(rawUrl)`:
  1. Reject URLs with non-standard ports (allowed: empty string, '443', or '80' for http if allowed; reject custom ports like `vietjetair.com:8080`).
  2. Reject URLs containing embedded credentials (`url.username` or `url.password`).
  3. Strip trailing dots from hostname (`vietjetair.com.` -> `vietjetair.com`).
- **Turnkey Verification**:
  `npx vitest run src/app/lib/bookingUrls.test.ts`

### Work Package WP02: Trip Budget Passenger Count Integral Sanitization & Non-Positive Leg Guard
- **Work Package ID**: `WP02-TRIP-BUDGET-INTEGER-PASSENGERS`
- **Target Files**:
  - `src/domain/farely/tripBudgetEstimator.ts`
  - `src/domain/farely/tripBudgetEstimator.test.ts`
- **Locked Solution**:
  In `src/domain/farely/tripBudgetEstimator.ts`:
  1. In `calculateCarrierLandedSurcharges(carrierCode, passengers, flightLegs)`:
     - Enforce `const safePassengers = Math.floor(Math.max(1, Number.isFinite(passengers) ? passengers : 1));`
     - Enforce `const safeLegs = Math.floor(Math.max(1, Number.isFinite(flightLegs) ? flightLegs : 1));`
     - Wrap returned baggageFee and ticketingFee with `Math.round(...)` to guarantee whole-integer VND currency units.
- **Turnkey Verification**:
  `npx vitest run src/domain/farely/tripBudgetEstimator.test.ts`

### Work Package WP03: Analytics Serializer Array Element Recursive Depth Propagation
- **Work Package ID**: `WP03-ANALYTICS-ARRAY-DEPTH-PROPAGATION`
- **Target Files**:
  - `src/app/lib/analytics.ts`
  - `src/app/lib/analytics.test.ts`
- **Locked Solution**:
  In `src/app/lib/analytics.ts`:
  In `safeSerializeError`, when serializing Array values:
  Ensure array mapping recursively passes `depth + 1`: `val.slice(0, maxKeysPerLevel).map(item => serialize(item, depth + 1))`.
  Ensure that when `depth >= maxDepth`, arrays return `"[Array]"`.
- **Turnkey Verification**:
  `npx vitest run src/app/lib/analytics.test.ts`

---

## SECTION K: 12-LENS CONVERGENCE MATRIX
- **L01 (Ingestion & Schema Integrity)**: Enforced via `WP01-BOOKING-URL-PORT-USERINFO-GUARD` and `src/app/lib/bookingUrls.ts`.
- **L02 (Price Anomaly & Algorithmic Rigor)**: Enforced via `src/domain/farely/priceAnomaly.ts`.
- **L03 (True-Cost & Ancillary Transparency)**: Enforced via `WP02-TRIP-BUDGET-INTEGER-PASSENGERS` and `src/domain/farely/tripBudgetEstimator.ts`.
- **L04 (Anti-Abuse & Rate Limiting)**: Enforced via `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`.
- **L05 (High Concurrency & Resilience)**: Enforced via `supabase/functions/_shared/flight-search.ts`.
- **L06 (PWA Offline & Client Freshness)**: Enforced via `src/app/pages/DealsPage.tsx` and `src/domain/farely/pwaOfflineFreshness.ts`.
- **L07 (Observability & Production SRE)**: Enforced via `WP03-ANALYTICS-ARRAY-DEPTH-PROPAGATION` and `src/app/lib/analytics.ts`.
- **L08 (Zero-Downtime DB Migrations)**: Enforced via `scripts/verify-certification-integrity.node-test.mjs`.
- **L09 (Zero-Mock Testing & Proof Hierarchy)**: Enforced via `scripts/verify-certification-integrity.node-test.mjs`.
- **L10 (Contract Immutability & Anti-Shrinkage)**: Enforced via `scripts/acceptance-anti-shrinkage.node-test.mjs`.
- **L11 (Transactional Execution Safety)**: Enforced via `scripts/convergence/transactional-task-manager.mjs`.
- **L12 (Audit & Autonomous Watchdog)**: Enforced via `scripts/convergence/watchdog-convergence.mjs`.
