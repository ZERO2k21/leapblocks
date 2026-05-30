/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * arduino-cli resolution for Electra.
 * Electra ONLY uses the arduino-cli binary bundled inside the app.
 * It never uses system-installed arduino-cli or standard Arduino paths.
 * If the bundled binary is missing (shouldn't happen), falls back to
 * download-on-demand cached in userData.
 */
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { createWriteStream } from 'fs';
import * as https from 'https';
import * as http from 'http';

// ── Configuration ──────────────────────────────────────────────────────────
const ARDUINO_CLI_VERSION = 'latest'; // pinned or 'latest'
const DOWNLOAD_BASE_URL = 'https://downloads.arduino.cc/arduino-cli';

const BINARY_NAME = os.platform() === 'win32' ? 'arduino-cli.exe' : 'arduino-cli';

// ── Bundled binary resolution ────────────────────────────────────────────────

/**
 * Resolve the path to the arduino-cli binary bundled inside the app.
 *
 * Production (packaged Electron app):
 *   process.resourcesPath/arduino-cli/arduino-cli.exe
 *   (deployed via electron-builder extraResources)
 *
 * Development (running from source):
 *   <project-root>/arduino-cli/arduino-cli.exe
 *
 * This function ALWAYS returns a path — it does not check if the file exists.
 * Callers should verify with fs.existsSync() if needed.
 */
export function getBundledArduinoCliPath(): string {
  const platform = os.platform();
  const binName = platform === 'win32' ? 'arduino-cli.exe' : 'arduino-cli';

  // Production: use process.resourcesPath (Electron extraResources)
  try {
    const { app } = require('electron');
    if (app?.isPackaged) {
      return path.join((process as any).resourcesPath, 'arduino-cli', binName);
    }
  } catch { /* not in Electron context */ }

  // Development: use app.getAppPath() which reliably returns the project root
  // even after bundling (electron-vite bundles src/ into dist/main/).
  // __dirname is unreliable in bundled builds — it points to dist/main/
  // instead of src/utils/.
  try {
    const { app } = require('electron');
    if (app?.getAppPath) {
      return path.join(app.getAppPath(), 'arduino-cli', binName);
    }
  } catch { /* not in Electron context */ }

  // Fallback: walk up from __dirname (works when not bundled, e.g. ts-node)
  return path.join(__dirname, '..', '..', 'arduino-cli', binName);
}

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
 *   1. Bundled binary inside the app (extraResources)
 *   2. Our cached download in userData (fallback)
 *   3. Download from GitHub (last resort)
 *
 * NEVER checks system PATH or standard Arduino install paths.
 * Electra must use only its own arduino-cli to avoid version conflicts.
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

  // ── 1. Bundled binary inside the app ──────────────────────────────────────
  const bundled = getBundledArduinoCliPath();
  if (fs.existsSync(bundled)) {
    log(`Using bundled arduino-cli: ${bundled}`);
    return bundled;
  }

  // ── 2. Cached download in userData ────────────────────────────────────────
  const cached = getBinaryPath();
  if (fs.existsSync(cached)) {
    log(`Using cached arduino-cli: ${cached}`);
    return cached;
  }

  // ── 3. Download from GitHub ──────────────────────────────────────────────
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
 * Check if arduino-cli is already available (fast, no download).
 * Only checks the bundled binary and cached download.
 * NEVER checks system PATH or standard Arduino install paths.
 * Returns the path or null.
 */
export function getArduinoCliPathIfAvailable(): string | null {
  // Bundled binary inside the app
  const bundled = getBundledArduinoCliPath();
  if (fs.existsSync(bundled)) return bundled;

  // Cached
  const cached = getBinaryPath();
  if (fs.existsSync(cached)) return cached;

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
