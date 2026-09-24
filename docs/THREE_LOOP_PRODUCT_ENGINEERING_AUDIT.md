# FlyCheap AI — Three-Loop Product & Engineering Audit

**Date:** 2026-08-11  
**Status:** Three repository loops complete; external production gates remain blocked  
**Goal:** Audit and improve product direction, code, data, UI, operations, and roadmap through three complete loops.

## 1. Executive conclusion

FlyCheap is directionally correct as an **AI Travel Opportunity Engine**, but it is not yet a validated public product. The repository has a credible foundation: evidence-first product rules, a fail-closed data contract, a tested React/Supabase implementation, alerts, search, deal history, comparison, and clear non-OTA boundaries.

The current constraint is not lack of features. It is the missing proof that the core promise works repeatedly in production: **current provider-backed fares, bookable/approved links, trustworthy deal qualification, and user value measured after the click**. Building more broad travel features before closing this loop would increase surface area without validating the product thesis.

Recommended direction:

1. Make provider-backed offer truth and booking-link integrity the only P0 product gate.
2. Narrow the launch market to a small route cohort that can be validated deeply.
3. Turn data provenance, freshness, redirect outcome, and alert delivery into measurable operational SLOs.
4. Keep the new visual direction, but finish accessibility, responsive, performance, and third-party-script governance before calling it production-ready.
5. Delay advanced AI, broad destination expansion, and scale monetization until the core opportunity loop has evidence.

## 2. Sources of truth reviewed

- Product vision: `FLYCHEAP_AI_GOAL.md`, `PRODUCT_PHILOSOPHY.md`, `PRODUCT_OVERVIEW.md`.
- Delivery plan: `PRODUCT_ROADMAP.md`, `DEFINITION_OF_DONE_MATRIX.md`, `ROADMAP_IMPLEMENTATION_AUDIT.md`.
- System: React/Vite app, Supabase migrations and nine Edge Functions, Python provider worker, GitHub/Vercel deployment paths.
- Quality: TypeScript, ESLint, Vitest, Deno tests, Playwright, read-only Supabase smoke.
- UI: current dirty-worktree Suno-inspired redesign rendered locally on desktop; source and responsive test definitions reviewed.

## 3. Round 1 investigation

### 3.1 Problem summary

The project contains substantially more product surface than its production evidence currently supports. Local quality gates are healthy, while the defining business loop remains only partially proven:

`provider offer → normalized observation → qualified deal → truthful UI → valid redirect → user saving/return`

This creates a risk that the product appears mature while the core value proposition is still in data-validation stage.

### 3.2 Root cause analysis

#### RC-1 — Provider access and commercial rights are outside the repository

The code can normalize, classify, and publish data, but it cannot manufacture approved live-search access, affiliate deep links, stable quota, or redistribution rights. Historical/archive rows and source URLs cannot substitute for current bookable offers.

#### RC-2 — Operational counters are not acceptance metrics

The read-only smoke test reports route and published-row counts. It does not enforce future departure, unexpired validity, link health, provider provenance, affiliate status, or checkout price parity. A growing row count can therefore coexist with zero qualified live opportunities.

#### RC-3 — Roadmap breadth outran core-loop validation

Trip Advisor, comparison, forecasting, AI explanation, personalization, historical pages, search, alerts, and monetization exist before the product has live evidence for the narrow core cohort. These are useful foundations, but should not drive the next implementation batch.

#### RC-4 — UI redesign is not yet an accepted design-system release

The current worktree includes broad uncommitted UI changes and a new design-system document. Desktop rendering is coherent and distinctive, but responsive behavior, keyboard flow, contrast, loading stability, reduced motion, and route-by-route screenshot acceptance have not yet been re-proven on this exact state.

#### RC-5 — Third-party monetization lacks a documented trust boundary

`index.html` loads an asynchronous script from `tpembars.com`. Local runtime logs `config is not valid`. There is no repository-visible consent, privacy, CSP, performance budget, failure isolation, vendor rationale, or environment gate. This conflicts with the stated early-stage priority of product quality over revenue and creates security/privacy/reliability risk.

#### RC-6 — Third-party loading makes browser acceptance nondeterministic

