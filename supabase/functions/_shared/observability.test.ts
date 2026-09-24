import { assertEquals, assertMatch, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { operationalFields, operationalHeaders, requestId, safeOperationalErrorCode } from "./observability.ts";

Deno.test("preserves a safe caller correlation id and rejects log-injection input", () => {
  assertEquals(requestId(new Request("https://example.test", { headers: { "x-request-id": "scan-20260820-01" } })), "scan-20260820-01");
  const generated = requestId(new Request("https://example.test", { headers: { "x-request-id": "bad value" } }));
  assertNotEquals(generated, "bad value");
  assertMatch(generated, /^[0-9a-f-]{36}$/);
});

Deno.test("operational errors keep bounded codes without provider or PII messages", () => {
  assertEquals(safeOperationalErrorCode({ code: "PGRST116", message: "private@example.com" }), "PGRST116");
  assertEquals(safeOperationalErrorCode(new Error("private@example.com")), "operation_failed");
  assertEquals(safeOperationalErrorCode({ code: "bad code with spaces" }), "operation_failed");
});

Deno.test("exposes matching operational response metadata", () => {
  assertEquals(operationalFields("request-123").request_id, "request-123");
  assertEquals(operationalHeaders("request-123")["x-request-id"], "request-123");
});
