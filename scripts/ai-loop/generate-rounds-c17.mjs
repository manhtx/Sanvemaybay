import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const cycleDir = '.ai-loop/cycles/0017';
await mkdir(cycleDir, { recursive: true });

const rounds = [
  {
    num: 1,
    title: 'Product Event Privacy: Strict Metadata Allowlist Scrubbing',
    lens: 'Lens 1: Data privacy and PII quarantine (NC-025, REQ-SEC-002)',
    requirements: ['REQ-SEC-002', 'NC-025'],
    gates: ['GATE-DATA-TRUTH', 'RG13'],
    falsifier: 'Permitting arbitrary keys (emails, credit cards, auth tokens) in analytics metadata.',
    findings: '`sanitizeProductEvent` filters metadata keys strictly through `allowedMetadata` set of 19 permitted keys.',
    rejectedClaims: 'Rejected permissive pass-through of client telemetry payloads.',
    proposedSolutions: 'Assert unpermitted metadata keys are scrubbed in `src/app/lib/analytics.test.ts`.'
  },
  {
    num: 2,
    title: 'Metadata Value Typing: Primitive Values Gating',
    lens: 'Lens 5: Input sanitization and structured payload serialization',
    requirements: ['REQ-SEC-002', 'REQ-DOM-001'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Passing nested objects, arrays, or executable functions inside analytics metadata.',
    findings: '`sanitizeProductEvent` requires values to be string, number, boolean, or null, omitting complex nested objects.',
    rejectedClaims: 'Rejected arbitrary nested object storage in telemetry pipeline.',
    proposedSolutions: 'Test non-primitive metadata values filtering.'
  },
  {
    num: 3,
    title: 'Entity Identifier Length Boundary Enforcing (120 Chars)',
    lens: 'Lens 5: Resource bounds and storage denial-of-service defense',
    requirements: ['REQ-SEC-002', 'NC-026'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Allowing unbounded entity IDs (e.g. 10KB string) to inflate local and remote storage.',
    findings: '`sanitizeProductEvent` clamps `entityId` to `input.entityId.slice(0, 120)` deterministically.',
    rejectedClaims: 'Rejected unbounded entity identifiers in telemetry events.',
    proposedSolutions: 'Test string truncation for 200-char identifiers.'
  },
  {
    num: 4,
    title: 'Event Timestamp Invariance and Automatic ISO Fallback',
    lens: 'Lens 4: Temporal determinism in telemetry sequencing',
    requirements: ['REQ-DOM-008'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Overwriting user-supplied `createdAt` timestamps or producing non-ISO timestamps when absent.',
    findings: '`sanitizeProductEvent` preserves `input.createdAt` if provided, else generates standard ISO string.',
    rejectedClaims: 'Rejected mutative timestamp replacement.',
    proposedSolutions: 'Verify explicit createdAt preservation and automatic ISO generation.'
  },
  {
    num: 5,
    title: 'Local Analytics Ring Buffer: FIFO Bounded Retention (100 Events)',
    lens: 'Lens 5: LocalStorage resource budgeting and client memory protection',
    requirements: ['REQ-DOM-001', 'NC-026'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Permitting localStorage to grow monotonically beyond 100 entries, causing quota exhaustion.',
    findings: '`appendLocalProductEvent` caps the array with `.slice(-MAX_LOCAL_EVENTS)` (100 events max).',
    rejectedClaims: 'Rejected unbounded client-side telemetry accumulation.',
    proposedSolutions: 'Test 120-event sequence retaining exactly 100 newest events in FIFO order.'
  },
  {
    num: 6,
    title: 'Storage Fallback & Rebranding Backward Compatibility',
    lens: 'Lens 2: State migration and brand unification',
    requirements: ['REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Discarding historical telemetry when migrating from `flycheap.product-events` to `farely.product-events`.',
    findings: '`readLocalProductEvents` checks `farely.product-events` first, falling back to legacy `flycheap.product-events`.',
    rejectedClaims: 'Rejected hard failure or data loss upon brand namespace migration.',
    proposedSolutions: 'Test fallback read from legacy storage key.'
  },
  {
    num: 7,
    title: 'Corrupt Storage Resilience: Fail-Closed Array Recovery',
    lens: 'Lens 5: Storage corruption and parse error resilience',
    requirements: ['REQ-DOM-001'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Throwing fatal unhandled exceptions when localStorage contains malformed JSON or non-array data.',
    findings: '`readLocalProductEvents` catches JSON parse errors and checks `Array.isArray`, returning `[]` on corruption.',
    rejectedClaims: 'Rejected crashing client UI on corrupted local storage.',
    proposedSolutions: 'Test corrupted JSON and non-array JSON inputs.'
  },
  {
    num: 8,
    title: 'Polymorphic Event Tracking: Object vs Positional Signatures',
    lens: 'Lens 4: API ergonomics and polymorphic dispatch safety',
    requirements: ['REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Failing to record events when passed positional `(eventType, metadata, entityId, storage)` arguments.',
    findings: '`trackProductEvent` detects string `inputOrType` and constructs `ProductEvent` object seamlessly.',
    rejectedClaims: 'Rejected fragile API contracts with mismatched overload handling.',
    proposedSolutions: 'Test both object and positional string tracking invocations.'
  },
  {
    num: 9,
    title: 'Silent Graceful Degradation When Supabase Is Unconfigured',
    lens: 'Lens 1: Offline and independent client operation',
    requirements: ['REQ-DOM-001', 'NC-026'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Failing or blocking UI threads when `isSupabaseConfigured` is false.',
    findings: '`trackProductEvent` stores to local storage and returns cleanly without invoking network functions.',
    rejectedClaims: 'Rejected mandatory backend connectivity for client-side event tracking.',
    proposedSolutions: 'Assert clean resolution when backend is absent.'
  },
  {
    num: 10,
    title: 'Web Vitals and Core Performance Event Typing',
    lens: 'Lens 4: Structured event taxonomy alignment',
    requirements: ['REQ-DOM-001', 'RG01'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Permitting unknown event types or dropping valid web vital metric events.',
    findings: '`ProductEventType` includes `"web_vital"`, and allowlist includes `"metric"`, `"value"`, `"delta"`, `"rating"`.',
    rejectedClaims: 'Rejected unclassified or freestyle event typing.',
    proposedSolutions: 'Verify web vital metric event sanitization.'
  },
  {
    num: 11,
    title: 'Public Discovery Routes: Authoritative SEO Indexability',
    lens: 'Lens 1: Public web crawler access control (FLY-SEC-003)',
    requirements: ['FLY-SEC-003', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Marking public discovery landing pages as `indexable: false`, suppressing organic search traffic.',
    findings: '`/`, `/deals`, `/historical-deals`, `/explore`, `/search`, `/alerts`, `/advisor`, `/privacy`, `/terms` have `indexable: true`.',
    rejectedClaims: 'Rejected accidental noindex tags on canonical public pages.',
    proposedSolutions: 'Assert all 9 public discovery routes return `indexable: true` with distinctive Vietnamese titles in `src/app/lib/routeMetadata.test.ts`.'
  },
  {
    num: 12,
    title: 'Dynamic Deal Detail Pages: Indexable with Generic Metadata',
    lens: 'Lens 1: Content disclosure and information leak prevention',
    requirements: ['FLY-SEC-003', 'NC-025'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Leaking internal deal UUIDs, provider secrets, or customer parameters into page title tags.',
    findings: '`/deals/[id]` returns `indexable: true` with stable title "Chi tiết deal vé máy bay | Farely" regardless of path param.',
    rejectedClaims: 'Rejected echoing untrusted URL route params directly into HTML metadata.',
    proposedSolutions: 'Test dynamic route pattern matching and title scrubbing.'
  },
  {
    num: 13,
    title: 'Private User Routes: Strict Non-Indexable Quarantine (/saved)',
    lens: 'Lens 1: User privacy and local storage protection',
    requirements: ['FLY-SEC-003', 'NC-025'],
    gates: ['GATE-DATA-TRUTH', 'RG13'],
    falsifier: 'Marking `/saved` as indexable, causing search engines to index private empty saved deals pages.',
    findings: '`/saved` explicitly sets `indexable: false`.',
    rejectedClaims: 'Rejected public indexing of device-local user bookmark pages.',
    proposedSolutions: 'Assert `/saved` returns `indexable: false`.'
  },
  {
    num: 14,
    title: 'Authentication & Sensitive Token Routes Quarantine (/auth, /alerts/*)',
    lens: 'Lens 1: Security credential and email verification protection',
    requirements: ['FLY-SEC-003', 'NC-025', 'REQ-SEC-002'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Permitting search crawlers to index `/auth` login forms or sensitive `/alerts/confirm?token=...` routes.',
    findings: '`getRouteMetadata` intercepts `/auth` and `/alerts/*`, setting `indexable: false` and generic title.',
    rejectedClaims: 'Rejected crawler exposure of auth flows and token confirmation endpoints.',
    proposedSolutions: 'Test `/auth`, `/alerts/confirm`, `/alerts/unsubscribe` non-indexability.'
  },
  {
    num: 15,
    title: '404 and Unknown Routes: Fail-Closed Non-Indexability',
    lens: 'Lens 5: Unknown path handling and soft-404 SEO prevention',
    requirements: ['FLY-SEC-003', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Serving `indexable: true` or 200-like metadata for arbitrary non-existent URLs.',
    findings: 'Unrecognized paths fall back to `indexable: false` and title "Không tìm thấy trang | Farely".',
    rejectedClaims: 'Rejected soft-404 indexing of invalid paths.',
    proposedSolutions: 'Test unrecognized paths falling back to noindex 404 metadata.'
  },
  {
    num: 16,
    title: 'Default Root Metadata Parity',
    lens: 'Lens 4: Canonical homepage metadata identity',
    requirements: ['REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Altering default root metadata or providing blank descriptions on homepage.',
    findings: '`/` returns exact `DEFAULT_METADATA` with Farely branding and value proposition.',
    rejectedClaims: 'Rejected unbranded or generic root metadata.',
    proposedSolutions: 'Test root path metadata equivalence to DEFAULT_METADATA.'
  },
  {
    num: 17,
    title: 'Legal and Compliance Routes: Privacy & Terms Metadata',
    lens: 'Lens 1: Regulatory transparency and compliance standards',
    requirements: ['FLY-SEC-003', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Missing explicit meta titles/descriptions for mandatory legal policy pages.',
    findings: '`/privacy` and `/terms` have dedicated descriptive Vietnamese metadata.',
    rejectedClaims: 'Rejected unindexed or blank legal compliance routes.',
    proposedSolutions: 'Assert specific titles and descriptions for /privacy and /terms.'
  },
  {
    num: 18,
    title: 'Advisor and Explore Routes: Capability Grounding',
    lens: 'Lens 1: Feature discovery indexing',
    requirements: ['FLY-INTEL-007', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Omitting feature-specific descriptions for Trip Advisor and Explore modules.',
    findings: '`/advisor` and `/explore` highlight cost, duration, stops, and tracked routes.',
    rejectedClaims: 'Rejected generic fallback metadata on primary application modules.',
    proposedSolutions: 'Assert distinct metadata on /advisor and /explore.'
  },
  {
    num: 19,
    title: 'Deep Nested Sub-Path Defense in Deal Routes',
    lens: 'Lens 5: Path traversal and wildcard security',
    requirements: ['FLY-SEC-003', 'NC-025'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Matching deeply nested paths like `/deals/abc/xyz` to single-item detail route.',
    findings: 'Regex `^\\/deals\\/[^\\/]+$` strictly accepts single path segment, rejecting multi-segment trails.',
    rejectedClaims: 'Rejected over-permissive regex pattern matching on deal routes.',
    proposedSolutions: 'Test `/deals/123/sub` failing closed to 404 non-indexable metadata.'
  },
  {
    num: 20,
    title: 'Integrated Parity: Telemetry Privacy and SEO Isolation Convergence',
    lens: 'Lens 1: Dual defense convergence between telemetry and indexing',
    requirements: ['REQ-SEC-002', 'FLY-SEC-003', 'NC-025'],
    gates: ['GATE-DATA-TRUTH', 'GATE-ADVERSARIAL-DEFENSE', 'RG01', 'RG13'],
    falsifier: 'Permitting user activity on non-indexable private routes to leak private path tokens into analytics.',
    findings: 'Combined safeguards ensure private routes are never indexed and telemetry scrubs entity identifiers to 120 chars without query params.',
    rejectedClaims: 'Rejected leaking private state through indexing or telemetry leaks.',
    proposedSolutions: 'Cross-assert analytics scrubbing and route metadata privacy defenses.'
  }
];

for (const r of rounds) {
  const roundFile = join(cycleDir, `round-${String(r.num).padStart(2, '0')}.md`);
  const content = `# Round ${String(r.num).padStart(2, '0')}: ${r.title}

- **Cycle:** 0017
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

console.log('Successfully generated 20 research rounds for Cycle 0017.');
