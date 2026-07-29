import path from 'path';

interface BuildMessage {
  type: 'build';
  appState: any;
  appRoot: string;
}

interface LogMessage {
  type: 'log';
  message: string;
}

interface DoneMessage {
  type: 'done';
  outputPath: string;
}

interface ErrorMessage {
  type: 'error';
  message: string;
}

process.on('message', async (msg: BuildMessage) => {
  if (msg.type !== 'build') return;

  console.log('[BUILD-WORKER] ==================== WORKER STARTED ====================');
  console.log('[BUILD-WORKER] appRoot:', msg.appRoot);
  console.log('[BUILD-WORKER] appState.appName:', msg.appState?.appName);
  console.log('[BUILD-WORKER] appState.packageName:', msg.appState?.packageName);
  console.log('[BUILD-WORKER] appState.screens:', msg.appState?.screens?.length);
  console.log('[BUILD-WORKER] msg.appState.media:', {
    type: typeof msg.appState?.media,
    isArray: Array.isArray(msg.appState?.media),
    length: msg.appState?.media?.length ?? 'undefined/null'
  });
  if (Array.isArray(msg.appState?.media) && msg.appState.media.length > 0) {
    for (let i = 0; i < msg.appState.media.length; i++) {
      const item = msg.appState.media[i];
      const dataStr = item.data ? String(item.data) : '';
      console.log(`[BUILD-WORKER] media[${i}]: filename="${item.filename}" type="${item.type || '?'}" hasData=${!!item.data} dataLen=${dataStr.length} dataPrefix=${dataStr.substring(0, 40)}`);
    }
  } else {
    console.log('[BUILD-WORKER] No media items');
  }

  try {
    const bridgePath = path.join(
      msg.appRoot,
      'src', 'creova', 'apk', 'electron-bridge.js'
    );
    console.log('[BUILD-WORKER] Bridge path:', bridgePath);
    const buildApk: (appState: any, appRoot: string, onProgress: (msg: string) => void) => Promise<string> = require(bridgePath);

    const outputPath = await buildApk(msg.appState, msg.appRoot, (logMsg: string) => {
      console.log('[BUILD-WORKER] Log:', logMsg);
      (process.send as (msg: LogMessage | DoneMessage | ErrorMessage) => void)({ type: 'log' as const, message: logMsg });
    });

    console.log('[BUILD-WORKER] Build complete, output:', outputPath);
    (process.send as (msg: LogMessage | DoneMessage | ErrorMessage) => void)({ type: 'done' as const, outputPath });
  } catch (err) {
    console.error('[BUILD-WORKER] Build error:', err);
    (process.send as (msg: LogMessage | DoneMessage | ErrorMessage) => void)({ type: 'error' as const, message: (err as Error).message || String(err) });
  }
});
