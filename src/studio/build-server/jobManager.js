const jobs = {};

module.exports = {
  create(jobId) {
    jobs[jobId] = {
      jobId,
      status: 'queued',
      progress: 0,
      logs: [],
      apkPath: null,
      error: null,
      createdAt: Date.now()
    };
  },

  get(jobId) {
    return jobs[jobId] || null;
  },

  count() {
    return Object.keys(jobs).length;
  },

  log(jobId, message, type = 'info') {
    if (!jobs[jobId]) return;
    const entry = {
      time: new Date().toLocaleTimeString(),
      message,
      type
    };
    jobs[jobId].logs.push(entry);
    console.log(`[${jobId.slice(0, 8)}] ${message}`);
  },

  setProgress(jobId, progress) {
    if (jobs[jobId]) jobs[jobId].progress = progress;
  },

  setStatus(jobId, status) {
    if (jobs[jobId]) jobs[jobId].status = status;
  },

  setDone(jobId, apkPath) {
    if (jobs[jobId]) {
      jobs[jobId].status = 'done';
      jobs[jobId].progress = 100;
      jobs[jobId].apkPath = apkPath;
    }
  },

  setError(jobId, error) {
    if (jobs[jobId]) {
      jobs[jobId].status = 'error';
      jobs[jobId].error = error;
    }
  },

  remove(jobId) {
    delete jobs[jobId];
  }
};
