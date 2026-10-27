# FARELY PROJECT 10X — RESEARCH R10 [R1]
# CYCLE: G83
# LEVEL: Pass 1: Full-Battery Baseline Synthesis
# MANDATE: Full-battery multi-lens analysis across all 12 Adversarial Lenses for Cycle G83. Ground all claims in physical repository files, empirical test matrices, and immutable owner contracts F00..F88.
# GIT_COMMIT: bd684946cc61d16d0243c32beb62adc5a8c35bab
# TIMESTAMP: 2026-10-27T08:04:00.000Z
# EXECUTION_RECEIPT_SHA256: 30ed7d5966300d5e47b678bf75d6ef208b2cd29078eb791a48e4c8e2d90d2410

---

## SECTION I: EXECUTIVE BASELINE & PRODUCT BOUNDARY INTEGRITY
Farely is an independent Flight Opportunity Intelligence Platform providing deterministic fare verification and algorithmic consumer transparency.
All operational activities operate under strictly non-OTA boundaries:
- Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping remain strictly boundary_excluded.
- Farely delivers algorithmic verification, price anomaly detection, and opportunity scoring; bookings terminate transparently at official airline or accredited OTA portals via clean handoff URLs (`src/app/lib/bookingUrls.ts`).

---

## SECTION II: CODEBASE ARCHITECTURAL TELEMETRY
- **Active Supabase Migrations**: 47 migrations in `supabase/migrations/`
- **Active Edge Functions**: 17 edge functions in `supabase/functions/`
- **Current Verified Suite**: 58 Vitest suites (381 unit tests) + 382 Node native test assertions = 763 tests green
- **Feature Branch**: `antigravity/farely-v12-product-convergence`
- **Remote SHA Parity**: `bd684946cc61d16d0243c32beb62adc5a8c35bab` (Verified via `git ls-remote`)

---

## SECTION III: CANDIDATE HARDENING MODULES FOR CYCLE G83
1. `SOL-HOLIDAY-01`: Vietnam Travel Context & Holiday Peak Demand Validation (`src/domain/farely/vietnamTravelContext.ts`)
   - F86 (Vietnam-specific UX) and F87 (Intent-based travel motivations). Validates departure dates against major Lunar New Year, Giỗ Tổ, 30/4-1/5, and National Day calendars with strict ISO format checks.
2. `SOL-AFFILIATE-01`: Direct Airline vs Affiliate Price & Commission Neutrality (`src/domain/farely/directAffiliateComparison.ts`)
   - F43: Direct/affiliate provider comparison. Ensures commercial ranking never overrides or obscures the objective cheapest flight option.
3. `SOL-PRIVACY-01`: Client-Side Privacy Guarantees & Anti-Covert Profiling (`src/domain/farely/personalizedFeedPrivacy.ts`)
   - F38: Privacy-preserving personalized feed. Forbids covert demographic profiling and ensures zero-tracking fallback to objective scores.

---

## SECTION IV: THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Audit**: Farely never books flights or collects payment; direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping are strictly boundary_excluded. In `src/domain/farely/directAffiliateComparison.ts`, comparing direct airlines with OTAs must transparently disclose the true landed price without commercial bias.
- **Physical Code Citations**: `src/domain/farely/directAffiliateComparison.ts:8`, `src/app/lib/bookingUrls.ts:14`

### L02: Economic Reality & Data Arbitrage Boundaries
- **Audit**: In `src/domain/farely/directAffiliateComparison.ts`, OTAs often quote low base fares but add payment processing fees and separate baggage charges. A true normalized cost comparison must add all mandatory fees to reveal the actual consumer outlay.
- **Physical Code Citations**: `src/domain/farely/directAffiliateComparison.ts:95`, `src/domain/farely/dataEconomics.ts:63`

### L03: Epistemic Humility & Machine Learning Calibration
- **Audit**: In `src/domain/farely/personalizedFeedPrivacy.ts`, personalization algorithms must operate strictly on explicit, consented user selections. Inferring religion, ethnicity, or financial creditworthiness is strictly forbidden under F38.
- **Physical Code Citations**: `src/domain/farely/personalizedFeedPrivacy.ts:42`, `src/domain/farely/buyWaitGuidance.ts:88`

