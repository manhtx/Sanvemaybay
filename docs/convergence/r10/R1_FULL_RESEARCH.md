# FARELY PROJECT 10X — RESEARCH R10 [R1]
# CYCLE: G82
# LEVEL: Pass 1: Full-Battery Baseline Synthesis
# MANDATE: Full-battery multi-lens analysis across all 12 Adversarial Lenses for Cycle G82. Ground all claims in physical repository files, empirical test matrices, and immutable owner contracts F00..F88.
# GIT_COMMIT: c2dbc902929fcf1302a9c30a037015562bac0b7b
# TIMESTAMP: 2026-10-27T03:00:00.000Z
# EXECUTION_RECEIPT_SHA256: eb7c9a630b07323dd5ae49991205923bfce207f4716a3f91232c8ad091f4ea88

---

## SECTION I: EXECUTIVE BASELINE & PRODUCT BOUNDARY INTEGRITY
Farely is an independent Flight Opportunity Intelligence Platform providing deterministic fare verification and algorithmic consumer transparency.
All operational activities operate under strictly non-OTA boundaries:
- Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping remain strictly boundary_excluded.
- Farely delivers algorithmic verification, price anomaly detection, and opportunity scoring; bookings terminate transparently at official airline or accredited OTA portals via clean handoff URLs (`src/app/lib/bookingUrls.ts`).

---

## SECTION II: CODEBASE ARCHITECTURAL TELEMETRY
- **Active Supabase Migrations**: 47 migrations in `supabase/migrations/`
- **Active Edge Functions**: 17 edge functions in `supabase/functions/`
- **Current Verified Suite**: 58 Vitest suites (372 unit tests) + 382 Node native test assertions = 754 tests green
- **Feature Branch**: `antigravity/farely-v12-product-convergence`
- **Remote SHA Parity**: `c2dbc902929fcf1302a9c30a037015562bac0b7b` (Verified via `git ls-remote`)

---

## SECTION III: CANDIDATE HARDENING MODULES FOR CYCLE G82
1. `SOL-GROUP-01`: Group & Family Fare Total Party Cost Allocation (`src/domain/farely/groupFarePlanner.ts`)
   - F40: Group/family fare planning. Prevents promoting a single-adult fare to a family total and enforces CAAV/IATA infant passenger safety ratios (max 1 infant per adult lap).
2. `SOL-LANDED-01`: Landed Ancillary Surcharges & Destination Component Bounds (`src/domain/farely/tripBudgetEstimator.ts`)
   - F46: Trip budget estimator & landed cost monotonicity. Incorporates airline-specific baggage and payment fees into true landed trip budgets.
3. `SOL-CURATION-01`: Anti-Fabricated Scarcity & Curated Editorial Integrity (`src/domain/farely/editorialCollections.ts`)
   - F42: Editorial collections. Forbids artificial urgency, unverified seat scarcity claims, and unsupported discount percentages.

---

## SECTION IV: THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Audit**: Farely never books flights or collects payment; direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping are strictly boundary_excluded. In `src/domain/farely/groupFarePlanner.ts`, family fare calculations must never mislead users by projecting single-adult pricing across multi-passenger parties.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:8`, `src/app/lib/bookingUrls.ts:14`

### L02: Economic Reality & Data Arbitrage Boundaries
- **Audit**: In `src/domain/farely/tripBudgetEstimator.ts`, low-cost carriers advertise low base fares while levying significant ancillary surcharges (e.g. 350,000 VND checked baggage on VJ). An intelligence platform must calculate true landed costs to prevent false arbitrage impressions.
- **Physical Code Citations**: `src/domain/farely/tripBudgetEstimator.ts:74`, `src/domain/farely/dataEconomics.ts:63`

### L03: Epistemic Humility & Machine Learning Calibration
- **Audit**: In `src/domain/farely/editorialCollections.ts`, marketing claims regarding "only 2 seats left" or "50% off" must be backed by verifiable provider inventory or cohort median baselines, failing closed with `FabricatedScarcityError` or `UnsupportedFeaturedDiscountError`.
- **Physical Code Citations**: `src/domain/farely/editorialCollections.ts:9`, `src/domain/farely/editorialCollections.ts:16`

