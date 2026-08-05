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
| `SUPABASE_PROJECT_REF` | `thprsgnpvtzkcvknqfwk` for the current project |
| `SUPABASE_SECRET_KEY` | Server-only REST ingest key |
| `INTERNAL_FUNCTION_SECRET` | Authenticates ingest/analyze/alert functions |
| `VITE_SUPABASE_URL` | Public client URL |
| `VITE_SUPABASE_ANON_KEY` | Public browser key |
| `TRAVELPAYOUTS_TOKEN` | Optional approved provider token |
| `AFFILIATE_DEEPLINK_TEMPLATE` | Optional provider-approved HTTPS deep-link template |

Only the first six are required to deploy the source-backed runtime. The last
two are required before any row may be labelled `live_affiliate`.

## Deploy

From a trusted machine with `gh` authenticated to the repository:

```sh
gh workflow run deploy-supabase-ingest.yml --repo manhtx/Sanvemaybay --ref dev
gh run list --repo manhtx/Sanvemaybay --workflow deploy-supabase-ingest.yml --limit 1
```

The workflow applies migrations first, deploys all runtime functions, and then
performs smoke checks. It must fail if `feed-snapshot` is not readable or if
`flight-search` still returns 404.

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

Do not treat a successful GitHub run, a local build, or a non-empty table as
proof of affiliate readiness. The runtime smoke evidence is the release gate.

