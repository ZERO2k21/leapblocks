# LeapBlocks - Build Executable Guide

## 🎯 Building LeapBlocks as .exe

This guide shows you how to build LeapBlocks into a Windows executable installer and portable .exe file.

## 📋 Prerequisites

Before building, ensure you have:

1. ✅ Node.js installed (v18 or higher)
2. ✅ All dependencies installed (`npm install`)
3. ✅ Compiler server set up
4. ✅ Arduino CLI downloaded
5. ✅ QEMU binaries downloaded

## 🚀 Quick Build (Recommended)

### Step 1: Install Dependencies
```powershell
npm install
```

### Step 2: Download Required Binaries
```powershell
# This downloads QEMU for ESP32 simulation
npm run download-qemu
```

### Step 3: Build the Executable
```powershell
# Full production build (includes offline cores)
npm run build:prod
```

**OR** for a faster build without offline cores:

```powershell
# Build Electron app
npm run build:electron

# Create installer and portable exe
npm run dist
```

## 📦 Build Output

After building, you'll find the executables in the `out/` directory:

```
out/
├── LeapBlocks-Setup-1.0.0.exe    # Installer (NSIS)
└── LeapBlocks-1.0.0.exe          # Portable executable
```

### Installer (.exe with Setup)
- **File:** `LeapBlocks-Setup-1.0.0.exe`
- **Type:** NSIS installer
- **Features:**
  - Installation wizard
  - Desktop shortcut
  - Start menu shortcut
  - Uninstaller
  - Auto-run after install

### Portable (.exe)
- **File:** `LeapBlocks-1.0.0.exe`
- **Type:** Portable executable
- **Features:**
  - No installation required
  - Run from any location
  - Self-contained

## 🔧 Detailed Build Steps

### 1. Clean Previous Builds (Optional)
```powershell
# Remove old build artifacts
Remove-Item -Recurse -Force dist, out -ErrorAction SilentlyContinue
```

### 2. Download QEMU (Required for ESP32 Simulation)
```powershell
npm run download-qemu
```

This downloads the QEMU binary for ESP32-C3 simulation. The script will:
- Detect your platform (Windows x64)
- Download the appropriate QEMU binary
- Place it in `resources/` directory

### 3. Prepare Offline Cores (Optional - for offline use)
```powershell
node scripts/prepare-offline-cores.js
```

This downloads Arduino cores (AVR, ESP32) for offline compilation.

### 4. Build Electron App
```powershell
npm run build:electron
```

This compiles:
- Main process (Electron backend)
- Renderer process (React frontend)
- Preload scripts

Output: `dist/` directory

### 5. Package as Executable
```powershell
npm run dist
```

This creates:
- NSIS installer (.exe)
- Portable executable (.exe)

Output: `out/` directory

## 📊 Build Scripts Explained

| Script | Command | Description |
|--------|---------|-------------|
| **Quick Build** | `npm run build:prod` | Full production build with offline cores |
| **Electron Build** | `npm run build:electron` | Build Electron app only |
| **Package** | `npm run dist` | Create installer and portable exe |
| **Download QEMU** | `npm run download-qemu` | Download ESP32 simulator |
| **Web Build** | `npm run build:web` | Build web version (not exe) |

## 🎨 Customizing the Build

### Change App Name
Edit `electron-builder.yml`:
```yaml
productName: LeapLab  # Change from LeapBlocks to LeapLab
```

### Change App Icon
Replace `build/icon.png` with your custom icon (256x256 PNG recommended).

For Windows, you can also use `.ico` format:
```yaml
win:
  icon: build/icon.ico
```

### Change Version
Edit `package.json`:
```json
{
  "version": "1.0.0"  // Change version number
}
```

### Change App ID
Edit `electron-builder.yml`:
```yaml
appId: com.leaplab.app  # Change from com.leapblocks.app
```

## 📁 What Gets Included in the .exe

