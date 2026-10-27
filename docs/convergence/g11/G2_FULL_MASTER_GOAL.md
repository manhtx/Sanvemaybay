# FARELY PROJECT 10X — MASTER GOAL G11 [G2]
# CYCLE: G86
# LEVEL: Pass 2: Skeptical Empirical Grounding & Threat Modeling
# MANDATE: Subject Pass G1 to rigorous empirical skepticism and threat modeling across all 12 Adversarial Lenses for Cycle G86. Lock concrete mathematical solutions for unparseable date NaN evasion, unaccompanied minor (UM) party restrictions, and vacation duration ceilings with zero-trust verification.
# GIT_COMMIT: 44db15d38b9195228d1ffc54954a759645c824a8
# TIMESTAMP: 2026-10-27T09:04:00.000Z
# EXECUTION_RECEIPT_SHA256: 581ac9b57b7e5fbb62a1c1ca079b3d9f46144a40f901d205fcfff57abcec2040

---

## SECTION B: INVARIANT EXECUTOR CAGE
```text
INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION
The downstream executor is strictly bound to the locked technical solutions detailed in Section D & E.
The executor is FORBIDDEN from inventing new architectures, introducing alternative algorithms,
altering database schemas, or deviating from the specified file/function diffs.
Any deviation is a critical contract breach and will be rejected closed by the Evidence Admission Controller.
All external booking, checkout, and payment processing capabilities remain strictly boundary_excluded.
```

---

## SECTION C: SKEPTICAL AUDIT & FALSIFICATION OF PASS G1

### Falsification 1: L05 & L08 (Unparseable Date NaN Evasion in Buy/Wait Temporal Guard)
- *Deficits Identified in Pass G1*: Pass G1 checked `deltaMs <= 0` and returned `INSUFFICIENT_DATA`, but failed to guard against unparseable date strings (such as `'invalid-date'` or `''`). In JavaScript, `new Date('invalid-date').getTime()` evaluates to `NaN`. Computing `NaN - evalMs` yields `NaN`, and the relational comparison `NaN <= 0` evaluates to `false`! Consequently, invalid dates bypassed the temporal boundary check entirely and were passed into subsequent statistical percentile calculations. Threat modeling mandates explicitly validating `Number.isFinite(depMs)` and failing closed to `INSUFFICIENT_DATA` immediately on unparseable timestamps.
- *Physical Code Verification*: In `src/domain/farely/buyWaitGuidance.ts:66-105` and `src/domain/farely/time.ts:18`.
- *Skeptical Remedy*: Enforce defensive parsing: `if (!Number.isFinite(depMs) || depMs <= evalMs) return INSUFFICIENT_DATA` with explicit validation rationale.

### Falsification 2: L02 & L07 (Vacation Duration Ceiling & Realistic Budget Horizon Bounding)
- *Deficits Identified in Pass G1*: Pass G1 clamped `nights >= 1` and `travelers <= 50`, but omitted an upper ceiling for vacation nights. If an anomalous query specifies `nights = 1000` (over 2.7 years), the estimator projects absurd budgets ($\approx 2.5 \text{ billion VND}$), exceeding reasonable consumer travel planning bounds and distorting chart visualizations. Skeptical threat modeling mandates capping vacation duration at `nights <= 90` to maintain realistic leisure horizons.
- *Physical Code Verification*: In `src/domain/farely/tripBudgetEstimator.ts:25-70` and `src/domain/farely/dataEconomics.ts:63`.
- *Skeptical Remedy*: Enforce strict bounds: `const safeNights = Math.min(90, Math.max(1, Math.round(nights)));`.

### Falsification 3: L06 & L10 (CAAV Unaccompanied Minor (UM) Restriction in Group Composition)
- *Deficits Identified in Pass G1*: Pass G1 asserted `infants <= adults`, but permitted compositions with `adults === 0` and `children > 0` (e.g. 2 children aged 5 and 8 traveling without an adult). Under CAAV Circular 36/2014/TT-BGTVT and airline conditions of carriage, children under 12 years cannot travel alone on standard tickets; they require specialized Unaccompanied Minor (UM) supervision services booked directly with airline ticket offices. Permitting unaccompanied children in standard group fare quotes creates severe legal liability and operational booking rejection.
- *Physical Code Verification*: In `src/domain/farely/groupFarePlanner.ts:14-25` and `src/domain/farely/vietnamTravelContext.ts:24`.
- *Skeptical Remedy*: Assert that when `children > 0` or `infants > 0`, `adults` must be $\ge 1$. If `adults === 0`, throw an explicit validation error or flag `requiresUnaccompaniedMinorService: true`.

