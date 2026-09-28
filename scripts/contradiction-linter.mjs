import fs from 'node:fs';
import path from 'node:path';

export function runContradictionLinter(rootDir = process.cwd()) {
  const issues = [];
  const warnings = [];

  function loadJson(rel) {
    const full = path.join(rootDir, rel);
    if (!fs.existsSync(full)) {
      issues.push(`Missing required artifact: ${rel}`);
      return null;
    }
    try {
      return JSON.parse(fs.readFileSync(full, 'utf8'));
    } catch (e) {
      issues.push(`Malformed JSON in ${rel}: ${e.message}`);
      return null;
    }
  }

  const state = loadJson('.flycheap/STATE.json');
  const releaseIndex = loadJson('.flycheap/RELEASE_INDEX.json');
  const missionEpoch = loadJson('.flycheap/MISSION_EPOCH.json');
  const rcRegistry = loadJson('.flycheap/RC_REGISTRY.json');
  const handoff = loadJson('.flycheap/HUMAN_HANDOFF.json');
  const deployableSurface = loadJson('.flycheap/DEPLOYABLE_SURFACE.json');

  if (!state || !releaseIndex || !missionEpoch || !rcRegistry || !handoff || !deployableSurface) {
    return { ok: false, issues, warnings };
  }

  const activeEpoch = state.mission_epoch_id;
  if (!activeEpoch) {
    issues.push('STATE.json missing mission_epoch_id');
  }

  // 1. Epoch consistency across active artifacts
  if (releaseIndex.mission_epoch_id !== activeEpoch) {
    issues.push(`RELEASE_INDEX.json epoch mismatch: expected ${activeEpoch}, got ${releaseIndex.mission_epoch_id}`);
  }
  if (missionEpoch.mission_epoch_id !== activeEpoch) {
    issues.push(`MISSION_EPOCH.json epoch mismatch: expected ${activeEpoch}, got ${missionEpoch.mission_epoch_id}`);
  }
  if (handoff.mission_epoch_id !== activeEpoch) {
    issues.push(`HUMAN_HANDOFF.json epoch mismatch: expected ${activeEpoch}, got ${handoff.mission_epoch_id}`);
  }

  // 2. RC registry integrity: exactly one active candidate
  const activeCandidates = (rcRegistry.immutable_candidates || []).filter(c => c.status === 'ACTIVE');
  if (activeCandidates.length !== 1) {
    issues.push(`Expected exactly 1 ACTIVE release candidate in RC_REGISTRY.json, found ${activeCandidates.length}`);
  } else {
    const activeRC = activeCandidates[0];
    if (activeRC.rc_id !== state.current_source_rc) {
      issues.push(`RC mismatch: STATE.json has ${state.current_source_rc}, RC_REGISTRY has ${activeRC.rc_id}`);
    }
    if (activeRC.candidate_git_sha !== state.quad_identity?.source_rc_sha) {
      issues.push(`SHA mismatch: STATE.quad_identity.source_rc_sha ${state.quad_identity?.source_rc_sha} != RC_REGISTRY ${activeRC.candidate_git_sha}`);
    }
    if (activeRC.deployable_surface_hash !== deployableSurface.deployable_surface_hash) {
      issues.push(`Deployable surface hash mismatch: RC_REGISTRY ${activeRC.deployable_surface_hash} != DEPLOYABLE_SURFACE.json ${deployableSurface.deployable_surface_hash}`);
    }
    if (state.quad_identity?.deployable_surface_hash !== deployableSurface.deployable_surface_hash) {
      issues.push(`Deployable surface hash mismatch: STATE ${state.quad_identity?.deployable_surface_hash} != DEPLOYABLE_SURFACE.json ${deployableSurface.deployable_surface_hash}`);
    }
  }

  // 3. Authority state consistency
  if (handoff.system_authority_state !== state.system_state) {
    issues.push(`System authority state mismatch: STATE has ${state.system_state}, HUMAN_HANDOFF has ${handoff.system_authority_state}`);
  }

  // 4. Minimal immediate blocker law (Section 51 & 52)
  const immediateActions = handoff.batched_external_actions || [];
  const nonStagingHardBlockers = immediateActions.filter(a => a.category !== 'INFRASTRUCTURE_QUOTA' && a.action_id !== 'ACT-STAGING-01' && a.is_hard_blocker_for_mode_1 === true);
  if (nonStagingHardBlockers.length > 0) {
    issues.push(`Violation of minimal handoff law (Section 51): Found non-staging hard blockers in immediate actions: ${nonStagingHardBlockers.map(b => b.action_id).join(', ')}`);
  }

  // 5. Test metrics consistency
  if (handoff.verification_metrics) {
    const vm = handoff.verification_metrics;
    if (vm.total_automated_tests !== 208) {
      issues.push(`Test total mismatch in HUMAN_HANDOFF: expected 208 (88 vitest + 43 node + 45 deno + 32 playwright), got ${vm.total_automated_tests}`);
    }
    if (vm.vitest_domain_unit !== 88) {
      issues.push(`Vitest count mismatch: expected 88, got ${vm.vitest_domain_unit}`);
    }
    if (vm.node_contracts !== 43) {
      issues.push(`Node contract count mismatch: expected 43, got ${vm.node_contracts}`);
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    warnings,
    summary: {
      active_epoch: activeEpoch,
      active_rc: state.current_source_rc,
      system_authority_state: state.system_state,
      deployable_surface_hash: deployableSurface.deployable_surface_hash,
      tests_reconciled: 208,
      immediate_blocker: state.immediate_hard_blocker
    }
  };
}

if (process.argv[1] && process.argv[1].endsWith('contradiction-linter.mjs')) {
  const result = runContradictionLinter();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) {
    console.error(`Contradiction Linter found ${result.issues.length} issue(s).`);
    process.exit(1);
  } else {
    console.log('Contradiction Linter: ZERO CONTRADICTIONS DETECTED.');
  }
}
