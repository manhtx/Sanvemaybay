# FARELY PROJECT 10X — MASTER GOAL G11 [G4]
# LEVEL: Pass 4: Topological Task Ordering & Automated Verification Commands
# MANDATE: Enforce zero-deadlock topological execution order, turn-key verification commands, and automated test runners.
# GIT_COMMIT: fe54b1f527b82c304ef362570cf4daa235ec8443
# TIMESTAMP: 2026-10-27T10:19:29.639Z
# EXECUTION_RECEIPT_SHA256: 1e9245e9fb274f93a65754ccbd9de8369ae6726beaccf3b411ae7359ed2a60c3

---

## AUDIT & FALSIFICATION OF PASS N-1

Pass G3 locked independent verification gates. In this Pass G4, we subject Pass G3 to topological execution modeling and automated runbook verification, exposing 3 operational deadlocks:

1. **Falsification 1: Missing Transactional Cage Invocations in Execution Order (L11 / DAG-01)**:
   - *Pass G3 Proposal*: Pass G3 specified task names without binding the exact CLI invocations of `transactional-task-manager.mjs`.
   - *Falsification & Turnkey Fix*: Free-form edits risk file corruptions or un-tracked changes if interrupted by token limits or network timeouts. Pass G4 binds every work package to its exact transactional lifecycle commands:
     - `node scripts/convergence/transactional-task-manager.mjs begin <task_id> <target_files...>`
     - [Edit files atomically]
     - `npx vitest run <target_test_file>`
     - `node scripts/convergence/transactional-task-manager.mjs commit <task_id> "<message>"`

2. **Falsification 2: Undefined Test Isolation Boundaries for Proposed New Test Files (L09 & L11 / DAG-02)**:
   - *Pass G3 Proposal*: Pass G3 listed proposed new files (`routeBest.test.ts` and `watchCondition.test.ts`) as targets without specifying snapshot behavior for non-existent files.
   - *Falsification & Turnkey Fix*: `transactional-task-manager.mjs` handles non-existent files by recording `snapshots[file] = null`. On rollback, non-existent files must be unlinked (`fs.unlinkSync`) rather than left as empty files. Pass G4 verifies that both proposed files are tracked with `null` initial snapshots and can be cleanly rolled back if tests fail.

3. **Falsification 3: Missing Full-Regression Proof Oracle Before Cycle Finalization (L12 / DAG-03)**:
   - *Pass G3 Proposal*: Pass G3 relied solely on individual Vitest file runs.
   - *Falsification & Turnkey Fix*: Passing an individual unit test does not prove backward compatibility across all 59 Vitest files and 382 Node native tests. Pass G4 establishes the mandatory regression gate: `npm test` must run and verify that all 825+ tests pass before any git commit or push is initiated.

---

## SECTION B: INVARIANT EXECUTOR CAGE
- `INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION`
- `NO_DIRECT_TICKETING`: Farely does not issue airline tickets, manage PNR records directly, or process ticket issuance.
- `NO_PASSENGER_CHECKOUT`: Farely never collects passenger passport numbers, never handles credit card numbers, and never operates a checkout cart. All bookings route externally via deep links with verified affiliate parameters.
- `NO_SELF_CERTIFICATION`: Every gate is certified strictly by automated Vitest and Node native test suites.
- `NO_CONTRACT_SHRINKAGE`: All 89 capability contracts (F00..F88) and 267 historical acceptance gates remain immutable.

---

## SECTION C: TARGET MODULES & WORK PACKAGES
- **WP01-BUYWAIT-VOLATILITY-SANITIZATION**:
  - Target: `src/domain/farely/buyWaitGuidance.ts`, `src/domain/farely/buyWaitGuidance.test.ts`
  - Sanitize price series to finite numbers $> 0$ in `computeCohortVolatility`.
  - Clamp sample variance to non-negative values before taking `Math.sqrt` (`Math.max(0, variance)`).
  - Clamp `cv` to 0 when mean $\le 0$.
  - Implement calendar-day difference calculation in `evaluateBuyWaitGuidance` to avoid timezone offset errors.
  - Clamp `horizonDays >= 1` and `minTrainingPoints >= 14` in `evaluateRollingHorizonBacktest`.

- **WP02-ROUTEBEST-DETERMINISTIC-ROBUSTNESS**:
  - Target: `src/domain/farely/routeBest.ts`, `src/domain/farely/routeBest.test.ts` [PROPOSED_NEW]
  - Round price comparisons to integer VND in `selectRouteBest` (`Math.round(a.price) - Math.round(b.price)`).
  - Normalize non-positive prices to `0` in `normalizeOfferForIntent`.
  - Slice date strings to 10 characters (`YYYY-MM-DD`) in `evaluateOfferEligibility`.
  - Guard `a.id.localeCompare(b.id)` with `String(a.id || '').localeCompare(String(b.id || ''))`.
  - Create comprehensive unit test suite in `src/domain/farely/routeBest.test.ts` [PROPOSED_NEW] covering all 14 ineligibility reasons.

- **WP03-WATCHCONDITION-EPISODE-SOUNDNESS**:
  - Target: `src/domain/farely/watchCondition.ts`, `src/domain/farely/watchCondition.test.ts` [PROPOSED_NEW]
  - Guard `evaluateWatchCondition` against non-positive (`<= 0`) prices failing closed to `INSUFFICIENT_EVIDENCE`.
  - Self-heal non-positive `active.bestPrice` values in `activeEpisode`.
  - Handle `generationId` mismatch by closing prior episode before opening new generation.
  - Create comprehensive unit test suite in `src/domain/farely/watchCondition.test.ts` [PROPOSED_NEW] verifying full lifecycle NC-017, NC-018, NC-019.

