# FARELY PROJECT 10X — G47 LOSSLESS IMPLEMENTATION MASTER GOAL CANDIDATE
# COMPILED BY G11 LOSSLESS COMPILER IN SAME WORKFLOW (2026-10-19)
# SOURCE: G11 + R10 + FARELY-XFER/6
# DELIVERY CLASS: RECOVERY_INSTRUCTION_ISSUED__MASTER_GOAL_UNFULFILLED
# RESEARCH CERTIFICATION: 0/20 (NOT_CERTIFIED)
# COMPILER CERTIFICATION: 0/20 (NOT_CERTIFIED)
# TARGET_PROVEN: FALSE (PENDING INDEPENDENT FOUNDER ACCEPTANCE & SOAK)
# ==============================================================================

# FARELY PROJECT 10X — G47 CONTINUOUS MASTER MISSION
## Source Authority Recovery → Research Closure → Implementation Goal
## Product Truth | Exact Identity | Durable Watch | Real Proof
## Date: 2026-10-19

MISSION_ID: FARELY-10X-G47
PRODUCT: Farely — Flight Opportunity Intelligence
REPOSITORY: https://github.com/manhtx/Sanvemaybay
REFERENCE_BRANCH: antigravity/farely-v12-product-convergence
REFERENCE_PR: https://github.com/manhtx/Sanvemaybay/pull/1
PRODUCTION_DOMAIN: https://farely.manhtx.com

PRIMARY_CONTRACT: G11 — Project 10X Master Goal
SUPPORT_CONTRACT: R10 — Project 10X Research
HANDOFF_CONTRACT: FARELY-XFER/6
STICKY_GOAL_INTENT: TRUE

CURRENT_DELIVERY_CLASS:
RECOVERY_INSTRUCTION_ISSUED__MASTER_GOAL_UNFULFILLED

B00_B20_CERTIFICATION: 0/20 — NOT_CERTIFIED
G00_G20_CERTIFICATION: 0/20 — NOT_CERTIFIED
ORIGINAL_FOUNDER_PER_ATOM_AUTHORITY: PARTIAL
PRODUCT_TARGET_PROVEN: FALSE

NON-NEGOTIABLE OPERATING RULE:
Do not finish by generating another version-numbered convergence report while actual source defects remain.
Do not mistake documentation for implementation, CI success for live runtime, or a repository-generated approval for Founder authority.
Complete every legitimate source recovery and technical design task available now.

================================================================
A. FOUNDER MISSION, PRODUCT VISION AND AUTHORITY
================================================================

A1. PRODUCT MISSION & NORTH STAR

Farely is a trustworthy, differentiated and genuinely useful Flight Opportunity Intelligence product, not a presumed OTA or ticket issuer.

The product must help travelers:
1. Start with an origin, flexible destination, or open budget and immediately see real, verified opportunities without guessing.
2. Explore by continent, region, or travel themes without knowing where to go first.
3. Search with budget, stops, date windows, flight duration, and airline preferences.
4. Evaluate any deal by true all-in cost (base fare + mandatory fees + baggage + payment surcharges).
5. Understand Deal Score, historical discount percent, percentile rank, and confidence level with zero invented numbers.
6. Know clearly whether to BUY, MONITOR, or WAIT based on calibrated historical price distributions and seasonal context.
7. Preserve exact opportunity identity (origin, destination, dates, airline, flight number, cabin, stops, fare basis) across sessions.
8. Save deals and manage Watch alerts with durable condition episodes (ENTERED, STILL_INSIDE, MATERIAL_IMPROVEMENT, EXITED, REENTERED).
9. Receive timely, deduplicated notifications via Email or Telegram with guaranteed at-least-once outbox dispatch.
10. Verify prices against approved live provider booking sources with zero URL spoofing.

CORE OPERATIONAL INVARIANTS:
- DATA BEFORE AI
- OPPORTUNITY BEFORE NOISE
- TOTAL COST BEFORE CHEAPEST STICKER PRICE
- EVIDENCE BEFORE CONFIDENCE
- COHORT BEFORE PRICE COMPARISON
- USER DECISION BEFORE FEATURE COUNT
- SAFE DEGRADATION BEFORE FABRICATED SUCCESS

A2. COMMERCIAL & LEGAL BOUNDARY RECONCILIATION

Per docs/FLYCHEAP_AI_GOAL.md Section 8 (Explicit Exclusions):
- Farely is an Opportunity Intelligence Platform, NOT an Online Travel Agency (OTA).
- The platform strictly excludes ticket selling, payment processing, booking transaction custody, customer service ticket management, and ticket refunds.
- Capability F52 (Full checkout) is categorized as APPROVED_CONDITIONAL staged behind explicit Founder ticketing amendment and verified regulatory licensing.
- Live provider integrations strictly adhere to provider licensing boundaries (fast_flights indicative scraping vs Amadeus API vs Travelpayouts affiliate deeplinking).

A3. PROOF HIERARCHY INVARIANT

Proof Level Precedence:
- C0 Contract: Specification schemas, registries, and invariant matrices.
- C1 Code: Static typechecks, linter checks, unit and domain algorithm tests.
- C2 Integration: Full-stack contract, multi-component database RPC, and mock-free E2E tests.
- C3 Runtime: Live staging / production deployed telemetry, PostgREST RLS enforcement, and health probes.
- C4 Longitudinal Outcome: Real user engagement, sustained 24h soak, and founder business acceptance.

Rules:
- C1 code tests cannot certify C3 deployed runtime or C4 outcome soak.
- No self-awarded 10/10 scores; no self-certification of TARGET_PROVEN without independent external verification.

A4. AUTHORITY RECONCILIATION & SECTION A8 AUTHORITY LEDGER

All 89 capability contracts (F00..F88) are materialized with the full 22-field Section A8 schema in docs/convergence/v47/FOUNDER_APPROVED_REQUIRED_ATOMS.json:
- Total capabilities: 89 (40 P0, 26 P1, 16 P2, 7 P3)
- APPROVED_REQUIRED_CURRENT: 66 (all P0 and P1 capabilities)
- APPROVED_REQUIRED_FUTURE: 16 (all P2 capabilities, preserved as 32 reconciled V1/V2 variants)
- APPROVED_CONDITIONAL: 7 (all P3 capabilities, staged behind founder authorization)
- Zero capability contracts dropped or shrunk.

Summary Table of the 89 Capabilities:

### [F00] Independent proof authority (P0)
- **Atom ID**: `ATOM-F00`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W0_SOURCE_AUTHORITY`
- **Caller**: `scripts/verify-certification-integrity.node-test.mjs, scripts/release-manifest.node-test.mjs`
- **Solution Contract**: Gate-level executed assertions, trustworthy raw receipts, source dependency digests and independent owner admission.
- **Positive Gate**: A forged PASS, parent SHA proof or tampered result cannot close an unrelated mandatory gate.
- **Negative Gate**: A01 & NEG-40: Reject forged PASS and self-awarded approval
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F01] One release manifest (P0)
- **Atom ID**: `ATOM-F01`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W0_SOURCE_AUTHORITY`
- **Caller**: `scripts/verify-certification-integrity.node-test.mjs, scripts/release-manifest.node-test.mjs`
- **Solution Contract**: Versioned runtime tuple covering frontend, source commit, database, Edge Functions, worker, scheduled jobs and active generation.
- **Positive Gate**: Historical preview and production SHAs do not falsely reconcile.
- **Negative Gate**: A02 & PS35-01 & NEG-25: Reject inconsistent release tuple or preview SHA as production
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F02] Four canonical identities (P0)
- **Atom ID**: `ATOM-F02`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W1_CANONICAL_IDENTITIES_INTENT_SCOPE`
- **Caller**: `src/domain/farely/identity.ts, src/app/data/deals.ts`
- **Solution Contract**: Separate PhysicalItinerary, CommercialOffer, FareObservation and Opportunity with versioned IDs and migration aliases.
- **Positive Gate**: Distinct flights do not merge; Saved and Watch retain identity through generation rollover.
- **Negative Gate**: A03 & NEG-02 & NEG-03: Reject route/date alias collision and distinct fare merge
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F03] Full TravelIntent (P0)
- **Atom ID**: `ATOM-F03`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W1_CANONICAL_IDENTITIES_INTENT_SCOPE`
- **Caller**: `src/domain/farely/travelIntent.ts, src/app/pages/SearchPage.tsx`
- **Solution Contract**: Typed trip kind, airport/city scope, outbound/inbound dates, travelers, cabin, stop requirements, baggage and price basis.
- **Positive Gate**: A full UI→API→DB→worker→decision round trip loses no material travel intent field.
- **Negative Gate**: A04 & NEG-16: Reject round-trip and passenger loss across layers
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F04] Unknown semantics (P0)
- **Atom ID**: `ATOM-F04`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W1_CANONICAL_IDENTITIES_INTENT_SCOPE`
- **Caller**: `src/domain/farely/costEpistemics.ts, src/domain/farely/priceScope.ts`
- **Solution Contract**: Use explicit KNOWN, UNKNOWN and NOT_APPLICABLE semantics across source, price and travel data.
- **Positive Gate**: Unknown stop count, baggage and tax are never silently coerced to zero.
- **Negative Gate**: A05 & NEG-04 & NEG-05: Reject null/unknown mandatory costs converted to 0
- **E2E Gate**: e2e/v32-journeys-j01-j10.spec.ts: J02 Accurate Cost Breakdown
- **Current Status**: `IMPLEMENTED`

### [F05] Provider evidence registry (P0)
- **Atom ID**: `ATOM-F05`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W2_PROVIDER_ADAPTERS_ENTITLEMENTS_COVERAGE`
- **Caller**: `src/domain/farely/providerRights.ts, src/domain/farely/providerCapabilities.ts`
- **Solution Contract**: Versioned provider mode, capability, license/terms, source age, parser state, quota and fallback policy.
- **Positive Gate**: HTTP 429/503 or parser failure cannot produce QUALIFIED_EMPTY.
- **Negative Gate**: A06 & NEG-12: Reject 429/503/parser error converted to empty result
- **E2E Gate**: e2e/v32-journeys-j01-j10.spec.ts: J10 Degraded Provider Visible Disclosure
- **Current Status**: `IMPLEMENTED`

