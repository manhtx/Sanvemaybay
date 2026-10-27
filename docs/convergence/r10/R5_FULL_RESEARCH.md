# FARELY PROJECT 10X — RESEARCH R10 [R5]
# CYCLE: G84
# LEVEL: Pass 5: Sovereign Canonical Convergence
# MANDATE: Synthesize final sovereign canonical convergence across all 12 Adversarial Lenses. Lock concrete algorithms for Partner Integrations, Provider Capabilities, and Robust Price Anomaly Detection with mathematical perfection and zero regression risk.
# GIT_COMMIT: 24fd09d4d24fa9ee39ea8695d203f3ae7f1d604b
# TIMESTAMP: 2026-10-27T08:28:00.000Z
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

## SECTION C: SOVEREIGN CANONICAL AUDIT & FALSIFICATION OF PASS R4

### Falsification 1: L08 & L12 (Optional Market Scope Compatibility in Travel Intents)
- *Deficits Identified in Pass R4*: Pass R4 added market scope checking, but failed to preserve backward compatibility when callers omit `marketScope`. Existing test cases in `src/domain/farely/providerCapabilities.test.ts:32` construct lightweight `TravelIntent` objects without a `marketScope` property. Mandating `intent.marketScope` unconditionally causes existing test assertions to fail unexpectedly, violating Invariant 2 (No Contract Shrinkage). Sovereign convergence dictates that when `marketScope` is omitted, the provider check must proceed without penalty; but when `intent.marketScope` is explicitly specified, it must strictly be validated against `caps.supportedMarketScopes`.
- *Physical Code Verification*: In `src/domain/farely/providerCapabilities.ts:18` and `src/domain/farely/providerCapabilities.test.ts:32`.
- *Sovereign Remedy*: Validate `intent.marketScope` only when defined:
```typescript
if (intent.marketScope && !caps.supportedMarketScopes.includes(intent.marketScope)) {
  reasons.push(`Provider does not support market scope: ${intent.marketScope}`);
}
```

### Falsification 2: L04 & L06 (Tet Seasonal Inflation Contextualization in Anomaly Explanations)
- *Deficits Identified in Pass R4*: Pass R4 calculated statistical anomalies, but did not integrate Tet peak seasonal context into the resulting narrative. During Tet travel windows (`isTetDeparture(departureDate) === true`), standard domestic baseline prices inflate naturally due to structural supply shortages. An anomaly alert during Tet must explicitly alert consumers whether a price drop is remarkable given peak Tet inflation, preventing travelers from misjudging the seasonal value.
- *Physical Code Verification*: In `src/domain/farely/priceAnomaly.ts:54` and `src/domain/farely/priceAnomaly.ts:180`.
- *Sovereign Remedy*: Incorporate `isTetDeparture(departureDate)` into the final `explanationVi` rationale when a price anomaly is detected during Lunar New Year travel windows.

### Falsification 3: L01 & L02 (Deterministic Commercial Tier Resolution in Partner Governance)
- *Deficits Identified in Pass R4*: Pass R4 defined `commercialTier`, but did not specify the deterministic precedence logic between direct commercial partners and approved affiliates. If a partner has both active commercial agreements and affiliate rights, sovereign governance requires designating them as `DIRECT_COMMERCIAL_PARTNER`. Only when direct agreements are absent but affiliate rights and scraping permission exist should the tier be `APPROVED_AFFILIATE_PARTNER`. Any partner with disqualification reasons must deterministically receive `DISQUALIFIED_INDICATIVE_ONLY`.
- *Physical Code Verification*: In `src/domain/farely/partnerIntegrations.ts:33` and `src/domain/farely/partnerIntegrations.ts:135`.
- *Sovereign Remedy*: Enforce deterministic commercial tier assignment matching contract rights.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS

### SOL-01: SOL-PARTNER-01 (Partner Commercial Enablement Governance & Unit Economics)
- **SOL_ID**: SOL-PARTNER-01
- **TARGET_FILES**: `src/domain/farely/partnerIntegrations.ts`
- **LOCKED_ALGORITHM**:
  1. In `evaluatePartnerCommercialViability`:
     - Sanitize numbers: verify `Number.isFinite` on all numeric fields.
     - Enforce non-negative bounds:
       - `profile.historicalSuccessRatePercent >= 0 && profile.historicalSuccessRatePercent <= 100`.
       - `profile.averageLatencyMs >= 0 && profile.averageLatencyMs <= 6000`.
       - `profile.marginalQueryCostVND >= 0`, `profile.expectedQueriesPerBooking >= 0`.
     - Calculate unit economics:
       - `totalCostPerBookingVND = Math.max(0, profile.marginalQueryCostVND * profile.expectedQueriesPerBooking)`.
       - `netMarginPerBookingVND = profile.estimatedRevenuePerBookingVND - totalCostPerBookingVND`.
       - `marginalRoi = totalCostPerBookingVND > 0 ? profile.estimatedRevenuePerBookingVND / totalCostPerBookingVND : 0`.
       - `isEconomicallyViable = marginalRoi >= 1.0 && netMarginPerBookingVND >= 0`.
     - Evaluate legal authorization:
       - Reject if `profile.isRestrictedOrBlocked`.
       - Require `profile.hasActiveCommercialAgreement || (profile.hasAffiliateRights && profile.isScrapingPermitted)`.
     - Set `isCommerciallyEnabled = disqualificationReasons.length === 0`.
     - Assign `commercialTier`:
       - If `!isCommerciallyEnabled` $\to$ `DISQUALIFIED_INDICATIVE_ONLY`.
       - Else if `profile.hasActiveCommercialAgreement` $\to$ `DIRECT_COMMERCIAL_PARTNER`.
       - Else $\to$ `APPROVED_AFFILIATE_PARTNER`.
