# Compiler Server Quick Start

## 🚀 Start Server (Local)

```bash
cd compiler-server
npm start
```

Server runs on: **http://localhost:3001**

## ✅ Test Server

```bash
cd compiler-server
node test-server.js
```

Or open browser: **http://localhost:3001/health**

## 🌐 Deploy to Railway (Free)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add compiler server"
   git push
   ```

2. **Deploy**:
   - Go to [railway.app](https://railway.app)
   - New Project → Deploy from GitHub
   - Select repo
   - Set Root Directory: `compiler-server`
   - Deploy!

3. **Copy URL**: `https://your-app.up.railway.app`

4. **Update platform.ts**:
   ```typescript
   // src/config/platform.ts
   export const CLOUD_COMPILER_URL = 'https://your-app.up.railway.app';
   ```

## 📝 What It Does

| Endpoint | Purpose | Speed |
|----------|---------|-------|
| `/transpile` | Arduino C++ → JavaScript | <100ms ⚡ |
| `/compile` | Arduino C++ → Binary | 10-30s 🐢 |
| `/health` | Server status | Instant |

## 🎯 For Web Mode

**You only need transpilation** (instant, no arduino-cli required):

```javascript
// CompilerService.ts already uses this
POST /transpile
{
  "code": "void setup() {...}",
  "board": "esp32:esp32:esp32c3"
}

Response:
{
  "success": true,
  "jsCode": "async function __setup() {...}"
}
```

## 🔧 Troubleshooting

### Server won't start
```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001

# Kill the process
taskkill /PID <PID> /F

# Or use different port
PORT=3002 npm start
```

### "Cannot connect to server"
- Make sure server is running: `npm start`
- Check firewall settings
- Try: `curl http://localhost:3001/health`

### Transpilation works but compilation fails
- **This is OK for web mode!** Web mode only needs transpilation
- Compilation requires arduino-cli (optional)

## 📚 Full Documentation

See `COMPILER_SERVER_SETUP.md` for:
- Detailed deployment guides
- Arduino CLI installation
- Production configuration
- Security best practices

## 🎉 You're Done!

1. ✅ Server running locally: `npm start`
2. ✅ Test it: `node test-server.js`
3. ✅ Deploy to Railway (optional)
4. ✅ Update `platform.ts` with your URL
5. ✅ ESP32 simulation now works in web mode!
