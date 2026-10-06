# FARELY V22 — BLOCKERS LEDGER

| Blocker ID | Severity | Category | Description | Status | Evidence / Resolution Path |
| :--- | :---: | :---: | :--- | :---: | :--- |
| Blocker ID | Severity | Category | Description | Status | Evidence / Resolution Path |
| :--- | :---: | :---: | :--- | :---: | :--- |
| **BLK-01** | P0 | PRICE_TRUTH | HAN -> KUL price gap: Need to ensure provider worker ingests all eligible candidates and aggregation surfaces the true cheapest option | CLOSED | `fetch_all_flights` extracts both `payload[3][0]` and `payload[2][0]` from Google Flights, eliminating LCC blind spot. Stop formula corrected. Route-best harness proves 4.26M selected. |
| **BLK-02** | P0 | SEARCH | Global Search query must filter in database before pagination; city vs airport scope | CLOSED | `resolveCanonicalAirportOrCity` handles BKK_ALL, TYO_ALL vs BKK, DMK, HND, NRT. Global search tests pass. |
| **BLK-03** | P0 | WATCH | Watch evaluation and creation fail-closed contract, first-check `lastCheckedAt` state | CLOSED | `formatLastChecked` truthfully renders "Đang chờ lượt kiểm tra đầu tiên" when null; fails closed on creation errors. |
| **BLK-04** | P0 | SAVED | Saved opportunity durability across observation pruning and session switches | CLOSED | `user_saved_opportunities` stores snapshot data ensuring historical price and context survive observation pruning. |
| **BLK-05** | P0 | RELEASE | Production parity across Frontend, Edge Functions, Migrations, and Git SHA | IN_PROGRESS | Pre-flight passed: all Vitest, Node, Deno and Playwright suites green. Proceeding to git commit, push, and deployment. |
| **BLK-06** | P1 | UX_UI | Three structural design directions evaluation and transition to Airfare Price Instrument | CLOSED | Prototyped 3 directions in DESIGN_DIRECTION.md; Direction C (Airfare Price Instrument) selected (Score 105/110) and implemented. |
| **BLK-07** | P1 | DATA_HONESTY | Remove legacy deal semantics ("Deal ngon", "Deal cực nóng") and translate True Cost to plain Vietnamese | CLOSED | True Cost translated to plain Vietnamese ("1. Giá đã biết", "2. Có thể phát sinh", "3. Chưa xác định"). Cheaper alternative alert banner implemented. Currency formatted with ₫ and tabular numbers. |
| **BLK-08** | P1 | ACCESSIBILITY | Verify keyboard nav, ARIA labels, focus states, and zero-overflow | CLOSED | Playwright responsive viewport suite passes with 0 overflow on 11 device viewports (320px to 1920px). |
