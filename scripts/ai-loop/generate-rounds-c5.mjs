import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const cycleDir = '.ai-loop/cycles/0005';
await mkdir(cycleDir, { recursive: true });

const rounds = [
  {
    num: 1,
    title: 'Watch Condition Episode Architecture & Invariant NC-017',
    lens: 'Lens 6: Watch / notification conditions, threshold crossed, episode management',
    requirements: ['FLY-WATCH-001', 'REQ-WATCH-015', 'NC-017'],
    gates: ['GATE-WATCH-EPISODES', 'RG06'],
    falsifier: 'Failing to close an active episode when observed price rises above the user target price.',
    findings: 'When observed price exceeds target price (`params.observedPrice > params.targetPrice`), `evaluateWatchCondition` must transition an active episode to state `EXITED` and set `closedAt: now`. `shouldAlert` must be false.',
    rejectedClaims: 'Rejected treating price increase as an alertable event or leaving the episode open.',
    proposedSolutions: 'Formalize unit test in `src/domain/farely/watchCondition.test.ts`.'
  },
  {
    num: 2,
    title: 'Invariant NC-018: Price Re-entry Cycle (REENTERED)',
    lens: 'Lens 6: Watch / notification conditions, threshold crossed, episode management',
    requirements: ['FLY-WATCH-002', 'REQ-WATCH-016', 'NC-018'],
    gates: ['GATE-WATCH-EPISODES', 'RG06'],
    falsifier: 'Classifying a re-entering deal as ENTERED or failing to trigger an alert upon re-entry.',
    findings: 'When an active episode was previously `EXITED` and the price drops back below the target price, the state must become `REENTERED`, `closedAt` must be reset to null, and `shouldAlert` must be true.',
    rejectedClaims: 'Rejected mutating the closed episode in place without explicit REENTERED state transition.',
    proposedSolutions: 'Assert re-entry transition in pure domain unit tests.'
  },
  {
    num: 3,
    title: 'Invariant NC-019: Material Price Improvement (>5% drop) Inside Condition',
    lens: 'Lens 6: Material price drop detection and alert spam suppression',
    requirements: ['FLY-WATCH-003', 'REQ-WATCH-017', 'NC-019'],
    gates: ['GATE-WATCH-EPISODES', 'RG06'],
    falsifier: 'Alerting on a minor 1% price fluctuation, or failing to alert when price drops by 10%.',
    findings: '`evaluateWatchCondition` calculates `dropPercent = ((active.bestPrice - params.observedPrice) / active.bestPrice) * 100`. Only if `dropPercent >= 5` does state become `MATERIAL_IMPROVEMENT` with `shouldAlert: true`.',
    rejectedClaims: 'Rejected alerting on every single price change within the target window.',
    proposedSolutions: 'Assert 5% boundary condition with exact mathematical precision in unit test.'
  },
  {
    num: 4,
    title: 'F18 & Section 19: INSUFFICIENT_EVIDENCE Preserves Episode State Intact',
    lens: 'Lens 2: Degraded fallback, missing source data, unmonitored scope',
    requirements: ['FLY-WATCH-004', 'REQ-WATCH-018', 'F18'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Falsely emitting an EXITED transition or closing an active episode when a provider scan fails or returns INSUFFICIENT_EVIDENCE.',
    findings: 'Under `conditionInput === INSUFFICIENT_EVIDENCE` or null/non-finite observedPrice, `evaluateWatchCondition` returns `nextEpisode: active`, `stateChanged: false`, `shouldAlert: false`. The episode state remains intact.',
    rejectedClaims: 'Rejected treating provider absence or network errors as proof of price increase.',
    proposedSolutions: 'Assert episode state preservation under partial and missing telemetry.'
  },
  {
    num: 5,
    title: 'Minor Price Fluctuations & STILL_INSIDE State Transition',
    lens: 'Lens 6: Alert fatigue prevention and noise dampening',
    requirements: ['FLY-WATCH-005', 'REQ-WATCH-019'],
    gates: ['GATE-WATCH-EPISODES', 'RG06'],
    falsifier: 'Emitting alerts or changing state when price moves by less than 5% within target price.',
    findings: 'When observed price is <= target price and dropPercent < 5%, state transitions to `STILL_INSIDE`. `stateChanged: false`, `shouldAlert: false`. Best price is updated if lower, but notification fatigue is strictly prevented.',
    rejectedClaims: 'Rejected sending notifications for noise variations.',
    proposedSolutions: 'Assert STILL_INSIDE idempotency in unit test suite.'
  },
  {
    num: 6,
    title: 'Non-Finite & Null Price Defensive Resiliency',
    lens: 'Lens 8: Adversarial input, malformed numbers, NaN, and Infinity',
    requirements: ['FLY-DEF-001', 'REQ-WATCH-020'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Crashing or corrupting episode state when observed price is NaN, Infinity, or negative.',
    findings: '`!Number.isFinite(params.observedPrice)` triggers the INSUFFICIENT_EVIDENCE guard path immediately, safely preserving active episode without exception or NaN propagation.',
    rejectedClaims: 'Rejected unchecked numeric arithmetic on untrusted external inputs.',
    proposedSolutions: 'Verify NaN and Infinity defense in adversarial test cases.'
  },
  {
    num: 7,
    title: 'Condition Fingerprinting & Deterministic Watch Identification',
    lens: 'Lens 3: Route, date, cabin, and scope identity invariants',
    requirements: ['FLY-ID-001', 'REQ-WATCH-021'],
    gates: ['GATE-FEED-TRUTH', 'RG07'],
    falsifier: 'Creating inconsistent condition fingerprints for identical watch parameters.',
    findings: 'Condition fingerprint `cond_${params.watchId}_${params.targetPrice}` binds the evaluation deterministically to the target threshold, ensuring clean episode separation across threshold adjustments.',
    rejectedClaims: 'Rejected loose un-hashed condition identity.',
    proposedSolutions: 'Validate fingerprint format and integrity in tests.'
  },
  {
    num: 8,
    title: 'Episode State Machine Reachability & Valid Transitions',
    lens: 'Lens 6: Finite state machine completeness and deterministic transitions',
    requirements: ['FLY-WATCH-006', 'REQ-WATCH-022'],
    gates: ['GATE-WATCH-EPISODES', 'RG06'],
    falsifier: 'Allowing illegal state jumps (e.g. from null straight to STILL_INSIDE or MATERIAL_IMPROVEMENT).',
    findings: 'The valid transition graph is: (null -> ENTERED), (ENTERED -> STILL_INSIDE | MATERIAL_IMPROVEMENT | EXITED), (STILL_INSIDE -> STILL_INSIDE | MATERIAL_IMPROVEMENT | EXITED), (MATERIAL_IMPROVEMENT -> STILL_INSIDE | MATERIAL_IMPROVEMENT | EXITED), (EXITED -> REENTERED), (REENTERED -> STILL_INSIDE | MATERIAL_IMPROVEMENT | EXITED).',
    rejectedClaims: 'Rejected arbitrary transitions bypass the entry gate.',
    proposedSolutions: 'Map and test complete state transition lifecycle.'
  },
  {
    num: 9,
    title: 'Alert Gating Truth Table (shouldAlert Verification)',
    lens: 'Lens 6: Exact notification emission rules and safety guards',
    requirements: ['FLY-ALERT-001', 'REQ-WATCH-023'],
    gates: ['GATE-WATCH-EPISODES', 'RG06'],
    falsifier: 'Emitting shouldAlert === true on EXITED or STILL_INSIDE, or shouldAlert === false on ENTERED or REENTERED.',
    findings: 'The truth table is unambiguous: ENTERED -> alert: true; REENTERED -> alert: true; MATERIAL_IMPROVEMENT -> alert: true; STILL_INSIDE -> alert: false; EXITED -> alert: false; INSUFFICIENT_EVIDENCE -> alert: false.',
    rejectedClaims: 'Rejected any heuristics altering this truth table.',
    proposedSolutions: 'Encode comprehensive truth table assertion matrix.'
  },
  {
    num: 10,
    title: 'Best Price Monotonic Non-Increasing Invariant within Episode',
    lens: 'Lens 4: Statistical tracking within episode boundaries',
    requirements: ['FLY-MATH-001', 'REQ-WATCH-024'],
    gates: ['GATE-DATA-TRUTH', 'RG01'],
    falsifier: 'Allowing bestPrice to increase while an episode remains active.',
    findings: 'Within an active episode (ENTERED, STILL_INSIDE, MATERIAL_IMPROVEMENT), `bestPrice` is monotonically non-increasing (`updatedBest = Math.min(active.bestPrice, params.observedPrice)`). Temporary price bumps below target never inflate bestPrice.',
    rejectedClaims: 'Rejected allowing bestPrice to track upward fluctuations.',
    proposedSolutions: 'Assert bestPrice monotonicity across multi-step price sequences.'
  },
  {
    num: 11,
    title: 'Episode Timestamps & Event Audit Trail',
    lens: 'Lens 5: Auditing, event timestamps, ISO compliance',
    requirements: ['FLY-AUDIT-001', 'REQ-WATCH-025'],
    gates: ['GATE-RELEASE-PROVENANCE', 'RG14'],
    falsifier: 'Missing or corrupting openedAt, closedAt, or lastEventAt timestamps during state transitions.',
    findings: '`openedAt` is immutable once an episode is initialized. `closedAt` is set precisely upon `EXITED`. `lastEventAt` updates on every valid evaluation, maintaining end-to-end temporal provenance.',
    rejectedClaims: 'Rejected overwriting openedAt during subsequent events within the same episode.',
    proposedSolutions: 'Verify timestamp preservation and closure semantics.'
  },
  {
    num: 12,
    title: 'Generation ID & Distributed Tracing Traceability',
    lens: 'Lens 5: Correlation IDs, generation tracing, and observability',
    requirements: ['FLY-OBS-001', 'REQ-WATCH-026'],
    gates: ['GATE-RELEASE-PROVENANCE', 'RG14'],
    falsifier: 'Dropping generationId during episode updates.',
    findings: 'When `generationId` is supplied in evaluation parameters, it is propagated to `nextEpisode.generationId`, allowing correlation with background scan pipelines.',
    rejectedClaims: 'Rejected losing trace context in pure domain kernel.',
    proposedSolutions: 'Test generationId propagation across all active states.'
  },
  {
    num: 13,
    title: 'Target Price Boundary Semantics (observedPrice === targetPrice)',
    lens: 'Lens 6: Exact boundary conditions and edge values',
    requirements: ['FLY-WATCH-007', 'REQ-WATCH-027'],
    gates: ['GATE-WATCH-EPISODES', 'RG06'],
    falsifier: 'Failing to enter condition when price is exactly equal to target price.',
    findings: '`isEligible` checks `params.observedPrice <= params.targetPrice`. Exact equality is explicitly eligible and triggers ENTERED.',
    rejectedClaims: 'Rejected strict inequality (<) that excludes exact target matches.',
    proposedSolutions: 'Test boundary edge case `observedPrice === targetPrice`.'
  },
  {
    num: 14,
    title: 'Transition Reason Semantics & Operational Auditability',
    lens: 'Lens 5: Human-readable diagnostic messaging and telemetry',
    requirements: ['FLY-OBS-002', 'REQ-WATCH-028'],
    gates: ['GATE-RELEASE-PROVENANCE', 'RG14'],
    falsifier: 'Returning blank or misleading transition reasons.',
    findings: 'Every evaluation produces an explicit `transitionReason` referencing the relevant invariant (e.g. `NC-017`, `NC-018`, `NC-019`, or `INSUFFICIENT_EVIDENCE`).',
    rejectedClaims: 'Rejected opaque or empty transition descriptors.',
    proposedSolutions: 'Assert transitionReason presence and formatting.'
  },
  {
    num: 15,
    title: 'Interaction with WatchConditionInput Enum',
    lens: 'Lens 6: Explicit input overrides (MATCH, CONFIRMED_NON_MATCH, INSUFFICIENT_EVIDENCE)',
    requirements: ['FLY-WATCH-008', 'REQ-WATCH-029'],
    gates: ['GATE-WATCH-EPISODES', 'RG06'],
    falsifier: 'Ignoring conditionInput enum when provided.',
    findings: '`conditionInput` enables upstream pre-filtering: `MATCH` forces eligibility, `CONFIRMED_NON_MATCH` forces non-eligibility regardless of price, and `INSUFFICIENT_EVIDENCE` freezes state.',
    rejectedClaims: 'Rejected ignoring explicit upstream matching classification.',
    proposedSolutions: 'Test all three conditionInput enum branches.'
  },
  {
    num: 16,
    title: 'Adversarial Boundary: Zero and Negative Target/Observed Prices',
    lens: 'Lens 8: Hostile inputs, zero price traps, negative values',
    requirements: ['FLY-DEF-002', 'REQ-WATCH-030'],
    gates: ['GATE-ADVERSARIAL-DEFENSE', 'RG13'],
    falsifier: 'Division by zero or negative percentages in dropPercent calculation.',
    findings: 'If bestPrice is 0 or negative, `dropPercent` calculation could yield NaN or Infinity. Domain logic must be resilient.',
    rejectedClaims: 'Rejected unvalidated arithmetic under boundary values.',
    proposedSolutions: 'Assert boundary resilience with zero and low prices.'
  },
  {
    num: 17,
    title: 'Consecutive Material Improvements & Cumulative Tracking',
    lens: 'Lens 6: Multi-step price declines and repeated material improvements',
    requirements: ['FLY-WATCH-009', 'REQ-WATCH-031'],
    gates: ['GATE-WATCH-EPISODES', 'RG06'],
    falsifier: 'Failing to trigger a second alert when price drops a further 10% below previous best price.',
    findings: 'Each successive price drop of >= 5% from the currently established `bestPrice` produces `MATERIAL_IMPROVEMENT` and updates `bestPrice` to the new lower level.',
    rejectedClaims: 'Rejected allowing only one material improvement per episode.',
    proposedSolutions: 'Verify sequential drops: 1,000,000 -> 900,000 (alert) -> 800,000 (alert).'
  },
  {
    num: 18,
    title: 'Re-entry Price Comparison Dynamics',
    lens: 'Lens 6: Re-entry baseline initialization',
    requirements: ['FLY-WATCH-010', 'REQ-WATCH-032'],
    gates: ['GATE-WATCH-EPISODES', 'RG06'],
    falsifier: 'Carrying forward an old bestPrice from a previous episode into a new REENTERED episode.',
    findings: 'Upon `REENTERED`, a new episode is created with `entryPrice: params.observedPrice` and `bestPrice: params.observedPrice`, resetting the baseline for subsequent material improvements.',
    rejectedClaims: 'Rejected contaminating new episodes with obsolete price baselines from prior cycles.',
    proposedSolutions: 'Test clean baseline instantiation upon REENTERED.'
  },
  {
    num: 19,
    title: 'Cross-User Isolation & RLS Boundary Consistency',
    lens: 'Lens 1: RLS and multi-tenant security invariants',
    requirements: ['FLY-SEC-001', 'REQ-SEC-001'],
    gates: ['GATE-RLS-ISOLATION', 'RG12'],
    falsifier: 'Mixing watch evaluations across user boundaries or leaking state across watches.',
    findings: '`evaluateWatchCondition` is a pure referentially transparent domain function. It accepts explicit `watchId` and state, guaranteeing 0 cross-watch contamination.',
    rejectedClaims: 'Rejected global or mutable watch evaluation registries.',
    proposedSolutions: 'Verify pure isolation across distinct watch IDs in unit tests.'
  },
  {
    num: 20,
    title: 'Synthesis & Work Package Plan for Cycle 5 Execution',
    lens: 'Cycle 5 Architecture & Value Synthesis',
    requirements: ['FLY-REL-001', 'FLY-TEST-001'],
    gates: ['GATE-WATCH-EPISODES', 'RG06'],
    falsifier: 'Proceeding to implementation without a clear falsification plan and defined work packages.',
    findings: 'Synthesized 3 concrete work packages: WP01 (Pure Domain Watch Condition Unit Test Suite in `src/domain/farely/watchCondition.test.ts`), WP02 (Adversarial Boundary & Monotonic Invariant Verification), WP03 (Full Check Baseline & Remote Convergence).',
    rejectedClaims: 'Rejected skipping pure domain test coverage for watch condition state machine.',
    proposedSolutions: 'Execute WP01, WP02, and WP03.'
  }
];

for (const round of rounds) {
  const padded = String(round.num).padStart(2, '0');
  const filename = join(cycleDir, `round-${padded}.md`);
  const content = `# Cycle 0005 — Research Round ${padded}: ${round.title}

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
