/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * Download-on-demand for arduino-cli.
 * Instead of bundling the GPL v3 arduino-cli binary with the installer,
 * we download it from GitHub on first use and cache it in userData.
 *
 * License: arduino-cli is GPL v3. By downloading on-demand, we avoid
 * "conveying" GPL software in our proprietary installer. The binary
 * lives only in the user's local app data after first use.
 */
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { spawn, execFile } from 'child_process';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGunzip } from 'zlib';
import * as https from 'https';
import * as http from 'http';

// ── Configuration ──────────────────────────────────────────────────────────
const ARDUINO_CLI_VERSION = 'latest'; // pinned or 'latest'
const DOWNLOAD_BASE_URL = 'https://downloads.arduino.cc/arduino-cli';

const BINARY_NAME = os.platform() === 'win32' ? 'arduino-cli.exe' : 'arduino-cli';

/**
 * Get the local cache directory for arduino-cli.
 * Uses Electron's userData path when available, otherwise falls back to
 * a standard location based on OS conventions.
 *   Windows: C:\Users\<user>\AppData\Roaming\leapblocks\arduino-cli\
 *   macOS:   ~/Library/Application Support/leapblocks/arduino-cli/
 *   Linux:   ~/.config/leapblocks/arduino-cli/
 */
function getCacheDir(): string {
  try {
    // Try Electron first (works in main/renderer process)
    const { app } = require('electron');
    if (app?.getPath) {
      return path.join(app.getPath('userData'), 'arduino-cli');
    }
  } catch { /* not in Electron context */ }

  // Fallback: compute the standard userData path without Electron
  const platform = os.platform();
  if (platform === 'win32') {
    return path.join(os.homedir(), 'AppData', 'Roaming', 'leapblocks', 'arduino-cli');
  } else if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'leapblocks', 'arduino-cli');
  } else {
    return path.join(os.homedir(), '.config', 'leapblocks', 'arduino-cli');
  }
}

function getBinaryPath(): string {
  return path.join(getCacheDir(), BINARY_NAME);
}

function getVersionFile(): string {
  return path.join(getCacheDir(), '.installed-version');
}

// ── Version resolution ─────────────────────────────────────────────────────

/** Resolve 'latest' to an actual version tag from GitHub API */
async function resolveLatestVersion(): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = 'https://api.github.com/repos/arduino/arduino-cli/releases/latest';
    https.get(url, { headers: { 'User-Agent': 'LeapBlocks/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Follow redirect
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          https.get(redirectUrl, { headers: { 'User-Agent': 'LeapBlocks/1.0' } }, (res2) => {
            let data = '';
            res2.on('data', chunk => data += chunk);
            res2.on('end', () => {
              try {
                const tag = JSON.parse(data).tag_name;
                resolve(tag); // e.g. "v0.35.1"
              } catch { reject(new Error('Failed to parse GitHub release JSON')); }
            });
          }).on('error', reject);
          return;
        }
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const tag = JSON.parse(data).tag_name;
          resolve(tag);
        } catch { reject(new Error('Failed to parse GitHub release JSON')); }
      });
    }).on('error', reject);
  });
}

/** Build the download URL for the current platform */
function getDownloadUrl(version: string): string {
  const platform = os.platform();
  const arch = os.arch();

  let platformTag: string;
  let ext: string;

  if (platform === 'win32') {
    platformTag = 'windows';
    ext = 'zip';
  } else if (platform === 'darwin') {
    platformTag = 'macOS';
    ext = 'zip';
  } else {
    platformTag = 'linux';
    ext = 'tar.gz';
  }

  const archTag = arch === 'arm64' ? 'arm64' : '64bit';
  const filename = `arduino-cli_${version}_${platformTag}_${archTag}.${ext}`;
  return `${DOWNLOAD_BASE_URL}/${filename}`;
}

// ── Download helpers ───────────────────────────────────────────────────────

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = createWriteStream(destPath);

    protocol.get(url, { headers: { 'User-Agent': 'LeapBlocks/1.0' } }, (res) => {
      // Follow redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(destPath);
        return downloadFile(res.headers.location!, destPath).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        return reject(new Error(`Download failed: HTTP ${res.statusCode} from ${url}`));
      }

      const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
      let downloadedBytes = 0;

      res.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes > 0) {
          const pct = Math.round((downloadedBytes / totalBytes) * 100);
          process.stdout.write(`\r[ARDUINO-CLI] Downloading: ${pct}% (${(downloadedBytes / 1024 / 1024).toFixed(1)} MB)`);
        }
      });

      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`\n[ARDUINO-CLI] Download complete: ${destPath}`);
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

async function extractZip(zipPath: string, destDir: string): Promise<void> {
  const AdmZip = require('adm-zip');
  const zip = new AdmZip(zipPath);
  // Extract all files to destDir
  zip.extractAllTo(destDir, true);
  console.log(`[ARDUINO-CLI] Extracted to: ${destDir}`);
}

async function extractTarGz(tarPath: string, destDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    exec(`tar -xzf "${tarPath}" -C "${destDir}"`, (err: any) => {
      if (err) return reject(err);
      console.log(`[ARDUINO-CLI] Extracted to: ${destDir}`);
      resolve();
    });
  });
}

// ── Main API ───────────────────────────────────────────────────────────────

