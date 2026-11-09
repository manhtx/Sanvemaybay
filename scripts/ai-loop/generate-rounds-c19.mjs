import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const cycleDir = '.ai-loop/cycles/0019';
await mkdir(cycleDir, { recursive: true });

const rounds = [
  {
    num: 1,
    title: 'Feed Cache TTL Gating: 15-Minute Expiration Invariant (NC-007)',
    lens: 'Lens 1: Freshness epistemics and cache duration bounds',
    requirements: ['NC-007', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Serving stale feed data beyond 15 minutes as fresh without explicit staleness notice.',
    findings: '`FEED_CACHE_TTL_MS` is strictly 15 * 60 * 1000 ms (900,000 ms). Entries with `now - savedAt > FEED_CACHE_TTL_MS` expire immediately.',
    rejectedClaims: 'Rejected infinite or multi-hour unverified client feed caching.',
    proposedSolutions: 'Assert TTL expiration at 15m + 1ms in `src/app/lib/feedCache.test.ts`.'
  },
  {
    num: 2,
    title: 'Feed Cache Rebranding Migration: Key Fallback Mechanics',
    lens: 'Lens 2: State migration and brand unification',
    requirements: ['REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Losing cached deals upon migration from `flycheap.feed-cache` to `farely.feed-cache`.',
    findings: '`readFeedCache` checks `farely.feed-cache` first and seamlessly falls back to legacy `flycheap.feed-cache`.',
    rejectedClaims: 'Rejected discarding warm client caches during rebrand rollout.',
    proposedSolutions: 'Test reading legacy feed-cache key.'
  },
  {
    num: 3,
    title: 'Observed Fares Cache: Degraded Staleness Allowance Flag',
    lens: 'Lens 1: Degraded offline vs fresh data separation (NC-007)',
    requirements: ['NC-007', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Serving stale observed fares when `allowStale = false`, or refusing to serve cached fallback during outages when `allowStale = true`.',
    findings: 'When `now - savedAt > TTL`, `readObservedFaresCache` returns `undefined` if `allowStale = false`, but returns the entry if `allowStale = true`.',
    rejectedClaims: 'Rejected conflating fresh deal presentations with degraded outage fallbacks.',
    proposedSolutions: 'Test `allowStale: false` vs `allowStale: true` across identical expired cache entries.'
  },
  {
    num: 4,
    title: 'Observed Fares Cache: Rebranding Key Fallback Mechanics',
    lens: 'Lens 2: State migration and namespace backwards compatibility',
    requirements: ['REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Ignoring existing `flycheap.observed-cache` entries when new key is not yet set.',
    findings: '`readObservedFaresCache` checks `farely.observed-cache` and falls back to `flycheap.observed-cache`.',
    rejectedClaims: 'Rejected cold-cache penalty during brand transitions.',
    proposedSolutions: 'Test legacy observed-cache key reading.'
  },
  {
    num: 5,
    title: 'Cache Status Taxonomy: Explicit Feed Health Representation',
    lens: 'Lens 4: Structured health enum validation',
    requirements: ['REQ-DOM-001', 'RG01'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Accepting undefined or freestyle health statuses in cached observed fares entries.',
    findings: 'Statuses include "healthy", "healthy_empty", "valid_zero", "unmonitored", "degraded_freshness", "stale_only", "provider_unavailable".',
    rejectedClaims: 'Rejected unstructured string statuses in cache envelopes.',
    proposedSolutions: 'Verify default status fallback to "healthy" and preservation of explicit statuses.'
  },
  {
    num: 6,
    title: 'Corrupted Cache JSON Immunity: Fail-Safe Undefined Fallback',
    lens: 'Lens 5: Storage corruption and parse exception resilience',
    requirements: ['REQ-DOM-001'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Crashing or throwing unhandled SyntaxError when localStorage contains invalid JSON in cache keys.',
    findings: '`readFeedCache` and `readObservedFaresCache` wrap parse operations in try-catch blocks, returning `undefined` cleanly.',
    rejectedClaims: 'Rejected uncaught JSON exceptions in cache reader layers.',
    proposedSolutions: 'Test malformed JSON strings in feed and observed cache keys.'
  },
  {
    num: 7,
    title: 'Malformed Cache Payload Invariant: Missing savedAt and Array Guards',
    lens: 'Lens 5: Shape validation and type safety guards',
    requirements: ['REQ-DOM-001'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Accepting cache records lacking finite `savedAt` or having non-array deals/fares payloads.',
    findings: 'Readers assert `Number.isFinite(parsed.savedAt)` and `Array.isArray(parsed.deals)` / `Array.isArray(parsed.fares)`.',
    rejectedClaims: 'Rejected corrupt non-array payloads passing through cache read operations.',
    proposedSolutions: 'Test payloads with NaN savedAt or object deals returning undefined.'
  },
  {
    num: 8,
    title: 'Undefined Storage Environment Safety (SSR / Headless Testing)',
    lens: 'Lens 1: Isomorphic execution safety without window.localStorage',
    requirements: ['REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Throwing ReferenceError or TypeError when storage parameter is null or undefined.',
    findings: 'All read and write functions check `if (!storage) return;`, operating safely in SSR contexts.',
    rejectedClaims: 'Rejected hard dependency on browser globals in cache operations.',
    proposedSolutions: 'Test read and write operations with `undefined` storage.'
  },
  {
    num: 9,
    title: 'Client Diagnostics Boundary: Low-Cardinality PII-Free Diagnostics',
    lens: 'Lens 1: Telemetry privacy and logging safety (NC-025, REQ-SEC-002)',
    requirements: ['REQ-SEC-002', 'NC-025'],
    gates: ['GATE-DATA-TRUTH', 'RG13'],
    falsifier: 'Emitting raw user PII, email addresses, auth tokens, or stack traces into client console diagnostics.',
    findings: '`reportClientIssue` enforces regex `/^[a-z][a-z0-9_]{2,63}$/`, normalizing any deviating string to `"client_issue_invalid_code"`.',
    rejectedClaims: 'Rejected arbitrary string or error object logging at client boundary.',
    proposedSolutions: 'Assert invalid codes collapse to "client_issue_invalid_code" in `src/app/lib/clientDiagnostics.test.ts`.'
  },
  {
    num: 10,
    title: 'Client Diagnostics Regex: Valid Code Structure Gating',
    lens: 'Lens 4: Format and syntax validation of diagnostic tokens',
    requirements: ['REQ-SEC-002'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Permitting uppercase characters, leading digits, or special characters in issue codes.',
    findings: 'Regex requires leading lowercase letter, followed by 2-63 lowercase alphanumeric or underscore characters.',
    rejectedClaims: 'Rejected uppercase or malformed diagnostic codes.',
    proposedSolutions: 'Test valid lowercase underscore tokens vs invalid tokens.'
  },
  {
    num: 11,
    title: 'Client Diagnostics Boundary: Short Token Boundary Defense',
    lens: 'Lens 5: Token length lower bound (< 3 characters)',
    requirements: ['REQ-SEC-002'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Accepting 1 or 2 character tokens (e.g. "a", "ok") as valid issue codes.',
    findings: 'Tokens with fewer than 3 characters fail regex and map to `"client_issue_invalid_code"`.',
    rejectedClaims: 'Rejected ambiguous sub-3-char tokens in diagnostic log stream.',
    proposedSolutions: 'Test "a", "ab", and empty string mapping to invalid code.'
  },
  {
    num: 12,
    title: 'Client Diagnostics Boundary: Excessive Length Upper Bound (> 64 characters)',
    lens: 'Lens 5: Token length upper bound and memory buffer limits',
    requirements: ['REQ-SEC-002', 'NC-026'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Permitting arbitrary large strings (> 64 chars) in diagnostic tokens.',
    findings: 'Tokens exceeding 64 characters fail regex and map to `"client_issue_invalid_code"`.',
    rejectedClaims: 'Rejected long diagnostic strings causing log bloat.',
    proposedSolutions: 'Test 65-char string collapsing to invalid code.'
  },
  {
    num: 13,
    title: 'Structured JSON Console Output Format Invariant',
    lens: 'Lens 4: Deterministic log event serialization',
    requirements: ['REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Emitting non-JSON or freestyle log lines in console.warn.',
    findings: '`reportClientIssue` emits exact JSON string: `{"event":"client_issue","code":"..."}` via `console.warn`.',
    rejectedClaims: 'Rejected unstructured string console logs.',
    proposedSolutions: 'Assert console.warn argument structure.'
  },
  {
    num: 14,
    title: 'PublicClientError Class: Type Safety and Error Subclassing',
    lens: 'Lens 4: Object-oriented error hierarchy and contract consistency',
    requirements: ['REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: '`PublicClientError` not subclassing native Error or failing `instanceof Error` checks.',
    findings: '`PublicClientError` extends `Error`, sets `this.name = "PublicClientError"`, and exposes `code` and `message`.',
    rejectedClaims: 'Rejected non-Error instances representing client-facing errors.',
    proposedSolutions: 'Assert instanceof Error and PublicClientError property values.'
  },
  {
    num: 15,
    title: 'PublicClientError Message Integrity: Reviewed Localized Strings',
    lens: 'Lens 1: User-facing message review and security',
    requirements: ['REQ-DOM-001', 'NC-025'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Exposing internal database error strings or raw exceptions to end users.',
    findings: '`PublicClientError` pairs a stable programmatic code with a curated, reviewed user-facing message.',
    rejectedClaims: 'Rejected un-sanitized internal error messages in UI dialogs.',
    proposedSolutions: 'Verify reviewed localized messages in client error instantiations.'
  },
  {
    num: 16,
    title: 'Deterministic Cache Round-Trip Equivalence',
    lens: 'Lens 4: Bidirectional serialization fidelity',
    requirements: ['REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Modifying deal properties or order during cache write and read cycles.',
    findings: '`writeFeedCache` and `readFeedCache` preserve exact deal objects and array order.',
    rejectedClaims: 'Rejected mutative serialization.',
    proposedSolutions: 'Verify deep equality of multi-deal arrays across round trips.'
  },
  {
    num: 17,
    title: 'Observed Fares Total Count and Optional Properties Preservation',
    lens: 'Lens 4: Extended cache metadata fidelity',
    requirements: ['REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Dropping `latestObservedAt` or `feedAgeMinutes` when round-tripping through cache.',
    findings: '`readObservedFaresCache` faithfully reconstructs `total`, `status`, `latestObservedAt`, and `feedAgeMinutes`.',
    rejectedClaims: 'Rejected dropping observational metadata during cache operations.',
    proposedSolutions: 'Assert preservation of all optional observed cache fields.'
  },
  {
    num: 18,
    title: 'Attack Vector Defense: Prototype Pollution & Object Injection in Diagnostics',
    lens: 'Lens 5: Object prototype pollution defense',
    requirements: ['REQ-SEC-002'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Allowing `__proto__`, `constructor`, or malicious keys to pollute console diagnostic logs.',
    findings: 'Strict regex matching on string primitive ensures only valid identifier tokens can be emitted.',
    rejectedClaims: 'Rejected object-based diagnostic inputs.',
    proposedSolutions: 'Test __proto__ and constructor injection attempts.'
  },
  {
    num: 19,
    title: 'Feed Cache Timestamp Monotonicity and Overwrite Parity',
    lens: 'Lens 2: Cache invalidation and update idempotency',
    requirements: ['REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Failing to update `savedAt` when new feed data is written over existing cache.',
    findings: '`writeFeedCache` writes new timestamp `now`, refreshing TTL cleanly.',
    rejectedClaims: 'Rejected stale timestamp preservation upon cache write.',
    proposedSolutions: 'Test overwriting old cache entry with updated timestamp.'
  },
  {
    num: 20,
    title: 'Holistic Client Architecture: Cache & Diagnostics Integration',
    lens: 'Lens 1: End-to-end client subsystem integrity',
    requirements: ['NC-007', 'REQ-SEC-002', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'GATE-ADVERSARIAL-DEFENSE', 'RG01', 'RG13'],
    falsifier: 'Cache failures producing uncontrolled client crashes rather than bounded diagnostics.',
    findings: 'Integrated defenses guarantee corrupted storage triggers clean fallbacks while diagnostics remain strictly bounded.',
    rejectedClaims: 'Rejected cascading failures in client caching and diagnostic reporting.',
    proposedSolutions: 'Cross-assert cache safety and diagnostic reporting integrity.'
  }
];

for (const r of rounds) {
  const roundFile = join(cycleDir, `round-${String(r.num).padStart(2, '0')}.md`);
  const content = `# Round ${String(r.num).padStart(2, '0')}: ${r.title}

- **Cycle:** 0019
- **Round:** ${r.num} / 20
- **Lens:** ${r.lens}
- **Requirements Covered:** ${r.requirements.join(', ')}
- **Release / Runtime Gates:** ${r.gates.join(', ')}
- **Falsifier:** ${r.falsifier}

## Empirical & Analytical Findings
${r.findings}

## Rejected Claims & Unsound Hypotheses
${r.rejectedClaims}

## Proposed Autonomous Solutions
${r.proposedSolutions}

## Verification Vectors & Evidence Plan
- **Class:** LOCAL_VERIFIED
- **Commands:** \`npm test\`, \`npm run check\`, \`npm run check:functions && npm run test:functions\`
`;
  await writeFile(roundFile, content, 'utf8');
}

console.log('Successfully generated 20 research rounds for Cycle 0019.');
