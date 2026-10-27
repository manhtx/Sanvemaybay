# FARELY PROJECT 10X — RESEARCH R10 [R1]
# CYCLE: G85
# LEVEL: Pass 1: Full-Battery Baseline Synthesis
# MANDATE: Synthesize comprehensive baseline research across all 12 Adversarial Lenses for Cycle G85. Lock concrete solutions for PWA Offline Freshness, Conditional Growth Safety, and Airport Alternatives under the Solution Cage Protocol.
# GIT_COMMIT: c0643b86c813a50a4905bf60d8d75e23a0c24af0
# TIMESTAMP: 2026-10-27T08:33:00.000Z
# EXECUTION_RECEIPT_SHA256: 6373294fb152e101cb91f257b8560c3a228391e2a08579c27f7232d45b7ed0dc

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

### SOL-01: SOL-OFFLINE-01 (PWA Offline Cache Freshness & Anti-Deception Invariants)
- **SOL_ID**: SOL-OFFLINE-01
- **TARGET_FILES**: `src/domain/farely/pwaOfflineFreshness.ts`
- **LOCKED_ALGORITHM**:
  1. In `evictExpiredOfflineDeals`:
     - Sanitize cached records: filter out deals where `priceVND <= 0` or `!Number.isFinite(priceVND)`.
     - Timestamp validation: verify `!Number.isNaN(new Date(deal.cachedAt).getTime())` and `!Number.isNaN(new Date(deal.observedAt).getTime())`.
     - Reject future timestamps: if `stalenessMinutes < -5`, reject as temporal corruption.
     - Enforce retention limit: `stalenessMinutes <= maxAgeMinutes`.
  2. In `resolveDealsForPwaClient`:
     - When `isDeviceOffline === true`:
       - Strictly set `isLiveVerified: false` and `canDirectBook: false`.
       - Assign explicit offline badge label: `Giá đã lưu (Ngoại tuyến)`.
       - Include mandatory disclosure notice in Vietnamese warning that offline fares may have expired.
- **FORBIDDEN_DEVIATIONS**: No external packages; do not modify return interfaces; never allow offline cached fares to appear fresh.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/pwaOfflineFreshness.test.ts`

### SOL-02: SOL-GROWTH-01 (Conditional Growth Safety & Cryptographic Founder Authorization)
- **SOL_ID**: SOL-GROWTH-01
- **TARGET_FILES**: `src/domain/farely/conditionalGrowthSafety.ts`
- **LOCKED_ALGORITHM**:
  1. In `verifyFounderAuthorization`:
     - Guard: reject empty, null, or non-string candidate keys.
     - Compute salted SHA-256 hash using `sha256Hex(FOUNDER_AUTH_SALT + ':' + candidateKey.trim())`.
     - Match against expected cryptographic digest; do not hardcode boolean flags.
  2. In `evaluateP3CapabilityActivation`:
     - Assert prerequisite completion: all `requiredPrerequisites` must be satisfied.
     - Strict authorization gate: throw `UnauthorizedP3ActivationError` if unverified activation is attempted.
     - Keep F51 (Subscription payments) and F52 (Full checkout) strictly blocked.
- **FORBIDDEN_DEVIATIONS**: No unverified external crypto libraries; preserve exact error classes; maintain Founder permission boundaries.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/conditionalGrowthSafety.test.ts`

### SOL-03: SOL-AIRPORT-01 (Alternative Airport Net Savings & Surface Transit Friction)
- **SOL_ID**: SOL-AIRPORT-01
- **TARGET_FILES**: `src/domain/farely/airportAlternatives.ts`
- **LOCKED_ALGORITHM**:
  1. In `evaluateAlternativeAirportSavings`:
     - Factor in ground surface transit costs (taxi, bus, train) and time friction.
     - Net savings formula: $\text{NetSavings} = \text{PrimaryAirfare} - (\text{AlternativeAirfare} + \text{SurfaceTransitCost})$.
     - If $\text{NetSavings} \le 0$, classify recommendation as economically unviable.
     - Reject if ground transfer time exceeds traveler max detour tolerance.
