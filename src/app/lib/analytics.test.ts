import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  appendLocalProductEvent,
  ProductEvent,
  readLocalProductEvents,
  sanitizeProductEvent,
  trackProductEvent,
} from "./analytics";
import { supabase } from "./supabase";

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

    it("preserves all allowedMetadata keys without stripping", () => {
      const allAllowedKeys = {
        route: "HAN-SGN",
        source: "flight_search",
        channel: "email",
        bookmarked: true,
        provider: "amadeus",
        device: "mobile",
        metric: "FCP",
        value: 1200,
        delta: 50,
        rating: "good",
        navigation_type: "navigate",
        opportunity_id: "opp-12345",
        watch_id: "watch-67890",
        environment: "production",
        release: "v1.2.0",
        synthetic: false,
        verification_run_id: "vr-999",
        target_price: 2000000,
        page: "/deals",
      };

      const event = sanitizeProductEvent({
        eventType: "detail_view",
        metadata: allAllowedKeys,
      });

      expect(event.metadata).toEqual(allAllowedKeys);
    });

    it("strips dangerous or unallowlisted keys (PII, tokens, prototype pollution)", () => {
      const event = sanitizeProductEvent({
        eventType: "opportunity_open",
        metadata: {
          route: "SGN-BKK",
          token: "secret_bearer_token",
          password: "super_secret_password",
          user_id: "usr_123",
          credit_card: "4111222233334444",
          __proto__: "polluted",
          constructor: "polluted",
        } as any,
      });

      expect(event.metadata).toEqual({ route: "SGN-BKK" });
      expect((event.metadata as any)?.token).toBeUndefined();
      expect((event.metadata as any)?.password).toBeUndefined();
      expect((event.metadata as any)?.user_id).toBeUndefined();
      expect((event.metadata as any)?.credit_card).toBeUndefined();
    });

    it("accepts boolean and zero numeric values without falsy coercion", () => {
      const event = sanitizeProductEvent({
        eventType: "web_vital",
        metadata: {
          bookmarked: false,
          value: 0,
          delta: 0,
          rating: null,
          synthetic: false,
        },
      });

      expect(event.metadata).toEqual({
        bookmarked: false,
        value: 0,
        delta: 0,
        rating: null,
        synthetic: false,
      });
    });

    it("handles all 15 valid ProductEventType variants faithfully", () => {
      const eventTypes = [
        "opportunity_impression",
        "opportunity_open",
        "detail_view",
        "evidence_engagement",
        "watch_created",
        "alert_created",
        "watch_matched",
        "verify_click",
        "booking_click",
        "verify_result",
        "alert_delivered",
        "bookmark",
        "share",
        "web_vital",
        "page_view",
      ] as const;

      for (const eventType of eventTypes) {
        const sanitized = sanitizeProductEvent({ eventType, entityId: "ent-1" });
        expect(sanitized.eventType).toBe(eventType);
      }
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

    it("recovers gracefully when storage.getItem throws an exception (e.g. security / permission error)", () => {
      const throwingStore: Storage = {
        getItem: () => {
          throw new Error("SecurityError: Access is denied for this document");
        },
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        key: () => null,
        length: 0,
      };

      expect(readLocalProductEvents(throwingStore)).toEqual([]);
    });

    it("preserves exact FIFO ordering when appending across multiple cycles up to 100 limit", () => {
      const store = createMockStorage();
      for (let i = 0; i < 50; i++) {
        appendLocalProductEvent({ eventType: "page_view", entityId: `first_wave_${i}` }, store);
      }
      for (let i = 0; i < 70; i++) {
        appendLocalProductEvent({ eventType: "page_view", entityId: `second_wave_${i}` }, store);
      }

      const events = readLocalProductEvents(store);
      expect(events).toHaveLength(100);
      expect(events[0].entityId).toBe("first_wave_20"); // 50 + 70 = 120 -> first 20 discarded
      expect(events[99].entityId).toBe("second_wave_69");
    });
  });

  describe("trackProductEvent: polymorphic calling and graceful offline degradation", () => {
    beforeEach(() => {
      vi.spyOn(supabase.functions.constructor.prototype as any, "invoke").mockResolvedValue({ data: null, error: null });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

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

    it("tracks event with positional arguments omitting metadata and entityId", async () => {
      const store = createMockStorage();
      await trackProductEvent("page_view", undefined, undefined, store);

      const events = readLocalProductEvents(store);
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe("page_view");
      expect(events[0].entityId).toBeUndefined();
      expect(events[0].metadata).toEqual({});
    });

    it("tracks event with object argument when entityId is omitted", async () => {
      const store = createMockStorage();
      await trackProductEvent({ eventType: "share", metadata: { channel: "facebook" } }, store);

      const events = readLocalProductEvents(store);
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe("share");
      expect(events[0].entityId).toBeUndefined();
      expect(events[0].metadata).toEqual({ channel: "facebook" });
    });

    it("preserves input event immutability on Object.freeze protected events", async () => {
      const store = createMockStorage();
      const frozenEvent = Object.freeze({
        eventType: "detail_view" as const,
        entityId: "frozen-123",
        metadata: Object.freeze({ route: "HAN-ICN" }),
      });

      await expect(trackProductEvent(frozenEvent, store)).resolves.toBeUndefined();
      const events = readLocalProductEvents(store);
      expect(events).toHaveLength(1);
      expect(events[0].entityId).toBe("frozen-123");
    });

    it("high-volume analytics benchmark: 5,000 sanitizations in sub-50ms", () => {
      const start = performance.now();
      for (let i = 0; i < 5000; i++) {
        sanitizeProductEvent({
          eventType: "detail_view",
          entityId: `id_${i}`,
          metadata: {
            route: "HAN-BKK",
            value: i,
            synthetic: false,
          },
        });
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50);
    });

    it("runs cleanly without throwing when storage is undefined", async () => {
      await expect(
        trackProductEvent({ eventType: "page_view" }, undefined),
      ).resolves.toBeUndefined();
    });
  });
});
