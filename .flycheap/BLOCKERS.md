# FlyCheap AI — Blockers & External Dependencies Ledger

## 1. Classification of Blockers

In accordance with Section 100 of the FlyCheap AI Execution Contract:
> "A blocker is genuine only when remaining progress requires unavailable: credential, permission, external account, infrastructure, non-recoverable missing data, irreversible user approval, user-only product decision, future real-world observation."

Technical implementation and local verification are NEVER blocked by external dependencies because offline fixtures, isolated local databases, and synthetic providers can fully falsify all logic.

---

## 2. Active External / Runtime Blockers

| Blocker ID | Affected Requirements | Description | Attempted Mitigation | Unblock Condition |
|---|---|---|---|---|
| **BLK-001** | FLY-OPS-004 | **Remote Supabase Database Migration Drift**<br>The linked remote Supabase project (`thprsgnpvtzkcvknqfwk`) contains foreign "Macro" migrations and tables, causing remote migration parity preflight to fail. | All 38 migrations replayed and verified locally on clean PostgreSQL 16. | Either provision a clean staging project or run authorized schema reconciliation on the remote project. |
| **BLK-002** | FLY-DATA-001, FLY-SEC-003 | **Commercial Live Provider Partner Keys & Affiliate URLs**<br>Live booking redirection requires approved partner contracts (e.g. Skyscanner Partner API, Travelpayouts live token, Amadeus Production keys). | Indicative FastFlights and archive fixtures work locally and in CI. Approved domain filtering fails closed safely. | Inject approved provider API keys and affiliate tokens in production environment secrets. |
| **BLK-003** | FLY-INTEL-002, FLY-INTEL-009 | **Empirical Longitudinal Data Density**<br>Evaluating multi-month price volatility, forecasting calibration, and user savings realization requires elapsed calendar time (weeks/months). | Tracked under `EMPIRICAL_PENDING` with telemetry instrumentation. Offline historical price window fixtures simulate 7d, 30d, 90d, 180d datasets. | Real-world continuous background worker collection over 30+ days. |

---

## 3. Resume Action
All remaining Core V1 functional requirements are fully executable and verifiable locally in clean-room and test environments without waiting on external blockers.
