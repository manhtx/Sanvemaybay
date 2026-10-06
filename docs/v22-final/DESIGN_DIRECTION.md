# FARELY V22 — DESIGN DIRECTIONS & EVALUATION RUBRIC

### 1. The Design Mandate
Farely must reject the clichés of generated AI SaaS interfaces:
- No dark slate backgrounds with glowing blue/purple borders (`border-white/10`, `ring-cyan-500/30`).
- No Lucide icons on every navigation item, label, and button.
- No nested rounded cards inside rounded cards (`rounded-2xl` inside `rounded-xl`).
- No marketing buzzword slogans ("Decision Intelligence", "AI Price Prediction").
- No rainbow badges (green price, blue CTA, amber evidence, red discount, purple tag).
- No dashboard KPI metric blocks on personal consumer pages.

**Target Product Identity:**
**A PRECISE, CALM, HIGH-DENSITY CONSUMER AIRFARE INSTRUMENT.**
Clean typographic hierarchy, tabular figures (e.g. `4.265.502₫`), high scan density (8-12 opportunities visible on desktop), and natural Vietnamese copy.

---

### 2. Prototype Directions Explored

#### Direction A: "Terminal Ledger" (Extreme Density Data Terminal)
- **Concept:** Modeled after Bloomberg/Reuters financial price terminals. Pure tabular monospace layout, ultra-high density (15+ rows per screen), zero border radii, razor-thin hairline grid lines, stark high contrast.
- **Home Viewport:** Immediate full-width live ticker of route-best fares across 20 routes; minimal introductory explanation.
- **Opportunity Row:** Dense single-line table row with strict column widths: `[HAN → KUL] [16/10–20/10] [AK] [Bay thẳng] [4.265.502₫] [-18% vs med] [12 obs] [Chi tiết]`.
- **Search Composer:** Inline compact command-bar form with minimal vertical padding.
- **Watch Item:** Condensed monitoring row with green/red deviation status.
- **Strengths:** Maximum data density, zero decorative fluff, highly differentiated.
- **Weaknesses:** Intimidating for normal consumers; feels like developer/finance tooling; Vietnamese diacritics look cramped in ultra-dense monospaced tables.

#### Direction B: "Editorial Newspaper / Broadsheet" (Classic High-Trust Editorial)
- **Concept:** Modeled after FT Weekend / Monocle travel journals. Off-white/cream paper background, refined serif headlines (e.g., Newsreader/Playfair), calm warm grey borders, generous whitespace, traditional editorial typography.
- **Home Viewport:** Long-form narrative editorial on airfare price dynamics, featured curated route of the day with deep historical context.
- **Opportunity Row:** Newspaper classifieds-style listing with light borders, serif route headlines, elegant numerals.
- **Search Composer:** Elegant paper-form design with classic serif typography.
- **Watch Item:** "Subscription monitor" styling reminiscent of print alerts.
- **Strengths:** High consumer trust, warm distinctiveness, excellent long-form reading.
- **Weaknesses:** Lower scan density (only 4-5 rows visible per viewport); slower perception of speed; doesn't feel like a modern real-time automated price instrument.

#### Direction C: "Airfare Price Instrument" (Calm Structural Modernism — SELECTED)
- **Concept:** Modeled after Braun industrial instruments and Swiss typographic schedules (Müller-Brockmann). Deep, quiet, low-noise canvas; crisp tabular numerals; clear route lockups; strong alignment grid without card nests; subtle monochrome dividers instead of heavy borders; single vivid signal accent for active actions.
- **Home Viewport:** Clear 1-second proof-of-concept viewport:
  - Header: Quiet brand mark `Farely` + simple navigation (`Cơ hội`, `Tìm kiếm`, `Theo dõi`, `Đã lưu`).
  - Statement: "Biết mức giá nào thực sự đáng chú ý."
  - Real Featured Opportunity: Route lockup `HAN → KUL`, price `4.265.502₫`, comparator `Thấp hơn 18% so với median`, evidence freshness `Quan sát 12 phút trước`.
  - Immediate actions: `Xem sổ cơ hội hôm nay` & `Theo dõi chặng này`.
- **Opportunity Ledger (`/deals`):** High-scanability structured list (8–12 items visible on 1440×900 desktop viewport). Each row is a single, clean horizontal band:
  - Column 1: `HAN → KUL` (IATA code bold + city name light).
  - Column 2: Date window (`16/10 – 20/10`) & Carrier/stops summary.
  - Column 3: Tabular price (`4.265.502₫`).
  - Column 4: Comparator delta (`-18% median` or `Đang tích lũy`).
  - Column 5: Evidence indicator (`Bằng chứng tốt · 12 phút trước`).
  - Column 6: Action button (`Chi tiết`) & quick watch icon.
- **Search Composer (`/search`):** Unified, compact travel intent bar with autocomplete for airports/cities, date picker, budget ceiling, and direct filter. No oversized individual container cards.
- **Detail Viewport (`/deals/:id`):** Immediate answer to core questions in fold 1:
  - Route & Dates headline.
  - Route-Best minimum price highlighted.
  - Selected offer variant details.
  - Notice if cheaper alternative exists on the same route.
  - True Cost breakdown translated into natural Vietnamese (`Giá đã biết`, `Có thể phát sinh`, `Chưa xác định`).
  - Primary Verify/Compare button + Watch contract button.
- **Watch Surface (`/watch`):** Monitoring ledger displaying route, target, current best price, last check time, health, and toggle controls. Zero fake KPI dashboard cards.

---

### 3. Evaluation Rubric & Comparative Scoring (Scale 1–10)

| Evaluation Criterion | Direction A (Terminal) | Direction B (Editorial) | Direction C (Instrument) |
| :--- | :---: | :---: | :---: |
| **Price Clarity** | 9 | 7 | **10** |
| **Route Clarity** | 8 | 8 | **10** |
| **Scanability** | 9 | 6 | **10** |
| **Consumer Trust** | 6 | 9 | **9** |
| **Distinctiveness** | 8 | 8 | **10** |
| **Vietnamese Readability** | 6 | 9 | **9** |
| **Mobile Adaptability (390×844)** | 6 | 7 | **9** |
| **Information Density** | 10 | 5 | **9** |
| **Accessibility & Contrast** | 8 | 8 | **9** |
| **Implementation Scalability** | 8 | 7 | **10** |
| **Anti-Template / Non-SaaS Quality** | 9 | 8 | **10** |
| **TOTAL SCORE** | **87 / 110** | **82 / 110** | **105 / 110** |

### 4. Decision
**Direction C ("Airfare Price Instrument") is selected unanimously.**
- **Why Direction A lost:** Too brutalist and intimidating for ordinary flight bookers; poor mobile adaptation for Vietnamese diacritics in narrow monospaced columns.
- **Why Direction B lost:** Fails the desktop density requirement (only 4-5 items visible) and feels more like a travel lifestyle magazine than a rigorous monitoring tool.
- **Why Direction C won:** Combines Swiss typographic rigor, high information density (8-12 items on desktop), instant price readability, mobile elegance, and calm credibility.
