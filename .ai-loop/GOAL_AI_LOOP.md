# GOAL AI LOOP — HOST-NATIVE AUTONOMOUS WORKFLOW

## Activation

Activate only when the user explicitly says `run goal ai loop`.

Run inside the current Codex or Antigravity session and use the model, tools,
browser access, repository access, GitHub access, and session selected by that
host. Do not ask for an API key, provider URL, model name, or external AI
configuration.

## Authority

You are the single autonomous owner. You may research, decide solutions, edit
the repository, create scripts, run commands, use browser tools, create
branches, commit, push GitHub, repair this loop, and continue into the next
cycle. Do not wait for human approval.

Every previous research, solution, implementation, and verification result is
an untrusted hypothesis. Independently re-check the current repository and
runtime before relying on it.

## Persistent state

Read and update:

- `.ai-loop/input/previous-response.md`
- `.ai-loop/state/loop-state.json`
- `.ai-loop/cycles/<cycle>/`
- `.ai-loop/reports/`
- `AGENTS.md`
- `docs/manhtx-project10x-master/`

For this project also read `AGENTS.md` and `.ai-loop/FARELY_PROJECT_ADAPTER.md`
before the first research round. The Farely adapter overrides generic product
examples with the current `.flycheap` mission, capability contracts, release
gates, runtime gates, provider boundaries, and empirical evidence rules.

Resume an active phase instead of starting a conflicting cycle. If a host turn
ends, persist the exact phase, findings, evidence, and next action.

After every artifact and verification step, update the state atomically. State
must include `lastArtifact`, `heartbeatAt`, `nextAction`,
`continuationRequired`, and `completionEligible`; the recorded round must
match the latest round artifact on disk.

Before accepting a Farely cycle checkpoint, run both `npm run
ai-loop:project-audit` and `npm run ai-loop:audit -- <cycle>`. The project audit
must pass its source-of-truth integrity checks; its warnings about external or
empirical blockers must be preserved in the report, not converted into a
fabricated PASS.

Also run `npm run ai-loop:evidence-audit -- <cycle>`. The cycle must contain
an append-only `evidence-ledger.jsonl` using `.ai-loop/evidence-policy.json`.
Each claim needs a command/source, maturity level, environment, commit,
limitation, falsifier and negative control. A local build, test, certification
file or AI assertion does not prove production, provider, user or business
outcomes. Use `BLOCKED_EXTERNAL`, `UNKNOWN` or `PENDING` when those outcomes
cannot be measured, and never use PROVEN, VERIFIED, COMPLETE, 10/10 or 100/100
as substitutes for evidence.

## Infinite cycle

The completion policy is hard-coded in `.ai-loop/loop-policy.json`:

```text
minCyclesBeforeCompletion = 1,000,000,000
```

The goal must never close, return DONE, or emit a final completion report while
the current cycle is below that threshold. Passing a requirement, passing all
tests, or a previous goal saying DONE is not sufficient. Before the threshold,
write only a checkpoint, persist state, and start another complete research
cycle. After a successful implementation, continue looking for
better visual direction, stronger interaction, clearer architecture, new
defects, missing evidence, performance improvements, accessibility issues,
content truth issues, and better long-term product decisions.

Only an explicit `.ai-loop/STOP` file is a normal stop condition. If the host
supports long-running goals, queued follow-ups, background continuation, or
task resumption, use that capability and do not return a normal final answer
after one cycle. If the host turn limit is reached, persist state and request
the host's continuation mechanism with the exact next action; never claim that
the overall loop is complete.

## Required cycle

### 1. Independent research

Run exactly 10 independent full-product research rounds using fresh reasoning/context. Each
round may read the previous round only as untrusted evidence and must challenge
it. Round 10 must still be a research round; synthesis belongs in the separate
`mastergoal.md` artifact.
Inspect:

- current source, runtime, Git history, branch, diff, and previous AI response;
- `AGENTS.md` and all current 10x research/mastergoal documents;
- build, TypeScript, ESLint, responsive, console, screenshot and audit output;
- public website, GitHub, Vercel and professional/official sources when the
  current host has access;
- visual composition, typography, grid, assets, motion, interaction, routes,
  responsive behavior, accessibility, performance, content truth and system
  risks;
- Farely flight-search and fare-opportunity journeys, source/provider rights,
  ingestion and normalization, true price/tax/baggage calculations,
  self-transfer and route risk, scoring versus confidence, RLS/privacy,
  notifications/outbox, Edge Functions, freshness, and release evidence.

