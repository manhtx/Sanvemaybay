import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { nextNotificationRetry } from "./retry-policy.ts";

Deno.test("uses bounded 1/5/15 minute notification backoff", () => {
  const now = new Date("2026-08-01T00:00:00.000Z");
  assertEquals(nextNotificationRetry(0, now), { attemptCount: 1, nextRetryAt: "2026-08-01T00:01:00.000Z" });
  assertEquals(nextNotificationRetry(1, now), { attemptCount: 2, nextRetryAt: "2026-08-01T00:05:00.000Z" });
  assertEquals(nextNotificationRetry(2, now), { attemptCount: 3, nextRetryAt: "2026-08-01T00:15:00.000Z" });
  assertEquals(nextNotificationRetry(3, now), { attemptCount: 4 });
});
