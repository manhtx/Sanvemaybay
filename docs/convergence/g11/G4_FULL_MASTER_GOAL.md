# FARELY PROJECT 10X — MASTER GOAL G11 [G4]
# LEVEL: Pass 4: Production SRE Rigor & Zero-Mock Verification
# MANDATE: Assume Pass 3 relied on mock safety across all 12 lenses. Enforce deterministic oracles, real integrations, and zero-loss rollbacks.
# GIT_COMMIT: 9268d3c98cfc0da1914b88ffb92bfb2278372653
# TIMESTAMP: 2026-10-26T07:16:21.486Z
# EXECUTION_RECEIPT_SHA256: 2ca96170221b7d33562c816dbfa1d2222d34260667fada2f5f947d8c0c5c5507

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

## AUDIT & FALSIFICATION OF PASS G3
> [!IMPORTANT]
> In accordance with the Anti-Sycophancy Invariant, Pass G4 challenges Pass G3's flat task presentation. Pass G3 defined metamorphic oracles for individual tasks, but failed to model the topological dependency Directed Acyclic Graph (DAG) and intermediate compilation boundaries. Attempting to execute tasks out of topological order produces circular import failures and broken intermediate test suites.

### Hostile Falsification & DAG Topological Deficits in Pass G3:

- **[L11 FALSIFICATION]** (Flat Execution Order & Circular Type Deadlocks):
  - *Deficit in G3*: Pass G3 listed tasks sequentially without specifying strict DAG layer dependencies.
  - *Topological Failure*: If an executor applies `SOL-PRICE-01` (price anomaly Tet seasonal multipliers) before `SOL-DATA-01` (type guards in `src/app/data/api.ts`), the build fails on missing interface exports, halting the transaction manager prematurely.
  - *Correction in G4*: Establish a 5-layer Topological DAG: Layer 0 (Domain Kernel Interfaces) -> Layer 1 (Statistical & Algorithmic Engines) -> Layer 2 (Data Layer & Telemetry) -> Layer 3 (UI Presentation & Badges) -> Layer 4 (E2E & Release Verification).

- **[L08 FALSIFICATION]** (Database Migration Pre-requisites & Schema Race):
  - *Deficit in G3*: Pass G3 specified database trigger modifications without defining whether migrations execute before or after TypeScript client types are updated.
  - *Topological Failure*: Running TypeScript typecheck against an outdated database schema produces TypeScript diagnostics, while updating types before SQL triggers deploy risks runtime Supabase client query errors.
  - *Correction in G4*: Database DDL transactions must execute and pass `migration-parity.node-test.mjs` before TypeScript data adapters consume new schema columns.

- **[L05 FALSIFICATION]** (Edge Function Deployment Dependencies):
  - *Deficit in G3*: Pass G3 updated shared crawler code in `supabase/functions/_shared/flight-search.ts` without validating downstream consumer edge functions (`crawl-scheduler`, `amadeus-provider`).
  - *Topological Failure*: Modifying `flight-search.ts` function signatures without updating all dependent Deno entrypoints causes edge function cold-start panics in production.
  - *Correction in G4*: Lock the topological dependency chain from shared edge modules to root function handlers with atomic sub-package testing.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS (TOPOLOGICAL DAG ORDERED)

### LAYER 0: CORE DOMAIN TYPES & METRICS
#### SOL-01: SOL-DATA-01 (Null Preservation & Sample Size Threshold $N \ge 5$)
- **SOL_ID**: `SOL-DATA-01`
- **TARGET_FILES**: `src/app/data/api.ts` & `src/domain/farely/priceAnomaly.ts`
- **DAG_ORDER**: Layer 0 (Prerequisite for all price scoring)
- **LOCKED_ALGORITHM**: Require both sample variance $\sigma > 0.05 \mu$ AND sample size $N \ge 5$ before calculating z-scores. Routes with $N < 5$ yield `confidence: INSUFFICIENT_HISTORY` and return neutral anomaly rating (0).
- **FORBIDDEN_DEVIATIONS**: No anomaly extrapolation on micro-samples ($N < 5$); no float math for currency.
- **VERIFICATION_COMMAND**: `npm test src/app/domain/differentialAndMetamorphic.test.ts`