Typecheck, lint, unit tests, production build, Deno shared tests, and read-only Supabase smoke passed. The first Playwright attempt timed out waiting for its configured server. When Vite was started independently it became ready in under one second and Playwright executed all 24 scenarios: 16 passed and 8 timed out. Most failures stalled at `page.goto(..., waitUntil: "load")`; the remaining alert failures waited for form controls after navigation. Together with the browser console error from `tpembars.com`, this is evidence that uncontrolled third-party loading is making acceptance nondeterministic. The permanent fix should isolate or disable the script in non-production/test environments and govern it in production rather than increasing timeouts.

### 3.3 Evidence

| Area | Current evidence | Status |
|---|---|---|
| TypeScript + lint + unit + build | `npm run check`: 20 files / 59 tests passed; Vite build passed | PASS |
| Shared Edge Function logic | `npm run test:functions`: 17 tests passed | PASS |
| Remote read-only data access | `npm run test:integration`: 88 tracked routes, 444 published rows | PASS, limited scope |
| Current qualified live deals | No current acceptance query proving future, unexpired, provider-backed, link-valid offers | NOT_RUN |
| Booking/affiliate redirect parity | No current provider-to-checkout smoke evidence | NOT_RUN |
| UI desktop empty state | Local page rendered with zero deals and explicit accumulation state | PASS |
| UI/E2E route suite | With a separately started Vite server: 16/24 passed; 8 timed out, mainly while waiting for page load after the third-party script was introduced | FAIL |
| Third-party monetization | Browser console error from `tpembars.com`; governance not documented | FAIL |
| Production deployment parity | Not checked in this investigation; dirty worktree blocks commit-parity claims | NOT_RUN |

### 3.4 Scope of impact

- Product trust: users may interpret a published row or source URL as a currently buyable fare.
- Revenue: an ungoverned ad/monetization script can reduce trust and performance before the core value is validated.
- UI: the broad redesign touches most page shells and can regress mobile/accessibility across all routes.
- Operations: alerts and feed freshness are only valuable if provider supply and redirect validity are continuously measured.
- Roadmap: continuing horizontally would dilute effort away from the only existential risk—reliable live inventory.

## 4. Proposed permanent solution

### P0 — Establish a production truth gate

Create one server-side acceptance command and one dashboard/report that count only rows satisfying the canonical live contract:

- future departure and unexpired `valid_until`;
- complete itinerary and positive price/duration;
- approved provider/source provenance;
- `live_source` or `live_affiliate` classification without inference;
- HTTPS booking URL; affiliate metadata when labelled affiliate;
- redirect endpoint returns an approved destination;
- sampled checkout price-parity result stored separately from fare observation;
- no secrets in browser or logs.

The command must exit non-zero when the launch cohort has no qualified offers. `publishedDeals` must be renamed or supplemented so it cannot be mistaken for live acceptance.

### P0 — Narrow launch cohort and provider strategy

Use 3–5 routes from HAN/SGN with explicit provider coverage. Select one approved live-search/affiliate contract as primary and one fallback only if terms permit. Do not expand to 88 routes until the cohort meets freshness, success-rate, link-validity, and alert-value gates.

### P0 — Govern or remove monetization script

Default recommendation: disable the third-party script until there is a documented vendor decision, privacy/consent model, CSP allowlist, environment flag, performance budget, error isolation, and rollback owner. Early product validation should measure booking intent without injecting an opaque failing script.

### P1 — Complete the UI redesign as a controlled release

- Ratify the design-system document as the UI source of truth.
- Consolidate shell/sidebar/mobile navigation patterns.
- Verify every route at desktop and mobile breakpoints.
- Test keyboard order, focus visibility, landmarks, labels, empty/error/loading/stale states, reduced motion, contrast, and horizontal overflow.
- Add screenshot-based acceptance only for stable structural states; keep data fixtures explicitly non-production.

### P1 — Make core-loop telemetry actionable

Track provider success/quota, observations accepted/rejected, qualified live deals, stale rate, redirect failures, checkout parity sample, alert delivery, deal-save, booking click, and repeat visit. No PII should be sent to third parties without an explicit contract and consent basis.

### P2 — Validate user value before intelligence expansion

Run a small owner/beta cohort. Validate whether users understand evidence, trust prices, create alerts, return, and click through. Only then prioritize total-cost enrichment, stronger personalization, or ML forecasting. AI remains explanation-only until evaluation proves grounded outputs.

