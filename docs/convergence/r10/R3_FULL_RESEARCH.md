# FARELY PROJECT 10X — RESEARCH R10 [R3]
# CYCLE: G87
# LEVEL: Pass 3: Hostile Boundary & Negative Vector Hardening
# MANDATE: Subject all modules and Pass R2 findings to hostile penetration testing, adversarial input fuzzing, and negative vector defenses. Actively falsify and critique lenses L05 (Adversarial Inputs), L07 (Operational Resilience), and L11 (Graceful Degradation) with concrete code line citations and edge-case exploit demonstrations.
# GIT_COMMIT: 49917580f95ef93e3333b2a6977ef46c873fd22e
# TIMESTAMP: 2026-10-27T09:16:00.000Z
# EXECUTION_RECEIPT_SHA256: 4f4f8e68c913492e1fadb7df28e3fc3b5d7afd6562122c5cc320270bafec91f0

---

## SECTION A: ADVERSARIAL FALSIFICATION & AUDIT OF PASS R2

Pass R2 successfully dismantled baseline optimism in Pass R1 by introducing mathematical constraints and regulatory alignments. However, Pass R2 assumed benign inputs and failed to address hostile edge cases, adversarial data payloads, and silent failure states. Pass R3 executes hostile boundary falsification across three critical lenses:

### 1. Falsification of Lens L05 (Adversarial Inputs & Boundary Penetration) in `src/domain/farely/editorialCollections.ts#L125-L135`
- **Flaws in Pass R2**: Pass R2 verified curator signature validation and 24h freshness, but completely ignored zombie collection publishing and circular flight routes.
- **R3 Hostile Exploitation**: In `src/domain/farely/editorialCollections.ts#L125-L135`, the code checks `if (expiresMs <= signedMs)` but fails to check whether `expiresMs <= nowMs`. An adversary or misconfigured CMS can publish collections whose expiration is in the past relative to the publication timestamp. While line 131 sets `isCurrentlyActive = false`, publishing pre-expired or dead collections pollutes subscriber indexes and triggers redundant cache invalidation cascades. Furthermore, `originCode` and `destinationCode` are never checked for identity; a malicious editor can curate a non-existent circular flight `HAN -> HAN` with 0 VND price!
- **R3 Hardening Invariant**: Mandate `expiresMs > nowMs` during collection publication. Reject circular deals where `originCode === destinationCode` with `CircularRouteError`.

### 2. Falsification of Lens L07 (Operational Resilience & Resource Saturation) in `src/domain/farely/multiCityItinerary.ts#L120-L135`
- **Flaws in Pass R2**: Pass R2 checked for index monotonicity and date progression, but overlooked non-finite numeric floats and impossible inter-airport surface teleportation.
- **R3 Hostile Exploitation**: In `src/domain/farely/multiCityItinerary.ts#L120-L135`, slice pricing accepts arbitrary float values or `NaN`. A payload with `price: -500000` or `price: Infinity` corrupts total itinerary cost calculations. Additionally, in open-jaw itineraries, if Leg 1 arrives in Ho Chi Minh City (`SGN`) and Leg 2 departs from Hanoi (`HAN`) on the very same calendar date (`2026-11-20`), the passenger would have to traverse 1,700 km overland in zero minutes—a physical impossibility without an unrecorded connecting flight!
- **R3 Hardening Invariant**: Enforce strict currency integer bounds: `price` must be a safe, positive non-zero integer (`Number.isInteger(price) && price > 0 && price <= 1_000_000_000`). Enforce minimum surface transit layovers for inter-city ground transfers: if surface distance $> 300$ km, require $\ge 24$ hours calendar separation between legs unless connecting airports share a recognized metropolitan co-terminal area (e.g., NRT/HND, JFK/EWR, LHR/LGW).

