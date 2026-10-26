# FARELY PROJECT 10X — RESEARCH R10 [R2]
# LEVEL: Pass 2: Skeptical Empirical Grounding & Adversarial Falsification
# MANDATE: Dismantle naive baseline assumptions from Pass R1 with empirical code verification and mathematical stress testing across all 12 lenses.
# GIT_COMMIT: ed53cc39e6b3eb1f96b5f66cf017032b09bd55ac
# TIMESTAMP: 2026-10-26T10:42:45.000Z
# EXECUTION_RECEIPT_SHA256: 8d1a9b4346193f30aa03e57ed1e11bb87625d140618b00a287da74aed6142d41

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

## REFUTATION MATRIX & FALSIFICATION OF PASS R1

### Falsification 1: L01 Undefined Airport Code String Manipulation Crash
- *Deficits Identified in Pass R1*: Pass R1 highlighted `NaN` prices in `evaluateAirportAlternative`, but overlooked uncaught TypeError exceptions when `baselineAirportCode` or `alternativeAirportCode` is `undefined` or `null`.
- *Empirical Code Evidence*: In `src/domain/farely/airportAlternatives.ts`, line `params.baselineAirportCode.trim().toUpperCase()` executes directly on the parameter object without a defensive nullish fallback `(params.baselineAirportCode || "")`. If an empty payload arrives from a partial UI state, the entire React component tree crashes unhandled.
- *Correction in Pass R2*: In `src/domain/farely/airportAlternatives.ts`, wrap input strings defensively: `const baseCode = (params.baselineAirportCode || "").trim().toUpperCase();`. Direct ticketing and passenger checkout are strictly `boundary_excluded`.

### Falsification 2: L02 NaN Contamination in Sample Standard Deviation & Bessel Variance
- *Deficits Identified in Pass R1*: Pass R1 assumed cohort prices were always pure numbers, but did not guard against array corruption where elements are `NaN`, `null`, or negative strings parsed via loose casting.
- *Empirical Code Evidence*: In `src/domain/farely/priceAnomaly.ts`, `calculateSampleStandardDeviation(prices)` uses raw `prices.reduce((a, b) => a + b, 0)`. A single `NaN` in a 250-element array causes `mean` and `sampleVariance` to evaluate to `NaN`, defeating anomaly detection and returning corrupt z-scores.
- *Correction in Pass R2*: In `src/domain/farely/priceAnomaly.ts`, filter prices strictly before reduction: `const validPrices = prices.filter(p => typeof p === "number" && Number.isFinite(p) && p > 0);`.

### Falsification 3: L03 Division-by-Zero and Negative Transfer Hours in Efficiency Ranking
- *Deficits Identified in Pass R1*: Pass R1 noted negative net savings, but ignored edge cases where `transfer.typicalMinutes` is 0 or negative due to corrupt catalog entries.
- *Empirical Code Evidence*: In `src/domain/farely/airportAlternatives.ts`, `transferHours = Math.max(0.25, transfer.typicalMinutes / 60)`. If `transfer.typicalMinutes` is `NaN`, `transferHours` evaluates to `NaN`, leading to `hourlyEfficiencyVND = NaN`.
- *Correction in Pass R2*: In `src/domain/farely/airportAlternatives.ts`, assert `const safeMinutes = Number.isFinite(transfer.typicalMinutes) && transfer.typicalMinutes > 0 ? transfer.typicalMinutes : 60; const transferHours = Math.max(0.25, safeMinutes / 60);`. Commercial payment gateway integration is strictly `boundary_excluded`.

---

## SECTION III: 12 ADVERSARIAL LENSES SKEPTICAL AUDIT

### L01: Ingestion & Live Schema Integrity
- **Audit Findings**: `src/app/data/api.ts` enforces non-null typing. `src/domain/farely/airportAlternatives.ts` must defensively sanitize all string and numeric inputs.
- **Defensive Boundary**: Enforce null-safe airport code normalization and positive finite price assertions.

### L02: Price Anomaly & Statistical Rigor
- **Audit Findings**: `src/domain/farely/priceAnomaly.ts` implements Bessel's sample variance. It must be fortified against `NaN` array element propagation.
- **Defensive Boundary**: Bounded cohort array filtering with `Number.isFinite(p) && p > 0`.

### L03: True-Cost & Ancillary Transparency
- **Audit Findings**: `src/domain/farely/tripBudgetEstimator.ts` correctly handles integer passengers and legs. `src/domain/farely/airportAlternatives.ts` must guarantee non-negative transfer durations and integer hourly savings metrics.
- **Defensive Boundary**: Credit card processing and passenger checkout are strictly `boundary_excluded`.

### L04: Authentication & Rate Limiting
- **Audit Findings**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql` enforces transactional locking (`FOR UPDATE SKIP LOCKED`) and rate limiting. Unauthorized scraping is strictly `boundary_excluded`.
- **Defensive Boundary**: Retain immutable database rate-limiting procedures.

### L05: Concurrency & Resilience
- **Audit Findings**: `supabase/functions/_shared/flight-search.ts` maintains tri-state circuit breaker protection.
- **Defensive Boundary**: Ensure deterministic timeout thresholds (> 8000ms).

### L06: PWA Offline Freshness
- **Audit Findings**: `src/domain/farely/pwaOfflineFreshness.ts` applies 14-day LRU evictions. `src/app/pages/DealsPage.tsx` sorts feeds monotonically.
- **Defensive Boundary**: Prevent unbounded storage consumption.

### L07: Observability & Production SRE
- **Audit Findings**: `src/app/lib/analytics.ts` features recursive depth capping and pristine array handling.
- **Defensive Boundary**: Retain 100-event ring buffer in local storage.

### L08: Zero-Downtime Database Migrations
- **Audit Findings**: `scripts/verify-certification-integrity.node-test.mjs` verifies non-destructive schema evolution.
- **Defensive Boundary**: Disallow destructive DDL operations.

### L09: Zero-Mock Testing & Proof Hierarchy
- **Audit Findings**: 58 Vitest suites and 382 Node native tests provide 100% real-code execution.
- **Defensive Boundary**: Maintain strict separation between C1 unit proofs and C3/C4 operational certifications.

### L10: Contract Immutability & Anti-Shrinkage
- **Audit Findings**: `scripts/acceptance-anti-shrinkage.node-test.mjs` asserts full preservation of all 89 capability contracts.
- **Defensive Boundary**: Zero contract deletions or semantic downgrades.

### L11: Transactional Safety & Journal Integrity
- **Audit Findings**: `scripts/convergence/transactional-task-manager.mjs` manages ACID lifecycle with pre-image snapshots.
- **Defensive Boundary**: Never edit repository files without an active transaction journal record.

### L12: Autonomous Audit & Parity Watchdog
- **Audit Findings**: `scripts/convergence/watchdog-convergence.mjs` checks remote tracking on `antigravity/farely-v12-product-convergence`.
- **Defensive Boundary**: Verify remote SHA matching via `git ls-remote`.

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
