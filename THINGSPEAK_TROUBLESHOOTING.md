# 🔧 ThingSpeak Troubleshooting Guide

Quick solutions to common problems when using ThingSpeak with ESP32 in LeapForge.

---

## 🚨 Error: "WIFI_NAME is not defined"

### Problem
```
ReferenceError: WIFI_NAME is not defined
```

### Cause
Your code uses `WIFI_NAME` and `WIFI_PASSWORD` but these variables don't exist.

### Solution
**Option 1: Use the Fixed File** (Recommended)
- Open `dht22_thingspeak.ino` (the fixed version)
- This file already has the correct variable names

**Option 2: Fix Your Code**
Change this:
```cpp
WiFi.begin(WIFI_NAME, WIFI_PASSWORD);  // ❌ Wrong
```

To this:
```cpp
WiFi.begin(ssid, password);  // ✅ Correct
```

---

## 🚨 Error: "ThingSpeak.h: No such file"

### Problem
```
fatal error: ThingSpeak.h: No such file or directory
```

### Cause
LeapForge doesn't have the ThingSpeak library.

### Solution
**Use the Fixed File**
- Open `dht22_thingspeak.ino`
- This uses `HTTPClient` instead of ThingSpeak library
- Works exactly the same way!

**How It Works:**
```cpp
// Instead of:
#include "ThingSpeak.h"
ThingSpeak.writeFields(channel, apiKey);

// Use:
#include <HTTPClient.h>
HTTPClient http;
http.begin("https://api.thingspeak.com/update?api_key=KEY&field1=VALUE");
http.GET();
```

---

## 🚨 HTTP Error Code: 0

### Problem
```
Push error: 0
```

### Cause
ThingSpeak rejected your update because you're sending data too frequently.

### Solution
**Increase the delay:**
```cpp
delay(20000);  // 20 seconds (minimum 15 for free tier)
```

**Why?**
- ThingSpeak free tier: Minimum 15 seconds between updates
- Using 10 seconds → Rejected (error 0)
- Using 20 seconds → Accepted ✅

---

## 🚨 HTTP Error Code: -1

### Problem
```
Push error: -1
```

### Cause
Request timeout - took too long to get a response.

### Solution
1. **Check your internet connection**
2. **Increase timeout:**
   ```cpp
   http.setTimeout(15000);  // 15 seconds
   ```
3. **Try again** - might be temporary network issue

---

## 🚨 HTTP Error Code: -2

### Problem
```
Push error: -2
```

### Cause
Connection failed - couldn't reach ThingSpeak server.

### Solutions

**1. Check Internet Connection**
- Make sure your computer is online
- Try opening https://thingspeak.com in your browser

**2. Verify API Key**
```cpp
const char* myApiKey = "FXL4GV1FL2TNW2DW";  // Check this is correct
```
- Log in to ThingSpeak.com
- Go to your channel
- Copy the Write API Key
- Make sure it matches your code

**3. Check Board Selection**
- WiFi/HTTP only works on **ESP32-C3**
- Does NOT work on Arduino Uno/Mega/Nano
- Select ESP32-C3 from board dropdown

**4. CORS Issue**
- ThingSpeak usually allows CORS
- If blocked, try using a different API endpoint
- Or contact ThingSpeak support

---

## 🚨 WiFi Not Connecting

### Problem
```
Wifi not connected
Wifi not connected
Wifi not connected
...
```

### Cause
WiFi connection is stuck in connecting state.

### Solution
**In LeapForge, WiFi is simulated:**
- Any SSID/password will work
- Connection should happen instantly

**If stuck:**
1. **Check board selection** - Must be ESP32-C3
2. **Restart simulation** - Click Stop, then Play
3. **Check code** - Make sure you're using the fixed version

**The fixed code:**
```cpp
WiFi.begin(ssid, password);  // ✅ Correct

while (WiFi.status() != WL_CONNECTED) {
  delay(1000);
  Serial.print(".");
}
```

---

## 🚨 LED Not Working

### Problem
LED doesn't turn on/off based on temperature/humidity.

### Solutions

**1. Check Connection**
- LED Anode (+) → GPIO 13
- LED Cathode (-) → GND (through 220Ω resistor)

**2. Check LED Polarity**
- Long leg = Anode (+) → GPIO 13
- Short leg = Cathode (-) → GND

