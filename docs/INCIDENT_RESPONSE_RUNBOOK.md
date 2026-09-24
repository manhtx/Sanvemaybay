# FlyCheap AI — Incident Response Runbook

**Status:** Active operational contract; production alert wiring pending  
**Scope:** provider ingestion, observed feed, verified-live feed, redirects,
alerts, database and secret exposure.

## 1. Severity

| Severity | Trigger | Immediate behavior |
|---|---|---|
| P0 | Secret exposure; redirect leaves allowlist; indicative/stale row appears as live | Disable affected source/function; stop alerts; preserve evidence |
| P1 | Feed age >6h; launch-cohort live inventory unexpectedly zero; notification storm; provider success <90% | Mark degraded; pause dependent notifications; page owner |
| P2 | Feed age 2–6h; elevated rejection; p95/API/Web Vitals miss | Keep truthful fallback; create bounded remediation |

## 2. Evidence required for every incident

- UTC start/detection/resolution time.
- Environment, deployed Git SHA and function/worker release SHA.
- `request_id`, `worker_run_id`, provider, route and link kind.
- User-visible impact and affected row/event counts.
- Metrics before/during/after; no tokens, email, Telegram ID, raw IP or signed
  unsubscribe URLs.
- Mitigation, rollback/kill-switch action and verification command.

## 3. Stale observed feed

### Detection

- `degraded_freshness`: latest observation 121–360 minutes.
- `stale_only`: latest observation >360 minutes.
- Compare public `feed_age_minutes` with latest service-only
  `operational_scan_health.started_at`.

### Triage

1. Check GitHub workflow run and exact SHA.
2. Group latest scan runs by route/status; inspect `windows_failed` and failure
   reason class, not raw provider payload.
3. Separate provider failure, schema drift, credential/configuration error and
   database ingest failure.
4. Confirm public UI is degraded/stale and does not claim healthy freshness.

### Mitigation

- Provider-specific failure: open circuit/disable provider; retain indicative
  rows with stale warning only within approved retention.
- Worker regression: rollback workflow to known-good SHA.
- Schema drift: stop ingest, add fixture/normalizer change, deploy only after
  staging contract test.
- Never copy archive data into current feed.

### Recovery gate

- Three consecutive scheduled runs complete.
- p95 feed age <=2h and valid ratio >=98%.
- Public response, read model and scan metrics reference expected release SHA.

## 4. Verified-live truth violation

### Triggers

- `link_kind` is not `live_source/live_affiliate` in live feed.
- `valid_until` expired/missing; provider/affiliate metadata absent.
- Booking/affiliate URL is HTTP or outside approved host allowlist.

### Immediate action

1. Disable provider/refresh/notification path with its kill switch.
2. Refresh feed snapshot to remove invalid active rows.
3. Preserve raw observations and affected IDs for investigation.
4. Run `npm run audit:production-truth`; do not lower thresholds to make it pass.

### Recovery gate

- Root cause fixed and contract regression test added.
- 0 invalid/stale/indicative rows in active feed.
- Approved redirect sample passes; provider source owner signs off.

## 5. Notification storm or abuse

### Triggers

- duplicate successful delivery >0;
- delivery volume/cost anomaly;
- repeated setup attempts hit email/IP budget;
- bounce/complaint spike.

### Immediate action

1. Pause alert processor; do not delete alerts or delivery evidence.
2. Verify atomic delivery dedupe and request-budget table.
3. Disable compromised channel/provider token if exposure is suspected.
4. Keep confirmation/unsubscribe management available where safe.

### Recovery gate

- Duplicate successful delivery remains 0 in replay/sandbox.
- Rate-limit/CAPTCHA controls pass abuse test.
- Delivery success >=95% without exceeding provider budget.

## 6. Public API resource exhaustion

### Triage

- Inspect request rate, p95/p99 latency, cache hit, rows scanned/returned and DB
  CPU; correlate with release SHA and request IDs.
- Confirm public endpoint reads `observed_fare_snapshots`, not raw-score path.

### Mitigation

- Tighten bounded page/filter budgets; serve last valid cached snapshot.
- Apply gateway rate limits with `Retry-After`.
- Disable expensive filters, not truth validation.
- Scale compute only after query plan/cache issues are understood.

## 7. Database migration or RLS incident

### Immediate action

- Stop deploy pipeline; do not run broad rollback/destructive SQL blindly.
- Compare remote migration list and deployed SHA with manifest.
- For accidental exposure, revoke grants/disable Data API path first, then
  investigate policies.
- Use reviewed forward-fix unless a tested reversible migration exists.

### Recovery gate

- RLS negative tests pass for anon, user A, user B and service role.
- Supabase Security/Performance Advisors reviewed.
- Staging migration-from-production-snapshot passes.

## 8. Secret exposure

1. P0 immediately.
2. Revoke/rotate the exact provider/Supabase/email/Telegram secret.
3. Search logs, commits, artifacts and CI output without printing the secret.
4. Re-deploy consumers with new secret and verify old credential rejection.
5. Document exposure window and affected capabilities.

## 9. Post-incident

Within 24 hours for P0/P1:

- blameless timeline and root cause;
- why detection/control failed;
- permanent corrective action, owner and deadline;
- regression/acceptance test;
- update SLO/error budget and this runbook;
- explicitly record any unverified production assumption.
