# FARELY PROJECT 10X — RESEARCH R10 [R1]
# LEVEL: Pass 1: Full-Battery Baseline Synthesis & Scope Decomposition
# MANDATE: Draft complete deliverable evaluating all 12 lenses simultaneously from current system knowledge and founder scope.
# GIT_COMMIT: 284631b78ca1ecefc90d9a10821cd8d216c55c39
# TIMESTAMP: 2026-10-26T11:23:00.000Z
# EXECUTION_RECEIPT_SHA256: be5149febde42d540bdab35ce3862526e68383412a670a6a2951dfaf6a44fd6a

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

## SECTION III: 12 ADVERSARIAL LENSES DEEP AUDIT (CYCLE G80)

### L01: Data Ingestion & Live Schema Integrity
- **Current Ground Truth**: `src/domain/farely/airportAlternatives.ts` implements airport alternatives and timezone-aware flight timing.
- **Vulnerability Discovered**: In `calculateTimezoneAwareTiming`, local date/time strings are split naively with `datePart.split('-').map(Number)`. If input contains unparseable formatting or slashes, `depParts.year`, `month`, or `day` evaluates to `NaN`, resulting in `depUtcTime = NaN` and `trueElapsedMinutes = NaN`.
- **Defensive Target**: Add defensive date parsing and validation in `calculateTimezoneAwareTiming`: verify `Number.isFinite(trueElapsedMinutes)` and clamp negative flight times to 0 with chronological inconsistency warnings. Direct ticketing and passenger checkout are strictly `boundary_excluded`.

### L02: Price Anomaly Detection & Statistical Rigor
- **Current Ground Truth**: `src/domain/farely/priceAnomaly.ts` defines static Lunar Tet windows for 2025–2027 to suppress false deal alerts during holiday price surges.
- **Vulnerability Discovered**: In `isTetDeparture`, `departureDate.slice(0, 10)` is compared lexicographically against `w.start` (format `YYYY-MM-DD`). If caller provides slash separators (`"2026/02/10"`), the comparison fails silently, causing peak Tet fares to be misclassified as anomalies.
- **Defensive Target**: Normalize date separators: `const dateStr = (departureDate || "").replace(/\//g, "-").slice(0, 10)`.

### L03: True Landed Cost Monotonicity & Ancillary Transparency
- **Current Ground Truth**: `src/app/domain/dealComparison.ts` compares deal options and identifies Pareto-dominated alternatives.
- **Vulnerability Discovered**: In `compareDeals`, if a deal has `price <= 0` or non-finite price, it participates in dominance calculations, distorting price rankings.
- **Defensive Target**: Add price positivity validation and flag non-positive prices under `unverifiedFields: ["Giá vé không hợp lệ"]`. Commercial payment gateway integration is strictly `boundary_excluded`.

### L04: Authentication, Access Control & Anti-Abuse
- **Current Ground Truth**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql` enforces tokenized watch creation, rate limiting (`check_watch_rate_limit`), and row-level locking (`FOR UPDATE SKIP LOCKED`).
- **Defensive Target**: Maintain transactional integrity and token validation. Credit card processing and unauthorized scraping are strictly `boundary_excluded`.

### L05: Concurrency, Contention & System Resilience
- **Current Ground Truth**: `supabase/functions/_shared/flight-search.ts` implements tri-state circuit breaker protection (`CLOSED`, `OPEN`, `HALF_OPEN`) and timeout boundaries (> 8000ms).
- **Defensive Target**: Preserve cached fallback degradation during partner API downtimes.

### L06: PWA Offline-First & Client State Freshness
- **Current Ground Truth**: `src/domain/farely/pwaOfflineFreshness.ts` enforces 14-day LRU cache eviction and price non-negativity checks. Monotonic sorting is enforced in `src/app/pages/DealsPage.tsx`.
- **Defensive Target**: Maintain strict local cache bounds without exceeding browser storage quotas.

### L07: Observability, SRE & Diagnostic Transparency
- **Current Ground Truth**: `src/app/lib/analytics.ts` features circular-reference-tolerant error logging with `safeSerializeError`, recursion depth capping (`maxDepth = 3`), key count bounding (`maxKeysPerLevel = 50`), and array depth propagation.
- **Defensive Target**: Retain WeakSet circular object termination and bounded local event buffers.

### L08: Zero-Downtime Database Evolution
- **Current Ground Truth**: `scripts/verify-certification-integrity.node-test.mjs` validates non-destructive schema standards across Supabase migrations.
- **Defensive Target**: Enforce `ADD COLUMN IF NOT EXISTS` and concurrent idempotent indexing without table drops.

### L09: Zero-Mock Testing & Proof Hierarchy
- **Current Ground Truth**: Vitest test runner (58 test suites) and Node native test runner (382 tests) execute pure domain tests without mock stubs.
- **Defensive Target**: Maintain the strict separation of proof tiers (C0 Contract -> C1 Unit -> C2 Integration -> C3 Runtime -> C4 Longitudinal Soak).

### L10: Non-Contract Shrinkage & Requirement Traceability
- **Current Ground Truth**: `scripts/acceptance-anti-shrinkage.node-test.mjs` verifies all 89 capability contracts (F00..F88) and 267 acceptance gates.
- **Defensive Target**: Forbid any contraction or renaming of foundational capabilities.

### L11: Transactional Execution Safety & Rollback Hardening
- **Current Ground Truth**: `scripts/convergence/transactional-task-manager.mjs` tracks task state transitions (`begin` -> `commit` / `rollback`) in `docs/convergence/state/transaction_journal.json`.
- **Defensive Target**: Retain filesystem pre-image rollback protection for all code modifications.

### L12: Continuous Autonomous Audit & Watchdog Parity
- **Current Ground Truth**: `scripts/convergence/watchdog-convergence.mjs` validates test passes and remote git parity on feature branch `antigravity/farely-v12-product-convergence`.
- **Defensive Target**: Enforce commit verification via `git ls-remote` on every convergence milestone.

---

## SECTION IV: LOCKED SOLUTIONS CAGE (SOL-01..SOL-12)

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
