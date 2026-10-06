# Farely Domain Schema & Invariants

## Canonical Core Concepts

### 1. TravelIntent
Canonical representation of what the user seeks:
- `origin_scope`: Airport IATA (e.g. `HAN`) or Metro area (e.g. `BKK_ALL`, `TYO_ALL`).
- `destination_scope`: Target airport or metro area.
- `outbound_date` / `outbound_window`: Exact date or date interval.
- `return_date` / `trip_length_days`: Return date or trip duration. Return date is NEVER conflated with departure date range.
- `trip_type`: `one_way` | `round_trip`. Separate from geography (`domestic` | `international`).
- `passengers`: `{ adult: number, child?: number, infant?: number }`.
- `cabin`: `economy` | `premium_economy` | `business` | `first`.
- `stops`: `direct` | `any`.
- `currency`: Default `VND`.

### 2. OfferVariant & Observation
- `OfferVariantId`: Deterministic hash of itinerary facts: carrier, operating carrier, flight numbers, segment origins/destinations, departure times, arrival times, cabin class. Price is NOT part of OfferVariant identity.
- `ObservationId`: Timestamped snapshot of an OfferVariant with observed price, taxes, provider origin, and deep-link.
- `PriceScopeFingerprint`: Hash of `(origin_scope, destination_scope, outbound_date, return_date, trip_type, cabin, stops, passengers, currency)`. Guarantees apples-to-apples price comparison.

### 3. Route Best & Comparator
- `ObservedRouteBest`: Lowest normalized price observed within the matching `PriceScopeFingerprint` in the active generation.
- `VerifiedRouteBest`: Lowest freshly repriced fare from live provider verification.
- `ComparatorFingerprint`: Grouping key for historical baseline. Requires minimum sample count (N >= 5). If N < 5, comparison status is `INSUFFICIENT_SAMPLE`.

### 4. Watch & Condition Episodes
- `Watch`: Monitored TravelIntent with optional `target_price` and explicit `discount_threshold`.
- `Episode Lifecycle`: `NOT_MATCHING` -> `ENTERED_MATCH` -> `NOTIFIED` -> `STILL_MATCHING` -> `IMPROVED_MATERIALLY` -> `EXITED_MATCH` -> `REENTERED_MATCH`.
- Predicate rule: If `target_price` is specified, `price <= target_price` matches regardless of historical discount.

### 5. Snapshot Generations
- `GenerationState`:
  - Candidate generation built via keyset pagination.
  - If safety limits are hit before source exhaustion, candidate is marked `PARTIAL_DEGRADED` and MUST NOT be published as active.
  - Active pointer update is atomic. Readers fail closed/degraded if pointer is null.

### 6. Savings Taxonomy
- `PotentialSaving`: Heuristic theoretical difference (informative only).
- `ObservedSaving`: Difference between observed route baseline median and current observed price.
- `VerifiedSaving`: Difference verified via live repricing against historical baseline.
- `ConfirmedSaving`: Real post-booking user-confirmed outcome (E5).
