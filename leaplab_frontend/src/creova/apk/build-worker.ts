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

  try {
    const bridgePath = path.join(
      msg.appRoot,
      'src', 'creova', 'apk', 'electron-bridge.js'
    );
    const buildApk: (appState: any, appRoot: string, onProgress: (msg: string) => void) => Promise<string> = require(bridgePath);

    const outputPath = await buildApk(msg.appState, msg.appRoot, (logMsg: string) => {
      (process.send as (msg: LogMessage | DoneMessage | ErrorMessage) => void)({ type: 'log' as const, message: logMsg });
    });

    (process.send as (msg: LogMessage | DoneMessage | ErrorMessage) => void)({ type: 'done' as const, outputPath });
  } catch (err) {
    (process.send as (msg: LogMessage | DoneMessage | ErrorMessage) => void)({ type: 'error' as const, message: (err as Error).message || String(err) });
  }
});