### LAYER 1: STATISTICAL & ALGORITHMIC ENGINES
#### SOL-02: SOL-PRICE-01 (Deterministic Tet Window Lookup & Seasonal Multiplier)
- **SOL_ID**: `SOL-PRICE-01`
- **TARGET_FILES**: `src/domain/farely/priceAnomaly.ts`
- **DAG_ORDER**: Layer 1 (Depends on SOL-DATA-01)
- **LOCKED_ALGORITHM**: Static Tet travel epochs (2025: Jan 15 - Feb 15; 2026: Feb 03 - Mar 05; 2027: Jan 24 - Feb 24). Trunk domestic routes during Tet window apply a deterministic $2.8\times$ baseline multiplier to prevent false anomaly triggers.
- **FORBIDDEN_DEVIATIONS**: No dynamic unsealed third-party lunar dependencies; no static unseasoned baselines.
- **VERIFICATION_COMMAND**: `node scripts/price-truth-harness.node-test.mjs`

#### SOL-03: SOL-COST-01 (Sealed Carrier Landed Surcharges & Self-Transfer Risk)
- **SOL_ID**: `SOL-COST-01`
- **TARGET_FILES**: `src/domain/farely/tripBudgetEstimator.ts` & `src/domain/farely/multiCityItinerary.ts`
- **DAG_ORDER**: Layer 1 (Depends on SOL-DATA-01)
- **LOCKED_ALGORITHM**: Domestic surcharge dictionary: VJ (350k VND bag, 55k fee), QH (320k VND bag, 45k fee), VU (300k VND bag, 50k fee), VN (included bag, 0k fee). Multi-carrier self-transfers with connection time $<180$ minutes deduct 25 points from deal score with flag `SELF_TRANSFER_HIGH_RISK`.
- **FORBIDDEN_DEVIATIONS**: No naked base fare ranking; no unflagged interline transfers.
- **VERIFICATION_COMMAND**: `npm test src/domain/farely/multiCityItinerary.test.ts`

### LAYER 2: DATA ADAPTERS & BACKEND SERVICES
#### SOL-04: SOL-AUTH-01 (Rate-Limited Tokenized Watch Outbox & Row-Level Locking)
- **SOL_ID**: `SOL-AUTH-01`
- **TARGET_FILES**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **DAG_ORDER**: Layer 2 (Independent database transaction)
- **LOCKED_ALGORITHM**: Enforces IP and email throttling at database level (max 5 alerts/hour) via `check_watch_rate_limit()`. Outbox batch evaluation utilizes `FOR UPDATE SKIP LOCKED` to prevent concurrent queue deadlocks.
- **FORBIDDEN_DEVIATIONS**: No unthrottled alert creation; no blocking table locks.
- **VERIFICATION_COMMAND**: `node scripts/watch-outbox-atomicity.node-test.mjs`

#### SOL-05: SOL-CIRCUIT-01 (Postgres-Synced Circuit Breaker with Retry-After)
- **SOL_ID**: `SOL-CIRCUIT-01`
- **TARGET_FILES**: `supabase/functions/_shared/flight-search.ts`
- **DAG_ORDER**: Layer 2 (Depends on Layer 0 types)
- **LOCKED_ALGORITHM**: Circuit breaker coordinates across serverless instances via `operational_scan_health`. On HTTP 429, parses `Retry-After` header and writes cool-off expiry to database. All external fetches enforce `AbortSignal.timeout(8000)`.
- **FORBIDDEN_DEVIATIONS**: No uncoordinated in-memory circuit breakers; no un-timeouted fetches.
- **VERIFICATION_COMMAND**: `node scripts/provider-drift-and-killswitch.node-test.mjs`

#### SOL-07: SOL-TELEMETRY-01 (Modular UI Architecture & Circular-Safe Telemetry)
- **SOL_ID**: `SOL-TELEMETRY-01`
- **TARGET_FILES**: `src/app/lib/analytics.ts` & `src/app/data/api.ts`
- **DAG_ORDER**: Layer 2 (Client utility service)
- **LOCKED_ALGORITHM**: Safe error serializer traverses nested objects up to depth 3 with circular detection. Enforces mobile bundle budget under 250KB gzipped by decoupling large type definitions from rendering components.
- **FORBIDDEN_DEVIATIONS**: No unhandled `JSON.stringify` exceptions; no bundle inflation >250KB.
- **VERIFICATION_COMMAND**: `node scripts/client-error-boundary.node-test.mjs`