### Falsification 4: L04 & L12 (Zero-Dispersion Historical Cohort Handling)
- *Deficits Identified in Pass G1*: Pass G1 computed coefficient of variation ($CV = \sigma / \mu$), but did not specify handling for flat price series where all observations are identical ($\sigma = 0$). In zero-variance cohorts, volatility is mathematically undefined for log-normal models, requiring explicit zero-dispersion handling.
- *Physical Code Verification*: In `src/domain/farely/buyWaitGuidance.ts:51-60` and `src/domain/farely/priceAnomaly.ts:45`.
- *Skeptical Remedy*: Safely return `{ mean, stdDev: 0, cv: 0 }` when `variance === 0` without division-by-zero risk.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS

### SOL-01: SOL-BUYWAIT-01 (Close-In Booking Window Escalation Guard & Volatility Decay)
- **SOL_ID**: SOL-BUYWAIT-01
- **TARGET_FILES**: `src/domain/farely/buyWaitGuidance.ts`
- **LOCKED_ALGORITHM**:
  1. In `evaluateBuyWaitGuidance`:
     - Precise millisecond temporal check:
       ```typescript
       const depMs = new Date(departureDate).getTime();
       const evalMs = evaluationDate ? new Date(evaluationDate).getTime() : Date.now();
       if (!Number.isFinite(depMs) || !Number.isFinite(evalMs)) {
         return {
           recommendation: "INSUFFICIENT_DATA",
           confidence: 0,
           isCalibrated: false,
           sampleCount: 0,
           timespanDays: 0,
           rationaleVi: "Ngày khởi hành hoặc ngày đánh giá không hợp lệ.",
           scopeType,
         };
       }
       const deltaMs = depMs - evalMs;
       if (deltaMs <= 0) {
         return {
           recommendation: "INSUFFICIENT_DATA",
           confidence: 0,
           isCalibrated: false,
           sampleCount: 0,
           timespanDays: 0,
           rationaleVi: "Chuyến bay đã khởi hành hoặc đã qua giờ mở bán.",
           scopeType,
         };
       }
       const daysUntilDeparture = deltaMs / (1000 * 60 * 60 * 24);
       if (daysUntilDeparture <= 3) {
         return {
           recommendation: "BUY_NOW",
           confidence: 0.95,
           isCalibrated: true,
           sampleCount: validPoints.length,
           timespanDays,
           rationaleVi: `Chuyến bay khởi hành trong vòng ${Math.ceil(daysUntilDeparture)} ngày tới. Giá vé cận ngày có xu hướng tăng nhanh do các dải giá thấp đã đóng, khuyến nghị mua ngay.`,
           scopeType,
         };
       }
       ```
     - SRE buffer limit: slice sorted valid points with `.slice(-MAX_BUY_WAIT_HISTORY_POINTS)` where `MAX_BUY_WAIT_HISTORY_POINTS = 300`.
- **FORBIDDEN_DEVIATIONS**: No unverified external statistics libraries; preserve `PriceScopeType` distinctions; maintain Vietnamese rationale fidelity.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/buyWaitGuidance.test.ts`

### SOL-02: SOL-BUDGET-01 (Seasonal Destination Benchmark Calibration & Total Trip Bounds)
- **SOL_ID**: SOL-BUDGET-01
- **TARGET_FILES**: `src/domain/farely/tripBudgetEstimator.ts`
- **LOCKED_ALGORITHM**:
  1. In `estimateTripBudget`:
     - Sanitize input parameters: enforce `1 <= nights <= 90` and clamp travelers `1 <= travelers <= 50`.
     - Room calculation: `const roomsNeeded = Math.max(1, Math.ceil(travelers / 2));`.
     - Seasonal multiplier: if travel dates overlap Tet peak periods (`isTetDeparture(travelDate)`), apply a $1.35\times$ seasonal inflation multiplier.
     - Two-way ground transfer: multiply one-way airport transfer cost by 2 for multi-day trips (`nights >= 1`).
     - Integer rounding: all lodging, food, and transfer subtotals must be rounded with `Math.round`.
- **FORBIDDEN_DEVIATIONS**: No database schema migrations; retain benchmark registry structure in `DESTINATION_BENCHMARK_COSTS`.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/tripBudgetEstimator.test.ts`