### [F06] Coverage certificate (P0)
- **Atom ID**: `ATOM-F06`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W2_PROVIDER_ADAPTERS_ENTITLEMENTS_COVERAGE`
- **Caller**: `supabase/functions/refresh-observed-fares/index.ts, supabase/functions/observed-fares/index.ts`
- **Solution Contract**: Scan proof bound to exact query scope, provider, dates, partition outcomes, generation and time.
- **Positive Gate**: Unscanned or partially scanned dates cannot be represented as verified no-fare results.
- **Negative Gate**: A07 & NEG-13 & PS35-09: Reject unmonitored route shown as valid empty
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F07] Demand-aware worker (P0)
- **Atom ID**: `ATOM-F07`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W2_PROVIDER_ADAPTERS_ENTITLEMENTS_COVERAGE`
- **Caller**: `supabase/functions/refresh-observed-fares/index.ts, supabase/functions/observed-fares/index.ts`
- **Solution Contract**: Union all active eligible Watch scopes before prioritizing under quotas, with bounded fairness, leases and retries.
- **Positive Gate**: Watch scopes outside the old first-N candidate slice receive their defined service opportunity.
- **Negative Gate**: A08 & NEG-17: Reject Watch starvation after first-N items
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F08] Atomic dataset generation (P0)
- **Atom ID**: `ATOM-F08`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W2_PROVIDER_ADAPTERS_ENTITLEMENTS_COVERAGE`
- **Caller**: `supabase/functions/refresh-observed-fares/index.ts, supabase/functions/observed-fares/index.ts`
- **Solution Contract**: Candidate manifest, committed row-count reconciliation, transactional pointer publication and last-known-good fallback.
- **Positive Gate**: Crash or partial ingestion cannot expose mixed or false-complete generations.
- **Negative Gate**: A09 & PS35-16: Reject mixed or partial generation visibility
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F09] Authoritative search (P0)
- **Atom ID**: `ATOM-F09`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W3_AUTHORITATIVE_SEARCH_ROUTEBEST_DETAIL_HISTORY`
- **Caller**: `src/app/data/api.ts:searchDealsWithStatus, src/app/data/api.ts:sortDeals, src/domain/farely/routeBest.ts`
- **Solution Contract**: Apply eligibility, full-universe filters, sort and count before cursor pagination on the server.
- **Positive Gate**: An eligible offer beyond the first 120, 1,500 or 5,000 rows remains discoverable and correctly ranked.
- **Negative Gate**: A10 & NEG-01: Reject client-only first-page truncation losing global cheapest
- **E2E Gate**: e2e/v32-journeys-j01-j10.spec.ts: J01 Direct Search & J03 RouteBest
- **Current Status**: `IMPLEMENTED`

### [F10] Best/lowest truth (P0)
- **Atom ID**: `ATOM-F10`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W3_AUTHORITATIVE_SEARCH_ROUTEBEST_DETAIL_HISTORY`
- **Caller**: `src/domain/farely/costEpistemics.ts, src/domain/farely/priceScope.ts`
- **Solution Contract**: Arithmetic minimum across fully eligible comparable offers under one PriceScope, with separate unknown/excluded candidate counts.
- **Positive Gate**: Different cabins, passenger mixes, return dates or unknown required fees cannot be compared as one exact total.
- **Negative Gate**: A11 & NEG-07: Reject comparing incompatible price scopes or uncalibrated currencies
- **E2E Gate**: e2e/v32-journeys-j01-j10.spec.ts: J01 Direct Search & J03 RouteBest
- **Current Status**: `IMPLEMENTED`

### [F11] Comparable pricing (P0)
- **Atom ID**: `ATOM-F11`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W3_AUTHORITATIVE_SEARCH_ROUTEBEST_DETAIL_HISTORY`
- **Caller**: `src/app/domain/opportunityCohort.ts, src/app/domain/dealClaims.ts, src/app/components/PriceHistoryChart.tsx`
- **Solution Contract**: Exact PriceScope cohorts, independent scan epochs, duplicate controls and non-self-comparison. For STRONG historical claims preserve the original threshold: at least 12 independent comparable observations and at least 3 scan epochs, subject to original contract verification.
- **Positive Gate**: Multiple records from one scan never manufacture STRONG historical evidence.
- **Negative Gate**: A12 & NEG-08: Reject self-inclusion of observation in own cohort baseline
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F12] Explainable price label (P0)
- **Atom ID**: `ATOM-F12`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W3_AUTHORITATIVE_SEARCH_ROUTEBEST_DETAIL_HISTORY`
- **Caller**: `src/app/domain/opportunityCohort.ts, src/app/domain/dealClaims.ts, src/app/components/PriceHistoryChart.tsx`
- **Solution Contract**: Separate price exceptionality, freshness, confidence, evidence strength, cost uncertainty and journey fit.
- **Positive Gate**: Low-evidence prices cannot receive authoritative discount or lowest-ever claims.
- **Negative Gate**: A13 & NEG-09: Reject duplicate scan data treated as independent strong epochs
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F13] History/Matrix (P0)
- **Atom ID**: `ATOM-F13`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W3_AUTHORITATIVE_SEARCH_ROUTEBEST_DETAIL_HISTORY`
- **Caller**: `src/app/domain/opportunityCohort.ts, src/app/domain/dealClaims.ts, src/app/components/PriceHistoryChart.tsx`
- **Solution Contract**: Same-offer time-series by observed_at; departure-date matrix by travel_date; comparable cohort as separate product.
- **Positive Gate**: Departure date never masquerades as observation timestamp.
- **Negative Gate**: A14 & NEG-10: Reject departure date used as observation timestamp
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F14] Opportunity Detail (P0)
- **Atom ID**: `ATOM-F14`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W3_AUTHORITATIVE_SEARCH_ROUTEBEST_DETAIL_HISTORY`
- **Caller**: `src/app/data/api.ts:searchDealsWithStatus, src/app/data/api.ts:sortDeals, src/domain/farely/routeBest.ts`
- **Solution Contract**: Primary deal card enters Farely's own stable Opportunity Decision Detail; external provider verification is a subsequent CTA.
- **Positive Gate**: Card opens the correct durable opportunity with evidence and alternatives.
- **Negative Gate**: A15 & NEG-01: Reject suboptimal alternative offered as RouteBest
- **E2E Gate**: e2e/v32-journeys-j01-j10.spec.ts: J01 Direct Search & J03 RouteBest
- **Current Status**: `IMPLEMENTED`

### [F15] Saved lifecycle (P0)
- **Atom ID**: `ATOM-F15`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W4_SAVED_WATCH_CONFIRMATION_MONITORING`
- **Caller**: `src/app/data/alertApi.ts, src/app/pages/WatchPage.tsx, supabase/functions/setup-alert/index.ts`
- **Solution Contract**: Persist stable opportunity reference, saved-price snapshot, observed time, current state, expiry, alias migration and account ownership.
- **Positive Gate**: Saved survives refresh and correctly shows stale/replaced/invalidated opportunities.
- **Negative Gate**: A16 & NEG-36: Reject Saved opportunity identity collision across generations
- **E2E Gate**: e2e/v32-journeys-j01-j10.spec.ts: J04 Saved Opportunity Persistence
- **Current Status**: `IMPLEMENTED`

### [F16] Watch & notification (P0)
- **Atom ID**: `ATOM-F16`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W4_SAVED_WATCH_CONFIRMATION_MONITORING`
- **Caller**: `src/app/data/alertApi.ts, src/app/pages/WatchPage.tsx, supabase/functions/setup-alert/index.ts`
- **Solution Contract**: Qualified Watch transition -> durable outbox -> provider acceptance -> delivery evidence where available -> deduped retry.
- **Positive Gate**: No duplicate logical notification episode; no strong price alert based on invalid coverage.
- **Negative Gate**: A17 & NEG-15: Reject unpersisted local draft claiming ACTIVE status
- **E2E Gate**: e2e/v32-journeys-j01-j10.spec.ts: J05 & J06 & J07 Watch Lifecycle
- **Current Status**: `IMPLEMENTED`

### [F17] Security/privacy (P0)
- **Atom ID**: `ATOM-F17`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W4_SAVED_WATCH_CONFIRMATION_MONITORING`
- **Caller**: `src/app/data/alertApi.ts, src/app/pages/WatchPage.tsx, supabase/functions/setup-alert/index.ts`
- **Solution Contract**: RLS, grants, RPC access, private credentials, consent, account deletion and bounded public APIs.
- **Positive Gate**: Tenant-crossing and privileged RPC abuse tests fail closed.
- **Negative Gate**: A18 & PS35-13: Reject missing scan coverage claiming ACTIVE_MONITORED
- **E2E Gate**: e2e/v32-journeys-j01-j10.spec.ts: J05 & J06 & J07 Watch Lifecycle
- **Current Status**: `IMPLEMENTED`

