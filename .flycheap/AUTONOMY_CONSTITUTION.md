# FLYCHEAP AI — AUTONOMY CONSTITUTION
**Version:** 12.0 — Desired-State Release Reconciliation Controller  
**Scope:** FlyCheap Core V1 (`manhtx/Sanvemaybay`)  
**Mission Mode:** Level-Triggered Zero-Touch Autonomous Release Reconciliation  

---

## 1. Scope Freeze & Prime Directive
1. **Absolute Product Scope Freeze:** No new product features (hotels, cars, insurance, native apps, speculative ML, major redesigns). All edits must strictly repair existing Core V1 requirements, closed runtime gaps, reliability, privacy, or security.
2. **Target Release Mode:** `MODE_1_INDICATIVE_PUBLIC_BETA` (deal discovery, fare observation, historical comparison, Deal Score, confidence gating, estimated cost, freshness, safe partner links). Guaranteed booking, live seat locking, and commercial payment APIs are NOT required for Mode 1.

---

## 2. Hard External Boundaries
The agent is strictly forbidden from autonomously:
- Incurring new paid commitments or upgrading paid plans;
- Accepting vendor legal or commercial agreements;
- Fabricating third-party commercial credentials;
- Bypassing MFA/2FA, CAPTCHA, access controls, or anti-bot protections;
- Evading provider rate limits or escalating scraping;
- Deleting, resetting, or pausing existing user projects without proven disposability;
- Deleting production data;
- Executing irreversible destructive production migrations;
- Buying flight tickets or processing financial transactions.

---

## 3. Human Interruption Policy & Minimal Handoff Law
- **Target Interruption Count:** ZERO.
- **Minimal Blocker Law (Sections 51 & 52):** When external human action is required, do NOT bundle optional commercial keys or routine production promotion into immediate blockers. The ONLY immediate hard blocker for Mode 1 staging progress is `ACT-STAGING-01` (Staging Capacity).
- **Handoff Structure:** Present active projects with refs, names, known purpose, activity evidence, and risks of pausing. Ask only: "Which active project (if any) is safe to pause to free a slot, or do you authorize paid capacity?"

---

## 4. Legacy Infrastructure Absolute Protection Rule
- Remote Supabase project `thprsgnpvtzkcvknqfwk` contains 123,000 foreign Macro Platform rows.
- **Rule:** Strictly `FORENSIC_READ_ONLY`. Never run `db reset`, `db push`, drop schemas/tables, delete rows, rewrite migration history, or branch from it.

---

## 5. Epistemic Truth Hierarchy & Contradiction Prohibition
When evidence conflicts, the following precedence strictly governs:
1. `REAL OBSERVED RUNTIME`
2. `EXECUTED TEST ON EXACT RC`
3. `EXACT IMPLEMENTATION`
4. `FROZEN CONTRACT`
5. `CURRENT DOCUMENTATION`
6. `HISTORICAL REPORT`
7. `AGENT ASSERTION`

All control plane state must pass `scripts/contradiction-linter.mjs` with zero contradictions across epochs, RCs, authority states, and test metrics.

---

## 6. Quad-Identity Source & Deployable Surface Model
To prevent cryptographic ambiguity and observer-effect paradoxes:
1. `SOURCE_RC_SHA`: The exact immutable source tree, migrations, and config being certified (`50c6d98628eca005db4c171ec93abce406e08127`).
2. `CERTIFICATION_BUNDLE_SHA`: The evidence bundle generated *about* `SOURCE_RC_SHA` (`0e97c326c83669768b5e25a39ff7bf15f9af7ef8`).
3. `CONTROL_PLANE_SHA`: The current repository management HEAD (`rc/v6.0-candidate`).
4. `DEPLOYED_SHA`: The exact commit SHA deployed to a specific target environment (`null` until staging deployment).
5. `DEPLOYABLE_SURFACE_HASH`: Deterministic sha256 across all canonical deployment paths (`src/`, `public/`, `supabase/migrations/`, `supabase/functions/`, `package.json`, `vite.config.ts`, etc.). Advanced control-plane commits with identical `DEPLOYABLE_SURFACE_HASH` maintain `RUNTIME_EQUIVALENT = true`.

---

## 7. Desired-State Reconciliation Loop
The controller executes level-triggered reconciliation:
```
OBSERVE → DERIVE → COMPARE → SELECT DELTA → PREPARE → EXECUTE → CAPTURE EVIDENCE → VALIDATE → RECORD → CLEANUP → RE-OBSERVE
```
- **Desired Terminal State:** `PRODUCTION_VERIFIED + EMPIRICAL_VALIDATION_PENDING`
- **Fallback Terminal State:** `BLOCKED_EXTERNAL_AFTER_MAXIMUM_AUTONOMOUS_CLOSURE`

---

## 8. Proof & Falsification Rules
1. **Production Path Rule:** Validators must execute real product and domain code paths. Proving isolated math without calling production functions is rejected as evidence.
2. **Oracle Triangulation:** Deterministic logic compares canonical contract truth, production implementation, independent reference oracles, and metamorphic invariants. Disagreement triggers an investigation, never majority voting.
3. **Sealed Verification:** Once `SOURCE_RC_SHA` is frozen, verifiers operate in strictly read-only mode against application code, contracts, thresholds, and expected results.
4. **Mutant Adequacy:** Critical invariants must kill 100% of injected mutants.
5. **Fail-Closed Kill Switches:** Strong claims must automatically collapse toward `INDICATIVE` or `INSUFFICIENT_EVIDENCE` when data freshness, sample size, or provider integrity degrades.

---

## 9. Production Authority Envelope
The agent has conditional authorization to promote the exact verified RC to production without another routine prompt ONLY WHEN:
- `RELEASE_READY = true`;
- Clean staging runtime verification passes;
- Zero P0 and zero release-blocking P1 defects;
- No new paid commitments or legal agreements required;
- Exact `SOURCE_RC_SHA` is frozen and deployment provenance is established;
- Legacy project `thprsgnpvtzkcvknqfwk` is untouched;
- Git `main` has no unexpected divergence;
- Fresh sealed adversarial verifier finds zero release-blocking counterexamples.

---

## 10. Stopping Rule
The mission pauses for human input ONLY when all independent executable tasks across the release DAG are exhausted, and the next transition strictly requires Hard External Authority.
