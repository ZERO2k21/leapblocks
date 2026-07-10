/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * Download-on-demand for Python 3.10.
 * Instead of bundling Python with the installer, we download the official
 * full Python installer on Windows and python-build-standalone on macOS/Linux.
 *
 * On Windows we download and silently run the full installer from python.org.
 * On macOS/Linux we use python-build-standalone (indygreg) which ships
 * a self-contained Python + pip.
 */
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { spawn, execFile } from 'child_process';
import { createWriteStream } from 'fs';
import * as https from 'https';
import * as http from 'http';

// ── Configuration ──────────────────────────────────────────────────────────
const PYTHON_VERSION = '3.10.11';

// Windows: full installer from python.org (~27 MB)
const WIN_INSTALLER_URL = `https://www.python.org/ftp/python/${PYTHON_VERSION}/python-${PYTHON_VERSION}-amd64.exe`;
// macOS/Linux: python-build-standalone from GitHub (~30 MB, includes pip)
const STANDALONE_BASE = 'https://github.com/indygreg/python-build-standalone/releases/download/20241016';

function getStandaloneFilename(): string {
  const platform = os.platform();
  const arch = os.arch();
  const archTag = arch === 'arm64' ? 'aarch64' : 'x86_64';

  if (platform === 'darwin') {
    return `cpython-${PYTHON_VERSION}+20241016-${archTag}-apple-darwin-install_only.tar.gz`;
  }
  // linux
  return `cpython-${PYTHON_VERSION}+20241016-${archTag}-unknown-linux-gnu-install_only.tar.gz`;
}

function getDownloadUrl(): string {
  if (os.platform() === 'win32') return WIN_INSTALLER_URL;
  return `${STANDALONE_BASE}/${getStandaloneFilename()}`;
}

// ── Cache paths ────────────────────────────────────────────────────────────

/**
 * Local cache directory for Python installer metadata.
 *   Windows: C:\Users\<user>\AppData\Roaming\leapblocks\python\
 *   macOS:   ~/Library/Application Support/leapblocks/python/
 *   Linux:   ~/.config/leapblocks/python/
 */
function getCacheDir(): string {
  try {
    const { app } = require('electron');
    if (app?.getPath) {
      return path.join(app.getPath('userData'), 'python');
    }
  } catch { /* not in Electron context */ }

  const platform = os.platform();
  if (platform === 'win32') {
    return path.join(os.homedir(), 'AppData', 'Roaming', 'leapblocks', 'python');
  } else if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'leapblocks', 'python');
  } else {
    return path.join(os.homedir(), '.config', 'leapblocks', 'python');
  }
}

/**
 * Full Python installs to a known location.
 *   Windows: %LOCALAPPDATA%\Programs\Python\Python310\python.exe
 *   macOS:   ~/Library/Application Support/leapblocks/python/bin/python3
 *   Linux:   ~/.config/leapblocks/python/bin/python3
 */
function getPythonBinaryPath(): string {
  if (os.platform() === 'win32') {
    // Full Python user-level install location
    const majorMinor = PYTHON_VERSION.slice(0, PYTHON_VERSION.lastIndexOf('.'));
    return path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', `Python${majorMinor.replace('.', '')}`, 'python.exe');
  }
  return path.join(getCacheDir(), 'bin', 'python3');
}

function getVersionFile(): string {
  return path.join(getCacheDir(), '.installed-version');
}

// ── Download helpers ───────────────────────────────────────────────────────

function downloadFile(url: string, destPath: string, onProgress?: (pct: number, mb: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = createWriteStream(destPath);

    protocol.get(url, { headers: { 'User-Agent': 'LeapBlocks/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        try { fs.unlinkSync(destPath); } catch {}
        return downloadFile(res.headers.location!, destPath, onProgress).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(destPath); } catch {}
        return reject(new Error(`Download failed: HTTP ${res.statusCode} from ${url}`));
      }

      const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
      let downloadedBytes = 0;
      let lastReportedPct = -1;

      res.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes > 0) {
          const pct = Math.round((downloadedBytes / totalBytes) * 100);
          // Only report every 5% to avoid flooding the terminal
          if (pct >= lastReportedPct + 5 || pct === 100) {
            const mb = (downloadedBytes / 1024 / 1024).toFixed(1);
            onProgress?.(pct, mb);
            lastReportedPct = pct;
          }
        }
      });

      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      try { fs.unlinkSync(destPath); } catch {}
      reject(err);
    });
  });
}

