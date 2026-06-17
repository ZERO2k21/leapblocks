/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * Download-on-demand for Python 3.10.
 * Instead of bundling Python with the installer, we download the official
 * embeddable Python distribution on first use and cache it in userData.
 *
 * On Windows we use the official embeddable package from python.org.
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

// Windows: official embeddable package from python.org (~11 MB)
const WIN_EMBED_URL = `https://www.python.org/ftp/python/${PYTHON_VERSION}/python-${PYTHON_VERSION}-embed-amd64.zip`;
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
  if (os.platform() === 'win32') return WIN_EMBED_URL;
  return `${STANDALONE_BASE}/${getStandaloneFilename()}`;
}

// ── Cache paths ────────────────────────────────────────────────────────────

/**
 * Local cache directory for Python.
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

function getPythonBinaryPath(): string {
  if (os.platform() === 'win32') {
    return path.join(getCacheDir(), 'python.exe');
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

      res.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes > 0) {
          const pct = Math.round((downloadedBytes / totalBytes) * 100);
          const mb = (downloadedBytes / 1024 / 1024).toFixed(1);
          onProgress?.(pct, mb);
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

async function extractZip(zipPath: string, destDir: string): Promise<void> {
  const AdmZip = require('adm-zip');
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(destDir, true);
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

// ── Windows embeddable patching ────────────────────────────────────────────
// The official embeddable package disables pip/site by default.
// We need to:
//   1. Uncomment "import site" in python310._pth
//   2. Bootstrap pip via get-pip.py
async function patchWindowsEmbed(cacheDir: string, onProgress?: (msg: string) => void): Promise<void> {
  // Step 1: Enable site-packages in the .pth file
  const pthFile = path.join(cacheDir, `python${PYTHON_VERSION.replace('.', '')}._pth`);
  if (fs.existsSync(pthFile)) {
    let content = fs.readFileSync(pthFile, 'utf-8');
    content = content.replace(/^#\s*import\s+site/m, 'import site');
    fs.writeFileSync(pthFile, content, 'utf-8');
    onProgress?.('Enabled site-packages in embeddable Python');
  }

  // Step 2: Bootstrap pip — download get-pip.py and run it
  const pythonExe = path.join(cacheDir, 'python.exe');
  const get_pip_path = path.join(cacheDir, 'get-pip.py');

  await new Promise<void>((resolve, reject) => {
    const file = createWriteStream(get_pip_path);
    https.get('https://bootstrap.pypa.io/get-pip.py', (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        file.close();
        https.get(res.headers.location!, (res2) => {
          res2.pipe(createWriteStream(get_pip_path)).on('finish', () => resolve());
        }).on('error', reject);
        return;
      }
      res.pipe(file).on('finish', () => resolve());
    }).on('error', reject);
  });

  onProgress?.('Bootstrapping pip...');
  await new Promise<void>((resolve, reject) => {
    const proc = spawn(pythonExe, [get_pip_path], { cwd: cacheDir, shell: false, stdio: 'pipe' });
    proc.on('close', (code) => {
      try { fs.unlinkSync(get_pip_path); } catch {}
      if (code === 0) {
        onProgress?.('pip installed successfully');
        resolve();
      } else {
        reject(new Error(`pip bootstrap failed with exit code ${code}`));
      }
    });
    proc.on('error', reject);
  });
}

// ── Main API ───────────────────────────────────────────────────────────────

/**
 * Ensure Python 3.10 is available locally.
 * Checks in order:
 *   1. System PATH (user has Python 3.10+ installed)
 *   2. Our cached download in userData
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

  // ── 2. Check our cached download ─────────────────────────────────────────
  const cached = getPythonBinaryPath();
  if (fs.existsSync(cached)) {
    log(`Using cached Python: ${cached}`);
    return cached;
  }

  // ── 3. Download ──────────────────────────────────────────────────────────
  log(`Python ${PYTHON_VERSION} not found. Downloading...`);

  const url = getDownloadUrl();
  log(`Download URL: ${url}`);

  const cacheDir = getCacheDir();
  fs.mkdirSync(cacheDir, { recursive: true });

  const isWin = os.platform() === 'win32';
  const archiveExt = isWin ? '.zip' : '.tar.gz';
  const archivePath = path.join(cacheDir, `python${archiveExt}`);

  // Download with progress
  log('Downloading Python (this may take a minute on first launch)...');
  await downloadFile(url, archivePath, (pct, mb) => {
    log(`Downloading: ${pct}% (${mb} MB)`);
  });
  log('Download complete. Extracting...');

  // Extract
  if (isWin) {
    await extractZip(archivePath, cacheDir);
  } else {
    // Standalone builds extract to a `python/` subdirectory — move contents up
    const tmpExtract = path.join(cacheDir, '_extract');
    fs.mkdirSync(tmpExtract, { recursive: true });
    await extractTarGz(archivePath, tmpExtract);

    // Move contents from _extract/python/ to cacheDir
    const pythonSubdir = path.join(tmpExtract, 'python');
    const target = fs.existsSync(pythonSubdir) ? pythonSubdir : tmpExtract;
    const entries = fs.readdirSync(target);
    for (const entry of entries) {
      const src = path.join(target, entry);
      const dst = path.join(cacheDir, entry);
      fs.renameSync(src, dst);
    }
    fs.rmSync(tmpExtract, { recursive: true, force: true });
  }

  // Clean up archive
  try { fs.unlinkSync(archivePath); } catch {}

  // Windows: patch embeddable Python to enable pip
  if (isWin) {
    await patchWindowsEmbed(cacheDir, (msg) => log(msg));
  }

  // Verify
  if (!fs.existsSync(cached)) {
    throw new Error(
      `Python download succeeded but binary not found at ${cached}. ` +
      `Contents: ${fs.readdirSync(cacheDir).join(', ')}`
    );
  }

  // Write version marker
  fs.writeFileSync(getVersionFile(), PYTHON_VERSION, 'utf-8');
  log(`Python ${PYTHON_VERSION} installed at: ${cached}`);
  return cached;
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
