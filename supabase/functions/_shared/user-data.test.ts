import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { accountDeletionLogId, isAccountDeletionConfirmed, safeUserDataErrorCode } from "./user-data.ts";

Deno.test("account deletion requires the exact explicit confirmation", () => {
  assertEquals(isAccountDeletionConfirmed("DELETE_MY_ACCOUNT"), true);
  assertEquals(isAccountDeletionConfirmed("delete_my_account"), false);
  assertEquals(isAccountDeletionConfirmed(true), false);
  assertEquals(isAccountDeletionConfirmed(undefined), false);
});

Deno.test("user data logs retain bounded error codes and reject sensitive messages", () => {
  assertEquals(safeUserDataErrorCode({ code: "PGRST116", message: "private@example.com" }), "PGRST116");
  assertEquals(safeUserDataErrorCode(new Error("private@example.com")), "user_data_action_failed");
  assertEquals(safeUserDataErrorCode({ code: "bad code with spaces" }), "user_data_action_failed");
});

Deno.test("account deletion logs a stable one-way identifier instead of raw user id", async () => {
  const userId = "349b0cd2-e46a-4f84-a3f4-7702f312d377";
  const first = await accountDeletionLogId(userId);
  const second = await accountDeletionLogId(userId);
  assertEquals(first, second);
  assertEquals(first.length, 16);
  assertEquals(first.includes(userId), false);
});
