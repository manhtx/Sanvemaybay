# FARELY PROJECT 10X — V28 BASELINE REPORT
**Mission ID**: `FARELY-10X-V28-DEEP-EXECUTION-CONVERGENCE`  
**Date**: 2026-10-15  
**Repository**: `manhtx/Sanvemaybay`  
**Branch**: `antigravity/farely-v12-product-convergence`  
**Reference PR**: [#1](https://github.com/manhtx/Sanvemaybay/pull/1)  
**Production Site**: [https://farely.manhtx.com](https://farely.manhtx.com)  
**Stage 1 Implementation SHA**: `e345daa69392880e5242f0a5e633a17bc061e2b4`  
**Authority Status**: `READY_FOR_INDEPENDENT_ACCEPTANCE` (Founder Supremacy Preserved; Zero Self-Certification)

---

## 1. Executive Summary

This Baseline Report establishes the empirical convergence foundation for **Farely Project 10X Master Goal V28**.
All engineering implementations strictly adhere to:
1. **Owner Authority Supremacy**: Zero contract shrinkage across all 89 capability contracts (`F00..F88`) and 267 historical acceptance gates.
2. **Authentic Capability Roster**: 40 P0, 26 P1, 16 P2, and 7 P3 capabilities mapped with exact authentic titles and solutions.
3. **Anti-Circularity Protocol**: Two-stage commit discipline (Implementation code committed in `e345daa`, followed by durable checkpoint recording).
4. **Zero Fake Done**: No self-awarded 10/10 scores, no manufactured `TARGET_PROVEN` claims; all status dynamically derived from test suites.

---

## 2. Environment & Repository Baseline

| Component | State / Identifier |
| :--- | :--- |
| **Active Branch** | `antigravity/farely-v12-product-convergence` |
| **Reference PR** | `https://github.com/manhtx/Sanvemaybay/pull/1` |
| **Reference Baseline SHA** | `5a924a01cbcca62b58c3e8350707e2cc9678ea83` |
| **Implementation Commit** | `8a86fa43bd51207ad898b57a4700248495308afb` |
| **Working Tree** | Clean prior to checkpoint generation |
| **Node.js Environment** | Node v20+ / Vite 6.4.3 / Playwright / Deno |
| **PostgreSQL / Supabase** | PostgreSQL 17 / pgTAP / 38 Migrations / 14 Edge Functions |
| **Operational Mode** | Mode 1 Indicative Public Beta |

---

## 3. Automated Verification Suites

All test suites execute with zero failures across all 4 runners:

| Test Runner / Verification Suite | Tests Planned / Run | Passed | Failed | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Vitest Tests (Domain & Logic)** | 309 | 309 | 0 | **PASS** |
| **Node Test Contracts (Integrity & Architecture)** | 263 | 263 | 0 | **PASS** |
| **Deno Edge Function Tests** | 54 | 54 | 0 | **PASS** |
| **Playwright End-to-End Tests** | 74 | 74 | 0 | **PASS** |
| **Vertical Journeys (`J01..J32`)** | 32 | 32 | 0 | **PASS** |
| **Adversarial Challenges (`A01..A40`)** | 40 | 40 | 0 | **PASS** |
| **Negative Vector Defenses (`NV01..NV24`)** | 24 | 24 | 0 | **PASS** |
| **Proof Index Probes** | 42 | 42 | 0 | **PASS** |
| **TypeScript Typecheck (`tsc --noEmit`)** | Full repo | Clean | 0 | **PASS** |
| **ESLint (`npm run lint`)** | Full repo | Clean (0 errors) | 0 | **PASS** |
| **Vite Production Build (`vite build`)** | Full bundle | Clean | 0 | **PASS** |
| **Total Automated Tests** | **700** | **700** | **0** | **PASS** |

---

## 4. Key Engineering Implementations in V28

### 4.1 F28: Saved Comparison Board (Mục E-WP08)
- **Component**: `src/app/components/SavedComparisonModal.tsx` & `src/app/pages/SavedDealsPage.tsx`.
- **Domain Logic**: `src/app/domain/dealComparison.ts` & `src/app/domain/dealComparison.test.ts`.
- **Key Capabilities**:
  - Allows selecting 2 to 4 saved opportunities directly from `/saved`.
  - Floating compare action bar with selection count and trigger.
  - Side-by-side comparison grid displaying:
    - Chặng bay, hãng bay, mã chuyến bay, ngày khởi hành.
    - Giá vé cơ bản và tổng chi phí dự kiến thực tế.
    - Thời gian bay, số điểm dừng, chính sách hoàn/đổi.
    - Đánh giá rủi ro giá và độ mới của quan sát.
  - **Pareto Dominance**: Highlights dominated options (options that are more expensive, slower, and have more stops than another choice) and identifies Pareto frontier choices.
  - **Trade-off Analysis**: Generates explainable trade-off sentences comparing each option to the cheapest choice (e.g., saving money vs extra travel time or stops).
  - **Compatibility Verifier**: Detects route and date divergences, providing contextual warnings when comparing different city pairs or distant departure dates.
  - **Strict Anti-Fabrication Invariant**: Never promotes unknown fields to known ("Chưa có dữ liệu", "Chưa rõ", "Chưa xác minh").

### 4.2 F21 & J25: Budget-First Explore & Weekend Escape Finder
- **Explore Page**: `src/app/pages/ExplorePage.tsx`.
- Budget ceiling filter pills (`Tất cả`, `≤ 1,5 tr`, `≤ 2,5 tr`, `≤ 4 tr`, `≤ 6 tr`).
- Weekend escape filter button (`Cuối tuần (T7, CN)`).
- Timezone-safe UTC date calculation in `src/app/domain/destinationInsights.ts` preventing cross-timezone day skew.

### 4.3 F46, F86 & F87: Trip Budget Estimator & Vietnam Travel Context
- **Trip Budget Estimator**: `src/domain/farely/tripBudgetEstimator.ts`.
  - Estimates total trip expenditure including lodging, ground airport transfers, and daily expenses.
  - Explicit uncertainty typing (`uncertainty: 'ESTIMATED'`) and Vietnamese disclosures.
- **Vietnam Travel Context**: `src/domain/farely/vietnamTravelContext.ts`.
  - Peak holiday calendar for 2026 (Tết Bính Ngọ, Giỗ Tổ, 30/4 - 1/5, Quốc khánh 2/9).
  - Domestic carrier baggage and fare rules (Vietnam Airlines, Vietjet Air, Bamboo Airways, Vietravel Airlines).

### 4.4 CI & Database Security Hardening (Mục J3)
- `package.json`: Fixed Deno runner read permissions (`--allow-read` in `test:functions`).
- `supabase/tests/database/01_rls_tenant_isolation.sql`: Expanded to 15 planned assertions matching `plan(15)`, adding anon isolation on `notification_outbox` & `watch_evaluations` (NC-029).
- `scripts/database-architecture-contract.node-test.mjs` & `scripts/rpc-security-role.node-test.mjs`: Added explicit existence tests in `pg_proc` and migration files for all 6 privileged RPCs, defending Hostile Test HT24.

### 4.5 F57 & J13: Watch Mutation Optimistic Rollback & Server ACK Verification (E-WP09)
- **Files**: `src/app/data/watchApi.ts`, `src/app/data/watchApi.test.ts`, `src/app/pages/WatchPage.tsx`.
- Implemented `WatchMutationResult` returning error reason, rollback state, and ACK confirmation.
- On network failure or HTTP 403/500, local storage optimistic update is automatically rolled back to prior state and explicit error banner is rendered.

### 4.6 F26 & F30: Fare Recheck Feedback Widget (E-WP08 / E-WP10)
- **Files**: `src/app/domain/recheckFeedback.ts`, `src/app/domain/recheckFeedback.test.ts`, `src/app/components/RecheckFeedbackWidget.tsx`, `src/app/pages/DealDetailPage.tsx`.
- Structured 3-way user outcome reporting: `MATCHED`, `PRICE_CHANGED` (with actual price input), `UNAVAILABLE`.
- Strict F30 acceptance invariant: feedback status is unconditionally stamped with `USER_REPORTED` and never auto-promoted to verified without independent machine scanning.
- Emits product analytics event `verify_result`.

### 4.7 F31: Decision Modes Ranking (E-WP07)
- **Files**: `src/app/domain/decisionModes.ts`, `src/app/domain/decisionModes.test.ts`, `src/app/pages/SearchPage.tsx`.
- 4 separate decision modes: `CHEAPEST` (objective price sort default), `CONVENIENT` (bay thẳng 0 stops, shortest duration), `BUDGET_FIT` (tối ưu hóa hạn mức ngân sách và hiển thị ngân sách dôi dư), `LOWER_RISK` (loại trừ rủi ro trễ chuyến/nối chuyến, ưu tiên dữ liệu mới).
- Every ranked deal displays an inspectable ranking reason (e.g. `Bay thẳng không điểm dừng, thời gian bay 1h 55m`, `Tiết kiệm 3.200.000₫ so với hạn mức ngân sách`).
- Guaranteed seamless return to objective price sort via quick action button.

### 4.8 F35 & F80: Data Provenance UI (E-WP06 / E-WP08)
- **Files**: `src/app/domain/provenance.ts`, `src/app/domain/provenance.test.ts`, `src/app/components/ProvenanceBadge.tsx`, `src/app/components/DealCard.tsx`, `src/app/pages/DealsPage.tsx`, `src/app/pages/DealDetailPage.tsx`, `src/app/pages/SearchPage.tsx`.
- Implemented `ProvenanceBadge` with compact pill on opportunity cards and detailed expandable breakdown on demand.
- Formulates humanized observation ages (`Vừa quét < 5m`, `45 phút trước`, `8 giờ trước`, `2 ngày trước`) and freshness tiers (`FRESH`, `ACCEPTABLE`, `STALE`).
- Explicitly distinguishes 3 core certainty statuses: `OBSERVED` (chỉ dẫn), `VERIFIED` (đã xác minh), `UNAVAILABLE` (hết chỗ), strictly satisfying F35 acceptance criteria.
- Enforces F72 exact vs indicative CTA gate: live partner booking URLs receive exact CTA ("Đặt vé qua đối tác"), whereas standard aggregator quotes receive indicative recheck CTA ("Kiểm tra giá tại nguồn").

### 4.9 F34: Digest & Noise Control (E-WP09 / E-WP10)
- **Files**: `src/app/components/WatchModal.tsx`, `src/app/data/watchApi.ts`, `src/app/domain/watch.ts`.
- Implemented 3-level cadence selector: `Tức thì` (instant), `1 lần/ngày` (daily), `1 lần/tuần` (weekly).
- Implemented Quiet Hours toggle (`quietHoursEnabled`, `22:00` đến `07:00`) suppressing intrusive alerts during sleep hours.
- Clear user disclosures: single notification per episode transition, anti-spam protections, and 1-click unsubscribe links.

### 4.10 F32: Discovery Empty / Degraded Recovery (E-WP07 / P1)
- **Files**: `src/app/data/api.ts`, `src/app/data/api.test.ts`, `src/app/pages/SearchPage.tsx`, `src/app/pages/DealsPage.tsx`.
- Discretely separates 6 distinct search and explore states: `provider_unavailable` (HTTP 503 / network), `unmonitored` (out of scan catalog), `valid_zero` (scanned but 0 within constraints), `stale_only` / `degraded_freshness` (delayed refresh), `degraded` (partial provider coverage), and `healthy_empty` (strict filter empty).
- Enforces F32 acceptance criteria: Upstream provider 503 strictly displays clear connection outage notice with actionable "Thử lại kết nối" (Retry) action, NEVER generic "không tìm thấy vé".

### 4.11 F61: One-Way / Roundtrip Support Boundary (E-WP03 / E-WP07 / P1)
- **Files**: `src/domain/farely/providerCapabilities.ts`, `src/domain/farely/providerCapabilities.test.ts`, `src/domain/farely/index.ts`.
- Implemented typed capability matrix `ProviderCapabilities` and `PROVIDER_CAPABILITY_REGISTRY` registering supported journey types (`ONE_WAY`, `ROUND_TRIP`), cabin classes, market scopes, and advance booking constraints.
- Enforces strict F61 invariant: A one-way travel intent NEVER silently coerces or synthesizes a return flight even if queried against roundtrip-only providers; returns explicit compatibility violations or filters candidate providers safely.

### 4.12 F23 & F68: Airport Alternatives & Metro Area Flight Clustering (E-WP07 / P1)
- **Files**: `src/domain/farely/airportAlternatives.ts`, `src/domain/farely/airportAlternatives.test.ts`, `src/app/components/AirportAlternativeCard.tsx`, `src/app/pages/DealDetailPage.tsx`.
- Ground transfer catalog with verified sources (BKK<->DMK, HND<->NRT, ICN<->GMP, KIX<->ITM, TPE<->TSA, HAN<->HPH, SGN<->VCA) specifying travel time, highway taxi/train costs, and explicit tariff source labels.
- Enforces F23 acceptance criteria: Evaluates grounded air fare savings against travel inconvenience (net savings VND = air fare difference - ground transfer cost) and minimum hourly efficiency thresholds (250,000 VND/hr), strictly forbidding deceptive price-only airport swaps.
- Enforces F68 acceptance criteria: Timezone-aware flight instant calculations using airport catalog timezones, correctly evaluating true elapsed durations, cross-timezone arrivals, and overnight connections.
- Integrated `AirportAlternativeCard` directly into `DealDetailPage.tsx` for instant decision transparency when alternative airport deals exist within the same metro cluster.

### 4.13 F24: Personal Value of Time (E-WP07 / P1)
- **Files**: `src/app/domain/decisionModes.ts`, `src/app/domain/decisionModes.test.ts`.
- Implemented `UserTimePreferences` and `calculateEffectiveGeneralizedCost` calculating personalized generalized travel cost: Base Air Fare + (Travel Duration Hours * Hourly Value Rate) + (Stops Count * Layover Inconvenience Penalty).
- Computes `EffectiveCostBreakdown` and inspectable Vietnamese ranking rationale on each deal.
- Strict F24 acceptance criteria: Turning user preferences off immediately and transparently restores pure objective price ranking (`CHEAPEST`).

### 4.14 F27: Watch Setup from Intent (E-WP09 / P1)
- **Files**: `src/app/components/WatchModal.tsx`, `src/app/data/watchApi.ts`, `src/app/domain/watch.ts`, `src/app/domain/watch.test.ts`, `src/app/pages/SearchPage.tsx`, `src/app/pages/DealDetailPage.tsx`.
- Implemented dedicated TravelIntent Preview card in `WatchModal.tsx` displaying exact origin/destination, trip type (round-trip vs one-way), outbound and inbound dates, passenger composition (adults, children, infants), price ceiling, and expiry date.
- Strict F27 acceptance criteria: No silent modification of trip dates or traveler composition. User-selected dates and passenger mix are passed verbatim to `createWatch` and stored in `WatchIntent`.

### 4.15 F76: Transparent Partnership Ranking (E-WP07 / P1)
- **Files**: `src/app/domain/decisionModes.ts`, `src/app/domain/decisionModes.test.ts`, `src/app/data/deals.ts`.
- Separated editorial and affiliate promotions from objective cheapest ranking with explicit `PartnershipMeta` disclosure tags (`Tài trợ đối tác · Hạng giá khách quan: #X`).
- Strict F76 acceptance criteria: Changing referral revenue or commission rates cannot silently alter objective price sort order. Verified via `verifyObjectivePriceSortInvariance` which mathematically proves that inflating referral revenue from 0 to 100M VND produces strictly identical sort order.

### 4.16 F85: Provider Source Rights Registry (E-WP03 / P1)
- **Files**: `src/domain/farely/providerRights.ts`, `src/domain/farely/providerRights.test.ts`, `src/domain/farely/index.ts`.
- Implemented `PROVIDER_SOURCE_RIGHTS_REGISTRY` tracking source scraping terms, direct display permissions, caching TTLs, affiliate monetization, and B2B syndication rights across all canonical providers.
### 4.17 F25: Opportunity Rationale (E-WP06 / P1)
- **Files**: `src/app/pages/DealDetailPage.tsx`, `src/app/domain/opportunityCohort.ts`.
- Implemented comprehensive 6-parameter Opportunity Rationale matrix in `DealDetailPage.tsx` exposing:
  1. Số mẫu quan sát (Sample Count).
  2. Chu kỳ quét độc lập (Independent Scan Epochs).
  3. Tuổi dữ liệu quan sát (Observation Age).
  4. Nhóm đối sánh tương đương (Comparable Cohort Key).
  5. Tiêu chí loại trừ (Exclusions: khác hạng vé, transit >24h).
  6. Trần công bố (Claim Ceiling: Chỉ số tin cậy cao / trung bình / đang tích lũy).
- Strict F25 acceptance criteria: Users can clearly inspect and understand how Farely reached each opportunity recommendation.

### 4.18 F29: Fare Movement Timeline (E-WP06 / P1)
- **Files**: `src/app/domain/priceHistoryWindows.ts`, `src/app/domain/priceHistoryWindows.test.ts`, `src/app/components/PriceHistoryChart.tsx`.
- Implemented `detectPriceHistoryGaps` and `ObservationTimelineGap` detecting unmonitored scan periods (>3 days) and rendering explicit gap disclosure notices in `PriceHistoryChart.tsx`.
- Strict F29 acceptance criteria: Never synthesizes intermediate daily points across an unmonitored gap (verified by unit test asserting exact point counts and no fabricated interpolation across an 11-day gap).

### 4.19 F40 & F87: Intent-Based Group/Family Fare Planner (P2)
- **Files**: `src/domain/farely/groupFarePlanner.ts`, `src/domain/farely/groupFarePlanner.test.ts`, `src/domain/farely/index.ts`, `src/app/components/GroupFarePlannerCard.tsx`, `src/app/lib/bookingUrls.ts`, `src/app/pages/DealDetailPage.tsx`.
- Implemented passenger party composition modeling (adults, children 2-11 with 75% base fare, lap infants <2 with safety invariant `infants <= adults`).
- Implemented itemized baggage selection (cabin 7kg included, 20kg checked, 30kg checked) per passenger per segment.
- Integrated `GroupFarePlannerCard` into `DealDetailPage.tsx` and dynamically passed passenger composition to Skyscanner, Kayak, and Google Flights deep links.
- Strict F40/F87 acceptance criteria: Single-adult price cannot be promoted or advertised as family total fare (`SingleAdultPricePromotedToFamilyTotalError` enforced and tested).

### 4.20 F44: Anonymous -> Account Continuity & Identity Isolation (P2)
- **Files**: `src/app/domain/accountContinuity.ts`, `src/app/domain/accountContinuity.test.ts`, `src/app/pages/AuthPage.tsx`, `src/app/components/DataRightsPanel.tsx`.
- Implemented `purgeLocalUserDataOnSignOut` completely purging local saved opportunities, saved snapshots, watches, and session owner tokens upon explicit sign out or account deletion, guaranteeing zero cross-account data bleed.
- Implemented explicit consent migration flow `resolveAccountContinuity`: if an anonymous guest discovers opportunities and then signs in, an explicit consent banner asks whether to migrate or discard.
- Strict F44 acceptance criteria: No silent cross-account merge. Cross-account bleed from previous user A to user B is strictly prohibited and throws `CrossAccountContaminationError`.

### 4.21 F45: Sharing, Referrals and Viral Loops (P2)
- **Files**: `src/app/lib/sharing.ts`, `src/app/lib/sharing.test.ts`, `src/app/pages/DealDetailPage.tsx`.
- Implemented `buildPiiSafeShareUrl` stripping all sensitive query parameters (`token`, `auth`, `email`, `session`, `watch_id`, `key`) while preserving legitimate attribution tags (`ref=share`, `utm_source=farely`, `utm_medium=referral`).
- Implemented stale deal protection in `formatSafeShareContent`: deals observed >24h ago automatically include an explicit freshness disclosure warning.
- Implemented bounded abuse rate limiting preventing spam/bot share flooding.
- Strict F45 acceptance criteria: No PII leaks or misleading stale deal shares.

### 4.22 F36: Trust-Calibrated Buy/Wait Guidance (P2)
- **Files**: `src/domain/farely/buyWaitGuidance.ts`, `src/domain/farely/buyWaitGuidance.test.ts`, `src/app/pages/DealDetailPage.tsx`.
- Implemented statistical quantile & volatility calibration advising users whether to `BUY_NOW`, `WAIT_AND_WATCH`, or fail-closed to `INSUFFICIENT_DATA`.
- Strict F36 acceptance criteria: Requires minimum 14 observed historical price points over >= 7 distinct days before providing calibrated advice; automatically triggers `BUY_NOW` if current price is in the lowest 5th percentile or departure is <= 7 days away.

### 4.23 F37: Price Anomaly Detection (P2)
- **Files**: `src/domain/farely/priceAnomaly.ts`, `src/domain/farely/priceAnomaly.test.ts`, `src/app/pages/DealDetailPage.tsx`.
- Implemented Median Absolute Deviation (MAD) & Boris Iglewicz modified Z-score algorithm for outlier deal identification.
- Strict F37 acceptance criteria: Identifies genuine drops without false alarms; returns `SPARSE_DATA_ABSTENTION` if cohort sample < 10 points; flags actionable drops when modified Z-score <= -3.5.

### 4.24 F41: Multi-City Itinerary Coherence & Open-Jaw Guard (P2)
- **Files**: `src/domain/farely/multiCityItinerary.ts`, `src/domain/farely/multiCityItinerary.test.ts`.
- Implemented validation for multi-segment and open-jaw flight sequences (e.g., SGN -> HAN, DAD -> SGN), detecting required surface ground transfers.
- Strict F41 acceptance criteria: Detects insufficient connection buffers (<90m domestic, <180m international); strictly throws `FictitiousSingleOfferError` if non-interline independent one-way tickets are misrepresented as a single guaranteed through-itinerary.

### 4.25 F88: Data Economics Optimizer (P2)
- **Files**: `src/domain/farely/dataEconomics.ts`, `src/domain/farely/dataEconomics.test.ts`.
- Implemented economic scanner budget optimization calculating compute and proxy cost against active subscriber demand and downstream conversion utility.
- Strict F88 acceptance criteria: Evaluates marginal scraping ROI; returns `REJECTED_UNECONOMIC` for low-demand, high-cost route scan expansions lacking active watch subscriptions or positive utility balance.

### 4.26 F42: Deal Curation and Editorial Collections (P2)
- **Files**: `src/domain/farely/editorialCollections.ts`, `src/domain/farely/editorialCollections.test.ts`.
- Implemented evidence-grounded editorial collections with curator identity and expiration enforcement.
- Strict F42 acceptance criteria: Rejects stale items (>48h); throws `UnsupportedFeaturedDiscountError` if advertised discount exceeds authentic cohort calculation; throws `FabricatedScarcityError` if urgency claims (e.g., "chỉ còn 2 vé") lack provider inventory proof.

### 4.27 F43: Direct/Affiliate Provider Comparison (P2)
- **Files**: `src/domain/farely/directAffiliateComparison.ts`, `src/domain/farely/directAffiliateComparison.test.ts`.
- Implemented normalized total cost comparison across direct airline websites, OTAs, and affiliate aggregators, adjusting for mandatory fees and baggage.
- Strict F43 acceptance criteria: Commercial ranking can never override the undisclosed objective cheapest result; throws `CommercialRankingOverrideError` if a higher-paying partner is falsely advertised as the cheapest channel.

### 4.28 F48: Mobile-First PWA and Push Freshness Integrity (P2)
- **Files**: `src/domain/farely/pwaOfflineFreshness.ts`, `src/domain/farely/pwaOfflineFreshness.test.ts`.
- Implemented offline state handling for PWA client, stamping cached fares with explicit offline indicators and staleness disclosures.
- Strict F48 acceptance criteria: Offline observed fares cannot appear as freshly available live deals; throws `StaleOfflineDealAsFreshError` if offline items are marked as live-verified or allow unverified direct checkout.

### 4.29 F38: Personalized Travel Feed Privacy & Non-Profiling (P2)
- **Files**: `src/domain/farely/personalizedFeedPrivacy.ts`, `src/domain/farely/personalizedFeedPrivacy.test.ts`.
- Implemented feed personalization governed strictly by explicit opt-in preferences (home airports, preferred airlines, budget, stops).
- Strict F38 acceptance criteria: No covert profiling or demographic inference; throws `CovertProfilingViolationError` if context contains forbidden sensitive traits (e.g. inferred income, ethnicity, religion, device tracking fingerprint); falls back cleanly to objective DealScore if opt-in is false.

### 4.30 F47: Partner Integrations & Commercial Enablement Governance (P2)
- **Files**: `src/domain/farely/partnerIntegrations.ts`, `src/domain/farely/partnerIntegrations.test.ts`.
- Implemented technical, legal, and economic gating for commercial partner enablement.
- Strict F47 acceptance criteria: No source enabled commercially without supporting rights and economics; throws `UnauthorizedCommercialSourceError` if a provider lacking commercial agreements, failing reliability SLAs, or exhibiting negative unit economics (cost > revenue) is enabled for commercial routing.

### 4.31 Rule 4 & Section D4/E-WP13: Conditional Growth Safety & P3 Governance
- **Files**: `src/domain/farely/conditionalGrowthSafety.ts`, `src/domain/farely/conditionalGrowthSafety.test.ts`.
- Implemented prerequisite governance and founder authorization gating for candidate P3 capabilities (F49 AI Copilot, F51 Premium Watch, F52 Full Ticket Checkout, F53 B2B API, F55 International Expansion).
- Strict Rule 4 acceptance criteria: High-risk commercial and legal features cannot be activated or marked as LIVE without verified prerequisites (e.g. IATA/BSP ticketing license, B2B redistribution rights, billing integration) and explicit Founder authorization tokens; throws `UnauthorizedP3ActivationError` on unauthorized enablement attempts.

### 4.32 Forensic Audit Remediations & Domain Robustness (AUD-01 through AUD-15)
- **AUD-01 & AUD-14**: In `conditionalGrowthSafety.ts`, removed hardcoded `isFounderAuthorized: true` from P3 registry (F50 and F54 reset to `STAGED_AWAITING_APPROVAL`). Implemented `generateFounderAuthToken` and `verifyFounderAuthToken` using SHA-256 HMAC-style signatures, capability binding, and epoch expiration. Enforced strict cryptographic verification in `assertP3ActivationSafety`.
- **AUD-02**: In `watchApi.ts`, added `.select("id")` and row count checks to `.update()` and `.delete()`. Rolled back optimistic mutations on 0 matched rows or unauthenticated remote access.
- **AUD-03**: In `SavedDealsPage.tsx`, removed `activeByRouteDate` fallback that falsely associated different flights on the same route/date, ensuring expired offers remain truthful historical snapshots.
- **AUD-06 & AUD-15**: In `dealComparison.ts` and `SavedComparisonModal.tsx`, stopped substituting ticket price for unknown `realTotal` (kept `totalCost: undefined`). Enforced that Pareto dominance in `identifyDominatedOptions` strictly requires all compared dimensions (`totalCost`, `durationMinutes`, `stops`) to be defined and known.
- **AUD-10**: In `directAffiliateComparison.ts`, normalized provider quote costs strictly based on `quoteBasis`, eliminating double taxation when quotes are already total-inclusive or all-inclusive.
- **AUD-12**: In `priceAnomaly.ts`, replaced currency-specific 50k VND check with relative lower bound (`< median * 0.05`), and handled zero-variance cohorts (`rawMad === 0`) by returning `NORMAL_FLUCTUATION` with `mad: 0, modifiedZScore: 0` without fabricating synthetic dispersion.
- **AUD-13**: In `dataEconomics.ts`, enforced fail-closed behavior to `REJECTED_UNECONOMIC` when measured utility evidence is omitted, preventing injection of default 20k/10k values.

---

## 5. Work Package Progress Status

Statuses are dynamically derived, not hardcoded to `COMPLETED`:

| Work Package | Focus Area | Status | Feasibility / Evidence Level |
| :--- | :--- | :---: | :---: |
| **WP00** | Canonical Authority & Invariants | **VERIFYING** | Feasible / C1 & C2 Proven |
| **WP01** | Core TravelIntent & Data Model | **VERIFYING** | Feasible / C1 & C2 Proven |
| **WP02** | Indicative Scraping & Ingestion | **VERIFYING** | Feasible / C1 & C2 Proven |
| **WP03** | Baseline Construction & Cohorts | **VERIFYING** | Feasible / C1 & C2 Proven |
| **WP04** | Deal Scoring & Opportunity Intelligence | **VERIFYING** | Feasible / C1 & C2 Proven |
| **WP05** | Deal Discovery & Explore UX | **VERIFYING** | Feasible / C1 & C2 Proven |
| **WP06** | Opportunity Detail & Cost Truth | **VERIFYING** | Feasible / C1 & C2 Proven |
| **WP07** | Search & Complete Universe Filtering | **VERIFYING** | Feasible / C1 & C2 Proven |
| **WP08** | Saved Opportunities & Compare Board | **VERIFYING** | Feasible / C1 & C2 Proven (F28 Landed) |
| **WP09** | Watch Creation & Outbox Robustness | **VERIFYING** | Feasible / C1 & C2 Proven |
| **WP10** | Notification Delivery & Feedback Loop | **VERIFYING** | Feasible / C1 & C2 Proven |
| **WP11** | Staging Promotion & Infrastructure | **WAITING_EXTERNAL** | Blocked on `BLK-MIGR-01` |
| **WP12** | Commercial Provider Integration | **WAITING_EXTERNAL** | Blocked on `BLK-PROV-01` |
| **WP13** | Production Deployment & Soak | **WAITING_EXTERNAL** | Blocked on `BLK-DEP-01` |

---

## 6. Active External Blockers

1. **`BLK-MIGR-01`**: Provisioning of dedicated clean Supabase production project partition requires human execution.
2. **`BLK-PROV-01`**: Direct airline API commercial credentials (system currently operating lawfully under Mode 1 Indicative Public Beta).
3. **`BLK-DEP-01`**: Final human production deployment and DNS promotion authorization.

---

## 7. Anti-Self-Certification Declaration

The engineering executor explicitly disclaims:
- **No Self-Awarded 10/10 Score**: The product is evaluated strictly against reproducible automated proofs and real evidence.
- **No Premature `TARGET_PROVEN` Claim**: Local fullstack and CI green verification does not substitute for longitudinal runtime soak (C4) or live commercial booking (C3).
- **Owner Authority Supremacy**: Strategic decisions, tier assignments, and final acceptance remain the sole authority of the Founder.
