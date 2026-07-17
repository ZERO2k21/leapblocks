// proprietary-transition.js
const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');

const headerText = `/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
`;

const excludedPaths = [
    path.normalize('src/modules/electra/lib/avr8js'),
    path.normalize('src/modules/electra/elements/leap-elements'),
    path.normalize('src/drivers/cp210x_drivers'),
    path.normalize('src/drivers/arduino-cli'),
    path.normalize('src/pose-extension'),
    path.normalize('src/scratch-gui/scripts'),
    path.normalize('src/Electra/scripts'),
    path.normalize('src/utils/proprietary-transition.js'),
    path.normalize('node_modules'),
    path.normalize('server/node_modules'),
    path.normalize('dist'),
    path.normalize('build'),
    path.normalize('.git')
];

let stats = {
    pkgJsonUpdated: 0,
    filesPatched: 0,
    alreadyTagged: 0,
    skipped: 0
};

// Check if a path should be excluded based on our excludedPaths list
function isExcluded(targetPath) {
    const normalizedPath = path.normalize(targetPath);
    for (const excluded of excludedPaths) {
        if (normalizedPath.includes(excluded)) {
            return true;
        }
    }
    return false;
}

// Ensure the header doesn't already exist
function hasHeader(content) {
    return content.includes('Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.');
}

// Update a package.json file
function updatePackageJson(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`[SKIP] Missing: ${filePath}`);
        return;
    }
    if (DRY_RUN) {
        console.log(`[DRY RUN] Would update: ${filePath}`);
        stats.pkgJsonUpdated++;
        return;
    }

    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        let modified = false;
        
        if (data.license !== "UNLICENSED") {
            data.license = "UNLICENSED";
            modified = true;
        }
        if (data.private !== true) {
            data.private = true;
            modified = true;
        }
        
        if (modified) {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
            console.log(`[UPDATED] ${filePath}`);
            stats.pkgJsonUpdated++;
        } else {
            console.log(`[ALREADY SET] ${filePath}`);
        }
    } catch (e) {
        console.error(`[ERROR] Failed to process ${filePath}:`, e.message);
    }
}

// Prepend header to a source file
function processSourceFile(filePath) {
    if (isExcluded(filePath)) {
        console.log(`[EXCLUDED] ${filePath}`);
        stats.skipped++;
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    if (!['.ts', '.tsx', '.js', '.jsx', '.css'].includes(ext)) {
        return; // ignore non-targeted files safely
    }

    const content = fs.readFileSync(filePath, 'utf8');
    if (hasHeader(content)) {
        console.log(`[ALREADY TAGGED] ${filePath}`);
        stats.alreadyTagged++;
        return;
    }

    if (DRY_RUN) {
        console.log(`[DRY RUN] Would patch: ${filePath}`);
        stats.filesPatched++;
        return;
    }

    try {
        fs.writeFileSync(filePath, headerText + content, 'utf8');
        console.log(`[PATCHED] ${filePath}`);
        stats.filesPatched++;
    } catch (e) {
        console.error(`[ERROR] Failed to patch ${filePath}:`, e.message);
    }
}

function processDirectory(dirPath, recursive = true) {
    if (!fs.existsSync(dirPath)) return;

    if (isExcluded(dirPath)) {
        console.log(`[EXCLUDED DIR] ${dirPath}`);
        return;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
            if (recursive && !isExcluded(fullPath)) {
                processDirectory(fullPath, recursive);
            }
        } else if (entry.isFile()) {
            processSourceFile(fullPath);
        }
    }
}

function run() {
    console.log(`=== Creoleap Technologies - Proprietary Copyright Injector ===`);
    if (DRY_RUN) console.log(`!!! RUNNING IN DRY-RUN MODE (No files will be modified) !!!`);
    
    // 1. Update package.json files
    updatePackageJson('package.json');
    updatePackageJson(path.join('server', 'package.json'));
    
    // 2. Process root server directory (Non-recursive)
    console.log(`\nScanning server/ root...`);
    processDirectory('server', false);

    // 3. Process src directory (Recursive)
    console.log(`\nScanning src/ recursively...`);
    processDirectory('src', true);

    // 4. Print Summary
    console.log(`\n=== Execution Summary ===`);
    console.log(`package.json files updated : ${stats.pkgJsonUpdated}`);
    console.log(`files patched              : ${stats.filesPatched}`);
    console.log(`already tagged             : ${stats.alreadyTagged}`);
    console.log(`skipped                    : ${stats.skipped}`);
    console.log(`=========================`);
}

run();
