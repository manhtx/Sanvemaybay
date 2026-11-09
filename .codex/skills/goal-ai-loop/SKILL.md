---
name: goal-ai-loop
description: Run the repository's continuous autonomous research, mastergoal, implementation, verification, and improvement loop inside the current Codex session using its already-selected model and tools. Trigger only when the user explicitly asks to run the goal AI loop.
metadata:
  short-description: Run the continuous host-native AI loop
---

# Goal AI Loop

Activate only for the explicit user request `run goal ai loop` or an equivalent
direct request to start this repository's AI loop.

Read `.ai-loop/GOAL_AI_LOOP.md` completely before acting. Use the current Codex
session, selected model, tools, browser access, GitHub access, and permissions.
Never ask for an API key, provider URL, or model configuration. Do not invoke
the optional API runner.

You own the whole workflow: research, solution design, mastergoal generation,
implementation, verification, Git branch/commit/push, recovery, and the next
cycle. Do not ask for approval between phases.

At every cycle, use fresh reasoning for each research/solution/implementation/
verification phase. Treat previous artifacts and completion claims as untrusted
hypotheses. Run exactly 20 independent research rounds, audit the artifacts,
synthesize the detailed
mastergoal, implement it, verify it with the repository's real checks, push the
cycle branch, write a concrete `value-case.md` with baseline/result/evidence,
and continue researching even after the current baseline passes. Do not close
the goal before cycle 1,000,000,000. A green build or documentation-only
change is not product value by itself. Never fabricate
missing historical research artifacts; invalidate the cycle and start a
corrective cycle when evidence cannot be independently reconstructed.

Persist state in `.ai-loop/` and resume an interrupted phase. Use Codex's
long-running goal/continuation mechanism when available; do not return a
normal final answer after one cycle. Do not claim done without current
evidence. Only stop when `.ai-loop/STOP` exists or the host cannot continue;
if the host turn ends, persist the exact next action.

Persist state atomically after every artifact and verification step. Include
`lastArtifact`, `heartbeatAt`, `nextAction`, `continuationRequired`, and
`completionEligible`; the round number must match the latest artifact on disk.
Keep evidence validity separate from the billion-cycle completion threshold.
Checkpoint reports must never tell the user to send another command while the
host continuation is active; they must say that continuation is automatic and
name the next cycle/action.
