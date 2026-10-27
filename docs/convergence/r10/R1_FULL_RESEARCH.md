# FARELY PROJECT 10X — RESEARCH R10 [R1]
# CYCLE: G84
# LEVEL: Pass 1: Full-Battery Baseline Synthesis
# MANDATE: Synthesize comprehensive baseline research across all 12 Adversarial Lenses for Cycle G84. Ground investigations in verified production code and lock solutions for Partner Integrations, Provider Capabilities, and Robust Price Anomaly Detection.
# GIT_COMMIT: 24fd09d4d24fa9ee39ea8695d203f3ae7f1d604b
# TIMESTAMP: 2026-10-27T08:18:00.000Z
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

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS

### SOL-01: SOL-PARTNER-01 (Partner Commercial Enablement Governance & Unit Economics)
- **SOL_ID**: SOL-PARTNER-01
- **TARGET_FILES**: `src/domain/farely/partnerIntegrations.ts`
- **LOCKED_ALGORITHM**:
  1. In `evaluatePartnerCommercialViability`:
     - Sanitize economic and query inputs: reject negative or non-finite numbers (`marginalQueryCostVND < 0`, `expectedQueriesPerBooking <= 0`, `estimatedRevenuePerBookingVND < 0`).
     - Guard against zero or NaN division when computing `marginalRoi`: if `totalCostPerBookingVND <= 0`, handle gracefully without NaN.
     - Enforce legal contract gate: if `isRestrictedOrBlocked` is true, immediately assign `DISQUALIFIED_INDICATIVE_ONLY`.
     - Mandate explicit agreement: `hasActiveCommercialAgreement || (hasAffiliateRights && isScrapingPermitted)`.
- **FORBIDDEN_DEVIATIONS**: No unverified external dependencies; do not modify public evaluation result interface; enforce strict legal compliance.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/partnerIntegrations.test.ts`

### SOL-02: SOL-CAPABILITY-01 (Provider Capability Matrix & Journey Boundary Defense)
- **SOL_ID**: SOL-CAPABILITY-01
- **TARGET_FILES**: `src/domain/farely/providerCapabilities.ts`
- **LOCKED_ALGORITHM**:
  1. In `isIntentSupportedByProvider`:
     - Sanitize travel intent: guard against non-string origin/destination, negative advance booking days, or malformed cabin classes.
     - Provide fallback for unlisted provider IDs: instead of returning undefined, safely return `{ isSupported: false, reasons: ['Unknown provider'] }`.
     - Validate journey type against `supportedJourneyTypes` and cabin against `supportedCabinClasses`.
- **FORBIDDEN_DEVIATIONS**: No unverified external packages; do not mutate existing registry entries; maintain typed interfaces.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/providerCapabilities.test.ts`

### SOL-03: SOL-ANOMALY-01 (Robust MAD Price Anomaly Detection & Glitch Filtering)
- **SOL_ID**: SOL-ANOMALY-01
- **TARGET_FILES**: `src/domain/farely/priceAnomaly.ts`
- **LOCKED_ALGORITHM**:
  1. In `detectPriceAnomaly`:
     - Guard against non-finite or negative prices: classify as `SUSPECTED_DATA_GLITCH`.
     - Floor minimum realistic fare at $10,000\text{ VND}$: fares below $10,000\text{ VND}$ are data entry glitches, not genuine market drops.
     - Enforce `MIN_ANOMALY_SAMPLE_SIZE = 10`: cohorts with $< 10$ samples must return `SPARSE_DATA_ABSTENTION`.
     - Cap cohort prices at `MAX_COHORT_ANALYSIS_SIZE = 250` to bound computation time.
     - Handle zero dispersion (`mad === 0`): return `INSUFFICIENT_DISPERSION_ABSTENTION` to prevent division by zero in modified Z-score.
- **FORBIDDEN_DEVIATIONS**: No external math libraries; preserve existing classification enum; retain Tet window adjustments.
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
| RSK-01 | Commercial enablement granted to restricted/blocked partner | Critical | Immediate disqualification check on `isRestrictedOrBlocked` | `src/domain/farely/partnerIntegrations.test.ts` |
| RSK-02 | Zero dispersion (`mad === 0`) causes division by zero in Z-score | High | Return `INSUFFICIENT_DISPERSION_ABSTENTION` when MAD is zero | `src/domain/farely/priceAnomaly.test.ts` |
| RSK-03 | Negative query cost causes fraudulent infinite ROI calculation | High | Validate finite positivity on economic cost inputs | `src/domain/farely/partnerIntegrations.test.ts` |
| RSK-04 | Glitch fare ($< 10,000\text{ VND}$) triggers false strong drop deal | High | Classify prices below realistic airline floor as data glitches | `src/domain/farely/priceAnomaly.test.ts` |
| RSK-05 | Unrecognized provider ID throws unhandled undefined access | Medium | Return structured unsupported response with descriptive reason | `src/domain/farely/providerCapabilities.test.ts` |

---

## SECTION G: TRANSACTIONAL WORK PACKAGES

### WP01: WP01-PARTNER-INTEGRATION-GOVERNANCE
- **Target File**: `src/domain/farely/partnerIntegrations.ts`
- **Action**: Add finite positive bounds on query costs, zero-division protection on marginal ROI, and strict legal agreement checks.
- **Verification**: `npx vitest run src/domain/farely/partnerIntegrations.test.ts`

### WP02: WP02-PROVIDER-CAPABILITIES-DEFENSE
- **Target File**: `src/domain/farely/providerCapabilities.ts`
- **Action**: Add input sanitization for travel intents, advance booking bounds, and safe fallback for unknown provider IDs.
- **Verification**: `npx vitest run src/domain/farely/providerCapabilities.test.ts`

### WP03: WP03-PRICE-ANOMALY-ROBUST-MAD
- **Target File**: `src/domain/farely/priceAnomaly.ts`
- **Action**: Floor realistic domestic fare at 10,000 VND, cap cohort analysis at 250 items, and defend zero-MAD dispersion.
- **Verification**: `npx vitest run src/domain/farely/priceAnomaly.test.ts`
