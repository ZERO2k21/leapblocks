/**
 * File watcher for PinHarness.ts
 * Automatically formats PinHarness.ts when the file is modified
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const tsPath = path.join(__dirname, '../Client/Src/engine/Arduino/PinHarness.ts');

console.log('👀 Watching PinHarness.ts for changes...');
console.log(`   File: ${tsPath}\n`);

// Initial format
try {
            execSync('node src/Electra/scripts/sync-pinharness.js', { stdio: 'inherit' });
} catch (error) {
    console.error('Initial format failed:', error.message);
}

// Watch for changes
fs.watch(tsPath, (eventType, filename) => {
    if (eventType === 'change') {
        console.log(`\n📝 Detected change in ${filename}`);
        try {
    execSync('node src/Electra/scripts/sync-pinharness.js', { stdio: 'inherit' });
        } catch (error) {
            console.error('Format failed:', error.message);
        }
    }
});

// Keep the process running
process.on('SIGINT', () => {
    console.log('\n\n👋 Stopped watching PinHarness.ts');
    process.exit(0);
});
