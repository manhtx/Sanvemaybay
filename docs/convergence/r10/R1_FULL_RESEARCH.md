# FARELY PROJECT 10X — RESEARCH R10 [R1]
# LEVEL: Pass 1: Full-Battery Baseline Synthesis
# MANDATE: Draft complete deliverable evaluating all 12 lenses simultaneously from current system knowledge and founder scope.
# GIT_COMMIT: fe54b1f527b82c304ef362570cf4daa235ec8443
# TIMESTAMP: 2026-10-27T10:09:11.386Z
# EXECUTION_RECEIPT_SHA256: dacc7f415ee1d54861ce91ee5c137aa34fa2f4e0b8a54fa497fab995c6115f55

---

## EXECUTIVE TARGET SUMMARY FOR CYCLE G91

Following the canonical completion and remote verification of Cycle G90 (`fe54b1f`), Cycle G91 focuses on deep hardening and mathematical soundness of three mission-critical core domain engines:
1. **Target 1 (`src/domain/farely/buyWaitGuidance.ts`)**: Trust-Calibrated Buy/Wait Guidance (F36). Currently vulnerable to dirty historical price arrays (NaN/negatives causing NaN volatility damping), missing close-in zero-day flight departure handling (`daysUntilDeparture === 0`), and unbounded price spike anomalies masquerading as valid buy/wait inputs.
2. **Target 2 (`src/domain/farely/routeBest.ts`)**: Mathematical Minimum Selection & Eligibility Kernel (REQ-PRICE-001..006, NC-001, NC-002, NC-004, NC-005, NC-006). Lacks dedicated unit test suite (`src/domain/farely/routeBest.test.ts`), vulnerable to sub-unit floating point currency ties in VND, and needs date string sanitization on window boundaries.
3. **Target 3 (`src/domain/farely/watchCondition.ts`)**: Watch Condition State Machine & Notification Boundary (REQ-DATA-004, REQ-WATCH-015..018, NC-017..019). Lacks dedicated unit test suite (`src/domain/farely/watchCondition.test.ts`), needs strict protection against negative or NaN observed prices failing-closed to `INSUFFICIENT_EVIDENCE`, and explicit verification of episode transition deduplication.

### Core Non-OTA Product Boundary Invariants
- `NO_DIRECT_TICKETING`: Farely does not issue airline tickets, manage PNR records directly, or process ticket issuance.
- `NO_PASSENGER_CHECKOUT`: Farely never collects passenger passport numbers, never handles credit card numbers, and never operates a checkout cart. All bookings route externally via deep links with verified affiliate parameters.

---

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Anti-OTA conflation; exact jobs-to-be-done F1.1; no fake deal booking claims; preservation of F1..F26.
- **Physical Code Citations**: `src/domain/farely/routeBest.ts:201-230`, `src/domain/farely/watchCondition.ts:43-85`
- **Adversarial Vector Defense**: Defends against NEG-01 (lowest comparable offer on last database page) and NEG-34 (external click counted as booking). `routeBest.ts` selects strictly the mathematical minimum price among verified eligible offers; deal scores never override a lower compatible price (NC-001). `watchCondition.ts` only transitions to `ENTERED` or `MATERIAL_IMPROVEMENT` when the observed fare is strictly below the target threshold.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts:154-180` and `src/domain/farely/domainKernel.test.ts:74-95`.

---

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Rejection of NaN, negative prices, unbounded numbers; exact price semantics (indicative vs observed vs bookable).
- **Physical Code Citations**: `src/domain/farely/buyWaitGuidance.ts:52-60`, `src/domain/farely/routeBest.ts:151-155`
- **Adversarial Vector Defense**: Defends against NEG-04 (unknown mandatory fee becomes 0) and NEG-08 (current observation included in own baseline). In `buyWaitGuidance.ts`, `computeCohortVolatility` currently iterates raw `prices` without filtering out NaN or negative values. If a dirty price point enters, `stdDev` becomes `NaN`, which poisons `volatilityDamping` and produces `NaN` confidence scores. Prices must be sanitized to positive finite numbers before calculating sample variance.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/buyWaitGuidance.test.ts:1-70`.

