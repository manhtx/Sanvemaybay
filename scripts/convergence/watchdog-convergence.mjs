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
import { auditPassAgainstEvasion } from './anti-evasion-linter.mjs';

const ROOT_DIR = process.cwd();
const STATE_DIR = path.join(ROOT_DIR, 'docs/convergence/state');
const RECEIPT_FILE = path.join(STATE_DIR, 'CURRENT_EXECUTION_RECEIPT.json');

function run(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
  } catch {
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
  let recommendedCommand = '';
  switch (state.status) {
    case 'INITIALIZED':
      nextAction = 'Execute Pass R1 of Research R10 across all 12 Adversarial Lenses.';
      recommendedCommand = 'npm run convergence:scaffold R 1 -- --write';
      break;
    case 'IN_RESEARCH_5X': {
      nextAction = `Execute pending Pass ${state.currentPass} of Research R10.`;
      const rNum = (state.currentPass || 'R1').replace('R', '');
      recommendedCommand = `npm run convergence:scaffold R ${rNum} -- --write`;
      break;
    }
    case 'RESEARCH_COMPLETED_PENDING_COMPILER':
      nextAction = 'Execute Pass G1 of Master Goal Compiler G11 with Solution Cage Protocol.';
      recommendedCommand = 'npm run convergence:scaffold G 1 -- --write';
      break;
    case 'IN_MASTER_GOAL_5X': {
      nextAction = `Execute pending Pass ${state.currentPass} of Master Goal Compiler G11.`;
      const gNum = (state.currentPass || 'G1').replace('G', '');
      recommendedCommand = `npm run convergence:scaffold G ${gNum} -- --write`;
      break;
    }
    case 'MASTER_GOAL_PROMPT_READY':
      nextAction = 'Pump canonical G5 prompt to chat canvas and begin Goal execution.';
      recommendedCommand = 'npm run convergence:prompt';
      break;
    case 'EXECUTING_GOAL':
      nextAction = `Continue execution of task [${state.active_task || 'next task'}].`;
      recommendedCommand = 'node scripts/convergence/transactional-task-manager.mjs status';
      break;
    case 'GOAL_COMPLETED':
      nextAction = `Trigger 5x5 Research R10 battery for cycle [${state.cycleId}].`;
      recommendedCommand = 'npm run convergence:scaffold R 1 -- --write';
      break;
    case 'BLOCKED_BY_LINTER':
      nextAction = 'Fix linter violations cited in loop_state.json and re-run savePass.';
      recommendedCommand = 'npm run convergence:integrity';
      break;
    default:
      nextAction = 'Inspect loop_state.json and initialize state.';
      recommendedCommand = 'npm run convergence:status';
  }

  const report = {
    timestamp: new Date().toISOString(),
    cycle: state.cycleId,
    status: state.status,
    currentStage: state.currentStage,
    currentPass: state.currentPass,
    nextImperativeAction: nextAction,
    recommendedCommand,
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

export function checkPassesIntegrity() {
  const r10Dir = path.join(ROOT_DIR, 'docs/convergence/r10');
  const g11Dir = path.join(ROOT_DIR, 'docs/convergence/g11');
  
  const results = {
    research: {},
    masterGoal: {}
  };

  if (fs.existsSync(r10Dir)) {
    for (const f of fs.readdirSync(r10Dir)) {
      if (f.endsWith('.md')) {
        const full = path.join(r10Dir, f);
        const match = f.match(/R(\d+)_/);
        const passNum = match ? parseInt(match[1], 10) : 1;
        const prevFile = passNum > 1 ? path.join(r10Dir, `R${passNum - 1}_FULL_RESEARCH.md`) : null;
        results.research[f] = auditPassAgainstEvasion(full, prevFile);
      }
    }
  }

  if (fs.existsSync(g11Dir)) {
    for (const f of fs.readdirSync(g11Dir)) {
      if (f.endsWith('.md')) {
        const full = path.join(g11Dir, f);
        const match = f.match(/G(\d+)_/);
        const passNum = match ? parseInt(match[1], 10) : 1;
        const prevFile = passNum > 1 ? path.join(g11Dir, `G${passNum - 1}_FULL_MASTER_GOAL.md`) : null;
        results.masterGoal[f] = auditPassAgainstEvasion(full, prevFile);
      }
    }
  }

  return results;
}

// CLI handler
if (process.argv[1] && process.argv[1].endsWith('watchdog-convergence.mjs')) {
  const cmd = process.argv[2] || 'status';
  if (cmd === 'status') {
    const audit = runWatchdogAudit();
    console.log(JSON.stringify(audit, null, 2));
  } else if (cmd === 'integrity') {
    const integrity = checkPassesIntegrity();
    console.log(JSON.stringify(integrity, null, 2));
  } else if (cmd === 'ledger') {
    const LEDGER_FILE = path.join(STATE_DIR, '12_LENS_EVOLUTION_LEDGER.json');
    if (fs.existsSync(LEDGER_FILE)) {
      console.log(fs.readFileSync(LEDGER_FILE, 'utf8'));
    } else {
      console.log(JSON.stringify({ note: 'No passes recorded in ledger yet.' }, null, 2));
    }
  }
}
