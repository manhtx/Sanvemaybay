import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { dealLabel, OBSERVED_FARE_ALGORITHM_VERSION, observedFareDedupeKey, scoreObservedFares } from "./observed-fares.ts";

const base = { origin_code: "HAN", destination_code: "SGN", date: "2026-09-02", return_date: "2026-09-06", stops: 0, airline_code: "VN", timestamp: "2026-08-19T10:00:00Z" };

Deno.test("scores and sorts the largest discount first", () => {
  const rows = [3_000_000, 2_000_000, 4_000_000].map((price, index) => ({ ...base, id: String(index), price, airline_code: `V${index}` }));
  const scored = scoreObservedFares(rows, new Date("2026-08-19T10:30:00Z"));
  assertEquals(scored[0].price, 2_000_000);
  assertEquals(scored[0].discount_percent, 33.3);
  assertEquals(scored[0].baseline_price, 3_000_000);
  assertEquals(scored[0].sample_size, 3);
  assertEquals(scored[0].confidence_percent, 25);
  assertEquals(scored[0].confidence_level, "low");
  assertEquals(scored[0].deal_label, "Giá đáng chú ý");
  assertEquals(scored[0].algorithm_version, OBSERVED_FARE_ALGORITHM_VERSION);
});

Deno.test("shows valid fares immediately when a baseline is not ready", () => {
  const [scored] = scoreObservedFares([{ ...base, id: "only", price: 2_000_000 }], new Date("2026-08-19T10:30:00Z"));
  assertEquals(scored.discount_percent, null);
  assertEquals(scored.deal_label, "Giá quan sát");
});

Deno.test("uses the approved score labels", () => {
  assertEquals(dealLabel(60), "Giá đáng chú ý");
  assertEquals(dealLabel(70), "Deal ngon");
  assertEquals(dealLabel(80), "Deal rất ngon");
  assertEquals(dealLabel(90), "Deal cực nóng");
  assertEquals(dealLabel(95, 25), "Giá đáng chú ý");
  assertEquals(dealLabel(85, 50), "Deal ngon");
  assertEquals(dealLabel(85, 70), "Deal rất ngon");
  assertEquals(dealLabel(95, 70), "Deal rất ngon");
});

Deno.test("builds a stable snapshot dedupe key independent of raw observation id", () => {
  assertEquals(
    observedFareDedupeKey({ ...base, id: "first", price: 2_000_000 }),
    observedFareDedupeKey({ ...base, id: "second", price: 2_000_000 }),
  );
});
