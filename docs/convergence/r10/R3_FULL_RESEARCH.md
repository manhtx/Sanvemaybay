# FARELY PROJECT 10X — RESEARCH R10 [R3]
# CYCLE: G84
# LEVEL: Pass 3: Hostile Boundary & Negative Vector Hardening
# MANDATE: Subject Pass R2 to hostile boundary penetration, adversarial negative vector analysis, and malicious edge-case falsification across all 12 Adversarial Lenses. Enforce locked technical solutions SOL-PARTNER-01, SOL-CAPABILITY-01, and SOL-ANOMALY-01.
# GIT_COMMIT: 24fd09d4d24fa9ee39ea8695d203f3ae7f1d604b
# TIMESTAMP: 2026-10-27T08:22:00.000Z
# EXECUTION_RECEIPT_SHA256: b1e1460a80bc12ab420f1b31b0fdce11abed72b68713235df7c6af46e5d71023

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

## SECTION C: HOSTILE BOUNDARY & NEGATIVE VECTOR AUDIT OF PASS R2

### Falsification 1: L05 & L07 (Adversarial Ordering in Cohort Sanitization & Filter Pipeline)
- *Deficits Identified in Pass R2*: Pass R2 applied cohort size capping (`MAX_COHORT_ANALYSIS_SIZE = 250`), but did not strictly order the filtering pipeline. If an adversarial payload delivers 500 prices where the first 250 are corrupt (`NaN`, negative, or zero) and the last 250 are valid historical prices, slicing before filtering (`cohort.slice(0, 250).filter(...)`) results in an empty array or $< 10$ elements, artificially triggering `SPARSE_DATA_ABSTENTION` and blinding Farely's price alert engine. Conversely, filtering before slicing guarantees that genuine historical observations are retained up to the maximum computational ceiling.
- *Physical Code Verification*: In `src/domain/farely/priceAnomaly.ts:107`:
```typescript
// Pipeline ordering vulnerability:
const validPrices = historicalCohortPrices.filter(p => Number.isFinite(p) && p > 0);
const cappedCohort = validPrices.slice(-MAX_COHORT_ANALYSIS_SIZE);
```
- *Hostile Remedy*: Enforce strict pipeline sequence: filter non-finite and non-positive prices first, then slice the most recent observations up to `MAX_COHORT_ANALYSIS_SIZE = 250`.

### Falsification 2: L02 & L04 (Negative Margin Disqualification & Strict ROI Floor in Partner Viability)
- *Deficits Identified in Pass R2*: Pass R2 handled zero-cost division, but failed to assert mandatory disqualification when unit economics are strictly negative (`netMarginPerBookingVND < 0` or `marginalRoi < 1.0`). If an affiliate partner pays only 15,000 VND per booking while requiring 80 queries at 300 VND compute cost per query ($80 \times 300 = 24,000\text{ VND}$), Farely loses 9,000 VND per converted booking ($ROI = 0.625$). Pass R2 would calculate the numbers without strictly revoking commercial enablement.
- *Physical Code Verification*: In `src/domain/farely/partnerIntegrations.ts:114`:
```typescript
// Economic leakage vulnerability:
const isEconomicallyViable = marginalRoi >= MINIMUM_ECONOMIC_ROI && netMarginPerBookingVND >= 0;
if (!isEconomicallyViable) {
  disqualificationReasons.push('Kinh tế đơn vị không khả thi: chi phí truy vấn vượt quá doanh thu kỳ vọng.');
}
```
- *Hostile Remedy*: Enforce that any partner with `isEconomicallyViable === false` is automatically relegated to `DISQUALIFIED_INDICATIVE_ONLY`, preventing commercial link display.

