# Compiler Server Setup Guide

## Overview

The Electra Compiler Server provides Arduino compilation and transpilation services for web mode. It uses `arduino-cli` to compile sketches and includes a JavaScript transpiler for instant ESP32 simulation.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Electra Web App                          │
│                                                             │
│  ForgeStudio.tsx → CompilerService.ts                       │
│         ↓                                                   │
│    POST /compile  or  POST /transpile                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              Compiler Server (Node.js + Express)            │
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │  /compile    │         │  /transpile  │                 │
│  │              │         │              │                 │
│  │ arduino-cli  │         │  JS Parser   │                 │
│  │ compile      │         │  C++ → JS    │                 │
│  │ .ino → .bin  │         │  Instant     │                 │
│  │ .bin → .hex  │         │              │                 │
│  └──────────────┘         └──────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start (Local Development)

### 1. Start the Server

```bash
cd compiler-server
npm start
```

Server will run on `http://localhost:3001`

### 2. Verify It's Working

Open browser: `http://localhost:3001/health`

Expected response:
```json
{
  "status": "ok",
  "port": 3001,
  "uptime": 123,
  "arduinoCli": "0.35.3",
  "esp32CoreReady": false,
  "endpoints": ["/compile", "/transpile", "/health"]
}
```

### 3. Test Compilation

```bash
curl -X POST http://localhost:3001/transpile \
  -H "Content-Type: application/json" \
  -d '{"code":"void setup(){Serial.begin(9600);} void loop(){Serial.println(\"Hello\");delay(1000);}"}'
```

Expected: `{"success":true,"jsCode":"..."}`

## Configuration

### Arduino CLI Setup

The server looks for `arduino-cli` in this order:

1. **Environment variable**: `ARDUINO_CLI_PATH`
2. **Bundled binary**: `compiler-server/arduino-cli/arduino-cli.exe` (Windows) or `arduino-cli` (Linux/Mac)
3. **Parent directory**: `leapblocks/arduino-cli/arduino-cli.exe`
4. **System PATH**: `arduino-cli` command

### Install Arduino CLI (if not present)

**Windows:**
```bash
# Download from https://arduino.github.io/arduino-cli/latest/installation/
# Or use winget:
winget install ArduinoSA.CLI

# Or manually:
# 1. Download arduino-cli_latest_Windows_64bit.zip
# 2. Extract to leapblocks/arduino-cli/
# 3. Rename to arduino-cli.exe
```

**Linux/Mac:**
```bash
curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh
mv bin/arduino-cli ../arduino-cli/
```

### Install ESP32 Core

The server auto-installs ESP32 core on first ESP32 compilation. To pre-install:

```bash
cd compiler-server
node -e "
const { spawn } = require('child_process');
const proc = spawn('../arduino-cli/arduino-cli.exe', [
  'core', 'install', 'esp32:esp32',
  '--additional-urls', 'https://dl.espressif.com/dl/package_esp32_index.json'
]);
proc.stdout.pipe(process.stdout);
proc.stderr.pipe(process.stderr);
"
```

Or manually:
```bash
arduino-cli core update-index --additional-urls https://dl.espressif.com/dl/package_esp32_index.json
arduino-cli core install esp32:esp32 --additional-urls https://dl.espressif.com/dl/package_esp32_index.json
```

## Deployment Options

### Option 1: Railway (Recommended — Free Tier)

**Pros:**
- ✅ Free 500 hours/month
- ✅ Auto-deploys from GitHub
- ✅ Built-in HTTPS
- ✅ Fast global CDN

**Steps:**

1. **Push to GitHub** (if not already):
   ```bash
   git add compiler-server/
   git commit -m "Add compiler server"
   git push
   ```

2. **Deploy to Railway**:
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub"
   - Select your repo
   - Set **Root Directory**: `compiler-server`
   - Railway auto-detects `Dockerfile` and deploys

3. **Get the URL**:
   - Railway generates a URL like: `https://electra-compiler.up.railway.app`
   - Copy this URL

4. **Update platform.ts**:
   ```typescript
   // src/config/platform.ts
   export const CLOUD_COMPILER_URL = 'https://electra-compiler.up.railway.app';
   ```

5. **Test**:
   ```bash
   curl https://electra-compiler.up.railway.app/health
   ```

### Option 2: Render (Free Tier)

**Pros:**
- ✅ Free tier available
- ✅ Auto-deploys from GitHub
- ✅ Built-in HTTPS

**Steps:**

1. Push to GitHub (same as Railway)

