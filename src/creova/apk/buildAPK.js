/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * APK Builder — High-level build orchestrator
 *
 * Uses htmlGenerator.js to convert AppInverter state → web app files,
 * then ApkInjector to package them into a signed APK.
 *
 * This module can be used standalone (from Node.js) or called by
 * the Electron main process via src/creova/apk/electron-bridge.js.
 */

const ApkInjector = require('./apkInjector');
const { generateWebApp } = require('./htmlGenerator');
const path = require('path');
const fs = require('fs-extra');

const os = require('os');

// Template APK path resolution — works in dev and packaged Electron.
// In a packaged app, __dirname sits inside app.asar which external tools
// (apktool) cannot read.  When the best candidate is an ASAR path we copy
// the file to a real-filesystem temp location so apktool can open it.
function resolveTemplatePath() {
  const candidates = [
    process.resourcesPath && path.join(process.resourcesPath, 'tools', 'base_template.apk'),
    process.resourcesPath && path.join(process.resourcesPath, 'base_template.apk'),
    path.join(__dirname, 'base_template.apk'),
    path.join(__dirname, '..', '..', '..', 'tools', 'base_template.apk'),
  ].filter(Boolean);

  let found = null;
  for (const c of candidates) {
    if (fs.pathExistsSync(c)) { found = c; break; }
  }
  if (!found) found = candidates[0]; // will fail downstream with a clear error

  // If the path lives inside an ASAR archive, copy it out so that
  // external processes (java -jar apktool) can read it.
  if (found && found.includes('.asar' + path.sep)) {
    const tmpDir = path.join(os.tmpdir(), 'leapblocks_apk');
    const realPath = path.join(tmpDir, 'base_template.apk');
    if (!fs.pathExistsSync(realPath)) {
      fs.ensureDirSync(tmpDir);
      fs.copySync(found, realPath);
    }
    return realPath;
  }
  return found;
}

const TEMPLATE_APK = resolveTemplatePath();
const OUTPUT_DIR = path.join(os.tmpdir(), 'leapblocks_output');

// Permissions required by specific component types
const COMPONENT_PERMISSIONS = {
  BluetoothClient: ['android.permission.BLUETOOTH', 'android.permission.BLUETOOTH_ADMIN'],
  BluetoothServer: ['android.permission.BLUETOOTH', 'android.permission.BLUETOOTH_ADMIN'],
  LocationSensor: ['android.permission.ACCESS_FINE_LOCATION', 'android.permission.ACCESS_COARSE_LOCATION'],
  Camera: ['android.permission.CAMERA'],
  Texting: ['android.permission.SEND_SMS'],
  SpeechRecognizer: ['android.permission.RECORD_AUDIO'],
  SoundRecorder: ['android.permission.RECORD_AUDIO'],
  PhoneCall: ['android.permission.CALL_PHONE'],
  ContactPicker: ['android.permission.READ_CONTACTS'],
  ImagePicker: ['android.permission.READ_EXTERNAL_STORAGE'],
  FilePicker: ['android.permission.READ_EXTERNAL_STORAGE'],
};

function collectPermissions(screens = []) {
  const perms = new Set();
  const walk = (components = []) => {
    for (const comp of components) {
      const mapped = COMPONENT_PERMISSIONS[comp.type];
      if (mapped) mapped.forEach(p => perms.add(p));
      if (comp.children?.length) walk(comp.children);
    }
  };
  for (const screen of screens) {
    walk(screen.components || []);
    walk(screen.nonVisibleComponents || []);
  }
  return [...perms];
}

function countVisibleComponents(screens = []) {
  let count = 0;
  const walk = (components = []) => {
    for (const component of components) {
      count += 1;
      if (component.children?.length) walk(component.children);
    }
  };
  for (const screen of screens) {
    walk(screen.components || []);
  }
  return count;
}

function normalizeVersionCode(value) {
  const parsed = Number.parseInt(`${value ?? ''}`, 10);
  if (Number.isFinite(parsed) && parsed > 1) return parsed;
  return Math.floor(Date.now() / 1000);
}

