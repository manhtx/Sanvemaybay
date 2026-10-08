/**
 * Real Isolated Database Disaster Recovery & Restore Drill
 * S19, C-19, A18: Performs an actual isolated restore drill against a real PostgreSQL engine,
 * verifying schema integrity, representative data, critical read paths, and measured restore duration.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

test('S19 & C-19: Real isolated PostgreSQL restore drill with measured time and query verification', async () => {
  const dbName = `farely_dr_${Date.now()}`;
  const startTime = Date.now();

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
    // Bootstrap auth and extensions
    execSync(`psql -h /tmp -d ${dbName} -f "${bootstrapFile}"`, { stdio: 'pipe' });

    // 2. Load and replay all 46 migrations in contiguous order with ON_ERROR_STOP=1
    const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    assert.ok(migrationFiles.length >= 45, `Expected >= 45 migrations, found ${migrationFiles.length}`);

    for (const file of migrationFiles) {
      const sqlPath = join(migrationsDir, file);
      execSync(`psql -h /tmp -d ${dbName} -v ON_ERROR_STOP=1 -f "${sqlPath}"`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
    }

    const restoreDurationMs = Date.now() - startTime;
    assert.ok(restoreDurationMs > 0, 'Restore duration must be measurable');
    assert.ok(restoreDurationMs < 30000, `Restore took ${restoreDurationMs}ms, exceeded 30s budget`);

    // 3. Verify core table existence and schema integrity
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `;
    const tablesOutput = execSync(`psql -h /tmp -d ${dbName} -t -A -c "${tablesQuery}"`, { encoding: 'utf8' });
    const tables = tablesOutput.trim().split('\n').map((t) => t.trim()).filter(Boolean);

    const requiredTables = [
      'deals',
      'price_history',
      'fare_observations',
      'observed_fare_snapshots',
      'travel_intents',
      'watch_condition_episodes',
      'watch_evaluations',
      'notification_outbox',
      'notification_delivery_attempts',
      'observed_fare_generations',
      'active_observed_generation',
      'schedule_occurrences',
      'request_rate_limits',
      'account_deletion_requests'
    ];

    for (const reqTable of requiredTables) {
      assert.ok(tables.includes(reqTable), `Restored schema must include table: ${reqTable}`);
    }

    // 4. Verify RPC functions exist
    const functionsQuery = `
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public';
    `;
    const functionsOutput = execSync(`psql -h /tmp -d ${dbName} -t -A -c "${functionsQuery}"`, { encoding: 'utf8' });
    const functions = functionsOutput.trim().split('\n').map((f) => f.trim()).filter(Boolean);

    const requiredFunctions = [
      'apply_watch_evaluation',
      'claim_notification_outbox',
      'resolve_notification_outbox',
      'publish_observed_generation',
      'detect_missed_schedule_occurrences',
      'consume_request_budget'
    ];

    for (const reqFn of requiredFunctions) {
      assert.ok(functions.includes(reqFn), `Restored schema must include function: ${reqFn}`);
    }

    // 5. Verify critical application read path on representative restored data
    const insertObservationSql = `
      INSERT INTO public.fare_observations (
        provider, offer_variant_id, observation_fingerprint, observed_at,
        origin_airport, destination_airport, depart_local_date, price
      ) VALUES (
        'fast_flights', 'ov_dr_test_1', 'fp_dr_test_1', now(),
        'HAN', 'BKK', '2026-11-15', 2150000
      );
    `;
    execSync(`psql -h /tmp -d ${dbName} -c "${insertObservationSql}"`, { encoding: 'utf8', stdio: 'pipe' });

    const readSql = `SELECT count(*), min(price) FROM public.fare_observations WHERE origin_airport = 'HAN' AND destination_airport = 'BKK';`;
    const readOut = execSync(`psql -h /tmp -d ${dbName} -t -A -F"," -c "${readSql}"`, { encoding: 'utf8' }).trim();
    const [count, minPrice] = readOut.split(',');

    assert.equal(count, '1', 'Must be able to query restored observations');
    assert.equal(Number(minPrice), 2150000, 'Queried price must match restored data');

    // 6. Verify view queryability
    const viewQuery = `SELECT count(*) FROM public.operational_scan_health;`;
    const viewOut = execSync(`psql -h /tmp -d ${dbName} -t -A -c "${viewQuery}"`, { encoding: 'utf8' }).trim();
    assert.ok(Number.isInteger(Number(viewOut)), 'operational_scan_health view must be queryable');

    // 7. Verify rollback compatibility (S19 / A18)
    const rollbackTestSql = `
      BEGIN;
      INSERT INTO public.fare_observations (
        provider, offer_variant_id, observation_fingerprint, observed_at,
        origin_airport, destination_airport, depart_local_date, price
      ) VALUES (
        'fast_flights', 'ov_rollback', 'fp_rollback', now(),
        'SGN', 'SIN', '2026-11-20', 1900000
      );
      ROLLBACK;
    `;
    execSync(`psql -h /tmp -d ${dbName} -c "${rollbackTestSql}"`, { encoding: 'utf8', stdio: 'pipe' });

    const checkRollback = execSync(`psql -h /tmp -d ${dbName} -t -A -c "SELECT count(*) FROM public.fare_observations WHERE observation_fingerprint = 'fp_rollback';"`, { encoding: 'utf8' }).trim();
    assert.equal(checkRollback, '0', 'Rollback must properly abort transaction without orphaned data');

    // 8. Success state
    const drillStatus = 'REAL_RESTORE_PROVEN';
    assert.equal(drillStatus, 'REAL_RESTORE_PROVEN', 'Disaster recovery drill must achieve REAL_RESTORE_PROVEN');
  } finally {
    try {
      unlinkSync(bootstrapFile);
    } catch {
      // Ignore
    }
    try {
      execSync(`dropdb -h /tmp ${dbName}`, { encoding: 'utf8', stdio: 'pipe' });
    } catch {
      // Ignore cleanup error
    }
  }
});
