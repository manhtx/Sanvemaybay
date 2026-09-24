# FlyCheap AI — Remediation Execution Status

**Updated:** 2026-08-20  
**Source plan:** `MASTER_REMEDIATION_IMPLEMENTATION_PLAN_2026-08-20.md`  
**Rule:** `CODE_COMPLETE`, `STAGING_VERIFIED` và `PRODUCTION_VERIFIED` là các
trạng thái độc lập. Không suy diễn production từ local tests.

## Current program status

| Finding | Repository status | Runtime status | Remaining gate |
|---|---|---|---|
| F-01 live provider | Contract preserved fail-closed | FAIL: remote truth audit found 0 qualified live deal | Approved provider, parity and redirect proof |
| F-02 reproducible release | CODE_COMPLETE: pinned CLI, backend SHA, frontend `/release.json`, source manifest/hash artifact and fail-closed same-SHA smoke | BLOCKED: linked DB migration history is contaminated by Macro migrations | Isolated staging, migration reconciliation, reviewable commit and rollback proof |
| F-03 freshness | CODE_COMPLETE: hourly workflow, age classification and degraded/stale UI | FAIL: remote runtime omitted age/release and called ~18h observations healthy | Deploy reviewed function; three successful runs; p95 age <=2h |
| F-04 scoring confidence | CODE_COMPLETE: confidence-gated labels, version and UI semantics | NOT_RUN | Deploy, shadow/backtest and verify 0 claim violations |
| F-05 public API scale | CODE_COMPLETE: precomputed read model, DB pagination/index, refresh job and bounded/rate-limited indicative search | NOT_RUN | Migration/function deploy, query plan, load/rate-limit evidence |
| F-06 alert abuse | CODE_COMPLETE: Turnstile server validation, bounded 1–5 batch and atomic hashed IP/email budgets | NOT_RUN | Configure keys/hostname, deploy and run abuse/replay test |
| F-07 observability | PARTIAL: freshness, release SHA, correlation IDs, PII-safe server/client error codes, worker telemetry, operational view and runbook added | NOT_RUN | Deploy telemetry, dashboard, burn alerts and game day |
| F-08 architecture drift | CODE_COMPLETE: `ARCHITECTURE_AS_IS.md` documents boundaries, flows and change rules | NOT_RUN | Review against deployed topology after staging activation |
| F-09 provider dependency | Indicative boundary preserved; Skyscanner/Travelpayouts/Amadeus roles refreshed from official terms | FAIL: only indicative/archive sources observed; no approved live adapter/key | Skyscanner partner access, adapter health, refresh/deeplink and parity proof |
| F-10 database query | CODE_COMPLETE: proposed read-model indexes | BLOCKED: linked public schema mixes FlyCheap and Macro objects | Clean staging `EXPLAIN ANALYZE`, load evidence and index validation |
| F-11 QA | CODE_COMPLETE: local suites, clean-DB bootstrap CI and scheduled truth/freshness/release/retention smoke | PARTIAL: isolated PostgreSQL replay PASS; remote truth FAIL; Supabase DB bootstrap CI not yet run | Staging suite and same-SHA production acceptance |
| F-12/F-13 accessibility/UX | PARTIAL: Vietnamese labels, freshness UI, skip link, concise card semantics and 44px primary controls | NOT_RUN | Keyboard/VoiceOver and moderated user test on deployed build |
| F-14 performance | PARTIAL: detail route ~425→26 KB; chart and 8.9 KB RUM load on demand; sampled CLS/INP/LCP pipeline | FAIL: public deployment is the old ~425 KB detail build and still loads third-party script | Deploy RUM migration/function, network trace and p75 evidence |
| F-15 SEO | PARTIAL: route metadata plus fail-closed robots/sitemap build generator | FAIL: public robots/sitemap paths rewrite to SPA HTML | Configure canonical origin, deploy assets, crawler HTML test and SSR/prerender decision |
| F-16 privacy | CODE_COMPLETE: inventory/policies, retention, authenticated export and idempotent account deletion with service-only status evidence | NOT_RUN | Legal review and dedicated staging export/delete/retry/cleanup evidence |
| F-17 maintainability | PARTIAL: alert and route APIs split behind stable facade; `api.ts` reduced 570→487 lines | NOT_RUN | Continue domain extraction only with coverage and measured need |
| F-18 auth baseline | PARTIAL: 12-character signup baseline, safe errors, secure password change and strict remote anon smoke | FAIL: four expected protected controls are undeployed (404); remote Auth settings unverified | Deploy clean staging, user A/B/service-role RLS, remote Auth policy and CAPTCHA proof |

## Changes completed in the first implementation cycle

### Scoring and truth language

