# FARELY V22 — CURRENT STATE RECONSTRUCTION
## Baseline Date: 2026-10-06 | Authoring Reference: 3226662309ca93c29c9c6bd67b55fa35074b7d2d

### 1. Source & Remote Identity
- **Working Tree:** `/Users/manhtx/Documents/Sanvemaybay`
- **Branch:** `main` (clean working tree, zero dirty files, zero untracked files)
- **Local HEAD SHA:** `3226662309ca93c29c9c6bd67b55fa35074b7d2d`
- **Remote origin/main SHA:** `3226662309ca93c29c9c6bd67b55fa35074b7d2d`
- **Ahead/Behind:** `0 / 0` (clean synchronization)

### 2. Live Production Runtime
- **Vercel Public Frontend:** `https://farely.manhtx.com`
  - `release.json`: SHA `3226662309ca93c29c9c6bd67b55fa35074b7d2d`, generated at `2026-10-05T11:50:13.406Z`
- **Supabase Production Edge Functions:**
  - `observed-fares` response:
    - Status: `degraded_freshness` (feed age: 179 minutes, total snapshots: 3385)
    - Deployed SHA: `3226662309ca93c29c9c6bd67b55fa35074b7d2d`
- **GitHub Actions Workflows:**
  - `FlyCheap fast-flights discovery pipeline`: all recent runs `PASS` (`fast-flights==3.1.0`)
  - `Verify`: clean `PASS` on both `check` and `clean-database-bootstrap` (local isolated database replay + `supabase db lint`)
  - `Deploy FlyCheap Supabase runtime`: deployed with `3226662`

### 3. Local Test Baseline
- Vitest unit tests: 128 tests passing (35 test files)
- Node contract/invariant tests: 54 tests passing
- Deno Edge Function shared tests: 47 tests passing
- Playwright E2E browser tests: 52 tests passing (multi-viewport)
- Total test count: 281 passing tests

### 4. Known Core Product Deficiencies & Architectural Debt to Resolve in V22
1. **Price Truth Gap (HAN -> KUL Regression):**
   - User scenario: Farely surfaced Sun PhuQuoc fare ~5.21M VND for HAN-KUL (16-20 Oct direct) while market/Google Flights showed AirAsia direct ~4.27M VND.
   - Root causes to dissect: Did crawler ingest all provider candidates or truncate? Does OfferVariant selection pick the minimum normalized total price for a TravelIntent, or does a Deal Score override pure price minimum? Are multiple OfferVariants aggregated under one TravelIntent opportunity, or do expensive variants crowd out the cheaper alternative?
2. **Cheapest vs Best Value Separation:**
   - Farely must distinguish pure minimum eligible total price (`CHEAPEST`) from score-weighted trade-offs (`BEST VALUE`).
   - Price scope fingerprinting must prevent comparing incompatible scopes (e.g., direct-only vs stops, BKK-only vs all Bangkok airports, 1 adult vs multi-passenger).
3. **Domain Convergence:**
   - Formalize canonical hierarchy: `TravelIntent` -> `OfferVariant` -> `Observation` -> `ComparableCohort` -> `Opportunity` -> `Watch` -> `SavedOpportunity` -> `Verification`.
   - Distinct treatment for "Specific Offer" vs "Route-Best Option" in Detail and Watch surfaces.
4. **Search Correctness:**
   - Strict `FILTER -> SORT -> PAGINATE` global semantics (no client-local filtering over a pre-paginated subset).
   - City vs. Airport disambiguation (Bangkok: BKK vs DMK; Tokyo: HND vs NRT).
5. **Watch Reliability & Truthful Epistemics:**
   - Default Watch monitors TravelIntent Route-Best eligible price (not single arbitrary offer).
   - Server-backed state machine with fails-closed creation.
   - `lastCheckedAt` starts `null`, displaying "Đang chờ lượt kiểm tra đầu tiên."
6. **Saved Durability:**
   - Long-term memory preserving snapshot context independent of observation pruning.
   - Clear diff between saved price and current best price.
7. **UX/UI Reconstruction:**
   - Replace generic dark SaaS aesthetic (nested cards, border-white/10, icons on everything, uppercase metadata) with a calm, high-signal, high-density **Airfare Price Instrument**.
   - Ledger-style scanning (8-12 opportunities visible on desktop viewport).
   - Natural Vietnamese copy without developer jargon (e.g., translate `KNOWN/UNKNOWN` to clear cost breakdowns; eliminate legacy "Deal ngon", "Deal cực nóng").
8. **Production Falsification:**
   - Hostile probes to actively attempt breaking every critical claim before final release closure.
