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
- redirect only when the link state is `live_affiliate` or explicitly `live_source`.

The redirect endpoint must fail closed when the deal is stale, the URL is invalid, or the affiliate configuration is missing.

## Acceptance gates

The production gate is not “rows exist”. It is:

- at least 10 current deals across multiple routes and departure dates;
- every active row has source, timestamp, future `valid_until`, and a valid HTTPS link;
- affiliate-labelled rows have a provider-issued/approved affiliate link;
- a fresh scan, revalidation, feed read, detail read, and redirect smoke test all pass;
- stale rows disappear from the active feed without deleting historical evidence;
- provider 429/5xx/auth failures are recorded and retried only under bounded policy.

Until provider and affiliate credentials are configured, the system must remain empty or source-only and must not fabricate deals, prices, booking links, or commission claims.

## Chosen affiliate integration path

The first commercial adapter should target Travelpayouts/Aviasales rather than
constructing untracked Skyscanner or airline URLs. The reference project
[`travelpayouts/flights-api-project`](https://github.com/travelpayouts/flights-api-project)
demonstrates the provider's search integration, while Travelpayouts' link
generator creates deep links containing the partner marker. The production
adapter remains disabled until the partner approves the project and issues
`TRAVELPAYOUTS_TOKEN`, `TRAVELPAYOUTS_MARKER`, and an approved program/deep-link
configuration. A normal Google Flights or Skyscanner search URL is never
promoted to `live_affiliate` merely because it contains route parameters.
