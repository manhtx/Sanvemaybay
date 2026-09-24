# Live Provider and Affiliate Contract

## Purpose

FlyCheap must publish only source-backed flight observations and must not represent a search/source URL as proof that a fare is still bookable. Provider access and affiliate attribution are separate concerns:

- a provider observation supplies the fare and itinerary evidence;
- an affiliate/deep link supplies the commercial redirect;
- a missing commercial link must never be filled with a fabricated or guessed affiliate URL.

## Link states

| State | Meaning | User-facing treatment |
| --- | --- | --- |
| `live_affiliate` | Provider returned a current offer and a provider-issued or provider-approved tracked redirect | Show price, provider, checked time, and “Đi đến nơi bán” |
| `live_source` | Current provider observation exists but only a search/source URL is available | Show “Kiểm tra giá tại nguồn”; do not call it bookable or affiliate |
| `indicative` | Price is a calendar/indicative result, not a confirmed offer | Show as reference only |
| `historical` | Imported/archive observation | Never publish in the active feed |
| `stale` | `valid_until` has passed or revalidation failed | Remove from active feed; retain in history |

## Required evidence for an active deal

An active deal requires all of:

1. a successful provider response;
2. a positive price and complete route/date identity;
3. a future departure date;
4. `valid_until` in the future;
5. a provider/source identifier;
6. a valid HTTPS source URL;
7. if labelled affiliate, a valid HTTPS affiliate URL and affiliate network identifier;
8. an observation timestamp and no stale-provider error.

The frontend may show `live_source` results, but it must not imply that the displayed fare is guaranteed until the user reaches the provider and checks out. `historical`, `indicative`, and `stale` rows are excluded from the active feed.

This exclusion applies at every read boundary, including fresh snapshots, stale
snapshot fallback, browser cache, direct table fallback, alerts, detail lookup,
and redirects. A legacy row with missing `link_kind` is not implicitly live.

## Feed health contract

The public `feed-snapshot` response must carry an explicit operational status;
an unavailable schema/provider must never be represented as a successful empty
feed.

| Status | Meaning | Deal publication |
|---|---|---|
| `healthy` | Current qualified live inventory exists | Publish validated rows |
| `healthy_empty` | Backend is healthy and no rows exist | Show a normal empty state |
| `stale_only` | Rows exist, but none are currently publishable, or only an older still-valid snapshot is available | Never promote invalid rows; explain freshness |
| `degraded_schema` | Production schema does not satisfy the live-deal contract | Return HTTP 503 and an operational state |
| `provider_unavailable` | The feed cannot read/refresh its authoritative source | Return HTTP 503 unless a still-valid snapshot can be served explicitly as `stale_only` |

Every response includes `deals`, `status`, `source`, `generated_at`,
`retryable`, and a user-safe `message`. The client may cache only validated
deal rows and must preserve the status separately. A missing/unknown status is
treated as a legacy response during a coordinated rollout, never as proof that
production is healthy.
Cached payloads must be revalidated against their own `depart_date`,
`valid_until`, link metadata, and approved booking hosts before use.

At write boundaries, missing or unknown link provenance defaults to
`indicative`, never `live_source`. Ingest must preserve validated affiliate
metadata end to end. Analyzer may publish an active deal only when the source
observation already satisfies the live-source or live-affiliate contract.

## Provider policy

The preferred order is:

1. an approved live-price/affiliate API with provider-issued redirects;
2. a second approved provider for coverage and comparison;
3. scraper discovery only as an explicitly labelled fallback.

Scraping is not the reliability strategy. It may discover a candidate, but it cannot establish an affiliate booking URL or prove that the same fare is still available.

## Redirect policy

The browser must not construct affiliate URLs from arbitrary database strings. The server owns the redirect decision and must:

- validate the deal is still active;
- validate the hostname against an allowlist;
- preserve the provider-issued itinerary/search parameters;
- attach only non-PII attribution parameters;
- record a `booking_click` event;
- redirect only when the link state is `live_affiliate` or explicitly `live_source`;
- require the selected target host to appear in the server-only
  `APPROVED_BOOKING_HOSTS` allowlist.

The redirect endpoint must fail closed when the deal is stale, the URL is invalid, or the affiliate configuration is missing.

## Acceptance gates

The production gate is not “rows exist”. It is:

- at least 10 current deals across multiple routes and departure dates;
- every active row has source, timestamp, future `valid_until`, and a valid HTTPS link;
- affiliate-labelled rows have a provider-issued/approved affiliate link;
- a fresh scan, revalidation, feed read, detail read, and redirect smoke test all pass;
- stale rows disappear from the active feed without deleting historical evidence;
- provider 429/5xx/auth failures are recorded and retried only under bounded policy.

Until provider and affiliate credentials are configured, the active feed must
remain empty. Discovery workers may retain `indicative` observations for
research, but must not fabricate live deals, booking links, or commission
claims.

## Provider decision refreshed 2026-08-20

The first production adapter should target a partner-approved API whose terms
permit the opportunity-discovery workflow. Skyscanner Flights Live Prices is
the current preferred application path because it returns real-time inventory
and supports itinerary refresh, but access requires Partnerships approval and
a server-side API key.

Travelpayouts/Aviasales Search API is deferred to an explicitly user-initiated
search surface. Its current rules prohibit automatic collection and booking-link
preloading, and current access guidance requires an established audience. It
must not power the background scanner. Travelpayouts Data API remains
`indicative` because it is cached history, not current inventory.

Sources: [Skyscanner authentication](https://developers.skyscanner.net/docs/getting-started/authentication),
[Skyscanner Live Prices](https://developers.skyscanner.net/docs/flights-live-prices/overview),
[Travelpayouts Search API rules](https://support.travelpayouts.com/hc/en-us/articles/34788165535250-Search-API-usage-rules),
[Travelpayouts Search API access](https://support.travelpayouts.com/hc/en-us/articles/30565016140434-Aviasales-Flights-Search-API-real-time-and-multi-city-search).

A normal Google Flights or route-based search URL is never promoted to
`live_affiliate` merely because it contains route parameters or a partner
marker.

### Current code reality

- `flight-search` calls Travelpayouts Week Matrix and must remain explicitly
  `indicative`; its name does not establish live semantics.
- The Amadeus helper is a prototype not wired to any Edge Function. Amadeus
  Flight Offers Search can return live published offers, but the current helper
  does not perform price confirmation or produce a provider-issued click-out
  deeplink. It is not an approved production adapter.
- No Skyscanner API key or adapter exists in the current runtime.

The preferred first live click-out integration remains Skyscanner Flights Live
Prices after partner approval: official responses include bookable itineraries,
pricing options/deeplinks and a refresh-price flow. Travelpayouts Search must
remain user-initiated and must generate booking links only after the user's Book
action. Amadeus may be evaluated as a secondary search/price-confirmation source
if market coverage and a compliant handoff/booking model are approved.

Until then, the public indicative search endpoint must enforce POST-only input,
bounded future date windows, per-address rate limits, provider timeout, bounded
result count and release/request correlation metadata.
