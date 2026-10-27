# FARELY CYCLE G89 — RESEARCH PASS R4: PRODUCTION SRE RIGOR & CALIBRATION
## Target Modules: `providerRights.ts`, `directAffiliateComparison.ts`, `airportAlternatives.ts`
## Epistemic Integrity: Zero-Trust Codebase Telemetry & Adversarial Invariant Auditing

EXECUTION_RECEIPT_SHA256: e3a560e8bcd4da24e8b174b046c8342bdb4d73fc3f4ee851e75937b4215ba4bf
GIT_HEAD: 142a46c983f510b89afe3e522c2dc699c2667df5
STAGE: RESEARCH_R10
PASS: R4
TIMESTAMP: 2026-10-27T09:42:00Z

---

### FALSIFICATION & AUDIT OF PASS R3 (CRITIQUE OF PRIOR ASSUMPTIONS)

Pass R4 conducts a rigorous SRE and cryptographic audit of Pass R3, identifying and falsifying three subtle vulnerabilities across lenses L01, L02, L03, L06, and L11:

1. **Falsification of L02 & L11 Deep Link Validation Proposal (`directAffiliateComparison.ts`)**:
   - *Pass R3 Claim*: "Validate deep links using string prefixes `lower.startsWith('http://') || lower.startsWith('https://')`."
   - *Falsification & Code Proof*: Simple string prefix matching does not protect against CRLF injection (`\r\n`), invalid hostnames, userinfo spoofing (e.g. `https://fake-airline.com@malicious-phishing.com/checkout`), or malformed URI components. Node.js and modern browsers provide the native `URL` constructor. A truly secure zero-trust implementation (L11) must parse with `new URL(url.trim())`, verify `parsed.protocol === 'http:' || parsed.protocol === 'https:'`, and verify `parsed.hostname.length > 0`. If parsing throws, it is immediately rejected as an unsafe URL.

2. **Falsification of L01 Integer Currency & Reconciled Sum Math (`directAffiliateComparison.ts`)**:
   - *Pass R3 Claim*: "Check `Math.abs(reconciledSum - totalCost) > 1` on raw numbers."
   - *Falsification & Code Proof*: Vietnamese Dong (VND) is a zero-decimal currency. In real-world provider feeds (e.g. foreign exchange feeds or aggregated OTA quotes), float division or percentage commission calculations produce fractional VND values (e.g. `1,250,450.75₫`). If raw float values are summed, floating-point imprecision (`0.1 + 0.2 !== 0.3`) can trigger false positive mismatch errors. All calculated VND values (`baseFareVND`, `mandatoryTaxesAndFeesVND`, `baggageFeeVND`, `normalizedTotalCostVND`) must be explicitly rounded to integer values using `Math.round(...)` before assertion and storage.

3. **Falsification of L03 & L06 Airport Recommendation on Heuristic Estimates (`airportAlternatives.ts`)**:
   - *Pass R3 Claim*: "Mark alternative as `RECOMMENDED` if net savings $> 0$ and detour $\le 180$ minutes, regardless of source verification."
   - *Falsification & Code Proof*: In `src/domain/farely/airportAlternatives.ts#L412-L425`, uncataloged airport pairs fall back to a heuristic estimate with `isVerifiedSource: false`. If Farely issues a strong `RECOMMENDED` verdict based solely on an unverified algorithmic guess (e.g., assuming a 200,000₫ taxi between two regional airports where actual transit costs 800,000₫), users will suffer unexpected financial losses, destroying platform credibility. Epistemic sincerity (L03) mandates that when `isVerifiedSource === false`, the verdict cannot exceed `'MARGINAL'`, and the explanation must explicitly warn that ground transit costs are unverified estimates.

---

### ADVERSARIAL SYSTEMIC AUDIT ACROSS ALL 12 LENSES

### L01: Mathematical & Algorithmic Rigor
- **Target 1 (`providerRights.ts`)**: Enforce integer cache bounds:
  ```ts
  const boundedTtl = rights.canCache
    ? Math.min(86400, Math.max(60, Math.round(rights.cacheTtlSeconds || 1800)))
    : 0;
  ```
- **Target 2 (`directAffiliateComparison.ts`)**: All VND prices rounded to integer:
  ```ts
  totalCost = Math.round(totalCost);
  baseFare = Math.round(baseFare);
  taxes = Math.round(taxes);
  baggage = Math.round(baggage);
  ```
- **Target 3 (`airportAlternatives.ts`)**: In `evaluateAirportAlternative`, compute:
  ```ts
  const netSavingsVND = Math.round(airFareSavingsVND - transfer.estimatedCostVND);
  const transferHours = Math.max(0.25, safeMinutes / 60);
  const hourlyEfficiencyVND = Math.round(netSavingsVND / transferHours);
  const positiveHourlyEfficiencyVND = Math.max(0, hourlyEfficiencyVND);
  ```

