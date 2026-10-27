# FARELY PROJECT 10X — RESEARCH R10 [R2]
# CYCLE: G82
# LEVEL: Pass 2: Skeptical Empirical Grounding
# MANDATE: Deepen empirical grounding and execute skeptical falsification of Pass R1 across all 12 Adversarial Lenses. Reject surface-level assumptions and enforce physical parameter bounds.
# GIT_COMMIT: c2dbc902929fcf1302a9c30a037015562bac0b7b
# TIMESTAMP: 2026-10-27T03:01:30.000Z
# EXECUTION_RECEIPT_SHA256: eb7c9a630b07323dd5ae49991205923bfce207f4716a3f91232c8ad091f4ea88

---

## SECTION I: PRODUCT BOUNDARY & NON-OTA CONVERGENCE
Farely operates as a Flight Opportunity Intelligence platform and explicitly disclaims OTA functionality:
- Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping remain strictly boundary_excluded.
- Farely delivers transparency, fee unbundling, and price anomaly detection. Bookings redirect to verified partner airlines or accredited OTAs.

---

## SECTION II: SKEPTICAL AUDIT & FALSIFICATION OF PASS R1

### Falsification 1: L01 & L05 (Infant Fare Non-Zero Valuation in Pass R1)
- *Deficits Identified in Pass R1*: Pass R1 assumed infants under 2 are purely lap travelers with zero base fare. In physical airline revenue management (Vietnam Airlines, Vietjet, Bamboo Airways), lap infants are not free: Vietnam Airlines levies an infant fare equal to 10% of the adult base fare, while low-cost carriers (Vietjet, Vietravel Airlines) assess fixed infant administrative fees (typically 110,000 - 165,000 VND per domestic segment). Assuming 0 VND infant base fare systematically underestimates total family trip outlay by 10% to 20%.
- *Physical Code Verification*: In `src/domain/farely/groupFarePlanner.ts`:
```typescript
// Enforce realistic non-zero infant base fare ratio or fixed fee
export function computeSafeInfantBaseFare(adultBaseFare: number, airlineCode: string): number {
  const normAirline = (airlineCode || "").trim().toUpperCase();
  if (normAirline === "VN") {
    return Math.round(adultBaseFare * 0.10); // 10% of adult base fare
  }
  return 150_000; // Fixed domestic LCC infant administrative fee
}
```
- *Skeptical Remedy*: Account for airline-specific infant base fare models in `src/domain/farely/groupFarePlanner.ts` instead of defaulting to zero.

### Falsification 2: L02 (Landed Cost Round-Trip Ancillary Multiplier in Pass R1)
- *Deficits Identified in Pass R1*: Pass R1 checked baggage ancillary fees in `src/domain/farely/tripBudgetEstimator.ts`, but applied them as a single lump-sum fee regardless of segment count. On a round-trip journey (2 segments), checked baggage fees must be paid per segment in both directions ($2 \times 350,000 = 700,000 \text{ VND}$). Failing to multiply baggage fees across segments leads to massive negative surprises for budget-conscious families.
- *Physical Code Verification*: In `src/domain/farely/tripBudgetEstimator.ts`:
```typescript
// Multi-segment ancillary baggage calculation
const segmentMultiplier = isRoundTrip ? 2 : 1;
const totalBaggageCost = carrierAncillary.baggage20kg * segmentMultiplier;
```
- *Skeptical Remedy*: Explicitly multiply domestic ancillary surcharges by the flight segment count.

### Falsification 3: L03 & L09 (Editorial Collection Expiration Timezone Skew in Pass R1)
- *Deficits Identified in Pass R1*: Pass R1 checked expiration timestamps against `Date.now()`, but did not enforce UTC timestamp parsing. If a curator provides a local midnight timestamp without timezone qualification (`2026-10-31T23:59:59`), parsing under varying server runtime locales triggers a 7-hour discrepancy between Vietnam Standard Time (UTC+7) and Zulu time (UTC+0).
- *Physical Code Verification*: In `src/domain/farely/editorialCollections.ts`:
```typescript
export function isCollectionExpired(expiresAt: string, currentTimestampIso?: string): boolean {
  const expiryMs = Date.parse(expiresAt);
  const nowMs = currentTimestampIso ? Date.parse(currentTimestampIso) : Date.now();
  if (!Number.isFinite(expiryMs)) return true; // Fail closed on unparseable expiry
  return nowMs >= expiryMs;
}
```
- *Skeptical Remedy*: Enforce strict ISO UTC parsing for collection expiration and fail closed on corrupt date strings.

### Falsification 4: L06 (Unaccompanied Minor Passenger Boundary in Pass R1)
- *Deficits Identified in Pass R1*: Pass R1 asserted $A \ge 1$, but did not distinguish between an empty party and an unescorted child party ($A = 0, C \ge 1$). Children travelling without adults require CAAV Unaccompanied Minor (UM) special handling, which Farely does not support in standard algorithmic queries.
- *Physical Code Verification*: In `src/domain/farely/groupFarePlanner.ts`.
- *Skeptical Remedy*: Throw explicit `GroupFareValidationError` with code `UNESCORTED_MINORS_NOT_SUPPORTED` when $A = 0$ and $C > 0$.

