import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { classifyFeedStatus, feedEnvelope, isSchemaContractError } from "./feed-health.ts";

Deno.test("classifies populated, empty and stale-only inventories", () => {
  assertEquals(classifyFeedStatus(2, 1), "healthy");
  assertEquals(classifyFeedStatus(0, 0), "healthy_empty");
  assertEquals(classifyFeedStatus(2, 0), "stale_only");
});

Deno.test("recognizes PostgREST missing-column schema drift", () => {
  assertEquals(isSchemaContractError({ code: "42703", message: "column deals.link_kind does not exist" }), true);
  assertEquals(isSchemaContractError({ code: "PGRST301", message: "connection failed" }), false);
});

Deno.test("builds a retryable degraded envelope without deals", () => {
  const result = feedEnvelope("degraded_schema", [], "schema_check", "2026-08-19T00:00:00Z");
  assertEquals(result.status, "degraded_schema");
  assertEquals(result.retryable, true);
  assertEquals(result.deals, []);
});
