import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const cycleDir = '.ai-loop/cycles/0009';
await mkdir(cycleDir, { recursive: true });

const rounds = [
  {
    num: 1,
    title: 'Invariant NC-005: 1-Person vs Multi-Person Pricing Comparison Prohibition',
    lens: 'Lens 4: Pricing units and per-traveler comparison isolation',
    requirements: ['FLY-MONEY-001', 'REQ-DOM-006', 'NC-005'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Permitting direct comparison between a PER_TRAVELER fare and a PARTY_TOTAL fare without normalization.',
    findings: '`compareMoney` explicitly checks `if (a.pricingUnit !== b.pricingUnit)` and throws `IncompatibleMoneyComparisonError`, satisfying Invariant NC-005 without exception.',
    rejectedClaims: 'Rejected silent un-normalized comparison across differing pricing units.',
    proposedSolutions: 'Formalize unit test in `src/domain/farely/money.test.ts`.'
  },
  {
    num: 2,
    title: 'Currency Isolation in Money Comparison',
    lens: 'Lens 7: Multi-currency boundary and conversion guards',
    requirements: ['FLY-MONEY-002', 'REQ-DOM-006'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Allowing direct comparison between USD and VND without explicit currency exchange.',
    findings: '`compareMoney` throws `IncompatibleMoneyComparisonError("Cannot compare money in different currencies: VND vs USD")`.',
    rejectedClaims: 'Rejected treating raw amounts as comparable when currencies differ.',
    proposedSolutions: 'Assert currency mismatch error in unit tests.'
  },
  {
    num: 3,
    title: 'Money Factory Validation: Non-Negative & Finite Amount Constraint',
    lens: 'Lens 8: Hostile numerical inputs, NaN, Infinity, negative amounts',
    requirements: ['FLY-DEF-007', 'REQ-DOM-006'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Allowing creation of Money with negative amounts, NaN, or Infinity.',
    findings: '`createMoney` checks `if (!Number.isFinite(amount) || amount < 0)` and throws `TypeError`, strictly preventing invalid money values.',
    rejectedClaims: 'Rejected allowing negative money or floating-point corruptions.',
    proposedSolutions: 'Verify TypeError thrown on negative, NaN, and Infinity amounts.'
  },
  {
    num: 4,
    title: 'Integer Rounding in Money Factory',
    lens: 'Lens 4: Discrete currency unit representations',
    requirements: ['FLY-MONEY-003', 'REQ-DOM-006'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Retaining sub-dong fractional currencies in VND Money objects.',
    findings: '`createMoney` applies `Math.round(amount)`, ensuring discrete integer representations for VND currency values.',
    rejectedClaims: 'Rejected floating-point cent/dong fractional accumulation.',
    proposedSolutions: 'Test integer rounding on fractional amounts.'
  },
  {
    num: 5,
    title: 'Default Currency and Pricing Unit Instantiation',
    lens: 'Lens 3: Canonical defaults',
    requirements: ['FLY-MONEY-004', 'REQ-DOM-006'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Defaulting currency or pricingUnit to undefined.',
    findings: '`createMoney(amount)` defaults `currency` to "VND" and `pricingUnit` to "PER_TRAVELER".',
    rejectedClaims: 'Rejected requiring callers to pass boilerplate defaults.',
    proposedSolutions: 'Assert defaults in unit test.'
  },
  {
    num: 6,
    title: 'Multi-Passenger Normalization via normalizeToPerTraveler',
    lens: 'Lens 4: Normalization formulas',
    requirements: ['FLY-MONEY-005', 'REQ-DOM-006', 'NC-005'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Failing to divide PARTY_TOTAL by total traveler count.',
    findings: '`normalizeToPerTraveler(money, travelerCount)` computes `Math.round(money.amount / travelerCount)` and returns a `PER_TRAVELER` Money instance.',
    rejectedClaims: 'Rejected leaving party totals un-normalized.',
    proposedSolutions: 'Test normalization with various passenger counts.'
  },
  {
    num: 7,
    title: 'Idempotence of normalizeToPerTraveler',
    lens: 'Lens 4: Functional idempotence',
    requirements: ['FLY-MONEY-006', 'REQ-DOM-006'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Re-dividing an already normalized PER_TRAVELER Money instance.',
    findings: 'When `money.pricingUnit === "PER_TRAVELER"`, `normalizeToPerTraveler` returns the identical Money object untouched.',
    rejectedClaims: 'Rejected double-division bugs on pre-normalized fares.',
    proposedSolutions: 'Assert reference equality / idempotence in unit test.'
  },
  {
    num: 8,
    title: 'Traveler Count Bounds Defense in normalizeToPerTraveler',
    lens: 'Lens 8: Division by zero and negative passenger count defense',
    requirements: ['FLY-DEF-008', 'REQ-DOM-006'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Dividing by zero or allowing negative traveler counts.',
    findings: '`travelerCount <= 0` immediately throws `RangeError("Traveler count must be positive")`.',
    rejectedClaims: 'Rejected division by zero resulting in Infinity.',
    proposedSolutions: 'Verify RangeError thrown on travelerCount <= 0.'
  },
  {
    num: 9,
    title: 'Deterministic Money Comparison Semantics',
    lens: 'Lens 4: Sorting and comparator logic',
    requirements: ['FLY-MONEY-007', 'REQ-DOM-006'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Returning invalid sort indicators when comparing compatible Money.',
    findings: '`compareMoney(a, b)` returns `a.amount - b.amount` (negative for a < b, 0 for equal, positive for a > b).',
    rejectedClaims: 'Rejected non-standard comparison outputs.',
    proposedSolutions: 'Test ordering across various compatible amounts.'
  },
  {
    num: 10,
    title: 'Invariant REQ-DOM-001: Benchmark Savings Mathematical Formula',
    lens: 'Lens 4: Savings formula and value case definition',
    requirements: ['FLY-SAV-001', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Reporting negative savings when observed price exceeds benchmark price.',
    findings: '`calculateSavings` computes `savingsAmount = Math.max(0, benchmarkPrice - observedPrice)`, guaranteeing savingsAmount >= 0.',
    rejectedClaims: 'Rejected presenting negative values as savings.',
    proposedSolutions: 'Assert savings formula bounds in unit test.'
  },
  {
    num: 11,
    title: 'Savings Percentage Calculation & Discrete Rounding',
    lens: 'Lens 4: Relative percentage savings calculation',
    requirements: ['FLY-SAV-002', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Calculating incorrect savings percentages or retaining unwieldy floats.',
    findings: '`savingsPercent = Math.round((savingsAmount / benchmarkPrice) * 100)` produces clean integer percentages.',
    rejectedClaims: 'Rejected unrounded floating point percentages in user UI.',
    proposedSolutions: 'Verify percentage rounding on 1/3 and 2/3 ratios.'
  },
  {
    num: 12,
    title: 'Zero and Negative Benchmark Edge Cases in Savings',
    lens: 'Lens 8: Non-positive baseline price defense',
    requirements: ['FLY-DEF-009', 'REQ-DOM-001'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Dividing by zero or reporting savings when benchmark price is zero or negative.',
    findings: 'If `benchmarkPrice <= 0 || observedPrice <= 0`, `calculateSavings` returns 0 savings with `isSaving: false`.',
    rejectedClaims: 'Rejected dividing by zero or claiming savings against non-existent baselines.',
    proposedSolutions: 'Test non-positive benchmark and observed prices.'
  },
  {
    num: 13,
    title: 'Non-Saving Scenarios (observedPrice >= benchmarkPrice)',
    lens: 'Lens 4: Zero savings conditions',
    requirements: ['FLY-SAV-003', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Setting isSaving === true when observed price is equal to or higher than benchmark.',
    findings: 'When observed >= benchmark, `savingsAmount` is 0, `savingsPercent` is 0, and `isSaving` is false.',
    rejectedClaims: 'Rejected declaring deals when prices are average or expensive.',
    proposedSolutions: 'Test observed >= benchmark scenarios.'
  },
  {
    num: 14,
    title: 'Exact Equality Scenario (observedPrice === benchmarkPrice)',
    lens: 'Lens 4: Boundary value analysis',
    requirements: ['FLY-SAV-004', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Reporting 1% savings on identical benchmark and observed prices.',
    findings: 'When prices are identical, savings amount and percent are strictly 0.',
    rejectedClaims: 'Rejected floating point epsilon leaks.',
    proposedSolutions: 'Assert exact zero savings on identical fares.'
  },
  {
    num: 15,
    title: 'Massive Discount Calculation (Flash Sale Scenarios)',
    lens: 'Lens 4: Large discount magnitude',
    requirements: ['FLY-SAV-005', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Failing on 70% or 90% discount calculations.',
    findings: 'Calculates 700k vs 2M correctly as 1.3M savings and 65% discount with `isSaving: true`.',
    rejectedClaims: 'Rejected clipping savings percentages below 100%.',
    proposedSolutions: 'Test flash sale discount vectors.'
  },
  {
    num: 16,
    title: 'Interaction of normalizeToPerTraveler with Savings',
    lens: 'Lens 4: Integrated financial flow',
    requirements: ['FLY-MONEY-008', 'REQ-DOM-001', 'REQ-DOM-006'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Comparing a normalized per-traveler fare against an un-normalized party benchmark.',
    findings: 'Both observed and benchmark fares must be normalized to PER_TRAVELER before computing savings.',
    rejectedClaims: 'Rejected mismatched pricing unit savings comparisons.',
    proposedSolutions: 'Test end-to-end normalization followed by savings evaluation.'
  },
  {
    num: 17,
    title: 'Error Taxonomy Distinction: IncompatibleMoneyComparisonError vs TypeError vs RangeError',
    lens: 'Lens 8: Precise exception contract and operational typing',
    requirements: ['FLY-DEF-010', 'REQ-DOM-006'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Throwing generic Error rather than typed domain errors.',
    findings: 'Domain kernel defines distinct typed errors: `IncompatibleMoneyComparisonError` for semantic mismatch, `TypeError` for invalid number formats, `RangeError` for invalid passenger counts.',
    rejectedClaims: 'Rejected untyped generic string errors.',
    proposedSolutions: 'Assert exact error constructors and names.'
  },
  {
    num: 18,
    title: 'Safe Integer Boundaries for High-Value VND Currencies',
    lens: 'Lens 4: JavaScript Number.MAX_SAFE_INTEGER safety',
    requirements: ['FLY-MONEY-009', 'REQ-DOM-006'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Overflowing on large VND sums (e.g. 50,000,000 VND).',
    findings: 'JavaScript safe integer limit is 9 quadrillion ($9 \\times 10^{15}$), far exceeding flight transactions in VND ($5 \\times 10^7$). Precision is mathematically exact.',
    rejectedClaims: 'Rejected BigInt requirement for flight domain pricing.',
    proposedSolutions: 'Test large VND values up to 100M VND.'
  },
  {
    num: 19,
    title: 'Cross-User Isolation & Immutability of Money Objects',
    lens: 'Lens 1: RLS and multi-tenant security invariants',
    requirements: ['FLY-SEC-003', 'REQ-DOM-006'],
    gates: ['GATE-RLS-ISOLATION', 'RG12'],
    falsifier: 'Mutating Money instances in place during normalization.',
    findings: '`normalizeToPerTraveler` returns a new object rather than mutating the input, preserving referential transparency.',
    rejectedClaims: 'Rejected in-place mutation of money state.',
    proposedSolutions: 'Assert that input Money object is not mutated by normalization.'
  },
  {
    num: 20,
    title: 'Synthesis & Work Package Plan for Cycle 9 Execution',
    lens: 'Cycle 9 Architecture & Value Synthesis',
    requirements: ['FLY-REL-001', 'FLY-TEST-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Proceeding to implementation without a clear falsification plan and defined work packages.',
    findings: 'Synthesized 3 concrete work packages: WP01 (Money & Savings Pure Domain Unit Test Suite in `src/domain/farely/money.test.ts`), WP02 (Pricing Unit Invariant & Savings Defense), WP03 (Full Check Baseline & Remote Convergence).',
    rejectedClaims: 'Rejected omitting unit test coverage for pure financial kernel.',
    proposedSolutions: 'Execute WP01, WP02, and WP03.'
  }
];

for (const round of rounds) {
  const padded = String(round.num).padStart(2, '0');
  const filename = join(cycleDir, `round-${padded}.md`);
  const content = `# Cycle 0009 — Research Round ${padded}: ${round.title}

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
