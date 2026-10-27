# FARELY CYCLE G89 — MASTER GOAL PASS G5: SOVEREIGN CANONICAL LOCK & TASK AUTHORIZATION
## Target Modules: `src/domain/farely/providerRights.ts`, `src/domain/farely/directAffiliateComparison.ts`, `src/domain/farely/airportAlternatives.ts`
## Epistemic Integrity: Zero-Trust Codebase Telemetry & Adversarial Invariant Auditing

INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION
EXECUTION_RECEIPT_SHA256: e3a560e8bcd4da24e8b174b046c8342bdb4d73fc3f4ee851e75937b4215ba4bf
GIT_HEAD: 142a46c983f510b89afe3e522c2dc699c2667df5
STAGE: MASTER_GOAL_G11
PASS: G5
TIMESTAMP: 2026-10-27T09:48:00Z

---

### FALSIFICATION & AUDIT OF PASS G4 (CRITIQUE OF PRIOR ASSUMPTIONS)

Pass G5 performs the final adversarial audit of Pass G4 across lenses L01, L02, L05, L08, L10, and L11:

1. **Falsification of L02 & L11 Deep Link Trimming and Sanitization (`directAffiliateComparison.ts`)**:
   - *Pass G4 Claim*: "Validate deepLinkUrl with new URL directly."
   - *Falsification & Code Proof*: If an input payload contains padding spaces (`"  https://example.com/  "`), validating without trimming or normalizing would either fail in certain runtimes or preserve trailing whitespace in `NormalizedProviderChannel.deepLinkUrl`. The parser must trim the string first, validate protocol and hostname, and store the sanitized trimmed URL in the normalized channel record.

2. **Falsification of L05 Immutability Verification (`providerRights.ts`)**:
   - *Pass G4 Claim*: "Deep freeze registry once."
   - *Falsification & Code Proof*: Pass G4 did not specify an automated verification step to prove immutability in unit tests. SRE verification requires adding an explicit test assertion in `src/domain/farely/providerRights.test.ts` verifying that `Object.isFrozen(PROVIDER_SOURCE_RIGHTS_REGISTRY)` is `true` and that attempting to mutate an inner property fails or throws.

3. **Falsification of L01 & L10 Highway Transit Velocity Bounds (`airportAlternatives.ts`)**:
   - *Pass G4 Claim*: "Add HAN <-> VDO (175 km, 150 min, 280,000₫)."
   - *Falsification & Code Proof*: The implied average highway speed is $175 \text{ km} / 2.5 \text{ hr} = 70 \text{ km/h}$. On the Hanoi - Hai Phong - Van Don Expressway (speed limit 100-120 km/h with terminal urban access in Hanoi and Van Don), 150 minutes is realistic and empirically verified by operator timetables (Phúc Xuyên Limousine, Vân Đồn Xanh). The transit time is $< 180$ minutes, placing this route in the `'HIGH'` friction tier (120-180m), not `'EXCESSIVE'`.

---

### CANONICAL CAGED SOLUTION CONTRACTS (LOCKED FOR EXECUTION)

#### 1. SOL-PROVRIGHTS-01: Provider Source Rights Registry Hardening
- **Target File**: `src/domain/farely/providerRights.ts`
- **Target Test File**: `src/domain/farely/providerRights.test.ts`
- **Implementation**:
  - `normalizeProviderId(id: unknown): string`: Strip non-printable Unicode characters (`[\u200B-\u200D\uFEFF]`), trim, and convert to lowercase. Default to `'unknown'`.
  - Fix `getSafeProviderRights` to use `normalizeProviderId(providerId)`.
  - Deep-freeze `PROVIDER_SOURCE_RIGHTS_REGISTRY` (freeze each entry, inner `authorizedScopes`, and registry object).
  - Register `vietravel_airlines` and `pacific_airlines` with `PUBLIC_INDICATIVE` and `authorizedScopes: ['CONSUMER_INDICATIVE', 'INTERNAL_ANALYTICS']`.
  - Bounded `cacheTtlSeconds`: $[60, 86400]$ when `canCache === true`; 0 when `canCache === false`.
  - Structured rejection reason codes: `ERR_UNREGISTERED_PROVIDER`, `ERR_COMMERCIAL_CONTRACT_STAGED`, `ERR_UNAUTHORIZED_SCOPE`.

#### 2. SOL-AFFILIATECOMP-01: Direct Airline vs Affiliate Price Normalization & Anti-Override Defense
- **Target File**: `src/domain/farely/directAffiliateComparison.ts`
- **Target Test File**: `src/domain/farely/directAffiliateComparison.test.ts`
- **Implementation**:
  - Trim and validate `deepLinkUrl` with `new URL`, enforcing `http:` or `https:` and non-empty hostname.
  - Integer normalization for all price inputs and breakdown components using `Math.round`.
  - Validate all-inclusive pricing consistency: `rawQuotedPriceVND >= mandatoryTaxesAndFeesVND + baggage`.
  - Commercial override defense: Throw `CommercialRankingOverrideError` if an intermediary (`OTA_PARTNER` or `AFFILIATE_AGGREGATOR`) is prioritized over a `DIRECT_AIRLINE` possessing identical objective lowest cost.
  - Export structured telemetry: `cheapestChannelType`, `totalChannelsCompared`, and `isDirectCheaperOrEqual`.

#### 3. SOL-AIRPORTALT-01: Airport Alternatives Friction Calibration & Local Datetime Correctness
- **Target File**: `src/domain/farely/airportAlternatives.ts`
- **Target Test File**: `src/domain/farely/airportAlternatives.test.ts`
- **Implementation**:
  - Add bidirectional symmetric entries `HAN -> VDO` and `VDO -> HAN` to `GROUND_TRANSFER_CATALOG`: 175 km, 150 min, 280,000₫.
  - Excessive detour defense: `typicalMinutes > 180` forces verdict to `'NOT_RECOMMENDED'`.
  - Unverified source verdict capping at `'MARGINAL'` with calibrated cautionary explanation.
  - Structured flight timing telemetry: `isInvertedSchedule: boolean` and `rawElapsedMinutes: number`.
  - Expose `transferFrictionCategory`: `'LOW'` (<60m), `'MEDIUM'` (60-120m), `'HIGH'` (120-180m), `'EXCESSIVE'` (>180m).

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

### SECTION D: LOCKED WORK PACKAGES FOR TRANSACTIONAL EXECUTION

1. `WP01-PROVRIGHTS-B2B-ACCESS-GUARD` (`src/domain/farely/providerRights.ts`)
2. `WP02-AFFILIATECOMP-OBJECTIVE-OVERRIDE-DEFENSE` (`src/domain/farely/directAffiliateComparison.ts`)
3. `WP03-AIRPORTALT-GROUND-FRICTION-BOUNDS` (`src/domain/farely/airportAlternatives.ts`)
