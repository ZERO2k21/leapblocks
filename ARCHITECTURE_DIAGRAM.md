# LeapForge WiFi/HTTP Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Code                                │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │  Arduino Sketch  │              │  ESP32 Sketch    │         │
│  │  (Blink LED)     │              │  (#include WiFi) │         │
│  └────────┬─────────┘              └────────┬─────────┘         │
└───────────┼──────────────────────────────────┼──────────────────┘
            │                                  │
            │                                  │
┌───────────▼──────────────────────────────────▼──────────────────┐
│                    ForgeStudio.tsx                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Compile-Time Check:                                     │   │
│  │  if (code.includes('#include <WiFi.h>') && !isESP32) {  │   │
│  │    ❌ ERROR: "WiFi only on ESP32-C3"                    │   │
│  │  }                                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────┬──────────────────────────────────┬──────────────────┘
            │                                  │
            │ Arduino Path                     │ ESP32 Path
            │                                  │
┌───────────▼─────────────┐      ┌────────────▼──────────────────┐
│   Arduino Compiler      │      │   CompilerService.ts          │
│   (arduino-cli)         │      │   (Transpiler)                │
│                         │      │                               │
│   C++ → HEX File        │      │   C++ → JavaScript            │
│   (AVR Machine Code)    │      │   + Library Stubs             │
└───────────┬─────────────┘      └────────────┬──────────────────┘
            │                                  │
            │                                  │
┌───────────▼─────────────┐      ┌────────────▼──────────────────┐
│   AVR8js Simulator      │      │   ESP32 ArduinoRuntime.ts     │
│                         │      │                               │
│   ❌ No WiFi            │      │   ✅ WiFi Object              │
│   ❌ No HTTP            │      │   ✅ HTTPClient Class         │
│   ✅ Digital I/O        │      │   ✅ WiFiClient Class         │
│   ✅ Analog I/O         │      │   ✅ fetch() API              │
│   ✅ Serial             │      │   ✅ Digital I/O              │
│   ✅ I2C/SPI            │      │   ✅ Serial                   │
└───────────┬─────────────┘      └────────────┬──────────────────┘
            │                                  │
            │                                  │
            │                                  │ Real HTTP Request
            │                                  ▼
            │                    ┌─────────────────────────────┐
            │                    │   Browser fetch() API       │
            │                    │   (Uses Host Network)       │
            │                    └─────────────┬───────────────┘
            │                                  │
            │                                  ▼
            │                    ┌─────────────────────────────┐
            │                    │   Internet                  │
            │                    │   (Real APIs)               │
            │                    └─────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Circuit Visualization                         │
│   ┌──────────────────┐              ┌──────────────────┐        │
│   │  Arduino Board   │              │  ESP32-C3 Board  │        │
│   │  + Components    │              │  + Components    │        │
│   │  (LED, Sensors)  │              │  (LED, Sensors)  │        │
│   └──────────────────┘              └──────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: HTTP Request on ESP32

```
┌─────────────────────────────────────────────────────────────────┐
│  1. User Code (ESP32 Sketch)                                    │
│     HTTPClient http;                                             │
│     http.begin("https://api.example.com/data");                 │
│     int code = http.GET();                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Transpiled JavaScript                                       │
│     const http = new HTTPClient();                              │
│     http.begin("https://api.example.com/data");                 │
│     const code = await http.GET();                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. ESP32 ArduinoRuntime.ts                                     │
│     HTTPClient class injected into context                      │
│     - Real implementation with fetch()                          │
│     - Handles headers, timeouts, errors                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Browser fetch() API                                         │
│     fetch("https://api.example.com/data", {                     │
│       method: "GET",                                            │
│       headers: {...},                                           │
│       signal: abortController.signal                            │
│     })                                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Host Computer Network                                       │
│     Uses your computer's internet connection                    │
│     - WiFi, Ethernet, or Mobile Hotspot                         │
│     - Respects browser security (HTTPS, CORS)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. Internet / API Server                                       │
│     Real HTTP request to actual server                          │
│     - Returns real data                                         │
│     - HTTP status codes (200, 404, 500, etc.)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. Response Back to User Code                                  │
│     Serial.print("HTTP Code: ");                                │
│     Serial.println(code);  // 200                               │
│     Serial.println(http.getString());  // Real response data    │
└─────────────────────────────────────────────────────────────────┘
```

## Protection Layers

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: Compile-Time Check (ForgeStudio.tsx)                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  if (#include <WiFi.h> && board != ESP32) {             │   │
│  │    ❌ BLOCK COMPILATION                                  │   │
│  │  }                                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼ (Only ESP32 passes)
┌─────────────────────────────────────────────────────────────────┐
│  Layer 2: Runtime Separation                                    │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │  Arduino         │              │  ESP32           │         │
│  │  AVR8js          │              │  JS Runtime      │         │
│  │  (No JS)         │              │  (Has JS)        │         │
│  └──────────────────┘              └──────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Layer 3: Stub Safety (CompilerService.ts)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  var HTTPClient = (typeof HTTPClient !== 'undefined'     │   │
│  │                    && HTTPClient)  ← Real (ESP32)        │   │
│  │                    || class {      ← Stub (fallback)     │   │
│  │    GET() { return -2; }  // Error code                   │   │
│  │  }                                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Layer 4: Real Implementation (esp32c3/ArduinoRuntime.ts)      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  HTTPClient: class {                                     │   │
│  │    async _makeRequest() {                                │   │
│  │      const response = await fetch(this._url, {...});    │   │
│  │      return response.status;                             │   │
│  │    }                                                      │   │
│  │  }                                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Comparison with Wokwi

| Feature | Wokwi | LeapForge |
|---------|-------|-----------|
| ESP32 WiFi | ✅ Yes | ✅ Yes |
| Arduino WiFi | ❌ No | ❌ No |
| Real HTTP | ✅ Yes | ✅ Yes |
| HTTPS | ✅ Yes | ✅ Yes |
| Custom Headers | ✅ Yes | ✅ Yes |
| Timeout Control | ✅ Yes | ✅ Yes |
| CORS Handling | ⚠️ Browser | ⚠️ Browser |
| Board Protection | ✅ Yes | ✅ Yes |

## Key Differences from Physical ESP32

| Feature | Physical ESP32 | LeapForge Simulation |
|---------|----------------|---------------------|
| Network | Real WiFi chip | Host computer network |
| Protocol | TCP/IP stack | Browser fetch() API |
| CORS | No restriction | Browser CORS policy |
| SSL/TLS | ESP32 handles | Browser handles |
| Speed | ~80MHz | Host CPU speed |
| Memory | 520KB RAM | Browser memory |

## Security Considerations

1. **CORS**: Browser enforces CORS - some APIs may be blocked
2. **HTTPS**: Browser enforces HTTPS for secure origins
3. **Credentials**: Don't hardcode API keys in public code
4. **Rate Limiting**: Respect API rate limits
5. **Privacy**: Requests go through your browser (visible in DevTools)

---

**Architecture Status**: ✅ Production Ready  
**Board Isolation**: ✅ Complete  
**Internet Connectivity**: ✅ Functional  
