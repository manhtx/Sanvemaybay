# FlyCheap AI — Engineering Principles

1. Evidence before claims: no mock, placeholder or stale data is presented as live.
2. Deterministic rules before AI: scoring, cost, risk and safety decisions remain inspectable.
3. Source-of-truth documentation precedes implementation changes.
4. Server-side secrets only; browser code receives normalized results, never provider credentials.
5. Historical data is append-only and writes are idempotent where retries are possible.
6. Failure isolation: provider, AI and notification failures do not take down the feed.
7. Responsive, accessible UX is part of feature completion, not a scaffold milestone.
8. Every material workflow needs success, failure, edge-case and regression evidence.
9. External dependency blockers are recorded with evidence instead of being hidden behind UI states.
10. Keep changes focused, reviewable and consistent with the existing architecture.
