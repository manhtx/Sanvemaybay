import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validateAlertInput } from "./alert-validation.ts";

const valid = { email: "traveler@example.com", channel: "email", destination: "Bangkok", origin_code: "HAN", destination_code: "BKK", date_from: "2026-10-01", date_to: "2026-10-10", discount_threshold: 30, budget: 5_000_000 };

Deno.test("validates alert payload boundaries", () => {
  assertEquals(validateAlertInput(valid), null);
  assertEquals(validateAlertInput({ ...valid, date_from: "2026-11-01", date_to: "2026-10-01" }), "Khoảng ngày không hợp lệ.");
  assertEquals(validateAlertInput({ ...valid, channel: "sms" }), "Kênh thông báo không hợp lệ.");
  assertEquals(validateAlertInput({ ...valid, discount_threshold: 101 }), "Ngưỡng giảm giá không hợp lệ.");
  assertEquals(validateAlertInput({ ...valid, channel: "telegram", telegram_id: "not-a-chat" }), "Telegram Chat ID không hợp lệ.");
});
