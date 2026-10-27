# FARELY CYCLE G89 — RESEARCH PASS R1: DEEP ADVERSARIAL DISSECTION
## Target Modules: `providerRights.ts`, `directAffiliateComparison.ts`, `airportAlternatives.ts`
## Epistemic Integrity: Zero-Trust Codebase Telemetry & Adversarial Invariant Auditing

EXECUTION_RECEIPT_SHA256: e3a560e8bcd4da24e8b174b046c8342bdb4d73fc3f4ee851e75937b4215ba4bf
GIT_HEAD: 142a46c983f510b89afe3e522c2dc699c2667df5
STAGE: RESEARCH_R10
PASS: R1
TIMESTAMP: 2026-10-27T09:39:00Z

---

### EXECUTIVE INTENT & SCOPE BOUNDARY
This pass initiates Cycle G89 under perpetual convergence `/goal`. It conducts an exhaustive, zero-sycophancy adversarial investigation into three mission-critical pure domain modules:
1. `src/domain/farely/providerRights.ts` (F85: B2B redistribution boundaries, provider source rights registry, and commercial staged contract enforcement).
2. `src/domain/farely/directAffiliateComparison.ts` (F43: Direct airline vs OTA/affiliate price normalization, anti-double-taxation, and commercial ranking override defense).
3. `src/domain/farely/airportAlternatives.ts` (F23 & F68: Ground transfer friction bounds, verified multi-metro catalog, and timezone-aware local datetime correctness).

**Product Boundary Invariant (Anti-OTA Conflation)**:
Farely is strictly an independent flight opportunity intelligence platform. Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping are strictly boundary_excluded.

---

### ADVERSARIAL SYSTEMIC AUDIT ACROSS ALL 12 LENSES

### L01: Mathematical & Algorithmic Rigor
- **Target 1 (`providerRights.ts`)**: `cacheTtlSeconds` currently accepts any number. If a provider configuration or dynamic override injects `0`, negative values, or excessive TTL (e.g., $10^9$ seconds), downstream caching layers either fail into cache-bust thrashing (cache invalidation DDOS on upstream sources) or persist stale fares indefinitely. A mathematical bound must be clamped: $60 \le \text{cacheTtlSeconds} \le 86400$.
- **Target 2 (`directAffiliateComparison.ts`)**: In `compareProviderChannels` (`src/domain/farely/directAffiliateComparison.ts#L117-L147`), when `quoteBasis === 'ALL_INCLUSIVE_WITH_BAGGAGE'`, base fare is derived via:
  ```ts
  baseFare = Math.max(0, q.rawQuotedPriceVND - taxes - baggage);
  ```
  If an ill-formed quote provides `taxes + baggage > rawQuotedPriceVND`, `baseFare` silently collapses to 0 without warning or error! An all-inclusive flight quote where taxes and baggage exceed the total price is mathematically incoherent and indicates corrupt provider payloads.
- **Target 3 (`airportAlternatives.ts`)**: In `calculateTimezoneAwareTiming` (`src/domain/farely/airportAlternatives.ts#L274-L276`), when arrival UTC time precedes departure UTC time, raw elapsed minutes is negative. The code executes:
  ```ts
  const rawElapsedMinutes = Math.round((arrUtcTime - depUtcTime) / 60000);
  const trueElapsedMinutes = Math.max(15, rawElapsedMinutes);
  ```
  Clamping a negative flight duration (e.g., $-180$ minutes due to inverted scheduling data or inverted date formats) to $+15$ minutes conceals severe chronological corruption. The system must expose structured flags `isInvertedSchedule: boolean` and log diagnostic warnings.

### L02: Type-System Soundness & Invariant Enforcement
- **Target 1 (`providerRights.ts`)**: Look at `getSafeProviderRights(providerId: string)` (`src/domain/farely/providerRights.ts#L276-L278`):
  ```ts
  export function getSafeProviderRights(providerId: string): ProviderSourceRights {
    const existing = PROVIDER_SOURCE_RIGHTS_REGISTRY[providerId];
    if (existing) return existing;
  ```
  `PROVIDER_SOURCE_RIGHTS_REGISTRY` keys are stored in lowercase (`vietjet_direct`, `vietnam_airlines`, etc.). While `getProviderSourceRights` executes `providerId.trim().toLowerCase()`, `getSafeProviderRights` performs a direct un-normalized index lookup `PROVIDER_SOURCE_RIGHTS_REGISTRY[providerId]`! As a result, calling `getSafeProviderRights('VIETJET_DIRECT')` or `getSafeProviderRights('  vietjet_direct  ')` returns the fallback `RESTRICTED` dummy object! This is an egregious type-normalization asymmetry. Furthermore, if `providerId` is null, undefined, or empty, `getProviderSourceRights` crashes with `TypeError: Cannot read properties of undefined (reading 'trim')`.
