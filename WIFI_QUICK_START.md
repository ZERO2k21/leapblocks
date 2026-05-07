# WiFi Quick Start Guide

## Using WiFi in Electra ESP32-C3

WiFi functionality is now fully working in Electra! Here's how to use it:

### 1. Select ESP32-C3 Board

In the Electra interface, select **ESP32-C3** from the board selector.

### 2. Write Your WiFi Sketch

```cpp
#include <WiFi.h>

const char* ssid = "YourNetworkName";
const char* password = "YourPassword";

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  
  Serial.println("Connecting to WiFi...");
}

void loop() {
  // Check WiFi status
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi Disconnected");
  }
  
  delay(2000);
}
```

### 3. Run the Simulation

Click the **Run** button (▶️) to start the simulation.

### 4. Monitor WiFi Activity

Switch to the **WiFi** tab to see:
- Connection events
- IP address assignments
- Disconnection events

The WiFi status indicator in the footer will show:
- "Connecting..." - Initial state
- "Connected" - WiFi connected
- "IP: 192.168.1.100" - IP address assigned
- "Disconnected" - WiFi disconnected

### 5. Check Serial Output

The **Serial** tab shows your sketch's output without WiFi event clutter.

## Supported WiFi APIs

### Connection Management
- `WiFi.begin(ssid, password)` - Connect to WiFi
- `WiFi.disconnect()` - Disconnect from WiFi
- `WiFi.status()` - Get connection status

### Network Information
- `WiFi.localIP()` - Get IP address (returns IPAddress object)
- `WiFi.SSID()` - Get network name
- `WiFi.RSSI()` - Get signal strength
- `WiFi.macAddress()` - Get MAC address

### WiFi Status Constants
- `WL_IDLE_STATUS` - Idle
- `WL_NO_SSID_AVAIL` - SSID not found
- `WL_CONNECTED` - Connected
- `WL_CONNECT_FAILED` - Connection failed
- `WL_DISCONNECTED` - Disconnected

## Example: WiFi Status Check

```cpp
void loop() {
  switch(WiFi.status()) {
    case WL_CONNECTED:
      Serial.println("Connected");
      break;
    case WL_NO_SSID_AVAIL:
      Serial.println("SSID not available");
      break;
    case WL_CONNECT_FAILED:
      Serial.println("Connection failed");
      break;
    case WL_DISCONNECTED:
      Serial.println("Disconnected");
      break;
    default:
      Serial.println("Unknown status");
  }
  delay(1000);
}
```

## Example: Display IP Address

```cpp
void setup() {
  Serial.begin(115200);
  WiFi.begin("MyNetwork", "password123");
  
  // Wait for connection
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nConnected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}
```

## Tips

1. **Use the WiFi tab** - It's specifically designed for WiFi events
2. **Check the status indicator** - Quick glance at connection state
3. **Serial monitor is clean** - WiFi events don't clutter your debug output
4. **WiFi is simulated** - No actual network connection is made
5. **Fixed IP** - `WiFi.localIP()` always returns `192.168.1.100` in simulation

## Troubleshooting

### "Invalid left-hand side in assignment" error
This error has been fixed! Make sure you're using the latest version.

### WiFi tab is empty
- Verify you selected ESP32-C3 board
- Check that your sketch calls `WiFi.begin()`
- Look for `__LF_WIFI:` messages in the serial output

### Compilation fails
- Make sure you're using ESP32-C3 board (not Arduino Uno)
- Check that you included `#include <WiFi.h>`
- Try the example sketch above

## What's Simulated vs Real

| Feature | Status | Notes |
|---------|--------|-------|
| WiFi.begin() | ✅ Simulated | Triggers connection events |
| WiFi.status() | ✅ Simulated | Always returns WL_CONNECTED |
| WiFi.localIP() | ✅ Simulated | Returns 192.168.1.100 |
| WiFi events | ✅ Working | Captured in WiFi tab |
| HTTP requests | ❌ Not implemented | Use stubs for now |
| WebSockets | ❌ Not implemented | Future enhancement |
| mDNS | ❌ Not implemented | Future enhancement |

## Need Help?

- Check `ESP32_WIFI_COMPLETE_FIX.md` for technical details
- See `test_wifi_example.ino` for a complete working example
- Review `WIFI_FIX_SUMMARY.md` for architecture details
