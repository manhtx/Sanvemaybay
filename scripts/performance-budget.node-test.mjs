import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

test('performance budgets: all defined budgets meet release criteria based on measured build output', () => {
  const distAssetsDir = join(process.cwd(), 'dist', 'assets');
  if (!existsSync(distAssetsDir)) {
    execSync('npx vite build', { stdio: 'pipe' });
  }
  assert.equal(existsSync(distAssetsDir), true, 'dist/assets directory must exist (build output required)');

  const files = readdirSync(distAssetsDir);
  assert.ok(files.length >= 5, 'dist/assets must contain at least 5 build artifacts');

  const jsFiles = files.filter(f => f.endsWith('.js'));
  const cssFiles = files.filter(f => f.endsWith('.css'));

  assert.ok(jsFiles.length > 0, 'Build must output JavaScript chunks');
  assert.ok(cssFiles.length > 0, 'Build must output CSS stylesheets');

  const mainJsFile = jsFiles.find(f => f.startsWith('index-'));
  assert.ok(mainJsFile, 'Main entry JavaScript chunk (index-*.js) must exist');
  const mainJsSize = statSync(join(distAssetsDir, mainJsFile)).size;

  const mainCssFile = cssFiles.find(f => f.startsWith('index-'));
  assert.ok(mainCssFile, 'Main entry CSS chunk (index-*.css) must exist');
  const mainCssSize = statSync(join(distAssetsDir, mainCssFile)).size;

  // Real performance budget constraints (measured bytes, not hardcoded strings):
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
