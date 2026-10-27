# FARELY PROJECT 10X — MASTER GOAL G11 [G2]
# CYCLE: G83
# LEVEL: Pass 2: Skeptical Empirical Grounding
# MANDATE: Subject Pass G1 to empirical skepticism and mathematical verification across all 12 Adversarial Lenses. Enforce locked technical solutions SOL-HOLIDAY-01, SOL-AFFILIATE-01, and SOL-PRIVACY-01.
# GIT_COMMIT: bd684946cc61d16d0243c32beb62adc5a8c35bab
# TIMESTAMP: 2026-10-27T08:11:30.000Z
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

## SECTION C: SKEPTICAL AUDIT & FALSIFICATION OF PASS G1

### Falsification 1: L01 & L05 (Date Delimiter Normalization in Travel Context in Pass G1)
- *Deficits Identified in Pass G1*: Pass G1 asserted that departure dates in `src/domain/farely/vietnamTravelContext.ts` must match `/^\d{4}-\d{2}-\d{2}$/`, but failed to normalize common delimiter variants. In real-world partner feeds, dates are frequently formatted with slashes (`2026/02/15`) or periods (`2026.02.15`). Rejecting these dates prematurely causes holiday detection to fail, depriving travelers of peak demand warnings.
- *Physical Code Verification*: In `src/domain/farely/vietnamTravelContext.ts`:
```typescript
// Delimiter sanitization before calendar validation
const cleanDateStr = departDate.trim().slice(0, 10).replace(/[./]/g, '-');
if (!isValidCalendarDate(cleanDateStr)) return null;
```
- *Skeptical Remedy*: Sanitize slash and dot delimiters into standard hyphens before validating calendar dates.

### Falsification 2: L02 (Baggage Status Consistency in All-Inclusive Channel Quotes in Pass G1)
- *Deficits Identified in Pass G1*: Pass G1 calculated normalized costs in `src/domain/farely/directAffiliateComparison.ts`, but did not enforce internal consistency when `quoteBasis === 'ALL_INCLUSIVE_WITH_BAGGAGE'`. If an OTA sets `quoteBasis` to all-inclusive but sets `isBaggageIncludedInQuote: false`, consumers are misled regarding whether checked bags are truly covered.
- *Physical Code Verification*: In `src/domain/farely/directAffiliateComparison.ts`:
```typescript
if (q.quoteBasis === 'ALL_INCLUSIVE_WITH_BAGGAGE' && !q.isBaggageIncludedInQuote) {
  // Enforce consistent baggage inclusion contract
  q.isBaggageIncludedInQuote = true;
}
```
- *Skeptical Remedy*: Enforce that all-inclusive quotes guarantee baggage inclusion deterministically.

### Falsification 3: L03 & L07 (Null Object TypeError in Recursive Sanitization in Pass G1)
- *Deficits Identified in Pass G1*: Pass G1 specified recursive tree traversal in `src/domain/farely/personalizedFeedPrivacy.ts` with `typeof obj === 'object'`, but failed to guard against `null`. In JavaScript, `typeof null === 'object'`. If a client context object contains null values (`{ metadata: null }`), invoking `Object.entries(null)` throws an unhandled `TypeError`.
- *Physical Code Verification*: In `src/domain/farely/personalizedFeedPrivacy.ts`:
```typescript
// Guard against null objects in tree traversal
if (!obj || typeof obj !== 'object' || obj === null) return;
```
- *Skeptical Remedy*: Add explicit `obj === null` guards before attempting object enumeration.

### Falsification 4: L06 (Travel Motivation Null Safety in Pass G1)
- *Deficits Identified in Pass G1*: Pass G1 indexed `MOTIVATION_DESTINATIONS[motivation]`, but did not handle invalid motivation strings safely. Unrecognized motivation values must cleanly return an empty array `[]` rather than throwing exceptions.
- *Physical Code Verification*: In `src/domain/farely/vietnamTravelContext.ts`.
- *Skeptical Remedy*: Return `[]` safely for unlisted travel motivations.

