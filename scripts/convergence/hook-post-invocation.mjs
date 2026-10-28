#!/usr/bin/env node
/**
 * FARELY POST-INVOCATION HOOK FOR PERPETUAL CONTINUATION
 * 
 * Enforces non-terminating autonomous execution across:
 * - 5-Pass Research R10
 * - 5-Pass Master Goal Compiler G11
 * - Task Execution & Test Verification
 * - Milestone Git Push & SHA Parity
 * - Automatic Cycle Advancement (G54 -> G55 -> G56 -> ...)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function getProjectRoot() {
  if (fs.existsSync(path.join(process.cwd(), 'package.json')) && fs.existsSync(path.join(process.cwd(), 'docs/convergence'))) {
    return process.cwd();
  }
  return path.resolve(__dirname, '../..');
}
const ROOT_DIR = getProjectRoot();
const STATE_FILE = path.join(ROOT_DIR, 'docs/convergence/state/loop_state.json');

// Load current loop state
let state = { status: 'IDLE' };
if (fs.existsSync(STATE_FILE)) {
  try {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    // Fallback
  }
}

// If explicit stop signal file exists, allow termination
const STOP_SIGNAL_FILE = path.join(ROOT_DIR, 'docs/convergence/state/STOP_PERPETUAL_LOOP');
if (fs.existsSync(STOP_SIGNAL_FILE)) {
  console.log(JSON.stringify({
    injectSteps: [],
    terminationBehavior: "terminate"
  }));
  process.exit(0);
}

// Only ask the host for another invocation when the durable state names a
// concrete lifecycle transition.  Returning force_continue with an empty
// injectSteps array made the UI report "still working" without scheduling any
// actual work.
const stateHasContinuation = new Set([
  'INITIALIZED',
  'IN_RESEARCH_5X',
  'RESEARCH_COMPLETED_PENDING_COMPILER',
  'IN_MASTER_GOAL_5X',
  'MASTER_GOAL_PROMPT_READY',
  'GOAL_COMPLETED'
]).has(state.status);

if (!stateHasContinuation && !state.active_task) {
  console.log(JSON.stringify({
    injectSteps: [],
    terminationBehavior: "terminate"
  }));
  process.exit(0);
}

console.log(JSON.stringify({
  injectSteps: [
    `Continue only the next concrete lifecycle action for cycle ${state.cycleId || 'ACTIVE'} (stage=${state.currentStage || 'UNKNOWN'}, pass=${state.currentPass || 'UNKNOWN'}). If no such action is available, stop and report the checkpoint.`
  ],
  terminationBehavior: "force_continue"
}));
process.exit(0);
