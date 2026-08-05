import { describe, expect, it } from "vitest";
import { defaultPreferences, getUserPreferences, normalizePreferences, saveUserPreferences } from "./preferences";

function storage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
    key: () => null,
    length: 0,
  };
}

describe("user preferences", () => {
  it("normalizes invalid input to safe defaults", () => {
    expect(normalizePreferences({ homeAirport: "sgn", budget: -1, cabinClass: "INVALID" })).toEqual({
      ...defaultPreferences,
      homeAirport: "SGN",
    });
  });

  it("persists and merges preference updates", () => {
    const store = storage();
    expect(saveUserPreferences({ homeAirport: "DAD", maxStops: 0 }, store)).toMatchObject({ homeAirport: "DAD", maxStops: 0 });
    expect(getUserPreferences(store)).toMatchObject({ homeAirport: "DAD", maxStops: 0, budget: defaultPreferences.budget });
  });

  it("normalizes valid dates and clears a reversed range", () => {
    expect(normalizePreferences({ departureFrom: "2026-10-01", departureTo: "2026-10-10" })).toMatchObject({
      departureFrom: "2026-10-01", departureTo: "2026-10-10",
    });
    expect(normalizePreferences({ departureFrom: "2026-10-10", departureTo: "2026-10-01" }).departureFrom).toBeUndefined();
  });
});
