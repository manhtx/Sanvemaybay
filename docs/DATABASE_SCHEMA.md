# FlyCheap AI — Database Schema Contract

**Version:** 1.0  
**Status:** Draft / migration-aligned

## Core entities

| Entity | Responsibility | Write authority |
|---|---|---|
| `tracked_routes` | enabled origin/destination coverage | service/admin |
| `deals` | normalized published opportunities | service role |
| `price_history` | append-only observations | analyzer/service role |
| `user_alerts` | validated alert preferences and date range | authenticated user/service |
| `notification_log` | deduplication and bounded retry state | service role |
| `user_preferences` | authenticated preference sync | authenticated user |
| `user_bookmarks` | authenticated saved deal IDs | authenticated user |
| `feed_snapshots` | singleton cached public feed | service role write/public read |
| `product_events` | scrubbed product interaction events | anon/auth insert under RLS |

## Invariants

- Public clients never receive service credentials.
- User-owned rows are protected by owner RLS policies.
- Service-owned writes are restricted to service-role paths.
- Historical observations are not destructive updates.
- Event types and metadata are allow-listed and bounded.
- Migrations must be applied before code that reads new columns is deployed.

Authoritative changes live in `supabase/migrations/`; this document explains the contract and does not replace migration review or deployment evidence.
