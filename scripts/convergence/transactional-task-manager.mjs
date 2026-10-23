#!/usr/bin/env node
/**
 * FARELY TRANSACTIONAL TASK MANAGER (ACID Task Execution)
 * 
 * Provides atomicity, consistency, and durability for Goal tasks:
 * - Before editing: Takes clean git snapshot of target files.
 * - During edit: Logs transaction journal in docs/convergence/state/transaction_journal.json.
 * - On token exhaustion / crash: Verifies file syntax integrity; rolls back corrupted half-edits.
 * - On success: Commits task and advances checkpoint.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = process.cwd();
const JOURNAL_FILE = path.join(ROOT_DIR, 'docs/convergence/state/transaction_journal.json');

function run(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
  } catch (e) {
    return null;
  }
}

export function loadJournal() {
  if (fs.existsSync(JOURNAL_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(JOURNAL_FILE, 'utf8'));
    } catch {
      // Fallback
    }
  }
  return {
    active_transaction: null,
    history: [],
    last_updated: new Date().toISOString()
  };
}

export function saveJournal(journal) {
  journal.last_updated = new Date().toISOString();
  fs.writeFileSync(JOURNAL_FILE, JSON.stringify(journal, null, 2), 'utf8');
}

export function beginTask(taskId, targetFiles = []) {
  const journal = loadJournal();
  const fileSnapshots = {};

  for (const relPath of targetFiles) {
    const fullPath = path.join(ROOT_DIR, relPath);
    if (fs.existsSync(fullPath)) {
      fileSnapshots[relPath] = fs.readFileSync(fullPath, 'utf8');
    } else {
      fileSnapshots[relPath] = null; // New file to be created
    }
  }

  journal.active_transaction = {
    task_id: taskId,
    started_at: new Date().toISOString(),
    status: 'IN_PROGRESS',
    target_files: targetFiles,
    snapshots: fileSnapshots,
    git_head: run('git rev-parse HEAD')
  };

  saveJournal(journal);
  return journal.active_transaction;
}

export function commitTask(taskId, verificationOutput = '') {
  const journal = loadJournal();
  if (journal.active_transaction && journal.active_transaction.task_id === taskId) {
    journal.active_transaction.status = 'COMMITTED';
    journal.active_transaction.committed_at = new Date().toISOString();
    journal.active_transaction.verification_output = verificationOutput.slice(0, 500);
    journal.history.push(journal.active_transaction);
    journal.active_transaction = null;
    saveJournal(journal);
    return true;
  }
  return false;
}

export function sanitizeAndRecoverTask() {
  const journal = loadJournal();
  const tx = journal.active_transaction;

  if (!tx || tx.status !== 'IN_PROGRESS') {
    return { status: 'CLEAN', note: 'No corrupted or interrupted task in progress.' };
  }

  // Verify target files for corruption / syntax errors
  let hasSyntaxErrors = false;
  const rollbackDetails = [];

  for (const relPath of tx.target_files || []) {
    const fullPath = path.join(ROOT_DIR, relPath);
    if (!fs.existsSync(fullPath)) continue;

    // Run quick syntax check if TypeScript or JavaScript
    if (relPath.endsWith('.ts') || relPath.endsWith('.js') || relPath.endsWith('.mjs')) {
      const checkResult = run(`node --check ${relPath}`);
      if (checkResult === null) {
        hasSyntaxErrors = true;
        rollbackDetails.push(`Syntax error detected in half-written file: ${relPath}`);
      }
    }
  }

  if (hasSyntaxErrors) {
    // Restore file snapshots to clean state before the crash
    for (const [relPath, originalContent] of Object.entries(tx.snapshots || {})) {
      const fullPath = path.join(ROOT_DIR, relPath);
      if (originalContent === null) {
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      } else {
        fs.writeFileSync(fullPath, originalContent, 'utf8');
      }
    }

    tx.status = 'ROLLED_BACK_FOR_RESUME';
    tx.rolled_back_at = new Date().toISOString();
    saveJournal(journal);

    return {
      status: 'RECOVERED_TO_CLEAN_SLATE',
      task_id: tx.task_id,
      restored_files: Object.keys(tx.snapshots || {}),
      reason: 'Half-written files had syntax errors due to token exhaustion. Restored to pre-task clean state for clean resumption.'
    };
  }

  return {
    status: 'RESUMABLE_AS_IS',
    task_id: tx.task_id,
    target_files: tx.target_files,
    reason: 'Files are syntactically intact. Ready for immediate completion.'
  };
}

// CLI handler
if (process.argv[1] && process.argv[1].endsWith('transactional-task-manager.mjs')) {
  const cmd = process.argv[2] || 'status';
  if (cmd === 'status') {
    console.log(JSON.stringify(loadJournal(), null, 2));
  } else if (cmd === 'recover') {
    console.log(JSON.stringify(sanitizeAndRecoverTask(), null, 2));
  } else if (cmd === 'begin') {
    const taskId = process.argv[3];
    const targetFiles = process.argv.slice(4);
    if (!taskId) {
      console.error('Usage: node transactional-task-manager.mjs begin <task_id> [files...]');
      process.exit(1);
    }
    const tx = beginTask(taskId, targetFiles);
    console.log(JSON.stringify({ status: 'TRANSACTION_STARTED', tx }, null, 2));
  } else if (cmd === 'commit') {
    const taskId = process.argv[3];
    const verifCmd = process.argv.slice(4).join(' ') || 'Manual verify';
    if (!taskId) {
      console.error('Usage: node transactional-task-manager.mjs commit <task_id> [verification_cmd]');
      process.exit(1);
    }
    const success = commitTask(taskId, verifCmd);
    console.log(JSON.stringify({ status: success ? 'TRANSACTION_COMMITTED' : 'COMMIT_FAILED', taskId }, null, 2));
  }
}