async function extractTarGz(tarPath: string, destDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    exec(`tar -xzf "${tarPath}" -C "${destDir}"`, (err: any) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

/**
 * Silently run the full Python installer on Windows.
 * Installs for the current user only (no admin required when elevation is allowed).
 */
function runWindowsInstaller(installerPath: string, onProgress?: (msg: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '/quiet',
      'InstallAllUsers=0',
      'PrependPath=1',
      'Include_pip=1',
      'Include_test=0',
      'Include_launcher=0',
      'Include_symbols=0',
      'Include_tcltk=1',
    ];
    onProgress?.('Running full Python installer...');
    const proc = spawn(installerPath, args, { shell: false, stdio: 'pipe' });
    let output = '';
    proc.stdout.on('data', (d) => { output += d.toString(); });
    proc.stderr.on('data', (d) => { output += d.toString(); });
    proc.on('close', (code) => {
      try { fs.unlinkSync(installerPath); } catch {}
      if (code === 0) {
        onProgress?.('Full Python installed successfully');
        resolve();
      } else {
        reject(new Error(`Python installer exited with code ${code}: ${output.slice(-300)}`));
      }
    });
    proc.on('error', (err) => {
      try { fs.unlinkSync(installerPath); } catch {}
      reject(err);
    });
  });
}

// ── Pip verification ────────────────────────────────────────────────────────
// Checks if pip is actually usable in the given Python installation.
async function verifyPip(pythonExe: string, onProgress?: (msg: string) => void): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const env = { ...process.env, PYTHONIOENCODING: 'utf-8' };
      const proc = spawn(pythonExe, ['-m', 'pip', '--version'], {
        shell: false, stdio: 'pipe', timeout: 15000, env,
      });
      let stdout = '';
      let stderr = '';
      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });
      proc.on('close', (code) => {
        const ok = code === 0 && (stdout.includes('pip') || stderr.includes('pip'));
        onProgress?.(`pip verify: code=${code}, stdout=${stdout.trim().slice(0, 100)}, stderr=${stderr.trim().slice(0, 100)}`);
        resolve(ok);
      });
      proc.on('error', () => { resolve(false); });
    } catch {
      resolve(false);
    }
  });
}

// ── Main API ───────────────────────────────────────────────────────────────

/**
 * Ensure Python 3.10 is available locally.
 * Checks in order:
 *   1. System PATH (user has Python 3.10+ installed)
 *   2. Previously installed full Python at the standard location
 *   3. Download from python.org / GitHub (first-time)
 *
 * Returns the absolute path to the python binary.
 */
