/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { transpileArduinoToJS } from './transpiler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root — works whether running from src/Leapforge/server/ or compiled dist/
// Walk up until we find the directory that has BOTH package.json AND arduino-cli/
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    if (
      fs.existsSync(path.join(dir, 'package.json')) &&
      fs.existsSync(path.join(dir, 'arduino-cli'))
    ) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback: first package.json found walking up
  dir = startDir;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return startDir;
}
const PROJECT_ROOT = findProjectRoot(__dirname);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

/**
 * Resolve the path to the arduino-cli binary.
 */
const getCLIBinary = () => {
  const isWindows = os.platform() === 'win32';
  const binaryName = isWindows ? 'arduino-cli.exe' : 'arduino-cli';

  // 1. Bundled alongside the project root (arduino-cli/arduino-cli.exe)
  const bundledPath = path.join(PROJECT_ROOT, 'arduino-cli', binaryName);
  if (fs.existsSync(bundledPath)) {
    console.log(`[SERVER] Using bundled CLI: ${bundledPath}`);
    return `"${bundledPath}"`;
  }

  // 2. Legacy: relative to server file (for compiled/deployed builds)
  const localBundledPath = path.resolve(__dirname, '..', 'arduino-cli', binaryName);
  if (fs.existsSync(localBundledPath)) {
    console.log(`[SERVER] Using local bundled CLI: ${localBundledPath}`);
    return `"${localBundledPath}"`;
  }

  console.log(`[SERVER] Bundled CLI not found at ${bundledPath} — falling back to global command.`);
  return 'arduino-cli';
};

/**
 * Resolve the path to the forge-lib and its config.
 */
const getForgePaths = () => {
  // 1. Project root forge-lib (dev mode)
  const rootForgeLib = path.join(PROJECT_ROOT, 'forge-lib');
  const rootConfig = path.join(rootForgeLib, 'arduino-cli.yaml');
  if (fs.existsSync(rootConfig)) {
    console.log(`[SERVER] Using forge-lib at: ${rootForgeLib}`);
    return { userDir: rootForgeLib, configFile: rootConfig };
  }

  // 2. Legacy relative path
  const localForgeLib = path.resolve(__dirname, '..', 'forge-lib');
  const localConfig = path.join(localForgeLib, 'arduino-cli.yaml');
  if (fs.existsSync(localConfig)) {
    return { userDir: localForgeLib, configFile: localConfig };
  }

  // 3. Docker / deployed fallback
  return {
    userDir: '/app/forge-lib',
    configFile: '/app/forge-lib/arduino-cli.yaml'
  };
};

const CLI_BIN = getCLIBinary();
const FORGE = getForgePaths();

// Write arduino-cli.yaml with absolute paths so it works regardless of CWD
// and keeps all data inside forge-lib/ (outside Vite's watch scope)
(function ensureForgeConfig() {
  const forgeLib = FORGE.userDir;
  const dataDir = path.join(forgeLib, 'data');
  const stagingDir = path.join(forgeLib, 'staging');
  const libsDir = path.join(forgeLib, 'libraries');
  [dataDir, stagingDir, libsDir].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

  const yaml = `directories:\n  data: ${dataDir.replace(/\\/g, '/')}\n  downloads: ${stagingDir.replace(/\\/g, '/')}\n  user: ${forgeLib.replace(/\\/g, '/')}\n`;
  fs.writeFileSync(FORGE.configFile, yaml, 'utf8');
  console.log(`[SERVER] arduino-cli.yaml written with absolute paths → data: ${dataDir}`);
})();
let isInitialized = false;
let avrReady = false;   // set true as soon as AVR core is confirmed — allows AVR compiles immediately
let esp32Ready = false; // set true when ESP32 core is ready

