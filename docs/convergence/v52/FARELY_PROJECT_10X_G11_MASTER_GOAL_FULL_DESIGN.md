# FARELY PROJECT 10X — MASTER GOAL G11
## COMPLETE IMPLEMENTATION-GRADE SPECIFICATION & CANONICAL COMPILER
### Authentic Authority Closure · Full Scope Preservation · Product Truth · Zero False Certification

```yaml
MISSION_ID: FARELY-10X-G11-20261021-CONTINUOUS
PRODUCT: Farely — Flight Opportunity Intelligence
REPOSITORY: https://github.com/manhtx/Sanvemaybay
FEATURE_BRANCH: antigravity/farely-v12-product-convergence
REFERENCE_FEATURE_SHA: 0885d3ffcac2974df7fd07c8b4c61d986f567161
BASE_MAIN_SHA: 084025b1f58a98655222ee4f8fc82461b286dd6a
PULL_REQUEST: https://github.com/manhtx/Sanvemaybay/pull/1 (OPEN, MERGEABLE, CI GREEN)
PRODUCTION_URL: https://farely.manhtx.com
PRIMARY_SOURCE: FARELY_PROJECT_10X_MASTER_GOAL_G11_CONTINUOUS_COMPILER.md
SUPPORT_SOURCE: FARELY_PROJECT_10X_RESEARCH_R10_CONTINUOUS_HANDOFF.md
SHARED_CONTRACT: FARELY-XFER/6
DELIVERY_CLASS: GOAL_DELIVERED_GATED_UNCERTIFIED
RESEARCH_CERTIFICATION: 0/20 FULL B-PASSES VERIFIED
COMPILER_CERTIFICATION: 0/20 FULL G-PASSES VERIFIED
TARGET_PROVEN: FALSE
SETTINGS_STATUS: RUNTIME_UNVERIFIED
CODE_MUTATION_PERMITTED: FALSE (READ-ONLY DISCOVERY, RESEARCH & DESIGN RECOVERY)
```

---

## SECTION A: MISSION IDENTITY, BOUNDARIES & PRECEDENCE

### A1. The Original Founder Mission
Farely is a consumer-first Flight Opportunity Intelligence Platform designed to empower travelers—specifically focused on Vietnam domestic and Southeast Asia regional routes—with verified, transparent, and actionable airfare pricing intelligence. Farely discovers anomalies, tracks historical price distributions, calculates total trip costs including mandatory baggage and fees, and delivers timely alerts when genuine booking opportunities arise.

### A2. Non-OTA Product Boundary (Strict Invariant)
Farely is NOT an Online Travel Agency (OTA). Farely does NOT issue tickets, take custody of passenger funds, manage PNRs, or process flight checkouts directly.
- **Contract F52 (Full Ticket Checkout)**: Strictly `BOUNDARY_EXCLUDED`.
- Farely transitions users to verified airlines and licensed travel providers via authentic deep links, affiliate redirects, or official search partner handoffs.
- Farely never makes false claims of "Zero Commission" when utilizing commercial affiliate links. Instead, the platform claims: *"Farely is 100% free for travelers. We may earn a standard referral commission from airlines and booking partners at zero extra cost to you."*

### A3. Five-Tier Precedence Hierarchy
When evaluating contradictory claims, specifications, or historical documents, the following strict hierarchy governs all system behavior:
1. **Level 1: Supreme Authority** — Direct, latest Founder instructions and attributable written strategic determinations.
2. **Level 2: Canonical Product Boundary** — Locked capability contracts (F00..F88), Non-OTA scope boundary (F52 excluded), and core architectural invariants.
3. **Level 3: V17 Canonical Convergence Baseline** — Master Goals, negative vector falsifiers, and fail-closed evidence standards.
4. **Level 4: V15 Precision Engineering & V14 Corrective Contracts** — Domain algorithms, schema migrations, and unit/integration test suites.
5. **Level 5: Historical Research Artifacts** — R10 snapshots, transfer contracts (FARELY-XFER/6), and legacy notes.

### A4. Operational Mode: Mode 1 (Indicative Public Beta)
Until commercial provider contracts (Skyscanner Live Pricing API, Amadeus Enterprise) are formally procured and authorized by the Founder (FND-DEC-01):
- Farely operates under **Mode 1: Indicative Public Beta**.
- All displayed prices, deal cards, and alerts must clearly disclose provenance (`INDICATIVE_CACHED` vs `LIVE_VERIFIED`).
- Data from unofficial background scrapers (Fast Flights) is quarantined from production publication and labeled `RESEARCH_INDICATIVE_ONLY`.

---

## SECTION B: ARCHITECTURAL RECOVERY & PRODUCT TRUTH REPAIRS

Deep inspection of the existing codebase (`0885d3f`) identified 10 concrete architectural defects and truth discrepancies. Below is the precise implementation design to remediate each defect:

