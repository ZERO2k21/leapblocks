interface ApkBuilderClass {
  new(): { build(appState: any, onProgress: (event: any) => void): Promise<string> };
}

async function buildApk(appState: any, appRoot: string, onLog: (msg: string) => void): Promise<string> {
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
    const Builder: ApkBuilderClass = require(resolvedBuilder);

    const builder = new Builder();

    onLog('Starting APK injection build...');

    const outputPath = await builder.build(appState, ({ stage, progress, message }: { stage: string; progress?: number; message?: string }) => {
      onLog(`[${progress}%] ${message}`);
    });

    onLog(`APK built successfully: ${outputPath}`);
    return outputPath;

  } catch (error) {
    onLog('Build failed: ' + (error as Error).message);
    throw error;
  }
}

export = buildApk;
