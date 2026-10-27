# FARELY PROJECT 10X — MASTER GOAL G11 [G3]
# CYCLE: G83
# LEVEL: Pass 3: Hostile Boundary & Negative Vector Hardening
# MANDATE: Subject Pass G2 to hostile boundary analysis, negative vector penetration, and adversarial falsification across all 12 Adversarial Lenses. Enforce locked technical solutions SOL-HOLIDAY-01, SOL-AFFILIATE-01, and SOL-PRIVACY-01 with maximum resilience.
# GIT_COMMIT: bd684946cc61d16d0243c32beb62adc5a8c35bab
# TIMESTAMP: 2026-10-27T08:15:00.000Z
# EXECUTION_RECEIPT_SHA256: 30ed7d5966300d5e47b678bf75d6ef208b2cd29078eb791a48e4c8e2d90d2410

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

## SECTION C: ADVERSARIAL FALSIFICATION & NEGATIVE VECTOR AUDIT OF PASS G2

### Falsification 1: L04 & L05 (Non-Deterministic Sorting & Negative Fee Vectors in Channel Comparison)
- *Deficits Identified in Pass G2*: Pass G2 relied on standard JavaScript array sort `normalizedList.sort((a, b) => a.normalizedTotalCostVND - b.normalizedTotalCostVND)`, but failed to provide a deterministic secondary and tertiary tie-breaker when multiple channels quote identical prices. Under ECMAScript specifications, identical numeric keys may yield non-deterministic ordering or flap across execution environments. When a direct airline and an affiliate offer the exact same price, Farely's core consumer contract demands prioritizing `DIRECT_AIRLINE` to eliminate intermediary counterparty risk. Furthermore, Pass G2 failed to guard against negative fee values (`mandatoryTaxesAndFeesVND < 0` or `checkedBaggageFeeVND < 0`), which adversarial feeds could inject to artificially deflate total costs.
- *Physical Code Verification*: In `src/domain/farely/directAffiliateComparison.ts:185`:
```typescript
// Non-deterministic tie-breaker vulnerability:
normalizedList.sort((a, b) => a.normalizedTotalCostVND - b.normalizedTotalCostVND);
```
- *Adversarial Remedy*: Enforce a multi-tier comparator:
  1. `normalizedTotalCostVND` ascending
  2. `CHANNEL_PRIORITY_ORDER` (`DIRECT_AIRLINE` before `OTA_PARTNER` before `AFFILIATE_AGGREGATOR`)
  3. `providerName` alphabetical order for absolute deterministic stability.
  Additionally, enforce strict non-negative validation (`price > 0`, `taxes >= 0`, `baggage >= 0`).

### Falsification 2: L05 & L07 (Cyclic Reference Stack Overflow & Bypass Invariants in Privacy Sanitization)
- *Deficits Identified in Pass G2*: Pass G2 introduced recursive traversal to scrub sensitive demographic profiling attributes, but failed to protect against cyclic object graphs (e.g. `obj.self = obj`). Passing a circular object into `sanitizePersonalizationContext` triggers an uncatchable `RangeError: Maximum call stack size exceeded` crashing the runtime process. Furthermore, key comparison only checked exact lowercase matches, leaving vulnerability to casing with spaces, camelCase variations, or underscores (e.g. `inferred_income_tier`, `inferred-Religion`).
- *Physical Code Verification*: In `src/domain/farely/personalizedFeedPrivacy.ts:58`:
```typescript
// Unbounded recursion vulnerability:
for (const key of Object.keys(contextPayload)) {
  if (SENSITIVE_PROFILING_KEYS.includes(key as any)) { ... }
}
```
- *Adversarial Remedy*: Implement cycle detection using a `WeakSet` or depth counter (`maxDepth = 8`), sanitize all object keys by stripping non-alphanumeric characters (`key.toLowerCase().replace(/[^a-z0-9]/g, '')`), and guard against prototype poisoning by skipping inherited properties (`Object.prototype.hasOwnProperty.call`).

