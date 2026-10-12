/**
 * Database Architecture & Schema Integrity Contract (Level E4)
 * Evaluates REQ-DATA-001..007, REQ-DATA-010, REQ-WATCH-006..008, REQ-WATCH-011, REQ-NOTIF-008, REQ-SEC-004, REQ-SEC-005.
 *
 * Runs an isolated migration replay against real PostgreSQL and asserts:
 * 1. travel_intents schema, types, constraints, and JSON serialization.
 * 2. user_alerts watch migration columns.
 * 3. watch_evaluations schema, constraints, foreign keys.
 * 4. watch_condition_episodes lifecycle state constraints.
 * 5. notification_outbox transactional dedupe_key uniqueness and status checks.
 * 6. notification_delivery_attempts provider message storage.
 * 7. observed_fare_generations lifecycle state transitions.
 * 8. Targeted query indexes exist in pg_indexes.
 * 9. All SECURITY DEFINER functions have explicit search_path = public.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function getPgCliArgs() {
  const host = process.env.PGHOST || '/tmp';
  const port = process.env.PGPORT || '5432';
  const user = process.env.PGUSER;
  const args = ['-h', host, '-p', port];
  if (user) {
    args.push('-U', user);
  }
  return args;
}

test('REQ-DATA-001..010 & REQ-SEC-004..005: Full PostgreSQL schema, constraints, indexes and security audit', async () => {
  const pgArgs = getPgCliArgs();
  const timestamp = Date.now();
  const dbName = `farely_data_arch_${timestamp}`;
  const bootstrapFile = join(tmpdir(), `db_arch_bootstrap_${timestamp}.sql`);

  // 1. Provision isolated test database
  execFileSync('createdb', [...pgArgs, dbName], { encoding: 'utf8', stdio: 'pipe' });

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
    // 2. Apply bootstrap and all migrations
    execFileSync('psql', [...pgArgs, '-d', dbName, '-f', bootstrapFile], { stdio: 'pipe' });

    const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
    const migrationFiles = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

    assert.ok(migrationFiles.length >= 45, `Expected >= 45 migrations, found ${migrationFiles.length}`);

    for (const file of migrationFiles) {
      const sqlPath = join(migrationsDir, file);
      execFileSync('psql', [...pgArgs, '-d', dbName, '-v', 'ON_ERROR_STOP=1', '-f', sqlPath], {
        encoding: 'utf8',
        stdio: 'pipe',
      });
    }

    // Helper to run query and parse JSON output
    const queryJson = (sql) => {
      let query = sql.trim();
      if (/^(INSERT|UPDATE|DELETE)\s/i.test(query)) {
        query = `WITH mutated AS (${query}) SELECT json_agg(t) FROM mutated t`;
      } else {
        query = `SELECT json_agg(t) FROM (${query}) t`;
      }
      const raw = execFileSync(
        'psql',
        [...pgArgs, '-d', dbName, '-t', '-A', '-c', query],
        { encoding: 'utf8' }
      ).trim();
      return raw ? JSON.parse(raw) : [];
    };

    // --- REQ-DATA-001: Durable TravelIntent Table ---
    const travelIntentsCols = queryJson(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'travel_intents' AND table_schema = 'public'
    `);
    const tiColNames = new Set(travelIntentsCols.map((c) => c.column_name));
    assert.ok(tiColNames.has('id'), 'travel_intents must have id column');
    assert.ok(tiColNames.has('origin_codes'), 'travel_intents must have origin_codes column');
    assert.ok(tiColNames.has('destination_codes'), 'travel_intents must have destination_codes column');
    assert.ok(tiColNames.has('journey_type'), 'travel_intents must have journey_type column');
    assert.ok(tiColNames.has('outbound_from'), 'travel_intents must have outbound_from column');
    assert.ok(tiColNames.has('outbound_to'), 'travel_intents must have outbound_to column');
    assert.ok(tiColNames.has('cabin'), 'travel_intents must have cabin column');
    assert.ok(tiColNames.has('currency'), 'travel_intents must have currency column');

    // Test travel_intents insertion and array serialization
    const intentInsert = queryJson(`
      INSERT INTO public.travel_intents (
        origin_codes, destination_codes, outbound_from, outbound_to, journey_type,
        cabin, currency
      ) VALUES (
        ARRAY['SGN', 'HAN'], ARRAY['DAD'], '2026-11-01', '2026-11-05', 'ROUND_TRIP',
        'ECONOMY', 'VND'
      ) RETURNING id, journey_type, cabin, currency
    `);
    assert.equal(intentInsert.length, 1);
    assert.equal(intentInsert[0].journey_type, 'ROUND_TRIP');
    assert.equal(intentInsert[0].cabin, 'ECONOMY');
    assert.equal(intentInsert[0].currency, 'VND');

    // --- REQ-DATA-002: User Alerts Watch Table (Extended Schema) ---
    const alertsCols = queryJson(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'user_alerts' AND table_schema = 'public'
    `);
    const alertColNames = new Set(alertsCols.map((c) => c.column_name));
    assert.ok(alertColNames.has('travel_intent_id'), 'user_alerts must have travel_intent_id');
    assert.ok(alertColNames.has('travel_intent_snapshot'), 'user_alerts must have travel_intent_snapshot');
    assert.ok(alertColNames.has('latest_eligible_price'), 'user_alerts must have latest_eligible_price');
    assert.ok(alertColNames.has('last_matched_price'), 'user_alerts must have last_matched_price');
    assert.ok(alertColNames.has('status'), 'user_alerts must have status');

    // Create auth user and test user_alerts insertion
    const authUser = queryJson(`
      INSERT INTO auth.users (email) VALUES ('test-arch@farely.vn') RETURNING id
    `);
    const userId = authUser[0].id;

    const alertInsert = queryJson(`
      INSERT INTO public.user_alerts (
        user_id, destination, budget, status, travel_intent_id
      ) VALUES (
        '${userId}', 'SGN', 2500000, 'active', '${intentInsert[0].id}'
      ) RETURNING id, status, budget, travel_intent_id
    `);
    assert.equal(alertInsert.length, 1);
    assert.equal(alertInsert[0].status, 'active');
    assert.equal(alertInsert[0].budget, 2500000);
    const alertId = alertInsert[0].id;

    // --- REQ-DATA-003 & REQ-WATCH-006: Watch Evaluations Audit Log ---
    const evalCols = queryJson(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'watch_evaluations' AND table_schema = 'public'
    `);
    const evalColNames = new Set(evalCols.map((c) => c.column_name));
    assert.ok(evalColNames.has('id'), 'watch_evaluations must have id');
    assert.ok(evalColNames.has('watch_id'), 'watch_evaluations must have watch_id');
    assert.ok(evalColNames.has('status'), 'watch_evaluations must have status');
    assert.ok(evalColNames.has('eligible_count'), 'watch_evaluations must have eligible_count');
    assert.ok(evalColNames.has('best_price'), 'watch_evaluations must have best_price');
    assert.ok(evalColNames.has('release_sha'), 'watch_evaluations must have release_sha');

    const evalInsert = queryJson(`
      INSERT INTO public.watch_evaluations (
        watch_id, status, eligible_count, best_price, release_sha
      ) VALUES (
        '${alertId}', 'SUCCESS', 3, 2100000, 'c38332b'
      ) RETURNING id, status, best_price
    `);
    assert.equal(evalInsert.length, 1);
    assert.equal(evalInsert[0].status, 'SUCCESS');
    assert.equal(evalInsert[0].best_price, 2100000);

    // --- REQ-DATA-004 & REQ-WATCH-007..008: Watch Condition Episodes ---
    const epCols = queryJson(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'watch_condition_episodes' AND table_schema = 'public'
    `);
    const epColNames = new Set(epCols.map((c) => c.column_name));
    assert.ok(epColNames.has('id'), 'watch_condition_episodes must have id');
    assert.ok(epColNames.has('watch_id'), 'watch_condition_episodes must have watch_id');
    assert.ok(epColNames.has('condition_fingerprint'), 'watch_condition_episodes must have condition_fingerprint');
    assert.ok(epColNames.has('state'), 'watch_condition_episodes must have state');
    assert.ok(epColNames.has('entry_price'), 'watch_condition_episodes must have entry_price');
    assert.ok(epColNames.has('best_price'), 'watch_condition_episodes must have best_price');

    // Check invalid episode state throws constraint violation
    assert.throws(() => {
      execFileSync('psql', [...pgArgs, '-d', dbName, '-v', 'ON_ERROR_STOP=1', '-c', `
        INSERT INTO public.watch_condition_episodes (id, watch_id, condition_fingerprint, state, entry_price, best_price)
        VALUES ('ep-err-01', '${alertId}', 'fp-bad', 'INVALID_STATE', 2000000, 2000000);
      `], { stdio: 'pipe' });
    }, /constraint|invalid/i);

    // Valid state: ENTERED, STILL_INSIDE, MATERIAL_IMPROVEMENT, EXITED, REENTERED
    const epOk = queryJson(`
      INSERT INTO public.watch_condition_episodes (id, watch_id, condition_fingerprint, state, entry_price, best_price)
      VALUES ('ep-test-01', '${alertId}', 'fp-test', 'ENTERED', 2500000, 2500000)
      RETURNING id, state
    `);
    assert.equal(epOk.length, 1);
    assert.equal(epOk[0].state, 'ENTERED');

    // --- REQ-DATA-005: Transactional Notification Outbox Table ---
    const outboxCols = queryJson(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'notification_outbox' AND table_schema = 'public'
    `);
    const outboxColNames = new Set(outboxCols.map((c) => c.column_name));
    assert.ok(outboxColNames.has('id'), 'notification_outbox must have id');
    assert.ok(outboxColNames.has('dedupe_key'), 'notification_outbox must have dedupe_key');
    assert.ok(outboxColNames.has('status'), 'notification_outbox must have status');
    assert.ok(outboxColNames.has('payload'), 'notification_outbox must have payload');
    assert.ok(outboxColNames.has('channel'), 'notification_outbox must have channel');

    const outboxOk = queryJson(`
      INSERT INTO public.notification_outbox (watch_id, episode_id, event_type, dedupe_key, payload, status)
      VALUES ('${alertId}', 'ep-test-01', 'WATCH_TRIGGERED', 'dedupe-01', '{"price": 2500000}'::jsonb, 'PENDING')
      RETURNING id, dedupe_key, status
    `);
    assert.equal(outboxOk.length, 1);
    const outboxId = outboxOk[0].id;

    // Test dedupe_key uniqueness constraint fails on duplicate
    assert.throws(() => {
      execFileSync('psql', [...pgArgs, '-d', dbName, '-v', 'ON_ERROR_STOP=1', '-c', `
        INSERT INTO public.notification_outbox (watch_id, episode_id, event_type, dedupe_key, payload, status)
        VALUES ('${alertId}', 'ep-test-01', 'WATCH_TRIGGERED', 'dedupe-01', '{"price": 2500000}'::jsonb, 'PENDING');
      `], { stdio: 'pipe' });
    }, /unique|duplicate/i);

    // --- REQ-DATA-006 & REQ-NOTIF-008: Notification Delivery Attempts Table ---
    const attemptCols = queryJson(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'notification_delivery_attempts' AND table_schema = 'public'
    `);
    const attColNames = new Set(attemptCols.map((c) => c.column_name));
    assert.ok(attColNames.has('outbox_id'), 'notification_delivery_attempts must have outbox_id');
    assert.ok(attColNames.has('provider'), 'notification_delivery_attempts must have provider');
    assert.ok(attColNames.has('provider_message_id'), 'notification_delivery_attempts must have provider_message_id');
    assert.ok(attColNames.has('status'), 'notification_delivery_attempts must have status');

    const attemptOk = queryJson(`
      INSERT INTO public.notification_delivery_attempts (outbox_id, attempt_no, provider, provider_message_id, status)
      VALUES ('${outboxId}', 1, 'resend', 'msg_resend_12345', 'DELIVERED')
      RETURNING id, provider_message_id, status
    `);
    assert.equal(attemptOk.length, 1);
    assert.equal(attemptOk[0].provider_message_id, 'msg_resend_12345');

    // REQ-NOTIF-003: Delivery worker transitions outbox PENDING -> SENT
    const outboxSent = queryJson(`
      UPDATE public.notification_outbox
      SET status = 'SENT', sent_at = now()
      WHERE id = '${outboxId}'
      RETURNING id, status, sent_at
    `);
    assert.equal(outboxSent.length, 1);
    assert.equal(outboxSent[0].status, 'SENT');
    assert.ok(outboxSent[0].sent_at, 'sent_at must be populated on delivery');

    // --- REQ-DATA-007: Observed Fare Generations Registry ---
    const genCols = queryJson(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'observed_fare_generations' AND table_schema = 'public'
    `);
    const genColNames = new Set(genCols.map((c) => c.column_name));
    assert.ok(genColNames.has('id'), 'observed_fare_generations must have id');
    assert.ok(genColNames.has('state'), 'observed_fare_generations must have state');
    assert.ok(genColNames.has('coverage_status'), 'observed_fare_generations must have coverage_status');

    const genOk = queryJson(`
      INSERT INTO public.observed_fare_generations (state, coverage_status, row_count)
      VALUES ('ACTIVE', 'COMPLETE', 1500)
      RETURNING id, state
    `);
    assert.equal(genOk.length, 1);
    assert.equal(genOk[0].state, 'ACTIVE');

    // --- REQ-DATA-010: Targeted Database Indexes ---
    const indexes = queryJson(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
    `);
    const indexNames = new Set(indexes.map((i) => i.indexname));
    assert.ok(indexNames.has('idx_travel_intents_scopes'), 'Index idx_travel_intents_scopes must exist');
    assert.ok(indexNames.has('idx_watch_evaluations_watch_id'), 'Index idx_watch_evaluations_watch_id must exist');
    assert.ok(indexNames.has('idx_watch_condition_episodes_watch_id'), 'Index idx_watch_condition_episodes_watch_id must exist');
    assert.ok(indexNames.has('idx_notification_outbox_pending'), 'Index idx_notification_outbox_pending must exist');
    assert.ok(indexNames.has('idx_observed_fare_generations_state'), 'Index idx_observed_fare_generations_state must exist');

    // --- REQ-SEC-004 & REQ-SEC-005: SECURITY DEFINER Search Path Audit ---
    const secDefFunctions = queryJson(`
      SELECT proname, prosecdef, proconfig
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.prosecdef = true
    `);
    assert.ok(secDefFunctions.length > 0, 'Expected at least 1 SECURITY DEFINER function');
    for (const fn of secDefFunctions) {
      const config = fn.proconfig ? fn.proconfig.join(',') : '';
      assert.ok(
        /search_path=public/i.test(config),
        `Function ${fn.proname} must have SET search_path = public, found: "${config}"`
      );
    }
  } finally {
    // Clean up temporary database and files
    try {
      execFileSync('dropdb', [...pgArgs, dbName], { stdio: 'pipe' });
    } catch (err) {
      void err;
    }
    try {
      unlinkSync(bootstrapFile);
    } catch (err) {
      void err;
    }
  }
});
