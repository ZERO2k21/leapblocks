/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AppForge — Local Build Server Client
// Communicates with localhost:3001
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LOCAL_SERVER = 'http://localhost:3001';

export async function startBuild(project: any, onLog: (msg: string) => void, onProgress: (p: number) => void): Promise<string> {
  onLog('Sending project to local build server...');
  const res = await fetch(`${LOCAL_SERVER}/build`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project }),
  });
  const { jobId } = await res.json();
  onLog(`Build job created: ${jobId}`);

  return new Promise((resolve, reject) => {
    let lastLogIndex = 0;
    const interval = setInterval(async () => {
      try {
        const statusRes = await fetch(`${LOCAL_SERVER}/status/${jobId}`);
        const job = await statusRes.json();
        onProgress(job.progress);

        if (job.logs.length > lastLogIndex) {
          job.logs.slice(lastLogIndex).forEach((l: any) => onLog(l.message));
          lastLogIndex = job.logs.length;
        }

        if (job.status === 'done') {
          clearInterval(interval);
          onLog('Build complete!');
          resolve(job.apkPath);
        }
        if (job.status === 'error') {
          clearInterval(interval);
          reject(new Error(job.error));
        }
      } catch (err) {
        clearInterval(interval);
        reject(err);
      }
    }, 2000);
  });
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${LOCAL_SERVER}/health`, { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}