2. **Deploy to Render**:
   - Go to [render.com](https://render.com)
   - Click "New" → "Web Service"
   - Connect GitHub repo
   - Set **Root Directory**: `compiler-server`
   - Render detects `render.yaml` automatically

3. Copy the URL (e.g., `https://electra-compiler.onrender.com`)

4. Update `platform.ts` with the URL

### Option 3: Vercel (Serverless)

**Pros:**
- ✅ Free tier
- ✅ Instant global deployment
- ✅ Auto-scaling

**Cons:**
- ⚠️ 10-second timeout (may be too short for ESP32 compilation)
- ⚠️ No persistent filesystem (arduino-cli needs to download cores on each cold start)

**Steps:**

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   cd compiler-server
   vercel
   ```

3. Copy the URL and update `platform.ts`

### Option 4: Self-Hosted (VPS/Cloud)

**For production use with high traffic:**

1. **Setup on Ubuntu/Debian VPS**:
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install arduino-cli
   curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh
   sudo mv bin/arduino-cli /usr/local/bin/

   # Clone repo
   git clone https://github.com/your-org/leapblocks.git
   cd leapblocks/compiler-server

   # Install dependencies
   npm install

   # Install ESP32 core
   arduino-cli core update-index --additional-urls https://dl.espressif.com/dl/package_esp32_index.json
   arduino-cli core install esp32:esp32 --additional-urls https://dl.espressif.com/dl/package_esp32_index.json

   # Install PM2 for process management
   sudo npm install -g pm2

   # Start server
   pm2 start server.js --name electra-compiler
   pm2 save
   pm2 startup
   ```

2. **Setup Nginx reverse proxy**:
   ```nginx
   server {
       listen 80;
       server_name compiler.yourdomain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Setup SSL with Let's Encrypt**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d compiler.yourdomain.com
   ```

## Environment Variables

Create `.env` file in `compiler-server/`:

```bash
# Port (default: 3001)
PORT=3001

# Arduino CLI path (optional — auto-detected if not set)
ARDUINO_CLI_PATH=/path/to/arduino-cli

# Libraries directory (optional)
FORGE_LIB_LIBRARIES=/path/to/libraries
```

## Testing

### Test Transpilation (Fast)

```bash
curl -X POST http://localhost:3001/transpile \
  -H "Content-Type: application/json" \
  -d '{
    "code": "void setup() { pinMode(2, OUTPUT); } void loop() { digitalWrite(2, HIGH); delay(1000); digitalWrite(2, LOW); delay(1000); }",
    "board": "esp32:esp32:esp32c3"
  }'
```

Expected: `{"success":true,"jsCode":"..."}`

### Test Compilation (Slow — requires arduino-cli)

```bash
curl -X POST http://localhost:3001/compile \
  -H "Content-Type: application/json" \
  -d '{
    "code": "void setup() { pinMode(13, OUTPUT); } void loop() { digitalWrite(13, HIGH); delay(1000); digitalWrite(13, LOW); delay(1000); }",
    "board": "arduino:avr:uno"
  }'
```

Expected: `{"success":true,"hex":":10000000..."}`

### Test ESP32 Compilation

```bash
curl -X POST http://localhost:3001/compile \
  -H "Content-Type: application/json" \
  -d '{
    "code": "void setup() { Serial.begin(115200); Serial.println(\"ESP32 Test\"); } void loop() { delay(1000); }",
    "board": "esp32:esp32:esp32c3"
  }'
```

Expected: `{"success":true,"hex":"...","binBase64":"..."}`

## Troubleshooting

### Error: "arduino-cli not found"

**Solution:**
1. Install arduino-cli (see "Install Arduino CLI" above)
2. Or set `ARDUINO_CLI_PATH` environment variable
3. Or place `arduino-cli.exe` in `compiler-server/arduino-cli/`

### Error: "ESP32 core not available"

**Solution:**
```bash
arduino-cli core update-index --additional-urls https://dl.espressif.com/dl/package_esp32_index.json
arduino-cli core install esp32:esp32 --additional-urls https://dl.espressif.com/dl/package_esp32_index.json
```

### Error: "Port 3001 already in use"

**Solution:**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

Or change port:
```bash
PORT=3002 npm start
```

### Compilation is slow (>30 seconds)

**Causes:**
- First ESP32 compilation downloads core (~200MB)
- Subsequent compilations should be 10-30 seconds

**Solutions:**
- Pre-install ESP32 core (see above)
- Use transpilation instead (instant, recommended for web mode)

### Transpilation errors

**Common issues:**
- **Unsupported C++ features**: Templates, advanced OOP
- **Library-specific code**: Some libraries need real hardware

**Solution:**
- Use RISC-V emulation in Electron mode for full compatibility
- Or simplify code to use standard Arduino API

## Performance

| Operation | Time | Notes |
|-----------|------|-------|
| **Transpile** | <100ms | Instant, recommended for web |
| **Compile AVR** | 2-5s | Arduino Uno/Nano |
| **Compile ESP32 (first)** | 60-120s | Downloads core |
| **Compile ESP32 (cached)** | 10-30s | Core already installed |

## Security

### Production Recommendations

1. **Rate limiting**:
   ```javascript
   const rateLimit = require('express-rate-limit');
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   app.use('/compile', limiter);
   ```

2. **Code size limits** (already implemented):
   ```javascript
   app.use(express.json({ limit: '50mb' }));
   ```

3. **Timeout protection**:
   ```javascript
   const timeout = require('connect-timeout');
   app.use(timeout('120s'));
   ```

4. **CORS restrictions** (for production):
   ```javascript
   app.use(cors({
     origin: ['https://yourdomain.com', 'https://www.yourdomain.com']
   }));
   ```

## Monitoring

### Health Check Endpoint

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "port": 3001,
  "uptime": 3600,
  "arduinoCli": "0.35.3",
  "esp32CoreReady": true,
  "endpoints": ["/compile", "/transpile", "/health"]
}
```

### Logging

Server logs to stdout. In production, use PM2 or Docker logs:

```bash
# PM2
pm2 logs electra-compiler

# Docker
docker logs -f electra-compiler
```

## Next Steps

1. ✅ **Start server locally**: `npm start` in `compiler-server/`
2. ✅ **Test transpilation**: Use curl or Postman
3. ✅ **Deploy to Railway/Render**: Follow deployment guide above
4. ✅ **Update platform.ts**: Set `CLOUD_COMPILER_URL` to your deployed URL
5. ✅ **Test in web app**: Open Electra, select ESP32-C3, compile code

## Support

- **Server issues**: Check `compiler-server/README.md`
- **Arduino CLI docs**: https://arduino.github.io/arduino-cli/
- **Deployment help**: Railway/Render documentation
