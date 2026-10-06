# Farely Product & Engineering Convergence Plan

## Milestones & Status

| Phase | Milestone | Focus Areas | Status | Validation Command |
|---|---|---|---|---|
| M0 | Mission Control & Baseline | Create docs/convergence, confirm baseline and reproduction | COMPLETED | `git status`, test runs |
| M1 | Snapshot & Generation Integrity | Fail-closed reader, quarantine incomplete generations | COMPLETED | `npm run test:functions`, Node drill tests |
| M2 | Watch Predicate & Evaluation | Remove hidden 20% discount, exhaustive candidate scanning | COMPLETED | `npm run test:functions` |
| M3 | Data Rights & Telemetry | Fix export columns, harmonize product event registry | COMPLETED | `npm run test:functions`, `npm test` |
| M4 | Search Robustness & Truth | Distinguish provider errors from empty inventory | COMPLETED | `npm test`, `npm run test:e2e` |
| M5 | Full Suite & Parity Check | Run Vitest, Node tests, Deno checks, E2E | COMPLETED | `npm run test:all`, `npm run check:functions` |
| M6 | Release & Production Sync | Push to main, deploy Edge Functions, verify remote parity | IN_PROGRESS | `gh workflow run`, curl release.json |
| M7 | Hostile Adversarial Review | Independent attacks against all 18 convergence gates | PENDING | Negative control scripts |
| M8 | Attestation & Final State | Generate final audit artifacts and durable state | PENDING | Attestation scripts |