The executable includes:

### Core Application
- ✅ Electron runtime
- ✅ React frontend (ForgeStudio, AppInventor)
- ✅ Node.js backend

### Tools & Binaries
- ✅ **compiler-server/** - Arduino compilation server
- ✅ **arduino-cli/** - Arduino CLI binaries
- ✅ **forge-lib/** - Arduino libraries
- ✅ **qemu-system-xtensa.exe** - ESP32 simulator
- ✅ **tools/** - Additional tools
- ✅ **engine/** - Simulation engines

### Resources
- ✅ **public/** - Static assets
- ✅ **local-build-server/** - Local build tools

## 🐛 Troubleshooting

### Issue: "QEMU binary not found"
**Solution:**
```powershell
npm run download-qemu
```

### Issue: "electron-builder not found"
**Solution:**
```powershell
npm install --save-dev electron-builder
```

### Issue: Build fails with "Cannot find module"
**Solution:**
```powershell
# Clean install
Remove-Item -Recurse -Force node_modules
npm install
```

### Issue: "Arduino CLI not found in build"
**Solution:**
Ensure `arduino-cli/` directory exists with binaries:
```
arduino-cli/
├── arduino-cli.exe
└── arduino-cli.yaml
```

### Issue: Large file size
The .exe will be large (~200-500 MB) because it includes:
- Electron runtime (~100 MB)
- Node modules (~50-100 MB)
- Arduino CLI (~50 MB)
- QEMU (~50 MB)
- Libraries and tools (~50 MB)

This is normal for Electron apps with embedded tools.

## 🚀 Distribution

### For Users
1. **Installer:** Share `LeapBlocks-Setup-1.0.0.exe`
   - Users run the installer
   - App installs to Program Files
   - Desktop shortcut created

2. **Portable:** Share `LeapBlocks-1.0.0.exe`
   - Users run directly
   - No installation needed
   - Can run from USB drive

### For Developers
Consider creating a release package:
```powershell
# Create a release folder
New-Item -ItemType Directory -Force -Path release

# Copy executables
Copy-Item out/LeapBlocks-Setup-1.0.0.exe release/
Copy-Item out/LeapBlocks-1.0.0.exe release/

# Create README
@"
# LeapBlocks v1.0.0

## Installation
Run LeapBlocks-Setup-1.0.0.exe

## Portable Version
Run LeapBlocks-1.0.0.exe (no installation required)

## System Requirements
- Windows 10/11 (64-bit)
- 4 GB RAM minimum
- 1 GB free disk space
"@ | Out-File release/README.txt
```

## 📝 Build Checklist

Before distributing:

- [ ] Test the installer on a clean Windows machine
- [ ] Test the portable exe
- [ ] Verify ESP32 simulation works
- [ ] Verify Arduino compilation works
- [ ] Test all major features
- [ ] Check file size is reasonable
- [ ] Update version number
- [ ] Update changelog
- [ ] Create release notes

## 🎯 Quick Reference

### Development
```powershell
npm run dev              # Run in development mode
```

### Building
```powershell
npm run build:prod       # Full production build
npm run dist             # Package only (after build:electron)
```

### Output
```
out/LeapBlocks-Setup-1.0.0.exe    # Installer
out/LeapBlocks-1.0.0.exe          # Portable
```

## 🔄 Continuous Integration (Optional)

For automated builds, create `.github/workflows/build.yml`:

```yaml
name: Build

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build:prod
      - uses: actions/upload-artifact@v3
        with:
          name: LeapBlocks-Windows
          path: out/*.exe
```

## 📚 Additional Resources

- [Electron Builder Docs](https://www.electron.build/)
- [NSIS Installer Docs](https://nsis.sourceforge.io/Docs/)
- [Code Signing Guide](https://www.electron.build/code-signing)

---

**Ready to build?** Run `npm run build:prod` and find your .exe in the `out/` folder!
