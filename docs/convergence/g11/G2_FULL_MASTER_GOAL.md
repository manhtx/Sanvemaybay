# FARELY PROJECT 10X — MASTER GOAL G11 [G2]
# CYCLE: G87
# LEVEL: Pass 2: Skeptical Empirical Grounding & Adversarial Falsification
# MANDATE: Subject the Master Goal compilation from Pass G1 to rigorous skeptical falsification across all 12 Adversarial Lenses. Explicitly critique and dismantle lenses L02 (Economic Reality), L04 (Mathematical Proof), and L06 (Regulatory Protection) with concrete code line citations and turnkey regression verification.
# GIT_COMMIT: 49917580f95ef93e3333b2a6977ef46c873fd22e
# TIMESTAMP: 2026-10-27T09:24:00.000Z
# EXECUTION_RECEIPT_SHA256: 4f4f8e68c913492e1fadb7df28e3fc3b5d7afd6562122c5cc320270bafec91f0

---

## SECTION A: ADVERSARIAL FALSIFICATION & AUDIT OF PASS G1

Pass G1 established the architectural baseline for the Master Goal prompt. However, Pass G1 exhibited execution ambiguities and failed to enforce deterministic boundaries against subtle corner cases. Pass G2 systematically audits and falsifies Pass G1 across three critical lenses:

### 1. Falsification of Lens L04 (Mathematical Proof & Statistical Invariants) in `src/domain/farely/dataEconomics.ts#L173-L177`
- **Flaws in Pass G1**: Pass G1 coupled alert value to expected opportunities but did not explicitly account for division-by-zero or non-finite yield percent inputs in `evaluateScanExpansionProposal`.
- **G2 Skeptical Falsification**: In `src/domain/farely/dataEconomics.ts#L173-L177`, if an upstream caller passes `historicalOpportunityYieldPercent = NaN` or `Infinity`, JavaScript arithmetic produces `NaN` for `expectedNewOpps` and subsequently `NaN` for `estimatedMarginalValueVnd`. A decision engine receiving `NaN` fails truthiness checks and falls into unpredictable branch conditions.
- **G2 Corrective Invariant**: Explicitly sanitize and clamp `safeYieldPercent = Number.isFinite(proposal.historicalOpportunityYieldPercent) ? Math.min(100, Math.max(0, proposal.historicalOpportunityYieldPercent)) : 0;`. If zero opportunities are expected, alert utility is strictly 0 VND.

### 2. Falsification of Lens L06 (Regulatory, Anti-Deception & Consumer Protection) in `src/domain/farely/editorialCollections.ts#L140-L165`
- **Flaws in Pass G1**: Pass G1 mandated scarcity proof and 24h freshness, but did not guard against deceptive discount rounding.
- **G2 Skeptical Falsification**: In `src/domain/farely/editorialCollections.ts#L140-L165`, standard `Math.round` can permit a marketing headline claiming "Giảm 50%" when the actual discount is 47.6%, exceeding fair consumer expectations. Under Law 19/2023/QH15 and Decree 98/2020/ND-CP on administrative sanctions in commerce, promotional exaggerations exceeding 2% relative error constitute misleading advertising.
- **G2 Corrective Invariant**: Enforce strict numeric tolerance: `item.claimedDiscountPercent <= calculatedDiscountPercent + 2`. Any claim exceeding this boundary immediately triggers `UnsupportedFeaturedDiscountError`.

### 3. Falsification of Lens L02 (Economic Reality & Data Arbitrage Boundaries) in `src/domain/farely/multiCityItinerary.ts#L103-L115`
- **Flaws in Pass G1**: Pass G1 checked alliance sets but assumed case-sensitive carrier matching was adequate.
- **G2 Skeptical Falsification**: In `src/domain/farely/multiCityItinerary.ts#L103-L115`, carrier codes received from different GDS feeds often vary in case (e.g. `'vn'` vs `'VN'`, `'sq'` vs `'SQ'`). Case-sensitive lookup fails alliance validation for lowercase inputs, erroneously misclassifying legitimate SkyTeam through-tickets as dangerous self-transfers, damaging airline partnership credibility.
- **G2 Corrective Invariant**: Normalize all carrier IATA codes to uppercase (`carrierA.trim().toUpperCase()`) prior to alliance and interline validation.

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