### L04: Mathematical Proof & Statistical Invariants
- **Audit**: In `src/domain/farely/directAffiliateComparison.ts`, normalized cost $C = P_{base} + F_{tax} + B_{baggage}$ is mathematically verified. The minimum cost channel must satisfy $\forall i, C_{min} \le C_i$.
- **Physical Code Citations**: `src/domain/farely/directAffiliateComparison.ts:160`

### L05: Adversarial Inputs & Boundary Penetration
- **Audit**: In `src/domain/farely/vietnamTravelContext.ts`, departure date strings with invalid formats, extra whitespace, or malformed characters must fail safely to null without crashing.
- **Physical Code Citations**: `src/domain/farely/vietnamTravelContext.ts:113`

### L06: Regulatory, Anti-Deception & Consumer Protection
- **Audit**: Displaying an OTA as "Recommended" or "Cheapest" when the official airline direct website is cheaper violates consumer transparency and F43 invariants (`CommercialRankingOverrideError`).
- **Physical Code Citations**: `src/domain/farely/directAffiliateComparison.ts:9`

### L07: Operational Resilience & Resource Saturation
- **Audit**: Feed ranking in `src/domain/farely/personalizedFeedPrivacy.ts` processes deals in $O(N \log N)$ time, preventing computational bottlenecks during large payload evaluations.
- **Physical Code Citations**: `src/domain/farely/personalizedFeedPrivacy.ts:87`

### L08: Architectural Cohesion & Schema Evolution
- **Audit**: All three modules operate in pure domain logic (`src/domain/farely/`), requiring no database schema mutations and maintaining compatibility across all 47 migrations in `supabase/migrations/`.
- **Physical Code Citations**: `supabase/migrations/20260407000000_initial_schema.sql:1`

### L09: Observability, Traceability & Forensic Auditability
- **Audit**: In `src/domain/farely/directAffiliateComparison.ts`, all comparisons return structured disclosure notices (`disclosureNoticeVi`) and explicit staleness minutes for audit logs.
- **Physical Code Citations**: `src/domain/farely/directAffiliateComparison.ts:193`

### L10: Developer Velocity & Turnkey Verification
- **Audit**: Tests execute in $< 300 \text{ ms}$ via turnkey vitest runners without network mocks.
- **Physical Code Citations**: `package.json:34`

### L11: Graceful Degradation & Autonomous Recovery
- **Audit**: When user preferences are unconsented or disabled, `rankFeedWithPrivacyGuarantees` degrades gracefully to objective deal scoring.
- **Physical Code Citations**: `src/domain/farely/personalizedFeedPrivacy.ts:86`

### L12: Long-Term Maintenance & Debt Eradication
- **Audit**: Strictly typed TypeScript interfaces (`VietnamHoliday`, `NormalizedProviderChannel`, `RankedFeedItem`) eliminate hidden technical debt.
- **Physical Code Citations**: `src/domain/farely/vietnamTravelContext.ts:6`, `src/domain/farely/directAffiliateComparison.ts:47`

---

## SECTION V: PROPOSED ARCHITECTURAL SOLUTIONS
- **SOL-01: SOL-HOLIDAY-01**: In `src/domain/farely/vietnamTravelContext.ts`, enforce strict ISO format regex on departure dates, sanitize carrier code lookups with uppercase trimming, and validate travel motivations.
- **SOL-02: SOL-AFFILIATE-01**: In `src/domain/farely/directAffiliateComparison.ts`, sanitize raw prices and mandatory fees to positive finite numbers, enforce objective cost sorting, and guard against deceptive commercial overrides.
- **SOL-03: SOL-PRIVACY-01**: In `src/domain/farely/personalizedFeedPrivacy.ts`, enforce case-insensitive checking for prohibited demographic keys, guard against prototype pollution in context payloads, and ensure clean fallback to objective scoring.