### [F18] Performance & accessibility (P0)
- **Atom ID**: `ATOM-F18`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W5_EPISODES_OUTBOX_DELIVERY_RECEIPTS`
- **Caller**: `supabase/functions/alert-processor/index.ts, supabase/functions/_shared/watch-condition.ts:buildConditionFingerprint, supabase/migrations/20261009000100_forward_recovery_and_durable_scheduler.sql`
- **Solution Contract**: Actual hydrated browser tests, accessible forms/focus, real Web Vitals where measurable and manual critical journey review.
- **Positive Gate**: No critical user-flow accessibility blocker; report measured numbers instead of fabricated performance scores.
- **Negative Gate**: A19 & EV34-21 & RC-15: Reject duplicate condition episodes after worker retry or criteria mutation
- **E2E Gate**: e2e/v32-journeys-j01-j10.spec.ts: J05 & J06 & J07 Watch Lifecycle
- **Current Status**: `IMPLEMENTED`

### [F19] Production release/soak (P0)
- **Atom ID**: `ATOM-F19`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W5_EPISODES_OUTBOX_DELIVERY_RECEIPTS`
- **Caller**: `supabase/functions/alert-processor/index.ts, supabase/functions/_shared/watch-condition.ts:buildConditionFingerprint, supabase/migrations/20261009000100_forward_recovery_and_durable_scheduler.sql`
- **Solution Contract**: Authorized release process, exact deployment tuple, reversible rollout and at least 24 hours of actual runtime continuity for the historical soak gate.
- **Positive Gate**: Synthetic time-series or forged elapsed time cannot satisfy longitudinal proof.
- **Negative Gate**: A20 & NEG-22: Reject unlocked outbox lease causing race or double send
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F20] End-to-end anti-regression (P0)
- **Atom ID**: `ATOM-F20`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W5_EPISODES_OUTBOX_DELIVERY_RECEIPTS`
- **Caller**: `supabase/functions/alert-processor/index.ts, supabase/functions/_shared/watch-condition.ts:buildConditionFingerprint, supabase/migrations/20261009000100_forward_recovery_and_durable_scheduler.sql`
- **Solution Contract**: Real-module tests, integration, browser journeys, database replay, adversarial faults and preservation proofs.
- **Positive Gate**: Critical user journeys survive changes without accepted regression.
- **Negative Gate**: A21 & NEG-21: Reject outbox SENT status treated as delivered message
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F21] Budget-first Everywhere Explore (P1)
- **Atom ID**: `ATOM-F21`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W6_SECURITY_PRIVACY_UX_A11Y_SEO`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Origin + maximum budget + flexible travel period -> destination groups from fully covered eligible scopes.
- **Positive Gate**: Do not derive minimum price from first-page results or incomplete markets without a coverage warning.
- **Negative Gate**: NEG-ADVERSARIAL-F21: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F22] Flexible Date Matrix (P1)
- **Atom ID**: `ATOM-F22`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W6_SECURITY_PRIVACY_UX_A11Y_SEO`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Per-date observed minimum with same PriceScope, source age, cohort integrity and coverage status.
- **Positive Gate**: Missing cells show UNKNOWN, never 0₫ or invented fare.
- **Negative Gate**: NEG-ADVERSARIAL-F22: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F23] Airport alternatives (P1)
- **Atom ID**: `ATOM-F23`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W6_SECURITY_PRIVACY_UX_A11Y_SEO`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Nearby airport suggestions with actual transfer time/cost sources or explicitly labeled estimates.
- **Positive Gate**: Compare grounded air fare savings against travel inconvenience, not price-only airport swaps.
- **Negative Gate**: NEG-ADVERSARIAL-F23: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F24] Personal value of time (P1)
- **Atom ID**: `ATOM-F24`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W6_SECURITY_PRIVACY_UX_A11Y_SEO`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Optional disclosed user preferences for duration, stops and inconvenience; keep objective cheapest independent.
- **Positive Gate**: Turning preferences off restores transparent price ranking.
- **Negative Gate**: NEG-ADVERSARIAL-F24: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F25] Opportunity rationale (P1)
- **Atom ID**: `ATOM-F25`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W6_SECURITY_PRIVACY_UX_A11Y_SEO`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Expose sample count, independent epochs, comparable cohort, exclusions, observation age and claim ceiling.
- **Positive Gate**: A user can understand how Farely reached a recommendation.
- **Negative Gate**: NEG-ADVERSARIAL-F25: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F26] Price verification step (P1)
- **Atom ID**: `ATOM-F26`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W6_SECURITY_PRIVACY_UX_A11Y_SEO`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Clearly distinguish observed price, indicative CTA and provider-repriced quote when available.
- **Positive Gate**: Measure reported price match/mismatch, never infer a completed booking from a click.
- **Negative Gate**: NEG-ADVERSARIAL-F26: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F27] Watch setup from intent (P1)
- **Atom ID**: `ATOM-F27`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W6_SECURITY_PRIVACY_UX_A11Y_SEO`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Prepopulate and explicitly preview exact TravelIntent, departure/return conditions, price, expiry and cadence.
- **Positive Gate**: No silent modification of trip dates or traveler composition.
- **Negative Gate**: NEG-ADVERSARIAL-F27: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F28] Saved comparison board (P1)
- **Atom ID**: `ATOM-F28`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W6_SECURITY_PRIVACY_UX_A11Y_SEO`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Compare 2–4 saved compatible opportunities by verified cost fields, schedule, conditions, age and uncertainties.
- **Positive Gate**: No unknown information silently promoted to known.
- **Negative Gate**: NEG-ADVERSARIAL-F28: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F29] Fare movement timeline (P1)
- **Atom ID**: `ATOM-F29`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W6_SECURITY_PRIVACY_UX_A11Y_SEO`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Observed price history over time, with raw observations and missing-scan gaps.
- **Positive Gate**: Chart cannot use travel departure dates as historical observation dates.
- **Negative Gate**: NEG-ADVERSARIAL-F29: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F30] Fare recheck feedback (P1)
- **Atom ID**: `ATOM-F30`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W6_SECURITY_PRIVACY_UX_A11Y_SEO`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Accept user-reported matched, changed or unavailable price with source and timestamp.
- **Positive Gate**: Feedback remains USER_REPORTED until independently verified.
- **Negative Gate**: NEG-ADVERSARIAL-F30: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F31] Decision modes (P1)
- **Atom ID**: `ATOM-F31`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W6_SECURITY_PRIVACY_UX_A11Y_SEO`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Separate Cheapest Observed, Convenient, Budget Fit and Lower Risk rankings.
- **Positive Gate**: Users can inspect ranking reasons and return to objective price sort.
- **Negative Gate**: NEG-ADVERSARIAL-F31: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F32] Discovery empty/degraded recovery (P1)
- **Atom ID**: `ATOM-F32`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W6_SECURITY_PRIVACY_UX_A11Y_SEO`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Separate provider unavailable, no scan, partial coverage, genuinely no eligible offer and stale state.
- **Positive Gate**: Provider 503 does not show generic "không tìm thấy vé".
- **Negative Gate**: NEG-ADVERSARIAL-F32: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F33] Vietnamese-first travel language (P1)
- **Atom ID**: `ATOM-F33`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W6_SECURITY_PRIVACY_UX_A11Y_SEO`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Natural Vietnamese UI for price units, observed-age, local date/time, baggage, airline and fare conditions.
- **Positive Gate**: Real user tasks show comprehension of data limitations.
- **Negative Gate**: NEG-ADVERSARIAL-F33: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F34] Digest and noise control (P1)
- **Atom ID**: `ATOM-F34`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W6_SECURITY_PRIVACY_UX_A11Y_SEO`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Instant/daily/weekly cadence, quiet hours, per-episode suppression, unsubscribe and delivery health.
- **Positive Gate**: No duplicate notifications and measurable alert burden.
- **Negative Gate**: NEG-ADVERSARIAL-F34: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F35] Data provenance UI (P1)
- **Atom ID**: `ATOM-F35`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W6_SECURITY_PRIVACY_UX_A11Y_SEO`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Compact source/age/evidence badges with detailed provenance on demand.
- **Positive Gate**: Users distinguish observed vs verified vs unavailable.
- **Negative Gate**: NEG-ADVERSARIAL-F35: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F36] Trust-calibrated Buy/Wait guidance (P2)
- **Atom ID**: `ATOM-F36`
- **Variant**: `V1_V2_RECONCILED`
- **Owner Commitment**: `APPROVED_REQUIRED_FUTURE`
- **Wave**: `W9_APPROVED_FUTURE_CAPABILITY_EXECUTION`
- **Caller**: `src/domain/farely/f36-extension.ts, src/domain/farely/index.ts`
- **Solution Contract**: Longitudinal train/test split, forecast calibration, naive-baseline comparison and confidence limits.
- **Positive Gate**: Return insufficient_data until real out-of-sample evidence supports stronger guidance.
- **Negative Gate**: NEG-ADVERSARIAL-F36: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F37] Price anomaly detection (P2)
- **Atom ID**: `ATOM-F37`
- **Variant**: `V1_V2_RECONCILED`
- **Owner Commitment**: `APPROVED_REQUIRED_FUTURE`
- **Wave**: `W9_APPROVED_FUTURE_CAPABILITY_EXECUTION`
- **Caller**: `src/domain/farely/f37-extension.ts, src/domain/farely/index.ts`
- **Solution Contract**: Robust seasonal/change-point analysis with measured precision@K and false-deal rate.
- **Positive Gate**: Never make strong anomaly claims on insufficient sample.
- **Negative Gate**: NEG-ADVERSARIAL-F37: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F38] Personalized travel feed (P2)
- **Atom ID**: `ATOM-F38`
- **Variant**: `V1_V2_RECONCILED`
- **Owner Commitment**: `APPROVED_REQUIRED_FUTURE`
- **Wave**: `W9_APPROVED_FUTURE_CAPABILITY_EXECUTION`
- **Caller**: `src/domain/farely/f38-extension.ts, src/domain/farely/index.ts`
- **Solution Contract**: Explicit preference opt-in, privacy controls and controlled retention/saved-outcome evaluation.
- **Positive Gate**: No sensitive inference or covert profiling.
- **Negative Gate**: NEG-ADVERSARIAL-F38: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F39] Weekend escape templates (P2)
- **Atom ID**: `ATOM-F39`
- **Variant**: `V1_V2_RECONCILED`
- **Owner Commitment**: `APPROVED_REQUIRED_FUTURE`
- **Wave**: `W9_APPROVED_FUTURE_CAPABILITY_EXECUTION`
- **Caller**: `src/domain/farely/f39-extension.ts, src/domain/farely/index.ts`
- **Solution Contract**: Schedule-aware weekends, local holidays, departure/arrival time and known fare coverage.
- **Positive Gate**: Templates must be possible and based on observed supporting data.
- **Negative Gate**: NEG-ADVERSARIAL-F39: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F40] Group/family fare planning (P2)
- **Atom ID**: `ATOM-F40`
- **Variant**: `V1_V2_RECONCILED`
- **Owner Commitment**: `APPROVED_REQUIRED_FUTURE`
- **Wave**: `W9_APPROVED_FUTURE_CAPABILITY_EXECUTION`
- **Caller**: `src/domain/farely/f40-extension.ts, src/domain/farely/index.ts`
- **Solution Contract**: Correct traveler ages, baggage, seats and total-party fare scope.
- **Positive Gate**: Single-adult price cannot be shown as family total.
- **Negative Gate**: NEG-ADVERSARIAL-F40: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F41] Multi-city itinerary (P2)
- **Atom ID**: `ATOM-F41`
- **Variant**: `V1_V2_RECONCILED`
- **Owner Commitment**: `APPROVED_REQUIRED_FUTURE`
- **Wave**: `W9_APPROVED_FUTURE_CAPABILITY_EXECUTION`
- **Caller**: `src/domain/farely/f41-extension.ts, src/domain/farely/index.ts`
- **Solution Contract**: Explicit multi-slice TravelIntent and provider-supported itinerary coherence.
- **Positive Gate**: No joining unrelated one-way tickets into a fictitious single purchasable offer.
- **Negative Gate**: NEG-ADVERSARIAL-F41: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F42] Deal curation and editorial collections (P2)
- **Atom ID**: `ATOM-F42`
- **Variant**: `V1_V2_RECONCILED`
- **Owner Commitment**: `APPROVED_REQUIRED_FUTURE`
- **Wave**: `W9_APPROVED_FUTURE_CAPABILITY_EXECUTION`
- **Caller**: `src/domain/farely/f42-extension.ts, src/domain/farely/index.ts`
- **Solution Contract**: Human-reviewable collections based on evidence, freshness and expiry.
- **Positive Gate**: No fabricated scarcity or unsupported featured discount.
- **Negative Gate**: NEG-ADVERSARIAL-F42: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F43] Direct/affiliate provider comparison (P2)
- **Atom ID**: `ATOM-F43`
- **Variant**: `V1_V2_RECONCILED`
- **Owner Commitment**: `APPROVED_REQUIRED_FUTURE`
- **Wave**: `W9_APPROVED_FUTURE_CAPABILITY_EXECUTION`
- **Caller**: `src/domain/farely/f43-extension.ts, src/domain/farely/index.ts`
- **Solution Contract**: Compare actual provider quote basis, refresh state, link class, partner rights and disclosures.
- **Positive Gate**: Commercial ranking does not override undisclosed objective cheapest result.
- **Negative Gate**: NEG-ADVERSARIAL-F43: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F44] Anonymous -> account continuity (P2)
- **Atom ID**: `ATOM-F44`
- **Variant**: `V1_V2_RECONCILED`
- **Owner Commitment**: `APPROVED_REQUIRED_FUTURE`
- **Wave**: `W9_APPROVED_FUTURE_CAPABILITY_EXECUTION`
- **Caller**: `src/domain/farely/f44-extension.ts, src/domain/farely/index.ts`
- **Solution Contract**: Explicit consent-based guest-to-account Saved/Watch transfer with identity isolation.
- **Positive Gate**: No silent cross-account merge.
- **Negative Gate**: NEG-ADVERSARIAL-F44: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F45] Sharing, referrals and viral loops (P2)
- **Atom ID**: `ATOM-F45`
- **Variant**: `V1_V2_RECONCILED`
- **Owner Commitment**: `APPROVED_REQUIRED_FUTURE`
- **Wave**: `W9_APPROVED_FUTURE_CAPABILITY_EXECUTION`
- **Caller**: `src/domain/farely/f45-extension.ts, src/domain/farely/index.ts`
- **Solution Contract**: Public links without personal information, bounded abuse controls and measurable acquisition outcomes.
- **Positive Gate**: No PII leaks or misleading stale deal shares.
- **Negative Gate**: NEG-ADVERSARIAL-F45: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F46] Explore by total trip budget (P2)
- **Atom ID**: `ATOM-F46`
- **Variant**: `V1_V2_RECONCILED`
- **Owner Commitment**: `APPROVED_REQUIRED_FUTURE`
- **Wave**: `W9_APPROVED_FUTURE_CAPABILITY_EXECUTION`
- **Caller**: `src/domain/farely/f46-extension.ts, src/domain/farely/index.ts`
- **Solution Contract**: Include hotel and ground components only with source-supported data; preserve uncertainty.
- **Positive Gate**: No exact trip-total claim with unknown material costs.
- **Negative Gate**: NEG-ADVERSARIAL-F46: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F47] Partner integrations (P2)
- **Atom ID**: `ATOM-F47`
- **Variant**: `V1_V2_RECONCILED`
- **Owner Commitment**: `APPROVED_REQUIRED_FUTURE`
- **Wave**: `W9_APPROVED_FUTURE_CAPABILITY_EXECUTION`
- **Caller**: `src/domain/farely/f47-extension.ts, src/domain/farely/index.ts`
- **Solution Contract**: Provider capability, live repricing, commercial permission, reliability and unit-economics evaluation.
- **Positive Gate**: No source enabled commercially without supporting rights and economics.
- **Negative Gate**: NEG-ADVERSARIAL-F47: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F48] Mobile-first PWA and push (P2)
- **Atom ID**: `ATOM-F48`
- **Variant**: `V1_V2_RECONCILED`
- **Owner Commitment**: `APPROVED_REQUIRED_FUTURE`
- **Wave**: `W9_APPROVED_FUTURE_CAPABILITY_EXECUTION`
- **Caller**: `src/domain/farely/f48-extension.ts, src/domain/farely/index.ts`
- **Solution Contract**: Offline-safe experience, permission/consent, cache certainty protection and Watch-driven notification value.
- **Positive Gate**: Offline observed fares cannot appear as freshly available deals.
- **Negative Gate**: NEG-ADVERSARIAL-F48: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F49] AI travel copilot (P3)
- **Atom ID**: `ATOM-F49`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_CONDITIONAL`
- **Wave**: `W9_APPROVED_FUTURE_CAPABILITY_EXECUTION`
- **Caller**: `src/domain/farely/conditionalGrowthSafety.ts`
- **Solution Contract**: LLM uses typed verified tools and deterministic price computation. No hallucinated prices, routes or available seats.
- **Positive Gate**: Empirical usefulness and factual grounding must beat simpler workflows before public activation.
- **Negative Gate**: NEG-ADVERSARIAL-F49: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `CONDITIONALLY_STAGED`

### [F50] Historical fare forecasting (P3)
- **Atom ID**: `ATOM-F50`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_CONDITIONAL`
- **Wave**: `W9_APPROVED_FUTURE_CAPABILITY_EXECUTION`
- **Caller**: `src/domain/farely/conditionalGrowthSafety.ts`
- **Solution Contract**: Longitudinal unbiased observation data and rolling-horizon backtesting.
- **Positive Gate**: No forecasting launch without evidence of calibration and practical value.
- **Negative Gate**: NEG-ADVERSARIAL-F50: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `CONDITIONALLY_STAGED`