function resolveScreenOrientation(screens = [], designViewport = null) {
  const raw = String(
    screens[0]?.screenOrientation ||
    screens[0]?.ScreenOrientation ||
    designViewport?.orientation ||
    ''
  ).toLowerCase();
  if (raw.includes('portrait')) return 'portrait';
  if (raw.includes('landscape')) return 'landscape';
  return null;
}

class ApkBuilder {
  constructor() {
    this.injector = new ApkInjector();
    this.templatePath = TEMPLATE_APK;
  }

  /**
   * Build an APK from AppInverter state
   *
   * @param {Object} appState - Full serialized state from getSerializedState()
   * @param {Function} onProgress - Progress callback ({ stage, progress, message })
   * @returns {string} Path to the signed APK
   */
  async build(appState, onProgress) {
    const appName = (appState.appName || 'MyApp').replace(/[^a-zA-Z0-9]/g, '') || 'MyApp';
    const packageName = appState.packageName || `com.leaplab.${appName.toLowerCase()}`;
    const versionCode = normalizeVersionCode(appState.versionCode);
    const versionName = String(appState.versionName || '1.0').replace(/'/g, '');
    const normalizedAppState = { ...appState, versionCode, versionName };
    const screens = Array.isArray(appState.screens) ? appState.screens : [];
    const visibleComponentCount = countVisibleComponents(screens);

    try {
      // ── Step 1: Generate web app files ─────────────────────────────────
      onProgress?.({ stage: 'generating', progress: 5, message: 'Generating web application...' });
      onProgress?.({
        stage: 'snapshot',
        progress: 6,
        message: `Project snapshot: ${screens.length || 1} screen(s), ${visibleComponentCount} visible component(s)`,
      });
      if (visibleComponentCount === 0) {
        onProgress?.({
          stage: 'snapshot_warning',
          progress: 7,
          message: 'Warning: no visible components are present in the build payload.',
        });
      }
      const webAppFiles = generateWebApp(normalizedAppState);
      onProgress?.({ stage: 'generated', progress: 10, message: `Generated ${Object.keys(webAppFiles).length} files` });

      // ── Step 2: Check for template APK ────────────────────────────────
      const hasTemplate = await fs.pathExists(this.templatePath);

      if (hasTemplate) {
        // Full injection pipeline with template
        onProgress?.({ stage: 'template_found', progress: 12, message: 'Using WebView template APK' });

        const permissions = collectPermissions(screens);
        const screenOrientation = resolveScreenOrientation(screens, appState.designViewport);

        const signedPath = await this.injector.fullBuild(
          this.templatePath,
          webAppFiles,
          {
            appName,
            packageName,
            mediaAssets: appState.media || [],
            permissions,
            screenOrientation,
          },
          onProgress
        );

        // Copy to output directory
        await fs.ensureDir(OUTPUT_DIR);
        const finalPath = path.join(OUTPUT_DIR, `${appName}.apk`);
        await fs.copy(signedPath, finalPath, { overwrite: true });

        await this.injector.cleanup();
        onProgress?.({ stage: 'complete', progress: 100, message: `Build complete: ${finalPath}` });
        return finalPath;

      } else {
        // No template — build from Leap using APKTool
        onProgress?.({ stage: 'no_template', progress: 12, message: 'No template APK — building from minimal structure' });
        return await this.buildWithoutTemplate(appName, packageName, appState, webAppFiles, onProgress);
      }

    } catch (error) {
      await this.injector.cleanup().catch(() => { });
      throw error;
    }
  }

  /**
   * Build without a pre-existing template APK
   * Creates the minimal APK structure, injects assets, rebuilds, and signs
   */
  async buildWithoutTemplate(appName, packageName, appState, webAppFiles, onProgress) {
    await this.injector.initialize(appName);

    const decodedDir = path.join(this.injector.workingDir, 'decoded');
    const pkgPath = packageName.replace(/\./g, '/');
    const screenOrientation = resolveScreenOrientation(Array.isArray(appState.screens) ? appState.screens : [], appState.designViewport);

    // Create minimal APK structure
    onProgress?.({ stage: 'creating_structure', progress: 15, message: 'Creating APK structure...' });

    await fs.ensureDir(decodedDir);
    await fs.ensureDir(path.join(decodedDir, 'smali', ...pkgPath.split('/')));
    await fs.ensureDir(path.join(decodedDir, 'assets', 'www'));
    await fs.ensureDir(path.join(decodedDir, 'res', 'values'));

    // AndroidManifest.xml
    await fs.writeFile(path.join(decodedDir, 'AndroidManifest.xml'), `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${packageName}">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <application
        android:label="${appName}"
        android:usesCleartextTraffic="true"
        android:hardwareAccelerated="true">
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|screenSize|keyboard|keyboardHidden"${screenOrientation ? `
            android:screenOrientation="${screenOrientation}"` : ''}
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`);

    // res/values/strings.xml
    await fs.writeFile(path.join(decodedDir, 'res', 'values', 'strings.xml'), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${appName}</string>
</resources>`);

    const parsedVersionCode = Number.parseInt(`${appState.versionCode ?? 1}`, 10);
    const versionCode = Number.isFinite(parsedVersionCode) && parsedVersionCode > 0 ? parsedVersionCode : 1;
    const versionName = String(appState.versionName || '1.0').replace(/'/g, '');

    // apktool.yml
    await fs.writeFile(path.join(decodedDir, 'apktool.yml'), `!!brut.androlib.meta.MetaInfo
apkFileName: ${appName}.apk
compressionType: false
doNotCompress:
- resources.arsc
isFrameworkApk: false
packageInfo:
  forcedPackageId: '127'
  renameManifestPackage: null
sdkInfo:
  minSdkVersion: '21'
  targetSdkVersion: '33'
usesFramework:
  ids:
  - 1
  tag: null
versionInfo:
  versionCode: ${versionCode}
  versionName: '${versionName}'
`);

    // Inject permissions
    const screens = Array.isArray(appState.screens) ? appState.screens : [];
    const permissions = collectPermissions(screens);

    // Write updated manifest with all required permissions
    let manifest = await fs.readFile(path.join(decodedDir, 'AndroidManifest.xml'), 'utf8');
    for (const perm of permissions) {
      if (!manifest.includes(perm)) {
        manifest = manifest.replace('</manifest>', `    <uses-permission android:name="${perm}" />\n</manifest>`);
      }
    }
    await fs.writeFile(path.join(decodedDir, 'AndroidManifest.xml'), manifest);

    // Inject web assets
    onProgress?.({ stage: 'injecting_assets', progress: 30, message: 'Injecting web assets...' });
    await this.injector.injectAssets(decodedDir, webAppFiles, appState.media || [], onProgress);

    // Inject WebView activity smali
    onProgress?.({ stage: 'injecting_smali', progress: 50, message: 'Injecting WebView activity...' });
    await this.injector.injectWebViewActivity(decodedDir, packageName, onProgress);

    // Rebuild
    const unsignedPath = path.join(this.injector.workingDir, 'unsigned.apk');
    await this.injector.rebuildApk(decodedDir, unsignedPath, onProgress);

    // Sign
    const signedOutputDir = path.join(this.injector.workingDir, 'signed');
    await fs.ensureDir(signedOutputDir);
    const signedPath = await this.injector.signApk(unsignedPath, signedOutputDir, onProgress);

    // Copy to output
    await fs.ensureDir(OUTPUT_DIR);
    const finalPath = path.join(OUTPUT_DIR, `${appName}.apk`);
    await fs.copy(signedPath, finalPath, { overwrite: true });

    await this.injector.cleanup();
    onProgress?.({ stage: 'complete', progress: 100, message: `Build complete: ${finalPath}` });
    return finalPath;
  }
}

module.exports = ApkBuilder;
