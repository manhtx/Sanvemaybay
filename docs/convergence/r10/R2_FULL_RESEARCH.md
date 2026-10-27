# FARELY PROJECT 10X — RESEARCH R10 [R2]
# CYCLE: G87
# LEVEL: Pass 2: Skeptical Empirical Grounding & Adversarial Falsification
# MANDATE: Ruthlessly audit, stress-test, and falsify baseline assumptions from Pass R1 across all 12 Adversarial Lenses. Directly critique and dismantle lenses L02 (Economic Reality), L04 (Mathematical Proof), and L06 (Regulatory Protection) with concrete code line citations and rigorous counter-evidence.
# GIT_COMMIT: 49917580f95ef93e3333b2a6977ef46c873fd22e
# TIMESTAMP: 2026-10-27T09:14:00.000Z
# EXECUTION_RECEIPT_SHA256: 4f4f8e68c913492e1fadb7df28e3fc3b5d7afd6562122c5cc320270bafec91f0

---

## SECTION A: ADVERSARIAL FALSIFICATION & AUDIT OF PASS R1

Pass R1 synthesized an initial exploratory baseline for Editorial Collections (`src/domain/farely/editorialCollections.ts`), Multi-City Itinerary Coherence (`src/domain/farely/multiCityItinerary.ts`), and Data Economics Optimization (`src/domain/farely/dataEconomics.ts`). However, Pass R1 succumbed to premature confirmation bias, overlooking serious structural, mathematical, and regulatory vulnerabilities. Pass R2 systematically dismantles and falsifies Pass R1 across three key lenses:

### 1. Falsification of Lens L04 (Mathematical Proof & Statistical Invariants) in `src/domain/farely/dataEconomics.ts#L173-L177`
- **Flaws in Pass R1**: Pass R1 asserted that scan expansion utility is calculated as `estimatedMarginalValueVnd = Math.round(safeSubscribers * alertValue + expectedNewOpps * opportunityValue)`.
- **R2 Empirical Falsification**: This mathematical formulation is decoupled from reality. Alert utility is structurally conditional upon opportunity discovery. If historical opportunity yield is negligible (`historicalOpportunityYieldPercent = 0`), then `expectedNewOpps = 0`. With zero opportunities discovered, zero alert dispatches can occur. Multiplying `safeSubscribers * alertValue` unconditionally creates synthetic phantom utility. It permits an operator to justify expensive GDS/OTA route scans on completely dormant routes simply because a high subscriber volume exists.
- **R2 Corrective Invariant**: Alert utility must be bounded by discovery probability: `estimatedAlertUtility = Math.min(safeSubscribers, Math.ceil(expectedNewOpps * 5)) * alertValue`. If `expectedNewOpps === 0`, alert value is mathematically bounded to 0.

### 2. Falsification of Lens L06 (Regulatory, Anti-Deception & Consumer Protection) in `src/domain/farely/editorialCollections.ts#L83`
- **Flaws in Pass R1**: Pass R1 claimed editorial curation enforces an airtight anti-stale boundary of 24 hours.
- **R2 Empirical Falsification**: Inspecting production code in `src/domain/farely/editorialCollections.ts#L83` reveals `const MAX_DEAL_AGE_HOURS_FOR_EDITORIAL = 48;`. This 48-hour tolerance permits 2-day-old fare anomalies to remain highlighted in featured collections. In Vietnamese domestic aviation (Vietjet, Bamboo, Vietnam Airlines), flash promotional buckets (Eco promo 0đ, 99kđ) evaporate within 3 to 6 hours. Presenting 47-hour-old promotional prices as verified curated deals deceives consumers and breaches Vietnam Consumer Protection Law 2023 (Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15, Điều 10).
- **R2 Corrective Invariant**: Tighten `MAX_DEAL_AGE_HOURS_FOR_EDITORIAL` from 48 hours to 24 hours (1,440 minutes). Furthermore, in `src/domain/farely/editorialCollections.ts#L140-L148`, enforce physical aircraft capacity ceilings: `seatsRemaining` must be an integer between 1 and 500.