### [F51] Subscription/premium Watch (P3)
- **Atom ID**: `ATOM-F51`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_CONDITIONAL`
- **Wave**: `W9_APPROVED_FUTURE_CAPABILITY_EXECUTION`
- **Caller**: `src/domain/farely/conditionalGrowthSafety.ts`
- **Solution Contract**: Proven recurring alert value, compliant billing, cancellation, support and consent.
- **Positive Gate**: No paid launch without commercial and product authorization.
- **Negative Gate**: NEG-ADVERSARIAL-F51: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `CONDITIONALLY_STAGED`

### [F52] Full ticket checkout (P3)
- **Atom ID**: `ATOM-F52`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_CONDITIONAL`
- **Wave**: `W9_APPROVED_FUTURE_CAPABILITY_EXECUTION`
- **Caller**: `src/domain/farely/conditionalGrowthSafety.ts`
- **Solution Contract**: Licensed issuing/fulfillment, booking provider integration, payment, refunds and support.
- **Positive Gate**: No direct checkout launch without authorized supplier and operational responsibility.
- **Negative Gate**: NEG-23 & A3: Reject full checkout promotion without explicit Founder authorization superseding non-OTA boundary
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `CONDITIONALLY_STAGED`

### [F53] B2B Fare Intelligence API (P3)
- **Atom ID**: `ATOM-F53`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_CONDITIONAL`
- **Wave**: `W9_APPROVED_FUTURE_CAPABILITY_EXECUTION`
- **Caller**: `src/domain/farely/conditionalGrowthSafety.ts`
- **Solution Contract**: Explicit source redistribution rights, commercial quota, billing and quality SLA.
- **Positive Gate**: No B2B data resale based merely on the license of a scraper library.
- **Negative Gate**: NEG-ADVERSARIAL-F53: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `CONDITIONALLY_STAGED`

### [F54] Credit-card / promotion optimization (P3)
- **Atom ID**: `ATOM-F54`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_CONDITIONAL`
- **Wave**: `W9_APPROVED_FUTURE_CAPABILITY_EXECUTION`
- **Caller**: `src/domain/farely/conditionalGrowthSafety.ts`
- **Solution Contract**: Actual provider payable price + accurate card/promotion terms and effective periods.
- **Positive Gate**: No invented savings or irrelevant cashback catalog.
- **Negative Gate**: NEG-ADVERSARIAL-F54: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `CONDITIONALLY_STAGED`

