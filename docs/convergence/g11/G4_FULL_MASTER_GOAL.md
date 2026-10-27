# FARELY PROJECT 10X — MASTER GOAL G11 [G4]
# CYCLE: G88
# LEVEL: Pass 4: Production SRE Rigor & Zero-Mock Verification
# MANDATE: Enforce rigorous SRE production standards, telemetry observability, and deterministic error boundaries. Actively audit and falsify Pass G3 across lenses L08 (Architectural Cohesion), L09 (Observability & Forensic Auditability), and L10 (Developer Velocity) with concrete code line citations, telemetry specifications, and zero-mock testing harnesses.
# GIT_COMMIT: bf859accb2480000370e1c813270a614d4758de7
# TIMESTAMP: 2026-10-27T09:41:00.000Z
# EXECUTION_RECEIPT_SHA256: b3ff7d00492a94c8101f73798d577f7a4f3db13040e3daf8d6bb96ff571532fa

---

## SECTION A: ADVERSARIAL FALSIFICATION & AUDIT OF PASS G3

Pass G3 sealed negative vector vulnerabilities against cyclic graphs and date overflows. However, Pass G3 lacked operational observability specifications, structured SRE metric payloads, and developer regression feedback loops. Pass G4 systematically falsifies Pass G3 across three critical production lenses:

### 1. Falsification of Lens L09 (Observability, Traceability & Forensic Auditability) in `src/domain/farely/partnerIntegrations.ts#L80-L105`
- **Flaws in Pass G3**: Pass G3 specified unit economics formulas but omitted structured Prometheus instrumentation definitions for partner rejection reasons.
- **G4 SRE Falsification**: In `src/domain/farely/partnerIntegrations.ts#L80-L105`, when an unauthorized or uneconomic partner is rejected, returning only a Vietnamese sentence forces monitoring dashboards to execute brittle string regex matching to count failure categories.
- **G4 Corrective Invariant**: Standardize rejection outputs with an explicit enum code: `rejectionCode: "UNAUTHORIZED_NO_AGREEMENT" | "UNAUTHORIZED_SCRAPING" | "UNRELIABLE_SLA" | "NEGATIVE_UNIT_MARGIN" | "BLOCKED_PROVIDER"`.

### 2. Falsification of Lens L08 (Architectural Cohesion & Schema Evolution) in `src/domain/farely/personalizedFeedPrivacy.ts#L150-L180`
- **Flaws in Pass G3**: Pass G3 enforced tie-breaking but lacked schema cohesion with edge worker cache serializations.
- **G4 SRE Falsification**: In `src/domain/farely/personalizedFeedPrivacy.ts#L150-L180`, returning variable field keys across unconsented vs consented feeds creates JSON schema drift for edge caching proxies.
- **G4 Corrective Invariant**: Guarantee uniform shape for `RankedFeedItem`: always populate `isPersonalizedPromotion: boolean`, `displayRank: number`, `rankingRationaleVi: string`, and ensure optional telemetry fields degrade gracefully.

### 3. Falsification of Lens L10 (Developer Velocity & Turnkey Verification) in `src/domain/farely/vietnamTravelContext.ts#L140-L165`
- **Flaws in Pass G3**: Pass G3 validated baggage allowances but provided no automated regression fixtures for domestic airlines under simulated network delays.
- **G4 SRE Falsification**: In `src/domain/farely/vietnamTravelContext.ts#L140-L165`, testing only happy-path carrier codes without benchmarking execution speed against massive search results leaves client apps prone to UI stutter.
- **G4 Corrective Invariant**: Mandate turnkey Vitest test suites executing exhaustive carrier lookups (VN, VJ, QH, VU, unknown) executing in under 5 milliseconds.

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

### SOL-01: SOL-PRIVACY-01 (Personalized Feed Privacy & Deterministic Ranking Cage)
- **SOL_ID**: SOL-PRIVACY-01
- **TARGET_FILES**: `src/domain/farely/personalizedFeedPrivacy.ts`
- **LOCKED_ALGORITHM**:
  1. Fix `maxStops === 0` falsy bug: check `preferences.maxStops !== undefined && Number.isInteger(preferences.maxStops) && preferences.maxStops >= 0`.
  2. Enforce preference array bounds: `homeAirports` ($\le 10$), `preferredAirlines` ($\le 20$).
  3. Cycle-safe traversal with prototype pollution defense and safe property reading.
  4. Multi-tier deterministic sorting: `score DESC -> priceVND ASC -> id ASC`.
  5. Export structured telemetry attributes on `RankedFeedItem`: `personalizedScoreDelta?: number` and `matchedPreferenceRules?: string[]`.
- **FORBIDDEN_DEVIATIONS**: No tracking or profiling heuristics.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/personalizedFeedPrivacy.test.ts`

### SOL-02: SOL-PARTNER-01 (Commercial Partner Governance & Live Repricing Gate)
- **SOL_ID**: SOL-PARTNER-01
- **TARGET_FILES**: `src/domain/farely/partnerIntegrations.ts`
- **LOCKED_ALGORITHM**:
  1. Live repricing requirement: `profile.supportsLiveRepricing === true`.
  2. Realistic latency gate: `averageLatencyMs >= 20 && averageLatencyMs <= 3000`.
  3. Commercial agreement gate: `hasActiveCommercialAgreement === true` and `hasAffiliateRights === true`.
  4. Unit economics: `estimatedRevenuePerBookingVND > estimatedApiCostPerBookingVND`.
  5. Structured diagnostic error codes on rejection.
- **FORBIDDEN_DEVIATIONS**: Never authorize uncontracted commercial sources.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/partnerIntegrations.test.ts`

### SOL-03: SOL-TRAVELCTX-01 (Vietnam Travel Context & Year-End Holiday Extension)
- **SOL_ID**: SOL-TRAVELCTX-01
- **TARGET_FILES**: `src/domain/farely/vietnamTravelContext.ts`
- **LOCKED_ALGORITHM**:
  1. Gregorian date validation with leap year verification.
  2. Whitespace and delimiter normalization for holiday matching.
  3. Holiday definitions for Tet 2026, Hung Kings, 30/4 - 1/5, National Day, and New Year 2027.
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
| R-FEED-DETERMINISM | HIGH | Multi-tier deterministic tie-breaking (score, price, id) | Vitest `personalizedFeedPrivacy.test.ts` |
| R-LIVE-REPRICING-SPOOF | HIGH | Live repricing capability gate before commercial enablement | Vitest `partnerIntegrations.test.ts` |
| R-HOLIDAY-BLINDSPOT | MEDIUM | Extended holiday calendar including New Year 2027 | Vitest `vietnamTravelContext.test.ts` |

---

## SECTION G: TRANSACTIONAL WORK PACKAGES

### WP01: WP01-FEED-PRIVACY-DEEP-SANITIZATION
- **Target**: `src/domain/farely/personalizedFeedPrivacy.ts`
- **Specification**: Implement cycle-safe traversal, prototype pollution defense, fix `maxStops === 0` bug, multi-tier deterministic sorting, and score delta telemetry.

### WP02: WP02-PARTNER-COMMERCIAL-RIGHTS-GATE
- **Target**: `src/domain/farely/partnerIntegrations.ts`
- **Specification**: Implement live repricing check, commercial contract verification, SLA threshold validation, and positive net margin evaluation.

### WP03: WP03-TRAVELCTX-HOLIDAY-BAGGAGE-SAFETY
- **Target**: `src/domain/farely/vietnamTravelContext.ts`
- **Specification**: Implement Gregorian date validation, New Year 2027 holiday coverage, and CAAV carrier baggage policy retrieval with standard dimensions.
