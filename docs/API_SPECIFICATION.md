# FlyCheap AI — API Specification

**Version:** 1.0  
**Status:** Draft / implementation-aligned

## Public read boundary

The web client reads normalized deals, tracked routes and permitted price history through the configured Supabase public client. Empty or failed responses are represented as empty/unavailable states; they are never converted into fabricated deals.

## Edge Function boundary

| Function | Contract | Authentication |
|---|---|---|
| `flight-ingest` | accept validated fast-flights worker observations and persist them | internal secret |
| `analyze-price` | validate observations, score/analyze and persist history | internal secret |
| `ai-explainer` | explain supplied evidence | internal secret |
| `setup-alert` | validate and create an alert | public user flow / validated payload |
| `manage-alert` | confirmation/unsubscribe action | token/validated action |
| `alert-processor` | match, deduplicate, retry and deliver | internal scheduler |
| `feed-snapshot` | serve/write TTL-bound feed snapshot | public read/service write |

All function errors use explicit non-2xx responses and must avoid leaking secrets. Request validation is shared where applicable. Provider, notification and deployment runtime evidence is tracked separately in the roadmap audit.
