import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireInternalSecret } from "../_shared/internal-auth.ts";
import { operationalFields, operationalHeaders, requestId, safeOperationalErrorCode } from "../_shared/observability.ts";

function json(body: Record<string, unknown>, request: string, status = 200) {
  return new Response(JSON.stringify({ ...body, ...operationalFields(request) }), {
    status,
    headers: { "Content-Type": "application/json", ...operationalHeaders(request) },
  });
}

Deno.serve(async (request: Request) => {
  const id = requestId(request);
  if (request.method !== "POST") return json({ error: "Method not allowed" }, id, 405);
  const unauthorized = requireInternalSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => ({})) as { dry_run?: unknown };
    const dryRun = body.dry_run !== false;
    const service = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const { data, error } = await service.rpc("run_retention_cleanup", { p_dry_run: dryRun });
    if (error) throw error;
    const { data: deletionRequests, error: deletionRequestError } = await service.rpc(
      "cleanup_account_deletion_requests",
      { p_dry_run: dryRun },
    );
    if (deletionRequestError) throw deletionRequestError;
    const retention = { ...(data ?? {}), ...(deletionRequests ?? {}) };
    console.log(JSON.stringify({ event: "retention_cleanup_completed", request_id: id, dry_run: dryRun, counts: retention }));
    return json({ status: "completed", retention }, id);
  } catch (error) {
    console.error(JSON.stringify({ event: "retention_cleanup_failed", request_id: id, error_code: safeOperationalErrorCode(error) }));
    return json({ error: "Retention cleanup failed" }, id, 500);
  }
});