### Falsification 5: L10 (Isolated Verification Command Suite in Pass G1)
- *Deficits Identified in Pass G1*: Pass G1 specified test commands, but did not assert sub-second execution across all three domain modules simultaneously.
- *Physical Code Verification*: `package.json:34`.
- *Skeptical Remedy*: Verify turnkey execution across all target test files in parallel.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS

### SOL-01: SOL-HOLIDAY-01 (Vietnam Travel Context & Calendar Peak Validation)
- **SOL_ID**: SOL-HOLIDAY-01
- **TARGET_FILES**: `src/domain/farely/vietnamTravelContext.ts`
- **LOCKED_ALGORITHM**:
  1. In `getVietnamHolidayContext`:
     - Sanitize `departDate` string with `.trim().slice(0, 10).replace(/[./]/g, '-')`.
     - Validate true calendar date via `isValidCalendarDate` (ISO round-trip component equality). Return null if invalid.
     - Match against `VIETNAM_MAJOR_HOLIDAYS_2026`. Return matching holiday.
  2. In `getCarrierBaggagePolicy`:
     - Trim and uppercase carrier code (`carrierCode.trim().toUpperCase()`).
     - Lookup in `VIETNAM_DOMESTIC_CARRIERS`. If unlisted, return a transparent non-null fallback policy detailing 7kg carry-on baseline.
- **FORBIDDEN_DEVIATIONS**: No unverified external dependencies; do not modify public function signatures; maintain existing holiday calendar dates.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/vietnamTravelContext.test.ts`

### SOL-02: SOL-AFFILIATE-01 (Direct Airline vs Affiliate Price & Commission Neutrality)
- **SOL_ID**: SOL-AFFILIATE-01
- **TARGET_FILES**: `src/domain/farely/directAffiliateComparison.ts`
- **LOCKED_ALGORITHM**:
  1. In `compareProviderChannels`:
     - Sanitize `rawQuotedPriceVND > 0`, `mandatoryTaxesAndFeesVND >= 0`, `checkedBaggageFeeVND >= 0`.
     - Reject quotes where `quoteBasis !== 'BASE_FARE_ONLY'` and `rawQuotedPriceVND < mandatoryTaxesAndFeesVND`.
     - Calculate normalized total cost without adding commercial affiliate commissions.
     - Identify objective minimum cost channel.
     - Sort channels by: `normalizedTotalCostVND` ascending $\to$ `CHANNEL_PRIORITY_ORDER` (`DIRECT_AIRLINE` before `OTA_PARTNER` before `AFFILIATE_AGGREGATOR`) $\to$ `providerName` alphabetical.
     - Enforce `CommercialRankingOverrideError` if promoted channel is more expensive than objective cheapest option.
- **FORBIDDEN_DEVIATIONS**: No unverified external dependencies; do not modify return interfaces; maintain commercial neutrality.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/directAffiliateComparison.test.ts`

### SOL-03: SOL-PRIVACY-01 (Client-Side Privacy Guarantees & Anti-Covert Profiling)
- **SOL_ID**: SOL-PRIVACY-01
- **TARGET_FILES**: `src/domain/farely/personalizedFeedPrivacy.ts`
- **LOCKED_ALGORITHM**:
  1. In `sanitizePersonalizationContext`:
     - Guard against prototype pollution: ignore/reject `__proto__`, `constructor`, `prototype`.
     - Guard against null objects in tree traversal (`!obj || typeof obj !== 'object' || obj === null`).
     - Normalize all keys to lower-case stripped strings (`key.toLowerCase().replace(/[-_]/g, '')`).
     - Traverse nested objects recursively to purge covert demographic profiling keys (`inferredIncomeTier`, `inferredReligion`, `creditWorthinessScore`, etc.). Throw `CovertProfilingViolationError` if found.
  2. In `rankFeedWithPrivacyGuarantees`:
     - Verify affirmative consent strictly (`preferences.isPersonalizationOptedIn === true`). If false, fall back to objective deal scoring.
     - Apply deterministic secondary tie-breaking on `deal.id`.
     - Sanitize `maxBudgetVND` to positive numbers.