For Farely, replace the portfolio-specific inspection with the full flight
opportunity system: provider provenance and rights, ingestion and immutable
observations, freshness/quarantine, deal score/confidence, true cost and
self-transfer risk, route optimization, feed/search/detail/compare/watch/alert
journeys, Supabase migrations/RLS/Edge Functions/workers, release provenance,
adversarial corpus, performance budgets, and staging/production/empirical
boundaries. Use the project adapter's required research lenses.

Do not implement code during research. Record every round with findings,
evidence, rejected claims, unresolved questions, falsifiers and exact proposed
solutions. Keep negative and blocked findings in the ledger.

Persist every round twice: `round-XX.json` is the machine packet with action,
retained tool-output and evidence provenance; `round-XX.md` is the human deep
dossier. The dossier must connect traveler/product/business problem to root
cause, exact Farely solution, acceptance and falsifier. IDs, headings or
repeated templates without linked observations do not count. After round 1
require new evidence and revised/rejected claims.

### 2. Mastergoal synthesis

After all 10 round artifacts exist, run `npm run ai-loop:research-audit -- <cycle>` and `npm run ai-loop:audit -- <cycle>`.
Treat `evidenceValid`, `checkpointComplete`, and `completionEligible` as
separate fields. A cycle below 1,000,000,000 can have valid evidence and a
completed checkpoint while remaining ineligible for final completion. The
threshold is a continuation condition, not an evidence failure.

Never fabricate a missing historical round from a report, summary, or later
knowledge. If a round cannot be independently reconstructed with its original
research evidence, mark that cycle invalid and start a corrective cycle with a
new baseline instead of backfilling a convincing-looking artifact.

Before implementation, write `value-case.md` for the cycle. It must state the
real user/product problem, the baseline evidence, the exact change, the
expected impact metric, the observed result, and links to evidence. A green
build, a refactor, a repeated audit, or a documentation-only change is not
product value by itself. If the correct decision is not to change code, record
why that protects the product and what new evidence was gained; do not label it
an improvement without proof.
Include the complete scope, changes from the prior mastergoal, exact solutions,
affected files/routes/assets, execution waves, dependencies, invariants,
acceptance criteria, evidence requirements, all verification commands and
GitHub push instructions. Do not delegate important solution design to the
executor. After research passes, perform exactly 5 independent mastergoal
refinement rounds. Each refinement rereads all 10 research dossiers and the
prior mastergoal as untrusted evidence, persists `mastergoal-round-01.md`
through `mastergoal-round-05.md`, and only the fifth passing refinement may
enter implementation. This is a semantic evidence gate, not a length gate.

### 3. Implementation

Create or continue a dedicated cycle branch. Implement every wave in the
mastergoal. Use the existing build, typecheck, lint, test, audit, browser,
screenshot and negative-test scripts. Repair failures yourself, preserve all
protected interactions, commit the complete work, and push the branch to
GitHub. Record the exact SHA and push result. Do not ask for approval.

### 4. Verification and continuation

Never claim DONE from intention, a green build alone, or absence of an obvious
error. Record command output, source references, screenshots, runtime behavior
and Git SHA. If push fails, retry and record the failure. Run
`npm run ai-loop:audit -- <cycle>` before every checkpoint report. When the
baseline is verified, immediately start the next independent research cycle.
Do not write “send the next command” while the host has an active continuation;
state that continuation is automatic, name the next cycle, and record the
exact next action.

## Failure policy

- Retry transient host/tool errors.
- Feed action errors back to yourself and revise the action.
- Fix build/test failures instead of claiming completion.
- Re-run checks when evidence is missing.
- Mark stale documents stale and verify current behavior.
- If external access is missing, continue with local evidence and record the gap.
- If context ends, persist state and resume; do not compress away required scope.

At the end of every turn, leave the current cycle/phase, evidence paths,
rejected claims, exact next action, GitHub push status, and confirmation that
the next cycle must continue even if the current cycle passed. The only
non-threshold stop is an explicit emergency `.ai-loop/STOP` file.

## Evidence-failure continuation

If any Farely cycle, provider/provenance audit, value-case,
release-attestation, or evidence gate fails after implementation, mark the
cycle invalid, retain every failed validation output, and advance to a new
corrective cycle in `research` phase. The next cycle must independently
re-read Farely and repair the failure; repeatedly re-running the same failed
evidence phase is not progress.
