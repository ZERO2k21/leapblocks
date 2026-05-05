# LeapEmbed Board Drivers

This folder contains USB-to-Serial drivers required for uploading code to Arduino and ESP32 boards.

## Structure

```
drivers/
├── arduino/
│   └── cp210x/          # Silicon Labs CP210x (Arduino Uno, Nano, etc.)
│       ├── silabser.inf  # Windows driver installer
│       ├── x64/          # 64-bit Windows
│       ├── x86/          # 32-bit Windows
│       ├── arm/          # ARM Windows
│       └── arm64/        # ARM64 Windows
└── esp32/
    └── (ESP32 CH340/CP210x drivers — add here)
```

## Supported Chips

### Arduino (CP210x)
- CP2102N, CP2102, CP2103, CP2104, CP2105, CP2108, CP2109
- Used by: Arduino Uno R3, Nano, Mega clones
- Install: Right-click `silabser.inf` → Install

### ESP32 (CH340 / CP210x)
- CH340G, CH340C — common on ESP32 dev boards
- CP2102 — used on some ESP32 boards
- Install: Download from manufacturer or use Windows Update

## Auto-Detection

The app automatically detects unassigned bridges via PowerShell:
```powershell
Get-CimInstance Win32_PnPEntity | Where-Object {
  $_.Caption -match 'CP210' -or $_.Caption -match 'CH34'
}
```

If a bridge is detected but no COM port is assigned, the app will prompt the user to install drivers.
