import { assertEquals, assertNotEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { clientAddress, consumeRequestBudget, hashRateLimitKey } from "./abuse-protection.ts";

Deno.test("extracts only the first forwarded client address", () => {
  const request = new Request("https://example.test", { headers: { "x-forwarded-for": "203.0.113.4, 10.0.0.1" } });
  assertEquals(clientAddress(request), "203.0.113.4");
});

Deno.test("hashes normalized identifiers without retaining raw values", async () => {
  const first = await hashRateLimitKey("alert-email", "User@Example.com", "a-long-production-salt");
  const same = await hashRateLimitKey("alert-email", " user@example.com ", "a-long-production-salt");
  const otherScope = await hashRateLimitKey("alert-ip", "user@example.com", "a-long-production-salt");
  assertEquals(first, same);
  assertNotEquals(first, otherScope);
  assertEquals(first.includes("user@example.com"), false);
  await assertRejects(() => hashRateLimitKey("alert-email", "user@example.com", "short"));
});

Deno.test("request budget fails closed on storage errors", async () => {
  const allowed = await consumeRequestBudget({ rpc: () => Promise.resolve({ data: true, error: null }) }, "alert", "key", 5, 3600);
  assertEquals(allowed, true);
  await assertRejects(() => consumeRequestBudget({ rpc: () => Promise.resolve({ data: null, error: new Error("unavailable") }) }, "alert", "key", 5, 3600));
});
