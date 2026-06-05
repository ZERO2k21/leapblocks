/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * APK Injector — Low-level APKTool operations
 *
 * Provides decode, inject, rebuild, and sign primitives.
 * Used by both src/creova/apk/electron-bridge.js (main build path) and
 * src/creova/apk/buildAPK.js (standalone).
 */

const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

// Resolve tool paths — works in both dev and packaged Electron
function resolveToolPath(toolName) {
  // In packaged app, tools are under process.resourcesPath
  const candidates = [
    // Packaged Electron
    process.resourcesPath && path.join(process.resourcesPath, 'tools', toolName),
    // Development — project root /tools/
    path.join(__dirname, '..', '..', '..', 'tools', toolName),
    // Development — from apk/ directory
    path.join(__dirname, '..', '..', 'tools', toolName),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.pathExistsSync(candidate)) return candidate;
  }
  return candidates[1]; // fallback to project root
}

const TOOLS = {
  get apktool() { return path.join(resolveToolPath('apktool'), 'apktool.jar'); },
  get signer() { return path.join(resolveToolPath('signer'), 'uber-apk-signer.jar'); },
  get smali() { return path.join(resolveToolPath('smali'), 'smali.jar'); },
};

function resolveJavaBinary() {
  const javaBinName = process.platform === 'win32' ? 'java.exe' : 'java';

  const candidateBins = [];
  const javaHome = process.env.JAVA_HOME;
  if (javaHome) {
    candidateBins.push(path.join(javaHome, 'bin', javaBinName));
  }

  if (process.platform === 'win32') {
    const roots = [
      'C:\\Program Files\\Eclipse Adoptium',
      'C:\\Program Files\\Java',
      'C:\\Program Files (x86)\\Java',
    ];
    for (const root of roots) {
      if (!fs.pathExistsSync(root)) continue;
      try {
        const dirs = fs.readdirSync(root, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name)
          .sort()
          .reverse();
        for (const dir of dirs) {
          candidateBins.push(path.join(root, dir, 'bin', javaBinName));
        }
      } catch (_) {
        // Ignore unreadable directories and continue fallback sequence.
      }
    }
  }

  for (const candidate of candidateBins) {
    if (fs.pathExistsSync(candidate)) return candidate;
  }
  return 'java';
}

function isJavaMissingMessage(text = '') {
  const t = text.toLowerCase();
  return t.includes('is not recognized as an internal or external command')
    || t.includes('command not found')
    || t.includes('could not find or load main class java')
    || t.includes('no such file or directory');
}

class ApkInjector {
  constructor() {
    this.workingDir = null;
    this.projectName = 'LeapApp';
  }

  async initialize(projectName = 'LeapApp') {
    this.projectName = projectName.replace(/[^a-zA-Z0-9]/g, '');
    this.workingDir = path.join(
      require('os').tmpdir(),
      'leapblocks_apk',
      `inject_${this.projectName}_${Date.now()}`
    );
    await fs.ensureDir(this.workingDir);
  }