// Helper — long timeout variant for core installs (ESP32 is ~400 MB)
const runCommandLong = (cmd: string, timeoutMs = 900_000): Promise<{ stdout: string; stderr: string }> => {
  console.log(`[EXEC] ${cmd}`);
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: timeoutMs }, (err, stdout, stderr) => {
      if (err) {
        console.error(`[EXEC ERROR] Code: ${err.code}`);
        let errorMessage = stderr || stdout || err.message;
        try {
          const parsed = JSON.parse(stdout || stderr);
          if (parsed.errors) errorMessage = parsed.errors.map((e: any) => e.message).join('\n');
        } catch (e) { }
        reject(new Error(errorMessage));
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
};

// Helper — standard timeout for most commands
const runCommand = (cmd: string): Promise<{ stdout: string; stderr: string }> => {
  return runCommandLong(cmd, 60_000);
};

/**
 * Ensure necessary cores are installed.
 * AVR is marked ready immediately after it's confirmed — ESP32 installs in background.
 */
const initCores = async () => {
  try {
    console.log('[SERVER] Checking for arduino:avr core...');
    const result = await runCommand(`${CLI_BIN} core list --format json --config-file "${FORGE.configFile}"`);

    let data;
    try {
      data = JSON.parse(result.stdout);
    } catch (e) {
      data = [];
    }

    const hasAvr = Array.isArray(data) && data.some((c: any) =>
      (c.platform?.architecture === 'avr') || (c.id === 'arduino:avr')
    );

    if (!hasAvr) {
      console.log('[SERVER] Core arduino:avr not found. Installing...');
      await runCommand(`${CLI_BIN} core update-index --config-file "${FORGE.configFile}"`);
      await runCommand(`${CLI_BIN} core install arduino:avr --config-file "${FORGE.configFile}"`);
      console.log('[SERVER] Core arduino:avr installed successfully.');
    } else {
      console.log('[SERVER] Core arduino:avr is already installed.');
    }

    // AVR is ready — allow AVR compiles immediately without waiting for ESP32
    avrReady = true;
    isInitialized = true;
    console.log('[SERVER] ✓ Ready for AVR compilation.');

    // Install ESP32 core in the background — doesn't block AVR compiles
    const hasEsp32 = Array.isArray(data) && data.some((c: any) =>
      (c.platform?.id === 'esp32:esp32') || (c.id === 'esp32:esp32')
    );
    if (!hasEsp32) {
      console.log('[SERVER] Core esp32:esp32 not found. Installing in background (this may take a few minutes)...');
      // Use 15-minute timeout — ESP32 core is ~400 MB
      runCommandLong(
        `${CLI_BIN} core update-index --config-file "${FORGE.configFile}" --additional-urls ` +
        `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`,
        120_000
      ).then(() => runCommandLong(
        `${CLI_BIN} core install esp32:esp32 --config-file "${FORGE.configFile}" --additional-urls ` +
        `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`,
        900_000  // 15 minutes
      )).then(() => {
        esp32Ready = true;
        console.log('[SERVER] ✓ Core esp32:esp32 installed successfully.');
      }).catch((err: any) => {
        console.warn('[SERVER WARNING] ESP32 core install failed:', err.message);
      });
    } else {
      esp32Ready = true;
      console.log('[SERVER] Core esp32:esp32 is already installed.');
    }

  } catch (err: any) {
    console.warn('[SERVER WARNING] Core initialization skip/fail:', err.message);
    // Allow compilation attempts even if core check failed
    isInitialized = true;
    avrReady = true;
  }
};

// GET /status — lets the client check if the server is ready
app.get('/status', (_req, res) => {
  res.json({
    ready: isInitialized,
    avrReady,
    esp32Ready,
    message: isInitialized
      ? `Ready. AVR: ${avrReady}, ESP32: ${esp32Ready}`
      : 'Server is initializing — installing Arduino cores...',
  });
});

// POST /compile
app.post('/compile', async (req, res) => {
  const { code, board = 'arduino:avr:uno', libraries = [] } = req.body;
  const isESP32Board = typeof board === 'string' && board.startsWith('esp32:');

  // Block only if the required core isn't ready yet
  if (isESP32Board && !esp32Ready) {
    return res.status(503).json({
      success: false,
      errors: ['ESP32 core is still installing. Please wait a few minutes and try again.'],
    });
  }
  if (!isESP32Board && !avrReady) {
    return res.status(503).json({
      success: false,
      errors: ['Server is still initializing. Please wait a moment and try again.'],
    });
  }

  if (!code) {
    return res.status(400).json({ success: false, errors: ['No code provided'] });
  }

  const sketchId = `sketch_${Date.now()}`;
  const sketchDir = path.join(os.tmpdir(), 'leapforge', sketchId);
  const sketchFile = path.join(sketchDir, `${sketchId}.ino`);

  try {
    if (!fs.existsSync(sketchDir)) {
      fs.mkdirSync(sketchDir, { recursive: true });
    }
    fs.writeFileSync(sketchFile, code, 'utf8');

    for (const lib of libraries) {
      try {
        await runCommand(`${CLI_BIN} lib install "${lib}" --config-file "${FORGE.configFile}"`);
      } catch (e) { }
    }

    const result = await runCommand(`${CLI_BIN} compile --fqbn ${board} --format json --config-file "${FORGE.configFile}" --output-dir "${sketchDir}" ${sketchDir}`);

    // Look for any .hex file in the directory (sometimes names vary slightly)
    const files = fs.readdirSync(sketchDir);
    const hexFile = files.find(f => f.endsWith('.hex'));

    if (!hexFile) {
      console.error(`[BUILD ERROR] No HEX file found in ${sketchDir}. Directory contents:`, files);
      return res.json({ success: false, errors: ['HEX file not generated. Check your code syntax.'] });
    }

    const hex = fs.readFileSync(path.join(sketchDir, hexFile), 'utf8');
    return res.json({ success: true, hex });

  } catch (err: any) {
    return res.json({ success: false, errors: [err.message] });
  } finally {
    try {
      if (fs.existsSync(sketchDir)) fs.rmSync(sketchDir, { recursive: true, force: true });
    } catch (e) { }
  }
});

// POST /transpile — Arduino C++ → JavaScript for browser-side simulation
app.post('/transpile', async (req, res) => {
  const { code, board = 'esp32:esp32:esp32c3' } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, errors: ['No code provided'] });
  }

  // Step 1: Validate the sketch by compiling with arduino-cli (catches syntax errors)
  if (esp32Ready) {
    const sketchId = `transpile_${Date.now()}`;
    const sketchDir = path.join(os.tmpdir(), 'leapforge', sketchId);
    const sketchFile = path.join(sketchDir, `${sketchId}.ino`);
    try {
      fs.mkdirSync(sketchDir, { recursive: true });
      fs.writeFileSync(sketchFile, code, 'utf8');
      await runCommand(
        `${CLI_BIN} compile --fqbn ${board} --format json ` +
        `--config-file "${FORGE.configFile}" --output-dir "${sketchDir}" ${sketchDir}`
      );
    } catch (err: any) {
      // If compilation fails, return the error — don't transpile invalid code
      try { fs.rmSync(sketchDir, { recursive: true, force: true }); } catch (_) { }
      return res.json({ success: false, errors: [err.message] });
    } finally {
      try { if (fs.existsSync(sketchDir)) fs.rmSync(sketchDir, { recursive: true, force: true }); } catch (_) { }
    }
  }

  // Step 2: Transpile C++ → JavaScript
  try {
    const jsCode = transpileArduinoToJS(code);
    console.log(`[TRANSPILE] Transpiled ${code.length} bytes → ${jsCode.length} bytes JS`);
    return res.json({ success: true, jsCode });
  } catch (err: any) {
    console.error('[TRANSPILE] Error:', err.message);
    return res.json({ success: false, errors: [err.message] });
  }
});

