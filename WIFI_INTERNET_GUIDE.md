# ESP32 Internet Connectivity in Electra

## Overview

The Electra ESP32-C3 simulation now supports **real internet connectivity**! Your simulated ESP32 can make actual HTTP/HTTPS requests using your computer's network connection, just like a physical ESP32 would.

## Features

✅ **Real WiFi Connection** - Connects using your host computer's network  
✅ **HTTP/HTTPS Requests** - GET, POST, PUT, DELETE, PATCH methods  
✅ **Custom Headers** - Add authentication tokens, content types, etc.  
✅ **Timeout Control** - Configure request timeouts  
✅ **Response Handling** - Get status codes, response bodies, and sizes  
✅ **WiFi Status Monitoring** - Check connection status in real-time  

## Supported Classes

### WiFi
- `WiFi.begin(ssid, password)` - Connect to WiFi
- `WiFi.status()` - Get connection status (WL_CONNECTED, WL_DISCONNECTED, etc.)
- `WiFi.localIP()` - Get assigned IP address
- `WiFi.SSID()` - Get connected network name
- `WiFi.RSSI()` - Get signal strength
- `WiFi.disconnect()` - Disconnect from WiFi

### HTTPClient
- `http.begin(url)` - Initialize HTTP request
- `http.GET()` - Make GET request (returns HTTP status code)
- `http.POST(payload)` - Make POST request with body
- `http.PUT(payload)` - Make PUT request
- `http.DELETE()` - Make DELETE request
- `http.PATCH(payload)` - Make PATCH request
- `http.addHeader(name, value)` - Add custom header
- `http.setTimeout(ms)` - Set request timeout (default: 5000ms)
- `http.getString()` - Get response body as string
- `http.getSize()` - Get response body size
- `http.end()` - Clean up resources

### WiFiClient
- `client.connect(host, port)` - Connect to TCP server
- `client.connected()` - Check if connected
- `client.print(data)` - Send data
- `client.println(data)` - Send data with newline
- `client.available()` - Check bytes available
- `client.read()` - Read one byte
- `client.readString()` - Read all available data
- `client.stop()` - Close connection

## Example: Simple HTTP GET

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "YourNetwork";
const char* password = "YourPassword";

void setup() {
  Serial.begin(115200);
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nConnected!");
  
  HTTPClient http;
  http.begin("https://api.example.com/data");
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String response = http.getString();
    Serial.println(response);
  }
  
  http.end();
}

void loop() {
  delay(1000);
}
```

## Example: HTTP POST with JSON

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

void sendData() {
  HTTPClient http;
  
  http.begin("https://api.example.com/sensor");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer YOUR_TOKEN");
  
  String json = "{\"temperature\":25.5,\"humidity\":60}";
  
  int httpCode = http.POST(json);
  
  if (httpCode > 0) {
    Serial.print("Response code: ");
    Serial.println(httpCode);
    Serial.println(http.getString());
  }
  
  http.end();
}
```

## Example: Weather API

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

void getWeather() {
  HTTPClient http;
  
  String url = "https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY";
  
  http.begin(url);
  http.setTimeout(10000); // 10 second timeout
  
  int code = http.GET();
  
  if (code == 200) {
    String weather = http.getString();
    Serial.println(weather);
  } else {
    Serial.print("Error: ");
    Serial.println(code);
  }
  
  http.end();
}
```

## HTTP Status Codes

- `200` - OK (Success)
- `201` - Created (POST success)
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error
- `-1` - Timeout
- `-2` - Connection Failed

## CORS Considerations

⚠️ **Important**: Since the simulation runs in a web browser, you may encounter CORS (Cross-Origin Resource Sharing) errors when accessing certain APIs.

**Solutions:**
1. Use APIs that support CORS (have `Access-Control-Allow-Origin: *` header)
2. Use public testing APIs like:
   - JSONPlaceholder: `https://jsonplaceholder.typicode.com`
   - HTTPBin: `https://httpbin.org`
   - ReqRes: `https://reqres.in`
3. For production APIs, ensure they have proper CORS headers configured

## Testing APIs

### JSONPlaceholder (Free Fake API)
```cpp
// GET request
http.begin("https://jsonplaceholder.typicode.com/posts/1");
int code = http.GET();

// POST request
http.begin("https://jsonplaceholder.typicode.com/posts");
http.addHeader("Content-Type", "application/json");
String json = "{\"title\":\"Test\",\"body\":\"Content\",\"userId\":1}";
http.POST(json);
```

### HTTPBin (HTTP Testing Service)
```cpp
// Test GET with query params
http.begin("https://httpbin.org/get?param1=value1");
http.GET();

// Test POST
http.begin("https://httpbin.org/post");
http.addHeader("Content-Type", "application/json");
http.POST("{\"test\":\"data\"}");

// Test headers
http.begin("https://httpbin.org/headers");
http.addHeader("X-Custom-Header", "MyValue");
http.GET();
```

## WiFi Status Constants

```cpp
WL_NO_SHIELD        // 255 - No WiFi shield
WL_IDLE_STATUS      // 0   - Idle
WL_NO_SSID_AVAIL    // 1   - SSID not found
WL_SCAN_COMPLETED   // 2   - Scan completed
WL_CONNECTED        // 3   - Connected
WL_CONNECT_FAILED   // 4   - Connection failed
WL_CONNECTION_LOST  // 5   - Connection lost
WL_DISCONNECTED     // 6   - Disconnected
```

## Best Practices

1. **Always check WiFi status** before making HTTP requests
2. **Set appropriate timeouts** for slow APIs
3. **Handle errors gracefully** - check HTTP status codes
4. **Close connections** with `http.end()` to free resources
5. **Use HTTPS** when possible for security
6. **Test with public APIs** first before using production endpoints

## Troubleshooting

### "HTTP Request Failed, error: -2"
- Check your internet connection
- Verify the URL is correct
- Check if the API supports CORS

### "HTTP Request Failed, error: -1"
- Request timed out
- Increase timeout: `http.setTimeout(15000);`
- Check if the server is responding slowly

### "CORS Error" in browser console
- The API doesn't allow browser requests
- Use a CORS-enabled API or proxy
- Check API documentation for CORS support

## Real-World Use Cases

1. **IoT Data Logging** - Send sensor data to cloud platforms
2. **Weather Stations** - Fetch weather data from APIs
3. **Home Automation** - Control devices via REST APIs
4. **Notifications** - Send alerts to services like Telegram, Discord
5. **Data Visualization** - Push data to dashboards
6. **Remote Control** - Receive commands from web services

## Next Steps

1. Try the example: `test_http_example.ino`
2. Experiment with public APIs
3. Build your own IoT project with real internet connectivity!

---

**Note**: The simulation uses your computer's network connection through the browser's `fetch` API. All requests are made from your browser, so they follow browser security policies (HTTPS, CORS, etc.).
