# Client Error Boundary Investigation

**Date:** 2026-08-20  
**Status:** Approved under the active master remediation plan

## Problem summary

Several browser data boundaries log raw Supabase/provider error objects. Alert
creation and management can also surface raw `error.message` or an arbitrary
server `data.error` directly to users. A few Edge Functions return database
messages verbatim.

## Root cause and evidence

Error handling evolved independently at each call site. There is no shared
client diagnostics contract and no enforced distinction between an internal
error, a public error code and user-facing copy. Evidence exists in
`src/app/data/api.ts`, `routeApi.ts`, `alertApi.ts`, `analytics.ts`, alert/detail
pages, plus database-message responses in `setup-alert`, `manage-alert` and
`ai-explainer`.

## Impact

- Browser logs may contain request objects, database details or identifiers.
- Provider wording can leak implementation details and create inconsistent UX.
- Monitoring cannot aggregate stable low-cardinality client failure codes.
- Backend refactors can unexpectedly change public copy.

## Permanent solution

1. Add one client diagnostic boundary accepting only reviewed, bounded event
   codes; never accept an error object, email, token, URL or free-form detail.
2. Add typed public client errors with stable codes and reviewed Vietnamese
   messages.
3. Replace raw browser logging and raw alert error propagation.
4. Return generic messages plus safe operational codes from server failures;
   retain structured server logs without raw payloads.
5. Add contract tests and a repository scan regression test.
6. Internal mutation/worker functions are POST-only. Reject every other method
   before authentication, body parsing or database/provider work.
7. Every function invoked by `supabase.functions.invoke` must answer OPTIONS
   and explicitly allow POST plus the Supabase authorization/client headers.

## Why preferred

The boundary fixes the data-flow cause instead of redacting individual error
shapes. It preserves actionable diagnostics through stable codes while keeping
internal details out of the browser and public API.

## Risks

- Over-generic copy can reduce user guidance; validation errors should remain
  explicit only when authored and reviewed as public contract text.
- Removing raw errors requires server-side correlation IDs to diagnose runtime
  incidents; those already exist on critical read/worker boundaries and should
  be expanded as functions are touched.

## Test strategy

- Unit-test code normalization and absence of supplied error payloads.
- Verify alert APIs expose only reviewed messages.
- Static contract-test production sources for prohibited raw logging patterns.
- Static contract-test all internal worker functions for method guard ordering
  before internal-secret authentication.
- Derive the reviewed browser-callable function set from frontend call sites
  and contract-test CORS preflight headers. In the 2026-08-20 audit,
  `feed-snapshot` and `observed-fares` handled OPTIONS but omitted the explicit
  `Access-Control-Allow-Methods: POST, OPTIONS` response header.
- Run Vitest, Deno tests/checks, lint, typecheck, build and diff checks.

## Preventive actions

Document this boundary in architecture and keep the static contract test in the
default test suite. New public service boundaries must return stable public
codes/copy and must not pass caught values to `console.*`.
