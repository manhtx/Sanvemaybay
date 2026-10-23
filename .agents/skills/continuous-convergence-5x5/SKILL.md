---
name: continuous-convergence-5x5
description: Executes the continuous 5x5 recursive deepening loop across ALL 12 Adversarial Lenses simultaneously for every pass (5 passes Research R10 + 5 passes Master Goal Compiler G11) with Zero-Trust AI verification and automatic continuous handover into the chat canvas.
---

# Continuous 5x5 Multi-Lens Convergence Engine

This skill orchestrates the end-to-end continuous convergence pipeline for Farely Project 10X.
Unlike simple sequential pipelines, **EVERY SINGLE PASS (R1..R5 and G1..G5) evaluates and defends against ALL 12 ADVERSARIAL LENSES SIMULTANEOUSLY**.

## The 12 Adversarial Lenses Battery
Every pass must explicitly evaluate, defend against, and cite physical evidence for:
1. **L01: Product Truth & Founder Scope Integrity**: Anti-OTA conflation; exact F1.1 jobs-to-be-done; no fake deal booking claims; preservation of F1..F26.
2. **L02: Price, Historical Baseline & Data Integrity**: Rejection of NaN, negative prices, unbounded numbers; exact price semantics.
3. **L03: Deal Score, Statistical Confidence & Cost Monotonicity**: Anti-hallucinated discount claims; deal score backed by sample confidence and total cost.
4. **L04: Auth, Privacy, Tenant Isolation & RLS Matrix**: Multi-tenant isolation; strict Supabase RLS policies; watch alert confidentiality.
5. **L05: Provider Drift, Circuit Breakers & Kill Switches**: Resilience against partner schema changes, 429 rate limits, 503 outages.
6. **L06: Freshness, Stale Degradation & UX Honesty**: Stale indicators for data >360m; no masking errors as 0 deals.
7. **L07: Observability, Secret Scrubbing & Error Boundaries**: Zero secret leakage in client/browser logs; client error boundaries.
8. **L08: Database Architecture, Schema Drift & Migration Provenance**: Zero unversioned migration drift; bidirectional parity.
9. **L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)**: Strict separation: C0 Contract != C1 Unit != C2 Integration != C3 Runtime != C4 Soak.
10. **L10: Anti-Shrinkage & 267 Historical Gates Traceability**: Preservation of all 192 P0, 74 P1, 1 P2 historical gates.
11. **L11: Turnkey Execution, Topological DAG & Rollback Runbooks**: Zero-deadlock dependency order; file-level before/after specs; rollback runbooks.
12. **L12: Zero-Trust Release & Remote Git Synchronization**: Local green != Done; mandatory push with remote SHA equality.

---

## Recursive Deepening Protocol

### Phase 1: Research Project Source R10 (5 Passes × 12 Lenses)
- **Pre-Flight Telemetry**: Before drafting each pass, execute `node scripts/convergence/generate-execution-receipt.mjs` and embed `EXECUTION_RECEIPT_SHA256: <hash>`.
- **Pass R1 (Full-Battery Baseline Synthesis)**: Comprehensive baseline evaluating all 12 lenses -> `docs/convergence/r10/R1_FULL_RESEARCH.md`
- **Pass R2 (Skeptical Empirical Grounding)**: Falsify Pass R1 on all 12 lenses; verify against actual code/tests -> `docs/convergence/r10/R2_FULL_RESEARCH.md`
- **Pass R3 (Hostile Boundary & Negative Vector Hardening)**: Attack with NV01..NV24 and A01..A40 across all 12 lenses -> `docs/convergence/r10/R3_FULL_RESEARCH.md`
- **Pass R4 (Production SRE Rigor & Zero-Mock Verification)**: Enforce C0..C4 proof hierarchy and zero-loss rollbacks -> `docs/convergence/r10/R4_FULL_RESEARCH.md`
- **Pass R5 (Sovereign Canonical Synthesis)**: Synthesize final unassailable V5 packet and freeze FARELY-XFER/6 -> `docs/convergence/r10/R5_FULL_RESEARCH_CANONICAL.md`

### Phase 2: Master Goal Compiler G11 (5 Passes × 12 Lenses)
- **Pass G1 (Lossless Structural Projection A–K)**: Project FARELY-XFER/6 into an 11-section A–K Master Goal -> `docs/convergence/g11/G1_FULL_MASTER_GOAL.md`
- **Pass G2 (Before/After Specification Deepening)**: Detail exact file-level modifications and schema DDLs -> `docs/convergence/g11/G2_FULL_MASTER_GOAL.md`
- **Pass G3 (Anti-Fake Done & Independent Gates Hardening)**: Lock down verification gates; forbid self-certification -> `docs/convergence/g11/G3_FULL_MASTER_GOAL.md`
- **Pass G4 (Topological Task Ordering & Automated Verification Commands)**: Embed turnkey shell verification commands -> `docs/convergence/g11/G4_FULL_MASTER_GOAL.md`
- **Pass G5 (The Sovereign Master Goal Prompt)**: Final unassailable Master Goal Prompt -> `docs/convergence/g11/G5_FULL_MASTER_GOAL_CANONICAL.md`

---

## Anti-Evasion & Deterministic Verification Tooling
Every pass is automatically audited by the deterministic linters:
1. `node scripts/convergence/anti-evasion-linter.mjs <currentPass.md> [prevPass.md]`:
   - Validates live cryptographic execution receipt (freshness < 60m).
   - Validates presence of mandatory `## AUDIT & FALSIFICATION OF PASS N-1`.
   - Validates zero phantom file references.
   - Validates non-OTA product invariants (`NO_DIRECT_TICKETING`, `NO_PASSENGER_CHECKOUT`).
   - Validates lexical novelty (>8% new technical terms/code).
2. `node scripts/convergence/validate-research-probes.mjs <currentPass.md>`:
   - Validates that TypeScript imports match `package.json` dependencies.
   - Validates that SQL table queries match existing tables in `supabase/migrations/`.
3. `node scripts/convergence/continuous_5x5_orchestrator.mjs`:
   - Coordinates pass tracking, SHA-256 calculation, and canonical export.

---

## Phase 3: Chat Delivery & Autonomous Execution
1. Output Pass G5 verbatim into the chat canvas inside a fenced `markdown` code block.
2. Advance execution state to the new Goal tasks without requiring user intervention.
3. Automatically re-trigger the 5x5 cycle upon verified goal completion and remote Git push.
