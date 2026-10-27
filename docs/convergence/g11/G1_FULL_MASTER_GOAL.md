# FARELY PROJECT 10X — MASTER GOAL G11 [G1]
# LEVEL: Pass 1: Lossless Structural Projection A–K
# MANDATE: Project FARELY-XFER/6 into an 11-section A–K Master Goal across all 12 adversarial lenses with strict Solution Cage locking.
# GIT_COMMIT: fe54b1f527b82c304ef362570cf4daa235ec8443
# TIMESTAMP: 2026-10-27T10:16:52.269Z
# EXECUTION_RECEIPT_SHA256: bfa37db81b12d81eeb38a7323c6716dcda18eb6876a99461294800f9d29cadef

---

## SECTION A: OBJECTIVE & MANDATE
This Master Goal defines the turnkey execution package for Cycle G91 of Farely Project 10X. All work packages are strictly bound to verified solutions from Research R10 (`docs/convergence/r10/R5_FULL_RESEARCH.md`). The executor is granted zero degrees of freedom to deviate, weaken, or omit any locked requirements.

Target Modules:
1. `src/domain/farely/buyWaitGuidance.ts` & `src/domain/farely/buyWaitGuidance.test.ts`
2. `src/domain/farely/routeBest.ts` & `src/domain/farely/routeBest.test.ts` [PROPOSED_NEW]
3. `src/domain/farely/watchCondition.ts` & `src/domain/farely/watchCondition.test.ts` [PROPOSED_NEW]

---

## SECTION B: INVARIANT EXECUTOR CAGE
- `INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION`
- `NO_DIRECT_TICKETING`: Farely does not issue airline tickets, manage PNR records directly, or process ticket issuance.
- `NO_PASSENGER_CHECKOUT`: Farely never collects passenger passport numbers, never handles credit card numbers, and never operates a checkout cart. All bookings route externally via deep links with verified affiliate parameters.
- `NO_SELF_CERTIFICATION`: All gates must be certified by independent, automated Vitest and Node native test executions.
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
  - Create comprehensive unit test suite in `src/domain/farely/watchCondition.test.ts` [PROPOSED_NEW] verifying NC-017, NC-018, NC-019.

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
- `src/domain/farely/buyWaitGuidance.ts`:
  - Before: `computeCohortVolatility` accepts dirty arrays and can output `NaN`. Day diff uses naive Date math subject to timezone skew.
  - After: Sanitizes prices, clamps variance to $\ge 0$, guards mean $\le 0$, and normalizes calendar days.
- `src/domain/farely/routeBest.ts`:
  - Before: Floating point price sort, un-sliced ISO timestamps causing false date mismatches, unguarded `id.localeCompare`.
  - After: Integer VND rounding, 10-char date slicing, safe `String(id).localeCompare`.
- `src/domain/farely/watchCondition.ts`:
  - Before: Negative prices bypass non-finite check and trigger false alerts; corrupted `bestPrice <= 0` suppresses future alerts.
  - After: Non-positive prices fail closed to `INSUFFICIENT_EVIDENCE`; self-healing `bestPrice`.

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
1. Task 1: `WP01-BUYWAIT-VOLATILITY-SANITIZATION`
2. Task 2: `WP02-ROUTEBEST-DETERMINISTIC-ROBUSTNESS`
3. Task 3: `WP03-WATCHCONDITION-EPISODE-SOUNDNESS`

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
