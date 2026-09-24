# FlyCheap AI — 30/60/90-Day Build Plan

**Date:** 2026-08-11  
**Status:** Approved direction; production/provider gates pending  
**North Star:** Verified Travel Savings  
**Current phase:** Data Validation Prototype

## Strategic decision

Do not build more broad travel features yet. The next 90 days must prove one
narrow loop for 3–5 routes:

`approved live offer → truthful deal → valid redirect → user action → measured value`

The existing product surface is sufficient for validation. AI forecasting,
hotel/visa enrichment, multi-leg optimization, native mobile, scale route
expansion, and advertising remain deferred.

## Provider strategy

1. Apply to Skyscanner Partnerships for Flights Live Prices access. It provides
   real-time searches and itinerary refresh, but requires approval and a
   server-side key.
2. Keep `fast-flights` only as `indicative` discovery/research. It cannot
   establish bookability or affiliate rights.
3. Keep Travelpayouts Week Matrix/Data API `indicative`. Do not use its Search
   API for background scanning: current rules require user-initiated searches,
   prohibit automatic collection and preloaded booking links, and current
   access guidance targets established projects.
4. If Skyscanner access is declined, evaluate another provider only against the
   same written rights, freshness, deeplink, redistribution, quota, and Vietnam
   coverage checklist. Do not weaken the contract to fit an easier source.

Official references:

- [Skyscanner API authentication and partnership approval](https://developers.skyscanner.net/docs/getting-started/authentication)
- [Skyscanner Flights Live Prices workflow](https://developers.skyscanner.net/docs/flights-live-prices/overview)
- [Skyscanner itinerary price refresh](https://developers.skyscanner.net/docs/flights-live-prices/refresh-prices)
- [Travelpayouts Search API usage rules](https://support.travelpayouts.com/hc/en-us/articles/34788165535250-Search-API-usage-rules)
- [Travelpayouts Search API access requirements](https://support.travelpayouts.com/hc/en-us/articles/30565016140434-Aviasales-Flights-Search-API-real-time-and-multi-city-search)
- [Travelpayouts cached Data API scope](https://support.travelpayouts.com/hc/en-us/articles/203956083-Requirements-for-Aviasales-data-API-access)

## Days 0–30 — Make production truth operable

### Owner/external actions

- Submit provider partnership application with product screenshots, traffic
  plan, launch cohort, and intended background opportunity workflow.
- Approve a 3–5 route cohort (recommended starting set: HAN–BKK, HAN–SIN,
  HAN–ICN, SGN–BKK, SGN–SIN, reduced to five after coverage review).
- Explicitly authorize production deployment and configure server-side
  `APPROVED_BOOKING_HOSTS` after provider approval.

### Engineering

- Deploy migration `20260805000300_live_provider_affiliate_contract.sql` and
  `20260811000100_fail_closed_link_kind_defaults.sql` together with all nine
  Edge Functions.
- Verify remote schema contains link/affiliate fields and fail-closed defaults.
- Configure approved hosts and provider secrets server-side.
- Implement the approved live adapter behind the shared normalization and
  active-live contract; never retrofit discovery rows.
- Run `npm run audit:production-truth` and store dated evidence.
- Add a provider contract test fixture supplied by official documentation or
  sandbox response; label it deterministic, not live evidence.

### Exit criteria

- >= 1 qualified live deal on the launch cohort, then target >= 10 across
  multiple dates before beta notification.
- 0 historical/indicative/stale/unapproved rows in active feed.
- Redirect rejects invalid rows and reaches only approved hosts.
- Deployment commit, migration, function, and environment evidence recorded.

## Days 31–60 — Prove reliability and user comprehension

### Engineering and operations

- Run the cohort on a bounded schedule permitted by provider terms.
- Implement SLO reporting from `OPERATIONS_SLO.md`: provider success,
  normalization rejection, qualified inventory, stale rate, redirect validity,
  snapshot age, and alert delivery.
- Add price refresh/parity sampling using the provider-approved mechanism.
- Verify email and Telegram confirmation, unsubscribe, idempotency, retry, and
  real delivery with dedicated test recipients.
- Add UI state for provider degradation and stale-snapshot fallback without
  exposing invalid rows.

### Product validation

- Recruit 10–20 invited users who regularly depart from launch airports.
- Measure whether users understand source, checked time, confidence, total
  known cost, and the difference between indicative and live.
- Record detail view, bookmark, alert, approved redirect, and return behavior;
  do not call clicks “savings”.

### Exit criteria

- Provider success >= 90% over a representative 7-day window.
- Active stale rate and alert duplicate rate remain 0%.
- Booking-link validity >= 99% on approved samples.
- At least five users complete the feed → detail → provider path and can
  correctly explain the evidence shown.

## Days 61–90 — Validate value before expansion

### Product

- Run a small beta of 20–100 users only if Days 31–60 gates pass.
- Add explicit price-parity/user saving confirmation after redirect; keep it
  optional and privacy-minimal.
- Compare alert-driven, feed-driven, and user-initiated search behavior.
- Decide route expansion using qualified inventory and user value, not stored
  row count.

### Engineering

- Harden provider failover only if a second provider contract permits data
  combination and presentation; otherwise keep adapters isolated.
- Add operational dashboard and incident runbook evidence links.
- Optimize the largest route bundles only after real-user performance data.
- Review whether Trip Advisor, comparison, and forecast surfaces improve the
  core loop; remove or defer surfaces with no measured contribution.

### Exit criteria and decision

- **GO to Public MVP:** reliable qualified inventory, user trust, repeat use,
  alert value, permitted commercial path, and SLO compliance.
- **ITERATE:** users value the product but provider coverage or explanations are
  weak; stay narrow and repair.
- **NO-GO/PIVOT:** provider terms prohibit the model, inventory is persistently
  empty, price parity is poor, or users do not act on opportunities.

## Explicit non-priorities for this horizon

- Global/88-route expansion.
- Advertising or opaque third-party monetization scripts.
- ML price forecasting presented as actionable advice.
- Hotel, visa, weather, or transport claims without authoritative sources.
- Direct booking, payment, passport storage, refund handling, auto-booking.
- Hidden-city or complex self-transfer recommendations.