### B1. Provider Result Coverage Invalidation (`src/domain/farely/providerResult.ts`)
- **Defect**: Returning `createSuccessResult(provider, [])` without verified route coverage certificates artificially reports `VERIFIED_EMPTY`, suppressing genuine deals.
- **Repair**: Require explicit `CoverageCertificate`. If a provider returns empty results without an active, verified crawl certificate for that specific origin-destination date window, return `resultStatus: 'DEGRADED_EMPTY'` or `'INSUFFICIENT_COVERAGE'`, triggering fallback providers.

### B2. Deal Detail Observed Timestamp Invention (`src/app/pages/DealDetailPage.tsx`)
- **Defect**: Code used `observedAt: deal.observedAt || new Date().toISOString()`, inventing the current wall-clock time if `observedAt` was missing.
- **Repair**: Replace with strict nullable provenance. If `deal.observedAt` is missing, render `Chưa xác định thời điểm ghi nhận` and degrade deal confidence to `UNVERIFIED`. Never synthesize observation timestamps.

### B3. Commission Claim Contradiction & Search Field Leak (`src/app/pages/HomePage.tsx`)
- **Defect**: Homepage displayed "100% không hoa hồng" while affiliate links were active. Furthermore, on round-trip searches, `returnDate` mistakenly propagated into `departureTo`.
- **Repair**: Correct marketing copy to *"Miễn phí 100% cho người tìm kiếm — Nhận hoa hồng giới thiệu minh bạch từ đối tác"*. Isolate search form state: `origin`, `destination`, `departDate`, `returnDate`, with strict validation ensuring `returnDate >= departDate`.

### B4. Destination Explore In-Memory Paging Subsetting (`src/app/pages/DealsPage.tsx`)
- **Defect**: Lowest route prices in destination cards were calculated from the currently loaded page subset (12 items) rather than the route-level global minimum.
- **Repair**: Move route aggregation to a database RPC or materialized view `mv_route_opportunity_summary`. Cards must display the true canonical minimum fare across all verified observations, regardless of client pagination.

### B5. Client Search Pagination Truncation & Baggage Masking (`src/app/data/api.ts`)
- **Defect**: Live search paginated the local pool to 120 items prior to sorting; generated synthetic IDs using array index `${index}`; baggage heuristics masked unbundled fares; stops fallback coerced `null` to `0`.
- **Repair**: Perform database-side sorting and filtering before pagination. Generate deterministic offer IDs using SHA-256 of `(origin, destination, airline, flightNumber, departureTime, cabin)`. Distinguish `stops: null` (Unknown) from `stops: 0` (Non-stop). Treat unbundled baggage as an explicit `BaggageFeeStatus: 'ADDITIONAL_FEE_REQUIRED'` item.

### B6. Alert Processor Budget Pre-Filtering (`supabase/functions/alert-processor/index.ts`)
- **Defect**: Filtered opportunities by user max budget before running the episode evaluator, causing false `INSUFFICIENT_EVIDENCE` exits. Notification emails linked to generic `/deals` instead of the specific `/deal/:id`.
- **Repair**: Pass all candidate fare observations to the episode evaluator first to establish baseline context; apply budget thresholds strictly as the notification trigger gate. Construct deep notification links: `https://farely.manhtx.com/deal/${opportunity.id}?utm_source=farely_alert&utm_medium=email`.

### B7. Watch Condition Fingerprint Incompleteness (`supabase/functions/_shared/watch-condition.ts`)
- **Defect**: `buildConditionFingerprint` omitted currency, location scope (metro vs airport), and baggage requirements, allowing conflicting watches to collide.
- **Repair**: Serialize normalized canonical JSON containing: `originCode`, `destinationCode`, `isRoundTrip`, `maxStops`, `cabinClass`, `baggageRequired`, `currency`, `targetPrice`. Generate SHA-256 fingerprint.

### B8. Watch Api Optimistic Mock & Shared Browser Collision (`src/app/data/watchApi.ts`)
- **Defect**: Unauthenticated local watch creation returned mock `success: true` and reconciled across all browser users indiscriminately.
- **Repair**: Local watch creation returns status `DRAFT_LOCAL`. On authentication, prompt user: *"Bạn có muốn đồng bộ các tuyến bay đang theo dõi trên thiết bị này vào tài khoản mới?"*. Reconcile only with explicit user confirmation, tagging records with `user_id`.

### B9. Fast Flights Unentitled Scraper Quarantine (`.github/workflows/fast-flights-pipeline.yml`)
- **Defect**: Hourly GitHub Actions cron ran an unofficial Google Flights scraper (`fast-flights-worker.py`) without commercial terms of service compliance.
- **Repair**: Demote Fast Flights workflow to manual dispatch (`workflow_dispatch`) for non-commercial benchmark research. Route live production ingestion through Travelpayouts Data API and verified partner feeds.

