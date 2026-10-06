# Farely Product Contract

## 1. What Farely Promises
1. **Evidence-First Pricing**: Farely presents observed airfare intelligence with clear timestamps, source identifiers, and verification status.
2. **Cheapest Means Mathematical Minimum**: "Cheapest", "Rẻ nhất", or "Route Best" strictly means the mathematical minimum eligible normalized price within the matching `PriceScopeFingerprint`. Heuristic scores (Deal Score) influence recommendation rankings but NEVER displace a cheaper eligible fare.
3. **Epistemic Honesty**:
   - `Observed != Freshly Verified != Booked`.
   - `Unknown != 0` (e.g. unknown baggage fees are never presented as free).
   - Provider / network failures are never presented as "0 flights found".
   - Insufficient historical comparison data is presented as "Not enough comparable data", never as fake medians or fake 0% discounts.
4. **Target-Price Watch Integrity**: When a user creates a Watch with a target price, any eligible fare at or below that price triggers a match. No hidden discount percentages (such as an unrequested 20% rule) may suppress matches.
5. **Durable User Data Authority**: Authenticated Saved Opportunities and User Watches are server-authoritative. Local storage is purely a temporary offline cache/optimistic layer.
6. **Complete Privacy Rights**: Data export and deletion encompass all user-owned records (including preferences, date ranges, watches, saved items, and notifications).

## 2. What Farely Explicitly Does Not Promise
1. **Not a Booking Engine**: Farely does not sell tickets or take payments directly. It directs users to verified airline/OTA booking channels.
2. **No Fictional Predictive Claims**: Farely does not claim algorithmic forecasting ("prices will drop by X tomorrow") unless supported by calibrated backtested drift models. It provides descriptive historical trends only.
3. **No Instantaneous Global Coverage**: Farely monitors discrete scheduled windows and routes. Absence of an observed fare does not guarantee no flight exists globally.
