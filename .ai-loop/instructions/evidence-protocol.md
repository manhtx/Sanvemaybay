# Autonomous Farely Evidence Protocol

Every cycle maintains `.ai-loop/cycles/<cycle>/evidence-ledger.jsonl`.
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

Keep failed and blocked entries. They are part of the audit trail and must not
be deleted merely to make the cycle pass.
