# FARELY PROJECT 10X — MASTER GOAL G11 [G3]
# LEVEL: Pass 3: Anti-Fake Done & Independent Gates Hardening
# MANDATE: Assume Pass 2 missed edge cases across all 12 lenses. Attack with 24 negative vectors, lock independent verification gates, and forbid self-certification.
# GIT_COMMIT: fe54b1f527b82c304ef362570cf4daa235ec8443
# TIMESTAMP: 2026-10-27T10:18:38.777Z
# EXECUTION_RECEIPT_SHA256: eb4439911357911717ce216764d96d7ab28e50392a37021466b6c111dda99336

---

## AUDIT & FALSIFICATION OF PASS N-1

Pass G2 specified code-level before/after implementations. In this Pass G3, we audit Pass G2 through the lens of Anti-Fake Done (L09) and adversarial negative vectors, exposing 3 critical testing and verification gaps:

1. **Falsification 1: Incomplete Ineligibility Matrix Coverage in `routeBest.test.ts` (L07 & L09 / GATE-01)**:
   - *Pass G2 Proposal*: Pass G2 proposed creating `routeBest.test.ts` without enumerating mandatory test cases for all 14 `IneligibilityReason` codes.
   - *Falsification & Hardened Gate*: The domain kernel defines exactly 14 ineligibility codes: `ORIGIN_MISMATCH`, `DESTINATION_MISMATCH`, `OUTBOUND_DATE_MISMATCH`, `RETURN_DATE_MISMATCH`, `MISSING_RETURN_DATE`, `CABIN_MISMATCH`, `STOPS_EXCEEDED`, `DURATION_EXCEEDED`, `CURRENCY_MISMATCH`, `INVALID_PRICE`, `UNKNOWN_STOPS`, `UNKNOWN_DURATION`, `UNKNOWN_CABIN`, `UNKNOWN_COMPATIBILITY`. If any of these branches are unexercised by dedicated assertions, silent regressions can compromise mathematical route selection. Pass G3 locks an independent gate: `src/domain/farely/routeBest.test.ts` must contain explicit tests asserting that every single one of the 14 reasons is correctly triggered.

2. **Falsification 2: Missing Full Lifecycle State Machine Transitions in `watchCondition.test.ts` (L04 & L09 / GATE-02)**:
   - *Pass G2 Proposal*: Pass G2 referenced NC-017, NC-018, NC-019 without requiring full episode state transition chaining.
   - *Falsification & Hardened Gate*: Unit tests that evaluate isolated transitions (e.g. only testing `ENTERED`) fail to prove state machine continuity. Pass G3 locks the requirement that `src/domain/farely/watchCondition.test.ts` must execute an unbroken sequence:
     `null` -> (price 1.8M <= target 2M) -> `ENTERED`
     -> (price 1.75M, 2.7% drop <= 5%) -> `STILL_INSIDE` (`shouldAlert: false`)
     -> (price 1.6M, 11% drop > 5%) -> `MATERIAL_IMPROVEMENT` (`shouldAlert: true`, `bestPrice: 1.6M`)
     -> (price 2.1M > target 2M) -> `EXITED` (`closedAt` set, `shouldAlert: false`)
     -> (price 1.9M <= target 2M) -> `REENTERED` (`shouldAlert: true`, new cycle)
     -> (price -500k or NaN) -> `INSUFFICIENT_EVIDENCE` (no transition, no alert).

3. **Falsification 3: Missing Dirty Input Regression Probes in `buyWaitGuidance.test.ts` (L02 & L09 / GATE-03)**:
   - *Pass G2 Proposal*: Pass G2 proposed testing clean price histories.
   - *Falsification & Hardened Gate*: Testing clean price histories never verifies that NaN volatility damping is fixed. Pass G3 mandates explicit unit tests asserting that:
     1. `computeCohortVolatility([1000000, NaN, null as any, -500, 2000000])` returns clean, finite variance and standard deviation $> 0$.
     2. `computeCohortVolatility([1500000, 1500000])` returns variance 0 and cv 0 without NaN square roots.
     3. Calling `evaluateBuyWaitGuidance` with departed flight returns `INSUFFICIENT_DATA`.
     4. Calling `evaluateRollingHorizonBacktest` with `horizonDays: 0` clamps to minimum 1 day.

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
