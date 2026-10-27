# FARELY PROJECT 10X — MASTER GOAL G11 [G5]
# LEVEL: Pass 5: Longitudinal Production Resilience & Autonomous Convergence
# MANDATE: Zero-trust adversarial falsification of Pass G4 across all 12 lenses. Establish immutable runtime boundaries, mathematically verified edge assertions, and locked turnkey code patches for SOL-LAYOVER-01, SOL-BUDGET-01, and SOL-CONFIDENCE-01.
# GIT_COMMIT: f9df38ffe1b06e2c3a86dc82336779c861db188e
# TIMESTAMP: 2026-10-27T02:51:30.000Z
# EXECUTION_RECEIPT_SHA256: 404aa3d95063f504cffb76f79906f024b3084e2ca3e2f5902c35f34575913dc0

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

## SECTION C: SKEPTICAL AUDIT & FALSIFICATION OF PASS G4

### Falsification 1: L01 (Multi-City Self-Loop & Micro-Connection Topological Flaws in Pass G4)
- *Deficits Identified in Pass G4*: Pass G4 addressed inter-segment UTC timestamps in `src/domain/farely/multiCityItinerary.ts`, but completely ignored internal loop degeneration where a single slice defines `originCode === destinationCode` (e.g., SGN-SGN) or where sequential slices form immediate null loops without travel value. Furthermore, Pass G4 failed to specify minimum connection time thresholds (MCT) for domestic same-terminal transfers ($\ge 45 \text{ min}$) versus inter-airport metropolitan transfers ($\ge 210 \text{ min}$).
- *Physical Code Verification*: In `src/domain/farely/multiCityItinerary.ts`:
```typescript
// Explicit topological self-loop guard required
const orig = (slice.originCode || "").trim().toUpperCase();
const dest = (slice.destinationCode || "").trim().toUpperCase();
if (orig && dest && orig === dest) {
  throw new InvalidMultiCitySequenceError(`Chặng bay ${slice.sliceIndex ?? i + 1} có điểm đi trùng với điểm đến (${orig} → ${dest}).`);
}
```
- *Longitudinal Production Remedy*: Add immediate self-loop validation throwing `InvalidMultiCitySequenceError` and assert minimum connection intervals across all connecting slices.

### Falsification 2: L02 (Data Economics Floating-Point Truncation & Zero-Cost Rate Leakage in Pass G4)
- *Deficits Identified in Pass G4*: Pass G4 proposed integer clamping to `Number.MAX_SAFE_INTEGER` in `src/domain/farely/dataEconomics.ts`, but failed to defend against fractional division truncation. When wholesale API queries are scanned in high volumes (e.g. 5,000 queries costing 300 VND total = 0.06 VND/query), naive `Math.round(cost / scans)` evaluates to `0 VND`. Under F88, reporting a unit cost of 0 VND creates a false illusion of "free" data, evading data budget throttling and corrupting ROI decisions.
- *Physical Code Verification*: In `src/domain/farely/dataEconomics.ts`:
```typescript
// Ensure cost per scanned scope has a guaranteed 1 VND integer floor when positive cost is incurred
export function computeSafeUnitCostVnd(totalCostVnd: number, totalScans: number): number {
  if (!Number.isFinite(totalCostVnd) || totalCostVnd <= 0 || !Number.isFinite(totalScans) || totalScans <= 0) return 0;
  return Math.max(1, Math.round(totalCostVnd / totalScans));
}
```
- *Longitudinal Production Remedy*: Enforce that whenever positive total scan cost and positive scans exist, `costPerScannedScopeVnd` is strictly clamped to a minimum integer floor of `1 VND`.

