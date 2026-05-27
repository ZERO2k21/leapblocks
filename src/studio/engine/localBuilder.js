// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AppForge Studio — Local Builder Client
// Communicates with localhost:3001 build server
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');

const LOCAL_SERVER = 'http://localhost:3001';

module.exports = {
  async build(project, onLog, onProgress) {
    // Step 1: Send project to local server
    onLog('Sending project to local build server...', 'info');
    const { data } = await axios.post(`${LOCAL_SERVER}/build`, { project });
    const { jobId } = data;
    onLog(`Build job created: ${jobId}`, 'info');

    // Step 2: Poll for status
    return new Promise((resolve, reject) => {
      let lastLogIndex = 0;

      const interval = setInterval(async () => {
        try {
          const { data: job } = await axios.get(`${LOCAL_SERVER}/status/${jobId}`);

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
              `${LOCAL_SERVER}/download/${jobId}`,
              { responseType: 'arraybuffer' }
            );

            // Save to output folder
            const appName = project.appName || 'MyApp';
            const outPath = path.join(__dirname, '..', 'output', `${appName}.apk`);
            await fs.ensureDir(path.dirname(outPath));
            await fs.writeFile(outPath, response.data);

            // Cleanup job on server
            await axios.delete(`${LOCAL_SERVER}/job/${jobId}`).catch(() => {});

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
  }
};
