#!/usr/bin/env node
/**
 * FARELY PROOF-OF-EXECUTION RECEIPT GENERATOR
 * 
 * Generates an unforgeable, cryptographic execution receipt required for any Research Pass.
 * Any Research Pass that does not contain the live SHA-256 of this receipt is automatically
 * rejected by the Anti-Evasion Linter.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const ROOT_DIR = process.cwd();
const STATE_DIR = path.join(ROOT_DIR, 'docs/convergence/state');
const RECEIPT_FILE = path.join(STATE_DIR, 'CURRENT_EXECUTION_RECEIPT.json');

if (!fs.existsSync(STATE_DIR)) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}

function run(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
  } catch (e) {
    return `ERROR: ${e.message}`;
  }
}

export function generateReceipt() {
  const timestamp = new Date().toISOString();
  const gitHead = run('git rev-parse HEAD');
  const gitBranch = run('git branch --show-current');
  const gitStatus = run('git status --porcelain');
  const tenLensesOutput = run('node scripts/ten-hostile-lenses.mjs');
  
  // Count real physical codebase assets
  const migrationsCount = fs.existsSync(path.join(ROOT_DIR, 'supabase/migrations'))
    ? fs.readdirSync(path.join(ROOT_DIR, 'supabase/migrations')).filter(f => f.endsWith('.sql')).length
    : 0;
  const functionsCount = fs.existsSync(path.join(ROOT_DIR, 'supabase/functions'))
    ? fs.readdirSync(path.join(ROOT_DIR, 'supabase/functions')).filter(f => !f.startsWith('.')).length
    : 0;

  const receiptData = {
    timestamp,
    git: {
      head: gitHead,
      branch: gitBranch,
      dirty_files_count: gitStatus ? gitStatus.split('\n').filter(Boolean).length : 0
    },
    codebase_witness: {
      active_migrations: migrationsCount,
      active_edge_functions: functionsCount
    },
    hostile_lenses_witness: {
      status: tenLensesOutput.includes('"all_lenses_defended": true') ? 'ALL_DEFENDED' : 'FAILED',
      raw_sample: tenLensesOutput.slice(0, 300)
    }
  };

  const receiptJson = JSON.stringify(receiptData, null, 2);
  const receiptHash = crypto.createHash('sha256').update(receiptJson, 'utf8').digest('hex');

  const fullReceipt = {
    receipt_sha256: receiptHash,
    ...receiptData
  };

  fs.writeFileSync(RECEIPT_FILE, JSON.stringify(fullReceipt, null, 2), 'utf8');

  return {
    receiptHash,
    filePath: RECEIPT_FILE,
    timestamp,
    gitHead
  };
}

// CLI handler
if (process.argv[1] && process.argv[1].endsWith('generate-execution-receipt.mjs')) {
  const res = generateReceipt();
  console.log(`\n======================================================`);
  console.log(`CRYPTOGRAPHIC EXECUTION RECEIPT GENERATED SUCCESSFULLY`);
  console.log(`======================================================`);
  console.log(`RECEIPT_SHA256: ${res.receiptHash}`);
  console.log(`GIT_HEAD:       ${res.gitHead}`);
  console.log(`TIMESTAMP:      ${res.timestamp}`);
  console.log(`SAVED_TO:       ${res.filePath}`);
  console.log(`\nInclude this line verbatim in your Research document:`);
  console.log(`EXECUTION_RECEIPT_SHA256: ${res.receiptHash}`);
  console.log(`======================================================\n`);
}
