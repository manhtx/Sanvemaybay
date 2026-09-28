import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function computeDeployableSurface(rootDir = process.cwd()) {
  function walk(dir) {
    let results = [];
    const list = fs.readdirSync(path.join(rootDir, dir));
    for (const file of list) {
      if (file === 'node_modules' || file === '.git' || file === '.temp' || file === 'coverage') continue;
      const rel = path.join(dir, file);
      const full = path.join(rootDir, rel);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        results = results.concat(walk(rel));
      } else {
        results.push(rel);
      }
    }
    return results;
  }

  const rootConfigCandidates = [
    'index.html',
    'package.json',
    'package-lock.json',
    'vite.config.ts',
    'tsconfig.json',
    'tsconfig.node.json',
    'vercel.json',
    'supabase/config.toml'
  ];

  const rootFiles = rootConfigCandidates.filter(f => fs.existsSync(path.join(rootDir, f)));
  const srcFiles = walk('src').filter(f =>
    !f.endsWith('.test.ts') &&
    !f.endsWith('.test.tsx') &&
    !f.endsWith('.spec.ts') &&
    !f.endsWith('.spec.tsx')
  );
  const publicFiles = fs.existsSync(path.join(rootDir, 'public')) ? walk('public') : [];
  const migrationFiles = fs.existsSync(path.join(rootDir, 'supabase/migrations'))
    ? walk('supabase/migrations').filter(f => f.endsWith('.sql'))
    : [];
  const functionFiles = fs.existsSync(path.join(rootDir, 'supabase/functions'))
    ? walk('supabase/functions').filter(f =>
      !f.endsWith('_test.ts') &&
      !f.endsWith('.test.ts') &&
      !f.endsWith('.md')
    )
    : [];

  const allFiles = [...rootFiles, ...srcFiles, ...publicFiles, ...migrationFiles, ...functionFiles].sort();

  const fileEntries = [];
  const overallHasher = crypto.createHash('sha256');

  for (const rel of allFiles) {
    const full = path.join(rootDir, rel);
    const buf = fs.readFileSync(full);
    const fileSha256 = crypto.createHash('sha256').update(buf).digest('hex');
    fileEntries.push({
      path: rel,
      sha256: fileSha256,
      size_bytes: buf.length
    });
    overallHasher.update(`${rel}:${fileSha256}\n`);
  }

  const deployableSurfaceHash = overallHasher.digest('hex');

  return {
    schema_version: '1.0.0',
    generated_at: new Date().toISOString(),
    total_files: allFiles.length,
    deployable_surface_hash: deployableSurfaceHash,
    category_summary: {
      root_config: rootFiles.length,
      src_runtime: srcFiles.length,
      public_assets: publicFiles.length,
      migrations: migrationFiles.length,
      edge_functions: functionFiles.length
    },
    files: fileEntries
  };
}

if (process.argv[1] && process.argv[1].endsWith('compute-deployable-surface.mjs')) {
  const result = computeDeployableSurface();
  const targetPath = path.join(process.cwd(), '.flycheap', 'DEPLOYABLE_SURFACE.json');
  fs.writeFileSync(targetPath, JSON.stringify(result, null, 2) + '\n');
  console.log(`DEPLOYABLE_SURFACE_HASH: ${result.deployable_surface_hash} (${result.total_files} files) written to ${targetPath}`);
}
