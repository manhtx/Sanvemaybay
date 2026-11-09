import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const cycleDir = '.ai-loop/cycles/0007';
await mkdir(cycleDir, { recursive: true });

const rounds = [
  {
    num: 1,
    title: 'Invariant NC-001 / REQ-PRICE-003: Deal Score Never Overrides Lower Price',
    lens: 'Lens 4: Deal score versus confidence, price truth dominance',
    requirements: ['FLY-PRICE-001', 'REQ-PRICE-003', 'NC-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Selecting an offer with dealScore: 99 and price: 2,000,000 over a compatible offer with dealScore: 40 and price: 1,800,000.',
    findings: '`selectRouteBest` sorts strictly by `a.price - b.price`. Deal score is completely decoupled from cheapest price selection, satisfying invariant NC-001 without exception.',
    rejectedClaims: 'Rejected allowing machine-learning or heuristic deal scores to promote more expensive flights.',
    proposedSolutions: 'Formalize unit test in `src/domain/farely/routeBest.test.ts`.'
  },
  {
    num: 2,
    title: 'Invariant REQ-PRICE-002: Mathematical Minimum Valid Compatible Price Selection',
    lens: 'Lens 4: Mathematical pricing truth',
    requirements: ['FLY-PRICE-002', 'REQ-PRICE-002'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Selecting anything other than the exact mathematical minimum among all eligible options.',
    findings: '`selectRouteBest` filters only eligible offers, normalizes pricing units, and extracts the lowest per-traveler fare.',
    rejectedClaims: 'Rejected fuzzy or approximate price matching.',
    proposedSolutions: 'Assert mathematical minimum selection across extensive test vectors.'
  },
  {
    num: 3,
    title: 'Invariant REQ-PRICE-005: Determinism Under Random Input Shuffling',
    lens: 'Lens 8: Metamorphic testing and permutation invariance',
    requirements: ['FLY-PRICE-003', 'REQ-PRICE-005'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Selecting different winning offers when the input array order is shuffled 50 times.',
    findings: 'Sorting by ascending price with a deterministic tie-breaker on `id.localeCompare` guarantees strict permutation invariance.',
    rejectedClaims: 'Rejected unstable or order-dependent candidate sorting.',
    proposedSolutions: 'Assert shuffle invariance in metamorphic unit tests.'
  },
  {
    num: 4,
    title: 'Stable Tie-Breaking on Offer ID for Identical Fares',
    lens: 'Lens 3: Route, date, cabin, and scope identity invariants',
    requirements: ['FLY-PRICE-004', 'REQ-PRICE-005'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Flapping or non-deterministic selection when two offers share the exact same price.',
    findings: 'When prices are equal, `a.id.localeCompare(b.id)` breaks ties deterministically.',
    rejectedClaims: 'Rejected random or insertion-order tie resolution.',
    proposedSolutions: 'Verify stable tie-breaker with identical fares.'
  },
  {
    num: 5,
    title: 'S08 / C-13: Tri-State Eligibility (ELIGIBLE, INELIGIBLE, UNKNOWN_COMPATIBILITY)',
    lens: 'Lens 2: Tri-state epistemology and missing data classification',
    requirements: ['FLY-PRICE-005', 'REQ-PRICE-004'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Classifying an offer with unknown attributes as ELIGIBLE or purely INELIGIBLE.',
    findings: 'When reasons include any `UNKNOWN_*` code, the state resolves to `UNKNOWN_COMPATIBILITY` rather than a flat `INELIGIBLE`.',
    rejectedClaims: 'Rejected collapsing epistemic uncertainty into boolean truth.',
    proposedSolutions: 'Test tri-state classification semantics in unit tests.'
  },
  {
    num: 6,
    title: 'S08 / A15: Unknown Stops is NOT Zero Stops',
    lens: 'Lens 8: Adversarial missing attributes and false direct claims',
    requirements: ['FLY-PRICE-006', 'REQ-PRICE-004', 'NC-005'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Treating offer.stops === undefined as 0 stops when intent requires maxStops: 0.',
    findings: '`evaluateOfferEligibility` validates that if `intent.maxStops !== undefined`, undefined/null stops triggers `UNKNOWN_STOPS` and fails closed.',
    rejectedClaims: 'Rejected defaulting missing stop counts to direct non-stop flights.',
    proposedSolutions: 'Assert UNKNOWN_STOPS when stops is missing under maxStops constraint.'
  },
  {
    num: 7,
    title: 'S08 / A15: Unknown Duration Does NOT Satisfy Duration Constraints',
    lens: 'Lens 8: Flight duration boundaries',
    requirements: ['FLY-PRICE-007', 'REQ-PRICE-004'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Allowing an offer with missing duration to satisfy maxDurationMinutes constraint.',
    findings: 'If `intent.maxDurationMinutes !== undefined` and `offer.durationMinutes` is undefined/null, `UNKNOWN_DURATION` is pushed, preventing ungrounded matches.',
    rejectedClaims: 'Rejected assuming unknown duration is acceptable.',
    proposedSolutions: 'Assert UNKNOWN_DURATION on missing duration.'
  },
  {
    num: 8,
    title: 'Invariant NC-002: Location Scope Isolation (DMK vs exact BKK)',
    lens: 'Lens 3: Geographic scope invariants and airport substitution defense',
    requirements: ['FLY-SCOPE-001', 'REQ-PRICE-001', 'NC-002'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Selecting a cheaper DMK offer for an exact BKK travel intent.',
    findings: '`satisfiesLocationScope(offer.origin, intent.originScope)` returns false when intent is exact BKK and offer is DMK, marking `ORIGIN_MISMATCH`.',
    rejectedClaims: 'Rejected silent airport substitution in price selection.',
    proposedSolutions: 'Assert NC-002 rejection of DMK for exact BKK intent.'
  },
  {
    num: 9,
    title: 'Destination Scope Isolation & Transit Airport Distinction',
    lens: 'Lens 3: Destination matching',
    requirements: ['FLY-SCOPE-002', 'REQ-PRICE-001'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Matching an offer with destination KUL against an intent for SIN.',
    findings: '`DESTINATION_MISMATCH` is added when destination scope check fails.',
    rejectedClaims: 'Rejected loose destination routing.',
    proposedSolutions: 'Test destination mismatch isolation.'
  },
  {
    num: 10,
    title: 'Invariant NC-006: Missing Return Date on Round Trip RouteBest',
    lens: 'Lens 8: Round-trip consistency',
    requirements: ['FLY-INTENT-002', 'REQ-PRICE-001', 'NC-006'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Matching a one-way offer against a ROUND_TRIP intent.',
    findings: 'When `intent.journeyType === "ROUND_TRIP"` and `!offer.returnDate`, `MISSING_RETURN_DATE` is pushed and eligibility is false.',
    rejectedClaims: 'Rejected matching one-way fares against round-trip intents.',
    proposedSolutions: 'Test MISSING_RETURN_DATE rejection.'
  },
  {
    num: 11,
    title: 'Outbound Date and Date Window Range Matching',
    lens: 'Lens 3: Temporal date alignment',
    requirements: ['FLY-DATE-001', 'REQ-PRICE-001'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Matching an offer departing outside the user date window.',
    findings: 'Offers with `departDate` outside `outbound.exact` or `[from, to]` window receive `OUTBOUND_DATE_MISMATCH`.',
    rejectedClaims: 'Rejected flexible window spillover.',
    proposedSolutions: 'Test exact and window outbound date matching.'
  },
  {
    num: 12,
    title: 'Inbound Return Date and Date Window Range Matching',
    lens: 'Lens 3: Return date temporal boundaries',
    requirements: ['FLY-DATE-002', 'REQ-PRICE-001'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Matching an offer returning outside inbound date window.',
    findings: 'Offers with `returnDate` outside `inbound.exact` or `[from, to]` receive `RETURN_DATE_MISMATCH`.',
    rejectedClaims: 'Rejected return date window violation.',
    proposedSolutions: 'Test return date window matching.'
  },
  {
    num: 13,
    title: 'Invariant NC-004: Cabin Compatibility',
    lens: 'Lens 7: Cabin class isolation',
    requirements: ['FLY-CABIN-001', 'REQ-PRICE-001', 'NC-004'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Comparing a Business class offer against an Economy intent.',
    findings: 'Mismatched cabin classes receive `CABIN_MISMATCH` and are quarantined from candidate selection.',
    rejectedClaims: 'Rejected cross-cabin price comparisons.',
    proposedSolutions: 'Assert CABIN_MISMATCH in unit tests.'
  },
  {
    num: 14,
    title: 'Currency Isolation in Candidate Evaluation',
    lens: 'Lens 7: Currency safety',
    requirements: ['FLY-CURR-001', 'REQ-PRICE-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Comparing a 100 USD offer directly against a 1,500,000 VND offer as if 100 < 1,500,000.',
    findings: '`CURRENCY_MISMATCH` quarantines offers whose currency differs from the intent currency.',
    rejectedClaims: 'Rejected comparing raw numbers across different currency units.',
    proposedSolutions: 'Assert CURRENCY_MISMATCH when currencies differ.'
  },
  {
    num: 15,
    title: 'Non-Positive and Non-Finite Price Quarantine',
    lens: 'Lens 8: Hostile pricing inputs, zero fares, NaN, Infinity',
    requirements: ['FLY-DEF-004', 'REQ-PRICE-001'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Allowing a 0 VND or negative fare to win as cheapest flight.',
    findings: '`!Number.isFinite(offer.price) || offer.price <= 0` pushes `INVALID_PRICE` and strictly quarantines the candidate.',
    rejectedClaims: 'Rejected zero or negative price offers.',
    proposedSolutions: 'Assert INVALID_PRICE for 0, negative, NaN, and Infinity fares.'
  },
  {
    num: 16,
    title: 'NODE TK-05: Pricing Unit Normalization (PARTY_TOTAL to PER_TRAVELER)',
    lens: 'Lens 4: Multi-passenger price normalization',
    requirements: ['FLY-PRICE-008', 'REQ-PRICE-006'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Comparing an un-divided 4-person family total fare against a single traveler per-person fare.',
    findings: 'When `offer.pricingUnit === "PARTY_TOTAL"` and total pax > 1, `normalizeOfferForIntent` divides the price by total pax, normalizing to `PER_TRAVELER`.',
    rejectedClaims: 'Rejected conflating party totals with per-traveler fares.',
    proposedSolutions: 'Test PARTY_TOTAL normalization with multi-passenger intents.'
  },
  {
    num: 17,
    title: 'Single Adult Pricing Unit Idempotence',
    lens: 'Lens 4: Single adult unit math',
    requirements: ['FLY-PRICE-009', 'REQ-PRICE-006'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Mishandling 1-adult intents with PARTY_TOTAL.',
    findings: 'When total pax is 1, PARTY_TOTAL remains unchanged in price but sets pricingUnit to PER_TRAVELER.',
    rejectedClaims: 'Rejected division errors on single pax.',
    proposedSolutions: 'Test 1-adult party total normalization.'
  },
  {
    num: 18,
    title: 'Empty and Null Offer List Safety Handling',
    lens: 'Lens 8: Defensive null and empty collection handling',
    requirements: ['FLY-DEF-005', 'REQ-PRICE-002'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Crashing on null, undefined, or empty offer arrays.',
    findings: '`selectRouteBest` checks `!offers || offers.length === 0` and returns `null` cleanly without throwing.',
    rejectedClaims: 'Rejected crashing on empty search outcomes.',
    proposedSolutions: 'Test null and empty arrays in unit tests.'
  },
  {
    num: 19,
    title: 'All Ineligible Offers Scenario',
    lens: 'Lens 8: Filter exhaustion safety',
    requirements: ['FLY-DEF-006', 'REQ-PRICE-002'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Returning an ineligible offer when all available offers fail constraints.',
    findings: 'When all candidates are ineligible, `selectRouteBest` safely returns `null` rather than settling for an incompatible flight.',
    rejectedClaims: 'Rejected compromising user constraints when options are limited.',
    proposedSolutions: 'Assert null return when all candidates are ineligible.'
  },
  {
    num: 20,
    title: 'Synthesis & Work Package Plan for Cycle 7 Execution',
    lens: 'Cycle 7 Architecture & Value Synthesis',
    requirements: ['FLY-REL-001', 'FLY-TEST-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Proceeding to implementation without a clear falsification plan and defined work packages.',
    findings: 'Synthesized 3 concrete work packages: WP01 (RouteBest Formal Unit Test Suite in `src/domain/farely/routeBest.test.ts`), WP02 (Metamorphic Shuffling & Tri-State Invariant Defense), WP03 (Full Check Baseline & Remote Convergence).',
    rejectedClaims: 'Rejected omitting pure domain test coverage for price truth and route best selection.',
    proposedSolutions: 'Execute WP01, WP02, and WP03.'
  }
];

for (const round of rounds) {
  const padded = String(round.num).padStart(2, '0');
  const filename = join(cycleDir, `round-${padded}.md`);
  const content = `# Cycle 0007 — Research Round ${padded}: ${round.title}

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
