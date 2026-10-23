#!/usr/bin/env node
/**
 * FARELY CONVERGENCE WATCHDOG & LOOP HEALTH MONITOR
 * 
 * Inspects all state files, git remote parity, and transaction journals.
 * Provides instant diagnosis and next-step execution triggers for zero-stall convergence.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { loadState } from './continuous_5x5_orchestrator.mjs';
import { loadJournal, sanitizeAndRecoverTask } from './transactional-task-manager.mjs';

const ROOT_DIR = process.cwd();
const STATE_DIR = path.join(ROOT_DIR, 'docs/convergence/state');
const RECEIPT_FILE = path.join(STATE_DIR, 'CURRENT_EXECUTION_RECEIPT.json');

function run(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
  } catch (e) {
    return null;
  }
}

export function runWatchdogAudit() {
  const state = loadState();
  const journal = loadJournal();
  const gitHead = run('git rev-parse HEAD');
  const gitBranch = run('git branch --show-current');
  const gitDirty = run('git status --porcelain') || '';
  const remoteSha = run('git ls-remote origin antigravity/farely-v12-product-convergence') || '';

  const isRemoteSynced = remoteSha.includes(gitHead);
  const isDirty = gitDirty.length > 0;

  let receiptStatus = 'MISSING';
  let receiptAgeMinutes = null;
  if (fs.existsSync(RECEIPT_FILE)) {
    try {
      const receipt = JSON.parse(fs.readFileSync(RECEIPT_FILE, 'utf8'));
      const ageMs = Date.now() - new Date(receipt.timestamp).getTime();
      receiptAgeMinutes = Math.round(ageMs / 60000);
      receiptStatus = receiptAgeMinutes <= 60 ? 'VALID_FRESH' : 'STALE_EXPIRED';
    } catch {
      receiptStatus = 'PARSE_ERROR';
    }
  }

  // Task Transaction Health
  const txRecovery = sanitizeAndRecoverTask();

  // Determine next imperative action
  let nextAction = '';
  switch (state.status) {
    case 'INITIALIZED':
      nextAction = 'Execute Pass R1 of Research R10 across all 12 Adversarial Lenses.';
      break;
    case 'IN_RESEARCH_5X':
      nextAction = `Execute pending Pass ${state.currentPass} of Research R10.`;
      break;
    case 'RESEARCH_COMPLETED_PENDING_COMPILER':
      nextAction = 'Execute Pass G1 of Master Goal Compiler G11 with Solution Cage Protocol.';
      break;
    case 'IN_MASTER_GOAL_5X':
      nextAction = `Execute pending Pass ${state.currentPass} of Master Goal Compiler G11.`;
      break;
    case 'MASTER_GOAL_PROMPT_READY':
      nextAction = 'Pump canonical G5 prompt to chat canvas and begin Goal execution.';
      break;
    case 'EXECUTING_GOAL':
      nextAction = `Continue execution of task [${state.active_task || 'next task'}].`;
      break;
    case 'GOAL_COMPLETED':
      nextAction = `Trigger 5x5 Research R10 battery for cycle [${state.cycleId}].`;
      break;
    case 'BLOCKED_BY_LINTER':
      nextAction = 'Fix linter violations cited in loop_state.json and re-run savePass.';
      break;
    default:
      nextAction = 'Inspect loop_state.json and initialize state.';
  }

  const report = {
    timestamp: new Date().toISOString(),
    cycle: state.cycleId,
    status: state.status,
    currentStage: state.currentStage,
    currentPass: state.currentPass,
    nextImperativeAction: nextAction,
    git: {
      branch: gitBranch,
      head: gitHead,
      isClean: !isDirty,
      dirtyFilesCount: isDirty ? gitDirty.split('\n').filter(Boolean).length : 0,
      isRemoteSynced
    },
    executionReceipt: {
      status: receiptStatus,
      ageMinutes: receiptAgeMinutes
    },
    transactionJournal: {
      activeTransaction: journal.active_transaction ? journal.active_transaction.task_id : null,
      recoveryStatus: txRecovery.status,
      recoveryNote: txRecovery.note || txRecovery.reason
    }
  };

  return report;
}

// CLI handler
if (process.argv[1] && process.argv[1].endsWith('watchdog-convergence.mjs')) {
  const audit = runWatchdogAudit();
  console.log(JSON.stringify(audit, null, 2));
}
