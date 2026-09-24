# FlyCheap AI — Release Change-set Inventory

**Inventory time:** 2026-08-20  
**Branch:** `dev`  
**Base commit:** `3c54080eb4aa24872d3fa36c2c90f5e859643d81`  
**Purpose:** prepare a reviewable exact-SHA staging release without deleting,
overwriting or silently absorbing user-owned work.

## 1. Current evidence

| Item | Current value |
|---|---:|
| Changed/untracked paths | 140 |
| Tracked paths with diffs | 53 |
| Untracked paths | 87 |
| Workflow paths | 4 |
| Documentation paths | 22 |
| Script paths | 21 |
| Frontend `src` paths | 39 |
| Supabase Function paths | 32 |
| New migration paths | 9 |
| Files covered by source release manifest | 254 |
| Edge Function entrypoints in manifest | 14 |
| Migrations in complete manifest history | 38 |

The local manifest reports release SHA `unknown` by design because this is not a
CI/deployment build. Its current source-tree hash is:

`d87f763c3e12e310463086fa2bfc6bae0bf43280a3b95d1a3d89ee6bb40bc177`

This hash is diagnostic only and will change with every reviewed edit. The CI
artifact generated from the final commit is authoritative.

### Local pre-review safety scan

- No merge-conflict markers were found in changed/untracked text files.
- No changed/untracked file exceeds 1 MB.
- Secret-pattern candidates were limited to `.env.example`, workflow secret
  references and README placeholder commands. A second classification found no
  literal JWT and no private key. This is a local heuristic scan, not a
  substitute for the CI secret scanner or provider-side secret rotation.

### Branch lineage

- Remote `dev`: `3c54080eb4aa24872d3fa36c2c90f5e859643d81`.
- Remote/default `main`: `d6b81d52461a9c45a97b35531e5e72029d5e8b6f`.
- `dev` is 33 commits ahead of `main` with no reverse-only commit in the current
  local graph; it can become a reviewable PR/fast-forward candidate after this
  worktree is committed and verified.
- The current public Vercel build corresponds to the old `dev` base lineage,
  while the hardened production workflow intentionally permits Production only
  from `main`.

Therefore the safe source path is: review commits on a feature/dev branch -> PR
to `main` -> exact-SHA Preview -> approved Production. Do not deploy the dirty
`dev` worktree directly merely because the existing Vercel alias follows it.

## 2. Scope classification

All changed paths are inside the FlyCheap repository. No path can safely be
declared disposable merely from Git metadata. Preserve all paths and review by
boundary; do not run broad reset/checkout/clean commands.

### Boundary A — Data truth and provenance

- `20260811000100_fail_closed_link_kind_defaults.sql`
- `20260819000100_backfill_discovery_provenance.sql`
- live/indicative shared contracts and tests;
- normalization, ingest, analyze, feed snapshot, redirect and search functions;
- provider worker and live-provider contract documentation.

**Dependency:** must precede any UI or smoke test that interprets `live`.

### Boundary B — Observed feed, freshness and scoring

- `20260820000100_observed_fare_read_model.sql`
- `20260820000300_operational_scan_health.sql`
- observed read/refresh functions and shared tests;
- confidence-gated claims, API facade/data modules and Deals UI;
- scan-health workflow and SLO/runbook documentation.

**Dependency:** migrations -> refresh function -> observed public function -> UI.

### Boundary C — Abuse, analytics and privacy

- `20260820000200_request_rate_limits.sql`
- `20260820000400_secure_product_events.sql`
- `20260820000500_retention_cleanup.sql`
- `20260820000600_web_vitals_event.sql`
- `20260820000700_idempotent_account_deletion.sql`
- Turnstile, alert setup, analytics, RUM, retention and account-data functions;
- privacy/terms/data-rights UI and contracts.

**Dependency:** database grants/RPCs -> Edge Functions -> public UI. Do not
activate alert submission without rate-limit salt and Turnstile configuration.

### Boundary D — Frontend product and design system