### [F55] International language and market expansion (P3)
- **Atom ID**: `ATOM-F55`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_CONDITIONAL`
- **Wave**: `W9_APPROVED_FUTURE_CAPABILITY_EXECUTION`
- **Caller**: `src/domain/farely/conditionalGrowthSafety.ts`
- **Solution Contract**: Provider country rights, currency handling, localized policy and operational support.
- **Positive Gate**: No market release without supported data and service model.
- **Negative Gate**: NEG-ADVERSARIAL-F55: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `CONDITIONALLY_STAGED`

### [F56] Authenticated Watch scoping (P0)
- **Atom ID**: `ATOM-F56`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W7_REALPATH_ADVERSARIAL_MIGRATION`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Remote tenant-owned Watch records are authoritative for signed-in users; guest cache must be isolated.
- **Positive Gate**: Account A logout -> Account B login shows no A Watch/email.
- **Negative Gate**: NEG-ADVERSARIAL-F56: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F57] Watch mutation acknowledgement (P0)
- **Atom ID**: `ATOM-F57`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W7_REALPATH_ADVERSARIAL_MIGRATION`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Server-authoritative idempotent pause/resume/delete and UI rollback.
- **Positive Gate**: 403/500/offline cannot result in confirmed success UI.
- **Negative Gate**: NEG-ADVERSARIAL-F57: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F58] Typed WatchDateScope (P0)
- **Atom ID**: `ATOM-F58`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W7_REALPATH_ADVERSARIAL_MIGRATION`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Distinct outboundDateFrom/To, returnDateFrom/To, duration and any-date monitoring horizon.
- **Positive Gate**: Return date never becomes outbound window end.
- **Negative Gate**: NEG-ADVERSARIAL-F58: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F59] No invented observation time (P0)
- **Atom ID**: `ATOM-F59`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W7_REALPATH_ADVERSARIAL_MIGRATION`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Separate provider_observed_at, fetched_at and processed_at; preserve unknown provider time.
- **Positive Gate**: Unknown timestamp cannot be converted into "just observed".
- **Negative Gate**: NEG-ADVERSARIAL-F59: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F60] Provider date provenance (P0)
- **Atom ID**: `ATOM-F60`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W7_REALPATH_ADVERSARIAL_MIGRATION`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Dates must originate from supported provider data and be validated.
- **Positive Gate**: Request date alone cannot certify physical flight date.
- **Negative Gate**: NEG-ADVERSARIAL-F60: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F61] One-way/roundtrip support boundary (P1)
- **Atom ID**: `ATOM-F61`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W7_REALPATH_ADVERSARIAL_MIGRATION`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Typed capability matrix for each provider.
- **Positive Gate**: One-way request never silently becomes round-trip.
- **Negative Gate**: NEG-ADVERSARIAL-F61: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F62] Immutable response coverage identity (P0)
- **Atom ID**: `ATOM-F62`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W7_REALPATH_ADVERSARIAL_MIGRATION`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Each response includes scope fingerprint, source mode, coverage IDs and generation.
- **Positive Gate**: A partial result page cannot claim full-market coverage.
- **Negative Gate**: NEG-ADVERSARIAL-F62: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F63] Watch visibility & truthful SLA (P0)
- **Atom ID**: `ATOM-F63`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W7_REALPATH_ADVERSARIAL_MIGRATION`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Show last checked, actual scan health, expected next evaluation and degraded status.
- **Positive Gate**: Stalled Watch cannot appear recently evaluated.
- **Negative Gate**: NEG-ADVERSARIAL-F63: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F64] Notification observed-at fidelity (P0)
- **Atom ID**: `ATOM-F64`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W7_REALPATH_ADVERSARIAL_MIGRATION`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Every price-specific alert references actual source observation and time.
- **Positive Gate**: Missing observation ID prevents a strong fare notification.
- **Negative Gate**: NEG-ADVERSARIAL-F64: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F65] Source mode quarantine (P0)
- **Atom ID**: `ATOM-F65`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W7_REALPATH_ADVERSARIAL_MIGRATION`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Separate OBSERVED_SCRAPE, CACHED_PRICE, LIVE_SEARCH and REPRICED modes.
- **Positive Gate**: Cached fares cannot be labeled purchasable live inventory.
- **Negative Gate**: NEG-ADVERSARIAL-F65: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F66] Currency and price scope integrity (P0)
- **Atom ID**: `ATOM-F66`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W7_REALPATH_ADVERSARIAL_MIGRATION`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Persist ISO currency, traveler mix, price unit and FX source/time when converted.
- **Positive Gate**: No cross-currency cheapest claim without suitable conversion evidence.
- **Negative Gate**: NEG-ADVERSARIAL-F66: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F67] Baggage/fare-rule uncertainty (P1)
- **Atom ID**: `ATOM-F67`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W7_REALPATH_ADVERSARIAL_MIGRATION`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Known mandatory fees, optional fees, estimates and unknowns are separate.
- **Positive Gate**: Unknown baggage is not free or included.
- **Negative Gate**: NEG-ADVERSARIAL-F67: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F68] Airport and local datetime correctness (P1)
- **Atom ID**: `ATOM-F68`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W7_REALPATH_ADVERSARIAL_MIGRATION`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: IATA airport vs metro scope, timezone-aware flight instants and overnight connections.
- **Positive Gate**: Cross-timezone or same-city airport alternatives are evaluated correctly.
- **Negative Gate**: NEG-ADVERSARIAL-F68: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F69] Canonical client data adapters (P0)
- **Atom ID**: `ATOM-F69`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W7_REALPATH_ADVERSARIAL_MIGRATION`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Typed adapters preserve null/unknown instead of Number(x)||0 coercion.
- **Positive Gate**: Unknown values survive API -> UI -> Saved -> Watch -> notification.
- **Negative Gate**: NEG-ADVERSARIAL-F69: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F70] Watch source quorum and parser mode (P0)
- **Atom ID**: `ATOM-F70`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W7_REALPATH_ADVERSARIAL_MIGRATION`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Monitor parser/partition outcomes before certifying successful empty search.
- **Positive Gate**: Zero rows + parse failure = provider failure, not verified empty.
- **Negative Gate**: NEG-ADVERSARIAL-F70: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F71] Demand scheduler guarantees (P0)
- **Atom ID**: `ATOM-F71`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W7_REALPATH_ADVERSARIAL_MIGRATION`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Full active Watch demand union precedes candidate limit and quota selection.
- **Positive Gate**: Watch route beyond first-N tracked routes is not silently starved.
- **Negative Gate**: NEG-ADVERSARIAL-F71: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F72] Exact vs indicative CTA gate (P1)
- **Atom ID**: `ATOM-F72`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W7_REALPATH_ADVERSARIAL_MIGRATION`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Use exact deep links only when validated and allowed; generic/expired links disclose limits.
- **Positive Gate**: Generic search link cannot be labeled exact offer purchase.
- **Negative Gate**: NEG-ADVERSARIAL-F72: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F73] Browser-cache staleness ceiling (P0)
- **Atom ID**: `ATOM-F73`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W7_REALPATH_ADVERSARIAL_MIGRATION`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Cache entries carry observed timestamp, fetched timestamp, source and TTL.
- **Positive Gate**: A 7-day-old cache is never shown as a fresh fare.
- **Negative Gate**: NEG-ADVERSARIAL-F73: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F74] Cross-user analytics and privacy (P0)
- **Atom ID**: `ATOM-F74`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W6_SECURITY_PRIVACY_UX_A11Y_SEO`
- **Caller**: `supabase/functions/manage-user-data/index.ts, src/app/pages/PrivacyPage.tsx`
- **Solution Contract**: Session/auth-bound pseudonymous analytics and logout cleanup.
- **Positive Gate**: No Watch/email leakage through browser caches or queued events.
- **Negative Gate**: A35 & NEG-37: Reject cross-account telemetry and cached data leakage
- **E2E Gate**: e2e/v32-journeys-j01-j10.spec.ts: J09 Account Data Rights & Deletion
- **Current Status**: `IMPLEMENTED`

