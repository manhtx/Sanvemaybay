# Architectural Decisions Record (ADR) - Convergence

## ADR-001: Fail-Closed Generation Reader
- **Context**: In `observed-fares` and `alert-processor`, if `active_generation_id` is null, queries were querying without generation restriction, blending across stale and uncommitted generations.
- **Decision**: Fail closed / degraded. If `active_generation_id` is absent, return `status: "degraded_schema"` or empty active fare set with degraded health indicator. Never blend orphan generations.

## ADR-002: Incomplete Generation Quarantine
- **Context**: In `refresh-observed-fares`, hitting `hardSafetyLimit` flagged `isPartialDegraded = true` but still activated the candidate generation as current.
- **Decision**: Quarantine partial generations. If `isPartialDegraded === true`, do NOT publish candidate generation as active. Retain previous active generation pointer and log degradation.

## ADR-003: Watch Predicate Honesty (Eliminate Hidden 20% Discount)
- **Context**: `setup-alert` and `alert-matching` defaulted `discount_threshold` to 20%, rejecting fares that satisfied user's `target_price` if the historical discount was < 20%.
- **Decision**: If user sets `target_price`, only apply `target_price`. Do not inject unrequested discount thresholds. Only enforce `discount_threshold` if explicitly specified by user.

## ADR-004: Complete User Data Export & Deletion
- **Context**: `manage-user-data` export omitted `departure_from` and `departure_to` in user preferences.
- **Decision**: Include all preference fields (`departure_from`, `departure_to`, etc.) in export and ensure complete cascade in account deletion.

## ADR-005: Unified Telemetry Schema Registry
- **Context**: `PRODUCT_EVENT_TYPES` rejected frontend events such as `opportunity_open`, `verify_click`, `opportunity_impression`, `page_view`, and dropped `opportunity_id` metadata.
- **Decision**: Harmonize the event registry in `_shared/product-event.ts` to allow all valid product events and metadata while keeping strict anti-PII boundaries.

## ADR-006: Structured Search Errors
- **Context**: `api.ts` `.catch(() => [] as Deal[])` collapsed network/provider/503 errors into empty deal arrays, misleading users to believe no flights exist.
- **Decision**: Propagate structured status (`SOURCE_UNAVAILABLE`, `DEGRADED`) to the UI, enabling clear user communication.

## ADR-007: Exhaustive Keyset Pagination in Alert Processor
- **Context**: `alert-processor` used `.limit(5000)` ordered by `deal_score`, which truncated eligible candidate fares beyond the top 5000.
- **Decision**: Use complete keyset/chunked pagination to evaluate the full active generation dataset without arbitrary score-biased truncation.
