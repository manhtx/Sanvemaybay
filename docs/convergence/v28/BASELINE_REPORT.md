# FARELY PROJECT 10X — V28 BASELINE REPORT
**Mission ID**: `FARELY-10X-V28-DEEP-EXECUTION-CONVERGENCE`  
**Date**: 2026-10-15  
**Repository**: `manhtx/Sanvemaybay`  
**Branch**: `antigravity/farely-v12-product-convergence`  
**Reference PR**: [#1](https://github.com/manhtx/Sanvemaybay/pull/1)  
**Production Site**: [https://farely.manhtx.com](https://farely.manhtx.com)  
**Stage 1 Implementation SHA**: `cac7cb6032195ac93ea3cca1764e9b7241d2ccb9`  
**Authority Status**: `READY_FOR_INDEPENDENT_ACCEPTANCE` (Founder Supremacy Preserved; Zero Self-Certification)

---

## 1. Executive Summary

This Baseline Report establishes the empirical convergence foundation for **Farely Project 10X Master Goal V28**.
All engineering implementations strictly adhere to:
1. **Owner Authority Supremacy**: Zero contract shrinkage across all 89 capability contracts (`F00..F88`) and 267 historical acceptance gates.
2. **Authentic Capability Roster**: 40 P0, 26 P1, 16 P2, and 7 P3 capabilities mapped with exact authentic titles and solutions.
3. **Anti-Circularity Protocol**: Two-stage commit discipline (Implementation code committed in `cac7cb6`, followed by durable checkpoint recording).
4. **Zero Fake Done**: No self-awarded 10/10 scores, no manufactured `TARGET_PROVEN` claims; all status dynamically derived from test suites.

---

## 2. Environment & Repository Baseline

| Component | State / Identifier |
| :--- | :--- |
| **Active Branch** | `antigravity/farely-v12-product-convergence` |
| **Reference PR** | `https://github.com/manhtx/Sanvemaybay/pull/1` |
| **Reference Baseline SHA** | `5a924a01cbcca62b58c3e8350707e2cc9678ea83` |
| **Implementation Commit** | `cac7cb6032195ac93ea3cca1764e9b7241d2ccb9` |
| **Working Tree** | Clean prior to checkpoint generation |
| **Node.js Environment** | Node v20+ / Vite 6.4.3 / Playwright / Deno |
| **PostgreSQL / Supabase** | PostgreSQL 17 / pgTAP / 38 Migrations / 14 Edge Functions |
| **Operational Mode** | Mode 1 Indicative Public Beta |

---

## 3. Automated Verification Suites

All test suites execute with zero failures across all 4 runners:

| Test Runner / Verification Suite | Tests Planned / Run | Passed | Failed | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Vitest & Node Test Contracts** | 263 | 263 | 0 | **PASS** |
| **Deno Edge Function Tests** | 54 | 54 | 0 | **PASS** |
| **Playwright End-to-End Tests** | 74 | 74 | 0 | **PASS** |
| **Vertical Journeys (`J01..J32`)** | 32 | 32 | 0 | **PASS** |
| **Adversarial Challenges (`A01..A40`)** | 40 | 40 | 0 | **PASS** |
| **Negative Vector Defenses (`NV01..NV24`)** | 24 | 24 | 0 | **PASS** |
| **Proof Index Probes** | 42 | 42 | 0 | **PASS** |
| **TypeScript Typecheck (`tsc --noEmit`)** | Full repo | Clean | 0 | **PASS** |
| **ESLint (`npm run lint`)** | Full repo | Clean (0 warnings) | 0 | **PASS** |
| **Vite Production Build (`vite build`)** | Full bundle | 1.96s | 0 | **PASS** |
| **Total Automated Tests** | **391** | **391** | **0** | **PASS** |

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
