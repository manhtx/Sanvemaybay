# V14 CONTROL ADDENDUM — STRICT EVIDENCE SEPARATION

## Control Authority Framework
1. **Requirement Authority**: Held exclusively in `docs/convergence/MASTER_ACCEPTANCE_REGISTRY.json` and canonical contract documents.
2. **Implementation Authority**: Confined to code and migrations in `src/`, `supabase/`, and `scripts/`.
3. **Evidence Authority**: Evaluated strictly by `scripts/evidence-admission-controller.mjs` against genuine execution receipts.

## Anti-Fabrication Guarantees
- No static assigning of `exit_code: 0`.
- Probes must be executed dynamically, logging timing and assert statements.
- Achieved evidence level must equal or exceed required level (E1 < E2 < E3 < E4 < E5).
- Under-level evidence is explicitly rejected with `INSUFFICIENT_EVIDENCE_LEVEL`.
