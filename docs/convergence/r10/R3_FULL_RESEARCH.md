# FARELY CYCLE G89 — RESEARCH PASS R3: HOSTILE BOUNDARY & NEGATIVE VECTOR DEFENSE
## Target Modules: `providerRights.ts`, `directAffiliateComparison.ts`, `airportAlternatives.ts`
## Epistemic Integrity: Zero-Trust Codebase Telemetry & Adversarial Invariant Auditing

EXECUTION_RECEIPT_SHA256: e3a560e8bcd4da24e8b174b046c8342bdb4d73fc3f4ee851e75937b4215ba4bf
GIT_HEAD: 142a46c983f510b89afe3e522c2dc699c2667df5
STAGE: RESEARCH_R10
PASS: R3
TIMESTAMP: 2026-10-27T09:41:00Z

---

### FALSIFICATION & AUDIT OF PASS R2 (CRITIQUE OF PRIOR ASSUMPTIONS)

Pass R3 subjects Pass R2 to hostile boundary analysis and falsifies three key oversights across lenses L01, L02, L04, L06, and L10:

1. **Falsification of L01 & L10 Proposal on Hourly Efficiency Clamping (`airportAlternatives.ts`)**:
   - *Pass R2 Claim*: "When `netSavingsVND <= 0`, `hourlyEfficiencyVND` should be set to 0."
   - *Falsification & Code Proof*: Setting `hourlyEfficiencyVND = 0` whenever `netSavingsVND <= 0` creates an information blackout. If Alternative X incurs a net loss of -50,000₫ for a 60-minute detour (-50,000₫/hr) while Alternative Y incurs a net loss of -2,500,000₫ (-2,500,000₫/hr), setting both to 0 conceals the catastrophic penalty of Alternative Y. Downstream sorting or decision models would treat both as identical 0 efficiency! The mathematically rigorous formulation is to retain `hourlyEfficiencyVND = Math.round(netSavingsVND / transferHours)` (allowing negative values for telemetry and sorting), while exposing `positiveEfficiencyVND: Math.max(0, hourlyEfficiencyVND)` and `isIncurringNetLoss: boolean` for UI rendering.

2. **Falsification of L02 Proposal on Provider ID Normalization (`providerRights.ts`)**:
   - *Pass R2 Claim*: "`normalizeProviderId(id)` should return `''` for null or undefined."
   - *Falsification & Code Proof*: If `normalizeProviderId` returns `''`, then `getSafeProviderRights('')` sets `providerId: ''` and `sourceName: 'Unknown Provider ()'`. Downstream logging and audit systems will emit empty strings `providerId=""`, violating SRE observability invariants (L10). When input is null, undefined, or empty, `normalizeProviderId` should normalize to `'unknown'` or provide a distinct sentinel, and `getSafeProviderRights` must record `providerId: id?.trim() || 'unknown'`.

3. **Falsification of L04 & L06 Proposal on Zero Baggage Fee Assumptions (`directAffiliateComparison.ts`)**:
   - *Pass R2 Claim*: "Validate taxes and fees, but accept `checkedBaggageFeeVND: 0` directly."
   - *Falsification & Code Proof*: Under `NEG-05` ("Unknown baggage becomes free/included"), if `requiresCheckedBaggage === true`, `isBaggageIncludedInQuote === false`, and `checkedBaggageFeeVND === 0`, treating baggage as 0 VND creates a deceptive "free baggage" appearance for budget airlines (Vietjet, AirAsia) where checked baggage is never free! We must require explicit declaration: if `checkedBaggageFeeVND === 0` and `!isBaggageIncludedInQuote`, the channel must flag an advisory warning `baggageFeeUnquoted: true` or require verified 0 baggage fee entitlement.

---

### ADVERSARIAL SYSTEMIC AUDIT ACROSS ALL 12 LENSES

### L01: Mathematical & Algorithmic Rigor
- **Target 1 (`providerRights.ts`)**: Ensure cache TTL adheres strictly to:
  ```ts
  const boundedTtl = rights.canCache
    ? Math.min(86400, Math.max(60, Math.round(rights.cacheTtlSeconds || 1800)))
    : 0;
  ```
- **Target 2 (`directAffiliateComparison.ts`)**: In `compareProviderChannels`, verify that breakdown sum strictly reconciles:
  ```ts
  const reconciledSum = baseFare + taxes + baggage;
  if (Math.abs(reconciledSum - totalCost) > 1) {
    throw new Error(`Price breakdown mismatch: baseFare (${baseFare}) + taxes (${taxes}) + baggage (${baggage}) != totalCost (${totalCost})`);
  }
  ```
- **Target 3 (`airportAlternatives.ts`)**: In `evaluateAirportAlternative`, ensure transfer hours are bounded: $0.25 \le \text{transferHours} \le 12.0$.

### L02: Type-System Soundness & Invariant Enforcement
- **Target 1 (`providerRights.ts`)**: Export explicit union for provider IDs and strict validation guards:
  ```ts
  export function isValidProviderId(id: unknown): id is string {
    return typeof id === 'string' && id.trim().length > 0;
  }
  ```
- **Target 2 (`directAffiliateComparison.ts`)**: Deep link safety type guard:
  ```ts
  export function isSafeDeepLinkUrl(url: unknown): boolean {
    if (typeof url !== 'string' || !url.trim()) return false;
    const lower = url.trim().toLowerCase();
    if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
      return false;
    }
    return lower.startsWith('http://') || lower.startsWith('https://');
  }
  ```
