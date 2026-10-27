# FARELY PROJECT 10X — RESEARCH R10 [R1]
# CYCLE: G88
# LEVEL: Pass 1: Full-Battery Baseline Synthesis
# MANDATE: Synthesize comprehensive baseline empirical research across all 12 Adversarial Lenses for Cycle G88. Lock technical solutions SOL-PRIVACY-01 (Personalized travel feed privacy & non-profiling), SOL-PARTNER-01 (Commercial partner governance & unit economics gate), and SOL-TRAVELCTX-01 (Vietnam holiday calendar & carrier baggage policy verification) under the Solution Cage Protocol with zero-trust verification and turnkey regression tests.
# GIT_COMMIT: bf859accb2480000370e1c813270a614d4758de7
# TIMESTAMP: 2026-10-27T09:25:00.000Z
# EXECUTION_RECEIPT_SHA256: b3ff7d00492a94c8101f73798d577f7a4f3db13040e3daf8d6bb96ff571532fa

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

### SOL-01: SOL-PRIVACY-01 (Personalized Feed Privacy & Covert Profiling Ban)
- **SOL_ID**: SOL-PRIVACY-01
- **TARGET_FILES**: `src/domain/farely/personalizedFeedPrivacy.ts`
- **LOCKED_ALGORITHM**:
  1. In `sanitizePersonalizationContext`:
     - Deep cycle-safe object traversal with recursion depth ceiling ($\le 8$).
     - Prototype pollution defense ignoring `__proto__`, `constructor`, `prototype`.
     - Reject sensitive demographic inference keys (`inferredIncomeTier`, `inferredReligion`, `inferredEthnicity`, `inferredPoliticalStance`, `inferredHealthStatus`, `covertDeviceFingerprint`, `surveillanceCohortId`, `inferredMaritalStatus`, `creditWorthinessScore`) with `CovertProfilingViolationError`.
  2. In `rankFeedWithPrivacyGuarantees`:
     - Enforce strict affirmative opt-in: `preferences.isPersonalizationOptedIn === true`. When unconsented, fallback exclusively to objective deal score sorting.
     - Validate numeric budget filters: reject negative or non-finite `maxBudgetVND`.
- **FORBIDDEN_DEVIATIONS**: No third-party ad-tracking libraries; preserve exact Vietnamese ranking rationales.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/personalizedFeedPrivacy.test.ts`

### SOL-02: SOL-PARTNER-01 (Commercial Enablement & Partner Unit Economics Gate)
- **SOL_ID**: SOL-PARTNER-01
- **TARGET_FILES**: `src/domain/farely/partnerIntegrations.ts`
- **LOCKED_ALGORITHM**:
  1. In `evaluatePartnerCommercialEnablement`:
     - Commercial rights invariant: reject with `UnauthorizedCommercialSourceError` if `hasActiveCommercialAgreement !== true` or `hasAffiliateRights !== true`.
     - Anti-scraping defense: reject if `isScrapingPermitted === true` without active commercial agreement.
     - Restriction defense: reject if `isRestrictedOrBlocked === true`.
     - Quality SLA gate: require `historicalSuccessRatePercent >= 95` and `averageLatencyMs <= 3000`.
     - Unit economics surplus gate: require `estimatedRevenuePerBookingVND > estimatedApiCostPerBookingVND` with minimum net positive margin.
- **FORBIDDEN_DEVIATIONS**: Never authorize uncontracted or blocked commercial sources.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/partnerIntegrations.test.ts`

### SOL-03: SOL-TRAVELCTX-01 (Vietnam Holiday Calendars & Carrier Baggage Policy Grounding)
- **SOL_ID**: SOL-TRAVELCTX-01
- **TARGET_FILES**: `src/domain/farely/vietnamTravelContext.ts`
- **LOCKED_ALGORITHM**:
  1. In `isValidCalendarDate`:
     - Enforce regex format `^\d{4}-\d{2}-\d{2}$`.
     - Validate Gregorian calendar limits and leap year calculation via UTC Date constructor.
  2. In `getVietnamHolidayContext`:
     - Clean delimiters (`.` and `/` to `-`), extract 10-char date slice, and return matched holiday object with peak demand indicator.
  3. In `getCarrierBaggagePolicy`:
     - Case-insensitive carrier lookup: `VN` (12kg carry-on, 23kg checked), `VJ` (7kg carry-on, 0kg checked), `QH` (7kg carry-on, 0kg checked), `VU` (7kg carry-on, 0kg checked).
     - Transparent fallback to `DEFAULT_CARRIER_BAGGAGE_POLICY` when requested.
