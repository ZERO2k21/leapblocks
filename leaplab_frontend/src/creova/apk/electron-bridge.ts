import path from 'path';
import fs from 'fs';

interface ApkBuilderClass {
  new(): { build(appState: any, onProgress: (event: any) => void): Promise<string> };
}

async function buildApk(appState: any, appRoot: string, onLog: (msg: string) => void): Promise<string> {
  try {
    console.log('[ELECTRON-BRIDGE] ==================== BRIDGE STARTED ====================');
    console.log('[ELECTRON-BRIDGE] appRoot:', appRoot);
    console.log('[ELECTRON-BRIDGE] appState keys:', appState ? Object.keys(appState) : 'null');
    console.log('[ELECTRON-BRIDGE] appState.appName:', appState?.appName);
    console.log('[ELECTRON-BRIDGE] appState.packageName:', appState?.packageName);
    console.log('[ELECTRON-BRIDGE] appState.screens:', appState?.screens?.length, '| media:', appState?.media?.length);
    console.log('[ELECTRON-BRIDGE] appState.media:', {
      type: typeof appState?.media,
      isArray: Array.isArray(appState?.media),
      length: appState?.media?.length ?? 'undefined/null'
    });
    if (appState?.media?.length) {
      for (let i = 0; i < appState.media.length; i++) {
        const item = appState.media[i];
        const dataStr = item.data ? String(item.data) : '';
        console.log(`[ELECTRON-BRIDGE] media[${i}]: filename="${item.filename}" type="${item.type || '?'}" hasData=${!!item.data} dataLen=${dataStr.length} dataPrefix=${dataStr.substring(0, 40)}`);
      }
    }
    onLog('[BRIDGE] Initializing build process...');

    const candidates = [
      path.join(appRoot, 'src', 'creova', 'apk', 'buildAPK.js'),
      path.join(appRoot, 'src', 'creova', 'apk', 'buildAPK.ts'),
    ];
    const resolvedBuilder = candidates.find((p) => fs.existsSync(p));
    if (!resolvedBuilder) {
      throw new Error(`APK builder module not found. Checked:\n${candidates.join('\n')}`);
    }
    console.log('[ELECTRON-BRIDGE] Resolved builder path:', resolvedBuilder);
    const Builder: ApkBuilderClass = require(resolvedBuilder);

    const builder = new Builder();
    console.log('[ELECTRON-BRIDGE] Builder instance created');

    onLog('[BRIDGE] Starting APK injection build...');

    const outputPath = await builder.build(appState, ({ stage, progress, message }: { stage: string; progress?: number; message?: string }) => {
      const logMsg = `[${progress}%] ${message}`;
      console.log(`[ELECTRON-BRIDGE] Progress: ${logMsg}`);
      onLog(logMsg);
    });

    console.log('[ELECTRON-BRIDGE] APK built successfully at:', outputPath);
    onLog(`[BRIDGE] APK built successfully: ${outputPath}`);
    return outputPath;

  } catch (error) {
    console.error('[ELECTRON-BRIDGE] Build failed:', error);
    console.error('[ELECTRON-BRIDGE] Error stack:', (error as Error).stack);
    onLog('[BRIDGE] Build failed: ' + (error as Error).message);
    throw error;
  }
}

export default buildApk;
