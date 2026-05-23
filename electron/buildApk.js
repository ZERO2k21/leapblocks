const path = require('path');
const fs = require('fs');

/**
 * APK Builder — Electron main-process entrypoint
 *
 * Delegates to the ApkBuilder (APK injection method) from
 * src/appinverter/apk/buildAPK.js.
 *
 * Flow:
 *   1. htmlGenerator converts AppInverter state → web app files
 *   2. ApkInjector packages them into a WebView-based APK
 *   3. ApkSigner signs the APK with a debug keystore
 *
 * No React Native template required — everything is self-contained.
 */

async function buildApk(appState, appRoot, onLog) {
  try {
    onLog('Initializing build process...');

    // Dynamically require ApkBuilder — the module lives inside src/
    // and uses CommonJS (require/module.exports), so direct require works.
    const candidates = [
      path.join(appRoot, 'src', 'studio', 'apk', 'buildAPK.js'),
      path.join(appRoot, 'src', 'appinverter', 'apk', 'buildAPK.js'),
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

    onLog(`✓ APK built successfully: ${outputPath}`);
    return outputPath;

  } catch (error) {
    onLog('✗ Build failed: ' + error.message);
    throw error;
  }
}

module.exports = buildApk;
