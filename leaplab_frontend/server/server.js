import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawn } from 'child_process';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { v4 as uuidv4 } from 'uuid';
import { transpileArduinoToJS } from './transpiler.js';

const _require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const APK_PUBLIC_DIR = path.join(__dirname, 'public', 'apks');
const CACHE_DIR = path.join(__dirname, 'cache');
const LOGS_DIR = path.join(__dirname, 'logs');

fs.mkdirSync(APK_PUBLIC_DIR, { recursive: true });
fs.mkdirSync(CACHE_DIR, { recursive: true });
fs.mkdirSync(LOGS_DIR, { recursive: true });

// Firmware cache eviction: keep under 500 MB or 1000 files
const CACHE_MAX_SIZE = 500 * 1024 * 1024;
const CACHE_MAX_FILES = 1000;
function evictCache() {
  try {
    const files = fs.readdirSync(CACHE_DIR)
      .filter(f => f.endsWith('.bin') || f.endsWith('.json'))
      .map(f => {
        const p = path.join(CACHE_DIR, f);
        try { return { name: f, path: p, size: fs.statSync(p).size, mtime: fs.statSync(p).mtimeMs }; }
        catch { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => a.mtime - b.mtime);
    let totalSize = files.reduce((s, f) => s + f.size, 0);
    while ((totalSize > CACHE_MAX_SIZE || files.length > CACHE_MAX_FILES) && files.length > 2) {
      const oldest = files.shift();
      try {
        const jsonPath = oldest.name.replace(/\.bin$/, '.json');
        const binPath = oldest.name;
        const jsonFull = path.join(CACHE_DIR, jsonPath);
        const binFull = path.join(CACHE_DIR, binPath);
        if (fs.existsSync(jsonFull)) { totalSize -= fs.statSync(jsonFull).size; fs.rmSync(jsonFull, { force: true }); }
        if (fs.existsSync(binFull)) { totalSize -= fs.statSync(binFull).size; fs.rmSync(binFull, { force: true }); }
      } catch {}
    }
  } catch {}
}
setInterval(evictCache, 30 * 60 * 1000).unref();

const logFilePath = path.join(LOGS_DIR, 'access.log');

// Realtime logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLine = `[${timestamp}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Duration: ${duration}ms\n`;
    
    // Output to server console for realtime streaming
    console.log(logLine.trim());
    
    // Write to logs folder in server
    try {
      if (fs.existsSync(logFilePath)) {
        const stats = fs.statSync(logFilePath);
        if (stats.size > 5 * 1024 * 1024) { // 5MB limit
          const oldLogPath = path.join(LOGS_DIR, 'access.old.log');
          if (fs.existsSync(oldLogPath)) fs.rmSync(oldLogPath, { force: true });
          fs.renameSync(logFilePath, oldLogPath);
        }
      }
      fs.appendFileSync(logFilePath, logLine);
    } catch (err) {
      console.error('[LOGGER ERROR] Failed to write to log file:', err);
    }
  });
  
  next();
});

app.use('/apks', express.static(APK_PUBLIC_DIR));

function sanitizeApkName(name) {
  return (name || 'MyApp').replace(/[^a-zA-Z0-9]/g, '') || 'MyApp';
}

let isInitialized = true; // Initialize to true by default to avoid blocking compile requests on start
let esp32CoreReady = false;
let cachedCliVersion = null;

async function getCliVersion() {
  if (cachedCliVersion) return cachedCliVersion;
  try {
    const { stdout } = await runCLI(['version', '--format', 'json']);
    const parsed = JSON.parse(stdout || '{}');
    cachedCliVersion = parsed.VersionString || parsed.version || stdout.trim().split('\n')[0];
  } catch (err) {
    cachedCliVersion = 'unknown';
  }
  return cachedCliVersion;
}


function getCliPath() {
  if (process.env.ARDUINO_CLI_PATH) return process.env.ARDUINO_CLI_PATH;

  const bundledLocal = path.join(__dirname, 'arduino-cli', process.platform === 'win32' ? 'arduino-cli.exe' : 'arduino-cli');
  if (fs.existsSync(bundledLocal)) return bundledLocal;

  const bundledParent = path.join(__dirname, '..', 'arduino-cli', process.platform === 'win32' ? 'arduino-cli.exe' : 'arduino-cli');
  if (fs.existsSync(bundledParent)) return bundledParent;

  return process.platform === 'win32' ? 'arduino-cli.exe' : 'arduino-cli';
}

const CLI_PATH = getCliPath();

const CLI_CONFIG = (() => {
  const bundledLocal = path.join(__dirname, 'arduino-cli.yaml');
  if (fs.existsSync(bundledLocal)) return bundledLocal;
  const bundledParent = path.join(__dirname, '..', 'arduino-cli', 'arduino-cli.yaml');
  if (fs.existsSync(bundledParent)) return bundledParent;
  return null;
})();

