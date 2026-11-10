# Farely Project Adapter

This adapter specializes the portable Goal AI Loop for FlyCheap/Farely. The
loop shape is portable; the research lenses, proof obligations, and release
gates below are project-specific and must be re-derived from current source on
every cycle.

## Research lenses

Every 10-round cycle must independently challenge the current state across:

1. Product truth, user value, opportunity discovery, and decision usefulness.
2. Provider rights, provenance, quotas, source coverage, fallback, and cost.
3. Ingestion, normalization, immutable observations, freshness, quarantine,
   idempotency, replay, and read-model correctness.
4. Deal score versus confidence, sample sufficiency, cohort statistics,
   prediction calibration, and grounded explanations.
5. True cost, currency, baggage, seats, taxes, unknown/estimated values, and
   self-transfer/visa/terminal risk.
6. Route optimization, itinerary identity, comparison, detail, handoff, and
   booking-link safety.
7. Feed/search/filter/sort/pagination completeness and no false cheapest claim.
8. Saved deals, watch episodes, alerts, consent, deduplication, retries, and
   effectively-once notification behavior.
9. Auth, RLS, account deletion, privacy, rate limits, abuse protection, and
   secret/client-bundle boundaries.
10. Supabase migrations, Edge Functions, workers, schedulers, leases, retries,
    recovery, observability, and environment parity.
11. Responsive UX, accessibility, loading/empty/error states, mobile journeys,
    and decision-useful microcopy.
12. Performance budgets, bundle/chunk limits, API latency, LCP/CLS, worker
    runtime, and production cost.
13. Unit, integration, Deno, contract, adversarial, mutation, golden corpus,
    browser E2E, staging, production, and empirical soak evidence.
14. Release provenance, rollback, deployable surface, claims, and unresolved
    external blockers.

## Required evidence model

Each round must identify applicable `FLY-*` requirements, `GATE-*` or `RG*`
gates, source paths, commands, runtime environment, and a falsifier. A green
build or existing certification document is not proof of the current
production path. Credential, provider-rights, elapsed-time, and deployment
claims must be marked `EMPIRICAL_PENDING`, `BLOCKED_EXTERNAL`, or `VERIFIED`
with matching evidence.

Each cycle also maintains an append-only `evidence-ledger.jsonl`. Every
material claim must include its maturity level, exact artifact/command,
environment, commit, limitation, falsifier and negative control. The ledger
must distinguish local verification from staging, production and longitudinal
evidence; it must never turn a local green build into proof of live fares,
provider rights, notification delivery, user savings or business value.

## Implementation rules

- Derive waves from the current capability dependency graph; never copy a
  fixed wave list from another project.
- Preserve the frozen Core V1 boundary and justify every scope change.
- Record the user action → UI → API/Edge → DB/RLS/read model → provider/worker
  → state transition → visible result → telemetry/notification path.
- Do not acquire credentials, bypass provider terms, weaken RLS, rewrite
  migration history, or promote production without the required authority.
- Push each valid cycle to the Farely remote branch and record source SHA,
  report SHA, environment, and proof freshness.

## Completion semantics

Technical completion means reproducible applicable requirements and gates pass
with no open P0/P1 defects. Empirical completion is separate: real provider
coverage, external notifications, long-term price density, uptime, and actual
user savings require monitoring rather than invented evidence. Continue after
either checkpoint until the global loop policy is eligible for completion.
