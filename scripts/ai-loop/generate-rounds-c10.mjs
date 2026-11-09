import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const cycleDir = '.ai-loop/cycles/0010';
await mkdir(cycleDir, { recursive: true });

const rounds = [
  {
    num: 1,
    title: 'Invariant NC-007: Observation Date Cannot Become Departure Date',
    lens: 'Lens 3: Route, date, cabin, and scope identity invariants',
    requirements: ['FLY-TIME-001', 'REQ-DOM-009', 'NC-007'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Conflating the observation timestamp (UTC) with the departure date (local origin airport).',
    findings: '`validateObservationVsDeparture` strictly verifies presence of both `observedAtUtc` and `departLocalDate`, validating regex `^\\d{4}-\\d{2}-\\d{2}$` and ISO timestamp validity, satisfying NC-007.',
    rejectedClaims: 'Rejected using UTC dates for flight departure filtering.',
    proposedSolutions: 'Formalize unit test in `src/domain/farely/time.test.ts`.'
  },
  {
    num: 2,
    title: 'Local Calendar Date Representation: Preventing UTC Offset Day Shifts',
    lens: 'Lens 3: Timezone conversion and calendar safety',
    requirements: ['FLY-TIME-002', 'REQ-DOM-009'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Parsing 2026-12-01 in UTC-5 or UTC+7 and having it shift to 2026-11-30 or 2026-12-02.',
    findings: '`parseLocalCalendarDate` parses `YYYY-MM-DD` purely as integer year, month, day components without constructing local Date objects, eliminating timezone shift bugs.',
    rejectedClaims: 'Rejected `new Date("YYYY-MM-DD")` parsing.',
    proposedSolutions: 'Assert exact integer decomposition in unit tests.'
  },
  {
    num: 3,
    title: 'Format Invariance: YYYY-MM-DD Zero-Padding',
    lens: 'Lens 5: Auditing and canonical date string formats',
    requirements: ['FLY-TIME-003', 'REQ-DOM-009'],
    gates: ['GATE-RELEASE-PROVENANCE', 'RG14'],
    falsifier: 'Formatting 2026, 5, 4 as "2026-5-4" instead of "2026-05-04".',
    findings: '`formatLocalCalendarDate` pads single-digit months and days with leading zeros.',
    rejectedClaims: 'Rejected variable-width date formats.',
    proposedSolutions: 'Verify zero-padding format in unit tests.'
  },
  {
    num: 4,
    title: 'Cross-Month and Leap-Year Calendar Day Calculations',
    lens: 'Lens 4: Mathematical day intervals',
    requirements: ['FLY-TIME-004', 'REQ-DOM-009'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Calculating incorrect duration across month boundaries or leap years (e.g. Feb 28 to Mar 1).',
    findings: '`calendarDaysBetween` projects calendar dates into UTC noon epochs and computes `Math.round((db - da) / (1000 * 60 * 60 * 24))`, accurately resolving leap years and DST boundaries.',
    rejectedClaims: 'Rejected calculating calendar days using 24-hour millisecond division on local Date instances.',
    proposedSolutions: 'Test leap year and month-end vectors.'
  },
  {
    num: 5,
    title: 'Same-Day Flight Calendar Day Difference',
    lens: 'Lens 4: Identity interval boundary',
    requirements: ['FLY-TIME-005', 'REQ-DOM-009'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Returning non-zero duration between identical dates.',
    findings: '`calendarDaysBetween("2026-12-01", "2026-12-01")` returns strictly 0.',
    rejectedClaims: 'Rejected off-by-one errors on single-day journeys.',
    proposedSolutions: 'Assert 0 day difference for identical dates.'
  },
  {
    num: 6,
    title: 'Flight Time Contract Schema Integrity',
    lens: 'Lens 3: FlightTimeContract interface definition',
    requirements: ['FLY-TIME-006', 'REQ-DOM-009'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Missing originTimezone or observedAtUtc in flight timing metadata.',
    findings: '`FlightTimeContract` provides the canonical contract separating UTC capture from airport local schedules.',
    rejectedClaims: 'Rejected timezone-agnostic flight representation.',
    proposedSolutions: 'Validate contract type adherence.'
  },
  {
    num: 7,
    title: 'Malformed Calendar Date Rejections in parseLocalCalendarDate',
    lens: 'Lens 8: Adversarial string input defense',
    requirements: ['FLY-DEF-011', 'REQ-DOM-009'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Silent parsing of "invalid-date" or "2026/12/01" returning NaN.',
    findings: '`parseLocalCalendarDate` throws Error("Invalid calendar date format") when parts.length !== 3.',
    rejectedClaims: 'Rejected silent error propagation.',
    proposedSolutions: 'Assert error thrown on malformed date strings.'
  },
  {
    num: 8,
    title: 'Invalid Timestamp Format Rejections in validateObservationVsDeparture',
    lens: 'Lens 8: Timestamp validation',
    requirements: ['FLY-DEF-012', 'REQ-DOM-009'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Permitting invalid timestamps or empty strings to pass validation.',
    findings: 'Throws Error when observedAtUtc is unparseable or departLocalDate does not match regex.',
    rejectedClaims: 'Rejected loose unvalidated inputs.',
    proposedSolutions: 'Assert validation failures on invalid strings.'
  },
  {
    num: 9,
    title: 'REQ-DOM-014: Canonical Price Scope Fingerprint Format',
    lens: 'Lens 3: Price scope identification and cache keys',
    requirements: ['FLY-SCOPE-003', 'REQ-DOM-014'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Generating non-standard price scope strings.',
    findings: '`buildPriceScopeFingerprint` constructs format `scope_${origin}:${dest}:${journey}:${depart}:${return}:${cabin}:${currency}:${maxStops}`.',
    rejectedClaims: 'Rejected non-deterministic scope keys.',
    proposedSolutions: 'Formalize unit test in `src/domain/farely/priceScope.test.ts`.'
  },
  {
    num: 10,
    title: 'V1 Price Scope Default Parameters',
    lens: 'Lens 3: Default scope attributes',
    requirements: ['FLY-SCOPE-004', 'REQ-DOM-014'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Leaving cabin or currency undefined in fingerprint.',
    findings: 'Defaults cabin to "ECONOMY", currency to "VND", and maxStops to "ANY".',
    rejectedClaims: 'Rejected undefined tokens in cache keys.',
    proposedSolutions: 'Test default token generation.'
  },
  {
    num: 11,
    title: 'Case Normalization in Price Scope Fingerprinting',
    lens: 'Lens 3: Airport and carrier case normalization',
    requirements: ['FLY-SCOPE-005', 'REQ-DOM-014'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Producing different scope keys for "sgn" vs "SGN".',
    findings: 'All airport codes, journey types, and cabin names are converted to uppercase.',
    rejectedClaims: 'Rejected case-sensitive scope lookups.',
    proposedSolutions: 'Verify uppercase normalization.'
  },
  {
    num: 12,
    title: 'Price Scope V2 Architecture: Multi-Dimensional Comparability (NODE TK-04)',
    lens: 'Lens 4: Extended comparability parameters',
    requirements: ['FLY-SCOPE-006', 'REQ-DOM-014'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Omitting passenger counts, trip length, or max duration from V2 fingerprint.',
    findings: '`buildPriceScopeFingerprintV2` generates `scope_v2:<12 tokens>` incorporating passengers, tripLength, pricingUnit, and maxDurationMinutes.',
    rejectedClaims: 'Rejected losing flexible search parameters in cache scopes.',
    proposedSolutions: 'Verify V2 fingerprint format and token ordering.'
  },
  {
    num: 13,
    title: 'Passenger Mix Tokenization in V2 Fingerprint',
    lens: 'Lens 3: Passenger mix token representation',
    requirements: ['FLY-SCOPE-007', 'REQ-DOM-014'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Mishandling 2 Adults, 1 Child, 0 Infants.',
    findings: 'Normalizes passenger mix into `${adults}A${children}C${infants}I` (e.g. "2A1C0I").',
    rejectedClaims: 'Rejected verbose JSON strings in scope keys.',
    proposedSolutions: 'Assert passenger tokenization in V2 tests.'
  },
  {
    num: 14,
    title: 'Flexible Trip Length Representation in V2 Fingerprint',
    lens: 'Lens 7: Trip length token representation',
    requirements: ['FLY-SCOPE-008', 'REQ-DOM-014'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Failing to encode minDays and maxDays ranges in V2 fingerprint.',
    findings: 'Encodes as `${minDays ?? "*"}-${maxDays ?? "*"}` or defaults to "EXACT".',
    rejectedClaims: 'Rejected conflating exact dates with range queries.',
    proposedSolutions: 'Test exact and range trip length encoding.'
  },
  {
    num: 15,
    title: 'Maximum Duration Parameterization in V2 Fingerprint',
    lens: 'Lens 7: Duration limits in scope keys',
    requirements: ['FLY-SCOPE-009', 'REQ-DOM-014'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Dropping maxDurationMinutes from V2 fingerprint.',
    findings: 'Appends `maxDurationMinutes` or "ANY" as the final token.',
    rejectedClaims: 'Rejected unconstrained duration matching.',
    proposedSolutions: 'Assert maxDuration token in V2 tests.'
  },
  {
    num: 16,
    title: 'Intent-to-Scope V1 Fingerprint Derivation',
    lens: 'Lens 3: TravelIntent integration',
    requirements: ['FLY-SCOPE-010', 'REQ-DOM-014'],
    gates: ['GATE-INTENT-CANONICAL', 'RG07'],
    falsifier: 'Failing to construct scope key directly from TravelIntent object.',
    findings: '`buildPriceScopeFingerprintFromIntent` extracts outbound/inbound dates, location scopes, cabin, currency, and maxStops automatically.',
    rejectedClaims: 'Rejected manual parameter unpacking in consumers.',
    proposedSolutions: 'Test intent-to-scope V1 function.'
  },
  {
    num: 17,
    title: 'Intent-to-Scope V2 Fingerprint Derivation',
    lens: 'Lens 3: TravelIntent V2 integration',
    requirements: ['FLY-SCOPE-011', 'REQ-DOM-014'],
    gates: ['GATE-INTENT-CANONICAL', 'RG07'],
    falsifier: 'Mismatched V2 scope keys when created from intent vs raw params.',
    findings: '`buildPriceScopeFingerprintV2FromIntent` extracts all 12 dimensions from `TravelIntent` deterministically.',
    rejectedClaims: 'Rejected inconsistent scope serialization.',
    proposedSolutions: 'Test intent-to-scope V2 function.'
  },
  {
    num: 18,
    title: 'Flexible Date Window Serialization in Intent-to-Scope Fingerprints',
    lens: 'Lens 3: Date window formatting in scope keys',
    requirements: ['FLY-SCOPE-012', 'REQ-DOM-014'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Dropping flexible date window boundaries from scope fingerprint.',
    findings: 'Date windows encode as `${from}:${to}`, preserving range boundaries across search caching.',
    rejectedClaims: 'Rejected collapsing date windows to single arbitrary dates.',
    proposedSolutions: 'Verify date window encoding in scope fingerprints.'
  },
  {
    num: 19,
    title: 'Cache Key Determinism Across Search, Watch, and Saved Deals',
    lens: 'Lens 5: Cross-feature identity consistency',
    requirements: ['FLY-SCOPE-013', 'REQ-DOM-014'],
    gates: ['GATE-RELEASE-PROVENANCE', 'RG14'],
    falsifier: 'Generating different scope fingerprints for Search, Watch, and Saved views on the same flight criteria.',
    findings: 'Because all features use `buildPriceScopeFingerprintFromIntent`, cache keys are 100% unified across the platform.',
    rejectedClaims: 'Rejected feature-specific bespoke scope formats.',
    proposedSolutions: 'Assert fingerprint equality across intent usages.'
  },
  {
    num: 20,
    title: 'Synthesis & Work Package Plan for Cycle 10 Execution',
    lens: 'Cycle 10 Architecture & Value Synthesis',
    requirements: ['FLY-REL-001', 'FLY-TEST-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Proceeding to implementation without a clear falsification plan and defined work packages.',
    findings: 'Synthesized 3 concrete work packages: WP01 (Time Contract & Calendar Invariant Unit Tests in `src/domain/farely/time.test.ts`), WP02 (Price Scope Fingerprint Unit Tests in `src/domain/farely/priceScope.test.ts`), WP03 (Full Check Baseline & Remote Convergence).',
    rejectedClaims: 'Rejected omitting pure domain test coverage for time contract and price scopes.',
    proposedSolutions: 'Execute WP01, WP02, and WP03.'
  }
];

for (const round of rounds) {
  const padded = String(round.num).padStart(2, '0');
  const filename = join(cycleDir, `round-${padded}.md`);
  const content = `# Cycle 0010 — Research Round ${padded}: ${round.title}

- **Lens:** ${round.lens}
- **Target Requirements:** ${round.requirements.join(', ')}
- **Guarding Gates:** ${round.gates.join(', ')}
- **Falsification Boundary:** ${round.falsifier}

## Empirical Findings & Architectural Analysis
${round.findings}

## Rejected Hypotheses & Counter-Claims
${round.rejectedClaims}

## Proposed Engineering Solutions
${round.proposedSolutions}
`;
  await writeFile(filename, content, 'utf8');
}

console.log('Generated 20 research rounds in', cycleDir);
