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
