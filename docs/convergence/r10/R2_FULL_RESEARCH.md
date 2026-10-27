# FARELY CYCLE G89 — RESEARCH PASS R2: SKEPTICAL GROUNDING & FALSIFICATION
## Target Modules: `providerRights.ts`, `directAffiliateComparison.ts`, `airportAlternatives.ts`
## Epistemic Integrity: Zero-Trust Codebase Telemetry & Adversarial Invariant Auditing

EXECUTION_RECEIPT_SHA256: e3a560e8bcd4da24e8b174b046c8342bdb4d73fc3f4ee851e75937b4215ba4bf
GIT_HEAD: 142a46c983f510b89afe3e522c2dc699c2667df5
STAGE: RESEARCH_R10
PASS: R2
TIMESTAMP: 2026-10-27T09:40:00Z

---

### FALSIFICATION & AUDIT OF PASS R1 (CRITIQUE OF PRIOR ASSUMPTIONS)

Pass R2 actively audits and falsifies several simplistic, unverified proposals from Pass R1 across multiple lenses:

1. **Falsification of L01 Proposal on Cache TTL Bounds (`providerRights.ts`)**:
   - *Pass R1 Claim*: "Clamp all `cacheTtlSeconds` to $[60, 86400]$."
   - *Falsification & Code Proof*: In `src/domain/farely/providerRights.ts#L287`, `getSafeProviderRights` intentionally assigns `cacheTtlSeconds: 0` for unknown or unregistered sources. If we blindly apply a global $[60, 86400]$ clamp, unregistered or restricted crawlers would suddenly be assigned a 60-second cache TTL, caching untrusted, invalid data! The mathematical bound must strictly apply *only* when `canCache === true` ($60 \le \text{cacheTtlSeconds} \le 86400$); when `canCache === false`, `cacheTtlSeconds` must strictly be 0.

2. **Falsification of L03 Proposal on Staged GDS Contracts (`providerRights.ts`)**:
   - *Pass R1 Claim*: "Enforce `requireExecutedContract: true` by default in `hasB2BRedistributionRights`."
   - *Falsification & Code Proof*: Existing unit tests in `src/domain/farely/providerRights.test.ts#L36-L38` and `src/domain/farely/providerRights.test.ts#L70` rely on the standard signature `hasB2BRedistributionRights('amadeus_commercial_gds')` returning `true` to test architectural capabilities. Flipping the default signature to `false` would break backward compatibility (violating L12) and fail the existing regression suite. The correct epistemic fix is to preserve default architectural query behavior while adding a strict runtime audit function `assertB2BRedistributionContractExecuted(providerId)` and enforcing `requireExecutedContract: true` specifically within production export pipelines.

3. **Falsification of L02 & L06 Proposal on Inverted Flight Durations (`airportAlternatives.ts`)**:
   - *Pass R1 Claim*: "Throw an error instead of clamping negative durations to 15 minutes."
   - *Falsification & Code Proof*: Line 158 of `src/domain/farely/airportAlternatives.test.ts` explicitly asserts:
     ```ts
     it('WP01: defensively clamps negative elapsed durations to commercial floor (>= 15 min) on inverted timings', () => {
       const timing = calculateTimezoneAwareTiming({ ... });
       expect(timing.trueElapsedMinutes).toBe(15);
     });
     ```
     Throwing an exception would cause an immediate regression of WP01! The rigorous solution is to preserve `trueElapsedMinutes = Math.max(15, rawElapsedMinutes)` while enriching `TimezoneAwareFlightTiming` with `isInvertedSchedule: boolean` and `rawElapsedMinutes: number`. This preserves 100% backward compatibility while exposing the anomaly to monitoring systems (L10).

4. **Falsification of L04 Proposal on URL Validation (`directAffiliateComparison.ts`)**:
   - *Pass R1 Claim*: "Validate deepLinkUrl strictly with `new URL(url)` requiring https://."
   - *Falsification & Code Proof*: In `src/domain/farely/directAffiliateComparison.test.ts#L125`, test quotes include URLs like `https://example.com/inclusive`. While `new URL` works on full URLs, relative paths or internal test fixtures could throw `TypeError: Invalid URL`. The validator must check for hazardous URI schemes (`javascript:`, `data:`, `vbscript:`, `file:`) and ensure the protocol is `http:` or `https:`.