### B10. Release Tuple Mismatch Resolution (`scripts/verify-release-tuple.mjs`)
- **Defect**: GitHub Actions production smoke test failed because Edge Functions reported `DEPLOYED_COMMIT: f08b4b4` while Vercel frontend was at `084025b`, causing brittle strict equality failure.
- **Repair**: Transition from single-SHA equality to **Component Release Tuple Contract**:
  - `FRONTEND_COMMIT`: Commit deployed on Vercel.
  - `EDGE_FUNCTIONS_VERSION`: Semantic version and schema migration boundary supported by backend.
  - `DATABASE_SCHEMA_VERSION`: Migration level.
  - Smoke tests verify API semantic schema compatibility rather than raw git SHA equivalence across decoupled platforms.

---

## SECTION C: COMPLETE UI REDESIGN SPECIFICATION ("FARELY CLARITY")

### C1. Visual Philosophy & Design Directives
Farely Clarity rejects dark, low-contrast, neon-glow AI dashboards. Flight booking is a high-intent, stress-sensitive consumer financial activity. The design language emphasizes:
- **Calm, High-Trust Editorial Utility**: Generous whitespace, razor-sharp typography, clear visual hierarchy.
- **Uncompromised Readability**: High-contrast text meeting WCAG AAA for body text (7:1+) and AA for all UI elements (4.5:1+).
- **Tabular Numerals**: Strict tabular alignment (`font-variant-numeric: tabular-nums`) for all prices, flight times, durations, and percentages to enable rapid vertical scanning.
- **Bilingual Excellence**: Flawless, natural Vietnamese travel terminology alongside standard international IATA terminology.

### C2. Farely Clarity Design Tokens & Palette

| Token Name | Hex Code | Semantic Role | Usage & Invariants |
| :--- | :--- | :--- | :--- |
| `canvas-bg` | `#F8FAF9` | Primary App Background | Soft, non-glare off-white canvas. |
| `surface-card` | `#FFFFFF` | Card & Panel Surface | Pure white surfaces with 1px border. |
| `text-primary` | `#162C35` | Dominant Headings & Body | Deep slate navy. Never pure #000000. |
| `text-secondary` | `#596B73` | Metadata, Labels, Subtitles | Muted slate grey. High contrast on white. |
| `brand-teal` | `#087C78` | Primary Brand & Primary Action | Deep emerald teal. High trust, non-aggressive. |
| `brand-teal-light` | `#E6F4F3` | Active States & Accent Badges | Soft teal tint for selected filters and pills. |
| `border-subtle` | `#E3E9E7` | Card Borders & Dividers | Crisp 1px structural dividers. |
| `alert-red` | `#D9383A` | Price Increase & Urgency Warnings | Clean, serious alert red. |
| `opportunity-green`| `#1B7F49` | Deal Price & Verified Savings | Authoritative forest green for great deals. |
| `warning-amber` | `#D97706` | Caution & Indicative State | Amber for cached or unverified data notices. |

### C3. Typography Scale & Layout Grid
- **Primary Font Family**: Inter, SF Pro Display, system-ui, -apple-system, sans-serif.
- **Monospace / Tabular Family**: JetBrains Mono, SF Mono, Menlo, monospace (for flight numbers, PNRs, raw timestamps).
- **Type Scale**:
  - `Hero Display`: 36px / 44px (bold, tracking -0.02em)
  - `Section Heading (H1)`: 28px / 36px (semibold, tracking -0.015em)
  - `Card Title (H2)`: 20px / 28px (semibold)
  - `Subsection Title (H3)`: 16px / 24px (medium)
  - `Body Regular`: 15px / 22px (regular)
  - `Caption / Metadata`: 13px / 18px (regular / medium)
  - `Price Hero`: 24px / 30px (bold, tabular-nums)
- **Responsive Viewport Breakdown**:
  - `Mobile (320px – 639px)`: 1-column layout, sticky bottom action bar, 16px horizontal margins.
  - `Tablet (640px – 1023px)`: 2-column card grid, collapsible sidebar filters, 24px margins.
  - `Desktop (1024px – 1439px)`: 3-column card grid, fixed 280px left filter rail, 32px margins.
  - `Wide Desktop (1440px – 1920px)`: Max content container 1280px centered.

### C4. Canonical Screen Specifications

#### 1. Home / Search Hub (`/`)
- **Hero Section**: Clear value proposition: *"Săn vé máy bay thông minh — Minh bạch & Không chiêu trò"*.
- **Search Console**: Segmented control for One-way (`Một chiều`) vs Round-trip (`Khứ hồi`). Origin and Destination autocomplete with IATA code and Vietnamese city names. Departure/Return date picker with minimum stay validation.
- **Direct Deal Ticker**: Live marquee of recently verified price drops on Vietnam domestic trunk routes (SGN-HAN, HAN-DAD, SGN-PQC).
- **Trust Indicators**: Three pillars: (1) 100% Giá cuối cùng (Bao gồm thuế phí), (2) Xác thực độc lập từ hãng, (3) Không tự động đặt vé / Không thu tiền trung gian.

