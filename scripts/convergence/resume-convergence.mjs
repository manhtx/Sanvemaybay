#!/usr/bin/env node
/**
 * Explicit, checkpoint-preserving resume for the continuous convergence loop.
 *
 * A STOP_PERPETUAL_LOOP file is an emergency/manual stop, not a permanent
 * state transition. Resuming must be an explicit operation so an ordinary
 * chat message cannot accidentally re-arm the loop.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = fs.existsSync(path.join(process.cwd(), 'package.json'))
  ? process.cwd()
  : path.resolve(__dirname, '../..');
const STATE_DIR = path.join(ROOT_DIR, 'docs/convergence/state');
const STATE_FILE = path.join(STATE_DIR, 'loop_state.json');
const STOP_SIGNAL_FILE = path.join(STATE_DIR, 'STOP_PERPETUAL_LOOP');

function atomicWriteJson(filePath, value) {
  const tempPath = `${filePath}.resume-${process.pid}-${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(tempPath, filePath);
}

function readState() {
  if (!fs.existsSync(STATE_FILE)) {
    throw new Error(`Missing durable loop state: ${STATE_FILE}`);
  }

  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid durable loop state: ${error.message}`);
  }
}

function activeStatusFor(state) {
  if (state.currentStage === 'RESEARCH_R10') return 'IN_RESEARCH_5X';
  if (state.currentStage === 'MASTER_GOAL_G11') return 'IN_MASTER_GOAL_5X';
  if (state.currentStage === 'EXECUTION') return 'EXECUTING_GOAL';
  throw new Error(`Cannot resume unknown stage: ${state.currentStage || 'UNKNOWN'}`);
}

const reasonIndex = process.argv.indexOf('--reason');
const reason = reasonIndex >= 0 && process.argv[reasonIndex + 1]
  ? process.argv[reasonIndex + 1]
  : 'Explicit user-approved convergence resume';

const state = readState();
const resumableStatuses = new Set(['PAUSED_FOR_USER_AUDIT', 'PAUSED', 'STOPPED']);
if (!resumableStatuses.has(state.status)) {
  throw new Error(`Resume refused for state ${state.status || 'UNKNOWN'}; no pause handshake is present.`);
}

const nextStatus = activeStatusFor(state);
const resumedAt = new Date().toISOString();
const nextState = {
  ...state,
  status: nextStatus,
  resumedAt,
  resumeReason: reason,
  lastUpdated: resumedAt
};

// State is written before removing the sentinel. If the process is interrupted
// before the unlink, the hooks remain safely stopped and can be resumed again.
atomicWriteJson(STATE_FILE, nextState);
if (fs.existsSync(STOP_SIGNAL_FILE)) fs.unlinkSync(STOP_SIGNAL_FILE);

console.log(JSON.stringify({
  status: 'RESUMED',
  cycleId: nextState.cycleId || null,
  currentStage: nextState.currentStage || null,
  currentPass: nextState.currentPass || null,
  nextStatus,
  stopSignalRemoved: true,
  resumedAt,
  reason
}, null, 2));
