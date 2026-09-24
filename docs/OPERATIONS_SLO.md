# FlyCheap AI — Operational SLO and Release Gates

**Version:** 1.0  
**Status:** Active contract; production measurements pending  
**Owner:** Product and Engineering

## Purpose

Define the measurable operating standard for the core opportunity loop. These
targets are release gates, not claims that production currently meets them.

## Core indicators

| Indicator | Definition | Initial target | Release behavior |
|---|---|---:|---|
| Provider request success | Successful contract-approved responses / attempted requests | >= 90% per 24h | Stop expansion if missed |
| Observation validity | Rows accepted by normalization / provider options received | >= 98% | Alert on schema drift |
| Qualified live inventory | Deals passing `audit:production-truth` in launch cohort | >= 1, then cohort-specific target | Zero is a release blocker |
| Observed fare inventory | Fresh normalized fares returned by the public observed read model | >= 100 by default; environment override must be documented | Block release when the page would look empty or materially under-supplied |
| Active-feed stale rate | Active rows past `valid_until` or invalid at read time | 0% | Fail closed and page operator |
| Booking-link validity | Sampled approved redirects reaching allowed provider host | >= 99% | Disable affected source |
| Price parity sample | Sampled displayed prices still present at approved provider | Baseline first; target after 30 samples | Never claim verified saving without it |
| Alert duplicate rate | Duplicate successful delivery per alert/deal/channel | 0% | Incident and suppress retry |
| Alert delivery success | Successful provider deliveries / attempted deliveries | >= 95% per 24h | Show provider degradation |
| Observed feed age | Time since latest successful hourly observation | p95 <= 2h | Degraded after 2h; stale-only after 6h |
| Core Web Vitals | p75 LCP / INP / CLS on supported devices | <= 2.5s / 200ms / 0.1 | Block new third-party scripts if regressed |

## Required dimensions

Every metric must be separable by provider, source, route, link kind,
environment, function version, and outcome. Logs must not contain provider
tokens, Supabase service keys, email addresses, Telegram IDs, or full signed
unsubscribe URLs.

## Alerting and ownership

- P0: active feed contains expired, historical, indicative, or unapproved-host
  rows; redirect crosses the allowlist; secret exposure. Disable the affected
  source immediately.
- P1: qualified inventory is zero, provider success misses target, alert
  delivery degrades, observed inventory falls below the approved environment
  minimum, or snapshot age exceeds one hour. Pause notifications when data
  truth is uncertain.
- P2: performance target miss, elevated normalization rejection, or degraded
  secondary feature. Create a bounded remediation item.

## Evidence record

Each production acceptance record must include UTC timestamp, deployed commit,
environment, launch cohort, approved source/host configuration names (never
secret values), command or dashboard query, result, owner, and expiry/recheck
date. A prior green record does not prove current state after provider,
migration, secret, function, or deployment changes.

## Rollback

Provider adapters, redirects, alerts, and third-party scripts must be independently
disableable. Rollback preserves historical observations but removes invalid
rows from active feed and stops notifications until the truth gate passes.
