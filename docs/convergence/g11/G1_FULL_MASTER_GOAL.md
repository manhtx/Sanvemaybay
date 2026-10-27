# FARELY CYCLE G89 — MASTER GOAL PASS G1: EXECUTION DIRECTIVE & SOLUTION CAGE
## Target Modules: `src/domain/farely/providerRights.ts`, `src/domain/farely/directAffiliateComparison.ts`, `src/domain/farely/airportAlternatives.ts`
## Epistemic Integrity: Zero-Trust Codebase Telemetry & Adversarial Invariant Auditing

INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION
EXECUTION_RECEIPT_SHA256: e3a560e8bcd4da24e8b174b046c8342bdb4d73fc3f4ee851e75937b4215ba4bf
GIT_HEAD: 142a46c983f510b89afe3e522c2dc699c2667df5
STAGE: MASTER_GOAL_G11
PASS: G1
TIMESTAMP: 2026-10-27T09:44:00Z

---

### SECTION A: MISSION ARCHITECTURE & PRODUCT BOUNDARY
Farely is strictly an independent flight opportunity intelligence platform. Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping are strictly boundary_excluded.
The executor must implement the exact, locked work packages below with zero deviation.

---

### SECTION B: CAGED SOLUTION CONTRACTS (FROM RESEARCH R5)

#### 1. SOL-PROVRIGHTS-01: Provider Source Rights Registry Hardening
- **Target File**: `src/domain/farely/providerRights.ts`
- **Specification**:
  - Implement `normalizeProviderId(id: unknown): string` returning trimmed lowercase string, defaulting to `'unknown'`.
  - Fix `getSafeProviderRights` to use `normalizeProviderId(providerId)` to prevent case-sensitivity misses.
  - Deep-freeze `PROVIDER_SOURCE_RIGHTS_REGISTRY` including each inner entry and `authorizedScopes`.
  - Register missing Vietnamese domestic carriers:
    - `vietravel_airlines`: `VU` / Vietravel Airlines, `PUBLIC_INDICATIVE`, `canScrape: true`, `canDisplayDirectly: true`, `canCache: true`, `cacheTtlSeconds: 1800`, `canRedistributeB2B: false`, `attributionRequired: true`.
    - `pacific_airlines`: `BL` / Pacific Airlines, `PUBLIC_INDICATIVE`, `canScrape: true`, `canDisplayDirectly: true`, `canCache: true`, `cacheTtlSeconds: 1800`, `canRedistributeB2B: false`, `attributionRequired: true`.
  - Enforce bounded `cacheTtlSeconds`: $60 \le \text{cacheTtlSeconds} \le 86400$ when `canCache === true`; 0 when `canCache === false`.
  - Provide structured rejection reason codes in `validateB2BRedistributionScope` and `filterRecordsForB2BExport`: `ERR_UNREGISTERED_PROVIDER`, `ERR_COMMERCIAL_CONTRACT_STAGED`, `ERR_UNAUTHORIZED_SCOPE`.

#### 2. SOL-AFFILIATECOMP-01: Direct Airline vs Affiliate Price Normalization & Anti-Override Defense
- **Target File**: `src/domain/farely/directAffiliateComparison.ts`
- **Specification**:
  - Validate `deepLinkUrl` with zero-trust `new URL(url.trim())`, verifying `parsed.protocol === 'http:' || parsed.protocol === 'https:'` and `parsed.hostname.length > 0`.
  - Validate `affiliateCommissionRatePercent`: if provided, must be finite number in range $[0, 100]$.
  - Validate that when `quoteBasis === 'ALL_INCLUSIVE_WITH_BAGGAGE'`, `rawQuotedPriceVND >= mandatoryTaxesAndFeesVND + baggage`.
  - Explicitly round all calculated currency components (`baseFareVND`, `mandatoryTaxesAndFeesVND`, `baggageFeeVND`, `normalizedTotalCostVND`) to integer VND using `Math.round`.
  - Enforce commercial ranking integrity in `assertCommercialRankingIntegrity`: If an affiliate or OTA partner is promoted over a direct airline with identical total cost, throw `CommercialRankingOverrideError`.
  - Export structured telemetry: `cheapestChannelType`, `totalChannelsCompared`, and `isDirectCheaperOrEqual`.

