# FARELY PROJECT 10X — RESEARCH R10 [R5]
# LEVEL: Pass 5: Sovereign Canonical Convergence
# MANDATE: Unassailable synthesis across all 12 lenses. Sealed proof ledger, canonical handoff contract, 100% self-contained output.
# GIT_COMMIT: 9268d3c98cfc0da1914b88ffb92bfb2278372653
# TIMESTAMP: 2026-10-26T07:11:24.005Z
# EXECUTION_RECEIPT_SHA256: 33d8f7d5aa1e93e51919e497cc57b0ec8acebee02fa788be377cd0fb5840dbfc

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

## AUDIT & FALSIFICATION OF PASS R4
> [!IMPORTANT]
> In accordance with the Anti-Sycophancy Invariant, Pass R5 audits Pass R4 to eliminate any remaining implementation ambiguities, hand-waving, or unsealed contracts. Pass R4 introduced critical SRE scale invariants (bundle budgets, composite DB indexing, distributed circuit breakers), but left the exact interface contracts and turnkey test invocations unsealed.

### Sovereign Convergence Falsification & Sealed Deficits in Pass R4:

- **[L02 FALSIFICATION]** (Tet Window Boundary Precision):
  - *Deficit in R4*: Pass R4 specified a 30-day Tet lunar window multiplier ($2.8\times$) but did not define the programmatic date boundary determination algorithm.
  - *Sealed Interface Deficit*: Without an explicit solar-to-lunar conversion contract or deterministic table of Tet calendar dates (2025, 2026, 2027), an implementing engineer would either hardcode arbitrary static timestamps or import heavy non-tree-shakeable lunar calendar libraries.
  - *Correction in R5*: In `src/domain/farely/priceAnomaly.ts`, lock an immutable lookup table of Vietnamese Lunar New Year departure dates for 2025–2027 with pre-calculated $\pm 14$ day epoch boundaries, requiring zero runtime external dependencies.

- **[L03 FALSIFICATION]** (Deterministic Landed Surcharge Matrix):
  - *Deficit in R4*: Pass R4 defined baggage surcharge modeling for VietJet and Bamboo, but omitted Vietravel Airlines (VU) and Vietnam Airlines (VN) super-saver economy tiers.
  - *Sealed Interface Deficit*: Leaving airline surcharge tables open-ended allows downstream executors to improvise fee structures, creating scoring discrepancies between domestic carriers.
  - *Correction in R5*: In `src/domain/farely/tripBudgetEstimator.ts`, seal the exact domestic fee dictionary across all 4 operational carriers (VJ, QH, VU, VN) with integer VND baggage and payment processing costs.

- **[L11 FALSIFICATION]** (Atomic Pre-Execution State Snapshots):
  - *Deficit in R4*: Pass R4 required orphan file deletion on rollback, but did not mandate cryptographic pre-state hashing.
  - *Sealed Interface Deficit*: If an execution modifies a file and partially crashes before logging the snapshot, standard rollback cannot verify whether the file was restored to its exact byte-for-byte pre-task state.
  - *Correction in R5*: Mandate that `transactional-task-manager.mjs` computes and validates SHA-256 hashes of all target files before executing `beginTask()`, enforcing byte-level rollback integrity.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS (CANONICAL R5 SEALED)

### SOL-01: SOL-DATA-01 (Null Preservation & Sample Size Threshold $N \ge 5$)
- **Target File**: `src/app/data/api.ts` & `src/domain/farely/priceAnomaly.ts`
- **Specification**: Helper `parseNullableNumber(val)` preserves `null` and `undefined` without coercion to 0. In `priceAnomaly.ts`, require both sample variance $\sigma > 0.05 \mu$ AND sample size $N \ge 5$ before calculating z-scores. Routes with $N < 5$ yield `confidence: INSUFFICIENT_HISTORY` and return a neutral anomaly rating (0).
- **Forbidden Deviations**: No anomaly extrapolation on micro-samples ($N < 5$); no float math for currency.
- **Verification Command**: `npm test src/app/domain/differentialAndMetamorphic.test.ts`

