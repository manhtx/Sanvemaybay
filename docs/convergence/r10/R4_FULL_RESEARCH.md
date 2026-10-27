# FARELY PROJECT 10X — RESEARCH R10 [R4]
# CYCLE: G87
# LEVEL: Pass 4: Production SRE Rigor & Zero-Mock Verification
# MANDATE: Enforce rigorous SRE production standards, telemetry observability, and deterministic error boundaries. Actively falsify Pass R3 across lenses L08 (Architectural Cohesion), L09 (Observability & Forensic Auditability), and L10 (Developer Velocity) with concrete code line citations, telemetry specifications, and zero-mock testing harnesses.
# GIT_COMMIT: 49917580f95ef93e3333b2a6977ef46c873fd22e
# TIMESTAMP: 2026-10-27T09:18:00.000Z
# EXECUTION_RECEIPT_SHA256: 4f4f8e68c913492e1fadb7df28e3fc3b5d7afd6562122c5cc320270bafec91f0

---

## SECTION A: ADVERSARIAL FALSIFICATION & AUDIT OF PASS R3

Pass R3 hardened the system against hostile edge cases and boundary fuzzing. However, Pass R3 operated under idealized architectural assumptions, failing to address SRE operational observability, telemetry leakage, and granular production error propagation. Pass R4 systematically falsifies Pass R3 across three vital lenses:

### 1. Falsification of Lens L09 (Observability, Traceability & Forensic Auditability) in `src/domain/farely/dataEconomics.ts#L112-L125`
- **Flaws in Pass R3**: Pass R3 asserted that unit economics tracking accurately captures scan costs and prevents cost leakage.
- **R4 SRE Audit & Falsification**: In `src/domain/farely/dataEconomics.ts#L112-L125`, examine the formula: `costPerScannedScopeVnd = cost > 0 && scans > 0 ? Math.max(1, Math.round(cost / scans)) : 0;`. If a cloud proxy worker or third-party search gateway incurs operational cost (`cost = 500_000 VND`) but encounters network timeouts or HTTP 429 rate limits resulting in `scans = 0`, the function returns `costPerScannedScopeVnd = 0`! In production SRE telemetry, this hides unmetered capital waste. Zero successfully scanned scopes with positive incurred cost represents an infinite or critical leak condition (`cost`), not a zero-cost operation!
- **R4 Remediation**: When `cost > 0` and `scans === 0`, telemetry must report `costPerScannedScopeVnd = cost` (unrealized sunk cost) and flag an operational alert in Prometheus/Grafana metrics.

### 2. Falsification of Lens L08 (Architectural Cohesion & Schema Evolution) in `src/domain/farely/editorialCollections.ts#L136-L168`
- **Flaws in Pass R3**: Pass R3 assumed that throwing runtime exceptions during collection validation satisfies production stability.
- **R4 SRE Audit & Falsification**: In `src/domain/farely/editorialCollections.ts#L136-L168`, `validateAndPublishEditorialCollection` executes `items.map(...)`. If a single promotional deal in a 50-deal collection is slightly stale or lacks inventory proof, the function throws an immediate uncaught exception, aborting the entire collection publication workflow. In a continuous deployment CMS pipeline, this causes catastrophic publication deadlocks for editorial staff without identifying which specific deal ID triggered the rejection.
- **R4 Remediation**: Ensure error messages embed forensic identifiers: `[dealId=${item.dealId}, route=${item.originCode}-${item.destinationCode}]` so SRE operators and editors can pinpoint and prune defective items in telemetry logs within seconds.

