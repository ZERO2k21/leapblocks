# 🚀 How to Use ThingSpeak with ESP32 in LeapForge

## ✅ Your Code is Already Fixed!

The file `dht22_thingspeak.ino` contains the **working version** of your ThingSpeak code with all errors fixed.

---

## 🐛 What Was Wrong in Your Original Code?

### Error 1: Wrong Variable Names ❌
```cpp
// You defined:
const char* ssid = "electra";
const char* password = "electra123";

// But used:
WiFi.begin(WIFI_NAME, WIFI_PASSWORD);  // ❌ These don't exist!
```

**Result**: `ReferenceError: WIFI_NAME is not defined`

### Error 2: ThingSpeak Library Not Available ❌
```cpp
#include "ThingSpeak.h"  // ❌ Not in LeapForge
```

LeapForge doesn't have the ThingSpeak library, but you don't need it!

---

## ✅ How It Was Fixed

### Fix 1: Correct Variable Names
```cpp
WiFi.begin(ssid, password);  // ✅ Now uses the correct variables
```

### Fix 2: Use HTTPClient Instead of ThingSpeak Library
```cpp
#include <HTTPClient.h>

// Build the ThingSpeak API URL
String url = "https://api.thingspeak.com/update?api_key=";
url += myApiKey;
url += "&field1=" + String(data.temperature, 2);
url += "&field2=" + String(data.humidity, 1);

// Send the request
HTTPClient http;
http.begin(url);
int httpCode = http.GET();

if (httpCode == 200) {
  Serial.println("Data sent successfully!");
}
```

---

## 📋 Step-by-Step Guide

### Step 1: Open the Fixed Code
1. In LeapForge, open the file: **`dht22_thingspeak.ino`**
2. This file has all the fixes already applied

### Step 2: Verify Your ThingSpeak Settings
The code already has your credentials:
```cpp
const char* ssid = "electra";           // ✅ Your WiFi SSID
const char* password = "electra123";    // ✅ Your WiFi password
const int myChannelNumber = 3372736;    // Your ThingSpeak channel
const char* myApiKey = "FXL4GV1FL2TNW2DW";  // Your Write API Key
```

### Step 3: Select ESP32-C3 Board
⚠️ **IMPORTANT**: WiFi and HTTP only work on ESP32-C3, not Arduino!

1. In LeapForge, select **ESP32-C3** from the board dropdown
2. Do NOT use Arduino Uno/Mega/Nano

### Step 4: Add DHT22 Sensor to Your Circuit
1. Click "Add Component" in LeapForge
2. Search for "DHT22" sensor
3. Connect the sensor:
   - **VCC** → 3.3V
   - **GND** → GND
   - **DATA** → GPIO 15

### Step 5: Add LED (Optional)
The code controls an LED based on temperature/humidity:
1. Add LED component
2. Connect:
   - **Anode (+)** → GPIO 13
   - **Cathode (-)** → GND (with 220Ω resistor)

### Step 6: Run the Simulation
1. Click the **Play** button ▶️
2. Watch the **Serial Monitor** tab for output
3. Watch the **WiFi** tab for connection events

---

## 📊 What You'll See

### Serial Monitor Output
```
Connecting to WiFi.
WiFi connected!
Local IP: 192.168.1.100
Temp: 25.50°C
Humidity: 60.0%
Sending to ThingSpeak: https://api.thingspeak.com/update?api_key=FXL4GV1FL2TNW2DW&field1=25.50&field2=60.0
Data pushed successfully! Entry ID: 12345
---
Temp: 25.52°C
Humidity: 60.1%
Sending to ThingSpeak: https://api.thingspeak.com/update?api_key=FXL4GV1FL2TNW2DW&field1=25.52&field2=60.1
Data pushed successfully! Entry ID: 12346
---
```

### WiFi Tab Output
```
[WiFi] Connected to: electra
[WiFi] IP Address: 192.168.1.100
```

### ThingSpeak Website
1. Go to https://thingspeak.com
2. Log in to your account
3. Open your channel (3372736)
4. You'll see **real data** being updated every 20 seconds!

---

## 🎯 How the LED Works

The LED turns **ON** when any of these conditions are true:
- Temperature > 35°C
- Temperature < 12°C
- Humidity > 70%
- Humidity < 40%

Otherwise, the LED is **OFF**.

---

## ⚙️ How It Works Behind the Scenes

### WiFi Connection (Simulated)
```cpp
WiFi.begin(ssid, password);
```
- In LeapForge, WiFi connection is **simulated**
- Any SSID/password will work
- Connection happens instantly (no real WiFi needed)
- Uses your computer's internet connection

### HTTP Requests (Real!)
```cpp
HTTPClient http;
http.begin(url);
int httpCode = http.GET();
```
- HTTP requests are **REAL**
- Uses browser's `fetch()` API
- Actually sends data to ThingSpeak servers
- You'll see real updates on ThingSpeak.com

### DHT22 Sensor (Simulated)
```cpp
TempAndHumidity data = dhtSensor.getTempAndHumidity();
```
- Returns simulated values (~25°C, ~50% humidity)
- You can adjust values in the sensor component UI
- Values update in real-time

---

## 🔧 ThingSpeak API Details

