# FlyCheap AI — Proof Index

**Version:** 2.0.0  
**Last Updated:** 2026-09-24  
**Integrity Hash (ACCEPTANCE_CONTRACT.json):** `2bf49b9df0fc93f6953943c3f785587fa5852d2d48e98a8ce75a1454c487efbe`

---

## Proof Mapping Table

| Requirement ID | Priority | Category | Evidence IDs | Current Status | Remaining Proof Gap |
|---|---|---|---|---|---|
| **FLY-DATA-001** | P0 | data_provider | EVD-003, EVD-005 | PASSING | Closed. Multi-adapter normalization (FastFlights, Amadeus, SerpApi) verified. |
| **FLY-DATA-002** | P0 | data_provider | EVD-005 | PASSING | Closed. Strict positive price, date validation, and duration checks pass. |
| **FLY-DATA-003** | P0 | data_provider | EVD-005 | PASSING | Closed. Deduplication and price history observation contracts pass. |
| **FLY-DATA-004** | P1 | data_provider | EVD-004 | PASSING | Closed. Scheduled batch scanning with TTL cache verified in fast-flights-worker.py. |
| **FLY-DATA-005** | P1 | data_provider | EVD-001, EVD-003, EVD-005 | PASSING | Closed. Offline representative fixtures execute cleanly without live provider quota. |
| **FLY-INTEL-001** | P0 | intelligence | EVD-003 | PASSING | Closed. Route/trip-type/lead-time cohorting logic verified. |
| **FLY-INTEL-002** | P0 | intelligence | EVD-003, EVD-005 | PASSING | Closed. Robust medians, percentiles (p20, p80), and rolling windows verified. |
| **FLY-INTEL-003** | P0 | intelligence | EVD-003, EVD-005 | PASSING | Closed. Deterministic Deal Score calculation verified. |
| **FLY-INTEL-004** | P0 | intelligence | EVD-003 | PASSING | Closed. Confidence gating strictly enforces label caps. |
| **FLY-INTEL-005** | P0 | intelligence | EVD-003, EVD-005 | PASSING | Closed. Anomaly and tax floor validation checks pass. |
| **FLY-INTEL-006** | P0 | intelligence | EVD-003, EVD-008 | PASSING | Closed. True cost itemization (known, estimated, optional, unknown) verified in unit & E2E. |
| **FLY-INTEL-007** | P0 | intelligence | EVD-003 | PASSING | Closed. Multi-objective route optimization and layover pruning verified. |
| **FLY-INTEL-008** | P0 | intelligence | EVD-003, EVD-008 | PASSING | Closed. Self-transfer risk rules, airport change penalties, and layover buffers verified in unit & E2E. |
| **FLY-INTEL-009** | P0 | intelligence | EVD-003, EVD-005 | PASSING | Closed. Deterministic Buy/Monitor/Wait classification verified. |
| **FLY-INTEL-010** | P0 | intelligence | EVD-003, EVD-006 | PASSING | Closed. AI explainer prompt structure, schema validation, and fallback tested. |
| **FLY-UX-001** | P0 | user_experience | EVD-003, EVD-007, EVD-008 | PASSING | Closed. Opportunity-first feed ranking and section clustering verified in unit & E2E. |
| **FLY-UX-002** | P0 | user_experience | EVD-007, EVD-008 | PASSING | Closed. Full Deal Detail page verified in build and Playwright desktop & mobile E2E. |
| **FLY-UX-003** | P0 | user_experience | EVD-003, EVD-007, EVD-008 | PASSING | Closed. Flexible discovery by region, budget, and dates verified in unit & E2E. |
| **FLY-UX-004** | P1 | user_experience | EVD-003, EVD-008 | PASSING | Closed. Preference persistence and personalized feed ranking verified. |
| **FLY-UX-005** | P0 | user_experience | EVD-003, EVD-007, EVD-008 | PASSING | Closed. Saved deals lifecycle verified in bookmarks unit tests and Playwright E2E. |
| **FLY-UX-006** | P0 | user_experience | EVD-005, EVD-008 | PASSING | Closed. Turnstile token verification and rate-limit budgets verified in unit & E2E. |
| **FLY-UX-007** | P0 | user_experience | EVD-005, EVD-008 | PASSING | Closed. Deduplicated alert matching and bounded retry policy verified. |
| **FLY-UX-008** | P0 | user_experience | EVD-003, EVD-005, EVD-008 | PASSING | Closed. Feed health and age threshold classification (healthy, degraded, stale) verified in unit & E2E. |
| **FLY-UX-009** | P0 | user_experience | EVD-004, EVD-007, EVD-008 | PASSING | Closed. Skip link, 44px tap targets, and semantic labels verified across Desktop and Pixel 5. |
| **FLY-SEC-001** | P0 | security_privacy | EVD-004 | PASSING | Closed. Zero secrets committed, strict client env exposure verified. |
| **FLY-SEC-002** | P0 | security_privacy | EVD-003, EVD-004 | PASSING | Closed. Strict RLS deny/empty reads verified. |
| **FLY-SEC-003** | P0 | security_privacy | EVD-003, EVD-005, EVD-008 | PASSING | Closed. Strict HTTPS booking domain allowlist verified. |
| **FLY-SEC-004** | P0 | security_privacy | EVD-004, EVD-005 | PASSING | Closed. Transactional account deletion contract verified. |
| **FLY-SEC-005** | P1 | security_privacy | EVD-006 | PASSING | Closed. Automated retention cleanup for telemetry and search caches verified. |
| **FLY-OPS-001** | P1 | operations_resilience | EVD-003, EVD-005 | PASSING | Closed. Circuit breaking and degraded fallback envelopes verified. |
| **FLY-OPS-002** | P0 | operations_resilience | EVD-005, EVD-006 | PASSING | Closed. Precomputed read model and refresh functions verified. |
| **FLY-OPS-003** | P1 | operations_resilience | EVD-003, EVD-004, EVD-005 | PASSING | Closed. Safe correlation IDs, PII-scrubbed error envelopes, and Web Vitals telemetry verified. |
| **FLY-OPS-004** | P0 | operations_resilience | EVD-004 | PASSING | Closed. Clean migration chain replay verified across all 38 migrations. |
| **FLY-OPS-005** | P0 | operations_resilience | EVD-003, EVD-005 | PASSING | Closed. Adversarial edge cases verified across unit suites. |

---

## Empirical Pending Tracking
In accordance with Section 87 of the Execution Contract:
- **EMP-001 (Longitudinal Price Density):** Collection of multi-month price observations across launch cohort routes (ongoing background ingestion).
- **EMP-002 (Production Live Conversion):** Verification of booked user savings upon live partner ticket confirmation.
- **EMP-003 (Long-run Provider Uptime):** 99.9% uptime verification over 30+ consecutive days.
Technical completion is 100% verified. Empirical tracking is active.
