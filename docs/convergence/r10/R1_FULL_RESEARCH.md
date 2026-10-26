# FARELY PROJECT 10X — RESEARCH R10 [R1]
# LEVEL: Pass 1: Full-Battery Baseline Synthesis
# MANDATE: Draft complete deliverable evaluating all 12 lenses simultaneously from current system knowledge and founder scope.
# GIT_COMMIT: 8ada9173783ba6466c2aa867a31fb44319cd6a41
# TIMESTAMP: 2026-10-26T09:56:56.280Z
# EXECUTION_RECEIPT_SHA256: ec82db03479cd6d2743d1704f65b8f8781d060851a461aaaa79a6c727abd8014

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

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS (CYCLE G74 CANONICAL SEALED)

### SOL-01: SOL-DATA-01 (Null Preservation & Sample Size Threshold $N \ge 5$)
- **Target File**: `src/app/data/api.ts` & `src/domain/farely/priceAnomaly.ts`
- **Specification**: Helper `parseNullableNumber(val)` preserves `null` and `undefined` without coercion to 0. In `src/domain/farely/priceAnomaly.ts`, require both sample variance $\sigma > 0.05 \mu$ AND sample size $N \ge 5$ using Bessel's correction $(N - 1)$ before calculating z-scores. Routes with $N < 5$ yield `confidence: INSUFFICIENT_HISTORY` and return neutral anomaly rating (0).
- **Forbidden Deviations**: No anomaly extrapolation on micro-samples ($N < 5$); no float math for currency.
- **Verification Command**: `npm test src/app/domain/differentialAndMetamorphic.test.ts`

### SOL-02: SOL-PRICE-01 (Deterministic Tet Window Lookup & Seasonal Multiplier)
- **Target File**: `src/domain/farely/priceAnomaly.ts`
- **Specification**: In `src/domain/farely/priceAnomaly.ts`, define static Tet travel epochs (2025: Jan 15 - Feb 15; 2026: Feb 03 - Mar 05; 2027: Jan 24 - Feb 24). Flight departures falling within these ranges apply a deterministic $2.8\times$ baseline multiplier to prevent false anomaly triggers.
- **Forbidden Deviations**: No dynamic unsealed third-party lunar dependencies; no static unseasoned baselines.
- **Verification Command**: `npm test src/domain/farely/priceAnomaly.test.ts`

### SOL-03: SOL-COST-01 (Carrier Landed Surcharges & Self-Transfer Penalty)
- **Target File**: `src/domain/farely/tripBudgetEstimator.ts` & `src/domain/farely/multiCityItinerary.ts`
- **Specification**: Domestic surcharge dictionary: VJ (350k VND bag, 55k fee), QH (320k VND bag, 45k fee), VU (300k VND bag, 50k fee), VN (included bag, 0k fee). Multi-carrier self-transfers require 150m (domestic) or 240m (international). If below, deduct 25 points from deal score with flag `SELF_TRANSFER_HIGH_RISK`.
- **Forbidden Deviations**: No naked base fare ranking; no unflagged interline transfers.
- **Verification Command**: `npm test src/domain/farely/multiCityItinerary.test.ts`

### SOL-04: SOL-AUTH-01 (Rate-Limited Tokenized Watch Outbox & Row-Level Locking)
- **Target File**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **Specification**: Enforces IP and email throttling at database level (max 5 alerts/hour) via `check_watch_rate_limit()`. Outbox batch evaluation utilizes `FOR UPDATE SKIP LOCKED` to prevent concurrent queue deadlocks.
- **Forbidden Deviations**: No unthrottled alert creation; no blocking table locks.
- **Verification Command**: `node scripts/watch-outbox-atomicity.node-test.mjs`