const FORGE_LIB_LIBRARIES = (() => {
  const dataLocal = path.join(__dirname, 'arduino-cli', 'data', 'libraries');
  if (fs.existsSync(dataLocal)) return dataLocal;

  const bundledLocal = path.join(__dirname, 'forge-lib', 'libraries');
  if (fs.existsSync(bundledLocal)) return bundledLocal;

  const bundledParent = path.join(__dirname, '..', 'forge-lib', 'libraries');
  if (fs.existsSync(bundledParent)) return bundledParent;

  if (process.platform === 'linux') {
    const linuxUser = path.join(os.homedir(), 'Arduino', 'libraries');
    if (fs.existsSync(linuxUser)) return linuxUser;
  }

  return null;
})();

const FORGE_USER_DIR = FORGE_LIB_LIBRARIES ? path.dirname(FORGE_LIB_LIBRARIES) : null;

console.log(`[SERVER] arduino-cli: ${CLI_PATH}`);
console.log(`[SERVER] config:      ${CLI_CONFIG || '(default)'}`);
console.log(`[SERVER] libraries:   ${FORGE_LIB_LIBRARIES || '(none)'}`);

function runCLI(args, timeoutMs = 120_000) {
  return new Promise((resolve) => {
    const cliArgs = CLI_CONFIG ? ['--config-file', CLI_CONFIG, ...args] : args;
    const proc = spawn(CLI_PATH, cliArgs, { env: { ...process.env } });
    proc.unref();
    let stdout = '', stderr = '';
    let settled = false;
    const done = (result) => { if (!settled) { settled = true; resolve(result); } };
    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      done({ stdout, stderr: `[TIMEOUT] Process killed after ${timeoutMs}ms\n${stderr}`, code: -1 });
    }, timeoutMs);
    timer.unref();
    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });
    proc.on('close', code => { clearTimeout(timer); done({ stdout, stderr, code }); });
    proc.on('error', err => { clearTimeout(timer); done({ stdout: '', stderr: err.message, code: -1 }); });
  });
}

function runCommand(cmd, timeoutMs = 60_000) {
  return new Promise((resolve, reject) => {
    console.log(`[EXEC] ${cmd}`);
    const proc = spawn('cmd.exe', ['/c', cmd], {
      shell: true,
      env: { ...process.env },
    });
    proc.unref();
    let stdout = '', stderr = '';
    let settled = false;
    const done = (err, result) => { if (!settled) { settled = true; err ? reject(err) : resolve(result); } };
    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      done(new Error(`[TIMEOUT] Command killed after ${timeoutMs}ms\n${stderr || stdout}`));
    }, timeoutMs);
    timer.unref();
    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });
    proc.on('close', code => {
      clearTimeout(timer);
      if (code === 0) done(null, { stdout, stderr });
      else done(new Error(stderr || stdout || `Exit code ${code}`));
    });
    proc.on('error', err => { clearTimeout(timer); done(err); });
  });
}

async function initCores() {
  console.log('[SERVER] Initializing arduino cores...');
  try {
    // Cache CLI version at startup to avoid spawning on /health requests
    await getCliVersion();

    const { stdout } = await runCLI(['core', 'list', '--format', 'json']);
    let data;
    try { data = JSON.parse(stdout || '[]'); } catch { data = []; }
    const cores = Array.isArray(data) ? data : [];

    const hasAvr = cores.some(c =>
      (c.id && c.id.startsWith('arduino:avr')) ||
      (c.platform?.id && c.platform.id.startsWith('arduino:avr'))
    );

    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

    if (!hasAvr) {
      if (isProduction) {
        console.warn('[SERVER] Warning: arduino:avr core is missing but skipping auto-installation in production/Render environment.');
      } else {
        console.log('[SERVER] Installing arduino:avr core...');
        await runCLI(['core', 'update-index']);
        await runCLI(['core', 'install', 'arduino:avr']);
      }
    }

    const hasEsp32 = cores.some(c =>
      (c.id && c.id.startsWith('esp32:')) ||
      (c.platform?.id && c.platform.id.startsWith('esp32:'))
    );

    if (!hasEsp32) {
      if (isProduction) {
        console.warn('[SERVER] Warning: esp32:esp32 core is missing but skipping auto-installation in production/Render environment.');
        esp32CoreReady = false;
      } else {
        console.log('[SERVER] Installing esp32:esp32 core (may take a few minutes)...');
        await runCLI(['core', 'update-index', '--additional-urls', 'https://dl.espressif.com/dl/package_esp32_index.json']);
        const { code } = await runCLI(['core', 'install', 'esp32:esp32', '--additional-urls', 'https://dl.espressif.com/dl/package_esp32_index.json']);
        esp32CoreReady = code === 0;
      }
    } else {
      esp32CoreReady = true;
    }

    console.log('[SERVER] Core initialization complete');
  } catch (e) {
    console.warn('[SERVER] Core init warning:', e.message);
  }
}

