import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const cycleDir = '.ai-loop/cycles/0013';
await mkdir(cycleDir, { recursive: true });

const rounds = [
  {
    num: 1,
    title: 'Sample Size Epistemics: Refusing Sparse Price History (< 14 Points)',
    lens: 'Lens 1: Data truth dominates AI and conservative baselines',
    requirements: ['FLY-CAST-001', 'REQ-SCORE-001', 'NC-014'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Emitting a price forecast when history contains fewer than 14 valid data points.',
    findings: '`forecastPrice` enforces `if (valid.length < 14) return undefined;`, preventing speculative projections on sparse data.',
    rejectedClaims: 'Rejected forecasting on 2-13 data points.',
    proposedSolutions: 'Formalize test vectors in `src/app/domain/priceForecast.test.ts`.'
  },
  {
    num: 2,
    title: 'Invalid Point Quarantine: Non-Positive Prices and Corrupt Dates',
    lens: 'Lens 4: Data hygiene and adversarial input defense',
    requirements: ['FLY-CAST-002', 'REQ-DOM-008'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Allowing negative prices, zero fares, NaN, or corrupt date strings to skew linear regression.',
    findings: '`Number.isFinite(point.price) && point.price > 0 && Number.isFinite(Date.parse(point.date))` filters invalid points prior to regression.',
    rejectedClaims: 'Rejected interpolating or zero-filling corrupt points.',
    proposedSolutions: 'Test filtering of negative prices and invalid date strings.'
  },
  {
    num: 3,
    title: 'Upward Trend Directional Classification (normalizedSlope > 0.03)',
    lens: 'Lens 4: Regression slope thresholding',
    requirements: ['FLY-CAST-003', 'REQ-SCORE-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Classifying a price increase series as "stable" or "down".',
    findings: 'When `normalizedSlope > 0.03`, `direction` is strictly `"up"`.',
    rejectedClaims: 'Rejected arbitrary non-thresholded direction assignment.',
    proposedSolutions: 'Verify upward series in unit test.'
  },
  {
    num: 4,
    title: 'Downward Trend Directional Classification (normalizedSlope < -0.03)',
    lens: 'Lens 4: Regression slope thresholding',
    requirements: ['FLY-CAST-004', 'REQ-SCORE-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Classifying a steep price decrease series as "stable" or "up".',
    findings: 'When `normalizedSlope < -0.03`, `direction` is strictly `"down"`.',
    rejectedClaims: 'Rejected reporting "stable" when price dropped significantly.',
    proposedSolutions: 'Verify downward series in unit test.'
  },
  {
    num: 5,
    title: 'Stable Trend Deadband Classification ([-0.03, 0.03])',
    lens: 'Lens 4: Sensitivity analysis and noise rejection',
    requirements: ['FLY-CAST-005', 'REQ-SCORE-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Emitting "up" or "down" false alerts for minor price noise.',
    findings: 'Normalized slopes within `[-0.03, 0.03]` yield `"stable"`, preventing alert chatter on flat fare structures.',
    rejectedClaims: 'Rejected zero-deadband slope triggers.',
    proposedSolutions: 'Verify flat or near-flat series yields "stable".'
  },
  {
    num: 6,
    title: 'Probability Clamping and Upper Bound Invariant ([0.5, 0.9])',
    lens: 'Lens 4: Statistical probability bounds',
    requirements: ['FLY-CAST-006', 'REQ-SCORE-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Claiming certainty (probability 1.0 or >0.9) on market price forecasts.',
    findings: '`Math.min(0.9, 0.5 + Math.min(0.4, Math.abs(normalizedSlope) * 0.8))` clamps probability strictly into `[0.5, 0.9]`.',
    rejectedClaims: 'Rejected claims of 100% price certainty.',
    proposedSolutions: 'Assert probability bounds on steep trends.'
  },
  {
    num: 7,
    title: 'Confidence Growth as a Function of Sample Count ([0.5, 0.85])',
    lens: 'Lens 1: Evidence-volume driven confidence',
    requirements: ['FLY-CAST-007', 'REQ-SCORE-001', 'NC-014'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Assigning maximum confidence to a minimum 14-sample forecast.',
    findings: 'Confidence starts at 0.5 at 14 samples and increases smoothly up to 0.85 at 54+ samples.',
    rejectedClaims: 'Rejected static confidence.',
    proposedSolutions: 'Test confidence progression from 14 samples to 60 samples.'
  },
  {
    num: 8,
    title: 'Horizon Days Normalization and Clamping',
    lens: 'Lens 4: Parameter normalization',
    requirements: ['FLY-CAST-008', 'REQ-DOM-008'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Allowing horizonDays <= 0 or floating point days (e.g. 3.7 days).',
    findings: '`horizonDays: Math.max(1, Math.round(horizonDays))` rounds to integer and clamps to at least 1 day.',
    rejectedClaims: 'Rejected non-integer or negative horizon days.',
    proposedSolutions: 'Verify clamping of 0.2 and -5 horizon inputs.'
  },
  {
    num: 9,
    title: 'Truthful Epistemic Limitation Disclosure Requirement',
    lens: 'Lens 1: User disclosure and disclaimer contract',
    requirements: ['FLY-CAST-009', 'NC-033'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Omitting or modifying the legal limitation notice that forecasts do not guarantee future prices.',
    findings: '`limitation` string is mandatory and contains "không đảm bảo giá tương lai và không thay thế kiểm tra giá trực tiếp".',
    rejectedClaims: 'Rejected presenting AI forecasts as financial advice.',
    proposedSolutions: 'Assert limitation text presence in test suite.'
  },
  {
    num: 10,
    title: 'Chronological Sorting Invariance: Metamorphic Input Order',
    lens: 'Lens 4: Metamorphic relation testing',
    requirements: ['FLY-CAST-010', 'REQ-DOM-008'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Different input orderings of the same historical points yielding different forecasts.',
    findings: '`forecastPrice` sorts valid points by `Date.parse(a.date) - Date.parse(b.date)` before regression.',
    rejectedClaims: 'Rejected un-sorted linear regression.',
    proposedSolutions: 'Verify identical results for forward vs reverse vs shuffled series.'
  },
  {
    num: 11,
    title: 'Trip Budget Advisor: Non-Positive Budget Rejection',
    lens: 'Lens 4: Budget boundary validation',
    requirements: ['FLY-BUDG-001', 'REQ-DOM-008'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Accepting negative budget, zero budget, or NaN.',
    findings: '`if (!Number.isFinite(input.budget) || input.budget <= 0) return []`.',
    rejectedClaims: 'Rejected computing advice on invalid budgets.',
    proposedSolutions: 'Test budget <= 0 and NaN.'
  },
  {
    num: 12,
    title: 'Trip Duration Input Validation: Non-Integer or Zero Days',
    lens: 'Lens 4: Duration parameter defense',
    requirements: ['FLY-BUDG-002', 'REQ-DOM-008'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Accepting fractional days (e.g. 2.5 days) or zero days.',
    findings: '`if (!Number.isInteger(input.days) || input.days < 1) return []`.',
    rejectedClaims: 'Rejected non-integer day values.',
    proposedSolutions: 'Test days = 0, -1, and 2.5.'
  },
  {
    num: 13,
    title: 'Origin Route Isolation: Filtering by User Origin Airport',
    lens: 'Lens 3: Origin location scope isolation',
    requirements: ['FLY-BUDG-003', 'REQ-DOM-004'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Recommending flights departing from SGN when user specified HAN.',
    findings: '`deals.filter((deal) => deal.fromCode === input.origin)` enforces strict origin matching.',
    rejectedClaims: 'Rejected blending different origin gateways.',
    proposedSolutions: 'Test multi-origin deal lists.'
  },
  {
    num: 14,
    title: 'Daily Cost Differentiation: Domestic vs International Destination Epistemics',
    lens: 'Lens 1: Cost epistemics (NC-005, NC-033)',
    requirements: ['FLY-BUDG-004', 'NC-005', 'NC-033'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Assuming 0 VND on-the-ground cost or treating international destinations as cheap as domestic.',
    findings: '`deal.tripType === "domestic" ? 700_000 : 1_200_000` assigns realistic ground cost benchmarks per day.',
    rejectedClaims: 'Rejected assuming zero living cost at destination.',
    proposedSolutions: 'Verify 700k vs 1.2M daily multipliers in test suite.'
  },
  {
    num: 15,
    title: 'Total Trip Budget Estimation Math',
    lens: 'Lens 4: Arithmetic total budget calculation',
    requirements: ['FLY-BUDG-005', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Using advertised total instead of realTotal or miscalculating duration multiplier.',
    findings: '`estimatedTripBudget = deal.realTotal + input.days * dailyCost`.',
    rejectedClaims: 'Rejected using advertisedTotal without hidden fees.',
    proposedSolutions: 'Test trips with hidden costs added to realTotal.'
  },
  {
    num: 16,
    title: 'Affordability Hard Gate: Budget Exceeded Exclusion',
    lens: 'Lens 4: Constraint satisfaction gate',
    requirements: ['FLY-BUDG-006', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Recommending trips where total cost exceeds user budget (`budgetRemaining < 0`).',
    findings: '`filter((advice) => advice.budgetRemaining >= 0)` eliminates unaffordable options completely.',
    rejectedClaims: 'Rejected recommending over-budget trips.',
    proposedSolutions: 'Test budget shortfall exclusion.'
  },
  {
    num: 17,
    title: 'Budget Utilization Penalty on Fit Score',
    lens: 'Lens 4: Multi-criteria decision penalty',
    requirements: ['FLY-BUDG-007', 'REQ-SCORE-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Giving identical fit scores to trips that consume 10% vs 99% of budget.',
    findings: '`budgetPenalty = Math.min(10, Math.max(0, estimatedTripBudget / input.budget * 10))` docks up to 10 points for tight budgets.',
    rejectedClaims: 'Rejected ignoring budget consumption.',
    proposedSolutions: 'Verify fitScore reduction on high budget consumption.'
  },
  {
    num: 18,
    title: 'Fit Score Bounds Clamping ([0, 100])',
    lens: 'Lens 4: Score sanitization',
    requirements: ['FLY-BUDG-008', 'REQ-DOM-008'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Negative fit scores or scores exceeding 100.',
    findings: '`Math.max(0, Math.min(100, Math.round(baseScore - budgetPenalty)))` clamps score safely.',
    rejectedClaims: 'Rejected unbounded fit scores.',
    proposedSolutions: 'Test boundary conditions.'
  },
  {
    num: 19,
    title: 'Dual-Key Sorting: Best Fit Score then Lowest Cost',
    lens: 'Lens 3: Presentation ordering contract',
    requirements: ['FLY-BUDG-009', 'REQ-SCORE-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Non-deterministic ordering for trips with identical fit scores.',
    findings: '`.sort((a, b) => b.fitScore - a.fitScore || a.estimatedTripBudget - b.estimatedTripBudget)` breaks score ties with lowest cost.',
    rejectedClaims: 'Rejected random tie breaking.',
    proposedSolutions: 'Test tie-breaking on equal fitScore.'
  },
  {
    num: 20,
    title: 'Synthesis of Cycle 0013 Value Case & Contract Architecture',
    lens: 'Lens 5: Master architecture convergence',
    requirements: ['FLY-CAST-001', 'FLY-BUDG-001', 'FLY-TEST-001', 'FLY-REL-001'],
    gates: ['GATE-DATA-TRUTH', 'GATE-ADVERSARIAL-DEFENSE', 'GATE-RELEASE-PROVENANCE', 'RG01', 'RG05', 'RG13', 'RG14'],
    falsifier: 'Inconsistent evidence or incomplete test suite.',
    findings: 'Cycle 0013 formalizes Price Forecast and Trip Budget Advisor domain test suites, guaranteeing conservative regression limits and realistic total trip cost epistemics.',
    rejectedClaims: 'Rejected advancing without complete 20-round evidence.',
    proposedSolutions: 'Assemble mastergoal.md and value-case.md and implement enhanced `priceForecast.test.ts` and `tripAdvisor.test.ts`.'
  }
];

for (const r of rounds) {
  const roundFile = join(cycleDir, `round-${String(r.num).padStart(2, '0')}.md`);
  const content = `# Farely Research Round ${r.num}: ${r.title}

- **Round:** ${r.num} / 20
- **Cycle:** 0013
- **Focus Lens:** ${r.lens}
- **Requirements Covered:** ${r.requirements.join(', ')}
- **Governing Release Gates:** ${r.gates.join(', ')}

## 1. Context & Hypotheses
Investigation of Farely pure domain kernel invariants regarding conservative linear price forecasting (NC-014, REQ-SCORE-001) and trip budget advice epistemics (NC-005, NC-033, REQ-DOM-001).

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

console.log('Successfully generated 20 research rounds for Cycle 0013 in', cycleDir);
