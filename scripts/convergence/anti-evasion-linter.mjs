#!/usr/bin/env node
/**
 * FARELY ANTI-EVASION & ANTI-HALLUCINATION LINTER
 * 
 * Deterministically audits research and master goal passes to prevent:
 * 1. AI Sycophancy / Self-Approval (Pass N+1 must explicitly falsify Pass N).
 * 2. Ghost / Phantom Files (No referencing nonexistent repo files without [PROPOSED_NEW]).
 * 3. Text Parroting (Verifies substantive lexical & structural expansion).
 * 4. Empty Lens Coverage (Ensures all 12 lenses have empirical evidence).
 * 5. Hand-Waving Evasion (Flags vague language without code/schema/test citations).
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();

export function auditPassAgainstEvasion(currentPassPath, previousPassPath = null) {
  const issues = [];
  const warnings = [];

  if (!fs.existsSync(currentPassPath)) {
    return { passed: false, issues: [`File not found: ${currentPassPath}`], warnings };
  }

  const content = fs.readFileSync(currentPassPath, 'utf8');
  const filename = path.basename(currentPassPath);
  const match = filename.match(/([RG])(\d+)_/);
  const passType = match ? match[1] : 'R';
  const passNum = match ? parseInt(match[2], 10) : 1;

  // 1. Mandatory Falsification & Deficit Audit for Pass >= 2
  if (passNum >= 2) {
    const falsificationKeywords = [
      'falsification',
      'deficits identified',
      'audit of pass',
      'flaws in pass',
      'false assumption',
      'debunked',
      'critique of pass',
      'điểm sai',
      'lỗ hổng',
      'phản biện pass'
    ];
    const hasFalsificationSection = falsificationKeywords.some(kw => 
      content.toLowerCase().includes(kw)
    );

    if (!hasFalsificationSection) {
      issues.push(`[EVASION_CRITICAL] Pass ${passNum} is missing a mandatory FALSIFICATION & AUDIT section that explicitly challenges and dismantles Pass ${passNum - 1}.`);
    } else {
      // Must actively critique at least 3 distinct adversarial lenses from the prior pass
      const lensIds = ['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07', 'L08', 'L09', 'L10', 'L11', 'L12'];
      const falsificationIdx = content.toLowerCase().search(/falsification|deficits identified|audit of pass|flaws in pass|phản biện pass|lỗ hổng/);
      const falsificationSnippet = falsificationIdx !== -1 ? content.slice(falsificationIdx, falsificationIdx + 3000) : '';
      const critiquedLenses = lensIds.filter(lid => falsificationSnippet.includes(lid));
      if (critiquedLenses.length < 3) {
        warnings.push(`[FALSIFICATION_SHALLOW] Falsification section in Pass ${passNum} only cites ${critiquedLenses.length} lens(es) (${critiquedLenses.join(', ')}). High-rigor passes must actively critique ≥3 lenses from the prior pass.`);
      }
    }
  }

  // 2. Phantom / Ghost File Detection (Anti-Hallucination)
  // Extracts backticked paths like `supabase/functions/...` or `src/...`
  const pathRegex = /`((?:src|supabase|scripts|docs)\/[a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)`/g;
  let m;
  const referencedPaths = new Set();
  while ((m = pathRegex.exec(content)) !== null) {
    referencedPaths.add(m[1]);
  }

  const ghostFiles = [];
  for (const refPath of referencedPaths) {
    const fullPath = path.join(ROOT_DIR, refPath);
    // If file doesn't exist, check if the context explicitly labels it as PROPOSED or NEW
    if (!fs.existsSync(fullPath)) {
      const escaped = refPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const surroundingRegex = new RegExp(`(?:\\[PROPOSED[^\\]]*\\]|create|new|migration)[^\n]{0,80}\`${escaped}\``, 'i');
      const afterRegex = new RegExp(`\`${escaped}\`[^\n]{0,80}(?:to be created|proposed|will create)`, 'i');
      if (!surroundingRegex.test(content) && !afterRegex.test(content)) {
        ghostFiles.push(refPath);
      }
    }
  }

  if (ghostFiles.length > 0) {
    issues.push(`[HALLUCINATION_DETECTED] Pass references nonexistent repository files as if they currently exist without marking them as [PROPOSED_NEW]:\n    - ${ghostFiles.join('\n    - ')}`);
  }

  // 3. Hand-Waving Evasion Detection (Adjectives without Evidence)
  const handWavingPhrases = [
    'chắc chắn hoạt động tốt',
    'hoàn toàn tối ưu',
    'không có vấn đề gì',
    'mọi thứ đều ổn',
    'tested thoroughly',
    'works flawlessly',
    'perfectly implemented'
  ];
  for (const phrase of handWavingPhrases) {
    if (content.toLowerCase().includes(phrase)) {
      warnings.push(`[HAND_WAVING_WARNING] Detected self-serving adjective: "${phrase}". Every claim must be backed by concrete test output or file diff.`);
    }
  }

  // 4. Product Boundary Invariant Enforcement (Anti-OTA Conflation)
  const forbiddenBoundaryViolations = [
    { term: 'direct ticketing', rule: 'NO_DIRECT_TICKETING' },
    { term: 'passenger checkout', rule: 'NO_PASSENGER_CHECKOUT' },
    { term: 'payment gateway integration', rule: 'NO_PAYMENT_COLLECTION' },
    { term: 'credit card processing', rule: 'NO_PAYMENT_COLLECTION' },
    { term: 'unauthorized scraping', rule: 'NO_UNAUTHORIZED_SCRAPING' }
  ];
  for (const b of forbiddenBoundaryViolations) {
    if (content.toLowerCase().includes(b.term) && !content.toLowerCase().includes('boundary_excluded') && !content.toLowerCase().includes('strictly excluded')) {
      issues.push(`[PRODUCT_BOUNDARY_VIOLATION] Research proposed prohibited OTA capability: "${b.term}" violating invariant ${b.rule}. Farely is Flight Opportunity Intelligence only.`);
    }
  }

  // 5. Anti-Wiggle-Room & Solution Cage Enforcement for Master Goal (passType === 'G')
  if (passType === 'G') {
    const wiggleRoomPhrases = [
      'to be determined',
      'as appropriate',
      'decide during implementation',
      'choose best approach',
      'explore options',
      'implement as needed',
      'tùy ý quyết định',
      'tự chọn giải pháp'
    ];
    for (const w of wiggleRoomPhrases) {
      if (content.toLowerCase().includes(w)) {
        issues.push(`[WIGGLE_ROOM_DETECTED] Master Goal Prompt contains forbidden ambiguous phrase: "${w}". Tasks must specify exact target files, before/after diffs, and turnkey verification commands.`);
      }
    }

    if (!content.includes('INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION') && !content.includes('STRICT_NO_DEVIATION')) {
      issues.push(`[EXECUTOR_CAGE_MISSING] Master Goal Prompt is missing mandatory 'INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION'. The prompt must strictly forbid the downstream executing AI from improvising or introducing unverified architectures.`);
    }

    // Solution Cage Cross-Verification against R5 Full Research
    const r5Path = path.join(ROOT_DIR, 'docs/convergence/r10/R5_FULL_RESEARCH.md');
    if (fs.existsSync(r5Path)) {
      const r5Content = fs.readFileSync(r5Path, 'utf8');
      const solRegex = /\b(SOL-[A-Z0-9_-]+)\b/g;
      const r5Solutions = new Set();
      let matchSol;
      while ((matchSol = solRegex.exec(r5Content)) !== null) {
        r5Solutions.add(matchSol[1]);
      }

      if (r5Solutions.size > 0) {
        const missingSolutions = [];
        for (const sol of r5Solutions) {
          if (!content.includes(sol)) {
            missingSolutions.push(sol);
          }
        }
        if (missingSolutions.length > 0) {
          issues.push(`[SOLUTION_CAGE_LEAKAGE] Master Goal omitted verified solutions from Research R5: ${missingSolutions.join(', ')}. All verified research solutions must be mechanically caged into Section D/E!`);
        }

        // Solution Target File Integrity
        for (const sol of r5Solutions) {
          const solIdx = r5Content.indexOf(sol);
          if (solIdx !== -1) {
            const solBlock = r5Content.slice(solIdx, solIdx + 800);
            const fileMatch = solBlock.match(/`((?:src|supabase|scripts|docs)\/[a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)`/);
            if (fileMatch && fileMatch[1]) {
              const expectedFile = fileMatch[1];
              if (!content.includes(expectedFile)) {
                issues.push(`[SOLUTION_SPEC_DRIFT] Solution ${sol} in Research specified target file \`${expectedFile}\`, but this file is missing in Master Goal!`);
              }
            }
          }
        }
      }
    }
  }

  // 6. Anti-Parroting Check (for Pass >= 2 against Pass N-1)
  if (previousPassPath && fs.existsSync(previousPassPath)) {
    const prevContent = fs.readFileSync(previousPassPath, 'utf8');
    const prevWords = new Set(prevContent.toLowerCase().split(/\s+/).filter(w => w.length > 4));
    const currWords = content.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    
    // Check novel technical terms / code paths
    const newWords = currWords.filter(w => !prevWords.has(w));
    const noveltyRatio = newWords.length / Math.max(currWords.length, 1);

    if (noveltyRatio < 0.08 && passNum >= 2) {
      issues.push(`[PARROTING_EVASION] Pass ${passNum} has less than 8% new vocabulary or code citations compared to Pass ${passNum - 1} (novelty: ${(noveltyRatio * 100).toFixed(1)}%). The agent is repeating previous text instead of conducting deeper research.`);
    }
  }

  // 5. 12-Lens Evidence Density Check
  const lensIds = ['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07', 'L08', 'L09', 'L10', 'L11', 'L12'];
  const missingLenses = [];
  for (const lid of lensIds) {
    if (!content.includes(lid)) {
      missingLenses.push(lid);
    }
  }
  if (missingLenses.length > 0) {
    issues.push(`[LENS_DEFICIT] Document skipped mandatory adversarial lenses: ${missingLenses.join(', ')}`);
  }

  // 6. Cryptographic Proof-of-Execution (PoE) Receipt Verification
  const RECEIPT_FILE = path.join(ROOT_DIR, 'docs/convergence/state/CURRENT_EXECUTION_RECEIPT.json');
  const receiptHashRegex = /EXECUTION_RECEIPT_SHA256:\s*([a-fA-F0-9]{64})/;
  const receiptMatch = receiptHashRegex.exec(content);

  if (!receiptMatch) {
    issues.push(`[UNVERIFIED_EXECUTION_RECEIPT] Document is missing mandatory 'EXECUTION_RECEIPT_SHA256: <hash>'. The agent MUST run 'node scripts/convergence/generate-execution-receipt.mjs' before drafting to prove live codebase telemetry was inspected.`);
  } else {
    const citedHash = receiptMatch[1];
    if (!fs.existsSync(RECEIPT_FILE)) {
      issues.push(`[RECEIPT_FILE_MISSING] Cited receipt hash ${citedHash} but CURRENT_EXECUTION_RECEIPT.json does not exist on disk.`);
    } else {
      try {
        const liveReceipt = JSON.parse(fs.readFileSync(RECEIPT_FILE, 'utf8'));
        if (liveReceipt.receipt_sha256 !== citedHash) {
          issues.push(`[RECEIPT_HASH_MISMATCH] Cited receipt hash ${citedHash} does not match current live receipt ${liveReceipt.receipt_sha256}. Stale or forged receipt detected.`);
        } else {
          // Check timestamp freshness (must be within last 60 minutes)
          const receiptAgeMs = Date.now() - new Date(liveReceipt.timestamp).getTime();
          if (receiptAgeMs > 60 * 60 * 1000) {
            issues.push(`[RECEIPT_EXPIRED] Execution receipt is older than 60 minutes (${Math.round(receiptAgeMs / 60000)}m ago). Telemetry must be re-run.`);
          }
        }
      } catch (e) {
        issues.push(`[RECEIPT_PARSE_ERROR] Failed to validate execution receipt: ${e.message}`);
      }
    }
  }

  return {
    passed: issues.length === 0,
    passType,
    passNum,
    referencedCodeFilesCount: referencedPaths.size,
    issues,
    warnings
  };
}

// CLI Interface
if (process.argv[1] && process.argv[1].endsWith('anti-evasion-linter.mjs')) {
  const currentFile = process.argv[2];
  const previousFile = process.argv[3] || null;

  if (!currentFile) {
    console.error('Usage: node anti-evasion-linter.mjs <currentPass.md> [previousPass.md]');
    process.exit(1);
  }

  const result = auditPassAgainstEvasion(currentFile, previousFile);
  console.log(JSON.stringify(result, null, 2));

  if (!result.passed) {
    console.error('\n❌ ANTI-EVASION LINTER FAILED CLOSED. Pass rejected due to detected evasion or hallucination.');
    process.exit(1);
  } else {
    console.log('\n✅ ANTI-EVASION LINTER PASSED. Ground-truth and skepticism verified.');
    process.exit(0);
  }
}
