# How to Use WiFi in LeapForge ESP32 Simulation

## Important: WiFi is Simulated!

In LeapForge, the ESP32 WiFi is **simulated** - it doesn't actually connect to a real WiFi network. Instead:

✅ **WiFi.begin()** - Always succeeds (simulated connection)  
✅ **HTTP requests** - Use your computer's internet through the browser  
✅ **SSID/Password** - Can be anything (they're just placeholders)  

## Quick Start

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

// These can be ANY values - they don't need to be real
const char* ssid = "MyNetwork";      // ← Can be anything!
const char* password = "password";    // ← Can be anything!

void setup() {
  Serial.begin(115200);
  
  // This will always "connect" in simulation
  WiFi.begin(ssid, password);
  
  // Wait for simulated connection
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi Connected!");
  
  // Now make REAL HTTP requests!
  HTTPClient http;
  http.begin("https://jsonplaceholder.typicode.com/posts/1");
  
  int code = http.GET();
  if (code == 200) {
    Serial.println(http.getString());
  }
  
  http.end();
}

void loop() {
  delay(1000);
}
```

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│  Your ESP32 Code                                        │
│  WiFi.begin("anything", "anything");  ← Simulated      │
│  http.GET("https://api.com/data");    ← REAL request!  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  LeapForge Simulation                                   │
│  - WiFi: Simulated (always connects)                    │
│  - HTTP: Real (uses browser fetch API)                  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Your Computer's Internet                               │
│  - Uses your WiFi/Ethernet connection                   │
│  - Makes real HTTP/HTTPS requests                       │
│  - Returns real data from internet                      │
└─────────────────────────────────────────────────────────┘
```

## Example: Weather API

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

void setup() {
  Serial.begin(115200);
  
  // Connect to "WiFi" (simulated - any values work)
  WiFi.begin("test", "test");
  while (WiFi.status() != WL_CONNECTED) {
    delay(100);
  }
  
  Serial.println("Connected!");
  
  // Make REAL request to weather API
  HTTPClient http;
  http.begin("https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true");
  
  int code = http.GET();
  Serial.print("HTTP Code: ");
  Serial.println(code);
  
  if (code == 200) {
    Serial.println("Weather Data:");
    Serial.println(http.getString());
  }
  
  http.end();
}

void loop() {}
```

## FAQs

### Q: What SSID and password should I use?
**A:** Any values! They're just placeholders. Use "test"/"test" or "MyNetwork"/"password123" - it doesn't matter.

### Q: Do I need to be connected to WiFi on my computer?
**A:** YES! The HTTP requests use your computer's internet connection through the browser.

### Q: Can I connect to my home WiFi network?
**A:** No, the simulation doesn't connect to real WiFi networks. It's simulated. But HTTP requests are real!

### Q: Why does WiFi.begin() always succeed?
**A:** Because it's simulated. In a real ESP32, it would try to connect to an actual network. In LeapForge, it just pretends to connect.

### Q: Are HTTP requests real?
**A:** YES! HTTP requests are 100% real. They use your computer's internet connection.

### Q: What APIs can I use?
**A:** Any API that supports CORS (Cross-Origin Resource Sharing). Good options:
- JSONPlaceholder: `https://jsonplaceholder.typicode.com`
- HTTPBin: `https://httpbin.org`
- Open-Meteo (weather): `https://api.open-meteo.com`
- ReqRes: `https://reqres.in`

### Q: Why do some APIs not work?
**A:** CORS restrictions. The browser blocks requests to APIs that don't allow cross-origin requests. Use CORS-enabled APIs for testing.

## Common Patterns

### Pattern 1: Simple GET Request
```cpp
WiFi.begin("any", "thing");
while (WiFi.status() != WL_CONNECTED) delay(100);

HTTPClient http;
http.begin("https://jsonplaceholder.typicode.com/posts/1");
int code = http.GET();
if (code == 200) {
  Serial.println(http.getString());
}
http.end();
```

### Pattern 2: POST with JSON
```cpp
WiFi.begin("any", "thing");
while (WiFi.status() != WL_CONNECTED) delay(100);

HTTPClient http;
http.begin("https://jsonplaceholder.typicode.com/posts");
http.addHeader("Content-Type", "application/json");

String json = "{\"title\":\"Test\",\"body\":\"Hello\",\"userId\":1}";
int code = http.POST(json);

Serial.print("Response: ");
Serial.println(http.getString());
http.end();
```

### Pattern 3: Periodic Requests
```cpp
void loop() {
  static unsigned long lastRequest = 0;
  
  if (millis() - lastRequest > 10000) {  // Every 10 seconds
    lastRequest = millis();
    
    HTTPClient http;
    http.begin("https://api.example.com/data");
    int code = http.GET();
    
    if (code == 200) {
      Serial.println(http.getString());
    }
    
    http.end();
  }
  
  delay(100);
}
```

## Summary

- ✅ **WiFi SSID/Password**: Can be anything (simulated)
- ✅ **WiFi.begin()**: Always succeeds (simulated)
- ✅ **HTTP Requests**: 100% real (uses your internet)
- ✅ **Computer Internet**: Required for HTTP to work
- ⚠️ **CORS**: Some APIs may be blocked by browser
- ✅ **HTTPS**: Fully supported

---

**Ready to test?** Try the example code above and watch real data appear in the Serial Monitor!
