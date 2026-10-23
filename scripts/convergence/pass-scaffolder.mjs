#!/usr/bin/env node
/**
 * FARELY RECURSIVE PASS SCAFFOLDER & CAGE GENERATOR
 * 
 * Generates airtight, fully compliant 12-lens markdown scaffolds for every pass (R1..R5, G1..G5).
 * Embeds live pre-flight PoE receipts, falsification matrices, and Solution Cage locks.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { ADVERSARIAL_BATTERY_12, PASS_DEPTH_LEVELS } from './continuous_5x5_orchestrator.mjs';

const ROOT_DIR = process.cwd();
const R10_DIR = path.join(ROOT_DIR, 'docs/convergence/r10');
const G11_DIR = path.join(ROOT_DIR, 'docs/convergence/g11');
const STATE_DIR = path.join(ROOT_DIR, 'docs/convergence/state');
const RECEIPT_FILE = path.join(STATE_DIR, 'CURRENT_EXECUTION_RECEIPT.json');

function run(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
  } catch (e) {
    return null;
  }
}

export function scaffoldPass(stage, passNum) {
  const isResearch = stage.toUpperCase().startsWith('R');
  const dir = isResearch ? R10_DIR : G11_DIR;
  const passKey = `${isResearch ? 'R' : 'G'}${passNum}`;
  const filename = `${passKey}_FULL_${isResearch ? 'RESEARCH' : 'MASTER_GOAL'}.md`;
  const filePath = path.join(dir, filename);

  // 1. Ensure fresh Execution Receipt
  run('node scripts/convergence/generate-execution-receipt.mjs');
  let receiptSha = '0000000000000000000000000000000000000000000000000000000000000000';
  if (fs.existsSync(RECEIPT_FILE)) {
    try {
      receiptSha = JSON.parse(fs.readFileSync(RECEIPT_FILE, 'utf8')).receipt_sha256;
    } catch {}
  }

  const gitHead = run('git rev-parse HEAD');
  const timestamp = new Date().toISOString();
  const depthMandate = PASS_DEPTH_LEVELS[passNum]?.mandate || `Pass ${passNum}`;
  const depthLevel = PASS_DEPTH_LEVELS[passNum]?.level || `Pass ${passNum}`;

  let scaffold = `# FARELY PROJECT 10X — ${isResearch ? 'RESEARCH R10' : 'MASTER GOAL G11'} [${passKey}]
# LEVEL: ${depthLevel}
# MANDATE: ${depthMandate}
# GIT_COMMIT: ${gitHead}
# TIMESTAMP: ${timestamp}
# EXECUTION_RECEIPT_SHA256: ${receiptSha}

---

`;

  // 2. Falsification & Deficit Audit Section for Pass >= 2
  if (passNum >= 2) {
    const prevPassKey = `${isResearch ? 'R' : 'G'}${passNum - 1}`;
    scaffold += `## AUDIT & FALSIFICATION OF PASS ${prevPassKey}
> [!IMPORTANT]
> To eliminate sycophancy and shallow acceptance, this section actively critiques Pass ${prevPassKey} across ≥3 distinct lenses.

### Falsified Assumptions & Discovered Deficits in Pass ${prevPassKey}:
`;
    for (const lens of ADVERSARIAL_BATTERY_12) {
      scaffold += `- **[${lens.id} FALSIFICATION]** (${lens.name}):\n  - *Deficit in ${prevPassKey}*: [Detail specific weakness, naive assumption, or missing code proof in ${prevPassKey}]\n  - *Correction in ${passKey}*: [Detail the concrete empirical remedy landed in ${passKey}]\n`;
    }
    scaffold += `\n---\n\n`;
  }

  // 3. For Master Goal, embed Solution Cage bindings from R5
  if (!isResearch) {
    const r5Path = path.join(R10_DIR, 'R5_FULL_RESEARCH.md');
    let r5Solutions = [];
    if (fs.existsSync(r5Path)) {
      const r5Content = fs.readFileSync(r5Path, 'utf8');
      const solRegex = /\b(SOL-[A-Z0-9_\-]+)\b/g;
      let m;
      const seen = new Set();
      while ((m = solRegex.exec(r5Content)) !== null) {
        if (!seen.has(m[1])) {
          seen.add(m[1]);
          r5Solutions.push(m[1]);
        }
      }
    }

    scaffold += `## SECTION B: INVARIANT EXECUTOR CAGE
\`\`\`text
INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION
The executor is strictly bound to the locked technical solutions detailed in Section D & E.
The executor is FORBIDDEN from inventing new architectures, introducing alternative algorithms,
changing database schemas, or deviating from the specified file/function diffs.
Any deviation is a critical contract breach and will be rejected closed by the Evidence Admission Controller.
\`\`\`

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS
`;
    for (const sol of r5Solutions) {
      scaffold += `### ${sol}: [Solution Name]
- **SOL_ID**: ${sol}
- **TARGET_FILES**: \`src/...\`
- **LOCKED_ALGORITHM**: [Exact algorithm locked in Research R5]
- **FORBIDDEN_DEVIATIONS**: No unverified external dependencies; no signature modification.
- **VERIFICATION_COMMAND**: \`npm test\`

`;
    }
    scaffold += `\n---\n\n`;
  }

  // 4. The 12-Lens Adversarial Battery Sections
  scaffold += `## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX\n\n`;
  for (const lens of ADVERSARIAL_BATTERY_12) {
    scaffold += `### ${lens.id}: ${lens.name}
- **Focus**: ${lens.focus}
- **Physical Code Citations**: \`src/...\` or \`supabase/...\`
- **Adversarial Vector Defense**: [Defend against hostile failures, corrupt payloads, rate limits]
- **Verification Proof (C0..C4)**: [Concrete test or runtime probe proof]

---\n\n`;
  }

  return { passKey, filePath, scaffold };
}

// CLI handler
if (process.argv[1] && process.argv[1].endsWith('pass-scaffolder.mjs')) {
  const stage = process.argv[2] || 'R';
  const passNum = parseInt(process.argv[3] || '1', 10);
  const writeDisk = process.argv.includes('--write');

  const { passKey, filePath, scaffold } = scaffoldPass(stage, passNum);

  if (writeDisk) {
    fs.writeFileSync(filePath, scaffold, 'utf8');
    console.log(`[PASS_SCAFFOLDED] Successfully created template for ${passKey} at:\n${filePath}`);
  } else {
    console.log(scaffold);
  }
}
