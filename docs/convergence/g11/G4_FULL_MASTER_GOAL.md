# FARELY CYCLE G89 — MASTER GOAL PASS G4: INTEGRATION COHESION & VERDICT SYNCHRONIZATION
## Target Modules: `src/domain/farely/providerRights.ts`, `src/domain/farely/directAffiliateComparison.ts`, `src/domain/farely/airportAlternatives.ts`
## Epistemic Integrity: Zero-Trust Codebase Telemetry & Adversarial Invariant Auditing

INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION
EXECUTION_RECEIPT_SHA256: e3a560e8bcd4da24e8b174b046c8342bdb4d73fc3f4ee851e75937b4215ba4bf
GIT_HEAD: 142a46c983f510b89afe3e522c2dc699c2667df5
STAGE: MASTER_GOAL_G11
PASS: G4
TIMESTAMP: 2026-10-27T09:47:00Z

---

### FALSIFICATION & AUDIT OF PASS G3 (CRITIQUE OF PRIOR ASSUMPTIONS)

Pass G4 conducts an adversarial audit of Pass G3 across lenses L02, L03, L04, L06, and L10:

1. **Falsification of L03 & L10 Proposal on Explanation Synchronization (`airportAlternatives.ts`)**:
   - *Pass G3 Claim*: "Downgrade verdict to `MARGINAL` if `isVerifiedSource === false`."
   - *Falsification & Code Proof*: In `src/domain/farely/airportAlternatives.ts#L458-L461`, the default positive explanation unconditionally states: `"Lựa chọn này rất đáng cân nhắc"` (This option is highly recommended). If the verdict is downgraded to `'MARGINAL'` because the data source is unverified, but the explanation continues to assert that the option is "highly recommended", this produces an epistemic contradiction! When `isVerifiedSource === false`, the tradeoff explanation must explicitly warn: `"Tiết kiệm thực tế ước tính ... nhưng dựa trên dữ liệu thuật toán chưa được xác minh từ biểu cước công bố. Cần xác minh chi phí thực tế trước khi quyết định đổi sân bay."`

2. **Falsification of L04 & L06 Proposal on OTA-to-OTA Commission Tie-Breaking (`directAffiliateComparison.ts`)**:
   - *Pass G3 Claim*: "Commercial override only applies when displacing a direct airline."
   - *Falsification & Code Proof*: If two OTAs (e.g. `OTA_A` and `OTA_B`) offer identical prices, but `OTA_A` pays 10% commission while `OTA_B` pays 0%, sorting by commission instead of the deterministic alphabetical comparator violates F43. The comparator in lines 198-213 strictly preserves 4-tier sorting (`cost -> channelType -> providerName -> providerId`), completely excluding commission rate from ranking. `assertCommercialRankingIntegrity` must confirm that tie-breaking strictly honors this deterministic comparator and never promotes a higher-commission partner over an identical-cost option.

3. **Falsification of L02 Proposal on Provider Scope Declarations (`providerRights.ts`)**:
   - *Pass G3 Claim*: "Register new airlines without specifying exact scope constants."
   - *Falsification & Code Proof*: New carriers `vietravel_airlines` and `pacific_airlines` must explicitly declare `authorizedScopes: ['CONSUMER_INDICATIVE', 'INTERNAL_ANALYTICS']` as `readonly AuthorizedDataScope[]`. Omitting the explicit tuple typing could allow widened string arrays that fail TypeScript compilation under strict type checking.

---

### CAGED SOLUTION CONTRACTS (LOCKED FOR EXECUTION)

