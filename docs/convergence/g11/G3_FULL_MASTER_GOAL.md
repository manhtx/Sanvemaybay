# FARELY PROJECT 10X — MASTER GOAL G11 [G3]
# CYCLE: G87
# LEVEL: Pass 3: Hostile Boundary & Negative Vector Hardening
# MANDATE: Enforce hostile boundary conditions and negative vector penetration defenses across all 12 Adversarial Lenses for Cycle G87. Actively audit and falsify lenses L05 (Adversarial Inputs), L07 (Operational Resilience), and L11 (Graceful Degradation) with concrete code citations and edge exploit scenarios.
# GIT_COMMIT: 49917580f95ef93e3333b2a6977ef46c873fd22e
# TIMESTAMP: 2026-10-27T09:26:00.000Z
# EXECUTION_RECEIPT_SHA256: 4f4f8e68c913492e1fadb7df28e3fc3b5d7afd6562122c5cc320270bafec91f0

---

## SECTION A: ADVERSARIAL FALSIFICATION & AUDIT OF PASS G2

Pass G2 introduced necessary input bounds and case-normalization logic. However, Pass G2 failed to fortify the executor cage against adversarial payload injections, asynchronous state races, and silent degradation. Pass G3 executes hostile boundary falsification across three critical lenses:

### 1. Falsification of Lens L05 (Adversarial Inputs & Boundary Penetration) in `src/domain/farely/editorialCollections.ts#L110-L130`
- **Flaws in Pass G2**: Pass G2 validated curator role and dealId strings but permitted negative advertised prices and floating-point fractional seat counts.
- **G3 Hostile Falsification**: In `src/domain/farely/editorialCollections.ts#L110-L130`, if an attacker inputs `advertisedPriceVND = -1000` or `scarcityClaim.seatsRemaining = 2.7`, standard comparisons may evaluate true while downstream financial summaries yield negative revenue or fractional passenger seat bookings.
- **G3 Corrective Invariant**: Enforce strict currency integers: `Number.isInteger(item.advertisedPriceVND) && item.advertisedPriceVND > 0`. For scarcity seats: `Number.isInteger(item.scarcityClaim.seatsRemaining) && item.scarcityClaim.seatsRemaining >= 1 && item.scarcityClaim.seatsRemaining <= 500`.

### 2. Falsification of Lens L07 (Operational Resilience & Resource Saturation) in `src/domain/farely/multiCityItinerary.ts#L125-L145`
- **Flaws in Pass G2**: Pass G2 checked chronological ordering of dates but failed to protect against massive slice array DOS attacks.
- **G3 Hostile Falsification**: In `src/domain/farely/multiCityItinerary.ts#L125-L145`, an adversary submitting an itinerary with 50,000 slices would trigger severe CPU saturation and potential call-stack overflow during combinatorial transfer analysis.
- **G3 Corrective Invariant**: Enforce hard structural array bounds: `if (!Array.isArray(slices) || slices.length < 2 || slices.length > 10) throw new Error("Itinerary slices count must be between 2 and 10.");`.

### 3. Falsification of Lens L11 (Graceful Degradation & Autonomous Recovery) in `src/domain/farely/dataEconomics.ts#L145-L165`
- **Flaws in Pass G2**: Pass G2 clamped yield percentage but left `estimatedCostPerScopeVnd` unconstrained against negative float poisoning.
- **G3 Hostile Falsification**: In `src/domain/farely/dataEconomics.ts#L145-L165`, supplying `estimatedCostPerScopeVnd = -5000` bypasses cost checks, producing negative marginal costs and artificially inflating ROI calculations to deceive automated scan approvals.
- **G3 Corrective Invariant**: Mandate `safeCostPerScope = Math.max(0, proposal.estimatedCostPerScopeVnd || 0)`. If `safeCostPerScope <= 0` or `safeScopes <= 0`, immediately return `REJECTED_UNECONOMIC`.

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
  1. Enforce 24-hour editorial freshness ceiling: set `MAX_DEAL_AGE_HOURS_FOR_EDITORIAL = 24`.
  2. In `validateAndPublishEditorialCollection`:
     - Reject expired collections: throw Error if `expiresMs <= nowMs`.
     - Reject circular routes: throw Error if `deal.originCode === deal.destinationCode`.
     - Enforce positive median price: throw Error if `cohortMedianPriceVND <= 0`.
     - Validate scarcity proof: if `scarcityClaim` is passed, require `hasProviderInventoryProof === true`, trimmed `claimTextVi.length >= 3`, and integer $1 \le \text{seatsRemaining} \le 500$.
     - Verify curator credentials: trimmed `role.length >= 3` and valid `signedAt`.
     - Embed forensic deal identifiers in error strings: `[dealId=${deal.dealId}]`.