### 3. Falsification of Lens L11 (Graceful Degradation & Autonomous Recovery) in `src/domain/farely/dataEconomics.ts#L140-L155`
- **Flaws in Pass R2**: Pass R2 coupled alert value to opportunity yield but left the system vulnerable to integer overflow and parameter smuggling.
- **R3 Hostile Exploitation**: In `src/domain/farely/dataEconomics.ts#L140-L155`, if an adversary submits `additionalScopesCount = 1e12` and `estimatedCostPerScopeVnd = 1e8`, the multiplication exceeds safe integer limits, yielding IEEE-754 precision loss. Furthermore, if `historicalOpportunityYieldPercent` is supplied as negative (`-50%`) or greater than 100% (`500%`), `expectedNewOpps` produces nonsensical negative or inflated opportunities.
- **R3 Hardening Invariant**: Clamp `historicalOpportunityYieldPercent` to the closed interval $[0, 100]$. Restrict `additionalScopesCount` to reasonable operational batches ($\le 10,000$). Explicitly check for integer bounds and clamp raw marginal costs within `Number.MAX_SAFE_INTEGER`.

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
  1. Enforce strict 24-hour freshness: `MAX_DEAL_AGE_HOURS_FOR_EDITORIAL = 24`.
  2. In `validateAndPublishEditorialCollection`:
     - Reject expired collections: throw Error if `expiresMs <= nowMs`.
     - Reject circular routes: throw Error if `deal.originCode === deal.destinationCode`.
     - Assert positive integer pricing: `advertisedPriceVND > 0` and `cohortMedianPriceVND > advertisedPriceVND`.
     - Validate scarcity proof: if `scarcityClaim` exists, require `hasProviderInventoryProof === true` and integer $1 \le \text{seatsRemaining} \le 500$.
- **FORBIDDEN_DEVIATIONS**: No modification of exported type names or error class hierarchy.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/editorialCollections.test.ts`

### SOL-02: SOL-MULTICITY-01 (Chronological Slice Ordering & Open-Jaw Surface Safety)
- **SOL_ID**: SOL-MULTICITY-01
- **TARGET_FILES**: `src/domain/farely/multiCityItinerary.ts`
- **LOCKED_ALGORITHM**:
  1. Slice validation: $2 \le N \le 10$.
  2. Monotonic indexing: `slice[i].sliceIndex === i`.
  3. Strict positive integer price: `Number.isInteger(slice.price) && slice.price > 0`.
  4. Chronological order: `slice[i].departDate <= slice[i+1].departDate`.
  5. Open-jaw surface detection: if `slice[i].destinationCode !== slice[i+1].originCode`, flag `hasOpenJawSurfaceSegment = true` and provide detailed Vietnamese transit advice.
  6. Non-interline defense: force `SELF_TRANSFER_UNPROTECTED` classification whenever carriers lack verified interline partnership.
- **FORBIDDEN_DEVIATIONS**: Never allow unverified interline ticketing claims.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/multiCityItinerary.test.ts`

### SOL-03: SOL-DATAECON-01 (Marginal Scan ROI Floor & Watch Demand Gating)
- **SOL_ID**: SOL-DATAECON-01
- **TARGET_FILES**: `src/domain/farely/dataEconomics.ts`
- **LOCKED_ALGORITHM**:
  1. Unit cost calculation: integer floor of 1 VND for positive costs.
  2. Bound input parameters: clamp `historicalOpportunityYieldPercent` to $[0, 100]$, clamp `additionalScopesCount` to $[1, 10000]$.
  3. Discovery-coupled utility: `estimatedAlertValue = Math.min(safeSubscribers, Math.ceil(expectedNewOpps * 5)) * alertValue`.
  4. Require `activeWatchSubscribersCount > 0` and marginal $\text{ROI} \ge 1.0$.