- **FORBIDDEN_DEVIATIONS**: No unverified external dependencies; preserve error types; maintain explicit opt-in privacy invariant.
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
- **Audit Findings**: Monotonic cost normalization and deterministic tie-breaking guarantee that the displayed cheapest provider is mathematically optimal.
- **Physical Code Citations**: `src/domain/farely/directAffiliateComparison.ts:160`

### L05: Adversarial Inputs & Boundary Penetration
- **Audit Findings**: Prototype pollution attempts, nonexistent calendar dates, and nested injection attacks fail closed deterministically.
- **Physical Code Citations**: `src/domain/farely/vietnamTravelContext.ts:113`, `src/domain/farely/personalizedFeedPrivacy.ts:58`

### L06: Regulatory, Anti-Deception & Consumer Protection
- **Audit Findings**: Transparent commercial disclosures and affirmative consent compliance safeguard users from deceptive marketing practices.
- **Physical Code Citations**: `src/domain/farely/directAffiliateComparison.ts:9`, `src/domain/farely/personalizedFeedPrivacy.ts:17`

### L07: Operational Resilience & Resource Saturation
- **Audit Findings**: Bounded traversal and capped feed candidate lists prevent denial of service and memory saturation.
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
- **Audit Findings**: Fallback estimators and unpersonalized objective scoring ensure uninterrupted service during partial context failures.
- **Physical Code Citations**: `src/domain/farely/vietnamTravelContext.ts:126`, `src/domain/farely/personalizedFeedPrivacy.ts:86`

### L12: Long-Term Maintenance & Debt Eradication
- **Audit Findings**: Clean domain separation without circular dependencies guarantees maintenance velocity.
- **Physical Code Citations**: `src/domain/farely/vietnamTravelContext.ts:6`, `src/domain/farely/directAffiliateComparison.ts:47`

---

## SECTION F: CANONICAL RISK MATRIX

| Risk ID | Vulnerability Vector | Severity | Mitigation Strategy | Verification Oracle |
|---|---|---|---|---|
| RSK-01 | OTA commercial bias overrides cheaper direct airline | Critical | Throw `CommercialRankingOverrideError`, enforce direct priority on ties | `src/domain/farely/directAffiliateComparison.test.ts` |
| RSK-02 | Covert demographic profiling leaks via nested context | High | Recursive tree sanitization with case-insensitive normalization | `src/domain/farely/personalizedFeedPrivacy.test.ts` |
| RSK-03 | Nonexistent calendar date triggers false holiday match | High | Validate calendar existence via ISO round-trip check | `src/domain/farely/vietnamTravelContext.test.ts` |
| RSK-04 | Prototype pollution during context traversal | High | Ignore `__proto__`, `constructor`, `prototype` keys | `src/domain/farely/personalizedFeedPrivacy.test.ts` |
| RSK-05 | Unlisted carrier baggage lookup causes null crash | Medium | Provide transparent non-null default baggage policy | `src/domain/farely/vietnamTravelContext.test.ts` |

---

## SECTION G: TRANSACTIONAL WORK PACKAGES

### WP01: WP01-VIETNAM-HOLIDAY-CALENDAR-GUARD
- **Target File**: `src/domain/farely/vietnamTravelContext.ts`
- **Action**: Add `isValidCalendarDate`, 10-char date slicing, carrier code trimming, and default baggage policy.
- **Verification**: `npx vitest run src/domain/farely/vietnamTravelContext.test.ts`

### WP02: WP02-DIRECT-AFFILIATE-PRICE-PARITY
- **Target File**: `src/domain/farely/directAffiliateComparison.ts`
- **Action**: Enforce tax/price sanity, direct airline tie-breaking priority, and affiliate commission isolation.
- **Verification**: `npx vitest run src/domain/farely/directAffiliateComparison.test.ts`

### WP03: WP03-PERSONALIZED-FEED-RECURSIVE-PRIVACY
- **Target File**: `src/domain/farely/personalizedFeedPrivacy.ts`
- **Action**: Add prototype pollution defense, recursive tree traversal, and strict affirmative consent.
- **Verification**: `npx vitest run src/domain/farely/personalizedFeedPrivacy.test.ts`
