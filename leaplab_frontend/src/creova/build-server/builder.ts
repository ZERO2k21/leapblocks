import * as path from 'path';
import * as fs from 'fs-extra';
import { exec } from 'child_process';
import jobManager from './jobManager';

const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');
const TOOLS = {
  apktool:  path.join(PROJECT_ROOT, 'src', 'tools', 'apktool', 'apktool.jar'),
  signer:   path.join(PROJECT_ROOT, 'src', 'tools', 'signer', 'uber-apk-signer.jar'),
  template: path.join(PROJECT_ROOT, 'template', 'base.apk'),
  keystore: path.join(PROJECT_ROOT, 'keys', 'appforge.keystore'),
};

function run(cmd: string, jobId: string, logMsg: string): Promise<string> {
  return new Promise((resolve, reject) => {
    jobManager.log(jobId, logMsg, 'info');
    exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
      if (err) {
        jobManager.log(jobId, `Error: ${err.message}`, 'error');
        if (stderr) jobManager.log(jobId, stderr.trim(), 'error');
        reject(err);
      } else {
        jobManager.log(jobId, `${logMsg} -- done`, 'success');
        resolve(stdout);
      }
    });
  });
}

async function editManifest(workDir: string, project: any) {
  const manifestPath = path.join(workDir, 'AndroidManifest.xml');
  if (!await fs.pathExists(manifestPath)) return;

  let manifest = await fs.readFile(manifestPath, 'utf8');

  if (project.packageName) {
    manifest = manifest.replace(/package="[^"]*"/, `package="${project.packageName}"`);
  }
  if (project.appName) {
    manifest = manifest.replace(/android:label="[^"]*"/, `android:label="${project.appName}"`);
  }

  const perms = (project.permissions || [])
    .map((p: string) => `    <uses-permission android:name="android.permission.${p}"/>`)
    .join('\n');

  if (perms) {
    manifest = manifest.replace('</manifest>', `${perms}\n</manifest>`);
  }

  await fs.writeFile(manifestPath, manifest);
}

async function injectAssets(workDir: string, project: any) {
  const assetsDir = path.join(workDir, 'assets');
  await fs.ensureDir(assetsDir);

  if (project.assets && Array.isArray(project.assets)) {
    for (const asset of project.assets) {
      if (asset.path && await fs.pathExists(asset.path)) {
        await fs.copy(asset.path, path.join(assetsDir, asset.name));
      }
    }
  }
}

async function injectFeatures(workDir: string, project: any) {
  const features = project.features || [];
  const smaliDir = path.join(PROJECT_ROOT, 'smali');

  for (const feature of features) {
    const smaliSrc = path.join(smaliDir, `${feature}.smali`);
    if (await fs.pathExists(smaliSrc)) {
      const smaliDest = path.join(workDir, 'smali', 'com', 'appforge', `${feature}.smali`);
      await fs.ensureDir(path.dirname(smaliDest));
      await fs.copy(smaliSrc, smaliDest);
    }
  }
}

const builder = {
  async build(jobId: string, project: any) {
    const workDir  = path.join(__dirname, 'workspace', jobId);
    const outDir   = path.join(__dirname, 'output', jobId);
    const unsigned = path.join(outDir, 'unsigned.apk');
    const signed   = path.join(outDir, 'final.apk');

    await fs.ensureDir(workDir);
    await fs.ensureDir(outDir);

    jobManager.setStatus(jobId, 'building');

    try {
      jobManager.setProgress(jobId, 10);
      await run(
        `java -jar "${TOOLS.apktool}" d "${TOOLS.template}" -o "${workDir}" -f`,
        jobId, 'Decoding base APK...'
      );

      jobManager.setProgress(jobId, 25);
      jobManager.log(jobId, 'Editing AndroidManifest...', 'info');
      await editManifest(workDir, project);
      jobManager.log(jobId, 'Manifest updated', 'success');

      jobManager.setProgress(jobId, 40);
      jobManager.log(jobId, 'Injecting user assets...', 'info');
      await injectAssets(workDir, project);
      jobManager.log(jobId, 'Assets injected', 'success');

      jobManager.setProgress(jobId, 55);
      jobManager.log(jobId, 'Injecting feature modules...', 'info');
      await injectFeatures(workDir, project);
      jobManager.log(jobId, 'Features injected', 'success');

      jobManager.setProgress(jobId, 70);
      await run(
        `java -jar "${TOOLS.apktool}" b "${workDir}" -o "${unsigned}"`,
        jobId, 'Repacking APK...'
      );

      jobManager.setProgress(jobId, 85);
      await run(
        `java -jar "${TOOLS.signer}" --apks "${unsigned}" --ks "${TOOLS.keystore}" --ksPass pass:appforge123 --ksKeyPass pass:appforge123 --out "${signed}"`,
        jobId, 'Signing APK...'
      );

      jobManager.setProgress(jobId, 100);
      jobManager.setDone(jobId, signed);
      jobManager.log(jobId, 'Build complete! APK ready to download.', 'success');

    } catch (err: any) {
      jobManager.setError(jobId, err.message);
      jobManager.log(jobId, `Build failed: ${err.message}`, 'error');
    }

    await fs.remove(workDir).catch(() => {});
  }
};

export default builder;
