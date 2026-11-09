import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const cycleDir = '.ai-loop/cycles/0025';
await mkdir(cycleDir, { recursive: true });

const rounds = [
  {
    num: 1,
    title: 'Epistemic Truth Invariant: Base Price as Indispensable KNOWN Component',
    lens: 'Lens 1: Cost epistemic classification and immutable observation grounding',
    requirements: ['REQ-COST-001', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Failing to include base price as a verified KNOWN component in true cost breakdown.',
    findings: '`evaluateTrueCost` always initializes components with category "fare", amount equal to basePrice, and state "KNOWN".',
    rejectedClaims: 'Rejected treating base ticket price as mutable or optional.',
    proposedSolutions: 'Assert base price invariance across all evaluation calls in `src/app/domain/costEpistemic.test.ts`.'
  },
  {
    num: 2,
    title: 'Budget Carrier Heuristic Estimation: Domestic vs International Surcharge',
    lens: 'Lens 2: Low-cost carrier baggage unbundling heuristics',
    requirements: ['REQ-COST-002', 'REQ-COST-004'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Assuming low-cost carrier tickets include baggage or reporting estimated baggage fees as fixed verified totals.',
    findings: 'LCCs (VJ, AK, FD, TR, 5J, SL, VU) default baggage to ESTIMATED with 280,000 VND for domestic and 450,000 VND for international.',
    rejectedClaims: 'Rejected claiming budget carrier unbundled services are included by default.',
    proposedSolutions: 'Assert domestic 280k and international 450k ESTIMATED baggage status for all LCC carrier codes.'
  },
  {
    num: 3,
    title: 'Negative Control: Legacy Carrier Identity Does Not Imply Free Baggage',
    lens: 'Lens 3: Carrier identity vs fare class reality (NC-005, NC-033)',
    requirements: ['REQ-COST-003', 'NC-033'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Marking baggage as KNOWN/included purely because the operating airline is Vietnam Airlines or Singapore Airlines.',
    findings: 'Modern legacy carriers offer "Lite/Super Saver" economy fares that unbundle checked baggage. Carrier identity alone requires UNKNOWN state.',
    rejectedClaims: 'Rejected hardcoding included baggage based solely on airline 2-letter IATA code.',
    proposedSolutions: 'Verify that VN, SQ, QH without explicit baggage inclusion flag evaluate baggageState as UNKNOWN with null amount.'
  },
  {
    num: 4,
    title: 'Explicit Baggage Inclusion Override: Truthful Verification Zero Amount',
    lens: 'Lens 4: Direct provider assertion verification',
    requirements: ['REQ-COST-001', 'REQ-COST-002'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Charging additional baggage estimate when the deal explicitly certifies baggage inclusion.',
    findings: 'When `isBaggageExplicitlyIncluded: true`, baggageState is set to KNOWN, amount is set to 0, and isBaggageIncluded is set to true.',
    rejectedClaims: 'Rejected heuristic penalties overriding verified ground truth.',
    proposedSolutions: 'Test explicit baggage inclusion on both LCC and legacy carriers.'
  },
  {
    num: 5,
    title: 'Multi-Format Provided Hidden Costs: Object Representation Normalization',
    lens: 'Lens 5: Ingestion contract robustness and schema polymorphism',
    requirements: ['REQ-COST-001', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Failing to parse providedHiddenCosts when supplied as an object map with baggageFee, paymentFee, airportTaxes.',
    findings: '`evaluateTrueCost` handles object parameter shape with baggageFee, paymentFee, and airportTaxes properties.',
    rejectedClaims: 'Rejected fragile single-format cost ingestion.',
    proposedSolutions: 'Assert exact ingestion of structured hidden cost object.'
  },
  {
    num: 6,
    title: 'Multi-Format Provided Hidden Costs: Array of Fee Items Normalization',
    lens: 'Lens 5: Ingestion contract robustness and Vietnamese token classification',
    requirements: ['REQ-COST-001', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Ignoring provided hidden cost array items labeled in Vietnamese ("hành lý", "thanh toán", "thuế").',
    findings: 'Array format iterates items, normalizes label strings to lowercase, and accurately extracts baggage, payment, and tax amounts.',
    rejectedClaims: 'Rejected English-only label matching in localized flight data.',
    proposedSolutions: 'Assert array format extracts baggageFee, paymentFee, and airportTaxes accurately from Vietnamese labels.'
  },
  {
    num: 7,
    title: 'Negative Control NC-033: Unverified Mandatory Taxes Must Be UNKNOWN, Never Zero',
    lens: 'Lens 3: Epistemic integrity on mandatory governmental and airport charges',
    requirements: ['REQ-COST-003', 'NC-033'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Displaying 0 VND taxes and fees when tax data has not been provided or verified.',
    findings: 'In the absence of providerVerifiedAllIn or airportTaxes, taxes_and_fees status is set to UNKNOWN with null amount and mandatory: true.',
    rejectedClaims: 'Rejected defaulting missing mandatory fee values to zero.',
    proposedSolutions: 'Assert tax fee is UNKNOWN with amount === null and hasUnknownMandatoryCost === true.'
  },
  {
    num: 8,
    title: 'Provider Verified All-In Exemption: Zero Mandatory Tax Assertion',
    lens: 'Lens 4: Verified contract handling',
    requirements: ['REQ-COST-005', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Flagging unknown taxes when provider has formally certified all-in pricing.',
    findings: '`providerVerifiedAllIn: true` sets taxes_and_fees to KNOWN with amount: 0, satisfying all-in contract without unknown penalty.',
    rejectedClaims: 'Rejected treating all-in verified feeds as ambiguous.',
    proposedSolutions: 'Assert providerVerifiedAllIn eliminates unknown tax status.'
  },
  {
    num: 9,
    title: 'Total Label Epistemic Gate: "Tổng ước tính" vs "Tổng chi phí"',
    lens: 'Lens 1: Consumer communication and transparent disclosure',
    requirements: ['REQ-COST-002', 'REQ-COST-004'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Presenting an estimated total as a definitive final payable price ("Tổng thực tế phải trả" or "Tổng chi phí").',
    findings: 'When any mandatory fee or baggage remains UNKNOWN, `totalLabel` is strictly "Tổng ước tính". Only when all mandatory costs are KNOWN does it become "Tổng chi phí".',
    rejectedClaims: 'Rejected deceptive finality claims on estimated or incomplete pricing.',
    proposedSolutions: 'Assert label transition from "Tổng ước tính" to "Tổng chi phí" based on known state completeness.'
  },
  {
    num: 10,
    title: 'Pricing Transparency Disclaimer: Bounded Disclosure Text Generation',
    lens: 'Lens 1: Regulatory and consumer protection disclosure',
    requirements: ['REQ-COST-002', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Emitting confident all-in disclaimers when mandatory fees are unknown.',
    findings: '`pricingTransparencyDisclaimer` switches between caveat warning and all-inclusive confirmation based on `hasUnknownMandatoryCost`.',
    rejectedClaims: 'Rejected static generic disclaimers.',
    proposedSolutions: 'Test disclaimer content under both complete and incomplete fee conditions.'
  },
  {
    num: 11,
    title: 'Destination Insights: Grouping Deals by Destination Airport Code',
    lens: 'Lens 6: Multi-deal aggregation by geographic endpoint',
    requirements: ['REQ-DOM-001', 'REQ-DOM-004'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Splitting deals for the same airport code across multiple insight entries.',
    findings: '`buildDestinationInsights` indexes deals by `toCode || to`, grouping all opportunities targeting the same destination together.',
    rejectedClaims: 'Rejected fragmented per-flight insight rows.',
    proposedSolutions: 'Assert deals for BKK are grouped into a single DestinationInsight record.'
  },
  {
    num: 12,
    title: 'Destination Insights: Fallback to Destination Name When toCode Missing',
    lens: 'Lens 6: Resilient schema fallback',
    requirements: ['REQ-DOM-001', 'REQ-DOM-004'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Dropping or crashing on deals with null or missing toCode.',
    findings: '`key = deal.toCode || deal.to` safely handles legacy rows missing IATA codes.',
    rejectedClaims: 'Rejected dropping valid deals that lack formal airport code.',
    proposedSolutions: 'Test deals with empty toCode are grouped by destination city name.'
  },
  {
    num: 13,
    title: 'Top Deal Selection: Strict DealScore Dominance Over SavingScore',
    lens: 'Lens 7: Deal quality hierarchy and score precedence',
    requirements: ['REQ-DOM-001', 'FLY-FEED-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Selecting a deal with lower dealScore because its aiInsight.savingScore is higher.',
    findings: 'Comparator `(b.dealScore ?? b.aiInsight.savingScore) - (a.dealScore ?? a.aiInsight.savingScore)` guarantees primary dealScore dominance.',
    rejectedClaims: 'Rejected letting secondary heuristic scores eclipse verified dealScore.',
    proposedSolutions: 'Assert topDeal reflects deal with highest dealScore regardless of savingScore.'
  },
  {
    num: 14,
    title: 'Cheapest Price Computation: Minimum RealTotal Across Cohort',
    lens: 'Lens 6: Accurate minimum fare calculation',
    requirements: ['REQ-DOM-001', 'REQ-DOM-004'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Reporting advertised base price instead of real total cost as cheapest price.',
    findings: '`cheapestPrice: Math.min(...destinationDeals.map((deal) => deal.realTotal))` computes true minimum real payable price.',
    rejectedClaims: 'Rejected using unverified advertised price for cheapest destination threshold.',
    proposedSolutions: 'Assert cheapestPrice equals minimum realTotal among all destination deals.'
  },
  {
    num: 15,
    title: 'Average Discount Computation: Accurate Arithmetic Mean',
    lens: 'Lens 6: Statistical aggregation accuracy',
    requirements: ['REQ-DOM-001', 'REQ-DOM-004'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Miscalculating average discount across diverse destination deals.',
    findings: '`averageDiscount = destinationDeals.reduce((sum, deal) => sum + deal.discount, 0) / destinationDeals.length`.',
    rejectedClaims: 'Rejected rounding or truncating average discount prematurely.',
    proposedSolutions: 'Assert average discount computes arithmetic mean across all cohort deals.'
  },
  {
    num: 16,
    title: 'Weekend Deal Detection: Accurate Saturday and Sunday Classification',
    lens: 'Lens 8: Temporal feature extraction and weekend travel intent',
    requirements: ['REQ-DOM-001', 'REQ-DOM-009'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Marking weekday-only flights as weekend deals, or missing Saturday/Sunday departure deals.',
    findings: '`[0, 6].includes(new Date(deal.departDate).getDay())` tests Sunday (0) and Saturday (6).',
    rejectedClaims: 'Rejected heuristic Friday afternoon approximations without explicit weekend flags.',
    proposedSolutions: 'Test isolated Saturday, Sunday, and weekday departures for correct boolean flag.'
  },
  {
    num: 17,
    title: 'Destination Insight Sorting: Descending BestDealScore Order',
    lens: 'Lens 7: Global feed curation hierarchy',
    requirements: ['REQ-DOM-001', 'FLY-FEED-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Returning unsorted or alphabetically ordered destination insights.',
    findings: 'Results are sorted `.sort((a, b) => b.bestDealScore - a.bestDealScore)` descending.',
    rejectedClaims: 'Rejected arbitrary destination ordering.',
    proposedSolutions: 'Assert insights array is strictly monotonically non-increasing by bestDealScore.'
  },
  {
    num: 18,
    title: 'Edge Case Safety: Empty Input Array Handling',
    lens: 'Lens 9: Boundary defenses and empty inventory resilience',
    requirements: ['REQ-DOM-001', 'GATE-ADVERSARIAL-DEFENSE'],
    gates: ['GATE-RESILIENCE', 'RG01'],
    falsifier: 'Throwing exceptions when given an empty deals collection.',
    findings: '`buildDestinationInsights([])` immediately returns `[]` without error or division by zero.',
    rejectedClaims: 'Rejected unsafe assumptions of non-empty collections.',
    proposedSolutions: 'Assert empty array returns empty insights array.'
  },
  {
    num: 19,
    title: 'Pure Domain Immutability: Zero Mutation of Deal Arrays',
    lens: 'Lens 9: Referential transparency and functional purity',
    requirements: ['REQ-DOM-001', 'GATE-DATA-TRUTH'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Mutating input deal objects or the containing array during insight generation.',
    findings: 'Uses non-destructive Map grouping and spread operators `[...destinationDeals]` before sorting.',
    rejectedClaims: 'Rejected in-place mutation patterns.',
    proposedSolutions: 'Pass `Object.freeze` protected deal arrays and verify zero mutations.'
  },
  {
    num: 20,
    title: 'Cross-Boundary Architecture: Zero Shadow Logic in Cost & Insights',
    lens: 'Lens 10: Single semantic authority architecture (NODE TK-08)',
    requirements: ['REQ-COST-001', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Re-implementing disparate cost estimation or insight extraction logic in UI components.',
    findings: '`src/app/domain/costEpistemic.ts` delegates directly to pure kernel `src/domain/farely/costEpistemics.ts`.',
    rejectedClaims: 'Rejected duplicate business logic in presentation components.',
    proposedSolutions: 'Assert identical evaluation outcomes between facade and kernel.'
  }
];

for (const round of rounds) {
  const content = `# Research Round ${String(round.num).padStart(2, '0')}: ${round.title}

- **Round Number:** ${round.num}
- **Evaluation Lens:** ${round.lens}
- **Requirements Traced:** ${round.requirements.join(', ')}
- **Release & Runtime Gates:** ${round.gates.join(', ')}

## 1. Ground Truth Observation
${round.findings}

## 2. Falsification Surface
- **Falsifier:** ${round.falsifier}
- **Rejected Claims:** ${round.rejectedClaims}

## 3. Implementation Invariant
- **Proposed Solution:** ${round.proposedSolutions}
`;

  await writeFile(join(cycleDir, `round-${String(round.num).padStart(2, '0')}.md`), content, 'utf8');
}

const mastergoal = `# Cycle 0025 Master Goal: Cost Epistemics & Destination Insights Suites

## Strategic Objective
Harden Farely's epistemic cost evaluation engine and destination insight aggregation against false certainty, hidden fees, and data mutation. Ensure complete test coverage for multi-format hidden fee normalization, carrier-specific baggage heuristics, legacy carrier negative controls (NC-033), explicit baggage inclusions, provider-verified all-in exemptions, dynamic total labelling, and destination grouping invariants (Saturday/Sunday weekend detection, minimum realTotal, and bestDealScore descending sort).

## Work Packages
- **WP01: Cost Epistemics & Mandatory Fee Invariants Test Suite:**
  - Enhance \`src/app/domain/costEpistemic.test.ts\` and \`src/domain/farely/costEpistemics.test.ts\` to verify array/object \`providedHiddenCosts\` normalization, carrier-specific baggage heuristics (VJ, AK, FD, TR, 5J, SL, VU), legacy carrier negative control (VN, SQ, QH unverified baggage remains UNKNOWN), provider verified all-in zero tax status, mandatory fee completeness, and "Tổng ước tính" vs "Tổng chi phí" labelling invariants.
- **WP02: Destination Insights & Geo Aggregation Test Suite:**
  - Enhance \`src/app/domain/destinationInsights.test.ts\` to verify multi-destination grouping, \`toCode\` fallback to \`to\`, \`dealScore\` precedence over \`savingScore\`, accurate arithmetic mean discount, weekend detection (Saturday/Sunday vs weekdays), pure immutability on frozen collections, and descending \`bestDealScore\` ordering.
- **WP03: Baseline Quality & Verification Verification:**
  - Execute full test suites (\`npm test\`, \`npm run check\`, \`npm run check:functions\`, \`npm run test:functions\`, \`git diff --check\`).
`;

await writeFile(join(cycleDir, 'mastergoal.md'), mastergoal, 'utf8');

const valueCase = `# Cycle 0025 Value Case: Transparent Pricing & Destination Intelligence

## Context & Value Proposition
Travelers face persistent deceptive pricing practices across online flight booking platforms, including omitted baggage fees, unverified airport taxes presented as "included", and vague total cost claims. Furthermore, travelers seeking inspiration need accurate geographic aggregation of flight deals by destination, including true minimum all-in prices and reliable weekend departure detection.

## Value Pillars
1. **Epistemic Pricing Truth (REQ-COST-001..005, NC-033):**
   - Distinguishes KNOWN, ESTIMATED, OPTIONAL, and UNKNOWN fee components.
   - Unknown mandatory costs are NEVER displayed as zero.
   - Low-cost carriers automatically receive estimated baggage surcharges (280k domestic, 450k international).
   - Carrier identity alone does not imply free baggage without fare class evidence.
2. **Actionable Destination Aggregation (REQ-DOM-001, REQ-DOM-004, REQ-DOM-009):**
   - Groups deals by destination with verified cheapest \`realTotal\` price.
   - Distinguishes genuine weekend departures (Saturday/Sunday) from weekday flights.
   - Orders destinations by verified \`bestDealScore\`.
3. **Architectural Purity (NODE TK-08):**
   - Zero duplicate business logic between domain facade and domain kernel.
`;

await writeFile(join(cycleDir, 'value-case.md'), valueCase, 'utf8');

console.log('Successfully generated cycle 0025 research rounds, mastergoal, and value-case.');