async function ensureESP32Core() {
  if (esp32CoreReady) return true;
  try {
    const { stdout, code } = await runCLI(['core', 'list', '--format', 'json']);
    if (code !== 0) throw new Error('core list failed');
    const cores = JSON.parse(stdout || '[]');
    const installed = Array.isArray(cores) && cores.some(c =>
      (c.id && c.id.startsWith('esp32:')) ||
      (c.platform?.id && c.platform.id.startsWith('esp32:'))
    );
    if (installed) { esp32CoreReady = true; return true; }

    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
    if (isProduction) {
      console.warn('[SERVER] ESP32 core is not installed. Skipping auto-installation in production/Render.');
      return false;
    }

    console.log('[SERVER] Installing ESP32 core (first run)...');
    const { code: ic } = await runCLI([
      'core', 'install', 'esp32:esp32',
      '--additional-urls', 'https://dl.espressif.com/dl/package_esp32_index.json',
    ]);
    esp32CoreReady = ic === 0;
    return esp32CoreReady;
  } catch (e) {
    console.error('[SERVER] ensureESP32Core error:', e.message);
    return false;
  }
}

function migrateESP32LedcAPI(code) {
  const chMap = new Map();
  for (const m of code.matchAll(/ledcSetup\s*\(\s*(\w+)\s*,\s*([^,]+?)\s*,\s*([^)]+?)\s*\)/g)) {
    const [, ch, freq, res] = m;
    const e = chMap.get(ch) ?? { freq: freq.trim(), res: res.trim(), pin: '' };
    e.freq = freq.trim(); e.res = res.trim(); chMap.set(ch, e);
  }
  for (const m of code.matchAll(/ledcAttachPin\s*\(\s*([^,]+?)\s*,\s*(\w+)\s*\)/g)) {
    const [, pin, ch] = m;
    const e = chMap.get(ch) ?? { freq: '5000', res: '8', pin: '' };
    e.pin = pin.trim(); chMap.set(ch, e);
  }
  if (chMap.size === 0) return code;
  let result = code;
  result = result.replace(/[ \t]*ledcSetup\s*\([^)]*\)\s*;[ \t]*\n?/g, '');
  result = result.replace(/[ \t]*ledcAttachPin\s*\([^)]*\)\s*;[ \t]*\n?/g, '');
  const attachCalls = [...chMap.entries()]
    .filter(([, v]) => v.pin)
    .map(([, v]) => `  ledcAttach(${v.pin}, ${v.freq}, ${v.res});`)
    .join('\n');
  if (attachCalls) result = result.replace(/(void\s+setup\s*\(\s*\)\s*\{)/, `$1\n${attachCalls}`);
  result = result.replace(/ledcWrite\s*\(\s*(\w+)\s*,\s*([^)]+)\s*\)/g, (match, ch, duty) => {
    const e = chMap.get(ch);
    return e?.pin ? `ledcWrite(${e.pin}, ${duty.trim()})` : match;
  });
  return result;
}

function binToIntelHex(buf) {
  const RECORD_SIZE = 16;
  let hex = '';
  for (let offset = 0; offset < buf.length; offset += RECORD_SIZE) {
    const chunk = buf.slice(offset, Math.min(offset + RECORD_SIZE, buf.length));
    const len = chunk.length;
    const addr = offset & 0xFFFF;
    if (offset > 0 && (offset & 0xFFFF) === 0) {
      const seg = (offset >> 16) & 0xFFFF;
      const hi = (seg >> 8) & 0xFF, lo = seg & 0xFF;
      const ck = (0x100 - ((2 + 4 + hi + lo) & 0xFF)) & 0xFF;
      hex += `:02000004${hi.toString(16).padStart(2, '0').toUpperCase()}${lo.toString(16).padStart(2, '0').toUpperCase()}${ck.toString(16).padStart(2, '0').toUpperCase()}\n`;
    }
    let sum = len + ((addr >> 8) & 0xFF) + (addr & 0xFF);
    let data = '';
    for (let i = 0; i < len; i++) { sum += chunk[i]; data += chunk[i].toString(16).padStart(2, '0').toUpperCase(); }
    const checksum = (0x100 - (sum & 0xFF)) & 0xFF;
    hex += `:${len.toString(16).padStart(2, '0').toUpperCase()}${addr.toString(16).padStart(4, '0').toUpperCase()}00${data}${checksum.toString(16).padStart(2, '0').toUpperCase()}\n`;
  }
  hex += ':00000001FF\n';
  return hex;
}

