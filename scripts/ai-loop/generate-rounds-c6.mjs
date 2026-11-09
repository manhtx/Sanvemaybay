import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const cycleDir = '.ai-loop/cycles/0006';
await mkdir(cycleDir, { recursive: true });

const rounds = [
  {
    num: 1,
    title: 'Canonical TravelIntent Schema & Schema Version Invariant',
    lens: 'Lens 3: Route, date, cabin, and scope identity invariants',
    requirements: ['FLY-INTENT-001', 'REQ-DOM-002'],
    gates: ['GATE-INTENT-CANONICAL', 'RG07'],
    falsifier: 'Emitting a TravelIntent with schemaVersion !== 1 or missing required structural fields.',
    findings: '`createTravelIntent` constructs a validated `TravelIntent` object with explicit `schemaVersion: 1`, guaranteeing forward compatibility and strict persistence schema boundary.',
    rejectedClaims: 'Rejected unversioned or untyped flight intent payloads.',
    proposedSolutions: 'Formalize unit test in `src/domain/farely/travelIntent.test.ts`.'
  },
  {
    num: 2,
    title: 'Invariant NC-006: Round-Trip Return Date Requirement',
    lens: 'Lens 8: Negative controls, invalid parameter combinations',
    requirements: ['FLY-INTENT-002', 'REQ-DOM-003', 'NC-006'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Permitting creation of a ROUND_TRIP TravelIntent without specifying an inbound return date.',
    findings: '`createTravelIntent` explicitly checks `if (params.journeyType === "ROUND_TRIP" && !params.returnDate)` and throws Error("NC-006 violation: Round trip intent requires inbound return date specification").',
    rejectedClaims: 'Rejected defaulting missing return dates to arbitrary guesses.',
    proposedSolutions: 'Assert NC-006 violation error thrown on missing return date in tests.'
  },
  {
    num: 3,
    title: 'Invariant NC-004: Market Scope Derivation (DOMESTIC vs INTERNATIONAL)',
    lens: 'Lens 7: Search filter normalization, airport catalog lookup',
    requirements: ['FLY-INTENT-003', 'REQ-DOM-007', 'NC-004'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Classifying an SGN-HAN flight as INTERNATIONAL or an SGN-BKK flight as DOMESTIC.',
    findings: '`deriveMarketScope` inspects canonical `AIRPORT_CATALOG[code].country`. It returns "DOMESTIC" if and only if both origin and destination have country "VN"; otherwise returns "INTERNATIONAL".',
    rejectedClaims: 'Rejected deriving market scope from distance or heuristic string matching.',
    proposedSolutions: 'Assert market scope derivation across domestic and international pairs.'
  },
  {
    num: 4,
    title: 'Passenger Mix Constraints & Minimum Adult Requirement',
    lens: 'Lens 8: Passenger mix boundary defense',
    requirements: ['FLY-INTENT-004', 'REQ-DOM-008'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Allowing an intent with 0 adults or negative adult passengers.',
    findings: '`createTravelIntent` validates `adults = params.adults ?? 1`. If `adults < 1`, it immediately throws RangeError("At least 1 adult passenger required").',
    rejectedClaims: 'Rejected unaccompanied infant bookings without an adult.',
    proposedSolutions: 'Assert RangeError thrown for adults <= 0.'
  },
  {
    num: 5,
    title: 'Child and Infant Passenger Mix Validation',
    lens: 'Lens 3: Passenger mix integrity and defaults',
    requirements: ['FLY-INTENT-005', 'REQ-DOM-008'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Failing to default children and infants to 0 when omitted.',
    findings: '`children = params.children ?? 0` and `infants = params.infants ?? 0` ensure complete and normalized passenger mix structures.',
    rejectedClaims: 'Rejected undefined passenger counts.',
    proposedSolutions: 'Test default passenger mix instantiation.'
  },
  {
    num: 6,
    title: 'Cabin Class Constraints & Default Fallback to ECONOMY',
    lens: 'Lens 7: Cabin normalization and defaults',
    requirements: ['FLY-INTENT-006', 'REQ-DOM-002'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Defaulting cabin to null or an unsupported class.',
    findings: '`cabin: params.cabin ?? "ECONOMY"` defaults safely to ECONOMY while respecting explicit PREMIUM_ECONOMY, BUSINESS, or FIRST.',
    rejectedClaims: 'Rejected nullable cabin definitions.',
    proposedSolutions: 'Verify cabin class defaults and explicit overrides.'
  },
  {
    num: 7,
    title: 'Currency Code Normalization & Default Fallback to VND',
    lens: 'Lens 7: Multi-currency support and canonical base currency',
    requirements: ['FLY-INTENT-007', 'REQ-DOM-002'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Defaulting currency to foreign currencies when unspecified.',
    findings: '`currency: params.currency ?? "VND"` defaults deterministically to the core project base currency VND.',
    rejectedClaims: 'Rejected floating or unanchored default currencies.',
    proposedSolutions: 'Assert VND default and explicit foreign currency handling.'
  },
  {
    num: 8,
    title: 'Outbound Date Specification: Exact vs Window',
    lens: 'Lens 3: Flexible date search and temporal windows',
    requirements: ['FLY-INTENT-008', 'REQ-DOM-002'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Corrupting string date format or object date windows.',
    findings: 'When passed a string YYYY-MM-DD, `outbound` normalizes to `{ exact: outboundDate }`. When passed a DateWindow `{ from, to }`, it preserves the range window intact.',
    rejectedClaims: 'Rejected forcing single-day constraints on flexible travelers.',
    proposedSolutions: 'Assert both string and DateWindow outbound normalization.'
  },
  {
    num: 9,
    title: 'Inbound Return Date Specification for Round Trips',
    lens: 'Lens 3: Round-trip date pairing and symmetry',
    requirements: ['FLY-INTENT-009', 'REQ-DOM-003'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Setting inbound on a ONE_WAY trip or mangling returnDate.',
    findings: 'For `ROUND_TRIP`, inbound normalizes string to `{ exact }` or preserves `{ from, to }`. For `ONE_WAY`, inbound is strictly `undefined`.',
    rejectedClaims: 'Rejected leaking inbound date into ONE_WAY journeys.',
    proposedSolutions: 'Assert inbound presence on ROUND_TRIP and absence on ONE_WAY.'
  },
  {
    num: 10,
    title: 'Trip Length Constraints Bounds',
    lens: 'Lens 7: Flexible duration filters',
    requirements: ['FLY-INTENT-010', 'REQ-DOM-002'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Dropping minDays and maxDays constraints from the intent.',
    findings: '`tripLength: params.tripLength` passes through `{ minDays, maxDays }` constraint object when specified.',
    rejectedClaims: 'Rejected omitting flexible trip length attributes.',
    proposedSolutions: 'Test trip length parameter pass-through.'
  },
  {
    num: 11,
    title: 'Flight Constraints: Maximum Stops and Duration',
    lens: 'Lens 7: Stop count and travel time filters',
    requirements: ['FLY-INTENT-011', 'REQ-DOM-002'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Overriding user maxStops preference with system defaults.',
    findings: '`maxStops` and `maxDurationMinutes` are faithfully preserved for downstream search orchestration and cohort comparison.',
    rejectedClaims: 'Rejected hardcoding max stops to non-stop only.',
    proposedSolutions: 'Assert preservation of maxStops and maxDurationMinutes.'
  },
  {
    num: 12,
    title: 'Baggage Preference Specification',
    lens: 'Lens 7: Baggage preference handling (ANY, CARRY_ON, CHECKED_20KG)',
    requirements: ['FLY-INTENT-012', 'REQ-DOM-002'],
    gates: ['GATE-COST-EPISTEMICS', 'RG05'],
    falsifier: 'Dropping user baggage preference during intent construction.',
    findings: '`baggagePreference: params.baggagePreference` stores traveler preference to enable accurate true cost evaluation.',
    rejectedClaims: 'Rejected assuming all travelers want checked bags.',
    proposedSolutions: 'Test baggage preference pass-through.'
  },
  {
    num: 13,
    title: 'Location Scope Integration via resolveLocationScope',
    lens: 'Lens 3: Geographic scope resolution',
    requirements: ['FLY-INTENT-013', 'REQ-DOM-002', 'NC-002'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Bypassing `resolveLocationScope` or storing raw un-resolved location strings.',
    findings: '`createTravelIntent` calls `resolveLocationScope(params.origin)` and `resolveLocationScope(params.destination)`, generating fully qualified LocationScope objects with primaryCode, metroGroup, and country.',
    rejectedClaims: 'Rejected storing raw unverified strings.',
    proposedSolutions: 'Assert LocationScope structure on created intent.'
  },
  {
    num: 14,
    title: 'Metro Area and Multi-Airport Resolution in Intent',
    lens: 'Lens 3: Bangkok Metro (BKK/DMK) and multi-airport resolution',
    requirements: ['FLY-INTENT-014', 'REQ-DOM-002', 'NC-002'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Mishandling multi-airport metropolitan codes like BKK_ALL.',
    findings: 'Metro codes resolve correctly to their respective metropolitan groupings and country affiliations.',
    rejectedClaims: 'Rejected conflating individual airport codes with metro aggregates.',
    proposedSolutions: 'Test BKK and DMK intent creation.'
  },
  {
    num: 15,
    title: 'Serialization Invariant (REQ-DOM-015)',
    lens: 'Lens 5: Auditing, serialization, and lossless persistence',
    requirements: ['FLY-INTENT-015', 'REQ-DOM-015'],
    gates: ['GATE-RELEASE-PROVENANCE', 'RG14'],
    falsifier: 'Losing semantic fields during JSON serialization and deserialization.',
    findings: '`serializeTravelIntent` and `deserializeTravelIntent` perform lossless round-trip encoding/decoding, preserving 100% of intent properties including dates, passenger mix, and scope metadata.',
    rejectedClaims: 'Rejected partial serialization formats.',
    proposedSolutions: 'Assert deep equality after round-trip serialize/deserialize.'
  },
  {
    num: 16,
    title: 'Deserialization Validation & Schema Version Enforcement',
    lens: 'Lens 8: Schema migration and forward-compatibility defense',
    requirements: ['FLY-INTENT-016', 'REQ-DOM-015'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Accepting corrupted or future unsupported schemaVersion without throwing.',
    findings: '`deserializeTravelIntent` validates `if (!parsed || parsed.schemaVersion !== 1)` and throws Error("Invalid or unsupported TravelIntent schema version").',
    rejectedClaims: 'Rejected blind JSON parsing without schema validation.',
    proposedSolutions: 'Assert schemaVersion validation in unit tests.'
  },
  {
    num: 17,
    title: 'Adversarial Defense: Malformed JSON in Deserialization',
    lens: 'Lens 8: Parser crashes, invalid JSON strings',
    requirements: ['FLY-DEF-003', 'REQ-DOM-015'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Silently returning null or corrupted intent on syntax error.',
    findings: 'Malformed JSON throws SyntaxError as expected, preventing silent data corruption.',
    rejectedClaims: 'Rejected swallow-all try/catch blocks.',
    proposedSolutions: 'Test malformed JSON strings in unit tests.'
  },
  {
    num: 18,
    title: 'One-Way Journey Invariant',
    lens: 'Lens 3: One-way journey simplicity and correctness',
    requirements: ['FLY-INTENT-017', 'REQ-DOM-002'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Requiring returnDate for ONE_WAY journeys.',
    findings: 'For `journeyType: "ONE_WAY"`, `returnDate` is optional and ignored, setting `inbound: undefined`.',
    rejectedClaims: 'Rejected mandatory return dates for one-way journeys.',
    proposedSolutions: 'Assert valid ONE_WAY creation without return date.'
  },
  {
    num: 19,
    title: 'Cross-Country Scenarios & Market Scope Boundaries',
    lens: 'Lens 7: International routing boundaries',
    requirements: ['FLY-INTENT-018', 'REQ-DOM-007'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Failing closed when an unknown airport code is passed to deriveMarketScope.',
    findings: '`deriveMarketScope` defaults to "INTERNATIONAL" when one or both airports are unknown or outside VN.',
    rejectedClaims: 'Rejected crashing on unregistered foreign airports.',
    proposedSolutions: 'Test domestic (HAN-SGN, DAD-CXR) and international (HAN-SIN, SGN-ICN) pairs.'
  },
  {
    num: 20,
    title: 'Synthesis & Work Package Plan for Cycle 6 Execution',
    lens: 'Cycle 6 Architecture & Value Synthesis',
    requirements: ['FLY-REL-001', 'FLY-TEST-001'],
    gates: ['GATE-INTENT-CANONICAL', 'RG07'],
    falsifier: 'Proceeding to implementation without a clear falsification plan and defined work packages.',
    findings: 'Synthesized 3 concrete work packages: WP01 (TravelIntent Formal Unit Test Suite in `src/domain/farely/travelIntent.test.ts`), WP02 (Serialization Fidelity & Market Scope Invariant Defense), WP03 (Full Check Baseline & Remote Convergence).',
    rejectedClaims: 'Rejected omitting pure domain test coverage for travel intent.',
    proposedSolutions: 'Execute WP01, WP02, and WP03.'
  }
];

for (const round of rounds) {
  const padded = String(round.num).padStart(2, '0');
  const filename = join(cycleDir, `round-${padded}.md`);
  const content = `# Cycle 0006 — Research Round ${padded}: ${round.title}

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
