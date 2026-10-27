# FARELY PROJECT 10X — RESEARCH R10 [R4]
# CYCLE: G88
# LEVEL: Pass 4: Production SRE Rigor & Zero-Mock Verification
# MANDATE: Enforce rigorous SRE production standards, telemetry observability, and deterministic error boundaries. Actively falsify Pass R3 across lenses L08 (Architectural Cohesion), L09 (Observability & Forensic Auditability), and L10 (Developer Velocity) with concrete code line citations, telemetry specifications, and zero-mock testing harnesses.
# GIT_COMMIT: bf859accb2480000370e1c813270a614d4758de7
# TIMESTAMP: 2026-10-27T09:31:00.000Z
# EXECUTION_RECEIPT_SHA256: b3ff7d00492a94c8101f73798d577f7a4f3db13040e3daf8d6bb96ff571532fa

---

## SECTION A: ADVERSARIAL FALSIFICATION & AUDIT OF PASS R3

Pass R3 resolved input fuzzing vulnerabilities and bounded recursive traversal. However, Pass R3 operated under basic programmatic assumptions, neglecting SRE telemetry observability, structured incident triage codes, and end-to-end auditability. Pass R4 systematically audits and falsifies Pass R3 across three critical production lenses:

### 1. Falsification of Lens L09 (Observability, Traceability & Forensic Auditability) in `src/domain/farely/personalizedFeedPrivacy.ts#L160-L185`
- **Flaws in Pass R3**: Pass R3 generated user-facing ranking strings but omitted structured telemetry signals for ranking auditing.
- **R4 SRE Audit & Falsification**: In `src/domain/farely/personalizedFeedPrivacy.ts#L160-L185`, `RankedFeedItem` returns only `rankingRationaleVi: string`. When monitoring personalization impact across hundreds of thousands of daily feed views, parsing qualitative Vietnamese strings to compute algorithm score uplift is computationally prohibitive. SRE pipelines cannot detect model drift or anomalous score skew without machine-readable delta attributes.
- **R4 Remediation**: Export structured telemetry fields on `RankedFeedItem`: `personalizedScoreDelta: number` and `matchedPreferenceRules: string[]`, enabling real-time Grafana telemetry.

### 2. Falsification of Lens L08 (Architectural Cohesion & Schema Evolution) in `src/domain/farely/partnerIntegrations.ts#L95-L120`
- **Flaws in Pass R3**: Pass R3 checked reliability thresholds but lacked standardized machine-parseable error reason codes in enablement evaluations.
- **R4 SRE Audit & Falsification**: In `src/domain/farely/partnerIntegrations.ts#L95-L120`, `PartnerEnablementDecision` returns qualitative Vietnamese text in `rejectionReasonVi`. During partner ingestion outages, automated routing controllers cannot programmatically switch traffic or trip circuit breakers without structured status enum codes.
- **R4 Remediation**: Standardize decision rejection taxonomy with machine-readable `diagnosticCode: "ERR_UNCONTRACTED" | "ERR_UNAUTHORIZED_SCRAPING" | "ERR_EXCESSIVE_LATENCY" | "ERR_LOW_SUCCESS_RATE" | "ERR_UNECONOMIC_MARGIN"`.

### 3. Falsification of Lens L10 (Developer Velocity & Turnkey Verification) in `src/domain/farely/vietnamTravelContext.ts#L145-L165`
- **Flaws in Pass R3**: Pass R3 verified airline baggage weight but omitted CAAV physical dimension specifications and baggage query benchmarks.
- **R4 SRE Audit & Falsification**: In `src/domain/farely/vietnamTravelContext.ts#L145-L165`, testing only airline string keys without automated regression fixtures for non-standard whitespace and multi-carrier itineraries leaves client apps prone to runtime crashes. Additionally, omitting standard maximum dimensions (56cm x 36cm x 23cm) fails CAAV passenger compliance.
- **R4 Remediation**: Add `maxCarryOnDimensionsCm?: string` to `CarrierBaggagePolicy` and supply turnkey hermetic test suites verifying domestic airlines (VN, VJ, QH, VU).

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

### SOL-01: SOL-PRIVACY-01 (Personalized Feed Privacy & Structured SRE Signals)
- **SOL_ID**: SOL-PRIVACY-01
- **TARGET_FILES**: `src/domain/farely/personalizedFeedPrivacy.ts`
- **LOCKED_ALGORITHM**:
  1. Fix `maxStops === 0` falsy bug: check `preferences.maxStops !== undefined && Number.isInteger(preferences.maxStops) && preferences.maxStops >= 0`.
  2. Enforce preference array bounds: `homeAirports` ($\le 10$), `preferredAirlines` ($\le 20$).
  3. Export structured telemetry attributes on `RankedFeedItem`: `personalizedScoreDelta?: number` and `matchedPreferenceRules?: string[]`.
  4. Cycle-safe traversal with prototype pollution defense and safe property reading.
- **FORBIDDEN_DEVIATIONS**: No tracking or profiling heuristics.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/personalizedFeedPrivacy.test.ts`

### SOL-02: SOL-PARTNER-01 (Partner Integrations & Diagnostic Code Taxonomy)
- **SOL_ID**: SOL-PARTNER-01
- **TARGET_FILES**: `src/domain/farely/partnerIntegrations.ts`
- **LOCKED_ALGORITHM**:
  1. Realistic latency gate: `averageLatencyMs >= 20 && averageLatencyMs <= 3000`.
  2. Commercial agreement gate: `hasActiveCommercialAgreement === true` and `hasAffiliateRights === true`.
  3. Unit economics: `estimatedRevenuePerBookingVND > estimatedApiCostPerBookingVND`.
  4. Structured diagnostic error codes on rejection.
- **FORBIDDEN_DEVIATIONS**: Never authorize uncontracted commercial sources.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/partnerIntegrations.test.ts`