// ─── POST /build-apk ──────────────────────────────────────────
app.post('/build-apk', async (req, res) => {
  const project = req.body;
  if (!project || typeof project !== 'object') {
    return res.status(400).json({ success: false, error: 'No project data provided' });
  }

  try {
    const buildPath = path.join(__dirname, '..', 'src', 'creova', 'apk', 'buildAPK.js');
    console.log(`[APK] buildPath: ${buildPath}`);
    console.log(`[APK] buildPath exists: ${fs.existsSync(buildPath)}`);
    console.log(`[APK] __dirname: ${__dirname}`);

    let builder;
    if (fs.existsSync(buildPath)) {
      const ApkBuilder = _require(buildPath);
      builder = new ApkBuilder();
      console.log(`[APK] builder loaded: ${typeof builder.build === 'function'}`);
    } else {
      console.log(`[APK] buildAPK.js NOT FOUND at ${buildPath}`);
      console.log(`[APK] Checking alternatives...`);
      const alt1 = path.join(__dirname, '..', '..', 'src', 'creova', 'apk', 'buildAPK.js');
      const alt2 = path.join(__dirname, 'apk', 'buildAPK.js');
      console.log(`[APK] alt1: ${alt1} exists: ${fs.existsSync(alt1)}`);
      console.log(`[APK] alt2: ${alt2} exists: ${fs.existsSync(alt2)}`);
    }

    if (!builder || typeof builder.build !== 'function') {
      // Cloud server: simulate build so the frontend doesn't get a 501 error
      const logs = [
        '[10%] Cloud APK builder not available on this server.',
        '[30%] APK builds require the local LeapBlocks server or Electron app.',
        '[50%] Install the desktop app or start the local server on port 3001.',
        '[100%] Build simulation complete — no APK was generated.',
      ];
      return res.json({
        success: false,
        error: 'APK building is not available on the cloud server. Use the local LeapBlocks server (port 3001) or the Electron Desktop app.',
        logs,
        cloudBuildUnsupported: true,
      });
    }

    const logs = [];
    const outputPath = await builder.build(project, ({ progress, message }) => {
      if (message) {
        const prefix = progress !== undefined ? `[${progress}%] ` : '';
        logs.push(`${prefix}${message}`);
        console.log(`[APK] ${prefix}${message}`);
      }
    });

    const apkName = `${sanitizeApkName(project.appName)}.apk`;
    const publicPath = path.join(APK_PUBLIC_DIR, apkName);
    fs.mkdirSync(APK_PUBLIC_DIR, { recursive: true });

    if (fs.existsSync(outputPath)) {
      fs.copyFileSync(outputPath, publicPath);
    }

    return res.json({
      success: true,
      downloadUrl: `/apks/${apkName}`,
      outputPath: publicPath,
      logs,
    });
  } catch (err) {
    console.error('[APK] build failed:', err);
    return res.status(500).json({
      success: false,
      error: err.message || String(err),
    });
  }
});

// ─── POST /build (APK build job) ──────────────────────────────
const jobs = new Map();

// Auto-cleanup: purge stale jobs every 5 minutes
const JOB_TTL_MS = 60 * 60 * 1000;       // 1 hour max age regardless of status
const JOB_DONE_TTL_MS = 5 * 60 * 1000;   // 5 minutes after completion/error
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs) {
    const age = now - new Date(job.createdAt).getTime();
    if (age > JOB_TTL_MS) {
      console.log(`[CLEANUP] Removing stale job ${id} (age ${Math.round(age / 1000)}s)`);
      jobs.delete(id);
      continue;
    }
    if ((job.status === 'done' || job.status === 'error') && age > JOB_DONE_TTL_MS) {
      console.log(`[CLEANUP] Removing completed job ${id} (age ${Math.round(age / 1000)}s)`);
      if (job.apkPath) {
        try { fs.rmSync(job.apkPath, { force: true }); } catch {}
      }
      jobs.delete(id);
    }
  }
}, 5 * 60 * 1000).unref();

let builderModule = null;
async function getBuilder() {
  if (!builderModule) {
    const bPath = path.join(__dirname, '..', 'src', 'studio', 'engine', 'localBuilder.js');
    if (fs.existsSync(bPath)) {
      builderModule = await import(`file://${bPath.replace(/\\/g, '/')}`);
    }
  }
  return builderModule;
}

