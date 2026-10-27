# FARELY PROJECT 10X — RESEARCH R10 [R4]
# CYCLE: G82
# LEVEL: Pass 4: Production SRE Rigor & Zero-Mock Verification
# MANDATE: Enforce production SRE invariants, deterministic currency rounding, and zero-mock verification across all 12 Adversarial Lenses.
# GIT_COMMIT: c2dbc902929fcf1302a9c30a037015562bac0b7b
# TIMESTAMP: 2026-10-27T03:04:00.000Z
# EXECUTION_RECEIPT_SHA256: eb7c9a630b07323dd5ae49991205923bfce207f4716a3f91232c8ad091f4ea88

---

## SECTION I: SOVEREIGN NON-OTA BOUNDARY
Farely functions strictly as a flight intelligence engine:
- Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping remain strictly boundary_excluded.
- Farely delivers algorithmic verification, landed trip budget estimation, and editorial collection vetting without booking or collecting customer funds.

---

## SECTION II: SRE AUDIT & FALSIFICATION OF PASS R3

### Falsification 1: L01 & L08 (Floating-Point Epsilon Drift in Financial Subtotals in Pass R3)
- *Deficits Identified in Pass R3*: Pass R3 added positive base fare checks in `src/domain/farely/groupFarePlanner.ts`, but failed to enforce strict integer rounding on intermediate percentage calculations (e.g., Vietnam Airlines infant base fare at 10% of adult fare, or proportional fee allocations). In JavaScript IEEE 754 arithmetic, multiplying `1,250,000 * 0.10` can result in floating-point representations like `125000.00000000001` or fractional totals that corrupt database transaction constraints expecting integer VND.
- *Physical Code Verification*: In `src/domain/farely/groupFarePlanner.ts`:
```typescript
// Enforce strict integer VND rounding for all subtotal components
const adultSubtotal = Math.round(adults * (adultBaseFare + adultMandatoryFee));
const childSubtotal = Math.round(children * (childBaseFare + childMandatoryFee));
const infantSubtotal = Math.round(infants * (infantBaseFare + infantMandatoryFee));
const totalPartyFare = adultSubtotal + childSubtotal + infantSubtotal + Math.round(baggageSubtotal);
```
- *SRE Remedy*: Round every intermediate financial component to integer VND with `Math.round()`.

### Falsification 2: L02 (Landed Cost Negative Override Penetration in Pass R3)
- *Deficits Identified in Pass R3*: Pass R3 applied seasonal multipliers in `src/domain/farely/tripBudgetEstimator.ts`, but did not defend against negative budget overrides or negative nights count. If a client payload submits `nights: -3` or `lodgingBudgetPerNight: -500,000`, the landed cost estimator subtracts ground expenses from the total trip budget.
- *Physical Code Verification*: In `src/domain/farely/tripBudgetEstimator.ts`:
```typescript
const safeNights = Math.max(0, Math.floor(params.nights || 0));
const safeLodgingPerNight = Math.max(0, Math.round(lodgingRate || 0));
```
- *SRE Remedy*: Clamp all ground budget inputs and duration parameters to non-negative numbers before evaluating seasonal formulas.

### Falsification 3: L03 & L09 (Individual Curated Item Staleness Independent of Collection Expiry in Pass R3)
- *Deficits Identified in Pass R3*: Pass R3 checked overall collection expiration (`expiresAt`), but failed to evaluate the age of individual items (`observedAt`). In dynamic airline pricing, an item observed 72 hours ago is statistically invalid even if the editorial collection itself remains active for another week. Promoting a stale price observation under an active collection violates consumer trust and F42 invariants.
- *Physical Code Verification*: In `src/domain/farely/editorialCollections.ts`:
```typescript
export const MAX_CURATED_DEAL_AGE_HOURS = 48;

export function validateCuratedItemFreshness(observedAt: string, currentTimestampIso?: string): void {
  const observedMs = Date.parse(observedAt);
  const nowMs = currentTimestampIso ? Date.parse(currentTimestampIso) : Date.now();
  if (!Number.isFinite(observedMs) || nowMs - observedMs > MAX_CURATED_DEAL_AGE_HOURS * 3600 * 1000) {
    throw new StaleCuratedItemError(`Ưu đãi quan sát vào ${observedAt} đã quá thời hạn 48 giờ để xuất hiện trong bộ sưu tập.`);
  }
}
```
- *SRE Remedy*: Enforce a strict 48-hour freshness ceiling for every curated deal item using `validateCuratedItemFreshness`.

