import ApkInjector from './apkInjector';
import { generateWebApp } from './htmlGenerator';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

interface ProgressEvent {
  stage: string;
  progress?: number;
  message?: string;
}

interface AppState {
  appName?: string;
  packageName?: string;
  versionCode?: number | string;
  versionName?: string;
  screens?: any[];
  media?: any[];
  renderedIconsDir?: string;
  designViewport?: { orientation?: string };
  [key: string]: any;
}

interface ComponentItem {
  type: string;
  children?: ComponentItem[];
}

interface Screen {
  components?: ComponentItem[];
  nonVisibleComponents?: ComponentItem[];
  screenOrientation?: string;
  ScreenOrientation?: string;
}

const COMPONENT_PERMISSIONS: Record<string, string[]> = {
  BluetoothClient: ['android.permission.BLUETOOTH', 'android.permission.BLUETOOTH_ADMIN', 'android.permission.BLUETOOTH_SCAN', 'android.permission.BLUETOOTH_CONNECT', 'android.permission.BLUETOOTH_ADVERTISE'],
  BluetoothServer: ['android.permission.BLUETOOTH', 'android.permission.BLUETOOTH_ADMIN', 'android.permission.BLUETOOTH_SCAN', 'android.permission.BLUETOOTH_CONNECT', 'android.permission.BLUETOOTH_ADVERTISE'],
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

function collectPermissions(screens: Screen[] = []): string[] {
  const perms = new Set<string>();
  const walk = (components: ComponentItem[] = []) => {
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

function collectMediaAssets(screens: Screen[] = [], explicitMedia: any[] = []): any[] {
  const mediaMap = new Map<string, any>();
  const explicitByName = new Map<string, any>();
  for (const item of explicitMedia) {
    const rawName = item.filename || item.name || item.path;
    if (rawName) {
      const cleanName = path.basename(String(rawName));
      mediaMap.set(cleanName, item);
      explicitByName.set(cleanName, item);
      console.log(`[APK-BUILDER] collectMedia: explicit media "${cleanName}" hasData=${!!item.data} dataLen=${item.data ? String(item.data).length : 0}`);
    }
  }

  const checkAndAdd = (val: unknown) => {
    if (!val || typeof val !== 'string') return;
    const str = val.trim();
    if (!str || str.startsWith('http://') || str.startsWith('https://') || str.startsWith('blob:')) return;

    let cleanName = str;
    if (cleanName.startsWith('file:')) {
      cleanName = cleanName.replace(/^file:\/\/\/?/i, '');
    }
    if (cleanName.includes('/') || cleanName.includes('\\')) {
      cleanName = path.basename(cleanName);
    }
    try { cleanName = decodeURIComponent(cleanName); } catch (_) {}
    if (cleanName.startsWith('media/')) cleanName = cleanName.substring(6);

    if (cleanName && !mediaMap.has(cleanName)) {
      const matchedExplicit = explicitByName.get(cleanName)
        || Array.from(explicitByName.entries()).find(([k]) => k.toLowerCase() === cleanName.toLowerCase())?.[1];
      if (matchedExplicit && matchedExplicit.data) {
        console.log(`[APK-BUILDER] collectMedia: component ref "${cleanName}" matched explicit media`);
        mediaMap.set(cleanName, { filename: cleanName, data: matchedExplicit.data, type: matchedExplicit.type });
      } else {
        console.log(`[APK-BUILDER] collectMedia: component ref "${cleanName}" has NO matching media — using raw string as data`);
        mediaMap.set(cleanName, { filename: cleanName, data: str });
      }
    }
  };

  const walk = (components: ComponentItem[] = []) => {
    for (const comp of components) {
      const props = (comp as any).props || {};
      checkAndAdd(props.Picture);
      checkAndAdd(props.Image);
      checkAndAdd(props.Source);
      checkAndAdd(props.source);
      if (comp.children?.length) walk(comp.children);
    }
  };

  for (const screen of screens) {
    checkAndAdd((screen as any).backgroundImage);
    checkAndAdd((screen as any).BackgroundImage);
    walk(screen.components || []);
    walk(screen.nonVisibleComponents || []);
  }

  return Array.from(mediaMap.values());
}

function countVisibleComponents(screens: Screen[] = []): number {
  let count = 0;
  const walk = (components: ComponentItem[] = []) => {
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

function normalizeVersionCode(value: unknown): number {
  const parsed = Number.parseInt(`${value ?? ''}`, 10);
  if (Number.isFinite(parsed) && parsed > 1) return parsed;
  return Math.floor(Date.now() / 1000);
}

function resolveScreenOrientation(screens: Screen[] = [], designViewport: { orientation?: string } | null = null): string | null {
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

function resolveTemplatePath(): string {
  const candidates: string[] = [
    (process as any).resourcesPath && path.join((process as any).resourcesPath, 'tools', 'base_template.apk'),
    (process as any).resourcesPath && path.join((process as any).resourcesPath, 'base_template.apk'),
    path.join(__dirname, 'base_template.apk'),
    path.join(__dirname, '..', '..', '..', 'tools', 'base_template.apk'),
  ].filter(Boolean);

  let found: string | null = null;
  for (const c of candidates) {
    if (fs.pathExistsSync(c)) { found = c; break; }
  }
  if (!found) found = candidates[0];

  if (found && found.includes('.asar' + path.sep)) {
    const tmpDir = path.join(os.tmpdir(), 'leapblocks_apk');
    const realPath = path.join(tmpDir, 'base_template.apk');
    if (!fs.pathExistsSync(realPath)) {
      fs.ensureDirSync(tmpDir);
      fs.copySync(found, realPath);
    }
    return realPath;
  }
  return found!;
}

const TEMPLATE_APK = resolveTemplatePath();
const OUTPUT_DIR = path.join(os.tmpdir(), 'leapblocks_output');

class ApkBuilder {
  injector: ApkInjector;
  templatePath: string;

  constructor() {
    this.injector = new ApkInjector();
    this.templatePath = TEMPLATE_APK;
  }

  async build(appState: AppState, onProgress?: (event: ProgressEvent) => void): Promise<string> {
    console.log('[APK-BUILDER] ==================== BUILD STARTED ====================');
    console.log('[APK-BUILDER] App:', appState.appName, '| Package:', appState.packageName);
    console.log('[APK-BUILDER] Screens:', appState.screens?.length, '| Media:', appState.media?.length);
    console.log('[APK-BUILDER] Template path:', this.templatePath);
    console.log('[APK-BUILDER] Template exists:', await fs.pathExists(this.templatePath));

    if (Array.isArray(appState.media) && appState.media.length > 0) {
      console.log('[APK-BUILDER] Media items from appState:');
      for (let i = 0; i < appState.media.length; i++) {
        const item = appState.media[i];
        const dataStr = item.data ? String(item.data) : '';
        console.log(`[APK-BUILDER]   media[${i}]: filename="${item.filename}" type="${item.type}" dataLen=${dataStr.length} hasData=${!!item.data} dataPrefix=${dataStr.substring(0, 30)}`);
      }
    } else {
      console.log('[APK-BUILDER] No media items in appState');
    }

    const appName = (appState.appName || 'MyApp').replace(/[^a-zA-Z0-9]/g, '') || 'MyApp';
    const packageName = appState.packageName || `com.leaplab.${appName.toLowerCase()}`;
    const versionCode = normalizeVersionCode(appState.versionCode);
    const versionName = String(appState.versionName || '1.0').replace(/'/g, '');
    const normalizedAppState = { ...appState, versionCode, versionName };
    const screens: Screen[] = Array.isArray(appState.screens) ? appState.screens : [];
    const visibleComponentCount = countVisibleComponents(screens);

    console.log('[APK-BUILDER] App name:', appName);
    console.log('[APK-BUILDER] Package:', packageName);
    console.log('[APK-BUILDER] Version:', versionCode, versionName);
    console.log('[APK-BUILDER] Screens:', screens.length, '| Visible components:', visibleComponentCount);

    try {
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
      const fileCount = Object.keys(webAppFiles).length;
      onProgress?.({ stage: 'generated', progress: 10, message: `Generated ${fileCount} files` });
      console.log('[APK-BUILDER] Web app files generated:', fileCount);
      const htmlFile = webAppFiles['index.html'];
      if (htmlFile) console.log('[APK-BUILDER] index.html length:', htmlFile.length);
      const jsFile = webAppFiles['app.js'];
      if (jsFile) console.log('[APK-BUILDER] app.js length:', jsFile.length);

      const hasTemplate = await fs.pathExists(this.templatePath);
      console.log('[APK-BUILDER] Template APK found:', hasTemplate, 'at', this.templatePath);

      if (hasTemplate) {
        onProgress?.({ stage: 'template_found', progress: 12, message: 'Using WebView template APK' });

        const permissions = collectPermissions(screens);
        const screenOrientation = resolveScreenOrientation(screens, appState.designViewport);
        const mediaAssets = collectMediaAssets(screens, appState.media || []);

        console.log('[APK-BUILDER] Permissions:', permissions);
        console.log('[APK-BUILDER] Screen orientation:', screenOrientation);
        console.log('[APK-BUILDER] Collected media assets:', mediaAssets.length);
        onProgress?.({ stage: 'media_collected', message: `Collected ${mediaAssets.length} media asset(s) from ${screens.length} screen(s)` });
        for (let i = 0; i < mediaAssets.length; i++) {
          const m = mediaAssets[i];
          const dataStr = m.data ? String(m.data) : '';
          const dataPreview = dataStr.substring(0, 60);
          const hasDataUrl = dataStr.startsWith('data:');
          const b64Len = hasDataUrl && dataStr.indexOf(',') >= 0 ? dataStr.length - dataStr.indexOf(',') - 1 : 0;
          console.log(`[APK-BUILDER]   mediaAsset[${i}]: filename="${m.filename}" hasData=${!!m.data} isDataUrl=${hasDataUrl} b64Len=${b64Len} dataPrefix=${dataPreview}`);
          onProgress?.({ stage: 'media_detail', message: `  [${i}] ${m.filename}: dataUrl=${hasDataUrl} b64Len=${b64Len}` });
        }
        if (mediaAssets.length === 0) {
          onProgress?.({ stage: 'media_empty', message: 'WARNING: No media assets collected. Ensure files are uploaded in Media Manager and component Source properties reference them.' });
        }

        console.log('[APK-BUILDER] Calling injector.fullBuild()...');
        const signedPath = await this.injector.fullBuild(
          this.templatePath,
          webAppFiles,
          {
            appName,
            packageName,
            mediaAssets,
            permissions,
            screenOrientation,
            renderedIconsDir: appState.renderedIconsDir || null,
            projectPath: appState.projectPath || appState.path || null,
            projectDir: appState.projectDir || null,
          },
          onProgress
        );
        console.log('[APK-BUILDER] injector.fullBuild() returned:', signedPath);

        await fs.ensureDir(OUTPUT_DIR);
        const finalPath = path.join(OUTPUT_DIR, `${appName}.apk`);
        console.log('[APK-BUILDER] Copying signed APK to:', finalPath);
        await fs.copy(signedPath, finalPath, { overwrite: true });

        await this.injector.cleanup();
        onProgress?.({ stage: 'complete', progress: 100, message: `Build complete: ${finalPath}` });
        console.log('[APK-BUILDER] ==================== BUILD COMPLETE ====================');
        console.log('[APK-BUILDER] Final APK path:', finalPath);
        return finalPath;

      } else {
        onProgress?.({ stage: 'no_template', progress: 12, message: 'No template APK — building from minimal structure' });
        console.log('[APK-BUILDER] No template found — using buildWithoutTemplate()');
        return await this.buildWithoutTemplate(appName, packageName, appState, webAppFiles, onProgress);
      }

    } catch (error) {
      console.error('[APK-BUILDER] Build error:', error);
      console.error('[APK-BUILDER] Error stack:', (error as Error).stack);
      await this.injector.cleanup().catch(() => { });
      throw error;
    }
  }

  async buildWithoutTemplate(appName: string, packageName: string, appState: AppState, webAppFiles: Record<string, string>, onProgress?: (event: ProgressEvent) => void): Promise<string> {
    console.log('[APK-BUILDER] buildWithoutTemplate() started');
    console.log('[APK-BUILDER]   appName:', appName, '| packageName:', packageName);
    await this.injector.initialize(appName);

    const decodedDir = path.join(this.injector.workingDir!, 'decoded');
    const pkgPath = packageName.replace(/\./g, '/');
    const screenOrientation = resolveScreenOrientation(Array.isArray(appState.screens) ? appState.screens : [], appState.designViewport);

    onProgress?.({ stage: 'creating_structure', progress: 15, message: 'Creating APK structure...' });
    console.log('[APK-BUILDER] Creating APK structure at:', decodedDir);

    await fs.ensureDir(decodedDir);
    await fs.ensureDir(path.join(decodedDir, 'smali', ...pkgPath.split('/')));
    await fs.ensureDir(path.join(decodedDir, 'assets', 'www'));
    await fs.ensureDir(path.join(decodedDir, 'res', 'values'));

    await fs.writeFile(path.join(decodedDir, 'AndroidManifest.xml'), `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${packageName}">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <application
        android:label="${appName}"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:usesCleartextTraffic="true"
        android:hardwareAccelerated="true">
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|screenSize|keyboard|keyboardHidden"${screenOrientation ? `
            android:screenOrientation="${screenOrientation}"` : ''}
            android:windowSoftInputMode="adjustPan"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`);

    await fs.writeFile(path.join(decodedDir, 'res', 'values', 'strings.xml'), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${appName}</string>
</resources>`);

    const parsedVersionCode = Number.parseInt(`${appState.versionCode ?? 1}`, 10);
    const versionCode = Number.isFinite(parsedVersionCode) && parsedVersionCode > 0 ? parsedVersionCode : 1;
    const versionName = String(appState.versionName || '1.0').replace(/'/g, '');

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

    const screens: Screen[] = Array.isArray(appState.screens) ? appState.screens : [];
    const permissions = collectPermissions(screens);
    console.log('[APK-BUILDER] No-template permissions:', permissions);

    let manifest = await fs.readFile(path.join(decodedDir, 'AndroidManifest.xml'), 'utf8');
    for (const perm of permissions) {
      if (!manifest.includes(perm)) {
        manifest = manifest.replace('</manifest>', `    <uses-permission android:name="${perm}" />\n</manifest>`);
        console.log('[APK-BUILDER] Added permission:', perm);
      }
    }
    await fs.writeFile(path.join(decodedDir, 'AndroidManifest.xml'), manifest);

    onProgress?.({ stage: 'injecting_assets', progress: 30, message: 'Injecting web assets...' });
    const mediaAssets = collectMediaAssets(screens, appState.media || []);
    const projectDir = appState.projectDir || (appState.projectPath ? path.dirname(appState.projectPath) : null);
    console.log('[APK-BUILDER] Collected', mediaAssets.length, 'media assets for injection');
    console.log('[APK-BUILDER] projectDir:', projectDir);
    onProgress?.({ stage: 'media_collected', message: `Collected ${mediaAssets.length} media asset(s)` });
    for (let i = 0; i < mediaAssets.length; i++) {
      const m = mediaAssets[i];
      const dataStr = m.data ? String(m.data) : '';
      const hasDataUrl = dataStr.startsWith('data:');
      const b64Len = hasDataUrl && dataStr.indexOf(',') >= 0 ? dataStr.length - dataStr.indexOf(',') - 1 : 0;
      console.log(`[APK-BUILDER]   mediaAsset[${i}]: filename="${m.filename}" hasData=${!!m.data} isDataUrl=${hasDataUrl} b64Len=${b64Len} dataPrefix=${dataStr.substring(0, 40)}`);
      onProgress?.({ stage: 'media_detail', message: `  [${i}] ${m.filename}: dataUrl=${hasDataUrl} b64Len=${b64Len}` });
    }
    if (mediaAssets.length === 0) {
      onProgress?.({ stage: 'media_empty', message: 'WARNING: No media assets found. Upload files in Media Manager.' });
    }
    await this.injector.injectAssets(decodedDir, webAppFiles, mediaAssets, onProgress, projectDir);

    onProgress?.({ stage: 'injecting_smali', progress: 50, message: 'Injecting WebView activity...' });
    console.log('[APK-BUILDER] Injecting WebView activity for package:', packageName);
    await this.injector.injectWebViewActivity(decodedDir, packageName, permissions, onProgress);

    console.log('[APK-BUILDER] Injecting app icon...');
    await this.injector.injectAppIcon(decodedDir, appState.renderedIconsDir || undefined, onProgress);

    const unsignedPath = path.join(this.injector.workingDir!, 'unsigned.apk');
    console.log('[APK-BUILDER] Rebuilding APK...');
    await this.injector.rebuildApk(decodedDir, unsignedPath, onProgress);

    const signedOutputDir = path.join(this.injector.workingDir!, 'signed');
    await fs.ensureDir(signedOutputDir);
    console.log('[APK-BUILDER] Signing APK...');
    const signedPath = await this.injector.signApk(unsignedPath, signedOutputDir, onProgress);

    await fs.ensureDir(OUTPUT_DIR);
    const finalPath = path.join(OUTPUT_DIR, `${appName}.apk`);
    console.log('[APK-BUILDER] Copying to final path:', finalPath);
    await fs.copy(signedPath, finalPath, { overwrite: true });

    await this.injector.cleanup();
    onProgress?.({ stage: 'complete', progress: 100, message: `Build complete: ${finalPath}` });
    console.log('[APK-BUILDER] buildWithoutTemplate() complete:', finalPath);
    return finalPath;
  }
}

export default ApkBuilder;
