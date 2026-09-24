# FlyCheap production deployment runbook

This runbook is the final operational path from the repository on `dev` to a
deployed Supabase runtime. It deliberately keeps provider and server
credentials out of Vercel and out of the browser.

## Required GitHub Actions secrets

The repository already contains the workflow
`.github/workflows/deploy-supabase-ingest.yml`. Before running it, configure
these secrets in the GitHub repository settings:

| Secret | Purpose |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | Supabase Management API/CLI deployment token |
| `SUPABASE_PROJECT_REF` | Environment-specific isolated FlyCheap project ref; never reuse the contaminated project by default |
| `SUPABASE_SECRET_KEY` | Server-only REST ingest key |
| `INTERNAL_FUNCTION_SECRET` | Authenticates ingest/analyze/alert functions |
| `VITE_SUPABASE_URL` | Public client URL |
| `VITE_SUPABASE_ANON_KEY` | Public browser key |
| `RATE_LIMIT_SALT` | Random salt (at least 16 characters) for hashed abuse buckets |
| `TURNSTILE_SECRET_KEY` | Server-only Cloudflare Turnstile validation key |
| `RESEND_API_KEY` | Server-only confirmation and alert email provider key |
| `TELEGRAM_BOT_TOKEN` | Server-only Telegram delivery token while Telegram is offered in UI |
| `UNSUBSCRIBE_SECRET` | Long random HMAC secret for unsubscribe links |
| `TRAVELPAYOUTS_TOKEN` | Optional cached Data API token; results remain indicative |

The required entries deploy the runtime. `TRAVELPAYOUTS_TOKEN` does not authorize
background live search or affiliate classification.

The Vercel project must separately provide `VITE_TURNSTILE_SITE_KEY` and
`VITE_PUBLIC_SITE_URL` in addition to the two public Supabase variables. The
Turnstile widget hostname allowlist must contain the production hostname.
The build maps Vercel's `VERCEL_GIT_COMMIT_SHA` into `/release.json`;
`VITE_RELEASE_SHA` is the explicit override for another host. Set the GitHub
Actions variable `PUBLIC_SITE_URL` to the same canonical origin so production
smoke can compare frontend and Edge Function revisions.
Never expose `TURNSTILE_SECRET_KEY` through a `VITE_` variable.
Set the non-secret GitHub Actions variable `TURNSTILE_ALLOWED_HOSTNAMES` to the
same comma-separated production hostname allowlist; server validation checks
both the Turnstile action and returned hostname.
Set environment-scoped variables `PUBLIC_SITE_URL`, `ALERT_FROM_EMAIL`,
`APPROVED_BOOKING_HOSTS`, `AI_EXPLANATION_BATCH_LIMIT` and
`ANALYZE_FLIGHT_LIMIT`. The deploy workflow fails closed if alert delivery or
canonical URL configuration is absent; numeric batch limits retain reviewed
defaults when omitted.
The canonical public value is currently `https://farely.manhtx.com`; do not use
the generic `sanvemaybay.vercel.app` alias, which did not resolve to the current
deployment during the 2026-08-20 audit.
Production smoke also requires environment/repository variables `LIVE_LAUNCH_ROUTES`,
`APPROVED_LIVE_SOURCES` and `APPROVED_BOOKING_HOSTS`. These are policy values,
not credentials; changes require review because they alter the truth gate.

## Deploy

The workflow first runs a read-only migration parity preflight. It refuses to
deploy when remote-only versions exist or when applied local versions are not a
contiguous prefix. Do not bypass this gate with `migration repair`; follow
`DATABASE_DRIFT_INCIDENT_2026-08-20.md` and reconcile object ownership first.
The same preflight rejects remote-only Edge Functions so legacy runtime code
cannot survive outside the reviewed checkout without an explicit retirement or
adoption decision.

The dispatch defaults to the GitHub `Preview` environment. Each environment
must define its own `EXPECTED_SUPABASE_PROJECT_REF`, matching the secret project
ref exactly. `Production` additionally requires the `main` branch and the exact
manual confirmation `DEPLOY_PRODUCTION`. Configure required reviewers and
environment-scoped secrets before activation; repository-wide secrets alone are
not accepted as sufficient environment ownership evidence.

From a trusted machine with `gh` authenticated to the repository:

```sh
gh workflow run deploy-supabase-ingest.yml --repo manhtx/Sanvemaybay --ref dev
gh run list --repo manhtx/Sanvemaybay --workflow deploy-supabase-ingest.yml --limit 1
```

The workflow applies migrations first, deploys all runtime functions, and then
performs smoke checks. It must fail if `feed-snapshot` is not readable or if
`flight-search` still returns 404.
The Supabase CLI is pinned to `2.115.0`. Every run uploads a 90-day release
artifact containing the deployed Git SHA, CLI/Node versions, individual source
hashes and a combined source-tree SHA. The manifest deliberately excludes
`.env`, build output and local dependency directories.

The current project has older ad-hoc remote migration versions that do not map
one-to-one to every local migration. Do not use `db push --include-all` to
replay history. Inspect `supabase migration list`, apply a reviewed idempotent
migration with `supabase db query --linked --file ...` when necessary, verify
the resulting schema/data classification, and repair only that exact applied
version in migration history.

## Acceptance evidence

After a successful run, verify all of the following against the project URL:

1. `feed-snapshot` returns HTTP 200 and a `deals` array.
2. `flight-search` returns either provider results or an explicit provider
   configuration error, never 404.
3. The active feed contains only future, source-backed rows.
4. Affiliate rows exist only when the provider returned a current offer and a
   provider-approved HTTPS deeplink.
5. `deal-redirect` routes an active affiliate row to the provider and rejects
   stale/invalid rows.
6. `setup-alert` rejects a missing/replayed Turnstile token and accepts one
   valid token for a bounded 1–5 destination batch.
7. Run `retention-cleanup` first with `{"dry_run":true}`, inspect counts, then
   verify the scheduled pipeline completes with `{"dry_run":false}`.

Do not treat a successful GitHub run, a local build, or a non-empty table as
proof of affiliate readiness. The runtime smoke evidence is the release gate.

Run the repository-controlled truth gate after deployment:

```sh
npm run audit:production-truth
```

The command exits non-zero unless at least one row meets the canonical live
contract and launch thresholds. Its output separates total rows, qualified live
rows, rejection reasons, source counts, and launch-cohort counts. Never replace
this gate with the `publishedDeals` count from the connectivity smoke test.

## Third-party script governance

No advertising, analytics, affiliate, or monetization script may be loaded in
the document head by default. A new vendor requires a recorded owner and
purpose, privacy/consent review, CSP allowlist, performance budget, failure
isolation, test-environment disablement, rollback path, and browser acceptance.
The previously embedded `tpembars.com` script is disabled because it failed at
runtime and made Playwright page loads nondeterministic.

The hosting CSP allows application assets, the configured Supabase HTTPS/WSS
boundary and Cloudflare Turnstile only. Adding another script, frame or network
origin requires a reviewed vendor-purpose record, privacy assessment and an
explicit CSP change with browser verification.