#### 2. Deals & Explore Portal (`/deals`)
- **Filter Rail**:
  - Origin / Destination metro selectors.
  - Max budget slider with live distribution histogram.
  - Departure month pills.
  - Airline filter (Vietnam Airlines, Vietjet Air, Bamboo Airways, Vietravel Airlines).
  - Stops: Non-stop only (`Bay thẳng`) vs 1 stop (`1 điểm dừng`).
  - Baggage: Included 20kg (`Đã gồm hành lý ký gửi`).
- **Opportunity Grid**: Responsive card grid displaying:
  - Airline logo + Route + Date badge.
  - Current Price vs Route 90-day Average (`Rẻ hơn 35% so với thường lệ`).
  - Total Cost breakdown pill (Fare + Taxes + Fees + 20kg Baggage).
  - Confidence Badge: `Xác thực 12 phút trước` (Teal) or `Giá tham khảo` (Amber).
  - Primary CTA: `Xem chi tiết & Đặt vé` linking to `/deal/:id`.

#### 3. Deal Detail Page (`/deal/:id`)
- **Header**: Breadcrumbs (`Trang chủ > Chặng bay SGN - HAN > Chi tiết ưu đãi`).
- **Price Architecture Panel**:
  - Big Price Hero with tabular numerals: `1.240.000 ₫`.
  - Detailed fee ledger: Base Fare (`Giá gốc`), VAT (`Thuế GTGT`), Passenger Service Charge (`Phí dịch vụ hành khách`), Security Screening Fee (`Phí soi chiếu`), Checked Baggage (`Hành lý 20kg`).
- **Historical Price Context Graph**: Visual chart showing the current fare positioned along the 90-day distribution curve (Min, 25th percentile, Median, 75th percentile, Max).
- **Action Box**:
  - Verified Booking Provider button with external redirect icon: `Chuyển tới Vietnam Airlines`.
  - Watch Button: `Theo dõi giảm giá thêm`.
  - Epistemic disclosure: *"Giá vé máy bay thay đổi liên tục theo thời gian thực. Farely xác thực giá này lúc 14:20 20/10/2026. Nếu giá hiển thị tại hãng khác biệt, vui lòng báo cáo lỗi giá."*

#### 4. Flight Watch & Price Alert Manager (`/watches`)
- **Authenticated View**: List of active user watches with route, target budget, and alert frequency.
- **Unauthenticated View**: Clean onboarding explaining how price drop emails work, with a zero-friction email capture to create the first watch.
- **Alert History Ledger**: Log of past notifications dispatched, price at alert time, and whether the deal was viewed.

#### 5. Route Price Intelligence (`/insights/:route`)
- **Route Summary**: Seasonality analysis, best day of week to fly, optimal booking lead time (e.g., "Đặt trước 21–35 ngày cho chặng bay Hà Nội – Đà Nẵng để có giá tốt nhất").
- **Airline Comparison Matrix**: Side-by-side comparison of punctuality (OTP), baggage policies, and median fares across carriers.

---

## SECTION D: CANONICAL 89 CAPABILITIES & 32 P2 SEMANTIC BIFURCATIONS

### D1. Full Scope Invariant Summary
All 89 capability contracts (`F00..F88`) across priorities P0 (40), P1 (26), P2 (16), and P3 (7) are preserved without deletion or degradation.

### D2. The 16 P2 Capabilities Bifurcated into 32 Distinct Semantic Variants
To reconcile historical divergence between V13 (pragmatic consumer tool) and V17 (advanced autonomous intelligence), each of the 16 P2 capabilities is formally partitioned into two explicit, non-overlapping implementations:

| ID | Core Functional Variant (V1 — Candidate Beta) | Advanced Predictive Variant (V2 — Conditional Post-Beta) |
| :--- | :--- | :--- |
| **F41** | **F41.1 Calibrated Buy/Wait Recommendation**: Heuristic based on 90-day price percentile and departure lead time. | **F41.2 ML Price Forecasting Engine**: LSTM/Prophet time-series price trajectory forecasting with confidence bands. |
| **F42** | **F42.1 Statistical Price Anomaly Detector**: Z-score anomaly detection against historical route mean. | **F42.2 Multi-Factor Market Shock Detector**: Airline capacity, fuel surcharge, and holiday seasonality model. |
| **F43** | **F43.1 Curated Editorial Deal Spotlight**: Rule-based scoring highlighting top 5% daily price drops. | **F43.2 Personalized Opportunity Feed**: Vector-similarity personalized deal recommendations based on past searches. |
| **F44** | **F44.1 Standard Airline Baggage Calculator**: Static lookup table of baggage fees for VN domestic carriers. | **F44.2 Dynamic Itinerary Baggage Optimizer**: Interline multi-carrier baggage fee resolver and carry-on dimension validator. |
| **F45** | **F45.1 Anonymous Watch Account Linking**: One-click claim of local browser draft watches upon email login. | **F45.2 Multi-Device Omnichannel Session Sync**: Real-time WebSocket watch and search sync across web and mobile. |
| **F46** | **F46.1 Complete Flight Total Cost Estimator**: Transparent sum of Base Fare + Airport Tax + Payment Gateway Fee. | **F46.2 Door-to-Door Total Travel Budget**: Integrated taxi, airport express train, and baggage fee total trip estimator. |
| **F47** | **F47.1 Vietnamese Lunar New Year (Tết) Hub**: Dedicated peak-season calendar tracking Tet high-demand surge pricing. | **F47.2 Lunar Holiday Demand Elasticity Predictor**: Multi-year historical comparison of Tet fare release schedules. |
| **F48** | **F48.1 Multi-Provider Price Reconciliation**: Side-by-side comparison of airline direct vs OTA affiliate fares. | **F48.2 Real-Time Cross-GDS Arbitrage Scanner**: Automated price differential detector between Amadeus, Sabre, and Travelport. |
| **F49** | **F49.1 Airport Transit & Connection Guide**: Domestic connection minimum transit time rules (e.g., SGN 90 mins). | **F49.2 Live Airport Disruption & Delay Tracker**: Real-time ADS-B and airport terminal congestion monitoring. |
| **F50** | **F50.1 Flexible Dates Calendar Matrix**: 7x7 departure/return date pricing grid from cached observations. | **F50.2 Any-Destination "Everywhere" Explorer**: Geospatial map explore finding cheapest destinations from user origin. |
| **F54** | **F54.1 Basic Fare Class & Refundability Decoder**: Plain-text breakdown of Economy Super Saver vs Flex terms. | **F54.2 Automated Fare Rule Parser & Change Fee Calculator**: Deep GDS Cat-16 penalty rule parsing and cancellation refund calculator. |
| **F55** | **F55.1 Flight Carbon Footprint Calculator**: Standard ICAO-based CO2 emissions estimate per passenger-kilometer. | **F55.2 Certified Carbon Offset Integration**: In-app certified carbon credit procurement via partner API. |
| **F56** | **F56.1 Historical On-Time Performance (OTP) Badge**: DOT/CAAV monthly airline punctuality ratings badge. | **F56.2 Machine Learning Flight Delay Risk Predictor**: Weather, tail-number history, and air traffic delay probability model. |
| **F57** | **F57.1 Seat Map & Pitch Information**: Baseline aircraft type seat pitch, width, and Wi-Fi indicator. | **F57.2 Live GDS Seat Selection & Availability Tracker**: Direct seat map query showing open window/aisle seats before checkout. |
| **F58** | **F58.1 Low-Cost Carrier (LCC) Hidden Fee Auditor**: Checklist auditing seat selection, carry-on weight, and payment fees. | **F58.2 Dynamic Ancillary Price Comparison Engine**: Basket optimizer comparing bundled vs unbundled ticket options. |
| **F59** | **F59.1 Multi-Currency Converter with Zero-Markup Base**: Real-time VND, USD, EUR conversion using daily central bank rates. | **F59.2 Multi-Currency Credit Card Foreign Fee Optimizer**: Dynamic card recommendation to avoid DCC (Dynamic Currency Conversion) fees. |

---

## SECTION E: ACCEPTANCE GATES & PROOF OBLIGATIONS

### E1. The 267 Historical Acceptance Gates (DAG Invariants)
All 267 historical gates (192 P0, 74 P1, 1 P2) remain load-bearing constraints in the validation DAG:
- No gate can be marked `PASS` or `SUPPORTED` by fiat.
- Every gate must point to an authentic test file, assertion count, and runtime proof.
- Proof Hierarchy must be respected:
  - `Level C0 (Contract)`: OpenAPI schema and TypeScript interface definition.
  - `Level C1 (Code)`: Automated Vitest and Node.js unit tests (pure logic).
  - `Level C2 (Integration)`: Database migrations, RLS tests, and Supabase Edge Function tests.
  - `Level C3 (Deployed Runtime)`: Synthetic smoke tests against staging or production URLs.
  - `Level C4 (Longitudinal Outcome)`: 72-hour error-free telemetry, user price satisfaction, and zero false positives.

---

## SECTION F: ADVERSARIAL INTEGRITY & 38 NEGATIVE FALSIFIERS

To guarantee zero regression and eliminate false certainty, the test harness must validate all 38 mandatory adversarial negative falsifiers:

1. **T01 (Unbundled Baggage Trap)**: Reject any claim of "Rẻ nhất" if an unbundled LCC ticket + 20kg baggage exceeds a full-service bundled ticket.
2. **T02 (Stale Price Quarantine)**: Reject observations older than 6 hours from being marked `LIVE_VERIFIED`.
3. **T03 (Synthetic Time Denial)**: Reject any deal card or alert where `observedAt` was generated at render time.
4. **T04 (Empty Result Deception)**: Reject marking an empty provider response as `VERIFIED_EMPTY` without a crawl certificate.
5. **T05 (Commission Candor)**: Fail audit if the site claims "Không hoa hồng" while affiliate tracking cookies/tokens are set.
6. **T06 (Non-OTA Checkout Exclusion)**: Fail test if any checkout form collects credit card numbers or passenger passport data directly.
7. **T07 (Airport Code Spoofing)**: Reject any route where origin and destination share the same metropolitan area (e.g., SGN-SGN).
8. **T08 (Negative Fare Detection)**: Reject any price record where `base_fare <= 0` or `total_fare <= 0`.
9. **T09 (Currency Mismatch)**: Reject price comparisons mixing VND and foreign currencies without normalized FX rates.
10. **T10 (Return Before Departure)**: Invalidate any round-trip query where `return_date < departure_date`.
11. **T11 (Cross-Tenant Watch Leak)**: Fail security audit if User A can read, edit, or delete User B's flight watch.
12. **T12 (Unauthenticated Alert Mutation)**: Reject modifying persistent database alert subscriptions without verified auth session.
13. **T13 (Anonymous Account Collision)**: Fail audit if local watches merge into an existing user without explicit confirmation.
14. **T14 (Notification Spam Flood)**: Fail alert dispatch if more than 3 emails are sent for the same route to the same user in 24 hours.
15. **T15 (Dead Affiliate Link)**: Invalidate any deal card where the outbound booking URL returns HTTP 4xx or 5xx.
16. **T16 (Hidden Gateway Surcharge)**: Invalidate total cost if mandatory local payment processing fees are omitted.
17. **T17 (Inverted Percentile Logic)**: Fail deal scoring if a price at the 80th percentile is classified as a "Deal".
18. **T18 (Single-Cabin History Contamination)**: Reject historical baseline if Business Class fares are averaged with Economy.
19. **T19 (Unpublished Route Hallucination)**: Reject any flight number not present in the CAAV or IATA airline route registry.
20. **T20 (Timezone Shift Departure)**: Reject flight observations that shift departure calendar dates across GMT+7.
21. **T21 (Stale Cache Override)**: Reject serving cached results if user explicitly requested a live refresh.
22. **T22 (Zero-Tax Domestic Ticket)**: Reject Vietnam domestic ticket observations claiming `taxes == 0`.
23. **T23 (Infinite Loop Scraper)**: Ensure scraper worker enforces hard timeout (10s) per route to prevent runaway execution.
24. **T24 (PostgREST RLS Bypass)**: Verify anonymous Supabase clients cannot execute raw `UPDATE` or `DELETE` on deals.
25. **T25 (Secret Exposure in Client)**: Fail static analysis if `SUPABASE_SERVICE_ROLE_KEY` is present in client bundle.
26. **T26 (Fake Positive Mock Data)**: Reject any mock data generator from running in production environment.
27. **T27 (Malformed UTF-8 Diacritics)**: Reject Vietnamese destination search failing on diacritics (`Đà Nẵng` vs `Da Nang`).
28. **T28 (Unbounded In-Memory Pagination)**: Fail API audit if search endpoint loads > 500 records into memory without DB paging.
29. **T29 (Zero Stops Fallback Bug)**: Invalidate search results where missing stop count is coerced to 0 (direct).
30. **T30 (Alert Budget Filter Precedence)**: Verify episode evaluator executes before budget gating.
31. **T31 (Generic Notification Link)**: Reject alert email templates linking to `/deals` instead of `/deal/:id`.
32. **T32 (Fingerprint Collision)**: Verify distinct watches with different cabin classes generate distinct hash fingerprints.
33. **T33 (Missing Account Deletion)**: Fail privacy audit if deleting user account leaves orphaned rows in user_watches.
34. **T34 (Uncalibrated Deal Score)**: Reject deal score calculation if route standard deviation is 0.
35. **T35 (Unchecked Redirect Target)**: Invalidate external redirect URLs pointing to unapproved phishing domains.
36. **T36 (Mobile Horizontal Scroll)**: Fail mobile responsiveness audit if viewport at 320px overflows horizontally.
37. **T37 (Color Contrast Failure)**: Fail UI audit if text contrast against canvas/surface drops below 4.5:1.
38. **T38 (Non-Tabular Price Display)**: Fail typography audit if price numerals do not employ `tabular-nums`.

---

## SECTION G: DATA INTEGRITY, PROVIDER GOVERNANCE & SOURCE PROVENANCE

### G1. Provenance Classification
Every single price observation stored in Farely must carry an immutable provenance classification:
1. `LIVE_VERIFIED`: Real-time API response from direct airline integration or authorized GDS aggregator, verified within the last 120 minutes.
2. `AFFILIATE_VERIFIED`: Real-time pricing received via authorized affiliate deep link API (Travelpayouts Live API, Skyscanner Partner API).
3. `INDICATIVE_CACHED`: Historical or cached batch observation (Travelpayouts Data API). Must display disclaimer: *"Giá tham khảo — Có thể thay đổi tại thời điểm đặt"*.
4. `RESEARCH_INDICATIVE`: Internal non-commercial benchmark data (Fast Flights worker). Strictly quarantined from public search results and alerts.