app.post('/build', async (req, res) => {
  try {
    const { project } = req.body;
    if (!project) return res.status(400).json({ error: 'No project data' });

    const jobId = uuidv4();
    const job = {
      id: jobId,
      status: 'queued',
      progress: 0,
      logs: [],
      apkPath: null,
      error: null,
      createdAt: new Date().toISOString(),
    };
    jobs.set(jobId, job);

    const builder = await getBuilder();
    if (builder && typeof builder.build === 'function') {
      builder.build(jobId, project).catch(err => {
        const j = jobs.get(jobId);
        if (j) { j.status = 'error'; j.error = err.message; }
      });
    } else {
      job.status = 'building';
      simulateBuild(job, project);
    }

    res.json({ jobId, message: 'Build started' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/status/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.get('/download/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job || !job.apkPath) {
    return res.status(404).json({ error: 'APK not found' });
  }
  if (!fs.existsSync(job.apkPath)) {
    return res.status(404).json({ error: 'APK file missing' });
  }
  res.download(job.apkPath, `${sanitizeApkName(job.projectName || 'App')}.apk`);
});

app.delete('/job/:jobId', async (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (job && job.apkPath) {
    try { fs.rmSync(job.apkPath, { force: true }); } catch {}
  }
  jobs.delete(req.params.jobId);
  res.json({ deleted: true });
});

function simulateBuild(job, project) {
  if (project.appName) job.projectName = project.appName;
  const steps = [
    { progress: 10, msg: 'Decoding base APK...', delay: 1000 },
    { progress: 25, msg: 'Editing AndroidManifest...', delay: 800 },
    { progress: 40, msg: 'Injecting user assets...', delay: 1200 },
    { progress: 55, msg: 'Injecting feature modules...', delay: 1500 },
    { progress: 70, msg: 'Repacking APK...', delay: 2000 },
    { progress: 85, msg: 'Signing APK...', delay: 1500 },
    { progress: 100, msg: 'Build complete!', delay: 500 },
  ];

  let i = 0;
  const next = () => {
    if (i >= steps.length) {
      job.status = 'done';
      const apkName = `${sanitizeApkName(project.appName || 'App')}.apk`;
      job.apkPath = path.join(APK_PUBLIC_DIR, apkName);
      if (!fs.existsSync(job.apkPath)) {
        const placeholder = path.join(APK_PUBLIC_DIR, 'placeholder.apk');
        fs.writeFileSync(placeholder, `Placeholder APK for ${project.appName || 'App'}`);
        if (!fs.existsSync(job.apkPath)) job.apkPath = placeholder;
      }
      return;
    }
    const step = steps[i++];
    job.progress = step.progress;
    job.logs.push({ message: step.msg, type: 'info' });
    job.status = step.progress < 100 ? 'building' : 'done';
    setTimeout(next, step.delay);
  };
  next();
}

// ─── POST /compile ────────────────────────────────────────────
app.post('/compile', async (req, res) => {
  const { code, board = 'arduino:avr:uno', libraries = '' } = req.body;
  if (!code) return res.status(400).json({ success: false, errors: 'No code provided' });

  if (!isInitialized) {
    return res.status(503).json({ success: false, errors: ['Server is still initializing. Please wait.'] });
  }

  const isESP32 = board.startsWith('esp32:');
  const tempId = uuidv4();
  const tempDir = path.join(os.tmpdir(), `electra_${tempId}`);
  const sketchDir = path.join(tempDir, 'sketch');
  const sketchPath = path.join(sketchDir, 'sketch.ino');

  try {
    fs.mkdirSync(sketchDir, { recursive: true });

    let processedCode = code;
    if (isESP32) {
      processedCode = processedCode.replace(/#include\s*[<"]Servo\.h[>"]/g, '#include <ESP32Servo.h>');
      processedCode = migrateESP32LedcAPI(processedCode);
      const coreOk = await ensureESP32Core();
      if (!coreOk) {
        return res.json({ success: false, errors: 'ESP32 core not available on this server' });
      }
    }

    fs.writeFileSync(sketchPath, processedCode);

    const cliArgs = ['compile', '--fqbn', board, '--output-dir', tempDir];

    if (!isESP32 && FORGE_LIB_LIBRARIES) {
      cliArgs.push('--libraries', FORGE_LIB_LIBRARIES);
    }
    if (libraries) {
      const libList = Array.isArray(libraries) ? libraries : libraries.split(',').map(l => l.trim());
      for (const lib of libList) {
        if (!lib) continue;
        const libPath = path.resolve(lib);
        if (fs.existsSync(libPath)) {
          cliArgs.push('--libraries', libPath);
        }
      }
    }

    cliArgs.push(sketchDir);

    const { stdout, stderr, code: exitCode } = await runCLI(cliArgs);

    if (exitCode !== 0) {
      return res.json({ success: false, errors: stderr || stdout || `Exit code ${exitCode}` });
    }

    const files = fs.readdirSync(tempDir);

    if (isESP32) {
      const binFile = files.find(f => f === 'sketch.ino.bin')
        ?? files.find(f => f.endsWith('.bin') && !f.includes('bootloader') && !f.includes('partition'));
      if (!binFile) {
        return res.json({ success: false, errors: `No .bin found. Files: ${files.join(', ')}` });
      }
      const rawBin = fs.readFileSync(path.join(tempDir, binFile));
      const hexContent = binToIntelHex(rawBin);
      return res.json({ success: true, hex: hexContent, binBase64: rawBin.toString('base64') });
    } else {
      const hexFile = files.find(f => f.endsWith('.hex'));
      if (!hexFile) {
        return res.json({ success: false, errors: `No .hex found. Files: ${files.join(', ')}` });
      }
      const hexContent = fs.readFileSync(path.join(tempDir, hexFile), 'utf-8');
      return res.json({ success: true, hex: hexContent });
    }
  } catch (err) {
    return res.json({ success: false, errors: err.message });
  } finally {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
  }
});

// ─── POST /compile/esp32 (with SHA-256 caching) ───────────────
app.post('/compile/esp32', async (req, res) => {
  const { code, board = 'esp32:esp32:esp32c3', libraries = '' } = req.body;
  if (!code) return res.status(400).json({ success: false, errors: 'No code provided' });

  const hash = crypto.createHash('sha256')
    .update(code + board + libraries)
    .digest('hex');

  const binPath = path.join(CACHE_DIR, `${hash}.bin`);
  const metaPath = path.join(CACHE_DIR, `${hash}.json`);

  if (fs.existsSync(binPath) && fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      const buffer = fs.readFileSync(binPath);
      console.log(`[SERVER] Cache HIT for firmware ID: ${hash}`);
      return res.json({
        success: true, id: hash, binBase64: buffer.toString('base64'),
        size: buffer.length, hash, cached: true, metadata: meta
      });
    } catch {
      console.log('[SERVER] Cache read error, rebuilding');
    }
  }

  console.log(`[SERVER] Cache MISS, compiling for firmware ID: ${hash}`);
  const tempId = uuidv4();
  const tempDir = path.join(os.tmpdir(), `electra_${tempId}`);
  const sketchDir = path.join(tempDir, 'sketch');
  const sketchPath = path.join(sketchDir, 'sketch.ino');

  try {
    fs.mkdirSync(sketchDir, { recursive: true });

    let processedCode = code;
    processedCode = processedCode.replace(/#include\s*[<"]Servo\.h[>"]/g, '#include <ESP32Servo.h>');
    processedCode = migrateESP32LedcAPI(processedCode);

    const coreOk = await ensureESP32Core();
    if (!coreOk) {
      return res.json({ success: false, errors: 'ESP32 core not available on this server' });
    }

    fs.writeFileSync(sketchPath, processedCode);

    const cliArgs = ['compile', '--fqbn', board, '--output-dir', tempDir];

    if (libraries) {
      const libList = Array.isArray(libraries) ? libraries : libraries.split(',').map(l => l.trim());
      for (const lib of libList) {
        if (!lib) continue;
        const libPath = path.resolve(lib);
        if (fs.existsSync(libPath)) {
          cliArgs.push('--libraries', libPath);
        }
      }
    }

    cliArgs.push(sketchDir);

    const { stdout, stderr, code: exitCode } = await runCLI(cliArgs);

    if (exitCode !== 0) {
      return res.json({ success: false, errors: stderr || stdout || `Exit code ${exitCode}` });
    }

    const files = fs.readdirSync(tempDir);
    const binFile = files.find(f => f === 'sketch.ino.bin')
      ?? files.find(f => f.endsWith('.bin') && !f.includes('bootloader') && !f.includes('partition'));

    if (!binFile) {
      return res.json({ success: false, errors: `No .bin found. Files: ${files.join(', ')}` });
    }

    const binBuffer = fs.readFileSync(path.join(tempDir, binFile));

    fs.writeFileSync(binPath, binBuffer);
    const metadata = { id: hash, board, compiledAt: new Date().toISOString(), size: binBuffer.length, hash };
    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
    evictCache();

    return res.json({
      success: true, id: hash, binBase64: binBuffer.toString('base64'),
      size: binBuffer.length, hash, cached: false, metadata
    });
  } catch (err) {
    return res.json({ success: false, errors: err.message });
  } finally {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
  }
});

// ─── GET /firmware/:id ────────────────────────────────────────
app.get('/firmware/:id', (req, res) => {
  const id = req.params.id;
  if (!/^[a-f0-9]{64}$/.test(id)) {
    return res.status(400).json({ error: 'Invalid firmware ID format' });
  }
  const binPath = path.join(CACHE_DIR, `${id}.bin`);
  if (!fs.existsSync(binPath)) {
    return res.status(404).json({ error: 'Firmware not found' });
  }
  res.setHeader('Content-Type', 'application/octet-stream');
  res.sendFile(binPath);
});

// ─── POST /transpile ──────────────────────────────────────────
app.post('/transpile', async (req, res) => {
  const { code, board = 'esp32:esp32:esp32c3' } = req.body;
  if (!code) return res.status(400).json({ success: false, errors: 'No code provided' });

  // Optional: validate by compiling first (from Electra server)
  if (isInitialized && process.env.VALIDATE_TRANSPILE !== 'false') {
    const sketchId = `transpile_${Date.now()}`;
    const sketchDir = path.join(os.tmpdir(), 'electra', sketchId);
    const sketchFile = path.join(sketchDir, `${sketchId}.ino`);
    try {
      fs.mkdirSync(sketchDir, { recursive: true });
      fs.writeFileSync(sketchFile, code, 'utf8');
      const cliArgs = ['compile', '--fqbn', board, '--output-dir', sketchDir, sketchDir];
      const { code: exitCode, stderr } = await runCLI(cliArgs);
      if (exitCode !== 0) {
        return res.json({ success: false, errors: stderr || 'Compilation validation failed' });
      }
    } catch (err) {
      return res.json({ success: false, errors: err.message });
    } finally {
      try { if (fs.existsSync(sketchDir)) fs.rmSync(sketchDir, { recursive: true, force: true }); } catch {}
    }
  }

  try {
    const jsCode = transpileArduinoToJS(code);
    return res.json({ success: true, jsCode });
  } catch (err) {
    return res.json({ success: false, errors: err.message });
  }
});

// ─── Library Management ───────────────────────────────────────

// GET /libraries/search — Search for libraries (from Electra server)
app.get('/libraries/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);
  try {
    const args = ['lib', 'search', query, '--format', 'json'];
    if (CLI_CONFIG) args.splice(1, 0, '--config-file', CLI_CONFIG);
    const { stdout } = await runCLI(args);
    const data = JSON.parse(stdout || '{}');
    const libs = (data.libraries || []).slice(0, 20).map(l => ({
      name: l.name,
      author: l.latest?.author?.name || '',
      description: l.latest?.sentence || '',
      version: l.latest?.version || '',
    }));
    res.json(libs);
  } catch {
    res.json([]);
  }
});

// GET /libraries/installed — List installed libraries
app.get('/libraries/installed', async (req, res) => {
  if (!FORGE_LIB_LIBRARIES || !fs.existsSync(FORGE_LIB_LIBRARIES)) {
    return res.json([]);
  }
  try {
    const entries = fs.readdirSync(FORGE_LIB_LIBRARIES, { withFileTypes: true });
    const libs = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const libDir = path.join(FORGE_LIB_LIBRARIES, entry.name);
      const propFile = path.join(libDir, 'library.properties');
      if (fs.existsSync(propFile)) {
        const props = {};
        fs.readFileSync(propFile, 'utf-8').split('\n').forEach(line => {
          const [k, ...v] = line.split('=');
          if (k && v.length) props[k.trim()] = v.join('=').trim();
        });
        libs.push({ name: props.name || entry.name, version: props.version || '?', author: props.author || '', description: props.sentence || '' });
      } else {
        libs.push({ name: entry.name, version: '?', author: '', description: '' });
      }
    }
    res.json(libs);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /libraries/install — Install a library
app.post('/libraries/install', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Library name required' });

  console.log(`[SERVER] Installing library: ${name}`);
  if (FORGE_LIB_LIBRARIES) fs.mkdirSync(FORGE_LIB_LIBRARIES, { recursive: true });

  const { stdout, stderr, code } = await runCLI(['lib', 'install', name]);
  if (code === 0) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false, error: stderr || stdout || 'Installation failed' });
  }
});

// DELETE /libraries/remove — Remove a library
app.delete('/libraries/remove', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Library name required' });

  console.log(`[SERVER] Removing library: ${name}`);

  const { code, stderr, stdout } = await runCLI(['lib', 'uninstall', name]);

  let manualRemoved = false;
  if (FORGE_LIB_LIBRARIES && fs.existsSync(FORGE_LIB_LIBRARIES)) {
    try {
      const entries = fs.readdirSync(FORGE_LIB_LIBRARIES, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const libDir = path.join(FORGE_LIB_LIBRARIES, entry.name);
        let match = (entry.name === name);
        if (!match) {
          const propFile = path.join(libDir, 'library.properties');
          if (fs.existsSync(propFile)) {
            const props = fs.readFileSync(propFile, 'utf-8').split('\n').reduce((acc, line) => {
              const [k, ...v] = line.split('=');
              if (k && v.length) acc[k.trim()] = v.join('=').trim();
              return acc;
            }, {});
            if (props.name === name) match = true;
          }
        }
        if (match) {
          fs.rmSync(libDir, { recursive: true, force: true });
          manualRemoved = true;
        }
      }
    } catch {}
  }

  if (code === 0 || manualRemoved) {
    res.json({ success: true, manualRemoved });
  } else {
    res.status(500).json({ success: false, error: stderr || stdout || 'Removal failed' });
  }
});