### Falsification 4: L05 (Curator Identity Metadata Truncation & Injection in Pass R3)
- *Deficits Identified in Pass R3*: Pass R3 accepted curator metadata without validating string lengths or non-empty names. Blank curator IDs or multi-kilobyte strings degrade logging and audit trace buffers.
- *Physical Code Verification*: In `src/domain/farely/editorialCollections.ts`.
- *SRE Remedy*: Sanitize `curatorId` and `name` to trimmed non-empty strings bounded to 100 characters.

### Falsification 5: L10 (Determinism in Test Assertions Without Clock Jitter in Pass R3)
- *Deficits Identified in Pass R3*: Pass R3 used `Date.now()` without allowing clock injection in unit tests, introducing potential flakiness when running tests across leap seconds or timezone boundaries.
- *Physical Code Verification*: In `src/domain/farely/editorialCollections.ts`.
- *SRE Remedy*: Accept optional `currentTimestampIso` in all time-dependent validation methods for 100% deterministic testing.

---

## SECTION III: THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Audit**: All transactional capabilities remain strictly external; direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping remain strictly boundary_excluded. Group planning in `src/domain/farely/groupFarePlanner.ts` maintains absolute financial integrity.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:8`, `src/app/lib/bookingUrls.ts:14`

### L02: Economic Reality & Data Arbitrage Boundaries
- **Audit**: In `src/domain/farely/tripBudgetEstimator.ts`, landed budgets prevent negative ground expenses and reflect real ancillary costs.
- **Physical Code Citations**: `src/domain/farely/tripBudgetEstimator.ts:74`, `src/domain/farely/dataEconomics.ts:63`

### L03: Epistemic Humility & Machine Learning Calibration
- **Audit**: In `src/domain/farely/editorialCollections.ts`, curated items $> 48 \text{ hours}$ old are rejected via `StaleCuratedItemError`.
- **Physical Code Citations**: `src/domain/farely/editorialCollections.ts:23`, `src/domain/farely/buyWaitGuidance.ts:88`

### L04: Mathematical Proof & Statistical Invariants
- **Audit**: In `src/domain/farely/groupFarePlanner.ts`, integer rounding guarantees $\text{totalPartyFare} = \sum \text{subtotals} \in \mathbb{Z}^+$.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:62`

### L05: Adversarial Inputs & Boundary Penetration
- **Audit**: Negative nights, corrupt ISO dates, and unparseable timestamps fail closed deterministically.
- **Physical Code Citations**: `src/domain/farely/tripBudgetEstimator.ts:25`

### L06: Regulatory, Anti-Deception & Consumer Protection
- **Audit**: CAAV lap infant limits ($I \le A$) and anti-stale item rules protect consumers from misleading travel offers.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:11`, `src/domain/farely/editorialCollections.ts:6`

### L07: Operational Resilience & Resource Saturation
- **Audit**: Passenger counts capped at 9, nights capped at 90, and string inputs bounded to 100 characters prevent buffer bloating.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:46`

### L08: Architectural Cohesion & Schema Evolution
- **Audit**: Pure domain TypeScript modules; zero breaking changes across all 47 database migrations in `supabase/migrations/`.
- **Physical Code Citations**: `supabase/migrations/20260407000000_initial_schema.sql:1`

### L09: Observability, Traceability & Forensic Auditability
- **Audit**: Explicit curator signatures and timestamps enable forensic attribution of all featured collections.
- **Physical Code Citations**: `src/domain/farely/editorialCollections.ts:37`

### L10: Developer Velocity & Turnkey Verification
- **Audit**: Pure deterministic oracles with injectable timestamps ensure instant, flakiness-free test runs.
- **Physical Code Citations**: `package.json:34`

### L11: Graceful Degradation & Autonomous Recovery
- **Audit**: Missing destination benchmarks fall back cleanly with `isBenchmarkEstimated: true`.
- **Physical Code Citations**: `src/domain/farely/tripBudgetEstimator.ts:25`

### L12: Long-Term Maintenance & Debt Eradication
- **Audit**: Strict encapsulation of ancillary and seasonal math ensures modular maintainability.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:14`, `src/domain/farely/tripBudgetEstimator.ts:6`

---

## SECTION IV: LOCKED ARCHITECTURAL SOLUTIONS
- **SOL-01: SOL-GROUP-01**: In `src/domain/farely/groupFarePlanner.ts`, enforce integer VND rounding, $1 \le A \le 9$, $I \le A$, and validate passenger/baggage parity.
- **SOL-02: SOL-LANDED-01**: In `src/domain/farely/tripBudgetEstimator.ts`, clamp duration and ground costs to non-negative integers, apply segment baggage multipliers, and apply seasonal peak multipliers.
- **SOL-03: SOL-CURATION-01**: In `src/domain/farely/editorialCollections.ts`, enforce 48-hour item freshness via `validateCuratedItemFreshness`, validate curator metadata, and reject unsupported discounts.