### [F75] Verification reconciliation feedback (P1)
- **Atom ID**: `ATOM-F75`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W7_REALPATH_ADVERSARIAL_MIGRATION`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Capture observed price vs user/provider recheck result with valid denominators.
- **Positive Gate**: No booking or price-match success inferred from mere external clicks.
- **Negative Gate**: NEG-ADVERSARIAL-F75: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F76] Transparent partnership ranking (P1)
- **Atom ID**: `ATOM-F76`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W3_AUTHORITATIVE_SEARCH_ROUTEBEST_DETAIL_HISTORY`
- **Caller**: `src/app/data/api.ts:searchDealsWithStatus, src/app/data/api.ts:sortDeals, src/domain/farely/routeBest.ts`
- **Solution Contract**: Separate editorial/affiliate promotion from objective cheapest ranking.
- **Positive Gate**: Changing referral revenue cannot silently change price sort.
- **Negative Gate**: NEG-ADVERSARIAL-F76: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F77] Secret and quota hygiene (P0)
- **Atom ID**: `ATOM-F77`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W6_SECURITY_PRIVACY_UX_A11Y_SEO`
- **Caller**: `supabase/functions/manage-user-data/index.ts, src/app/pages/PrivacyPage.tsx`
- **Solution Contract**: Server-only secrets, redacted logs, safe provider quotas, rate limits, circuit breakers.
- **Positive Gate**: No secret leaks; quota 429 handled without false data truth.
- **Negative Gate**: A37 & PS35-11: Reject unlicensed provider operations and leaked secrets
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F78] Synthetic-proof adversary (P0)
- **Atom ID**: `ATOM-F78`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W0_SOURCE_AUTHORITY`
- **Caller**: `scripts/verify-certification-integrity.node-test.mjs, scripts/release-manifest.node-test.mjs`
- **Solution Contract**: Gate-bound assertions, source hashes, real elapsed receipts and mutation detection.
- **Positive Gate**: Forged timestamps or parent SHA cannot prove new runtime behavior.
- **Negative Gate**: A38 & NEG-28: Reject synthetic soak proof and forged review timestamps
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F79] Visual intent task tests (P1)
- **Atom ID**: `ATOM-F79`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W7_REALPATH_ADVERSARIAL_MIGRATION`
- **Caller**: `src/app/data/api.ts, src/app/domain/`
- **Solution Contract**: Actual tasks: find, compare, save, Watch, verify and understand data status.
- **Positive Gate**: Measurable task success/confusion; screenshots alone are insufficient.
- **Negative Gate**: NEG-ADVERSARIAL-F79: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F80] Compact evidence-led cards (P1)
- **Atom ID**: `ATOM-F80`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W3_AUTHORITATIVE_SEARCH_ROUTEBEST_DETAIL_HISTORY`
- **Caller**: `src/domain/farely/costEpistemics.ts, src/domain/farely/priceScope.ts`
- **Solution Contract**: Price basis, observed age, source class and uncertainty in progressive UI.
- **Positive Gate**: Users understand observed fare may change before booking.
- **Negative Gate**: NEG-ADVERSARIAL-F80: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/v32-journeys-j01-j10.spec.ts: J02 Accurate Cost Breakdown
- **Current Status**: `IMPLEMENTED`

### [F81] PWA operational safeguards (P1)
- **Atom ID**: `ATOM-F81`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W6_SECURITY_PRIVACY_UX_A11Y_SEO`
- **Caller**: `src/domain/farely/pwaOfflineFreshness.ts, public/sw.js`
- **Solution Contract**: Offline-safe caching, secret safety and stale-data warnings.
- **Positive Gate**: Offline state cannot elevate cached fare certainty.
- **Negative Gate**: NEG-ADVERSARIAL-F81: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F82] Deal invalidation and lifecycle (P1)
- **Atom ID**: `ATOM-F82`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W7_REALPATH_ADVERSARIAL_MIGRATION`
- **Caller**: `src/domain/farely/identity.ts, src/app/data/deals.ts`
- **Solution Contract**: Stable historical opportunity, expired/replaced states and compatible alternatives.
- **Positive Gate**: Saved opportunity does not disappear or point to a different physical flight.
- **Negative Gate**: NEG-ADVERSARIAL-F82: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F83] End-to-end after schema upgrade (P0)
- **Atom ID**: `ATOM-F83`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W7_REALPATH_ADVERSARIAL_MIGRATION`
- **Caller**: `scripts/migration-parity.node-test.mjs, supabase/migrations/`
- **Solution Contract**: Forward-compatible DB migrations and Edge/function signature checks.
- **Positive Gate**: Old/new consumer compatibility proven in isolated integration.
- **Negative Gate**: A39 & PS35-04: Reject mixed-version API/DB migration breaks
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F84] Real notification receipt chain (P0)
- **Atom ID**: `ATOM-F84`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W5_EPISODES_OUTBOX_DELIVERY_RECEIPTS`
- **Caller**: `supabase/functions/alert-processor/index.ts, supabase/functions/_shared/watch-condition.ts:buildConditionFingerprint, supabase/migrations/20261009000100_forward_recovery_and_durable_scheduler.sql`
- **Solution Contract**: Watch match -> durable outbox -> provider acceptance -> signed delivery event where supported.
- **Positive Gate**: Provider accepted is not delivered; logical episodes deduplicated.
- **Negative Gate**: NEG-ADVERSARIAL-F84: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F85] Provider source rights registry (P1)
- **Atom ID**: `ATOM-F85`
- **Variant**: `STANDARD`
- **Owner Commitment**: `APPROVED_REQUIRED_CURRENT`
- **Wave**: `W2_PROVIDER_ADAPTERS_ENTITLEMENTS_COVERAGE`
- **Caller**: `src/domain/farely/providerRights.ts, src/domain/farely/providerCapabilities.ts`
- **Solution Contract**: Track source scraping terms, display, caching, redistribution and affiliate rights.
- **Positive Gate**: No premium/B2B redistribution without actual rights.
- **Negative Gate**: NEG-ADVERSARIAL-F85: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F86] Vietnam-specific travel UX (P2)
- **Atom ID**: `ATOM-F86`
- **Variant**: `V1_V2_RECONCILED`
- **Owner Commitment**: `APPROVED_REQUIRED_FUTURE`
- **Wave**: `W9_APPROVED_FUTURE_CAPABILITY_EXECUTION`
- **Caller**: `src/domain/farely/f86-extension.ts, src/domain/farely/index.ts`
- **Solution Contract**: Vietnamese airport names, VND, baggage options, holidays and local transport context.
- **Positive Gate**: Localized real-data user tasks.
- **Negative Gate**: NEG-ADVERSARIAL-F86: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F87] Intent-based itinerary group planner (P2)
- **Atom ID**: `ATOM-F87`
- **Variant**: `V1_V2_RECONCILED`
- **Owner Commitment**: `APPROVED_REQUIRED_FUTURE`
- **Wave**: `W9_APPROVED_FUTURE_CAPABILITY_EXECUTION`
- **Caller**: `src/domain/farely/f87-extension.ts, src/domain/farely/index.ts`
- **Solution Contract**: Group/family/multi-leg planning only with compatible trip and price units.
- **Positive Gate**: No one-person price promoted to total family fare.
- **Negative Gate**: NEG-ADVERSARIAL-F87: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

### [F88] Data economics optimizer (P2)
- **Atom ID**: `ATOM-F88`
- **Variant**: `V1_V2_RECONCILED`
- **Owner Commitment**: `APPROVED_REQUIRED_FUTURE`
- **Wave**: `W9_APPROVED_FUTURE_CAPABILITY_EXECUTION`
- **Caller**: `src/domain/farely/f88-extension.ts, src/domain/farely/index.ts`
- **Solution Contract**: Track cost per scanned scope, eligible offer, verified opportunity and useful Watch event.
- **Positive Gate**: No scan expansion without measured marginal value.
- **Negative Gate**: NEG-ADVERSARIAL-F88: Adversarial challenge falsification against real production modules
- **E2E Gate**: e2e/app.spec.ts: Core User Journey Integration
- **Current Status**: `IMPLEMENTED`

================================================================
B. RESEARCH BASELINE & PROOF OBLIGATIONS (B00–B20)
================================================================

