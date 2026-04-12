/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');

const HEADER = `/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */

`;

const EXCLUDED_PATHS = [
  'src/modules/leapforge/lib/avr8js',
  'src/modules/leapforge/elements/leap-elements',
  'arduino-cli',
  'cp210x_drivers',
  'node_modules',
  'server/node_modules',
  'dist',
  'build',
  '.git'
];

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.css'];

const stats = {
  packageJsonUpdated: 0,
  filesPatched: 0,
  alreadyTagged: 0,
  skipped: 0
};

function isExcluded(filePath) {
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  return EXCLUDED_PATHS.some(excluded => 
    relativePath === excluded || relativePath.startsWith(excluded + '/')
  );
}

function updatePackageJson(pkgPath) {
  if (!fs.existsSync(pkgPath)) return;
  
  if (isExcluded(pkgPath)) {
    console.log(`[SKIP] Excluded: ${pkgPath}`);
    stats.skipped++;
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  let changed = false;

  if (pkg.license !== 'UNLICENSED') {
    pkg.license = 'UNLICENSED';
    changed = true;
  }
  if (pkg.private !== true) {
    pkg.private = true;
    changed = true;
  }

  if (changed) {
    if (DRY_RUN) {
      console.log(`[DRY-RUN] Would update: ${pkgPath}`);
    } else {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log(`[UPDATED] ${pkgPath}`);
    }
    stats.packageJsonUpdated++;
  } else {
    console.log(`[OK] Already updated: ${pkgPath}`);
  }
}

function patchFile(filePath) {
  if (isExcluded(filePath)) {
    console.log(`[SKIP] Excluded: ${filePath}`);
    stats.skipped++;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.')) {
    console.log(`[OK] Already tagged: ${filePath}`);
    stats.alreadyTagged++;
    return;
  }

  if (DRY_RUN) {
    console.log(`[DRY-RUN] Would patch: ${filePath}`);
  } else {
    const newContent = HEADER + content;
    fs.writeFileSync(filePath, newContent);
    console.log(`[PATCHED] ${filePath}`);
  }
  stats.filesPatched++;
}

function walkDir(dir, recursive = true) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (recursive && !isExcluded(fullPath)) {
        walkDir(fullPath, true);
      } else if (isExcluded(fullPath)) {
        console.log(`[SKIP] Directory excluded: ${fullPath}`);
        stats.skipped++;
      }
    } else if (EXTENSIONS.includes(path.extname(fullPath))) {
      patchFile(fullPath);
    }
  }
}

console.log(DRY_RUN ? '--- RUNNING IN DRY-RUN MODE ---' : '--- RUNNING LIVE TRANSITION ---');

// 1. Update package.json files
updatePackageJson(path.join(process.cwd(), 'package.json'));
updatePackageJson(path.join(process.cwd(), 'server', 'package.json'));

// 2. Scan src/ recursively
walkDir(path.join(process.cwd(), 'src'), true);

// 3. Scan server/ root level only
walkDir(path.join(process.cwd(), 'server'), false);

console.log('\n--- SUMMARY ---');
console.log(`package.json files updated: ${stats.packageJsonUpdated} | files patched: ${stats.filesPatched} | already tagged: ${stats.alreadyTagged} | skipped: ${stats.skipped}`);

if (DRY_RUN) {
  console.log('\nNOTE: No changes were written. Remove --dry-run to apply.');
}
