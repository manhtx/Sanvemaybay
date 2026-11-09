import { describe, expect, it } from "vitest";
import {
  appendLocalProductEvent,
  ProductEvent,
  readLocalProductEvents,
  sanitizeProductEvent,
  trackProductEvent,
} from "./analytics";

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

describe("product analytics (REQ-SEC-002, NC-025, NC-026, REQ-DOM-001)", () => {
  describe("sanitizeProductEvent: privacy, boundaries, and typing", () => {
    it("scrubs unallowlisted metadata keys and truncates long entity identifiers", () => {
      const event = sanitizeProductEvent({
        eventType: "detail_view",
        entityId: "x".repeat(200),
        metadata: {
          route: "HAN-BKK",
          source: "google_flights",
          secret_token: "leaked_token",
          user_email: "test@example.com",
        },
      });
      expect(event.entityId).toHaveLength(120);
      expect(event.metadata).toEqual({
        route: "HAN-BKK",
        source: "google_flights",
      });
      expect(event.metadata?.secret_token).toBeUndefined();
      expect(event.metadata?.user_email).toBeUndefined();
    });

    it("accepts valid primitive metadata values and rejects non-primitives (REQ-DOM-001)", () => {
      const event = sanitizeProductEvent({
        eventType: "web_vital",
        metadata: {
          metric: "LCP",
          value: 2450.5,
          delta: 120,
          bookmarked: true,
          rating: null,
          nested: { evil: "payload" } as unknown as string,
          arrayVal: [1, 2, 3] as unknown as string,
        },
      });
      expect(event.metadata).toEqual({
        metric: "LCP",
        value: 2450.5,
        delta: 120,
        bookmarked: true,
        rating: null,
      });
      expect(event.metadata?.nested).toBeUndefined();
      expect(event.metadata?.arrayVal).toBeUndefined();
    });

    it("preserves explicit createdAt and generates ISO string when absent", () => {
      const fixedTime = "2026-06-15T12:00:00.000Z";
      const withTime = sanitizeProductEvent({
        eventType: "booking_click",
        createdAt: fixedTime,
      });
      expect(withTime.createdAt).toBe(fixedTime);

      const generated = sanitizeProductEvent({ eventType: "opportunity_impression" });
      expect(generated.createdAt).toBeDefined();
      expect(Number.isFinite(Date.parse(generated.createdAt!))).toBe(true);
    });

    it("handles undefined entityId without throwing", () => {
      const event = sanitizeProductEvent({ eventType: "page_view" });
      expect(event.entityId).toBeUndefined();
    });
  });

  describe("readLocalProductEvents & appendLocalProductEvent: bounded storage ring buffer", () => {
    it("stores a bounded local queue of maximum 100 entries in FIFO order", () => {
      const store = createMockStorage();
      for (let i = 0; i < 115; i += 1) {
        appendLocalProductEvent({ eventType: "detail_view", entityId: String(i) }, store);
      }
      const events = readLocalProductEvents(store);
      expect(events).toHaveLength(100);
      expect(events[0].entityId).toBe("15");
      expect(events[events.length - 1].entityId).toBe("114");
    });

    it("falls back to legacy flycheap.product-events storage key when farely key is empty", () => {
      const legacyEvents: ProductEvent[] = [
        { eventType: "page_view", entityId: "legacy-deal-1" },
        { eventType: "detail_view", entityId: "legacy-deal-2" },
      ];
      const store = createMockStorage({
        "flycheap.product-events": JSON.stringify(legacyEvents),
      });

      const read = readLocalProductEvents(store);
      expect(read).toHaveLength(2);
      expect(read[0].entityId).toBe("legacy-deal-1");
    });

    it("recovers gracefully from corrupted JSON or non-array data in storage", () => {
      const corruptStore = createMockStorage({
        "farely.product-events": "{ invalid json corrupt content",
      });
      expect(readLocalProductEvents(corruptStore)).toEqual([]);

      const nonArrayStore = createMockStorage({
        "farely.product-events": JSON.stringify({ not: "an array" }),
      });
      expect(readLocalProductEvents(nonArrayStore)).toEqual([]);
    });

    it("returns empty array when storage is undefined", () => {
      expect(readLocalProductEvents(undefined)).toEqual([]);
    });
  });

  describe("trackProductEvent: polymorphic calling and graceful offline degradation", () => {
    it("tracks event supplied as a ProductEvent object", async () => {
      const store = createMockStorage();
      await trackProductEvent(
        { eventType: "bookmark", entityId: "deal-456", metadata: { bookmarked: true } },
        store,
      );

      const events = readLocalProductEvents(store);
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe("bookmark");
      expect(events[0].entityId).toBe("deal-456");
      expect(events[0].metadata).toEqual({ bookmarked: true });
    });

    it("tracks event supplied with positional arguments (eventType, metadata, entityId, storage)", async () => {
      const store = createMockStorage();
      await trackProductEvent(
        "booking_click",
        { route: "HAN-DAD", provider: "google" },
        "deal-789",
        store,
      );

      const events = readLocalProductEvents(store);
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe("booking_click");
      expect(events[0].entityId).toBe("deal-789");
      expect(events[0].metadata).toEqual({ route: "HAN-DAD", provider: "google" });
    });

    it("runs cleanly without throwing when storage is undefined", async () => {
      await expect(
        trackProductEvent({ eventType: "page_view" }, undefined),
      ).resolves.toBeUndefined();
    });
  });
});
