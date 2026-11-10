# Autonomous Farely Evidence Protocol

Every cycle maintains `.ai-loop/cycles/<cycle>/evidence-index.json`, `release-attestation.json`, and `.ai-loop/cycles/<cycle>/evidence-ledger.jsonl`. The release attestation must map claim → requirement/gate → implementation → evidence → falsifier → status and bind codeSha/reportSha.
Each line is one independently checkable claim and includes the required keys
from `.ai-loop/evidence-policy.json`: command or source, result, maturity,
artifact, environment, commit, supported claim, unsupported claim, falsifier,
negative control and limitations.

Farely-specific claims must identify the applicable `FLY-*` requirement and
`GATE-*`/`RG*` gate in `claim_id` or the artifact. A green local build proves
only the exercised local path; it does not prove provider rights, production
coverage, live fare freshness, notification delivery, user savings or business
value. Record those as `BLOCKED_EXTERNAL`, `UNKNOWN` or `PENDING` when they
cannot be measured. Never convert an AI assertion into proof by repetition.

Run before every checkpoint:

```bash
npm run ai-loop:evidence-audit -- <cycle-number>
```

Also run the research, project and value audits. A cycle containing only
documentation, loop-control edits, green tests, repeated audits or generated
reports is invalid unless it proves measurable before/after value or an
explicit risk reduction. Keep failed and blocked entries; they are part of the
audit trail and must not be deleted merely to make the cycle pass.
