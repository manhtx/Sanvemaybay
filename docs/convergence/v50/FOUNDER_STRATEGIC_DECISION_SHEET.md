# FARELY PROJECT 10X — FOUNDER STRATEGIC DECISION SHEET
**Mission ID:** FARELY-10X-G50-AUTHORITY-AND-DESIGN-CLOSURE  
**Date:** 2026-10-20  
**Authority Boundary:** Strategic Founder Decisions Awaiting Explicit Human Authorization  

Per Mission Rule A3, executor agents must not fabricate Founder approval to eliminate a blocker.
The following strategic decisions are isolated for explicit human Founder determination:

---

### STRAT-DEC-01: Commercial Boundary for Capability F52 (Full Checkout & Direct Booking)
- **Current Legal Status:** `BOUNDARY_EXCLUDED` per `docs/FLYCHEAP_AI_GOAL.md` Section 8 (Explicit non-goals: Not an OTA, no direct ticket sales, no payment processing, no refund handling).
- **Context:** Historical research introduced F52 ("Full checkout flow") which directly contradicts the authentic Founder non-OTA boundary.
- **Founder Decision Options:**
  - **Option A (Recommended):** Reaffirm Non-OTA Boundary. Maintain Farely strictly as an Opportunity Intelligence & Verification Platform. F52 remains permanently excluded; booking actions deeplink directly to airlines and verified affiliate partners.
  - **Option B:** Issue Formal Ticketing Amendment. Direct the technical team to prepare OTA regulatory licensing, payment processor integrations (Stripe/VNPay), escrow accounts, and ticketing fulfillment custody.
- **Current Default:** Option A (F52 marked `BOUNDARY_EXCLUDED`).

---

### STRAT-DEC-02: Commercial Provider Ingestion Contracts (GDS / Direct NDC)
- **Current Technical Status:** Indicative scraping (`fast_flights`) + Amadeus Self-Service indicative + Travelpayouts affiliate deeplinks.
- **Context:** Free/indicative tiers have rate limits and lack commercial enterprise SLAs. Commercial GDS access (Amadeus Enterprise, Sabre, Travelport) requires enterprise contracts, corporate vetting, and monthly fee commitments.
- **Founder Decision Options:**
  - **Option A (Recommended):** Continue indicative + affiliate aggregation. Optimize crawler economics and cache tiering. Enter commercial contracts only after sustained organic user traction.
  - **Option B:** Authorize enterprise procurement and budget for direct GDS / aggregator feeds.
- **Current Default:** Option A.

---

### STRAT-DEC-03: Roadmap Sequencing for P2 Expansion Capabilities
- **Current Status:** 16 P2 capabilities preserved as 32 dual V1/V2 variants in `P2_SEMANTIC_VARIANT_RECONCILIATION.json`.
- **Context:** Implementing all 32 variants simultaneously dilutes focus from core opportunity intelligence.
- **Founder Decision Options:**
  - Select the priority sequencing for Wave 8 / Wave 9.
  - **Executor Recommended Priority:**
    1. F36-V2 (`Trip-Length Optimizer`): High user value, purely arithmetic, zero external licensing.
    2. F37-V2 (`Cabin Class Comparison Matrix`): High value for business/premium travelers.
    3. F38-V2 (`Nearby Destination Finder`): Directly aligns with Section 3 Opportunity-driven Travel vision.
- **Current Default:** Staged as `CANDIDATE_FUTURE_P2`.

---

### STRAT-DEC-04: Production Deployment Promotion Authorization (Rule 6)
- **Current Status:** PR #1 is OPEN, MERGEABLE, CI GREEN (Run ID 39235445418). Vercel preview ready.
- **Decision Required:** Authorize merging PR #1 into `main` and promoting release tuple `tuple_v50_authority_and_design_closure` to production domain `https://farely.manhtx.com`.
- **Current Default:** Held pending explicit Founder instruction.