### L02: Type-System Soundness & Invariant Enforcement
- **Target 1 (`providerRights.ts`)**:
  ```ts
  export function normalizeProviderId(id: unknown): string {
    if (typeof id !== 'string') return 'unknown';
    const cleaned = id.trim().toLowerCase();
    return cleaned.length > 0 ? cleaned : 'unknown';
  }
  ```
- **Target 2 (`directAffiliateComparison.ts`)**:
  ```ts
  export function isValidDeepLinkUrl(url: string): boolean {
    try {
      const parsed = new URL(url.trim());
      return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.length > 0;
    } catch {
      return false;
    }
  }
  ```
- **Target 3 (`airportAlternatives.ts`)**: Add explicit enum and type fields:
  ```ts
  export type TransferFrictionCategory = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCESSIVE';
  ```

### L03: Epistemic Sincerity & Anti-Hallucination
- **Target 1 (`providerRights.ts`)**: Register all domestic airlines:
  - `vietravel_airlines`: `VU` / Vietravel Airlines, `PUBLIC_INDICATIVE`, `INTERNAL_DECLARATION`.
  - `pacific_airlines`: `BL` / Pacific Airlines, `PUBLIC_INDICATIVE`, `INTERNAL_DECLARATION`.
- **Target 2 (`directAffiliateComparison.ts`)**: Transparent disclosure of partner commission without compromising objective sorting.
- **Target 3 (`airportAlternatives.ts`)**: Uncataloged pairs with `isVerifiedSource: false` cannot achieve `'RECOMMENDED'`. Add verified route `HAN <-> VDO`.

### L04: State Space Completeness & Boundary Values
- **Target 1 (`providerRights.ts`)**: Sanitized lookup across all entry points. Safe fallback object for unknown providers with `providerId: normalizedId`.
- **Target 2 (`directAffiliateComparison.ts`)**: Handle negative, zero, and extreme values in quotes. Gracefully handle empty quotes array with informative error.
- **Target 3 (`airportAlternatives.ts`)**: Handle identical airport pairs, invalid airport codes, and transit times $> 180$ minutes.

### L05: Concurrency, Latency & Async Safety
- **Target 1 (`providerRights.ts`)**: `Object.freeze(PROVIDER_SOURCE_RIGHTS_REGISTRY)` prevents concurrent mutation.
- **Target 2 (`directAffiliateComparison.ts`)**: Pure synchronous function with deterministic sorting.
- **Target 3 (`airportAlternatives.ts`)**: Instant in-memory catalog lookup with $O(1)$ efficiency.

### L06: Adversarial Robustness & Negative Vector Defense
- **Target 1 (`providerRights.ts`)**:
  - `NEG-24`: Staged contract gate.
  - `NEG-38`: Unlicensed background scan defense.
- **Target 2 (`directAffiliateComparison.ts`)**:
  - `NEG-04` & `NEG-05`: Unknown fees/baggage defense.
  - URL injection defense.
- **Target 3 (`airportAlternatives.ts`)**:
  - Inverted schedule flag: `isInvertedSchedule: boolean`.
  - Excessive detour defense: Detour $> 180$ minutes flagged as `EXCESSIVE` and `NOT_RECOMMENDED`.

### L07: Production Realism & Environmental Fidelity
- **Product Boundary Invariant (Anti-OTA Conflation)**:
  Farely operates purely as flight opportunity intelligence. Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping are strictly boundary_excluded.
- Production-realistic airline names, IATA codes, and highway transfer tariffs in Vietnam.

### L08: Architectural Cohesion & Clean Domain Kernel
- Pure TypeScript domain files with zero external dependencies.

### L09: Regulatory Compliance & Consumer Protection (CAAV, FTC, VN Competition Law)
- Adherence to CAAV consumer protection directives and Vietnam Law on Consumer Rights.

### L10: Observability, Diagnostics & SRE Auditability
- Diagnostic tags: `[dealId=...]`, `[providerId=...]`, structured error classes, and clear Vietnamese explanations.

### L11: Zero-Trust Security & Minimal Privilege
- Safe URL parsing via `new URL`.
- Immutable registry definitions.

### L12: Backward Compatibility & Regression Invariance
- 100% backward compatibility with existing tests. All 798 tests must pass.

---

### ACTIONABLE RESEARCH SUMMARY & TRANSITION TO PASS R5
Pass R4 provides the battle-hardened SRE specifications. In Pass R5, we will synthesize these findings into three locked canonical solutions ready for the Solution Cage and Master Goal compilation.
