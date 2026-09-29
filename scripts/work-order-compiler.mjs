import fs from 'node:fs';
import path from 'node:path';
import { reduceAuthorityState } from './authority-reducer.mjs';

/**
 * Work-Order Compiler (Section 36 & Section 37)
 * Evaluates current observed state and generates the single next atomic work order.
 */
export function compileNextWorkOrder(projectRoot = process.cwd()) {
  const flycheapDir = path.join(projectRoot, '.flycheap');
  const authority = reduceAuthorityState(projectRoot);

  if (authority.authority_state === 'LOCAL_EPHEMERAL_RUNTIME_VERIFIED') {
    // The next environment transition is Remote Staging Resolution
    const stagingFingerprintPath = path.join(flycheapDir, 'STAGING_ENVIRONMENT_FINGERPRINT.json');
    if (!fs.existsSync(stagingFingerprintPath)) {
      return {
        work_order_id: 'WO-STAGING-01-RESOLVE-CAPACITY',
        current_observed_state: 'LOCAL_EPHEMERAL_RUNTIME_VERIFIED',
        target_delta: 'Awaiting clean Supabase project slot or human capacity authorization',
        priority: 'P0',
        prerequisites: ['LOCAL_EPHEMERAL_RUNTIME_VERIFIED'],
        authority_class: 'HARD_EXTERNAL_AUTHORITY_REQUIRED',
        environment: 'REMOTE_SUPABASE_API',
        writable_paths: ['.flycheap/HUMAN_HANDOFF.json'],
        forbidden_actions: [
          'DO_NOT_PAUSE_UNKNOWN_PROJECTS',
          'DO_NOT_UPGRADE_PAID_PLAN_AUTONOMOUSLY',
          'DO_NOT_TOUCH_LEGACY_PROJECT_thprsgnpvtzkcvknqfwk'
        ],
        idempotency_key: 'IDEMP-WO-STAGING-CAPACITY-001',
        expected_observable: 'Clean staging project ref provisioned or project slot unblocked',
        proof_obligation: 'PO-CLEAN-STAGING-PROVISIONED',
        timeout_seconds: 60,
        retry_policy: 'BLOCKED_EXTERNAL_AWAITING_INPUT',
        compensation_rollback: 'None required (read-only state check)',
        cleanup_finalizers: [],
        expected_state_effect: 'Transition to STAGING_PREPARE on unblock',
        is_blocked_external: true,
        blocking_action_ref: 'ACT-STAGING-01'
      };
    }
  }

  if (authority.authority_state === 'REMOTE_STAGING_VERIFIED') {
    return {
      work_order_id: 'WO-PROD-01-PROMOTION-AND-CANARY',
      current_observed_state: 'REMOTE_STAGING_VERIFIED',
      target_delta: 'Promote verified candidate to production main, verify provenance, canary smoke, and enable telemetry',
      priority: 'P0',
      prerequisites: ['REMOTE_STAGING_VERIFIED'],
      authority_class: 'AUTONOMOUS_RECONCILIATION',
      environment: 'PRODUCTION',
      writable_paths: ['.flycheap/*', 'scripts/*'],
      forbidden_actions: [
        'DO_NOT_MUTATE_DEPLOYABLE_SURFACE',
        'DO_NOT_REWRITE_HISTORY'
      ],
      idempotency_key: 'IDEMP-WO-PROD-PROMOTION-001',
      expected_observable: 'Production verified with active canary and empirical telemetry operating',
      proof_obligation: 'PO-PROD-PROMOTED',
      timeout_seconds: 300,
      retry_policy: 'EXPONENTIAL_BACKOFF',
      compensation_rollback: 'Revert git promotion branch',
      cleanup_finalizers: [],
      expected_state_effect: 'Transition to PRODUCTION_VERIFIED',
      is_blocked_external: false,
      blocking_action_ref: null
    };
  }

  return {
    work_order_id: 'WO-IDLE',
    current_observed_state: authority.authority_state,
    target_delta: 'None',
    priority: 'LOW',
    is_blocked_external: false
  };
}

if (process.argv[1] && process.argv[1].endsWith('work-order-compiler.mjs')) {
  const result = compileNextWorkOrder();
  console.log(JSON.stringify(result, null, 2));
}