### LAYER 3: UI PRESENTATION & CLIENT CACHE
#### SOL-06: SOL-STALE-01 (Triple Visual Badges & 14-Day IndexedDB Eviction)
- **SOL_ID**: `SOL-STALE-01`
- **TARGET_FILES**: `src/app/pages/DealsPage.tsx` & `src/domain/farely/pwaOfflineFreshness.ts`
- **DAG_ORDER**: Layer 3 (Depends on Layer 1 & 2)
- **LOCKED_ALGORITHM**: Renders `FRESH` (<120m), `WARM` (120m–360m), and `STALE` (>360m) with accessibility aria-labels. Enforces local storage quota by evicting cached search observations older than 14 days upon app mount.
- **FORBIDDEN_DEVIATIONS**: No hiding stale warnings; no unbounded offline cache accumulation.
- **VERIFICATION_COMMAND**: `npm test src/domain/farely/pwaOfflineFreshness.test.ts`

### LAYER 4: DATABASE PARITY & RELEASE GOVERNANCE
#### SOL-08: SOL-MIGRATION-01 (Composite B-Tree Indexes & 47-Migration Parity)
- **SOL_ID**: `SOL-MIGRATION-01`
- **TARGET_FILES**: `supabase/migrations/`
- **DAG_ORDER**: Layer 4 (System-wide verification)
- **LOCKED_ALGORITHM**: Exactly 47 canonical migrations verified. All search observation queries covered by composite index `(origin_iata, destination_iata, observed_at DESC)` to eliminate table scans.
- **FORBIDDEN_DEVIATIONS**: No sequential full-table scans on search queries; no unversioned DDL.
- **VERIFICATION_COMMAND**: `node scripts/migration-parity.node-test.mjs`

#### SOL-09: SOL-PROOF-01 (C0..C4 Proof Hierarchy & Anti-Self-Certification)
- **SOL_ID**: `SOL-PROOF-01`
- **TARGET_FILES**: `scripts/verify-certification-integrity.node-test.mjs`
- **DAG_ORDER**: Layer 4 (Integrity gate)
- **LOCKED_ALGORITHM**: Explicitly enforces `TARGET_PROVEN: FALSE`, `PRODUCT_ACCEPTANCE: NOT_ESTABLISHED`. Unit and integration test proofs strictly tagged as C1/C2, never elevated to C3/C4 without soak verification.
- **FORBIDDEN_DEVIATIONS**: Never emit self-awarded 10/10 scores; never treat C1 tests as C3 runtime proof.
- **VERIFICATION_COMMAND**: `node scripts/verify-certification-integrity.node-test.mjs`

#### SOL-10: SOL-SHRINK-01 (267 Historical Gates & 32 P2 Semantic Preservation)
- **SOL_ID**: `SOL-SHRINK-01`
- **TARGET_FILES**: `scripts/acceptance-anti-shrinkage.node-test.mjs`
- **DAG_ORDER**: Layer 4 (Scope audit)
- **LOCKED_ALGORITHM**: Asserts 192 P0, 74 P1, and 1 P2 gates with authentic test assertions.
- **FORBIDDEN_DEVIATIONS**: No gate deletion, no priority demotion, no gate renaming.
- **VERIFICATION_COMMAND**: `node scripts/acceptance-anti-shrinkage.node-test.mjs`

#### SOL-11: SOL-TURNKEY-01 (Cryptographic Snapshotting & Orphan-Clean Rollback)
- **SOL_ID**: `SOL-TURNKEY-01`
- **TARGET_FILES**: `scripts/convergence/transactional-task-manager.mjs`
- **DAG_ORDER**: Layer 4 (Transaction guard)
- **LOCKED_ALGORITHM**: Pre-task SHA-256 file hashing guarantees byte-for-byte rollback integrity. Rollback deletes newly created orphan files and releases PID write lock.
- **FORBIDDEN_DEVIATIONS**: No untracked file residue after task rollback.
- **VERIFICATION_COMMAND**: `node scripts/convergence/transactional-task-manager.mjs status`