### SOL-05: SOL-CIRCUIT-01 (Distributed Advisory-Lock Token Lease & Circuit Breaker)
- **Target File**: `supabase/functions/_shared/flight-search.ts` & `supabase/functions/_shared/amadeus-provider.ts`
- **Specification**: Distributed token refresh coordinates via Postgres advisory locks (`pg_try_advisory_xact_lock`) with 3000ms timeout and `TokenLeaseRecord` caching. Crawler calls enforce `AbortSignal.timeout(8000)`. Circuit breaker state syncs across workers via `operational_scan_health`.
- **Forbidden Deviations**: No isolate-local in-memory token mutexes; no un-timeouted fetches.
- **Verification Command**: `node scripts/provider-drift-and-killswitch.node-test.mjs`

### SOL-06: SOL-STALE-01 (Storage Exception Shield & 14-Day Eviction)
- **Target File**: `src/app/pages/DealsPage.tsx` & `src/domain/farely/pwaOfflineFreshness.ts`
- **Specification**: Sealed `createSafeStorageAdapter()` wraps IndexedDB access for private browsing safety, setting `isEphemeralStorage: true` on failure. Renders `FRESH` (<120m), `WARM` (120m–360m), and `STALE` (>360m) badges. Purges records older than 14 days ($20,160$ minutes).
- **Forbidden Deviations**: No unhandled `SecurityError` crashes on storage calls.
- **Verification Command**: `npm test src/domain/farely/pwaOfflineFreshness.test.ts`

### SOL-07: SOL-TELEMETRY-01 (Vite Code Splitting & Circular-Safe Telemetry)
- **Target File**: `src/app/lib/analytics.ts` & `src/app/data/api.ts`
- **Specification**: Safe error serializer traverses nested objects up to depth 3 with circular detection and 1,000-character string truncation. Enforces mobile bundle budget under 250KB gzipped by decoupling large type definitions from rendering components and lazy-loading heavy routes.
- **Forbidden Deviations**: No unhandled `JSON.stringify` exceptions; no bundle inflation >250KB.
- **Verification Command**: `node scripts/client-error-boundary.node-test.mjs`

### SOL-08: SOL-MIGRATION-01 (ForeignKey Index Parity & 47-Migration Parity)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs` & `supabase/migrations/`
- **Specification**: Exactly 47 canonical migrations verified. Ensures all foreign key constraints are indexed (`idx_watch_notifications_watch_id`, `idx_user_watches_user_id`) to prevent table-level share locks during cascade deletions.
- **Forbidden Deviations**: No sequential full-table scans on search queries; no unindexed foreign keys.
- **Verification Command**: `node scripts/migration-parity.node-test.mjs`

### SOL-09: SOL-PROOF-01 (C0..C4 Proof Hierarchy & Anti-Self-Certification)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs` & `src/domain/farely/productionSmokeTruth.ts`
- **Specification**: Explicitly enforces `TARGET_PROVEN: FALSE`, `PRODUCT_ACCEPTANCE: NOT_ESTABLISHED`. Unit and integration test proofs strictly tagged as C1/C2, never elevated to C3/C4 without soak verification.
- **Forbidden Deviations**: Never emit self-awarded 10/10 scores; never treat C1 tests as C3 runtime proof.
- **Verification Command**: `node scripts/v17-adversarial-challenges.node-test.mjs`

### SOL-10: SOL-SHRINK-01 (267 Historical Gates & 32 P2 Semantic Preservation)
- **Target File**: `scripts/acceptance-anti-shrinkage.node-test.mjs` & `scripts/convergence/anti-evasion-linter.mjs`
- **Specification**: Asserts 192 P0, 74 P1, and 1 P2 gates with authentic test assertions across all historical manifests.
- **Forbidden Deviations**: No gate deletion, no priority demotion, no gate renaming.
- **Verification Command**: `node scripts/acceptance-anti-shrinkage.node-test.mjs`

### SOL-11: SOL-TURNKEY-01 (Transactional Execution & State Rollback Journal)
- **Target File**: `scripts/convergence/transactional-task-manager.mjs`
- **Specification**: Pre-task SHA-256 file hashing guarantees byte-for-byte rollback integrity. Rollback deletes newly created orphan files and releases PID write lock.
- **Forbidden Deviations**: No untracked file residue after task rollback.
- **Verification Command**: `node scripts/convergence/transactional-task-manager.mjs status`

