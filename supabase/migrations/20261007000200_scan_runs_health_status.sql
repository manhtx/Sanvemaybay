BEGIN;

-- NODE PIPE-01: Decouple execution lifecycle from result quality in scan_runs
-- status = execution lifecycle ('running', 'completed', 'failed')
-- health_status = result quality ('healthy', 'partial', 'degraded', 'failed', 'unknown')
ALTER TABLE public.scan_runs
  ADD COLUMN IF NOT EXISTS health_status TEXT NOT NULL DEFAULT 'healthy'
  CHECK (health_status IN ('healthy', 'partial', 'degraded', 'failed', 'unknown'));

-- Update operational_scan_health view to include health_status
CREATE OR REPLACE VIEW public.operational_scan_health
WITH (security_invoker = true)
AS
SELECT
  runs.id AS scan_run_id,
  routes.origin_code,
  routes.destination_code,
  runs.provider,
  runs.status,
  runs.health_status,
  runs.observations_saved,
  runs.started_at,
  runs.completed_at,
  GREATEST(0, EXTRACT(EPOCH FROM (COALESCE(runs.completed_at, NOW()) - runs.started_at)) * 1000)::BIGINT AS duration_ms,
  runs.response_payload ->> 'run_id' AS worker_run_id,
  runs.response_payload ->> 'release_sha' AS release_sha,
  COALESCE(NULLIF(runs.response_payload ->> 'windows_attempted', '')::INT, 0) AS windows_attempted,
  COALESCE(NULLIF(runs.response_payload ->> 'windows_succeeded', '')::INT, 0) AS windows_succeeded,
  COALESCE(NULLIF(runs.response_payload ->> 'windows_failed', '')::INT, 0) AS windows_failed,
  COALESCE(NULLIF(runs.response_payload ->> 'provider_results', '')::INT, 0) AS provider_results,
  COALESCE(NULLIF(runs.response_payload ->> 'normalized_rows', '')::INT, 0) AS normalized_rows,
  COALESCE(NULLIF(runs.response_payload ->> 'rejected_rows', '')::INT, 0) AS rejected_rows,
  COALESCE(NULLIF(runs.response_payload ->> 'deduped_rows', '')::INT, 0) AS deduped_rows,
  runs.error_message
FROM public.scan_runs AS runs
JOIN public.tracked_routes AS routes ON routes.id = runs.route_id;

REVOKE ALL ON TABLE public.operational_scan_health FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.operational_scan_health TO service_role;

COMMIT;
