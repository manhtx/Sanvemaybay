export function isAccountDeletionConfirmed(value: unknown): boolean {
  return value === "DELETE_MY_ACCOUNT";
}

export async function accountDeletionLogId(userId: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(userId));
  return Array.from(new Uint8Array(digest).slice(0, 8))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function safeUserDataErrorCode(error: unknown): string {
  if (!error || typeof error !== "object" || !("code" in error)) return "user_data_action_failed";
  const code = String((error as { code?: unknown }).code ?? "");
  return /^[A-Za-z0-9_-]{1,80}$/.test(code) ? code : "user_data_action_failed";
}
