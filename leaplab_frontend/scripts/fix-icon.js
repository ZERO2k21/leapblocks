const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const RCEdit = path.join(__dirname, '..', 'node_modules', 'electron-winstaller', 'vendor', 'rcedit.exe');
const Icon = path.join(__dirname, '..', 'public', 'assets', 'leaplabicon.ico');
const OutDir = path.join(__dirname, '..', 'out');

// If no custom icon exists, skip patching gracefully
if (!fs.existsSync(Icon)) {
  console.warn(`[fix-icon] Icon not found at ${Icon}. Skipping icon patch. Run 'python scripts/convert-icon.py <image>' to create one.`);
  process.exit(0);
}

function fixIcon(exePath) {
  if (!fs.existsSync(exePath)) {
    console.warn(`[fix-icon] EXE not found: ${exePath}`);
    return;
  }
  console.log(`[fix-icon] Setting icon on: ${exePath}`);
  try {
    execFileSync(RCEdit, [exePath, '--set-icon', Icon], { stdio: 'inherit' });
    console.log(`[fix-icon] Icon set successfully`);
  } catch (err) {
    console.error(`[fix-icon] Failed to set icon: ${err.message}`);
    process.exit(1);
  }
}

// Fix app EXE (installer icon is handled by electron-builder from electron-builder.yml)
const appExe = path.join(OutDir, 'win-unpacked', 'LeapBlocks.exe');
fixIcon(appExe);
