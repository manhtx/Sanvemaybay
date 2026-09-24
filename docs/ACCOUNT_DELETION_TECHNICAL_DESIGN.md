# Account Deletion — Investigation and Technical Design

**Date:** 2026-08-20  
**Status:** Approved under Wave 2 of the master remediation plan

## Problem summary

`manage-user-data` deletes application rows from four tables in parallel, then
deletes the Supabase Auth user. These operations do not share a transaction. If
an application delete or Auth Admin call fails, the user can be left in an
untracked partially-deleted state.

## Root cause and evidence

- PostgreSQL row deletes are issued as separate Data API calls.
- Auth user deletion is a separate external boundary and cannot join a database
  transaction.
- There is no deletion request/status record, retry state or reconciliation
  evidence.
- Operational error logs currently include the raw Auth user UUID.

## Impact

- A user may retain an account after associated data was removed.
- Support/operations cannot distinguish requested, partially completed and
  completed deletion.
- Blind retries are difficult to audit.
- Raw stable identifiers in logs increase privacy exposure.

## Permanent solution

1. Store one service-only deletion request per user with state and attempt count.
2. Use one `SECURITY DEFINER` PostgreSQL function to atomically:
   - record/update the request;
   - delete events, deliveries through alert cascade, alerts, bookmarks and
     preferences;
   - mark application data deleted and store bounded deletion counts.
3. Delete the Auth identity only after the database transaction commits.
4. Mark the request `completed`; if Auth deletion fails, mark
   `auth_delete_failed`. A repeated authenticated request runs the same database
   function safely and retries Auth deletion.
5. Keep the request independent of `auth.users` so completion evidence survives
   account deletion. Restrict all table/function access to `service_role`.
6. Log only a short one-way hash of user ID.
7. Purge only completed request evidence after 180 days through the internal
   retention job; retain incomplete/failure states for reconciliation.

## Why this solution

It provides the strongest atomicity available across PostgreSQL and Supabase
Auth without introducing a new queueing platform. It is idempotent, observable,
minimal, and preserves the existing public API contract (`deleted: true` only
after Auth deletion succeeds).

## Known boundary

There remains a small crash window after Auth deletion and before the completion
status update. In that case the account is already inaccessible and the request
remains `data_deleted`; operations can reconcile it. Production activation
should add an internal scheduled reconciler if this state is observed.

## Risks and controls

- **Wrong-user deletion:** endpoint derives the user from verified bearer token;
  the client cannot submit a user ID.
- **Direct RPC abuse:** revoke from public/anon/authenticated; grant service role
  only.
- **Sensitive audit data:** request stores user UUID and bounded counts only;
  no email, token or export payload.
- **Destructive testing:** use a dedicated staging account and explicit approval;
  never run destructive verification against an existing real user.

## Test strategy

- Exact confirmation contract unit test.
- Hashed log identity unit test.
- Migration/static security contract: RLS enabled, no public grants, service-role
  function only.
- Staging user A/B test for export isolation.
- Staging deletion: verify dependent rows removed, Auth login fails, request is
  completed and retry/failure states are observable.
- Inject Auth failure and verify `auth_delete_failed`, then retry successfully.