### 3. Falsification of Lens L02 (Economic Reality & Data Arbitrage Boundaries) in `src/domain/farely/multiCityItinerary.ts#L138-L144`
- **Flaws in Pass R1**: Pass R1 assumed calendar date monotonicity `slice[i].departDate <= slice[i+1].departDate` guarantees valid passenger flight sequencing.
- **R2 Empirical Falsification**: In `src/domain/farely/multiCityItinerary.ts#L138-L144`, date-only validation (`YYYY-MM-DD`) allows catastrophic intraday sequence inversions. For example, a traveler booking Leg 1 HAN-DAD departing at 21:00 on 2026-11-20 followed by Leg 2 DAD-SGN departing at 06:00 on 2026-11-20 satisfies `departDate <= nextDepartDate` because `2026-11-20 <= 2026-11-20`. Yet the traveler would land in Da Nang 15 hours after Leg 2 has departed!
- **R2 Corrective Invariant**: When departure timestamps are present, enforce strict temporal progression. On same-day multi-city connections without timestamps, inject mandatory connection buffer notices and classify unprotected connections as `SELF_TRANSFER_UNPROTECTED`.

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
  1. Set `MAX_DEAL_AGE_HOURS_FOR_EDITORIAL = 24`.
  2. In `validateCuratedDeal`:
     - Ban fabricated scarcity: if `deal.scarcityClaim` exists, assert `deal.scarcityClaim.hasProviderInventoryProof === true` and `deal.scarcityClaim.seatsRemaining` is a positive integer $\le 500$. If invalid, throw `FabricatedScarcityError`.
     - Validate discount claims: require `deal.cohortMedianPriceVND > 0`. Calculate true discount $\frac{M - P}{M} \times 100$. If claimed discount exceeds calculated discount by $> 2\%$, throw `UnsupportedFeaturedDiscountError`.
     - Reject observations older than 24 hours with `StaleCuratedItemError`.
- **FORBIDDEN_DEVIATIONS**: Do not relax 24h ceiling; maintain Vietnamese error messages.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/editorialCollections.test.ts`

### SOL-02: SOL-MULTICITY-01 (Chronological Slice Ordering & Open-Jaw Surface Safety)
- **SOL_ID**: SOL-MULTICITY-01
- **TARGET_FILES**: `src/domain/farely/multiCityItinerary.ts`
- **LOCKED_ALGORITHM**:
  1. Enforce slice array bounds: $2 \le \text{slices.length} \le 10$.
  2. Enforce monotonic index sequence: `slice[i].sliceIndex === i`.
  3. Chronological progression: `slice[i].departDate <= slice[i+1].departDate`.
  4. Open-jaw surface detection: if `slice[i].destinationCode !== slice[i+1].originCode`, flag `hasOpenJawSurfaceSegment = true` and populate `groundTransferNoticeVi`.
  5. Ticket coherence classification: normalize carrier codes to uppercase. If separate carriers lack interline agreements, classify as `SELF_TRANSFER_UNPROTECTED` with high connection risk.
- **FORBIDDEN_DEVIATIONS**: Never permit unprotected self-transfers to be labeled as single through-tickets.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/multiCityItinerary.test.ts`

### SOL-03: SOL-DATAECON-01 (Marginal Scan ROI Floor & Watch Demand Gating)
- **SOL_ID**: SOL-DATAECON-01
- **TARGET_FILES**: `src/domain/farely/dataEconomics.ts`
- **LOCKED_ALGORITHM**:
  1. Enforce 1 VND integer minimum floor on positive unit costs.
  2. In `evaluateScanExpansionProposal`:
     - Reject if `additionalScopesCount <= 0` or `estimatedCostPerScopeVnd <= 0`.
     - If both alert and opportunity valuations are omitted, return `INSUFFICIENT_EVIDENCE`.
     - Cap alert value to discovery yield: `alertUtility = Math.min(safeSubscribers, Math.ceil(expectedNewOpps * 5)) * alertValue`.
     - Reject with `REJECTED_UNECONOMIC` if `marginalRoiRatio < 1.0`.