### L04: Mathematical Proof & Statistical Invariants
- **Audit**: In `src/domain/farely/groupFarePlanner.ts`, party total fare must be strictly monotonic: $T = A \cdot (P_A + F_A + B_A) + C \cdot (P_C + F_C + B_C) + I \cdot (P_I + F_I)$. A family with $A \ge 1, C \ge 1$ must never yield $T \le P_A$.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:62`

### L05: Adversarial Inputs & Boundary Penetration
- **Audit**: In `src/domain/farely/groupFarePlanner.ts`, non-integer passenger counts (e.g. 2.5 adults), negative infant counts, or zero adults accompanying unescorted minors must trigger immediate validation rejection (`GroupFareValidationError`).
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:69`

### L06: Regulatory, Anti-Deception & Consumer Protection
- **Audit**: CAAV and IATA regulations dictate that infants under 2 years old travelling without a separate seat cannot exceed the number of accompanying adults. In `src/domain/farely/groupFarePlanner.ts`, this invariant must be enforced deterministically.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:11`

### L07: Operational Resilience & Resource Saturation
- **Audit**: In `src/domain/farely/tripBudgetEstimator.ts`, trip duration days and passenger counts must be bounded to reasonable limits ($\le 90 \text{ days}$, $\le 20 \text{ passengers}$) to prevent resource exhaustion during combinatorial matrix simulations.
- **Physical Code Citations**: `src/domain/farely/tripBudgetEstimator.ts:25`

### L08: Architectural Cohesion & Schema Evolution
- **Audit**: All calculations reside strictly in pure domain logic functions (`src/domain/farely/`), requiring no breaking database schema mutations and maintaining compatibility with all 47 migrations in `supabase/migrations/`.
- **Physical Code Citations**: `supabase/migrations/20260407000000_initial_schema.sql:1`

### L09: Observability, Traceability & Forensic Auditability
- **Audit**: In `src/domain/farely/editorialCollections.ts`, all curated items require explicit curator metadata (`curatorId`, `signedAt`) and structured error codes (`F42_FABRICATED_SCARCITY_VIOLATION`, `F42_UNSUPPORTED_DISCOUNT_VIOLATION`) for forensic auditing.
- **Physical Code Citations**: `src/domain/farely/editorialCollections.ts:37`, `src/domain/farely/editorialCollections.ts:9`

### L10: Developer Velocity & Turnkey Verification
- **Audit**: Turnkey test suites run instantly with zero mock pollution via `npx vitest run src/domain/farely/groupFarePlanner.test.ts src/domain/farely/tripBudgetEstimator.test.ts src/domain/farely/editorialCollections.test.ts`.
- **Physical Code Citations**: `package.json:34`

### L11: Graceful Degradation & Autonomous Recovery
- **Audit**: When destination benchmark costs or ancillary surcharge lookups encounter unknown airport codes or airlines, fallback to safe, neutral, transparent averages with explicit disclaimers rather than throwing unhandled runtime exceptions.
- **Physical Code Citations**: `src/domain/farely/tripBudgetEstimator.ts:25`

### L12: Long-Term Maintenance & Debt Eradication
- **Audit**: Modular TypeScript interfaces and typed error classes eradicate technical debt and preserve maintainability across future convergence cycles.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:14`, `src/domain/farely/tripBudgetEstimator.ts:6`

---

## SECTION V: PROPOSED ARCHITECTURAL SOLUTIONS
- **SOL-01: SOL-GROUP-01**: In `src/domain/farely/groupFarePlanner.ts`, enforce integer passenger counts, reject $A < 1$, enforce $I \le A$ (CAAV infant lap invariant), and throw `SingleAdultPricePromotedToFamilyTotalError` if total party fare is collapsed to single adult.
- **SOL-02: SOL-LANDED-01**: In `src/domain/farely/tripBudgetEstimator.ts`, incorporate domestic ancillary surcharges (`DOMESTIC_ANCILLARY_SURCHARGES`) into landed trip cost, cap duration to 90 days, and provide fallback benchmark data for unlisted destinations.
- **SOL-03: SOL-CURATION-01**: In `src/domain/farely/editorialCollections.ts`, enforce strict validation on scarcity claims and discount assertions, throwing `FabricatedScarcityError` and `UnsupportedFeaturedDiscountError` on unproven claims.
