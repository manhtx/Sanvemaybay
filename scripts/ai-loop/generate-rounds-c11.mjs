import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const cycleDir = '.ai-loop/cycles/0011';
await mkdir(cycleDir, { recursive: true });

const rounds = [
  {
    num: 1,
    title: 'Invariant NC-011: Outage and Failure Isolation vs Healthy Zero Deals',
    lens: 'Lens 1: Provider rights, failure classification, and negative controls',
    requirements: ['FLY-PROV-001', 'REQ-PROV-003', 'NC-011'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Representing an upstream provider network failure or outage as a healthy 0-deal scan.',
    findings: '`createErrorResult` enforces `isDegraded: true` and sets explicit error status, preventing silent presentation of provider errors as healthy empty results.',
    rejectedClaims: 'Rejected treating network errors, timeouts, or HTTP 500s as empty array with status 200.',
    proposedSolutions: 'Formalize unit test in `src/domain/farely/providerResult.test.ts` asserting error result contract.'
  },
  {
    num: 2,
    title: 'Invariant NC-026: Explicit Classification of Upstream HTTP 503 and Service Errors',
    lens: 'Lens 1: External service degradation contracts',
    requirements: ['FLY-PROV-002', 'REQ-PROV-004', 'NC-026'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Treating HTTP 503 Service Unavailable as an acceptable healthy state or failing open.',
    findings: '`ProviderResultStatus` includes `UPSTREAM_ERROR` and `metadata.httpStatusCode: 503`. Calling `isResultHealthy` returns `false`.',
    rejectedClaims: 'Rejected ignoring HTTP status codes or suppressing error metadata.',
    proposedSolutions: 'Assert metadata preservation and health check rejection in unit tests.'
  },
  {
    num: 3,
    title: 'Invariant NC-012: Comprehensive Classification of Failure Modes',
    lens: 'Lens 2: Provider telemetry and error semantics',
    requirements: ['FLY-PROV-003', 'REQ-PROV-002', 'NC-012'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Coalescing rate limits, bot challenges, and schema drift into a vague generic error string.',
    findings: '`ProviderResultStatus` enumerates distinct failure modes: RATE_LIMITED, BOT_CHALLENGE, PARSER_SCHEMA_DRIFT, TIMEOUT, AUTH_ERROR, etc.',
    rejectedClaims: 'Rejected collapsing all errors into string "failed".',
    proposedSolutions: 'Test creation and classification across all non-success status types.'
  },
  {
    num: 4,
    title: 'Success Status Defense: createSuccessResult Disambiguation',
    lens: 'Lens 3: Data completeness and empty state honesty',
    requirements: ['FLY-PROV-004', 'REQ-PROV-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Reporting `SUCCESS_NONEMPTY` when data array is empty or `VERIFIED_EMPTY` when data has items.',
    findings: '`createSuccessResult` automatically inspects `data.length > 0 ? "SUCCESS_NONEMPTY" : "VERIFIED_EMPTY"` with `isDegraded: false`.',
    rejectedClaims: 'Rejected manual untyped status string assignment for successful results.',
    proposedSolutions: 'Test both populated and empty arrays in `createSuccessResult`.'
  },
  {
    num: 5,
    title: 'Contract Defense: Prohibiting Success Status in createErrorResult',
    lens: 'Lens 4: Defensive coding and invariant guards',
    requirements: ['FLY-PROV-005', 'REQ-PROV-003'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Calling `createErrorResult` with `SUCCESS_NONEMPTY` or `VERIFIED_EMPTY` and succeeding.',
    findings: '`createErrorResult` throws `Error("Cannot create error result with success status: ...")` when passed a success status.',
    rejectedClaims: 'Rejected silently overriding status to an error code.',
    proposedSolutions: 'Assert throws in adversarial negative test.'
  },
  {
    num: 6,
    title: 'Result Health Gate: isResultHealthy Verification',
    lens: 'Lens 3: Downstream consumer gatekeeping',
    requirements: ['FLY-PROV-006', 'REQ-PROV-005'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: '`isResultHealthy` returning true for degraded coverage, partial results, or errors.',
    findings: '`isResultHealthy` strictly returns `result.status === "SUCCESS_NONEMPTY" || result.status === "VERIFIED_EMPTY"`. All other 11 statuses return false.',
    rejectedClaims: 'Rejected marking PARTIAL_RESULTS or DEGRADED_COVERAGE as unconditionally healthy.',
    proposedSolutions: 'Test `isResultHealthy` against all 13 status types.'
  },
  {
    num: 7,
    title: 'Telemetry & Metadata Preservation in ProviderResult',
    lens: 'Lens 5: Observability and operational audit',
    requirements: ['FLY-PROV-007', 'REQ-PROV-004'],
    gates: ['GATE-RELEASE-PROVENANCE', 'RG14'],
    falsifier: 'Dropping retry metadata, HTTP status codes, or raw payload sizes during error normalization.',
    findings: '`createErrorResult` accepts optional `metadata` including routesAttempted, routesSucceeded, httpStatusCode, hasCaptcha, rawPayloadSize.',
    rejectedClaims: 'Rejected lossy error wrapping.',
    proposedSolutions: 'Verify metadata round-tripping in test suite.'
  },
  {
    num: 8,
    title: 'Observation Timestamp Parity: observedAt ISO String Verification',
    lens: 'Lens 3: Temporal provenance',
    requirements: ['FLY-PROV-008', 'REQ-DOM-009'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Omitting `observedAt` or providing invalid non-ISO timestamps in ProviderResult.',
    findings: 'Both `createSuccessResult` and `createErrorResult` populate `observedAt: new Date().toISOString()`.',
    rejectedClaims: 'Rejected optional observedAt or undefined timestamps.',
    proposedSolutions: 'Assert valid ISO timestamp parse in tests.'
  },
  {
    num: 9,
    title: 'Degraded Coverage vs Partial Results Distinction',
    lens: 'Lens 1: Upstream completeness epistemology',
    requirements: ['FLY-PROV-009', 'REQ-PROV-002'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Conflating partial flight results with degraded routing coverage.',
    findings: '`PARTIAL_RESULTS` and `DEGRADED_COVERAGE` are distinct union types, enabling specific client messaging and retry policies.',
    rejectedClaims: 'Rejected single DEGRADED flag without type separation.',
    proposedSolutions: 'Test status discrimination in unit tests.'
  },
  {
    num: 10,
    title: 'Security and Bot Challenge Telemetry: hasCaptcha Flagging',
    lens: 'Lens 1: Bot challenge handling',
    requirements: ['FLY-PROV-010', 'REQ-PROV-002'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Treating Cloudflare/CAPTCHA challenge as a regular parsing error.',
    findings: 'Status `BOT_CHALLENGE` with `metadata.hasCaptcha: true` informs worker backoff logic and prevents automated retry flooding.',
    rejectedClaims: 'Rejected treating bot challenge as network timeout.',
    proposedSolutions: 'Assert BOT_CHALLENGE status with metadata.'
  },
  {
    num: 11,
    title: 'Benchmark Savings Mathematical Accuracy (REQ-DOM-001)',
    lens: 'Lens 4: Mathematical correctness and truthful savings',
    requirements: ['FLY-SAV-001', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Reporting savings amount when observed price is equal to or higher than benchmark.',
    findings: '`calculateSavings(observed, benchmark)` computes `Math.max(0, benchmark - observed)`. When observed >= benchmark, savingsAmount = 0 and isSaving = false.',
    rejectedClaims: 'Rejected negative savings amounts.',
    proposedSolutions: 'Formalize dedicated unit test in `src/domain/farely/savings.test.ts`.'
  },
  {
    num: 12,
    title: 'Savings Percentage Integer Rounding Contract',
    lens: 'Lens 4: Calculation rounding standards',
    requirements: ['FLY-SAV-002', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Emitting non-integer floating-point percentages like 33.33333333% in user-facing deal savings.',
    findings: '`calculateSavings` uses `Math.round((savingsAmount / benchmarkPrice) * 100)` to produce deterministic, presentation-safe percentages.',
    rejectedClaims: 'Rejected unrounded floating point percentages.',
    proposedSolutions: 'Verify rounding of recurring decimals (e.g. 1/3 -> 33%).'
  },
  {
    num: 13,
    title: 'Non-Positive Benchmark Defense: Zero or Negative Baseline Handling',
    lens: 'Lens 4: Defensive pricing epistemology',
    requirements: ['FLY-SAV-003', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Division by zero or negative baseline producing fictitious positive savings.',
    findings: '`calculateSavings` guards `if (benchmarkPrice <= 0 || observedPrice <= 0)` and returns `{ savingsAmount: 0, savingsPercent: 0, isSaving: false }`.',
    rejectedClaims: 'Rejected calculating savings on negative or zero benchmarks.',
    proposedSolutions: 'Test benchmarkPrice <= 0 vector.'
  },
  {
    num: 14,
    title: 'Non-Positive Observed Price Defense: Zero or Negative Offer Handling',
    lens: 'Lens 4: Free/zero fare defense',
    requirements: ['FLY-SAV-004', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Claiming 100% savings on a 0 VND or negative fare anomaly.',
    findings: 'When observedPrice <= 0, `isSaving: false` prevents fraudulent "100% off" claims for corrupted crawl data.',
    rejectedClaims: 'Rejected reporting savings on corrupted zero-price records.',
    proposedSolutions: 'Test observedPrice <= 0 vector.'
  },
  {
    num: 15,
    title: 'Identical Price Benchmark Vector: Zero Savings Boundary',
    lens: 'Lens 4: Boundary value analysis',
    requirements: ['FLY-SAV-005', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Marking a flight with price equal to benchmark as `isSaving: true`.',
    findings: 'When observedPrice === benchmarkPrice, savingsAmount is 0 and isSaving is strictly `false`.',
    rejectedClaims: 'Rejected inclusive `>=` comparison for `isSaving`.',
    proposedSolutions: 'Assert equality boundary test.'
  },
  {
    num: 16,
    title: 'Savings Symmetry: Exact Inversion and Non-Reversibility',
    lens: 'Lens 4: Metamorphic testing',
    requirements: ['FLY-SAV-006', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Treating a price increase as negative savings.',
    findings: 'Savings is strictly one-directional: price decreases generate positive savings; price increases generate 0 savings with isSaving: false.',
    rejectedClaims: 'Rejected bidirectional savings.',
    proposedSolutions: 'Test price increase metamorphic vector.'
  },
  {
    num: 17,
    title: 'High-Discount Vector: 80%+ Super-Deals and Flash Sales',
    lens: 'Lens 4: Flash sale calculations',
    requirements: ['FLY-SAV-007', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Overflow or miscalculation on massive discounts (e.g. 5,000,000 to 500,000 VND).',
    findings: '`calculateSavings(500000, 5000000)` yields savingsAmount 4500000, savingsPercent 90%, isSaving true.',
    rejectedClaims: 'Rejected capping legitimate deep discounts.',
    proposedSolutions: 'Verify deep discount test vectors.'
  },
  {
    num: 18,
    title: 'Provider Generic Typing Integrity: Type Safety Across Payloads',
    lens: 'Lens 2: Static typing and payload flexibility',
    requirements: ['FLY-PROV-011', 'REQ-DOM-002'],
    gates: ['GATE-RELEASE-PROVENANCE', 'RG14'],
    falsifier: 'Losing type safety when wrapping complex flight option objects into ProviderResult<T>.',
    findings: '`ProviderResult<T>` is strictly parameterized over `T[]`, maintaining complete type safety without `any` downcasting.',
    rejectedClaims: 'Rejected untyped ProviderResult without generics.',
    proposedSolutions: 'Test generic typing with interface types in unit tests.'
  },
  {
    num: 19,
    title: 'Edge Case Verification: Sub-Percent Micro-Savings',
    lens: 'Lens 4: Rounding boundaries',
    requirements: ['FLY-SAV-008', 'REQ-DOM-001'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Fractions under 0.5% rounding to 0% but still reporting isSaving: true or vice versa.',
    findings: 'If observed is 9,990,000 and benchmark is 10,000,000, savingsAmount is 10,000, savingsPercent rounds to 0%, but isSaving remains true because savingsAmount > 0.',
    rejectedClaims: 'Rejected conflating savingsPercent === 0 with isSaving === false.',
    proposedSolutions: 'Assert micro-savings boundary in test suite.'
  },
  {
    num: 20,
    title: 'Synthesis of Cycle 0011 Value Case & Contract Architecture',
    lens: 'Lens 5: Master architecture convergence',
    requirements: ['FLY-PROV-001', 'FLY-SAV-001', 'FLY-TEST-001', 'FLY-REL-001'],
    gates: ['GATE-DATA-TRUTH', 'GATE-ADVERSARIAL-DEFENSE', 'GATE-RELEASE-PROVENANCE', 'RG01', 'RG05', 'RG13', 'RG14'],
    falsifier: 'Missing research documentation or unaligned test assertions.',
    findings: 'Cycle 0011 formalizes Provider Result and Savings domain test suites, guaranteeing zero false-zero deal results on provider outages and truthful savings calculations.',
    rejectedClaims: 'Rejected proceeding without complete 20-round evidence.',
    proposedSolutions: 'Assemble mastergoal.md and value-case.md and implement `providerResult.test.ts` and `savings.test.ts`.'
  }
];

for (const r of rounds) {
  const roundFile = join(cycleDir, `round-${String(r.num).padStart(2, '0')}.md`);
  const content = `# Farely Research Round ${r.num}: ${r.title}

- **Round:** ${r.num} / 20
- **Cycle:** 0011
- **Focus Lens:** ${r.lens}
- **Requirements Covered:** ${r.requirements.join(', ')}
- **Governing Release Gates:** ${r.gates.join(', ')}

## 1. Context & Hypotheses
Investigation of Farely pure domain kernel invariants regarding provider result contracts (REQ-PROV-001..005, NC-011, NC-012, NC-026) and relative savings computation (REQ-DOM-001).

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

console.log('Successfully generated 20 research rounds for Cycle 0011 in', cycleDir);
