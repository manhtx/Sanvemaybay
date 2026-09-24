import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { boundedProviderRows, isIsoCalendarDate, validateFlightSearchInput } from "./flight-search.ts";

const now = new Date("2026-08-20T12:00:00Z");

Deno.test("flight search accepts a bounded normalized future round trip", () => {
  assertEquals(validateFlightSearchInput({
    origin: " han ", destination: "bkk", outbound_date: "2026-09-01", return_date: "2026-09-08",
  }, now), { origin: "HAN", destination: "BKK", outboundDate: "2026-09-01", returnDate: "2026-09-08" });
});

Deno.test("flight search rejects malformed, same-route, past and excessive windows", () => {
  assertEquals(validateFlightSearchInput({ origin: "HAN", destination: "HAN", outbound_date: "2026-09-01", return_date: "2026-09-08" }, now), undefined);
  assertEquals(validateFlightSearchInput({ origin: "HAN", destination: "BKK", outbound_date: "2026-02-30", return_date: "2026-09-08" }, now), undefined);
  assertEquals(validateFlightSearchInput({ origin: "HAN", destination: "BKK", outbound_date: "2026-08-19", return_date: "2026-09-08" }, now), undefined);
  assertEquals(validateFlightSearchInput({ origin: "HAN", destination: "BKK", outbound_date: "2026-09-01", return_date: "2027-04-01" }, now), undefined);
});

Deno.test("provider rows are object-only and capped", () => {
  assertEquals(boundedProviderRows({ data: [{ id: 1 }, null, "bad", { id: 2 }, { id: 3 }] }, 2), [{ id: 1 }, { id: 2 }]);
  assertEquals(boundedProviderRows({ data: "bad" }), []);
});

Deno.test("provider dates require real ISO calendar dates", () => {
  assertEquals(isIsoCalendarDate("2026-09-01"), true);
  assertEquals(isIsoCalendarDate("2026-02-30"), false);
  assertEquals(isIsoCalendarDate("2026-13-01"), false);
});
