# FARELY CYCLE G89 — MASTER GOAL PASS G3: BIDIRECTIONAL SYMMETRY & SRE DRIFT DEFENSE
## Target Modules: `src/domain/farely/providerRights.ts`, `src/domain/farely/directAffiliateComparison.ts`, `src/domain/farely/airportAlternatives.ts`
## Epistemic Integrity: Zero-Trust Codebase Telemetry & Adversarial Invariant Auditing

INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION
EXECUTION_RECEIPT_SHA256: e3a560e8bcd4da24e8b174b046c8342bdb4d73fc3f4ee851e75937b4215ba4bf
GIT_HEAD: 142a46c983f510b89afe3e522c2dc699c2667df5
STAGE: MASTER_GOAL_G11
PASS: G3
TIMESTAMP: 2026-10-27T09:46:00Z

---

### FALSIFICATION & AUDIT OF PASS G2 (CRITIQUE OF PRIOR ASSUMPTIONS)

Pass G3 conducts an adversarial audit of Pass G2 across lenses L01, L02, L05, L08, and L10:

1. **Falsification of L01 & L08 Proposal on Ground Transfer Directionality (`airportAlternatives.ts`)**:
   - *Pass G2 Claim*: "Add `HAN <-> VDO` as a catalog entry."
   - *Falsification & Code Proof*: In `src/domain/farely/airportAlternatives.ts#L180-L182`, `findGroundTransfer(fromCode, toCode)` looks up exact directed pairs:
     ```ts
     return GROUND_TRANSFER_CATALOG.find((r) => r.originCode === from && r.destinationCode === to);
     ```
     If an executor adds only a single entry with `originCode: 'HAN'` and `destinationCode: 'VDO'`, any caller invoking `findGroundTransfer('VDO', 'HAN')` directly will receive `undefined`! The canonical pattern established by Bangkok (`BKK`/`DMK`), Tokyo (`HND`/`NRT`), and Seoul (`ICN`/`GMP`) in lines 22-85 strictly requires symmetric twin entries: one for `HAN -> VDO` and one for `VDO -> HAN`.

2. **Falsification of L05 Proposal on Deep Freezing Verification (`providerRights.ts`)**:
   - *Pass G2 Claim*: "Deep-freeze registry at export time."
   - *Falsification & Code Proof*: Simply freezing `PROVIDER_SOURCE_RIGHTS_REGISTRY` once does not prevent dynamic queries from receiving mutable objects if `getSafeProviderRights` constructs a fallback object for unknown providers on the fly! The fallback object constructed in lines 279-293 must also be deeply frozen before return, ensuring that callers cannot mutate the fallback object either.

3. **Falsification of L02 & L10 Proposal on Raw Price Integer Normalization (`directAffiliateComparison.ts`)**:
   - *Pass G2 Claim*: "Round calculated components after processing."
   - *Falsification & Code Proof*: If `rawQuotedPriceVND` is a fractional float (e.g. `1,250,000.49₫`), and `mandatoryTaxesAndFeesVND` is `350,000.75₫`, rounding only at the end can produce small intermediate rounding drift. All inputs (`rawQuotedPriceVND`, `mandatoryTaxesAndFeesVND`, `checkedBaggageFeeVND`) must be integer normalized upon ingestion, guaranteeing absolute numeric reproducibility across all downstream calculations.

---

### CAGED SOLUTION CONTRACTS (LOCKED FOR EXECUTION)

#### 1. SOL-PROVRIGHTS-01: Provider Source Rights Registry Hardening
- **Target File**: `src/domain/farely/providerRights.ts`
- **Target Test File**: `src/domain/farely/providerRights.test.ts`
- **Implementation**:
  - `normalizeProviderId(id: unknown): string`: Strip non-printable Unicode and trim to lowercase, defaulting to `'unknown'`.
  - Deep-freeze `PROVIDER_SOURCE_RIGHTS_REGISTRY` and all returned fallback objects.
  - Register `vietravel_airlines` and `pacific_airlines` as `PUBLIC_INDICATIVE`.
  - Bounded `cacheTtlSeconds`: $[60, 86400]$ when `canCache === true`; 0 when `canCache === false`.
  - Structured rejection reason codes: `ERR_UNREGISTERED_PROVIDER`, `ERR_COMMERCIAL_CONTRACT_STAGED`, `ERR_UNAUTHORIZED_SCOPE`.

