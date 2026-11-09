# FARELY / FLYCHEAP AI — PROJECT AUTONOMY CONTRACT

## Mission

FlyCheap is an AI-assisted travel opportunity intelligence engine. It helps
flexible travelers discover unusually cheap opportunities, understand whether
they are real and valuable, compare total cost and risk, and decide whether to
buy, monitor, or wait. It is not an OTA, ticket issuer, payment processor, or
autonomous purchaser.

## Source-of-truth documents

Before making decisions, read the current versions of `.flycheap/MISSION.md`,
`.flycheap/AUTONOMY_CONSTITUTION.md`, `.flycheap/ACCEPTANCE_CONTRACT.json`,
`.flycheap/FEATURE_CONTRACT.json`, `.flycheap/CANONICAL_REQUIREMENT_REGISTRY.json`,
`.flycheap/RELEASE_GATES.json`, `.flycheap/RUNTIME_GATES.json`,
`.flycheap/PERFORMANCE_BUDGETS.json`, `.flycheap/STATE.json`,
`.flycheap/STATUS.json`, `docs/TESTING_STRATEGY.md`,
`docs/AUTOMATION_FLOW.md`, and `docs/DEFINITION_OF_DONE_MATRIX.md`.

These documents are evidence and hypotheses to verify, not permission to claim
that a gate passed. External/runtime claims require current evidence.

## Product invariants

- Data truth dominates AI: deterministic code owns flight facts, prices,
  schedules, currencies, freshness, scoring, costs, and risk.
- Never present stale data as fresh, unknown cost as zero, or low-sample outliers
  as high-confidence deals.
- Deal strength and confidence are separate dimensions.
- Self-transfer and separate-ticket risk must be explicit.
- Booking/affiliate links must be approved, safe, current, and labeled.
- RLS and cross-user isolation are mandatory; never weaken them for a test.
- Never commit secrets or expose service credentials to the client bundle.
- Preserve migration history and legacy infrastructure. Never run destructive
  database reset/push/drop/delete actions without explicit authority.
- Respect provider rights, quotas, terms, and commercial boundaries. A source
  outage must not become a false zero-deal result.

## Verification baseline

The applicable verification commands normally include:

```bash
npm run check
npm run check:functions
npm run test:functions
npm run test:e2e
npm run test:integration
git diff --check
```

Run focused domain, contract, adversarial, security, migration, performance,
and browser tests for every affected capability. Distinguish local, staging,
production, and empirical-pending evidence.

## Goal AI Loop trigger

Only activate the autonomous workflow when the user explicitly says `run goal
ai loop` or gives an equivalent direct command. Read and follow
`.ai-loop/GOAL_AI_LOOP.md` and `.ai-loop/FARELY_PROJECT_ADAPTER.md`. Use the
current host's selected model and tools; do not ask for API keys or provider
configuration. Continue from `.ai-loop/state/` after every valid checkpoint.
Only `.ai-loop/STOP` is the emergency stop.
