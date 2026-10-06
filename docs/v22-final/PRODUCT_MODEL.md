# FARELY V22 — CANONICAL PRODUCT DOMAIN MODEL

### 1. Architectural Philosophy
Farely is an **Airfare Price Intelligence & Monitoring Instrument**. It is not an OTA, a blog, or a speculative prediction engine. Every product entity must reflect physical travel reality, epistemic honesty, and mathematical correctness.

```
                           +----------------------+
                           |     TRAVEL_INTENT    |
                           +----------+-----------+
                                      |
                    +-----------------+-----------------+
                    |                                   |
         +----------v-----------+             +---------v---------+
         |     OFFER_VARIANT    |             |       WATCH       |
         +----------+-----------+             +-------------------+
                    |
         +----------v-----------+
         |     OBSERVATION      |
         +----------+-----------+
                    |
                    v
    +-------------------------------+
    |       COMPARABLE_COHORT       |
    +---------------+---------------+
                    |
                    v
    +-------------------------------+
    |          OPPORTUNITY          |
    +---------------+---------------+
                    |
        +-----------+-----------+
        |                       |
+-------v-------+       +-------v-------+
|  SAVED_OPP    |       |  VERIFICATION |
+---------------+       +---------------+
```

---

### 2. Core Entities

#### 1. `TravelIntent` (Ý định Hành trình)
What the passenger wants to achieve. Independent of any single airline or booking site.
- **Attributes:**
  - `originScope`: Origin city or specific airport (e.g., `HAN`, `BKK`, `DMK`).
  - `destinationScope`: Destination city or specific airport (e.g., `KUL`, `NRT`, `HND`).
  - `outboundDate`: ISO 8601 date (`YYYY-MM-DD`).
  - `returnDate`: ISO 8601 date (nullable for one-way).
  - `tripType`: `'one_way'` | `'round_trip'`.
  - `passengers`: Number of adult passengers (default 1).
  - `cabin`: `'economy'` | `'premium_economy'` | `'business'`.
  - `stopsConstraint`: `'direct_only'` | `'max_1_stop'` | `'any_stops'`.
- **Identity:** Deterministic hash of normalized travel parameters.

#### 2. `OfferVariant` (Biến thể Chuyến bay)
A specific, bookable travel option fulfilling a `TravelIntent`.
- **Attributes:**
  - `itinerary`: Departure times, arrival times, flight numbers, operating carriers.
  - `stops`: Number of transit stops, layover airports and durations.
  - `durationMinutes`: Total flight and layover time.
  - `airline`: Marketing and operating carriers.
  - `bookingUrl`: Deep-link or reference search link.
  - `source`: Ingestion provider origin.

#### 3. `Observation` (Bản ghi Quan sát Giá)
An observation of an `OfferVariant` at a specific timestamp $T$.
- **Attributes:**
  - `offerVariantId`: Link to variant.
  - `observedPrice`: Raw observed total price.
  - `currency`: ISO 4217 currency (`VND`).
  - `observedAt`: ISO timestamp of collection.
  - `scanRunId`: Identification of the crawler job.

#### 4. `ComparableCohort` (Nhóm Chặng bay Tương đương)
The historical reference population of observations matching the `TravelIntent` dimensions.
- **Criteria for Inclusion:**
  - Same origin and destination scope.
  - Same trip type (round-trip vs one-way).
  - Same departure season / booking lead time bucket.
  - Same stops constraint.
- **Epistemic Rules:**
  - If sample size $N < 5$, status is `INSUFFICIENT_DATA` (`Chưa đủ dữ liệu đối sánh`). Zero fake medians.
  - If $N \ge 5$, compute true `medianPrice`, `p25`, `p75`, and standard deviation.

#### 5. `Opportunity` (Cơ hội Giá vé)
The derived decision object synthesized from a `TravelIntent`, its eligible `OfferVariants`, the current route-best price, and the `ComparableCohort`.
- **Attributes:**
  - `opportunityId`: Stable identifier derived from `(origin, destination, airline, departDate, returnDate, stops)`.
  - `routeBestPrice`: Minimum normalized total price among all compatible variants.
  - `bestVariant`: The specific `OfferVariant` delivering `routeBestPrice`.
  - `variants`: All eligible variants on the same route/dates.
  - `referenceMedian`: Cohort median price (null if insufficient).
  - `deltaFromMedian`: Percentage discount relative to median (null if insufficient).
  - `evidenceStrength`: Metric based on observation count and freshness.
  - `costState`: True cost breakdown (`KNOWN`, `ESTIMATED`, `OPTIONAL`, `UNKNOWN`).

#### 6. `Watch` (Hợp đồng Giám sát Định kỳ)
A user-configured durable monitoring contract over a `TravelIntent`.
- **Target:** Default monitors the **Route-Best Eligible Price** for the intent (not a single frozen flight).
- **Attributes:**
  - `userId`: Owner of the watch.
  - `travelIntent`: Scope of search.
  - `targetPrice`: User-specified maximum price condition.
  - `status`: `'pending_activation'` | `'active'` | `'paused'` | `'degraded'` | `'expired'`.
  - `lastCheckedAt`: Timestamp of the last successful analyzer run (starts `null`).
  - `lastMatchedAt`: Timestamp of the latest target fulfillment.
  - `cooldown`: Anti-spam threshold to avoid alert fatigue.

#### 7. `SavedOpportunity` (Bộ nhớ Cơ hội Đã lưu)
A durable bookmark preserving an `Opportunity` and its snapshot context at save time.
- **Attributes:**
  - `userId`: Owner.
  - `opportunityId`: Stable opportunity ID.
  - `savedPrice`: Price at the moment of bookmarking.
  - `snapshotData`: Full contextual copy of the opportunity (route, dates, airline, comparator).
  - `savedAt`: Timestamp of bookmarking.
- **Durability Guarantee:** Does not depend on the lifetime of raw observation rows in the crawler database. Survives pruning.

#### 8. `Verification` (Đối soát Thời gian thực)
An on-demand fresh check to confirm current price availability.
- **States:**
  - `PRICE_CONFIRMED`: Price is still available as observed.
  - `PRICE_CHANGED`: Price has shifted (increased or decreased).
  - `CHEAPER_ALTERNATIVE_FOUND`: Another variant is now cheaper.
  - `SELECTED_OFFER_NOT_FOUND`: Specific flight expired or sold out.
  - `ROUTE_RESULTS_FOUND`: General route is available, specific variant requires re-selection.
  - `PROVIDER_UNAVAILABLE`: Live provider returned error / rate limit.
