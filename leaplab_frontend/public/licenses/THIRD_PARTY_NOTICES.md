# LeapLab Third-Party Notices (Commercial Release)

Generated 2026-08-24 for `platformio-migration` @ 5007b081. Retain this file in your distribution per each license's attribution requirement.

## Summary — Copyleft vs Permissive

| Component | License | Type | Commercial Use | Action Required |
|-----------|---------|------|----------------|-----------------|
| **PlatformIO Core 6.1.19** | Apache-2.0 | Permissive | ✅ Yes | Retain Apache notice |
| **esptool 5.3.1 + tool-esptoolpy** | GPLv2+ | Copyleft (aggregation) | ✅ Yes *if* you ship GPL text + source offer | See `README.txt` §1, ship `GPL-2.0-esptool.txt` |
| **certifi** | MPL-2.0 | Weak copyleft (file-level) | ✅ Yes | Retain MPL notice |
| **AVR/ESP toolchains** | GPLv3 **with** GCC Runtime Exception | Permissive for sketches | ✅ Yes | Retain exception text |
| **Electron 39.x, serialport, avr8js, esptool-js, blockly** | MIT / Apache-2.0 / BSD | Permissive | ✅ Yes | Retain notices |
| **15 bundled Arduino libs** | MIT / BSD-3 | Permissive | ✅ Yes | Retain notices |

No other GPL-3.0/GPL-2.0 remains in the shipped Electron bundle after the PlatformIO migration. Legacy `arduino-cli` (GPL-3.0) and `avrdude` (GPL-2.0) were removed (`src/drivers/platformio/ArduinoUploader.ts:7`, `stk500.ts:8` clean-room STK500).

---

## 1. Bundled Python (src/drivers/platformio/python/)

Built by `scripts/build-pio.ps1` from `platformio==6.1.19` + embeddable Python 3.10.11. `npx license-checker --summary` style scan of `Lib/site-packages/*.dist-info/METADATA`:

- `platformio` — `Apache Software License` — `licenses/LICENSE` (Apache-2.0)
- `esptool` — `GPLv2+` — `licenses/LICENSE` (GPL-2.0) — **only GPL in bundle**
- `certifi` — `MPL-2.0`
- `pyserial` — `BSD` 3.5
- `pyyaml` — `MIT`, `intelhex` — `BSD`, `reedsolo` — `Public Domain`/`MIT-0`, `bitstring` — `MIT`, `cryptography` — `Apache-2.0/BSD`, `cffi` — `MIT`, etc. — all permissive
- **Verified 2026-08-24:** `Remaining GPL packages: NONE` after excluding `esptool` (re-added for ESP32, now disclosed here)

Python `esptool` is invoked as a *separate process* (`tool-esptoolpy/esptool.py`) — not linked — so your proprietary app is **mere aggregation** per GPLv2 §2, not a derivative. You remain proprietary.

**Compliance:** Ship `GPL-2.0-esptool.txt` + `README.txt` source offer (3-year valid). Or remove `Lib/site-packages/esptool/` + `esptool-5.3.1.dist-info/` before `bun run dist:win` to be 100% GPL-free (ESP32 simulation will still compile via manual merge fallback, but `pio run -t upload` for ESP32 will then require the user to have `tool-esptoolpy` downloaded).

---

## 2. PlatformIO Packages (downloaded, not bundled in installer)

- `atmelavr` platform (`toolchain-atmelavr 7.3.0`) — `GPLv3 with GCC Runtime Exception.pdf` — **Safe to ship**: exception allows proprietary sketches to link against `libgcc` without being GPL. If you offline-bundle the toolchain, include the exception text.
- `espressif32` platform (`toolchain-riscv32-esp`, `tool-esptoolpy 4.11.0`) — `tool-esptoolpy` is GPLv2+ (same as Python esptool) — downloaded to `~/.platformio/packages/tool-esptoolpy` on first `pio run`/`pio platform install`. Not bundled in the Electron `extraResources` (`electron-builder.yml:39-54` only ships `platformio`, `server`, `public`, `src/creova/apk/tools`). For SaaS Docker (`Dockerfile:20` `pio platform install atmelavr/espressif32`), the tools are in the image but SaaS execution without distribution does not trigger GPLv2 distribution clause. For offline installers that bundle `~/.platformio`, you must also ship the GPL text for `tool-esptoolpy`.