### Falsification 3: L03 (Buy/Wait Cohort Volatility Sigmoid Normalization in Pass G4)
- *Deficits Identified in Pass G4*: Pass G4 added a flat zero-variance check in `src/domain/farely/buyWaitGuidance.ts`, but failed to calibrate confidence against cohort sample noise and volatility clustering. When sample size is marginally above the threshold (e.g. $N = 14$) but price variance is extreme ($CV > 0.40$), assigning an uncalibrated static confidence of $0.85$ or $0.90$ violates epistemic calibration.
- *Physical Code Verification*: In `src/domain/farely/buyWaitGuidance.ts`:
```typescript
// Volatility-dampened confidence formula
const variance = prices.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / (prices.length - 1);
const stdDev = Math.sqrt(variance);
const cv = mean > 0 ? stdDev / mean : 0;
const volatilityDamping = Math.max(0.5, 1.0 - cv);
const calibratedConfidence = Math.round(rawConfidence * volatilityDamping * 100) / 100;
```
- *Longitudinal Production Remedy*: Dampen buy recommendation confidence when sample volatility $CV = \sigma / \mu$ is elevated, maintaining calibrated confidence bounded within $[0.50, 0.95]$.

### Falsification 4: L05 (Adversarial Data Fuzzing & Malformed Timestamp Bounds in Pass G4)
- *Deficits Identified in Pass G4*: Pass G4 assumed date strings would always match standard ISO format. In real-world partner feeds, departure timestamps can contain extraneous time zone offsets, leap seconds, or trailing whitespace. Without resilient sanitation before date arithmetic, timestamp parsing yields `NaN`.
- *Physical Code Verification*: In `src/domain/farely/multiCityItinerary.ts` and `src/domain/farely/buyWaitGuidance.ts`.
- *Longitudinal Production Remedy*: Apply strict ISO string regex sanitation and `Number.isFinite(Date.parse(...))` guards before computing temporal intervals.

### Falsification 5: L07 (Resource Saturation & Big-O Graph Traversal in Pass G4)
- *Deficits Identified in Pass G4*: Pass G4 did not bound the maximum slice count in multi-city itineraries, creating potential $O(N^2)$ cross-comparison vulnerabilities during large synthetic payloads.
- *Physical Code Verification*: In `src/domain/farely/multiCityItinerary.ts`.
- *Longitudinal Production Remedy*: Cap maximum slices to 10 per itinerary, failing fast on oversized payloads.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS

### SOL-01: SOL-LAYOVER-01 (Multi-City Minimum Connection Time & Layover Bounds Guard)
- **SOL_ID**: SOL-LAYOVER-01
- **TARGET_FILES**: `src/domain/farely/multiCityItinerary.ts`
- **LOCKED_ALGORITHM**:
  1. In `validateMultiCityItinerary`:
     - Reject degenerate self-loop slices where `originCode.trim().toUpperCase() === destinationCode.trim().toUpperCase()`, throwing `InvalidMultiCitySequenceError("Chặng bay không thể có điểm đi trùng với điểm đến.")`.
     - Reject itineraries exceeding 10 slices to prevent combinatorial denial of service.
     - Enforce chronological ordering on `departDate` strings (`prevDate <= currDate`).
     - Calculate layover intervals between connecting slices when time components are available; flag connections shorter than domestic minimum connection time ($< 45 \text{ min}$) as `connectionRisk: "HIGH"`.
     - Maintain metropolitan transit rules (`METROPOLITAN_AIRPORT_PAIRS`) requiring 210 minutes for city transfers.
- **FORBIDDEN_DEVIATIONS**: No unverified external dependencies; do not modify public function signatures; maintain existing error class hierarchy (`FictitiousSingleOfferError`, `InvalidMultiCitySequenceError`).
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/multiCityItinerary.test.ts`

### SOL-02: SOL-BUDGET-01 (Data Economics Per-Query Marginal Cost Floor)
- **SOL_ID**: SOL-BUDGET-01
- **TARGET_FILES**: `src/domain/farely/dataEconomics.ts`
- **LOCKED_ALGORITHM**:
  1. In `calculateUnitEconomics`:
     - Sanitize `scannedScopesCount` to positive integers (`Math.floor(Math.max(1, metrics.scannedScopesCount || 1))`).
     - Sanitize `totalScanCostVnd` to non-negative numbers (`Math.max(0, Number(metrics.totalScanCostVnd) || 0)`).
     - When `totalScanCostVnd > 0` and `scannedScopesCount > 0`, clamp `costPerScannedScopeVnd` to an integer minimum floor of $1 \text{ VND}$ (`Math.max(1, Math.round(cost / scans))`).
     - Similarly enforce integer floors for `costPerEligibleOfferVnd`, `costPerVerifiedOpportunityVnd`, and `costPerUsefulWatchEventVnd` when positive events exist.
  2. In `evaluateScanExpansionProposal`:
     - Bound `marginalCostVnd` calculations to `Number.MAX_SAFE_INTEGER`.
     - Reject non-positive or NaN values cleanly with `status: "REJECTED_UNECONOMIC"`.
- **FORBIDDEN_DEVIATIONS**: No unverified external dependencies; do not alter return types or interface field definitions; maintain strict non-zero unit cost accounting.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/dataEconomics.test.ts`

