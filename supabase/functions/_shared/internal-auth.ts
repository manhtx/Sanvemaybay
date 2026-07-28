export function requireInternalSecret(request: Request): Response | undefined {
  const expected = Deno.env.get("INTERNAL_FUNCTION_SECRET") ?? "";
  const provided = request.headers.get("x-internal-secret") ?? "";

  if (!expected || !provided || provided !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return undefined;
}
