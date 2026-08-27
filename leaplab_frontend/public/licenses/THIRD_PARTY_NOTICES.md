# LeapLab Third-Party Notices — ZERO GPL Commercial Build

Generated 2026-08-24 for `platformio-migration` @ zero-gpl. This is the **100% GPL-free** installer. No GPL code is bundled. Retain this file per each permissive license's attribution.

## Summary — Zero GPL

| Component | License | Type | Commercial Use | Notes |
|-----------|---------|------|----------------|-------|
| **PlatformIO Core 6.1.19** | Apache-2.0 | Permissive | ✅ Yes | Retain Apache notice |
| **Python esptool** | **REMOVED** (was GPLv2+) | — | ✅ Zero GPL | Not bundled; see §1 |
| **certifi** | MPL-2.0 | Weak copyleft (file-level) | ✅ Yes | Retain MPL notice; not viral |
| **AVR/ESP toolchains** | GPLv3 **with GCC Runtime Exception** | Permissive for sketches | ✅ Yes | Not bundled in installer; downloaded to ~/.platformio on first build |
| **Electron 39.x, serialport, avr8js, esptool-js, blockly** | MIT / Apache-2.0 / BSD | Permissive | ✅ Yes | Retain notices |
| **15 bundled Arduino libs** | MIT / BSD-3 | Permissive | ✅ Yes | Retain notices |
| **APK tools** | Apache-2.0 / BSD | Permissive | ✅ Yes | Retain notices |

**No GPL-2.0/3.0 remains in this installer.** Legacy `arduino-cli` (GPL-3.0) and `avrdude` (GPL-2.0) were removed (`ArduinoUploader.ts:7`, `stk500.ts:8` clean-room STK500). Python `esptool` (GPL) was removed from `src/drivers/platformio/python/` for this build.

---

## 1. Bundled Python (src/drivers/platformio/python/) — ZERO GPL

Built by `scripts/build-pio.ps1` from `platformio==6.1.19` + embeddable Python 3.10.11. **esptool is intentionally NOT installed** (`build-pio.ps1:92`).

`Lib/site-packages/*.dist-info/METADATA` scan 2026-08-24 (zero GPL):

- `platformio` — `Apache Software License` — `licenses/LICENSE` (Apache-2.0)
- `certifi` — `MPL-2.0` (file-level, see README)
- `pyserial` — `BSD` 3.5
- `pyyaml` — `MIT`, `intelhex` — `BSD`, `reedsolo` — `Public Domain`/`MIT-0`, `bitstring` — `MIT`, `cryptography` — `Apache-2.0/BSD`, etc. — all permissive
- **Verified:** `Remaining GPL packages: NONE` — `esptool` removed

`esptool` (GPL) is **not** in `extraResources` (`electron-builder.yml:39-54` only ships `platformio`, `server`, `public`, `src/creova/apk/tools`). No GPL source offer is needed for the installer.

If you need offline ESP32 without any GPL download, use `esptool-js` (MIT, already in `package.json`) for flashing and the manual merge fallback (`ArduinoUploader.buildMergedFlashImage`) for `firmware.merged.bin`.

---

## 2. PlatformIO Packages (downloaded on demand, not bundled)

- `atmelavr` (`toolchain-atmelavr 7.3.0`) — `GPLv3 with GCC Runtime Exception` — **Safe**: exception allows proprietary sketches. Not bundled; downloaded to `~/.platformio/packages/` on first `pio run`.
- `espressif32` (`toolchain-riscv32-esp`, `tool-esptoolpy 4.11.0` GPLv2) — **Not bundled** in zero-GPL installer. If the user builds for ESP32, PlatformIO will download `tool-esptoolpy` (GPL) to `~/.platformio` and the app will show: “ESP32 requires GPL esptool — download now? (https://github.com/espressif/esptool)”. That download is from PlatformIO/Espressif, not from Creoleap, and is not part of this distribution. For 100% offline zero-GPL ESP32, the app uses the manual merge fallback and `esptool-js`.

For SaaS Docker (`Dockerfile:20` `pio platform install`), tools are in the image but SaaS execution without distribution does not trigger GPLv2 distribution.

---

## 3. NPM / Electron

`npx license-checker --summary` (2026-08-24):

```
├─ MIT: 819
├─ ISC: 61
├─ Apache-2.0: 51
├─ BSD-3-Clause: 30
├─ BSD-2-Clause: 20
├─ MPL-2.0: 3 (certifi, not GPL)
├─ (MIT OR GPL-3.0-or-later): 1 → elect MIT
└─ UNLICENSED: 1 (your proprietary root)
```

- `electron@39.2.7` — MIT
- `serialport@13` — MIT
- `avr8js@0.21` — MIT
- `blockly@12.5.1` — Apache-2.0
- `esptool-js@0.6` — MIT

No pure GPL in `node_modules`.

---

## 4. Bundled Arduino Libraries

All `library.properties` → `LICENSE` checked:

- `Adafruit_BusIO` — MIT
- `Adafruit GFX` — BSD-3
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
- `LiquidCrystal I2C` — MIT/BSD
- `RTClib` — MIT

All permissive.

---

## 5. APK Tools

- `apktool.jar` — Apache-2.0
- `smali.jar` — BSD-3
- `uber-apk-signer.jar` — Apache-2.0

---

## 6. What to ship (zero GPL)

- `public/licenses/README.txt` + `Apache-2.0-platformio.txt` + `MPL-2.0-certifi.txt` + `THIRD_PARTY_NOTICES.md`
- No `GPL-2.0-esptool.txt` needed (no GPL bundled)
- Each Arduino lib's `LICENSE` (already via `extraResources: from: src/drivers/platformio`)

Add “About → Licenses”.

---

## 7. Clean-build checklist

```powershell
Remove-Item -Recurse -Force out,dist -ErrorAction SilentlyContinue
# Verify zero GPL:
if (Test-Path src\drivers\platformio\python\Lib\site-packages\esptool) { throw "GPL esptool still bundled" }
if (Test-Path out\win-unpacked\resources\arduino-cli) { throw "stale GPL arduino-cli" }
if (Test-Path out\win-unpacked\resources\platformio\python\Lib\site-packages\esptool) { throw "GPL esptool in installer" }
bun run dist:win
```

Zero GPL verified.

Contact: tech@creoleap.com
