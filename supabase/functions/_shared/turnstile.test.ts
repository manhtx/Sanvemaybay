import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { verifyTurnstileToken } from "./turnstile.ts";

Deno.test("Turnstile verification sends bounded server-side validation fields", async () => {
  let requestBody: Record<string, unknown> = {};
  const allowed = await verifyTurnstileToken("valid-token", "203.0.113.4", "secret", new Set(["flycheap.example"]), async (_input, init) => {
    requestBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ success: true, action: "setup_alert", hostname: "flycheap.example" }), { status: 200 });
  });
  assertEquals(allowed, true);
  assertEquals(requestBody.response, "valid-token");
  assertEquals(requestBody.remoteip, "203.0.113.4");
  assertEquals(typeof requestBody.idempotency_key, "string");
});

Deno.test("Turnstile verification fails closed for invalid, replay or wrong-action responses", async () => {
  const hosts = new Set(["flycheap.example"]);
  assertEquals(await verifyTurnstileToken("", "203.0.113.4", "secret", hosts), false);
  assertEquals(await verifyTurnstileToken("token", "203.0.113.4", "secret", hosts, async () => new Response(JSON.stringify({ success: false, "error-codes": ["timeout-or-duplicate"] }))), false);
  assertEquals(await verifyTurnstileToken("token", "203.0.113.4", "secret", hosts, async () => new Response(JSON.stringify({ success: true, action: "login", hostname: "flycheap.example" }))), false);
  assertEquals(await verifyTurnstileToken("token", "203.0.113.4", "secret", hosts, async () => new Response(JSON.stringify({ success: true, action: "setup_alert", hostname: "attacker.example" }))), false);
});