**3. Check Resistor**
- Use 220Ω to 1kΩ resistor
- Without resistor, LED may burn out

**4. Check GPIO Pin**
```cpp
const int LED_PIN = 13;  // Make sure this matches your connection
```

**5. Test LED Manually**
Add this to `setup()`:
```cpp
digitalWrite(LED_PIN, HIGH);
delay(2000);
digitalWrite(LED_PIN, LOW);
```
LED should blink once at startup.

---

## 🚨 DHT22 Not Reading

### Problem
Temperature and humidity always show 0 or default values.

### Solutions

**1. Check Sensor Connection**
- DHT22 VCC → 3.3V
- DHT22 GND → GND
- DHT22 DATA → GPIO 15

**2. Check GPIO Pin**
```cpp
const int DHT_PIN = 15;  // Make sure this matches your connection
```

**3. Check Sensor Type**
```cpp
dhtSensor.setup(DHT_PIN, DHTesp::DHT22);  // DHT22, not DHT11
```

**4. Add Sensor Component**
- In LeapForge, add DHT22 component to circuit
- Sensor values are simulated
- Adjust values in component UI

**5. Test Sensor Reading**
Add this to `loop()`:
```cpp
TempAndHumidity data = dhtSensor.getTempAndHumidity();
Serial.print("Raw temp: ");
Serial.println(data.temperature);
Serial.print("Raw humidity: ");
Serial.println(data.humidity);
```

---

## 🚨 Data Not Appearing on ThingSpeak

### Problem
Code runs without errors, but no data on ThingSpeak website.

### Solutions

**1. Check Channel Number**
```cpp
const int myChannelNumber = 3372736;  // Your channel number
```
- Log in to ThingSpeak.com
- Check your channel number
- Make sure it matches

**2. Check API Key**
```cpp
const char* myApiKey = "FXL4GV1FL2TNW2DW";  // Your Write API Key
```
- Go to your channel on ThingSpeak
- Click "API Keys" tab
- Copy the **Write API Key** (not Read API Key!)
- Make sure it matches

**3. Check Field Numbers**
```cpp
url += "&field1=";  // Temperature goes to Field 1
url += String(data.temperature, 2);
url += "&field2=";  // Humidity goes to Field 2
url += String(data.humidity, 1);
```
- Make sure your channel has Field 1 and Field 2 enabled
- Check field names match what you expect

**4. Wait for Update**
- Data updates every 20 seconds
- Refresh ThingSpeak page
- Check "Private View" tab on your channel

**5. Check HTTP Response**
Look at Serial Monitor:
```
Data pushed successfully! Entry ID: 12345  ✅ Working!
Push error: -2                              ❌ Not working
```

---

## 🚨 Compilation Errors

### Problem
Code won't compile, shows syntax errors.

### Solutions

**1. Use the Fixed File**
- Open `dht22_thingspeak.ino`
- This file is guaranteed to compile

**2. Check Board Selection**
- Select **ESP32-C3** from board dropdown
- Some libraries only work on ESP32

**3. Check Include Statements**
```cpp
#include <WiFi.h>        // ✅ Angle brackets
#include "DHTesp.h"      // ✅ Quotes
#include <HTTPClient.h>  // ✅ Angle brackets
```

**4. Check Variable Types**
```cpp
const char* ssid = "electra";           // ✅ const char*
const char* password = "electra123";    // ✅ const char*
const char* myApiKey = "FXL4GV1FL2TNW2DW";  // ✅ const char*
```

---

## 🚨 Simulation Won't Start

### Problem
Click Play but simulation doesn't start.

### Solutions

**1. Check Board Selection**
- Must be **ESP32-C3**
- WiFi/HTTP don't work on Arduino boards

**2. Check for Errors**
- Look at bottom panel for error messages
- Fix any compilation errors first

**3. Stop and Restart**
- Click Stop button
- Wait 2 seconds
- Click Play again

**4. Reload Page**
- Save your code
- Refresh the browser page
- Open code again and try

---

## 🚨 Serial Monitor Shows Nothing

### Problem
Simulation runs but Serial Monitor is blank.

### Solutions

**1. Check Serial Begin**
```cpp
void setup() {
  Serial.begin(115200);  // Must be in setup()
  // ...
}
```