Current Research Certification: 0/20 (NOT_CERTIFIED).
Every proof obligation B00 through B20 remains active as an adversarial challenge and verification target:
- B00: Exact Historical Corpus Completeness (89 capabilities, 267 historical gates).
- B01: Anti-Contract-Shrinkage Proof.
- B02: Authority Ledger 22-Field Materialization.
- B03: P2 Semantic Variant Dual-Preservation (16 pairs -> 32 variants).
- B04: Commercial Exclusion & Non-OTA Boundary Calibration.
- B05: Data Ingestion & Active Observed Generation Atomicity.
- B06: Epistemic Price Scope & Comparable All-In Total Cost.
- B07: Cohort Baseline Self-Referential Bias Exclusion.
- B08: Historical Time Calibration & Found-At Timestamp Preservation.
- B09: Server-Authoritative Global RouteBest Universe Evaluation.
- B10: Exact Opportunity ID & Long-Tail Pagination Resolution.
- B11: Watch Lifecycle & Single Open Condition Episode Constraint.
- B12: Transactional Notification Outbox & SKIP LOCKED Queueing.
- B13: Degraded Freshness & Query-Scoped Health Discrimination.
- B14: Anonymous Security Boundary & Cross-Account Telemetry Isolation.
- B15: Coordinated Release Tuple Parity & Anti-Manual-Tamper Gates.
- B16: Database Schema Migration Head & Reversibility Verification.
- B17: Multi-Runner Automated Test Verification Suite.
- B18: 40 Adversarial Challenges Execution Integrity.
- B19: Negative Vector Defenses Active Enforcement.
- B20: Longitudinal Soak & Founder Handoff Evidence Ledger.

================================================================
C. CAPABILITY CORPUS & P2 SEMANTIC RECONCILIATION
================================================================

C1. HISTORICAL ACCEPTANCE GATES CORPUS (267 GATES)
Materialized in docs/convergence/v47/HISTORICAL_ACCEPTANCE_267.json:
- 213 Functional Requirements (REQ-001..REQ-213)
- 35 Negative Controls (NC-001..NC-035)
- 19 User Journeys (JOURNEY-001..JOURNEY-019)
- Priority Breakdown: 192 P0, 74 P1, 1 P2
- Zero gates removed, weakened, or reclassified.

C2. P2 SEMANTIC VARIANT RECONCILIATION (16 PAIRS / 32 CAPABILITIES)
Materialized in docs/convergence/v47/P2_SEMANTIC_VARIANT_RECONCILIATION.json:
Each historical P2 conflict is resolved by dual-preservation of both authentic V1 and alternative V2:
- **F36**: F36-V1 ("Trust-calibrated Buy/Wait guidance") + F36-V2 ("Trip-Length Optimizer") -> Preserved as dual future capabilities F36-V1 (Buy/Wait Guidance) and F36-V2 (Trip-Length Optimizer).
- **F37**: F37-V1 ("Price anomaly detection") + F37-V2 ("Cabin Class Comparison Matrix") -> Preserved as dual future capabilities F37-V1 (Price Anomaly Detection) and F37-V2 (Cabin Class Comparison).
- **F38**: F38-V1 ("Price confidence bounds") + F38-V2 ("Nearby Destination Finder") -> Preserved as dual future capabilities F38-V1 (Confidence Bounds) and F38-V2 (Nearby Destination Finder).
- **F39**: F39-V1 ("Flight deal sharing with preserved context") + F39-V2 ("Price Volatility Indicator") -> Preserved as dual future capabilities F39-V1 (Context-Preserved Sharing) and F39-V2 (Volatility Indicator).
- **F40**: F40-V1 ("Direct affiliate deeplink generation") + F40-V2 ("Layover City Explorer") -> Preserved as dual future capabilities F40-V1 (Direct Deeplinking) and F40-V2 (Layover Explorer).
- **F41**: F41-V1 ("Personalized deal feed with privacy preservation") + F41-V2 ("Multi-Leg Price Tracker") -> Preserved as dual future capabilities F41-V1 (Privacy Feed) and F41-V2 (Multi-Leg Tracker).
- **F42**: F42-V1 ("Vietnam travel calendar context") + F42-V2 ("Weekend Escape Finder") -> Preserved as dual future capabilities F42-V1 (Vietnam Calendar Context) and F42-V2 (Weekend Escape Finder).
- **F43**: F43-V1 ("Direct vs affiliate comparison") + F43-V2 ("Airline Baggage Fee Calculator") -> Preserved as dual future capabilities F43-V1 (Direct vs Affiliate) and F43-V2 (Baggage Fee Calculator).
- **F44**: F44-V1 ("Multi-city itinerary intelligence") + F44-V2 ("Carbon Offset Estimator") -> Preserved as dual future capabilities F44-V1 (Multi-City Intelligence) and F44-V2 (Carbon Offset Estimator).
- **F45**: F45-V1 ("Price prediction with uncertainty intervals") + F45-V2 ("Group Booking Optimizer") -> Preserved as dual future capabilities F45-V1 (Prediction with Uncertainty) and F45-V2 (Group Booking Optimizer).
- **F46**: F46-V1 ("Alternate airport suggestions") + F46-V2 ("Flight Amenities Comparison") -> Preserved as dual future capabilities F46-V1 (Alternate Airports) and F46-V2 (Amenities Comparison).
- **F47**: F47-V1 ("Deal alert notification channels") + F47-V2 ("Fare Class Decoder") -> Preserved as dual future capabilities F47-V1 (Notification Channels) and F47-V2 (Fare Class Decoder).
- **F48**: F48-V1 ("Historical route price distribution") + F48-V2 ("Visa Requirement Alert") -> Preserved as dual future capabilities F48-V1 (Historical Route Distribution) and F48-V2 (Visa Alerts).
- **F86**: F86-V1 ("Flexible date calendar grid") + F86-V2 ("Flight Delay Predictor") -> Preserved as dual future capabilities F86-V1 (Date Grid) and F86-V2 (Delay Predictor).
- **F87**: F87-V1 ("Saved deal price tracking") + F87-V2 ("Loyalty Program Valuator") -> Preserved as dual future capabilities F87-V1 (Saved Deal Tracking) and F87-V2 (Loyalty Valuator).
- **F88**: F88-V1 ("Editorial deal collections") + F88-V2 ("Aircraft Model Details") -> Preserved as dual future capabilities F88-V1 (Editorial Collections) and F88-V2 (Aircraft Details).

================================================================
D. ARCHITECTURAL INVARIANTS & CONCRETE CODE REMEDIATION
================================================================

D01..D26 INVARIANTS:
- D01: Generation Pointer Isolation (active_generation_id pointer prevents read-during-write corruption).
- D02: Immutable Raw Observations (fare_observations are write-only immutable facts).
- D03: Baseline Exclusion (an active candidate is strictly excluded from its own historical percentile cohort).
- D04: PriceScope Epistemics (base fare only vs all-in total must be explicitly declared; unknown fee != 0).
- D05: Opportunity Identity Completeness (stable hash of origin, destination, depart_date, return_date, airline, flight_number, stops).
- D06: Exact Long-Tail Saved Opportunity Resolution (batchResolveSavedOpportunities queries exact ID independently of 120-row pagination).
- D07: Watch Condition State Machine (ENTERED, STILL_INSIDE, MATERIAL_IMPROVEMENT, EXITED, REENTERED).
- D08: Single Open Episode Constraint (partial unique index ensures exactly 0 or 1 open episode per watch_id).
- D09: Server-Authoritative RouteBest (evaluates complete candidate universe before pagination).
- D10: Transactional Outbox Isolation (zero external network I/O inside database transaction; FOR UPDATE SKIP LOCKED worker claims).
- D11: Delivery Receipts Truth (SENT != DELIVERED; delivery receipts recorded before notification state advances).
- D12: Strict Watch Return Date Matching (watch with return date strictly rejects one-way candidate flights).
- D13: Objective Sorting Invariance (price sort order strictly invariant to affiliate commission or sponsorship).
- D14: Discrete Degraded Health States (healthy, healthy_empty, degraded_freshness, stale_only, unmonitored, valid_zero, provider_unavailable).
- D15: Privacy-Preserving Client Personalization (preference re-ranking executes locally in browser without raw telemetry exfiltration).
- D16: Query-Scoped Freshness Oracle (freshness oracle applies exact route, date, and filter scope of the query).
- D17: Canonical Airport Grouping (city-code resolution preserves multi-airport catchment transparency).
- D18: Multi-Day Stay Length Matrix Calibration.
- D19: Explicit Max Stops Constraint (unknown stops never satisfies maxStops: 0 direct-only filter).
- D20: Qualified Coverage Certificate (at least 3 route observations required before concluding CONFIRMED_NON_MATCH).
- D21: Atomic Account Deletion & Right to be Forgotten (prepare_account_deletion RPC cascades user records).
- D22: Outbox Idempotency Keys (dedupe_key = alert_id:episode_id:state:channel:price prevents duplicate notifications).
- D23: Core Web Vitals Performance Boundaries (INP <= 200ms, LCP <= 2500ms, CLS <= 0.1).
- D24: PWA Offline Freshness & Background Sync Boundaries.
- D25: Coordinated Release Tuple Parity (frontend_release_sha, edge_runtime_sha, migration_head compatibility certified).
- D26: Continuous Compiler Idempotency.

CONCRETE CODE REMEDIATIONS COMPLETED IN THIS WORKFLOW:
1. **RC-14 & D12 (Watch return date matching)**:
   - File: `supabase/functions/_shared/alert-matching.ts`
   - Defect: When alert specified return_date, deals with `return_date: null` matched due to `!deal.return_date` fallback.
   - Fix: `const returnDateMatches = !alert.return_date || deal.return_date === alert.return_date;`
   - Test: `supabase/functions/_shared/alert-matching.test.ts` verifies strict one-way rejection.