#### SOL-12: SOL-RELEASE-01 (Git Remote Fast-Forward & SHA Parity)
- **SOL_ID**: `SOL-RELEASE-01`
- **TARGET_FILES**: `scripts/convergence/watchdog-convergence.mjs`
- **DAG_ORDER**: Layer 4 (Final gate)
- **LOCKED_ALGORITHM**: Enforces remote SHA equality with `origin/antigravity/farely-v12-product-convergence` with 0 ahead, 0 behind, and zero untracked working-tree artifacts.
- **FORBIDDEN_DEVIATIONS**: No completion declaration with unpushed commits or untracked changes.
- **VERIFICATION_COMMAND**: `git ls-remote origin antigravity/farely-v12-product-convergence`

---

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX (DAG ORDERED)

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Anti-OTA conflation; exact jobs-to-be-done F1.1; no fake deal booking claims; preservation of F1..F26.
- **Physical Code Citations**:
  - `src/domain/farely/providerRights.ts`: Restricts Farely to verified intelligence; direct ticketing, passenger checkout, and payment gateway integration remain strictly boundary_excluded.
  - `src/app/pages/DealDetailPage.tsx`: Outbound partner link attribution sanitization.
- **Adversarial Vector Defense**: Defends against NV01 (OTA role creep) and NV02 (false deal booking claims). Deep-links include visual carrier disclaimer.
- **Verification Proof (C0..C4)**: C0 contract tests in `scripts/adversarial-corpus-a01-a24.node-test.mjs`.

---

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Rejection of NaN, negative prices, unbounded numbers; exact price semantics (indicative vs observed vs bookable).
- **Physical Code Citations**:
  - `src/domain/farely/money.ts`: Implements 64-bit VND integer mathematics.
  - `src/domain/farely/priceAnomaly.ts`: Rejects variance evaluation when sample size $N < 5$ or $\sigma \le 0.05 \mu$; applies deterministic Tet calendar epochs.
  - `src/app/data/api.ts`: Helper `parseNullableNumber()` ensures unparseable numeric strings yield `null`.
- **Adversarial Vector Defense**: Defends against NV03 (negative or zero prices) and NV04 (small-sample anomaly hallucination).
- **Verification Proof (C0..C4)**: C1 unit tests in `src/app/domain/differentialAndMetamorphic.test.ts`.

---

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Anti-hallucinated discount claims; deal score must be backed by sample confidence and total cost of trip.
- **Physical Code Citations**:
  - `src/domain/farely/tripBudgetEstimator.ts`: Landed trip cost calculation factoring carrier baggage surcharge dictionary.
  - `src/domain/farely/multiCityItinerary.ts`: Unprotected self-transfer detection and connection risk scoring.
  - `src/app/domain/dealComparison.ts`: Monotonic score enforcement.
- **Adversarial Vector Defense**: Defends against NV05 (baggage fee hidden trap) and NV06 (unprotected transit forfeiture).
- **Verification Proof (C0..C4)**: C1 unit tests in `src/domain/farely/multiCityItinerary.test.ts`.

---

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
- **Focus**: Multi-tenant isolation; strict Supabase RLS policies; protection of personal watch alerts and user credentials.
- **Physical Code Citations**:
  - `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`: Strict RLS policies `auth.uid() = user_id`.
  - `supabase/migrations/20261007000300_atomic_watch_evaluation_and_outbox.sql`: Throttling and queue locking.
- **Adversarial Vector Defense**: Defends against NV07 (cross-tenant watch leakage) and NV08 (concurrent outbox deadlock).
- **Verification Proof (C0..C4)**: C2 integration tests in `scripts/account-deletion-contract.node-test.mjs`.

---

### L05: Provider Drift, Circuit Breakers & Kill Switches
- **Focus**: Resilience against partner schema changes, 429 rate limits, 503 outages, and dirty payload quarantine.
- **Physical Code Citations**:
  - `supabase/functions/_shared/flight-search.ts`: Distributed PostgreSQL-backed circuit breaker state with `Retry-After` compliance.
  - `supabase/functions/_shared/amadeus-provider.ts`: External fetch with `AbortSignal.timeout(8000)`.
- **Adversarial Vector Defense**: Defends against NV09 (rate limit ban) and NV10 (ephemeral serverless state loss).
- **Verification Proof (C0..C4)**: C1 integration tests in `scripts/provider-drift-and-killswitch.node-test.mjs`.

---

### L06: Freshness, Stale Degradation & UX Honesty
- **Focus**: Stale indicators for data >360m; no masking errors as 0 deals; transparent source attribution and observed_at.
- **Physical Code Citations**:
  - `src/domain/farely/pwaOfflineFreshness.ts`: 14-day storage eviction and freshness degradation tiers.
  - `src/app/pages/DealsPage.tsx`: Badges for stale records with explicit `aria-label` indicators.
