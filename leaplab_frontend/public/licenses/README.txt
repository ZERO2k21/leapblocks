LeapLab / LeapBlocks — Third-Party Licenses & GPL Compliance
============================================================

This product is proprietary software owned by Creoleap Technologies Pvt. Ltd.
It bundles and/or invokes the following third-party components. All are used
under their respective permissive or copyleft licenses. Copyleft components
are aggregated as separate processes/tools — your proprietary LeapLab code
is NOT GPL-viral.

1. HOW WE HANDLE GPL (esptool)
-------------------------------
Bundled Python `esptool` (GPLv2+) at:
  src/drivers/platformio/python/Lib/site-packages/esptool/
  src/drivers/platformio/python/Lib/site-packages/esptool-5.3.1.dist-info/licenses/LICENSE

- Used ONLY as a standalone flashing/build tool for ESP32 (invoked via
  `tool-esptoolpy/esptool.py` as a separate process). Per GPLv2 §2,
  "mere aggregation" on a distribution medium does NOT bring the
  proprietary app under GPL.
- You are free to run LeapLab commercially without open-sourcing your
  own code.
- GPL COMPLIANCE: We provide this README + the full GPLv2 text
  (GPL-2.0-esptool.txt) + a written source offer below. This satisfies
  GPLv2 §3.

  Source offer (valid 3 years from your download date):
  To obtain the complete corresponding source for the GPL-licensed
  `esptool v5.3.1` and `tool-esptoolpy` as used in this build, email
  tech@creoleap.com with subject "GPL Source Request — LeapLab esptool"
  or download directly from:
    https://github.com/espressif/esptool/archive/v5.3.1.zip
    https://docs.espressif.com/projects/esptool/en/latest/

  You will receive the source at no more than the cost of distribution.

2. TOOLCHAIN (GPLv3 with GCC Runtime Exception)
------------------------------------------------
ESP32/AVR toolchains (`toolchain-riscv32-esp`, `toolchain-atmelavr`,
`toolchain-xtensa-esp32`) are GPLv3 but carry the GCC Runtime Library
Exception. Linking your Arduino sketches against them does NOT require
you to GPL your sketches. Toolchains are downloaded on demand to
~/.platformio/packages/ (not bundled in the offline installer except
for Docker, where they are preinstalled for speed). If you bundle them
offline, retain their LICENSE and exception text.

3. MPL-2.0 (certifi)
---------------------
`certifi` (MPL-2.0, file-level copyleft) is bundled in the Python
embeddable environment for `requests`/`urllib3`. MPL is NOT viral to
the whole app — only modifications to the MPL-covered files must remain
MPL. Unmodified use is unrestricted for commercial apps if you retain
the MPL notice and provide the MPL-licensed files' source (via
https://github.com/certifi/python-certifi).

4. PERMISSIVE (retain notices only)
-----------------------------------
- PlatformIO Core 6.1.19 — Apache-2.0 (LICENSE at platformio-6.1.19.dist-info/licenses/LICENSE)
- Electron 39.x — MIT
- serialport / @serialport — MIT
- avr8js — MIT, esptool-js — MIT/Apache-2.0, blockly — Apache-2.0
- Adafruit BusIO, GFX, NeoPixel, SSD1306, etc. — MIT/BSD-3-Clause
    (see each library's LICENSE in src/drivers/platformio/libraries/*/LICENSE)
- LiquidCrystal_I2C, HX711, RTClib, DHT — MIT/BSD
- apktool — Apache-2.0, smali — BSD-3, uber-apk-signer — Apache-2.0

You must retain their copyright/license notices. They are reproduced in
THIRD_PARTY_NOTICES.md and in the `licenses/` subfiles shipped with the app.

5. WHAT YOU MUST DO BEFORE COMMERCIAL SHIP
-------------------------------------------
- Clean build: `Remove-Item -Recurse -Force out,dist; bun run dist:win`
  (ensures stale `resources/arduino-cli` (GPL-3.0, removed in PlatformIO migration) is NOT shipped)
- Ship `public/licenses/` inside `resources/` (electron-builder already does:
  extraResources `from: public to: public`)
- Add an "About → Open Source Licenses" menu linking to this folder.

Questions: tech@creoleap.com
Last updated: 2026-08-24 for PlatformIO Core 6.1.19, esptool 5.3.1, certifi MPL-2.0
