# V15 PRECISION ADDENDUM — 15 LOCKED SOLUTIONS (S01 THROUGH S15)

## S01 — Single Canonical Execution Controller & Proof Authority (WP00)
- Bind every gate directly to executable assertion probes in `scripts/build-proof-index.mjs` and `scripts/evidence-admission-controller.mjs`.
- Reject forged passes, wrong source SHA, and unexecuted commands.
- Eliminate competing or contradictory control planes.

## S02 — Canonical 4-Part Flight Identity Architecture (WP01)
- Explicitly decouple:
  1. `PhysicalItinerary`: Exact segments, carriers, flight numbers, airports, local times.
  2. `CommercialOffer`: Itinerary + provider, fare family, cabin, passenger terms.
  3. `FareObservation`: Observation event, observed_at, price, currency.
  4. `Opportunity`: Durable public entity surviving generation rollovers.

## S03 — Provider Capability Contract & Rights Matrix (WP02)
- Explicit matrix in `src/app/data/providerContracts.ts` defining supported journey types, date flexibility, observation timestamps, link types, and failure policies.
- Provider 429/503/parser failure must never produce VERIFIED_EMPTY or false healthy states.

## S04 — Demand-Aware Priority Scheduling & Atomic Publication (WP03)
- Active Watch demand elevated to Tier 0 in `scripts/fast-flights-worker.py`.
- Publication reconciles candidate keys against committed keys; partial writes quarantined.
- Last-known-good generation retained for automatic rollback.

## S05 — Server-Authoritative Full-Universe Search & RouteBest (WP04)
- Full dataset filtered, deduplicated, and sorted on server before pagination.
- RouteBest applies PriceScope eligibility BEFORE `ORDER BY price LIMIT 1`.
- Math minimum strictly precedes Deal Score.

## S06 — Three Price History Products & Calibrated Confidence (WP05)
- Structurally separate:
  1. `Same-Offer History`: Exact offer across observation epochs.
  2. `Comparable Cohort`: Distribution across comparable distinct offers.
  3. `Route Trend`: Macro route statistics.
- Require independent epochs (>=3) before promoting evidence to STRONG.

## S07 — Opportunity Detail Decision Hierarchy & Saved Shortlist (WP06)
- Primary card click navigates to Decision Detail with verified price context.
- External booking verification CTA embedded in decision path.
- Saved shortlist backed by remote PostgreSQL with optimistic rollback.

## S08 — Full TravelIntent Watch & Transactional Outbox (WP07)
- Watch modal preserves exact return date vs departure window separation.
- Outbox uses `claim_notification_outbox` RPC with `FOR UPDATE SKIP LOCKED`.
- Watch condition episodes enforce single active open episode invariant.

## S09 — Real PostgreSQL Security, RLS, and Disaster Recovery (WP08)
- Test tenant isolation against live PostgreSQL socket (`/tmp:5432`).
- Restrict worker RPCs to `service_role`.
- SECURITY DEFINER functions set `search_path = public`.
- Disaster recovery drill verifies dump + restore checksums.

## S10 — Multi-Viewport Responsive Layout, A11Y, and Localization (WP09)
- Layout verified across 6 viewports (`320px`, `390px`, `768px`, `1207px`, `1440px`, `1920px`) with zero horizontal overflow.
- Modal focus traps, keyboard navigation, and screen-reader support.
- All observed, stale, and degraded states clearly localized in Vietnamese.

## S11 — Differentiated Opportunity Intelligence (WP10)
- Price/time trade-off matrix, budget-first Everywhere discovery, and explainable score dimensions.
- Honest unknown fee flags (baggage, seat, airport tax).

## S12 — Conditional Long-Term Capabilities Governance (WP11)
- Rigorous dependency criteria for conditional P2 capabilities (F36..F48, F86..F88).
- No placeholder UI represented as live functionality.

## S13 — High-Risk Commercial Extensions Boundary (WP12)
- Strict boundary contracts for P3 extensions (F49..F55: Copilot, B2B API, Direct Checkout).
- Require verified data licensing, commercial authorization, and payment rights before activation.

## S14 — End-to-End Release Tuple & Staging Reconciliation (WP13)
- Exact release tuple: Git SHA, CI run, frontend build, migrations head, worker revision, and production serving SHA.
- Zero-trust live audit against `https://farely.manhtx.com`.

## S15 — Adversarial Negative Vector Verification
- 24 comprehensive negative scenario defenses running in automated test suites with 0 failures.
