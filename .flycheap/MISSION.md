# FlyCheap AI — Autonomous Product Mission

**Version:** 2.0 (Frozen Execution Contract)  
**Status:** ACTIVE_EXECUTION  
**Repository:** `manhtx/Sanvemaybay`

---

## 1. Product Thesis

FlyCheap is **AN AI-ASSISTED TRAVEL OPPORTUNITY INTELLIGENCE ENGINE**.
It is not an OTA, not a booking engine, and not a generic flight search box.

The core question FlyCheap answers for the user:
> *"Where can I travel unusually cheaply right now, how exceptional is the opportunity, what will it really cost me, what risks exist, and what action is justified by the available evidence?"*

---

## 2. Core User & Core Problem

- **Core User:** Flexible travelers, deal seekers, and cost-conscious planners who prioritize value, timing, and destination discovery over rigid itineraries.
- **Core Problem:** Travelers waste hours comparing disjointed flight search engines, decoding misleading headline fares that hide baggage/fees, navigating opaque price fluctuations, and taking on uncalculated connection risks without reliable historical guidance.

---

## 3. Core Product Loop

```
DISCOVER → VERIFY → ANALYZE → RANK → EXPLAIN → COMPARE → ACT / MONITOR
```

1. **DISCOVER:** Systematically monitor prioritized routes across providers for statistically anomalous low fares.
2. **VERIFY:** Validate data freshness, route validity, tax/fee inclusion, and source accessibility.
3. **ANALYZE:** Compute historical fare percentiles, cohort comparisons, total true cost (baggage, seats, logistics), and connection/self-transfer risks.
4. **RANK:** Deterministically rank opportunities by Deal Score, statistical confidence, real savings, and user preferences.
5. **EXPLAIN:** Generate grounded, schema-validated explanations distinguishing deterministic flight facts from AI inferences.
6. **COMPARE:** Contrast candidate routes, alternative dates, and multi-segment tradeoffs.
7. **ACT / MONITOR:** Provide actionable Buy/Monitor/Wait guidance, reliable booking handoffs, or deduplicated alerts.

---

## 4. Core V1 Completion Boundary

The frozen Core V1 product covers 31 mandatory areas:
1. Flight data provider layer (multi-adapter abstraction)
2. Normalization to FlyCheap internal contract
3. Rigorous validation & quarantine for anomalous fares
4. Historical fare observations (immutable time-series)
5. Statistical pricing engine (cohorts, medians, percentiles, dispersion)
6. Deal detection engine (discount vs baseline, rarity, sample sufficiency)
7. Deal confidence scoring (separate from deal strength)
8. True-cost analysis (known, estimated, optional, unknown breakdowns)
9. Route comparison engine
10. Foundational route optimization & time-dependent graph pruning
11. Self-transfer & separate-ticket risk analysis (buffer, visa, terminal)
12. Buy / Monitor / Wait decision engine
13. Grounded AI explanation (fallback-resilient, schema-enforced)
14. Ranked opportunity feed (fresh, diversified, evidence-badged)
15. Deal Detail interface (complete transparency, cost breakdown, risk)
16. Flexible discovery (budget, date range, region, stop limits)
17. User preferences & profile matching
18. Saved deals with lifecycle state (active, changed, stale, expired)
19. Smart alert engine (filters, cooldowns, deduplication)
20. Notification dispatch (effectively-once, bounded retry)
21. Freshness lifecycle (healthy <=2h, degraded 2-6h, stale >6h)
22. Provider health monitoring & fail-closed states
23. Background execution & idempotent worker pipelines
24. Secure authentication & strict RLS authorization isolation
25. Operational & administrative observability
26. Decision-useful product analytics (PII-safe, rate-limited)
27. Structured logging & correlation tracking
28. Security hardening & privacy boundaries (zero secrets committed, data retention, account deletion)
29. Multi-tier testing (unit, integration, contract, E2E, adversarial)
30. Deployment runbook & migration reproducibility
31. Production-grade responsive UX (WCAG 2.2 AA standards)

---

## 5. Non-Goals for Core V1

- NO direct airline ticketing or ticket issuance.
- NO payment processing or credit card collection.
- NO passport or government ID storage.
- NO hotel, car rental, or travel insurance marketplace.
- NO native mobile app (responsive web first).
- NO autonomous purchasing on behalf of users.
- NO default hidden-city ticketing recommendations.
- NO authoritative visa/legal guarantee without official government sources.
- NO unthrottled or bot-evasive scraping that violates terms or platform integrity.

---

## 6. Hard Constraints & Safety Invariants

1. **Data Truth Dominates AI:** AI must never invent flight facts, prices, airlines, or schedules. AI explains; deterministic code calculates.
2. **Monetary Safety:** Currency is explicitly bound; prices must be non-negative, finite numbers.
3. **Time Consistency:** Departure must strictly precede arrival taking timezones into account.
4. **Deal Score != Confidence:** High discount with low sample size is capped and must never be promoted as high confidence.
5. **No False Freshness:** Stale data must never be presented as live. Stale status is explicitly displayed with warnings.
6. **Fail-Closed Live Links:** Live booking links must target approved domains. Indicative/archive links must be labeled indicative.
7. **Cross-User Isolation:** No user can read or modify another user's alerts, bookmarks, or profile.
8. **Account & Privacy Rights:** Account deletion is server-authoritative, transactional, and cleans all user-associated records.

---

## 7. Current Canonical Architecture Intent

- **Frontend:** React 18 + Vite + Tailwind CSS + Lucide Icons + React Router.
- **Backend / API:** Supabase (PostgreSQL 16, pg_cron, Row Level Security, Storage, Edge Functions via Deno).
- **Edge Functions:**
  - `flight-ingest`: Ingest raw offers from external providers.
  - `analyze-price`: Compute statistics, cohorts, deal scores, and confidence.
  - `feed-snapshot` / `observed-fares` / `refresh-observed-fares`: Scalable precomputed read models.
  - `ai-explainer`: Grounded LLM explanation with deterministic schema.
  - `alert-processor` & `setup-alert`: Safe alert creation, Turnstile abuse prevention, deduped dispatch.
  - `manage-user-data`: Export and account deletion.
  - `track-event`: Rate-limited client event ingestion.
  - `retention-cleanup`: Bounded data retention lifecycle.
- **Ingestion Workers:** Python/Node background collectors respecting query economics and provider quotas.

---

## 8. Completion Definitions

- **Technical Completion:** 100% of frozen Core V1 requirements and features are verified PASSING by reproducible unit, integration, contract, E2E, or adversarial tests, with no open P0/P1 defects.
- **Empirical Completion:** Requirements depending on elapsed real-world time (e.g. multi-month price density, actual booked savings, long-term provider uptime) are tracked under `EMPIRICAL_PENDING` with monitoring in place, without blocking the technical release gate.
