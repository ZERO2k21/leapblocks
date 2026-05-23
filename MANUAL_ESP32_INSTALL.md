# Manual ESP32 Platform Installation

## Quick Fix - Install ESP32 Platform Manually

If the automatic installation isn't working, you can install the ESP32 platform manually using arduino-cli.

### Step 1: Open Terminal/Command Prompt

Navigate to your project directory:
```bash
cd "D:/Creoleap Company/leaplab/leapblocks"
```

### Step 2: Run Manual Installation Command

```bash
arduino-cli\arduino-cli.exe --config-file forge-lib\arduino-cli.yaml core update-index --additional-urls https://dl.espressif.com/dl/package_esp32_index.json,https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
```

Then install the platform:
```bash
arduino-cli\arduino-cli.exe --config-file forge-lib\arduino-cli.yaml core install espressif:esp32 --additional-urls https://dl.espressif.com/dl/package_esp32_index.json
```

### Step 3: Verify Installation

Check if the platform is installed:
```bash
arduino-cli\arduino-cli.exe --config-file forge-lib\arduino-cli.yaml core list
```

You should see output like:
```
ID              Installed Latest Name
espressif:esp32 3.x.x     3.x.x  esp32
```

### Step 4: Restart the App

After manual installation:
1. **Close the Electron app completely** (not just the window - check Task Manager)
2. Restart the app
3. Try compiling ESP32 code again

## Troubleshooting

### If arduino-cli.exe is not found:
The arduino-cli executable should be in the `arduino-cli` folder. If it's missing:
1. Download from: https://arduino.github.io/arduino-cli/latest/installation/
2. Extract `arduino-cli.exe` to the `arduino-cli` folder in your project

### If the command fails with "platform not found":
The board manager URLs might not be configured. Edit `forge-lib/arduino-cli.yaml` and ensure it has:
```yaml
board_manager:
  additional_urls:
    - https://dl.espressif.com/dl/package_esp32_index.json
    - https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
```

### If installation is very slow:
The ESP32 platform is ~200MB. On slow connections, it may take 10-15 minutes. Be patient!

### Check Installation Location

After installation, the ESP32 platform should be in:
```
forge-lib/data/packages/espressif/hardware/esp32/
```

## Alternative: Use System arduino-cli

If you have arduino-cli installed globally:
```bash
arduino-cli config init
arduino-cli config add board_manager.additional_urls https://dl.espressif.com/dl/package_esp32_index.json
arduino-cli core update-index
arduino-cli core install espressif:esp32
```

Then update `forge-lib/arduino-cli.yaml` to point to your system installation.

## After Manual Installation

Once the platform is installed manually, the app should detect it automatically on the next compile. You won't need to install it again.

---

**Need Help?**
If manual installation also fails, check:
1. Internet connection (needs to download ~200MB)
2. Firewall settings (may block arduino-cli downloads)
3. Disk space (needs ~500MB free)
4. Antivirus (may block arduino-cli execution)