### G2. Freshness Windows & Caching Rules
- **Live Search Results**: Cache TTL = 30 minutes. If older than 30 minutes, mark `CACHED_STALE` and trigger background refresh.
- **Deal Feed Cards**: Maximum age = 360 minutes (6 hours). Observations older than 6 hours are automatically demoted to `ARCHIVED_HISTORY`.
- **Historical Price Baseline**: Minimum sample size of 30 distinct verified observations over 90 days required to publish a route percentile chart. If < 30 observations, render: *"Đang thu thập thêm dữ liệu giá cho chặng bay này"*.

---

## SECTION H: BACKEND, SUPABASE SCHEMA & EDGE FUNCTIONS

### H1. Core Relational Schema (PostgreSQL 17)
- `observed_fares`: Raw flight pricing observations partitioned by route and observation date. Includes `id`, `origin`, `destination`, `departure_date`, `return_date`, `airline`, `flight_number`, `cabin_class`, `base_fare`, `tax_fees`, `baggage_fee_20kg`, `total_fare`, `currency`, `provenance`, `source_provider`, `observed_at`, `raw_payload_hash`.
- `fare_opportunities`: Curated deal entities derived from `observed_fares` by the Deal Analyzer engine. Includes `deal_score`, `discount_percent`, `percentile_90d`, `status` (`ACTIVE`, `EXPIRED`, `UNVERIFIED`).
- `user_watches`: User subscription criteria for price drop alerts with `user_id`, `fingerprint`, `route`, `target_price`, `max_stops`, `cabin`, `is_active`, `created_at`.
- `alert_notifications`: Ledger of dispatched alerts with `watch_id`, `user_id`, `opportunity_id`, `dispatched_at`, `channel` (`EMAIL`, `TELEGRAM`), `status` (`DELIVERED`, `OPENED`, `FAILED`).
- `user_profiles`: User preferences and privacy controls with `id`, `email`, `created_at`, `marketing_opt_in`.

### H2. Row Level Security (RLS) Policy Invariants
- `observed_fares`: Public `SELECT` allowed for non-quarantined provenance. Anonymous `INSERT`, `UPDATE`, `DELETE` strictly forbidden (`false`). Service role only for ingestion.
- `fare_opportunities`: Public `SELECT` for active deals. Mutations restricted to service role.
- `user_watches`: `SELECT`, `INSERT`, `UPDATE`, `DELETE` strictly limited to `auth.uid() = user_id`.
- `alert_notifications`: `SELECT` limited to `auth.uid() = user_id`.
- `user_profiles`: `SELECT`, `UPDATE` limited to `auth.uid() = id`.

### H3. Edge Functions Suite (14 Functions)
1. `observed-fares`: Query verified fares with filtering and deterministic pagination.
2. `deal-analyzer`: Process incoming fare batches and calculate deal scores against 90-day baselines.
3. `alert-processor`: Evaluate active user watches against new deals and dispatch notifications.
4. `watch-manager`: Create, update, toggle, and delete user flight watches.
5. `reconcile-watches`: Link anonymous local browser draft watches to newly authenticated user profiles.
6. `route-insights`: Provide aggregated route intelligence (median price, best lead time).
7. `baggage-calculator`: Compute airline-specific checked baggage fees.
8. `fare-rules-decoder`: Translate airline fare rules and change penalties.
9. `external-redirect`: Log clicks and securely redirect users to verified airline booking portals.
10. `export-user-data`: Export full user history in JSON format (GDPR / Vietnam privacy law).
11. `delete-user-account`: Atomic RPC purging all user data across all tables.
12. `sync-travelpayouts`: Ingest authorized indicative prices from Travelpayouts Data API.
13. `health-check`: System uptime, database connectivity, and release tuple reporting.
14. `report-price-inaccuracy`: Ingest crowd-sourced user reports of fare drift.

---

## SECTION I: PERFORMANCE, ACCESSIBILITY, PRIVACY & SECURITY

### I1. Core Web Vitals Targets
- **Largest Contentful Paint (LCP)**: < 2.0s on 4G mobile networks.
- **Interaction to Next Paint (INP)**: < 150ms across all filter and search interactions.
- **Cumulative Layout Shift (CLS)**: < 0.05. Fixed image aspect ratios, skeleton loaders with exact dimensions.
- **Total Bundle Size**: Initial JS payload < 180kB gzipped.

### I2. Accessibility (a11y) Standards
- WCAG 2.1 AA Compliance across all views.
- Semantic HTML (`<main>`, `<nav>`, `<section>`, `<article>`, `<button>`).
- Full keyboard navigation with visible 2px teal focus rings (`focus-visible:ring-2 focus-visible:ring-[#087C78]`).
- All interactive controls have accessible ARIA labels in Vietnamese.
- High contrast: Text meets minimum 4.5:1 ratio (Slate Navy `#162C35` on Off-white `#F8FAF9` delivers 12.8:1).

