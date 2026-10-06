# FARELY V22 — FROZEN ACCEPTANCE CONTRACT
## Product Convergence Release Law

This contract defines the immutable gates, negative controls, required proofs, and PASS/FAIL conditions for Farely V22. Under no circumstance may any requirement be weakened or circumvented by proof substitution or superficial test rewrites.

---

### GATE 01: PRICE TRUTH & ROUTE-BEST SELECTION
- **Claim:** For any compatible `TravelIntent` scope, Farely computes and surfaces the true minimum normalized eligible price (`CHEAPEST`) among all available provider candidates. Deal Score or value ranking must NEVER displace the price minimum when presenting the cheapest option.
- **Required Proof:**
  - Automated Route-Best test harness where randomized input order of candidates `[5.21M, 4.26M, 4.67M, 5.30M]` deterministically yields `4.26M` as the route-best price.
  - Detail view clearly presents both:
    1. The specific `OfferVariant` selected (if user opened an offer).
    2. The `Cheapest Eligible Alternative` on the same route/dates if a lower compatible offer exists.
- **Negative Control:**
  - Inject higher-priced offer with 95/100 score and lower-priced offer with 70/100 score. Algorithm must return the lower-priced offer for `cheapest_price`.
  - Stale historical price cannot masquerade as current cheapest.
- **PASS Condition:** 100% of candidate sets evaluate to the exact mathematical minimum normalized price for compatible scopes.
- **FAIL Condition:** Any case where a cheaper eligible candidate exists in the provider/ingestion candidate set but Farely reports a higher fare as "Rẻ nhất".
- **Allowed Blocker State:** None.

---

### GATE 02: PRICE SCOPE FINGERPRINTING & INCOMPATIBLE COMPARISONS
- **Claim:** Two prices may only compete for "cheapest" if their `PriceScopeFingerprint` is compatible. Incompatible scopes are never compared silently.
- **Required Proof:**
  - Explicit fingerprint model checking: origin airport/city, destination airport/city, outbound date, return date, trip type, cabin, stops constraint, passenger count, currency.
- **Negative Control:**
  - Direct-only search rejects 1-stop cheaper candidate from route-best direct.
  - BKK-only search does not silently match DMK-only flights without explicit city-wide scope.
  - Round-trip does not compare against one-way fare.
- **PASS Condition:** Incompatible scopes are segregated; comparisons only execute within equivalent travel parameters.
- **FAIL Condition:** Silent mixing of direct vs 1-stop, or airport-specific vs city-wide flights in a single "cheapest" claim.
- **Allowed Blocker State:** None.

---

### GATE 03: THE HAN → KUL REGRESSION RESOLUTION
- **Claim:** The specific failure case where a 5.21M fare was presented as cheapest while a 4.27M direct option existed is diagnosed to root cause, resolved in data ingestion/normalization/aggregation, and proven fixed.
- **Required Proof:**
  - Inspection of crawler worker, candidate ingestion, deduplication, and aggregation logic.
  - Integration harness testing HAN -> KUL multi-carrier candidates (AirAsia, Sun PhuQuoc, Vietnam Airlines, Vietjet).
  - Normalization extracts carrier, stops, baggage, and booking url without loss of cheaper options.
- **Negative Control:**
  - Raw provider payload containing AirAsia 4.27M and Sun PhuQuoc 5.21M; normalization and aggregation must surface AirAsia as `cheapest_option`.
- **PASS Condition:** HAN -> KUL candidate sets always resolve to the lowest eligible fare, and all candidate variants are preserved under the TravelIntent.
- **FAIL Condition:** Only the more expensive carrier is ingested or promoted to the feed item.
- **Allowed Blocker State:** None.

---

### GATE 04: CANONICAL PRODUCT DOMAIN INTEGRITY
- **Claim:** The product domain strictly separates `TravelIntent`, `OfferVariant`, `Observation`, `ComparableCohort`, `Opportunity`, `Watch`, `SavedOpportunity`, and `Verification`.
- **Required Proof:**
  - `OpportunityId` is derived from stable travel attributes `(origin, destination, airline, depart_date, return_date, stops)`.
  - `OpportunityId` is independent of transient `observation_id` UUID or `generation_id`.
  - Feed items group OfferVariants under TravelIntent opportunity where appropriate.
- **Negative Control:**
  - Deleting or rotating raw observations in the background database leaves `Opportunity` identity and `SavedOpportunity` records intact and resolvable.
- **PASS Condition:** Zero dependency on generation IDs or transient crawler UUIDs for core domain identities.
- **FAIL Condition:** Saved opportunity broken or orphan after crawler run.
- **Allowed Blocker State:** None.

---

### GATE 05: GLOBAL SEARCH CORRECTNESS (FILTER → SORT → PAGINATE)
- **Claim:** Search filters (origin, destination, dates, budget, stops) execute globally in the database/Edge Function query BEFORE pagination.
- **Required Proof:**
  - API query sends filters to backend; pagination applies to the filtered set.
  - City vs Airport disambiguation supported (BKK vs DMK, HND vs NRT, SGN, HAN, DAD).
- **Negative Control:**
  - Place a matching low-budget fare at row index 1500 in the database. A search filtering for budget <= target must return this fare on Page 1, proving it was not filtered on the client after a 60-row or 1000-row fetch.
- **PASS Condition:** Global database-level filtering across all active snapshot rows.
- **FAIL Condition:** Client-side post-pagination filtering that causes zero results when matching rows exist beyond page 1.
- **Allowed Blocker State:** None.

---

