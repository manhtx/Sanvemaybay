import test from "node:test";
import assert from "node:assert/strict";
import { isProtectedReadResult, PROTECTED_TABLES } from "./security-smoke.mjs";

test("security smoke accepts denied or RLS-empty reads only", () => {
  assert.equal(isProtectedReadResult(401, { message: "denied" }), true);
  assert.equal(isProtectedReadResult(403, { message: "denied" }), true);
  assert.equal(isProtectedReadResult(404, { message: "missing" }), false);
  assert.equal(isProtectedReadResult(404, { message: "missing" }, true), true);
  assert.equal(isProtectedReadResult(200, []), true);
  assert.equal(isProtectedReadResult(200, [{ id: "leaked" }]), false);
  assert.equal(isProtectedReadResult(500, []), false);
});

test("security smoke covers user-owned and deletion-control tables", () => {
  assert.equal(PROTECTED_TABLES.includes("user_preferences"), true);
  assert.equal(PROTECTED_TABLES.includes("user_bookmarks"), true);
  assert.equal(PROTECTED_TABLES.includes("account_deletion_requests"), true);
});