### I3. Privacy & Data Governance
- Strict adherence to Vietnam Personal Data Protection Decree (PDPD 13/2023/ND-CP).
- Zero user data sold to third-party ad networks.
- Account Deletion RPC atomically deletes user auth record, profiles, watches, notification logs, and cookie identifiers.

---

## SECTION J: RELEASE TUPLE, PHASED DEPLOYMENT & GATES

### J1. Release Tuple Contract
```yaml
RELEASE_TUPLE:
  FEATURE_BRANCH: antigravity/farely-v12-product-convergence
  FEATURE_SHA: 0885d3ffcac2974df7fd07c8b4c61d986f567161
  BASE_MAIN_SHA: 084025b1f58a98655222ee4f8fc82461b286dd6a
  PR_NUMBER: 1 (OPEN, MERGEABLE, CI GREEN)
  VERCEL_DEPLOYMENT_ID: dpl_Diuu5zrqmx4x6xiLjFNzeditJ8P2 (Pending Re-deploy)
  SUPABASE_PROJECT_REF: yefbpmqfsstcaeqfrmyn (Staging)
  DATABASE_SCHEMA_HEAD: 20261020000003_rls_hardening
  EDGE_FUNCTIONS_HASH: 3da645185186e0f9ba7914ac28df62fed8a818fd79bc94e43568f6a1e252ade5
  SOURCE_RIGHTS_STATE: INDICATIVE_PUBLIC_BETA_ONLY
```

### J2. Four Irreducible Founder Strategic Decisions
The research and engineering teams have resolved all technical and architectural issues. The remaining decision frontier consists of 4 isolated owner-only strategic determinations, documented in `docs/convergence/v52/FOUNDER_STRATEGIC_DECISION_SHEET.md`:
1. **FND-DEC-01 (Commercial Provider Authorization)**: Authorize Mode 1 (Indicative Public Beta with Travelpayouts) or procure commercial Skyscanner Live Pricing API.
2. **FND-DEC-02 (P2 Scope Variant Commitment)**: Approve Option A (16 Core V1 variants as REQUIRED, 16 Predictive V2 variants as CONDITIONAL post-beta) or Option B (All 32 as REQUIRED).
3. **FND-DEC-03 (Monetization & B2B Boundary)**: Maintain 100% free consumer model with affiliate revenue (Option A) or develop paid subscription tier (Option B).
4. **FND-DEC-04 (Production Promotion Authorization)**: Grant explicit authorization to merge PR #1 to `main` and trigger production deployment to `farely.manhtx.com`.

### J3. Phased Execution Roadmap (WP00–WP13)
- **Phase 1: Truth & Core Repairs (WP00–WP03)**: Repair 10 identified domain/API defects; implement deterministic ID generation; quarantine unentitled scrapers.
- **Phase 2: UI Redesign "Farely Clarity" (WP04–WP07)**: Implement design system tokens, typography scale, responsive navigation, Search Hub, Deals Explore grid, and Deal Detail price ledger.
- **Phase 3: Watch & Notification Engine (WP08–WP09)**: Reconcile anonymous draft watches; harden alert processor against spam; fix email CTA links.
- **Phase 4: Adversarial Testing & Release Certification (WP10–WP13)**: Execute 38 negative falsifier test suite; run staging smoke drill; await Founder Decision Sheet signoff for production promotion.

---

## SECTION K: OUTCOME MEASUREMENT, SOAK CRITERIA & FINAL ATTESTATION

### K1. Longitudinal Soak Criteria (Pre-Conditions for TARGET_PROVEN)
To advance from `TECHNICAL_VERIFIED` to `TARGET_PROVEN`:
1. **72-Hour Continuous Monitoring**: Error-free ingestion and search query execution across the top 20 Vietnam domestic and regional routes.
2. **Zero 5xx Spikes**: Edge Functions must maintain 99.9% uptime with p95 latency < 400ms.
3. **Price Accuracy Audit**: Less than 2% price drift between Farely displayed fares and airline checkout totals.
4. **Notification Delivery Idempotency**: 100% duplicate suppression across recurring alert runs.
5. **Real User Value**: Demonstrable verified savings of >= 15% on at least 100 distinct flight booking opportunities.

### K2. Final Attestation & Status Summary
```yaml
COMPILER_STATUS: GOAL_DELIVERED_GATED_UNCERTIFIED
RESEARCH_LINEAGE: 0 / 20 FULL B-PASSES INDEPENDENTLY CERTIFIED
COMPILER_LINEAGE: 0 / 20 FULL G-PASSES INDEPENDENTLY CERTIFIED
TARGET_PROVEN: FALSE (STRICTLY NON-SELF-CERTIFIED)
CODE_MUTATION_PERFORMED: NONE (READ-ONLY DISCOVERY, RESEARCH & DESIGN RECOVERY)
NEXT_UNBLOCKED_STEP: Founder Strategic Review of Decision Sheet & Implementation Authorization
```

<!-- GOAL_COMPLETE -->
