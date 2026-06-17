/**
 * APK Build Worker — runs in a child_process so heavy apktool/signing
 * operations never block the Electron main thread.
 *
 * Communication (via process.send / process.on):
 *   IN:  { type: 'build', appState, appRoot }
 *   OUT: { type: 'log',   message }
 *        { type: 'done',  outputPath }
 *        { type: 'error', message }
 */

const path = require('path');

process.on('message', async (msg) => {
  if (msg.type !== 'build') return;

  try {
    // Resolve the bridge script relative to the provided appRoot so it works
    // both in dev (source tree) and in a packaged app (inside ASAR).
    const bridgePath = path.join(
      msg.appRoot,
      'src', 'creova', 'apk', 'electron-bridge.js'
    );
    const buildApk = require(bridgePath);

    const outputPath = await buildApk(msg.appState, msg.appRoot, (logMsg) => {
      process.send({ type: 'log', message: logMsg });
    });

    process.send({ type: 'done', outputPath });
  } catch (err) {
    process.send({ type: 'error', message: err.message || String(err) });
  }
});
