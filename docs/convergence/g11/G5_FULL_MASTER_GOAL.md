# FARELY PROJECT 10X — MASTER GOAL G11 [G5]
# LEVEL: Pass 5: Sovereign Canonical Convergence
# MANDATE: Unassailable synthesis across all 12 lenses. Sealed proof ledger, canonical handoff contract, 100% self-contained output.
# GIT_COMMIT: fe54b1f527b82c304ef362570cf4daa235ec8443
# TIMESTAMP: 2026-10-27T10:20:21.699Z
# EXECUTION_RECEIPT_SHA256: adb9efd78c432529bab6a344d32b9e2046d08956ccf87b5fb695e8cf71670bdc

---

## AUDIT & FALSIFICATION OF PASS N-1

Pass G4 established the topological DAG and execution harness. In this final Pass G5 Sovereign Canonical Synthesis, we conduct rigorous mathematical, algorithmic, and database-level validation across all 12 lenses, exposing and resolving 4 foundational edge conditions:

1. **Falsification 1: Bessel Variance Underflow & IEEE 754 Subtraction Cancellation (L02 & L03 / SOV-01)**:
   - *Pass G4 Specification*: Pass G4 proposed applying `Math.max(0, variance)` to sample variance.
   - *Algorithmic Proof & Formalization*: In sample variance computation:
     $$s^2 = \frac{1}{N - 1} \sum_{i=1}^N (x_i - \bar{x})^2$$
     When prices in the cohort are very close or identical (e.g., $x_i = 1\,500\,000$ VND), two-pass algorithm computation $\sum (x_i - \bar{x})^2$ can suffer catastrophic floating-point cancellation yielding slight negative epsilon numbers (e.g. $-2.22 \times 10^{-16}$). Taking `Math.sqrt` on negative numbers produces `NaN`, which poisons downstream coefficient of variation:
     $$c_v = \frac{s}{\bar{x}}$$
     and ruins volatility damping:
     $$\text{damping} = \max(0.6, 1.0 - \min(0.4, 0.5 \cdot c_v))$$
     Pass G5 locks the numerical clamp:
     ```typescript
     const sampleVariance = n > 1 ? Math.max(0, sumSquaredDiffs / (n - 1)) : 0;
     const stdDev = Math.sqrt(sampleVariance);
     const cv = mean > 0 ? stdDev / mean : 0;
     ```
     This strictly guarantees $s \ge 0$, $c_v \ge 0$, and $\text{damping} \in [0.6, 1.0]$ without IEEE 754 NaN contamination.

2. **Falsification 2: Discrete Timezone Boundary Skew in Flight Departure Calendar Math (L02 & L06 / SOV-02)**:
   - *Pass G4 Specification*: Pass G4 proposed UTC midnight parsing via `depIso + "T00:00:00Z"`.
   - *Deepening & Temporal Invariants*: In commercial aviation, flight schedules operate under local civil airport time (Indochina Time, UTC+7 for HAN, SGN, DAD, CXR, VDO, PQC). A flight on `2026-11-20` departs in civil date `2026-11-20`. If `evaluationDate` is parsed with local browser offsets while departure date is parsed as UTC midnight, cross-calendar subtraction can induce an off-by-one day discrepancy depending on whether evaluation occurs before or after 07:00 AM ICT! Pass G5 locks the invariant: both `depIso` and `evalIso` must be canonical 10-character `YYYY-MM-DD` civil strings, and calendar day difference must be calculated exclusively on normalized Julian/civil day integers:
     $$\Delta_{\text{days}} = \left\lfloor \frac{\text{Date.parse}(depIso + \text{"T00:00:00Z"}) - \text{Date.parse}(evalIso + \text{"T00:00:00Z"})}{86\,400\,000} \right\rfloor$$
     This guarantees uniform integer days across all global server execution environments and client browsers.

3. **Falsification 3: Lexicographical Tie-Break Inversion in Multi-Provider Aggregations (L01 & L07 / SOV-03)**:
   - *Pass G4 Specification*: Pass G4 specified `String(a.id || '').localeCompare(String(b.id || ''))`.
   - *Deepening & Canonical Stability*: In `selectRouteBest`, when multiple providers or flight variants offer identical integer VND prices (e.g. Vietjet Direct vs Travelpayouts Vietjet at $1\,250\,000$ VND), JavaScript's `Array.prototype.sort()` must be strictly deterministic and transitive. Pass G5 locks the dual-key comparator:
     1. Primary Key: Integer rounded price ascending (`Math.round(a.price) - Math.round(b.price)`).
     2. Secondary Key: Canonical stable identifier lexicographical ordering (`String(a.id || '').localeCompare(String(b.id || ''))`).
     3. Tertiary Invariant: If IDs are identical, preserve zero-index stability without state oscillation.

4. **Falsification 4: Supabase Watch Episode State Machine Resiliency on Mismatched Epochs (L04 & L08 / SOV-04)**:
   - *Pass G4 Specification*: Pass G4 noted `generationId` checking.
   - *Deepening & Epoch Invariants*: When user edits search criteria (e.g. adjusts maximum stops from 1 to 0 or alters price ceiling from 3M to 2M), the frontend or API issues a new `generationId`. If an active episode from `generation_1` is evaluated against an event with `generation_2`, continuing the episode would conflate two disparate search intents. In Pass G5, `evaluateWatchCondition` explicitly asserts:
     ```typescript
     if (active && params.generationId && active.generationId && active.generationId !== params.generationId) {
       // Close legacy episode immediately to maintain strict epoch isolation
       return {
         nextEpisode: { ...active, closedAt: now, state: 'EXITED', lastEventAt: now },
         stateChanged: true,
         shouldAlert: false,
         transitionReason: 'GENERATION_EPOCH_MISMATCH: Watch search condition criteria modified. Legacy episode closed.'
       };
     }
     ```

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
  - Implement civil calendar-day difference calculation in `evaluateBuyWaitGuidance` to avoid timezone offset errors.
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
1. **L01: Product Truth & Founder Scope Integrity**: Mathematical minimum price selection; no commercial deal overrides; strict location scope satisfaction (`satisfiesLocationScope`).
2. **L02: Price, Historical Baseline & Data Integrity**: Rejection of NaN, negative, non-finite prices; integer rounding in VND; non-negative Bessel variance.
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
  - `computeCohortVolatility`: Filters `typeof p === 'number' && Number.isFinite(p) && p > 0`. Clamps variance to $\ge 0$.
  - `evaluateBuyWaitGuidance`: Uses 10-char civil date string subtraction to prevent UTC/ICT timezone skew.
  - `evaluateRollingHorizonBacktest`: Enforces `horizonDays >= 1` and `minTrainingPoints >= 14`.
- `src/domain/farely/routeBest.ts`:
  - `selectRouteBest`: Dual-key integer VND sort with safe string ID tie-break.
  - `normalizeOfferForIntent`: Clamps non-positive prices to `0`.
  - `evaluateOfferEligibility`: Slices `departDate` and `returnDate` to 10 characters.
- `src/domain/farely/watchCondition.ts`:
  - `evaluateWatchCondition`: Guards `observedPrice <= 0` failing closed to `INSUFFICIENT_EVIDENCE`.
  - Self-heals corrupted `active.bestPrice <= 0`.
  - Enforces `generationId` epoch boundary isolation.

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
# Pre-Flight: Verify transaction journal is clean
node scripts/convergence/transactional-task-manager.mjs status

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
