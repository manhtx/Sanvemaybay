# FlyCheap AI — Operational Runbook

**Version:** 2.0.0  
**Scope:** Core V1 Operations, Development, Testing, and Deployment

---

## 1. Quick Start & Prerequisites

### Required Runtimes
- **Node.js:** `>= v20.0.0` (Recommended: `v24.x`)
- **npm:** `>= v10.x`
- **Deno:** `>= v2.0.0` (Executable via `npx --yes deno` or standalone `deno`)
- **Python:** `>= 3.11` (For ingestion worker scripts)

### Installation
```bash
# 1. Install npm dependencies
npm install

# 2. Verify TypeScript typechecking
npm run typecheck

# 3. Verify linting
npm run lint

# 4. Install Playwright browser binaries
npx playwright install chromium
```

---

## 2. Environment Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Key environment variables:
- `VITE_SUPABASE_URL`: Supabase project URL (e.g. `https://thprsgnpvtzkcvknqfwk.supabase.co`)
- `VITE_SUPABASE_ANON_KEY`: Supabase anon/public API key
- `VITE_PUBLIC_SITE_URL`: Frontend public canonical URL (e.g. `https://farely.manhtx.com`)
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (Edge Functions & worker only)
- `INTERNAL_FUNCTION_SECRET`: Shared secret for privileged edge function calls
- `RATE_LIMIT_SALT`: Salt for hashing client IPs in rate-limit budgets
- `TURNSTILE_SECRET_KEY` & `VITE_TURNSTILE_SITE_KEY`: Cloudflare Turnstile bot verification
- `DEPLOYED_COMMIT`: Git commit SHA for release provenance

---

## 3. Local Development

```bash
# Start Vite development server
npm run dev

# Preview production build locally
npm run build && npm run preview
```

---

## 4. Test Suite Execution

```bash
# Run unit & domain tests (Vitest + Node contracts)
npm test

# Run Supabase Edge Function tests (Deno)
npm run test:functions

# Check Deno syntax & types across all Edge Functions
npm run check:functions

# Run Playwright End-to-End tests (Desktop & Mobile)
npm run test:e2e

# Run all test suites combined
npm run test:all
```

---

## 5. Database & Migrations

### Migration Directory
All SQL migrations live in `supabase/migrations/` and follow strict timestamp order (`YYYYMMDDHHMMSS_name.sql`).

### Clean Database Bootstrap
To verify migration replay locally in clean PostgreSQL:
```bash
node --test scripts/database-ci-contract.node-test.mjs
```

### Database Backup & Export
Before any major deployment or schema migration:
```bash
# Capture full database schema and data dump
npx supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql

# Dump data only for user-owned tables
npx supabase db dump --data-only -f user_data_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Database Restore & Point-in-Time Recovery (PITR)
- **Managed Supabase Recovery:** Navigate to Supabase Project Settings > Backups to restore from daily automatic snapshots or enable Point-In-Time Recovery (PITR).
- **Manual SQL Restore (Local/Staging):**
```bash
# Restore schema and data to clean target instance
psql "$STAGING_DATABASE_URL" -f backup_latest.sql
```

### Applying Migrations to Remote Supabase
```bash
# Link to Supabase project
npx supabase link --project-ref <project-id>

# Push pending migrations
npx supabase db push
```

---

## 6. Background Workers & Ingestion

### FastFlights Ingestion Worker
Runs scheduled batch scans of prioritized routes:
```bash
python3 scripts/fast-flights-worker.py
```
- Honors `SCAN_ROUTE_BATCH_COUNT` and `SCAN_CACHE_TTL_HOURS`.
- Inserts raw records into `flights` table via Supabase REST API.
- Calls `refresh-observed-fares` Edge Function to update precomputed read models.

---

## 7. Operational Diagnostics & Health Checks

### Check Provider Health
Query the `operational_scan_health` view:
```sql
SELECT * FROM operational_scan_health ORDER BY last_seen_at DESC;
```

### Inspect Stale Data
To inspect feed age:
```bash
curl -s -X POST "https://<project-ref>.supabase.co/functions/v1/feed-snapshot" \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" -d '{}' | jq '{status, generated_at, feed_age_minutes}'
```

### Debug Notifications
Check `notification_logs`:
```sql
SELECT id, alert_id, channel, status, attempt_count, error_message, created_at 
FROM notification_logs 
ORDER BY created_at DESC LIMIT 20;
```

### Trigger Data Retention Cleanup (Dry-Run & Real)
```bash
# Dry-run
curl -X POST "https://<project-ref>.supabase.co/functions/v1/retention-cleanup" \
  -H "x-internal-secret: <INTERNAL_FUNCTION_SECRET>" \
  -H "Content-Type: application/json" -d '{"dry_run": true}'

# Real purge
curl -X POST "https://<project-ref>.supabase.co/functions/v1/retention-cleanup" \
  -H "x-internal-secret: <INTERNAL_FUNCTION_SECRET>" \
  -H "Content-Type: application/json" -d '{"dry_run": false}'
```

---

## 8. Deployment & Rollback

### Frontend Deployment (Vercel)
- Configured via `vercel.json` with strict CSP, security headers, and static asset caching.
- Build command: `npm run build`
- Output directory: `dist`

### Edge Functions Deployment
Deploy reviewed functions:
```bash
npm run supabase:functions
```

### Rollback Procedure
1. **Frontend:** Instant rollback in Vercel dashboard to previous deployment SHA.
2. **Edge Functions:** Redeploy previous git commit revision via GitHub Actions or Supabase CLI.
3. **Database:** Idempotent migrations support backward-compatible read models; do not drop columns in rolling updates.
