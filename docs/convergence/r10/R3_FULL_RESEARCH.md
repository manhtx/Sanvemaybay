# FARELY PROJECT 10X — RESEARCH R10 [R3]
# CYCLE: G88
# LEVEL: Pass 3: Hostile Boundary & Negative Vector Hardening
# MANDATE: Subject all modules and Pass R2 findings to hostile penetration testing, adversarial input fuzzing, and negative vector defenses. Actively falsify and critique lenses L05 (Adversarial Inputs), L07 (Operational Resilience), and L11 (Graceful Degradation) with concrete code line citations and edge-case exploit demonstrations.
# GIT_COMMIT: bf859accb2480000370e1c813270a614d4758de7
# TIMESTAMP: 2026-10-27T09:29:00.000Z
# EXECUTION_RECEIPT_SHA256: b3ff7d00492a94c8101f73798d577f7a4f3db13040e3daf8d6bb96ff571532fa

---

## SECTION A: ADVERSARIAL FALSIFICATION & AUDIT OF PASS R2

Pass R2 eliminated mathematical edge-case bugs like the `maxStops === 0` falsy evaluation and timezone offsets. However, Pass R2 assumed benign inputs and failed to address hostile payloads, denial-of-service vectors, and malicious input fuzzing. Pass R3 executes hostile boundary falsification across three critical lenses:

### 1. Falsification of Lens L05 (Adversarial Inputs & Boundary Penetration) in `src/domain/farely/personalizedFeedPrivacy.ts#L65-L85`
- **Flaws in Pass R2**: Pass R2 verified recursive depth but left the ranking engine vulnerable to getter side-effects and duplicate deal collisions.
- **R3 Hostile Exploitation**: In `src/domain/farely/personalizedFeedPrivacy.ts#L65-L85`, if an adversary submits a `contextPayload` containing object getters that throw errors or trigger state mutations, `traverse(value, depth + 1)` crashes the feed endpoint. Furthermore, if `deals` contains duplicate deal IDs with differing prices, or if `preferences.preferredAirlines` contains 10,000 elements, array scanning incurs quadratic $O(N \times M)$ overhead, blocking the Node.js event loop.
- **R3 Hardening Invariant**: Use `Object.prototype.hasOwnProperty` and safe property descriptor extraction. Bound preference arrays: `homeAirports` ($\le 10$), `preferredAirlines` ($\le 20$). Sanitize duplicate deals by maintaining an internal ID set.

### 2. Falsification of Lens L07 (Operational Resilience & Resource Saturation) in `src/domain/farely/partnerIntegrations.ts#L50-L70`
- **Flaws in Pass R2**: Pass R2 checked success rate and latency thresholds but tolerated zero-latency spoofing and negative revenue injection.
- **R3 Hostile Exploitation**: In `src/domain/farely/partnerIntegrations.ts#L50-L70`, if an untrusted partner configuration passes `averageLatencyMs = 0` or negative values, the system accepts it as high-performance. In reality, external HTTP network roundtrips physically require $\ge 20$ ms. Zero latency indicates falsified telemetry or mock data leaking into production. Additionally, if `estimatedRevenuePerBookingVND` is passed as negative (`-50,000 VND`), comparing against negative costs can result in anomalous approval states.
- **R3 Hardening Invariant**: Enforce realistic latency bounds: `averageLatencyMs >= 20 && averageLatencyMs <= 3000`. Enforce positive integer economics: `estimatedRevenuePerBookingVND > 0` and `estimatedApiCostPerBookingVND >= 0`.

### 3. Falsification of Lens L11 (Graceful Degradation & Autonomous Recovery) in `src/domain/farely/vietnamTravelContext.ts#L110-L130`
- **Flaws in Pass R2**: Pass R2 handled standard holiday date formats but lacked defense against malformed date delimiters and unicode spaces.
- **R3 Hostile Exploitation**: In `src/domain/farely/vietnamTravelContext.ts#L110-L130`, departure dates containing non-breaking spaces (`\u00A0`), control characters, or inverted month/day representations bypass regex validation and return `null` silently instead of safely degrading or logging diagnostic telemetry.
- **R3 Hardening Invariant**: Strip non-standard whitespace before regex matching. When dates fail validation, log structured warning in debug mode while gracefully returning `null` to prevent UI rendering crashes.

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

### SOL-01: SOL-PRIVACY-01 (Personalized Feed Privacy & Hostile Payload Defense)
- **SOL_ID**: SOL-PRIVACY-01
- **TARGET_FILES**: `src/domain/farely/personalizedFeedPrivacy.ts`
- **LOCKED_ALGORITHM**:
  1. Fix `maxStops === 0` falsy evaluation: check `preferences.maxStops !== undefined && Number.isInteger(preferences.maxStops) && preferences.maxStops >= 0`.
  2. Enforce preference array bounds: `homeAirports` ($\le 10$), `preferredAirlines` ($\le 20$).
  3. Cycle-safe traversal with prototype pollution defense and safe property reading.
  4. Deduplicate candidate deals by ID.
- **FORBIDDEN_DEVIATIONS**: No tracking or profiling heuristics.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/personalizedFeedPrivacy.test.ts`

### SOL-02: SOL-PARTNER-01 (Partner Integrations & Telemetry Reality Gate)
- **SOL_ID**: SOL-PARTNER-01
- **TARGET_FILES**: `src/domain/farely/partnerIntegrations.ts`
- **LOCKED_ALGORITHM**:
  1. Realistic latency gate: `averageLatencyMs >= 20 && averageLatencyMs <= 3000`.
  2. Commercial agreement gate: `hasActiveCommercialAgreement === true` and `hasAffiliateRights === true`.
  3. Positive integer revenue gate: `estimatedRevenuePerBookingVND > 0`.
  4. Rejection of uncontracted scraping or restricted status.
- **FORBIDDEN_DEVIATIONS**: Never authorize uncontracted commercial sources.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/partnerIntegrations.test.ts`

### SOL-03: SOL-TRAVELCTX-01 (Vietnam Travel Context & Date Hygiene)
- **SOL_ID**: SOL-TRAVELCTX-01
- **TARGET_FILES**: `src/domain/farely/vietnamTravelContext.ts`
- **LOCKED_ALGORITHM**:
  1. Gregorian date validation with leap year verification.
  2. Whitespace and delimiter normalization for holiday matching.
  3. Accurate holiday definitions for Tet, Hung Kings, 30/4 - 1/5, National Day.
  4. Precise carrier baggage policy mapping (VN, VJ, QH, VU).
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
| R-GETTER-MUTATION | HIGH | Safe property extraction and depth bounds | Vitest `personalizedFeedPrivacy.test.ts` |
| R-ZERO-LATENCY-SPOOF | HIGH | Enforce realistic network latency bounds >= 20ms | Vitest `partnerIntegrations.test.ts` |
| R-UNICODE-DATE | MEDIUM | Clean non-breaking spaces and normalize delimiters | Vitest `vietnamTravelContext.test.ts` |

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