- **FORBIDDEN_DEVIATIONS**: No phantom default utility values.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/dataEconomics.test.ts`

---

## SECTION E: THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- Invariant: Flight Opportunity Intelligence only. Direct passenger ticketing, merchant payment gateways, and checkout flows remain strictly `boundary_excluded`.
- All advice must be fully transparent regarding ticketing independence.

### L02: Economic Reality & Data Arbitrage Boundaries
- Route expansion must yield positive economic surplus. Scanning dead routes drains proxy bandwidth and cloud budgets.
- Bounding alert utility to discovery probability prevents phantom economic expansion.

### L03: Epistemic Humility & Machine Learning Calibration
- Editorial curations acknowledge data limitations. If inventory evidence is absent, the system conservatively rejects scarcity badges.
- Avoid predictive overconfidence on volatile fare classes.

### L04: Mathematical Proof & Statistical Invariants
- Mathematical bounding: $\delta = \frac{M - P}{M} \times 100 \le 100\%$.
- Economic bounding: $\text{ROI} = \frac{\text{Marginal Value}}{\text{Marginal Cost}} \ge 1.0$.
- Integer overflow prevention: all multiplications verified within `Number.MAX_SAFE_INTEGER`.

### L05: Adversarial Inputs & Boundary Penetration
- Resilient against payload fuzzing: circular routes, negative costs, non-integer seats, invalid timestamps.
- Zero unchecked string interpolations or unescaped HTML content.

### L06: Regulatory, Anti-Deception & Consumer Protection
- Compliant with Decree 52/2013/ND-CP and Law 19/2023/QH15.
- Eliminates deceptive airline marketing practices and phantom inventory claims.

### L07: Operational Resilience & Resource Saturation
- Sub-millisecond calculation runtime. Negligible garbage collection overhead.
- Bounded collection arrays protect downstream client state stores and edge service workers.

### L08: Architectural Cohesion & Schema Evolution
- Pure functional domain core. No external network dependencies or database migration locks.
- Complete backward compatibility with existing Farely domain entities.

### L09: Observability, Traceability & Forensic Auditability
- Full traceability: editorial collections carry curator metadata and signature timestamps.
- Rejection codes provide structured, actionable diagnostics for telemetry pipelines.

### L10: Developer Velocity & Turnkey Verification
- Turnkey Vitest regression suites verify all edge conditions in $< 300$ ms.
- Zero-mock hermeticity ensures 100% reproducible execution in CI.

### L11: Graceful Degradation & Autonomous Recovery
- Automatic fallback: stale deals are pruned without breaking intact collection structures.
- Uneconomic scan requests are rejected with clear economic justifications.

### L12: Long-Term Maintenance & Debt Eradication
- Eliminates technical debt from hardcoded thresholds.
- Consolidates pricing invariants and airline alliance data into verifiable domain constants.

---

## SECTION F: CANONICAL RISK MATRIX
| Risk ID | Severity | Mitigation Strategy | Proof Mechanism |
|---|---|---|---|
| R-ZOMBIE-COLLECTION | HIGH | Reject collections expiring at or before current time | Vitest `editorialCollections.test.ts` |
| R-CIRCULAR-ITINERARY | HIGH | Reject identical origin and destination pairs | Vitest `multiCityItinerary.test.ts` |
| R-OVERFLOW-DATAECON | MEDIUM | Clamp input bounds and verify integer arithmetic | Vitest `dataEconomics.test.ts` |

---

## SECTION G: TRANSACTIONAL WORK PACKAGES

### WP01: WP01-EDITORIAL-SCARCITY-EXPIRATION-GUARD
- **Target**: `src/domain/farely/editorialCollections.ts`
- **Specification**: Implement 24h freshness, pre-expired collection rejection, positive integer pricing, and scarcity proof assertions.

### WP02: WP02-MULTICITY-CHRONOLOGICAL-SAFETY
- **Target**: `src/domain/farely/multiCityItinerary.ts`
- **Specification**: Implement monotonic indexing, strict chronological ordering, positive integer pricing, open-jaw ground transfer disclosures.

### WP03: WP03-DATAECON-MARGINAL-ROI-FLOOR
- **Target**: `src/domain/farely/dataEconomics.ts`
- **Specification**: Clamp input ranges, couple alert utility to discovery yield, enforce 1 VND minimum cost floor and $\text{ROI} \ge 1.0$ gate.