### GATE 06: WATCH CONTRACT & RELIABILITY
- **Claim:** A Watch monitors a `TravelIntent` route-best eligible price. Creation fails closed on remote error. `lastCheckedAt` starts `null`. Condition evaluation evaluates the full active dataset without silent row truncations.
- **Required Proof:**
  - Watch creation returns error in UI if Supabase returns error.
  - New Watch displays "Đang chờ lượt kiểm tra đầu tiên." until evaluated by `alert-processor`.
  - Condition matching matches exact user price target without requiring hidden discount thresholds.
  - Deduplication key is stable across snapshot generations.
- **Negative Control:**
  - Disconnect network or mock Supabase 500 on Watch creation; UI must display error and NOT report active monitoring.
  - User sets target <= 5M; fare is 4.8M with 5% discount. Watch MUST match (no hidden 20% discount filter).
- **PASS Condition:** Watch matches strictly on user-specified predicates and survives snapshot generation switches.
- **FAIL Condition:** False positive "Đã theo dõi" on failure; or Watch missed because row was at position 1001.
- **Allowed Blocker State:** `BLOCKED_EXTERNAL` permitted for real SMTP delivery if third-party email provider credentials are not provisioned in the repository.

---

### GATE 07: SAVED DURABILITY & LONGITUDINAL MEMORY
- **Claim:** `user_saved_opportunities` stores `opportunity_id` and complete snapshot context (`origin`, `destination`, `dates`, `saved_price`, `route_best_at_save`, `comparator`).
- **Required Proof:**
  - Saved page displays saved price, current best price, delta change, and freshness.
  - Local state serves as cache; remote state is authoritative for authenticated sessions.
  - Fails closed on remote insert/delete errors.
- **Negative Control:**
  - Save an opportunity, delete underlying raw crawler observation; reload saved page. Item remains rendered with historical saved price and snapshot context.
- **PASS Condition:** Complete preservation of saved context across sessions and database purges.
- **FAIL Condition:** Empty card or error 404 when original observation row is pruned.
- **Allowed Blocker State:** None.

---

### GATE 08: COMPARATOR & HISTORICAL HONESTY
- **Claim:** Historical comparison is based on true travel attributes (origin, destination, season, stops, trip length). When sample size is insufficient (< 5 observations in cohort), the UI displays "CHƯA ĐỦ DỮ LIỆU ĐỐI SÁNH" with zero fake medians or fake discount percentages.
- **Required Proof:**
  - Query cohort with 2 observations -> UI renders "Chưa đủ dữ liệu đối sánh" or "Đang tích lũy", no fake median line.
  - Query cohort with >= 10 observations -> UI renders true median, percentile, and sample count.
- **Negative Control:**
  - Inject single fare at 3M with no baseline; system must not report "Rẻ hơn 30% so với thông thường".
- **PASS Condition:** Epistemic honesty: no fabricated statistics or ungrounded claims.
- **FAIL Condition:** Fake median line drawn at current price or fabricated discount percentage.
- **Allowed Blocker State:** None.

---

### GATE 09: TRUE COST EPISTEMIC STATES & CONSUMER-FRIENDLY UI
- **Claim:** Costs are classified as `KNOWN`, `ESTIMATED`, `OPTIONAL`, or `UNKNOWN`. `UNKNOWN` is NEVER treated as zero or included. Missing baggage is marked `UNKNOWN` / `Chưa xác định`. The UI translates these states into plain Vietnamese without developer jargon.
- **Required Proof:**
  - Breakdown displays: "Giá vé đã biết", "Có thể phát sinh", "Chưa xác định", "Tổng tối thiểu đã biết".
- **Negative Control:**
  - Raw flight has `baggage: null`; True Cost must NOT mark baggage as "Miễn phí" or 0đ.
- **PASS Condition:** Zero ungrounded assumptions; consumer-clear terminology.
- **FAIL Condition:** Raw absence of data reported as 0đ or "Đã bao gồm".
- **Allowed Blocker State:** None.

---

### GATE 10: FARELY-NATIVE UX/UI RECONSTRUCTION
- **Claim:** The UI eliminates generic dark SaaS templates (excessive rounded cards, border-white/10, icons on every item, rainbow badges, dashboard KPI cards). It embodies a high-density, high-signal, calm **Airfare Price Instrument**.
- **Required Proof:**
  - Home page presents proof-of-concept viewport with real opportunity and clear value proposition.
  - Opportunity ledger (/deals) displays 8-12 opportunities on a standard desktop viewport.
  - Clean tabular figures (e.g. `4.265.502₫`), clear route lockups (`HAN → KUL`).
  - Three distinct design directions prototyped and evaluated on a rubric before final selection.
  - Passes the Logo-Off / Grayscale test: recognizable by structure, hierarchy, and data density alone.
  - Zero horizontal overflow across all viewports (390×844, 768×1024, 1440×900, 1920×1080).
- **PASS Condition:** UI feels like a serious, credible consumer price intelligence tool.
- **FAIL Condition:** Resembles generic Tailwind UI kit, crypto dashboard, or AI landing page template.
- **Allowed Blocker State:** None.

---

### GATE 11: FULL RELEASE CONVERGENCE & PRODUCTION PARITY
- **Claim:** Source Code = Database Schema = Deployed Edge Functions = Frontend Bundle = Production Runtime at one exact release fingerprint.
- **Required Proof:**
  - Frontend `release.json` SHA equals Backend Edge Function `release_sha` equals Git commit SHA on `origin/main`.
  - Zero unapplied pending migrations.
  - Zero-trust live audit script passes 100% on `https://farely.manhtx.com`.
- **PASS Condition:** Single verified SHA across all production endpoints.
- **FAIL Condition:** Drift between Edge Function SHA, frontend SHA, and git main.
- **Allowed Blocker State:** None.