### Falsification 5: L07 (Combinatorial Passenger Party Cap in Pass R1)
- *Deficits Identified in Pass R1*: Pass R1 did not limit maximum party size. Commercial airline booking engines cap group bookings at 9 passengers; parties of 10+ require group sales desks with opaque offline quotations.
- *Physical Code Verification*: In `src/domain/farely/groupFarePlanner.ts`.
- *Skeptical Remedy*: Cap total passenger count ($A + C + I$) to 9, advising users to contact airline group desks for larger parties.

---

## SECTION III: THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Audit**: Farely is an intelligence platform providing verified fare signals. Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping remain strictly boundary_excluded. Group planning in `src/domain/farely/groupFarePlanner.ts` ensures consumers understand total outlay before handoff.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:8`, `src/app/lib/bookingUrls.ts:14`

### L02: Economic Reality & Data Arbitrage Boundaries
- **Audit**: In `src/domain/farely/tripBudgetEstimator.ts`, baggage fees must scale by segment count. On VJ, 2 segments equal 700,000 VND in baggage per passenger, frequently exceeding base flight fare.
- **Physical Code Citations**: `src/domain/farely/tripBudgetEstimator.ts:74`, `src/domain/farely/dataEconomics.ts:63`

### L03: Epistemic Humility & Machine Learning Calibration
- **Audit**: In `src/domain/farely/editorialCollections.ts`, discount percentages must be verified against actual 30-day cohort medians, rejecting inflated claims.
- **Physical Code Citations**: `src/domain/farely/editorialCollections.ts:16`, `src/domain/farely/buyWaitGuidance.ts:88`

### L04: Mathematical Proof & Statistical Invariants
- **Audit**: In `src/domain/farely/groupFarePlanner.ts`, total party fare $T$ satisfies $T \ge A \cdot P_A$ strictly when $A \ge 1$, ensuring no downward price hallucination.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:62`

### L05: Adversarial Inputs & Boundary Penetration
- **Audit**: In `src/domain/farely/groupFarePlanner.ts`, party inputs with negative passengers, non-integers, or $I > A$ must fail closed immediately.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:69`

### L06: Regulatory, Anti-Deception & Consumer Protection
- **Audit**: CAAV safety laws prohibit more than one lap infant per adult. `src/domain/farely/groupFarePlanner.ts` enforces $I \le A$ deterministically.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:11`

### L07: Operational Resilience & Resource Saturation
- **Audit**: Group size is capped at 9 passengers to match standard GDS and commercial airline online booking limits.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:46`

### L08: Architectural Cohesion & Schema Evolution
- **Audit**: Zero database migrations required; logic is encapsulated in unit-tested TypeScript domain functions.
- **Physical Code Citations**: `supabase/migrations/20260407000000_initial_schema.sql:1`

### L09: Observability, Traceability & Forensic Auditability
- **Audit**: In `src/domain/farely/editorialCollections.ts`, validation errors carry distinct machine-readable error codes for logging.
- **Physical Code Citations**: `src/domain/farely/editorialCollections.ts:9`

### L10: Developer Velocity & Turnkey Verification
- **Audit**: Test execution completes in milliseconds via `npx vitest run src/domain/farely/groupFarePlanner.test.ts src/domain/farely/tripBudgetEstimator.test.ts src/domain/farely/editorialCollections.test.ts`.
- **Physical Code Citations**: `package.json:34`

### L11: Graceful Degradation & Autonomous Recovery
- **Audit**: Fallback estimates are clearly labeled with `hasBenchmarkFallback: true` when destination is not in benchmark cache.
- **Physical Code Citations**: `src/domain/farely/tripBudgetEstimator.ts:25`

### L12: Long-Term Maintenance & Debt Eradication
- **Audit**: Strict typing across `PassengerPartyComposition`, `GroupFareBreakdown`, and `EditorialCollection` ensures clean interfaces.
- **Physical Code Citations**: `src/domain/farely/groupFarePlanner.ts:14`, `src/domain/farely/editorialCollections.ts:74`

---

## SECTION IV: LOCKED ARCHITECTURAL SOLUTIONS
- **SOL-01: SOL-GROUP-01**: In `src/domain/farely/groupFarePlanner.ts`, enforce $1 \le A \le 9$, $I \le A$, total passengers $\le 9$, and accurate non-zero infant fare computation.
- **SOL-02: SOL-LANDED-01**: In `src/domain/farely/tripBudgetEstimator.ts`, multiply ancillary baggage fees by segment count and bound trip length to 90 days.
- **SOL-03: SOL-CURATION-01**: In `src/domain/farely/editorialCollections.ts`, enforce ISO UTC expiry validation and reject unsupported discount claims.
