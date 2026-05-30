// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AppForge Studio — Local Builder Client
// Communicates with localhost:3001 build server,
// falls back to Render cloud server if local is unavailable.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');

const LOCAL_SERVER = 'http://localhost:3001';
const CLOUD_SERVER = 'https://leapblocks-server.onrender.com';

let activeServer = null;

async function resolveServer() {
  if (activeServer) return activeServer;
  // Try local first
  try {
    const { data } = await axios.get(`${LOCAL_SERVER}/health`, { timeout: 3000 });
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

module.exports = {
  async build(project, onLog, onProgress) {
    const server = await resolveServer();
    const serverLabel = server === LOCAL_SERVER ? 'local' : 'cloud';
    onLog(`Sending project to ${serverLabel} build server...`, 'info');
    const { data } = await axios.post(`${server}/build`, { project });
    const { jobId } = data;
    onLog(`Build job created: ${jobId} (${serverLabel})`, 'info');

    // Step 2: Poll for status
    return new Promise((resolve, reject) => {
      let lastLogIndex = 0;

      const interval = setInterval(async () => {
        try {
          const { data: job } = await axios.get(`${server}/status/${jobId}`);

          onProgress(job.progress);

          // Only send new logs
          if (job.logs.length > lastLogIndex) {
            const newLogs = job.logs.slice(lastLogIndex);
            newLogs.forEach(l => onLog(l.message, l.type));
            lastLogIndex = job.logs.length;
          }

          if (job.status === 'done') {
            clearInterval(interval);

            // Step 3: Download APK
            onLog('Downloading APK...', 'info');
            const response = await axios.get(
              `${server}/download/${jobId}`,
              { responseType: 'arraybuffer' }
            );

            // Save to output folder
            const appName = project.appName || 'MyApp';
            const outPath = path.join(__dirname, '..', 'output', `${appName}.apk`);
            await fs.ensureDir(path.dirname(outPath));
            await fs.writeFile(outPath, response.data);

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
  },

  async checkServer() {
    try {
      const { data } = await axios.get(`${LOCAL_SERVER}/health`, { timeout: 3000 });
      return data.status === 'ok';
    } catch {
      return false;
    }
  },

  resolveServer
};