- **FORBIDDEN_DEVIATIONS**: No hardcoded fictitious baggage allowances; reflect official CAAV carrier rules.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/vietnamTravelContext.test.ts`

---

## SECTION E: THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- Invariant: Flight Opportunity Intelligence only. Direct passenger ticketing, merchant payment gateways, and checkout flows remain strictly `boundary_excluded`.
- Personalization feeds provide transparent advisory sorting without creating commercial bias toward high-commission partners.

### L02: Economic Reality & Data Arbitrage Boundaries
- Partner enablement mandates positive marginal unit economics. Onboarding a provider whose API call costs exceed expected affiliate yields drains treasury without consumer benefit.
- Vietnam holiday travel dynamics create steep price cliffs; accurate holiday calendar bounds prevent false "cheap fare" alerts during peak Tet embargoes.

### L03: Epistemic Humility & Machine Learning Calibration
- Explicit privacy preferences reject black-box predictive profiling. If user has not explicitly consented to personalization, the algorithm strictly serves objective market scores.
- Baggage allowances state exact carrier constraints rather than assuming standard allowances across low-cost airlines.

### L04: Mathematical Proof & Statistical Invariants
- Mathematical proofs:
  - $\forall \text{partner}: \text{Revenue} - \text{ApiCost} > 0$.
  - $\forall \text{date}: \text{isValidCalendarDate}(D) \iff D \in \text{GregorianCalendar}$.
  - $\forall \text{feedItem}: \text{displayRank} \in [1, N]$ strictly unique and monotonic.

### L05: Adversarial Inputs & Boundary Penetration
- Resilient against prototype pollution attacks (`__proto__`, `constructor`).
- Handles circular object references in user context payloads without stack overflows.
- Defends against invalid date formats (`2026-02-30`, `2026/13/45`).

### L06: Regulatory, Anti-Deception & Consumer Protection
- Compliant with Decree 13/2023/ND-CP on Personal Data Protection (Bảo vệ dữ liệu cá nhân).
- Strictly forbids covert profiling and sensitive demographic surveillance.
- Compliant with CAAV regulations regarding mandatory baggage disclosures.

### L07: Operational Resilience & Resource Saturation
- Sub-millisecond calculation runtime. Negligible garbage collection overhead.
- Bounded recursion depth ($\le 8$) protects Edge Function runtimes against malicious deeply-nested JSON attacks.

### L08: Architectural Cohesion & Schema Evolution
- Seamless interoperability between domain layer, Supabase Edge Functions, and frontend PWA.
- Strict compile-time typing guarantees no runtime field degradation.

### L09: Observability, Traceability & Forensic Auditability
- Personalized ranking outputs include transparent Vietnamese rationales for each boosted item.
- Partner integration evaluations return detailed rejection diagnostics for operational observability.

### L10: Developer Velocity & Turnkey Verification
- Turnkey Vitest regression suites verify all edge conditions in $< 300$ ms.
- Zero-mock hermeticity ensures 100% reproducible execution in CI.

### L11: Graceful Degradation & Autonomous Recovery
- In the absence of user opt-in, the feed seamlessly falls back to objective deal score rankings without error.
- Unrecognized carrier codes safely fall back to CAAV default baggage policies.

### L12: Long-Term Maintenance & Debt Eradication
- Consolidates holiday calendars and baggage rules into clean, immutable constants.
- Eliminates ad-hoc scraping scripts in favor of governed commercial integration contracts.

---

## SECTION F: CANONICAL RISK MATRIX
| Risk ID | Severity | Mitigation Strategy | Proof Mechanism |
|---|---|---|---|
| R-PRIVACY-COVERT | CRITICAL | Cycle-safe deep sanitization and explicit opt-in enforcement | Vitest `personalizedFeedPrivacy.test.ts` |
| R-PARTNER-UNAUTHORIZED | HIGH | Commercial contract & net margin verification | Vitest `partnerIntegrations.test.ts` |
| R-TRAVELCTX-BAGGAGE | MEDIUM | Explicit CAAV carrier baggage policies and date validator | Vitest `vietnamTravelContext.test.ts` |

---

## SECTION G: TRANSACTIONAL WORK PACKAGES

### WP01: WP01-FEED-PRIVACY-DEEP-SANITIZATION
- **Target**: `src/domain/farely/personalizedFeedPrivacy.ts`
- **Specification**: Implement cycle-safe traversal, prototype pollution defense, explicit opt-in enforcement, and budget validation.

### WP02: WP02-PARTNER-COMMERCIAL-RIGHTS-GATE
- **Target**: `src/domain/farely/partnerIntegrations.ts`
- **Specification**: Implement commercial contract verification, SLA threshold validation, and positive net margin evaluation.

### WP03: WP03-TRAVELCTX-HOLIDAY-BAGGAGE-SAFETY
- **Target**: `src/domain/farely/vietnamTravelContext.ts`
- **Specification**: Implement Gregorian date validation, 2026 holiday calendar matching, and CAAV carrier baggage policy retrieval.