**2. Check Baud Rate**
- Serial Monitor baud rate should match code
- Code uses 115200
- Check Serial Monitor settings

**3. Add Debug Output**
```cpp
void setup() {
  Serial.begin(115200);
  Serial.println("=== STARTING ===");  // Add this
  // ...
}
```

**4. Check Serial Tab**
- Make sure you're looking at the Serial tab
- Not the WiFi tab or other tabs

---

## 🚨 WiFi Tab Shows Nothing

### Problem
WiFi tab is empty, no connection events.

### Cause
WiFi events use special `__LF_WIFI:` prefix that gets parsed.

### Solution
**Check Serial Monitor instead:**
```cpp
Serial.println("WiFi connected!");
Serial.print("Local IP: ");
Serial.println(WiFi.localIP());
```

These messages appear in Serial Monitor, not WiFi tab.

**WiFi tab shows:**
- Connection status
- IP address
- Network info

**Serial Monitor shows:**
- Your custom messages
- Debug output
- Sensor readings

---

## 📋 Quick Diagnostic Checklist

Run through this checklist to diagnose issues:

- [ ] Board is set to **ESP32-C3** (not Arduino)
- [ ] File `dht22_thingspeak.ino` is open (fixed version)
- [ ] DHT22 sensor is connected to GPIO 15
- [ ] LED is connected to GPIO 13 (optional)
- [ ] WiFi credentials are correct: `ssid` and `password`
- [ ] ThingSpeak API key is correct
- [ ] ThingSpeak channel number is correct
- [ ] Delay is 20000ms (20 seconds)
- [ ] Internet connection is working
- [ ] Serial Monitor is open and visible
- [ ] No compilation errors

---

## 🔍 Debug Mode

Add this debug code to see exactly what's happening:

```cpp
void loop() {
  Serial.println("=== LOOP START ===");
  
  // Read sensor
  TempAndHumidity data = dhtSensor.getTempAndHumidity();
  Serial.print("Sensor read: ");
  Serial.print(data.temperature);
  Serial.print("°C, ");
  Serial.print(data.humidity);
  Serial.println("%");
  
  // Build URL
  String url = "https://api.thingspeak.com/update?api_key=";
  url += myApiKey;
  url += "&field1=";
  url += String(data.temperature, 2);
  url += "&field2=";
  url += String(data.humidity, 1);
  Serial.print("URL: ");
  Serial.println(url);
  
  // Send request
  HTTPClient http;
  Serial.println("Starting HTTP request...");
  http.begin(url);
  http.setTimeout(10000);
  
  Serial.println("Sending GET request...");
  int httpCode = http.GET();
  Serial.print("HTTP response code: ");
  Serial.println(httpCode);
  
  if (httpCode == 200) {
    String response = http.getString();
    Serial.print("Response: ");
    Serial.println(response);
  }
  
  http.end();
  Serial.println("=== LOOP END ===");
  Serial.println();
  
  delay(20000);
}
```

This will show you exactly where the problem is.

---

## 📞 Still Having Issues?

### Check These Files:
1. **`THINGSPEAK_READY.md`** - Quick start guide
2. **`HOW_TO_USE_THINGSPEAK.md`** - Complete documentation
3. **`BEFORE_AFTER_COMPARISON.md`** - See what changed
4. **`WIFI_INTERNET_GUIDE.md`** - WiFi documentation

### Common Mistakes:
1. Using Arduino board instead of ESP32-C3
2. Using old code instead of `dht22_thingspeak.ino`
3. Wrong API key or channel number
4. Update frequency too fast (< 15 seconds)
5. No internet connection

### Test with Simple Code:
Try `test_wifi_example.ino` first to verify WiFi works, then try ThingSpeak.

---

## ✅ Success Indicators

You'll know it's working when you see:

**Serial Monitor:**
```
WiFi connected!
Local IP: 192.168.1.100
Temp: 25.50°C
Humidity: 60.0%
Sending to ThingSpeak: https://api.thingspeak.com/update?...
Data pushed successfully! Entry ID: 12345
---
```

**ThingSpeak Website:**
- Go to https://thingspeak.com
- Open your channel
- See data updating every 20 seconds
- Charts show temperature and humidity

**That's it - you're successfully sending data to ThingSpeak!** 🎉

---

**Need more help?** Read the full documentation in `HOW_TO_USE_THINGSPEAK.md`
