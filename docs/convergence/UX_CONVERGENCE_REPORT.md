# UX & VISUAL CRAFT CONVERGENCE REPORT (GATE-24)

**Product:** Farely (`https://farely.manhtx.com`)  
**Design Direction:** Calm Analytical Instrument for Vietnamese Travelers  
**Previous Aesthetic:** Generic dark SaaS dashboard (`slate-950`, card soup, pill soup, tiny uppercase badges).  
**New Aesthetic:** Light/off-white canvas (`#fafaf9`), crisp white surfaces, near-black copy (`stone-900`), electric blue primary brand accent, tabular numerals for prices/times, and disciplined emerald for favorable facts.

---

## 1. Information Architecture & Design Philosophy

1. **Light, Calm, Trusted Canvas**:
   - Background: `bg-[#fafaf9]` (warm stone/off-white), avoiding high-contrast eye fatigue.
   - Surfaces: Clean white containers with subtle `border-stone-200` and `shadow-sm`.
   - Typography: Clean sans-serif with font-mono restricted to IATA codes (`HAN`, `SGN`, `BKK`), ISO dates, and VND currency values (`4.265.000₫`).

2. **Search-First Above the Fold (HomePage)**:
   - Immediate consumer utility: `[ Điểm khởi hành ] → [ Điểm đến ]`, Departure date, Return date, Passengers, and Cabin class.
   - Primary Action: `[ Tìm giá ]` button immediately visible without scrolling.
   - Evidence Transparency: "Farely đang thấy gì?" section displays live observed opportunities ranked by discount against comparable cohorts.
   - Epistemic Disclosure: 3 clear evaluation principles (cohort comparison, observable evidence, no fake marketing urgency).

3. **Opportunity Detail (Flagship Screen)**:
   - Comprehensive route lockup: `HAN → KUL`, dates, flight characteristics (`Vietjet · Bay thẳng · 3h 15m`).
   - Prominent price: `4.265.000₫` with verified comparison against comparable median.
   - Unified decision CTAs: `[ Theo dõi chặng này ]` and `[ Kiểm tra giá trên Google Flights ]`.
   - Continuous vertical flow: Cheaper alternative banner, True Cost Breakdown (Known, Estimated, Unknown extras), Price History Chart, and Cohort Evidence Spine.

4. **Deals & Search Exploration**:
   - Calm ledger view with color-coded discount badges:
     - `>= 30%`: `bg-emerald-50 text-emerald-800 border-emerald-200`
     - `20% - 29%`: `bg-blue-50 text-blue-800 border-blue-200`
     - `< 20%`: `bg-stone-100 text-stone-700 border-stone-200`
   - Strict server-side pagination controls with item range (`Hiển thị 1 - 60 trên tổng số 4.524 cơ hội`).
   - Discriminated empty states: explicit differentiation between "Không tìm thấy chuyến bay phù hợp" and provider failures.

5. **Mobile First Responsive Navigation**:
   - Dedicated mobile bottom navigation bar (`Root.tsx`) with 4 canonical surfaces:
     - **Tìm** (`/search`)
     - **Cơ hội** (`/deals`)
     - **Theo dõi** (`/watch`)
     - **Đã lưu** (`/saved`)
   - 0 horizontal scroll overflow across all tested viewports.

---

## 2. Screenshot Acceptance Matrix (6 Viewports × 7 Screens = 42 Artifacts)

Screenshots captured using `scripts/capture-visual-acceptance.mjs` and verified against strict visual criteria:

| Viewport | Device Profile | Screens Captured | Horizontal Overflow | Primary CTAs Visible | Touch Targets >= 44px |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **320 × 568** | iPhone SE (Compact) | Home, Search, Deals, Watch, Saved, Auth, Detail | **0 px (None)** | YES | YES |
| **390 × 844** | iPhone 12/13/14 | Home, Search, Deals, Watch, Saved, Auth, Detail | **0 px (None)** | YES | YES |
| **768 × 1024** | iPad Mini / Tablet | Home, Search, Deals, Watch, Saved, Auth, Detail | **0 px (None)** | YES | YES |
| **1207 × 861** | User Incident Viewport | Home, Search, Deals, Watch, Saved, Auth, Detail | **0 px (None)** | YES | YES |
| **1440 × 900** | MacBook Pro | Home, Search, Deals, Watch, Saved, Auth, Detail | **0 px (None)** | YES | YES |
| **1920 × 1080** | Full HD Desktop | Home, Search, Deals, Watch, Saved, Auth, Detail | **0 px (None)** | YES | YES |

All 42 PNG screenshot artifacts are stored in `docs/convergence/screenshots/` and IDE artifact storage.

---

## 3. Playwright Responsive Suite
All 16 viewport regression tests in `e2e/responsive-viewports.spec.ts` passed 100% green without horizontal overflow or clipped text.
