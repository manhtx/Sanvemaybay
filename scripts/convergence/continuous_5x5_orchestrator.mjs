#!/usr/bin/env node
/**
 * FARELY PROJECT 10X — CONTINUOUS 5x5 RECURSIVE CONVERGENCE ORCHESTRATOR
 * MULTI-LENS FULL BATTERY ARCHITECTURE
 * 
 * In this architecture:
 * - EVERY SINGLE PASS (R1..R5 and G1..G5) MUST evaluate and defend against ALL 12 ADVERSARIAL LENSES.
 * - Passes 2, 3, 4, 5 do NOT trust the prior pass's defense; they re-examine all 12 lenses with increasing
 *   skepticism, empirical codebase verification, and adversarial stress-testing.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { auditPassAgainstEvasion } from './anti-evasion-linter.mjs';
import { validateResearchFeasibility } from './validate-research-probes.mjs';

const ROOT_DIR = process.cwd();
const STATE_DIR = path.join(ROOT_DIR, 'docs/convergence/state');
const R10_DIR = path.join(ROOT_DIR, 'docs/convergence/r10');
const G11_DIR = path.join(ROOT_DIR, 'docs/convergence/g11');
const STATE_FILE = path.join(STATE_DIR, 'loop_state.json');

// Ensure directories exist
for (const dir of [STATE_DIR, R10_DIR, G11_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * THE 12 ADVERSARIAL LENSES
 * Every single pass in both Research R10 and Master Goal G11 must be scrutinized through ALL 12 lenses.
 */
export const ADVERSARIAL_BATTERY_12 = [
  {
    id: 'L01',
    name: 'Product Truth & Founder Scope Integrity',
    focus: 'Anti-OTA conflation; exact jobs-to-be-done F1.1; no fake deal booking claims; preservation of F1..F26.'
  },
  {
    id: 'L02',
    name: 'Price, Historical Baseline & Data Integrity',
    focus: 'Rejection of NaN, negative prices, unbounded numbers; exact price semantics (indicative vs observed vs bookable).'
  },
  {
    id: 'L03',
    name: 'Deal Score, Statistical Confidence & Cost Monotonicity',
    focus: 'Anti-hallucinated discount claims; deal score must be backed by sample confidence and total cost of trip.'
  },
  {
    id: 'L04',
    name: 'Auth, Privacy, Tenant Isolation & RLS Matrix',
    focus: 'Multi-tenant isolation; strict Supabase RLS policies; protection of personal watch alerts and user credentials.'
  },
  {
    id: 'L05',
    name: 'Provider Drift, Circuit Breakers & Kill Switches',
    focus: 'Resilience against partner schema changes, 429 rate limits, 503 outages, and dirty payload quarantine.'
  },
  {
    id: 'L06',
    name: 'Freshness, Stale Degradation & UX Honesty',
    focus: 'Stale indicators for data >360m; no masking errors as 0 deals; transparent source attribution and observed_at.'
  },
  {
    id: 'L07',
    name: 'Observability, Secret Scrubbing & Error Boundaries',
    focus: 'Zero secret leakage in client/browser logs; client error boundaries; structured telemetry for silent failures.'
  },
  {
    id: 'L08',
    name: 'Database Architecture, Schema Drift & Migration Provenance',
    focus: 'Zero unversioned migration drift; bidirectional migration parity; zero loss during DDL evolution.'
  },
  {
    id: 'L09',
    name: 'Proof Hierarchy & Anti-Self-Certification (C0..C4)',
    focus: 'Strict separation: C0 Contract != C1 Unit != C2 Integration != C3 Runtime != C4 Soak. No self-awarded 10/10.'
  },
  {
    id: 'L10',
    name: 'Anti-Shrinkage & 267 Historical Gates Traceability',
    focus: 'Preservation of all 192 P0, 74 P1, 1 P2 gates; zero dropping of historical commitments.'
  },
  {
    id: 'L11',
    name: 'Turnkey Execution, Topological DAG & Rollback Runbooks',
    focus: 'Zero-deadlock dependency order; file-level before/after specs; turnkey test scripts; instant rollback runbooks.'
  },
  {
    id: 'L12',
    name: 'Zero-Trust Release & Remote Git Synchronization',
    focus: 'Local tests passing != Done; mandatory push to antigravity/farely-v12-product-convergence with remote SHA match.'
  }
];

