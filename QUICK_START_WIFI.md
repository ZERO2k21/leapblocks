# Quick Start: ESP32 WiFi in LeapForge

## ✅ Step-by-Step Guide

### Step 1: Select ESP32-C3 Board
1. Click the board selector in LeapForge
2. Choose **ESP32-C3**

### Step 2: Load the WiFi Test Sketch
1. Open `wifi_simple_test.ino` (or create a new file)
2. Copy this code:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "electra";
const char* password = "electra123";

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi Connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  
  // Make HTTP request
  HTTPClient http;
  http.begin("https://jsonplaceholder.typicode.com/posts/1");
  
  int code = http.GET();
  Serial.print("HTTP Code: ");
  Serial.println(code);
  
  if (code == 200) {
    Serial.println(http.getString());
  }
  
  http.end();
}

void loop() {
  delay(1000);
}
```

### Step 3: Run the Simulation
1. Click the **Play** button (▶️)
2. Watch the **Serial Monitor** for output
3. Check the **WiFi tab** for connection events

---

## 🐛 Common Errors & Fixes

### Error: "WIFI_NAME is not defined"

**Cause**: You're using `#define` or a variable that doesn't exist

**Fix**: Use this format:
```cpp
const char* ssid = "electra";
const char* password = "electra123";
```

**NOT this:**
```cpp
#define WIFI_NAME "electra"  // ❌ Don't use #define for WiFi credentials
#define WIFI_PASS "electra123"
```

---

### Error: "WiFi only supported on ESP32-C3"

**Cause**: Wrong board selected

**Fix**: Select ESP32-C3 from board selector

---

### Error: "Invalid or unexpected token"

**Cause**: Syntax error in code or transpiler issue

**Fix**: 
1. Hard refresh browser (Ctrl+Shift+R)
2. Check your code for syntax errors
3. Use the simple example above

---

## 📝 Working Examples

### Example 1: Simple WiFi Connection
```cpp
#include <WiFi.h>

const char* ssid = "electra";
const char* password = "electra123";

void setup() {
  Serial.begin(115200);
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(100);
  }
  
  Serial.println("Connected!");
}

void loop() {}
```

### Example 2: HTTP GET Request
```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "electra";
const char* password = "electra123";

void setup() {
  Serial.begin(115200);
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(100);
  
  HTTPClient http;
  http.begin("https://jsonplaceholder.typicode.com/posts/1");
  
  if (http.GET() == 200) {
    Serial.println(http.getString());
  }
  
  http.end();
}

void loop() {}
```

### Example 3: HTTP POST Request
```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "electra";
const char* password = "electra123";

void setup() {
  Serial.begin(115200);
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(100);
  
  HTTPClient http;
  http.begin("https://jsonplaceholder.typicode.com/posts");
  http.addHeader("Content-Type", "application/json");
  
  String json = "{\"title\":\"Test\",\"body\":\"Hello\",\"userId\":1}";
  int code = http.POST(json);
  
  Serial.print("Response: ");
  Serial.println(code);
  Serial.println(http.getString());
  
  http.end();
}

void loop() {}
```

---

## ✅ Checklist

Before running:
- [ ] ESP32-C3 board selected
- [ ] Code uses `const char* ssid` (not `#define WIFI_NAME`)
- [ ] Code uses `const char* password` (not `#define WIFI_PASS`)
- [ ] `#include <WiFi.h>` at the top
- [ ] `#include <HTTPClient.h>` if using HTTP
- [ ] Browser hard refreshed (Ctrl+Shift+R)

---

## 🎯 What to Expect

### Serial Monitor Output:
```
Connecting to WiFi...
....
WiFi Connected!
IP: 192.168.1.100
HTTP Code: 200
{
  "userId": 1,
  "id": 1,
  "title": "...",
  "body": "..."
}
```

### WiFi Tab Output:
```
[WiFi] connected
[WiFi] ip:192.168.1.100
```

---

## 💡 Tips

1. **SSID/Password**: Can be ANY values - they're simulated
2. **HTTP URLs**: Must support CORS (use JSONPlaceholder for testing)
3. **Timeout**: Default is 5 seconds, increase if needed: `http.setTimeout(10000);`
4. **Error Codes**: 
   - `200` = Success
   - `-1` = Timeout
   - `-2` = Connection failed

---

## 🆘 Still Having Issues?

1. **Hard refresh browser** (Ctrl+Shift+R)
2. **Check browser console** for errors (F12)
3. **Use the simple example** from Example 1 above
4. **Verify ESP32-C3** is selected
5. **Check your internet connection** (HTTP requests use your computer's network)

---

**Ready to test? Load `wifi_simple_test.ino` and click Play!** ▶️
