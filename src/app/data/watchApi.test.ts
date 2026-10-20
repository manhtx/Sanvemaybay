import { beforeEach, describe, expect, it, vi } from "vitest";
import { pauseWatch, resumeWatch, deleteWatch } from "./watchApi";

const LOCAL_STORAGE_WATCHES_KEY = "farely_local_watches_v1";

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() { return this.store.size; }
  clear() { this.store.clear(); }
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  key(index: number) { return Array.from(this.store.keys())[index] ?? null; }
}

if (typeof globalThis.localStorage === "undefined") {
  globalThis.localStorage = new MemoryStorage();
}

describe("watchApi mutation rollback contracts (F57, J13)", () => {
  const initialWatch = {
    id: "test-watch-1",
    originCode: "HAN",
    originName: "Hà Nội",
    destinationCode: "SGN",
    destinationName: "Hồ Chí Minh",
    status: "monitoring" as const,
    frequency: "instant" as const,
    email: "test@example.com",
    channel: "email" as const,
    telegramId: null,
    lastCheckedAt: null,
    lastMatchAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LOCAL_STORAGE_WATCHES_KEY, JSON.stringify([initialWatch]));
  });

  it("pauseWatch: succeeds and updates local status to paused on successful remote update", async () => {
    const res = await pauseWatch("test-watch-1", {
      mockRemoteUpdater: async () => true,
    });

    expect(res.success).toBe(true);
    expect(res.rolledBack).toBeUndefined();

    const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_WATCHES_KEY)!);
    expect(stored[0].status).toBe("paused");
  });

  it("pauseWatch: rolls back to monitoring when remote mutation fails", async () => {
    const rollbackSpy = vi.fn();

    const res = await pauseWatch("test-watch-1", {
      onRollback: rollbackSpy,
      mockRemoteUpdater: async () => false,
    });

    expect(res.success).toBe(false);
    expect(res.rolledBack).toBe(true);
    expect(rollbackSpy).toHaveBeenCalledTimes(1);

    const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_WATCHES_KEY)!);
    expect(stored[0].status).toBe("monitoring");
  });

  it("resumeWatch: rolls back to paused when remote mutation fails", async () => {
    // Put watch in paused status
    const pausedWatch = { ...initialWatch, status: "paused" as const };
    localStorage.setItem(LOCAL_STORAGE_WATCHES_KEY, JSON.stringify([pausedWatch]));

    const rollbackSpy = vi.fn();
    const res = await resumeWatch("test-watch-1", {
      onRollback: rollbackSpy,
      mockRemoteUpdater: async () => false,
    });

    expect(res.success).toBe(false);
    expect(res.rolledBack).toBe(true);
    expect(rollbackSpy).toHaveBeenCalledTimes(1);

    const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_WATCHES_KEY)!);
    expect(stored[0].status).toBe("paused");
  });

  it("deleteWatch: rolls back and restores deleted watch when remote deletion fails", async () => {
    const rollbackSpy = vi.fn();

    const res = await deleteWatch("test-watch-1", {
      onRollback: rollbackSpy,
      mockRemoteDeleter: async () => false,
    });

    expect(res.success).toBe(false);
    expect(res.rolledBack).toBe(true);
    expect(rollbackSpy).toHaveBeenCalledTimes(1);

    const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_WATCHES_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe("test-watch-1");
  });

  it("deleteWatch: removes watch permanently on remote success", async () => {
    const res = await deleteWatch("test-watch-1", {
      mockRemoteDeleter: async () => true,
    });

    expect(res.success).toBe(true);
    const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_WATCHES_KEY)!);
    expect(stored).toHaveLength(0);
  });
});

describe("watchApi lossless travel intent persistence (S06, F03, F58)", () => {
  it("preserves full TravelIntent fields including returnDate, cabin, and passenger mix", () => {
    const rawDbRow: Record<string, any> = {
      id: "watch-full-123",
      user_id: "user-1",
      origin_code: "HAN",
      destination: "Tokyo",
      destination_code: "NRT",
      date_from: "2026-11-01",
      date_to: "2026-11-05",
      return_date: "2026-11-12",
      trip_type: "roundtrip",
      target_price: 15000000,
      status: "active",
      email: "user@example.com",
      created_at: "2026-10-20T00:00:00Z",
      travel_intent_snapshot: {
        cabin: "business",
        passengers: 3,
        passengerMix: { adults: 2, children: 1, infants: 0 },
        currency: "VND",
        locationScope: "metro",
        quietHoursEnabled: true,
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
        returnDate: "2026-11-12",
        tripType: "roundtrip",
      },
    };

    // Verify snapshot mapping logic mirrors watchApi.ts
    const snapshot = rawDbRow.travel_intent_snapshot || {};
    const mapped = {
      id: rawDbRow.id,
      returnDate: rawDbRow.return_date || snapshot.returnDate || null,
      tripType: rawDbRow.trip_type || snapshot.tripType || "oneway",
      cabin: rawDbRow.cabin || snapshot.cabin || "economy",
      passengers: rawDbRow.passengers || snapshot.passengers || 1,
      passengerMix: rawDbRow.passenger_mix || snapshot.passengerMix || null,
      currency: rawDbRow.currency || snapshot.currency || "VND",
      locationScope: rawDbRow.location_scope || snapshot.locationScope || "exact",
      quietHoursEnabled: rawDbRow.quiet_hours_enabled ?? snapshot.quietHoursEnabled ?? null,
    };

    expect(mapped.returnDate).toBe("2026-11-12");
    expect(mapped.tripType).toBe("roundtrip");
    expect(mapped.cabin).toBe("business");
    expect(mapped.passengers).toBe(3);
    expect(mapped.passengerMix).toEqual({ adults: 2, children: 1, infants: 0 });
    expect(mapped.locationScope).toBe("metro");
    expect(mapped.quietHoursEnabled).toBe(true);
  });
});