// GET /libraries/search
app.get('/libraries/search', async (req, res) => {
  const query = req.query.q as string;
  if (!query) return res.json([]);
  try {
    const result = await runCommand(`${CLI_BIN} lib search "${query}" --format json --config-file "${FORGE.configFile}"`);
    const data = JSON.parse(result.stdout);
    const libs = (data.libraries || []).slice(0, 20).map((l: any) => ({
      name: l.name,
      author: l.latest?.author?.name || '',
      description: l.latest?.sentence || '',
      version: l.latest?.version || '',
    }));
    res.json(libs);
  } catch (err) {
    res.json([]);
  }
});

// POST /libraries/install  { name: string }
app.post('/libraries/install', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Library name required' });

  console.log(`[LIB] Installing: ${name}`);
  try {
    // Throttled index update — only once per 24h
    const manifestPath = path.join(FORGE.userDir, 'manifest.json');
    let manifest: any = {};
    try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch (_) { }
    if (!manifest.lastIndexUpdate || Date.now() - manifest.lastIndexUpdate > 24 * 60 * 60 * 1000) {
      await runCommand(`${CLI_BIN} lib update-index --config-file "${FORGE.configFile}"`);
      manifest.lastIndexUpdate = Date.now();
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    }

    await runCommand(`${CLI_BIN} lib install "${name}" --config-file "${FORGE.configFile}"`);
    console.log(`[LIB] Installed: ${name}`);
    res.json({ success: true });
  } catch (err: any) {
    console.error(`[LIB] Install failed: ${err.message}`);
    res.json({ success: false, error: err.message });
  }
});

// GET /libraries/installed
app.get('/libraries/installed', (_req, res) => {
  const libsDir = path.join(FORGE.userDir, 'libraries');
  if (!fs.existsSync(libsDir)) return res.json([]);

  try {
    const entries = fs.readdirSync(libsDir, { withFileTypes: true });
    const libs = entries
      .filter(e => e.isDirectory())
      .map(e => {
        const propFile = path.join(libsDir, e.name, 'library.properties');
        const props: Record<string, string> = {};
        if (fs.existsSync(propFile)) {
          fs.readFileSync(propFile, 'utf8').split('\n').forEach(line => {
            const [k, ...v] = line.split('=');
            if (k && v.length) props[k.trim()] = v.join('=').trim();
          });
        }
        return {
          name: props.name || e.name,
          version: props.version || '?',
          author: props.author || '',
          description: props.sentence || '',
        };
      });
    res.json(libs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /libraries/remove  { name: string }
app.delete('/libraries/remove', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Library name required' });

  console.log(`[LIB] Removing: ${name}`);
  try {
    await runCommand(`${CLI_BIN} lib uninstall "${name}" --config-file "${FORGE.configFile}"`);
    res.json({ success: true });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`LeapForge Compiler Server running on :${PORT}`);
  await initCores();
});