- **FORBIDDEN_DEVIATIONS**: No unverified external dependencies; preserve return structures; maintain commercial neutrality.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/partnerIntegrations.test.ts`

### SOL-02: SOL-CAPABILITY-01 (Provider Capability Matrix & Journey Boundary Defense)
- **SOL_ID**: SOL-CAPABILITY-01
- **TARGET_FILES**: `src/domain/farely/providerCapabilities.ts`
- **LOCKED_ALGORITHM**:
  1. In `isIntentSupportedByProvider`:
     - Guard provider registry: if provider not found, return `{ isSupported: false, reasons: ['Unknown provider ID'] }`.
     - Default cabin: `const effectiveCabin = intent.cabinClass || 'ECONOMY';`.
     - Validate journey type: `caps.supportedJourneyTypes.includes(intent.journeyType)`.
     - Validate multi-city: if `intent.journeyType === 'MULTI_CITY'` and `!caps.supportsMultiCity`, reject.
     - Validate market scope: if `intent.marketScope` is provided, verify `caps.supportedMarketScopes.includes(intent.marketScope)`.
     - Validate advance days: if `intent.advanceDays !== undefined` and `caps.maxAdvanceDays !== undefined`, verify `intent.advanceDays <= caps.maxAdvanceDays`.
- **FORBIDDEN_DEVIATIONS**: No external packages; maintain typed registry interfaces; preserve all existing provider configurations.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/providerCapabilities.test.ts`

### SOL-03: SOL-ANOMALY-01 (Robust MAD Price Anomaly Detection & Glitch Filtering)
- **SOL_ID**: SOL-ANOMALY-01
- **TARGET_FILES**: `src/domain/farely/priceAnomaly.ts`
- **LOCKED_ALGORITHM**:
  1. In `detectPriceAnomaly`:
     - Glitch check: if `!Number.isFinite(currentPrice) || currentPrice < 10000`, return `SUSPECTED_DATA_GLITCH`.
     - Pipeline order: filter positive finite historical prices FIRST, then slice the most recent `MAX_COHORT_ANALYSIS_SIZE = 250`.
     - Sample size check: if `cohort.length < 10`, return `SPARSE_DATA_ABSTENTION`.
     - Median & MAD: calculate median, compute absolute deviations from median, calculate MAD.
     - If `mad === 0`, return `INSUFFICIENT_DISPERSION_ABSTENTION`.
     - Modified Z-score: `const modifiedZScore = Number(((0.6745 * (medianPrice - currentPrice)) / mad).toFixed(2));`.
     - Discount percent: `const discountVsMedianPercent = Math.round(((medianPrice - currentPrice) / medianPrice) * 100);`.
     - Tet contextualization: if `isTetDeparture(departureDate)` and deal is actionable, enrich `explanationVi` with Tet high-demand caveat.
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
| RSK-01 | Unrounded IEEE 754 percentages corrupt client displays | Medium | Integer round discount percentages with `Math.round` | `src/domain/farely/priceAnomaly.test.ts` |
| RSK-02 | Clock-skew negative latency bypasses SLA limit | High | Enforce non-negative latency check `averageLatencyMs >= 0` | `src/domain/farely/partnerIntegrations.test.ts` |
| RSK-03 | Market scope international mismatch routed to domestic airline | High | Validate `intent.marketScope` when explicitly provided | `src/domain/farely/providerCapabilities.test.ts` |
| RSK-04 | Glitch fare ($< 10,000\text{ VND}$) triggers fake notification | High | Classify prices below realistic airline floor as data glitches | `src/domain/farely/priceAnomaly.test.ts` |
| RSK-05 | Unknown provider ID throws fatal runtime error | Medium | Return structured unsupported result with descriptive explanation | `src/domain/farely/providerCapabilities.test.ts` |

---

## SECTION G: TRANSACTIONAL WORK PACKAGES

### WP01: WP01-PARTNER-INTEGRATION-GOVERNANCE
- **Target File**: `src/domain/farely/partnerIntegrations.ts`
- **Action**: Add negative latency guards, success rate percentage boundaries, and economic viability enforcement.
- **Verification**: `npx vitest run src/domain/farely/partnerIntegrations.test.ts`

### WP02: WP02-PROVIDER-CAPABILITIES-DEFENSE
- **Target File**: `src/domain/farely/providerCapabilities.ts`
- **Action**: Add optional market scope validation, advance booking limit check, and safe unknown provider handling.
- **Verification**: `npx vitest run src/domain/farely/providerCapabilities.test.ts`

### WP03: WP03-PRICE-ANOMALY-ROBUST-MAD
- **Target File**: `src/domain/farely/priceAnomaly.ts`
- **Action**: Add discount percentage integer rounding, modified Z-score formatting, and 10k VND glitch floor.
- **Verification**: `npx vitest run src/domain/farely/priceAnomaly.test.ts`
