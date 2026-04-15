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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

/**
 * Resolve the path to the arduino-cli binary.
 */
const getCLIBinary = () => {
  const isWindows = os.platform() === 'win32';
  const binaryName = isWindows ? 'arduino-cli.exe' : 'arduino-cli';
  
  const localBundledPath = path.resolve(__dirname, '..', 'arduino-cli', binaryName);
  
  if (fs.existsSync(localBundledPath)) {
    console.log(`[SERVER] Using bundled CLI: ${localBundledPath}`);
    return `"${localBundledPath}"`;
  }
  
  console.log(`[SERVER] Bundled CLI not found. Falling back to global command.`);
  return 'arduino-cli';
};

/**
 * Resolve the path to the forge-lib and its config.
 */
const getForgePaths = () => {
  const localForgeLib = path.resolve(__dirname, '..', 'forge-lib');
  const localConfig = path.join(localForgeLib, 'arduino-cli.yaml');
  
  if (fs.existsSync(localConfig)) {
    return {
      userDir: localForgeLib,
      configFile: localConfig
    };
  }

  return {
    userDir: '/app/forge-lib',
    configFile: '/app/forge-lib/arduino-cli.yaml'
  };
};

const CLI_BIN = getCLIBinary();
const FORGE = getForgePaths();
let isInitialized = false;

// Helper
const runCommand = (cmd: string): Promise<{ stdout: string; stderr: string }> => {
  console.log(`[EXEC] ${cmd}`);
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 60000 }, (err, stdout, stderr) => {
      if (err) {
        console.error(`[EXEC ERROR] Code: ${err.code}`);
        let errorMessage = stderr || stdout || err.message;
        try {
           const parsed = JSON.parse(stdout || stderr);
           if (parsed.errors) errorMessage = parsed.errors.map((e: any) => e.message).join('\n');
        } catch (e) {}
        reject(new Error(errorMessage));
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
};

/**
 * Ensure necessary cores are installed.
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
    isInitialized = true;
  } catch (err: any) {
    console.warn('[SERVER WARNING] Core initialization skip/fail:', err.message);
    isInitialized = true; // Proceed anyway
  }
};

// POST /compile
app.post('/compile', async (req, res) => {
  if (!isInitialized) {
    return res.status(503).json({ success: false, errors: ['Server is still initializing. Please wait.'] });
  }

  const { code, board = 'arduino:avr:uno', libraries = [] } = req.body;

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
      } catch (e) {}
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
    } catch (e) {}
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
    try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch (_) {}
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
          name:        props.name        || e.name,
          version:     props.version     || '?',
          author:      props.author      || '',
          description: props.sentence    || '',
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