---

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Anti-hallucinated discount claims; deal score must be backed by sample confidence and total cost of trip.
- **Physical Code Citations**: `src/domain/farely/buyWaitGuidance.ts:102-113`, `src/domain/farely/buyWaitGuidance.ts:176-180`
- **Adversarial Vector Defense**: Defends against NEG-09 (one scan creates false 12-sample strong evidence). `buyWaitGuidance.ts` strictly enforces minimum 14 observation points spanning at least 7 distinct days before providing any directional advice. In Cycle G91, we defend against extreme outliers (>5x median) skewing the confidence calculation by capping volatility damping and providing outlier warnings.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/buyWaitGuidance.test.ts:120-150`.

---

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
- **Focus**: Multi-tenant isolation; strict Supabase RLS policies; protection of personal watch alerts and user credentials.
- **Physical Code Citations**: `src/domain/farely/watchCondition.ts:14-25`, `supabase/migrations/20261022000001_watch_condition_episodes.sql:20-55`
- **Adversarial Vector Defense**: Defends against NEG-19 (User A accesses User B's Watch/email) and NEG-20 (Paused/unsubscribed Watch receives new alert). `WatchConditionEpisode` maintains explicit `watchId` and `generationId` bindings. Transitions are evaluated per watch episode with strict owner RLS validation in database RPC `record_watch_episode_transition`.
- **Verification Proof (C0..C4)**: C2 Integration test in `scripts/database-architecture-contract.node-test.mjs:154-175`.

---

### L05: Provider Drift, Circuit Breakers & Kill Switches
- **Focus**: Resilience against partner schema changes, 429 rate limits, 503 outages, and dirty payload quarantine.
- **Physical Code Citations**: `src/domain/farely/routeBest.ts:156-166`, `src/domain/farely/providerResult.ts:1-45`
- **Adversarial Vector Defense**: Defends against NEG-12 (HTTP 503/429/parser failure becomes empty). In `routeBest.ts`, offers with unknown pricing units or unresolvable party totals with children/infants are classified as `UNKNOWN_COMPATIBILITY` rather than being silently dropped or assumed eligible.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts:96-150`.

---

### L06: Freshness, Stale Degradation & UX Honesty
- **Focus**: Stale indicators for data >360m; no masking errors as 0 deals; transparent source attribution and observed_at.
- **Physical Code Citations**: `src/domain/farely/buyWaitGuidance.ts:141-170`, `src/domain/farely/watchCondition.ts:50-54`
- **Adversarial Vector Defense**: Defends against NEG-10 (departure date used as observation timestamp) and NEG-35 (offline cache shown as fresh). `buyWaitGuidance.ts` verifies `departureDate` against `evaluationDate`. If flight has already departed (`daysUntilDeparture < 0`), it returns `INSUFFICIENT_DATA`. In Cycle G91, for flights departing today (`daysUntilDeparture === 0`), it provides immediate `BUY_NOW` advice due to impending gate closure.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/buyWaitGuidance.test.ts:180-210`.

---

### L07: Observability, Secret Scrubbing & Error Boundaries
- **Focus**: Zero secret leakage in client/browser logs; client error boundaries; structured diagnostic tags.
- **Physical Code Citations**: `src/domain/farely/watchCondition.ts:27-32`, `src/domain/farely/routeBest.ts:26-49`
- **Adversarial Vector Defense**: Defends against NEG-39 (no useful opportunities while status says healthy). All ineligible offers emit strongly-typed reason codes (`IneligibilityReason`: `ORIGIN_MISMATCH`, `CABIN_MISMATCH`, `STOPS_EXCEEDED`, `UNKNOWN_STOPS`, etc.) without exposing internal tokens, partner credentials, or raw stack traces.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts:154-180`.

---

### L08: Database Architecture, Schema Drift & Migration Provenance
- **Focus**: Zero unversioned migration drift; bidirectional parity; single open episode constraint.
- **Physical Code Citations**: `supabase/migrations/20261022000001_watch_condition_episodes.sql:1-60`
- **Adversarial Vector Defense**: Defends against NEG-22 (reclaimed lease triggers duplicate alert). Database schema enforces unique partial index on `(watch_id) WHERE closed_at IS NULL`, guaranteeing that at most one active episode can exist per watch.
- **Verification Proof (C0..C4)**: C2 Integration test in `scripts/database-architecture-contract.node-test.mjs:160-190`.

