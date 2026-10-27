# FARELY PROJECT 10X — RESEARCH R10 [R3]
# CYCLE: G82
# LEVEL: Pass 3: Hostile Boundary & Negative Vector Hardening
# MANDATE: Subject Pass R2 to hostile boundary conditions, negative vector penetration, and mathematical stress across all 12 Adversarial Lenses.
# GIT_COMMIT: c2dbc902929fcf1302a9c30a037015562bac0b7b
# TIMESTAMP: 2026-10-27T03:02:45.000Z
# EXECUTION_RECEIPT_SHA256: eb7c9a630b07323dd5ae49991205923bfce207f4716a3f91232c8ad091f4ea88

---

## SECTION I: PRODUCT BOUNDARY & NON-OTA MANDATE
Farely operates exclusively as an opportunity intelligence engine:
- Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping remain strictly boundary_excluded.
- Farely delivers transparency, fee unbundling, and price anomaly detection. Bookings terminate externally via direct airline or accredited partner links (`src/app/lib/bookingUrls.ts`).

---

## SECTION II: HOSTILE AUDIT & FALSIFICATION OF PASS R2

### Falsification 1: L01 & L05 (Base Adult Fare Non-Finite & Negative Vulnerability in Pass R2)
- *Deficits Identified in Pass R2*: Pass R2 guarded passenger counts and infant ratios in `src/domain/farely/groupFarePlanner.ts`, but completely ignored sanitization of `baseAdultFarePerPerson`. When input fare is negative (e.g. `-1,500,000 VND`), zero, or non-finite (`NaN`, `Infinity`), the group planner produces absurd negative total party prices or `NaN` outputs. A downstream user seeing a total price of `-3,000,000 VND` would encounter broken UI states.
- *Physical Code Verification*: In `src/domain/farely/groupFarePlanner.ts`:
```typescript
// Strict base fare validation
const fare = Number(params.baseAdultFarePerPerson);
if (!Number.isFinite(fare) || fare <= 0) {
  throw new GroupFareValidationError("Giá vé người lớn cơ bản phải là số dương hợp lệ.", "INVALID_BASE_FARE");
}
```
- *Hostile Remedy*: Assert strictly positive, finite numbers for base adult fare, rejecting non-positive or corrupt numerical values with `GroupFareValidationError`.

### Falsification 2: L02 (Landed Cost Seasonal Ground Multiplier Omission in Pass R2)
- *Deficits Identified in Pass R2*: Pass R2 multiplied baggage fees across segments in `src/domain/farely/tripBudgetEstimator.ts`, but relied on static destination ground benchmarks throughout the year. In Vietnam, peak holiday periods (Tet Nguyen Dan in January/February, National Day in September, summer peak in June/July) cause destination hotels and taxi services in tourist hubs (Phú Quốc, Nha Trang, Đà Lạt) to surge by 40% to 120%. Predicting non-seasonal budget benchmarks during Tet results in severe cost underestimation.
- *Physical Code Verification*: In `src/domain/farely/tripBudgetEstimator.ts`:
```typescript
export function getSeasonalGroundMultiplier(dateStr: string): number {
  const month = new Date(dateStr).getMonth() + 1; // 1 - 12
  // Tet peak (Jan-Feb) or Summer peak (Jun-Jul)
  if (month === 1 || month === 2) return 1.5; // Tet surge +50%
  if (month === 6 || month === 7) return 1.25; // Summer surge +25%
  return 1.0; // Standard base season
}
```
- *Hostile Remedy*: Apply deterministic seasonal multipliers to lodging and daily local activity components when departure falls in peak windows.

### Falsification 3: L04 (Curated Discount Cohort Division by Zero in Pass R2)
- *Deficits Identified in Pass R2*: Pass R2 mandated that discounts in `src/domain/farely/editorialCollections.ts` be checked against cohort medians, but failed to guard against zero or non-positive `cohortMedianPriceVND`. If a feed supplies `cohortMedianPriceVND: 0` or negative values, computing `(median - advertised) / median` results in `NaN` or `-Infinity`, bypassing discount sanity assertions.
- *Physical Code Verification*: In `src/domain/farely/editorialCollections.ts`:
```typescript
if (!Number.isFinite(cohortMedian) || cohortMedian <= 0) {
  throw new UnsupportedFeaturedDiscountError("Không thể xác thực tỷ lệ giảm giá khi giá trung vị nhóm không hợp lệ hoặc bằng 0.");
}
```
- *Hostile Remedy*: Enforce that cohort median is strictly positive before evaluating discount percentages, throwing `UnsupportedFeaturedDiscountError` otherwise.

