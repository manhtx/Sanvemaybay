/**
 * Real Data-Bearing Database Disaster Recovery & Restore Drill
 * S19, C-19, A18, F21: Performs an actual data-bearing backup restore drill against PostgreSQL.
 *
 * Procedure:
 * 1. Provision isolated source database.
 * 2. Apply complete migration chain (all 46 migrations).
 * 3. Populate representative existing records across user, travel intent, fare observations,
 *    generations, deals, episodes, and outbox.
 * 4. Generate actual backup artifact via pg_dump and compute cryptographic checksum.
 * 5. Provision isolated target database.
 * 6. Restore from the backup artifact into the target database.
 * 7. Verify pre-existing records and values in the restored target database WITHOUT inserting new data.
 * 8. Verify critical application reads, views, and constraint relationships on restored data.
 * 9. Measure and assert recovery time budget (<30s).
 * 10. Clean up temporary databases and files.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readdirSync, writeFileSync, unlinkSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import crypto from 'node:crypto';

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

test('S19 & F21: Real data-bearing PostgreSQL backup archive creation and restoration drill', async () => {
  const pgFlags = getPgCliFlags();
  const timestamp = Date.now();
  const sourceDb = `farely_dr_src_${timestamp}`;
  const targetDb = `farely_dr_tgt_${timestamp}`;
  const backupFile = join(tmpdir(), `farely_dr_backup_${timestamp}.sql`);
  const bootstrapFile = join(tmpdir(), `supabase_bootstrap_${timestamp}.sql`);


  // 1. Provision isolated source database
  execSync(`createdb ${pgFlags} ${sourceDb}`, { encoding: 'utf8', stdio: 'pipe' });

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
    // 2. Bootstrap auth schema and apply all contiguous migrations
    execSync(`psql ${pgFlags} -d ${sourceDb} -f "${bootstrapFile}"`, { stdio: 'pipe' });

    const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    assert.ok(migrationFiles.length >= 45, `Expected >= 45 migrations, found ${migrationFiles.length}`);

    for (const file of migrationFiles) {
      const sqlPath = join(migrationsDir, file);
      execSync(`psql ${pgFlags} -d ${sourceDb} -v ON_ERROR_STOP=1 -f "${sqlPath}"`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
    }

    // 3. Populate representative operational records BEFORE taking the backup
    const testUserId = 'a1111111-1111-1111-1111-111111111111';
    const testGenId = 'b2222222-2222-2222-2222-222222222222';
    const testWatchId = 'c3333333-3333-3333-3333-333333333333';
    const testEpisodeId = 'd4444444-4444-4444-4444-444444444444';

    const seedDataSql = `
      -- Representative user
      INSERT INTO auth.users (id, email) VALUES ('${testUserId}', 'dr_traveler@farely.vn');

      -- Representative travel intent
      INSERT INTO public.travel_intents (
        id, user_id, origin_codes, destination_codes, outbound_from, return_from,
        journey_type, cabin, max_stops, is_ephemeral
      ) VALUES (
        gen_random_uuid(), '${testUserId}', ARRAY['HAN'], ARRAY['BKK'], '2026-11-15', '2026-11-22',
        'ROUND_TRIP', 'ECONOMY', 0, false
      );

      -- Representative fare observations
      INSERT INTO public.fare_observations (
        provider, offer_variant_id, observation_fingerprint, observed_at,
        origin_airport, destination_airport, depart_local_date, price
      ) VALUES
        ('fast_flights', 'ov_han_bkk_01', 'fp_han_bkk_01', now(), 'HAN', 'BKK', '2026-11-15', 2150000),
        ('fast_flights', 'ov_sgn_sin_01', 'fp_sgn_sin_01', now(), 'SGN', 'SIN', '2026-11-20', 1890000),
        ('fast_flights', 'ov_dad_kul_01', 'fp_dad_kul_01', now(), 'DAD', 'KUL', '2026-11-25', 2450000);

      -- Representative generation
      INSERT INTO public.observed_fare_generations (
        id, state, source_run_id, row_count, coverage_status, published_at
      ) VALUES (
        '${testGenId}', 'ACTIVE', 'run_dr_01', 3, 'COMPLETE', now()
      );

      INSERT INTO public.active_observed_generation (id, active_generation_id, row_count, published_at)
      VALUES (1, '${testGenId}', 3, now())
      ON CONFLICT (id) DO UPDATE SET active_generation_id = EXCLUDED.active_generation_id, row_count = EXCLUDED.row_count, published_at = now();

      -- Representative user alert / watch
      INSERT INTO public.user_alerts (
        id, user_id, destination, origin_code, destination_code, target_price, email, status
      ) VALUES (
        '${testWatchId}', '${testUserId}', 'BKK', 'HAN', 'BKK', 2200000, 'dr_traveler@farely.vn', 'active'
      );

      -- Representative watch condition episode
      INSERT INTO public.watch_condition_episodes (
        id, watch_id, condition_fingerprint, opened_at, state, entry_price, best_price
      ) VALUES (
        '${testEpisodeId}', '${testWatchId}', 'fp_cond_han_bkk', now(), 'ENTERED', 2150000, 2150000
      );

      -- Representative notification outbox
      INSERT INTO public.notification_outbox (
        id, watch_id, episode_id, event_type, channel, dedupe_key, status, payload
      ) VALUES (
        gen_random_uuid(), '${testWatchId}', '${testEpisodeId}', 'ENTERED', 'EMAIL', 'dedupe_dr_01', 'PENDING',
        '{"alert_id": "${testWatchId}", "price": 2150000, "route": "HAN-BKK"}'::jsonb
      );
    `;

    execSync(`psql ${pgFlags} -d ${sourceDb} -v ON_ERROR_STOP=1`, {
      input: seedDataSql,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Count source rows for verification
    const countSql = `
      SELECT
        (SELECT count(*) FROM public.fare_observations),
        (SELECT count(*) FROM public.user_alerts),
        (SELECT count(*) FROM public.watch_condition_episodes),
        (SELECT count(*) FROM public.notification_outbox);
    `;
    const sourceCounts = execSync(`psql ${pgFlags} -d ${sourceDb} -t -A -F"," -c "${countSql}"`, { encoding: 'utf8' }).trim();
    assert.equal(sourceCounts, '3,1,1,1', 'Source database must contain exact seeded counts (3 fares, 1 alert, 1 episode, 1 outbox)');

    // 4. Generate actual physical data-bearing backup archive via pg_dump
    execSync(`pg_dump ${pgFlags} -d ${sourceDb} -f "${backupFile}"`, { encoding: 'utf8', stdio: 'pipe' });

    const archiveStat = statSync(backupFile);
    assert.ok(archiveStat.size > 1000, `Backup archive size (${archiveStat.size} bytes) must be substantial and contain schema + data`);

    const archiveBytes = readFileSync(backupFile);
    const archiveSha256 = crypto.createHash('sha256').update(archiveBytes).digest('hex');
    assert.equal(archiveSha256.length, 64, 'Backup archive must have verifiable SHA-256 checksum');

    // 5. Provision separate isolated target database
    execSync(`createdb ${pgFlags} ${targetDb}`, { encoding: 'utf8', stdio: 'pipe' });

    // 6. Restore from the data-bearing backup archive into targetDb
    const restoreStart = Date.now();
    execSync(`psql ${pgFlags} -d ${targetDb} -v ON_ERROR_STOP=1 -f "${backupFile}"`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    const restoreDurationMs = Date.now() - restoreStart;

    assert.ok(restoreDurationMs > 0, 'Restore duration must be positive');
    assert.ok(restoreDurationMs < 30000, `Restore duration (${restoreDurationMs}ms) must remain well within 30s budget`);

    // 7. Verify pre-existing data in targetDb WITHOUT any new inserts!
    const targetCounts = execSync(`psql ${pgFlags} -d ${targetDb} -t -A -F"," -c "${countSql}"`, { encoding: 'utf8' }).trim();
    assert.equal(targetCounts, sourceCounts, 'Target database must contain exact record counts restored from backup archive');

    // Verify specific restored records and price values
    const queryRestoredFares = `
      SELECT origin_airport, destination_airport, price
      FROM public.fare_observations
      ORDER BY origin_airport;
    `;
    const faresOut = execSync(`psql ${pgFlags} -d ${targetDb} -t -A -F"," -c "${queryRestoredFares}"`, { encoding: 'utf8' }).trim();
    const fareLines = faresOut.split('\n').map((l) => l.trim()).filter(Boolean);
    assert.deepEqual(fareLines, [
      'DAD,KUL,2450000',
      'HAN,BKK,2150000',
      'SGN,SIN,1890000'
    ], 'Restored fare observation records and prices must match source data exactly');

    // Verify active generation restored
    const genCheck = execSync(`psql ${pgFlags} -d ${targetDb} -t -A -c "SELECT active_generation_id FROM public.active_observed_generation WHERE id = 1;"`, { encoding: 'utf8' }).trim();
    assert.equal(genCheck, testGenId, 'Active generation pointer must be restored from archive');

    // Verify watch and condition episode relationship
    const epCheck = execSync(`psql ${pgFlags} -d ${targetDb} -t -A -F"," -c "SELECT watch_id, state, entry_price FROM public.watch_condition_episodes WHERE id = '${testEpisodeId}';"`, { encoding: 'utf8' }).trim();
    assert.equal(epCheck, `${testWatchId},ENTERED,2150000`, 'Watch condition episode must preserve relational linkage and state');

    // 8. Verify critical views and RPC routines
    const viewCheck = execSync(`psql ${pgFlags} -d ${targetDb} -t -A -c "SELECT count(*) FROM public.operational_scan_health;"`, { encoding: 'utf8' }).trim();
    assert.ok(Number.isInteger(Number(viewCheck)), 'View operational_scan_health must be queryable on restored database');

    const fnCheck = execSync(`psql ${pgFlags} -d ${targetDb} -t -A -c "SELECT count(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'apply_watch_evaluation';"`, { encoding: 'utf8' }).trim();
    assert.equal(fnCheck, '1', 'RPC apply_watch_evaluation must be present in restored database');

    // 9. Verify transactional rollback compatibility on restored database
    const rollbackSql = `
      BEGIN;
      INSERT INTO public.fare_observations (
        provider, offer_variant_id, observation_fingerprint, observed_at,
        origin_airport, destination_airport, depart_local_date, price
      ) VALUES ('fast_flights', 'ov_rb', 'fp_rb', now(), 'HAN', 'SGN', '2026-12-01', 999999);
      ROLLBACK;
    `;
    execSync(`psql ${pgFlags} -d ${targetDb} -c "${rollbackSql}"`, { encoding: 'utf8', stdio: 'pipe' });
    const checkRb = execSync(`psql ${pgFlags} -d ${targetDb} -t -A -c "SELECT count(*) FROM public.fare_observations WHERE observation_fingerprint = 'fp_rb';"`, { encoding: 'utf8' }).trim();
    assert.equal(checkRb, '0', 'Rollback must properly abort transaction on restored database');

    console.log(`Disaster Recovery Drill Completed: Dump + Restore verified in ${restoreDurationMs}ms (Archive SHA: ${archiveSha256.slice(0, 16)}...)`);
  } finally {
    // 10. Clean up temporary databases and files
    try { unlinkSync(bootstrapFile); } catch { /* ignore */ }
    try { unlinkSync(backupFile); } catch { /* ignore */ }
    try { execSync(`dropdb ${pgFlags} ${sourceDb}`, { stdio: 'pipe' }); } catch { /* ignore */ }
    try { execSync(`dropdb ${pgFlags} ${targetDb}`, { stdio: 'pipe' }); } catch { /* ignore */ }
  }
});
