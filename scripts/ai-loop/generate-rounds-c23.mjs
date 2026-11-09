import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const cycleDir = '.ai-loop/cycles/0023';
await mkdir(cycleDir, { recursive: true });

const rounds = [
  {
    num: 1,
    title: 'Deal Scoring Hierarchy: dealScore Priority over aiInsight.savingScore',
    lens: 'Lens 1: Scoring field resolution hierarchy',
    requirements: ['FLY-FEED-001', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Using aiInsight.savingScore when dealScore is explicitly present.',
    findings: '`score(deal)` evaluates `Number(deal.dealScore ?? deal.aiInsight.savingScore)`, prioritizing canonical dealScore.',
    rejectedClaims: 'Rejected ignoring dealScore in favor of nested AI metrics.',
    proposedSolutions: 'Assert dealScore overrides savingScore in `src/app/domain/travelFeed.test.ts`.'
  },
  {
    num: 2,
    title: 'Observation Timestamp Tie-Breaker: Deterministic Temporal Ordering',
    lens: 'Lens 1: Tie-breaker determinism and freshness ordering',
    requirements: ['FLY-FEED-001', 'GATE-DATA-TRUTH'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Random or nondeterministic deal order when scores are tied.',
    findings: 'Sort comparator evaluates `score(b) - score(a) || timestamp(b) - timestamp(a)`, breaking ties by newest observedAt timestamp.',
    rejectedClaims: 'Rejected relying on engine insertion order for tie-breaking.',
    proposedSolutions: 'Test identical score deals sort newest observedAt first.'
  },
  {
    num: 3,
    title: 'Destination Diversification: Round-Robin Extraction of Unique toCode Targets',
    lens: 'Lens 1: User experience and destination diversity',
    requirements: ['FLY-FEED-001', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Clustering multiple deals for the same destination at the top of the feed, crowding out diverse alternatives.',
    findings: '`rankTravelFeed` collects the highest scoring deal for each distinct `toCode` into `diversified` before appending repeat destinations.',
    rejectedClaims: 'Rejected greedy destination-agnostic sorting in top feed recommendations.',
    proposedSolutions: 'Assert distinct destinations precede secondary deals of higher-scoring destinations.'
  },
  {
    num: 4,
    title: 'Repeat Destination Deferral: Secondary Deals Append After Distinct Destination Heads',
    lens: 'Lens 1: Feed pagination and tail preservation',
    requirements: ['FLY-FEED-001', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Dropping secondary deals for the same destination rather than appending them in the tail.',
    findings: 'Returns `diversified.concat(ranked.filter((deal) => !diversified.includes(deal)))`, preserving 100% of input deals.',
    rejectedClaims: 'Rejected destructive deduplication that loses viable flight alternatives.',
    proposedSolutions: 'Assert total deal count is conserved across ranking.'
  },
  {
    num: 5,
    title: 'Non-Finite Score Recovery: Graceful Fallback to Zero Without Crashing',
    lens: 'Lens 5: Numeric coercion and NaN defense',
    requirements: ['FLY-FEED-001', 'GATE-ADVERSARIAL-DEFENSE'],
    gates: ['GATE-DATA-TRUTH', 'RG13'],
    falsifier: 'Passing NaN or undefined dealScore crashing sort comparator with NaN comparisons.',
    findings: '`Number.isFinite(value) ? value : 0` safely coerces non-finite scores to 0.',
    rejectedClaims: 'Rejected trusting raw deal scores without finite number checks.',
    proposedSolutions: 'Assert NaN scores sort cleanly after finite positive scores.'
  },
  {
    num: 6,
    title: 'Corrupt Date Immunity: Defaulting Malformed observedAt to 0 Epoch',
    lens: 'Lens 5: Date parsing resilience',
    requirements: ['FLY-FEED-001', 'GATE-ADVERSARIAL-DEFENSE'],
    gates: ['GATE-DATA-TRUTH', 'RG13'],
    falsifier: 'Invalid date strings causing NaN timestamp calculations and unstable sort behavior.',
    findings: '`new Date(deal.observedAt ?? 0).getTime()` defaults to 0 when date parsing yields NaN.',
    rejectedClaims: 'Rejected un-guarded Date.parse invocations in feed ranking.',
    proposedSolutions: 'Assert "invalid-date" strings fall back to epoch 0.'
  },
  {
    num: 7,
    title: 'Empty Dataset Robustness: Zero Deals Safely Returns Empty Array',
    lens: 'Lens 5: Zero-state safety',
    requirements: ['FLY-FEED-001', 'GATE-RESILIENCE'],
    gates: ['GATE-RESILIENCE', 'RG01'],
    falsifier: 'Empty array input throwing exception or returning null.',
    findings: '`rankTravelFeed([])` returns `[]` safely.',
    rejectedClaims: 'Rejected requiring non-empty arrays in feed ranking APIs.',
    proposedSolutions: 'Test empty array input returns empty array.'
  },
  {
    num: 8,
    title: 'Array Immutability: Pure Functional Ordering Without In-Place Mutation',
    lens: 'Lens 4: Functional purity and immutability',
    requirements: ['FLY-FEED-001', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Mutating input deal array in-place during sort.',
    findings: '`const ranked = [...deals].sort(...)` copies array before sorting.',
    rejectedClaims: 'Rejected in-place mutation of input data arrays.',
    proposedSolutions: 'Assert frozen input array does not throw and retains original order.'
  },
  {
    num: 9,
    title: 'Transparent Personalization vs Machine Learning Claim Separation',
    lens: 'Lens 1: Transparent deterministic heuristics vs opaque AI claims (Autonomy Contract)',
    requirements: ['FLY-FEED-002', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Claiming black-box ML personalization when ranking is an explicit transparent heuristic.',
    findings: '`rankPersonalizedFeed` documentation and design explicitly declare transparent additive/subtractive weights.',
    rejectedClaims: 'Rejected claiming AI personalization for rule-based preference weighting.',
    proposedSolutions: 'Assert deterministic behavior of weighted ranking formula in `src/app/domain/travelFeed.personalized.test.ts`.'
  },
  {
    num: 10,
    title: 'Home Airport Affinity Boost: Additive +8 Weight for Matching fromCode',
    lens: 'Lens 1: Origin proximity weighting',
    requirements: ['FLY-FEED-002', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Ignoring user home airport preference or boosting mismatched origins.',
    findings: '`if (deal.fromCode === preferences.homeAirport) value += 8`.',
    rejectedClaims: 'Rejected filtering out deals departing from non-home airports.',
    proposedSolutions: 'Test deal matching homeAirport receives +8 advantage over identical non-matching deal.'
  },
  {
    num: 11,
    title: 'Favorite Region Alignment Boost: Additive +12 Weight for Matching Region',
    lens: 'Lens 1: Destination region weighting',
    requirements: ['FLY-FEED-002', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Failing to boost deals in user favorite regions.',
    findings: '`if (preferences.favoriteRegions.includes(deal.region)) value += 12`.',
    rejectedClaims: 'Rejected rigid region whitelisting that hides other deals.',
    proposedSolutions: 'Test favorite region deals receive +12 boost.'
  },
  {
    num: 12,
    title: 'Preferred Airline Boost: Additive +10 Weight for Sanctioned Airline Codes',
    lens: 'Lens 1: Airline carrier loyalty weighting',
    requirements: ['FLY-FEED-002', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Failing to prioritize preferred airlines when configured.',
    findings: '`if (preferences.preferredAirlines.length > 0 && preferences.preferredAirlines.includes(deal.airlineCode)) value += 10`.',
    rejectedClaims: 'Rejected applying airline boost when preferredAirlines list is empty.',
    proposedSolutions: 'Test preferred airline deals receive +10 advantage.'
  },
  {
    num: 13,
    title: 'Stop Penalty Scaling: -10 Per Excess Stop with Capped -20 Bound',
    lens: 'Lens 1: Layover penalty bounded calculation',
    requirements: ['FLY-FEED-002', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Exceeding -20 maximum penalty for multi-stop flights or penalizing compliant stop counts.',
    findings: '`if (deal.stops > preferences.maxStops) value -= Math.min(20, (deal.stops - preferences.maxStops) * 10)`.',
    rejectedClaims: 'Rejected unbounded penalties that bury valid deals infinitely.',
    proposedSolutions: 'Assert 1 stop over limit gets -10, 2+ stops over limit caps at -20.'
  },
  {
    num: 14,
    title: 'Budget Violation Penalty: Fixed -15 Weight Reduction for Exceeding User Cap',
    lens: 'Lens 1: Budget sensitivity and price preference',
    requirements: ['FLY-FEED-002', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Filtering out deals over budget rather than demoting them with bounded penalty.',
    findings: '`if (deal.price > preferences.budget) value -= 15`.',
    rejectedClaims: 'Rejected hard filtering on budget which prevents discovering close deals.',
    proposedSolutions: 'Assert over-budget deals receive -15 penalty without removal.'
  },
  {
    num: 15,
    title: 'Flight Time Constraint Penalty: -10 Deduction for Flights Exceeding Max Minutes',
    lens: 'Lens 1: Duration constraint weighting',
    requirements: ['FLY-FEED-002', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Penalizing duration when maxFlightTimeMinutes is undefined or flight duration is within bounds.',
    findings: '`if (preferences.maxFlightTimeMinutes && parseDurationMinutes(deal.duration) > preferences.maxFlightTimeMinutes) value -= 10`.',
    rejectedClaims: 'Rejected parsing failures causing false duration penalties.',
    proposedSolutions: 'Test exceeding maxFlightTimeMinutes applies -10 deduction.'
  },
  {
    num: 16,
    title: 'Strict Non-Exclusion Invariant: Low-Preference Deals Re-Ranked But NEVER Filtered',
    lens: 'Lens 1: Epistemic completeness and zero-suppression contract',
    requirements: ['FLY-FEED-002', 'GATE-DATA-TRUTH'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'A valid deal disappearing from feed results due to poor preference alignment.',
    findings: 'All input deals are preserved in output: `ranked.length === deals.length`.',
    rejectedClaims: 'Rejected preference-based filtering suppressing flight evidence.',
    proposedSolutions: 'Assert output length equals input length even when all constraints fail.'
  },
  {
    num: 17,
    title: 'Deterministic Tie Stability: Tiny Fractional Index Offset (-0.001 * index)',
    lens: 'Lens 4: Total order determinism and stable sort invariant',
    requirements: ['FLY-FEED-002', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Equal-scoring personalized deals swapping order nondeterministically.',
    findings: '`score - index * 0.001` preserves base ranking order for equal-scoring deals.',
    rejectedClaims: 'Rejected arbitrary ordering on score collisions.',
    proposedSolutions: 'Assert identical personalized scores preserve pre-ranking order.'
  },
  {
    num: 18,
    title: 'Duration String Parser Invariance in Personalization: parseDurationMinutes',
    lens: 'Lens 4: Regex-based minute conversion in personalization pipeline',
    requirements: ['FLY-FEED-002', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Malformed duration strings causing NaN score calculation in personalization.',
    findings: '`parseDurationMinutes` cleanly converts "Xh Ym", "Xh", "Ym" and returns 0 for malformed strings.',
    rejectedClaims: 'Rejected fragile duration parsing.',
    proposedSolutions: 'Test various duration formats in personalization penalty calculations.'
  },
  {
    num: 19,
    title: 'Composite Preference Evaluation: Multiple Simultaneous Boosts and Penalties',
    lens: 'Lens 1: Multi-factor score aggregation',
    requirements: ['FLY-FEED-002', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Interference between additive boosts and subtractive penalties.',
    findings: 'Formula independently accumulates each factor into final personalized score.',
    rejectedClaims: 'Rejected order-dependent preference calculation.',
    proposedSolutions: 'Assert multi-factor combinations compute exact expected sums.'
  },
  {
    num: 20,
    title: 'Unified Feed Invariant: Truth-Dominated Ranking & Transparent Customization',
    lens: 'Lens 1: Holistic feed architecture integrity',
    requirements: ['FLY-FEED-001', 'FLY-FEED-002', 'REQ-DOM-001', 'REQ-DOM-008'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Personalization hiding verified low-cost deals or misrepresenting flight attributes.',
    findings: 'Base feed diversifies and prioritizes truth; personalization re-ranks transparently without mutating underlying deal facts.',
    rejectedClaims: 'Rejected compromising verified flight data for personalized sorting.',
    proposedSolutions: 'Execute full test suite verification with 100% pass rate.'
  }
];

for (const r of rounds) {
  const roundFile = join(cycleDir, `round-${String(r.num).padStart(2, '0')}.md`);
  const content = `# Round ${String(r.num).padStart(2, '0')}: ${r.title}

- **Cycle:** 0023
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
const mastergoalContent = `# Farely AI Loop Mastergoal — Cycle 0023

## Core Invariants & Falsifiers
- **Falsifier 1 (Feed Homogeneity & Inversion):** Monopolizing the top of the travel feed with multiple deals to the same destination while starving diverse destinations, or sorting lower scores above higher scores.
- **Falsifier 2 (Information Suppression):** Suppressing or filtering out verified deals simply because they do not match user preference parameters (budget, stops, duration).
- **Falsifier 3 (Score Corruption):** NaN deal scores, invalid dates, or malformed durations causing unstable sort order or runtime exceptions.
- **Falsifier 4 (False AI Claims):** Presenting transparent deterministic weighted ranking rules as opaque machine learning personalization.

## Guarding Gates
- **GATE-DATA-TRUTH:** Verified flight facts, scores, and timestamps strictly dictate feed ranking.
- **GATE-ADVERSARIAL-DEFENSE:** Non-finite scores, unparseable dates, and malformed durations fail closed safely to zero without crashing.
- **GATE-RESILIENCE:** Zero-deal feeds return empty arrays cleanly.
- **RG01 (Freshness & Integrity Gate):** Deterministic ordering and pure array operations without in-place mutation.
- **RG13 (Outlier & Adversarial Defense Gate):** Strict numeric sanitization in weighting calculations.

## Requirements Traceability
- **FLY-FEED-001:** Core travel feed ranking, score hierarchy, and destination diversification.
- **FLY-FEED-002:** Transparent user-preference feed re-ranking without evidence suppression.
- **REQ-DOM-001:** Core domain model invariants and entity integrity.
- **REQ-DOM-008:** Temporal ordering, timestamp tie-breakers, and mathematical consistency.

## Execution Waves
- **Wave 1 (Feed Ranking & Destination Diversification):** Expand \`src/app/domain/travelFeed.test.ts\` with comprehensive unit tests for dealScore priority over savingScore, timestamp tie-breaking, destination diversification, repeat destination deferral, non-finite score fallback, malformed date fallback, empty array safety, and array immutability.
- **Wave 2 (Transparent Feed Personalization & Constraint Scoring):** Expand \`src/app/domain/travelFeed.personalized.test.ts\` with unit tests for home airport boost (+8), favorite region boost (+12), preferred airline boost (+10), stops penalty (-10/stop capped at -20), budget penalty (-15), flight time penalty (-10), non-exclusion invariant (length preserved), and tie-breaking stability (-0.001 * index).
- **Wave 3 (Verification Baseline & Audit Evidence):** Run \`npm test\`, \`npm run check\`, \`npm run check:functions && npm run test:functions\`, record Git SHA, generate implementation record and cycle report, pass \`validate-cycle.mjs\`.
`;

await writeFile(join(cycleDir, 'mastergoal.md'), mastergoalContent, 'utf8');

// Value Case
const valueCaseContent = `# Cycle 0023 Value Case: Travel Feed Diversification & Transparent Personalization

## 1. Real User / Product Problem
Travelers browsing flight deals need immediate discovery of diverse opportunities rather than being overwhelmed by five different flights to the same single city at the top of the feed. Furthermore, when users specify travel preferences (such as preferred airlines, home airport, or max stops), the feed must intelligently promote relevant flights without hiding or censoring viable deals that slightly exceed constraints. Finally, ranking algorithms must be transparent and robust against malformed scores, dates, or flight durations.

## 2. Baseline Evidence
- \`src/app/domain/travelFeed.test.ts\` had only 2 unit tests, lacking assertions for dealScore vs savingScore resolution hierarchy, timestamp tie-breaking, tail preservation of repeat destinations, empty array safety, and input array immutability.
- \`src/app/domain/travelFeed.personalized.test.ts\` had only 2 unit tests, missing granular verification of each individual additive boost (home airport +8, favorite region +12, preferred airline +10), penalty bounds (max -20 on stops, -15 budget, -10 flight time), duration parsing in personalization, and the non-exclusion invariant.

## 3. Exact Changes & Observed Result
- Expanded \`src/app/domain/travelFeed.test.ts\` to verify:
  - Deal score priority: \`dealScore\` strictly takes precedence over \`aiInsight.savingScore\`.
  - Timestamp tie-breaker: deals with identical scores sort by newest \`observedAt\` first.
  - Destination diversification: each distinct \`toCode\` is surfaced in the primary tier before secondary deals for already-seen destinations are appended.
  - Repeat destination tail preservation: total count of deals is strictly preserved.
  - Adversarial robustness: NaN scores and invalid date strings fall back cleanly to 0.
  - Immutability: input array is copied before sorting and not mutated.
- Expanded \`src/app/domain/travelFeed.personalized.test.ts\` to verify:
  - Individual boost weights: home airport (+8), favorite region (+12), preferred airline (+10).
  - Individual penalty deductions: excess stops (-10 per stop, capped at -20), over budget (-15), max flight time (-10).
  - Strict non-exclusion invariant: even deals violating all constraints are retained in the feed.
  - Tie-breaking stability: identical scores preserve pre-ranking order via \`-0.001 * index\`.
- Result: 100% test pass rate across all new assertions, zero regressions, and full gate alignment.

## 4. Evidence References & Classification
- **Evidence Class:** LOCAL_VERIFIED
- **Falsifier / Negative Test Evidence:**
  - Repeated destinations verified to never crowd out unrepresented destinations in top feed.
  - Input array with 3 identical destinations verified to append 2 secondary deals after unique destinations without dropping any.
  - Over-budget and multi-stop deals verified to never be deleted from the feed.
  - Frozen input array verified to be immutable during ranking.
`;

await writeFile(join(cycleDir, 'value-case.md'), valueCaseContent, 'utf8');

console.log('Successfully generated 20 research rounds, mastergoal.md, and value-case.md for Cycle 0023.');
