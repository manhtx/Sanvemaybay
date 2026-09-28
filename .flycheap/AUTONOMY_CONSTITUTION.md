# FLYCHEAP AI — AUTONOMY CONSTITUTION
**Version:** 9.0 — Runtime-First Controller  
**Scope:** FlyCheap Core V1 (`manhtx/Sanvemaybay`)  
**Mission Mode:** Zero-Touch Autonomous Release Certification  

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

## 3. Human Interruption Policy
- **Target Interruption Count:** ZERO.
- **Batched Handoff Law:** When external human action is unavoidable (e.g. cloud quota, commercial keys, final production sign-off), exhaust ALL independent local, ephemeral, and analytical tasks first, inspect the complete remaining release DAG, and batch all currently foreseeable required actions into ONE consolidated `.flycheap/HUMAN_HANDOFF.json` packet. Drip-feeding blockers is prohibited.

---

## 4. Legacy Infrastructure Absolute Protection Rule
- Remote Supabase project `thprsgnpvtzkcvknqfwk` contains 123,000 foreign Macro Platform rows.
- **Rule:** Strictly `FORENSIC_READ_ONLY`. Never run `db reset`, `db push`, drop schemas/tables, delete rows, rewrite migration history, or branch from it.

---

## 5. Epistemic Truth Hierarchy
When evidence conflicts, the following precedence strictly governs:
1. `REAL OBSERVED RUNTIME`
2. `EXECUTED TEST ON EXACT RC`
3. `EXACT IMPLEMENTATION`
4. `FROZEN CONTRACT`
5. `CURRENT DOCUMENTATION`
6. `HISTORICAL REPORT`
7. `AGENT ASSERTION`

Runtime evidence always outranks written prose or test metrics.

---

## 6. Quad-Identity Source & Release Model
To prevent cryptographic ambiguity, the following four identities must never be collapsed:
1. `SOURCE_RC_SHA`: The exact immutable source tree, migrations, and config being certified.
2. `CERTIFICATION_BUNDLE_SHA`: The evidence bundle generated *about* `SOURCE_RC_SHA`.
3. `CONTROL_PLANE_SHA`: The current repository management HEAD (`rc/v6.0-candidate`).
4. `DEPLOYED_SHA`: The exact commit SHA deployed to a specific target environment.

---

## 7. Operational State Machine
The mission progresses through the following sequential states:
```
BOOTSTRAP 
  → RECONCILE 
  → LOCAL_REPAIR 
  → LOCAL_VERIFICATION 
  → SOURCE_RC_FROZEN 
  → SEALED_LOCAL_VERIFICATION 
  → LOCAL_RUNTIME_CLOSURE 
  → STAGING_RESOLUTION 
  → STAGING_PREPARE 
  → STAGING_COMMIT 
  → STAGING_RUNTIME_VERIFICATION 
  → SEALED_STAGING_VERIFICATION 
  → RELEASE_PREPARE 
  → RELEASE_COMMIT 
  → PRODUCTION_VERIFICATION 
  → EMPIRICAL_MONITORING 
  → EMPIRICAL_REVIEW
```
Terminal / Paused States: `BLOCKED_EXTERNAL`, `EMPIRICAL_PENDING`, `EMPIRICALLY_SUPPORTED`.

---

## 8. Proof & Falsification Rules
1. **Production Path Rule:** Validators must execute real product and domain code paths. Proving isolated math without calling production functions is rejected as evidence.
2. **Oracle Triangulation:** Deterministic logic compares canonical contract truth, production implementation, independent reference oracles, and metamorphic invariants. Disagreement triggers an investigation, never majority voting.
3. **Sealed Verification:** Once `SOURCE_RC_SHA` is frozen, verifiers operate in strictly read-only mode against application code, contracts, thresholds, and expected results. Any defect rejects/supersedes the RC.
4. **Mutant Adequacy:** Critical invariants must kill representative fault mutants (inverted comparisons, stale boundaries, dropped fees).
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
