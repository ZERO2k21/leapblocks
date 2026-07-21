interface Job {
  jobId: string;
  status: string;
  progress: number;
  logs: Array<{ time: string; message: string; type: string }>;
  apkPath: string | null;
  error: string | null;
  createdAt: number;
}

const jobs: Record<string, Job> = {};

const jobManager = {
  create(jobId: string) {
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

  get(jobId: string): Job | null {
    return jobs[jobId] || null;
  },

  count(): number {
    return Object.keys(jobs).length;
  },

  log(jobId: string, message: string, type: string = 'info') {
    if (!jobs[jobId]) return;
    const entry = {
      time: new Date().toLocaleTimeString(),
      message,
      type
    };
    jobs[jobId].logs.push(entry);
    console.log(`[${jobId.slice(0, 8)}] ${message}`);
  },

  setProgress(jobId: string, progress: number) {
    if (jobs[jobId]) jobs[jobId].progress = progress;
  },

  setStatus(jobId: string, status: string) {
    if (jobs[jobId]) jobs[jobId].status = status;
  },

  setDone(jobId: string, apkPath: string) {
    if (jobs[jobId]) {
      jobs[jobId].status = 'done';
      jobs[jobId].progress = 100;
      jobs[jobId].apkPath = apkPath;
    }
  },

  setError(jobId: string, error: string) {
    if (jobs[jobId]) {
      jobs[jobId].status = 'error';
      jobs[jobId].error = error;
    }
  },

  remove(jobId: string) {
    delete jobs[jobId];
  }
};

export = jobManager;
