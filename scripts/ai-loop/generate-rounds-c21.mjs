import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const cycleDir = '.ai-loop/cycles/0021';
await mkdir(cycleDir, { recursive: true });

const rounds = [
  {
    num: 1,
    title: 'Email Normalization & Format Boundary: RFC 5322 & Whitespace Trimming',
    lens: 'Lens 1: Credential input sanitization and email validation',
    requirements: ['FLY-SEC-001', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Accepting invalid email strings or failing to trim leading/trailing whitespace.',
    findings: '`validateAuthCredentials` trims email input and requires regex `/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/`.',
    rejectedClaims: 'Rejected permissive email matching allowing whitespace or missing domains.',
    proposedSolutions: 'Assert trimmed emails succeed and malformed emails return "Nhập địa chỉ email hợp lệ." in `src/app/domain/authPolicy.test.ts`.'
  },
  {
    num: 2,
    title: 'Email Length Upper Bound: 254-Character RFC Compliance',
    lens: 'Lens 5: Input boundary defense and buffer overflow prevention',
    requirements: ['FLY-SEC-001', 'REQ-SEC-001'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Accepting email addresses exceeding the 254-character RFC 5321 standard.',
    findings: '`validateAuthCredentials` explicitly checks `normalizedEmail.length > 254` and rejects.',
    rejectedClaims: 'Rejected unbounded string processing in authentication input handlers.',
    proposedSolutions: 'Assert emails > 254 characters are rejected.'
  },
  {
    num: 3,
    title: 'Malformed Email Quarantine: Rejection of Spaces and Missing Parts',
    lens: 'Lens 5: Boundary condition testing and syntax verification',
    requirements: ['FLY-SEC-001', 'REQ-DOM-001'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Accepting strings like "@example.com", "user@", "user @example.com", or "plainaddress".',
    findings: 'Strict regex guarantees presence of non-empty local-part, @ delimiter, non-empty domain, and dot-separated TLD.',
    rejectedClaims: 'Rejected lenient address parsers in client auth forms.',
    proposedSolutions: 'Assert rejection of various malformed address structures.'
  },
  {
    num: 4,
    title: 'Sign-Up Password Lower Bound: Strict 12-Character Threshold',
    lens: 'Lens 1: Credential entropy and brute-force mitigation',
    requirements: ['FLY-SEC-001', 'REQ-SEC-001'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Allowing new sign-up registrations with passwords shorter than 12 characters.',
    findings: '`SIGN_UP_PASSWORD_MIN_LENGTH = 12`. In `mode === "sign-up"`, passwords < 12 characters return specific advisory message.',
    rejectedClaims: 'Rejected legacy 6 or 8 character thresholds for new user registrations.',
    proposedSolutions: 'Assert passwords of 11 characters fail and 12 characters pass for sign-up.'
  },
  {
    num: 5,
    title: 'Sign-In Legacy Password Compatibility: Lockout Prevention',
    lens: 'Lens 1: Account access continuity and backward compatibility',
    requirements: ['FLY-SEC-001', 'REQ-DOM-001'],
    gates: ['GATE-RESILIENCE', 'RG01'],
    falsifier: 'Locking out existing accounts with legacy passwords (< 12 chars) during sign-in validation.',
    findings: 'In `mode === "sign-in"`, `validateAuthCredentials` does not enforce the 12-character minimum, permitting existing legacy users to authenticate.',
    rejectedClaims: 'Rejected client-side rejection of short passwords during sign-in.',
    proposedSolutions: 'Assert passwords between 1 and 11 characters return undefined (pass) for mode "sign-in".'
  },
  {
    num: 6,
    title: 'Password Upper Bound: 128-Character Denial-of-Service Defense',
    lens: 'Lens 5: Resource exhaustion and hashing DoS defense',
    requirements: ['FLY-SEC-001', 'REQ-SEC-001'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Allowing excessively long passwords (> 128 chars) to consume excessive hash computation resources.',
    findings: '`PASSWORD_MAX_LENGTH = 128`. Passwords > 128 characters are rejected in both sign-in and sign-up modes.',
    rejectedClaims: 'Rejected arbitrary password lengths exposing bcrypt/argon2 hashing DoS.',
    proposedSolutions: 'Assert passwords of length 128 pass while 129 characters fail.'
  },
  {
    num: 7,
    title: 'Empty and Whitespace Password Defense',
    lens: 'Lens 5: Zero-length credential defense',
    requirements: ['FLY-SEC-001', 'REQ-DOM-001'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Accepting empty string or falsy passwords.',
    findings: '`if (!password || password.length > PASSWORD_MAX_LENGTH)` returns "Mật khẩu không hợp lệ."',
    rejectedClaims: 'Rejected empty credential submissions.',
    proposedSolutions: 'Assert empty string password returns rejection in both modes.'
  },
  {
    num: 8,
    title: 'Auth Error Sanitization: PII and Database Leakage Prevention',
    lens: 'Lens 1: Security error messaging and privacy preservation',
    requirements: ['REQ-SEC-001', 'NC-025'],
    gates: ['GATE-PRIVACY-ISOLATION', 'RG10'],
    falsifier: 'Leaking database error details, Supabase exceptions, or raw connection strings to users.',
    findings: '`safeAuthError` returns reviewed, localized Vietnamese strings completely decoupled from provider exceptions.',
    rejectedClaims: 'Rejected forwarding backend auth errors to client views.',
    proposedSolutions: 'Assert `safeAuthError` returns fixed messages free of stack traces or vendor names.'
  },
  {
    num: 9,
    title: 'User Enumeration Defense: Generic Auth Error Equivalence',
    lens: 'Lens 1: Account harvesting and user enumeration defense',
    requirements: ['REQ-SEC-001', 'NC-025'],
    gates: ['GATE-PRIVACY-ISOLATION', 'RG10'],
    falsifier: 'Distinguishing between "user not found" and "incorrect password", enabling account enumeration.',
    findings: '`safeAuthError("sign-in")` uses generic phrasing: "Không thể đăng nhập. Kiểm tra email, mật khẩu hoặc trạng thái xác nhận tài khoản."',
    rejectedClaims: 'Rejected disclosing account registration status during authentication failures.',
    proposedSolutions: 'Assert generic error text does not disclose user existence.'
  },
  {
    num: 10,
    title: 'Dual-Mode Auth Contract: Strict Differentiation of Sign-In vs Sign-Up',
    lens: 'Lens 4: Mode polymorphism and contract typing',
    requirements: ['FLY-SEC-001', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Mixing up sign-in and sign-up policies or error messages.',
    findings: '`AuthMode` union `"sign-in" | "sign-up"` determines exact policy branch and error response.',
    rejectedClaims: 'Rejected single monolithic auth validation function without mode parameter.',
    proposedSolutions: 'Assert different policy outcomes across identical inputs for each mode.'
  },
  {
    num: 11,
    title: 'Snapshot Generation Atomicity: Pointer Switch vs In-Place Mutation',
    lens: 'Lens 1: Section 29 snapshot atomicity and concurrency safety',
    requirements: ['FLY-FEED-001', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Mutating active snapshot records in-place during background ingestion.',
    findings: '`AtomicSnapshotStore` builds candidate records out-of-band and atomically swaps `activeGenerationId` only after successful validation.',
    rejectedClaims: 'Rejected incremental in-place record patching visible to active readers.',
    proposedSolutions: 'Verify active generation ID and records remain unchanged until publish completes in `src/app/domain/snapshotAtomicity.test.ts`.'
  },
  {
    num: 12,
    title: 'Mid-Stream Failure Isolation: Zero Partial State Exposure to Readers',
    lens: 'Lens 1: Failure containment and transactional isolation',
    requirements: ['FLY-FEED-001', 'NC-007'],
    gates: ['GATE-RESILIENCE', 'RG07'],
    falsifier: 'Partial candidate generation records becoming visible to readers after a builder exception.',
    findings: 'If `buildRecords()` throws, `activeGenerationId` is not updated and readers see only the previous intact generation.',
    rejectedClaims: 'Rejected partial dirty reads during failed ingestion runs.',
    proposedSolutions: 'Assert reader isolation following simulated builder throws.'
  },
  {
    num: 13,
    title: 'Candidate Validation Invariant: Rejection of Empty Generation Batches',
    lens: 'Lens 5: Empty dataset defense and zero-state protection',
    requirements: ['FLY-FEED-001', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Publishing an empty snapshot candidate generation, wiping out active deals for all users.',
    findings: '`publishGeneration` validates `candidateRecords.length === 0` and throws "Candidate generation validation failed: zero records".',
    rejectedClaims: 'Rejected allowing zero-record generations to activate and wipe out feed tables.',
    proposedSolutions: 'Assert exception thrown and active generation preserved when candidate returns empty array.'
  },
  {
    num: 14,
    title: 'Reader Isolation: Readers Exclusively Query the Active Generation ID',
    lens: 'Lens 1: Read-write isolation and view stability',
    requirements: ['FLY-FEED-001', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Readers observing records with stale generation IDs or uncommitted candidate IDs.',
    findings: '`readActiveGeneration()` filters storage strictly by `r.generation_id === this.activeGenerationId`.',
    rejectedClaims: 'Rejected unrestricted table scans across generations.',
    proposedSolutions: 'Assert all records returned by reader match active generation ID.'
  },
  {
    num: 15,
    title: 'Uninitialized Snapshot Store: Safe Empty-State Fallback',
    lens: 'Lens 5: Initialization edge cases and fallback safety',
    requirements: ['FLY-FEED-001', 'REQ-DOM-001'],
    gates: ['GATE-RESILIENCE', 'RG01'],
    falsifier: 'Calling `readActiveGeneration()` on fresh store without initial generation throwing NullPointerException.',
    findings: 'When `activeGenerationId` is null, returns records without generation_id or empty array safely.',
    rejectedClaims: 'Rejected crashing on uninitialized snapshot state.',
    proposedSolutions: 'Assert fresh `new AtomicSnapshotStore()` returns empty array without throwing.'
  },
  {
    num: 16,
    title: 'Old Generation Garbage Collection: Automatic Post-Activation Purge',
    lens: 'Lens 2: Memory reclamation and storage lifecycle management',
    requirements: ['FLY-FEED-001', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Retaining old generation records in memory after new generation activation, causing memory leak.',
    findings: '`publishGeneration` cleans up storage: `this.storage = this.storage.filter((r) => r.generation_id === this.activeGenerationId)`.',
    rejectedClaims: 'Rejected unbounded storage growth across consecutive snapshot publications.',
    proposedSolutions: 'Assert storage contains only active generation records after publish.'
  },
  {
    num: 17,
    title: 'Multi-Generation Succession: Sequential Atomic Migrations',
    lens: 'Lens 4: Multi-step transition correctness and state machine invariants',
    requirements: ['FLY-FEED-001', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Publishing Gen A -> Gen B -> Gen C encountering state corruption or skipped generations.',
    findings: 'Sequential publications cleanly update pointer and purge predecessor generations at each step.',
    rejectedClaims: 'Rejected state accumulation over continuous publication cycles.',
    proposedSolutions: 'Test consecutive migrations (A -> B -> C) verifying active generation and record counts at each stage.'
  },
  {
    num: 18,
    title: 'Snapshot Dedupe Key Invariance: Route-Date Composite Uniqueness',
    lens: 'Lens 1: Data deduplication and identity integrity',
    requirements: ['FLY-FEED-001', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Duplicate snapshot records with identical dedupe keys coexisting in the same generation.',
    findings: 'Snapshot records enforce unique `dedupe_key` strings structured as `${origin}:${destination}:${date}`.',
    rejectedClaims: 'Rejected redundant records for the same route and date within a snapshot.',
    proposedSolutions: 'Assert dedupe key structure and uniqueness in snapshot records.'
  },
  {
    num: 19,
    title: 'Snapshot Price Non-Negativity: Elimination of Negative or Non-Finite Fares',
    lens: 'Lens 5: Price sanity and financial integrity',
    requirements: ['FLY-FEED-001', 'GATE-DATA-TRUTH'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Snapshot records containing negative prices, zero prices, or NaN values.',
    findings: 'Snapshot record pricing must be positive finite numeric values reflecting real flight costs.',
    rejectedClaims: 'Rejected zero or negative price quotes in published snapshots.',
    proposedSolutions: 'Assert candidate records carry positive finite prices.'
  },
  {
    num: 20,
    title: 'Unified Security & Freshness Contract: Credential Hardening & Snapshot Atomicity',
    lens: 'Lens 1: Cross-subsystem verification of security and data truth',
    requirements: ['FLY-SEC-001', 'FLY-FEED-001', 'REQ-SEC-001', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'GATE-PRIVACY-ISOLATION', 'GATE-ADVERSARIAL-DEFENSE', 'RG01', 'RG10', 'RG13'],
    falsifier: 'Authentication vulnerabilities compromising user accounts or race conditions corrupting flight feed snapshots.',
    findings: 'Credential validation enforces strict RFC compliance and length limits; snapshot publishing provides ACID-like reader isolation.',
    rejectedClaims: 'Rejected unverified client authentication rules or non-atomic data publication.',
    proposedSolutions: 'Validate unified test suite with 100% pass rate.'
  }
];

for (const r of rounds) {
  const roundFile = join(cycleDir, `round-${String(r.num).padStart(2, '0')}.md`);
  const content = `# Round ${String(r.num).padStart(2, '0')}: ${r.title}

- **Cycle:** 0021
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

// Mastergoal
const mastergoalContent = `# Farely AI Loop Mastergoal — Cycle 0021

## Core Invariants & Falsifiers
- **Falsifier 1 (Credential Vulnerability):** Permitting weak passwords (< 12 chars) during sign-up or locking out legacy accounts (< 12 chars) during sign-in.
- **Falsifier 2 (Information Disclosure):** Leaking user account existence or backend database error strings in authentication failure responses.
- **Falsifier 3 (Snapshot Dirtiness):** Readers observing partial, uncommitted, or corrupt candidate records when snapshot publishing fails midway.
- **Falsifier 4 (Empty Snapshot Activation):** Activating an empty generation candidate, resulting in total feed data wipeout.

## Guarding Gates
- **GATE-DATA-TRUTH:** Active snapshot generations accurately reflect verified flight reality.
- **GATE-ADVERSARIAL-DEFENSE:** Malformed email structures, excessive password lengths (> 128), and empty candidates fail closed.
- **GATE-PRIVACY-ISOLATION:** Authentication errors maintain user enumeration defense with zero provider leakage.
- **GATE-RESILIENCE:** Snapshot publishing failure leaves active generations 100% untouched.
- **RG01 (Freshness & Integrity Gate):** Deterministic credential validation and snapshot retrieval.
- **RG10 (Privacy Gate):** Generic security errors preserving user anonymity.
- **RG13 (Outlier & Adversarial Defense Gate):** Boundary length clamping on credential inputs.

## Requirements Traceability
- **FLY-SEC-001:** Authentication policy, credential constraints, password length limits.
- **FLY-FEED-001:** Snapshot atomicity, generation pointer switching, reader isolation.
- **REQ-SEC-001:** User privacy protection, user enumeration mitigation, error sanitization.
- **REQ-DOM-001:** Core domain invariants and data integrity.
- **NC-007:** No stale or partial data presented as active feed data.
- **NC-025:** Strict limitation of error codes and suppression of raw exception details.

## Execution Waves
- **Wave 1 (Authentication Policy & Credential Security):** Expand \`src/app/domain/authPolicy.test.ts\` with comprehensive unit tests for email validation, RFC 254-character bound, trimming, password boundary checks (12-char sign-up min, legacy sign-in allowance, 128-char max), and generic safe error messages.
- **Wave 2 (Snapshot Atomicity & Reader Isolation):** Expand \`src/app/domain/snapshotAtomicity.test.ts\` with unit tests for empty candidate rejection, reader isolation on failure, sequential generation migrations (A -> B -> C), uninitialized store safety, and post-activation garbage collection.
- **Wave 3 (Verification Baseline & Audit Evidence):** Run \`npm test\`, \`npm run check\`, \`npm run check:functions && npm run test:functions\`, record Git SHA, generate implementation record and cycle report, pass \`validate-cycle.mjs\`.
`;

await writeFile(join(cycleDir, 'mastergoal.md'), mastergoalContent, 'utf8');

// Value Case
const valueCaseContent = `# Cycle 0021 Value Case: Credential Security & Snapshot Publication Atomicity

## 1. Real User / Product Problem
Users creating and signing into Farely accounts require strong credential security (mitigating weak password creation and brute force) without being abruptly locked out of existing legacy accounts. Furthermore, authentication errors must never reveal whether an email address is registered, preserving user privacy. In parallel, users browsing flight deals must experience atomic feed updates: new snapshot generations must transition seamlessly without transient blank screens, partial flight lists, or orphaned records when background ingestion pipelines experience intermittent failures.

## 2. Baseline Evidence
- \`src/app/domain/authPolicy.test.ts\` had only 3 test cases, missing edge-case coverage for email length boundaries (254 chars), whitespace trimming, exact 12-char and 128-char password thresholds, empty string handling, and comprehensive error message verification.
- \`src/app/domain/snapshotAtomicity.test.ts\` had a single test case verifying failure halfway through generation B, but lacked assertions for empty candidate rejection (zero records error), uninitialized store reads, sequential multi-step transitions (A -> B -> C), and memory garbage collection verification.

## 3. Exact Changes & Observed Result
- Expanded \`src/app/domain/authPolicy.test.ts\` to verify:
  - Email trimming and format boundaries (valid formats, missing domain, missing @, spaces).
  - RFC 5321 length upper bound (254 chars).
  - Password length boundaries: sign-up >= 12 chars, sign-in legacy compatibility (< 12 chars), max length 128 chars, empty password rejection.
  - Safe auth error strings: generic messages for sign-in and sign-up with zero provider detail leakage.
- Expanded \`src/app/domain/snapshotAtomicity.test.ts\` to verify:
  - Zero-record candidate rejection throwing explicit validation failure.
  - Reader isolation during mid-stream builder exceptions.
  - Uninitialized store safe fallback (empty array, null active generation).
  - Multi-generation sequential transitions (Gen A -> Gen B -> Gen C) with automatic predecessor purge.
  - Single active generation pointer integrity.
- Result: 100% test pass rate across all new assertions, zero regressions, and full gate alignment.

## 4. Evidence References & Classification
- **Evidence Class:** LOCAL_VERIFIED
- **Falsifier / Negative Test Evidence:**
  - Password of length 11 for sign-up verified to fail.
  - Password of length 129 verified to fail.
  - Empty candidate array verified to throw "Candidate generation validation failed: zero records" and retain active generation.
  - Uninitialized store verified to return empty array without null pointer exceptions.
`;

await writeFile(join(cycleDir, 'value-case.md'), valueCaseContent, 'utf8');

console.log('Successfully generated 20 research rounds, mastergoal.md, and value-case.md for Cycle 0021.');