export async function ensurePython(
  onProgress?: (msg: string) => void
): Promise<string> {
  const log = (msg: string) => {
    console.log(`[PYTHON] ${msg}`);
    onProgress?.(msg);
  };

  // ── 1. Check system PATH ─────────────────────────────────────────────────
  const systemPy = await checkSystemPython();
  if (systemPy) {
    log(`Found system Python: ${systemPy}`);
    return systemPy;
  }

  // ── 2. Check previously installed full Python ────────────────────────────
  const pythonExe = getPythonBinaryPath();
  if (fs.existsSync(pythonExe)) {
    log(`Using installed Python: ${pythonExe}`);
    return pythonExe;
  }

  // ── 3. Download ──────────────────────────────────────────────────────────
  log(`Python ${PYTHON_VERSION} not found. Downloading...`);

  const url = getDownloadUrl();
  log(`Download URL: ${url}`);

  const cacheDir = getCacheDir();
  fs.mkdirSync(cacheDir, { recursive: true });

  const isWin = os.platform() === 'win32';
  const archiveExt = isWin ? '.exe' : '.tar.gz';
  const archivePath = path.join(cacheDir, `python-${PYTHON_VERSION}-${os.arch()}${archiveExt}`);

  // Download with progress
  log('Downloading full Python (this may take a minute on first launch)...');
  await downloadFile(url, archivePath, (pct, mb) => {
    log(`Downloading: ${pct}% (${mb} MB)`);
  });
  log('Download complete.');

  // Install or extract
  if (isWin) {
    await runWindowsInstaller(archivePath, (msg) => log(msg));
  } else {
    log('Extracting...');
    const tmpExtract = path.join(cacheDir, '_extract');
    fs.mkdirSync(tmpExtract, { recursive: true });
    await extractTarGz(archivePath, tmpExtract);

    const pythonSubdir = path.join(tmpExtract, 'python');
    const target = fs.existsSync(pythonSubdir) ? pythonSubdir : tmpExtract;
    const entries = fs.readdirSync(target);
    for (const entry of entries) {
      const src = path.join(target, entry);
      const dst = path.join(cacheDir, entry);
      fs.renameSync(src, dst);
    }
    fs.rmSync(tmpExtract, { recursive: true, force: true });
    try { fs.unlinkSync(archivePath); } catch {}
  }

  // Auto-install essential packages (numpy, matplotlib)
  const packages = ['numpy', 'matplotlib'];
  for (const pkg of packages) {
    log(`Installing ${pkg}...`);
    const env = { ...process.env, PYTHONIOENCODING: 'utf-8' };
    await new Promise<void>((resolve) => {
      const proc = spawn(pythonExe, ['-m', 'pip', 'install', pkg], { cwd: cacheDir, shell: false, stdio: 'pipe', env });
      let output = '';
      proc.stdout.on('data', (d) => { output += d.toString(); });
      proc.stderr.on('data', (d) => { output += d.toString(); });
      proc.on('close', (code) => {
        if (code === 0) {
          log(`${pkg} installed successfully`);
        } else {
          log(`WARNING: ${pkg} install failed (exit code ${code}): ${output.slice(-200)}`);
        }
        resolve();
      });
      proc.on('error', () => { resolve(); });
    });
  }

  // Verify
  if (!fs.existsSync(pythonExe)) {
    throw new Error(
      `Python install succeeded but binary not found at ${pythonExe}. ` +
      `Contents of Python directory: ${fs.readdirSync(path.dirname(pythonExe)).join(', ')}`
    );
  }

  // Write version marker
  fs.writeFileSync(getVersionFile(), PYTHON_VERSION, 'utf-8');
  log(`Python ${PYTHON_VERSION} installed at: ${pythonExe}`);
  return pythonExe;
}

/**
 * Check if Python is available (fast, no download).
 * Returns the path or null.
 */
export function getPythonPathIfAvailable(): string | null {
  // System PATH — must be 3.10+
  const systemPy = checkSystemPythonSync();
  if (systemPy) return systemPy;

  // Cached
  const cached = getPythonBinaryPath();
  if (fs.existsSync(cached)) return cached;

  return null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function checkSystemPython(): Promise<string | null> {
  // Try python3 first, then python
  for (const cmd of ['python3', 'python']) {
    try {
      const version = await new Promise<string>((resolve, reject) => {
        execFile(cmd, ['--version'], { shell: true }, (err, stdout, stderr) => {
          const output = (stdout || stderr || '').trim();
          if (!err && output.includes('3.10')) {
            resolve(output);
          } else {
            reject(new Error('Not Python 3.10'));
          }
        });
      });
      return cmd;
    } catch { /* not found or wrong version */ }
  }
  return null;
}

function checkSystemPythonSync(): string | null {
  for (const cmd of ['python3', 'python']) {
    try {
      const output = require('child_process').execFileSync(cmd, ['--version'], {
        shell: true, stdio: 'pipe', timeout: 3000,
      }).toString().trim();
      if (output.includes('3.10')) return cmd;
    } catch { /* not found or wrong version */ }
  }
  return null;
}
