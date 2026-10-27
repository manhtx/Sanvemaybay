# FARELY PROJECT 10X — MASTER GOAL G11 [G1]
# CYCLE: G82
# LEVEL: Pass 1: Full-Battery Baseline Synthesis
# MANDATE: Full-battery multi-lens synthesis across all 12 Adversarial Lenses for Cycle G82 Master Goal. Mechanically cage 100% of solutions from Research R5 (SOL-GROUP-01, SOL-LANDED-01, SOL-CURATION-01) with zero deviation.
# GIT_COMMIT: c2dbc902929fcf1302a9c30a037015562bac0b7b
# TIMESTAMP: 2026-10-27T03:06:00.000Z
# EXECUTION_RECEIPT_SHA256: eb7c9a630b07323dd5ae49991205923bfce207f4716a3f91232c8ad091f4ea88

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

## SECTION C: BASELINE AUDIT OF RESEARCH R5
Research R5 established three verified solution specifications:
1. `SOL-GROUP-01` (`src/domain/farely/groupFarePlanner.ts`): Sanitizes adult base fare to positive finite integers, enforces $A \ge 1$, validates CAAV infant lap invariant $I \le A$, rounds all passenger subtotals to integer VND, generates explicit Vietnamese party labels, and throws `SingleAdultPricePromotedToFamilyTotalError` if single-adult prices are falsely shown as family totals.
2. `SOL-LANDED-01` (`src/domain/farely/tripBudgetEstimator.ts`): Incorporates airline ancillary surcharges multiplied by segment count (e.g. 350k checked baggage on VJ), enforces non-negative duration bounds ($\le 90$ nights), applies seasonal peak multipliers (1.5x Tet, 1.25x summer), and safe standard transfer tier fallback.
3. `SOL-CURATION-01` (`src/domain/farely/editorialCollections.ts`): Enforces 48-hour item freshness via `validateCuratedItemFreshness`, rejects unproven scarcity claims lacking provider proof via `FabricatedScarcityError`, validates positive cohort median, and enforces $\le 1\%$ discount assertion tolerance.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS

### SOL-01: SOL-GROUP-01 (Group & Family Fare Total Party Cost Allocation)
- **SOL_ID**: SOL-GROUP-01
- **TARGET_FILES**: `src/domain/farely/groupFarePlanner.ts`
- **LOCKED_ALGORITHM**:
  1. In `calculateGroupFare`:
     - Sanitize `baseAdultFarePerPerson` to positive finite numbers (`fare > 0`).
     - Sanitize party counts: $A \ge 1$ (if $A = 0$ and $C > 0$, throw `GroupFareValidationError` with `UNESCORTED_MINORS_NOT_SUPPORTED`).
     - Enforce total passengers $A + C + I \le 9$.
     - Enforce CAAV infant limit $I \le A$ (max 1 lap infant per adult).
     - Calculate child base fare at 75% of adult fare, and infant base fare at 10% (airline-appropriate non-zero base).
     - Enforce mandatory passenger facility fees (120k adult, 60k child, 0 infant per segment).
     - Round all intermediate subtotals (`adultSubtotal`, `childSubtotal`, `infantSubtotal`, `baggageSubtotal`) to integer VND with `Math.round()`.
     - Generate transparent `fareScopeLabelVi` detailing passenger composition and segment type.
     - Prevent single-adult price promotion to total party price (`SingleAdultPricePromotedToFamilyTotalError`).
