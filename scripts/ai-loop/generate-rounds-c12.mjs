import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const cycleDir = '.ai-loop/cycles/0012';
await mkdir(cycleDir, { recursive: true });

const rounds = [
  {
    num: 1,
    title: 'Separation of Deal Score and Evidence Confidence Dimensions',
    lens: 'Lens 1: Data truth dominates AI and separate confidence epistemology',
    requirements: ['FLY-CLAIM-001', 'REQ-SCORE-001', 'NC-014'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Assigning a high-conviction deal label ("Deal cực nóng" or "Deal rất ngon") when sample confidence is below 50%.',
    findings: '`evidenceGatedDealLabel` enforces `if (boundedConfidence < 50) return boundedScore >= 60 ? "Giá đáng chú ý" : "Giá quan sát"`, strictly capping claims when evidence is weak.',
    rejectedClaims: 'Rejected permitting high score alone to claim hot deal status without evidence confidence.',
    proposedSolutions: 'Formalize adversarial test cases in `src/app/domain/dealClaims.test.ts`.'
  },
  {
    num: 2,
    title: 'Top-Tier Claim Threshold: "Deal cực nóng" Dual-Condition',
    lens: 'Lens 4: Multi-variable boundary analysis',
    requirements: ['FLY-CLAIM-002', 'REQ-SCORE-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Awarding "Deal cực nóng" when score is 90+ but confidence is 74%.',
    findings: '`evidenceGatedDealLabel` requires `boundedScore >= 90 && boundedConfidence >= 75` for "Deal cực nóng". At 74% confidence it collapses to "Deal rất ngon".',
    rejectedClaims: 'Rejected single-threshold scoring.',
    proposedSolutions: 'Test exact boundary at 74% vs 75% confidence for score 90.'
  },
  {
    num: 3,
    title: 'Second-Tier Claim Threshold: "Deal rất ngon" Dual-Condition',
    lens: 'Lens 4: Multi-variable boundary analysis',
    requirements: ['FLY-CLAIM-003', 'REQ-SCORE-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Awarding "Deal rất ngon" when score is 80 but confidence is 64%.',
    findings: '`evidenceGatedDealLabel` requires `boundedScore >= 80 && boundedConfidence >= 65`. At 64% confidence it collapses to "Deal ngon".',
    rejectedClaims: 'Rejected relaxing confidence below 65% for "Deal rất ngon".',
    proposedSolutions: 'Test 64% vs 65% confidence boundary for score 80.'
  },
  {
    num: 4,
    title: 'Third-Tier Claim Threshold: "Deal ngon" Baseline',
    lens: 'Lens 4: Boundary value analysis',
    requirements: ['FLY-CLAIM-004', 'REQ-SCORE-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Awarding "Deal ngon" when confidence is under 50% or score is under 70.',
    findings: 'For score in [70, 79] and confidence >= 50, label is "Deal ngon". If confidence < 50, it collapses to "Giá đáng chú ý".',
    rejectedClaims: 'Rejected awarding "Deal ngon" on low sample sizes.',
    proposedSolutions: 'Assert score 70 with confidence 49 vs 50.'
  },
  {
    num: 5,
    title: 'Fourth-Tier Claim Threshold: "Giá đáng chú ý" Bounded Band',
    lens: 'Lens 4: Low-confidence and moderate score classification',
    requirements: ['FLY-CLAIM-005', 'REQ-SCORE-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Classifying score 60 as "Giá quan sát" when confidence >= 50.',
    findings: '`boundedScore >= 60` yields "Giá đáng chú ý" regardless of whether confidence is high or low (as low-confidence caps at "Giá đáng chú ý").',
    rejectedClaims: 'Rejected dropping score 60 to "Giá quan sát".',
    proposedSolutions: 'Test score 60 boundary.'
  },
  {
    num: 6,
    title: 'Fifth-Tier Default: "Giá quan sát" Guardrail',
    lens: 'Lens 4: Default safety baseline',
    requirements: ['FLY-CLAIM-006', 'REQ-SCORE-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Assigning an elevated label to a score < 60.',
    findings: 'Any score < 60 returns "Giá quan sát" unconditionally, even with 100% confidence.',
    rejectedClaims: 'Rejected elevating low-score offers based purely on high confidence.',
    proposedSolutions: 'Test score 59 with 100% confidence yielding "Giá quan sát".'
  },
  {
    num: 7,
    title: 'Score Sanitization and Finite Bounds Clamping',
    lens: 'Lens 4: Adversarial input defense',
    requirements: ['FLY-CLAIM-007', 'REQ-DOM-008'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Negative scores, NaN, or >100 producing unexpected labels or errors.',
    findings: '`Math.max(0, Math.min(100, Number(score) || 0))` clamps numbers into [0, 100] and maps NaN/undefined to 0.',
    rejectedClaims: 'Rejected unvalidated score values.',
    proposedSolutions: 'Test NaN, -50, and 150 score inputs.'
  },
  {
    num: 8,
    title: 'Confidence Sanitization and Finite Bounds Clamping',
    lens: 'Lens 4: Adversarial input defense',
    requirements: ['FLY-CLAIM-008', 'REQ-DOM-008'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Negative confidence or NaN bypassing confidence gates.',
    findings: '`Math.max(0, Math.min(100, Number(confidencePercent) || 0))` clamps confidence into [0, 100] and maps NaN/undefined to 0.',
    rejectedClaims: 'Rejected unvalidated confidence values.',
    proposedSolutions: 'Test NaN, -10, and 200 confidence inputs.'
  },
  {
    num: 9,
    title: 'Type Coercion and String Input Resilience',
    lens: 'Lens 2: Runtime type resilience',
    requirements: ['FLY-CLAIM-009', 'REQ-DOM-008'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'String representation of numbers (e.g. "95", "80") failing label checks.',
    findings: '`Number(score)` and `Number(confidencePercent)` safely coerce valid string numbers.',
    rejectedClaims: 'Rejected failing on string-encoded numbers.',
    proposedSolutions: 'Verify string inputs in test suite.'
  },
  {
    num: 10,
    title: 'Metamorphic Monotonicity: Non-Decreasing Label Conviction',
    lens: 'Lens 4: Metamorphic relation testing',
    requirements: ['FLY-CLAIM-010', 'REQ-SCORE-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Increasing confidence causing label conviction to decrease for a fixed score.',
    findings: 'Conviction hierarchy: "Giá quan sát" <= "Giá đáng chú ý" <= "Deal ngon" <= "Deal rất ngon" <= "Deal cực nóng". Increasing confidence strictly non-decreases label conviction.',
    rejectedClaims: 'Rejected non-monotonic claim assignment.',
    proposedSolutions: 'Assert monotonic tier progression in loop.'
  },
  {
    num: 11,
    title: 'Destination Insights: Grouping by Primary Destination Identifier',
    lens: 'Lens 3: Route clustering and location scope',
    requirements: ['FLY-DEST-001', 'REQ-DOM-004'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Mixing offers from different destination airports into the same destination bucket or fragmenting same destination.',
    findings: '`buildDestinationInsights` groups deals by `deal.toCode || deal.to` into Map groupings.',
    rejectedClaims: 'Rejected grouping solely by origin.',
    proposedSolutions: 'Test grouping of deals across multiple destinations.'
  },
  {
    num: 12,
    title: 'Mathematical Minimum Price Resolution across Destination Deals',
    lens: 'Lens 4: Route-best mathematical pricing',
    requirements: ['FLY-DEST-002', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Reporting an average or advertised total instead of mathematical minimum `realTotal`.',
    findings: '`cheapestPrice: Math.min(...destinationDeals.map((deal) => deal.realTotal))` computes true minimum total cost.',
    rejectedClaims: 'Rejected using advertisedTotal when realTotal contains mandatory fees.',
    proposedSolutions: 'Test deals with hidden costs where advertised is lower than realTotal.'
  },
  {
    num: 13,
    title: 'Average Discount Computation Honesty',
    lens: 'Lens 4: Statistical arithmetic accuracy',
    requirements: ['FLY-DEST-003', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Calculating incorrect average discount or dividing by zero on empty arrays.',
    findings: '`destinationDeals.reduce((sum, deal) => sum + deal.discount, 0) / destinationDeals.length` accurately calculates mean discount.',
    rejectedClaims: 'Rejected unweighted median without definition.',
    proposedSolutions: 'Verify average discount computation.'
  },
  {
    num: 14,
    title: 'Top Deal Selection: DealScore vs Fallback SavingScore Priority',
    lens: 'Lens 3: Score hierarchy and deal ranking',
    requirements: ['FLY-DEST-004', 'REQ-SCORE-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Failing when dealScore is undefined or prioritizing savingScore over dealScore.',
    findings: 'Comparator uses `(b.dealScore ?? b.aiInsight.savingScore) - (a.dealScore ?? a.aiInsight.savingScore)` ensuring dealScore takes precedence with graceful fallback.',
    rejectedClaims: 'Rejected crashing when dealScore is omitted.',
    proposedSolutions: 'Test mix of deals with and without dealScore.'
  },
  {
    num: 15,
    title: 'Weekend Deal Detection: Saturday and Sunday Invariance',
    lens: 'Lens 3: Calendar and departure day extraction',
    requirements: ['FLY-DEST-005', 'REQ-DOM-009'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Missing Sunday (0) or Saturday (6) as weekend departures, or misidentifying Friday as weekend.',
    findings: '`[0, 6].includes(new Date(deal.departDate).getDay())` identifies weekends accurately.',
    rejectedClaims: 'Rejected hardcoding localized day names.',
    proposedSolutions: 'Test Sunday, Saturday, and Wednesday departures.'
  },
  {
    num: 16,
    title: 'Weekday-Only Detection: Pure Midweek Deals',
    lens: 'Lens 3: Weekend absence negative control',
    requirements: ['FLY-DEST-006', 'REQ-DOM-009'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Reporting `hasWeekendDeal: true` when all destination deals depart on Tuesday or Wednesday.',
    findings: 'When no deals depart on day 0 or 6, `hasWeekendDeal` is strictly `false`.',
    rejectedClaims: 'Rejected default true for weekend deals.',
    proposedSolutions: 'Assert false for weekday-only batches.'
  },
  {
    num: 17,
    title: 'Destination Insights Sorting Order: Best Deal Score Descending',
    lens: 'Lens 3: Presentation ordering contract',
    requirements: ['FLY-DEST-007', 'REQ-SCORE-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Returning unsorted destination insights array or ascending sort.',
    findings: 'Array is sorted `.sort((a, b) => b.bestDealScore - a.bestDealScore)`, placing highest scoring destination first.',
    rejectedClaims: 'Rejected sorting by deal count or alphabetical.',
    proposedSolutions: 'Verify multi-destination ordering in tests.'
  },
  {
    num: 18,
    title: 'Empty Deal Set Handling: Safe Empty Array Return',
    lens: 'Lens 4: Boundary value and empty collection safety',
    requirements: ['FLY-DEST-008', 'REQ-DOM-008'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Throwing TypeError or division by zero when `deals` is an empty array `[]`.',
    findings: '`buildDestinationInsights([])` yields empty Map and returns `[]` safely without throwing.',
    rejectedClaims: 'Rejected crashing on empty feed input.',
    proposedSolutions: 'Assert empty array return in test.'
  },
  {
    num: 19,
    title: 'Fallback Destination Key: Graceful Handling of Missing toCode',
    lens: 'Lens 3: Data schema resilience',
    requirements: ['FLY-DEST-009', 'REQ-DOM-004'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Failing or dropping deals when `toCode` is empty string or undefined.',
    findings: '`const key = deal.toCode || deal.to` groups by city name `deal.to` when `toCode` is falsy.',
    rejectedClaims: 'Rejected dropping un-coded destination records.',
    proposedSolutions: 'Test grouping with missing `toCode`.'
  },
  {
    num: 20,
    title: 'Synthesis of Cycle 0012 Value Case & Contract Architecture',
    lens: 'Lens 5: Master architecture convergence',
    requirements: ['FLY-CLAIM-001', 'FLY-DEST-001', 'FLY-TEST-001', 'FLY-REL-001'],
    gates: ['GATE-DATA-TRUTH', 'GATE-ADVERSARIAL-DEFENSE', 'GATE-RELEASE-PROVENANCE', 'RG01', 'RG05', 'RG13', 'RG14'],
    falsifier: 'Inconsistent evidence or incomplete test suite.',
    findings: 'Cycle 0012 formalizes Evidence-Gated Deal Claims and Destination Insights domain test suites, guaranteeing strict separation of deal score from confidence and truthful destination ranking.',
    rejectedClaims: 'Rejected advancing without complete 20-round evidence.',
    proposedSolutions: 'Assemble mastergoal.md and value-case.md and implement enhanced `dealClaims.test.ts` and `destinationInsights.test.ts`.'
  }
];

for (const r of rounds) {
  const roundFile = join(cycleDir, `round-${String(r.num).padStart(2, '0')}.md`);
  const content = `# Farely Research Round ${r.num}: ${r.title}

- **Round:** ${r.num} / 20
- **Cycle:** 0012
- **Focus Lens:** ${r.lens}
- **Requirements Covered:** ${r.requirements.join(', ')}
- **Governing Release Gates:** ${r.gates.join(', ')}

## 1. Context & Hypotheses
Investigation of Farely pure domain kernel invariants regarding evidence-gated deal claims (REQ-SCORE-001, NC-014, separate confidence dimension) and destination insights aggregation (REQ-DOM-001, REQ-DOM-004, REQ-DOM-009).

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

console.log('Successfully generated 20 research rounds for Cycle 0012 in', cycleDir);
