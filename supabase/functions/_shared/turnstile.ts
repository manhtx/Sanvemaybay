export interface TurnstileVerification {
  success: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
}

export async function verifyTurnstileToken(
  token: unknown,
  remoteAddress: string,
  secret: string,
  allowedHostnames: Set<string>,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  if (typeof token !== "string" || token.length < 1 || token.length > 2_048) return false;
  if (!remoteAddress || !secret || allowedHostnames.size === 0) return false;

  const response = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret,
      response: token,
      remoteip: remoteAddress,
      idempotency_key: crypto.randomUUID(),
    }),
  });
  if (!response.ok) return false;
  const result = await response.json() as TurnstileVerification;
  const hostname = result.hostname?.toLowerCase();
  return result.success === true && result.action === "setup_alert" && Boolean(hostname && allowedHostnames.has(hostname));
}