- **FORBIDDEN_DEVIATIONS**: No unverified external dependencies; do not modify public class or interface names; preserve existing error hierarchy.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/groupFarePlanner.test.ts`

### SOL-02: SOL-LANDED-01 (Landed Ancillary Surcharges & Destination Component Bounds)
- **SOL_ID**: SOL-LANDED-01
- **TARGET_FILES**: `src/domain/farely/tripBudgetEstimator.ts`
- **LOCKED_ALGORITHM**:
  1. In `estimateTripBudget`:
     - Clamp `nights` to non-negative integers $\le 90$.
     - Clamp passenger counts to positive integers $\le 20$.
     - Determine segment multiplier (2 for round-trip, 1 for one-way).
     - Apply airline ancillary surcharges from `DOMESTIC_ANCILLARY_SURCHARGES` (e.g. 350k checked baggage on VJ) multiplied by segment count.
     - Apply seasonal ground multiplier (`getSeasonalGroundMultiplier`): 1.5x for Tet peak (Jan-Feb), 1.25x for summer peak (Jun-Jul), 1.0x baseline.
     - Fall back to standard transfer costs when transfer tier is unrecognized.
     - Expose `isBenchmarkEstimated: boolean` when destination is not in benchmark record.
- **FORBIDDEN_DEVIATIONS**: No unverified external dependencies; maintain currency units in integer VND; preserve benchmark lookup table.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/tripBudgetEstimator.test.ts`

### SOL-03: SOL-CURATION-01 (Anti-Fabricated Scarcity & Curated Editorial Integrity)
- **SOL_ID**: SOL-CURATION-01
- **TARGET_FILES**: `src/domain/farely/editorialCollections.ts`
- **LOCKED_ALGORITHM**:
  1. In `validateCuratedDeal` & `validateEditorialCollection`:
     - Enforce 48-hour item freshness via `validateCuratedItemFreshness(observedAt, currentTimestampIso)`. Throw `StaleCuratedItemError` if older than 48h.
     - Validate collection expiration timestamp against `currentTimestampIso` or `Date.now()`.
     - Reject unverified scarcity claims lacking provider inventory proof, throwing `FabricatedScarcityError`.
     - Enforce that `cohortMedianPriceVND > 0`. Throw `UnsupportedFeaturedDiscountError` if non-positive.
     - Verify that claimed discount does not exceed actual calculated discount by $> 1\%$, throwing `UnsupportedFeaturedDiscountError`.
     - Sanitize curator metadata (`curatorId`, `name`, `signedAt`).
- **FORBIDDEN_DEVIATIONS**: No unverified external dependencies; preserve error types; maintain typed themes.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/editorialCollections.test.ts`

---

## SECTION E: THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Audit Findings**: Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping remain strictly boundary_excluded. Farely maintains absolute consumer transparency by calculating true family totals in `src/domain/farely/groupFarePlanner.ts` without promoting single-adult pricing.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:8`, `src/app/lib/bookingUrls.ts:14`, `src/domain/farely/providerRights.ts:18`

### L02: Economic Reality & Data Arbitrage Boundaries
- **Audit Findings**: Landed costs in `src/domain/farely/tripBudgetEstimator.ts` accurately capture ancillary airline fees (baggage and payment surcharges) and seasonal destination inflation.
- **Physical Code Citations**: `src/domain/farely/tripBudgetEstimator.ts:74`, `src/domain/farely/dataEconomics.ts:63`

### L03: Epistemic Humility & Machine Learning Calibration
- **Audit Findings**: Editorial collections in `src/domain/farely/editorialCollections.ts` reject stale items ($> 48\text{h}$) and unverified marketing scarcity claims.
- **Physical Code Citations**: `src/domain/farely/editorialCollections.ts:23`, `src/domain/farely/buyWaitGuidance.ts:88`

### L04: Mathematical Proof & Statistical Invariants
- **Audit Findings**: Monotonic pricing guarantees total party fare $T \ge A \cdot P_A$ and intermediate integer rounding prevents fractional VND drift.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:62`

### L05: Adversarial Inputs & Boundary Penetration
- **Audit Findings**: Non-positive fares, negative durations, corrupt ISO timestamps, and unescorted minors fail closed with typed domain errors.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:69`, `src/domain/farely/tripBudgetEstimator.ts:25`

