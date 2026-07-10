import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { createHash } from 'crypto';

const LMS_API_URL = 'https://lms-api.creoleap.workers.dev/api';

export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  downloadUrl: string;
  releaseNotes: string | null;
  checksum: string | null;
}

export interface DownloadProgress {
  percent: number;
  bytesDownloaded: number;
  totalBytes: number;
  status: 'downloading' | 'verifying' | 'done' | 'error';
  error?: string;
}

type ProgressCallback = (progress: DownloadProgress) => void;

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    const currentVersion = app.getVersion();
    console.log(`[UPDATE] Current version: ${currentVersion}`);

    const response = await fetch(`${LMS_API_URL}/leapblocks/versions/latest`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.log(`[UPDATE] Server returned ${response.status}`);
      return null;
    }

    const { success, data } = await response.json() as any;

    if (!success || !data || !data.version) {
      console.log('[UPDATE] No version data from server');
      return null;
    }

    const latestVersion = data.version;

    console.log(`[UPDATE] Latest version on server: ${latestVersion}`);

    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;

    return {
      hasUpdate,
      latestVersion,
      downloadUrl: `${LMS_API_URL.replace('/api', '')}${data.exeUrl}`,
      releaseNotes: data.releaseNotes || null,
      checksum: data.sha512 || null,
    };
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      console.log('[UPDATE] Check timed out (offline?)');
    } else {
      console.error('[UPDATE] Check failed:', err.message);
    }
    return null;
  }
}

export async function downloadUpdate(
  updateInfo: UpdateInfo,
  onProgress: ProgressCallback,
): Promise<string> {
  const tempDir = app.getPath('temp');
  const installerName = `LeapLab-Setup-${updateInfo.latestVersion}.exe`;
  const installerPath = path.join(tempDir, installerName);

  console.log(`[UPDATE] Downloading ${updateInfo.downloadUrl} to ${installerPath}`);

  const response = await fetch(updateInfo.downloadUrl);

  if (!response.ok) {
    throw new Error(`Download failed: HTTP ${response.status}`);
  }

  const contentLength = response.headers.get('content-length');
  const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
  const reader = response.body!.getReader();

  let bytesDownloaded = 0;
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    chunks.push(value);
    bytesDownloaded += value.length;

    if (totalBytes > 0) {
      onProgress({
        percent: Math.round((bytesDownloaded / totalBytes) * 100),
        bytesDownloaded,
        totalBytes,
        status: 'downloading',
      });
    }
  }

  onProgress({
    percent: 100,
    bytesDownloaded,
    totalBytes,
    status: 'verifying',
  });

  // Concatenate all chunks into a single buffer
  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  // Verify checksum if provided
  if (updateInfo.checksum) {
    const hash = createHash('sha512').update(Buffer.from(result)).digest('base64');
    if (hash !== updateInfo.checksum) {
      throw new Error(`Checksum mismatch: expected ${updateInfo.checksum}, got ${hash}`);
    }
    console.log('[UPDATE] Checksum verified');
  }

  // Write to temp file
  await fs.promises.writeFile(installerPath, Buffer.from(result));

  onProgress({
    percent: 100,
    bytesDownloaded,
    totalBytes,
    status: 'done',
  });

  console.log(`[UPDATE] Downloaded to ${installerPath}`);
  return installerPath;
}

export function installUpdate(installerPath: string): void {
  console.log(`[UPDATE] Installing: ${installerPath}`);

  // NSIS silent install: /S runs silently, /D sets install dir
  const spawn = require('child_process').spawn;

  const proc = spawn(installerPath, ['/S'], {
    detached: true,
    stdio: 'ignore',
  });

  proc.unref();

  // Quit the app — the installer will replace files while the old process
  // is shutting down. On next launch the new version runs.
  app.quit();
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);

  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }

  return 0;
}
