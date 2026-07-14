const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const APP_ROOT = __dirname;
const FORGE_LIB_DIR = path.join(APP_ROOT, 'forge-lib');
const FORGE_CLI_YAML = path.join(FORGE_LIB_DIR, 'arduino-cli.yaml');
const FORGE_DATA_DIR = path.join(FORGE_LIB_DIR, 'data');
const FORGE_DOWNLOADS_DIR = path.join(FORGE_LIB_DIR, 'staging');
const CLI_PATH = path.join(APP_ROOT, '..', 'src', 'drivers', 'arduino-cli', 'arduino-cli.exe');

console.log('APP_ROOT:', APP_ROOT);
console.log('CLI_PATH:', CLI_PATH);
console.log('CLI_PATH exists?', fs.existsSync(CLI_PATH));
console.log('FORGE_CLI_YAML exists?', fs.existsSync(FORGE_CLI_YAML));

async function runCLI(args) {
  return new Promise((resolve) => {
    console.log('Running:', CLI_PATH, ['--config-file', FORGE_CLI_YAML, ...args].join(' '));
    const proc = spawn(CLI_PATH, ['--config-file', FORGE_CLI_YAML, ...args], {
      env: { 
        ...process.env,
        ARDUINO_DATA_DIR: FORGE_DATA_DIR,
        ARDUINO_DOWNLOADS_DIR: FORGE_DOWNLOADS_DIR,
        ARDUINO_USER_DIR: FORGE_LIB_DIR
      }
    });
    let stdout = '', stderr = '';
    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });
    proc.on('close', code => resolve({ stdout, stderr, code }));
    proc.on('error', err => resolve({ stdout: '', stderr: err.message, code: -1 }));
  });
}

async function test() {
  const { stdout, stderr, code } = await runCLI(['core', 'list', '--format', 'json']);
  console.log('listCode:', code);
  console.log('stdout:', stdout.slice(0, 100));
  console.log('stderr:', stderr);
  
  if (code !== 0) {
    console.log('FAILED');
    return;
  }
  
  try {
    let parsed = JSON.parse(stdout || '[]');
    let cores = Array.isArray(parsed) ? parsed : (parsed.platforms || []);
    const installed = cores.some(c => (c.id || c.platform?.id || '').includes('esp32'));
    console.log('Installed?', installed);
    
    if (!installed) {
      console.log('Attempting install...');
      const ESP32_URLS = ['https://dl.espressif.com/dl/package_esp32_index.json'];
      const r1 = await runCLI(['core', 'update-index', '--additional-urls', ESP32_URLS.join(',')]);
      console.log('update-index code:', r1.code);
      console.log('update-index stderr:', r1.stderr);
      const r2 = await runCLI(['core', 'install', 'esp32:esp32', '--additional-urls', ESP32_URLS.join(',')]);
      console.log('install code:', r2.code);
      console.log('install stderr:', r2.stderr);
    }
  } catch (err) {
    console.error('Caught error:', err);
  }
}

test();