### L06: Regulatory, Anti-Deception & Consumer Protection
- **Audit Findings**: Civil aviation safety invariants (CAAV $I \le A$) and anti-deception rules protect travelers from misleading deals.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:11`, `src/domain/farely/editorialCollections.ts:9`

### L07: Operational Resilience & Resource Saturation
- **Audit Findings**: Party sizes $\le 9$ and trip lengths $\le 90$ days prevent memory leaks and unbounded iteration.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:46`

### L08: Architectural Cohesion & Schema Evolution
- **Audit Findings**: Pure domain logic functions require zero database migrations and maintain compatibility across all 47 migrations in `supabase/migrations/`.
- **Physical Code Citations**: `supabase/migrations/20260407000000_initial_schema.sql:1`

### L09: Observability, Traceability & Forensic Auditability
- **Audit Findings**: Machine-readable error codes and curator metadata provide clear audit trails for all verification decisions.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:70`, `src/domain/farely/editorialCollections.ts:37`

### L10: Developer Velocity & Turnkey Verification
- **Audit Findings**: Turnkey vitest test runners execute in $< 500 \text{ ms}$ with zero network mocking.
- **Physical Code Citations**: `package.json:34`

### L11: Graceful Degradation & Autonomous Recovery
- **Audit Findings**: Fallback estimators return typed `isBenchmarkEstimated: true` flags rather than breaking client applications.
- **Physical Code Citations**: `src/domain/farely/tripBudgetEstimator.ts:25`

### L12: Long-Term Maintenance & Debt Eradication
- **Audit Findings**: Clean domain separation without circular dependencies guarantees maintenance velocity.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:14`, `src/domain/farely/editorialCollections.ts:74`

---

## SECTION F: CANONICAL RISK MATRIX

| Risk ID | Vulnerability Vector | Severity | Mitigation Strategy | Verification Oracle |
|---|---|---|---|---|
| RSK-01 | Single-adult fare shown as family total | Critical | Enforce $A \ge 1$, throw `SingleAdultPricePromotedToFamilyTotalError` | `src/domain/farely/groupFarePlanner.test.ts` |
| RSK-02 | CAAV infant lap violation ($I > A$) | High | Reject $I > A$ with `GroupFareValidationError` | `src/domain/farely/groupFarePlanner.test.ts` |
| RSK-03 | Round-trip baggage undercount | High | Multiply baggage surcharges by segment count | `src/domain/farely/tripBudgetEstimator.test.ts` |
| RSK-04 | Fabricated marketing discount or scarcity | High | Throw `FabricatedScarcityError` and `UnsupportedFeaturedDiscountError` | `src/domain/farely/editorialCollections.test.ts` |
| RSK-05 | Stale curated deal (>48h) featured | High | Enforce 48-hour freshness via `StaleCuratedItemError` | `src/domain/farely/editorialCollections.test.ts` |

---

## SECTION G: TRANSACTIONAL WORK PACKAGES

### WP01: WP01-GROUP-FARE-CAAV-INTEGRITY
- **Target File**: `src/domain/farely/groupFarePlanner.ts`
- **Action**: Enforce positive base fare, $1 \le A \le 9$, $I \le A$, integer VND subtotals, and Vietnamese party labels.
- **Verification**: `npx vitest run src/domain/farely/groupFarePlanner.test.ts`

### WP02: WP02-TRIP-BUDGET-SEASONAL-LANDED-COST
- **Target File**: `src/domain/farely/tripBudgetEstimator.ts`
- **Action**: Multiply ancillary baggage fees by segment count, apply seasonal peak multipliers, and clamp durations.
- **Verification**: `npx vitest run src/domain/farely/tripBudgetEstimator.test.ts`

### WP03: WP03-CURATED-COLLECTIONS-FRESHNESS-DISCOUNT
- **Target File**: `src/domain/farely/editorialCollections.ts`
- **Action**: Enforce 48h freshness, reject unverified scarcity claims, and validate discount percentage margins.
- **Verification**: `npx vitest run src/domain/farely/editorialCollections.test.ts`