- **Adversarial Vector Defense**: Defends against NV11 (stale cache masquerading as live) and NV12 (local storage quota exhaustion).
- **Verification Proof (C0..C4)**: C1 tests in `src/domain/farely/pwaOfflineFreshness.test.ts`.

---

### L07: Observability, Secret Scrubbing & Error Boundaries
- **Focus**: Zero secret leakage in client/browser logs; client error boundaries; structured telemetry for silent failures.
- **Physical Code Citations**:
  - `src/app/lib/sharing.ts`: Regex scrubbers removing Bearer tokens and API keys.
  - `src/app/lib/analytics.ts`: Circular-reference-tolerant JSON serializer with depth ceiling 3.
- **Adversarial Vector Defense**: Defends against NV13 (credential exposure in telemetry) and NV14 (mobile bundle bloat >250KB).
- **Verification Proof (C0..C4)**: C1 tests in `scripts/client-error-boundary.node-test.mjs`.

---

### L08: Database Architecture, Schema Drift & Migration Provenance
- **Focus**: Zero unversioned migration drift; bidirectional migration parity; zero loss during DDL evolution.
- **Physical Code Citations**:
  - `supabase/migrations/`: Exactly 47 chronological migrations inspected and sealed. Composite B-tree index coverage.
- **Adversarial Vector Defense**: Defends against NV15 (untracked SQL changes) and NV16 (catastrophic sequential scans).
- **Verification Proof (C0..C4)**: C1 test in `scripts/migration-parity.node-test.mjs`.

---

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
- **Focus**: Strict separation: C0 Contract != C1 Unit != C2 Integration != C3 Runtime != C4 Soak. No self-awarded 10/10.
- **Physical Code Citations**:
  - `scripts/verify-certification-integrity.node-test.mjs`: Explicitly enforces `TARGET_PROVEN: FALSE` and tree hash verification.
- **Adversarial Vector Defense**: Defends against NV17 (executor self-certification) and NV18 (treating synthetic mocks as production proof).
- **Verification Proof (C0..C4)**: C0 meta-verification in `scripts/verify-certification-integrity.node-test.mjs`.

---

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
- **Focus**: Preservation of all 192 P0, 74 P1, 1 P2 gates; zero dropping of historical commitments.
- **Physical Code Citations**:
  - `scripts/acceptance-anti-shrinkage.node-test.mjs`: Asserts exact count and semantic completeness of all 267 gates.
- **Adversarial Vector Defense**: Defends against NV19 (silent gate pruning) and NV20 (priority demotion).
- **Verification Proof (C0..C4)**: C1 automated gate verification in `scripts/acceptance-anti-shrinkage.node-test.mjs`.

---

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
- **Focus**: Zero-deadlock dependency order; file-level before/after specs; turnkey test scripts; instant rollback runbooks.
- **Physical Code Citations**:
  - `scripts/convergence/transactional-task-manager.mjs`: Provides atomic snapshotting, pre-state SHA-256 hashing, staging, orphan cleanup, and rollback.
- **Adversarial Vector Defense**: Defends against NV21 (partial task commit leaving broken repo state) and NV22 (orphan files corrupting working tree).
- **Verification Proof (C0..C4)**: C1 test harness in `scripts/convergence/transactional-task-manager.mjs`.

---

### L12: Zero-Trust Release & Remote Git Synchronization
- **Focus**: Local tests passing != Done; mandatory push to `antigravity/farely-v12-product-convergence` with remote SHA match.
- **Physical Code Citations**:
  - `scripts/convergence/continuous_5x5_orchestrator.mjs`: `completeGoal()` rejects if local HEAD does not match remote origin SHA.
- **Adversarial Vector Defense**: Defends against NV23 (local illusion of done) and NV24 (remote branch divergence).
- **Verification Proof (C0..C4)**: Remote git query via `git ls-remote`.

---

## SECTION XIII: FARELY-XFER/6 CANONICAL SYNTHESIS
- Cycle G71 Pass G4: Production SRE Rigor & Zero-Mock Verification completed.
- Full topological DAG established across 5 discrete architectural layers.
- Next Pass: G5 (Sovereign Master Goal Prompt - Locked Executor Cage).