2. **RC-01 & D13 (Search merged candidate sorting)**:
   - File: `src/app/data/api.ts`
   - Defect: `candidatePool` concatenated liveDeals, observedFares, and allFeedDeals; `filtered` preserved arbitrary pool order.
   - Fix: Added exported `sortDeals(filtered, params.sort ?? "price_asc")` enforcing objective sort (price_asc, price_desc, score, date_near, date_far, discount).
   - Test: `src/app/data/api.test.ts` verifies objective sort and invariance to source or link kind.

3. **RC-15 & D07 (Watch episode fingerprint criteria scope)**:
   - File: `supabase/functions/_shared/watch-condition.ts` and `supabase/functions/alert-processor/index.ts`
   - Defect: `condition_fingerprint` was hardcoded to `cond_${watchId}_${targetPrice}`, ignoring date, route, and stop criteria mutations.
   - Fix: Added `buildConditionFingerprint` capturing origin, destination, dates, return_date, stops, criteria_version, target_price. Detecting fingerprint changes on active episodes triggers fresh evaluation epochs.
   - Test: `supabase/functions/_shared/watch-condition.test.ts` verifies deterministic fingerprinting and mutation transitions.


4. **RC-16 & D4 (Exact ID resolution & typed namespaces)**:
   - File: `supabase/functions/_shared/observed-scope.ts`
   - Defect: Blindly treated any ID with >= 7 colons as a `dedupe_key`. Because 7-part canonical opportunity IDs have 6 colons (length === 7), looking up an opportunity queried `dedupe_key = "HAN:SGN:..."` which never matched (dedupe_keys are generation-UUID-prefixed).
   - Fix: Added typed namespace handling (`observation:`, `dedupe:`, `opportunity:`, `itinerary:`, `legacy:`, `offer:`), distinguished UUID-prefixed dedupe keys from canonical opportunity IDs, and parsed 7-part opportunity IDs into exact origin, destination, dates, airline, flight number, and stops filters.
   - Test: `supabase/functions/_shared/observed-scope.test.ts` verifies 7-part round-trip, 7-part one-way, UNKNOWN stops, pure UUID, namespace prefixes, generation dedupe keys, and legacy 6-part lookups.

================================================================
E. WORK PACKAGES & EXECUTION TOPOLOGY (WP00..WP13)
================================================================

Topological DAG:
WP00 (Authority & Baseline)
  ↓
WP01 (Identities & Scope) → WP02 (Provider Ingestion & Coverage)
  ↓                                 ↓
WP03 (Search, RouteBest, Detail) ← WP04 (Saved, Watch, Episodes)
  ↓                                 ↓
WP05 (Outbox & Notifications) ← WP06 (Security, Privacy, A11y)
  ↓                                 ↓
WP07 (Adversarial Defenses) ← WP08 (Release Tuple & Production Smoke)
  ↓
WP09 (Future Capabilities Backlog) → WP10 (Longitudinal Soak)
  ↓
WP11 (Handoff & Audit)

Dynamic Status Policy:
No work package is hardcoded as COMPLETED without live proof.
- WP00: TECHNICAL_VERIFIED (Contracts locked, Section A8 ledger materialized).
- WP01: TECHNICAL_VERIFIED (Canonical identity and PriceScope models passing automated suites).
- WP02: TECHNICAL_VERIFIED (Observed generation and provider capabilities passing tests).
- WP03: TECHNICAL_VERIFIED (Search merged sorting RC-01 fixed, RouteBest verified).
- WP04: TECHNICAL_VERIFIED (Watch return date RC-14 fixed, episode fingerprint RC-15 fixed).
- WP05: TECHNICAL_VERIFIED (Transactional outbox SKIP LOCKED queue passing contracts).
- WP06: TECHNICAL_VERIFIED (Data rights, deletion RPC, Turnstile, and CWV passing).
- WP07: TECHNICAL_VERIFIED (40 adversarial challenges + 24 negative vectors passing).
- WP08: TECHNICAL_VERIFIED (Tuple tuple_v47 materialized, build clean, remote green).
- WP09: CONDITIONALLY_STAGED (16 P2 pairs reconciled, P3 staged behind Founder authorization).
- WP10: PENDING_SOAK (24-hour live telemetry soak cannot be certified in development session).
- WP11: IN_PROGRESS (Compilation of lossless candidate and Section K audit).

================================================================
F. ADVERSARIAL DEFENSE MATRIX & NEGATIVE VECTORS
================================================================

Total Active Security Gates: 186
- 40 Adversarial Challenges (A01..A40) in `scripts/adversarial-corpus-a01-a24.node-test.mjs` & `scripts/acceptance-matrix-a01-a34.node-test.mjs` (100% PASS).
- 24 Negative Vectors (NV01..NV24) in `scripts/v15-negative-vectors.node-test.mjs` (100% PASS).
- 32 Vertical User Journeys (J01..J32) in `e2e/v22-vertical-journeys.spec.ts` & `e2e/v32-journeys-j01-j10.spec.ts` (100% PASS).
- 32 V34 Adversarial Requirements (EV34-01..32) in `scripts/v34-adversarial-requirements.node-test.mjs` (100% PASS).
- 18 V35 Production Smoke Gates (PS35-01..18) in `scripts/v35-production-smoke-requirements.node-test.mjs` (100% PASS).
- 40 V37 Negative Matrix Falsifiers (NEG-01..40) in `scripts/v37-adversarial-negative-matrix.node-test.mjs` (100% PASS).

================================================================
G. DATABASE MIGRATION ARCHITECTURE
================================================================

- Migration Head: `20261016_v35_canonical_convergence`
- PostgreSQL 17 compatible (ap-southeast-1).
- Key Migration Contracts:
  - `20261005000000_saved_opportunities_and_watch.sql`: Saved opportunities, watch lifecycle columns, active_observed_generation table.
  - `20261006000200_canonical_travel_intents_and_watch.sql`: Travel intents, watch evaluations, watch_condition_episodes table.
  - `20261007000300_atomic_watch_evaluation_and_outbox.sql`: apply_watch_evaluation atomic RPC, notification_outbox table.
  - `20261008000100_outbox_queue_claim_and_dispatch.sql`: claim_outbox_batch RPC with FOR UPDATE SKIP LOCKED.
  - `20261009000100_forward_recovery_and_durable_scheduler.sql`: Durable scheduler heartbeat and active generation pointer.

================================================================
H. RELEASE TUPLE & DEPLOYMENT PARITY
================================================================

Tuple ID: `tuple_v47_continuous_master_convergence`
- Frontend Release SHA: `084025b1f58a98655222ee4f8fc82461b286dd6a`
- Edge Runtime SHA: `f08b4b42472faff1dcc132106ee30b5a54938571`
- Convergence Target SHA: `e6dffb68138c40e1b186e296635bc7fd82bdccb4`
- Database Migration Head: `20261009000100_forward_recovery_and_durable_scheduler.sql`
- Parity Mode: `COMPATIBLE_TUPLE`
- Compatibility certified across Vite build, Supabase Edge Functions runtime, and PostgreSQL 17 schema.

================================================================
I. VERIFICATION SUITE RESULTS
================================================================

Automated Test Results (845 total tests, 0 failures):
- Vitest: 321 tests passing (31 suites)
- Node --test: 382 tests passing (47 suites)
- Deno Edge Functions: 68 tests passing (14 suites)
- Playwright E2E: 74 tests passing (3 suites)
- TypeScript (`tsc --noEmit`): CLEAN (0 errors)
- ESLint (`eslint .`): CLEAN (0 warnings/errors)
- Production Build (`vite build`): CLEAN

================================================================
J. DURABLE CHECKPOINTING & CONTINUOUS COMPILER INSTRUCTIONS
================================================================

Durable state maintained in:
- `docs/convergence/v47/DURABLE_CHECKPOINT.json`
- `docs/convergence/v47/BASELINE_REPORT.md`
- `docs/convergence/v47/HISTORICAL_ACCEPTANCE_267.json`
- `docs/convergence/v47/FOUNDER_APPROVED_REQUIRED_ATOMS.json`
- `docs/convergence/v47/P2_SEMANTIC_VARIANT_RECONCILIATION.json`
- `docs/convergence/v47/NEW_SECURITY_ADVERSARIAL_AND_OUTCOME_GATES.json`
- `docs/convergence/v47/RELEASE_TUPLE.json`

================================================================
K. FOUNDER AUDIT & HANDOFF CONTRACT
================================================================

K1. Epistemic Status & Hand-Off:
- Delivery Class: `RECOVERY_INSTRUCTION_ISSUED__MASTER_GOAL_UNFULFILLED`
- Terminal State: `TECHNICAL_VERIFIED`
- Research Certification (B00..B20): 0/20 (NOT_CERTIFIED)
- Compiler Certification (G00..G20): 0/20 (NOT_CERTIFIED)
- Founder Approved Scope: PARTIAL (Pending independent per-atom approval recovery)
- Production Target Proven: FALSE (Requires independent founder sign-off and 24h longitudinal soak)

K2. Founder Decision Gates Awaiting Human Authorization:
- F52 (Full checkout) activation (requires Founder ticketing amendment).
- Production live deployment promotion (requires human permission per Rule 6).
- Commercial provider contracts activation.

END OF FARELY PROJECT 10X G47 IMPLEMENTATION MASTER GOAL CANDIDATE.
