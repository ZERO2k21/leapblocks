# 🏗️ ThingSpeak Integration Architecture

Visual guide to how ESP32 + DHT22 + ThingSpeak works in LeapForge.

---

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         LeapForge IDE                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Your Arduino Code                      │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  #include <WiFi.h>                                  │  │  │
│  │  │  #include "DHTesp.h"                                │  │  │
│  │  │  #include <HTTPClient.h>                            │  │  │
│  │  │                                                      │  │  │
│  │  │  WiFi.begin(ssid, password);                        │  │  │
│  │  │  TempAndHumidity data = dhtSensor.getTempAndHumidity(); │  │
│  │  │  http.GET(thingspeak_url);                          │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  Transpiler (CompilerService)             │  │
│  │  • Converts C++ to JavaScript                            │  │
│  │  • Injects library stubs (WiFi, DHTesp, HTTPClient)      │  │
│  │  • Handles pointer types (char*, const char*)            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              ESP32-C3 Runtime (ArduinoRuntime)            │  │
│  │  ┌─────────────┐  ┌──────────┐  ┌──────────────┐         │  │
│  │  │    WiFi     │  │  DHTesp  │  │  HTTPClient  │         │  │
│  │  │ (Simulated) │  │(Simulated)│  │    (Real)    │         │  │
│  │  └─────────────┘  └──────────┘  └──────────────┘         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┴─────────────────────┐
        │                                            │
        ↓ (Simulated)                                ↓ (Real)
┌───────────────┐                          ┌──────────────────┐
│  WiFi Status  │                          │  Browser fetch() │
│  • Connected  │                          │  • Real HTTP     │
│  • IP: 192... │                          │  • CORS enabled  │
└───────────────┘                          └──────────────────┘
                                                     ↓
                                           ┌──────────────────┐
                                           │  ThingSpeak API  │
                                           │  api.thingspeak  │
                                           │     .com         │
                                           └──────────────────┘
                                                     ↓
                                           ┌──────────────────┐
                                           │ ThingSpeak.com   │
                                           │ • Channel 3372736│
                                           │ • Field 1: Temp  │
                                           │ • Field 2: Humid │
                                           │ • Real-time chart│
                                           └──────────────────┘
```

---

## 🔄 Data Flow

### Step 1: WiFi Connection (Simulated)
```
User Code:
  WiFi.begin("electra", "electra123")
       ↓
ArduinoRuntime:
  WiFi._status = WL_CONNECTED
  WiFi._ip = "192.168.1.100"
  onSerial("__LF_WIFI:connected")
       ↓
WiFi Tab:
  [WiFi] Connected to: electra
  [WiFi] IP Address: 192.168.1.100
```

### Step 2: Sensor Reading (Simulated)
```
User Code:
  TempAndHumidity data = dhtSensor.getTempAndHumidity()
       ↓
ArduinoRuntime:
  DHTesp.getTempAndHumidity()
       ↓
useForgeStore:
  Find DHT22 node in circuit
  Read sensorValues.temperature
  Read sensorValues.humidity
       ↓
Return:
  { temperature: 25.5, humidity: 60.0 }
```

### Step 3: HTTP Request (Real!)
```
User Code:
  HTTPClient http;
  http.begin("https://api.thingspeak.com/update?api_key=...");
  int code = http.GET();
       ↓
ArduinoRuntime:
  HTTPClient._makeRequest('GET')
       ↓
Browser:
  fetch("https://api.thingspeak.com/update?...")
       ↓
Internet:
  Real HTTP request to ThingSpeak servers
       ↓
ThingSpeak:
  Receives data
  Stores in channel
  Returns entry ID
       ↓
User Code:
  httpCode = 200
  response = "12345" (entry ID)
```

---

## 🧩 Component Architecture

### 1. WiFi Class (Simulated)
```typescript
WiFi: {
  _status: 0,           // WL_IDLE_STATUS
  _ssid: '',
  _ip: '192.168.1.100',
  
  begin(ssid, password) {
    this._ssid = ssid;
    setTimeout(() => {
      this._status = 3;  // WL_CONNECTED
      onSerial('__LF_WIFI:connected');
    }, 500);
  },
  
  status() { return this._status; },
  localIP() { return IPAddress object; }
}
```

**Key Points:**
- ✅ Connection is instant (simulated)
- ✅ Any SSID/password works
- ✅ Always returns 192.168.1.100
- ✅ Logs to WiFi tab via `__LF_WIFI:` prefix

### 2. DHTesp Class (Simulated)
```typescript
DHTesp: class {
  static DHT22 = 22;
  
  setup(pin, type) { }
  
  getTempAndHumidity() {
    const nodes = useForgeStore.getState().nodes;
    for (const node of nodes) {
      if (node.data?.type === 'dht22') {
        return {
          temperature: node.data.sensorValues.temperature,
          humidity: node.data.sensorValues.humidity
        };
      }
    }
    return { temperature: 25.0, humidity: 50.0 };
  }
}
```

**Key Points:**
- ✅ Reads from circuit component
- ✅ Returns simulated values
- ✅ Defaults to 25°C, 50% if no sensor
- ✅ Updates in real-time from UI

### 3. HTTPClient Class (Real!)
```typescript
HTTPClient: class {
  private _url: string;
  private _responseCode: number;
  private _responseBody: string;
  
  begin(url) {
    this._url = url;
  }
  
  async GET() {
    const response = await fetch(this._url, {
      method: 'GET',
      signal: AbortSignal.timeout(this._timeout)
    });
    
    this._responseCode = response.status;
    this._responseBody = await response.text();
    
    return this._responseCode;
  }
  
  getString() { return this._responseBody; }
}
```

**Key Points:**
- ✅ Uses browser's `fetch()` API
- ✅ Makes REAL HTTP requests
- ✅ Supports GET, POST, PUT, DELETE, PATCH
- ✅ Handles timeouts and errors
- ✅ Returns real HTTP status codes

---

## 🔐 Security & Isolation

### ESP32-C3 Only Protection
```typescript
// In ForgeStudio.tsx (compile-time check)
if (code.includes('WiFi.begin') && selectedBoard !== 'esp32c3') {
  throw new Error('WiFi is only available on ESP32-C3');
}