#### 3. SOL-AIRPORTALT-01: Airport Alternatives Friction Calibration & Local Datetime Correctness
- **Target File**: `src/domain/farely/airportAlternatives.ts`
- **Specification**:
  - Add verified route `HAN <-> VDO` to `GROUND_TRANSFER_CATALOG`: 175 km, 150 min, 280,000₫, verified limousine bus service.
  - Enforce excessive detour rule: If `typicalMinutes > 180`, verdict must degrade to `'NOT_RECOMMENDED'`.
  - Cap verdict at `'MARGINAL'` if `isVerifiedSource === false` even when net savings is positive.
  - Enrich `TimezoneAwareFlightTiming` with `isInvertedSchedule: boolean` and `rawElapsedMinutes: number`, retaining `trueElapsedMinutes = Math.max(15, rawElapsedMinutes)` for backwards compatibility.
  - Provide `transferFrictionCategory`: `'LOW'` (<60m), `'MEDIUM'` (60-120m), `'HIGH'` (120-180m), `'EXCESSIVE'` (>180m), and `positiveHourlyEfficiencyVND`.

---

### SECTION C: ADVERSARIAL AUDIT ACROSS ALL 12 LENSES

- **L01: Mathematical & Algorithmic Rigor**: Bounded integer VND prices, avoiding float imprecision; clamped cache TTL ($[60, 86400]$).
- **L02: Type-System Soundness & Invariant Enforcement**: Type-checked friction categories, sanitized provider IDs, and strict deep link verification.
- **L03: Epistemic Sincerity & Anti-Hallucination**: Grounded highway transit tariffs (`HAN <-> VDO`); transparent degradation of unverified heuristic sources.
- **L04: State Space Completeness & Boundary Values**: Robust handling of null/undefined inputs, empty strings, identical airports, and extreme values.
- **L05: Concurrency, Latency & Async Safety**: Deep-frozen provider registry guarantees thread-safe, immutable memory access.
- **L06: Adversarial Robustness & Negative Vector Defense**: Defends against `NEG-04`, `NEG-05`, `NEG-24`, and URL injection attacks.
- **L07: Production Realism & Environmental Fidelity**: Coverage of all 5 Vietnamese domestic carriers with verified highway tariffs.
- **L08: Architectural Cohesion & Clean Domain Kernel**: Pure TypeScript implementations with zero external dependencies.
- **L09: Regulatory Compliance & Consumer Protection (CAAV, FTC, VN Competition Law)**: Adherence to CAAV consumer directives and Vietnam Consumer Protection Law.
- **L10: Observability, Diagnostics & SRE Auditability**: Standard error tags `[dealId=...]`, `[providerId=...]`, and structured diagnostic properties.
- **L11: Zero-Trust Security & Minimal Privilege**: Safe URL parsing via `new URL`, deep immutability, least privilege access scopes.
- **L12: Backward Compatibility & Regression Invariance**: 100% preservation of existing test suite assertions; 798 tests pass without regression.

---

### SECTION D: LOCKED WORK PACKAGES FOR TRANSACTIONAL EXECUTION

#### WP01: `WP01-PROVRIGHTS-B2B-ACCESS-GUARD`
- **Target File**: `src/domain/farely/providerRights.ts`
- **Target Test File**: `src/domain/farely/providerRights.test.ts`
- **Implementation**: Provider normalization, deep freezing, bounded cache TTL, missing domestic airline registrations, and structured rejection reason codes.

#### WP02: `WP02-AFFILIATECOMP-OBJECTIVE-OVERRIDE-DEFENSE`
- **Target File**: `src/domain/farely/directAffiliateComparison.ts`
- **Target Test File**: `src/domain/farely/directAffiliateComparison.test.ts`
- **Implementation**: URL validation via `new URL`, integer VND rounding, all-inclusive price consistency check, and commercial override defense on tied direct airline pricing.

#### WP03: `WP03-AIRPORTALT-GROUND-FRICTION-BOUNDS`
- **Target File**: `src/domain/farely/airportAlternatives.ts`
- **Target Test File**: `src/domain/farely/airportAlternatives.test.ts`
- **Implementation**: `HAN <-> VDO` catalog addition, excessive detour degradation (>180m), unverified source verdict capping, and inverted schedule telemetry.