- Added algorithm version `observed-v2-confidence-gated`.
- Added `confidence_percent`, `confidence_level` and `discount_strength`.
- Scores remain visible and sorting remains discount-first.
- Confidence below 50% caps copy at `Giá đáng chú ý`.
- `Deal cực nóng` requires confidence >=75%; `Deal rất ngon` requires >=65%.
- Indicative `GIẢM MẠNH` and `ĐÁNG CHÚ Ý` badges require evidence thresholds;
  English `FLASH/TRENDING/SAVING SCORE/CONFIDENCE` copy was removed.

### Freshness

- `healthy`: latest observation <=120 minutes.
- `degraded_freshness`: 121–360 minutes.
- `stale_only`: >360 minutes.
- UI surfaces age and explicit check-again warning instead of calling old data
  healthy.

### Precomputed observed read model

- Added migration `20260820000100_observed_fare_read_model.sql`.
- Added internal `refresh-observed-fares` function.
- Refresh performs bounded raw scoring in the background and upserts a versioned
  read model.
- Public `observed-fares` now uses DB filtering, ranking, exact count and range
  pagination; it no longer scores 5,000 raw rows per user request.
- Raw `flights` remains the evidence source; indicative rows cannot become live.

### Abuse protection

- Added migration `20260820000200_request_rate_limits.sql` with atomic budget
  consumption restricted to service role.
- Alert setup consumes email and client-address budgets using salted SHA-256
  buckets; raw identifiers are not stored.
- Missing client address, salt or rate-limit storage fails closed.
- Deployment workflow requires `RATE_LIMIT_SALT`.
- Alert creation requires server-side Cloudflare Turnstile Siteverify. Tokens
  are action-bound, single-use, length-bounded and submitted once for a
  validated batch of 1–5 destinations; each alert still consumes budget.
- Anonymous analytics can no longer insert directly into `product_events`.
  `track-event` validates an allow-listed bounded payload and applies a hashed
  client-address budget before service-role insertion.

### Release evidence

- Supabase deployment stores `DEPLOYED_COMMIT` from `github.sha`.
- Public feed and observed endpoints return `release_sha`.
- Deployment list includes the new refresh function and workflow refreshes the
  read model after ingestion.
- Observed read/refresh boundaries return safe `x-request-id` and
  `x-release-sha` headers; failure logs are structured and correlation-safe.

### Architecture, accessibility, privacy, performance and SEO

- Added `ARCHITECTURE_AS_IS.md`, incident response runbook and a service-only
  operational scan-health view.
- Added skip navigation, concise deal-card accessible names and 44px primary
  mobile/control targets.
- Added privacy/terms routes, footer access and a data inventory/retention
  register without claiming unimplemented deletion/export rights.
- Added a service-only retention function with dry-run default and an
  internal-secret pipeline step for 2/7/30/90/180-day data classes.
- Added authenticated account export with token/hash exclusion and an explicit
  `DELETE_MY_ACCOUNT` server-authoritative deletion flow. Application data is
  deleted transactionally; a service-only request record tracks Auth failure,
  retry and completion without logging the raw user UUID. No account was deleted
  during repository verification.
- Added privacy-bounded 25% session-sampled CLS/INP/LCP RUM. Metrics load
  dynamically and pass through the rate-limited analytics boundary.
- Split the price history chart from the mandatory detail route: the route
  chunk fell from approximately 425.46 KB to 26.16 KB; the 400.01 KB chart
  chunk loads only when history exists.
- Added route metadata contracts for public, private/action and unknown routes;
  metadata identifiers are never copied from an untrusted deal ID.
- Build always emits restrictive `robots.txt` and emits `sitemap.xml` only for
  a configured non-local HTTPS origin; missing production origin fails closed
  instead of publishing guessed canonicals.
- Dependency audit was remediated from 3 high advisories to 0 known
  vulnerabilities and is now a CI gate.
- Added a browser diagnostics boundary that accepts only bounded stable codes.
  Raw Supabase/provider/database errors are no longer logged by the reviewed
  client service boundaries or surfaced by alert UI; touched public Edge
  Functions no longer return raw database error messages.
- Internal mutation/worker functions are POST-only before authentication/body
  work. The deploy workflow now provisions and fail-closes on the active alert
  dependencies (Resend, Telegram, unsubscribe signing, canonical origin and
  sender identity) instead of allowing a green deploy followed by alert 503s.

## Verification evidence

| Gate | Result |
|---|---|
| TypeScript typecheck | PASS |
| ESLint | PASS |
| Vitest | PASS — 77/77 |
| Node contracts | PASS — 31/31 |
| Deno shared tests | PASS — 45/45 |
| Deno function checks | PASS |
| Production build | PASS |
| Playwright desktop/mobile | PASS — 32/32 |
| `git diff --check` | PASS |
| Remote Supabase connectivity | PASS — 88 tracked routes, 605 published rows |
| Remote production truth | FAIL — 0 qualified live deals; 42 launch-cohort rows |
| Local browser observed-fare UI | PASS — 623 total, 60 rendered, 46.4% first, confidence claim capped |
| Remote anon read boundary | FAIL strict — existing tables deny/RLS-empty, but request limits/observed snapshots/deletion requests/operational view return 404 |
| Dependency audit | PASS — 0 known vulnerabilities |
| Migration apply | LOCAL PASS — all 38 migrations replayed on isolated PostgreSQL 16 with Supabase auth/role stubs; staging NOT_RUN |
| Staging load/query plan | NOT_RUN |
| Production deploy/runtime | NOT_RUN |

