const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const FORGE_LIB = path.join(ROOT, 'forge-lib');
const DATA_DIR = path.join(FORGE_LIB, 'data');
const CONFIG_FILE = path.join(FORGE_LIB, 'arduino-cli.yaml');
const CLI_PATH = path.join(ROOT, 'arduino-cli', 'arduino-cli.exe');

async function runCLI(args) {
  return new Promise((resolve) => {
    console.log(`[PREP] Running: arduino-cli ${args.join(' ')}`);
    const proc = spawn(CLI_PATH, ['--config-file', CONFIG_FILE, ...args], {
      env: { 
        ...process.env,
        ARDUINO_DATA_DIR: DATA_DIR,
        ARDUINO_DOWNLOADS_DIR: path.join(FORGE_LIB, 'staging'),
        ARDUINO_USER_DIR: FORGE_LIB
      }
    });
    proc.stdout.on('data', d => process.stdout.write(d));
    proc.stderr.on('data', d => process.stderr.write(d));
    proc.on('close', code => resolve(code));
  });
}

async function prepare() {
  console.log('=== Preparing Offline Cores for LeapBlocks ===');
  
  // 1. Ensure directories exist
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  
  // 2. Update package index
  console.log('\n[1/3] Updating package index...');
  await runCLI(['core', 'update-index']);
  
  // 3. Install AVR Core
  console.log('\n[2/3] Installing AVR core...');
  await runCLI(['core', 'install', 'arduino:avr']);
  
  // 4. Install ESP32 Core
  console.log('\n[3/3] Installing ESP32 core...');
  await runCLI(['core', 'install', 'esp32:esp32']);
  
  console.log('\n=== Offline cores ready in forge-lib/data ===');
  console.log('You can now build your .exe and it will work without internet.');
}

prepare().catch(console.error);
