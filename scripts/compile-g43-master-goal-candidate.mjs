/**
 * Compiles the Lossless G11 A–K Implementation Master Goal Candidate for Farely Project 10X G43.
 * Output: docs/convergence/v43/FARELY_PROJECT_10X_G43_MASTER_GOAL_CANDIDATE.md
 */

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const v43Dir = path.join(root, 'docs/convergence/v43');
const candidatePath = path.join(v43Dir, 'FARELY_PROJECT_10X_G43_MASTER_GOAL_CANDIDATE.md');

const promptSource = fs.readFileSync('/tmp/g43_prompt.md', 'utf8');

// Ensure the compiled Master Goal Candidate is self-contained, lossless, and clearly labeled
const header = `# ==============================================================================
# FARELY PROJECT 10X — G43 LOSSLESS IMPLEMENTATION MASTER GOAL CANDIDATE
# COMPILED BY G11 LOSSLESS COMPILER IN SAME TURN (2026-10-19)
# SOURCE: G11 + R10 + FARELY-XFER/6
# DELIVERY CLASS: RECOVERY_INSTRUCTION_ISSUED__MASTER_GOAL_UNFULFILLED
# RESEARCH CERTIFICATION: 0/20 (NOT_CERTIFIED)
# COMPILER CERTIFICATION: 0/20 (NOT_CERTIFIED)
# TARGET_PROVEN: FALSE (PENDING INDEPENDENT FOUNDER ACCEPTANCE & SOAK)
# ==============================================================================

`;

// Strip leading <USER_REQUEST> tags if present and format as clean standalone Markdown prompt
let cleanPrompt = promptSource;
if (cleanPrompt.startsWith('<USER_REQUEST>')) {
  cleanPrompt = cleanPrompt.replace(/^<USER_REQUEST>\s*/, '');
}
if (cleanPrompt.endsWith('</USER_REQUEST>')) {
  cleanPrompt = cleanPrompt.replace(/\s*<\/USER_REQUEST>$/, '');
}

fs.writeFileSync(candidatePath, header + cleanPrompt.trim() + '\n');
console.log(`Successfully compiled standalone G11 A-K Master Goal Candidate into: ${candidatePath}`);
