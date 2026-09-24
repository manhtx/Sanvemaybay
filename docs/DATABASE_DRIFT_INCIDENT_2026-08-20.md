# Database Migration Drift and Cross-Project Contamination Incident

**Detected:** 2026-08-20  
**Project:** Supabase `Sanvemaybay` (`thprsgnpvtzkcvknqfwk`)  
**Severity:** P0 release blocker  
**Mutation performed:** none; investigation was read-only

## Problem summary

The linked FlyCheap Supabase project does not have a migration history that can
be safely advanced by `supabase db push`. It contains remote-only Macro Platform
migrations while most historical FlyCheap migrations are local-only. The public
schema also contains both FlyCheap and Macro data models.

## Evidence

- Only FlyCheap versions `20260805000300`, `20260811000100` and
  `20260819000100` appear on both sides of the migration list.
- Most FlyCheap migrations from April/July and the seven new remediation
  migrations are absent from remote history.
- Remote-only history contains `initial_macro_platform`,
  `atomic_ingestion_rpc`, `forecasts_model_runs`, `institutional_outlooks`,
  HOSE cleanup, USDVND cleanup and global-money migrations.
- Remote table stats contain FlyCheap tables (`flights`, `deals`,
  `tracked_routes`) and Macro tables (`observations`, `raw_payloads`,
  `forecasts`, `institutional_outlooks`) in the same public schema.
- `observations` has approximately 123,867 rows and `raw_payloads` is about
  25 MB; these are material external data and must not be deleted or overwritten.

## Root cause

At least one Macro migration sequence was applied or recorded against the
FlyCheap project. Separately, much of the FlyCheap schema appears to have been
created outside the current local migration-history chain. Version presence
therefore cannot prove object equivalence.

## Impact

- `db push` may attempt old FlyCheap migrations against already-existing objects.
- `migration repair` could falsely certify schema state without comparing objects.
- FlyCheap retention or future broad migrations could affect Macro-owned data.
- Backup, rollback, RLS audit and ownership are ambiguous.
- Current Supabase project is unsuitable as a clean staging environment.

## Permanent solution

### Preferred: isolated clean staging and controlled cutover

1. Create a dedicated FlyCheap staging Supabase project.
2. Apply the local migration chain from zero and verify every migration.
3. Deploy the exact-SHA functions and run RLS/abuse/query/load/destructive tests.
4. Export only enumerated FlyCheap tables from the contaminated project using a
   no-overwrite, count-checked migration procedure.
5. Import into staging; compare row counts, checksums and sampled behavior.
6. Choose either:
   - create a new clean FlyCheap production project and cut over; or
   - reconcile the existing project object-by-object only after Macro ownership
     and backup/restore responsibilities are resolved.
7. Keep Macro data untouched until its owner confirms a separate authoritative
   home and recovery evidence.

### Not approved

- Do not run `migration repair` based only on matching version names.
- Do not fetch remote Macro migration files into the FlyCheap canonical chain.
- Do not drop Macro tables from the FlyCheap project.
- Do not run current `db push` against the contaminated project.
- Do not call the current project a staging environment.

## Preventive controls

- CI deployment must fail when remote-only migration versions exist.
- Applied local migrations must be a contiguous prefix; pending migrations must
  be a suffix.
- Store explicit project ref/environment ownership in release evidence.
- Separate Supabase projects for FlyCheap development, staging and production.
- Migration/object checksum review before any history repair.
- Quarterly schema ownership and RLS audit.
- CI must bootstrap an isolated PostgreSQL instance, replay the complete local
  chain from zero and lint the resulting public schema before merge.

## Test strategy

- Pure migration-parity contract tests for clean, pending-suffix, remote-only and
  applied-gap cases.
- Deploy preflight executes parity check before secrets, migrations or functions.
- Clean staging reset applies all migrations from zero.
- Schema diff has no unexpected objects after clean apply.
- FlyCheap-only export/import uses table allowlist, dry-run counts and checksums.
- Production cutover requires backup/restore rehearsal and browser/API acceptance.

## Current decision

**HOLD database deployment.** Repository work can continue. Creating a new
Supabase project, repairing history, copying data or changing Vercel/Supabase
production requires explicit external-change authorization.

## Clean-chain evidence

On 2026-08-20, all 38 canonical local migrations replayed successfully against
an isolated PostgreSQL 16 cluster using minimal Supabase auth/role stubs. The
result had 17 public tables, five public routines and 15 RLS-enabled tables.
This narrows the incident to remote history/object ownership rather than an
obvious local migration syntax/order failure. Supabase clean-staging replay and
API/RLS behavior remain required before activation.

## Runtime inventory addendum

- Local repository has 14 Edge Function entrypoints; remote has 12 functions.
- Missing remotely: `manage-user-data`, `refresh-observed-fares`,
  `retention-cleanup`, `track-event`.
- Remote-only: `archive-import`, `flight-scanner`.
- Required new secret names `RATE_LIMIT_SALT`, `TURNSTILE_SECRET_KEY`,
  `TURNSTILE_ALLOWED_HOSTNAMES` and `DEPLOYED_COMMIT` were not present in the
  read-only remote secret-name inventory.
