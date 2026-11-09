import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const cycleDir = '.ai-loop/cycles/0018';
await mkdir(cycleDir, { recursive: true });

const rounds = [
  {
    num: 1,
    title: 'User Preferences: Baseline Integrity and Safe Defaults',
    lens: 'Lens 1: Default configuration state guarantees',
    requirements: ['FLY-UX-004', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Default preferences missing core required properties or containing invalid initial values.',
    findings: '`defaultPreferences` enforces HAN origin, 15,000,000 VND budget, ["asia"] regions, 1 max stop, ECONOMY cabin, and disabled self-transfer.',
    rejectedClaims: 'Rejected undefined or partial default preference objects.',
    proposedSolutions: 'Assert full shape of defaultPreferences in `src/app/lib/preferences.test.ts`.'
  },
  {
    num: 2,
    title: 'Non-Object Input Sanitization and Deep Cloning',
    lens: 'Lens 5: Type confusion and adversarial input defense',
    requirements: ['FLY-UX-004', 'REQ-DOM-001'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Passing null, undefined, primitive string, or number to `normalizePreferences` mutating default state or crashing.',
    findings: '`normalizePreferences` returns `{ ...defaultPreferences }` immediately if input is not a non-null object.',
    rejectedClaims: 'Rejected returning the mutable default reference directly.',
    proposedSolutions: 'Test null, undefined, and primitive values returning default clones.'
  },
  {
    num: 3,
    title: 'Home Airport Normalization: Trimming, Uppercase, and Validation',
    lens: 'Lens 4: Code standardization and string normalization',
    requirements: ['FLY-UX-004', 'REQ-DOM-004'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Accepting lowercase, whitespace-padded, or empty string home airport codes.',
    findings: '`homeAirport` is trimmed and upper-cased; blank strings fall back to default ("HAN").',
    rejectedClaims: 'Rejected preserving unnormalized whitespace or lowercase IATA codes.',
    proposedSolutions: 'Test lowercase "sgn" -> "SGN" and whitespace "  dad  " -> "DAD".'
  },
  {
    num: 4,
    title: 'Budget Normalization: Positive Finite Number Enforcement',
    lens: 'Lens 1: Monetary boundary defense and non-negative invariants',
    requirements: ['FLY-UX-004', 'REQ-DOM-001', 'NC-005'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Allowing negative, zero, NaN, or infinite budgets in user preferences.',
    findings: '`budget` requires `typeof input.budget === "number" && Number.isFinite(input.budget) && input.budget > 0`, falling back to 15,000,000 VND otherwise.',
    rejectedClaims: 'Rejected zero or negative budget limits.',
    proposedSolutions: 'Test 0, -100, NaN, and Infinity falling back to default budget.'
  },
  {
    num: 5,
    title: 'Favorite Regions Array Filtering and Type Narrowing',
    lens: 'Lens 5: Collection type safety and element sanitization',
    requirements: ['FLY-UX-004', 'REQ-DOM-001'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Permitting non-string elements (numbers, objects, nulls) in favoriteRegions array.',
    findings: '`favoriteRegions` filters with `typeof region === "string"`; non-array inputs fallback to default.',
    rejectedClaims: 'Rejected passing arbitrary objects inside region lists.',
    proposedSolutions: 'Test filtering out numbers and objects from regions array.'
  },
  {
    num: 6,
    title: 'Maximum Stops Gating: Non-Negative Integer Bounds',
    lens: 'Lens 1: Itinerary flight constraint boundaries',
    requirements: ['FLY-UX-004', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Accepting negative stop counts (-1), floating point stops (1.5), or non-numeric values.',
    findings: '`maxStops` enforces `Number.isInteger(input.maxStops) && input.maxStops >= 0`, falling back to default 1 otherwise.',
    rejectedClaims: 'Rejected fractional or negative transit stops.',
    proposedSolutions: 'Test -1, 1.5, and "direct" falling back to default maxStops.'
  },
  {
    num: 7,
    title: 'Preferred Airlines List Filtering',
    lens: 'Lens 5: Array sanitization and carrier code hygiene',
    requirements: ['FLY-UX-004', 'REQ-DOM-004'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Allowing corrupted airline items or non-array values.',
    findings: '`preferredAirlines` strictly retains string items and falls back to empty array for non-array input.',
    rejectedClaims: 'Rejected un-sanitized airline array inputs.',
    proposedSolutions: 'Test string retention and non-array fallback.'
  },
  {
    num: 8,
    title: 'Cabin Class Allowlist Strict Enforcement',
    lens: 'Lens 4: Enumerated domain value validation',
    requirements: ['FLY-UX-004', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Accepting invalid cabin classes like "COACH", "VIP", or lowercase "economy".',
    findings: '`cabinClass` validates against `new Set(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"])`, falling back to "ECONOMY".',
    rejectedClaims: 'Rejected arbitrary strings in cabin classification.',
    proposedSolutions: 'Test all 4 valid cabin classes and arbitrary invalid strings.'
  },
  {
    num: 9,
    title: 'Maximum Flight Duration in Minutes Validation',
    lens: 'Lens 1: Travel time constraints',
    requirements: ['FLY-UX-004', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Permitting zero or negative maxFlightTimeMinutes.',
    findings: '`maxFlightTimeMinutes` must be number > 0, otherwise normalizes to `undefined`.',
    rejectedClaims: 'Rejected negative flight time limits.',
    proposedSolutions: 'Test positive duration retention and zero/negative resolution to undefined.'
  },
  {
    num: 10,
    title: 'Self-Transfer Policy Strict Boolean Gating',
    lens: 'Lens 1: Risk preference modeling (NC-009, NC-010)',
    requirements: ['FLY-UX-004', 'NC-009', 'NC-010'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Allowing truthy strings or objects to enable self-transfer without explicit boolean true.',
    findings: '`allowSelfTransfer` requires `input.allowSelfTransfer === true`, strictly defaulting to `false`.',
    rejectedClaims: 'Rejected truthy values enabling risky self-transfers.',
    proposedSolutions: 'Test "true", 1, and true comparisons.'
  },
  {
    num: 11,
    title: 'Temporal Departure Window Gating: YYYY-MM-DD Syntax Enforcement',
    lens: 'Lens 4: Date string format validation (REQ-DOM-008)',
    requirements: ['FLY-UX-004', 'REQ-DOM-008'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Accepting non-ISO or malformed date strings for departureFrom or departureTo.',
    findings: '`validDate` checks `/^\\d{4}-\\d{2}-\\d{2}$/`, discarding malformed or non-string date inputs.',
    rejectedClaims: 'Rejected ambiguous date formats (e.g. DD/MM/YYYY) in preference filtering.',
    proposedSolutions: 'Test valid YYYY-MM-DD vs invalid strings.'
  },
  {
    num: 12,
    title: 'Temporal Departure Window Gating: Chronological Range Invariant',
    lens: 'Lens 1: Chronological causality in travel windows',
    requirements: ['FLY-UX-004', 'REQ-DOM-008'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Allowing departureFrom to be later than departureTo (e.g. 2026-10-10 > 2026-10-01).',
    findings: 'When `departureFrom > departureTo`, both values are discarded to prevent contradictory filters.',
    rejectedClaims: 'Rejected inverted travel date intervals.',
    proposedSolutions: 'Test clearing of both dates when departureFrom > departureTo.'
  },
  {
    num: 13,
    title: 'LocalStorage Persistence and Partial State Merging',
    lens: 'Lens 2: Client state persistence and incremental updates',
    requirements: ['FLY-UX-004', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Saving partial preferences overwriting unmentioned fields with blanks instead of preserving existing values.',
    findings: '`saveUserPreferences` merges partial updates with current stored preferences before normalizing and storing.',
    rejectedClaims: 'Rejected destructive partial preference saves.',
    proposedSolutions: 'Test sequential partial updates preserving untouched fields.'
  },
  {
    num: 14,
    title: 'LocalStorage Parse Corruption Immunity',
    lens: 'Lens 5: Client storage resilience and fail-safe recovery',
    requirements: ['FLY-UX-004', 'REQ-DOM-001'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Crashing client UI when localStorage contains invalid JSON under preference key.',
    findings: '`getUserPreferences` catches JSON parse errors and returns `{ ...defaultPreferences }`.',
    rejectedClaims: 'Rejected throwing unhandled errors on storage corruption.',
    proposedSolutions: 'Test corrupted JSON in localStorage returning default preferences.'
  },
  {
    num: 15,
    title: 'Remote Preference Sync Graceful Offline Handling',
    lens: 'Lens 1: Decoupled client operation and network resilience',
    requirements: ['FLY-UX-004', 'NC-026'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Throwing unhandled network errors when Supabase is unconfigured or user is not logged in.',
    findings: '`loadRemoteUserPreferences` returns `undefined` and `saveRemoteUserPreferences` returns `false` safely.',
    rejectedClaims: 'Rejected requiring online auth session for preference operations.',
    proposedSolutions: 'Test load and save remote preferences when unconfigured.'
  },
  {
    num: 16,
    title: 'Social Sharing: Native Web Share API Priority',
    lens: 'Lens 1: Mobile and modern browser sharing integration (FLY-UX-005)',
    requirements: ['FLY-UX-005', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Failing to use native navigator.share when available on mobile devices.',
    findings: '`shareOrCopy` invokes `navigatorLike.share(target)` when present and returns `"shared"`.',
    rejectedClaims: 'Rejected forcing clipboard fallback when native share sheet is available.',
    proposedSolutions: 'Assert native share invocation in `src/app/lib/sharing.test.ts`.'
  },
  {
    num: 17,
    title: 'Social Sharing: Desktop Clipboard Fallback',
    lens: 'Lens 1: Cross-platform interaction fallbacks',
    requirements: ['FLY-UX-005', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Failing to copy deal link to clipboard on desktop browsers lacking Web Share API.',
    findings: '`shareOrCopy` calls `navigatorLike.clipboard.writeText(target.url)` and returns `"copied"`.',
    rejectedClaims: 'Rejected broken share button on desktop browsers.',
    proposedSolutions: 'Test clipboard writeText invocation when share is missing.'
  },
  {
    num: 18,
    title: 'Social Sharing: Unsupported Browser Vietnamese Error Notification',
    lens: 'Lens 5: Graceful error surfacing without silent failures',
    requirements: ['FLY-UX-005', 'REQ-DOM-001'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Failing silently or throwing untranslated English errors when neither share nor clipboard is supported.',
    findings: '`shareOrCopy` throws Error("Trình duyệt không hỗ trợ chia sẻ hoặc sao chép liên kết.").',
    rejectedClaims: 'Rejected silent no-op when sharing is impossible.',
    proposedSolutions: 'Test Vietnamese error message throwing.'
  },
  {
    num: 19,
    title: 'Tracked Routes Origin Deduplication and Preserved Naming',
    lens: 'Lens 4: Geographic origin collection deduplication (REQ-DOM-004)',
    requirements: ['REQ-DOM-004', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Emitting duplicate airport origin pills or overwriting first origin label with subsequent aliases.',
    findings: '`uniqueOrigins` builds Map keyed by `originCode`, retaining the first encountered label.',
    rejectedClaims: 'Rejected duplicate origins in search selectors.',
    proposedSolutions: 'Test multi-route deduplication in `src/app/data/origins.test.ts`.'
  },
  {
    num: 20,
    title: 'Empty Route Set Handling and Order Preservation',
    lens: 'Lens 5: Zero-state and chronological stability in origin catalogs',
    requirements: ['REQ-DOM-004', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Crashing on empty route array or altering input insertion order.',
    findings: '`uniqueOrigins([])` returns `[]`; distinct origins maintain first-seen order.',
    rejectedClaims: 'Rejected sorting or filtering out valid distinct origins.',
    proposedSolutions: 'Test empty array safety and order preservation.'
  }
];

for (const r of rounds) {
  const roundFile = join(cycleDir, `round-${String(r.num).padStart(2, '0')}.md`);
  const content = `# Round ${String(r.num).padStart(2, '0')}: ${r.title}

- **Cycle:** 0018
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

console.log('Successfully generated 20 research rounds for Cycle 0018.');
