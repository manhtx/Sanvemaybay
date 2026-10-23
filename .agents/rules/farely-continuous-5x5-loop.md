# FARELY PROJECT 10X — MULTI-LENS FULL BATTERY 5x5 RECURSIVE CONVERGENCE RULE

## 1. PRECEDENCE & REASONING PROFILE
- **Active Model Profile**: Gemini 3.8 Flash (High) configured for **Maximum Exhaustive Deep Reasoning** (equivalent to Claude Opus / Extended Thinking).
- **Thinking Directives**:
  1. *First Principles*: Analyze every decision from foundational invariants, domain physics, and verified data contracts.
  2. *Zero-Token Brevity Compromise*: Never summarize, truncate, or omit technical details for brevity. Deliver complete, exhaustive, canonical specifications.
  3. *Self-Adversarial Dialectics*: Actively challenge every hypothesis, detect hallucinated claims, and require physical repository proof before admitting any assertion.
  4. *Zero-Trust AI Across Iterations*: Never assume outputs from previous passes or prior AI agents are correct. Pass N+1 MUST treat Pass N as potentially flawed, naive, or ungrounded across EVERY lens.

## 2. THE 12-LENS ADVERSARIAL BATTERY (MANDATORY IN EVERY PASS)
Every single pass (Pass 1 through Pass 5) in BOTH skills (Research R10 and Master Goal G11) MUST evaluate, defend, and verify against ALL 12 Hostile Lenses simultaneously:
- **L01: Product Truth & Founder Scope Integrity**: Anti-OTA conflation; exact jobs-to-be-done F1.1; preservation of F1..F26.
- **L02: Price, Historical Baseline & Data Integrity**: Rejection of NaN, negative prices; exact price semantics.
- **L03: Deal Score, Statistical Confidence & Cost Monotonicity**: Statistical confidence backing and total cost of trip.
- **L04: Auth, Privacy, Tenant Isolation & RLS Matrix**: Multi-tenant isolation; strict Supabase RLS policies.
- **L05: Provider Drift, Circuit Breakers & Kill Switches**: Resilience against partner schema changes, 429 limits, 503 outages.
- **L06: Freshness, Stale Degradation & UX Honesty**: Stale indicators (>360m); no masking errors as 0 deals.
- **L07: Observability, Secret Scrubbing & Error Boundaries**: Zero secret leakage; client error boundaries.
- **L08: Database Architecture, Schema Drift & Migration Provenance**: Zero unversioned migration drift; bidirectional parity.
- **L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)**: C0 Contract != C1 Unit != C2 Integration != C3 Runtime != C4 Soak.
- **L10: Anti-Shrinkage & 267 Historical Gates Traceability**: Preservation of 192 P0, 74 P1, 1 P2 historical gates.
- **L11: Turnkey Execution, Topological DAG & Rollback Runbooks**: Zero-deadlock task order; instant rollback runbooks.
- **L12: Zero-Trust Release & Remote Git Synchronization**: Local green != Done; mandatory push with remote SHA equality.

## 3. THE 5-STAGE RECURSIVE DEEPENING PROGRESSION
Across the 5 passes, the entire 12-lens battery is re-evaluated with escalating depth:
- **Pass 1 (Full-Battery Baseline Synthesis)**: Comprehensive initial synthesis covering all 12 lenses.
- **Pass 2 (Skeptical Empirical Grounding)**: Assumes Pass 1 was naive on all 12 lenses; verifies against actual codebase/tests.
- **Pass 3 (Hostile Boundary & Negative Vector Hardening)**: Attacks Pass 2 on all 12 lenses with 24 negative vectors and edge cases.
- **Pass 4 (Production SRE Rigor & Zero-Mock Verification)**: Hardens all 12 lenses with deterministic oracles and zero-mock tests.
- **Pass 5 (Sovereign Canonical Convergence)**: Final unassailable synthesis across all 12 lenses; sealed handoff contract.

