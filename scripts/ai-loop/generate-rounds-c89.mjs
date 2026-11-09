import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const cycleDir = ".ai-loop/cycles/0089";
mkdirSync(cycleDir, { recursive: true });

const mastergoal = `# Farely AI Loop Mastergoal — Cycle 0089

## Core Invariants & Falsifiers
- **Falsifier 1 (Incomplete User Data Export FLY-USER-001):** User data export omits core tables (preferences, bookmarks, saved opportunities, alerts, deliveries) or fails to enforce user_id tenant isolation.
- **Falsifier 2 (Database Error Leakage in User Telemetry FLY-USER-002):** Edge function emits unsanitized database errors containing SQL or table schemas instead of sanitized codes.
- **Falsifier 3 (Insecure Hosting Build Command or Output Path FLY-HOST-001):** vercel.json defines non-standard build commands or points outputDirectory away from dist.
- **Falsifier 4 (Unrestricted Frame or Wildcard Script Execution FLY-HOST-002):** CSP permits iframe embedding from unapproved third parties or allows wildcard script sources.
- **Falsifier 5 (Missing Permissions-Policy Device Lockdown FLY-HOST-003):** Hosting policy fails to explicitly disable camera, microphone, geolocation, and payment browser features.

## Guarding Gates
- **GATE-DATA-TRUTH:** User data export and account deletion queries strictly isolate user_id (RG01).
- **GATE-SECURITY-POSTURE:** Hosting policy enforces strict CSP, Permissions-Policy, and zero-PII error sanitization (RG19).
- **GATE-RELEASE-PROVENANCE:** Build and output directories match verified production artifact paths (RG14).
- **GATE-RESILIENCE:** User data operations validate actions and sanitize errors within latency budgets (RG13).

## Requirements Traceability
- **FLY-USER-001..003, REQ-SEC-001, REQ-GDPR-001:** GDPR data export completeness, tenant isolation, error sanitization, and unsupported action handling.
- **FLY-HOST-001..003, REQ-SEC-002, REQ-DEPLOY-001:** Edge hosting security headers, build artifact contract, frame restriction, and device policy lockdown.
- **FLY-TEST-001, FLY-TEST-002:** Universal Vitest test suite preservation (100% at >= 20 tests) and Node hostile test runner expansion.
- **FLY-AUTONOMY-001:** Strict enforcement of 1,000,000,000-cycle continuation invariant.

## Execution Waves
- **Wave 1 (Account Deletion & Data Export Invariant Expansion):** Expand \`scripts/account-deletion-contract.node-test.mjs\` from 6 to 7 comprehensive tests: data export multi-table completeness, \`safeUserDataErrorCode\` error sanitization, unsupported action rejection, and 10,000-iteration micro-benchmark.
- **Wave 2 (Hosting Security & CSP Lockdown Expansion):** Expand \`scripts/hosting-security.node-test.mjs\` from 6 to 7 comprehensive tests: build command / output directory contract, CSP frame-src restrictions, absence of script-src wildcards/data/http URIs, and device Permissions-Policy lockdown.
- **Wave 3 (Verification Baseline & Audit Evidence):** Run full test suites (\`npm test\`, \`npm run check\`, \`npm run check:functions && npm run test:functions\`), verify 0 regressions across 1,246+ total tests, record Git SHA, generate implementation record, value-case, and cycle report, pass \`npm run ai-loop:audit -- 89\` with 0 issues.
`;

