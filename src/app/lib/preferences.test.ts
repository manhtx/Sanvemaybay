import { describe, expect, it } from "vitest";
import {
  defaultPreferences,
  getUserPreferences,
  loadRemoteUserPreferences,
  normalizePreferences,
  saveRemoteUserPreferences,
  saveUserPreferences,
} from "./preferences";

function createMockStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
    key: () => null,
    get length() {
      return values.size;
    },
  };
}

describe("user preferences (FLY-UX-004, REQ-DOM-001, REQ-DOM-008, NC-005, NC-009)", () => {
  describe("defaultPreferences and input normalization", () => {
    it("has authoritative default preference values", () => {
      expect(defaultPreferences).toEqual({
        homeAirport: "HAN",
        budget: 15_000_000,
        favoriteRegions: ["asia"],
        maxStops: 1,
        preferredAirlines: [],
        cabinClass: "ECONOMY",
        allowSelfTransfer: false,
      });
    });

    it("normalizes non-object and nullish inputs to safe default clones", () => {
      expect(normalizePreferences(null)).toEqual(defaultPreferences);
      expect(normalizePreferences(undefined)).toEqual(defaultPreferences);
      expect(normalizePreferences("string")).toEqual(defaultPreferences);
      expect(normalizePreferences(123)).toEqual(defaultPreferences);
      expect(normalizePreferences(true)).toEqual(defaultPreferences);
    });

    it("normalizes homeAirport by trimming and converting to uppercase", () => {
      expect(normalizePreferences({ homeAirport: "sgn" }).homeAirport).toBe("SGN");
      expect(normalizePreferences({ homeAirport: "  dad  " }).homeAirport).toBe("DAD");
      expect(normalizePreferences({ homeAirport: "" }).homeAirport).toBe("HAN");
      expect(normalizePreferences({ homeAirport: "   " }).homeAirport).toBe("HAN");
    });

    it("enforces positive finite budget (NC-005)", () => {
      expect(normalizePreferences({ budget: 20_000_000 }).budget).toBe(20_000_000);
      expect(normalizePreferences({ budget: 0 }).budget).toBe(15_000_000);
      expect(normalizePreferences({ budget: -5_000_000 }).budget).toBe(15_000_000);
      expect(normalizePreferences({ budget: Number.NaN }).budget).toBe(15_000_000);
      expect(normalizePreferences({ budget: Number.POSITIVE_INFINITY }).budget).toBe(15_000_000);
      expect(normalizePreferences({ budget: "invalid" as unknown as number }).budget).toBe(15_000_000);
    });

    it("filters non-string items from favoriteRegions array", () => {
      expect(normalizePreferences({
        favoriteRegions: ["asia", 123 as unknown as string, "europe", null as unknown as string],
      }).favoriteRegions).toEqual(["asia", "europe"]);

      expect(normalizePreferences({
        favoriteRegions: "not-an-array" as unknown as string[],
      }).favoriteRegions).toEqual(["asia"]);
    });

    it("enforces non-negative integer for maxStops", () => {
      expect(normalizePreferences({ maxStops: 0 }).maxStops).toBe(0);
      expect(normalizePreferences({ maxStops: 2 }).maxStops).toBe(2);
      expect(normalizePreferences({ maxStops: -1 }).maxStops).toBe(1);
      expect(normalizePreferences({ maxStops: 1.5 }).maxStops).toBe(1);
      expect(normalizePreferences({ maxStops: "direct" as unknown as number }).maxStops).toBe(1);
    });

    it("filters preferredAirlines and validates array structure", () => {
      expect(normalizePreferences({
        preferredAirlines: ["VN", "VJ", 999 as unknown as string],
      }).preferredAirlines).toEqual(["VN", "VJ"]);

      expect(normalizePreferences({
        preferredAirlines: "VN" as unknown as string[],
      }).preferredAirlines).toEqual([]);
    });

    it("enforces cabinClass allowlist (ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST)", () => {
      expect(normalizePreferences({ cabinClass: "ECONOMY" }).cabinClass).toBe("ECONOMY");
      expect(normalizePreferences({ cabinClass: "PREMIUM_ECONOMY" }).cabinClass).toBe("PREMIUM_ECONOMY");
      expect(normalizePreferences({ cabinClass: "BUSINESS" }).cabinClass).toBe("BUSINESS");
      expect(normalizePreferences({ cabinClass: "FIRST" }).cabinClass).toBe("FIRST");

      expect(normalizePreferences({ cabinClass: "COACH" as unknown as "ECONOMY" }).cabinClass).toBe("ECONOMY");
      expect(normalizePreferences({ cabinClass: "economy" as unknown as "ECONOMY" }).cabinClass).toBe("ECONOMY");
    });

    it("validates maxFlightTimeMinutes as positive number or undefined", () => {
      expect(normalizePreferences({ maxFlightTimeMinutes: 360 }).maxFlightTimeMinutes).toBe(360);
      expect(normalizePreferences({ maxFlightTimeMinutes: 0 }).maxFlightTimeMinutes).toBeUndefined();
      expect(normalizePreferences({ maxFlightTimeMinutes: -120 }).maxFlightTimeMinutes).toBeUndefined();
      expect(normalizePreferences({ maxFlightTimeMinutes: "fast" as unknown as number }).maxFlightTimeMinutes).toBeUndefined();
    });

    it("strictly requires boolean true for allowSelfTransfer (NC-009, NC-010)", () => {
      expect(normalizePreferences({ allowSelfTransfer: true }).allowSelfTransfer).toBe(true);
      expect(normalizePreferences({ allowSelfTransfer: false }).allowSelfTransfer).toBe(false);
      expect(normalizePreferences({ allowSelfTransfer: "true" as unknown as boolean }).allowSelfTransfer).toBe(false);
      expect(normalizePreferences({ allowSelfTransfer: 1 as unknown as boolean }).allowSelfTransfer).toBe(false);
    });

    it("validates YYYY-MM-DD date range and clears reversed intervals (REQ-DOM-008)", () => {
      // Valid range
      const valid = normalizePreferences({
        departureFrom: "2026-10-01",
        departureTo: "2026-10-15",
      });
      expect(valid.departureFrom).toBe("2026-10-01");
      expect(valid.departureTo).toBe("2026-10-15");

      // Inverted range: departureFrom > departureTo -> both cleared
      const reversed = normalizePreferences({
        departureFrom: "2026-10-15",
        departureTo: "2026-10-01",
      });
      expect(reversed.departureFrom).toBeUndefined();
      expect(reversed.departureTo).toBeUndefined();

      // Malformed date strings -> cleared
      const badDates = normalizePreferences({
        departureFrom: "01/10/2026",
        departureTo: "invalid-date",
      });
      expect(badDates.departureFrom).toBeUndefined();
      expect(badDates.departureTo).toBeUndefined();
    });
  });

  describe("localStorage persistence and partial updates", () => {
    it("persists and merges incremental partial preference updates", () => {
      const store = createMockStorage();
      const first = saveUserPreferences({ homeAirport: "DAD", maxStops: 0 }, store);
      expect(first.homeAirport).toBe("DAD");
      expect(first.maxStops).toBe(0);
      expect(first.budget).toBe(15_000_000);

      const second = saveUserPreferences({ budget: 25_000_000 }, store);
      expect(second.homeAirport).toBe("DAD");
      expect(second.maxStops).toBe(0);
      expect(second.budget).toBe(25_000_000);

      const read = getUserPreferences(store);
      expect(read.homeAirport).toBe("DAD");
      expect(read.maxStops).toBe(0);
      expect(read.budget).toBe(25_000_000);
    });

    it("recovers gracefully from corrupted JSON in localStorage", () => {
      const store = createMockStorage({
        "flycheap.user-preferences": "{ corrupted json syntax error",
      });
      const preferences = getUserPreferences(store);
      expect(preferences).toEqual(defaultPreferences);
    });

    it("returns default preferences when storage is undefined", () => {
      expect(getUserPreferences(undefined)).toEqual(defaultPreferences);
      expect(saveUserPreferences({ homeAirport: "CXR" }, undefined).homeAirport).toBe("CXR");
    });
  });

  describe("remote preferences sync offline resilience", () => {
    it("returns undefined cleanly when Supabase is not configured", async () => {
      await expect(loadRemoteUserPreferences()).resolves.toBeUndefined();
    });

    it("returns false cleanly when Supabase is not configured during save", async () => {
      await expect(saveRemoteUserPreferences(defaultPreferences)).resolves.toBe(false);
    });
  });
});
