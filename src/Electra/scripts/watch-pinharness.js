/**
 * File watcher for PinHarness.json
 * Automatically syncs changes to PinHarness.ts when the JSON file is modified
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const jsonPath = path.join(__dirname, '../Client/Src/engine/Arduino/PinHarness.json');

console.log('👀 Watching PinHarness.json for changes...');
console.log(`   File: ${jsonPath}\n`);

// Initial sync
try {
            execSync('node src/Electra/scripts/sync-pinharness.js', { stdio: 'inherit' });
} catch (error) {
    console.error('Initial sync failed:', error.message);
}

// Watch for changes
fs.watch(jsonPath, (eventType, filename) => {
    if (eventType === 'change') {
        console.log(`\n📝 Detected change in ${filename}`);
        try {
    execSync('node src/Electra/scripts/sync-pinharness.js', { stdio: 'inherit' });
        } catch (error) {
            console.error('Sync failed:', error.message);
        }
    }
});

// Keep the process running
process.on('SIGINT', () => {
    console.log('\n\n👋 Stopped watching PinHarness.json');
    process.exit(0);
});
