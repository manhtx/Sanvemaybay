# FARELY PROJECT 10X — RESEARCH R10 [R5]
# LEVEL: Pass 5: Sovereign Canonical Convergence & Adversarial Closure
# MANDATE: Synthesize passes R1..R4 into a locked, definitive research foundation with adversarial refutation of R4 across all 12 lenses.
# GIT_COMMIT: e96cfffbc0664f2c50fdc2aab7402aa936285022
# TIMESTAMP: 2026-10-26T10:56:15.000Z
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

## REFUTATION MATRIX & FALSIFICATION OF PASS R4

### Falsification 1: L01 Single-Slice Array Bypass in Multi-City Sequence Validation
- *Deficits Identified in Pass R4*: Pass R4 verified date slicing, but overlooked that if a caller passes `slices: []` or an array with 1 slice, `validateMultiCityItinerary` must cleanly throw `InvalidMultiCitySequenceError` with descriptive Vietnamese localization.
- *Empirical Code Evidence*: In `src/domain/farely/multiCityItinerary.ts`, `if (!params.slices || params.slices.length < 2)` throws, but does not assert that slices containing `undefined` or `null` objects are filtered out before sorting.
- *Correction in R5*: In `src/domain/farely/multiCityItinerary.ts`, validate and filter slices: `const validSlices = (params.slices || []).filter(Boolean); if (validSlices.length < 2) throw new InvalidMultiCitySequenceError("Hành trình nhiều chặng (Multi-city) phải có ít nhất 2 chặng bay.");`. Direct ticketing and passenger checkout are strictly `boundary_excluded`.

### Falsification 2: L02 Duplicate Id Accumulation in B2B Scope Evaluation
- *Deficits Identified in Pass R4*: Pass R4 pruned empty strings, but did not guarantee uniqueness across returned `authorized` IDs when the caller passes duplicates (e.g. `["vietjet_direct", "vietjet_direct"]`).
- *Empirical Code Evidence*: In `src/domain/farely/providerRights.ts`, if duplicate IDs are passed, `authorized.push(id)` produces duplicates in the returned list, violating set semantics in downstream B2B licensing audits.
- *Correction in R5*: In `src/domain/farely/providerRights.ts`, deduplicate inputs prior to validation using `Array.from(new Set(...))`.

### Falsification 3: L03 Stale Badge Formatting Drift on Fractional Minute Rounding
- *Deficits Identified in Pass R4*: Pass R4 clamped staleness minutes, but did not assert that `offlineBadgeLabelVi` must accurately switch between minutes (`"X phút trước"`) and hours (`"X giờ trước"`) without emitting floating-point decimals (`"1.5 giờ trước"`).
- *Empirical Code Evidence*: In `src/domain/farely/pwaOfflineFreshness.ts`, badge text formatting should round hours with `Math.floor(offlineStalenessMinutes / 60)` to keep badges clean and professional on mobile viewport constraints.
- *Correction in R5*: In `src/domain/farely/pwaOfflineFreshness.ts`, ensure whole integer conversions across all staleness badge text. Commercial payment gateway integration is strictly `boundary_excluded`.

---

## SECTION III: 12 ADVERSARIAL LENSES DEFINITIVE SYNTHESIS

### L01: Ingestion & Live Schema Integrity
- **Final Audit**: `src/domain/farely/multiCityItinerary.ts` must filter falsy slices, normalize departure dates with `.slice(0, 10)`, and sanitize slice pricing with positive integer rounding.
- **Defensive Boundary**: Slices are strictly ordered by `sliceIndex` and departure date with zero sequence corruption.

### L02: Price Anomaly & Statistical Rigor
- **Final Audit**: `src/domain/farely/providerRights.ts` must deduplicate, trim, and lowercase all provider queries.
- **Defensive Boundary**: Commercial staged contracts are gated strictly, preventing unauthorized B2B syndication.

### L03: True-Cost & Ancillary Transparency
- **Final Audit**: `src/domain/farely/pwaOfflineFreshness.ts` must validate offline cached deal prices, timestamp freshness, and integer badge labels.
- **Defensive Boundary**: Corrupted or negative price fares are marked non-bookable. Credit card processing and passenger checkout are strictly `boundary_excluded`.

### L04: Authentication & Rate Limiting
- **Final Audit**: Database rate limiting via `check_watch_rate_limit` in `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`.
- **Defensive Boundary**: Transactional locking via `FOR UPDATE SKIP LOCKED`. Unauthorized scraping is strictly `boundary_excluded`.

### L05: Concurrency & Resilience
- **Final Audit**: Tri-state circuit breaker protection in `supabase/functions/_shared/flight-search.ts`.
- **Defensive Boundary**: Automatic fail-fast prevents thread exhaustion during upstream outages.

### L06: PWA Offline Freshness
- **Final Audit**: 14-day LRU cache eviction and monotonic sorting in `src/domain/farely/pwaOfflineFreshness.ts` and `src/app/pages/DealsPage.tsx`.
- **Defensive Boundary**: Bounded client-side storage overhead.

### L07: Observability & Production SRE
- **Final Audit**: Safe error serialization in `src/app/lib/analytics.ts`.
- **Defensive Boundary**: WeakSet cycle detection, `maxDepth = 3`, and `maxKeysPerLevel = 50`.

### L08: Zero-Downtime Database Migrations
- **Final Audit**: Idempotent DDL verified via `scripts/verify-certification-integrity.node-test.mjs`.
- **Defensive Boundary**: Absolute rejection of destructive database mutations.

### L09: Zero-Mock Testing & Proof Hierarchy
- **Final Audit**: 58 Vitest suites and 382 Node native tests executing real production logic.
- **Defensive Boundary**: Strict separation of proof tiers (C0 -> C4).

### L10: Contract Immutability & Anti-Shrinkage
- **Final Audit**: 89 capability contracts (F00..F88) verified in `scripts/acceptance-anti-shrinkage.node-test.mjs`.
- **Defensive Boundary**: 267 acceptance gates permanently preserved.

### L11: Transactional Safety & Journal Integrity
- **Final Audit**: Pre-image rollback journal in `scripts/convergence/transactional-task-manager.mjs`.
- **Defensive Boundary**: Zero uncommitted files outside active transaction records.

### L12: Autonomous Audit & Parity Watchdog
- **Final Audit**: Git remote tracking parity in `scripts/convergence/watchdog-convergence.mjs`.
- **Defensive Boundary**: SHA equality verified via `git ls-remote`.

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
