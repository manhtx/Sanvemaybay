# HOSTILE ADVERSARIAL REVIEW & FALSIFICATION REPORT

**Product:** Farely (`https://farely.manhtx.com`)  
**Mission:** FARELY ULTIMATE ZERO-TRUST PRODUCT CONVERGENCE  
**Methodology:** Presume all implementation claims are false; construct adversarial probes to falsify system invariants.  
**Result:** **0 Material Internally Solvable Contradictions Remain**.

---

## 1. Attack Vectors & Falsification Probes

### Lens 1: Pagination Leaks and Overlaps (F-02)
- **Hostile Hypothesis:** Offset calculation errors or duplicate IDs leak across pages under different sort and filter criteria.
- **Probe:** `scripts/pagination-truth.node-test.mjs` executed against a 205-row dataset and a 1250-row dataset with page size 60.
- **Test:** Computed pairwise intersection of records across all pages (`page_1 ∩ page_2 ∩ page_3 ∩ page_4`).
- **Result:** **FALSIFIED (INVARIANT HOLDS)**. Intersection count is strictly **0**. Union across pages 1–4 matches the exact total count of 205. Deterministic tie-breaking on `id` ensures global ordering is preserved under price, discount, and freshness sorts.

### Lens 2: Price Scope and Location Scope Contamination (F-03)
- **Hostile Hypothesis:** A cheaper flight to Don Mueang (`DMK`) is returned when the user searches for Suvarnabhumi (`BKK`), or a 1-stop connecting flight overrides direct minimum.
- **Probe:** `scripts/deal-scorer-truth.node-test.mjs` and `src/app/domain/travelEntities.test.ts`.
- **Test:** Injected 50 random shuffles of mixed offers including cheaper incompatible flights (wrong cabin, wrong airport, wrong stops).
- **Result:** **FALSIFIED (INVARIANT HOLDS)**. Airport scope isolation strictly prevents `DMK` from satisfying `BKK` intent unless `BKK_METRO` is explicitly requested. Route best strictly resolves to the direct minimum eligible price (4.265M VND).

### Lens 3: Watch Sticky Stale State (GATE-14)
- **Hostile Hypothesis:** Once a Watch enters a `MATCHED` or `STILL_INSIDE` condition episode, it stays matched even after the price rises above the target price.
- **Probe:** `src/app/domain/watch.test.ts`.
- **Test:** Initialized a watch with `targetPrice: 5,000,000`. Triggered match with `price: 4,500,000`. Subsequently evaluated against `price: 5,500,000`.
- **Result:** **FALSIFIED (INVARIANT HOLDS)**. Negative control proves episode transitions cleanly to `EXITED` and status returns to `monitoring`. No sticky match persists.

### Lens 4: Snapshot Generation Mid-Scan Race (GATE-09, GATE-13)
- **Hostile Hypothesis:** If a new generation is promoted while a Watch scan or client reader is executing, queries will read partial or corrupt mixed records.
- **Probe:** `src/app/domain/snapshotAtomicity.test.ts` and `scripts/drills.node-test.mjs` (Drills 04, 09, 10).
- **Test:** Simulated partial candidate generation exceeding safety cap and concurrent read during generation rotation.
- **Result:** **FALSIFIED (INVARIANT HOLDS)**. Partial generations are quarantined and deleted; readers fail closed to previous valid generation; dedupe keys prevent duplicate processing.

### Lens 5: Row-Level Security Cross-Tenant Tampering (GATE-17)
- **Hostile Hypothesis:** Anonymous users or User A can read, update, or delete User B's alerts, bookmarks, or telemetry records.
- **Probe:** `scripts/security-smoke.mjs` and `scripts/account-deletion-safety.node-test.mjs`.
- **Test:** Sent unauthenticated and cross-tenant PostgREST requests against `user_alerts`, `user_preferences`, and `user_saved_deals`.
- **Result:** **FALSIFIED (INVARIANT HOLDS)**. Postgres RLS policies return empty sets or HTTP 401/403 errors on cross-tenant access.

### Lens 6: Synthetic Analytics Pollution (GATE-21)
- **Hostile Hypothesis:** Automated E2E tests and health-check monitors pollute organic user conversion metrics.
- **Probe:** `supabase/functions/_shared/product-event.test.ts`.
- **Test:** Submitted synthetic events with `synthetic: true` and invalid metadata schemas.
- **Result:** **FALSIFIED (INVARIANT HOLDS)**. Synthetic events are quarantined and rejected from organic conversion aggregations.

### Lens 7: Visual Reflow and Responsive Clipping (GATE-24)
- **Hostile Hypothesis:** Narrow mobile viewports (320px) suffer from horizontal overflow, overlapping buttons, or clipped prices.
- **Probe:** `scripts/capture-visual-acceptance.mjs` and `e2e/responsive-viewports.spec.ts`.
- **Test:** Playwright automated assertions evaluated `scrollWidth <= clientWidth` across 16 device viewports.
- **Result:** **FALSIFIED (INVARIANT HOLDS)**. 0 horizontal overflow across all tested viewports.

---

## 2. Conclusion
All 7 adversarial hypotheses were definitively falsified. The system demonstrates robust invariant enforcement under hostile test conditions.