#### 1. SOL-PROVRIGHTS-01: Provider Source Rights Registry Hardening
- **Target File**: `src/domain/farely/providerRights.ts`
- **Target Test File**: `src/domain/farely/providerRights.test.ts`
- **Implementation**:
  - `normalizeProviderId(id: unknown): string`: Strip non-printable Unicode and trim to lowercase, defaulting to `'unknown'`.
  - Deep-freeze `PROVIDER_SOURCE_RIGHTS_REGISTRY` and all returned fallback objects.
  - Register `vietravel_airlines` and `pacific_airlines` with `authorizedScopes: ['CONSUMER_INDICATIVE', 'INTERNAL_ANALYTICS']`.
  - Bounded `cacheTtlSeconds`: $[60, 86400]$ when `canCache === true`; 0 when `canCache === false`.
  - Structured rejection reason codes: `ERR_UNREGISTERED_PROVIDER`, `ERR_COMMERCIAL_CONTRACT_STAGED`, `ERR_UNAUTHORIZED_SCOPE`.

#### 2. SOL-AFFILIATECOMP-01: Direct Airline vs Affiliate Price Normalization & Anti-Override Defense
- **Target File**: `src/domain/farely/directAffiliateComparison.ts`
- **Target Test File**: `src/domain/farely/directAffiliateComparison.test.ts`
- **Implementation**:
  - Deep link validation using native `new URL`, verifying protocol is `http:` or `https:`.
  - Integer normalization for all price inputs and outputs in VND.
  - Validate all-inclusive pricing consistency: `rawQuotedPriceVND >= mandatoryTaxesAndFeesVND + baggage`.
  - Strict commercial override defense: Throw `CommercialRankingOverrideError` if an intermediary (`OTA_PARTNER` or `AFFILIATE_AGGREGATOR`) is prioritized over a `DIRECT_AIRLINE` possessing identical objective lowest cost.

#### 3. SOL-AIRPORTALT-01: Airport Alternatives Friction Calibration & Local Datetime Correctness
- **Target File**: `src/domain/farely/airportAlternatives.ts`
- **Target Test File**: `src/domain/farely/airportAlternatives.test.ts`
- **Implementation**:
  - Add bidirectional symmetric entries `HAN -> VDO` and `VDO -> HAN` to `GROUND_TRANSFER_CATALOG`.
  - Excessive detour defense: `typicalMinutes > 180` forces verdict to `'NOT_RECOMMENDED'`.
  - Unverified source verdict capping at `'MARGINAL'` with calibrated cautionary explanation.
  - Structured flight timing telemetry: `isInvertedSchedule: boolean` and `rawElapsedMinutes: number`.

---

### ADVERSARIAL AUDIT ACROSS ALL 12 LENSES

- **L01: Mathematical & Algorithmic Rigor**: Bidirectional graph symmetry; integer currency math; bounded detour hours.
- **L02: Type-System Soundness & Invariant Enforcement**: Readonly data scopes; deep-frozen fallback records; native URL parsing.
- **L03: Epistemic Sincerity & Anti-Hallucination**: Calibrated cautionary explanations for unverified heuristic estimates.
- **L04: State Space Completeness & Boundary Values**: Handling of zero detour minutes on identical airports; complete directional graph coverage.
- **L05: Concurrency, Latency & Async Safety**: Deep immutability of registry data across concurrent Node workers.
- **L06: Adversarial Robustness & Negative Vector Defense**: Defends against `NEG-04`, `NEG-05`, `NEG-24`, and URL injection.
- **L07: Production Realism & Environmental Fidelity**: 5 Vietnamese domestic airlines covered with verified highway bus tariffs.
  - **Product Boundary Invariant (Anti-OTA Conflation)**: Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping are strictly boundary_excluded.
- **L08: Architectural Cohesion & Clean Domain Kernel**: Pure TypeScript domain functions with zero external dependencies.
- **L09: Regulatory Compliance & Consumer Protection (CAAV, FTC, VN Competition Law)**: Adherence to CAAV consumer directives and Vietnam Consumer Protection Law.
- **L10: Observability, Diagnostics & SRE Auditability**: Standard diagnostic tags `[dealId=...]`, `[providerId=...]`, structured error codes.
- **L11: Zero-Trust Security & Minimal Privilege**: Deep freeze, safe URL parser, least privilege access scopes.
- **L12: Backward Compatibility & Regression Invariance**: 100% preservation of all 798 tests without regression.

---

### SECTION D: EXECUTION MANDATE
Implement the caged work packages sequentially via ACID task transactions.
