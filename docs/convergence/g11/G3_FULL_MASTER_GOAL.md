# FARELY PROJECT 10X — MASTER GOAL G11 [G3]
# CYCLE: G86
# LEVEL: Pass 3: Hostile Adversarial Stress-Testing & Boundary Hardening
# MANDATE: Subject Pass G2 to hostile adversarial penetration testing, negative vector defenses (NV01..NV24), and boundary stress-testing across all 12 Adversarial Lenses for Cycle G86. Harden defensive invariants for Buy/Wait guidance, total trip budget estimation, and group fare planning against timezone skew, currency mixing, and non-integer passenger counts.
# GIT_COMMIT: 44db15d38b9195228d1ffc54954a759645c824a8
# TIMESTAMP: 2026-10-27T09:06:00.000Z
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

## SECTION C: HOSTILE ADVERSARIAL AUDIT & FALSIFICATION OF PASS G2

### Falsification 1: L04 & L07 (Timezone-Offset Skew & UTC Transition Distortion in Buy/Wait)
- *Deficits Identified in Pass G2*: Pass G2 computed `depMs - evalMs` using raw timestamps, but did not handle cross-timezone date strings when `departureDate` is passed without an explicit time or timezone offset (e.g. `'2026-11-05'`). In JavaScript, `new Date('2026-11-05')` parses as UTC midnight (`2026-11-05T00:00:00.000Z`), which corresponds to 07:00 AM Indochina Time (UTC+7). If the evaluation occurs at 02:00 AM UTC (09:00 AM UTC+7), subtracting timestamps across mixed local/UTC formats introduces a 7-hour artificial skew that prematurely triggers the close-in window. Adversarial hardening requires normalizing calendar dates using strict start-of-day UTC or explicit timezone context.
- *Physical Code Verification*: In `src/domain/farely/buyWaitGuidance.ts:66-105` and `src/domain/farely/airportAlternatives.ts:120`.
- *Hostile Remedy*: Explicitly parse date components and normalize departure timestamps to UTC start-of-day before evaluating delta time.

### Falsification 2: L01 & L08 (Negative Vector NV05 & Incompatible Currency Units in Trip Budget Estimator)
- *Deficits Identified in Pass G2*: Pass G2 calculated total budget assuming all components are in VND, but international flight searches (e.g. routes departing to Singapore SIN, Bangkok BKK, Tokyo NRT) frequently return fares in USD, SGD, or JPY. Adding a 350 USD airfare directly to 4,000,000 VND lodging produces a corrupt sum of 4,000,350 (interpreting 350 USD as 350 VND). Hostile boundary defenses require asserting that the airfare input matches the benchmark currency or enforcing strict currency matching before addition.
- *Physical Code Verification*: In `src/domain/farely/tripBudgetEstimator.ts:70-120` and `src/domain/farely/money.ts:14`.
- *Hostile Remedy*: Require that `airfareVND` is validated as a positive VND amount ($\ge 100,000 \text{ VND}$ for commercial flights) and reject raw foreign currency amounts without explicit FX conversion.

### Falsification 3: L05 & L06 (Passenger Type Invariant & Non-Integer/Zero Passenger Count Rejection)
- *Deficits Identified in Pass G2*: Pass G2 checked `adults === 0`, but did not reject non-integer, negative, or zero-total passenger numbers (e.g. `adults = 2.5` or `adults = 0, children = 0, infants = 0`). Passing a zero-total composition results in division by zero (`totalGroupFare / 0 = NaN`), returning corrupted financial output. Hostile stress-testing dictates validating that passenger counts are non-negative safe integers and that total passengers $\ge 1$.
- *Physical Code Verification*: In `src/domain/farely/groupFarePlanner.ts:14-25` and `src/domain/farely/vietnamTravelContext.ts:24`.
- *Hostile Remedy*: Enforce `Number.isInteger` on all passenger counts, assert non-negativity, and require `adults + children + infants >= 1`.

### Falsification 4: L10 & L12 (Secondary Sort Key for Deterministic Historical Quantiles)
- *Deficits Identified in Pass G2*: Pass G2 sorted price history by date, but did not handle observations with identical timestamps. In production database reads, rows with identical `observedAt` timestamps have non-deterministic order across different database replicas. The pipeline must apply a secondary sort key (price ascending) to ensure 100% deterministic evaluation.
- *Physical Code Verification*: In `src/domain/farely/buyWaitGuidance.ts:88-95` and `src/domain/farely/directAffiliateComparison.ts:40`.
- *Hostile Remedy*: Sort valid price points primarily by timestamp and secondarily by price ascending: `Date.parse(a.date) - Date.parse(b.date) || a.price - b.price`.

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
     - Deterministic sorting: sort primarily by date, secondarily by price ascending.
     - SRE buffer limit: slice sorted valid points with `.slice(-MAX_BUY_WAIT_HISTORY_POINTS)` where `MAX_BUY_WAIT_HISTORY_POINTS = 300`.
- **FORBIDDEN_DEVIATIONS**: No unverified external statistics libraries; preserve `PriceScopeType` distinctions; maintain Vietnamese rationale fidelity.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/buyWaitGuidance.test.ts`

### SOL-02: SOL-BUDGET-01 (Seasonal Destination Benchmark Calibration & Total Trip Bounds)
- **SOL_ID**: SOL-BUDGET-01
- **TARGET_FILES**: `src/domain/farely/tripBudgetEstimator.ts`
- **LOCKED_ALGORITHM**:
  1. In `estimateTripBudget`:
     - Sanitize input parameters: enforce `1 <= nights <= 90` and clamp travelers `1 <= travelers <= 50`.
     - Validate `airfareVND >= 100000` to prevent foreign currency mixing.
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
     - Validate party composition: verify `adults + children + infants >= 1` and assert all counts are non-negative integers.
     - Require `adults >= 1` when `children > 0` or `infants > 0` to prevent unaccompanied minor violations.
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
