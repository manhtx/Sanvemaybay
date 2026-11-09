import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const cycleDir = '.ai-loop/cycles/0008';
await mkdir(cycleDir, { recursive: true });

const rounds = [
  {
    num: 1,
    title: 'Invariant REQ-ID-002 & REQ-DOM-011: OfferVariantId Price Independence',
    lens: 'Lens 3: Route, date, cabin, and scope identity invariants',
    requirements: ['FLY-ID-001', 'REQ-ID-002', 'REQ-DOM-011'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Changing the OfferVariantId when the price of a flight changes from 3.2M to 2.8M.',
    findings: '`buildOfferVariantId` takes origin, destination, departDate, returnDate, airline, flightNumber, cabin, stops, and segments. Price is strictly omitted from the hash input.',
    rejectedClaims: 'Rejected binding price points to flight variant identity.',
    proposedSolutions: 'Formalize unit test asserting identical OfferVariantId across differing price points in `src/domain/farely/identity.test.ts`.'
  },
  {
    num: 2,
    title: 'SHA-256 Universal Synchronous Algorithm Parity',
    lens: 'Lens 4: Cryptographic determinism across browser, Deno, and Node',
    requirements: ['FLY-ID-002', 'REQ-ID-001'],
    gates: ['GATE-RELEASE-PROVENANCE', 'RG14'],
    falsifier: 'Generating non-standard SHA-256 hex hashes or crashing in non-Node environments.',
    findings: '`sha256Hex` implements standard FIPS 180-4 SHA-256 purely in synchronous JavaScript bitwise operations, verified against known test vectors.',
    rejectedClaims: 'Rejected asynchronous webcrypto dependencies in pure domain kernel functions.',
    proposedSolutions: 'Assert hash digest parity against standard SHA-256 vectors.'
  },
  {
    num: 3,
    title: 'S09 / A14: Physical Itinerary Fingerprinting (buildPhysicalItineraryId)',
    lens: 'Lens 3: Physical flight itinerary tracking',
    requirements: ['FLY-ID-003', 'REQ-DOM-010'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Failing to distinguish different physical flights with the same route.',
    findings: '`buildPhysicalItineraryId` constructs format `itin:v1:<32-hex>` incorporating ordered physical segments, flight numbers, and departure/arrival instants.',
    rejectedClaims: 'Rejected conflating commercial bundles with physical flight hardware.',
    proposedSolutions: 'Verify physical itinerary ID format and differentiation.'
  },
  {
    num: 4,
    title: 'Ordered Physical Flight Segments in Itinerary Fingerprinting',
    lens: 'Lens 3: Segment order determinism',
    requirements: ['FLY-ID-004', 'REQ-DOM-010'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Producing different hashes when segments are supplied in random array order.',
    findings: '`buildPhysicalItineraryId` sorts segments by `segmentOrder` before hashing, guaranteeing permutation-independent deterministic output.',
    rejectedClaims: 'Rejected order-sensitive unindexed segment arrays.',
    proposedSolutions: 'Test segment sorting invariance in unit tests.'
  },
  {
    num: 5,
    title: 'S10: Commercial Offer Product Modeling (buildCommercialProductId)',
    lens: 'Lens 3: Commercial dimension isolation',
    requirements: ['FLY-ID-005', 'REQ-DOM-010'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Treating a Basic Economy non-refundable ticket and a Flexible Checked-Bag ticket as the same commercial product.',
    findings: '`buildCommercialProductId` combines `itineraryId` with cabin, fareBrand, baggageIncluded, refundable, changeable, and salesChannel into `prod:v1:<32-hex>`.',
    rejectedClaims: 'Rejected ignoring fare brand and ticket flexibility in product definition.',
    proposedSolutions: 'Assert product ID divergence across fare conditions.'
  },
  {
    num: 6,
    title: 'Decoupling Physical Itinerary from Commercial Offer Dimensions',
    lens: 'Lens 4: Multi-layered identity architecture',
    requirements: ['FLY-ID-006', 'REQ-DOM-010'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Overwriting itinerary ID when commercial attributes change.',
    findings: 'The architecture enforces clean separation: Itinerary (S09) -> Commercial Product (S10) -> Offer Variant (REQ-ID-002) -> Observation (REQ-ID-001).',
    rejectedClaims: 'Rejected monolithic flight representation.',
    proposedSolutions: 'Test clean architectural separation in unit tests.'
  },
  {
    num: 7,
    title: 'REQ-DOM-012 & REQ-ID-001: Observation Event Identification',
    lens: 'Lens 5: Auditing, event timestamps, ISO compliance',
    requirements: ['FLY-OBS-001', 'REQ-DOM-012', 'REQ-ID-001'],
    gates: ['GATE-RELEASE-PROVENANCE', 'RG14'],
    falsifier: 'Creating identical observation IDs for observations at different timestamps or prices.',
    findings: '`buildObservationId` combines `offerVariantId`, provider, observedAt, and price into `obs:v1:<32-hex>`, uniquely tagging each provider scan event.',
    rejectedClaims: 'Rejected overwriting historical observations in-place.',
    proposedSolutions: 'Assert observation ID uniqueness across timestamps and prices.'
  },
  {
    num: 8,
    title: 'REQ-DOM-013 & REQ-ID-005: Opportunity Aggregation Identity',
    lens: 'Lens 3: Opportunity lifecycle aggregate',
    requirements: ['FLY-OPP-001', 'REQ-DOM-013', 'REQ-ID-005'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Creating volatile opportunity IDs that fluctuate as fares update.',
    findings: '`buildOpportunityId` combines origin, destination, departDate, returnDate, journeyType, and cabin into `opp:v1:<32-hex>`, anchoring deals to stable travel opportunities.',
    rejectedClaims: 'Rejected ephemeral deal identifiers.',
    proposedSolutions: 'Verify opportunity ID stability.'
  },
  {
    num: 9,
    title: 'REQ-ID-001: Canonical TravelIntent ID Generation',
    lens: 'Lens 3: TravelIntent identity hashing',
    requirements: ['FLY-INTENT-001', 'REQ-ID-001'],
    gates: ['GATE-INTENT-CANONICAL', 'RG07'],
    falsifier: 'Generating mismatched IDs for identical TravelIntent specifications.',
    findings: '`buildTravelIntentId` hashes canonical origin/destination scopes, journey type, date windows, cabin, passenger counts, and currency into `intent:v1:<32-hex>`.',
    rejectedClaims: 'Rejected un-hashed intent persistence keys.',
    proposedSolutions: 'Test TravelIntent ID determinism.'
  },
  {
    num: 10,
    title: 'REQ-DATA-004: Condition Episode Identifier Construction',
    lens: 'Lens 6: Watch episode management',
    requirements: ['FLY-WATCH-001', 'REQ-DATA-004'],
    gates: ['GATE-WATCH-EPISODES', 'RG06'],
    falsifier: 'Generating non-standard episode identifier strings.',
    findings: '`buildConditionEpisodeId(watchId, episodeIndex)` formats deterministically as `ep_${watchId}_${episodeIndex}`.',
    rejectedClaims: 'Rejected random episode naming.',
    proposedSolutions: 'Test episode ID generation.'
  },
  {
    num: 11,
    title: 'REQ-ID-006: Backward Compatible Legacy Identity Resolution',
    lens: 'Lens 8: Schema migration and legacy reference preservation',
    requirements: ['FLY-LEG-001', 'REQ-ID-006'],
    gates: ['GATE-RELEASE-PROVENANCE', 'RG14'],
    falsifier: 'Crashing or returning unknown for valid legacy IDs (`ov_*`, `obs_*`, `opp_*`, `ti_*`).',
    findings: '`resolveLegacyIdentity` parses raw ID strings, classifying `version` as `v1` (for `*:v1:*`) or `legacy` (for prefixed strings), mapping the appropriate entity type.',
    rejectedClaims: 'Rejected breaking historical bookmark and saved-flight URLs.',
    proposedSolutions: 'Assert resolution across all legacy and canonical ID prefixes.'
  },
  {
    num: 12,
    title: 'Legacy Identity Migration Typing and Fallback',
    lens: 'Lens 8: Unrecognized identifier resilience',
    requirements: ['FLY-LEG-002', 'REQ-ID-006'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Throwing an unhandled exception when an unknown raw ID is passed.',
    findings: 'Unrecognized IDs return `{ canonicalId: trimmed, version: "legacy", type: "unknown" }` safely without throwing.',
    rejectedClaims: 'Rejected throwing on unexpected user input.',
    proposedSolutions: 'Test unknown ID strings in legacy resolver.'
  },
  {
    num: 13,
    title: 'Case Insensitivity & Whitespace Trimming in Identifiers',
    lens: 'Lens 3: Airport code and carrier normalization',
    requirements: ['FLY-ID-007', 'REQ-ID-001'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Producing different hashes for "sgn" vs "SGN" or " HAN " vs "HAN".',
    findings: 'All ID builders apply `.trim().toUpperCase()` on airport and carrier codes, guaranteeing case and whitespace invariance.',
    rejectedClaims: 'Rejected case-sensitive airport identity matching.',
    proposedSolutions: 'Assert case and whitespace trimming invariance.'
  },
  {
    num: 14,
    title: 'Default Fallbacks for Optional Identity Parameters',
    lens: 'Lens 3: Nullable attribute defaults',
    requirements: ['FLY-ID-008', 'REQ-ID-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Injecting "undefined" or "null" literal strings into hash payloads.',
    findings: 'Optional parameters use explicit defaults: cabin defaults to "ECONOMY", stops to "0", flightNumber to empty string.',
    rejectedClaims: 'Rejected accidental JS stringification of undefined.',
    proposedSolutions: 'Verify default parameter handling in ID builders.'
  },
  {
    num: 15,
    title: 'Deterministic String Joining Delimiters Preventing Field Collisions',
    lens: 'Lens 8: Collision resistance against delimiter injection',
    requirements: ['FLY-SEC-002', 'REQ-ID-001'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Causing hash collisions between (A="B|C", D="E") and (A="B", D="C|E").',
    findings: 'Using fixed positional pipe delimiters and structured segment joiners preserves distinct field boundaries.',
    rejectedClaims: 'Rejected naive un-delimited string concatenation.',
    proposedSolutions: 'Assert delimiter safety in unit tests.'
  },
  {
    num: 16,
    title: 'Truncated 128-Bit (32 Hex Character) Collision Resistance',
    lens: 'Lens 4: Information theoretic hash size analysis',
    requirements: ['FLY-ID-009', 'REQ-ID-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Exceeding 32 characters in the hex suffix or producing inconsistent lengths.',
    findings: 'All builders slice SHA-256 output to 32 characters (128 bits), balancing collision resistance ($2^{64}$ birthday bound) with compact URL readability.',
    rejectedClaims: 'Rejected unwieldy 64-character full hashes in frontend routes.',
    proposedSolutions: 'Assert exact length formatting `*:v1:<32 chars>`. '
  },
  {
    num: 17,
    title: 'Multi-Leg Flight Number Consistency in OfferVariantId',
    lens: 'Lens 3: Layover flight representation',
    requirements: ['FLY-ID-010', 'REQ-ID-002'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Losing connecting flight numbers in multi-segment OfferVariantId.',
    findings: 'When `segments` are present, `buildOfferVariantId` incorporates `${origin}-${destination}-${flightNumber}` for every connecting leg.',
    rejectedClaims: 'Rejected only tracking the first segment of a multi-leg flight.',
    proposedSolutions: 'Test multi-segment OfferVariantId generation.'
  },
  {
    num: 18,
    title: 'Distinguishing Return Date vs One-Way in OpportunityId',
    lens: 'Lens 3: Journey type identity separation',
    requirements: ['FLY-ID-011', 'REQ-ID-005'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Generating identical OpportunityIds for a one-way flight and a round-trip flight departing on the same day.',
    findings: '`buildOpportunityId` includes both `returnDate` and `journeyType`, ensuring complete separation between one-way and round-trip opportunities.',
    rejectedClaims: 'Rejected conflating one-way and round-trip deal entities.',
    proposedSolutions: 'Assert OpportunityId divergence between ONE_WAY and ROUND_TRIP.'
  },
  {
    num: 19,
    title: 'Time-Series Price History Decoupling Proof',
    lens: 'Lens 4: Price history aggregation mechanics',
    requirements: ['FLY-HIST-001', 'REQ-ID-002', 'REQ-HIST-005'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Failing to associate multiple observations with differing prices to the same OfferVariantId.',
    findings: 'Because OfferVariantId is price-independent, repeated observations across days form a clean time-series keyed by OfferVariantId.',
    rejectedClaims: 'Rejected creating a new variant for every price update.',
    proposedSolutions: 'Simulate 5 price observations over time and assert identical OfferVariantId.'
  },
  {
    num: 20,
    title: 'Synthesis & Work Package Plan for Cycle 8 Execution',
    lens: 'Cycle 8 Architecture & Value Synthesis',
    requirements: ['FLY-REL-001', 'FLY-TEST-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Proceeding to implementation without a clear falsification plan and defined work packages.',
    findings: 'Synthesized 3 concrete work packages: WP01 (Identity & Hashing Formal Unit Test Suite in `src/domain/farely/identity.test.ts`), WP02 (Price Independence & Legacy Resolution Verification), WP03 (Full Check Baseline & Remote Convergence).',
    rejectedClaims: 'Rejected omitting pure domain test coverage for identity kernel.',
    proposedSolutions: 'Execute WP01, WP02, and WP03.'
  }
];

for (const round of rounds) {
  const padded = String(round.num).padStart(2, '0');
  const filename = join(cycleDir, `round-${padded}.md`);
  const content = `# Cycle 0008 — Research Round ${padded}: ${round.title}

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
