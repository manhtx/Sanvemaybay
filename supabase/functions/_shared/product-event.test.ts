import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isCurrentCoreWebVital, validateProductEvent } from "./product-event.ts";

Deno.test("accepts a bounded allow-listed product event", () => {
  assertEquals(validateProductEvent({ event_type: "detail_view", entity_id: "deal-1", metadata: { route: "HAN-BKK" } }), {
    event_type: "detail_view",
    entity_id: "deal-1",
    metadata: { route: "HAN-BKK" },
  });
  assertEquals(validateProductEvent({
    event_type: "opportunity_open",
    entity_id: "opp-123",
    metadata: { opportunity_id: "HAN:BKK:2026-10-10", synthetic: true, page: "search" },
  }), {
    event_type: "opportunity_open",
    entity_id: "opp-123",
    metadata: { opportunity_id: "HAN:BKK:2026-10-10", synthetic: true, page: "search" },
  });
});

Deno.test("rejects unknown types, metadata and oversized identifiers", () => {
  assertEquals(validateProductEvent({ event_type: "admin", metadata: {} }), null);
  assertEquals(validateProductEvent({ event_type: "share", metadata: { email: "secret@example.com" } }), null);
  assertEquals(validateProductEvent({ event_type: "share", entity_id: "x".repeat(121) }), null);
});

Deno.test("accepts privacy-bounded web vital metrics and distinguishes Core Web Vitals", () => {
  assertEquals(validateProductEvent({ event_type: "web_vital", entity_id: "/deals", metadata: { metric: "INP", value: 120, delta: 120, rating: "good", navigation_type: "navigate" } }), {
    event_type: "web_vital",
    entity_id: "/deals",
    metadata: { metric: "INP", value: 120, delta: 120, rating: "good", navigation_type: "navigate" },
  });
  assertEquals(isCurrentCoreWebVital("INP"), true);
  assertEquals(isCurrentCoreWebVital("LCP"), true);
  assertEquals(isCurrentCoreWebVital("CLS"), true);
  assertEquals(isCurrentCoreWebVital("FID"), false);
  assertEquals(isCurrentCoreWebVital("TTFB"), false);
});