// In ArduinoRuntime.ts (runtime check)
if (boardType === 'arduino') {
  // WiFi and HTTPClient are NOT injected
  // Only basic Arduino functions available
}

if (boardType === 'esp32c3') {
  // WiFi and HTTPClient ARE injected
  // Full internet connectivity available
}
```

**Protection Layers:**
1. ✅ Compile-time check in ForgeStudio
2. ✅ Runtime board type check
3. ✅ Conditional class injection
4. ✅ Safe stubs for Arduino boards

---

## 📡 ThingSpeak API Integration

### URL Format
```
https://api.thingspeak.com/update?api_key=KEY&field1=VALUE1&field2=VALUE2
```

### Request Flow
```
User Code:
  String url = "https://api.thingspeak.com/update?";
  url += "api_key=" + myApiKey;
  url += "&field1=" + String(temperature);
  url += "&field2=" + String(humidity);
       ↓
HTTPClient:
  http.begin(url);
  http.GET();
       ↓
Browser fetch():
  GET https://api.thingspeak.com/update?api_key=FXL4GV1FL2TNW2DW&field1=25.50&field2=60.0
       ↓
ThingSpeak Server:
  • Validates API key
  • Checks rate limit (15 seconds)
  • Stores data in channel
  • Returns entry ID
       ↓
Response:
  Status: 200 OK
  Body: "12345" (entry ID)
```

### Response Codes
| Code | Meaning | Cause |
|------|---------|-------|
| 200 | Success | Data stored successfully |
| 0 | Failed | Rate limit exceeded (< 15 sec) |
| -1 | Timeout | Request took too long |
| -2 | Connection failed | Network error or CORS blocked |

---

## 🔄 Transpilation Process

### Input (C++ Code)
```cpp
const char* ssid = "electra";
const char* password = "electra123";

void setup() {
  WiFi.begin(ssid, password);
}

void loop() {
  TempAndHumidity data = dhtSensor.getTempAndHumidity();
  
  HTTPClient http;
  http.begin(url);
  int code = http.GET();
}
```

### Transpilation Steps
```
1. Parse C++ syntax
   • Handle pointer types: char* → string
   • Convert :: to . (DHTesp::DHT22 → DHTesp.DHT22)
   • Remove & operator: fn(&a) → fn(a)

2. Inject library stubs
   • WiFi class definition
   • DHTesp class definition
   • HTTPClient class definition
   • TempAndHumidity struct

3. Convert to JavaScript
   • const char* → const
   • void → function
   • int → let/const
   • String → string operations

4. Wrap in context
   • Add setup() and loop() functions
   • Inject Arduino API (pinMode, digitalWrite, etc.)
   • Add timing functions (millis, delay, etc.)
```

### Output (JavaScript)
```javascript
const ssid = "electra";
const password = "electra123";

function setup() {
  WiFi.begin(ssid, password);
}

function loop() {
  const data = dhtSensor.getTempAndHumidity();
  
  const http = new HTTPClient();
  http.begin(url);
  const code = http.GET();
}
```

---

## 🎯 State Management

### useForgeStore State
```typescript
interface ForgeStore {
  // Circuit state
  nodes: Node[];              // Circuit components (DHT22, LED, etc.)
  
  // Simulation state
  isRunning: boolean;
  selectedBoard: 'arduino' | 'esp32c3';
  
  // Output state
  serialOutput: string[];     // Serial Monitor messages
  wifiLog: string[];          // WiFi tab messages
  
  // Actions
  appendSerialOutput(msg: string): void;
  appendWiFiLog(msg: string): void;
}
```

### Data Flow
```
DHT22 Component UI
  ↓ (user adjusts slider)
node.data.sensorValues.temperature = 30.5
  ↓ (stored in useForgeStore)