### SOL-02: SOL-PRICE-01 (Deterministic Tet Window Lookup & Seasonal Multiplier)
- **Target File**: `src/domain/farely/priceAnomaly.ts`
- **Specification**: In `priceAnomaly.ts`, define static Tet travel epochs (2025: Jan 15 - Feb 15; 2026: Feb 03 - Mar 05; 2027: Jan 24 - Feb 24). Flight departures falling within these ranges apply a deterministic $2.8\times$ baseline multiplier to prevent false anomaly triggers.
- **Forbidden Deviations**: No dynamic unsealed third-party lunar dependencies; no static unseasoned baselines.
- **Verification Command**: `node scripts/price-truth-harness.node-test.mjs`

### SOL-03: SOL-COST-01 (Sealed Carrier Landed Surcharges & Self-Transfer Risk)
- **Target File**: `src/domain/farely/tripBudgetEstimator.ts` & `src/domain/farely/multiCityItinerary.ts`
- **Specification**: Domestic surcharge dictionary: VJ (350k VND bag, 55k fee), QH (320k VND bag, 45k fee), VU (300k VND bag, 50k fee), VN (included bag, 0k fee). Multi-carrier self-transfers with connection time $<180$ minutes deduct 25 points from deal score with flag `SELF_TRANSFER_HIGH_RISK`.
- **Forbidden Deviations**: No naked base fare ranking; no unflagged interline transfers.
- **Verification Command**: `npm test src/domain/farely/multiCityItinerary.test.ts`

### SOL-04: SOL-AUTH-01 (Rate-Limited Tokenized Watch Outbox & Row-Level Locking)
- **Target File**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **Specification**: Enforces IP and email throttling at database level (max 5 alerts/hour) via `check_watch_rate_limit()`. Outbox batch evaluation utilizes `FOR UPDATE SKIP LOCKED` to prevent concurrent queue deadlocks.
- **Forbidden Deviations**: No unthrottled alert creation; no blocking table locks.
- **Verification Command**: `node scripts/watch-outbox-atomicity.node-test.mjs`

### SOL-05: SOL-CIRCUIT-01 (Postgres-Synced Circuit Breaker with Retry-After)
- **Target File**: `supabase/functions/_shared/flight-search.ts`
- **Specification**: Circuit breaker coordinates across serverless instances via `operational_scan_health`. On HTTP 429, parses `Retry-After` header and writes cool-off expiry to database. All external fetches enforce `AbortSignal.timeout(8000)`.
- **Forbidden Deviations**: No uncoordinated in-memory circuit breakers; no un-timeouted fetches.
- **Verification Command**: `node scripts/provider-drift-and-killswitch.node-test.mjs`

### SOL-06: SOL-STALE-01 (Triple Visual Badges & 14-Day IndexedDB Eviction)
- **Target File**: `src/app/pages/DealsPage.tsx` & `src/domain/farely/pwaOfflineFreshness.ts`
- **Specification**: Renders `FRESH` (<120m), `WARM` (120m–360m), and `STALE` (>360m) with accessibility aria-labels. Enforces local storage quota by evicting cached search observations older than 14 days upon app mount.
- **Forbidden Deviations**: No hiding stale warnings; no unbounded offline cache accumulation.
- **Verification Command**: `npm test src/domain/farely/pwaOfflineFreshness.test.ts`

### SOL-07: SOL-TELEMETRY-01 (Modular UI Architecture & Circular-Safe Telemetry)
- **Target File**: `src/app/lib/analytics.ts` & `src/app/data/api.ts`
- **Specification**: Safe error serializer traverses nested objects up to depth 3 with circular detection. Enforces mobile bundle budget under 250KB gzipped by decoupling large type definitions from rendering components.
- **Forbidden Deviations**: No unhandled `JSON.stringify` exceptions; no bundle inflation >250KB.
- **Verification Command**: `node scripts/client-error-boundary.node-test.mjs`

