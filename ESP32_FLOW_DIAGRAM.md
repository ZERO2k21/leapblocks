# ESP32 Web Mode - Complete Flow Diagram

## User Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER ACTIONS                                │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  1. Open Electra       │
                    │     Studio             │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  2. Select ESP32-C3    │
                    │     Board              │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  3. Write Arduino      │
                    │     Code               │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  4. Click "Compile     │
                    │     & Run"             │
                    └────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      COMPILATION FLOW                               │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  ForgeStudio.tsx       │
                    │  handleCompile()       │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Platform Check:       │
                    │  isElectron()?         │
                    └────────────────────────┘
                         │              │
                    NO   │              │   YES
                         │              │
                         ▼              ▼
            ┌──────────────────┐  ┌──────────────────┐
            │  Transpilation   │  │  RISC-V or       │
            │  Path            │  │  Transpilation   │
            │  (Web Mode)      │  │  (Electron)      │
            └──────────────────┘  └──────────────────┘
                         │              │
                         ▼              │
            ┌──────────────────────────┴──────────────┐
            │  CompilerService.transpileCode()        │
            │  POST http://localhost:3001/transpile   │
            └─────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      COMPILER SERVER                                │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  server.js             │
                    │  POST /transpile       │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  transpileArduinoToJS()│
                    └────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
        ┌──────────────────┐      ┌──────────────────┐
        │  1. Remove       │      │  4. Convert      │
        │     Comments     │      │     Functions    │
        └──────────────────┘      └──────────────────┘
                    │                         │
                    ▼                         ▼
        ┌──────────────────┐      ┌──────────────────┐
        │  2. Strip        │      │  5. Add Arduino  │
        │     #include     │      │     API Stubs    │
        └──────────────────┘      └──────────────────┘
                    │                         │
                    ▼                         ▼
        ┌──────────────────┐      ┌──────────────────┐
        │  3. Convert      │      │  6. Wrap &       │
        │     Types        │      │     Export       │
        └──────────────────┘      └──────────────────┘
                    │                         │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Return JavaScript     │
                    │  { success: true,      │
                    │    jsCode: "..." }     │
                    └────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SIMULATION RUNNER                              │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  SimulationRunner      │
                    │  setTranspiledJS()     │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  ESP32C3Simulation     │
                    │  Runner.initTranspiled()│
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  ArduinoRuntime        │
                    │  loadTranspiledCode()  │
                    └────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
        ┌──────────────────┐      ┌──────────────────┐
        │  1. Inject       │      │  3. Build        │
        │     Library      │      │     Arduino API  │
        │     Classes      │      │     Context      │
        └──────────────────┘      └──────────────────┘
                    │                         │
                    ▼                         ▼
        ┌──────────────────┐      ┌──────────────────┐
        │  2. Sync I2C     │      │  4. Evaluate     │
        │     Bridge       │      │     JavaScript   │
        └──────────────────┘      └──────────────────┘
                    │                         │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Extract setup() and   │
                    │  loop() functions      │
                    └────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXECUTION LOOP                                 │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  runTranspiled()       │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Call setup() once     │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Start loop()          │
                    │  @ 60 FPS              │
                    └────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
        ┌──────────────────┐      ┌──────────────────┐
        │  Execute User    │      │  Update Circuit  │
        │  Code            │      │  Engine          │
        └──────────────────┘      └──────────────────┘
                    │                         │
                    ▼                         ▼
        ┌──────────────────┐      ┌──────────────────┐
        │  digitalWrite()  │      │  LED blinks      │
        │  Serial.print()  │      │  OLED updates    │
        │  WiFi.begin()    │      │  Sensors read    │
        └──────────────────┘      └──────────────────┘
                    │                         │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  requestAnimationFrame │
                    │  (next loop iteration) │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Repeat loop() forever │
                    └────────────────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INPUT                                       │
└─────────────────────────────────────────────────────────────────────┘

