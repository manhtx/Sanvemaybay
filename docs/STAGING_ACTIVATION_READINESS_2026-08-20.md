# FlyCheap Staging Activation Readiness

**Audited:** 2026-08-20 (read-only CLI evidence)  
**Status:** BLOCKED_EXTERNAL — environment ownership/configuration required  
**Safety rule:** do not run `supabase db push` against the currently linked
legacy project; its migration history and public schema are contaminated by
Macro objects.

## 1. Current authoritative state

- GitHub environments `Preview` and `Production` exist.
- Both environments currently have zero environment-scoped secrets and zero
  environment-scoped variables.
- Repository secrets currently expose names for only
  `INTERNAL_FUNCTION_SECRET`, `SUPABASE_PROJECT_REF`, `SUPABASE_SECRET_KEY`,
  `VITE_SUPABASE_ANON_KEY` and `VITE_SUPABASE_URL`.
- The linked legacy Supabase project has some historical email/provider values,
  but lacks `RATE_LIMIT_SALT`, Turnstile configuration, Telegram delivery and
  `DEPLOYED_COMMIT`. It is not an acceptable staging target regardless.
- Docker daemon is unavailable locally, so the complete Supabase local stack
  could not be started. The existing isolated PostgreSQL migration replay is
  still local evidence, not Supabase staging evidence.

No secret value was read or recorded during this audit.

## 2. Preview environment contract

Create a new isolated FlyCheap Supabase project and configure the following on
the GitHub `Preview` environment.

### Secrets

| Name | Required | Purpose |
|---|---:|---|
| `SUPABASE_ACCESS_TOKEN` | yes | CLI deploy authorization |
| `SUPABASE_PROJECT_REF` | yes | New isolated Preview project |
| `VITE_SUPABASE_ANON_KEY` | yes | Public runtime smoke |
| `INTERNAL_FUNCTION_SECRET` | yes | Internal worker authentication |
| `RATE_LIMIT_SALT` | yes | One-way abuse buckets |
| `TURNSTILE_SECRET_KEY` | yes | Server-side anti-abuse validation |
| `RESEND_API_KEY` | yes | Confirmation and alert email |
| `TELEGRAM_BOT_TOKEN` | yes while UI offers Telegram | Telegram delivery |
| `UNSUBSCRIBE_SECRET` | yes | HMAC unsubscribe signatures |
| `TRAVELPAYOUTS_TOKEN` | optional | Indicative user-initiated search only |

### Variables

| Name | Required/default | Purpose |
|---|---:|---|
| `EXPECTED_SUPABASE_PROJECT_REF` | required | Prevent cross-environment deploy |
| `PUBLIC_SITE_URL` | required | Exact HTTPS Preview origin |
| `ALERT_FROM_EMAIL` | required | Reviewed sender identity |
| `APPROVED_BOOKING_HOSTS` | required | Redirect/data truth allowlist |
| `TURNSTILE_ALLOWED_HOSTNAMES` | required | Exact Preview hostname |
| `AI_EXPLANATION_BATCH_LIMIT` | default `20` | Bounded enrichment work |
| `ANALYZE_FLIGHT_LIMIT` | default `300` | Bounded analysis page |
| `MIN_OBSERVED_FARES` | default `100` | Non-empty useful feed gate |
| `LIVE_LAUNCH_ROUTES` | required for truth smoke | Reviewed cohort |
| `APPROVED_LIVE_SOURCES` | required for truth smoke | Approved live providers only |

The Vercel Preview environment separately needs `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`, `VITE_PUBLIC_SITE_URL` and
`VITE_TURNSTILE_SITE_KEY`. Its generated `/release.json` must match the deployed
Edge Function SHA.

## 3. Activation sequence

1. Create the isolated Preview Supabase project and record its ref only in the
   GitHub environment, never in source.
2. Configure secret/variable names above and add a required reviewer.
3. Build a clean exact-SHA branch/PR; never deploy the dirty worktree.
4. Dispatch the runtime workflow with target `Preview`.
5. Require clean migration/function parity before any mutation.
6. Apply migrations and functions from the same SHA; refresh observed fares.
7. Deploy Vercel Preview from the same SHA and verify `/release.json`.
8. Run RLS user A/B/service-role, CORS preflight, Turnstile replay, rate-limit,
   export/delete, retention dry-run, three-scan freshness, inventory >=100,
   query-plan and load suites.
9. Record PASS/PARTIAL/FAIL per gate in `REMEDIATION_EXECUTION_STATUS.md`.
10. Do not configure Production until Preview is green and reviewed.

## 4. Exit criteria

Preview is activated only when the environment has a distinct project ref,
parity preflight passes, frontend/functions/migrations share an exact SHA,
browser CORS requests succeed, all security/data gates pass and no active fare
is stale or falsely labelled live. Merely creating the project or receiving HTTP
200 is not activation evidence.
