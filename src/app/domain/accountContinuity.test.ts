import { describe, it, expect, beforeEach } from "vitest";
import {
  inspectPendingGuestData,
  markLocalDataAsGuest,
  purgeLocalUserDataOnSignOut,
  resolveAccountContinuity,
  CrossAccountContaminationError,
  SilentMergeProhibitedError,
  CONTINUITY_STORAGE_KEYS,
} from "./accountContinuity";

class MemoryStorage implements Storage {
  private store: Record<string, string> = {};

  get length() {
    return Object.keys(this.store).length;
  }

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] ?? null;
  }

  key(index: number) {
    return Object.keys(this.store)[index] ?? null;
  }

  removeItem(key: string) {
    delete this.store[key];
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
}

describe("Anonymous -> Account Continuity & Identity Isolation (F44)", () => {
  let mockStorage: Storage;

  beforeEach(() => {
    mockStorage = new MemoryStorage();
  });

  describe("purgeLocalUserDataOnSignOut", () => {
    it("completely purges saved deals, snapshots, watches, and identity on sign-out", () => {
      mockStorage.setItem(CONTINUITY_STORAGE_KEYS.SAVED_OPPORTUNITIES, JSON.stringify(["deal-1", "deal-2"]));
      mockStorage.setItem(CONTINUITY_STORAGE_KEYS.LOCAL_WATCHES, JSON.stringify([{ id: "w-1" }]));
      mockStorage.setItem(CONTINUITY_STORAGE_KEYS.SESSION_OWNER, "user-alice-123");

      purgeLocalUserDataOnSignOut(mockStorage);

      expect(mockStorage.getItem(CONTINUITY_STORAGE_KEYS.SAVED_OPPORTUNITIES)).toBeNull();
      expect(mockStorage.getItem(CONTINUITY_STORAGE_KEYS.LOCAL_WATCHES)).toBeNull();
      expect(mockStorage.getItem(CONTINUITY_STORAGE_KEYS.SESSION_OWNER)).toBeNull();
    });
  });

  describe("inspectPendingGuestData", () => {
    it("detects no guest data when storage is empty", () => {
      const pending = inspectPendingGuestData(mockStorage);
      expect(pending.hasGuestData).toBe(false);
      expect(pending.savedCount).toBe(0);
      expect(pending.watchCount).toBe(0);
    });

    it("detects guest data when marked as guest with saved items", () => {
      mockStorage.setItem(CONTINUITY_STORAGE_KEYS.SAVED_OPPORTUNITIES, JSON.stringify(["deal-1"]));
      mockStorage.setItem(CONTINUITY_STORAGE_KEYS.LOCAL_WATCHES, JSON.stringify([{ id: "w-1" }, { id: "w-2" }]));
      markLocalDataAsGuest(mockStorage);

      const pending = inspectPendingGuestData(mockStorage);
      expect(pending.hasGuestData).toBe(true);
      expect(pending.savedCount).toBe(1);
      expect(pending.watchCount).toBe(2);
    });
  });

  describe("resolveAccountContinuity (F44 Invariants)", () => {
    it("throws SilentMergeProhibitedError if guest data exists but explicitConsentGiven is null", () => {
      mockStorage.setItem(CONTINUITY_STORAGE_KEYS.SAVED_OPPORTUNITIES, JSON.stringify(["deal-guest"]));
      markLocalDataAsGuest(mockStorage);

      expect(() => {
        resolveAccountContinuity({
          currentUserId: "user-bob-456",
          explicitConsentGiven: null, // No explicit consent given
          storage: mockStorage,
        });
      }).toThrow(SilentMergeProhibitedError);
    });

    it("migrates guest data when user explicitly grants consent", () => {
      mockStorage.setItem(CONTINUITY_STORAGE_KEYS.SAVED_OPPORTUNITIES, JSON.stringify(["deal-guest-1", "deal-guest-2"]));
      markLocalDataAsGuest(mockStorage);

      const result = resolveAccountContinuity({
        currentUserId: "user-bob-456",
        explicitConsentGiven: true, // User consented
        storage: mockStorage,
      });

      expect(result.resolution).toBe("TRANSFERRED_WITH_CONSENT");
      expect(result.savedTransferred).toBe(2);
      expect(mockStorage.getItem(CONTINUITY_STORAGE_KEYS.SESSION_OWNER)).toBe("user-bob-456");
      expect(mockStorage.getItem(CONTINUITY_STORAGE_KEYS.IS_GUEST_DATA)).toBeNull();
    });

    it("discards guest data when user declines migration", () => {
      mockStorage.setItem(CONTINUITY_STORAGE_KEYS.SAVED_OPPORTUNITIES, JSON.stringify(["deal-guest-1"]));
      markLocalDataAsGuest(mockStorage);

      const result = resolveAccountContinuity({
        currentUserId: "user-bob-456",
        explicitConsentGiven: false, // User declined
        storage: mockStorage,
      });

      expect(result.resolution).toBe("DISCARDED_BY_USER");
      expect(result.savedTransferred).toBe(0);
      expect(mockStorage.getItem(CONTINUITY_STORAGE_KEYS.SAVED_OPPORTUNITIES)).toBeNull();
      expect(mockStorage.getItem(CONTINUITY_STORAGE_KEYS.SESSION_OWNER)).toBe("user-bob-456");
    });

    it("strictly prohibits cross-account bleed if data belongs to a different prior user", () => {
      mockStorage.setItem(CONTINUITY_STORAGE_KEYS.SAVED_OPPORTUNITIES, JSON.stringify(["deal-alice"]));
      mockStorage.setItem(CONTINUITY_STORAGE_KEYS.SESSION_OWNER, "user-alice-123");

      expect(() => {
        resolveAccountContinuity({
          currentUserId: "user-bob-456",
          explicitConsentGiven: true,
          storage: mockStorage,
        });
      }).toThrow(CrossAccountContaminationError);

      // And verifies that contaminated data was purged immediately
      expect(mockStorage.getItem(CONTINUITY_STORAGE_KEYS.SAVED_OPPORTUNITIES)).toBeNull();
    });
  });
});