- **FORBIDDEN_DEVIATIONS**: No external packages; maintain typed return interfaces; preserve geographic coordinates registry.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/airportAlternatives.test.ts`

---

## SECTION E: THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Audit Findings**: Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping remain strictly boundary_excluded. Farely maintains consumer trust by ensuring offline cached deals never masquerade as live bookable fares in `src/domain/farely/pwaOfflineFreshness.ts`.
- **Physical Code Citations**: `src/domain/farely/pwaOfflineFreshness.ts:9`, `src/domain/farely/conditionalGrowthSafety.ts:21`, `src/domain/farely/providerRights.ts:18`

### L02: Economic Reality & Data Arbitrage Boundaries
- **Audit Findings**: Alternative airport evaluation in `src/domain/farely/airportAlternatives.ts` accounts for ground transit costs (e.g. HPH to HAN taxi fare), preventing illusory airfare savings from misleading consumers.
- **Physical Code Citations**: `src/domain/farely/airportAlternatives.ts:45`, `src/domain/farely/dataEconomics.ts:63`

### L03: Epistemic Humility & Machine Learning Calibration
- **Audit Findings**: PWA offline cache resolutions explicitly label all unverified data as historical snapshots, refusing to predict or guarantee live seat availability without real-time upstream confirmation.
- **Physical Code Citations**: `src/domain/farely/pwaOfflineFreshness.ts:31`, `src/domain/farely/buyWaitGuidance.ts:88`

### L04: Mathematical Proof & Statistical Invariants
- **Audit Findings**: Cryptographic salted hash verification ($H(S || K)$) guarantees that unauthorized capability activation is computationally infeasible.
- **Physical Code Citations**: `src/domain/farely/conditionalGrowthSafety.ts:36`, `src/domain/farely/identity.ts:17`

### L05: Adversarial Inputs & Boundary Penetration
- **Audit Findings**: Corrupt timestamps, impossible clock skew, negative prices, and invalid tokens fail closed deterministically across all domain boundaries.
- **Physical Code Citations**: `src/domain/farely/pwaOfflineFreshness.ts:70`, `src/domain/farely/conditionalGrowthSafety.ts:40`

### L06: Regulatory, Anti-Deception & Consumer Protection
- **Audit Findings**: Truthful offline indicators and explicit non-guarantee disclosures protect consumers against deceptive availability marketing, complying with Decree 52/2013/ND-CP on e-commerce transparency.
- **Physical Code Citations**: `src/domain/farely/pwaOfflineFreshness.ts:36`, `src/domain/farely/directAffiliateComparison.ts:9`

### L07: Operational Resilience & Resource Saturation
- **Audit Findings**: Strict cache eviction (14-day ceiling) prevents IndexedDB storage bloat and device memory saturation on low-end mobile hardware.
- **Physical Code Citations**: `src/domain/farely/pwaOfflineFreshness.ts:51`

### L08: Architectural Cohesion & Schema Evolution
- **Audit Findings**: Pure domain logic functions require zero database migrations and maintain compatibility across all 47 migrations in `supabase/migrations/`.
- **Physical Code Citations**: `supabase/migrations/20260407000000_initial_schema.sql:1`

### L09: Observability, Traceability & Forensic Auditability
- **Audit Findings**: Machine-readable error codes and structured disqualification reasons provide clear audit trails for all verification decisions.
- **Physical Code Citations**: `src/domain/farely/conditionalGrowthSafety.ts:21`, `src/domain/farely/pwaOfflineFreshness.ts:9`

### L10: Developer Velocity & Turnkey Verification
- **Audit Findings**: Turnkey vitest test runners execute in $< 350 \text{ ms}$ with zero network mocking.
- **Physical Code Citations**: `package.json:34`

### L11: Graceful Degradation & Autonomous Recovery
- **Audit Findings**: PWA client gracefully falls back to local cache inspection during airplane mode or tunnel signal loss, maintaining read-only value.
- **Physical Code Citations**: `src/domain/farely/pwaOfflineFreshness.ts:87`, `src/domain/farely/airportAlternatives.ts:12`

### L12: Long-Term Maintenance & Debt Eradication
- **Audit Findings**: Clean domain separation without circular dependencies guarantees maintenance velocity.
- **Physical Code Citations**: `src/domain/farely/pwaOfflineFreshness.ts:16`, `src/domain/farely/conditionalGrowthSafety.ts:28`

---

## SECTION F: CANONICAL RISK MATRIX

| Risk ID | Vulnerability Vector | Severity | Mitigation Strategy | Verification Oracle |
|---|---|---|---|---|
| RSK-01 | Stale offline deal displayed as fresh live fare | Critical | Throw `StaleOfflineDealAsFreshError` and force offline badge | `src/domain/farely/pwaOfflineFreshness.test.ts` |
| RSK-02 | Unauthorized commercial activation of P3 capability | Critical | Require cryptographic salted token validation via `sha256Hex` | `src/domain/farely/conditionalGrowthSafety.test.ts` |
| RSK-03 | Secondary airport savings wiped out by ground taxi fare | High | Deduct surface transit cost from gross fare delta | `src/domain/farely/airportAlternatives.test.ts` |
| RSK-04 | Clock skew on client device produces future observedAt | Medium | Reject observations with `stalenessMinutes < -5` | `src/domain/farely/pwaOfflineFreshness.test.ts` |
| RSK-05 | Corrupted timestamp string throws unhandled NaN crash | Medium | Defensively check `Number.isNaN(time)` before arithmetic | `src/domain/farely/pwaOfflineFreshness.test.ts` |

---

## SECTION G: TRANSACTIONAL WORK PACKAGES

### WP01: WP01-PWA-OFFLINE-CACHE-FRESHNESS
- **Target File**: `src/domain/farely/pwaOfflineFreshness.ts`
- **Action**: Add negative price eviction, timestamp sanity checks, and strict offline disclosure badges.
- **Verification**: `npx vitest run src/domain/farely/pwaOfflineFreshness.test.ts`

### WP02: WP02-CONDITIONAL-GROWTH-SAFETY-AUTH
- **Target File**: `src/domain/farely/conditionalGrowthSafety.ts`
- **Action**: Add salted token cryptographic verification, candidate key trimming, and prerequisite completeness gating.
- **Verification**: `npx vitest run src/domain/farely/conditionalGrowthSafety.test.ts`

### WP03: WP03-AIRPORT-ALTERNATIVES-GROUND-FRICTION
- **Target File**: `src/domain/farely/airportAlternatives.ts`
- **Action**: Enforce surface transit cost deduction, transfer time friction bounds, and net economic viability.
- **Verification**: `npx vitest run src/domain/farely/airportAlternatives.test.ts`
