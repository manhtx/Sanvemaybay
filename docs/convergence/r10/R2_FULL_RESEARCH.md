# FARELY PROJECT 10X — RESEARCH R10 [R2]
# LEVEL: Pass 2: Skeptical Empirical Grounding & Adversarial Falsification
# MANDATE: Dismantle naive baseline assumptions from Pass R1 with empirical code verification and mathematical stress testing across all 12 lenses.
# GIT_COMMIT: e96cfffbc0664f2c50fdc2aab7402aa936285022
# TIMESTAMP: 2026-10-26T10:54:15.000Z
# EXECUTION_RECEIPT_SHA256: 5b111a7169abc6ae778ffe2e481b439f837a060e1e1beac660c26a8b6cf64fb6

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

### Falsification 1: L01 Slice Index Collision & Unstable Sort in Multi-City Slices
- *Deficits Identified in Pass R1*: Pass R1 highlighted non-positive slice prices, but overlooked collisions where two slices in `slices` share the identical `sliceIndex` (e.g. two legs both indexed as `0`).
- *Empirical Code Evidence*: In `src/domain/farely/multiCityItinerary.ts`, sorting slices via `[...params.slices].sort((a, b) => a.sliceIndex - b.sliceIndex)` produces non-deterministic leg sequences when `a.sliceIndex === b.sliceIndex`. Chronological date comparison then checks arbitrary slices, triggering spurious `InvalidMultiCitySequenceError` exceptions.
- *Correction in Pass R2*: In `src/domain/farely/multiCityItinerary.ts`, assert duplicate slice index detection or secondary sort tie-breaking by `departDate`: `sort((a, b) => a.sliceIndex - b.sliceIndex || a.departDate.localeCompare(b.departDate));`. Direct ticketing and passenger checkout are strictly `boundary_excluded`.

### Falsification 2: L02 Provider Registry Key Casing Mismatch in B2B Scope Validation
- *Deficits Identified in Pass R1*: Pass R1 trimmed whitespace, but did not enforce lowercasing on input `providerIds` when querying `PROVIDER_SOURCE_RIGHTS_REGISTRY`.
- *Empirical Code Evidence*: In `src/domain/farely/providerRights.ts`, registry keys are lowercase snake_case (e.g. `vietjet_direct`, `travelpayouts_flight_data`). If a caller passes `"VIETJET_DIRECT"`, `getProviderSourceRights("VIETJET_DIRECT")` returns `undefined`, incorrectly placing an authorized provider into the `denied` array.
- *Correction in Pass R2*: In `src/domain/farely/providerRights.ts`, normalize IDs with `.toLowerCase()`: `const cleanId = (id || "").trim().toLowerCase();`.

### Falsification 3: L03 IEEE 754 Non-Finite and Negative Zero in Offline Fares
- *Deficits Identified in Pass R1*: Pass R1 checked `priceVND <= 0`, but did not assert that `Number.isFinite(deal.priceVND)` must precede comparison to catch `Infinity` and `NaN`.
- *Empirical Code Evidence*: In `src/domain/farely/pwaOfflineFreshness.ts`, if `deal.priceVND` is `Infinity`, `deal.priceVND <= 0` evaluates to `false`, allowing infinite price observations to slip through to the user interface.
- *Correction in Pass R2*: In `src/domain/farely/pwaOfflineFreshness.ts`, enforce `const isPriceValid = Number.isFinite(deal.priceVND) && deal.priceVND > 0; if (!isPriceValid) ...`. Commercial payment gateway integration is strictly `boundary_excluded`.

---

## SECTION III: 12 ADVERSARIAL LENSES SKEPTICAL AUDIT

### L01: Ingestion & Live Schema Integrity
- **Audit Findings**: Multi-city slice validation in `src/domain/farely/multiCityItinerary.ts` must defensively sort slices by index and departure date, sanitizing slice pricing and carrier codes.
- **Defensive Boundary**: Slices with invalid pricing or colliding indices are handled deterministically without sequence corruption.

### L02: Price Anomaly & Statistical Rigor
- **Audit Findings**: B2B provider scope validation in `src/domain/farely/providerRights.ts` requires case-insensitive and whitespace-trimmed registry lookup.
- **Defensive Boundary**: Normalization prevents spurious denial of legitimate provider syndication claims.

### L03: True-Cost & Ancillary Transparency
- **Audit Findings**: Offline deal freshness in `src/domain/farely/pwaOfflineFreshness.ts` must validate that cached fares contain strictly positive finite prices.
- **Defensive Boundary**: Non-finite and negative prices are flagged as unverified offline anomalies. Credit card processing and passenger checkout are strictly `boundary_excluded`.

### L04: Authentication & Rate Limiting
- **Audit Findings**: Database rate-limiting triggers in `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql` protect notification pipelines.
- **Defensive Boundary**: Enforce row-level locking via `FOR UPDATE SKIP LOCKED`. Unauthorized scraping is strictly `boundary_excluded`.

### L05: Concurrency & Resilience
- **Audit Findings**: Tri-state circuit breaker logic in `supabase/functions/_shared/flight-search.ts` isolates downstream microservices.
- **Defensive Boundary**: Bounded partner timeouts prevent thread pool depletion.

### L06: PWA Offline Freshness
- **Audit Findings**: Client storage retention policies in `src/domain/farely/pwaOfflineFreshness.ts` enforce 14-day LRU evictions.
- **Defensive Boundary**: Monotonic sorting in `src/app/pages/DealsPage.tsx` prevents stale quote rendering.

### L07: Observability & Production SRE
- **Audit Findings**: `src/app/lib/analytics.ts` isolates complex object graphs and arrays with recursion guards.
- **Defensive Boundary**: Capped error serialization prevents memory leaks in high-throughput production environments.

### L08: Zero-Downtime Database Migrations
- **Audit Findings**: Idempotent DDL scripts in `scripts/verify-certification-integrity.node-test.mjs`.
- **Defensive Boundary**: Strict rejection of non-concurrent index creation and destructive column removals.

### L09: Zero-Mock Testing & Proof Hierarchy
- **Audit Findings**: Full regression harness across Vitest and Node native runners.
- **Defensive Boundary**: No synthetic mocks in domain logic; strict preservation of proof tiers (C0 -> C4).

### L10: Contract Immutability & Anti-Shrinkage
- **Audit Findings**: Verification of 89 capability contracts in `scripts/acceptance-anti-shrinkage.node-test.mjs`.
- **Defensive Boundary**: Total preservation of all 267 historical acceptance gates.

### L11: Transactional Safety & Journal Integrity
- **Audit Findings**: ACID state lifecycle in `scripts/convergence/transactional-task-manager.mjs`.
- **Defensive Boundary**: Mandatory task recording in `docs/convergence/state/transaction_journal.json`.

### L12: Autonomous Audit & Parity Watchdog
- **Audit Findings**: Autonomous git verification in `scripts/convergence/watchdog-convergence.mjs`.
- **Defensive Boundary**: Remote tracking parity on `antigravity/farely-v12-product-convergence`.

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