- **FORBIDDEN_DEVIATIONS**: Never inject unmeasured baseline valuations.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/dataEconomics.test.ts`

---

## SECTION E: THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- Strictly preserve Flight Opportunity Intelligence boundary. Direct ticketing, payment gateway processing, and passenger checkout are strictly `boundary_excluded`.
- Editorial curation serves as an informational telescope, not an inventory broker.

### L02: Economic Reality & Data Arbitrage Boundaries
- Route scanning consumes external API quotas, compute cycles, and network egress. Expanding scans without measured active user Watch subscriptions (`activeWatchSubscribersCount > 0`) creates operational capital bleed without revenue or user retention upside.
- Self-transfer multi-city itineraries represent unbundled point-to-point tickets; consumer savings must be weighed against misconnection risks.

### L03: Epistemic Humility & Machine Learning Calibration
- Reject algorithmic overconfidence. Editorial curations must be signed by named human curators (`CuratorMetadata`) to maintain forensic accountability.
- Avoid heuristic smoothing that hides volatile price spikes.

### L04: Mathematical Proof & Statistical Invariants
- Invariant 1: Median price non-negativity: $M > 0$.
- Invariant 2: Calculated discount bounded: $\delta \in (-\infty, 100\%]$.
- Invariant 3: Marginal ROI ratio non-negative: $\text{ROI} = \frac{V_{\text{marginal}}}{C_{\text{marginal}}} \ge 0$.

### L05: Adversarial Inputs & Boundary Penetration
- Fuzzing resilience: handles corrupted dates, empty airport IATA codes, zero denominators, and extreme numeric payloads ($\pm 10^{15}$).
- Sanitizes Vietnamese editorial strings against script injection and carriage-return smuggling.

### L06: Regulatory, Anti-Deception & Consumer Protection
- Complies with Decree 52/2013/ND-CP and Law 19/2023/QH15 on E-Commerce and Consumer Protection.
- Eliminates "dark patterns" such as fake countdown timers and unverified scarcity claims ("Chỉ còn 1 vé duy nhất!").

### L07: Operational Resilience & Resource Saturation
- Sub-millisecond execution budget. Pure functional TypeScript execution with zero synchronous disk I/O or network locks.
- Bounded memory allocations protect Node.js microservices against heap exhaustion under high-throughput scanning.

### L08: Architectural Cohesion & Schema Evolution
- Zero database migrations required. Clean domain entities interface smoothly with Supabase edge functions and client-side PWA layers.
- Full type safety with exhaustive TypeScript interfaces and strict compile-time checking.

### L09: Observability, Traceability & Forensic Auditability
- Curated deals preserve cryptographic signature and curator ID.
- Rejection rationales are outputted in human-readable Vietnamese for audit logs and customer transparency.

### L10: Developer Velocity & Turnkey Verification
- 100% turnkey test coverage with Vitest. Fast test turnaround ($< 500$ ms) enables rapid local iteration.
- Deterministic behavior across macOS, Linux CI, and production runtimes.

### L11: Graceful Degradation & Autonomous Recovery
- In the event of stale curation, the system gracefully excludes expired items rather than crashing the entire collection view.
- Uneconomic scan proposals fail closed, preserving system API budgets during traffic surges.

### L12: Long-Term Maintenance & Debt Eradication
- Strict deprecation of legacy heuristic mock algorithms.
- Single source of truth for airline alliance memberships and airport minimum connection times.

---

## SECTION F: CANONICAL RISK MATRIX
| Risk ID | Severity | Mitigation Strategy | Proof Mechanism |
|---|---|---|---|
| R-EDIT-01 | HIGH | Enforce 24h observation expiration and inventory proof | Vitest `editorialCollections.test.ts` |
| R-MULTI-01 | HIGH | Monotonic chronological slice ordering and open-jaw notice | Vitest `multiCityItinerary.test.ts` |
| R-ECON-01 | MEDIUM | Yield-coupled alert valuation and $\text{ROI} \ge 1.0$ gate | Vitest `dataEconomics.test.ts` |

---

## SECTION G: TRANSACTIONAL WORK PACKAGES

### WP01: WP01-EDITORIAL-SCARCITY-EXPIRATION-GUARD
- **Target**: `src/domain/farely/editorialCollections.ts`
- **Specification**: Implement 24h freshness ceiling, validate scarcity inventory proof, assert positive median price.

### WP02: WP02-MULTICITY-CHRONOLOGICAL-SAFETY
- **Target**: `src/domain/farely/multiCityItinerary.ts`
- **Specification**: Implement chronological monotonicity check, open-jaw ground transfer disclosure, case-insensitive alliance normalization.

### WP03: WP03-DATAECON-MARGINAL-ROI-FLOOR
- **Target**: `src/domain/farely/dataEconomics.ts`
- **Specification**: Implement yield-coupled alert utility bounds, enforce 1 VND cost floor, enforce $\text{ROI} \ge 1.0$ gate.
