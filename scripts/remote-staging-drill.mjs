import { createClient } from '@supabase/supabase-js';

const url = 'https://yefbpmqfsstcaeqfrmyn.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZmJwbXFmc3N0Y2FlcWZybXluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2Mzk2MjQsImV4cCI6MjEwNjIxNTYyNH0.FxYMbfcX9Rg9Jj0L_D2VkX-Apzb6Iy5GqAeKlNpTRpc';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZmJwbXFmc3N0Y2FlcWZybXluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYzOTYyNCwiZXhwIjoyMTA2MjE1NjI0fQ.8yDZ22mZtEkY5rLBINPh80tyo1D3HHn6b6Pz59B15Yk';

async function runStagingDrill() {
  console.log('=== REMOTE STAGING RLS & INTEGRITY DRILL ===');
  const anonClient = createClient(url, anonKey);
  const serviceClient = createClient(url, serviceKey);

  // 1. Check anonymous write blocked on flights (Module 1 raw table)
  const { error: insertErr } = await anonClient.from('flights').insert({
    origin: 'Ho Chi Minh',
    origin_code: 'SGN',
    destination: 'Hanoi',
    destination_code: 'HAN',
    price: 999999,
    date: '2026-10-01',
    airline: 'Vietjet',
    airline_code: 'VJ',
    duration: '2h'
  });
  if (!insertErr) {
    throw new Error('FAIL: Anonymous insert into flights succeeded! Expected RLS block.');
  }
  console.log('✓ Anonymous insert into flights correctly blocked by RLS:', insertErr.message);

  // 2. Check anonymous read blocked on raw_flights/flights/product_events
  const { data: privData, error: privErr } = await anonClient.from('product_events').select('*');
  if (privData && privData.length > 0) {
    throw new Error('FAIL: Anonymous read from product_events succeeded! Expected empty or blocked.');
  }
  console.log('✓ Anonymous read on product_events correctly secured (returned 0 rows / error):', privErr?.message || '0 rows');

  // 3. Service role read on tracked_routes
  const { count: routeCount, error: routeErr } = await serviceClient.from('tracked_routes').select('*', { count: 'exact', head: true });
  if (routeErr) throw routeErr;
  console.log(`✓ Service role verified tracked_routes count: ${routeCount}`);

  // 4. Verify user data isolation
  const { data: anonPrefs } = await anonClient.from('user_preferences').select('*');
  if (anonPrefs && anonPrefs.length > 0) {
    throw new Error('FAIL: Anonymous client could read private user preference rows!');
  }
  console.log('✓ Anonymous client cannot read private user_preferences (returned 0 rows)');

  // 5. Check account deletion function exists and is callable via RPC
  const { data: delResult, error: delErr } = await serviceClient.rpc('prepare_account_deletion', {
    p_user_id: '00000000-0000-0000-0000-000000000000'
  });
  if (delErr) throw delErr;
  console.log('✓ RPC prepare_account_deletion verified on remote staging:', delResult);

  console.log('=== REMOTE STAGING RLS & INTEGRITY DRILL PASSED ===');
  return { ok: true, routeCount, delResult };
}

runStagingDrill().catch(err => {
  console.error('STAGING DRILL ERROR:', err);
  process.exit(1);
});