---

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
- **Focus**: Strict separation: C0 Contract != C1 Unit != C2 Integration != C3 Runtime != C4 Soak.
- **Physical Code Citations**: `docs/convergence/ACCEPTANCE_REGISTRY_FINAL.json:1-100`
- **Adversarial Vector Defense**: Defends against NEG-40 (executor-written proof declares all 89 accepted). C1 unit tests for `routeBest.ts`, `buyWaitGuidance.ts`, and `watchCondition.ts` only certify code correctness (C1); they do not certify live provider throughput (C3) or 24-hour alert delivery soak (C4).
- **Verification Proof (C0..C4)**: Full test execution suite (Vitest + Node test).

---

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
- **Focus**: Preservation of all 192 P0, 74 P1, 1 P2 historical gates; zero contract shrinkage.
- **Physical Code Citations**: `scripts/verify-certification-integrity.node-test.mjs:1-120`
- **Adversarial Vector Defense**: Defends against NEG-30 (gate name retained only in comment) and NEG-33 (267 IDs retained but acceptance semantics weakened). Traceability is validated across all 267 gates via automated contract tests.
- **Verification Proof (C0..C4)**: C0 Contract proof in `scripts/verify-certification-integrity.node-test.mjs`.

---

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
- **Focus**: Zero-deadlock dependency order; file-level before/after specs; transactional ACID rollbacks.
- **Physical Code Citations**: `scripts/convergence/transactional-task-manager.mjs:1-150`
- **Adversarial Vector Defense**: Defends against task execution corruption. Work packages are isolated in transactional cages (`begin` -> atomic edits -> `vitest` verification -> `commit`). In event of failure, pre-task snapshots are immediately restored.
- **Verification Proof (C0..C4)**: C1 Verification in `scripts/convergence/transactional-task-manager.mjs`.

---

### L12: Zero-Trust Release & Remote Git Synchronization
- **Focus**: Local green != Done; mandatory push with remote SHA equality verified via `git ls-remote`.
- **Physical Code Citations**: `scripts/convergence/continuous_5x5_orchestrator.mjs:1-250`
- **Adversarial Vector Defense**: Defends against NEG-25 (fake release tuple with matching strings passes) and NEG-27 (CI passes while production FE/Edge incompatible). Every cycle concludes with git push to `origin/antigravity/farely-v12-product-convergence` and remote SHA verification.
- **Verification Proof (C0..C4)**: `git ls-remote origin antigravity/farely-v12-product-convergence` equality proof.

---

## CONVERGENCE RESEARCH PACKET (FARELY-XFER/6)

### Target Scope for Cycle G91
1. **WP01-BUYWAIT-VOLATILITY-SANITIZATION**:
   - Sanitize price array inputs in `computeCohortVolatility` to finite positive numbers.
   - Guard against zero sample points or dirty arrays.
   - Add same-day departure detection (`daysUntilDeparture === 0`) escalating to `BUY_NOW` due to imminent gate closure.
   - Update `src/domain/farely/buyWaitGuidance.test.ts`.

2. **WP02-ROUTEBEST-DETERMINISTIC-ROBUSTNESS**:
   - Round price comparisons to integer VND in `selectRouteBest` to avoid float precision ties.
   - Ensure `offer.departDate` and `offer.returnDate` validation checks handle edge cases.
   - Create comprehensive unit test suite `src/domain/farely/routeBest.test.ts` covering all 14 ineligibility reasons and edge cases.

3. **WP03-WATCHCONDITION-EPISODE-SOUNDNESS**:
   - Protect `evaluateWatchCondition` against non-finite or negative `observedPrice` (fail-closed to `INSUFFICIENT_EVIDENCE`).
   - Validate transition reasons and prevent state oscillation on boundary thresholds.
   - Create dedicated unit test suite `src/domain/farely/watchCondition.test.ts` covering NC-017, NC-018, NC-019.