- navigation, theme, cards and page changes;
- observed discount ordering/color semantics;
- accessibility, route metadata and SEO assets;
- performance splits and responsive E2E coverage;
- design-system guidelines and product documentation.

**Review note:** this is the largest visible boundary. Review screenshots and
desktop/mobile interactions separately from data/runtime approval.

### Boundary E — Release, QA and operations

- CI, Supabase deploy, hourly pipeline and production-smoke workflows;
- release source manifest and frontend `/release.json` generator;
- production truth/security/SEO/account-deletion contract scripts;
- deployment runbook, architecture, incident response and execution status.

**Dependency:** merge last, after commands and runtime names match Boundaries
A–D. The deploy workflow must run from the exact reviewed commit.

## 3. Recommended commit sequence

Do not stage by broad directory because several directories contain multiple
boundaries. Use explicit path lists after review.

1. `docs: establish audited product and runtime contracts`
2. `data: enforce provenance and live-deal truth gates`
3. `data: add observed snapshot freshness and confidence scoring`
4. `security: add abuse controls and private analytics boundary`
5. `privacy: add retention and idempotent account data rights`
6. `ui: align observed-price UX accessibility and metadata`
7. `perf: add lazy chart RUM and SEO build assets`
8. `ops: add reproducible release workflows and acceptance gates`
9. `test: consolidate desktop mobile function and production contracts`

If commits 1–9 are too coupled to build independently, use fewer commits but
preserve this review order in the PR description. Never create an intermediate
commit whose migration/function contract is misleadingly deployable.

## 4. Pre-staging gate

- [ ] User-owned/unrelated paths reviewed; none discarded.
- [ ] Final diff reviewed by boundary and secret scan pass.
- [ ] `npm run check`, function tests/checks, E2E, dependency audit and
  `git diff --check` pass from final tree.
- [ ] Release manifest reports the final Git SHA, not `unknown`.
- [ ] Canonical `PUBLIC_SITE_URL` and Vercel production origin are confirmed.
- [ ] Vercel build emits `/release.json` from that commit.
- [ ] GitHub/Supabase secrets and hostname variables are configured.
- [ ] Migration dry-run/list matches exactly the nine new migrations above.
- [ ] Dedicated staging project and destructive-test account are confirmed.
- [ ] Known-good rollback SHA and owner are recorded.

## 5. Deployment order

1. Build/test immutable final commit and upload manifest.
2. Configure runtime secrets without exposing values to logs.
3. Apply reviewed migrations in timestamp order.
4. Deploy all 14 Edge Functions from the same checkout.
5. Refresh observed read model.
6. Deploy frontend from the same commit.
7. Compare frontend `/release.json` with Edge `release_sha`.
8. Run staging RLS/abuse/query/load/data-right tests.
9. Run production read-only acceptance only after staging passes.

## 6. Current HOLD reasons

- Worktree is not yet a reviewed commit.
- Canonical public origin is `https://farely.manhtx.com`, but it is not yet
  configured as `VITE_PUBLIC_SITE_URL`/GitHub `PUBLIC_SITE_URL`.
- CLI sessions are authenticated, but required GitHub deploy secrets/variables
  are incomplete and external mutation has not been authorized.
- New migrations/functions have not been applied to staging.
- Provider truth gate still has zero qualified live offers.
- Linked Supabase history contains 12 remote-only Macro migration versions and
  28 missing historical FlyCheap versions before an applied local version.
- Remote Functions omit `manage-user-data`, `refresh-observed-fares`,
  `retention-cleanup` and `track-event`; remote-only `archive-import` and
  `flight-scanner` have no current local entrypoint.
- `farely.manhtx.com` is public, but the generic Vercel alias returned 404 and
  immutable/branch deployment URLs are protected by Vercel SSO.
- The public deployment is an old build containing the removed `tpembars.com`
  third-party script; `/release.json`, `/robots.txt` and `/sitemap.xml` currently
  rewrite to the SPA HTML instead of serving their contracts.

These reasons block activation, not further repository review. They must remain
visible and must not be bypassed by weakening truth or security contracts.
