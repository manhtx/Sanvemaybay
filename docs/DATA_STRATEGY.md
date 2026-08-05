# FlyCheap AI — Data Strategy

**Version:** 1.0  
**Status:** Draft / implementation-aligned

## Purpose

Define how FlyCheap collects, validates, stores, analyzes and presents flight opportunity data without fabricating live availability.

## Pipeline

`Provider response → normalization → validation → deduplication → historical observation → deal scoring → feed snapshot → explanation/alert`

Every displayed deal must retain source, observed timestamp, route, currency, fare and itinerary evidence. Invalid, stale or incomplete records are rejected or explicitly marked unavailable.

## Source policy

- Provider credentials and quotas are server-side only.
- A provider failure must not erase the last valid snapshot.
- Empty live results must not be replaced with mock deals.
- Provider-specific fees remain unknown until supplied; the UI labels estimates.
- Promotion, hotel, visa, weather and transport data require authoritative feeds before being presented as verified.

## Quality gates

- Positive fare, duration and required itinerary legs.
- Supported currency and normalized airport codes.
- Stable itinerary key for idempotent writes.
- Duplicate observations are tolerated only when their identity/timestamp contract permits it.
- Freshness is included in scoring and risk decisions.
- Historical rows are append-only; analysis never overwrites source observations.

## Operational metrics

Track fetch success, valid-record ratio, duplicate ratio, stale ratio, provider latency, analyzer failures, published deals and notification outcomes. Production values require deployed provider and Supabase credentials; current workspace evidence is recorded in `ROADMAP_IMPLEMENTATION_AUDIT.md`.
