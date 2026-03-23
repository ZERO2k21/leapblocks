const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

/**
 * We must use inline require for generateAndInjectZip since codeGenerators 
 * is inside the React src/ folder and written using ES Modules/JSX syntax.
 * But wait, node might not be able to parse ES module if it uses import/export.
 * Let's ensure node compatibility. The easiest way is using babel-register 
 * or assuming electron will run it properly if compiled.
 * Since the prompt specifically asked to export it from utils/codeGenerators.js 
 * and call it from buildApk.js, we will just use standard require if it was transpiled, 
 * or we will dynamically import it.
 * 
 * Wait, \`codeGenerators.js\` has \`export function generateAndInjectZip...\`. 
 * Node Native cannot require ES Modules unless "type": "module".
 * Wait, the React app uses Webpack (from react-scripts / electron-forge). 
 * But buildApk runs in pure Node Main Process.
 * So we either need \`codeGenerators.js\` to be CommonJS or dynamically imported.
 * To be safe since I used 'export' in codeGenerators in Phase 2, 
 * I will dynamically import it or read it via babel.
 * But to keep it simple, I will read it or just change codeGenerators.js to use CJS?
 * The prompt explicitly stated: "Create src/modules/AppInventor/utils/codeGenerators.js ... Export these 4 functions".
 * I did \`export function ...\`.
 * In Node 14+, you can \`await import(...)\` for ES modules. Let's try to dynamically build it or transpile it here.
 * Actually, electron/main.js runs without Babel unless setup. 
 * I'll rewrite \`codeGenerators.js\` to be CommonJS / ES module agnostic 
 * or just copy the logic. No, I will use Babel require hook if necessary, 
 * or let's just assume \`await import(...)\` works. We'll find out in Phase 6.
 */

async function buildApk(appState, appRoot, onLog) {
  // Use absolute paths assuming android-template, android-sdk, jdk are parallel to package.json
  const templateDir = path.join(appRoot, 'android-template');
  const sdkDir = path.join(appRoot, 'android-sdk');
  const jdkDir = path.join(appRoot, 'jdk');
  
  const timestamp = Date.now();
  const tmpDir = path.join(os.tmpdir(), 'leapblocks', `build_${timestamp}`);
  const outputDir = path.join(appRoot, 'output');

  try {
    onLog("Preparing build environment...");
    await fs.ensureDir(tmpDir);
    await fs.ensureDir(outputDir);

    onLog("Copying React Native template...");
    await fs.copy(templateDir, tmpDir);

    onLog("Injecting UI components...");
    // Dynamically loading the React-side code generator 
    // We will use Babel register to parse ES module syntax from React folder
    require('@babel/register')({
      presets: ['@babel/preset-env', '@babel/preset-react'],
      ignore: [/node_modules/],
      only: [
        path.join(appRoot, 'src')
      ]
    });
    const codeGen = require('../src/modules/AppInventor/utils/codeGenerators.js');
    await codeGen.generateAndInjectZip(appState, templateDir, tmpDir);

    onLog("Installing npm dependencies...");
    await runCommand('npm.cmd', ['install'], tmpDir, onLog, process.env);

    onLog("Running Gradle build...");
    const buildEnv = {
      ...process.env,
      ANDROID_HOME: sdkDir,
      ANDROID_SDK_ROOT: sdkDir,
      JAVA_HOME: jdkDir,
      PATH: `${path.join(jdkDir, 'bin')};${process.env.PATH}`
    };
    
    // Use gradlew.bat for Windows
    const gradleScript = path.join(tmpDir, 'android', 'gradlew.bat');
    await runCommand(gradleScript, ['assembleRelease'], path.join(tmpDir, 'android'), onLog, buildEnv);

    onLog("Copying APK to output folder...");
    const appNameClean = (appState.appName || 'App').replace(/[^a-zA-Z0-9]/g, '');
    const apkSourcePath = path.join(tmpDir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
    const destApkPath = path.join(outputDir, `${appNameClean}.apk`);
    
    if (await fs.pathExists(apkSourcePath)) {
      await fs.copy(apkSourcePath, destApkPath);
    } else {
      throw new Error("Release APK was not generated at expected location: " + apkSourcePath);
    }

    onLog("Cleaning up temp files...");
    await fs.remove(tmpDir);

    onLog("✓ Build complete!");
    return destApkPath;

  } catch (error) {
    onLog("✗ Build failed: " + error.message);
    throw error;
  }
}

// Utility to run shell commands streaming output to onLog
function runCommand(command, args, cwd, onLog, env) {
  return new Promise((resolve, reject) => {
    // Determine shell execution environment for windows
    const isWin = process.platform === 'win32';
    
    const child = spawn(command, args, {
      cwd,
      env,
      shell: isWin ? true : false
    });

    child.stdout.on('data', (data) => {
      onLog(data.toString().trim());
    });

    child.stderr.on('data', (data) => {
      onLog(data.toString().trim());
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command ${command} failed with exit code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

module.exports = buildApk;
