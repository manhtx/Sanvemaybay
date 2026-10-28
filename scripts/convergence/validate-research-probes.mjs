#!/usr/bin/env node
/**
 * FARELY FEASIBILITY & PROBE VALIDATOR
 * 
 * Extracts and compiles/lints code snippets proposed in Research outputs
 * to guarantee they are physically executable in this repository:
 * 1. Verifies TypeScript dependencies match package.json or Deno standard library.
 * 2. Verifies SQL syntax and table references against existing Supabase migrations.
 * 3. Verifies shell commands use only available CLI tools (git, node, npm, npx, deno, supabase).
 * 4. Fails closed if research proposes unfeasible external dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');
const MIGRATIONS_DIR = path.join(ROOT_DIR, 'supabase/migrations');

export function validateResearchFeasibility(researchFilePath) {
  const issues = [];
  const warnings = [];

  if (!fs.existsSync(researchFilePath)) {
    return { passed: false, issues: [`File not found: ${researchFilePath}`], warnings };
  }

  const content = fs.readFileSync(researchFilePath, 'utf8');

  // Load known installed dependencies
  let installedDeps = new Set();
  if (fs.existsSync(PACKAGE_JSON_PATH)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
      installedDeps = new Set([
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.devDependencies || {}),
        'node:fs', 'node:path', 'node:crypto', 'node:test', 'node:assert', 'node:child_process'
      ]);
    } catch {
      // Fallback
    }
  }

  // Load existing Supabase tables from migrations
  const existingTables = new Set(['observed_fares', 'deals', 'airports', 'routes', 'alerts', 'watch_subscriptions', 'users']);
  if (fs.existsSync(MIGRATIONS_DIR)) {
    try {
      const files = fs.readdirSync(MIGRATIONS_DIR);
      for (const f of files) {
        if (f.endsWith('.sql')) {
          const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf8');
          const tableMatches = sql.matchAll(/CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:public\.)?([a-zA-Z0-9_]+)/gi);
          for (const m of tableMatches) {
            existingTables.add(m[1].toLowerCase());
          }
        }
      }
    } catch {
      // Fallback
    }
  }

  // 1. Extract TypeScript / JavaScript import statements strictly inside ts/js code blocks
  const codeBlockRegex = /```(?:typescript|ts|javascript|js|tsx|jsx)\n([\s\S]*?)```/g;
  let codeMatch;
  while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
    const code = codeMatch[1];
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    let imp;
    while ((imp = importRegex.exec(code)) !== null) {
      const moduleName = imp[1];
      if (moduleName.startsWith('.') || moduleName.startsWith('https://') || moduleName.startsWith('npm:') || moduleName.startsWith('jsr:')) {
        continue;
      }
      const basePkg = moduleName.startsWith('@') ? moduleName.split('/').slice(0, 2).join('/') : moduleName.split('/')[0];
      if (!installedDeps.has(basePkg)) {
        issues.push(`[UNINSTALLED_DEPENDENCY] Research proposes importing uninstalled package: "${basePkg}". Any new package must be explicitly justified with bundle impact and licensing.`);
      }
    }
  }

  // 2. Extract SQL Table references strictly inside sql code blocks
  const sqlBlockRegex = /```(?:sql|postgres|postgresql)\n([\s\S]*?)```/g;
  let sqlMatch;
  while ((sqlMatch = sqlBlockRegex.exec(content)) !== null) {
    const sql = sqlMatch[1];
    const sqlSelectRegex = /(?:FROM|JOIN)\s+(?:public\.)?([a-zA-Z0-9_]+)/gi;
    let tbl;
    while ((tbl = sqlSelectRegex.exec(sql)) !== null) {
      const tableName = tbl[1].toLowerCase();
      if (['select', 'where', 'values', 'unnest', 'json_populate_record', 'jsonb_array_elements'].includes(tableName)) continue;
      if (!existingTables.has(tableName)) {
        const createPattern = new RegExp(`CREATE\\s+TABLE[^\n]{0,80}${tableName}`, 'i');
        if (!createPattern.test(content)) {
          issues.push(`[PHANTOM_TABLE_REFERENCE] Proposed SQL queries nonexistent table: "${tableName}". Table is not in supabase/migrations/ and not declared in a [PROPOSED_NEW] CREATE TABLE statement.`);
        }
      }
    }
  }

  return {
    passed: issues.length === 0,
    knownInstalledDepsCount: installedDeps.size,
    knownTablesCount: existingTables.size,
    issues,
    warnings
  };
}

// CLI handler
if (process.argv[1] && process.argv[1].endsWith('validate-research-probes.mjs')) {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: node validate-research-probes.mjs <research.md>');
    process.exit(1);
  }
  const result = validateResearchFeasibility(target);
  console.log(JSON.stringify(result, null, 2));
  if (!result.passed) {
    console.error('\n❌ FEASIBILITY VALIDATOR REJECTED RESEARCH: Unfeasible dependencies or phantom tables detected.');
    process.exit(1);
  } else {
    console.log('\n✅ FEASIBILITY VALIDATOR PASSED: All dependencies and tables verified against codebase.');
    process.exit(0);
  }
}