// ─── GET /logs ────────────────────────────────────────────────
app.get('/logs', (req, res) => {
  const logFilePath = path.join(__dirname, 'logs', 'access.log');
  
  if (req.query.download === 'true') {
    if (!fs.existsSync(logFilePath)) {
      return res.status(404).send('No logs available yet.');
    }
    return res.download(logFilePath, 'access.log');
  }
  
  if (!fs.existsSync(logFilePath)) {
    return res.send('No logs available yet.');
  }

  try {
    const logsContent = fs.readFileSync(logFilePath, 'utf8');
    const lines = logsContent.trim().split('\n');
    const limit = parseInt(req.query.limit, 10) || 200;
    const lastLines = lines.slice(-limit).join('\n');
    
    res.setHeader('Content-Type', 'text/plain');
    res.send(lastLines);
  } catch (err) {
    res.status(500).send(`Error reading logs: ${err.message}`);
  }
});

// ─── POST /relay — HTTP relay for CORS-restricted local requests ──
// Forwards HTTP requests server-side to bypass browser CORS / Mixed Content
// restrictions. Used by the Electra ESP32 simulator and Creova Web component
// to reach local network devices (e.g. ESP32 at 192.168.x.x).
app.post('/relay', async (req, res) => {
  const { url: targetUrl, method = 'GET', headers: reqHeaders = {}, body: reqBody } = req.body;
  if (!targetUrl) {
    return res.status(400).json({ success: false, error: 'No target URL provided' });
  }

  // Security: only allow HTTP/HTTPS URLs to private/local IPs
  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid URL' });
  }

  const host = parsed.hostname;
  const isPrivate = (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    /^192\.168\./.test(host) ||
    /^10\./.test(host) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
  );

  if (!isPrivate) {
    return res.status(403).json({ success: false, error: 'Relay only allowed for private/local network addresses' });
  }

  console.log(`[RELAY] ${method} ${targetUrl}`);

  try {
    const httpModule = parsed.protocol === 'https:' ? await import('https') : await import('http');
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: method.toUpperCase(),
      headers: { ...reqHeaders },
      timeout: 10000,
    };

    // Remove host header if present (Node sets it automatically)
    delete options.headers['Host'];
    delete options.headers['host'];

    const proxyRes = await new Promise((resolve, reject) => {
      const r = httpModule.default.request(options, (response) => {
        let data = '';
        response.on('data', chunk => { data += chunk; });
        response.on('end', () => {
          resolve({
            status: response.statusCode,
            statusText: response.statusMessage,
            headers: response.headers,
            body: data,
          });
        });
      });
      r.on('error', reject);
      r.on('timeout', () => { r.destroy(); reject(new Error('Request timed out')); });

      if (reqBody && method !== 'GET' && method !== 'HEAD') {
        r.write(typeof reqBody === 'string' ? reqBody : JSON.stringify(reqBody));
      }
      r.end();
    });

    // Return the proxied response
    res.json({
      success: true,
      status: proxyRes.status,
      statusText: proxyRes.statusText,
      headers: proxyRes.headers,
      body: proxyRes.body,
    });
  } catch (err) {
    console.error(`[RELAY] Error: ${err.message}`);
    res.json({
      success: false,
      status: 0,
      error: err.message,
    });
  }
});
// ─── GET /health ──────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const cliVersion = await getCliVersion();

  const buildPath = path.join(__dirname, '..', 'src', 'creova', 'apk', 'buildAPK.js');
  const apkBuilderExists = fs.existsSync(buildPath);
  const toolsDir = path.join(__dirname, '..', 'tools');
  const toolsExist = fs.existsSync(toolsDir);

  res.json({
    status: 'ok',
    port: PORT,
    uptime: Math.floor(process.uptime()),
    arduinoCli: cliVersion,
    esp32CoreReady,
    initialized: isInitialized,
    jobCount: jobs.size,
    apkBuilderExists,
    toolsExist,
    buildPath,
    dirname: __dirname,
    endpoints: ['/compile', '/compile/esp32', '/transpile', '/build-apk', '/build', '/status/:jobId', '/download/:jobId', '/firmware/:id', '/libraries/search', '/libraries/installed', '/libraries/install', '/libraries/remove', '/job/:jobId', '/relay', '/logs', '/health'],
  });
});

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[LeapBlocks Server] Running on http://localhost:${PORT}`);
  console.log(`[LeapBlocks Server] arduino-cli: ${CLI_PATH}`);
  initCores().then(() => {
    if (!esp32CoreReady) {
      ensureESP32Core().then(ok => {
        console.log(`[LeapBlocks Server] ESP32 core: ${ok ? 'ready' : 'not installed'}`);
      });
    }
  });
});