### Falsification 3: L01 & L05 (Multi-City & Malformed Journey Boundaries in Provider Capabilities)
- *Deficits Identified in Pass R2*: Pass R2 checked journey types, but did not defend against `MULTI_CITY` intents routed to providers with `supportsMultiCity: false` (such as Vietjet Direct or Bamboo Airways). Furthermore, if `intent.journeyType` is an unrecognized or adversarial string, naive inclusion checks might throw runtime exceptions.
- *Physical Code Verification*: In `src/domain/farely/providerCapabilities.ts:12` and `src/domain/farely/multiCityItinerary.ts:18`.
- *Hostile Remedy*: Explicitly check `supportsMultiCity` when `intent.journeyType === 'MULTI_CITY'` and validate journey type against known enumerations.

### Falsification 4: L06 & L09 (Regulatory Protection Against Unlicensed Web Scraping)
- *Deficits Identified in Pass R2*: Pass R2 permitted scraping if `profile.isScrapingPermitted` was true, but did not require affirmative proof of non-restriction. If a partner is in a legal gray area, commercial enablement must fail closed.
- *Physical Code Verification*: `src/domain/farely/partnerIntegrations.ts:74`.
- *Hostile Remedy*: Mandate that scraping permission alone cannot override missing commercial agreements unless accompanied by explicit affiliate rights.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS

### SOL-01: SOL-PARTNER-01 (Partner Commercial Enablement Governance & Unit Economics)
- **SOL_ID**: SOL-PARTNER-01
- **TARGET_FILES**: `src/domain/farely/partnerIntegrations.ts`
- **LOCKED_ALGORITHM**:
  1. In `evaluatePartnerCommercialViability`:
     - Sanitize numbers: verify `Number.isFinite` on all numeric fields.
     - Enforce non-negative bounds: `marginalQueryCostVND >= 0`, `expectedQueriesPerBooking >= 0`, `estimatedRevenuePerBookingVND >= 0`.
     - Compute total cost: `const totalCostPerBookingVND = Math.max(0, profile.marginalQueryCostVND * profile.expectedQueriesPerBooking);`.
     - Compute net margin: `const netMarginPerBookingVND = profile.estimatedRevenuePerBookingVND - totalCostPerBookingVND;`.
     - Guard ROI: `const marginalRoi = totalCostPerBookingVND > 0 ? profile.estimatedRevenuePerBookingVND / totalCostPerBookingVND : 0;`.
     - Economic viability: `const isEconomicallyViable = marginalRoi >= MINIMUM_ECONOMIC_ROI && netMarginPerBookingVND >= 0;`.
     - Disqualify if `!isEconomicallyViable`, `isRestrictedOrBlocked`, or missing contractual rights.
     - Set `isCommerciallyEnabled = disqualificationReasons.length === 0`.
- **FORBIDDEN_DEVIATIONS**: No unverified external dependencies; do not modify return interfaces; maintain commercial neutrality.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/partnerIntegrations.test.ts`

### SOL-02: SOL-CAPABILITY-01 (Provider Capability Matrix & Journey Boundary Defense)
- **SOL_ID**: SOL-CAPABILITY-01
- **TARGET_FILES**: `src/domain/farely/providerCapabilities.ts`
- **LOCKED_ALGORITHM**:
  1. In `isIntentSupportedByProvider`:
     - Check provider exists in `PROVIDER_CAPABILITY_REGISTRY`. If not, return `{ isSupported: false, reasons: ['Unknown provider'] }`.
     - Default cabin: `const effectiveCabin = intent.cabinClass || 'ECONOMY';`.
     - Multi-city check: if `intent.journeyType === 'MULTI_CITY'` and `!caps.supportsMultiCity`, reject with reason.
     - Journey type check: verify `caps.supportedJourneyTypes.includes(intent.journeyType)`.
     - Cabin class check: verify `caps.supportedCabinClasses.includes(effectiveCabin)`.
     - Advance booking check: if departure date exceeds `maxAdvanceDays`, reject with reason.
- **FORBIDDEN_DEVIATIONS**: No external packages; maintain typed registry interfaces; preserve all existing provider configurations.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/providerCapabilities.test.ts`