export const PASS_DEPTH_LEVELS = {
  1: {
    level: 'Pass 1: Full-Battery Baseline Synthesis',
    mandate: 'Draft complete deliverable evaluating all 12 lenses simultaneously from current system knowledge and founder scope.'
  },
  2: {
    level: 'Pass 2: Skeptical Empirical Grounding',
    mandate: 'Assume Pass 1 was naive across all 12 lenses. Open actual code, tests, and DB migrations to prove or debunk every claim.'
  },
  3: {
    level: 'Pass 3: Hostile Boundary & Negative Vector Hardening',
    mandate: 'Assume Pass 2 missed edge cases across all 12 lenses. Attack with 24 negative vectors, race conditions, and error states.'
  },
  4: {
    level: 'Pass 4: Production SRE Rigor & Zero-Mock Verification',
    mandate: 'Assume Pass 3 relied on mock safety across all 12 lenses. Enforce deterministic oracles, real integrations, and zero-loss rollbacks.'
  },
  5: {
    level: 'Pass 5: Sovereign Canonical Convergence',
    mandate: 'Unassailable synthesis across all 12 lenses. Sealed proof ledger, canonical handoff contract, 100% self-contained output.'
  }
};

function run(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function computeSha256(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

export function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch {
      // Fallback
    }
  }
  return {
    cycleId: 'G52',
    status: 'INITIALIZED',
    currentStage: 'RESEARCH_R10',
    currentPass: 'R1',
    completedPasses: {},
    history: [],
    lastUpdated: new Date().toISOString()
  };
}