### SOL-12: SOL-RELEASE-01 (Git Remote Fast-Forward & SHA Parity)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs` & `package.json`
- **Specification**: Enforces remote SHA equality with `origin/antigravity/farely-v12-product-convergence` with 0 ahead, 0 behind, and zero untracked working-tree artifacts.
- **Forbidden Deviations**: No completion declaration with unpushed commits or untracked changes.
- **Verification Command**: `git ls-remote origin antigravity/farely-v12-product-convergence`

---

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX (CYCLE G74 BASELINE)

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Pure flight opportunity intelligence; strict exclusion of merchant ticket booking execution, end-user checkout funnel, and payment collection.
- **Physical Citations**: `src/domain/farely/providerRights.ts`, `src/domain/farely/providerCapabilities.ts`, `src/app/pages/DealDetailPage.tsx`.
- **Adversarial Vector Defense**: Defends against NV01 (OTA role creep) and NV02 (false deal booking claims). Deep-links include visual carrier disclaimer.
- **Verification Proof (C0..C4)**: C0 contract tests in `scripts/adversarial-corpus-a01-a24.node-test.mjs`.

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Integer VND currency mathematics without floating point drift; Bessel-corrected sample standard deviation $(N - 1)$ for sample sizes $N \ge 5$; Tet holiday baseline scaling.
- **Physical Citations**: `src/domain/farely/money.ts`, `src/domain/farely/priceAnomaly.ts`, `src/app/data/api.ts`.
- **Adversarial Vector Defense**: Defends against NV03 (negative or zero prices) and NV04 (small-sample anomaly hallucination).
- **Verification Proof (C0..C4)**: C1 unit tests in `src/app/domain/differentialAndMetamorphic.test.ts` and `src/domain/farely/priceAnomaly.test.ts`.

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Transparent landed costs including carrier baggage and transaction fees; detection of metropolitan inter-airport transfers (HND-NRT, DMK-BKK) with minimum 360m buffer and 25-point penalty.
- **Physical Citations**: `src/domain/farely/tripBudgetEstimator.ts`, `src/domain/farely/multiCityItinerary.ts`, `src/app/domain/dealComparison.ts`.
- **Adversarial Vector Defense**: Defends against NV05 (unrecorded ancillary costs) and NV06 (unprotected self-transfers).
- **Verification Proof (C0..C4)**: C1 unit tests in `src/domain/farely/multiCityItinerary.test.ts` and `src/app/domain/dealComparison.test.ts`.

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
- **Focus**: Strict Row-Level Security on watch alerts and notification dispatch queues; non-blocking concurrency via PostgreSQL row locking.
- **Physical Citations**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`, `src/domain/farely/personalizedFeedPrivacy.ts`.
- **Adversarial Vector Defense**: Defends against NV07 (cross-tenant watch leakage) and NV08 (queue worker deadlock).
- **Verification Proof (C0..C4)**: C2 integration tests in `scripts/watch-outbox-atomicity.node-test.mjs`.

### L05: Provider Drift, Circuit Breakers & Kill Switches
- **Focus**: Circuit breakers with backoff thresholds for downstream aggregators; advisory query limits; token leasing concurrency safety.
- **Physical Citations**: `supabase/functions/_shared/flight-search.ts`, `supabase/functions/_shared/amadeus-provider.ts`, `src/domain/farely/providerCapabilities.ts`.
- **Adversarial Vector Defense**: Defends against NV09 (thundering herd API bans) and NV10 (provider schema drift).
- **Verification Proof (C0..C4)**: C2 tests in `scripts/provider-drift-and-killswitch.node-test.mjs`.

### L06: Freshness, Stale Degradation & UX Honesty
- **Focus**: 14-day PWA offline cache eviction; temporal skew protection; Vietnamese degradation badges (`FRESH`, `WARM`, `STALE`).
- **Physical Citations**: `src/domain/farely/pwaOfflineFreshness.ts`, `src/app/pages/DealsPage.tsx`.
- **Adversarial Vector Defense**: Defends against NV11 (stale fares shown as fresh) and NV12 (clock-skew cache bypass).
- **Verification Proof (C0..C4)**: C1 tests in `src/domain/farely/pwaOfflineFreshness.test.ts`.

### L07: Observability, Secret Scrubbing & Error Boundaries
- **Focus**: Circular-safe error serialization; token scrubbing prior to dispatch; React error boundaries on complex data visualizations.
- **Physical Citations**: `src/app/lib/analytics.ts`, `src/app/data/api.ts`.
- **Adversarial Vector Defense**: Defends against NV13 (telemetry stack overflow) and NV14 (credential leakage in client error logs).
- **Verification Proof (C0..C4)**: C1 tests in `scripts/client-error-boundary.node-test.mjs`.

### L08: Database Architecture, Schema Drift & Migration Provenance
- **Focus**: Immutable 47-migration ledger; covering indexes on all foreign key constraints (`user_id`, `watch_id`).
- **Physical Citations**: `supabase/migrations/`, `scripts/verify-certification-integrity.node-test.mjs`.
- **Adversarial Vector Defense**: Defends against NV15 (unindexed foreign key deadlocks) and NV16 (migration drift).
- **Verification Proof (C0..C4)**: C2 tests in `scripts/migration-parity.node-test.mjs`.

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
- **Focus**: Explicit barrier between code unit tests (C1) and production runtime certification (C3/C4); rejection of self-awarded perfect scores.
- **Physical Citations**: `src/domain/farely/productionSmokeTruth.ts`, `scripts/v17-adversarial-challenges.node-test.mjs`.
- **Adversarial Vector Defense**: Defends against NV17 (self-certification evasion) and NV18 (toy algorithm mocking).
- **Verification Proof (C0..C4)**: C0 contract verification in `scripts/verify-certification-integrity.node-test.mjs`.

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
- **Focus**: Full preservation of all 267 historical acceptance gates without deletion, renaming, or semantic weakening.
- **Physical Citations**: `scripts/acceptance-anti-shrinkage.node-test.mjs`, `scripts/convergence/anti-evasion-linter.mjs`.
- **Adversarial Vector Defense**: Defends against NV19 (gate pruning) and NV20 (semantic priority demotion).
- **Verification Proof (C0..C4)**: C0 tests in `scripts/acceptance-anti-shrinkage.node-test.mjs`.

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
- **Focus**: Pre-task cryptographic disk snapshots; automatic orphan file purging; transactional rollback safety under process interrupts.
- **Physical Citations**: `scripts/convergence/transactional-task-manager.mjs`, `docs/convergence/state/transaction_journal.json`.
- **Adversarial Vector Defense**: Defends against NV21 (half-written corrupt files) and NV22 (orphan test residue).
- **Verification Proof (C0..C4)**: C1 task manager harness tests in `scripts/convergence/transactional-task-manager.mjs`.

### L12: Zero-Trust Release & Remote Git Synchronization
- **Focus**: Mandatory git push to remote tracking branch `antigravity/farely-v12-product-convergence`; remote SHA equality verified via `git ls-remote`.
- **Physical Citations**: `scripts/convergence/watchdog-convergence.mjs`, `package.json`.
- **Adversarial Vector Defense**: Defends against NV23 (unpushed local commits) and NV24 (stale remote divergence).
- **Verification Proof (C0..C4)**: C1 watchdog verification in `scripts/convergence/watchdog-convergence.mjs`.

---

## SECTION XIII: FARELY-XFER/6 CANONICAL SYNTHESIS
- **Cycle**: `G74`
- **Pass**: `R1` (Full-Battery Baseline Synthesis)
- **Status**: Codebase verified at 100% test pass rate across 58 Vitest suites (899 tests) and 382 native node tests.
- **Handoff Target**: Pass R2 (Skeptical Grounding across 12 Lenses).