DHTesp.getTempAndHumidity()
  ↓ (reads from store)
return { temperature: 30.5, humidity: 65.0 }
  ↓ (used in user code)
http.GET("...&field1=30.5&field2=65.0")
  ↓ (sent to ThingSpeak)
ThingSpeak chart updates
```

---

## 🧪 Testing Architecture

### Test Files
```
test_wifi_example.ino
  • Tests WiFi connection
  • Verifies status codes
  • Checks IP address

test_http_example.ino
  • Tests HTTP GET
  • Tests HTTP POST
  • Verifies responses

dht22_thingspeak.ino
  • Full integration test
  • WiFi + DHT22 + HTTP
  • Real ThingSpeak updates
```

### Test Flow
```
1. Basic WiFi Test
   WiFi.begin() → Check status → Verify IP

2. HTTP Test
   http.GET() → Check response code → Read body

3. Sensor Test
   getTempAndHumidity() → Verify values → Check ranges

4. Integration Test
   WiFi → Sensor → HTTP → ThingSpeak → Verify data
```

---

## 📊 Performance Characteristics

### WiFi Connection
- **Latency**: ~500ms (simulated delay)
- **Success Rate**: 100% (always succeeds)
- **Memory**: Minimal (just status variables)

### Sensor Reading
- **Latency**: <1ms (direct store access)
- **Update Rate**: Real-time (updates with UI)
- **Accuracy**: Simulated (user-controlled)

### HTTP Requests
- **Latency**: Real network latency (varies)
- **Timeout**: 5-10 seconds (configurable)
- **Success Rate**: Depends on network and API
- **Throughput**: Limited by ThingSpeak rate limits

### Overall System
- **Update Frequency**: 20 seconds (ThingSpeak limit)
- **CPU Usage**: Low (browser-based)
- **Memory Usage**: Low (JavaScript runtime)
- **Network Usage**: Minimal (small HTTP requests)

---

## 🔒 Error Handling

### WiFi Errors
```
• Connection timeout → Retry automatically
• Invalid credentials → Ignored (simulated)
• Network unavailable → Ignored (simulated)
```

### Sensor Errors
```
• Sensor not found → Return default values (25°C, 50%)
• Invalid readings → Clamp to valid ranges
• Communication error → Return last known values
```

### HTTP Errors
```
• Timeout (-1) → Log error, continue
• Connection failed (-2) → Log error, continue
• Rate limit (0) → Wait longer, retry
• Server error (5xx) → Log error, continue
```

---

## 🎓 Key Design Decisions

### 1. Why Simulate WiFi?
- ✅ Browser can't access real WiFi
- ✅ Simplifies user experience
- ✅ No need for real credentials
- ✅ Works on any computer

### 2. Why Real HTTP?
- ✅ Browser has `fetch()` API
- ✅ Enables real IoT functionality
- ✅ Tests actual API integration
- ✅ Provides realistic experience

### 3. Why HTTPClient Instead of ThingSpeak Library?
- ✅ ThingSpeak library not available
- ✅ HTTPClient is more flexible
- ✅ Direct API calls are simpler
- ✅ Works in any environment

### 4. Why ESP32-C3 Only?
- ✅ Arduino boards don't have WiFi
- ✅ Matches real hardware capabilities
- ✅ Prevents user confusion
- ✅ Teaches correct board selection

---

## 📈 Future Enhancements

### Potential Improvements
1. **More HTTP Methods**: PATCH, HEAD, OPTIONS
2. **WebSocket Support**: Real-time bidirectional communication
3. **MQTT Protocol**: IoT messaging protocol
4. **SSL/TLS Certificates**: Custom certificate handling
5. **DNS Resolution**: Custom DNS servers
6. **Network Simulation**: Latency, packet loss, bandwidth limits

### Compatibility
- ✅ Works with any ThingSpeak channel
- ✅ Works with other REST APIs
- ✅ Compatible with CORS-enabled services
- ✅ Supports JSON, XML, plain text responses

---

## ✅ Summary

### Architecture Highlights
- 🎯 **Hybrid Approach**: Simulated WiFi + Real HTTP
- 🔒 **Secure**: ESP32-only, no Arduino access
- 🚀 **Fast**: Instant WiFi, real HTTP performance
- 🧩 **Modular**: Separate WiFi, Sensor, HTTP classes
- 📊 **Observable**: Logs to Serial and WiFi tabs
- 🔧 **Maintainable**: Clean separation of concerns

### Data Flow Summary
```
User Code → Transpiler → Runtime → Browser APIs → Internet → ThingSpeak
   ↓           ↓           ↓            ↓            ↓          ↓
  C++         JS      Simulated     fetch()      HTTP      Cloud
```

---

**This architecture enables real IoT functionality in a browser-based simulation!** 🚀

---

**See also:**
- `README_THINGSPEAK.md` - Complete guide
- `HOW_TO_USE_THINGSPEAK.md` - User documentation
- `WIFI_INTERNET_GUIDE.md` - WiFi details
