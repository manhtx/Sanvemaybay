/**
 * Farely Coordinated Release Tuple Architecture
 * Enforcing Section B4 (Hypothesis H1), Section D, and Gates PS35-01, PS35-02, PS35-03.
 *
 * Reconciles the multi-component deployment tuple:
 * - Frontend release SHA (from release.json build metadata)
 * - Edge runtime release SHA (from Edge Function DEPLOYED_COMMIT / operationalFields)
 * - Database migration HEAD (supabase/migrations)
 * - Worker revision
 * - Active observation generation ID
 *
 * Mismatch between frontend and edge runtime strictly fails unless an authorized
 * compatibility tuple is explicitly proven and registered.
 */

export interface ReleaseTuple {
  tuple_id: string;
  frontend_release_sha: string;
  edge_runtime_sha: string;
  db_migration_head: string;
  worker_revision: string;
  active_generation_id: string;
  api_contract_version: string;
  observation_schema_version: number;
  parity_mode: 'ATOMIC_SHA_PARITY' | 'COMPATIBLE_TUPLE';
  authorized_by: string;
  created_at: string;
  notes?: string;
}

export interface ReleaseEvaluationContext {
  frontendSha: string;
  edgeSha: string;
  migrationHead?: string;
  activeGenerationId?: string;
  releaseJsonTampered?: boolean;
  deployedCommitOverwrittenWithoutDeploy?: boolean;
  registeredTuples?: ReleaseTuple[];
}

export interface ReleaseEvaluationResult {
  valid: boolean;
  parity_mode: 'ATOMIC_SHA_PARITY' | 'COMPATIBLE_TUPLE';
  status: 'COMPATIBLE' | 'MISMATCH_REJECTED' | 'TAMPERING_REJECTED' | 'UNAUTHORIZED_MUTATION_REJECTED';
  reason?: string;
  matched_tuple_id?: string;
}

/**
 * Evaluates whether a runtime frontend/edge release pairing is valid under the
 * Coordinated Release Tuple architecture.
 */
export function evaluateReleaseTupleCompatibility(ctx: ReleaseEvaluationContext): ReleaseEvaluationResult {
  // PS35-02: Tampered release.json without authentic build
  if (ctx.releaseJsonTampered) {
    return {
      valid: false,
      parity_mode: 'ATOMIC_SHA_PARITY',
      status: 'TAMPERING_REJECTED',
      reason: 'release.json manually altered without authentic deployment revision'
    };
  }

  // PS35-03: Edge DEPLOYED_COMMIT overwritten without actual deployment
  if (ctx.deployedCommitOverwrittenWithoutDeploy) {
    return {
      valid: false,
      parity_mode: 'ATOMIC_SHA_PARITY',
      status: 'UNAUTHORIZED_MUTATION_REJECTED',
      reason: 'Edge DEPLOYED_COMMIT overwritten to match frontend without actual deployment'
    };
  }

  // Pure atomic SHA parity
  if (ctx.frontendSha === ctx.edgeSha) {
    return {
      valid: true,
      parity_mode: 'ATOMIC_SHA_PARITY',
      status: 'COMPATIBLE'
    };
  }

  // PS35-01: Mismatch requiring atomic parity fails unless authorized compatible tuple is proven
  const matched = (ctx.registeredTuples || []).find(
    (t) => t.frontend_release_sha === ctx.frontendSha && t.edge_runtime_sha === ctx.edgeSha
  );

  if (matched) {
    return {
      valid: true,
      parity_mode: 'COMPATIBLE_TUPLE',
      status: 'COMPATIBLE',
      matched_tuple_id: matched.tuple_id
    };
  }

  return {
    valid: false,
    parity_mode: 'ATOMIC_SHA_PARITY',
    status: 'MISMATCH_REJECTED',
    reason: `frontend/runtime release mismatch: ${ctx.frontendSha} != ${ctx.edgeSha}`
  };
}