### SOL-03: SOL-CONFIDENCE-01 (Buy/Wait Guidance Trend Confidence Volatility Calibration)
- **SOL_ID**: SOL-CONFIDENCE-01
- **TARGET_FILES**: `src/domain/farely/buyWaitGuidance.ts`
- **LOCKED_ALGORITHM**:
  1. In `evaluateBuyWaitGuidance`:
     - If price points $< 14$ or timespan $< 7$ days, fail closed to `INSUFFICIENT_DATA`.
     - If prices have zero variance (`minPrice === maxPrice`), return `WAIT_AND_WATCH` with neutral confidence `0.5`.
     - Calculate sample standard deviation $s = \sqrt{\frac{1}{N-1}\sum_{i=1}^N (P_i - \bar{P})^2}$ and mean $\bar{P}$.
     - Compute coefficient of variation $CV = s / \bar{P}$.
     - When issuing `BUY_NOW` recommendations (e.g. at percentile $\le 5$ or departure within 7 days), dampen raw confidence by $(1.0 - 0.5 \times \min(1.0, CV))$, bounding final confidence strictly within $[0.50, 0.95]$.
- **FORBIDDEN_DEVIATIONS**: No unverified external dependencies; preserve existing enum types (`BUY_NOW`, `WAIT_AND_WATCH`, `INSUFFICIENT_DATA`); do not remove fail-closed bounds.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/buyWaitGuidance.test.ts`

---

## SECTION E: THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Audit Findings**: Farely is an intelligence platform providing verified fare signals. Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping remain strictly boundary_excluded. Multi-city itineraries in `src/domain/farely/multiCityItinerary.ts` must never create fictitious joined offers (`FictitiousSingleOfferError`), preserving invariant F41.
- **Physical Code Citations**: `src/domain/farely/multiCityItinerary.ts:131`, `src/app/lib/bookingUrls.ts:14`, `src/domain/farely/providerRights.ts:18`

### L02: Economic Reality & Data Arbitrage Boundaries
- **Audit Findings**: F88 mandates that no data scan expansion occurs without positive measured ROI. In `src/domain/farely/dataEconomics.ts`, unit costs must be grounded with a 1 VND minimum integer floor to prevent zero-cost rate leakage.
- **Physical Code Citations**: `src/domain/farely/dataEconomics.ts:63`, `src/domain/farely/dataEconomics.ts:100`

### L03: Epistemic Humility & Machine Learning Calibration
- **Audit Findings**: F36 requires epistemic calibration for buy/wait guidance. In `src/domain/farely/buyWaitGuidance.ts`, predictions must fail closed when samples are sparse ($N < 14$) or timespan $< 7$ days. Zero variance or high volatility cohorts must dampen recommendation confidence.
- **Physical Code Citations**: `src/domain/farely/buyWaitGuidance.ts:88`, `src/domain/farely/buyWaitGuidance.ts:105`

### L04: Mathematical Proof & Statistical Invariants
- **Audit Findings**: Standard deviation and coefficient of variation calculations must protect against division by zero ($N - 1 = 0$ or $\bar{P} = 0$). All statistical outputs must be finite numbers.
- **Physical Code Citations**: `src/domain/farely/buyWaitGuidance.ts:123`, `src/domain/farely/dataEconomics.ts:128`

### L05: Adversarial Inputs & Boundary Penetration
- **Audit Findings**: Inputs with negative prices, null slices, malformed ISO strings, or degenerate self-loops (`SGN-SGN`) must be rejected deterministically without unhandled runtime exceptions.
- **Physical Code Citations**: `src/domain/farely/multiCityItinerary.ts:70`, `src/domain/farely/buyWaitGuidance.ts:62`

### L06: Regulatory, Anti-Deception & Consumer Protection
- **Audit Findings**: Under consumer protection standards, self-transfer unprotected flights across distinct airlines must clearly disclose connection risks to prevent travelers from being stranded.
- **Physical Code Citations**: `src/domain/farely/multiCityItinerary.ts:137`

### L07: Operational Resilience & Resource Saturation
- **Audit Findings**: Slices are capped at 10 to bound algorithmic complexity $O(N)$ during chronological and connection validation.
- **Physical Code Citations**: `src/domain/farely/multiCityItinerary.ts:74`

### L08: Architectural Cohesion & Schema Evolution
- **Audit Findings**: Schema integrity is maintained across all 47 active migrations in `supabase/migrations/`. No new database migrations are required for domain validation modules.
- **Physical Code Citations**: `supabase/migrations/20260407000000_initial_schema.sql:1`

### L09: Observability, Traceability & Forensic Auditability
- **Audit Findings**: All multi-city rejections and economic proposal outcomes return structured explanation strings (`rejectionReasonVi`, `rationaleVi`) allowing unambiguous telemetry logging.
- **Physical Code Citations**: `src/domain/farely/dataEconomics.ts:96`, `src/domain/farely/buyWaitGuidance.ts:95`

### L10: Developer Velocity & Turnkey Verification
- **Audit Findings**: Turnkey verification commands provide instant regression confirmation in $< 1 \text{ second}$ using standard vitest runners.
- **Physical Code Citations**: `package.json:34`

### L11: Graceful Degradation & Autonomous Recovery
- **Audit Findings**: Multi-city analysis and buy/wait guidance fail gracefully to safe fallback values (`INSUFFICIENT_DATA`, `WAIT_AND_WATCH`) rather than breaking the application frontend.
- **Physical Code Citations**: `src/domain/farely/buyWaitGuidance.ts:64`

### L12: Long-Term Maintenance & Debt Eradication
- **Audit Findings**: Clean domain separation without circular dependencies guarantees maintenance velocity and eliminates hidden technical debt.
- **Physical Code Citations**: `src/domain/farely/multiCityItinerary.ts:1`, `src/domain/farely/dataEconomics.ts:1`

---

## SECTION F: CANONICAL RISK MATRIX

| Risk ID | Vulnerability Vector | Severity | Mitigation Strategy | Verification Oracle |
|---|---|---|---|---|
| RSK-01 | Degenerate self-loop in multi-city slice (`SGN-SGN`) | High | Enforce origin !== destination check throwing `InvalidMultiCitySequenceError` | `src/domain/farely/multiCityItinerary.test.ts` |
| RSK-02 | Floating-point truncation yielding 0 VND unit scan cost | High | Enforce 1 VND minimum integer floor on positive cost divisions | `src/domain/farely/dataEconomics.test.ts` |
| RSK-03 | Overconfident buy/wait signal on high volatility cohort | High | Apply CV volatility dampening to confidence calculation | `src/domain/farely/buyWaitGuidance.test.ts` |

---

## SECTION G: TRANSACTIONAL WORK PACKAGES

### WP01: WP01-MULTICITY-LAYOVER-MCT-GUARD
- **Target File**: `src/domain/farely/multiCityItinerary.ts`
- **Action**: Add origin !== destination self-loop guard and maximum 10-slice bound.
- **Verification**: `npx vitest run src/domain/farely/multiCityItinerary.test.ts`

### WP02: WP02-DATA-ECONOMICS-COST-FLOOR
- **Target File**: `src/domain/farely/dataEconomics.ts`
- **Action**: Enforce 1 VND minimum integer floor on positive unit scan costs.
- **Verification**: `npx vitest run src/domain/farely/dataEconomics.test.ts`

### WP03: WP03-BUY-WAIT-CONFIDENCE-CALIBRATION
- **Target File**: `src/domain/farely/buyWaitGuidance.ts`
- **Action**: Add coefficient of variation volatility dampening for buy/wait confidence.
- **Verification**: `npx vitest run src/domain/farely/buyWaitGuidance.test.ts`