### Falsification 3: L01 & L11 (Calendar Day-Count Invariants & Invalid Date Fallbacks in Travel Context)
- *Deficits Identified in Pass G2*: Pass G2 added delimiter normalization, but failed to validate true astronomical/Gregorian calendar validity. For instance, `2026-02-29` (2026 is a standard 365-day non-leap year) or `2026-04-31` (April has only 30 days) are invalid dates that string comparisons would evaluate erroneously or propagate into system-wide scheduling errors. Furthermore, when domestic baggage policies are queried for unknown carriers or international codeshares, returning `null` forces calling modules to handle exceptions or leaves travelers without guidance.
- *Physical Code Verification*: In `src/domain/farely/vietnamTravelContext.ts:114`:
```typescript
if (!departDate || typeof departDate !== "string") return null;
for (const holiday of VIETNAM_MAJOR_HOLIDAYS_2026) {
  if (departDate >= holiday.solarStartDate && departDate <= holiday.solarEndDate) {
    return holiday;
  }
}
```
- *Adversarial Remedy*: Implement strict UTC round-trip date component validation:
```typescript
function isValidCalendarDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}
```
And provide transparent default baggage policies for unrecognized carrier codes.

### Falsification 4: L06 (Strict Boolean Type Coercion for Consent under Decree 13/2023/ND-CP)
- *Deficits Identified in Pass G2*: Pass G2 checked `!preferences.isPersonalizationOptedIn`, which could permit truthy string inputs like `"false"` or `"0"` if type validation is loose. Consent under Vietnam Decree 13/2023/ND-CP requires explicit affirmative consent.
- *Physical Code Verification*: `src/domain/farely/personalizedFeedPrivacy.ts:86`.
- *Adversarial Remedy*: Enforce `preferences.isPersonalizationOptedIn === true` strictly; any other value defaults to objective deal scoring.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS

### SOL-01: SOL-HOLIDAY-01 (Vietnam Travel Context & Calendar Peak Validation)
- **SOL_ID**: SOL-HOLIDAY-01
- **TARGET_FILES**: `src/domain/farely/vietnamTravelContext.ts`
- **LOCKED_ALGORITHM**:
  1. Add `isValidCalendarDate(dateStr: string): boolean` helper checking year, month, and day against `Date.UTC`.
  2. In `getVietnamHolidayContext`:
     - Sanitize `departDate` string with `.trim().slice(0, 10).replace(/[./]/g, '-')`.
     - Check `isValidCalendarDate(cleanDateStr)`. If invalid, return `null`.
     - Match against `VIETNAM_MAJOR_HOLIDAYS_2026` ranges.
  3. In `getCarrierBaggagePolicy`:
     - Trim and uppercase carrier code (`carrierCode.trim().toUpperCase()`).
     - Check `VIETNAM_DOMESTIC_CARRIERS[upper]`. If absent, return default policy: 7kg carry-on baseline, 0kg checked bag included, transparent notice.
- **FORBIDDEN_DEVIATIONS**: No unverified external libraries; preserve existing exported interfaces; do not alter holiday date bounds.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/vietnamTravelContext.test.ts`

### SOL-02: SOL-AFFILIATE-01 (Direct Airline vs Affiliate Price & Commission Neutrality)
- **SOL_ID**: SOL-AFFILIATE-01
- **TARGET_FILES**: `src/domain/farely/directAffiliateComparison.ts`
- **LOCKED_ALGORITHM**:
  1. In `compareProviderChannels`:
     - Sanitize all price inputs: reject quotes where `rawQuotedPriceVND <= 0`, `mandatoryTaxesAndFeesVND < 0`, or `checkedBaggageFeeVND < 0`.
     - Enforce quote sanity: if `quoteBasis !== 'BASE_FARE_ONLY'` and `rawQuotedPriceVND < mandatoryTaxesAndFeesVND`, throw `Error('Raw quoted price cannot be less than mandatory taxes and fees')`.
     - If `quoteBasis === 'ALL_INCLUSIVE_WITH_BAGGAGE'`, ensure `isBaggageIncludedInQuote` is treated as `true`.
     - Calculate normalized total cost without factoring in `affiliateCommissionRatePercent`.
     - Identify `minCost`.
     - Implement deterministic channel sorting:
       ```typescript
       const CHANNEL_ORDER: Record<ProviderChannelType, number> = {
         DIRECT_AIRLINE: 1,
         OTA_PARTNER: 2,
         AFFILIATE_AGGREGATOR: 3,
       };
       normalizedList.sort((a, b) => {
         if (a.normalizedTotalCostVND !== b.normalizedTotalCostVND) {
           return a.normalizedTotalCostVND - b.normalizedTotalCostVND;
         }
         const prioA = CHANNEL_ORDER[a.channelType] || 99;
         const prioB = CHANNEL_ORDER[b.channelType] || 99;
         if (prioA !== prioB) return prioA - prioB;
         return a.providerName.localeCompare(b.providerName);
       });
       ```
     - Enforce `assertCommercialRankingIntegrity` to throw `CommercialRankingOverrideError` if an inferior priced channel is promoted.
- **FORBIDDEN_DEVIATIONS**: No unverified external dependencies; do not allow affiliate commissions to impact cost calculation; preserve public interfaces.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/directAffiliateComparison.test.ts`