#### 2. SOL-AFFILIATECOMP-01: Direct Airline vs Affiliate Price Normalization & Anti-Override Defense
- **Target File**: `src/domain/farely/directAffiliateComparison.ts`
- **Target Test File**: `src/domain/farely/directAffiliateComparison.test.ts`
- **Implementation**:
  - Deep link validation using native `new URL`, checking protocol is `http:` or `https:`.
  - Integer normalization for all price inputs and outputs in VND.
  - Validate all-inclusive pricing consistency: `rawQuotedPriceVND >= mandatoryTaxesAndFeesVND + baggage`.
  - Strict commercial override defense: Throw `CommercialRankingOverrideError` if an intermediary (`OTA_PARTNER` or `AFFILIATE_AGGREGATOR`) is prioritized over a `DIRECT_AIRLINE` possessing the identical objective lowest cost.

#### 3. SOL-AIRPORTALT-01: Airport Alternatives Friction Calibration & Local Datetime Correctness
- **Target File**: `src/domain/farely/airportAlternatives.ts`
- **Target Test File**: `src/domain/farely/airportAlternatives.test.ts`
- **Implementation**:
  - Add bidirectional symmetric entries `HAN -> VDO` and `VDO -> HAN` to `GROUND_TRANSFER_CATALOG`.
  - Excessive detour defense: `typicalMinutes > 180` forces verdict to `'NOT_RECOMMENDED'`.
  - Unverified source verdict capping at `'MARGINAL'`.
  - Structured flight timing telemetry: `isInvertedSchedule: boolean` and `rawElapsedMinutes: number`.

---

### ADVERSARIAL AUDIT ACROSS ALL 12 LENSES

- **L01: Mathematical & Algorithmic Rigor**: Symmetrical graph edges; integer VND currency arithmetic; bounded detour hours.
- **L02: Type-System Soundness & Invariant Enforcement**: Deep-frozen fallback records; native URL parsing; Unicode sanitization.
- **L03: Epistemic Sincerity & Anti-Hallucination**: Grounded highway transit schedules for Northeast Vietnam; honest degradation of heuristic models.
- **L04: State Space Completeness & Boundary Values**: Complete directional graph handling; edge cases for zero and negative inputs.
- **L05: Concurrency, Latency & Async Safety**: Absolute immutability of registry data and fallback instances.
- **L06: Adversarial Robustness & Negative Vector Defense**: Defends against `NEG-04`, `NEG-05`, `NEG-24`, and URL injection.
- **L07: Production Realism & Environmental Fidelity**: 5 Vietnamese domestic airlines covered with verified highway bus tariffs.
  - **Product Boundary Invariant (Anti-OTA Conflation)**: Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping are strictly boundary_excluded.
- **L08: Architectural Cohesion & Clean Domain Kernel**: Pure TypeScript domain functions with zero third-party dependencies.
- **L09: Regulatory Compliance & Consumer Protection (CAAV, FTC, VN Competition Law)**: Adherence to CAAV consumer directives and Vietnam Consumer Protection Law.
- **L10: Observability, Diagnostics & SRE Auditability**: Standard diagnostic tags `[dealId=...]`, `[providerId=...]`, structured error codes.
- **L11: Zero-Trust Security & Minimal Privilege**: Deep freeze, safe URL parser, least privilege access scopes.
- **L12: Backward Compatibility & Regression Invariance**: 100% preservation of all 798 tests without regression.

---

### SECTION D: EXECUTION MANDATE
The executor must implement the caged work packages sequentially via ACID task transactions.
