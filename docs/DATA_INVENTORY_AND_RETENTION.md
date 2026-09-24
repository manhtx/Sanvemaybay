# FlyCheap AI — Data Inventory and Retention Contract

**Status:** Repository contract; production verification pending  
**Updated:** 2026-08-20

| Data | Purpose | Storage | Access | Proposed retention |
|---|---|---|---|---|
| Raw flight observations | Baseline, provenance and audit | `flights` | backend/service role | 7 days; aggregate/history is stored separately |
| Observed fare snapshots | Fast public discovery read | `observed_fare_snapshots` | Edge Function only | follows valid raw/current departure window |
| Live deals/snapshots | Verified offer feed/history | `deals`, `deal_snapshots` | public read through truth gates | active until expiry; history per research policy |
| Email | Alert confirmation/delivery | `user_alerts` | service role; user management link | until unsubscribe/delete plus bounded operational retention |
| Telegram ID | Requested Telegram alert | `user_alerts` | service role | until unsubscribe/delete |
| Account deletion state | Idempotent deletion, retry and completion evidence | `account_deletion_requests` | service role only | completed requests 180 days; incomplete/error states retained for reconciliation |
| Auth user ID | Account ownership | Supabase Auth/owned tables | owner + backend | account lifetime; delete cascade/set-null by table contract |
| Preferences/bookmarks | Personalization | browser + owned DB rows | user owner | until reset/account deletion |
| Product events | Minimal product measurement and 25% session-sampled CLS/INP/LCP | bounded browser queue + rate-limited `track-event` + `product_events` | service write; analytics operators | 90 days |
| Notification deliveries | Idempotency/support | `notification_deliveries` | owner/backend | 180 days |
| Rate-limit buckets | Abuse prevention | `request_rate_limits` | service role | 2 days |
| Operational logs | Reliability/security | platform logs | restricted operators | shortest period supporting incidents/SLO |

## Prohibited data

FlyCheap does not currently request or store passport data, payment card data,
booking credentials or provider passwords. These remain explicit non-goals.

## Required controls before public beta

- Runtime verification that the internal retention job executes after the
  hourly pipeline. Pending/unsubscribed alerts are removed after 30 days;
  scan telemetry and product events after 90 days.
- Deploy and verify the authenticated export/delete workflow against a
  dedicated test account; repository implementation is complete but no user
  account was deleted during local verification.
- Vendor register and purpose/legal review for Supabase, hosting, email,
  Telegram, analytics, provider/affiliate and CAPTCHA vendors.
- PII/log redaction tests and operator access review.
- Production RLS/grants audit; this document is not runtime proof.
