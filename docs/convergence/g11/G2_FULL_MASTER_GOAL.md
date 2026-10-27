# FARELY CYCLE G89 — MASTER GOAL PASS G2: ADVERSARIAL SKEPTICISM & CAGE CALIBRATION
## Target Modules: `src/domain/farely/providerRights.ts`, `src/domain/farely/directAffiliateComparison.ts`, `src/domain/farely/airportAlternatives.ts`
## Epistemic Integrity: Zero-Trust Codebase Telemetry & Adversarial Invariant Auditing

INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION
EXECUTION_RECEIPT_SHA256: e3a560e8bcd4da24e8b174b046c8342bdb4d73fc3f4ee851e75937b4215ba4bf
GIT_HEAD: 142a46c983f510b89afe3e522c2dc699c2667df5
STAGE: MASTER_GOAL_G11
PASS: G2
TIMESTAMP: 2026-10-27T09:45:00Z

---

### FALSIFICATION & AUDIT OF PASS G1 (CRITIQUE OF PRIOR ASSUMPTIONS)

Pass G2 conducts an adversarial audit of Pass G1 across lenses L01, L02, L04, L06, and L10:

1. **Falsification of L04 & L06 Proposal on Commercial Ranking Override Trigger (`directAffiliateComparison.ts`)**:
   - *Pass G1 Claim*: "If a partner is promoted over a direct airline with identical total cost, throw `CommercialRankingOverrideError`."
   - *Falsification & Code Proof*: Pass G1's phrasing was overly broad. If two *direct airlines* (e.g. `vna_direct` and `vietjet_direct`) both offer identical 1,500,000₫ fares, promoting one direct carrier over another based on secondary criteria (e.g. flight departure time or alphabetical name) is NOT a commercial affiliate override violation! The strict condition under F43 mandates that `CommercialRankingOverrideError` triggers ONLY when a promoted `channelType` is an intermediary (`OTA_PARTNER` or `AFFILIATE_AGGREGATOR`) that has displaced an official `DIRECT_AIRLINE` achieving the exact identical objective cheapest total cost.

2. **Falsification of L02 Proposal on Provider ID Sanitization (`providerRights.ts`)**:
   - *Pass G1 Claim*: "Use `id.trim().toLowerCase()` defaulting to `'unknown'`."
   - *Falsification & Code Proof*: Standard `trim()` does not remove zero-width non-breaking spaces (`\uFEFF`, `\u200B`) that can sneak into raw string inputs from external scrapers or XML parsers. The sanitizer must strip non-printable Unicode characters: `id.replace(/[\u200B-\u200D\uFEFF]/g, '').trim().toLowerCase()`. If the resulting string is empty, it must default to `'unknown'`.

3. **Falsification of L01 & L10 Proposal on Ground Transfer Fallback Minutes (`airportAlternatives.ts`)**:
   - *Pass G1 Claim*: "Fallback to 60 minutes if `typicalMinutes <= 0`."
   - *Falsification & Code Proof*: When `baselineAirportCode === alternativeAirportCode`, `typicalMinutes` is legitimately 0. Forcing a 60-minute fallback would incorrectly claim that transferring between identical airports takes 1 hour! The 60-minute fallback must apply strictly when airports are distinct (`baseCode !== altCode`) and transit minutes are non-positive or uncataloged.

---

### CAGED SOLUTION CONTRACTS (LOCKED FOR EXECUTION)

#### 1. SOL-PROVRIGHTS-01: Provider Source Rights Registry Hardening
- **Target File**: `src/domain/farely/providerRights.ts`
- **Target Test File**: `src/domain/farely/providerRights.test.ts`
- **Implementation**:
  - `normalizeProviderId(id: unknown): string` stripping zero-width spaces and trimming to lowercase.
  - Deep-freeze `PROVIDER_SOURCE_RIGHTS_REGISTRY` including each inner entry and `authorizedScopes`.
  - Register `vietravel_airlines` and `pacific_airlines` as `PUBLIC_INDICATIVE`.
  - Enforce bounded `cacheTtlSeconds`: $[60, 86400]$ when `canCache === true`; 0 when `canCache === false`.
  - Structured rejection reason codes: `ERR_UNREGISTERED_PROVIDER`, `ERR_COMMERCIAL_CONTRACT_STAGED`, `ERR_UNAUTHORIZED_SCOPE`.

#### 2. SOL-AFFILIATECOMP-01: Direct Airline vs Affiliate Price Normalization & Anti-Override Defense
- **Target File**: `src/domain/farely/directAffiliateComparison.ts`
- **Target Test File**: `src/domain/farely/directAffiliateComparison.test.ts`
- **Implementation**:
  - Validate `deepLinkUrl` using native `new URL`, verifying protocol is `http:` or `https:`.
  - Validate `affiliateCommissionRatePercent` in $[0, 100]$.
  - Validate all-inclusive pricing: `rawQuotedPriceVND >= mandatoryTaxesAndFeesVND + baggage`.
  - Integer rounding for all currency fields in VND.
  - Precise commercial override trigger in `assertCommercialRankingIntegrity`.

#### 3. SOL-AIRPORTALT-01: Airport Alternatives Friction Calibration & Local Datetime Correctness
- **Target File**: `src/domain/farely/airportAlternatives.ts`
- **Target Test File**: `src/domain/farely/airportAlternatives.test.ts`
- **Implementation**:
  - Add `HAN <-> VDO` to `GROUND_TRANSFER_CATALOG`.
  - Enforce excessive detour rule: `typicalMinutes > 180` degrades to `'NOT_RECOMMENDED'`.
  - Unverified sources capped at `'MARGINAL'`.
  - Expose `isInvertedSchedule: boolean` and `rawElapsedMinutes: number` in `TimezoneAwareFlightTiming`.

---

### ADVERSARIAL AUDIT ACROSS ALL 12 LENSES

- **L01: Mathematical & Algorithmic Rigor**: Integer VND rounding; bounded transfer hours ($[0.25, 12.0]$).
- **L02: Type-System Soundness & Invariant Enforcement**: Zero-width Unicode stripping; strict URL type guard.
- **L03: Epistemic Sincerity & Anti-Hallucination**: Grounded highway transit tariffs; unverified heuristic source verdict capping.
- **L04: State Space Completeness & Boundary Values**: Precise discrimination of identical airports vs distinct metro alternatives.
- **L05: Concurrency, Latency & Async Safety**: Deep immutability of registry data across concurrent Node workers.
- **L06: Adversarial Robustness & Negative Vector Defense**: Defends against `NEG-04`, `NEG-05`, `NEG-24`, and URL injection.
- **L07: Production Realism & Environmental Fidelity**: Complete coverage of 5 Vietnamese domestic carriers.
  - **Product Boundary Invariant (Anti-OTA Conflation)**: Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping are strictly boundary_excluded.
- **L08: Architectural Cohesion & Clean Domain Kernel**: Pure TypeScript implementations with zero third-party dependencies.
- **L09: Regulatory Compliance & Consumer Protection (CAAV, FTC, VN Competition Law)**: Adherence to CAAV consumer directives and Vietnam Consumer Protection Law.
- **L10: Observability, Diagnostics & SRE Auditability**: Standard diagnostic tags `[dealId=...]`, `[providerId=...]`, structured error codes.
- **L11: Zero-Trust Security & Minimal Privilege**: Deep freeze, safe URL parser, least privilege access scopes.
- **L12: Backward Compatibility & Regression Invariance**: 100% preservation of all 798 tests without regression.

---

### SECTION D: EXECUTION MANDATE
No downstream AI or executor is authorized to modify the caged solutions or change the target file architectures.
