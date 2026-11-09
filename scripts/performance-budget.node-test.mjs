import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, statSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

function ensureBuildOutput() {
  const distAssetsDir = join(process.cwd(), 'dist', 'assets');
  if (!existsSync(distAssetsDir)) {
    execSync('npx vite build', { stdio: 'pipe' });
  }
  assert.equal(existsSync(distAssetsDir), true, 'dist/assets directory must exist (build output required)');
  return distAssetsDir;
}

test('performance budgets: entry chunks meet strict individual size budgets (main JS < 350KB, main CSS < 160KB, chunk < 500KB)', () => {
  const distAssetsDir = ensureBuildOutput();
  const files = readdirSync(distAssetsDir);
  assert.ok(files.length >= 5, 'dist/assets must contain at least 5 build artifacts');

  const jsFiles = files.filter((f) => f.endsWith('.js'));
  const cssFiles = files.filter((f) => f.endsWith('.css'));

  assert.ok(jsFiles.length > 0, 'Build must output JavaScript chunks');
  assert.ok(cssFiles.length > 0, 'Build must output CSS stylesheets');

  const mainJsFile = jsFiles.find((f) => f.startsWith('index-'));
  assert.ok(mainJsFile, 'Main entry JavaScript chunk (index-*.js) must exist');
  const mainJsSize = statSync(join(distAssetsDir, mainJsFile)).size;

  const mainCssFile = cssFiles.find((f) => f.startsWith('index-'));
  assert.ok(mainCssFile, 'Main entry CSS chunk (index-*.css) must exist');
  const mainCssSize = statSync(join(distAssetsDir, mainCssFile)).size;

  // Real performance budget constraints:
  // Main entry JS chunk budget: 350 KB
  assert.ok(
    mainJsSize < 350 * 1024,
    `Main entry JS chunk exceeds budget: ${mainJsSize} bytes >= ${350 * 1024} bytes (${mainJsFile})`
  );

  // Main entry CSS chunk budget: 160 KB
  assert.ok(
    mainCssSize < 160 * 1024,
    `Main entry CSS chunk exceeds budget: ${mainCssSize} bytes >= ${160 * 1024} bytes (${mainCssFile})`
  );

  // Maximum single chunk limit: 500 KB (e.g. chart library split)
  for (const jsFile of jsFiles) {
    const size = statSync(join(distAssetsDir, jsFile)).size;
    assert.ok(
      size < 500 * 1024,
      `Code-split chunk ${jsFile} exceeds max single chunk budget: ${size} bytes >= ${500 * 1024} bytes`
    );
  }
});

test('performance budgets: total JavaScript bundle footprint budget (< 1.2 MB uncompressed)', () => {
  const distAssetsDir = ensureBuildOutput();
  const jsFiles = readdirSync(distAssetsDir).filter((f) => f.endsWith('.js'));

  let totalJsBytes = 0;
  for (const file of jsFiles) {
    totalJsBytes += statSync(join(distAssetsDir, file)).size;
  }

  const maxTotalJsBudget = 1200 * 1024; // 1.2 MB
  assert.ok(
    totalJsBytes < maxTotalJsBudget,
    `Total JavaScript assets exceed 1.2MB budget: ${totalJsBytes} bytes >= ${maxTotalJsBudget} bytes`
  );
});

test('performance budgets: total CSS stylesheet footprint budget (< 200 KB uncompressed)', () => {
  const distAssetsDir = ensureBuildOutput();
  const cssFiles = readdirSync(distAssetsDir).filter((f) => f.endsWith('.css'));

  let totalCssBytes = 0;
  for (const file of cssFiles) {
    totalCssBytes += statSync(join(distAssetsDir, file)).size;
  }

  const maxTotalCssBudget = 200 * 1024; // 200 KB
  assert.ok(
    totalCssBytes < maxTotalCssBudget,
    `Total CSS assets exceed 200KB budget: ${totalCssBytes} bytes >= ${maxTotalCssBudget} bytes`
  );
});

test('performance budgets: code-splitting hygiene isolates heavy libraries and route components into separate chunks', () => {
  const distAssetsDir = ensureBuildOutput();
  const jsFiles = readdirSync(distAssetsDir).filter((f) => f.endsWith('.js'));

  // Ensure heavy dependencies are code-split out of the initial index bundle
  const hasPriceChartSplit = jsFiles.some((f) => f.startsWith('PriceHistoryChart-'));
  const hasSupabaseSplit = jsFiles.some((f) => f.startsWith('supabase-'));
  const hasApiSplit = jsFiles.some((f) => f.startsWith('api-'));
  const hasPageSplits = jsFiles.some((f) => f.includes('Page-'));

  assert.ok(hasPriceChartSplit, 'PriceHistoryChart must be split into its own chunk');
  assert.ok(hasSupabaseSplit, 'Supabase client must be split into its own chunk');
  assert.ok(hasApiSplit, 'API client layer must be split into its own chunk');
  assert.ok(hasPageSplits, 'Route pages must be code-split into distinct chunks');
});

test('performance budgets: production asset fingerprinting ensures all JS and CSS chunks carry content-hashes', () => {
  const distAssetsDir = ensureBuildOutput();
  const files = readdirSync(distAssetsDir).filter((f) => f.endsWith('.js') || f.endsWith('.css'));

  assert.ok(files.length > 0, 'Must have asset files to verify fingerprinting');

  for (const file of files) {
    // Vite emits [name]-[hash].[ext] where hash is alphanumeric
    const hasHash = /-[a-zA-Z0-9_-]{6,}\.(js|css)$/.test(file);
    assert.ok(hasHash, `Asset "${file}" must carry a content-hash fingerprint for immutable caching`);
  }
});

test('performance budgets: critical HTML entry shell size remains under 5 KB for rapid TTFB and FCP', () => {
  const indexPath = join(process.cwd(), 'dist', 'index.html');
  assert.ok(existsSync(indexPath), 'dist/index.html must exist');

  const stat = statSync(indexPath);
  assert.ok(
    stat.size < 5 * 1024,
    `dist/index.html (${stat.size} bytes) exceeds 5KB budget for critical entry shell`
  );

  const htmlContent = readFileSync(indexPath, 'utf8');
  assert.ok(htmlContent.includes('<div id="root">'), 'index.html must contain root mount element');
  assert.ok(htmlContent.includes('<script type="module"'), 'index.html must reference module entrypoint');
});