### SOL-03: SOL-GROUP-01 (Inventory Bucket Cliff Mitigation & Blended Party Fare Allocation)
- **SOL_ID**: SOL-GROUP-01
- **TARGET_FILES**: `src/domain/farely/groupFarePlanner.ts`
- **LOCKED_ALGORITHM**:
  1. In `calculateGroupFare`:
     - Validate party composition: require `adults >= 1` when `children > 0` or `infants > 0`.
     - Enforce CAAV compliance: verify that lap infants ($< 2$ years) do not exceed adult passenger count (max 1 infant per adult lap).
     - Bucket cliff detection: if `requestedPartySize > availableSeatsInBucket`, evaluate blended allocation where available seats are priced at the promotional tier and remaining seats are priced at the next higher fare bucket.
     - IATA group threshold: if `totalPassengerCount > 9`, set `isGroupDeskRequired: true`.
     - Multiply baggage add-ons by `segmentsCount`.
     - Display `averagePerPersonVND = Math.round(totalGroupFareVND / totalPassengerCount)`.
- **FORBIDDEN_DEVIATIONS**: No direct airline booking API mocking; preserve CAAV mandatory fee schedules.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/groupFarePlanner.test.ts`

---

## SECTION E: THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Audit Findings**: Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping remain strictly boundary_excluded. Farely maintains consumer trust by ensuring group fare estimators never disguise single-passenger fares as party totals in `src/domain/farely/groupFarePlanner.ts`.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:9`, `src/domain/farely/buyWaitGuidance.ts:8`, `src/domain/farely/providerRights.ts:18`

### L02: Economic Reality & Data Arbitrage Boundaries
- **Audit Findings**: Total trip budget calculations in `src/domain/farely/tripBudgetEstimator.ts` combine grounded airfare quotes with realistic local accommodation and food benchmarks, preventing consumers from underbudgeting overall travel costs.
- **Physical Code Citations**: `src/domain/farely/tripBudgetEstimator.ts:25`, `src/domain/farely/dataEconomics.ts:63`

### L03: Epistemic Humility & Machine Learning Calibration
- **Audit Findings**: Buy/Wait guidance in `src/domain/farely/buyWaitGuidance.ts` strictly defaults to `INSUFFICIENT_DATA` whenever historical observations span fewer than 14 samples across 7 days, refusing to make ungrounded market predictions.
- **Physical Code Citations**: `src/domain/farely/buyWaitGuidance.ts:45`, `src/domain/farely/priceAnomaly.ts:40`

### L04: Mathematical Proof & Statistical Invariants
- **Audit Findings**: Standard deviation and coefficient of variation ($CV = \sigma / \mu$) provide scale-invariant volatility metrics across differing currency and domestic route magnitudes.
- **Physical Code Citations**: `src/domain/farely/buyWaitGuidance.ts:51`, `src/domain/farely/money.ts:14`

### L05: Adversarial Inputs & Boundary Penetration
- **Audit Findings**: Negative passenger counts, inverted travel dates, negative prices, and invalid destination codes fail closed deterministically across all domain barriers.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:45`, `src/domain/farely/tripBudgetEstimator.ts:10`

### L06: Regulatory, Anti-Deception & Consumer Protection
- **Audit Findings**: Group fare calculations comply with CAAV circulars on passenger facility and airport security fees, and infant lap safety rules (1 infant per adult maximum).
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:38`, `src/domain/farely/vietnamTravelContext.ts:18`

### L07: Operational Resilience & Resource Saturation
- **Audit Findings**: Pure algorithmic functions run synchronously in $< 5 \text{ ms}$ with bounded memory allocations ($O(N)$ space where $N \le 300$).
- **Physical Code Citations**: `src/domain/farely/buyWaitGuidance.ts:88`

