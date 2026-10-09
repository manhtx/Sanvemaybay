/**
 * S18, C-20, A13: Durable Scheduler Occurrences & Missed-Run Detection
 * Verifies durable schedule occurrences ledger, fairness lanes, and atomic missed-run detection.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

function getPgCliFlags() {
  const host = process.env.PGHOST || '/tmp';
  const port = process.env.PGPORT || '5432';
  const user = process.env.PGUSER;
  let flags = `-h "${host}" -p ${port}`;
  if (user) {
    flags += ` -U "${user}"`;
  }
  return flags;
}

test('S18, C-20, A13: Durable schedule occurrences and missed-run detection', async () => {
  const pgFlags = getPgCliFlags();
  const dbName = `farely_sched_${Date.now()}`;

  // 1. Create isolated temporary database
  execSync(`createdb ${pgFlags} ${dbName}`, { encoding: 'utf8', stdio: 'pipe' });

  const bootstrapFile = `/tmp/supabase_bootstrap_${Date.now()}.sql`;
  writeFileSync(bootstrapFile, `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT);
    DO $$ BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon; END IF;
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated; END IF;
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role; END IF;
    END $$;
    CREATE OR REPLACE FUNCTION auth.jwt() RETURNS JSONB LANGUAGE sql AS $$ SELECT '{"role":"service_role"}'::jsonb $$;
    CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT LANGUAGE sql AS $$ SELECT 'service_role' $$;
    CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql AS $$ SELECT '00000000-0000-0000-0000-000000000000'::uuid $$;
  `);

  try {
    execSync(`psql ${pgFlags} -d ${dbName} -f "${bootstrapFile}"`, { stdio: 'pipe' });

    // Replay migrations
    const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const sqlPath = join(migrationsDir, file);
      execSync(`psql ${pgFlags} -d ${dbName} -v ON_ERROR_STOP=1 -f "${sqlPath}"`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
    }

    // 2. Test inserting occurrences into distinct fairness lanes
    const insertSql = `
      INSERT INTO public.schedule_occurrences (job_name, lane, scheduled_for, expected_routes)
      VALUES
        ('hourly_crawl', 'BASELINE', now() - interval '25 minutes', '["SGN-HAN", "HAN-DAD"]'::jsonb),
        ('watch_eval', 'WATCH_CRITICAL', now() - interval '20 minutes', '["SGN-PQC"]'::jsonb),
        ('user_search', 'USER_DEMAND', now() + interval '10 minutes', '["HAN-BKK"]'::jsonb),
        ('discovery', 'EXPLORATION', now() + interval '30 minutes', '["DAD-CXR"]'::jsonb);
    `;
    execSync(`psql ${pgFlags} -d ${dbName}`, { input: insertSql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });

    // 3. Run detect_missed_schedule_occurrences with 15 minute grace period (900 seconds)
    const missedResult = execSync(
      `psql ${pgFlags} -d ${dbName} -t -A -c "SELECT public.detect_missed_schedule_occurrences(900);"`,
      { encoding: 'utf8' }
    ).trim();

    assert.equal(missedResult, '2', 'Must detect exactly 2 missed occurrences scheduled > 15m ago');

    // 4. Verify status transitions and failure classifications
    const checkStatusSql = `
      SELECT lane, status, failure_classification
      FROM public.schedule_occurrences
      ORDER BY lane;
    `;
    const rows = execSync(`psql ${pgFlags} -d ${dbName} -t -A -F "|" -c "${checkStatusSql}"`, { encoding: 'utf8' })
      .trim()
      .split('\n')
      .map((line) => line.split('|'));

    const byLane = Object.fromEntries(rows.map(([lane, status, failure]) => [lane, { status, failure }]));

    assert.equal(byLane['BASELINE'].status, 'MISSED', 'Baseline overdue occurrence must be marked MISSED');
    assert.equal(byLane['BASELINE'].failure, 'SCHEDULER_MISSED_RUN', 'Must record SCHEDULER_MISSED_RUN classification');

    assert.equal(byLane['WATCH_CRITICAL'].status, 'MISSED', 'Watch critical overdue occurrence must be marked MISSED');
    assert.equal(byLane['WATCH_CRITICAL'].failure, 'SCHEDULER_MISSED_RUN', 'Must record SCHEDULER_MISSED_RUN classification');

    assert.equal(byLane['USER_DEMAND'].status, 'SCHEDULED', 'Future user demand occurrence must remain SCHEDULED');
    assert.equal(byLane['EXPLORATION'].status, 'SCHEDULED', 'Future exploration occurrence must remain SCHEDULED');

    // 5. End-to-end Producer -> Claim -> Heartbeat -> Completion loop (D23)
    const seedActiveSql = `
      INSERT INTO public.schedule_occurrences (id, job_name, lane, scheduled_for, expected_routes)
      VALUES
        ('11111111-1111-1111-1111-111111111111', 'crawl_baseline', 'BASELINE', now() - interval '2 minutes', '["SGN-HAN"]'::jsonb),
        ('22222222-2222-2222-2222-222222222222', 'watch_urgent', 'WATCH_CRITICAL', now() - interval '1 minute', '["HAN-DAD"]'::jsonb),
        ('33333333-3333-3333-3333-333333333333', 'worker_dead', 'BASELINE', now() - interval '5 minutes', '["DAD-CXR"]'::jsonb);
    `;
    execSync(`psql ${pgFlags} -d ${dbName}`, { input: seedActiveSql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });

    // Claim 1: Must prioritize WATCH_CRITICAL over earlier BASELINE
    const claim1Raw = execSync(
      `psql ${pgFlags} -d ${dbName} -t -A -c "SELECT public.claim_schedule_occurrence('worker_alpha', 120);"`,
      { encoding: 'utf8' }
    ).trim();
    const claim1 = JSON.parse(claim1Raw);
    assert.equal(claim1.id, '22222222-2222-2222-2222-222222222222', 'Must claim WATCH_CRITICAL before BASELINE');
    assert.equal(claim1.claimed_by, 'worker_alpha');

    // Heartbeat: worker_alpha extends lease
    const hbResult = execSync(
      `psql ${pgFlags} -d ${dbName} -t -A -c "SELECT public.heartbeat_schedule_occurrence('${claim1.id}'::uuid, 'worker_alpha', 300);"`,
      { encoding: 'utf8' }
    ).trim();
    assert.equal(hbResult, 't', 'Active worker heartbeat must succeed');

    // Complete: worker_alpha completes successfully
    const compSql = `SELECT public.complete_schedule_occurrence('${claim1.id}'::uuid, 'worker_alpha', 'COMPLETED', '{"processed_routes": 1}'::jsonb, '{"coverage": "FULL"}'::jsonb);`;
    const compResult = execSync(`psql ${pgFlags} -d ${dbName} -t -A`, { input: compSql, encoding: 'utf8' }).trim();
    assert.equal(compResult, 't', 'Worker completion must succeed');



    // 6. Watchdog worker heartbeat timeout detection (D23, A13)
    // Worker claims task 3333... but lease expires
    const expireClaimSql = `
      UPDATE public.schedule_occurrences
      SET status = 'RUNNING',
          claimed_by = 'crashed_worker',
          started_at = now() - interval '10 minutes',
          heartbeat_at = now() - interval '10 minutes',
          lease_until = now() - interval '5 minutes'
      WHERE id = '33333333-3333-3333-3333-333333333333';
    `;
    execSync(`psql ${pgFlags} -d ${dbName}`, { input: expireClaimSql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });

    // Run watchdog: detect_missed_schedule_occurrences
    const watchdogCount = execSync(
      `psql ${pgFlags} -d ${dbName} -t -A -c "SELECT public.detect_missed_schedule_occurrences(900);"`,
      { encoding: 'utf8' }
    ).trim();
    assert.ok(Number(watchdogCount) >= 1, 'Watchdog must detect expired worker lease');

    const deadStatus = execSync(
      `psql ${pgFlags} -d ${dbName} -t -A -c "SELECT status || '|' || failure_classification FROM public.schedule_occurrences WHERE id = '33333333-3333-3333-3333-333333333333';"`,
      { encoding: 'utf8' }
    ).trim();
    assert.equal(deadStatus, 'RETRYABLE_FAILED|WORKER_HEARTBEAT_TIMEOUT', 'Crashed worker occurrence must transition to RETRYABLE_FAILED with WORKER_HEARTBEAT_TIMEOUT');

    // Stale worker completion rejection: crashed_worker cannot complete after timeout
    const staleComp = execSync(
      `psql ${pgFlags} -d ${dbName} -t -A -c "SELECT public.complete_schedule_occurrence('33333333-3333-3333-3333-333333333333'::uuid, 'crashed_worker', 'COMPLETED');"`,
      { encoding: 'utf8' }
    ).trim();
    assert.equal(staleComp, 'f', 'Stale worker must be rejected from completing expired occurrence');

    // 7. Verify security privileges: anon cannot execute privileged scheduler RPCs
    const funcs = [
      'public.detect_missed_schedule_occurrences(int)',
      'public.claim_schedule_occurrence(text,int)',
      'public.heartbeat_schedule_occurrence(uuid,text,int)',
      'public.complete_schedule_occurrence(uuid,text,text,jsonb,jsonb,text)'
    ];
    for (const fn of funcs) {
      const permCheck = execSync(`
        psql ${pgFlags} -d ${dbName} -t -A -c "
          SELECT has_function_privilege('anon', '${fn}', 'EXECUTE');
        "
      `, { encoding: 'utf8' }).trim();
      assert.equal(permCheck, 'f', `anon role must NOT have EXECUTE privilege on ${fn}`);
    }


  } finally {
    try {
      unlinkSync(bootstrapFile);
    } catch {
      // Ignore
    }
    try {
      execSync(`dropdb ${pgFlags} ${dbName}`, { encoding: 'utf8', stdio: 'pipe' });
    } catch {
      // Ignore
    }
  }
});