- **FORBIDDEN_DEVIATIONS**: No modification of exported type names or error class hierarchy.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/editorialCollections.test.ts`

### SOL-02: SOL-MULTICITY-01 (Chronological Slice Ordering & Open-Jaw Surface Safety)
- **SOL_ID**: SOL-MULTICITY-01
- **TARGET_FILES**: `src/domain/farely/multiCityItinerary.ts`
- **LOCKED_ALGORITHM**:
  1. Validate slice bounds: $2 \le N \le 10$.
  2. Monotonic slice indexing: `slice[i].sliceIndex === i`.
  3. Positive integer prices: `Number.isInteger(slice.price) && slice.price > 0`.
  4. Chronological date sequence: `slice[i].departDate <= slice[i+1].departDate`.
  5. Open-jaw surface detection: if `slice[i].destinationCode !== slice[i+1].originCode`, flag `hasOpenJawSurfaceSegment = true` and populate `groundTransferNoticeVi`.
  6. Ticket coherence classification: enforce `SELF_TRANSFER_UNPROTECTED` when carriers lack verified alliance agreements (`ALLIANCE_PARTNERS`).
- **FORBIDDEN_DEVIATIONS**: Never allow unverified interline ticketing claims.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/multiCityItinerary.test.ts`

### SOL-03: SOL-DATAECON-01 (Marginal Scan ROI Floor & Watch Demand Gating)
- **SOL_ID**: SOL-DATAECON-01
- **TARGET_FILES**: `src/domain/farely/dataEconomics.ts`
- **LOCKED_ALGORITHM**:
  1. Unit cost accounting: if `cost > 0` and `scans === 0`, `costPerScannedScopeVnd = cost`.
  2. Enforce 1 VND integer minimum floor on positive unit costs.
  3. Bound input parameters: clamp `historicalOpportunityYieldPercent` to $[0, 100]$, clamp `additionalScopesCount` to $[1, 10000]$.
  4. Couple alert value to yield: `estimatedAlertValue = Math.min(safeSubscribers, Math.ceil(expectedNewOpps * 5)) * alertValue`.
  5. Enforce marginal $\text{ROI} \ge 1.0$ and require active subscribers for scan expansions.
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
| R-EDITORIAL-CANONICAL | HIGH | 24h freshness, curator role validation, scarcity inventory proof | Vitest `editorialCollections.test.ts` |
| R-MULTICITY-CANONICAL | HIGH | Monotonic chronological ordering, open-jaw ground transfer notice | Vitest `multiCityItinerary.test.ts` |
| R-DATAECON-CANONICAL | MEDIUM | Sunk cost tracking, discovery-coupled alert utility, ROI >= 1.0 gate | Vitest `dataEconomics.test.ts` |

---

## SECTION G: TRANSACTIONAL WORK PACKAGES

### WP01: WP01-EDITORIAL-SCARCITY-EXPIRATION-GUARD
- **Target**: `src/domain/farely/editorialCollections.ts`
- **Specification**: Implement 24h freshness, pre-expired collection rejection, positive integer pricing, scarcity proof, curator role validation, and forensic dealId error tagging.

### WP02: WP02-MULTICITY-CHRONOLOGICAL-SAFETY
- **Target**: `src/domain/farely/multiCityItinerary.ts`
- **Specification**: Implement monotonic indexing, chronological date sequencing, positive integer pricing, open-jaw ground transfer disclosures, and structured risk properties.

### WP03: WP03-DATAECON-MARGINAL-ROI-FLOOR
- **Target**: `src/domain/farely/dataEconomics.ts`
- **Specification**: Implement sunk cost tracking, 1 VND minimum cost floor, input range clamping, discovery-coupled alert utility, and marginal $\text{ROI} \ge 1.0$ gate.