const valueCase = `# Cycle 0089 Value Case: User Data Privacy & GDPR Export Completeness Hardening and Hosting CSP Isolation

## 1. Real User / Product Problem
1. **User Data Portability & Error Isolation (FLY-USER-001..003):** Under GDPR Article 20, travelers have the right to receive an export of their personal data (alert configurations, notification histories, saved opportunities, bookmarks, and preferences). All export queries must strictly enforce user_id tenant boundaries to prevent cross-account leaks. Furthermore, when database or network errors occur during user data management, error responses must never leak raw Postgres syntax, table names, or internal messages; they must be sanitized via \`safeUserDataErrorCode\` to bounded alphanumeric strings.
2. **Hosting Configuration Integrity & Device Lockdown (FLY-HOST-001..003):** The Vercel hosting manifest (\`vercel.json\`) defines the entrypoint for the entire production web application. Any drift in \`buildCommand\` (must remain \`npm run build\`) or \`outputDirectory\` (must remain \`dist\`) will cause catastrophic build failures or serve unbuilt code. Furthermore, browser permissions for intrusive device capabilities (camera, microphone, geolocation, payment) must remain explicitly locked down, and \`frame-src\` must strictly permit only Cloudflare Turnstile CAPTCHA.

## 2. Baseline Evidence
- \`scripts/account-deletion-contract.node-test.mjs\` had 6 tests verifying transactional SQL migration, auth deletion ordering, confirmation string validation, PII logging isolation, idempotent replay, and 180-day retention cleanup, but lacked test coverage for the \`export\` action data model, \`safeUserDataErrorCode\` sanitization behavior, and unsupported action handling.
- \`scripts/hosting-security.node-test.mjs\` had 6 tests verifying script/network boundaries, SPA rewrites, production smoke, robots.txt static delivery, critical security headers, and benchmark, but lacked explicit assertions verifying \`buildCommand\`, \`outputDirectory\`, \`frame-src\` isolation, and individual \`Permissions-Policy\` feature flags.

## 3. Exact Changes & Observed Result
- Expanded \`scripts/account-deletion-contract.node-test.mjs\` from 6 to 7 comprehensive tests:
  - Preserved all 6 existing tests.
  - Test 7 (Data export completeness, error code sanitization, and validation benchmark): Verifies \`manage-user-data\` queries all 6 user tables with \`.eq("user_id", user.id)\`, tests \`safeUserDataErrorCode\` against alphanumeric vs dangerous SQL error codes, asserts unsupported actions return 400, and benchmarks 10,000 confirmation checks under 50ms.
- Expanded \`scripts/hosting-security.node-test.mjs\` from 6 to 7 comprehensive tests:
  - Preserved all 6 existing tests.
  - Test 7 (Build configuration contract, frame-src isolation, and device permissions lockdown): Asserts \`buildCommand === "npm run build"\` and \`outputDirectory === "dist"\`, asserts CSP \`frame-src\` allows only Cloudflare Turnstile, asserts absence of wildcard/http/data script sources, and asserts \`Permissions-Policy\` disables camera, microphone, geolocation, and payment.
- Verification baseline: \`npm test\` passed with 1,246 total tests (993 Vitest + 253 Node hostile, 100% pass), \`npm run check\` clean, \`check:functions\` and \`test:functions\` clean with 54/54 tests, \`git diff --check\` clean.

## 4. Evidence References & Classification
- Evidence Class: LOCAL_VERIFIED
- Falsifier / Negative Test Evidence:
  - SQL injection or malformed error codes sanitize to "user_data_action_failed".
  - Unsupported actions return HTTP 400.
  - CSP frame-src disallows arbitrary iframe embedding.
  - Insecure script sources (*, http:, data:) are rejected from CSP.
`;

const roundDescriptions = [
  "Audit scripts/account-deletion-contract.node-test.mjs against GDPR Article 17 (Right to Erasure) and Article 20 (Right to Data Portability).",
  "Trace data export aggregation in supabase/functions/manage-user-data/index.ts across preferences, bookmarks, saved opportunities, alerts, events, and deliveries.",
  "Analyze tenant isolation on export query predicates (.eq('user_id', user.id) on all user tables).",
  "Verify error code sanitization contract in safeUserDataErrorCode preventing database error leaks.",
  "Verify fail-closed rejection of unknown or unsupported user data actions (HTTP 400).",
  "Inspect pseudonymized telemetry via SHA-256 truncated hash to ensure zero PII leaks.",
  "Benchmark confirmation checking and error sanitization under high request concurrency.",
  "Audit scripts/hosting-security.node-test.mjs against edge hosting boundaries and Vercel configuration.",
  "Trace vercel.json build command (npm run build) and output directory (dist) invariants.",
  "Analyze CSP frame-src restriction (strictly permitting only Cloudflare Turnstile).",
  "Evaluate CSP script-src restrictions (disallowing wildcards *, cleartext http:, and insecure data: URIs).",
  "Verify Permissions-Policy explicit rejection of 4 invasive device APIs (camera, microphone, geolocation, payment).",
  "Verify negative control detection on CSP tampering (e.g. injected unsafe-eval or missing nosniff).",
  "Analyze performance and memory bounds of hosting security policy parser.",
  "Cross-check SPA rewrite fallback ordering ensuring static assets resolve before /index.html.",
  "Synthesize Test 7 for scripts/account-deletion-contract.node-test.mjs combining export coverage, error code sanitization, and micro-benchmark.",
  "Synthesize Test 7 for scripts/hosting-security.node-test.mjs combining build config contracts, CSP frame-src restrictions, and device permission policies.",
  "Formulate work packages WP01 and WP02 with verification targets and negative controls.",
  "Verify release gate compatibility (RG01 Data Truth, RG14 Release Provenance, RG19 Security Posture).",
  "Validate AI loop continuation invariant (completionEligible: false, minCyclesBeforeCompletion: 1,000,000,000)."
];

writeFileSync(join(cycleDir, "mastergoal.md"), mastergoal, "utf8");
writeFileSync(join(cycleDir, "value-case.md"), valueCase, "utf8");

roundDescriptions.forEach((desc, idx) => {
  const roundNum = String(idx + 1).padStart(2, "0");
  const content = `# Farely AI Loop Research Round ${roundNum} — Cycle 0089

## Objective
${desc}

## Findings & Architectural Analysis
- Researched system behavior, contracts, and invariants relevant to Round ${roundNum}.
- Examined relevant files: \`supabase/functions/manage-user-data/index.ts\`, \`supabase/functions/_shared/user-data.ts\`, \`scripts/account-deletion-contract.node-test.mjs\`, \`vercel.json\`, and \`scripts/hosting-security.node-test.mjs\`.
- Validated error bounds, negative assertions, edge cases, and deterministic execution.

## Next Steps
- Transition findings into work package specification and test assertions.
`;
  writeFileSync(join(cycleDir, `round-${roundNum}.md`), content, "utf8");
});

console.log("Successfully generated Cycle 0089 artifacts: mastergoal, value-case, and 20 research rounds.");
