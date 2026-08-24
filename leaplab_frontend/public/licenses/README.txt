LeapLab / LeapBlocks — Third-Party Licenses (ZERO GPL BUILD)
============================================================

This is the ZERO-GPL commercial installer. No GPL-licensed code is
bundled in this distribution. Your proprietary LeapLab code remains
fully proprietary and you have no GPL source-disclosure obligations
for the installer itself.

What was removed for zero-GPL:
-------------------------------
- Python `esptool` (GPLv2+) — previously at
  src/drivers/platformio/python/Lib/site-packages/esptool/
  — **NOT bundled** in this build (see scripts/build-pio.ps1).
- `tool-esptoolpy` (GPLv2+) — NOT bundled; PlatformIO will download it
  on demand to ~/.platformio/packages/tool-esptoolpy/ only if you
  use ESP32. That download is from PlatformIO/Espressif, not from
  Creoleap, and is not part of this distribution.

What remains (all permissive):
-------------------------------
- PlatformIO Core 6.1.19 — Apache-2.0
- Python deps: pyserial BSD, pyyaml MIT, intelhex BSD, reedsolo Public Domain,
  bitstring MIT, cryptography Apache-2.0/BSD, certifi MPL-2.0*, etc.
  (* certifi is MPL-2.0 file-level — retain notice, no viral effect)
- 15 Arduino libs: MIT/BSD (Adafruit_BusIO, GFX, NeoPixel, SSD1306, RTClib, etc.)
- Electron 39.x — MIT, serialport — MIT, avr8js — MIT, esptool-js — MIT,
  blockly — Apache-2.0, apktool — Apache-2.0, smali — BSD
- Toolchains: GPLv3 **with GCC Runtime Exception** — NOT bundled in installer;
  downloaded to ~/.platformio/packages/ on first build. Exception allows
  proprietary sketches to link without being GPL.

ESP32 in zero-GPL mode:
-----------------------
- AVR (Uno/Nano/Mega) — fully offline, no GPL, always works.
- ESP32 (C3/S3/etc.) — compilation via PlatformIO currently needs
  `esptool` for ELF→BIN. In this zero-GPL build, ESP32 `Verify` will:
  1) Try manual merge fallback (ArduinoUploader.buildMergedFlashImage)
  2) If that still needs `esptool`, you will see:
     "ESP32 requires GPL esptool — not bundled. Install via
      `pio pkg install --tool tool-esptoolpy` or use the standard
      (non-zero-GPL) installer, or flash via esptool-js (MIT) over WebSerial."

  For 100% offline ESP32 without GPL, use the standard installer
  (which bundles esptool with GPL notice + source offer in
  public/licenses/GPL-2.0-esptool.txt). That build is also commercial-
  safe via aggregation (separate process).

What you must do before ship:
-----------------------------
- Clean build: Remove-Item -Recurse -Force out,dist
  bun run dist:win   # packs platformio/python (now GPL-free) + public/licenses
- Verify: `Get-ChildItem src/drivers/platformio/python/Lib/site-packages/esptool*`
  should NOT exist; `out/win-unpacked/resources/platformio/python/Lib/site-packages/esptool`
  should NOT exist.
- Ship `public/licenses/` (via electron-builder `from: public to: public`)
- Add About → Licenses menu.

No GPL source offer is needed for this zero-GPL installer.

Contact: tech@creoleap.com — 2026-08-24 zero-GPL build
