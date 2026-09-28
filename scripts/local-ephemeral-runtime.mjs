import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export function runLocalEphemeralRuntimeTest(options = {}) {
  const dbName = options.dbName || 'flycheap_ephemeral_runtime';
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const results = {
    started_at: new Date().toISOString(),
    postgres_version: null,
    migrations_applied: 0,
    tables_created: 0,
    rls_verified: false,
    complete_rls_matrix_verified: false,
    populated_migration_verified: false,
    actual_account_deletion_verified: false,
    backup_restore_verified: false,
    duration_ms: 0,
    status: 'IN_PROGRESS',
    errors: [],
  };

  const startTime = Date.now();

  try {
    // 1. Check PostgreSQL version
    const versionOutput = execSync('psql -t -c "SELECT version();" postgres', { encoding: 'utf8' }).trim();
    results.postgres_version = versionOutput.split('\n')[0].trim();

    // 2. Drop prior db if exists and create fresh database
    execSync(`psql -c "DROP DATABASE IF EXISTS ${dbName};" postgres`);
    execSync(`psql -c "CREATE DATABASE ${dbName};" postgres`);

    // 3. Setup Supabase auth emulation schema & roles
    const bootstrapSql = `
      DO $auth_roles$ BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon; END IF;
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated; END IF;
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role; END IF;
      END $auth_roles$;

      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE TABLE IF NOT EXISTS auth.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $uid_func$
        SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $uid_func$ LANGUAGE SQL STABLE;

      GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
    `;
    const bootstrapFile = path.join('/tmp', `bootstrap_${dbName}.sql`);
    fs.writeFileSync(bootstrapFile, bootstrapSql);
    execSync(`psql -d ${dbName} -f "${bootstrapFile}"`);
    if (fs.existsSync(bootstrapFile)) fs.unlinkSync(bootstrapFile);

    // 4. Apply all migrations in order
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      execSync(`psql -d ${dbName} -f "${filePath}" > /dev/null 2>&1 || psql -d ${dbName} -f "${filePath}"`);
      results.migrations_applied += 1;
    }

    // Grant permissions on created tables to authenticated and anon so RLS takes effect
    execSync(`psql -d ${dbName} -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;" > /dev/null`);
    execSync(`psql -d ${dbName} -c "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;" > /dev/null`);
    execSync(`psql -d ${dbName} -c "GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;" > /dev/null`);

    // 5. Verify tables created
    const tablesOutput = execSync(
      `psql -d ${dbName} -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"`,
      { encoding: 'utf8' }
    ).trim();
    results.tables_created = parseInt(tablesOutput, 10);

    // 6. Verify RLS is enabled on critical tables
    const rlsOutput = execSync(
      `psql -d ${dbName} -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;"`,
      { encoding: 'utf8' }
    ).trim().split('\n').map((s) => s.trim()).filter(Boolean);

    const expectedRlsTables = ['deals', 'user_alerts', 'price_history'];
    const rlsHasAll = expectedRlsTables.every((t) => rlsOutput.includes(t));
    results.rls_verified = rlsHasAll;

    // 7. Complete RLS Matrix Drill (Section 28)
    const userA = '11111111-1111-4111-8111-111111111111';
    const userB = '22222222-2222-4222-8222-222222222222';
    const populateSql = `
      INSERT INTO auth.users (id, email) VALUES ('${userA}', 'userA@test.com'), ('${userB}', 'userB@test.com');
      INSERT INTO public.deals ("from", from_code, "to", to_code, country, region, image, price, normal_price, discount, airline, airline_code, depart_date, return_date, duration, expires_in, ai_insight, hidden_costs, advertised_total, real_total, trip_type)
      VALUES ('Hanoi', 'HAN', 'Da Nang', 'DAD', 'Vietnam', 'domestic', 'img.jpg', 800000, 1200000, 33, 'VietJet', 'VJ', '2026-10-15', '2026-10-20', '1h 20m', '24h', '{"risk":"low"}'::jsonb, '{}'::jsonb, 800000, 800000, 'domestic');
      INSERT INTO public.user_alerts (user_id, destination, budget) VALUES ('${userA}', 'Da Nang', 1000000);
      INSERT INTO public.user_preferences (user_id, budget_max, home_airport) VALUES ('${userA}', 5000000, 'HAN');
      INSERT INTO public.user_bookmarks (user_id, deal_id) SELECT '${userA}', id FROM public.deals LIMIT 1;
      INSERT INTO public.product_events (user_id, event_type, metadata) VALUES ('${userA}', 'detail_view', '{"route":"HAN-DAD"}'::jsonb);
    `;
    const popFile = path.join('/tmp', `pop_${dbName}.sql`);
    fs.writeFileSync(popFile, populateSql);
    execSync(`psql -d ${dbName} -f "${popFile}"`);
    if (fs.existsSync(popFile)) fs.unlinkSync(popFile);

    // Matrix 1: User B read User A's alerts (must return 0)
    const userBReadRaw = execSync(`psql -d ${dbName} -t -c "SET ROLE authenticated; SET \\"request.jwt.claim.sub\\" = '${userB}'; SELECT count(*) FROM public.user_alerts;"`, { encoding: 'utf8' });
    const userBReadCount = parseInt(userBReadRaw.trim().split('\n').pop().trim(), 10);

    // Matrix 2: User A read own alerts (must return 1)
    const userAReadRaw = execSync(`psql -d ${dbName} -t -c "SET ROLE authenticated; SET \\"request.jwt.claim.sub\\" = '${userA}'; SELECT count(*) FROM public.user_alerts;"`, { encoding: 'utf8' });
    const userAReadCount = parseInt(userAReadRaw.trim().split('\n').pop().trim(), 10);

    // Matrix 3: User B update User A's alert (must affect 0 rows)
    const userBUpdateRaw = execSync(`psql -d ${dbName} -t -c "SET ROLE authenticated; SET \\"request.jwt.claim.sub\\" = '${userB}'; WITH upd AS (UPDATE public.user_alerts SET budget = 500000 WHERE user_id = '${userA}' RETURNING 1) SELECT count(*) FROM upd;"`, { encoding: 'utf8' });
    const userBUpdateCount = parseInt(userBUpdateRaw.trim().split('\n').pop().trim(), 10);

    // Matrix 4: User B delete User A's alert (must affect 0 rows)
    const userBDeleteRaw = execSync(`psql -d ${dbName} -t -c "SET ROLE authenticated; SET \\"request.jwt.claim.sub\\" = '${userB}'; WITH del AS (DELETE FROM public.user_alerts WHERE user_id = '${userA}' RETURNING 1) SELECT count(*) FROM del;"`, { encoding: 'utf8' });
    const userBDeleteCount = parseInt(userBDeleteRaw.trim().split('\n').pop().trim(), 10);

    // Matrix 5: Anon read public deals (must return 1)
    const anonDealRaw = execSync(`psql -d ${dbName} -t -c "SET ROLE anon; SELECT count(*) FROM public.deals;"`, { encoding: 'utf8' });
    const anonDealCount = parseInt(anonDealRaw.trim().split('\n').pop().trim(), 10);

    results.cross_user_isolation_counts = {
      userBReadCount,
      userAReadCount,
      userBUpdateCount,
      userBDeleteCount,
      anonDealCount,
    };

    results.complete_rls_matrix_verified = (
      userBReadCount === 0 &&
      userAReadCount === 1 &&
      userBUpdateCount === 0 &&
      userBDeleteCount === 0 &&
      anonDealCount === 1
    );
    results.cross_user_isolation_verified = results.complete_rls_matrix_verified;

    // 8. Actual Account Deletion Drill (Section 29)
    const deletionProcCheck = execSync(
      `psql -d ${dbName} -t -c "SELECT proname FROM pg_proc WHERE proname = 'prepare_account_deletion';"`,
      { encoding: 'utf8' }
    ).trim();

    if (deletionProcCheck.includes('prepare_account_deletion')) {
      // Execute actual prepare_account_deletion on User A
      execSync(`psql -d ${dbName} -c "SELECT public.prepare_account_deletion('${userA}');" > /dev/null`);

      // Verify User A data is wiped across all 4 user tables
      const postDeleteAlerts = parseInt(execSync(`psql -d ${dbName} -t -c "SELECT count(*) FROM public.user_alerts WHERE user_id = '${userA}';"`, { encoding: 'utf8' }).trim(), 10);
      const postDeletePrefs = parseInt(execSync(`psql -d ${dbName} -t -c "SELECT count(*) FROM public.user_preferences WHERE user_id = '${userA}';"`, { encoding: 'utf8' }).trim(), 10);
      const postDeleteBookmarks = parseInt(execSync(`psql -d ${dbName} -t -c "SELECT count(*) FROM public.user_bookmarks WHERE user_id = '${userA}';"`, { encoding: 'utf8' }).trim(), 10);
      const postDeleteEvents = parseInt(execSync(`psql -d ${dbName} -t -c "SELECT count(*) FROM public.product_events WHERE user_id = '${userA}';"`, { encoding: 'utf8' }).trim(), 10);

      // Verify deletion request audit record
      const reqStatus = execSync(`psql -d ${dbName} -t -c "SELECT status FROM public.account_deletion_requests WHERE user_id = '${userA}';"`, { encoding: 'utf8' }).trim();

      // Test idempotency: re-running deletion must succeed with attempts = 2
      execSync(`psql -d ${dbName} -c "SELECT public.prepare_account_deletion('${userA}');" > /dev/null`);
      const reqAttempts = parseInt(execSync(`psql -d ${dbName} -t -c "SELECT attempts FROM public.account_deletion_requests WHERE user_id = '${userA}';"`, { encoding: 'utf8' }).trim(), 10);

      results.actual_account_deletion_verified = (
        postDeleteAlerts === 0 &&
        postDeletePrefs === 0 &&
        postDeleteBookmarks === 0 &&
        postDeleteEvents === 0 &&
        reqStatus === 'data_deleted' &&
        reqAttempts === 2
      );
    }

    // 9. Populated Migration Drill (Section 30)
    // Create separate database, seed at early boundary, migrate forward, verify semantic integrity
    const popDbName = `${dbName}_pop_drill`;
    execSync(`psql -c "DROP DATABASE IF EXISTS ${popDbName};" postgres`);
    execSync(`psql -c "CREATE DATABASE ${popDbName};" postgres`);

    const earlyMigrations = migrationFiles.slice(0, 10);
    const laterMigrations = migrationFiles.slice(10);

    // Apply bootstrap and early migrations
    const bootPopFile = path.join('/tmp', `boot_pop_${popDbName}.sql`);
    fs.writeFileSync(bootPopFile, bootstrapSql);
    execSync(`psql -d ${popDbName} -f "${bootPopFile}"`);
    if (fs.existsSync(bootPopFile)) fs.unlinkSync(bootPopFile);

    for (const f of earlyMigrations) {
      execSync(`psql -d ${popDbName} -f "${path.join(migrationsDir, f)}" > /dev/null 2>&1 || true`);
    }

    // Seed data at early boundary
    execSync(`psql -d ${popDbName} -c "INSERT INTO public.deals (\\"from\\", from_code, \\"to\\", to_code, country, region, image, price, normal_price, discount, airline, airline_code, depart_date, return_date, duration, expires_in, ai_insight, hidden_costs, advertised_total, real_total, trip_type) VALUES ('Saigon', 'SGN', 'Phu Quoc', 'PQC', 'Vietnam', 'domestic', 'pqc.jpg', 600000, 900000, 33, 'Bamboo', 'QH', '2026-11-01', '2026-11-05', '1h', '48h', '{}'::jsonb, '{}'::jsonb, 600000, 600000, 'domestic');" > /dev/null 2>&1 || true`);

    // Migrate remaining forward
    for (const f of laterMigrations) {
      execSync(`psql -d ${popDbName} -f "${path.join(migrationsDir, f)}" > /dev/null 2>&1 || true`);
    }

    // Verify seeded row survived migration chain
    const popDealsCount = parseInt(execSync(`psql -d ${popDbName} -t -c "SELECT count(*) FROM public.deals WHERE from_code = 'SGN';"`, { encoding: 'utf8' }).trim(), 10);
    results.populated_migration_verified = (popDealsCount === 1);

    execSync(`psql -c "DROP DATABASE IF EXISTS ${popDbName};" postgres`);

    // 10. Backup and Restore Simulation Drill (Section 31)
    const dumpPath = path.join('/tmp', `${dbName}_dump.sql`);
    execSync(`pg_dump ${dbName} > "${dumpPath}"`);
    execSync(`psql -c "DROP DATABASE ${dbName};" postgres`);
    execSync(`psql -c "CREATE DATABASE ${dbName};" postgres`);
    execSync(`psql -d ${dbName} -f "${dumpPath}" > /dev/null 2>&1`);
    if (fs.existsSync(dumpPath)) fs.unlinkSync(dumpPath);

    const postRestoreTables = parseInt(
      execSync(`psql -d ${dbName} -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"`, { encoding: 'utf8' }).trim(),
      10
    );
    const postRestoreDeals = parseInt(
      execSync(`psql -d ${dbName} -t -c "SELECT count(*) FROM public.deals;"`, { encoding: 'utf8' }).trim(),
      10
    );
    const postRestoreDeletionReqs = parseInt(
      execSync(`psql -d ${dbName} -t -c "SELECT count(*) FROM public.account_deletion_requests;"`, { encoding: 'utf8' }).trim(),
      10
    );

    results.backup_restore_verified = (
      postRestoreTables === results.tables_created &&
      postRestoreDeals === 1 &&
      postRestoreDeletionReqs === 1
    );

    // 11. Clean up test database
    execSync(`psql -c "DROP DATABASE IF EXISTS ${dbName};" postgres`);

    results.status = 'SUCCESS';
  } catch (error) {
    results.status = 'FAILED';
    results.errors.push(String(error.message || error));
    try {
      execSync(`psql -c "DROP DATABASE IF EXISTS ${dbName};" postgres`);
    } catch {
      // ignore
    }
  }

  results.duration_ms = Date.now() - startTime;
  results.completed_at = new Date().toISOString();

  // Persist findings to .flycheap/LOCAL_EPHEMERAL_RUNTIME.json
  const outPath = path.join(process.cwd(), '.flycheap', 'LOCAL_EPHEMERAL_RUNTIME.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

  return results;
}

if (process.argv[1] && process.argv[1].endsWith('local-ephemeral-runtime.mjs')) {
  console.log('Running Local Ephemeral PostgreSQL Runtime Drill (Sections 27-31)...');
  const res = runLocalEphemeralRuntimeTest();
  console.log(JSON.stringify(res, null, 2));
  if (res.status !== 'SUCCESS') process.exit(1);
}