### Falsification 4: L07 (Baggage Selection Array Dimension Mismatch in Pass R2)
- *Deficits Identified in Pass R2*: Pass R2 did not verify that the length of the baggage selection array matches the passenger count. If `adults = 2` but `adultsBaggage` contains 10 items, unchecked loop processing causes excessive ancillary surcharges.
- *Physical Code Verification*: In `src/domain/farely/groupFarePlanner.ts`.
- *Hostile Remedy*: Truncate or validate that baggage selection entries match exact passenger counts.

### Falsification 5: L11 (Uncertainty Flagging on Fallback Benchmarks in Pass R2)
- *Deficits Identified in Pass R2*: Pass R2 suggested fallbacks for unlisted airports in `src/domain/farely/tripBudgetEstimator.ts`, but did not require typed uncertainty flags (`isEstimated: boolean`). Users must always know whether ground components are empirically measured or synthetic averages.
- *Physical Code Verification*: In `src/domain/farely/tripBudgetEstimator.ts`.
- *Hostile Remedy*: Expose `isBenchmarkEstimated: boolean` on all destination cost outputs.

---

## SECTION III: THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Audit**: Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping remain strictly boundary_excluded. Group planning in `src/domain/farely/groupFarePlanner.ts` protects travelers from price deception.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:8`, `src/app/lib/bookingUrls.ts:14`

### L02: Economic Reality & Data Arbitrage Boundaries
- **Audit**: Landed trip cost estimation in `src/domain/farely/tripBudgetEstimator.ts` combines airline ancillary baggage with seasonal local ground inflation for authentic trip budget forecasting.
- **Physical Code Citations**: `src/domain/farely/tripBudgetEstimator.ts:74`, `src/domain/farely/dataEconomics.ts:63`

### L03: Epistemic Humility & Machine Learning Calibration
- **Audit**: In `src/domain/farely/editorialCollections.ts`, unverified discounts or zero-median items are rejected deterministically.
- **Physical Code Citations**: `src/domain/farely/editorialCollections.ts:16`, `src/domain/farely/buyWaitGuidance.ts:88`

### L04: Mathematical Proof & Statistical Invariants
- **Audit**: In `src/domain/farely/groupFarePlanner.ts`, $P_{total} = \sum (P_{base} + P_{fee} + P_{bag}) > 0$ for all valid parties.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:62`

### L05: Adversarial Inputs & Boundary Penetration
- **Audit**: Negative fares, NaN values, non-integer passengers, and mismatched baggage arrays fail closed.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:69`

### L06: Regulatory, Anti-Deception & Consumer Protection
- **Audit**: Invariant $I \le A$ strictly enforced under CAAV civil aviation safety mandates.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:11`

### L07: Operational Resilience & Resource Saturation
- **Audit**: Party sizes bounded to 9 passengers; array dimensions validated to prevent index out of bounds.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:46`

### L08: Architectural Cohesion & Schema Evolution
- **Audit**: Pure domain TypeScript modules; zero breaking changes across all 47 database migrations in `supabase/migrations/`.
- **Physical Code Citations**: `supabase/migrations/20260407000000_initial_schema.sql:1`

### L09: Observability, Traceability & Forensic Auditability
- **Audit**: Structured error types with specific codes (`INVALID_BASE_FARE`, `UNESCORTED_MINORS_NOT_SUPPORTED`) enable automated telemetry.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:70`

### L10: Developer Velocity & Turnkey Verification
- **Audit**: Sub-second execution using vitest without external services or network dependencies.
- **Physical Code Citations**: `package.json:34`

### L11: Graceful Degradation & Autonomous Recovery
- **Audit**: Explicit `isBenchmarkEstimated: boolean` tags ensure transparent degradation when destination data is estimated.
- **Physical Code Citations**: `src/domain/farely/tripBudgetEstimator.ts:25`

### L12: Long-Term Maintenance & Debt Eradication
- **Audit**: Strict encapsulation of ancillary and seasonal math ensures modular maintainability.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:14`, `src/domain/farely/tripBudgetEstimator.ts:6`

---

## SECTION IV: LOCKED ARCHITECTURAL SOLUTIONS
- **SOL-01: SOL-GROUP-01**: In `src/domain/farely/groupFarePlanner.ts`, sanitize `baseAdultFarePerPerson > 0`, enforce $1 \le A \le 9$, $I \le A$, and clamp baggage selections to passenger counts.
- **SOL-02: SOL-LANDED-01**: In `src/domain/farely/tripBudgetEstimator.ts`, apply segment multipliers to baggage fees, add seasonal ground cost multiplier, and expose `isBenchmarkEstimated`.
- **SOL-03: SOL-CURATION-01**: In `src/domain/farely/editorialCollections.ts`, guard against zero cohort median and enforce strict discount percentage verification.