### SOL-08: SOL-MIGRATION-01 (Composite B-Tree Indexes & 47-Migration Parity)
- **Target File**: `supabase/migrations/`
- **Specification**: Exactly 47 chronological migrations verified. All search observation queries covered by composite index `(origin_iata, destination_iata, observed_at DESC)` to eliminate table scans.
- **Forbidden Deviations**: No sequential full-table scans on search queries; no unversioned DDL.
- **Verification Command**: `node scripts/migration-parity.node-test.mjs`

### SOL-09: SOL-PROOF-01 (C0..C4 Proof Hierarchy & Anti-Self-Certification)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs`
- **Specification**: Explicitly enforces `TARGET_PROVEN: FALSE`, `PRODUCT_ACCEPTANCE: NOT_ESTABLISHED`. Unit and integration test proofs strictly tagged as C1/C2, never elevated to C3/C4 without soak verification.
- **Forbidden Deviations**: Never emit self-awarded 10/10 scores; never treat C1 tests as C3 runtime proof.
- **Verification Command**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-10: SOL-SHRINK-01 (267 Historical Gates & 32 P2 Semantic Preservation)
- **Target File**: `scripts/acceptance-anti-shrinkage.node-test.mjs`
- **Specification**: Asserts 192 P0, 74 P1, and 1 P2 gates with authentic test assertions.
- **Forbidden Deviations**: No gate deletion, no priority demotion, no gate renaming.
- **Verification Command**: `node scripts/acceptance-anti-shrinkage.node-test.mjs`

### SOL-11: SOL-TURNKEY-01 (Cryptographic Snapshotting & Orphan-Clean Rollback)
- **Target File**: `scripts/convergence/transactional-task-manager.mjs`
- **Specification**: Pre-task SHA-256 file hashing guarantees byte-for-byte rollback integrity. Rollback deletes newly created orphan files and releases PID write lock.
- **Forbidden Deviations**: No untracked file residue after task rollback.
- **Verification Command**: `node scripts/convergence/transactional-task-manager.mjs status`

### SOL-12: SOL-RELEASE-01 (Git Remote Fast-Forward & SHA Parity)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs`
- **Specification**: Enforces remote SHA equality with `origin/antigravity/farely-v12-product-convergence` with 0 ahead, 0 behind, and zero untracked working-tree artifacts.
- **Forbidden Deviations**: No completion declaration with unpushed commits or untracked changes.
- **Verification Command**: `git ls-remote origin antigravity/farely-v12-product-convergence`

---

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX (CANONICAL CONVERGENCE)

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
- **Handoff Token**: `FARELY-XFER/6-CONVERGENCE-CANONICAL-G71-R5`
- **Cycle**: G71
- **Status**: RESEARCH_COMPLETED_PENDING_COMPILER
- **All 12 Adversarial Lenses Evaluated**: YES (L01 through L12).
- **All 5 Research Passes Completed**: R1 (Baseline) -> R2 (Skeptical Grounding) -> R3 (Negative Vector Hardening) -> R4 (SRE Production Rigor) -> R5 (Canonical Convergence).
- **All 12 Solutions Locked in Section D**: `SOL-DATA-01`, `SOL-PRICE-01`, `SOL-COST-01`, `SOL-AUTH-01`, `SOL-CIRCUIT-01`, `SOL-STALE-01`, `SOL-TELEMETRY-01`, `SOL-MIGRATION-01`, `SOL-PROOF-01`, `SOL-SHRINK-01`, `SOL-TURNKEY-01`, `SOL-RELEASE-01`.
- **Prohibited Capabilities Verified Excluded**: Direct ticketing, passenger checkout, and payment gateway integration strictly boundary_excluded.
- **Target File Integrity**: Every locked solution is mapped to a verified concrete repository file in `src/` or `supabase/`.
- **Next Stage**: Master Goal Compiler G11 (Pass G1 through G5).
