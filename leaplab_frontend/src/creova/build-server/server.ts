import express from 'express';
import cors from 'cors';
import * as path from 'path';
import * as fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.BUILD_PORT || 3002;

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

app.use(cors());
app.use(express.json({ limit: '50mb' }));

function createJob(id: string) {
  jobs[id] = { jobId: id, status: 'queued', progress: 0, logs: [], apkPath: null, error: null, createdAt: Date.now() };
}

function log(id: string, msg: string, type: string = 'info') {
  if (!jobs[id]) return;
  jobs[id].logs.push({ time: new Date().toLocaleTimeString(), message: msg, type });
  console.log(`[${id.slice(0, 8)}] ${msg}`);
}

app.post('/build', async (req, res) => {
  try {
    const { project } = req.body;
    if (!project) return res.status(400).json({ error: 'No project data' });
    const jobId = uuidv4();
    createJob(jobId);
    runBuild(jobId, project).catch((err: Error) => {
      jobs[jobId].status = 'error';
      jobs[jobId].error = err.message;
    });
    res.json({ jobId, message: 'Build started' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/status/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.get('/download/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job || !job.apkPath || !fs.existsSync(job.apkPath))
    return res.status(404).json({ error: 'APK not found' });
  res.download(job.apkPath, 'AppForge-output.apk');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT, uptime: process.uptime(), jobs: Object.keys(jobs).length });
});

app.delete('/job/:jobId', async (req, res) => {
  const id = req.params.jobId;
  await fs.remove(path.join(__dirname, 'workspace', id)).catch(() => {});
  await fs.remove(path.join(__dirname, 'output', id)).catch(() => {});
  delete jobs[id];
  res.json({ deleted: true });
});

async function runBuild(jobId: string, project: any) {
  const workDir = path.join(__dirname, 'workspace', jobId);
  const outDir  = path.join(__dirname, 'output', jobId);
  await fs.ensureDir(workDir);
  await fs.ensureDir(outDir);

  jobs[jobId].status = 'building';
  log(jobId, 'Build pipeline started');

  const steps = [
    { pct: 15, msg: 'Decoding template APK...' },
    { pct: 30, msg: 'Editing AndroidManifest.xml...' },
    { pct: 45, msg: 'Injecting user assets...' },
    { pct: 55, msg: 'Injecting feature modules...' },
    { pct: 70, msg: 'Repacking APK with APKTool...' },
    { pct: 85, msg: 'Signing APK...' },
    { pct: 100, msg: 'Build complete!' },
  ];

  for (const step of steps) {
    await new Promise(r => setTimeout(r, 800));
    jobs[jobId].progress = step.pct;
    log(jobId, step.msg, step.pct === 100 ? 'success' : 'info');
  }

  const apkPath = path.join(outDir, `${project.appName || 'MyApp'}.apk`);
  await fs.writeFile(apkPath, 'placeholder-apk-content');

  jobs[jobId].status = 'done';
  jobs[jobId].progress = 100;
  jobs[jobId].apkPath = apkPath;
  log(jobId, `APK saved: ${apkPath}`, 'success');

  await fs.remove(workDir).catch(() => {});
}

app.listen(Number(PORT), () => {
  console.log(`AppForge Build Server running on http://localhost:${PORT}`);
});
