import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const tsPath = path.join(__dirname, '../Client/Src/engine/Arduino/PinHarness.ts');

console.log('👀 Watching PinHarness.ts for changes...');
console.log(`   File: ${tsPath}\n`);

try {
  execSync('bun run src/Electra/scripts/sync-pinharness.ts', { stdio: 'inherit' });
} catch (error) {
  console.error('Initial format failed:', (error as Error).message);
}

fs.watch(tsPath, (eventType: string, filename: string | null) => {
  if (eventType === 'change') {
    console.log(`\n📝 Detected change in ${filename}`);
    try {
      execSync('bun run src/Electra/scripts/sync-pinharness.ts', { stdio: 'inherit' });
    } catch (error) {
      console.error('Format failed:', (error as Error).message);
    }
  }
});

process.on('SIGINT', () => {
  console.log('\n\n👋 Stopped watching PinHarness.ts');
  process.exit(0);
});
