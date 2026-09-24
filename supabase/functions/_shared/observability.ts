const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{8,80}$/;

export function requestId(request: Request): string {
  const supplied = request.headers.get("x-request-id")?.trim() ?? "";
  return SAFE_REQUEST_ID.test(supplied) ? supplied : crypto.randomUUID();
}

export function operationalFields(id: string): Record<string, string> {
  return {
    request_id: id,
    release_sha: Deno.env.get("DEPLOYED_COMMIT") ?? "unknown",
  };
}

export function operationalHeaders(id: string): Record<string, string> {
  return { "x-request-id": id, "x-release-sha": Deno.env.get("DEPLOYED_COMMIT") ?? "unknown" };
}

export function safeOperationalErrorCode(error: unknown, fallback = "operation_failed"): string {
  if (!error || typeof error !== "object") return fallback;
  const candidate = "code" in error
    ? String((error as { code?: unknown }).code ?? "")
    : "name" in error
    ? String((error as { name?: unknown }).name ?? "")
    : "";
  return /^[A-Za-z0-9_-]{1,80}$/.test(candidate) && candidate !== "Error" ? candidate : fallback;
}