- **Target 2 (`directAffiliateComparison.ts`)**: `affiliateCommissionRatePercent` is defined as optional `number` on `ProviderQuoteInput`. If a commercial payload injects `NaN`, `Infinity`, or negative commission percentages (e.g., `-5.0%`), the interface allows it through unvalidated.
- **Target 3 (`airportAlternatives.ts`)**: In `GROUND_TRANSFER_CATALOG` (`src/domain/farely/airportAlternatives.ts#L22-L170`), `distanceKm`, `typicalMinutes`, and `estimatedCostVND` must be non-negative integers. `evaluateAlternativeAirportSavings` accepts `surfaceTransitCost` and `transferMinutes`, but lacks runtime validation against non-finite or `NaN` inputs.

### L03: Epistemic Sincerity & Anti-Hallucination
- **Target 1 (`providerRights.ts`)**: `amadeus_commercial_gds` and `sabre_enterprise_feed` are labeled with `canRedistributeB2B: true`, but have `declarationStatus: 'COMMERCIAL_STAGED_CONTRACT_REQUIRED'`. In `hasB2BRedistributionRights(providerId, options)` (`src/domain/farely/providerRights.ts#L169-L179`), if `options.requireExecutedContract` is not explicitly set to `true`, the function returns `true` for staged contracts! This risks misrepresenting architectural stubs as live commercial rights (violating AUD-08 and NEG-24). The default must be secure-by-default: require executed contracts unless explicitly bypassed.
- **Target 2 (`directAffiliateComparison.ts`)**: `assertCommercialRankingIntegrity` verifies that the promoted provider's total cost is not greater than the minimum cost. However, if an affiliate aggregator and a direct airline have the exact same price (e.g. 1,500,000 VND), and the affiliate aggregator is promoted as the primary recommendation without disclosing commercial sponsorship, this deceives consumers. F43 strictly mandates that direct airline options retain tie-breaking priority unless commercial disclosures are explicitly flagged.
- **Target 3 (`airportAlternatives.ts`)**: `findGroundTransfer` only contains 6 international pairs and 2 domestic pairs. The regional route between Hanoi (`HAN`) and Van Don International Airport (`VDO`) in Quang Ninh is a high-volume secondary gateway, yet it is uncataloged and falls back to heuristic algorithms without ground truth calibration.

### L04: State Space Completeness & Boundary Values
- **Target 1 (`providerRights.ts`)**: What if `providerIds` passed to `validateB2BRedistributionScope` contains duplicates, empty strings, or whitespaces? Lines 193-195 handle deduplication, but `hasB2BRedistributionRights` and `isProviderQueryPermitted` do not sanitize input strings before querying.
- **Target 2 (`directAffiliateComparison.ts`)**: `stalenessMinutes` calculation (`src/domain/farely/directAffiliateComparison.ts#L149-L152`):
  ```ts
  const stalenessMinutes = Math.max(0, Math.round((nowMs - new Date(q.observedAt).getTime()) / (1000 * 60)));
  ```
  If `q.observedAt` is malformed (e.g. `"2026-13-45"`), `new Date(q.observedAt).getTime()` evaluates to `NaN`. `Math.max(0, NaN)` returns `NaN`. Downstream sorting or UI display will render `NaN phút trước`, breaking serialization.
- **Target 3 (`airportAlternatives.ts`)**: In `evaluateAirportAlternative`, if `baselinePrice === alternativePrice`, `airFareSavingsVND === 0`. The net savings is negative due to ground transfer cost. The tradeoff explanation should cleanly state that the fares are identical and traveling to an alternative airport incurs pure ground transfer loss.

### L05: Concurrency, Latency & Async Safety
- **Target 1 (`providerRights.ts`)**: The registry `PROVIDER_SOURCE_RIGHTS_REGISTRY` is currently a mutable exported object. If any runtime worker mutates `PROVIDER_SOURCE_RIGHTS_REGISTRY.vietjet_direct.canRedistributeB2B = true`, all concurrent evaluations in the Node.js event loop are compromised. It must be frozen via `Object.freeze` with deep immutability.
- **Target 2 (`directAffiliateComparison.ts`)**: Quote comparison must be completely synchronous and side-effect free. Deterministic sorting must have a total ordering that never varies between V8 engine runs.
- **Target 3 (`airportAlternatives.ts`)**: Timezone offset calculation currently uses `new Date(date.toLocaleString('en-US', { timeZone: timezone }))`. Under high concurrency, invoking `toLocaleString` hundreds of times per second in high-throughput route scans can generate unnecessary GC pressure.

### L06: Adversarial Robustness & Negative Vector Defense
- **Target 1 (`providerRights.ts`)**:
  - `NEG-24`: Staged GDS contract appears to grant B2B rights. Defended by enforcing `requireExecutedContract: true` by default or requiring explicit execution confirmation.
  - `NEG-38`: Unlicensed background scan continues. Defended by rejecting `canScrape: false` providers from automated ingestion pipelines.