### Update URL Format
```
https://api.thingspeak.com/update?api_key=YOUR_KEY&field1=VALUE1&field2=VALUE2
```

### Parameters
- `api_key`: Your Write API Key
- `field1`: Temperature value
- `field2`: Humidity value
- You can add up to 8 fields (field1-field8)

### Response Codes
| Code | Meaning |
|------|---------|
| 200 | Success - Returns entry ID |
| 0 | Failed - Too frequent updates |
| -1 | Timeout |
| -2 | Connection failed |

### Rate Limits
- **Free tier**: Minimum 15 seconds between updates
- **Licensed**: Minimum 1 second between updates
- Code uses 20 seconds for safety

---

## ⚠️ Important Notes

### 1. Real Data Will Be Sent
When you run this simulation:
- ✅ Data WILL be sent to your ThingSpeak channel
- ✅ You'll see real updates on ThingSpeak.com
- ✅ This counts toward your ThingSpeak rate limits

### 2. ESP32-C3 Only
WiFi and HTTP features **only work on ESP32-C3**:
- ✅ ESP32-C3: WiFi and HTTP work
- ❌ Arduino Uno/Mega/Nano: WiFi and HTTP blocked

### 3. CORS May Block Some APIs
- ThingSpeak API generally allows CORS
- If you get CORS errors, the API may block browser requests
- ThingSpeak should work fine

### 4. Update Frequency
```cpp
delay(20000);  // 20 seconds between updates
```
- Don't reduce below 15000 (15 seconds)
- ThingSpeak will reject updates that are too frequent

---

## 🔍 Troubleshooting

### Problem: "WIFI_NAME is not defined"
**Solution**: You're using the old code. Open `dht22_thingspeak.ino` (the fixed version)

### Problem: "ThingSpeak.h: No such file"
**Solution**: You're using the old code. The fixed version uses `HTTPClient.h` instead

### Problem: HTTP Error Code 0
**Cause**: Updating too frequently (< 15 seconds)
**Solution**: Increase delay to 20000ms or more

### Problem: HTTP Error Code -1
**Cause**: Request timeout
**Solution**: Check your internet connection

### Problem: HTTP Error Code -2
**Cause**: Connection failed or CORS blocked
**Solution**: 
1. Check your internet connection
2. Verify your ThingSpeak API key is correct
3. Make sure you're using ESP32-C3 board

### Problem: LED Not Working
**Solution**: 
1. Make sure LED is connected to GPIO 13
2. Add a 220Ω resistor in series
3. Check LED polarity (anode to GPIO, cathode to GND)

### Problem: DHT22 Not Reading
**Solution**:
1. Make sure DHT22 is connected to GPIO 15
2. Check sensor component is added to circuit
3. Sensor values are simulated - adjust in component UI

---

## 📚 Complete Code Structure

```cpp
#include <WiFi.h>        // WiFi functionality
#include "DHTesp.h"      // DHT22 sensor
#include <HTTPClient.h>  // HTTP requests

// Configuration
const char* ssid = "electra";
const char* password = "electra123";
const int myChannelNumber = 3372736;
const char* myApiKey = "FXL4GV1FL2TNW2DW";

// Hardware
DHTesp dhtSensor;
const int DHT_PIN = 15;
const int LED_PIN = 13;

void setup() {
  // Initialize serial, sensor, LED
  // Connect to WiFi
}

void loop() {
  // Read sensor
  // Control LED
  // Send to ThingSpeak
  // Wait 20 seconds
}
```

---

## 🎓 Learning Points

### 1. Variable Names Must Match
```cpp
const char* ssid = "electra";     // Define
WiFi.begin(ssid, password);       // Use - names must match!
```

### 2. Libraries Can Be Replaced
- ThingSpeak library → HTTPClient + REST API
- Same functionality, more control
- Works in any environment

### 3. ThingSpeak REST API
```
GET https://api.thingspeak.com/update?api_key=KEY&field1=VALUE
```
- Simple HTTP GET request
- No special library needed
- Works from any platform

### 4. ESP32 Has Real Internet
- ESP32 can make real HTTP requests
- Arduino boards cannot (in LeapForge)
- Use ESP32 for IoT projects

---

## ✅ Quick Checklist

Before running:
- [ ] File `dht22_thingspeak.ino` is open
- [ ] Board is set to **ESP32-C3**
- [ ] DHT22 sensor is added and connected to GPIO 15
- [ ] LED is connected to GPIO 13 (optional)
- [ ] ThingSpeak API key is correct
- [ ] Internet connection is working

---

## 🚀 You're Ready!

Your code is fixed and ready to run. Just:
1. Open `dht22_thingspeak.ino`
2. Select ESP32-C3 board
3. Click Play ▶️
4. Watch data flow to ThingSpeak!

**Happy coding!** 🎉

---

## 📖 Additional Resources

- **WiFi Guide**: See `WIFI_INTERNET_GUIDE.md` for complete WiFi documentation
- **Quick Start**: See `QUICK_START_WIFI.md` for basic WiFi examples
- **Test Files**: 
  - `test_wifi_example.ino` - Basic WiFi test
  - `test_http_example.ino` - HTTP GET/POST examples

---

**Need help?** Check the Serial Monitor and WiFi tabs for detailed logs!