## External/authorization gates

The repository is deliberately not committed, pushed or deployed by this
cycle. Read-only CLI access is available, but activation requires:

1. review and separation of the existing dirty worktree;
2. authorization to commit/push the reviewed change set;
3. a dedicated clean FlyCheap staging project; the currently linked database
   contains Macro migrations/tables and fails the parity preflight;
4. provision of `RATE_LIMIT_SALT`, Turnstile and deployed-SHA configuration;
5. reviewed migration deploy and refresh-function deployment;
6. public Vercel origin/protection decision and same-SHA frontend deployment;
7. provider contract decision and CAPTCHA vendor/site-key decision.

Git evidence shows `dev` is 33 commits ahead of default `main` without reverse
divergence. Production currently follows the old dev lineage, but the hardened
workflow now requires Production from `main`; reviewed integration into `main`
is therefore an explicit release gate, not an automatic push from this worktree.

Read-only configuration audit found only the two public Supabase variables in
Vercel. GitHub Actions has no `SUPABASE_ACCESS_TOKEN`, `RATE_LIMIT_SALT`,
Turnstile/provider secrets or required policy variables. These absences mean the
new deploy and production-smoke workflows will fail closed instead of silently
deploying an incomplete runtime.

A refreshed name-only audit confirmed that the GitHub `Preview` and
`Production` environments both contain zero scoped secrets/variables. The exact
activation matrix and ordering are recorded in
`STAGING_ACTIVATION_READINESS_2026-08-20.md`; no secret values were read.

Until those gates pass, the goal remains active and production completion must
not be claimed.

## Current remote truth evidence

Read-only audit on 2026-08-20 returned 605 deal rows and 42 rows in the declared
`HAN-BKK,HAN-SIN,HAN-ICN` launch cohort, but zero row passed the canonical live
contract. Sources were `fast_flights_google` (403) and
`serpapi_google_flights_archive` (202). All 605 rows failed the approved-source
gate; 444 were not live kinds and 525 were expired or missing validity. This is
evidence that current production inventory is indicative/archive—not a reason
to weaken the live-deal gate.

The remote `observed-fares` endpoint separately returned HTTP 200 with 623
observed fares and 60 rows on page 1. Its deployed response omitted
`release_sha`, `latest_observed_at` and `feed_age_minutes`, while cards showed
observations around 18 hours old despite response status `healthy`. This proves
useful indicative inventory exists, but also proves the currently deployed
Edge Function predates the repository freshness/release contract.

Against the current local frontend and that remote payload, browser verification
showed 623 total fares, largest discount 46.4% first, and the first 60 cards
rendered. A legacy server label “Deal rất ngon” with inferred 25% confidence was
caught and fixed: the client now independently caps it to “Giá đáng chú ý”.

## Current public web evidence

Vercel alias inventory identifies `https://farely.manhtx.com` as the public
FlyCheap origin. It returned HTTP 200 for `/` and SPA routes, but the deployment
is the 2026-08-05 build from base commit `3c54080`; its HTML still contains the
now-removed ungoverned `tpembars.com` script. Requests for `/release.json`,
`/robots.txt` and `/sitemap.xml` returned the same 873-byte HTML document rather
than their expected file contracts. The generic `sanvemaybay.vercel.app` alias
returned 404, while immutable/branch deployment URLs redirected to Vercel SSO.
Therefore public-domain availability is PARTIAL and release/SEO/security runtime
gates remain FAIL until an authorized same-SHA deployment replaces this build.

With `VITE_PUBLIC_SITE_URL=https://farely.manhtx.com` and a fixture release SHA,
the current repository build emitted valid `release.json` (109 bytes),
`robots.txt` (160 bytes) and `sitemap.xml` (889 bytes), including the canonical
deal URL and sitemap reference. Hosting contract tests also prove CSP blocks
unreviewed scripts while allowing Supabase and Turnstile. This is local artifact
evidence only; the public deployment still serves the old files and headers.

## Isolated migration replay evidence

A temporary PostgreSQL 16 cluster was initialized under `/tmp`, with only
minimal `auth.users`, `auth.uid()` and Supabase role stubs. All 38 local
migrations applied in timestamp order with `ON_ERROR_STOP=1`. The resulting
schema contained 17 public tables, five public routines and 15 RLS-enabled
tables. The cluster was stopped and removed from the active runtime afterward.
This proves local SQL syntax/order against clean PostgreSQL; it does not prove
Supabase-specific API behavior, remote object equivalence or staging RLS.