- **Target 2 (`directAffiliateComparison.ts`)**:
  - `NEG-04`: Unknown mandatory fee becomes 0. Defended by verifying `mandatoryTaxesAndFeesVND` is finite and non-negative.
  - `NEG-05`: Unknown baggage becomes free/included. Defended by verifying `checkedBaggageFeeVND` when `requiresCheckedBaggage` is true.
  - Deep-link sanitization: If `deepLinkUrl` contains `javascript:`, `data:`, or malformed URLs, it represents an injection vector. Deep links must strictly match `^https?://`.
- **Target 3 (`airportAlternatives.ts`)**:
  - Inverted or negative flight schedules must be detected rather than swallowed by `Math.max(15, ...)`.
  - Discrepancy between `evaluateAirportAlternative` (which allowed arbitrary transfer time as long as savings/hr > 250k) and `evaluateAlternativeAirportSavings` (which caps transfer time at 180 minutes) must be reconciled: alternative travel exceeding 180 minutes must be flagged as `NOT_RECOMMENDED` or `EXCESSIVE_DETOUR`.

### L07: Production Realism & Environmental Fidelity
- **Target 1 (`providerRights.ts`)**: Vietnam domestic market has 5 active carriers: Vietnam Airlines (`VN`), Vietjet Air (`VJ`), Bamboo Airways (`QH`), Vietravel Airlines (`VU`), and Pacific Airlines (`BL`). `PROVIDER_SOURCE_RIGHTS_REGISTRY` lacks entries for `vietravel_airlines` and `pacific_airlines`, causing them to fall back to `RESTRICTED` unknown providers.
- **Target 2 (`directAffiliateComparison.ts`)**: OTA partners commonly introduce booking/processing surcharges during checkout (e.g. payment fees). The model should support an optional `paymentFeeVND` or document total inclusive price guarantees.
- **Target 3 (`airportAlternatives.ts`)**: Van Don International Airport (`VDO`) operates scheduled flights to Ho Chi Minh City (`SGN`) and Da Nang (`DAD`). Travelers in Quang Ninh or eastern Hai Phong frequently compare `HAN` vs `VDO`. Adding verified ground transfer for `HAN <-> VDO` (175 km, 150 min, 280,000 VND) grounds real-world choices for Northern Vietnam.

### L08: Architectural Cohesion & Clean Domain Kernel
- Pure domain files must have 0 external npm dependencies and 0 network/I/O imports.
- `providerRights.ts`, `directAffiliateComparison.ts`, and `airportAlternatives.ts` maintain pure TypeScript domain semantics.

### L09: Regulatory Compliance & Consumer Protection (CAAV, FTC, VN Competition Law)
- Under Vietnam Law on Protection of Consumer Rights (2023) and Decree 52/2013/NĐ-CP on E-Commerce (amended by Decree 85/2021/NĐ-CP):
  - Metasearch and price comparison platforms must transparently disclose whether ranking is influenced by commercial affiliation or advertising fees.
  - Displaying a sponsored OTA as "Cheapest" when an official airline website offers the same or lower total price constitutes deceptive advertising.
  - Hidden fees (mandatory taxes, terminal fees, ticketing charges) must be displayed in total inclusive price format before handoff.

### L10: Observability, Diagnostics & SRE Auditability
- In `providerRights.ts`, rejection reasons must provide structured error codes (e.g. `ERR_UNREGISTERED_PROVIDER`, `ERR_STAGED_CONTRACT_REQUIRED`, `ERR_LICENSE_RESTRICTED`).
- In `directAffiliateComparison.ts`, `DirectAffiliateComparisonResult` must export structured diagnostic telemetry: `cheapestChannelType`, `totalChannelsCompared`, and `isDirectCheaperOrEqual`.
- In `airportAlternatives.ts`, `AirportAlternativeEvaluation` must export `transferFrictionCategory`: `'LOW'` (<60 min), `'MEDIUM'` (60-120 min), `'HIGH'` (120-180 min), `'EXCESSIVE'` (>180 min).

### L11: Zero-Trust Security & Minimal Privilege
- Safe URL parsing: `deepLinkUrl` in `directAffiliateComparison.ts` must be validated using `try { new URL(url) }` to prevent SSRF/XSS vectors.
- Immutability of rights registry prevents malicious prototype poisoning or runtime rights elevation.

### L12: Backward Compatibility & Regression Invariance
- All 11 tests in `providerRights.test.ts`, 7 tests in `directAffiliateComparison.test.ts`, and 12 tests in `airportAlternatives.test.ts` must pass with zero regression.
- API signatures must remain fully backward-compatible while introducing safe, additive properties and stricter validation.

---

### ACTIONABLE RESEARCH SUMMARY & TRANSITION TO PASS R2
Pass R1 establishes the concrete defects across the three modules. In Pass R2, we will initiate rigorous adversarial falsification, challenging any simplistic assumptions and proving the exact code diffs required.
