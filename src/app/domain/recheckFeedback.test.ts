import { beforeEach, describe, expect, it } from "vitest";
import {
  createRecheckFeedback,
  getFeedbackForOpportunity,
  getStoredRecheckFeedbacks,
  saveRecheckFeedback,
} from "./recheckFeedback";

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() { return this.store.size; }
  clear() { this.store.clear(); }
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  key(index: number) { return Array.from(this.store.keys())[index] ?? null; }
}

describe("Recheck Feedback Contracts (F26, F30)", () => {
  let mockStorage: Storage;

  beforeEach(() => {
    mockStorage = new MemoryStorage();
  });

  it("creates recheck feedback with invariant status 'USER_REPORTED'", () => {
    const feedback = createRecheckFeedback({
      opportunityId: "opp-han-sgn",
      route: "HAN-SGN",
      observedPrice: 1500000,
      reportedOutcome: "MATCHED",
    });

    expect(feedback.id).toMatch(/^fb-/);
    expect(feedback.opportunityId).toBe("opp-han-sgn");
    expect(feedback.status).toBe("USER_REPORTED"); // F30 requirement
    expect(feedback.reportedOutcome).toBe("MATCHED");
    expect(feedback.reportedAt).toBeDefined();
  });

  it("saves and retrieves recheck feedback for opportunity", () => {
    const fb1 = createRecheckFeedback({
      opportunityId: "opp-1",
      route: "HAN-BKK",
      observedPrice: 2000000,
      reportedOutcome: "PRICE_CHANGED",
      reportedPrice: 2300000,
      note: "Hãng tăng giá thêm 300k",
    });

    saveRecheckFeedback(fb1, mockStorage);

    const stored = getStoredRecheckFeedbacks(mockStorage);
    expect(stored).toHaveLength(1);
    expect(stored[0].reportedPrice).toBe(2300000);

    const found = getFeedbackForOpportunity("opp-1", mockStorage);
    expect(found).toBeDefined();
    expect(found?.status).toBe("USER_REPORTED");
    expect(found?.reportedOutcome).toBe("PRICE_CHANGED");
  });

  it("handles unavailable flight feedback without upgrading to verified", () => {
    const fbUnavailable = createRecheckFeedback({
      opportunityId: "opp-2",
      route: "SGN-PQC",
      observedPrice: 900000,
      reportedOutcome: "UNAVAILABLE",
    });

    saveRecheckFeedback(fbUnavailable, mockStorage);

    const found = getFeedbackForOpportunity("opp-2", mockStorage);
    expect(found?.reportedOutcome).toBe("UNAVAILABLE");
    expect(found?.status).toBe("USER_REPORTED");
  });
});
