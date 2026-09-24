import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validateProductEvent } from "./product-event.ts";

Deno.test("accepts a bounded allow-listed product event", () => {
  assertEquals(validateProductEvent({ event_type: "detail_view", entity_id: "deal-1", metadata: { route: "HAN-BKK" } }), {
    event_type: "detail_view",
    entity_id: "deal-1",
    metadata: { route: "HAN-BKK" },
  });
});

Deno.test("rejects unknown types, metadata and oversized identifiers", () => {
  assertEquals(validateProductEvent({ event_type: "admin", metadata: {} }), null);
  assertEquals(validateProductEvent({ event_type: "share", metadata: { email: "secret@example.com" } }), null);
  assertEquals(validateProductEvent({ event_type: "share", entity_id: "x".repeat(121) }), null);
});

Deno.test("accepts privacy-bounded web vital metrics", () => {
  assertEquals(validateProductEvent({ event_type: "web_vital", entity_id: "/deals", metadata: { metric: "LCP", value: 2012, delta: 2012, rating: "good", navigation_type: "navigate" } }), {
    event_type: "web_vital",
    entity_id: "/deals",
    metadata: { metric: "LCP", value: 2012, delta: 2012, rating: "good", navigation_type: "navigate" },
  });
});
