# FARELY V22 — CLAIM & EVIDENCE LEDGER

### Evidence Levels:
- **E0**: Claim Only
- **E1**: Source Inspected
- **E2**: Unit Proven
- **E3**: Integration / Database Proven
- **E4**: Production Synthetic Proven
- **E5**: Organic User Proven

| ID | Claim Description | Target Gate | Current Level | Verdict | Verification Evidence |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **CLM-01** | Route-Best Price selection returns absolute mathematical minimum for compatible scope | GATE 01 | E2 | PARTIAL | Unit tests verify sorting; need dedicated multi-variant regression harness |
| **CLM-02** | Price scope fingerprint isolates direct vs stops and specific airport vs city | GATE 02 | E2 | PARTIAL | Filter matching tests in shared Deno code; need strict fingerprint validation |
| **CLM-03** | HAN -> KUL multi-carrier ingestion preserves lowest eligible candidate | GATE 03 | E1 | PARTIAL | Fast-flights 3.1.0 installed; need candidate coverage verification |
| **CLM-04** | Opportunity identity decoupled from observation UUID & generation ID | GATE 04 | E3 | PASS | `observed_fares.ts` & `saved_opportunities.ts` use stable opportunity key |
| **CLM-05** | Global search filters before pagination at database layer | GATE 05 | E3 | PASS | `observed-fares` Edge Function handles SQL filters before `.range()` |
| **CLM-06** | Watch creation fails-closed and `lastCheckedAt` starts `null` | GATE 06 | E3 | PASS | `setup-alert` and `alert-processor` adhere to fail-closed contract |
| **CLM-07** | Saved opportunity persists snapshot context across crawler pruning | GATE 07 | E3 | PASS | `user_saved_opportunities` stores snapshot JSON payload |
| **CLM-08** | Insufficient sample size renders "Chưa đủ dữ liệu đối sánh" without fake median | GATE 08 | E3 | PASS | Frontend Comparator checks threshold and hides median line |
| **CLM-09** | True Cost epistemic states rendered in natural consumer Vietnamese | GATE 09 | E2 | PARTIAL | True Cost helper exists; UI refinement needed to remove developer terms |
| **CLM-10** | High-signal, calm Airfare Price Instrument UI without generic SaaS noise | GATE 10 | E2 | PARTIAL | Redesign directions to be prototyped and evaluated |
| **CLM-11** | Full release convergence across Git SHA, Vercel, Supabase, and DB migrations | GATE 11 | E4 | PASS | Live audit script proved exact SHA match across all layers at `3226662` |
