# FARELY PROJECT 10X — MASTER GOAL G11 [G4]
# LEVEL: Pass 4: Strict Topological Dependency DAG & Execution Order Invariants
# MANDATE: Define deterministic execution order, dependency graph, and atomic transaction rollback boundaries.
# GIT_COMMIT: 6a688e8b0e0f481b9434211775548c87730f00b7
# TIMESTAMP: 2026-10-26T10:37:05.000Z
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

## REFUTATION MATRIX & FALSIFICATION OF PASS G3

### Falsification 1: L01 Premature Execution Without Task Journal Cleanliness Check
- *Deficits Identified in Pass G3*: Pass G3 established test assertions for booking URLs, but did not enforce transaction isolation preconditions. If prior transactions in `transaction_journal.json` are uncommitted or corrupted, starting WP01 without journal sanitization causes inconsistent git index snapshots.
- *Empirical Code Evidence*: In `scripts/convergence/transactional-task-manager.mjs`, calling `begin` when another task is active throws an unhandled error.
- *DAG Invariant in G4*: Task WP01 must strictly depend on a clean transaction journal verification step (`node scripts/convergence/transactional-task-manager.mjs status`).

### Falsification 2: L03 Surcharge Regression Risk on Existing Multi-City Tests
- *Deficits Identified in Pass G3*: Pass G3 specified unit tests for `calculateCarrierLandedSurcharges`, but did not sequence execution before or after multi-city transit tests. Since `multiCityItinerary.ts` imports from `tripBudgetEstimator.ts` indirectly or interacts with budget estimators, modifying `tripBudgetEstimator.ts` must precede full regression verification.
- *Empirical Code Evidence*: If `calculateCarrierLandedSurcharges` alters export signatures unexpectedly, downstream modules could experience type breakage if not strictly isolated in topological order.
- *DAG Invariant in G4*: WP02 must execute in an isolated ACID transaction after WP01 commit, and verify both `tripBudgetEstimator.test.ts` and `multiCityItinerary.test.ts`.

### Falsification 3: L07 Global Analytics Error Handling Cascading Breakage
- *Deficits Identified in Pass G3*: Pass G3 isolated array recursion in `safeSerializeError`, but did not order its deployment after domain model updates. If logging in domain tests triggers `safeSerializeError` while it is in an uncommitted dirty state, all subsequent test runs fail with mysterious syntax errors.
- *Empirical Code Evidence*: `analytics.ts` is imported by UI and instrumentation scripts; editing it during active domain modifications risks cascading compilation failures.
- *DAG Invariant in G4*: WP03 is the terminal code package in the topological DAG, followed by full 58-suite vitest regression and node native verification.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS (CYCLE G76)

### SOL-01: SOL-DATA-01 (Null Preservation & Sample Size Threshold $N \ge 5$)
- **Target File**: `src/app/data/api.ts` & `src/domain/farely/priceAnomaly.ts`
- **Specification**: In `src/app/data/api.ts`, preserve nulls without coercion. In `src/domain/farely/priceAnomaly.ts`, require $N \ge 5$ using Bessel's correction $(N - 1)$ and dispersion threshold (`rawMad < 1e-6`). Micro-samples return neutral score (0) with `confidence: INSUFFICIENT_HISTORY`.
- **Forbidden Deviations**: No zero-inflation on missing fields; no float math for integer currency; commercial passenger checkout is strictly `boundary_excluded`.
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

## SECTION E: STRICT TOPOLOGICAL DEPENDENCY DAG

```mermaid
flowchart TD
  PRE["Pre-Condition: Transaction Journal Idle & Clean"] --> WP01["WP01: URL Port & Userinfo Security Normalization (src/app/lib/bookingUrls.ts)"]
  WP01 --> V01["Verify WP01: npx vitest run src/app/lib/bookingUrls.test.ts"]
  V01 --> C01["Commit WP01 Transaction"]
  
  C01 --> WP02["WP02: Trip Budget Passenger Integral Sanitization (src/domain/farely/tripBudgetEstimator.ts)"]
  WP02 --> V02["Verify WP02: npx vitest run src/domain/farely/tripBudgetEstimator.test.ts"]
  V02 --> C02["Commit WP02 Transaction"]
  
  C02 --> WP03["WP03: Analytics Serializer Array Element Depth Propagation (src/app/lib/analytics.ts)"]
  WP03 --> V03["Verify WP03: npx vitest run src/app/lib/analytics.test.ts"]
  V03 --> C03["Commit WP03 Transaction"]
  
  C03 --> FULL_REG["Full Regression: npm test (58 Vitest Suites + 382 Node Native Tests)"]
  FULL_REG --> GIT_PUSH["Git Commit & Remote Push to antigravity/farely-v12-product-convergence"]
  GIT_PUSH --> PARITY["Remote Parity Check via git ls-remote"]
  PARITY --> DONE["Cycle G76 Complete"]
```

---

## SECTION K: 12-LENS CONVERGENCE MATRIX
- **L01 (Ingestion & Schema Integrity)**: Enforced via `WP01-BOOKING-URL-PORT-USERINFO-GUARD` in `src/app/lib/bookingUrls.ts`.
- **L02 (Price Anomaly & Algorithmic Rigor)**: Enforced via `src/domain/farely/priceAnomaly.ts`.
- **L03 (True-Cost & Ancillary Transparency)**: Enforced via `WP02-TRIP-BUDGET-INTEGER-PASSENGERS` in `src/domain/farely/tripBudgetEstimator.ts`.
- **L04 (Anti-Abuse & Rate Limiting)**: Enforced via `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`.
- **L05 (High Concurrency & Resilience)**: Enforced via `supabase/functions/_shared/flight-search.ts`.
- **L06 (PWA Offline & Client Freshness)**: Enforced via `src/app/pages/DealsPage.tsx` and `src/domain/farely/pwaOfflineFreshness.ts`.
- **L07 (Observability & Production SRE)**: Enforced via `WP03-ANALYTICS-ARRAY-DEPTH-PROPAGATION` in `src/app/lib/analytics.ts`.
- **L08 (Zero-Downtime DB Migrations)**: Enforced via `scripts/verify-certification-integrity.node-test.mjs`.
- **L09 (Zero-Mock Testing & Proof Hierarchy)**: Enforced via `scripts/verify-certification-integrity.node-test.mjs`.
- **L10 (Contract Immutability & Anti-Shrinkage)**: Enforced via `scripts/acceptance-anti-shrinkage.node-test.mjs`.
- **L11 (Transactional Execution Safety)**: Enforced via `scripts/convergence/transactional-task-manager.mjs`.
- **L12 (Audit & Autonomous Watchdog)**: Enforced via `scripts/convergence/watchdog-convergence.mjs`.