  /**
   * Run a java -jar command and stream output
   */
  async runJava(args, description, onProgress) {
    return new Promise((resolve, reject) => {
      const javaBin = resolveJavaBinary();
      const child = spawn(javaBin, ['-jar', ...args], {
        cwd: this.workingDir,
        shell: false,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        const line = data.toString().trim();
        stdout += line + '\n';
        onProgress?.({ stage: 'tool_output', message: line });
      });

      child.stderr.on('data', (data) => {
        const line = data.toString().trim();
        stderr += line + '\n';
        onProgress?.({ stage: 'tool_output', message: line });
      });

      child.on('error', (err) => {
        if (err.message.includes('ENOENT')) {
          reject(new Error('Java not found. Install JDK 8+ and add to PATH.'));
        } else {
          reject(err);
        }
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          if (isJavaMissingMessage(stderr) || isJavaMissingMessage(stdout)) {
            reject(new Error('Java runtime not found. Install JDK 8+ and set JAVA_HOME (or add java to PATH), then restart LeapBlocks.'));
            return;
          }
          reject(new Error(`${description} failed (exit ${code}):\n${stderr || stdout}`));
        }
      });
    });
  }

  /**
   * Decode an APK using APKTool
   */
  async decodeApk(templatePath, onProgress) {
    onProgress?.({ stage: 'decoding', progress: 10, message: 'Decoding template APK...' });

    const decodedDir = path.join(this.workingDir, 'decoded');
    await fs.ensureDir(decodedDir);

    await this.runJava(
      [TOOLS.apktool, 'decode', '-f', '-o', decodedDir, templatePath],
      'APK decode',
      onProgress
    );

    onProgress?.({ stage: 'decoded', progress: 25, message: 'Template decoded' });
    return decodedDir;
  }

  /**
   * Inject web assets and app config into the decoded APK
   */
  async injectAssets(decodedDir, webAppFiles, mediaAssets, onProgress) {
    onProgress?.({ stage: 'injecting', progress: 35, message: 'Injecting web assets...' });

    const assetsDir = path.join(decodedDir, 'assets');
    await fs.ensureDir(assetsDir);

    // Write generated web app files (www/index.html, www/styles.css, etc.)
    for (const [filePath, content] of Object.entries(webAppFiles)) {
      const fullPath = path.join(assetsDir, filePath);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content);
    }

    // Write media assets
    if (mediaAssets?.length) {
      const mediaDir = path.join(assetsDir, 'www', 'media');
      await fs.ensureDir(mediaDir);

      for (const item of mediaAssets) {
        if (!item.data) continue;
        const dataStr = String(item.data);
        const commaIdx = dataStr.indexOf(',');
        const b64 = commaIdx >= 0 ? dataStr.substring(commaIdx + 1) : dataStr;
        if (!b64) continue;
        try {
          const buffer = Buffer.from(b64, 'base64');
          if (buffer.length > 0) {
            await fs.writeFile(path.join(mediaDir, item.filename), buffer);
          }
        } catch (_) {
          onProgress?.({ stage: 'media_skip', message: `Skipped unreadable media: ${item.filename}` });
        }
      }
    }

    onProgress?.({ stage: 'injected', progress: 50, message: 'Assets injected' });
    return assetsDir;
  }

  /**
   * Modify AndroidManifest.xml with app-specific values
   */
  async modifyManifest(decodedDir, { appName, packageName, permissions = [], screenOrientation = null }, onProgress) {
    onProgress?.({ stage: 'manifest', progress: 55, message: 'Patching manifest...' });

    const manifestPath = path.join(decodedDir, 'AndroidManifest.xml');
    if (!await fs.pathExists(manifestPath)) {
      onProgress?.({ stage: 'manifest_skip', progress: 55, message: 'No manifest to patch' });
      return;
    }

    let manifest = await fs.readFile(manifestPath, 'utf8');

    // Package name
    if (packageName) {
      manifest = manifest.replace(/package="[^"]*"/, `package="${packageName}"`);
    }

    // App label
    if (appName) {
      manifest = manifest.replace(/android:label="[^"]*"/, `android:label="${appName}"`);
    }

    // Ensure required permissions
    const requiredPerms = [
      'android.permission.INTERNET',
      'android.permission.VIBRATE',
      ...permissions
    ];

    for (const perm of requiredPerms) {
      if (!manifest.includes(perm)) {
        manifest = manifest.replace(
          '</manifest>',
          `    <uses-permission android:name="${perm}" />\n</manifest>`
        );
      }
    }

    // WebView requirements
    if (!manifest.includes('usesCleartextTraffic')) {
      manifest = manifest.replace('<application', '<application android:usesCleartextTraffic="true"');
    }
    if (!manifest.includes('hardwareAccelerated')) {
      manifest = manifest.replace('<application', '<application android:hardwareAccelerated="true"');
    }

    if (screenOrientation && !manifest.includes('android:screenOrientation=')) {
      manifest = manifest.replace(
        /(<activity\b[^>]*android:name="\.MainActivity"[^>]*)(>)/,
        `$1 android:screenOrientation="${screenOrientation}"$2`
      );
    }

    await fs.writeFile(manifestPath, manifest);
    onProgress?.({ stage: 'manifest_done', progress: 60, message: 'Manifest patched' });
  }

  /**
   * Inject WebView-based MainActivity.smali
   */
  async injectWebViewActivity(decodedDir, packageName, onProgress) {
    onProgress?.({ stage: 'smali', progress: 65, message: 'Injecting WebView activity...' });

    const pkgPath = packageName.replace(/\./g, '/');
    const smaliDir = path.join(decodedDir, 'smali', ...pkgPath.split('/'));
    await fs.ensureDir(smaliDir);

    const smaliPkg = 'L' + pkgPath + '/';

    const smali = `.class public ${smaliPkg}MainActivity;
.super Landroid/app/Activity;
.source "MainActivity.java"

.field private webView:Landroid/webkit/WebView;

.method public constructor <init>()V
    .registers 1
    invoke-direct {p0}, Landroid/app/Activity;-><init>()V
    return-void
.end method

.method protected onCreate(Landroid/os/Bundle;)V
    .registers 5
    invoke-super {p0, p1}, Landroid/app/Activity;->onCreate(Landroid/os/Bundle;)V

    const/4 v2, 0x1
    invoke-static {v2}, Landroid/webkit/WebView;->setWebContentsDebuggingEnabled(Z)V

    new-instance v0, Landroid/webkit/WebView;
    invoke-direct {v0, p0}, Landroid/webkit/WebView;-><init>(Landroid/content/Context;)V
    iput-object v0, p0, ${smaliPkg}MainActivity;->webView:Landroid/webkit/WebView;

    new-instance v2, Landroid/webkit/WebViewClient;
    invoke-direct {v2}, Landroid/webkit/WebViewClient;-><init>()V
    invoke-virtual {v0, v2}, Landroid/webkit/WebView;->setWebViewClient(Landroid/webkit/WebViewClient;)V

    new-instance v2, Landroid/webkit/WebChromeClient;
    invoke-direct {v2}, Landroid/webkit/WebChromeClient;-><init>()V
    invoke-virtual {v0, v2}, Landroid/webkit/WebView;->setWebChromeClient(Landroid/webkit/WebChromeClient;)V

    invoke-virtual {v0}, Landroid/webkit/WebView;->getSettings()Landroid/webkit/WebSettings;
    move-result-object v1

    const/4 v2, 0x1
    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setJavaScriptEnabled(Z)V
    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setDomStorageEnabled(Z)V
    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setAllowFileAccess(Z)V
    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setAllowFileAccessFromFileURLs(Z)V
    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setAllowUniversalAccessFromFileURLs(Z)V

    invoke-virtual {p0, v0}, Landroid/app/Activity;->setContentView(Landroid/view/View;)V

    const-string v1, "file:///android_asset/www/index.html"
    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V

    return-void
.end method

.method public onBackPressed()V
    .registers 3
    iget-object v0, p0, ${smaliPkg}MainActivity;->webView:Landroid/webkit/WebView;
    invoke-virtual {v0}, Landroid/webkit/WebView;->canGoBack()Z
    move-result v1
    if-eqz v1, :call_super
    invoke-virtual {v0}, Landroid/webkit/WebView;->goBack()V
    return-void
    :call_super
    invoke-super {p0}, Landroid/app/Activity;->onBackPressed()V
    return-void
.end method

.method protected onDestroy()V
    .registers 2
    iget-object v0, p0, ${smaliPkg}MainActivity;->webView:Landroid/webkit/WebView;
    if-eqz v0, :skip
    invoke-virtual {v0}, Landroid/webkit/WebView;->destroy()V
    :skip
    invoke-super {p0}, Landroid/app/Activity;->onDestroy()V
    return-void
.end method
`;

    await fs.writeFile(path.join(smaliDir, 'MainActivity.smali'), smali);
    onProgress?.({ stage: 'smali_done', progress: 70, message: 'WebView activity injected' });
  }

  /**
   * Rebuild decoded APK using APKTool
   */
  async rebuildApk(decodedDir, outputApkPath, onProgress) {
    onProgress?.({ stage: 'rebuilding', progress: 75, message: 'Rebuilding APK...' });

    await this.runJava(
      [TOOLS.apktool, 'build', '-f', '-o', outputApkPath, decodedDir],
      'APK rebuild',
      onProgress
    );

    onProgress?.({ stage: 'rebuilt', progress: 85, message: 'APK rebuilt' });
    return outputApkPath;
  }

  /**
   * Sign APK using uber-apk-signer (debug keystore — no custom keystore needed)
   */
  async signApk(unsignedApkPath, outputDir, onProgress) {
    onProgress?.({ stage: 'signing', progress: 90, message: 'Signing APK...' });

    await this.runJava(
      [TOOLS.signer, '-a', unsignedApkPath, '-o', outputDir, '--allowResign'],
      'APK signing',
      onProgress
    );

    // uber-apk-signer outputs as *-aligned-debugSigned.apk
    const files = await fs.readdir(outputDir);
    const signedFile = files.find((f) =>
      f.toLowerCase().endsWith('.apk') &&
      (f.includes('debugSigned') || f.includes('aligned'))
    );

    onProgress?.({ stage: 'signed', progress: 98, message: 'APK signed' });
    return signedFile ? path.join(outputDir, signedFile) : unsignedApkPath;
  }

  /**
   * Full build pipeline
   */
  async fullBuild(templateApkPath, webAppFiles, appConfig, onProgress) {
    const {
      appName = 'LeapApp',
      packageName = 'com.leaplab.myapp',
      mediaAssets = [],
      permissions = [],
      screenOrientation = null,
    } = appConfig;

    await this.initialize(appName);

    const decodedDir = await this.decodeApk(templateApkPath, onProgress);
    await this.injectAssets(decodedDir, webAppFiles, mediaAssets, onProgress);
    await this.modifyManifest(decodedDir, { appName, packageName, permissions, screenOrientation }, onProgress);
    await this.injectWebViewActivity(decodedDir, packageName, onProgress);

    const unsignedPath = path.join(this.workingDir, 'unsigned.apk');
    await this.rebuildApk(decodedDir, unsignedPath, onProgress);

    const signedOutputDir = path.join(this.workingDir, 'signed');
    await fs.ensureDir(signedOutputDir);
    const signedPath = await this.signApk(unsignedPath, signedOutputDir, onProgress);

    onProgress?.({ stage: 'complete', progress: 100, message: 'Build complete!' });
    return signedPath;
  }

  async cleanup() {
    if (this.workingDir && await fs.pathExists(this.workingDir)) {
      await fs.remove(this.workingDir);
    }
  }
}

module.exports = ApkInjector;