### SOL-03: SOL-TRAVELCTX-01 (Vietnam Travel Context & CAAV Baggage Dimensions)
- **SOL_ID**: SOL-TRAVELCTX-01
- **TARGET_FILES**: `src/domain/farely/vietnamTravelContext.ts`
- **LOCKED_ALGORITHM**:
  1. Gregorian date validation with leap year verification.
  2. Whitespace and delimiter normalization for holiday matching.
  3. Accurate holiday definitions for Tet, Hung Kings, 30/4 - 1/5, National Day.
  4. Precise carrier baggage policy mapping with CAAV standard dimensions (56x36x23cm).
- **FORBIDDEN_DEVIATIONS**: No unverified airline baggage allowances.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/vietnamTravelContext.test.ts`

---

## SECTION E: THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- Strictly preserve Flight Opportunity Intelligence boundary. Direct ticketing, payment gateway processing, and passenger checkout are strictly `boundary_excluded`.
- Feed personalization remains an opt-in consumer utility, strictly independent of partner monetization bounties.

### L02: Economic Reality & Data Arbitrage Boundaries
- Partner onboarding requires verified economic positive yield. Commercial sources operating at a deficit drain infrastructure resources.
- Vietnamese peak seasonal demand creates extreme yield surges; accurate holiday calendars prevent false bargain alerts.

### L03: Epistemic Humility & Machine Learning Calibration
- Respect user agency: without explicit opt-in, rank exclusively by objective deal metrics.
- Avoid predicting passenger intent from demographic assumptions.

### L04: Mathematical Proof & Statistical Invariants
- Invariant 1: `maxStops = 0` correctly matched via explicit undefined check.
- Invariant 2: Net partner margin $> 0$ VND.
- Invariant 3: Gregorian calendar date validity guaranteed.

### L05: Adversarial Inputs & Boundary Penetration
- Resilient against prototype pollution (`__proto__`, `constructor`).
- Handles circular references gracefully.
- Rejects malformed dates and negative numbers.

### L06: Regulatory, Anti-Deception & Consumer Protection
- Compliant with Decree 13/2023/ND-CP on Personal Data Protection.
- Compliant with CAAV Circulars on passenger rights and baggage disclosures.

### L07: Operational Resilience & Resource Saturation
- Sub-millisecond execution envelope across all pure domain functions.
- Bounded memory and call stack depth protect Node.js microservices.

### L08: Architectural Cohesion & Schema Evolution
- Seamless interoperability between domain layer, Supabase Edge Functions, and frontend PWA.
- Strict compile-time typing guarantees no runtime field degradation.

### L09: Observability, Traceability & Forensic Auditability
- Transparent Vietnamese rationales for feed boosts.
- Detailed rejection diagnostics for partner evaluation pipelines.

### L10: Developer Velocity & Turnkey Verification
- Turnkey Vitest regression suites verify all edge conditions in $< 300$ ms.
- Zero-mock hermeticity ensures 100% reproducible execution in CI.

### L11: Graceful Degradation & Autonomous Recovery
- In the absence of user opt-in, feed gracefully falls back to objective deal score rankings without error.
- Unrecognized carrier codes safely fall back to CAAV default baggage policies.

### L12: Long-Term Maintenance & Debt Eradication
- Zero deprecated dependencies. Clean, modern TypeScript code adhering strictly to Farely coding standards.
- Modular domain interfaces facilitate straightforward future expansions.

---

## SECTION F: CANONICAL RISK MATRIX
| Risk ID | Severity | Mitigation Strategy | Proof Mechanism |
|---|---|---|---|
| R-SCORE-DRIFT | HIGH | Structured score delta metrics and preference flags | Vitest `personalizedFeedPrivacy.test.ts` |
| R-TELEMETRY-PARSING | MEDIUM | Standardized diagnostic error enum codes | Vitest `partnerIntegrations.test.ts` |
| R-BAGGAGE-DIMENSIONS | MEDIUM | Explicit CAAV dimension guidelines | Vitest `vietnamTravelContext.test.ts` |

---

## SECTION G: TRANSACTIONAL WORK PACKAGES

### WP01: WP01-FEED-PRIVACY-DEEP-SANITIZATION
- **Target**: `src/domain/farely/personalizedFeedPrivacy.ts`
- **Specification**: Implement cycle-safe traversal, prototype pollution defense, fix `maxStops === 0` bug, and enforce positive budget integer bounds.

### WP02: WP02-PARTNER-COMMERCIAL-RIGHTS-GATE
- **Target**: `src/domain/farely/partnerIntegrations.ts`
- **Specification**: Implement commercial contract verification, SLA threshold validation, and positive net margin evaluation.

### WP03: WP03-TRAVELCTX-HOLIDAY-BAGGAGE-SAFETY
- **Target**: `src/domain/farely/vietnamTravelContext.ts`
- **Specification**: Implement Gregorian date validation, 2026 holiday calendar matching, and CAAV carrier baggage policy retrieval.
