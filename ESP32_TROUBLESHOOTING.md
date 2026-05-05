# ESP32 Platform Installation Troubleshooting

## Quick Solution

**Run the installation script:**
1. Double-click `install-esp32-platform.bat`
2. Wait for installation to complete (2-5 minutes)
3. **Fully close and restart the Electron app** (check Task Manager to ensure it's closed)
4. Try compiling again

## Diagnostic Steps

### Step 1: Check if Platform is Installed

Double-click `check-esp32-platform.bat` to see if ESP32 platform is installed.

**Expected output if installed:**
```
ID              Installed Latest Name
espressif:esp32 3.x.x     3.x.x  esp32
```

**If NOT installed**, proceed to Step 2.

### Step 2: Manual Installation

Run `install-esp32-platform.bat` or manually execute:

```bash
arduino-cli\arduino-cli.exe --config-file forge-lib\arduino-cli.yaml core update-index --additional-urls https://dl.espressif.com/dl/package_esp32_index.json

arduino-cli\arduino-cli.exe --config-file forge-lib\arduino-cli.yaml core install espressif:esp32 --additional-urls https://dl.espressif.com/dl/package_esp32_index.json
```

### Step 3: Verify App Restart

The Electron app MUST be fully restarted for main.js changes to take effect:

1. Close all Electron app windows
2. Open Task Manager (Ctrl+Shift+Esc)
3. Look for "LeapBlocks" or "Electron" processes
4. End all related processes
5. Start the app again

### Step 4: Check Console Logs

When you click "Run Simulation" with ESP32 board, you should see in the terminal:

```
[compile-code] ========== COMPILE START ==========
[compile-code] FQBN: espressif:esp32:esp32
[compile-code] isESP32QEMU: true
[compile-code] *** ESP32 DETECTED - CALLING ensureESP32Core() ***
[FORGE] Checking for ESP32 core installation...
[FORGE] ✓ ESP32 core already installed.
```

**If you DON'T see these logs:**
- The app wasn't restarted properly
- The main.js file wasn't rebuilt
- You're running a packaged version (not dev mode)

## Common Issues

### Issue 1: "Platform not found" error persists

**Cause:** App not restarted or platform not installed

**Solution:**
1. Run `check-esp32-platform.bat` to verify installation
2. If not installed, run `install-esp32-platform.bat`
3. Fully restart the app (kill all processes)

### Issue 2: Installation hangs or is very slow

**Cause:** Large download (~200MB) on slow connection

**Solution:**
- Be patient - can take 10-15 minutes on slow connections
- Check internet connection
- Try alternative URL (script does this automatically)

### Issue 3: "Permission denied" or "Access denied"

**Cause:** Antivirus or Windows permissions

**Solution:**
- Run Command Prompt as Administrator
- Add arduino-cli.exe to antivirus exceptions
- Check if forge-lib folder is writable

### Issue 4: arduino-cli.exe not found

**Cause:** Missing arduino-cli executable

**Solution:**
1. Download from: https://arduino.github.io/arduino-cli/latest/installation/
2. Extract `arduino-cli.exe` to the `arduino-cli` folder
3. Run `check-esp32-platform.bat` to verify

### Issue 5: No console logs visible

**Cause:** Running packaged app or logs not showing

**Solution:**
- Run in development mode: `npm run dev`
- Check terminal where you started the app
- Look for logs in Electron DevTools console

## Verification Checklist

- [ ] ESP32 platform installed (run `check-esp32-platform.bat`)
- [ ] App fully restarted (no Electron processes in Task Manager)
- [ ] Using correct FQBN: `espressif:esp32:esp32`
- [ ] arduino-cli.yaml has board manager URLs
- [ ] Internet connection working
- [ ] Sufficient disk space (~500MB free)

## Manual Verification Commands

Check if platform is installed:
```bash
arduino-cli\arduino-cli.exe --config-file forge-lib\arduino-cli.yaml core list
```

Check if board is recognized:
```bash
arduino-cli\arduino-cli.exe --config-file forge-lib\arduino-cli.yaml board listall esp32
```

Test compilation (create a test sketch first):
```bash
arduino-cli\arduino-cli.exe --config-file forge-lib\arduino-cli.yaml compile --fqbn espressif:esp32:esp32 test_sketch
```

## Still Not Working?

If the platform is installed but compilation still fails:

1. **Check FQBN in logs** - Should be `espressif:esp32:esp32` (not `esp32:esp32:esp32`)

2. **Verify config file** - `forge-lib/arduino-cli.yaml` should have:
   ```yaml
   board_manager:
     additional_urls:
       - https://dl.espressif.com/dl/package_esp32_index.json
   ```

3. **Check installation location** - Platform should be in:
   ```
   forge-lib/data/packages/espressif/hardware/esp32/
   ```

4. **Try uninstall and reinstall**:
   ```bash
   arduino-cli\arduino-cli.exe --config-file forge-lib\arduino-cli.yaml core uninstall espressif:esp32
   ```
   Then run `install-esp32-platform.bat` again

## Getting Help

If none of the above works, provide:
1. Output of `check-esp32-platform.bat`
2. Console logs from the terminal
3. Error message from the app
4. Your operating system and version

---

**Last Updated:** April 21, 2026
