# FARELY PROJECT 10X — MASTER GOAL G11 [G2]
# LEVEL: Pass 2: Before/After Specification Deepening
# MANDATE: Assume Pass 1 was naive across all 12 lenses. Deepen file-level before/after specifications, data structures, and deterministic verification.
# GIT_COMMIT: fe54b1f527b82c304ef362570cf4daa235ec8443
# TIMESTAMP: 2026-10-27T10:17:38.162Z
# EXECUTION_RECEIPT_SHA256: 8f27cb1a4bf63aa77444948de790ac2f2c6fb02699840d72da7ded9b7c0ddcca

---

## AUDIT & FALSIFICATION OF PASS N-1

Pass G1 projected the structural A–K framework. In this Pass G2, we subject Pass G1 to empirical code-level scrutiny and falsify 3 underspecified implementation details:

1. **Falsification 1: Underspecified Calendar Day Calculation in `buyWaitGuidance.ts` (L02 & L06)**:
   - *Pass G1 Proposal*: Pass G1 stated "implement calendar-day difference calculation to avoid timezone offset errors" without concrete code specs.
   - *Falsification & Concrete Before/After Spec*: In `src/domain/farely/buyWaitGuidance.ts#L142-L158`:
     ```typescript
     // BEFORE:
     const evalMs = params.evaluationDate ? Date.parse(params.evaluationDate) : Date.now();
     const evalDate = Number.isFinite(evalMs) ? new Date(evalMs) : new Date();
     const depDate = new Date(params.departureDate);
     const daysUntilDeparture = Math.round((depDate.getTime() - evalDate.getTime()) / (1000 * 60 * 60 * 24));

     // AFTER:
     const evalIso = (params.evaluationDate && !isNaN(Date.parse(params.evaluationDate)))
       ? new Date(params.evaluationDate).toISOString().slice(0, 10)
       : new Date().toISOString().slice(0, 10);
     const depIso = (typeof params.departureDate === 'string' && params.departureDate.length >= 10)
       ? params.departureDate.slice(0, 10)
       : '';
     if (!depIso || isNaN(Date.parse(depIso))) {
       return {
         recommendation: "INSUFFICIENT_DATA",
         confidence: 0,
         isCalibrated: false,
         sampleCount: validPoints.length,
         timespanDays,
         rationaleVi: "Ngày khởi hành không hợp lệ hoặc không thể phân tích.",
         scopeType,
       };
     }
     const daysUntilDeparture = Math.round((Date.parse(depIso + "T00:00:00Z") - Date.parse(evalIso + "T00:00:00Z")) / 86400000);
     ```

2. **Falsification 2: Underspecified Date Normalization in `routeBest.ts` (L01 & L05)**:
   - *Pass G1 Proposal*: Pass G1 stated "slice date strings to 10 characters" without specifying window boundary comparisons.
   - *Falsification & Concrete Before/After Spec*: In `src/domain/farely/routeBest.ts#L96-L115`:
     ```typescript
     // BEFORE:
     if (intent.journeyType === 'ROUND_TRIP') {
       if (!offer.returnDate) {
         reasons.push('MISSING_RETURN_DATE');
       } else if (intent.inbound?.exact && offer.returnDate !== intent.inbound.exact) {
         reasons.push('RETURN_DATE_MISMATCH');
       }
     }
     if (intent.outbound.exact && offer.departDate !== intent.outbound.exact) {
       reasons.push('OUTBOUND_DATE_MISMATCH');
     }

     // AFTER:
     const offerDepart = (offer.departDate || '').slice(0, 10);
     const intentDepart = intent.outbound.exact ? intent.outbound.exact.slice(0, 10) : undefined;
     if (intentDepart && offerDepart !== intentDepart) {
       reasons.push('OUTBOUND_DATE_MISMATCH');
     } else if (intent.outbound.from && intent.outbound.to) {
       const from = intent.outbound.from.slice(0, 10);
       const to = intent.outbound.to.slice(0, 10);
       if (offerDepart < from || offerDepart > to) {
         reasons.push('OUTBOUND_DATE_MISMATCH');
       }
     }
     ```

3. **Falsification 3: Underspecified Non-Positive Observed Price Check in `watchCondition.ts` (L04 & L08)**:
   - *Pass G1 Proposal*: Pass G1 mentioned "guard against non-positive prices" but did not specify the fail-closed return signature.
   - *Falsification & Concrete Before/After Spec*: In `src/domain/farely/watchCondition.ts#L57-L67`:
     ```typescript
     // BEFORE:
     if (
       params.conditionInput === 'INSUFFICIENT_EVIDENCE' ||
       params.observedPrice == null ||
       !Number.isFinite(params.observedPrice)
     )

     // AFTER:
     if (
       params.conditionInput === 'INSUFFICIENT_EVIDENCE' ||
       params.observedPrice == null ||
       !Number.isFinite(params.observedPrice) ||
       params.observedPrice <= 0
     ) {
       return {
         nextEpisode: active,
         stateChanged: false,
         shouldAlert: false,
         transitionReason: 'INSUFFICIENT_EVIDENCE: Scope unmonitored, no observations, or invalid non-positive price. Episode state preserved intact.'
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
(See detailed code specs in Audit & Falsification section above).

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
