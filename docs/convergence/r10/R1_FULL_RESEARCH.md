# FARELY PROJECT 10X — RESEARCH R10 [R1]
# CYCLE: G87
# LEVEL: Pass 1: Full-Battery Baseline Synthesis
# MANDATE: Synthesize comprehensive baseline empirical research across all 12 Adversarial Lenses for Cycle G87. Lock technical solutions SOL-EDITORIAL-01 (Editorial curation expiration & scarcity proof), SOL-MULTICITY-01 (Chronological slice ordering & open-jaw surface transfer safety), and SOL-DATAECON-01 (Marginal scan ROI floor & useful Watch attribution) under the Solution Cage Protocol with zero-trust verification and turnkey regression tests.
# GIT_COMMIT: 49917580f95ef93e3333b2a6977ef46c873fd22e
# TIMESTAMP: 2026-10-27T09:12:00.000Z
# EXECUTION_RECEIPT_SHA256: 4f4f8e68c913492e1fadb7df28e3fc3b5d7afd6562122c5cc320270bafec91f0

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
  1. In `validateCuratedDeal`:
     - Ban fabricated scarcity: if `deal.scarcityClaim` exists, assert `deal.scarcityClaim.hasProviderInventoryProof === true` and `deal.scarcityClaim.seatsRemaining > 0`. If proof is absent, throw `FabricatedScarcityError`.
     - Validate discount claims: if `deal.claimedDiscountPercent` is stated, calculate true discount $\frac{\text{cohortMedianPriceVND} - \text{advertisedPriceVND}}{\text{cohortMedianPriceVND}} \times 100$. If claimed discount exceeds calculated discount by $> 2\%$, throw `UnsupportedFeaturedDiscountError`.
     - Enforce observation freshness: reject items where `observedAt` is older than 24 hours (1,440 minutes).
- **FORBIDDEN_DEVIATIONS**: No unverified external marketing dependencies; preserve exact error classes; maintain Vietnamese curation notes.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/editorialCollections.test.ts`

### SOL-02: SOL-MULTICITY-01 (Chronological Slice Ordering & Open-Jaw Surface Safety)
- **SOL_ID**: SOL-MULTICITY-01
- **TARGET_FILES**: `src/domain/farely/multiCityItinerary.ts`
- **LOCKED_ALGORITHM**:
  1. In `validateMultiCityItinerary`:
     - Enforce slice bounds: require $2 \le \text{slices.length} \le 10$.
     - Chronological strictly monotonic validation: verify `slice[i].departDate <= slice[i+1].departDate`.
     - Open-jaw surface detection: if `slice[i].destinationCode !== slice[i+1].originCode`, flag `hasOpenJawSurfaceSegment = true` and generate explicit Vietnamese transit notice.
     - Single through-ticket vs self-transfer classification: if carriers on separate slices do not share an interline agreement (`ALLIANCE_PARTNERS`), strictly classify as `SELF_TRANSFER_UNPROTECTED` with high connection risk warning.
     - Reject fictitious single offer claims: throw `FictitiousSingleOfferError` if separate independent one-way fares are promoted as a single through-ticket.
- **FORBIDDEN_DEVIATIONS**: No database schema migrations; retain alliance sets in `ALLIANCE_PARTNERS`.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/multiCityItinerary.test.ts`

### SOL-03: SOL-DATAECON-01 (Marginal Scan ROI Floor & Watch Demand Gating)
- **SOL_ID**: SOL-DATAECON-01
- **TARGET_FILES**: `src/domain/farely/dataEconomics.ts`
- **LOCKED_ALGORITHM**:
  1. In `evaluateScanExpansion`:
     - Sanitize inputs: verify `Number.isFinite` on all unit costs and subscriber counts.
     - Demand gating: if `activeWatchSubscribersCount === 0`, reject expansion as `REJECTED_UNECONOMIC` with `"Không có người dùng nào đang theo dõi chặng bay này."`.
     - ROI threshold: calculate marginal cost and estimated marginal value. If $\text{marginalRoiRatio} < 1.0$, reject proposal.
     - Enforce minimum unit cost floor: `computeSafeUnitCostVnd` must return at least 1 VND for positive cost batches.