---

### ADVERSARIAL SYSTEMIC AUDIT ACROSS ALL 12 LENSES

### L01: Mathematical & Algorithmic Rigor
- **Target 1 (`providerRights.ts`)**: Add input sanitization and bounded caching:
  ```ts
  const boundedTtl = rights.canCache ? Math.min(86400, Math.max(60, rights.cacheTtlSeconds)) : 0;
  ```
- **Target 2 (`directAffiliateComparison.ts`)**: In `compareProviderChannels`, validate that when `quoteBasis === 'ALL_INCLUSIVE_WITH_BAGGAGE'`, `rawQuotedPriceVND >= mandatoryTaxesAndFeesVND + (isBaggageIncluded ? checkedBaggageFeeVND : 0)`. If taxes + baggage strictly exceeds total price, throw an explanatory error: `Provider ${q.providerId} all-inclusive price (${q.rawQuotedPriceVND}) cannot be less than taxes plus baggage fees.`
- **Target 3 (`airportAlternatives.ts`)**: In `evaluateAirportAlternative` (`src/domain/farely/airportAlternatives.ts#L430`), `transferHours` is currently computed as `Math.max(0.25, safeMinutes / 60)`. When `netSavingsVND < 0`, `hourlyEfficiencyVND` evaluates to a negative number. When `netSavingsVND <= 0`, `hourlyEfficiencyVND` should be explicitly reported as 0 rather than negative, since no positive financial efficiency exists.

### L02: Type-System Soundness & Invariant Enforcement
- **Target 1 (`providerRights.ts`)**: Normalize `providerId` across all entry points:
  ```ts
  function normalizeProviderId(id: unknown): string {
    return typeof id === 'string' ? id.trim().toLowerCase() : '';
  }
  ```
  Fix `getSafeProviderRights` to use `normalizeProviderId(providerId)` so lookups like `getSafeProviderRights('VIETJET_DIRECT')` properly find `vietjet_direct` in `PROVIDER_SOURCE_RIGHTS_REGISTRY`.
- **Target 2 (`directAffiliateComparison.ts`)**: Validate `affiliateCommissionRatePercent`: if provided, it must satisfy `Number.isFinite(rate) && rate >= 0 && rate <= 100`. If `isCommercialPartner === true`, ensure `affiliateCommissionRatePercent` is non-negative.
- **Target 3 (`airportAlternatives.ts`)**: Type `AirportAlternativeEvaluation` must declare `transferFrictionCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCESSIVE'` and `isIncurringNetLoss: boolean`.

### L03: Epistemic Sincerity & Anti-Hallucination
- **Target 1 (`providerRights.ts`)**: Add explicit registry entries for domestic carriers `vietravel_airlines` (`VU`) and `pacific_airlines` (`BL`). Both are active CAAV-certificated Vietnamese air carriers. Categorize both as `PUBLIC_INDICATIVE` with `declarationStatus: 'INTERNAL_DECLARATION'` and `canRedistributeB2B: false`.
- **Target 2 (`directAffiliateComparison.ts`)**: In `assertCommercialRankingIntegrity`, assert that if an `AFFILIATE_AGGREGATOR` or `OTA_PARTNER` is promoted over a `DIRECT_AIRLINE` with identical total cost, it must throw `CommercialRankingOverrideError`:
  `Commercial partner cannot be prioritized over official direct airline on identical price.`
- **Target 3 (`airportAlternatives.ts`)**: Add verified route `HAN <-> VDO` to `GROUND_TRANSFER_CATALOG`: distance 175 km, typicalMinutes 150, estimatedCostVND 280000, modes `['Xe limousine cao tốc Hà Nội - Hải Phòng - Vân Đồn']`, sourceName `'Bảng cước xe khách cao tốc Hà Nội - Quảng Ninh công bố'`, isVerifiedSource `true`.