---

## SECTION D: 12 ADVERSARIAL LENSES SPECIFICATION
1. **L01: Product Truth & Founder Scope Integrity**: Mathematical minimum price selection; no commercial deal overrides; strict location scope satisfaction.
2. **L02: Price, Historical Baseline & Data Integrity**: Rejection of NaN, negative, non-finite prices; integer rounding in VND; non-negative variance.
3. **L03: Deal Score, Statistical Confidence & Cost Monotonicity**: 14 observation points over 7 days required; volatility damping prevents false high confidence.
4. **L04: Auth, Privacy, Tenant Isolation & RLS Matrix**: Generation-aware watch condition episodes; isolated pure domain functions.
5. **L05: Provider Drift, Circuit Breakers & Kill Switches**: Fail-closed `UNKNOWN_COMPATIBILITY` classification for unresolvable pricing units or party totals.
6. **L06: Freshness, Stale Degradation & UX Honesty**: Calendar day normalization avoids timezone skew; departed flights return `INSUFFICIENT_DATA`.
7. **L07: Observability, Secret Scrubbing & Error Boundaries**: Strongly-typed ineligibility reasons (`ORIGIN_MISMATCH`, `CABIN_MISMATCH`, etc.) without secrets.
8. **L08: Database Architecture, Schema Drift & Migration Provenance**: Unique partial index on `(watch_id) WHERE closed_at IS NULL` preserves single open episode.
9. **L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)**: C1 unit tests for algorithms; C2 integration tests for Supabase RLS.
10. **L10: Anti-Shrinkage & 267 Historical Gates Traceability**: Preservation of 192 P0, 74 P1, 1 P2 gates verified by contract tests.
11. **L11: Turnkey Execution, Topological DAG & Rollback Runbooks**: ACID transactions via `transactional-task-manager.mjs`.
12. **L12: Zero-Trust Release & Remote Git Synchronization**: Push to `antigravity/farely-v12-product-convergence` with remote SHA equality.

---

## SECTION E: EXACT BEFORE/AFTER DELTAS
(Preserved identically from Pass G2).

---

## SECTION F: NEGATIVE VECTOR DEFENSE MATRIX
- **NV01**: Defended by full candidate array evaluation in `selectRouteBest`.
- **NV04**: Defended by strict `price > 0` validation in `buyWaitGuidance` and `routeBest`.
- **NV08**: Defended by separate historical cohort evaluation and non-negative Bessel variance.
- **NV10**: Defended by calendar day normalization in `buyWaitGuidance`.
- **NV12**: Defended by typed `UNKNOWN_COMPATIBILITY` classification.
- **NV20**: Defended by non-positive price fail-closed check in `watchCondition`.

---

## SECTION G: TOPOLOGICAL TASK EXECUTION ORDER
```bash
# Phase 1: WP01
node scripts/convergence/transactional-task-manager.mjs begin WP01-BUYWAIT-VOLATILITY-SANITIZATION src/domain/farely/buyWaitGuidance.ts src/domain/farely/buyWaitGuidance.test.ts
npx vitest run src/domain/farely/buyWaitGuidance.test.ts
node scripts/convergence/transactional-task-manager.mjs commit WP01-BUYWAIT-VOLATILITY-SANITIZATION "buyWaitGuidance: volatility sanitization green"

# Phase 2: WP02
node scripts/convergence/transactional-task-manager.mjs begin WP02-ROUTEBEST-DETERMINISTIC-ROBUSTNESS src/domain/farely/routeBest.ts src/domain/farely/routeBest.test.ts
npx vitest run src/domain/farely/routeBest.test.ts
node scripts/convergence/transactional-task-manager.mjs commit WP02-ROUTEBEST-DETERMINISTIC-ROBUSTNESS "routeBest: deterministic integer VND and date slicing green"

# Phase 3: WP03
node scripts/convergence/transactional-task-manager.mjs begin WP03-WATCHCONDITION-EPISODE-SOUNDNESS src/domain/farely/watchCondition.ts src/domain/farely/watchCondition.test.ts
npx vitest run src/domain/farely/watchCondition.test.ts
node scripts/convergence/transactional-task-manager.mjs commit WP03-WATCHCONDITION-EPISODE-SOUNDNESS "watchCondition: episode soundness and non-positive price defense green"
```

---

## SECTION H: VERIFICATION COMMAND SUITE
- `npx vitest run src/domain/farely/buyWaitGuidance.test.ts`
- `npx vitest run src/domain/farely/routeBest.test.ts`
- `npx vitest run src/domain/farely/watchCondition.test.ts`
- `npm test`

---

## SECTION I: ROLLBACK & SRE RUNBOOK
- On task failure: `node scripts/convergence/transactional-task-manager.mjs rollback <task_id>`
- To inspect status: `node scripts/convergence/transactional-task-manager.mjs status`

---

## SECTION J: ZERO-TRUST GIT SYNCHRONIZATION
- Commit message format: `feat(convergence): complete Cycle G91 5x5 recursive convergence and lock WP01-WP03`
- Push target: `origin/antigravity/farely-v12-product-convergence`
- Parity command: `git ls-remote origin antigravity/farely-v12-product-convergence`

---

## SECTION K: COMMITMENT & HANDOFF CONTRACT
This Master Goal is completely locked and self-contained. The executor must follow all steps sequentially using the transactional task manager.
