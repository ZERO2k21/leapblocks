# Electra Compile Server

Standalone Node.js server that compiles Arduino sketches and transpiles them to JavaScript for the Electra ESP32 simulator.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/compile` | Compile Arduino C++ → HEX (AVR) or HEX (ESP32) |
| POST | `/transpile` | Transpile Arduino C++ → JavaScript for ArduinoRuntime |
| GET | `/health` | Server status + arduino-cli version |

### POST /compile
```json
{
  "code": "void setup() { ... } void loop() { ... }",
  "board": "arduino:avr:uno",
  "libraries": ""
}
```
Response:
```json
{ "success": true, "hex": ":10000000..." }
```

### POST /transpile
```json
{
  "code": "void setup() { Serial.begin(9600); } void loop() { ... }",
  "board": "esp32:esp32:esp32c3"
}
```
Response:
```json
{ "success": true, "jsCode": "async function __setup() { ... }" }
```

## Run Locally

```bash
cd compiler-server
npm install
node server.js
# Server runs on http://localhost:3001
```

## Deploy to Railway (Recommended — Free Tier)

1. Push this folder to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select the repo, set root directory to `compiler-server`
4. Railway auto-detects the Dockerfile and deploys
5. Copy the generated URL (e.g. `https://electra-compiler.up.railway.app`)
6. Update `CLOUD_COMPILER_URL` in `src/config/platform.ts`

## Deploy to Render (Free Tier)

1. Push to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect repo, set root to `compiler-server`
4. Render detects `render.yaml` automatically
5. Copy the URL and update `platform.ts`

## Deploy to Fly.io

```bash
cd compiler-server
fly launch --name electra-compiler
fly deploy
```

## Update platform.ts

After deploying, update the URL in `src/config/platform.ts`:

```ts
export const CLOUD_COMPILER_URL = 'https://your-server.up.railway.app';
```

## Supported Boards

| FQBN | Board |
|------|-------|
| `arduino:avr:uno` | Arduino Uno |
| `arduino:avr:nano:cpu=atmega328old` | Arduino Nano |
| `arduino:avr:mega` | Arduino Mega |
| `attiny:avr:ATtinyX5:cpu=attiny85` | ATtiny85 |
| `esp32:esp32:esp32c3` | ESP32-C3 |

## Pre-installed Libraries (Docker)

- Adafruit SSD1306 + GFX
- LiquidCrystal I2C
- DHT sensor library
- Servo + ESP32Servo
- Adafruit NeoPixel
- MPU6050
- IRremote
- Keypad
- HX711
