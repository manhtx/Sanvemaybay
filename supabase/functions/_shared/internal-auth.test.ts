import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { requireInternalSecret } from "./internal-auth.ts";

Deno.test("internal auth rejects requests when the configured secret is absent", () => {
  const original = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  Deno.env.delete("INTERNAL_FUNCTION_SECRET");
  const response = requireInternalSecret(new Request("https://example.test"));
  assertEquals(response?.status, 401);
  if (original) Deno.env.set("INTERNAL_FUNCTION_SECRET", original);
});

Deno.test("internal auth rejects a mismatched secret", () => {
  const original = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  Deno.env.set("INTERNAL_FUNCTION_SECRET", "expected");
  const response = requireInternalSecret(new Request("https://example.test", { headers: { "x-internal-secret": "wrong" } }));
  assertEquals(response?.status, 401);
  if (original) Deno.env.set("INTERNAL_FUNCTION_SECRET", original);
  else Deno.env.delete("INTERNAL_FUNCTION_SECRET");
});

Deno.test("internal auth accepts the configured secret", () => {
  const original = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  Deno.env.set("INTERNAL_FUNCTION_SECRET", "expected");
  const response = requireInternalSecret(new Request("https://example.test", { headers: { "x-internal-secret": "expected" } }));
  assertEquals(response, undefined);
  if (original) Deno.env.set("INTERNAL_FUNCTION_SECRET", original);
  else Deno.env.delete("INTERNAL_FUNCTION_SECRET");
});
