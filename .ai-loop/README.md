# MANHTX Autonomous AI Loop

The primary workflow runs inside the current Codex or Antigravity session. It
uses that host's already-selected model and tools, with no API key, endpoint,
or model configuration. The repository stores the goal protocol and state so
the host can resume the loop.

## Initialize

```bash
npm run ai-loop:init
```

## Start from Codex or Antigravity

Say exactly:

```bash
run goal ai loop
```

The host reads `.ai-loop/GOAL_AI_LOOP.md` and uses the current model/session.

Farely-specific behavior is defined in `FARELY_PROJECT_ADAPTER.md`. It is the
project adapter for the portable core and must be read together with the
`.flycheap` source-of-truth contracts.

Run the Farely-specific contract audit with:

```bash
npm run ai-loop:project-audit
```

This checks that the project mission, acceptance contract, feature contract,
release/runtime gates, performance budgets, status, and blocker ledgers exist
and reports external blockers separately from local evidence validity.

## Optional API runner

```bash
npm run ai-loop:api-run
```

The normal host-native path is `run goal ai loop`, not the API runner.

Before accepting a cycle report, the host must run:

```bash
npm run ai-loop:audit -- <cycle-number>
```

The audit fails closed when a round, value case, mastergoal state, SHA, or
completion evidence is missing. Its result separates `evidenceValid` and
`checkpointComplete` from `completionEligible`; below cycle 1,000,000,000 a
valid checkpoint is expected to remain ineligible for final completion.

State is written atomically after each artifact. It records the latest
`lastArtifact`, `heartbeatAt`, `nextAction`, and continuation flags. The
portable state helper is:

```bash
npm run ai-loop:state -- --cycle 12 --phase research --round 4 \
  --artifact .ai-loop/cycles/0012/round-04.md \
  --next-action "Create round-05.md"
```

Stop it with:

```bash
touch .ai-loop/STOP
```

## Safe end-to-end smoke run

```bash
AI_MOCK=1 AI_RESEARCH_ROUNDS=2 AI_MAX_CYCLES=1 npm run ai-loop:run
```

The mock mode only tests orchestration and state persistence; it does not
pretend to prove product quality.

Farely verification is broader than the generic loop and normally includes:

```bash
npm run check
npm run check:functions
npm run test:functions
npm run test:e2e
npm run test:integration
git diff --check
```