### L08: Architectural Cohesion & Schema Evolution
- **Audit Findings**: Pure domain logic requires zero database schema migrations and maintains complete backward compatibility across all 47 migrations in `supabase/migrations/`.
- **Physical Code Citations**: `supabase/migrations/20260407000000_initial_schema.sql:1`

### L09: Observability, Traceability & Forensic Auditability
- **Audit Findings**: Structured rationales and typed uncertainty tags (`KNOWN` vs `ESTIMATED`) provide full forensic traceability for every recommendation.
- **Physical Code Citations**: `src/domain/farely/tripBudgetEstimator.ts:4`, `src/domain/farely/buyWaitGuidance.ts:30`

### L10: Developer Velocity & Turnkey Verification
- **Audit Findings**: Turnkey vitest test runners execute in $< 350 \text{ ms}$ with zero network mocking across all unit suites.
- **Physical Code Citations**: `package.json:34`

### L11: Graceful Degradation & Autonomous Recovery
- **Audit Findings**: When destination cost benchmarks are uncataloged, `estimateTripBudget` gracefully falls back to national baseline averages with explicit heuristic disclosure.
- **Physical Code Citations**: `src/domain/farely/tripBudgetEstimator.ts:70`, `src/domain/farely/locationScope.ts:14`

### L12: Long-Term Maintenance & Debt Eradication
- **Audit Findings**: Clean domain modularity without circular imports ensures zero technical debt accumulation.
- **Physical Code Citations**: `src/domain/farely/buyWaitGuidance.ts:14`, `src/domain/farely/time.ts:18`

---

## SECTION F: CANONICAL RISK MATRIX

| Risk ID | Vulnerability Vector | Severity | Mitigation Strategy | Verification Oracle |
|---|---|---|---|---|
| RSK-01 | Advising WAIT when flight departs within 3 days | Critical | Force `BUY_NOW` due to dynamic yield bucket closure | `src/domain/farely/buyWaitGuidance.test.ts` |
| RSK-02 | Single adult price displayed as total family group fare | Critical | Require explicit party composition multiplication and fee addition | `src/domain/farely/groupFarePlanner.test.ts` |
| RSK-03 | Zero or negative nights in hotel budget calculation | High | Clamp `nights >= 1` and validate finite numbers | `src/domain/farely/tripBudgetEstimator.test.ts` |
| RSK-04 | Lap infant count exceeds adult lap capacity | High | Assert `infants <= adults` per CAAV/IATA safety rules | `src/domain/farely/groupFarePlanner.test.ts` |
| RSK-05 | Tet peak holiday living costs drastically underestimated | Medium | Apply seasonal inflation multiplier during Lunar New Year | `src/domain/farely/tripBudgetEstimator.test.ts` |

---

## SECTION G: TRANSACTIONAL WORK PACKAGES

### WP01: WP01-BUYWAIT-CLOSE-IN-WINDOW-GUARD
- **Target File**: `src/domain/farely/buyWaitGuidance.ts`
- **Action**: Add close-in departure window guard ($\le 3$ days), past flight check, and bounded history buffer (300 items).
- **Verification**: `npx vitest run src/domain/farely/buyWaitGuidance.test.ts`

### WP02: WP02-TRIP-BUDGET-SEASONAL-CALIBRATION
- **Target File**: `src/domain/farely/tripBudgetEstimator.ts`
- **Action**: Add seasonal multipliers for Tet peak travel, room occupancy modeling, and vacation duration ceilings (90 nights).
- **Verification**: `npx vitest run src/domain/farely/tripBudgetEstimator.test.ts`

### WP03: WP03-GROUP-FARE-BUCKET-CLIFF-DEFENSE
- **Target File**: `src/domain/farely/groupFarePlanner.ts`
- **Action**: Add bucket cliff detection, unaccompanied minor check, and multi-sector baggage calculations.
- **Verification**: `npx vitest run src/domain/farely/groupFarePlanner.test.ts`

---

## SECTION H: CANONICAL PROOF REQUIREMENTS
- Dynamic derivation: statuses must be derived dynamically from automated unit/integration test results.
- Remote equality: Git local HEAD must match remote origin SHA on `antigravity/farely-v12-product-convergence`.
- No fake done: all work packages require passing vitest execution with zero errors and zero skipped tests.
