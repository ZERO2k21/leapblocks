// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AppForge Studio — Local Builder Client
// Communicates with localhost:3001 build server,
// falls back to Render cloud server if local is unavailable.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import axios from 'axios';
import path from 'path';
import fs from 'fs-extra';

const LOCAL_SERVER = 'http://localhost:3001';
const CLOUD_SERVER = 'https://leapblocks-server-6qwr.onrender.com';

let activeServer: string | null = null;

export type LogType = 'info' | 'success' | 'error' | string;
export type OnLog = (message: string, type: LogType) => void;
export type OnProgress = (progress: number) => void;

export interface Project {
  appName?: string;
  [key: string]: any;
}

export interface BuildLog {
  message: string;
  type: LogType;
}

export interface BuildJobStatus {
  progress: number;
  logs: BuildLog[];
  status: 'pending' | 'running' | 'done' | 'error';
  error?: string;
}

export async function resolveServer(): Promise<string> {
  if (activeServer) return activeServer;
  // Try local first
  try {
    const { data } = await axios.get<{ status?: string; service?: string }>(
      `${LOCAL_SERVER}/health`,
      { timeout: 3000 }
    );
    if (data && (data.status === 'ok' || data.service)) {
      activeServer = LOCAL_SERVER;
      console.log(`[Builder] Using local server: ${LOCAL_SERVER}`);
      return activeServer;
    }
  } catch {}

  // Fall back to cloud
  activeServer = CLOUD_SERVER;
  console.log(`[Builder] Local server unavailable. Using cloud: ${CLOUD_SERVER}`);
  return activeServer;
}

export async function build(
  project: Project,
  onLog: OnLog,
  onProgress: OnProgress
): Promise<string> {
  const server = await resolveServer();
  const serverLabel = server === LOCAL_SERVER ? 'local' : 'cloud';
  onLog(`Sending project to ${serverLabel} build server...`, 'info');
  const { data } = await axios.post<{ jobId: string }>(`${server}/build`, { project });
  const { jobId } = data;
  onLog(`Build job created: ${jobId} (${serverLabel})`, 'info');

  // Step 2: Poll for status
  return new Promise<string>((resolve, reject) => {
    let lastLogIndex = 0;

    const interval = setInterval(async () => {
      try {
        const { data: job } = await axios.get<BuildJobStatus>(`${server}/status/${jobId}`);

        onProgress(job.progress);

        // Only send new logs
        if (job.logs && job.logs.length > lastLogIndex) {
          const newLogs = job.logs.slice(lastLogIndex);
          newLogs.forEach(l => onLog(l.message, l.type));
          lastLogIndex = job.logs.length;
        }

        if (job.status === 'done') {
          clearInterval(interval);

          // Step 3: Download APK
          onLog('Downloading APK...', 'info');
          const response = await axios.get<ArrayBuffer>(
            `${server}/download/${jobId}`,
            { responseType: 'arraybuffer' }
          );

          // Save to output folder
          const appName = project.appName || 'MyApp';
          const outPath = path.join(__dirname, '..', 'output', `${appName}.apk`);
          await fs.ensureDir(path.dirname(outPath));
          await fs.writeFile(outPath, Buffer.from(response.data));

          // Cleanup job on server
          await axios.delete(`${server}/job/${jobId}`).catch(() => {});

          onLog(`APK saved to: ${outPath}`, 'success');
          resolve(outPath);
        }

        if (job.status === 'error') {
          clearInterval(interval);
          reject(new Error(job.error || 'Build failed'));
        }
      } catch (err) {
        clearInterval(interval);
        reject(err);
      }
    }, 2000); // Poll every 2 seconds
  });
}

export async function checkServer(): Promise<boolean> {
  try {
    const { data } = await axios.get<{ status?: string }>(`${LOCAL_SERVER}/health`, { timeout: 3000 });
    return data.status === 'ok';
  } catch {
    return false;
  }
}

export default {
  build,
  checkServer,
  resolveServer,
};