## 5. Why this solution is preferred

- It attacks the product's existential risk instead of adding more UI surface.
- It preserves the existing architecture and fail-closed contract.
- It converts ambiguous row counts into enforceable acceptance evidence.
- It aligns the implementation order with the documented mission and early-stage business goal.
- It provides a reversible path: provider adapters and monetization remain gated rather than embedded into the core client.

## 6. Preventive actions

- Add a decision record for every provider/affiliate/monetization integration.
- Require provenance and freshness fields at database boundaries.
- Require the production truth gate before release or scheduled alert activation.
- Keep secrets server-only and scan build artifacts/logs for accidental exposure.
- Require responsive/accessibility acceptance for shell-wide UI changes.
- Update the Definition of Done matrix with evidence date, environment, command, and expiry.
- Separate `PASS`, `NOT_RUN`, and `BLOCKED`; never infer production readiness from local tests.

## 7. Risks of the proposed implementation

- Provider approval may remain externally blocked or commercially unsuitable.
- A narrow cohort reduces visible inventory in the short term.
- Removing/gating monetization may defer revenue experiments.
- Checkout parity checks can violate provider terms if automated without approval; use contract-approved sampling.
- UI consolidation can overlap the current uncommitted redesign; changes must be applied carefully without discarding user work.
- Production checks may expose stale assumptions in historical documentation and require status downgrades.

## 8. Test strategy

### Local/static

- `npm run check`
- `npm run test:functions`
- `npm run check:functions`
- `npm run test:e2e` on desktop and mobile after deterministic webServer repair
- secret/build-artifact and third-party-domain audit

### Integration

- read-only Supabase schema/RLS/function smoke;
- canonical qualified-live query with sampled rows;
- invalid/stale/indicative rows fail closed;
- redirect rejects expired, invalid, missing-affiliate, and disallowed-host inputs;
- notification idempotency/retry and unsubscribe/confirmation paths.

### UI acceptance

- all routes at desktop and mobile breakpoints;
- empty, loading, error, stale, indicative, live-source, live-affiliate states;
- keyboard-only and screen-reader semantics;
- performance with third-party scripts disabled/enabled behind a controlled flag.

### Production acceptance

- deployment commit parity;
- migrations/functions/secrets verified without revealing values;
- provider-backed live cohort evidence;
- approved redirect and price-parity sampling;
- alert delivered to a real test recipient;
- monitoring and rollback verified.

## 9. Approved implementation plan (pending owner approval)

### Loop 1 — Correct the foundation

1. Update the canonical goal/roadmap/DoD documents with the narrow launch cohort and production truth gate.
2. Diagnose and repair deterministic E2E server startup.
3. Add the qualified-live acceptance command/report and tests.
4. Gate/remove the ungoverned monetization script and add CSP/vendor documentation.
5. Finish route-by-route responsive/accessibility acceptance for the current redesign.
6. Run all local and read-only integration gates; report external blockers.

### Loop 2 — Re-audit the integrated core loop

1. Re-run architecture, security, data, UI, performance, and documentation audit.
2. Fix discrepancies found between provider contract, database, functions, client mapping, redirects, and alerts.
3. Add operational telemetry and SLO documentation.
4. Re-run local, integration, browser, and permitted production checks.
5. Update roadmap priorities based on measured evidence.

### Loop 3 — Validate direction and define the next build

1. Perform a final independent audit of the whole repository and runtime evidence.
2. Close remaining repository-controlled defects and regressions.
3. Produce a 30/60/90-day build plan tied to measurable product outcomes.
4. Mark every capability `PASS`, `NOT_RUN`, or `BLOCKED` with evidence.
5. Stop only when all repository-controlled work is complete and external blockers are explicitly named.

## 10. Approval gate

No implementation code should change until this investigation and plan are approved. Approval authorizes focused edits within the plan; provider registration, paid contracts, production deployment, secret rotation, and transmission of personal test data remain separate external actions unless explicitly authorized.

## 11. Loop execution record

### Loop 1 — Foundation correction

Implemented:

- removed the failing ungoverned `tpembars.com` script from the document head;
- added a production truth gate with explicit cohort, source, freshness, link,
  affiliate, score, discount, and confidence checks;
