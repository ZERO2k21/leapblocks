// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AppForge Studio — Local Build Server
// Runs on localhost:3001, auto-started by Electron
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const jobManager = require('./jobManager');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// POST /build — start a new APK build job
app.post('/build', async (req, res) => {
  try {
    const { project } = req.body;
    if (!project) return res.status(400).json({ error: 'No project data' });

    const jobId = uuidv4();
    jobManager.create(jobId);

    // Lazy-load builder to avoid startup overhead
    const builder = require('./builder');

    // Start build in background (don't await)
    builder.build(jobId, project).catch(err => {
      jobManager.setError(jobId, err.message);
    });

    res.json({ jobId, message: 'Build started' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /status/:jobId — check build progress
app.get('/status/:jobId', (req, res) => {
  const job = jobManager.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

// GET /download/:jobId — download final APK
app.get('/download/:jobId', (req, res) => {
  const job = jobManager.get(req.params.jobId);
  if (!job || !job.apkPath) {
    return res.status(404).json({ error: 'APK not found' });
  }

  const apkPath = job.apkPath;
  if (!fs.existsSync(apkPath)) {
    return res.status(404).json({ error: 'APK file missing at: ' + apkPath });
  }

  res.download(apkPath, 'AppForge-output.apk');
});

// GET /health — server alive check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    port: PORT,
    uptime: process.uptime(),
    jobs: jobManager.count()
  });
});

// DELETE /job/:jobId — cleanup after download
app.delete('/job/:jobId', async (req, res) => {
  const jobId = req.params.jobId;
  const workspacePath = path.join(__dirname, 'workspace', jobId);
  const outputPath = path.join(__dirname, 'output', jobId);

  await fs.remove(workspacePath).catch(() => {});
  await fs.remove(outputPath).catch(() => {});
  jobManager.remove(jobId);

  res.json({ deleted: true });
});

app.listen(PORT, () => {
  console.log(`AppForge Local Build Server running on http://localhost:${PORT}`);
});
