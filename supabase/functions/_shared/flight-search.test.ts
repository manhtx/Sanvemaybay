import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { boundedProviderRows, isIsoCalendarDate, mapTravelpayoutsRow, validateFlightSearchInput } from "./flight-search.ts";

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

Deno.test("mapTravelpayoutsRow prioritizes found_at over created_at (R14, NEG-11)", () => {
  const input = { origin: "HAN", destination: "BKK", outboundDate: "2026-09-01", returnDate: "2026-09-08" };
  const mapped = mapTravelpayoutsRow({
    value: 1500000,
    depart_date: "2026-09-01",
    return_date: "2026-09-08",
    found_at: "2026-08-19T10:00:00Z",
    created_at: "2026-08-18T10:00:00Z",
    number_of_changes: 0,
    airline: "VN",
  }, input, "2026-08-20T12:00:00Z");

  assertEquals(mapped?.price, 1500000);
  assertEquals(mapped?.stops, 0);
  assertEquals(mapped?.provider_observed_at, "2026-08-19T10:00:00Z");
  assertEquals(mapped?.source_age_status, "KNOWN");
});

Deno.test("mapTravelpayoutsRow falls back to created_at when found_at is missing", () => {
  const input = { origin: "HAN", destination: "BKK", outboundDate: "2026-09-01", returnDate: "2026-09-08" };
  const mapped = mapTravelpayoutsRow({
    value: 2000000,
    depart_date: "2026-09-01",
    return_date: "2026-09-08",
    created_at: "2026-08-18T10:00:00Z",
    number_of_changes: 1,
  }, input, "2026-08-20T12:00:00Z");

  assertEquals(mapped?.provider_observed_at, "2026-08-18T10:00:00Z");
  assertEquals(mapped?.stops, 1);
  assertEquals(mapped?.source_age_status, "KNOWN");
});

Deno.test("mapTravelpayoutsRow handles missing stops as null and missing observation timestamp", () => {
  const input = { origin: "HAN", destination: "BKK", outboundDate: "2026-09-01", returnDate: "2026-09-08" };
  const mapped = mapTravelpayoutsRow({
    value: 2500000,
    depart_date: "2026-09-01",
    return_date: "2026-09-08",
  }, input, "2026-08-20T12:00:00Z");

  assertEquals(mapped?.stops, null);
  assertEquals(mapped?.provider_observed_at, null);
  assertEquals(mapped?.source_age_status, "UNKNOWN_SOURCE_AGE");
});

Deno.test("mapTravelpayoutsRow rejects invalid prices or non-calendar dates", () => {
  const input = { origin: "HAN", destination: "BKK", outboundDate: "2026-09-01", returnDate: "2026-09-08" };
  assertEquals(mapTravelpayoutsRow({ value: 0 }, input), null);
  assertEquals(mapTravelpayoutsRow({ value: -100 }, input), null);
  assertEquals(mapTravelpayoutsRow({ value: "NaN" }, input), null);
  assertEquals(mapTravelpayoutsRow({ value: 100, depart_date: "invalid" }, input), null);
});

Deno.test("RC-10: mapTravelpayoutsRow quarantines rows missing provider departure date", () => {
  const input = { origin: "HAN", destination: "BKK", outboundDate: "2026-09-01", returnDate: "2026-09-08" };
  // Missing provider depart_date must be quarantined, not fall back to input.outboundDate
  assertEquals(mapTravelpayoutsRow({ value: 1500000, return_date: "2026-09-08" }, input), null);
});

