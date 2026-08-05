import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { toPriceHistoryRow } from "./price-history.ts";

Deno.test("builds a valid price history observation", () => {
  assertEquals(toPriceHistoryRow({
    origin_code: "HAN", destination_code: "BKK", date: "2026-08-01", price: "2200000",
  }), { from_code: "HAN", to_code: "BKK", date: "2026-08-01", price: 2200000 });
});

Deno.test("rejects malformed or non-positive observations", () => {
  assertEquals(toPriceHistoryRow({ origin_code: "HAN", destination_code: "BKK", date: "2026-02-30", price: 1 }), undefined);
  assertEquals(toPriceHistoryRow({ origin_code: "HAN", destination_code: "BKK", date: "2026-08-01", price: 0 }), undefined);
});