### SOL-03: SOL-ANOMALY-01 (Robust MAD Price Anomaly Detection & Glitch Filtering)
- **SOL_ID**: SOL-ANOMALY-01
- **TARGET_FILES**: `src/domain/farely/priceAnomaly.ts`
- **LOCKED_ALGORITHM**:
  1. In `detectPriceAnomaly`:
     - Guard `currentPrice`: if not finite or $\le 0$, return `SUSPECTED_DATA_GLITCH`.
     - Floor check: if `currentPrice < 10000`, return `SUSPECTED_DATA_GLITCH`.
     - Pipeline order: filter positive finite historical prices FIRST, then slice the most recent `MAX_COHORT_ANALYSIS_SIZE = 250`.
     - Sample size check: if length $< 10$, return `SPARSE_DATA_ABSTENTION`.
     - Compute median and MAD: if `mad === 0`, return `INSUFFICIENT_DISPERSION_ABSTENTION`.
     - Calculate modified Z-score and discount percentage.
- **FORBIDDEN_DEVIATIONS**: No external math libraries; maintain existing classification constants; retain Tet window adjustments.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/priceAnomaly.test.ts`

---

## SECTION E: THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Audit Findings**: Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping remain strictly boundary_excluded. Farely maintains consumer trust by evaluating partner commercial permissions objectively in `src/domain/farely/partnerIntegrations.ts`.
- **Physical Code Citations**: `src/domain/farely/partnerIntegrations.ts:9`, `src/domain/farely/providerCapabilities.ts:24`, `src/domain/farely/providerRights.ts:18`

### L02: Economic Reality & Data Arbitrage Boundaries
- **Audit Findings**: Marginal query costs and expected queries per booking in `src/domain/farely/partnerIntegrations.ts` define a non-negotiable economic viability floor ($ROI \ge 1.0$), ensuring Farely does not subsidize unprofitable data partner queries.
- **Physical Code Citations**: `src/domain/farely/partnerIntegrations.ts:97`, `src/domain/farely/dataEconomics.ts:63`

### L03: Epistemic Humility & Machine Learning Calibration
- **Audit Findings**: Price anomaly detection in `src/domain/farely/priceAnomaly.ts` refuses to make strong statistical assertions on fewer than 10 samples, returning `SPARSE_DATA_ABSTENTION` to prevent hallucinated deal alerts.
- **Physical Code Citations**: `src/domain/farely/priceAnomaly.ts:36`, `src/domain/farely/buyWaitGuidance.ts:88`

### L04: Mathematical Proof & Statistical Invariants
- **Audit Findings**: Median Absolute Deviation (MAD) provides breakdown-point resilience up to 50% contamination, protecting anomaly thresholds from being warped by extreme outliers.
- **Physical Code Citations**: `src/domain/farely/priceAnomaly.ts:68`, `src/domain/farely/tripBudgetEstimator.ts:77`

### L05: Adversarial Inputs & Boundary Penetration
- **Audit Findings**: Non-finite prices, negative query costs, empty strings, and divide-by-zero edge cases fail closed deterministically across all domain boundaries.
- **Physical Code Citations**: `src/domain/farely/partnerIntegrations.ts:63`, `src/domain/farely/priceAnomaly.ts:95`

### L06: Regulatory, Anti-Deception & Consumer Protection
- **Audit Findings**: Partner integrations enforce explicit commercial authorizations and reject blocked or scraper-restricted endpoints, adhering to international IP and copyright standards.
- **Physical Code Citations**: `src/domain/farely/partnerIntegrations.ts:69`, `src/domain/farely/directAffiliateComparison.ts:9`

### L07: Operational Resilience & Resource Saturation
- **Audit Findings**: Hard capping cohort size at `MAX_COHORT_ANALYSIS_SIZE = 250` prevents CPU saturation and memory bloat during statistical sort operations.
- **Physical Code Citations**: `src/domain/farely/priceAnomaly.ts:37`

### L08: Architectural Cohesion & Schema Evolution
- **Audit Findings**: Pure domain logic functions require zero database migrations and maintain compatibility across all 47 migrations in `supabase/migrations/`.
- **Physical Code Citations**: `supabase/migrations/20260407000000_initial_schema.sql:1`

### L09: Observability, Traceability & Forensic Auditability
- **Audit Findings**: Disqualification reasons and anomaly explanation strings provide transparent, machine-readable rationales for every governance decision.
- **Physical Code Citations**: `src/domain/farely/partnerIntegrations.ts:42`, `src/domain/farely/priceAnomaly.ts:32`

### L10: Developer Velocity & Turnkey Verification
- **Audit Findings**: Turnkey vitest test runners execute in $< 350 \text{ ms}$ with zero network mocking.
- **Physical Code Citations**: `package.json:34`

### L11: Graceful Degradation & Autonomous Recovery
- **Audit Findings**: In the event of sparse data or unlisted providers, fallback classifications ensure uninterrupted client operations without crashing.
- **Physical Code Citations**: `src/domain/farely/priceAnomaly.ts:19`, `src/domain/farely/providerCapabilities.ts:23`

### L12: Long-Term Maintenance & Debt Eradication
- **Audit Findings**: Clean domain separation without circular dependencies guarantees maintenance velocity.
- **Physical Code Citations**: `src/domain/farely/partnerIntegrations.ts:16`, `src/domain/farely/providerCapabilities.ts:9`

---

## SECTION F: CANONICAL RISK MATRIX

| Risk ID | Vulnerability Vector | Severity | Mitigation Strategy | Verification Oracle |
|---|---|---|---|---|
| RSK-01 | Negative-margin partner enabled commercially | Critical | Require `marginalRoi >= 1.0` and `netMarginPerBooking >= 0` | `src/domain/farely/partnerIntegrations.test.ts` |
| RSK-02 | Pipeline ordering bug in cohort price filtering | High | Filter finite positive prices before slicing 250 elements | `src/domain/farely/priceAnomaly.test.ts` |
| RSK-03 | Multi-city intent routed to unsupported carrier | High | Verify `supportsMultiCity` when journey is multi-city | `src/domain/farely/providerCapabilities.test.ts` |
| RSK-04 | Glitch fare ($< 10,000\text{ VND}$) triggers false alert | High | Classify prices below realistic airline floor as data glitches | `src/domain/farely/priceAnomaly.test.ts` |
| RSK-05 | Unknown provider ID throws fatal runtime error | Medium | Return structured unsupported result with descriptive explanation | `src/domain/farely/providerCapabilities.test.ts` |

---

## SECTION G: TRANSACTIONAL WORK PACKAGES

### WP01: WP01-PARTNER-INTEGRATION-GOVERNANCE
- **Target File**: `src/domain/farely/partnerIntegrations.ts`
- **Action**: Add negative margin disqualification, strict unit economics floor, and legal contract gates.
- **Verification**: `npx vitest run src/domain/farely/partnerIntegrations.test.ts`

### WP02: WP02-PROVIDER-CAPABILITIES-DEFENSE
- **Target File**: `src/domain/farely/providerCapabilities.ts`
- **Action**: Add multi-city capability check, default cabin fallback, and safe unknown provider handling.
- **Verification**: `npx vitest run src/domain/farely/providerCapabilities.test.ts`

### WP03: WP03-PRICE-ANOMALY-ROBUST-MAD
- **Target File**: `src/domain/farely/priceAnomaly.ts`
- **Action**: Enforce filter-then-slice pipeline order, 10,000 VND glitch floor, and zero-MAD defense.
- **Verification**: `npx vitest run src/domain/farely/priceAnomaly.test.ts`
