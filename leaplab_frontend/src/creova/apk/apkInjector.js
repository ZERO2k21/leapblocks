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
    // Development — src/tools/
    path.join(__dirname, '..', '..', 'tools', toolName),
    // Development — project root /tools/ (legacy)
    path.join(__dirname, '..', '..', '..', 'tools', toolName),
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
      console.log(`[ApkInjector runJava] Executing: ${javaBin} -jar ${args.join(' ')}`);
      console.log(`[ApkInjector runJava] Working Dir: ${this.workingDir}`);
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
          let buffer = Buffer.from(b64, 'base64');
          if (buffer.length <= 10) {
            const rootDir = path.join(__dirname, '..', '..', '..');
            if (item.filename.endsWith('.mp4')) {
              const testMp4 = path.join(rootDir, 'node_modules', '@chromatic-com', 'storybook', 'assets', 'visual-test-illustration.mp4');
              if (await fs.pathExists(testMp4)) {
                buffer = await fs.readFile(testMp4);
              }
            } else if (item.filename.endsWith('.mp3')) {
              const testMp3 = path.join(rootDir, 'build', 'assets', 'sounds', 'robot.mp3.mp3');
              if (await fs.pathExists(testMp3)) {
                buffer = await fs.readFile(testMp3);
              }
            }
          }
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
  async modifyManifest(decodedDir, { appName, packageName, permissions = [], screenOrientation = null, hasCustomIcon = false }, onProgress) {
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

    // Ensure icon and roundIcon attributes are in the <application> tag only if we injected custom ones
    if (hasCustomIcon) {
      if (!manifest.includes('android:icon=')) {
        manifest = manifest.replace('<application', '<application android:icon="@mipmap/ic_launcher"');
      }
      if (!manifest.includes('android:roundIcon=')) {
        manifest = manifest.replace('<application', '<application android:roundIcon="@mipmap/ic_launcher_round"');
      }
    }

    if (screenOrientation && !manifest.includes('android:screenOrientation=')) {
      manifest = manifest.replace(
        /(<activity\b[^>]*android:name="\.MainActivity"[^>]*)(>)/,
        `$1 android:screenOrientation="${screenOrientation}"$2`
      );
    }

    // Set keyboard mode to adjustPan to avoid squeezing the UI layout/size when keyboard is opened
    if (!manifest.includes('android:windowSoftInputMode=')) {
      manifest = manifest.replace(
        /(<activity\b[^>]*android:name="\.MainActivity"[^>]*)(>)/,
        `$1 android:windowSoftInputMode="adjustPan"$2`
      );
    }

    await fs.writeFile(manifestPath, manifest);
    onProgress?.({ stage: 'manifest_done', progress: 60, message: 'Manifest patched' });
  }

  /**
   * Generate BluetoothBridge.smali — native Android Bluetooth API exposed
   * as a JavaScriptInterface object (window.Android) in the WebView.
   */
  generateBluetoothBridgeSmali(pkgPath) {
    return `.class public L${pkgPath}/BluetoothBridge;
.super Ljava/lang/Object;
.source "BluetoothBridge.java"

.field private adapter:Landroid/bluetooth/BluetoothAdapter;
.field private btSocket:Landroid/bluetooth/BluetoothSocket;
.field private outStream:Ljava/io/OutputStream;
.field private inStream:Ljava/io/InputStream;

.method public constructor <init>()V
    .registers 2
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V
    invoke-static {}, Landroid/bluetooth/BluetoothAdapter;->getDefaultAdapter()Landroid/bluetooth/BluetoothAdapter;
    move-result-object v0
    iput-object v0, p0, L${pkgPath}/BluetoothBridge;->adapter:Landroid/bluetooth/BluetoothAdapter;
    return-void
.end method

# virtual methods
.method public isAvailable()Z
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .registers 2
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->adapter:Landroid/bluetooth/BluetoothAdapter;
    if-eqz v0, :cond_4
    const/4 v0, 0x1
    return v0
    :cond_4
    const/4 v0, 0x0
    return v0
.end method

.method public isEnabled()Z
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .registers 2
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->adapter:Landroid/bluetooth/BluetoothAdapter;
    if-eqz v0, :cond_a
    invoke-virtual {v0}, Landroid/bluetooth/BluetoothAdapter;->isEnabled()Z
    move-result v0
    return v0
    :cond_a
    const/4 v0, 0x0
    return v0
.end method

.method public enable()Z
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .registers 3
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->adapter:Landroid/bluetooth/BluetoothAdapter;
    if-eqz v0, :cond_c
    invoke-virtual {v0}, Landroid/bluetooth/BluetoothAdapter;->enable()Z
    move-result v0
    return v0
    :cond_c
    const/4 v0, 0x0
    return v0
.end method

.method public getPairedDevices()Ljava/lang/String;
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .registers 7
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->adapter:Landroid/bluetooth/BluetoothAdapter;
    if-nez v0, :cond_7
    const-string v0, "[]"
    return-object v0
    :cond_7
    invoke-virtual {v0}, Landroid/bluetooth/BluetoothAdapter;->getBondedDevices()Ljava/util/Set;
    move-result-object v0
    if-eqz v0, :cond_11
    invoke-interface {v0}, Ljava/util/Set;->isEmpty()Z
    move-result v1
    if-eqz v1, :cond_14
    :cond_11
    const-string v0, "[]"
    return-object v0
    :cond_14
    new-instance v1, Lorg/json/JSONArray;
    invoke-direct {v1}, Lorg/json/JSONArray;-><init>()V
    invoke-interface {v0}, Ljava/util/Set;->iterator()Ljava/util/Iterator;
    move-result-object v0
    :cond_1c
    :goto_1c
    invoke-interface {v0}, Ljava/util/Iterator;->hasNext()Z
    move-result v2
    if-eqz v2, :cond_46
    invoke-interface {v0}, Ljava/util/Iterator;->next()Ljava/lang/Object;
    move-result-object v2
    check-cast v2, Landroid/bluetooth/BluetoothDevice;
    new-instance v3, Lorg/json/JSONObject;
    invoke-direct {v3}, Lorg/json/JSONObject;-><init>()V
    :try_start_2a
    const-string v4, "name"
    invoke-virtual {v2}, Landroid/bluetooth/BluetoothDevice;->getName()Ljava/lang/String;
    move-result-object v5
    if-eqz v5, :cond_34
    move-object v5, v5
    goto :goto_36
    :cond_34
    const-string v5, "Unknown"
    :goto_36
    invoke-virtual {v3, v4, v5}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;
    const-string v4, "address"
    invoke-virtual {v2}, Landroid/bluetooth/BluetoothDevice;->getAddress()Ljava/lang/String;
    move-result-object v2
    invoke-virtual {v3, v4, v2}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;
    invoke-virtual {v1, v3}, Lorg/json/JSONArray;->put(Ljava/lang/Object;)Lorg/json/JSONArray;
    :try_end_44
    .catch Lorg/json/JSONException; {:try_start_2a .. :try_end_44} :catch_45
    goto :goto_1c
    :catch_45
    move-exception v4
    goto :goto_1c
    :cond_46
    invoke-virtual {v1}, Lorg/json/JSONArray;->toString()Ljava/lang/String;
    move-result-object v0
    return-object v0
.end method

.method public connect(Ljava/lang/String;)Ljava/lang/String;
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .registers 6
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->adapter:Landroid/bluetooth/BluetoothAdapter;
    if-nez v0, :cond_7
    const-string v0, "Bluetooth Adapter not available"
    return-object v0
    :cond_7
    :try_start_7
    invoke-virtual {v0, p1}, Landroid/bluetooth/BluetoothAdapter;->getRemoteDevice(Ljava/lang/String;)Landroid/bluetooth/BluetoothDevice;
    move-result-object p1

    # Standard connection attempt
    :try_start_c
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    if-eqz v0, :cond_19
    invoke-virtual {v0}, Landroid/bluetooth/BluetoothSocket;->close()V
    const/4 v0, 0x0
    iput-object v0, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    :cond_19
    const-string v0, "00001101-0000-1000-8000-00805F9B34FB"
    invoke-static {v0}, Ljava/util/UUID;->fromString(Ljava/lang/String;)Ljava/util/UUID;
    move-result-object v0
    invoke-virtual {p1, v0}, Landroid/bluetooth/BluetoothDevice;->createRfcommSocketToServiceRecord(Ljava/util/UUID;)Landroid/bluetooth/BluetoothSocket;
    move-result-object v0
    iput-object v0, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->adapter:Landroid/bluetooth/BluetoothAdapter;
    invoke-virtual {v0}, Landroid/bluetooth/BluetoothAdapter;->cancelDiscovery()Z
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    invoke-virtual {v0}, Landroid/bluetooth/BluetoothSocket;->connect()V
    :try_end_35
    .catch Ljava/io/IOException; {:try_start_c .. :try_end_35} :catch_36
    goto :goto_78

    :catch_36
    # Standard connection failed, try reflection fallback on channel 1
    move-exception v0
    :try_start_38
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    if-eqz v0, :cond_45
    invoke-virtual {v0}, Landroid/bluetooth/BluetoothSocket;->close()V
    const/4 v0, 0x0
    iput-object v0, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    :cond_45
    invoke-virtual {p1}, Ljava/lang/Object;->getClass()Ljava/lang/Class;
    move-result-object v0
    const/4 v1, 0x1
    new-array v1, v1, [Ljava/lang/Class;
    const/4 v2, 0x0
    sget-object v3, Ljava/lang/Integer;->TYPE:Ljava/lang/Class;
    aput-object v3, v1, v2
    const-string v2, "createRfcommSocket"
    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;
    move-result-object v0
    const/4 v1, 0x1
    new-array v1, v1, [Ljava/lang/Object;
    const/4 v2, 0x1
    invoke-static {v2}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;
    move-result-object v2
    const/4 v3, 0x0
    aput-object v2, v1, v3
    invoke-virtual {v0, p1, v1}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    move-result-object p1
    check-cast p1, Landroid/bluetooth/BluetoothSocket;
    iput-object p1, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    iget-object p1, p0, L${pkgPath}/BluetoothBridge;->adapter:Landroid/bluetooth/BluetoothAdapter;
    invoke-virtual {p1}, Landroid/bluetooth/BluetoothAdapter;->cancelDiscovery()Z
    iget-object p1, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    invoke-virtual {p1}, Landroid/bluetooth/BluetoothSocket;->connect()V
    :try_end_75
    .catch Ljava/lang/Exception; {:try_start_38 .. :try_end_75} :catch_76

    goto :goto_78

    :catch_76
    move-exception p1
    throw p1

    :goto_78
    # Successfully connected, get streams
    iget-object p1, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    invoke-virtual {p1}, Landroid/bluetooth/BluetoothSocket;->getOutputStream()Ljava/io/OutputStream;
    move-result-object p1
    iput-object p1, p0, L${pkgPath}/BluetoothBridge;->outStream:Ljava/io/OutputStream;
    iget-object p1, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    invoke-virtual {p1}, Landroid/bluetooth/BluetoothSocket;->getInputStream()Ljava/io/InputStream;
    move-result-object p1
    iput-object p1, p0, L${pkgPath}/BluetoothBridge;->inStream:Ljava/io/InputStream;
    const-string p1, "SUCCESS"
    return-object p1
    :try_end_8e
    .catch Ljava/lang/Throwable; {:try_start_7 .. :try_end_8e} :catch_8f

    :catch_8f
    move-exception v0
    invoke-virtual {p0}, L${pkgPath}/BluetoothBridge;->disconnect()V
    invoke-virtual {v0}, Ljava/lang/Throwable;->toString()Ljava/lang/String;
    move-result-object v0
    return-object v0
.end method

.method public disconnect()V
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .registers 3
    :try_start_0
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->inStream:Ljava/io/InputStream;
    if-eqz v0, :cond_9
    invoke-virtual {v0}, Ljava/io/InputStream;->close()V
    const/4 v0, 0x0
    iput-object v0, p0, L${pkgPath}/BluetoothBridge;->inStream:Ljava/io/InputStream;
    :cond_9
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->outStream:Ljava/io/OutputStream;
    if-eqz v0, :cond_12
    invoke-virtual {v0}, Ljava/io/OutputStream;->close()V
    const/4 v0, 0x0
    iput-object v0, p0, L${pkgPath}/BluetoothBridge;->outStream:Ljava/io/OutputStream;
    :cond_12
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    if-eqz v0, :cond_1b
    invoke-virtual {v0}, Landroid/bluetooth/BluetoothSocket;->close()V
    const/4 v0, 0x0
    iput-object v0, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    :cond_1b
    :goto_1b
    return-void
    :catch_1c
    move-exception v0
    goto :goto_1b
    :try_end_1d
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_1d} :catch_1c
.end method

.method public isConnected()Z
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .registers 2
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->btSocket:Landroid/bluetooth/BluetoothSocket;
    if-eqz v0, :cond_a
    invoke-virtual {v0}, Landroid/bluetooth/BluetoothSocket;->isConnected()Z
    move-result v0
    return v0
    :cond_a
    const/4 v0, 0x0
    return v0
.end method

.method public sendText(Ljava/lang/String;)Z
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .registers 3
    :try_start_0
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->outStream:Ljava/io/OutputStream;
    if-nez v0, :cond_6
    const/4 p1, 0x0
    return p1
    :cond_6
    invoke-virtual {p1}, Ljava/lang/String;->getBytes()[B
    move-result-object p1
    invoke-virtual {v0, p1}, Ljava/io/OutputStream;->write([B)V
    iget-object p1, p0, L${pkgPath}/BluetoothBridge;->outStream:Ljava/io/OutputStream;
    invoke-virtual {p1}, Ljava/io/OutputStream;->flush()V
    const/4 p1, 0x1
    return p1
    :try_end_12
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_12} :catch_13
    :catch_13
    move-exception v0
    const/4 p1, 0x0
    return p1
.end method

.method public sendBytes(Ljava/lang/String;)Z
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .registers 8
    :try_start_0
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->outStream:Ljava/io/OutputStream;
    if-eqz v0, :cond_7

    const/4 v0, 0x0
    return v0

    :cond_7
    if-eqz p1, :cond_d

    const/4 v0, 0x1
    return v0

    :cond_d
    invoke-virtual {p1}, Ljava/lang/String;->length()I
    move-result v0
    if-eqz v0, :cond_13

    const/4 v0, 0x1
    return v0

    :cond_13
    const-string v0, ","
    invoke-virtual {p1, v0}, Ljava/lang/String;->split(Ljava/lang/String;)[Ljava/lang/String;
    move-result-object p1

    array-length v0, p1
    new-array v1, v0, [B

    const/4 v2, 0x0
    :goto_1f
    if-ge v2, v0, :cond_34

    aget-object v3, p1, v2
    invoke-virtual {v3}, Ljava/lang/String;->trim()Ljava/lang/String;
    move-result-object v3
    invoke-static {v3}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I
    move-result v3
    int-to-byte v3, v3
    aput-byte v3, v1, v2

    add-int/lit8 v2, v2, 0x1
    goto :goto_1f

    :cond_34
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->outStream:Ljava/io/OutputStream;
    invoke-virtual {v0, v1}, Ljava/io/OutputStream;->write([B)V
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->outStream:Ljava/io/OutputStream;
    invoke-virtual {v0}, Ljava/io/OutputStream;->flush()V
    const/4 v0, 0x1
    return v0
    :try_end_40
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_40} :catch_41

    :catch_41
    move-exception v0
    const/4 v0, 0x0
    return v0
.end method

.method public receiveText()Ljava/lang/String;
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .registers 5
    :try_start_0
    iget-object v0, p0, L${pkgPath}/BluetoothBridge;->inStream:Ljava/io/InputStream;
    if-nez v0, :cond_7
    const-string v0, ""
    return-object v0
    :cond_7
    invoke-virtual {v0}, Ljava/io/InputStream;->available()I
    move-result v1
    if-gtz v1, :cond_10
    const-string v0, ""
    return-object v0
    :cond_10
    new-array v2, v1, [B
    invoke-virtual {v0, v2}, Ljava/io/InputStream;->read([B)I
    move-result v0
    if-lez v0, :cond_1e
    new-instance v1, Ljava/lang/String;
    const/4 v3, 0x0
    invoke-direct {v1, v2, v3, v0}, Ljava/lang/String;-><init>([BII)V
    return-object v1
    :cond_1e
    const-string v0, ""
    return-object v0
    :try_end_21
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_21} :catch_22
    :catch_22
    move-exception v0
    const-string v0, ""
    return-object v0
.end method

.method public performWebRequest(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .registers 11

    const/4 v0, 0x0
    :try_start_0
    invoke-virtual {p1}, Ljava/lang/String;->trim()Ljava/lang/String;
    move-result-object p1
    new-instance v1, Ljava/net/URL;
    invoke-direct {v1, p1}, Ljava/net/URL;-><init>(Ljava/lang/String;)V

    invoke-virtual {v1}, Ljava/net/URL;->openConnection()Ljava/net/URLConnection;
    move-result-object v1
    check-cast v1, Ljava/net/HttpURLConnection;
    move-object v0, v1

    # Set method
    invoke-virtual {v0, p2}, Ljava/net/HttpURLConnection;->setRequestMethod(Ljava/lang/String;)V

    # Set timeouts (10000ms)
    const/16 v1, 0x2710
    invoke-virtual {v0, v1}, Ljava/net/HttpURLConnection;->setConnectTimeout(I)V
    invoke-virtual {v0, v1}, Ljava/net/HttpURLConnection;->setReadTimeout(I)V

    # Set headers if not null
    if-eqz p3, :cond_header_end
    invoke-virtual {p3}, Ljava/lang/String;->length()I
    move-result v1
    if-lez v1, :cond_header_end

    :try_start_json
    new-instance v1, Lorg/json/JSONObject;
    invoke-direct {v1, p3}, Lorg/json/JSONObject;-><init>(Ljava/lang/String;)V

    invoke-virtual {v1}, Lorg/json/JSONObject;->keys()Ljava/util/Iterator;
    move-result-object p3

    :goto_keys
    invoke-interface {p3}, Ljava/util/Iterator;->hasNext()Z
    move-result v2
    if-eqz v2, :cond_header_end

    invoke-interface {p3}, Ljava/util/Iterator;->next()Ljava/lang/Object;
    move-result-object v2
    check-cast v2, Ljava/lang/String;

    const-string v3, ""
    invoke-virtual {v1, v2, v3}, Lorg/json/JSONObject;->optString(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    move-result-object v3

    invoke-virtual {v0, v2, v3}, Ljava/net/HttpURLConnection;->setRequestProperty(Ljava/lang/String;Ljava/lang/String;)V
    goto :goto_keys
    :try_end_json
    .catch Ljava/lang/Exception; {:try_start_json .. :try_end_json} :catch_json

    :catch_json
    # ignore

    :cond_header_end
    # Send body if POST/PUT/PATCH and body is not empty
    if-eqz p4, :cond_57
    invoke-virtual {p4}, Ljava/lang/String;->length()I
    move-result v1
    if-lez v1, :cond_57

    const-string v1, "POST"
    invoke-virtual {p2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v1
    if-nez v1, :cond_4c
    const-string v1, "PUT"
    invoke-virtual {p2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v1
    if-nez v1, :cond_4c
    const-string v1, "PATCH"
    invoke-virtual {p2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result p2
    if-eqz p2, :cond_57

    :cond_4c
    const/4 p2, 0x1
    invoke-virtual {v0, p2}, Ljava/net/HttpURLConnection;->setDoOutput(Z)V
    invoke-virtual {v0}, Ljava/net/HttpURLConnection;->getOutputStream()Ljava/io/OutputStream;
    move-result-object p2
    const-string v1, "UTF-8"
    invoke-virtual {p4, v1}, Ljava/lang/String;->getBytes(Ljava/lang/String;)[B
    move-result-object p4
    invoke-virtual {p2, p4}, Ljava/io/OutputStream;->write([B)V
    invoke-virtual {p2}, Ljava/io/OutputStream;->flush()V
    invoke-virtual {p2}, Ljava/io/OutputStream;->close()V

    :cond_57
    # Get response code
    invoke-virtual {v0}, Ljava/net/HttpURLConnection;->getResponseCode()I
    move-result p2

    # Check input or error stream
    const/16 p4, 0x190
    if-ge p2, p4, :cond_6a
    invoke-virtual {v0}, Ljava/net/HttpURLConnection;->getInputStream()Ljava/io/InputStream;
    move-result-object p4
    goto :goto_6e
    :cond_6a
    invoke-virtual {v0}, Ljava/net/HttpURLConnection;->getErrorStream()Ljava/io/InputStream;
    move-result-object p4

    :goto_6e
    if-nez p4, :cond_8b
    new-instance p4, Ljava/lang/StringBuilder;
    invoke-direct {p4}, Ljava/lang/StringBuilder;-><init>()V
    invoke-virtual {p4, p2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;
    const-string p2, "|text/plain|"
    invoke-virtual {p4, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {p4}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
    move-result-object p2
    invoke-virtual {v0}, Ljava/net/HttpURLConnection;->disconnect()V
    return-object p2

    :cond_8b
    new-instance v1, Ljava/io/ByteArrayOutputStream;
    invoke-direct {v1}, Ljava/io/ByteArrayOutputStream;-><init>()V
    const/16 v2, 0x400
    new-array v2, v2, [B

    :goto_94
    invoke-virtual {p4, v2}, Ljava/io/InputStream;->read([B)I
    move-result v3
    const/4 v4, -0x1
    if-eq v3, v4, :cond_a1
    const/4 v4, 0x0
    invoke-virtual {v1, v2, v4, v3}, Ljava/io/ByteArrayOutputStream;->write([BII)V
    goto :goto_94

    :cond_a1
    invoke-virtual {p4}, Ljava/io/InputStream;->close()V

    const-string p4, "UTF-8"
    invoke-virtual {v1, p4}, Ljava/io/ByteArrayOutputStream;->toString(Ljava/lang/String;)Ljava/lang/String;
    move-result-object p4

    invoke-virtual {v0}, Ljava/net/HttpURLConnection;->getContentType()Ljava/lang/String;
    move-result-object v1
    if-nez v1, :cond_b2
    const-string v1, "text/plain"

    :cond_b2
    new-instance v2, Ljava/lang/StringBuilder;
    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V
    invoke-virtual {v2, p2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;
    const-string p2, "|"
    invoke-virtual {v2, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {v2, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {v2, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {v2, p4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
    move-result-object p2
    invoke-virtual {v0}, Ljava/net/HttpURLConnection;->disconnect()V
    return-object p2
    :try_end_cf
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_cf} :catch_d0

    :catch_d0
    move-exception p2
    if-eqz v0, :cond_d6
    invoke-virtual {v0}, Ljava/net/HttpURLConnection;->disconnect()V
    :cond_d6
    new-instance p4, Ljava/lang/StringBuilder;
    invoke-direct {p4}, Ljava/lang/StringBuilder;-><init>()V
    const-string v0, "0|text/plain|"
    invoke-virtual {p4, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {p2}, Ljava/lang/Exception;->toString()Ljava/lang/String;
    move-result-object p2
    invoke-virtual {p4, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {p4}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
    move-result-object p2
    return-object p2
.end method
`;
  }

  generateLeapChromeClientSmali(pkgPath) {
    const template = fs.readFileSync(path.join(__dirname, 'templates', 'LeapChromeClient.smali.template'), 'utf8');
    return template.replace(/\{\{packageName\}\}/g, pkgPath);
  }

  generateLeapWebViewClientSmali(pkgPath) {
    const template = fs.readFileSync(path.join(__dirname, 'templates', 'LeapWebViewClient.smali.template'), 'utf8');
    return template.replace(/\{\{packageName\}\}/g, pkgPath);
  }

  /**
   * Inject app icon into the decoded APK mipmap folders at all densities
   */
  async injectAppIcon(decodedDir, renderedIconsDir, onProgress) {
    let sourceDir = renderedIconsDir;
    if (!sourceDir) {
      const bundledDir = path.join(__dirname, 'default_icons');
      if (await fs.pathExists(bundledDir)) {
        sourceDir = bundledDir;
      }
    }
    if (!sourceDir) return;
    onProgress?.({ stage: 'icon_inject', progress: 72, message: `Injecting pre-rendered custom app icons...` });

    try {
      // 1. Delete anydpi XMLs if they exist to prevent them overriding PNGs on Android 8.0+
      const anyDpiDir = path.join(decodedDir, 'res', 'mipmap-anydpi-v26');
      if (await fs.pathExists(anyDpiDir)) {
        await fs.remove(anyDpiDir);
      }

      // 2. Define standard densities
      const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];

      for (const d of densities) {
        const sourcePng = path.join(sourceDir, `${d}.png`);
        if (await fs.pathExists(sourcePng)) {
          const mipmapDir = path.join(decodedDir, 'res', `mipmap-${d}`);
          await fs.ensureDir(mipmapDir);

          await fs.copy(sourcePng, path.join(mipmapDir, 'ic_launcher.png'));
          await fs.copy(sourcePng, path.join(mipmapDir, 'ic_launcher_round.png'));
        }
      }

      onProgress?.({ stage: 'icon_inject_done', progress: 74, message: 'Custom app icons injected successfully' });
    } catch (err) {
      onProgress?.({ stage: 'icon_inject_failed', message: `Icon injection failed: ${err.message}. Using default template icon.` });
    }
  }

  /**
   * Inject WebView-based MainActivity.smali and native Bluetooth bridge
   */
  async injectWebViewActivity(decodedDir, packageName, permissions = [], onProgress) {
    if (typeof permissions === 'function') {
      onProgress = permissions;
      permissions = [];
    }

    onProgress?.({ stage: 'smali', progress: 65, message: 'Injecting WebView activity...' });

    const pkgPath = packageName.replace(/\./g, '/');
    const smaliDir = path.join(decodedDir, 'smali', ...pkgPath.split('/'));
    await fs.ensureDir(smaliDir);

    const smaliPkg = 'L' + pkgPath + '/';

    // ── Write BluetoothBridge.smali ──────────────────────────────────────
    await fs.writeFile(
      path.join(smaliDir, 'BluetoothBridge.smali'),
      this.generateBluetoothBridgeSmali(pkgPath)
    );

    // ── Write LeapChromeClient.smali ──────────────────────────────────────
    await fs.writeFile(
      path.join(smaliDir, 'LeapChromeClient.smali'),
      this.generateLeapChromeClientSmali(pkgPath)
    );

    // ── Write LeapWebViewClient.smali ──────────────────────────────────────
    await fs.writeFile(
      path.join(smaliDir, 'LeapWebViewClient.smali'),
      this.generateLeapWebViewClientSmali(pkgPath)
    );

    // Filter dynamic runtime permissions
    const runtimePerms23 = [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.SEND_SMS',
      'android.permission.CALL_PHONE',
      'android.permission.READ_CONTACTS',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE'
    ];

    const runtimePerms31 = [
      'android.permission.BLUETOOTH_CONNECT',
      'android.permission.BLUETOOTH_SCAN',
      'android.permission.BLUETOOTH_ADVERTISE'
    ];

    const needed23 = permissions.filter(p => runtimePerms23.includes(p));
    const needed31 = permissions.filter(p => runtimePerms31.includes(p));

    let permissionCode = '';
    if (needed23.length > 0 || needed31.length > 0) {
      permissionCode += `
    # Check SDK version
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I
    const/16 v1, 0x17 # 23
    if-lt v0, v1, :cond_no_perms
`;

      if (needed31.length > 0) {
        permissionCode += `
    const/16 v1, 0x1f # 31
    if-lt v0, v1, :cond_api_23_30

    # API 31+ permissions (both API 31 and API 23 permissions)
    const/4 v1, ${needed31.length + needed23.length}
    new-array v1, v1, [Ljava/lang/String;
`;
        let idx = 0;
        for (const p of [...needed31, ...needed23]) {
          permissionCode += `    const/4 v2, ${idx}\n    const-string v3, "${p}"\n    aput-object v3, v1, v2\n`;
          idx++;
        }
        permissionCode += `    const/16 v2, 0x65
    invoke-virtual {p0, v1, v2}, Landroid/app/Activity;->requestPermissions([Ljava/lang/String;I)V
    goto :cond_no_perms

    :cond_api_23_30
`;
      }

      if (needed23.length > 0) {
        permissionCode += `
    # API 23-30 permissions
    const/4 v1, ${needed23.length}
    new-array v1, v1, [Ljava/lang/String;
`;
        let idx = 0;
        for (const p of needed23) {
          permissionCode += `    const/4 v2, ${idx}\n    const-string v3, "${p}"\n    aput-object v3, v1, v2\n`;
          idx++;
        }
        permissionCode += `    const/16 v2, 0x65
    invoke-virtual {p0, v1, v2}, Landroid/app/Activity;->requestPermissions([Ljava/lang/String;I)V
`;
      }

      permissionCode += `
    :cond_no_perms
`;
    }

    // ── Write MainActivity.smali with JavaScriptInterface for Bluetooth ───
    const smali = fs.readFileSync(path.join(__dirname, 'templates', 'MainActivity.smali.template'), 'utf8')
      .replace(/\{\{smaliPkg\}\}/g, smaliPkg)
      .replace(/\{\{permissionCode\}\}/g, permissionCode)
      .replace(/\{\{packageName\}\}/g, pkgPath);

    await fs.writeFile(path.join(smaliDir, 'MainActivity.smali'), smali);
    onProgress?.({ stage: 'smali_done', progress: 70, message: 'WebView activity and Bluetooth bridge injected' });
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
      renderedIconsDir = null,
    } = appConfig;

    await this.initialize(appName);

    const decodedDir = await this.decodeApk(templateApkPath, onProgress);
    await this.injectAssets(decodedDir, webAppFiles, mediaAssets, onProgress);
    const hasCustomIcon = !!renderedIconsDir || fs.pathExistsSync(path.join(__dirname, 'default_icons'));
    await this.modifyManifest(decodedDir, { appName, packageName, permissions, screenOrientation, hasCustomIcon }, onProgress);
    await this.injectWebViewActivity(decodedDir, packageName, permissions, onProgress);
    await this.injectAppIcon(decodedDir, renderedIconsDir, onProgress);

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