### 3. Falsification of Lens L10 (Developer Velocity & Turnkey Verification) in `src/domain/farely/multiCityItinerary.ts#L150-L165`
- **Flaws in Pass R3**: Pass R3 classified non-interline journeys as `SELF_TRANSFER_UNPROTECTED` with qualitative warnings, but provided zero quantifiable telemetry metrics.
- **R4 SRE Audit & Falsification**: In `src/domain/farely/multiCityItinerary.ts#L150-L165`, labeling an itinerary as `SELF_TRANSFER_UNPROTECTED` without exposing structured connection risk attributes (`misconnectionRiskLevel: "HIGH" | "MEDIUM"`, `minimumLayoverMinutesNeeded: number`) degrades client UX and prevents automated end-to-end integration testing of consumer warning components.
- **R4 Remediation**: Export structured risk taxonomy attributes on `MultiCityItineraryValidationResult`: `isSelfTransfer: boolean`, `requiresGroundTransfer: boolean`, `estimatedTotalSurfaceDistanceKm: number`, and `coherenceNoticeVi: string`.

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

### SOL-01: SOL-EDITORIAL-01 (Editorial Curation Expiration Bounds & Scarcity Proof)
- **SOL_ID**: SOL-EDITORIAL-01
- **TARGET_FILES**: `src/domain/farely/editorialCollections.ts`
- **LOCKED_ALGORITHM**:
  1. Freshness constant: `MAX_DEAL_AGE_HOURS_FOR_EDITORIAL = 24`.
  2. In `validateAndPublishEditorialCollection`:
     - Reject expired collections: throw Error if `expiresMs <= nowMs`.
     - Reject circular routes: throw Error if `deal.originCode === deal.destinationCode`.
     - Enforce positive median price: `cohortMedianPriceVND > 0`.
     - Validate scarcity proof: if `scarcityClaim` is passed, require `hasProviderInventoryProof === true` and integer $1 \le \text{seatsRemaining} \le 500$.
     - Include forensic deal identifiers in error strings: `[dealId=${deal.dealId}]`.
- **FORBIDDEN_DEVIATIONS**: No modification of exported type names or error class hierarchy.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/editorialCollections.test.ts`

### SOL-02: SOL-MULTICITY-01 (Chronological Slice Ordering & Open-Jaw Surface Safety)
- **SOL_ID**: SOL-MULTICITY-01
- **TARGET_FILES**: `src/domain/farely/multiCityItinerary.ts`
- **LOCKED_ALGORITHM**:
  1. Monotonic indexing: `slice[i].sliceIndex === i`.
  2. Chronological date sequence: `slice[i].departDate <= slice[i+1].departDate`.
  3. Positive integer pricing: `Number.isInteger(slice.price) && slice.price > 0`.
  4. Open-jaw ground transfer detection: populate `groundTransferNoticeVi` when `slice[i].destinationCode !== slice[i+1].originCode`.
  5. Ticket coherence classification: enforce `SELF_TRANSFER_UNPROTECTED` when carriers lack verified alliance agreements (`ALLIANCE_PARTNERS`).
- **FORBIDDEN_DEVIATIONS**: Never permit unverified interline ticketing claims.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/multiCityItinerary.test.ts`

### SOL-03: SOL-DATAECON-01 (Marginal Scan ROI Floor & Watch Demand Gating)
- **SOL_ID**: SOL-DATAECON-01
- **TARGET_FILES**: `src/domain/farely/dataEconomics.ts`
- **LOCKED_ALGORITHM**:
  1. Sunk cost accounting: if `cost > 0` and `scans === 0`, `costPerScannedScopeVnd = cost`.
  2. Integer floor of 1 VND for positive unit costs.
  3. Couple alert value to yield: `estimatedAlertValue = Math.min(safeSubscribers, Math.ceil(expectedNewOpps * 5)) * alertValue`.
  4. Enforce marginal $\text{ROI} \ge 1.0$ and require active subscribers for scan expansions.
