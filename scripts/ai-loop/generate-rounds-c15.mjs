import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const cycleDir = '.ai-loop/cycles/0015';
await mkdir(cycleDir, { recursive: true });

const rounds = [
  {
    num: 1,
    title: 'Comparable Cohort Extraction: Multi-Dimensional Slice Criteria',
    lens: 'Lens 1: Evidence epistemology and fair comparison criteria',
    requirements: ['FLY-COH-001', 'REQ-DOM-004', 'NC-014'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Comparing a direct peak-season flight to a connecting off-season flight or 1-way to round-trip.',
    findings: '`extractCohortCriteria` segments by origin, destination, tripType, departMonth, stopsClass, and durationDaysBucket, guaranteeing apples-to-apples cohorts.',
    rejectedClaims: 'Rejected global route comparisons without seasonal or stop classification.',
    proposedSolutions: 'Formalize test vectors in `src/app/domain/opportunityCohort.test.ts`.'
  },
  {
    num: 2,
    title: 'Round-Trip Duration Bucketing: Short, Medium, Long Horizons',
    lens: 'Lens 3: Temporal trip length categorization',
    requirements: ['FLY-COH-002', 'REQ-DOM-009'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Comparing a 3-day weekend getaway to a 30-day extended vacation.',
    findings: '`computeDurationDays` categorizes round-trips into `<= 4` (short), `5-8` (medium), and `> 8` (long).',
    rejectedClaims: 'Rejected mixing short weekend trips with long stay vacations in the same cohort.',
    proposedSolutions: 'Verify duration bucket boundaries in unit tests.'
  },
  {
    num: 3,
    title: 'One-Way Trip Cohort Isolation',
    lens: 'Lens 3: Trip type isolation',
    requirements: ['FLY-COH-003', 'REQ-DOM-004'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Assigning a duration bucket to a one-way flight.',
    findings: 'One-way flights have `durationDaysBucket: undefined` and do not match round-trip cohorts.',
    rejectedClaims: 'Rejected cross-contamination between one-way and round-trip cohorts.',
    proposedSolutions: 'Test one-way cohort key generation.'
  },
  {
    num: 4,
    title: 'Cohort Key Determinism and Colon-Delimited Structure',
    lens: 'Lens 4: Structured identifier formatting',
    requirements: ['FLY-COH-004', 'REQ-DOM-008'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Inconsistent cohort key formatting causing cache and evaluation misses.',
    findings: '`buildCohortKey` produces uppercase colon-separated string: `ORIGIN:DEST:TRIPTYPE:MONTH:STOPS[:DURATION]`.',
    rejectedClaims: 'Rejected unstructured cohort definitions.',
    proposedSolutions: 'Assert exact string format in tests.'
  },
  {
    num: 5,
    title: 'Sufficiency Hard Gate: Sparse Cohort Rejection (< 5 Observations)',
    lens: 'Lens 1: Statistical sufficiency and outlier defense (NC-014)',
    requirements: ['FLY-COH-005', 'REQ-SCORE-001', 'NC-014'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Claiming a deal discount or calculating a median baseline on fewer than 5 observations.',
    findings: 'When `sampleSize < 5`, `isSufficient: false`, `cohortMedian: null`, and `deltaPercent: null`.',
    rejectedClaims: 'Rejected claiming deals on 1-4 observations.',
    proposedSolutions: 'Test sample size 1 through 4 negative controls.'
  },
  {
    num: 6,
    title: 'Median Calculation Parity: Odd vs Even Cohort Sizes',
    lens: 'Lens 4: Mathematical median definition',
    requirements: ['FLY-COH-006', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Calculating incorrect median for even sample sizes (e.g. failing to average middle two values).',
    findings: '`calculateMedian` returns middle element for odd length, and average of middle two for even length.',
    rejectedClaims: 'Rejected mean substitution for median.',
    proposedSolutions: 'Test odd and even size arrays.'
  },
  {
    num: 7,
    title: 'Discount Qualification Threshold (deltaPercent >= 15%)',
    lens: 'Lens 1: Deal qualification semantics',
    requirements: ['FLY-COH-007', 'REQ-SCORE-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Marking a 10% price drop as `isDiscounted: true`.',
    findings: '`isDiscounted: delta >= 15` strictly requires at least 15% discount below cohort median.',
    rejectedClaims: 'Rejected marking trivial sub-15% drops as discounted.',
    proposedSolutions: 'Test 14% vs 15% discount boundary.'
  },
  {
    num: 8,
    title: 'Evidence Tiering: STRONG Tier Verification',
    lens: 'Lens 1: High conviction multi-dimensional evidence',
    requirements: ['FLY-COH-008', 'REQ-SCORE-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Awarding STRONG tier when scan epochs < 3 or freshness > 180 minutes.',
    findings: 'STRONG requires `sampleSize >= 12 && scanEpochCount >= 3 && freshnessMinutes <= 180`.',
    rejectedClaims: 'Rejected awarding strong evidence to single-epoch massive scans.',
    proposedSolutions: 'Test multi-epoch and freshness requirements.'
  },
  {
    num: 9,
    title: 'Evidence Tiering: MODERATE Tier Verification',
    lens: 'Lens 1: Moderate conviction multi-dimensional evidence',
    requirements: ['FLY-COH-009', 'REQ-SCORE-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Awarding MODERATE tier when scan epochs < 2.',
    findings: 'MODERATE requires `sampleSize >= 5 && scanEpochCount >= 2`.',
    rejectedClaims: 'Rejected single-scan moderate claims.',
    proposedSolutions: 'Test 5 samples across 1 epoch (ACCUMULATING) vs 2 epochs (MODERATE).'
  },
  {
    num: 10,
    title: 'Truthful Vietnamese Copy for Cohort Explanation',
    lens: 'Lens 5: UI presentation and legal compliance',
    requirements: ['FLY-COH-010', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Displaying English copy or confusing delta descriptions.',
    findings: 'Generates specific Vietnamese explanations for discount (`thấp hơn`), equality (`Bằng mức giá median`), and premium (`cao hơn`).',
    rejectedClaims: 'Rejected ambiguous delta messaging.',
    proposedSolutions: 'Test copy output across cheaper, equal, and higher price points.'
  },
  {
    num: 11,
    title: 'Opportunity Identity Decoupling from Price Points (REQ-ID-002)',
    lens: 'Lens 3: Logical opportunity identity',
    requirements: ['FLY-ID-001', 'REQ-ID-002', 'REQ-DOM-011'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Including price point or crawler timestamp in logical opportunity identity.',
    findings: '`generateOpportunityId` includes origin, destination, departDate, returnDate, airline, flightNumber, stops, strictly excluding price.',
    rejectedClaims: 'Rejected price-dependent opportunity IDs.',
    proposedSolutions: 'Verify identical opportunity ID for two prices on the same flight.'
  },
  {
    num: 12,
    title: 'Canonical 7-Part Opportunity ID Structure',
    lens: 'Lens 4: Structured identifier formatting',
    requirements: ['FLY-ID-002', 'REQ-DOM-011'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Malformed colon parts or missing fields in generated opportunity ID.',
    findings: 'Generates `ORIGIN:DEST:DEPART:RETURN:AIRLINE:FLIGHT:STOPS`.',
    rejectedClaims: 'Rejected variable-token opportunity IDs.',
    proposedSolutions: 'Assert exact token structure in tests.'
  },
  {
    num: 13,
    title: 'Opportunity ID Parsing: 6-Part and 7-Part Format Support',
    lens: 'Lens 2: Backward compatibility and string parsing',
    requirements: ['FLY-ID-003', 'REQ-DOM-011'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Crashing or failing to parse legacy 6-token opportunity IDs.',
    findings: '`parseOpportunityId` supports both 6-part and 7-part strings, safely extracting stops and flightNumber.',
    rejectedClaims: 'Rejected breaking legacy 6-token IDs.',
    proposedSolutions: 'Test parsing of 6-part and 7-part IDs.'
  },
  {
    num: 14,
    title: 'Legacy Prefix Stripping: observed- Handling',
    lens: 'Lens 2: Legacy system integration',
    requirements: ['FLY-ID-004', 'REQ-DOM-011'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Failing identity match when one ID carries the `observed-` prefix and the other does not.',
    findings: '`clean = id.replace(/^observed-/, "").trim()` strips the legacy prefix prior to parsing and equality comparison.',
    rejectedClaims: 'Rejected treating `observed-` as a different logical opportunity.',
    proposedSolutions: 'Test equality between prefixed and non-prefixed IDs.'
  },
  {
    num: 15,
    title: 'Uppercase Code Normalization in Opportunity ID',
    lens: 'Lens 3: String canonicalization',
    requirements: ['FLY-ID-005', 'REQ-DOM-011'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Treating lowercase "han:bkk:..." as a distinct opportunity from "HAN:BKK:...".',
    findings: '`generateOpportunityId` converts origin, destination, airline, and flight number to uppercase.',
    rejectedClaims: 'Rejected case-sensitive airline or airport matching.',
    proposedSolutions: 'Test lowercase inputs in `generateOpportunityId`.'
  },
  {
    num: 16,
    title: 'Negative Stops Clamping in Opportunity ID',
    lens: 'Lens 4: Defensive integer bounds',
    requirements: ['FLY-ID-006', 'REQ-DOM-008'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Producing negative stops like `...:-1` in Opportunity ID.',
    findings: '`String(Math.max(0, input.stops ?? 0))` clamps negative stops or undefined to 0.',
    rejectedClaims: 'Rejected negative stops values.',
    proposedSolutions: 'Test stops = -2 and undefined.'
  },
  {
    num: 17,
    title: 'Logical Opportunity Equality: Flexible Input Polymorphism',
    lens: 'Lens 2: API flexibility and polymorphic comparison',
    requirements: ['FLY-ID-007', 'REQ-DOM-011'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: '`isSameLogicalOpportunity` failing when comparing string to object or object to object.',
    findings: '`isSameLogicalOpportunity` handles string vs string, object vs string, and object vs object.',
    rejectedClaims: 'Rejected requiring identical input types.',
    proposedSolutions: 'Verify all combinations of string and object comparisons.'
  },
  {
    num: 18,
    title: 'Corrupted ID Defense: parseOpportunityId Graceful Null',
    lens: 'Lens 4: Adversarial string defense',
    requirements: ['FLY-ID-008', 'REQ-DOM-008'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Throwing uncaught exceptions on random or truncated ID strings.',
    findings: '`if (parts.length < 6) return null;` returns `null` safely on malformed IDs.',
    rejectedClaims: 'Rejected throwing on malformed IDs.',
    proposedSolutions: 'Test empty string, "invalid", and 3-part strings.'
  },
  {
    num: 19,
    title: 'Scan Run ID vs Observation Date Epoch Extraction',
    lens: 'Lens 1: Temporal diversity calculation',
    requirements: ['FLY-COH-011', 'REQ-SCORE-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Failing to extract scan epochs when scanRunId is missing from observation rows.',
    findings: 'Falls back to `obs.observedAt.slice(0, 10)` to compute distinct calendar day epochs when scanRunId is undefined.',
    rejectedClaims: 'Rejected assuming scanRunId is always populated.',
    proposedSolutions: 'Test observations with and without scanRunId.'
  },
  {
    num: 20,
    title: 'Synthesis of Cycle 0015 Value Case & Contract Architecture',
    lens: 'Lens 5: Master architecture convergence',
    requirements: ['FLY-COH-001', 'FLY-ID-001', 'FLY-TEST-001', 'FLY-REL-001'],
    gates: ['GATE-DATA-TRUTH', 'GATE-ADVERSARIAL-DEFENSE', 'GATE-RELEASE-PROVENANCE', 'RG01', 'RG05', 'RG13', 'RG14'],
    falsifier: 'Inconsistent evidence or incomplete test suite.',
    findings: 'Cycle 0015 formalizes Comparable Cohort Intelligence and Opportunity Identity domain test suites, guaranteeing strict sample sufficiency, evidence tiering, and decoupled logical identity.',
    rejectedClaims: 'Rejected advancing without complete 20-round evidence.',
    proposedSolutions: 'Assemble mastergoal.md and value-case.md and implement enhanced `opportunityCohort.test.ts` and `opportunityIdentity.test.ts`.'
  }
];

for (const r of rounds) {
  const roundFile = join(cycleDir, `round-${String(r.num).padStart(2, '0')}.md`);
  const content = `# Farely Research Round ${r.num}: ${r.title}

- **Round:** ${r.num} / 20
- **Cycle:** 0015
- **Focus Lens:** ${r.lens}
- **Requirements Covered:** ${r.requirements.join(', ')}
- **Governing Release Gates:** ${r.gates.join(', ')}

## 1. Context & Hypotheses
Investigation of Farely pure domain kernel invariants regarding comparable cohorts (NC-014, REQ-DOM-004, REQ-SCORE-001) and canonical opportunity identity (REQ-ID-002, REQ-DOM-011).

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

console.log('Successfully generated 20 research rounds for Cycle 0015 in', cycleDir);
