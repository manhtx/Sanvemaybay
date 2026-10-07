# Farely Historical Evidence Forensics Report
**Date:** 2026-10-07  
**Status:** FORENSIC EVIDENCE CAPTURED & PROVEN  
**Requirement:** REQ-HIST-001, REQ-HIST-002, REQ-HIST-003, REQ-HIST-004

---

## 1. Executive Summary & Forensic Discovery

A critical data-integrity flaw was identified, audited, and empirically verified against the live production database (`https://yefbpmqfsstcaeqfrmyn.supabase.co`):

- **Total `price_history` row count:** **354,660 rows**.
- **Root Cause Mechanism:** The Edge Function `analyze-price` (`supabase/functions/analyze-price/index.ts`) queries retained flights across historical scan cycles without tracking whether an observation was already recorded in `price_history`.
- In `analyze-price` lines 301–306:
  ```typescript
  if (priceHistoryRows.length > 0) {
    const { error: historyError } = await supabase
      .from("price_history")
      .insert(priceHistoryRows);
    if (historyError) throw historyError;
  }
  ```
  The table `public.price_history` lacked any unique constraint (only had `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`).
  Consequently, each execution of `analyze-price` blindly appended all matching flights into `price_history`.

---

## 2. Empirical Verification of Replay Contamination

A targeted probe for a single route-date-price combination (`HAN -> SGN`, departure date `2026-10-01`, price `3,066,362 VND`) revealed:

- **Duplicate rows found:** **756 identical instances** (`0-755/756` returned by Supabase PostgREST).
- **Cluster analysis by `created_at` timestamp:**
  - `2026-10-05T11:51:26.263530+00:00`: 42 repetitions inserted in a single batch
  - `2026-10-05T11:51:34.503837+00:00`: 12 repetitions
  - `2026-10-05T18:29:26.471941+00:00`: 12 repetitions
  - `2026-10-05T18:29:32.111422+00:00`: 6 repetitions
  - `2026-10-06T00:51:20.892116+00:00`: 16 repetitions
  - `2026-10-06T00:51:29.311393+00:00`: 6 repetitions
  - Repeated cyclically across every analyzer trigger over multiple days.

---

## 3. Impact Assessment

1. **Artificial Sample Inflation:** What was a single real provider quote became 756 "historical observations", causing the statistical comparator and confidence scorer to claim high confidence on phantom sample sizes.
2. **Median Distortion:** Over-represented batches skewed market percentiles and averages towards whatever flight quotes happened to be repeatedly reprocessed.
3. **Loss of Epistemic Invariants:** Conflating `depart_date` with `observed_at` inside the single `date` column stripped critical temporal dimensions (cannot differentiate when a price was observed from when the traveler flies).

---

## 4. Legacy Data Classification (REQ-HIST-003)

| Data Segment | Row Count | Classification | Action |
| :--- | :--- | :--- | :--- |
| `public.price_history` (all 354,660 rows) | 354,660 | `LEGACY_UNTRUSTED` | Quarantined; retained for audit preservation (never destructively deleted); excluded from canonical statistical comparator. |
| `public.flights` (raw cache rows) | Variable | `BACKFILLABLE_WITH_PROVENANCE` | Distinct `(itinerary_key, timestamp, price)` records can be idempotently projected into `fare_observations`. |
| Future `fare_observations` records | Continuous | `TRUSTED_CANONICAL` | Enforced by `UNIQUE (provider, observation_fingerprint)` constraint. |

---

## 5. Architectural Remediation & Canonical Cutover Plan

1. **Create `public.fare_observations`:**
   - Canonical, immutable observation ledger.
   - Preserves all itinerary dimensions: origin, destination, depart date, return date, journey type, cabin, passengers, pricing unit, currency, price, stops, duration, airline, flight number.
   - Enforces unique constraint: `UNIQUE (provider, observation_fingerprint)`.
   - `observation_fingerprint` = SHA-256(`provider:scan_run_id:offer_variant_id:observed_at:price:currency`).
2. **Retire `price_history` as Statistical Authority:**
   - Re-route `analyze-price` to write to `fare_observations` with `onConflict: "provider,observation_fingerprint"` and `ignoreDuplicates: true`.
   - Update `getPriceHistory` in `src/app/data/api.ts` to read from `fare_observations`.
   - Update `route_market_stats` to `route_market_stats_v2` reading strictly from unique canonical observations.