/**
 * Ensure arduino-cli is available locally.
 * Checks these locations in order:
 *   1. System PATH (user has it installed globally)
 *   2. Our cached download in userData
 *   3. Standard Arduino install paths
 *   4. Download from GitHub (first-time)
 *
 * Returns the absolute path to the arduino-cli binary.
 * Throws if none found and download fails.
 */
export async function ensureArduinoCli(
  onProgress?: (msg: string) => void
): Promise<string> {
  const log = (msg: string) => {
    console.log(`[ARDUINO-CLI] ${msg}`);
    onProgress?.(msg);
  };

  // ── 1. Check system PATH ─────────────────────────────────────────────────
  try {
    const pathResult = await new Promise<string>((resolve, reject) => {
      execFile('arduino-cli', ['version'], { shell: true }, (err, stdout) => {
        if (!err && stdout.includes('arduino-cli')) {
          resolve('arduino-cli'); // globally available
        } else {
          reject(new Error('Not in PATH'));
        }
      });
    });
    log('Found arduino-cli in system PATH');
    return pathResult;
  } catch { /* not in PATH */ }

  // ── 2. Check our cached download ─────────────────────────────────────────
  const cached = getBinaryPath();
  if (fs.existsSync(cached)) {
    log(`Using cached arduino-cli: ${cached}`);
    return cached;
  }

  // ── 3. Check standard Arduino install paths ──────────────────────────────
  const standardPaths = [
    path.join(os.homedir(), 'AppData', 'Local', 'Arduino15', 'arduino-cli.exe'),
    path.join(os.homedir(), '.arduino15', 'arduino-cli'),
    'C:\\Program Files\\Arduino CLI\\arduino-cli.exe',
    'C:\\arduino-cli\\arduino-cli.exe',
  ];

  for (const p of standardPaths) {
    if (fs.existsSync(p)) {
      log(`Found arduino-cli at: ${p}`);
      return p;
    }
  }

  // ── 4. Download from GitHub ──────────────────────────────────────────────
  log('arduino-cli not found. Downloading from GitHub...');

  const version = ARDUINO_CLI_VERSION === 'latest'
    ? await resolveLatestVersion()
    : ARDUINO_CLI_VERSION;
  log(`Resolved version: ${version}`);

  const url = getDownloadUrl(version);
  log(`Download URL: ${url}`);

  // Ensure cache directory exists
  const cacheDir = getCacheDir();
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  // Download to temp file
  const isWin = os.platform() === 'win32';
  const archiveExt = isWin ? '.zip' : '.tar.gz';
  const archivePath = path.join(cacheDir, `arduino-cli${archiveExt}`);

  try {
    await downloadFile(url, archivePath);
  } catch (err: any) {
    throw new Error(`Failed to download arduino-cli: ${err.message}`);
  }

  // Extract
  if (isWin) {
    await extractZip(archivePath, cacheDir);
  } else {
    await extractTarGz(archivePath, cacheDir);
  }

  // Clean up archive
  try { fs.unlinkSync(archivePath); } catch { /* ignore */ }

  // Verify the binary exists
  if (!fs.existsSync(cached)) {
    // The zip might extract to a subdirectory — look for it
    const files = fs.readdirSync(cacheDir);
    const found = files.find(f => f === BINARY_NAME || f.startsWith('arduino-cli'));
    if (found) {
      const foundPath = path.join(cacheDir, found);
      // Move/rename to expected location if needed
      if (foundPath !== cached) {
        fs.renameSync(foundPath, cached);
      }
    } else {
      throw new Error(
        `arduino-cli download succeeded but binary not found in ${cacheDir}. ` +
        `Contents: ${files.join(', ')}`
      );
    }
  }

  // On Unix, make executable
  if (!isWin) {
    fs.chmodSync(cached, 0o755);
  }

  // Write version marker
  fs.writeFileSync(getVersionFile(), version, 'utf-8');

  log(`arduino-cli ${version} installed at: ${cached}`);
  return cached;
}

/**
 * Check if arduino-cli is already cached (fast, no download).
 * Returns the path or null.
 */
export function getArduinoCliPathIfAvailable(): string | null {
  // System PATH
  try {
    require('child_process').execFileSync('arduino-cli', ['version'], {
      shell: true, stdio: 'pipe', timeout: 3000
    });
    return 'arduino-cli';
  } catch { /* not in PATH */ }

  // Cached
  const cached = getBinaryPath();
  if (fs.existsSync(cached)) return cached;

  // Standard paths
  const standardPaths = [
    path.join(os.homedir(), 'AppData', 'Local', 'Arduino15', 'arduino-cli.exe'),
    path.join(os.homedir(), '.arduino15', 'arduino-cli'),
  ];
  for (const p of standardPaths) {
    if (fs.existsSync(p)) return p;
  }

  return null;
}

/**
 * Get the version of the locally installed arduino-cli.
 */
export function getInstalledVersion(): string | null {
  try {
    return fs.readFileSync(getVersionFile(), 'utf-8').trim();
  } catch {
    return null;
  }
}

/**
 * Get the download URL for the user to manually download if needed.
 */
export async function getDownloadPageUrl(): Promise<string> {
  return 'https://github.com/arduino/arduino-cli/releases/latest';
}
