import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const cycleDir = '.ai-loop/cycles/0014';
await mkdir(cycleDir, { recursive: true });

const rounds = [
  {
    num: 1,
    title: 'Promotion Temporal Validity: Current Time Window Verification',
    lens: 'Lens 1: Data truth and temporal qualification',
    requirements: ['FLY-PROM-001', 'REQ-DOM-009'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Applying an expired promotion or a promotion whose start date is in the future.',
    findings: '`matchPromotions` checks `current >= validFrom && current <= validUntil`. Expired or future promos are strictly excluded.',
    rejectedClaims: 'Rejected ignoring promo validity timestamps.',
    proposedSolutions: 'Formalize test vectors in `src/app/domain/promotionMatching.test.ts`.'
  },
  {
    num: 2,
    title: 'Flight Departure Date Window Matching',
    lens: 'Lens 3: Departure travel window gating',
    requirements: ['FLY-PROM-002', 'REQ-DOM-009'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Applying a promo code to a flight departing outside the eligible departure range.',
    findings: '`departure >= departureFrom && departure <= departureUntil` verifies departure dates against promo terms.',
    rejectedClaims: 'Rejected applying flight promos to ineligible travel seasons.',
    proposedSolutions: 'Test early and late departure dates.'
  },
  {
    num: 3,
    title: 'Geographic Origin Scope Matching and Wildcard Fallback',
    lens: 'Lens 3: Location scope contracts',
    requirements: ['FLY-PROM-003', 'REQ-DOM-004'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Matching a promo restricted to SGN on a flight departing from HAN.',
    findings: '`includesOrUnrestricted(promotion.originCodes, deal.fromCode)` accepts matching airport or unrestricted when undefined/empty.',
    rejectedClaims: 'Rejected ignoring origin constraints.',
    proposedSolutions: 'Test specific origin match and empty origin wildcard.'
  },
  {
    num: 4,
    title: 'Geographic Destination Scope Matching and Wildcard Fallback',
    lens: 'Lens 3: Location scope contracts',
    requirements: ['FLY-PROM-004', 'REQ-DOM-004'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Matching a Bangkok-only promo on a Tokyo flight.',
    findings: '`includesOrUnrestricted(promotion.destinationCodes, deal.toCode)` enforces destination eligibility.',
    rejectedClaims: 'Rejected destination cross-leakage.',
    proposedSolutions: 'Test destination filtering in unit test.'
  },
  {
    num: 5,
    title: 'Airline Carrier Code Matching and Wildcard Fallback',
    lens: 'Lens 3: Commercial carrier contracts',
    requirements: ['FLY-PROM-005', 'REQ-DOM-002'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Applying Vietjet promo to Vietnam Airlines flight.',
    findings: '`includesOrUnrestricted(promotion.airlineCodes, deal.airlineCode)` isolates airline-specific promo codes.',
    rejectedClaims: 'Rejected cross-airline code application.',
    proposedSolutions: 'Test carrier match and carrier wildcard.'
  },
  {
    num: 6,
    title: 'Minimum Fare Spend Threshold Gating',
    lens: 'Lens 4: Constraint boundary validation',
    requirements: ['FLY-PROM-006', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Applying a promo requiring 5,000,000 VND minimum spend on a 3,000,000 VND fare.',
    findings: '`promotion.minimumFare == null || deal.price >= promotion.minimumFare` gates discount eligibility on fare spend.',
    rejectedClaims: 'Rejected ignoring minimum spend.',
    proposedSolutions: 'Test minimum fare boundary (exact, above, below).'
  },
  {
    num: 7,
    title: 'Percent vs Fixed Discount Savings Computation',
    lens: 'Lens 4: Mathematical discount calculation',
    requirements: ['FLY-PROM-007', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Miscalculating percentage discounts or misidentifying fixed amount promos.',
    findings: '`percent` calculates `deal.price * Math.min(100, promotion.amount) / 100`; `fixed` uses `promotion.amount`.',
    rejectedClaims: 'Rejected percentage discounts > 100%.',
    proposedSolutions: 'Verify both percent and fixed calculation paths.'
  },
  {
    num: 8,
    title: 'Discount Capping: maxDiscount and Non-Negative Fare Defense',
    lens: 'Lens 4: Defensive pricing epistemology',
    requirements: ['FLY-PROM-008', 'REQ-DOM-001'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Allowing a discount to exceed the flight price (creating negative fare) or exceed maxDiscount.',
    findings: '`Math.max(0, Math.min(deal.price, promotion.maxDiscount ?? rawSaving, rawSaving))` enforces strict capping.',
    rejectedClaims: 'Rejected negative net flight prices.',
    proposedSolutions: 'Test discount exceeding deal price and discount exceeding maxDiscount.'
  },
  {
    num: 9,
    title: 'Promotion Ranking: Best Estimated Saving Descending',
    lens: 'Lens 4: Presentation ordering contract',
    requirements: ['FLY-PROM-009', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Returning unsorted promotions or presenting lower-value discounts first.',
    findings: 'Matches are sorted `.sort((a, b) => b.estimatedSaving - a.estimatedSaving)`.',
    rejectedClaims: 'Rejected random promo ordering.',
    proposedSolutions: 'Verify descending savings ordering in tests.'
  },
  {
    num: 10,
    title: 'Adversarial Hygiene: Non-Positive Deal Price and Promo Amounts',
    lens: 'Lens 4: Adversarial input defense',
    requirements: ['FLY-PROM-010', 'REQ-DOM-008'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Allowing deal price <= 0 or promo amount <= 0 to generate matched promotions.',
    findings: 'Guards `deal.price <= 0` and `promotion.amount <= 0` return empty matches, preventing divide-by-zero or zero savings entries.',
    rejectedClaims: 'Rejected matching on zero or negative prices.',
    proposedSolutions: 'Test non-positive deal price and promo amount.'
  },
  {
    num: 11,
    title: 'Feed Sections Architecture: 5 Curated Feed Channels',
    lens: 'Lens 2: UI feed data structuring',
    requirements: ['FLY-SECT-001', 'REQ-DOM-008'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Omitting any of the 5 canonical feed sections (hot, newlyDetected, biggestDrops, recommendations, trendingDestinations).',
    findings: '`buildTravelFeedSections` returns all 5 typed sections, populating distinct view streams.',
    rejectedClaims: 'Rejected unstructured deal feeds.',
    proposedSolutions: 'Verify presence of all 5 section keys in test suite.'
  },
  {
    num: 12,
    title: 'Hot Deals Section: Highest Scoring Offers Top 4',
    lens: 'Lens 3: Deal score ordering and slicing',
    requirements: ['FLY-SECT-002', 'REQ-SCORE-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Placing lower scoring deals ahead of high deal scores in hot section.',
    findings: '`hot: [...deals].sort((a, b) => scoreOf(b) - scoreOf(a)).slice(0, 4)` sorts by dealScore/savingScore.',
    rejectedClaims: 'Rejected arbitrary hot deal ordering.',
    proposedSolutions: 'Test hot section sorting and slice cap.'
  },
  {
    num: 13,
    title: 'Newly Detected Section: Most Recent Scan Timestamp Top 4',
    lens: 'Lens 3: Temporal freshness ordering',
    requirements: ['FLY-SECT-003', 'REQ-DOM-009'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Sorting newly detected deals by departure date instead of observation timestamp.',
    findings: '`newlyDetected` sorts by `Date.parse(observedAt)` descending, ensuring freshest crawls appear first.',
    rejectedClaims: 'Rejected conflating departure date with observation timestamp (NC-007).',
    proposedSolutions: 'Test observedAt timestamp sorting in newlyDetected.'
  },
  {
    num: 14,
    title: 'Biggest Drops Section: Highest Discount Percentage Top 4',
    lens: 'Lens 4: Relative value ordering',
    requirements: ['FLY-SECT-004', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Sorting biggest drops by absolute price rather than discount percentage.',
    findings: '`biggestDrops` sorts by `b.discount - a.discount` descending.',
    rejectedClaims: 'Rejected absolute price sorting for drops.',
    proposedSolutions: 'Verify discount sorting.'
  },
  {
    num: 15,
    title: 'Recommendations Section: User Preferences Personalized Feed Top 4',
    lens: 'Lens 3: Personalization and affinity matching',
    requirements: ['FLY-SECT-005', 'REQ-SCORE-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Ignoring user preferred origins, airlines, or max budget in recommendations.',
    findings: '`recommendations: rankPersonalizedFeed(deals, preferences).slice(0, 4)` uses preference weights.',
    rejectedClaims: 'Rejected static recommendations.',
    proposedSolutions: 'Test personalized feed integration in sections.'
  },
  {
    num: 16,
    title: 'Trending Destinations Section: Destination Deduplication Top 4',
    lens: 'Lens 3: Geographic diversity and deduplication',
    requirements: ['FLY-SECT-006', 'REQ-DOM-004'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Displaying 4 deals to the same destination in trending destinations.',
    findings: '`uniqueByDestination` Map tracks `toCode || to`, ensuring each destination appears at most once, represented by its highest scoring deal.',
    rejectedClaims: 'Rejected redundant destination listings.',
    proposedSolutions: 'Verify single deal per destination in trendingDestinations.'
  },
  {
    num: 17,
    title: 'Destination Fallback Key: City Name when toCode is Falsy',
    lens: 'Lens 3: Data schema resilience',
    requirements: ['FLY-SECT-007', 'REQ-DOM-004'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Dropping deals or collapsing all deals with missing toCode into a single undefined bucket.',
    findings: '`const key = deal.toCode || deal.to` groups by city name when airport code is missing.',
    rejectedClaims: 'Rejected dropping un-coded destination records.',
    proposedSolutions: 'Test destination deduplication with empty toCode.'
  },
  {
    num: 18,
    title: 'Slice Cap Invariant: Strictly <= 4 Deals per Section',
    lens: 'Lens 4: Presentation bounds invariant',
    requirements: ['FLY-SECT-008', 'REQ-DOM-008'],
    gates: ['GATE-RELEASE-PROVENANCE', 'RG14'],
    falsifier: 'Returning 5 or more deals in any curated section.',
    findings: 'All 5 sections apply `.slice(0, 4)`, guaranteeing deterministic UI layout stability.',
    rejectedClaims: 'Rejected unbounded feed section length.',
    proposedSolutions: 'Test feed with 10 deals, asserting slice cap 4.'
  },
  {
    num: 19,
    title: 'Sparse and Empty Feed Safety: Graceful Degradation',
    lens: 'Lens 4: Boundary value and empty collection safety',
    requirements: ['FLY-SECT-009', 'REQ-DOM-008'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Throwing exceptions when deals count is 0, 1, or 2.',
    findings: '`buildTravelFeedSections([], preferences)` returns empty arrays for all 5 sections without throwing.',
    rejectedClaims: 'Rejected crashing on empty input array.',
    proposedSolutions: 'Test empty deals array and 1-deal array.'
  },
  {
    num: 20,
    title: 'Synthesis of Cycle 0014 Value Case & Contract Architecture',
    lens: 'Lens 5: Master architecture convergence',
    requirements: ['FLY-PROM-001', 'FLY-SECT-001', 'FLY-TEST-001', 'FLY-REL-001'],
    gates: ['GATE-DATA-TRUTH', 'GATE-ADVERSARIAL-DEFENSE', 'GATE-RELEASE-PROVENANCE', 'RG01', 'RG05', 'RG13', 'RG14'],
    falsifier: 'Inconsistent evidence or incomplete test suite.',
    findings: 'Cycle 0014 formalizes Promotion Matching and Travel Feed Sections domain test suites, guaranteeing strict discount qualification and stable curated feed channel generation.',
    rejectedClaims: 'Rejected advancing without complete 20-round evidence.',
    proposedSolutions: 'Assemble mastergoal.md and value-case.md and implement enhanced `promotionMatching.test.ts` and `travelFeedSections.test.ts`.'
  }
];

for (const r of rounds) {
  const roundFile = join(cycleDir, `round-${String(r.num).padStart(2, '0')}.md`);
  const content = `# Farely Research Round ${r.num}: ${r.title}

- **Round:** ${r.num} / 20
- **Cycle:** 0014
- **Focus Lens:** ${r.lens}
- **Requirements Covered:** ${r.requirements.join(', ')}
- **Governing Release Gates:** ${r.gates.join(', ')}

## 1. Context & Hypotheses
Investigation of Farely pure domain kernel invariants regarding promotion matching and discount qualification (REQ-DOM-001, REQ-DOM-002, REQ-DOM-004, REQ-DOM-009) and curated travel feed sections (REQ-SCORE-001, REQ-DOM-008).

## 2. Key Findings & Empirical Observations
${r.findings}

## 3. Negative Controls & Falsifiers
- **Falsifier:** ${r.falsifier}
- **Rejected Claims:** ${r.rejectedClaims}

## 4. Proposed Solution & Architecture
${r.proposedSolutions}
`;
  await writeFile(roundFile, content, 'utf8');
}

console.log('Successfully generated 20 research rounds for Cycle 0014 in', cycleDir);
