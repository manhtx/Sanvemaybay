export function clientAddress(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const connecting = request.headers.get("cf-connecting-ip")?.trim();
  return forwarded || connecting || null;
}

export async function hashRateLimitKey(scope: string, value: string, salt: string): Promise<string> {
  if (!scope || !value || salt.length < 16) throw new Error("Rate-limit key configuration is invalid");
  const bytes = new TextEncoder().encode(`${scope}:${salt}:${value.trim().toLowerCase()}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function consumeRequestBudget(
  client: { rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }> },
  action: string,
  bucketKey: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const { data, error } = await client.rpc("consume_request_budget", {
    p_action: action,
    p_bucket_key: bucketKey,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw error;
  return data === true;
}
