/**
 * S18, C-20, A13: Durable Scheduler Occurrences & Missed-Run Detection
 * Verifies durable schedule occurrences ledger, fairness lanes, and atomic missed-run detection.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

test('S18, C-20, A13: Durable schedule occurrences and missed-run detection', async () => {
  const dbName = `farely_sched_${Date.now()}`;

  // 1. Create isolated temporary database
  execSync(`createdb -h /tmp ${dbName}`, { encoding: 'utf8', stdio: 'pipe' });

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
    execSync(`psql -h /tmp -d ${dbName} -f "${bootstrapFile}"`, { stdio: 'pipe' });

    // Replay migrations
    const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const sqlPath = join(migrationsDir, file);
      execSync(`psql -h /tmp -d ${dbName} -v ON_ERROR_STOP=1 -f "${sqlPath}"`, {
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
    execSync(`psql -h /tmp -d ${dbName}`, { input: insertSql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });

    // 3. Run detect_missed_schedule_occurrences with 15 minute grace period (900 seconds)
    const missedResult = execSync(
      `psql -h /tmp -d ${dbName} -t -A -c "SELECT public.detect_missed_schedule_occurrences(900);"`,
      { encoding: 'utf8' }
    ).trim();

    assert.equal(missedResult, '2', 'Must detect exactly 2 missed occurrences scheduled > 15m ago');

    // 4. Verify status transitions and failure classifications
    const checkStatusSql = `
      SELECT lane, status, failure_classification
      FROM public.schedule_occurrences
      ORDER BY lane;
    `;
    const rows = execSync(`psql -h /tmp -d ${dbName} -t -A -F "|" -c "${checkStatusSql}"`, { encoding: 'utf8' })
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

    // 5. Verify security privileges: anon cannot execute detect_missed_schedule_occurrences
    const permCheck = execSync(`
      psql -h /tmp -d ${dbName} -t -A -c "
        SELECT has_function_privilege('anon', 'public.detect_missed_schedule_occurrences(int)', 'EXECUTE');
      "
    `, { encoding: 'utf8' }).trim();
    assert.equal(permCheck, 'f', 'anon role must NOT have EXECUTE privilege on detect_missed_schedule_occurrences');

  } finally {
    try {
      unlinkSync(bootstrapFile);
    } catch {
      // Ignore
    }
    try {
      execSync(`dropdb -h /tmp ${dbName}`, { encoding: 'utf8', stdio: 'pipe' });
    } catch {
      // Ignore
    }
  }
});