- added contract tests and made them part of `npm test`;
- updated roadmap, deployment, DoD, and third-party governance documentation;
- repaired E2E accessibility locators after the current UI redesign introduced
  a stronger explicit email label.

Evidence after remediation:

- `npm run check`: PASS (59 Vitest + 3 production-truth contract tests, lint,
  typecheck, production build);
- `npm run test:functions`: PASS (17 tests at the Loop 1 checkpoint);
- `npm run test:e2e`: PASS (24/24, desktop Chromium and Pixel 5);
- remote truth gate: BLOCKED with authoritative HTTP 400
  `column deals.link_kind does not exist`.

### Loop 2 — Core-loop fail-closed audit

The second audit found that cached/stale snapshots, browser cache, direct
detail reads, redirects, and alerts did not all enforce the same active-live
contract. It also found a write-boundary root cause: `flight-ingest` discarded
link/affiliate metadata, the database defaulted missing provenance to
`live_source`, and analyzer promoted missing provenance to live.

Implemented:

- shared server-side active-live and approved-host validation;
- filtering at snapshot, stale fallback, alert, redirect, browser cache, feed,
  and detail boundaries;
- explicit preservation of link and affiliate metadata in both ingest paths;
- analyzer rejection of observations without verified live provenance;
- fail-closed `indicative` database defaults plus archive correction migration;
- operational SLO and release-gate documentation;
- client and Deno regression tests for legacy, stale, unapproved-host, and
  incomplete affiliate rows.

Production deployment remains out of scope until explicitly authorized; the
new migration, Edge Functions, environment allowlists, and truth gate must be
applied together to avoid a partial rollout.

### Loop 3 — Final direction, UI, security, and provider audit

The final audit corrected the last material direction mismatch: discovery
workers and Travelpayouts cached Week Matrix data could still be labelled live
or combined with a route-template affiliate URL. They now remain `indicative`;
only an approved live provider response with an approved target can enter the
active feed.

Implemented and verified:

- removed route-template affiliate generation from the discovery worker and
  Travelpayouts cached search path;
- changed shared discovery normalization to `indicative` with regression test;
- updated workflows and deployment docs so discovery is not described as live;
- selected Skyscanner partnership application as the preferred live-provider
  path and constrained Travelpayouts Search API to a future user-initiated
  surface based on current official usage rules;
- added `NEXT_90_DAY_BUILD_PLAN.md` with 30/60/90-day gates;
- added Home `main` landmark after runtime semantic audit;
- corrected the deployment smoke payload to the documented search contract and
  rejected unexpected HTTP responses instead of treating every non-404 as a pass;
- verified desktop and 390px mobile layout, mobile menu, no horizontal overflow,
  and no browser console warning/error after animation settled;
- `npm audit --omit=dev`: 0 known production dependency vulnerabilities.

## 12. Final evidence matrix

| Requirement | Evidence | Result |
|---|---|---|
| Audit code, UI, plan and vision | Three loop records, source inspection, browser runtime, tests and updated source-of-truth docs | PASS (workspace) |
| Correct direction where needed | Narrow cohort, fail-closed live contract, provider decision, SLO and 90-day plan | PASS (documented/workspace) |
| Implement repository-controlled corrections | Truth gate, ingestion/default/analyzer/read/redirect/alert hardening, UI/test fixes | PASS |
| Repeat complete loop three times | Loop 1 foundation, Loop 2 core boundaries, Loop 3 direction/UI/security/provider | PASS |
| Local quality and regression | `npm run check`, Deno checks/tests, Python compile, 24 E2E, browser audit | PASS |
| Current production schema parity | Truth gate returns PostgREST 42703 for missing `deals.link_kind` | BLOCKED — deployment authorization/state |
| Approved live provider inventory | No approved key/contract evidence supplied | BLOCKED — provider partnership |
| Live redirect/price parity | Requires deployed adapter and current offer | NOT_RUN |
| Real email/Telegram delivery | Requires authorized test recipients and configured providers | NOT_RUN |

Repository work is complete for the approved three-loop scope. The product is
directionally aligned but is **not production-ready** until the blocked and
not-run external acceptance rows are completed. No stored-row count, fixture,
local test, or historical result overrides those gates.
