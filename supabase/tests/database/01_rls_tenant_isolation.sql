-- pgTAP Database RLS Tenant Isolation Test Matrix (REQ-SEC-002, NC-025..NC-029)
-- Exercises User A vs User B vs Anon isolation across all private tables

BEGIN;
SELECT plan(15);

-- 1. Verify RLS is enabled on all sensitive tables
SELECT tables_are_rls_enabled(
  'public',
  ARRAY[
    'user_alerts',
    'travel_intents',
    'user_bookmarks',
    'watch_evaluations',
    'watch_condition_episodes',
    'notification_outbox',
    'notification_delivery_attempts'
  ],
  'All user-owned and internal tables must have Row Level Security enabled'
);

-- 2. Setup mock tenant identities
CREATE TEMP TABLE test_actors (
  role_name TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL
);

INSERT INTO test_actors (role_name, user_id, email) VALUES
  ('user_a', '11111111-1111-4111-a111-111111111111'::uuid, 'alice@example.com'),
  ('user_b', '22222222-2222-4222-b222-222222222222'::uuid, 'bob@example.com');

-- 3. Seed data for User B
SET LOCAL ROLE postgres;
INSERT INTO public.user_alerts (id, user_id, destination, budget)
VALUES ('bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'::uuid, '22222222-2222-4222-b222-222222222222'::uuid, 'NRT', 5000000);

INSERT INTO public.travel_intents (id, user_id, is_ephemeral, origin_codes, destination_codes)
VALUES ('33333333-3333-4333-a333-333333333333'::uuid, '22222222-2222-4222-b222-222222222222'::uuid, false, ARRAY['HAN'], ARRAY['NRT']);

-- 4. Test NC-029: Anon cannot enumerate private travel_intents
SET LOCAL ROLE anon;
SELECT is_empty(
  'SELECT id FROM public.travel_intents',
  'NC-029: Anonymous users cannot SELECT from private travel_intents'
);

-- 5. Test NC-025: User A cannot SELECT User B alerts
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-4111-a111-111111111111';
SET LOCAL "request.jwt.claim.email" = 'alice@example.com';

SELECT is_empty(
  'SELECT id FROM public.user_alerts WHERE user_id = ''22222222-2222-4222-b222-222222222222''::uuid',
  'NC-025: User A cannot SELECT alerts belonging to User B'
);

SELECT is_empty(
  'SELECT id FROM public.travel_intents WHERE user_id = ''22222222-2222-4222-b222-222222222222''::uuid',
  'NC-025: User A cannot SELECT travel intents belonging to User B'
);

-- 6. Test NC-026: User A cannot INSERT forged owner = User B
PREPARE insert_forged_alert AS
  INSERT INTO public.user_alerts (user_id, destination, budget)
  VALUES ('22222222-2222-4222-b222-222222222222'::uuid, 'SIN', 4000000);

SELECT throws_ok(
  'insert_forged_alert',
  'NC-026: User A cannot INSERT alert forged with user_id of User B'
);

PREPARE insert_forged_intent AS
  INSERT INTO public.travel_intents (user_id, origin_codes, destination_codes)
  VALUES ('22222222-2222-4222-b222-222222222222'::uuid, ARRAY['SGN'], ARRAY['SIN']);

SELECT throws_ok(
  'insert_forged_intent',
  'NC-026: User A cannot INSERT travel intent forged with user_id of User B'
);

-- 7. Test NC-027: User A cannot UPDATE User B records
UPDATE public.user_alerts
SET budget = 1000000
WHERE id = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'::uuid;

SET LOCAL ROLE postgres;
SELECT results_eq(
  'SELECT budget FROM public.user_alerts WHERE id = ''bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb''::uuid',
  ARRAY[5000000::bigint],
  'NC-027: User A update on User B alert must have zero effect (budget remains 5000000)'
);

-- 8. Test NC-028: User A cannot DELETE User B records
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-4111-a111-111111111111';

DELETE FROM public.user_alerts
WHERE id = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'::uuid;

SET LOCAL ROLE postgres;
SELECT isnt_empty(
  'SELECT id FROM public.user_alerts WHERE id = ''bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb''::uuid',
  'NC-028: User A delete on User B alert must have zero effect (row still exists)'
);

-- 9. Test Service Role Management
SET LOCAL ROLE service_role;
SELECT isnt_empty(
  'SELECT id FROM public.travel_intents',
  'Service role retains operational read access to travel_intents'
);

SELECT * FROM finish();
ROLLBACK;