Arduino C++ Code:
┌─────────────────────────────────────────────────────────────────────┐
│ void setup() {                                                      │
│   pinMode(2, OUTPUT);                                               │
│   Serial.begin(115200);                                             │
│   Serial.println("ESP32 Test");                                     │
│ }                                                                   │
│                                                                     │
│ void loop() {                                                       │
│   digitalWrite(2, HIGH);                                            │
│   delay(1000);                                                      │
│   digitalWrite(2, LOW);                                             │
│   delay(1000);                                                      │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      TRANSPILATION                                  │
└─────────────────────────────────────────────────────────────────────┘

Transpiled JavaScript:
┌─────────────────────────────────────────────────────────────────────┐
│ // Library stubs                                                    │
│ if (typeof Adafruit_SSD1306 === 'undefined') ...                    │
│                                                                     │
│ async function __setup() {                                          │
│   pinMode(2, OUTPUT);                                               │
│   Serial.begin(115200);                                             │
│   Serial.println("ESP32 Test");                                     │
│ }                                                                   │
│                                                                     │
│ async function __loop() {                                           │
│   digitalWrite(2, HIGH);                                            │
│   await __delay(1000);                                              │
│   digitalWrite(2, LOW);                                             │
│   await __delay(1000);                                              │
│ }                                                                   │
│                                                                     │
│ __exports.setup = __setup;                                          │
│ __exports.loop = __loop;                                            │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXECUTION                                      │
└─────────────────────────────────────────────────────────────────────┘

Runtime Execution:
┌─────────────────────────────────────────────────────────────────────┐
│ Frame 0:   setup() → pinMode(2, OUTPUT)                             │
│            → Serial.begin(115200)                                   │
│            → Serial.println("ESP32 Test")                           │
│                                                                     │
│ Frame 1:   loop() → digitalWrite(2, HIGH)                           │
│            → await __delay(1000)                                    │
│                                                                     │
│ Frame 60:  (1 second later)                                         │
│            → digitalWrite(2, LOW)                                   │
│            → await __delay(1000)                                    │
│                                                                     │
│ Frame 120: (2 seconds later)                                        │
│            → loop() repeats...                                      │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         OUTPUT                                      │
└─────────────────────────────────────────────────────────────────────┘

Serial Monitor:
┌─────────────────────────────────────────────────────────────────────┐
│ ESP32 Test                                                          │
│ LED ON                                                              │
│ LED OFF                                                             │
│ LED ON                                                              │
│ LED OFF                                                             │
└─────────────────────────────────────────────────────────────────────┘

Circuit Canvas:
┌─────────────────────────────────────────────────────────────────────┐
│  ESP32-C3                                                           │
│  ┌─────────┐                                                        │
│  │ GPIO 2  ├──────┐                                                 │
│  └─────────┘      │                                                 │
│                   │    LED                                          │
│                   └────(💡)────GND                                  │
│                        ↑                                            │
│                   Blinks every 1s                                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Integration

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPONENT ECOSYSTEM                              │
└─────────────────────────────────────────────────────────────────────┘

User Code (Arduino)
        │
        ▼
┌───────────────────┐
│ digitalWrite(2,   │
│   HIGH)           │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ ArduinoRuntime    │
│ .digitalWrite()   │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ onPinChange       │
│ callback          │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ CircuitEngine     │
│ .updateComponent()│
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ LED Component     │
│ .setState(HIGH)   │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Visual Update     │
│ LED glows 💡      │
└───────────────────┘
```

## WiFi Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      WIFI SIMULATION                                │
└─────────────────────────────────────────────────────────────────────┘

User Code:
┌─────────────────────────────────────────────────────────────────────┐
│ WiFi.begin("electra", "electra");                                   │
│ while (WiFi.status() != WL_CONNECTED) { delay(500); }              │
│                                                                     │
│ HTTPClient http;                                                    │
│ http.begin("https://api.thingspeak.com/update");                   │
│ int code = http.GET();                                              │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ARDUINO RUNTIME                                  │
└─────────────────────────────────────────────────────────────────────┘

WiFi Object:
┌─────────────────────────────────────────────────────────────────────┐
│ begin(ssid, password) {                                             │
│   if (ssid === "electra") {                                         │
│     setTimeout(() => {                                              │
│       this._status = WL_CONNECTED;                                  │
│       Serial.println("__LF_WIFI:connected");                        │
│     }, 500);                                                        │
│   }                                                                 │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BROWSER FETCH API                                │
└─────────────────────────────────────────────────────────────────────┘

HTTPClient:
┌─────────────────────────────────────────────────────────────────────┐
│ async GET() {                                                       │
│   const response = await fetch(this._url);                          │
│   this._responseCode = response.status;                             │
│   this._responseBody = await response.text();                       │
│   return this._responseCode;                                        │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    REAL INTERNET                                    │
└─────────────────────────────────────────────────────────────────────┘

Result:
┌─────────────────────────────────────────────────────────────────────┐
│ ✅ Connected to WiFi                                                │
│ ✅ HTTP GET request sent                                            │
│ ✅ Response received: 200 OK                                        │
│ ✅ Data uploaded to ThingSpeak                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Performance Timeline

```
Time (ms)    Event
─────────────────────────────────────────────────────────────────────
0            User clicks "Compile & Run"
             │
10           ForgeStudio.handleCompile() called
             │
20           Platform check: isElectron() → false
             │
30           POST /transpile request sent
             │
40           Server receives request
             │
50           transpileArduinoToJS() starts
             │
60           C++ parsing complete
             │
70           JavaScript generation complete
             │
80           Response sent back
             │
90           Client receives JavaScript
             │
100          ESP32C3SimulationRunner.initTranspiled()
             │
110          Library classes injected
             │
120          Code evaluated
             │
130          setup() extracted
             │
140          loop() extracted
             │
150          runTranspiled() called
             │
160          setup() executes
             │
170          loop() starts
             │
180          First frame rendered
             │
196          Second frame (60 FPS = 16.67ms per frame)
             │
...          loop() continues at 60 FPS
─────────────────────────────────────────────────────────────────────

Total Time: ~150ms from click to first frame
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ERROR SCENARIOS                                │
└─────────────────────────────────────────────────────────────────────┘

Scenario 1: Server Not Running
┌─────────────────────────────────────────────────────────────────────┐
│ POST /transpile → Network Error                                     │
│         │                                                           │
│         ▼                                                           │
│ CompilerService catches error                                       │
│         │                                                           │
│         ▼                                                           │
│ Return { success: false, error: "Server unreachable" }             │
│         │                                                           │
│         ▼                                                           │
│ ForgeStudio shows error in Serial Monitor                           │
│         │                                                           │
│         ▼                                                           │
│ User sees: "❌ Cannot connect to compiler server"                   │
└─────────────────────────────────────────────────────────────────────┘

Scenario 2: Invalid Code
┌─────────────────────────────────────────────────────────────────────┐
│ POST /transpile with syntax error                                   │
│         │                                                           │
│         ▼                                                           │
│ transpileArduinoToJS() throws exception                             │
│         │                                                           │
│         ▼                                                           │
│ Server catches and returns error                                    │
│         │                                                           │
│         ▼                                                           │
│ Return { success: false, errors: "Syntax error..." }               │
│         │                                                           │
│         ▼                                                           │
│ ForgeStudio shows error in Serial Monitor                           │
│         │                                                           │
│         ▼                                                           │
│ User sees: "❌ TRANSPILATION ERROR: ..."                            │
└─────────────────────────────────────────────────────────────────────┘

Scenario 3: Runtime Error
┌─────────────────────────────────────────────────────────────────────┐
│ Code executes but throws error                                      │
│         │                                                           │
│         ▼                                                           │
│ ArduinoRuntime catches exception                                    │
│         │                                                           │
│         ▼                                                           │
│ Log to Serial Monitor                                               │
│         │                                                           │
│         ▼                                                           │
│ Stop simulation                                                     │
│         │                                                           │
│         ▼                                                           │
│ User sees: "[ERROR in loop()]: ..."                                │
└─────────────────────────────────────────────────────────────────────┘
```

This diagram shows the complete flow from user action to visual output!