- **Target 3 (`airportAlternatives.ts`)**: `GroundTransferRoute` must enforce `distanceKm > 0`, `typicalMinutes > 0`, and `estimatedCostVND >= 0`.

### L03: Epistemic Sincerity & Anti-Hallucination
- **Target 1 (`providerRights.ts`)**: Staged contracts (`COMMERCIAL_STAGED_CONTRACT_REQUIRED`) must be clearly delineated:
  ```ts
  export function isStagedContract(providerId: string): boolean {
    const rights = getSafeProviderRights(providerId);
    return rights.declarationStatus === 'COMMERCIAL_STAGED_CONTRACT_REQUIRED';
  }
  ```
- **Target 2 (`directAffiliateComparison.ts`)**: Transparent disclosure notice in Vietnamese must state whether any partner is commercial, and emphasize that sorting is strictly by normalized total cost.
- **Target 3 (`airportAlternatives.ts`)**: Explicitly differentiate verified ground transfer routes (`isVerifiedSource: true`) from uncataloged heuristic estimates (`isVerifiedSource: false`).

### L04: State Space Completeness & Boundary Values
- **Target 1 (`providerRights.ts`)**: Handle null, undefined, whitespace, empty string, and uppercase provider IDs across all public functions.
- **Target 2 (`directAffiliateComparison.ts`)**: Handle extreme numbers: very large prices ($> 10^9$ VND), zero taxes, missing baggage info, and leap seconds in ISO timestamps.
- **Target 3 (`airportAlternatives.ts`)**: Handle same-airport comparison (`baseCode === altCode`), unknown airport codes, and regional transit times $> 180$ minutes.

### L05: Concurrency, Latency & Async Safety
- **Target 1 (`providerRights.ts`)**: Deep freeze the registry object to guarantee thread safety and prevent prototype mutations.
- **Target 2 (`directAffiliateComparison.ts`)**: Deterministic comparator with 4-tier tie-breaking:
  1. `normalizedTotalCostVND ASC`
  2. `channelType PRIORITY` (DIRECT_AIRLINE > OTA_PARTNER > AFFILIATE_AGGREGATOR)
  3. `providerName ASC`
  4. `providerId ASC`
- **Target 3 (`airportAlternatives.ts`)**: In-memory lookup in `GROUND_TRANSFER_CATALOG` executes in $O(1)$ to $O(N)$ with $N < 20$, guaranteed $< 1$ ms latency.

### L06: Adversarial Robustness & Negative Vector Defense
- **Target 1 (`providerRights.ts`)**:
  - `NEG-24`: Staged GDS contract appears to grant B2B rights.
  - `NEG-38`: Unlicensed background scan continues.
- **Target 2 (`directAffiliateComparison.ts`)**:
  - `NEG-04`: Unknown mandatory fee becomes 0.
  - `NEG-05`: Unknown baggage becomes free/included.
  - Injection attacks: Block unsafe URL schemes (`javascript:`).
- **Target 3 (`airportAlternatives.ts`)**:
  - Inverted schedule detection: `isInvertedSchedule: boolean`.
  - Excessive detour detection: `isExcessiveDetour: boolean` when detour time $> 180$ min.

### L07: Production Realism & Environmental Fidelity
- **Product Boundary Invariant (Anti-OTA Conflation)**:
  Farely operates purely as flight opportunity intelligence. Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping are strictly boundary_excluded.
- Register all 5 Vietnamese airlines in `providerRights.ts`: `vietjet_direct`, `vietnam_airlines`, `bamboo_airways`, `vietravel_airlines`, and `pacific_airlines`.
- Add regional route `HAN <-> VDO` to `GROUND_TRANSFER_CATALOG`.

### L08: Architectural Cohesion & Clean Domain Kernel
- Pure domain models with 0 external npm dependencies and 0 side effects.
- Clean separation of concerns between provider rights, channel pricing, and geographic friction.

### L09: Regulatory Compliance & Consumer Protection (CAAV, FTC, VN Competition Law)
- Compliance with CAAV regulations and Vietnam Law on Consumer Rights: Total price transparency, mandatory disclosure of commercial affiliation, and anti-misrepresentation.

### L10: Observability, Diagnostics & SRE Auditability
- Standard diagnostic error codes:
  - `ERR_UNREGISTERED_PROVIDER`
  - `ERR_COMMERCIAL_CONTRACT_STAGED`
  - `ERR_UNAUTHORIZED_SCOPE`
  - `ERR_INVALID_PRICE_BREAKDOWN`
  - `ERR_UNSAFE_DEEP_LINK`
  - `ERR_EXCESSIVE_DETOUR`

### L11: Zero-Trust Security & Minimal Privilege
- Immutable provider rights registry.
- Least privilege data access scopes.
- Strict URL validation before deep link emission.

### L12: Backward Compatibility & Regression Invariance
- All existing function signatures remain backwards-compatible.
- All existing tests pass without regressions.

---

### ACTIONABLE RESEARCH SUMMARY & TRANSITION TO PASS R4
Pass R3 hardened the specifications against hostile boundaries and negative vectors. In Pass R4, we will develop the complete production SRE specifications and precise implementation diffs.
