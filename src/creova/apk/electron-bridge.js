const path = require('path');
const fs = require('fs');

async function buildApk(appState, appRoot, onLog) {
  try {
    onLog('Initializing build process...');

    const candidates = [
      path.join(appRoot, 'src', 'creova', 'apk', 'buildAPK.js'),
      path.join(appRoot, 'src', 'creova', 'apk', 'buildAPK.js'),
      path.join(appRoot, 'src', 'modules', 'AppInventor', 'apk', 'buildAPK.js'),
    ];
    const resolvedBuilder = candidates.find((p) => fs.existsSync(p));
    if (!resolvedBuilder) {
      throw new Error(`APK builder module not found. Checked:\n${candidates.join('\n')}`);
    }
    const ApkBuilder = require(resolvedBuilder);

    const builder = new ApkBuilder();

    onLog('Starting APK injection build...');

    const outputPath = await builder.build(appState, ({ stage, progress, message }) => {
      onLog(`[${progress}%] ${message}`);
    });

    onLog(`APK built successfully: ${outputPath}`);
    return outputPath;

  } catch (error) {
    onLog('Build failed: ' + error.message);
    throw error;
  }
}

module.exports = buildApk;