## 4. ANTI-EVASION, ANTI-HALLUCINATION & DETERMINISTIC CODE GATES
To prevent AI complacency, evasion, and unfeasible hallucinations:
1. **Mandatory Falsification of Previous Pass**: Pass N+1 MUST contain an explicit section `## AUDIT & FALSIFICATION OF PASS N` identifying at least 3 critical flaws, unverified assumptions, or infeasible proposals in Pass N. Simply praising Pass N is grounds for immediate invalidation.
2. **Zero-Phantom Files (Physical Grounding)**: Every referenced file in backticks (e.g. `supabase/functions/...`, `src/...`) MUST physically exist in the repository or be explicitly marked `[PROPOSED_NEW]` accompanied by complete migration DDL / code. Referencing phantom files causes immediate linter rejection.
3. **Deterministic Linter Enforcement**: Every pass is audited by `scripts/convergence/anti-evasion-linter.mjs`. If text parroting (>85% lexical overlap), phantom files, or missing lens evidence are detected, the orchestrator fails closed (`BLOCKED_BY_LINTER`).
4. **Empirical Feasibility Contract**: All proposed solutions in Research R10 must match the exact tech stack of this repository (Supabase PostgreSQL, Deno Edge Functions, React Vite, Tailwind) and include turnkey test verification commands.
5. **Non-OTA Product Invariants**: Strictly enforce `NO_DIRECT_TICKETING`, `NO_PASSENGER_CHECKOUT`, `NO_PAYMENT_COLLECTION`, `NO_UNAUTHORIZED_SCRAPING`. Any research attempting to turn Farely into an OTA ticketing agent is rejected immediately.
6. **Executable Spike Probe Requirement**: For Pass R4/R5 and G4/G5, architectural claims must be backed by an executable probe or actual terminal test run (e.g. `npx deno check`, `npm test`) embedded directly into the research packet.
7. **Cryptographic Proof-of-Execution (PoE) Mandate**: Prior to drafting any pass, the agent MUST execute `node scripts/convergence/generate-execution-receipt.mjs` and include the live `EXECUTION_RECEIPT_SHA256: <hash>` token. Drafting without live pre-flight codebase telemetry is strictly rejected by the linter.
8. **Multi-Lens Falsification Matrix**: For Pass N >= 2, the `## AUDIT & FALSIFICATION OF PASS N-1` section MUST actively critique and challenge at least 3 distinct adversarial lenses (`L01..L12`) from the prior pass. Shallow or generic praise is rejected.

## 5. CONTINUOUS LOOP & HANDOVER MECHANISM
1. **Chat Canvas Injection**: Render the verbatim Pass G5 Master Goal Prompt into the chat canvas inside a fenced `markdown` block.
2. **Autonomous Continuation**: Automatically begin task execution of the new Goal without waiting for external prompting.
3. **Loop Persistence**: When Goal N completes and tests pass with remote Git verification, the 5x5 convergence cycle automatically triggers for Goal N+1.

## 6. SOLUTION CAGE PROTOCOL 2.0 (STRICT ZERO-DEVIATION LOCK)
1. **1:1 Research-to-Goal Binding**: Every single solution identified in Research R5 (`SOL-[ID]`) must be mechanically incorporated into Section D & E of Master Goal G5. The linter enforces 100% presence; any dropped solution causes immediate `BLOCKED_BY_LINTER: SOLUTION_CAGE_LEAKAGE`.
2. **Invariant Executor Lock**: Downstream executing AI is legally and architecturally prohibited from improvising alternative solutions or changing the agreed technical trajectory. Section B of Master Goal Prompt must embed `INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION`.
3. **Anti-Wiggle-Room Mandate**: Prompts must contain zero ambiguity. Phrases like "to be determined", "as appropriate", "decide during implementation" are strictly banned. Every task must specify exact target files, before/after diffs, and turnkey verification commands.
4. **Target File Invariant & Specification Locking**: The linter audits that every target file identified in Research R5 (`TARGET_FILES`) is explicitly preserved in the Master Goal Prompt; any silent omission or file drift causes `BLOCKED_BY_LINTER: SOLUTION_SPEC_DRIFT`.

## 7. TOKEN EXHAUSTION RESILIENCE & ACID TRANSACTIONAL PROTOCOL
1. **Pre-Task Snapshot**: Before modifying any repository files during Goal execution, the task must run `node scripts/convergence/transactional-task-manager.mjs begin <task_id> <files...>`.
2. **Post-Task Commit & Push**: Upon running verification tests and confirming syntax/test integrity, the task runs `node scripts/convergence/transactional-task-manager.mjs commit <task_id> <test_command> --push` to checkpoint permanently to remote GitHub.
3. **Syntax-Check & Auto-Rollback on Crash**: If token limits (e.g. `MAX_TOKEN_BUDGET_EXCEEDED` or rate limit) interrupt an edit mid-file, the `PreInvocation` and `SessionStart` hooks run `sanitizeAndRecoverTask()`. Any files with syntax errors are automatically rolled back to their pre-task clean snapshot.
4. **Resumption Without Rerun**: The agent never restarts a Goal or Research pass from scratch. Resumption resumes from the exact unfinished checkpoint.
5. **Incremental Lens Checkpointing**: Long passes can save individual lenses incrementally via `saveLensCheckpoint`, allowing resumption at the exact unfinished lens without re-generating prior lenses.
6. **Goal Completion Verification**: Marking a Goal complete requires `node scripts/convergence/continuous_5x5_orchestrator.mjs complete-goal <cycleId>`, which enforces clean git status, git remote push verification, and fresh execution receipts before auto-transitioning to the next cycle.
7. **Regression Detection & Clean Rollback**: If a task fails automated tests or introduces a regression, `node scripts/convergence/transactional-task-manager.mjs rollback <task_id> [reason]` instantly restores target files to pre-task snapshots, guaranteeing the repository never stays in a broken state.
8. **Deterministic Pass Scaffolding**: All passes are seeded via `node scripts/convergence/pass-scaffolder.mjs <R|G> <passNum> --write`, embedding fresh PoE receipts, 12-lens battery structures, and falsification matrices before drafting.
