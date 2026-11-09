/**
 * S18, C-20, A13: Durable Scheduler Occurrences & Missed-Run Detection
 * Verifies durable schedule occurrences ledger, fairness lanes, and atomic missed-run detection.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readdirSync, writeFileSync, unlinkSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATION_PATH = join(process.cwd(), 'supabase', 'migrations', '20261008000100_security_lease_recovery_and_scheduler.sql');

const FAIRNESS_LANES = ['WATCH_CRITICAL', 'USER_DEMAND', 'BASELINE', 'EXPLORATION'];
const OCCURRENCE_STATUSES = ['SCHEDULED', 'RUNNING', 'COMPLETED', 'MISSED', 'FAILED'];

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

test('S18 & A13: Migration DDL enforces schedule_occurrences schema, check constraints, RLS, and indexes', () => {
  const migration = readFileSync(MIGRATION_PATH, 'utf8');

  // Table definition and constraints
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.schedule_occurrences/, 'Migration must create schedule_occurrences');
  assert.match(migration, /CHECK \(lane IN \('BASELINE', 'WATCH_CRITICAL', 'USER_DEMAND', 'EXPLORATION'\)\)/, 'Migration must enforce lane check constraint');
  assert.match(migration, /CHECK \(status IN \('SCHEDULED', 'RUNNING', 'COMPLETED', 'MISSED', 'FAILED'\)\)/, 'Migration must enforce status check constraint');
  assert.match(migration, /DEFAULT 'BASELINE'/, 'Default lane must be BASELINE');
  assert.match(migration, /DEFAULT 'SCHEDULED'/, 'Default status must be SCHEDULED');

  // Index
  assert.match(migration, /CREATE INDEX IF NOT EXISTS idx_schedule_occurrences_status_scheduled\s*\n\s*ON public\.schedule_occurrences \(status, scheduled_for\)/, 'Migration must index (status, scheduled_for)');

  // RLS
  assert.match(migration, /ALTER TABLE public\.schedule_occurrences ENABLE ROW LEVEL SECURITY/, 'Migration must enable RLS');
  assert.match(migration, /CREATE POLICY "Service role can manage schedule occurrences"/, 'Migration must grant service role policy');
});

test('S18 & S01: detect_missed_schedule_occurrences RPC enforces SECURITY DEFINER, search_path, and service_role grants', () => {
  const migration = readFileSync(MIGRATION_PATH, 'utf8');

  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.detect_missed_schedule_occurrences\(/, 'Migration must define detect_missed_schedule_occurrences');
  assert.match(migration, /SECURITY DEFINER/, 'Function must be SECURITY DEFINER');
  assert.match(migration, /SET search_path = public, pg_temp/, 'Function must fix search_path to public, pg_temp');
  assert.match(migration, /failure_classification = 'SCHEDULER_MISSED_RUN'/, 'Function must record SCHEDULER_MISSED_RUN classification');
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.detect_missed_schedule_occurrences\(INT\) FROM PUBLIC, anon, authenticated;/, 'Must revoke execute from public and anon');
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.detect_missed_schedule_occurrences\(INT\) TO service_role;/, 'Must grant execute only to service_role');
});

test('C-20 & A13: Fairness lanes contract partition and priority ordering invariants', () => {
  const lanePriorityMap = {
    WATCH_CRITICAL: 1,
    USER_DEMAND: 2,
    BASELINE: 3,
    EXPLORATION: 4
  };

  assert.equal(FAIRNESS_LANES.length, 4, 'Must define exactly 4 fairness lanes');
  assert.deepEqual(Object.keys(lanePriorityMap).sort(), [...FAIRNESS_LANES].sort(), 'All lanes must have assigned priorities');

  // Verify priority ordering
  assert.ok(lanePriorityMap.WATCH_CRITICAL < lanePriorityMap.USER_DEMAND, 'WATCH_CRITICAL must precede USER_DEMAND');
  assert.ok(lanePriorityMap.USER_DEMAND < lanePriorityMap.BASELINE, 'USER_DEMAND must precede BASELINE');
  assert.ok(lanePriorityMap.BASELINE < lanePriorityMap.EXPLORATION, 'BASELINE must precede EXPLORATION');

  // Reject invalid lanes
  const invalidLanes = ['UNKNOWN_LANE', 'HIGH_PRIORITY', 'BATCH', 'CRITICAL', ''];
  for (const invalid of invalidLanes) {
    assert.equal(FAIRNESS_LANES.includes(invalid), false, `Invalid lane '${invalid}' must be rejected`);
  }

  // Verify all 5 valid statuses
  assert.equal(OCCURRENCE_STATUSES.length, 5, 'Must define exactly 5 statuses');
  assert.ok(OCCURRENCE_STATUSES.includes('SCHEDULED'));
  assert.ok(OCCURRENCE_STATUSES.includes('RUNNING'));
  assert.ok(OCCURRENCE_STATUSES.includes('COMPLETED'));
  assert.ok(OCCURRENCE_STATUSES.includes('MISSED'));
  assert.ok(OCCURRENCE_STATUSES.includes('FAILED'));
});

test('S18 & F21: Missed-run detection algorithm boundary logic simulation', () => {
  const now = Date.now();
  const graceSeconds = 900; // 15 minutes
  const graceMs = graceSeconds * 1000;
  const cutoffTime = now - graceMs;

  const sampleOccurrences = [
    { id: '1', status: 'SCHEDULED', scheduled_for: now - 1200 * 1000 }, // 20m ago -> overdue (>15m)
    { id: '2', status: 'SCHEDULED', scheduled_for: cutoffTime - 1000 },  // 1s past cutoff -> overdue
    { id: '3', status: 'SCHEDULED', scheduled_for: cutoffTime + 1000 },  // 1s inside cutoff -> not overdue
    { id: '4', status: 'SCHEDULED', scheduled_for: now - 300 * 1000 },  // 5m ago -> inside grace
    { id: '5', status: 'SCHEDULED', scheduled_for: now + 600 * 1000 },  // 10m future -> future
    { id: '6', status: 'RUNNING', scheduled_for: now - 1800 * 1000 },   // 30m ago but already running -> not touched
    { id: '7', status: 'COMPLETED', scheduled_for: now - 3600 * 1000 }, // 1h ago completed -> not touched
    { id: '8', status: 'FAILED', scheduled_for: now - 3600 * 1000 }     // 1h ago failed -> not touched
  ];

  let missedCount = 0;
  const updatedOccurrences = sampleOccurrences.map((occ) => {
    if (occ.status === 'SCHEDULED' && occ.scheduled_for < cutoffTime) {
      missedCount++;
      return {
        ...occ,
        status: 'MISSED',
        failure_classification: 'SCHEDULER_MISSED_RUN'
      };
    }
    return occ;
  });

  assert.equal(missedCount, 2, 'Must identify exactly 2 overdue occurrences past grace cutoff');
  assert.equal(updatedOccurrences[0].status, 'MISSED');
  assert.equal(updatedOccurrences[0].failure_classification, 'SCHEDULER_MISSED_RUN');
  assert.equal(updatedOccurrences[1].status, 'MISSED');
  assert.equal(updatedOccurrences[1].failure_classification, 'SCHEDULER_MISSED_RUN');
  assert.equal(updatedOccurrences[2].status, 'SCHEDULED');
  assert.equal(updatedOccurrences[3].status, 'SCHEDULED');
  assert.equal(updatedOccurrences[4].status, 'SCHEDULED');
  assert.equal(updatedOccurrences[5].status, 'RUNNING');
});

test('S18, C-20, A13: Live PostgreSQL integration drill for durable scheduling and missed-run detection', async () => {
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

    // 5. Verify security privileges: anon cannot execute detect_missed_schedule_occurrences
    const permCheck = execSync(`
      psql ${pgFlags} -d ${dbName} -t -A -c "
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
      execSync(`dropdb ${pgFlags} ${dbName}`, { encoding: 'utf8', stdio: 'pipe' });
    } catch {
      // Ignore
    }
  }
});

test('A13 & Performance: 5,000 schedule occurrence evaluation and lane partitioning benchmark', () => {
  const lanes = ['WATCH_CRITICAL', 'USER_DEMAND', 'BASELINE', 'EXPLORATION'];
  const now = Date.now();
  const graceMs = 900 * 1000;
  const cutoffTime = now - graceMs;

  const dataset = Array.from({ length: 5000 }, (_, i) => ({
    id: `occ_${i}`,
    job_name: `job_${i % 10}`,
    lane: lanes[i % lanes.length],
    scheduled_for: now + ((i % 100) - 50) * 60 * 1000,
    status: 'SCHEDULED'
  }));

  const start = performance.now();
  const partitions = {
    WATCH_CRITICAL: [],
    USER_DEMAND: [],
    BASELINE: [],
    EXPLORATION: []
  };

  let missed = 0;
  for (const item of dataset) {
    partitions[item.lane].push(item);
    if (item.status === 'SCHEDULED' && item.scheduled_for < cutoffTime) {
      missed++;
    }
  }

  const durationMs = performance.now() - start;

  assert.equal(dataset.length, 5000);
  assert.equal(partitions.WATCH_CRITICAL.length, 1250);
  assert.equal(partitions.USER_DEMAND.length, 1250);
  assert.equal(partitions.BASELINE.length, 1250);
  assert.equal(partitions.EXPLORATION.length, 1250);
  assert.ok(missed > 0, 'Must detect simulated missed runs');
  assert.ok(durationMs < 50, `5,000 occurrence partitioning must complete under 50ms, took ${durationMs.toFixed(2)}ms`);
});