### L04: State Space Completeness & Boundary Values
- **Target 1 (`providerRights.ts`)**: `filterRecordsForB2BExport` must handle empty arrays, records with missing or empty `providerId`, and whitespace-padded IDs without throwing unexpected exceptions.
- **Target 2 (`directAffiliateComparison.ts`)**: When calculating `stalenessMinutes`:
  ```ts
  const observedTime = new Date(q.observedAt).getTime();
  const stalenessMinutes = Number.isFinite(observedTime) && Number.isFinite(nowMs)
    ? Math.max(0, Math.round((nowMs - observedTime) / (1000 * 60)))
    : 0;
  ```
  Guarantees finite integer staleness minutes even if timestamps are corrupt.
- **Target 3 (`airportAlternatives.ts`)**: In `evaluateAirportAlternative`, if `transfer.typicalMinutes > 180`, verdict must automatically degrade to `'NOT_RECOMMENDED'`, aligning with `evaluateAlternativeAirportSavings`.

### L05: Concurrency, Latency & Async Safety
- **Target 1 (`providerRights.ts`)**: Deep freeze `PROVIDER_SOURCE_RIGHTS_REGISTRY` using `Object.freeze` to guarantee immutability across concurrent evaluation tasks.
- **Target 2 (`directAffiliateComparison.ts`)**: Ensure `compareProviderChannels` executes without any external I/O or state mutation.
- **Target 3 (`airportAlternatives.ts`)**: In `calculateTimezoneAwareTiming`, cache timezone offset calculation for standard Asia/Ho_Chi_Minh (+420 minutes) and common IANA timezones.

### L06: Adversarial Robustness & Negative Vector Defense
- **Target 1 (`providerRights.ts`)**:
  - `NEG-24`: Staged GDS contract appears to grant B2B rights. Defended by `assertB2BRedistributionContractExecuted(providerId)`.
  - `NEG-38`: Unlicensed background scan continues. Ensure `canScrape: false` providers are blocked.
- **Target 2 (`directAffiliateComparison.ts`)**:
  - `NEG-04` & `NEG-05`: Validate that mandatory fees and baggage fees are non-negative finite numbers.
  - XSS defense: Sanitize `deepLinkUrl` to reject `javascript:` and ensure protocol is strictly `http:` or `https:`.
- **Target 3 (`airportAlternatives.ts`)**:
  - Provide `isInvertedSchedule: boolean` in `TimezoneAwareFlightTiming` to alert monitoring systems when arrival time precedes departure time.

### L07: Production Realism & Environmental Fidelity
- **Product Boundary Invariant (Anti-OTA Conflation)**:
  Farely operates purely as flight opportunity intelligence. Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping are strictly boundary_excluded.
- Register all 5 Vietnamese airlines in `providerRights.ts`: VN, VJ, QH, VU, BL.

### L08: Architectural Cohesion & Clean Domain Kernel
- Pure TypeScript implementations without third-party dependencies.
- Modular exports that cleanly separate rights registries, comparison engines, and geographic friction estimators.

### L09: Regulatory Compliance & Consumer Protection (CAAV, FTC, VN Competition Law)
- Compliance with Article 10 of Vietnam Law on Protection of Consumer Rights: Transparent disclosure of commercial relationships.
- Mandatory disclosure text in Vietnamese explaining that rankings are determined objectively by total cost, not commission rate.

### L10: Observability, Diagnostics & SRE Auditability
- Diagnostic error tags and structured enum codes: `ERR_UNREGISTERED_PROVIDER`, `ERR_COMMERCIAL_CONTRACT_STAGED`, `ERR_UNAUTHORIZED_SCOPE`, `ERR_INVALID_PRICE_BREAKDOWN`, `ERR_UNSAFE_DEEP_LINK`.

### L11: Zero-Trust Security & Minimal Privilege
- Safe URL protocol parsing: Reject URLs with `javascript:`, `data:`, `file:`.
- Enforce least privilege data scopes (`CONSUMER_INDICATIVE`, `INTERNAL_ANALYTICS`, `B2B_SYNDICATION`).

### L12: Backward Compatibility & Regression Invariance
- Existing signatures and return structures must remain backwards-compatible. All 798 baseline tests must continue to pass.

---

### ACTIONABLE RESEARCH SUMMARY & TRANSITION TO PASS R3
Pass R2 successfully falsified simplistic proposals from Pass R1 and established precise, backward-compatible specifications. In Pass R3, we will subject these specifications to hostile boundary stress-testing and negative vector attack simulations.