---

## 3. NPM / Electron (leaplab_frontend/package.json)

`npx license-checker --summary` (2026-08-24):

```
├─ MIT: 819
├─ ISC: 61
├─ Apache-2.0: 51
├─ BSD-3-Clause: 30
├─ BSD-2-Clause: 20
├─ BlueOak-1.0.0: 8
├─ MPL-2.0: 3 (not GPL)
├─ (MIT OR GPL-3.0-or-later): 1 → elect MIT to avoid GPL
└─ UNLICENSED: 1 (your proprietary root)
```

- `electron@39.2.7` — MIT (bundles Chromium BSD, Node MIT)
- `serialport@13` — MIT
- `avr8js@0.21` — MIT
- `blockly@12.5.1` — Apache-2.0
- `esptool-js@0.6` — MIT
- `@tensorflow/*`, `three`, `fabric`, `zustand` — MIT/Apache/BSD

No pure GPL in `node_modules`. The one `(MIT OR GPL-3.0-or-later)` is dual-licensed — choose MIT.

---

## 4. Bundled Arduino Libraries (src/drivers/platformio/libraries/ + forge-lib/)

All `library.properties` → `LICENSE`/`license.txt` checked 2026-08-24:

- `Adafruit_BusIO` — MIT
- `Adafruit GFX Library` — BSD-3
- `Adafruit ILI9341` — MIT/BSD
- `Adafruit MPU6050` — BSD
- `Adafruit NeoPixel` — BSD
- `Adafruit SH110X` — BSD
- `Adafruit SSD1306` — BSD
- `Adafruit STMPE610` — MIT
- `Adafruit TouchScreen` — BSD
- `Adafruit TSC2007` — BSD
- `Adafruit Unified Sensor` — BSD
- `DHT sensor library` — MIT
- `HX711 Arduino Library` — MIT
- `LiquidCrystal I2C` — MIT/BSD (Frank de Brabander)
- `RTClib` — MIT

All permissive with attribution only.

---

## 5. APK Tools (src/creova/apk/tools/)

- `apktool/apktool.jar` — Apache-2.0 (iBotPeaches)
- `smali/smali.jar` — BSD-3
- `signer/uber-apk-signer.jar` — Apache-2.0

Permissive, retain notices.

---

## 6. What to ship

- `public/licenses/README.txt` + `GPL-2.0-esptool.txt` + `Apache-2.0-platformio.txt` + `MPL-2.0-certifi.txt` → automatically copied via `electron-builder.yml:40` `from: public to: public`
- `THIRD_PARTY_NOTICES.md` (this file) — also in `public/licenses/`
- For each permissive Arduino lib, keep its `LICENSE` (already in `src/drivers/platformio/libraries/*/LICENSE` and copied via `extraResources: from: src/drivers/platformio`)

Add an “About → Licenses” menu that opens `resources/public/licenses/`.

---

## 7. Clean-build checklist for commercial artifact

```powershell
Remove-Item -Recurse -Force out,dist -ErrorAction SilentlyContinue
# Verify no GPL arduino-cli remains:
if (Test-Path out\win-unpacked\resources\arduino-cli) { throw "stale GPL arduino-cli still bundled" }
bun run dist:win   # electron-builder will pack platformio + python (now with GPL notice) + public/licenses
```

Your proprietary `leapblocks` (`UNLICENSED`) remains proprietary. GPL is limited to the aggregated `esptool` tool — handled above.

Contact: tech@creoleap.com