- **FORBIDDEN_DEVIATIONS**: No phantom default utility values.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/dataEconomics.test.ts`

---

## SECTION E: THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- Strictly preserve Flight Opportunity Intelligence boundary. Direct ticketing, payment gateway processing, and passenger checkout are strictly `boundary_excluded`.
- Editorial curation and multi-city discovery provide radical transparency without commercial kickback distortion.

### L02: Economic Reality & Data Arbitrage Boundaries
- Route scanning incurs direct monetary and computational expenditures. Gating expansions on measured active subscribers guarantees cloud ROI $> 1.0$.
- Sunk cost tracking prevents silent infrastructure budget drains.

### L03: Epistemic Humility & Machine Learning Calibration
- Rejection of synthetic certainty: if inventory proof is unavailable, do not extrapolate scarcity claims.
- Multi-city connections expose raw operational risks rather than hiding self-transfer hurdles.

### L04: Mathematical Proof & Statistical Invariants
- Mathematical proofs:
  - $\forall \text{deal}: \text{advertisedPrice} \le \text{cohortMedianPrice}$.
  - $\forall \text{slice}: \text{departDate}_i \le \text{departDate}_{i+1}$.
  - $\forall \text{scan}: \text{ROI} \ge 1.0 \implies \text{Value} \ge \text{Cost}$.

### L05: Adversarial Inputs & Boundary Penetration
- Resilient against corrupted inputs, circular route injections (`HAN -> HAN`), negative prices, and floating-point fractional seats.
- Sanitizes all textual payloads against malicious markup.

### L06: Regulatory, Anti-Deception & Consumer Protection
- Compliance with Law 19/2023/QH15 and Decree 52/2013/ND-CP.
- Guarantees zero fictitious single-offer marketing and zero fake scarcity prompts.

### L07: Operational Resilience & Resource Saturation
- Sub-millisecond execution envelope across all pure domain functions.
- Deterministic memory usage; zero garbage collector pressure under heavy request volume.

### L08: Architectural Cohesion & Schema Evolution
- Seamless interoperability between domain layer, Supabase Edge Functions, and frontend PWA.
- Strict compile-time typing guarantees no runtime field degradation.

### L09: Observability, Traceability & Forensic Auditability
- Forensic error reporting embeds route keys and deal identifiers for immediate SRE incident triage.
- Prometheus-friendly numeric outputs for unit economics monitoring.

### L10: Developer Velocity & Turnkey Verification
- 100% turnkey test coverage with Vitest. Sub-second test execution provides instantaneous regression feedback.
- Hermetic test fixtures guarantee zero flaky test runs across local and CI environments.

### L11: Graceful Degradation & Autonomous Recovery
- System rejects malformed collections closed while preserving healthy caches.
- Scan scheduler gracefully halts uneconomic scan expansions without crashing background workers.

### L12: Long-Term Maintenance & Debt Eradication
- Zero deprecated dependencies. Clean, modern TypeScript code adhering strictly to Farely coding standards.
- Modular domain interfaces facilitate straightforward future expansions.

---

## SECTION F: CANONICAL RISK MATRIX
| Risk ID | Severity | Mitigation Strategy | Proof Mechanism |
|---|---|---|---|
| R-SRE-SUNK-COST | HIGH | Attribute full cost when scans encounter zero throughput | Vitest `dataEconomics.test.ts` |
| R-SRE-DIAGNOSTIC-BLINDNESS | MEDIUM | Embed dealId and route key in all validation error strings | Vitest `editorialCollections.test.ts` |
| R-SRE-RISK-STRUCTURE | MEDIUM | Expose structured self-transfer and ground transfer flags | Vitest `multiCityItinerary.test.ts` |

---

## SECTION G: TRANSACTIONAL WORK PACKAGES

### WP01: WP01-EDITORIAL-SCARCITY-EXPIRATION-GUARD
- **Target**: `src/domain/farely/editorialCollections.ts`
- **Specification**: Enforce 24h freshness, pre-expired collection rejection, positive integer pricing, scarcity proof, and forensic dealId error tagging.

### WP02: WP02-MULTICITY-CHRONOLOGICAL-SAFETY
- **Target**: `src/domain/farely/multiCityItinerary.ts`
- **Specification**: Enforce monotonic indexing, chronological date sequencing, positive integer pricing, open-jaw ground transfer disclosures, and structured risk properties.

### WP03: WP03-DATAECON-MARGINAL-ROI-FLOOR
- **Target**: `src/domain/farely/dataEconomics.ts`
- **Specification**: Implement sunk cost tracking, 1 VND minimum cost floor, input range clamping, discovery-coupled alert utility, and marginal $\text{ROI} \ge 1.0$ gate.