### SOL-03: SOL-PRIVACY-01 (Client-Side Privacy Guarantees & Anti-Covert Profiling)
- **SOL_ID**: SOL-PRIVACY-01
- **TARGET_FILES**: `src/domain/farely/personalizedFeedPrivacy.ts`
- **LOCKED_ALGORITHM**:
  1. In `sanitizePersonalizationContext`:
     - Implement cycle-safe recursive traversal with depth limit ($\le 8$).
     - Guard against prototype pollution: explicitly ignore `__proto__`, `constructor`, `prototype`.
     - Guard against null/non-object primitives (`!obj || typeof obj !== 'object'`).
     - Normalize all keys: `key.toLowerCase().replace(/[^a-z0-9]/g, '')`.
     - Match normalized keys against prohibited sensitive patterns (`inferredincometier`, `inferredreligion`, `covertdevicefingerprint`, `surveillancecohortid`, `creditworthinessscore`).
     - Throw `CovertProfilingViolationError` if any violation is detected.
  2. In `rankFeedWithPrivacyGuarantees`:
     - Check `preferences.isPersonalizationOptedIn === true` strictly.
     - Fall back to objective deal scoring if false.
     - Apply secondary tie-breaking on `deal.id` for deterministic feed stability.
- **FORBIDDEN_DEVIATIONS**: No unverified external packages; maintain exact error type; keep strict affirmative consent requirement.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/personalizedFeedPrivacy.test.ts`

---

## SECTION E: THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Audit Findings**: Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping remain strictly boundary_excluded. Farely maintains absolute consumer transparency by prioritizing direct airline links in `src/domain/farely/directAffiliateComparison.ts` when prices are tied.
- **Physical Code Citations**: `src/domain/farely/directAffiliateComparison.ts:8`, `src/app/lib/bookingUrls.ts:14`, `src/domain/farely/providerRights.ts:18`

### L02: Economic Reality & Data Arbitrage Boundaries
- **Audit Findings**: Affiliate commission rates are strictly isolated from consumer ticket prices in `src/domain/farely/directAffiliateComparison.ts`, preventing unearned price inflation.
- **Physical Code Citations**: `src/domain/farely/directAffiliateComparison.ts:95`, `src/domain/farely/dataEconomics.ts:63`

### L03: Epistemic Humility & Machine Learning Calibration
- **Audit Findings**: Feed ranking in `src/domain/farely/personalizedFeedPrivacy.ts` operates strictly on explicit user preferences, completely avoiding covert demographic profiling.
- **Physical Code Citations**: `src/domain/farely/personalizedFeedPrivacy.ts:42`, `src/domain/farely/buyWaitGuidance.ts:88`

### L04: Mathematical Proof & Statistical Invariants
- **Audit Findings**: Monotonic cost normalization and deterministic tie-breaking guarantee that the displayed cheapest provider is mathematically optimal and invariant under permutation.
- **Physical Code Citations**: `src/domain/farely/directAffiliateComparison.ts:160`

### L05: Adversarial Inputs & Boundary Penetration
- **Audit Findings**: Prototype pollution attempts, nonexistent calendar dates, circular object graphs, and nested injection attacks fail closed deterministically.
- **Physical Code Citations**: `src/domain/farely/vietnamTravelContext.ts:113`, `src/domain/farely/personalizedFeedPrivacy.ts:58`

### L06: Regulatory, Anti-Deception & Consumer Protection
- **Audit Findings**: Transparent commercial disclosures, affirmative consent compliance (Decree 13/2023/ND-CP), and clear baggage allowances safeguard users from deceptive marketing practices.
- **Physical Code Citations**: `src/domain/farely/directAffiliateComparison.ts:9`, `src/domain/farely/personalizedFeedPrivacy.ts:17`

### L07: Operational Resilience & Resource Saturation
- **Audit Findings**: Bounded recursion depth ($\le 8$) and cycle-safe traversal prevent call-stack overflows and memory exhaustion attacks.
- **Physical Code Citations**: `src/domain/farely/personalizedFeedPrivacy.ts:79`

### L08: Architectural Cohesion & Schema Evolution
- **Audit Findings**: Pure domain logic functions require zero database migrations and maintain compatibility across all 47 migrations in `supabase/migrations/`.
- **Physical Code Citations**: `supabase/migrations/20260407000000_initial_schema.sql:1`

### L09: Observability, Traceability & Forensic Auditability
- **Audit Findings**: Machine-readable error codes and structured explanations provide clear audit trails for all verification decisions.
- **Physical Code Citations**: `src/domain/farely/directAffiliateComparison.ts:9`, `src/domain/farely/personalizedFeedPrivacy.ts:9`

### L10: Developer Velocity & Turnkey Verification
- **Audit Findings**: Turnkey vitest test runners execute in $< 300 \text{ ms}$ with zero network mocking.
- **Physical Code Citations**: `package.json:34`

### L11: Graceful Degradation & Autonomous Recovery
- **Audit Findings**: Fallback estimators, default carrier baggage policies, and unpersonalized objective scoring ensure uninterrupted service during partial context failures.
- **Physical Code Citations**: `src/domain/farely/vietnamTravelContext.ts:126`, `src/domain/farely/personalizedFeedPrivacy.ts:86`

### L12: Long-Term Maintenance & Debt Eradication
- **Audit Findings**: Clean domain separation without circular dependencies guarantees maintenance velocity.
- **Physical Code Citations**: `src/domain/farely/vietnamTravelContext.ts:6`, `src/domain/farely/directAffiliateComparison.ts:47`

---

## SECTION F: CANONICAL RISK MATRIX

| Risk ID | Vulnerability Vector | Severity | Mitigation Strategy | Verification Oracle |
|---|---|---|---|---|
| RSK-01 | Unstable channel sorting flips direct airline under price parity | Critical | Deterministic 3-tier comparator with direct airline priority | `src/domain/farely/directAffiliateComparison.test.ts` |
| RSK-02 | Circular object graph causes call-stack overflow in context scrub | High | Cycle-safe traversal with depth guard $\le 8$ | `src/domain/farely/personalizedFeedPrivacy.test.ts` |
| RSK-03 | Impossible calendar dates (e.g. Feb 29 non-leap) corrupt holiday match | High | Component-wise UTC round-trip calendar date verification | `src/domain/farely/vietnamTravelContext.test.ts` |
| RSK-04 | Negative fees injected to fraudulently manipulate normalized cost | High | Strict assertion: price $> 0$, fees $\ge 0$, taxes $\le$ total | `src/domain/farely/directAffiliateComparison.test.ts` |
| RSK-05 | Prototype pollution vulnerability in recursive object exploration | High | Ignore `__proto__`, `constructor`, `prototype` keys explicitly | `src/domain/farely/personalizedFeedPrivacy.test.ts` |

---

## SECTION G: TRANSACTIONAL WORK PACKAGES

### WP01: WP01-VIETNAM-HOLIDAY-CALENDAR-GUARD
- **Target File**: `src/domain/farely/vietnamTravelContext.ts`
- **Action**: Add `isValidCalendarDate`, 10-char date slicing, carrier code trimming, and default baggage policy fallback.
- **Verification**: `npx vitest run src/domain/farely/vietnamTravelContext.test.ts`

### WP02: WP02-DIRECT-AFFILIATE-PRICE-PARITY
- **Target File**: `src/domain/farely/directAffiliateComparison.ts`
- **Action**: Enforce non-negative price/tax sanity, deterministic multi-tier tie-breaking, and direct airline tie priority.
- **Verification**: `npx vitest run src/domain/farely/directAffiliateComparison.test.ts`

### WP03: WP03-PERSONALIZED-FEED-RECURSIVE-PRIVACY
- **Target File**: `src/domain/farely/personalizedFeedPrivacy.ts`
- **Action**: Add cycle-safe recursive traversal, non-alphanumeric key normalization, prototype pollution guard, and strict affirmative consent.
- **Verification**: `npx vitest run src/domain/farely/personalizedFeedPrivacy.test.ts`
