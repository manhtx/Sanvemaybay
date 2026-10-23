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

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '{}';
  }
}

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

// Otherwise, perpetually force continuation
console.log(JSON.stringify({
  injectSteps: [],
  terminationBehavior: "force_continue"
}));
process.exit(0);