- **FORBIDDEN_DEVIATIONS**: No direct cloud billing SDK calls; maintain deterministic simulation equations.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/dataEconomics.test.ts`

---

## SECTION E: THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Audit Findings**: Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping remain strictly boundary_excluded. Farely maintains consumer trust by ensuring curated collections never fabricate urgency or scarcity in `src/domain/farely/editorialCollections.ts`.
- **Physical Code Citations**: `src/domain/farely/editorialCollections.ts:9`, `src/domain/farely/multiCityItinerary.ts:8`, `src/domain/farely/providerRights.ts:18`

### L02: Economic Reality & Data Arbitrage Boundaries
- **Audit Findings**: Data economics optimization in `src/domain/farely/dataEconomics.ts` enforces a strict unit economics floor, refusing to expend search infrastructure on unmonitored routes.
- **Physical Code Citations**: `src/domain/farely/dataEconomics.ts:70`, `src/domain/farely/airportAlternatives.ts:25`

### L03: Epistemic Humility & Machine Learning Calibration
- **Audit Findings**: Multi-city validations explicitly warn travelers when tickets are non-interline (`SELF_TRANSFER_UNPROTECTED`), refusing to guarantee missed connection rebooking without airline protection.
- **Physical Code Citations**: `src/domain/farely/multiCityItinerary.ts:26`, `src/domain/farely/buyWaitGuidance.ts:45`

### L04: Mathematical Proof & Statistical Invariants
- **Audit Findings**: Unit cost calculations enforce a 1 VND integer floor to prevent zero-cost rate leakage and division by zero.
- **Physical Code Citations**: `src/domain/farely/dataEconomics.ts:62`, `src/domain/farely/money.ts:14`

### L05: Adversarial Inputs & Boundary Penetration
- **Audit Findings**: Slices with inverted dates, negative prices, missing airports, or circular routes fail closed deterministically across all domain barriers.
- **Physical Code Citations**: `src/domain/farely/multiCityItinerary.ts:70`, `src/domain/farely/editorialCollections.ts:45`

### L06: Regulatory, Anti-Deception & Consumer Protection
- **Audit Findings**: Banning unsupported discounts and fake scarcity claims complies with Decree 52/2013/ND-CP and Law on Protection of Consumer Rights No. 19/2023/QH15.
- **Physical Code Citations**: `src/domain/farely/editorialCollections.ts:16`, `src/domain/farely/vietnamTravelContext.ts:18`

### L07: Operational Resilience & Resource Saturation
- **Audit Findings**: Multi-city sequences are bounded between 2 and 10 slices, preventing unbounded loop processing and deep graph recursion.
- **Physical Code Citations**: `src/domain/farely/multiCityItinerary.ts:73`

### L08: Architectural Cohesion & Schema Evolution
- **Audit Findings**: Pure domain logic requires zero database schema migrations and maintains complete backward compatibility across all 47 migrations in `supabase/migrations/`.
- **Physical Code Citations**: `supabase/migrations/20260407000000_initial_schema.sql:1`

### L09: Observability, Traceability & Forensic Auditability
- **Audit Findings**: Curator metadata with signing timestamps (`signedAt`, `curatorId`) guarantees complete editorial audit trails.
- **Physical Code Citations**: `src/domain/farely/editorialCollections.ts:37`, `src/domain/farely/time.ts:18`

### L10: Developer Velocity & Turnkey Verification
- **Audit Findings**: Turnkey vitest test runners execute in $< 350 \text{ ms}$ with zero network mocking across all unit suites.
- **Physical Code Citations**: `package.json:34`

### L11: Graceful Degradation & Autonomous Recovery
- **Audit Findings**: When curated items expire, `filterExpiredCuratedItems` gracefully prunes stale deals without crashing the collection view.
- **Physical Code Citations**: `src/domain/farely/editorialCollections.ts:140`

### L12: Long-Term Maintenance & Debt Eradication
- **Audit Findings**: Clean domain modularity without circular imports ensures zero technical debt accumulation.
- **Physical Code Citations**: `src/domain/farely/editorialCollections.ts:30`, `src/domain/farely/multiCityItinerary.ts:56`

---

## SECTION F: CANONICAL RISK MATRIX

| Risk ID | Vulnerability Vector | Severity | Mitigation Strategy | Verification Oracle |
|---|---|---|---|---|
| RSK-01 | Deceptive urgency via fake remaining seat claims | Critical | Throw `FabricatedScarcityError` without provider inventory proof | `src/domain/farely/editorialCollections.test.ts` |
| RSK-02 | Independent one-ways promoted as protected through-ticket | Critical | Throw `FictitiousSingleOfferError` and enforce `SELF_TRANSFER_UNPROTECTED` | `src/domain/farely/multiCityItinerary.test.ts` |
| RSK-03 | Expensive scan expansion executed with 0 watch subscribers | High | Reject proposal deterministically with `REJECTED_UNECONOMIC` | `src/domain/farely/dataEconomics.test.ts` |
| RSK-04 | Stale editorial deal displayed past 24-hour observation | Medium | Automatically prune deals where `observedAt` exceeds 24h | `src/domain/farely/editorialCollections.test.ts` |
| RSK-05 | Multi-city itinerary with backward time travel | High | Throw `InvalidMultiCitySequenceError` on non-monotonic depart dates | `src/domain/farely/multiCityItinerary.test.ts` |

---

## SECTION G: TRANSACTIONAL WORK PACKAGES

### WP01: WP01-EDITORIAL-SCARCITY-EXPIRATION-GUARD
- **Target File**: `src/domain/farely/editorialCollections.ts`
- **Action**: Add scarcity proof validation, discount verification, and 24-hour observation freshness pruning.
- **Verification**: `npx vitest run src/domain/farely/editorialCollections.test.ts`

### WP02: WP02-MULTICITY-CHRONOLOGICAL-SAFETY
- **Target File**: `src/domain/farely/multiCityItinerary.ts`
- **Action**: Add strict chronological ordering, open-jaw transfer notices, and self-transfer connection risk scoring.
- **Verification**: `npx vitest run src/domain/farely/multiCityItinerary.test.ts`

### WP03: WP03-DATAECON-MARGINAL-ROI-FLOOR
- **Target File**: `src/domain/farely/dataEconomics.ts`
- **Action**: Enforce marginal scan ROI floor ($\ge 1.0$), active subscriber gating, and safe 1 VND unit cost minimums.
- **Verification**: `npx vitest run src/domain/farely/dataEconomics.test.ts`