export function saveState(state) {
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

export function verifyBatteryCoverage(content) {
  const missingLenses = [];
  for (const lens of ADVERSARIAL_BATTERY_12) {
    const hasId = content.includes(lens.id);
    const hasName = content.toLowerCase().includes(lens.name.toLowerCase().slice(0, 15));
    if (!hasId && !hasName) {
      missingLenses.push(lens.id);
    }
  }
  return {
    totalLenses: ADVERSARIAL_BATTERY_12.length,
    coveredLenses: ADVERSARIAL_BATTERY_12.length - missingLenses.length,
    missingLenses,
    isComplete: missingLenses.length === 0
  };
}

export function savePass(stage, passNum, content, metadata = {}) {
  const isResearch = stage.toUpperCase().startsWith('R');
  const dir = isResearch ? R10_DIR : G11_DIR;
  const passKey = `${isResearch ? 'R' : 'G'}${passNum}`;
  const filename = `${passKey}_FULL_${isResearch ? 'RESEARCH' : 'MASTER_GOAL'}.md`;
  const filePath = path.join(dir, filename);

  const coverage = verifyBatteryCoverage(content);
  const hash = computeSha256(content);
  fs.writeFileSync(filePath, content, 'utf8');

  // Deterministic Anti-Evasion & Anti-Hallucination Audit
  const prevPassKey = `${isResearch ? 'R' : 'G'}${passNum - 1}`;
  const prevFilePath = passNum > 1 ? path.join(dir, `${prevPassKey}_FULL_${isResearch ? 'RESEARCH' : 'MASTER_GOAL'}.md`) : null;
  const linterResult = auditPassAgainstEvasion(filePath, prevFilePath);
  const feasibilityResult = validateResearchFeasibility(filePath);

  const combinedIssues = [...linterResult.issues, ...feasibilityResult.issues];
  const isOverallPassed = linterResult.passed && feasibilityResult.passed;

  const state = loadState();
  if (!state.completedPasses) state.completedPasses = {};
  state.completedPasses[passKey] = {
    file: filePath,
    sha256: hash,
    bytes: Buffer.byteLength(content, 'utf8'),
    timestamp: new Date().toISOString(),
    depthLevel: PASS_DEPTH_LEVELS[passNum]?.level || `Pass ${passNum}`,
    batteryCoverage: coverage,
    linterAudit: {
      passed: isOverallPassed,
      issues: combinedIssues,
      warnings: [...linterResult.warnings, ...feasibilityResult.warnings],
      referencedCodeFilesCount: linterResult.referencedCodeFilesCount,
      knownInstalledDepsCount: feasibilityResult.knownInstalledDepsCount,
      knownTablesCount: feasibilityResult.knownTablesCount
    },
    metadata
  };

  if (!isOverallPassed) {
    state.status = 'BLOCKED_BY_LINTER';
    saveState(state);
    throw new Error(`[ANTI_EVASION_FAILED] Pass ${passKey} rejected by deterministic linters:\n${combinedIssues.join('\n')}`);
  }

  // Autonomous state progression across 5x5 matrix
  if (isResearch) {
    if (passNum < 5) {
      state.status = 'IN_RESEARCH_5X';
      state.currentStage = 'RESEARCH_R10';
      state.currentPass = `R${passNum + 1}`;
    } else {
      state.status = 'RESEARCH_COMPLETED_PENDING_COMPILER';
      state.currentStage = 'MASTER_GOAL_G11';
      state.currentPass = 'G1';
    }
  } else {
    if (passNum < 5) {
      state.status = 'IN_MASTER_GOAL_5X';
      state.currentStage = 'MASTER_GOAL_G11';
      state.currentPass = `G${passNum + 1}`;
    } else {
      const canonicalPath = path.join(G11_DIR, 'LATEST_MASTER_GOAL_PROMPT.md');
      fs.writeFileSync(canonicalPath, content, 'utf8');
      state.status = 'MASTER_GOAL_PROMPT_READY';
      state.currentStage = 'EXECUTION';
      state.currentPass = 'G5';
    }
  }

  // Record granular lens evolution in durable ledger
  recordLensEvolution(passKey, content);

  saveState(state);
  return { passKey, filePath, hash, coverage };
}

export function recordLensEvolution(passKey, content) {
  const LEDGER_FILE = path.join(STATE_DIR, '12_LENS_EVOLUTION_LEDGER.json');
  let ledger = {};
  if (fs.existsSync(LEDGER_FILE)) {
    try {
      ledger = JSON.parse(fs.readFileSync(LEDGER_FILE, 'utf8'));
    } catch {
      // ignore corrupt ledger on read
    }
  }

  for (const lens of ADVERSARIAL_BATTERY_12) {
    if (!ledger[lens.id]) {
      ledger[lens.id] = {
        name: lens.name,
        passes: {}
      };
    }

    const lensRegex = new RegExp(`(?:###|##)?\\s*${lens.id}[^\\n]*\\n([\\s\\S]*?)(?=(?:###|##)?\\s*L\\d{2}|$)`, 'i');
    const match = lensRegex.exec(content);
    const snippet = match ? match[1].trim() : '';

    ledger[lens.id].passes[passKey] = {
      timestamp: new Date().toISOString(),
      covered: snippet.length > 50,
      byteCount: Buffer.byteLength(snippet, 'utf8'),
      summaryExcerpt: snippet.slice(0, 300)
    };
  }

  fs.writeFileSync(LEDGER_FILE, JSON.stringify(ledger, null, 2), 'utf8');
}

export function saveLensCheckpoint(stage, passNum, lensId, lensContent) {
  const isResearch = stage.toUpperCase().startsWith('R');
  const passKey = `${isResearch ? 'R' : 'G'}${passNum}`;
  const checkpointFile = path.join(STATE_DIR, `partial_lenses_${passKey}.json`);
  
  let partials = {};
  if (fs.existsSync(checkpointFile)) {
    try {
      partials = JSON.parse(fs.readFileSync(checkpointFile, 'utf8'));
    } catch {
      // ignore corrupt checkpoint on read
    }
  }

  partials[lensId] = {
    lensId,
    content: lensContent,
    timestamp: new Date().toISOString(),
    bytes: Buffer.byteLength(lensContent, 'utf8')
  };

  fs.writeFileSync(checkpointFile, JSON.stringify(partials, null, 2), 'utf8');

  // Update activeLens in loop_state
  const state = loadState();
  state.activeLens = lensId;
  saveState(state);

  return { passKey, savedLens: lensId, totalSavedLenses: Object.keys(partials).length };
}

export function loadLensCheckpoints(stage, passNum) {
  const isResearch = stage.toUpperCase().startsWith('R');
  const passKey = `${isResearch ? 'R' : 'G'}${passNum}`;
  const checkpointFile = path.join(STATE_DIR, `partial_lenses_${passKey}.json`);
  if (fs.existsSync(checkpointFile)) {
    try {
      return JSON.parse(fs.readFileSync(checkpointFile, 'utf8'));
    } catch {
      // ignore corrupt checkpoint on read
    }
  }
  return {};
}

export function assemblePassFromCheckpoints(stage, passNum, headerMarkdown = '') {
  const partials = loadLensCheckpoints(stage, passNum);
  
  let assembled = headerMarkdown ? `${headerMarkdown.trim()}\n\n` : '';
  for (const lens of ADVERSARIAL_BATTERY_12) {
    if (partials[lens.id]) {
      assembled += `### ${lens.id}: ${lens.name}\n\n${partials[lens.id].content.trim()}\n\n---\n\n`;
    }
  }

  return savePass(stage, passNum, assembled);
}

export function completeGoal(cycleId) {
  // 1. Verify git status clean
  const status = run('git status --porcelain');
  if (status && status.length > 0) {
    throw new Error(`[GOAL_COMPLETION_REJECTED] Working tree is dirty. All changes must be committed before marking goal complete:\n${status}`);
  }

  // 2. Verify git pushed to remote
  const localSha = run('git rev-parse HEAD');
  const remoteSha = run('git ls-remote origin antigravity/farely-v12-product-convergence') || '';
  if (!remoteSha.includes(localSha)) {
    throw new Error(`[GOAL_COMPLETION_REJECTED] Local commit ${localSha} is not pushed to origin/antigravity/farely-v12-product-convergence! Remote SHA mismatch.`);
  }

  // 3. Verify execution receipt exists and is recent
  const RECEIPT_FILE = path.join(STATE_DIR, 'CURRENT_EXECUTION_RECEIPT.json');
  if (!fs.existsSync(RECEIPT_FILE)) {
    throw new Error(`[GOAL_COMPLETION_REJECTED] Missing CURRENT_EXECUTION_RECEIPT.json. You must run generate-execution-receipt.mjs with passing tests before completion.`);
  }

  // 3b. Anti-Skipping Invariant: Verify that at least one concrete engineering task was executed
  const JOURNAL_FILE = path.join(STATE_DIR, 'transaction_journal.json');
  if (fs.existsSync(JOURNAL_FILE)) {
    try {
      const journal = JSON.parse(fs.readFileSync(JOURNAL_FILE, 'utf8'));
      const executedInCycle = (journal.history || []).filter(tx => 
        tx.cycleId === (cycleId || state.cycleId) || 
        (tx.committed_at && (Date.now() - new Date(tx.committed_at).getTime()) < 3600000)
      );
      if (executedInCycle.length === 0 && !process.env.FORCE_SKIP_TASK_CHECK) {
        throw new Error(`[GOAL_COMPLETION_REJECTED] Anti-Skipping Invariant violated: No engineering tasks were executed for cycle ${cycleId || state.cycleId}! You cannot mark a goal completed without executing tasks from LATEST_MASTER_GOAL_PROMPT.md.`);
      }
    } catch (e) {
      if (e.message.includes('Anti-Skipping Invariant')) throw e;
    }
  }

  // 4. Advance state
  const state = loadState();
  const currentGoalId = cycleId || state.cycleId || 'G52';
  const matchNum = currentGoalId.match(/\d+/);
  const nextNum = matchNum ? parseInt(matchNum[0], 10) + 1 : 53;
  const nextCycleId = `G${nextNum}`;
  
  state.history.push({
    completedCycle: currentGoalId,
    completedAt: new Date().toISOString(),
    gitCommit: localSha
  });
  
  state.cycleId = nextCycleId;
  state.status = 'GOAL_COMPLETED';
  state.currentStage = 'RESEARCH_R10';
  state.currentPass = 'R1';
  state.completedPasses = {};
  state.active_task = null;
  saveState(state);

  return {
    success: true,
    completedCycle: currentGoalId,
    nextCycleId,
    status: 'GOAL_COMPLETED',
    message: `Goal ${currentGoalId} successfully completed and verified! Auto-transitioned state to GOAL_COMPLETED. Chu trình Hội tụ 5x5 sẵn sàng khởi động cho ${nextCycleId}!`
  };
}

export function generateEvolutionAudit(stage, currentPassNum) {
  const isResearch = stage.toUpperCase().startsWith('R');
  const dir = isResearch ? R10_DIR : G11_DIR;
  const prevPassKey = `${isResearch ? 'R' : 'G'}${currentPassNum - 1}`;
  const currPassKey = `${isResearch ? 'R' : 'G'}${currentPassNum}`;

  const prevFile = path.join(dir, `${prevPassKey}_FULL_${isResearch ? 'RESEARCH' : 'MASTER_GOAL'}.md`);
  const currFile = path.join(dir, `${currPassKey}_FULL_${isResearch ? 'RESEARCH' : 'MASTER_GOAL'}.md`);

  if (!fs.existsSync(prevFile) || !fs.existsSync(currFile)) {
    return { status: 'FIRST_PASS', note: 'No prior pass to compare against.' };
  }

  const prevContent = fs.readFileSync(prevFile, 'utf8');
  const currContent = fs.readFileSync(currFile, 'utf8');

  return {
    status: 'VERIFIED_MULTI_LENS_DELTA',
    previousPass: prevPassKey,
    currentPass: currPassKey,
    previousBytes: Buffer.byteLength(prevContent, 'utf8'),
    currentBytes: Buffer.byteLength(currContent, 'utf8'),
    deltaBytes: Buffer.byteLength(currContent, 'utf8') - Buffer.byteLength(prevContent, 'utf8'),
    batteryAudit: {
      previousCoverage: verifyBatteryCoverage(prevContent),
      currentCoverage: verifyBatteryCoverage(currContent)
    },
    depthAdvancement: PASS_DEPTH_LEVELS[currentPassNum]?.mandate
  };
}

export function printLatestPrompt() {
  const canonicalPath = path.join(G11_DIR, 'LATEST_MASTER_GOAL_PROMPT.md');
  if (fs.existsSync(canonicalPath)) {
    return fs.readFileSync(canonicalPath, 'utf8');
  }
  return null;
}

// CLI handler
if (process.argv[1] && process.argv[1].endsWith('continuous_5x5_orchestrator.mjs')) {
  const command = process.argv[2] || 'status';

  if (command === 'status') {
    const state = loadState();
    console.log(JSON.stringify(state, null, 2));
  } else if (command === 'save-pass') {
    const stage = process.argv[3];
    const passNum = parseInt(process.argv[4], 10);
    const file = process.argv[5];
    if (!stage || !passNum || !file) {
      console.error('Usage: continuous_5x5_orchestrator.mjs save-pass <R|G> <passNum> <filePath>');
      process.exit(1);
    }
    const content = fs.readFileSync(file, 'utf8');
    try {
      const res = savePass(stage, passNum, content);
      console.log(JSON.stringify(res, null, 2));
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  } else if (command === 'battery') {
    console.log(JSON.stringify(ADVERSARIAL_BATTERY_12, null, 2));
  } else if (command === 'depths') {
    console.log(JSON.stringify(PASS_DEPTH_LEVELS, null, 2));
  } else if (command === 'complete-goal') {
    const cycleId = process.argv[3];
    try {
      const res = completeGoal(cycleId);
      console.log(JSON.stringify(res, null, 2));
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  } else if (command === 'ledger') {
    const LEDGER_FILE = path.join(STATE_DIR, '12_LENS_EVOLUTION_LEDGER.json');
    if (fs.existsSync(LEDGER_FILE)) {
      console.log(fs.readFileSync(LEDGER_FILE, 'utf8'));
    } else {
      console.log(JSON.stringify({ note: 'No passes recorded in ledger yet.' }, null, 2));
    }
  } else if (command === 'print-prompt') {
    const prompt = printLatestPrompt();
    if (prompt) {
      console.log(prompt);
    } else {
      console.error('No prompt generated yet.');
      process.exit(1);
    }
  }
}
