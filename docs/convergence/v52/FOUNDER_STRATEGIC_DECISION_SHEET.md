# FARELY PROJECT 10X — FOUNDER STRATEGIC DECISION SHEET
**Mission ID:** FARELY-10X-G11-FULL-DESIGN-20261020  
**Status:** PENDING_FOUNDER_COMMITMENT_ADJUDICATION  
**Date:** 2026-10-20  

The research and engineering teams have solved all domain, data, security, and algorithmic decisions. The remaining decision frontier comprises only genuinely irreducible strategic owner choices:

---

### Decision 1: Commercial Provider Agreement Authorization (FND-DEC-01)
- **Context**: Fast Flights is an unentitled scraper. Travelpayouts Data API offers cached indicative prices but forbids automated background scraping. Skyscanner Live Prices requires enterprise partner credentials.
- **Options**:
  - **Option A (Recommended for Beta)**: Operate in Mode 1 (Indicative Public Beta) using approved affiliate links and cached Travelpayouts Data API for user searches; quarantine Fast Flights to non-contractual research. Hold paid commercial scanning.
  - **Option B**: Procure paid commercial Skyscanner or Amadeus API contracts for continuous background route scanning.
- **Minimal Founder Action**: Approve Option A for public beta, or provide commercial procurement budget/credentials for Option B.

---

### Decision 2: P2 Scope Commitment Adjudication (FND-DEC-02)
- **Context**: 16 historical P2 capability IDs developed dual meanings across V13 and V17 (32 distinct variants).
- **Options**:
  - **Option A (Recommended)**: Commit Core functional variants (V1s: Calibrated Buy/Wait, Price Anomaly Detection, Deal Curation, Baggage Fee Calculator, Account Continuity, Total Trip Budget, Vietnamese Travel UX, Data Economics) as REQUIRED; designate secondary variants (V2s: Trip-Length Optimizer, Cabin Class Matrix, Carbon Estimator, Delay Predictor, etc.) as CONDITIONAL post-beta extensions.
  - **Option B**: Commit all 32 variants as REQUIRED for initial release.
- **Minimal Founder Action**: Confirm Option A variant split or specify alternate variant selections.

---

### Decision 3: Monetization & B2B Boundary (FND-DEC-03)
- **Context**: F51 (Premium Watch) and F53 (B2B API) represent monetization models.
- **Options**:
  - **Option A (Recommended)**: Maintain Farely as 100% free with non-intrusive affiliate referral monetization; prioritize consumer trust, repeat daily engagement, and data quality. Hold subscriptions and B2B until product-market fit.
  - **Option B**: Accelerate paid tier (F51) with Stripe checkout and SMS/Telegram priority alerts.
- **Minimal Founder Action**: Confirm Option A or authorize commercial subscription development.

---

### Decision 4: Production Promotion Authorization (FND-DEC-04)
- **Context**: Vercel production at `farely.manhtx.com` runs commit `084025b1f58a...`. Feature branch HEAD has advanced to `0885d3ffcac2974df7fd07c8b4c61d986f567161` with 848 passing tests and closed defects.
- **Options**:
  - **Option A**: Authorize merge of PR #1 to `main` and automated deployment to production.
  - **Option B**: Maintain feature branch isolation pending external live verification drill.
- **Minimal Founder Action**: Explicitly grant or withhold permission to merge PR #1 and deploy.
