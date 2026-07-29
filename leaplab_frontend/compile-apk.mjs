import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apkDir = path.join(__dirname, 'src', 'creova', 'apk');

function compile(entry, outfile, external = []) {
  const ext = external.map(e => `--external:${e}`).join(' ');
  const entryPath = JSON.stringify(path.join(apkDir, entry));
  const outPath = JSON.stringify(path.join(apkDir, outfile));
  const cmd = `npx esbuild ${entryPath} --bundle --platform=node --target=node18 --outfile=${outPath} ${ext}`;
  console.log(`Compiling ${entry} → ${outfile}...`);
  execSync(cmd, { cwd: __dirname, stdio: 'inherit' });
}

compile('build-worker.ts', 'build-worker.js', ['path']);
compile('electron-bridge.ts', 'electron-bridge.js', ['path', 'fs']);
compile('buildAPK.ts', 'buildAPK.js', ['fs-extra', 'child_process', 'path', 'os']);

console.log('\nAll APK modules compiled successfully.');