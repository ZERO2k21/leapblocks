# ThingSpeak DHT22 Example - Fixed for LeapForge

## 🐛 Problems in Original Code

### Problem 1: Wrong Variable Names
```cpp
// Lines 13-14: You defined these
const char* ssid = "electra";
const char* password = "electra123";

// Line 27: But used these (which don't exist!)
WiFi.begin(WIFI_NAME, WIFI_PASSWORD);  // ❌ ERROR!
```

**Error**: `ReferenceError: WIFI_NAME is not defined`

### Problem 2: ThingSpeak Library Not Available
```cpp
#include "ThingSpeak.h"  // ❌ Not available in LeapForge
ThingSpeak.begin(client);
ThingSpeak.setField(1, data.temperature);
ThingSpeak.writeFields(...);
```

**Solution**: Use HTTPClient to make direct API calls to ThingSpeak

---

## ✅ Fixed Version

### Key Changes

1. **Fixed WiFi credentials**
   ```cpp
   WiFi.begin(ssid, password);  // ✅ Correct
   ```

2. **Replaced ThingSpeak library with HTTPClient**
   ```cpp
   #include <HTTPClient.h>
   
   HTTPClient http;
   String url = "https://api.thingspeak.com/update?api_key=" + 
                String(myApiKey) + 
                "&field1=" + String(data.temperature, 2) +
                "&field2=" + String(data.humidity, 1);
   
   http.begin(url);
   int httpCode = http.GET();
   ```

3. **Increased delay to 20 seconds**
   - ThingSpeak free tier requires minimum 15 seconds between updates
   - Changed from 10 seconds to 20 seconds for safety

---

## 📝 How to Use

### Step 1: Load the Fixed Code
Open `dht22_thingspeak.ino` in LeapForge

### Step 2: Update Your ThingSpeak Credentials (if needed)
```cpp
const int myChannelNumber = 3372736;           // Your channel number
const char* myApiKey = "FXL4GV1FL2TNW2DW";    // Your Write API Key
```

### Step 3: Add DHT22 Sensor to Circuit
1. Add DHT22 sensor component
2. Connect:
   - DHT22 VCC → 3.3V
   - DHT22 GND → GND
   - DHT22 DATA → GPIO 15

### Step 4: Add LED (Optional)
1. Add LED component
2. Connect:
   - LED Anode → GPIO 13
   - LED Cathode → GND (through resistor)

### Step 5: Run Simulation
1. Select **ESP32-C3** board
2. Click **Play** ▶️
3. Watch Serial Monitor for output

---

## 📊 Expected Output

```
Connecting to WiFi...
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

---

## 🔧 ThingSpeak API Details

### Update URL Format
```
https://api.thingspeak.com/update?api_key=YOUR_API_KEY&field1=VALUE1&field2=VALUE2
```

### Response Codes
- **200**: Success - Returns entry ID number
- **0**: Update failed (too frequent updates)
- **-1**: Timeout
- **-2**: Connection failed

### Rate Limits
- **Free tier**: 15 second minimum between updates
- **Licensed**: 1 second minimum between updates

---

## 🎯 LED Behavior

The LED turns ON when:
- Temperature > 35°C **OR**
- Temperature < 12°C **OR**
- Humidity > 70% **OR**
- Humidity < 40%

Otherwise, LED is OFF.

---

## ⚠️ Important Notes

### 1. ThingSpeak Library Not Needed
LeapForge doesn't have the ThingSpeak library, but you don't need it! The HTTPClient approach works perfectly and gives you more control.

### 2. CORS May Block Requests
ThingSpeak API should work, but if you get CORS errors:
- The simulation is browser-based
- Some APIs block cross-origin requests
- ThingSpeak generally allows CORS

### 3. Real Data Will Be Sent
When you run this simulation:
- ✅ WiFi connection is simulated
- ✅ HTTP requests are REAL
- ✅ Data WILL be sent to your ThingSpeak channel
- ✅ You'll see real updates on ThingSpeak.com

### 4. DHT22 Sensor is Simulated
- Temperature: Returns simulated value (~25°C)
- Humidity: Returns simulated value (~50%)
- Values may vary slightly in simulation

---

## 🔍 Troubleshooting

### Error: "WIFI_NAME is not defined"
**Fix**: Change `WiFi.begin(WIFI_NAME, WIFI_PASSWORD)` to `WiFi.begin(ssid, password)`

### Error: "ThingSpeak.h: No such file"
**Fix**: Use the fixed version with HTTPClient instead

### HTTP Error Code 0
**Cause**: Updating too frequently (< 15 seconds)
**Fix**: Increase delay to 20000ms (20 seconds)

### HTTP Error Code -2
**Cause**: Connection failed or CORS blocked
**Fix**: Check your internet connection and ThingSpeak API key

### LED Not Working
**Fix**: Make sure LED is connected to GPIO 13 with proper resistor

---

## 📚 Complete Working Code

See `dht22_thingspeak.ino` for the complete fixed version.

---

## ✅ Summary of Fixes

| Issue | Original | Fixed |
|-------|----------|-------|
| WiFi credentials | `WIFI_NAME`, `WIFI_PASSWORD` | `ssid`, `password` |
| ThingSpeak library | `#include "ThingSpeak.h"` | `#include <HTTPClient.h>` |
| Data sending | `ThingSpeak.writeFields()` | `http.GET(url)` |
| Update interval | 10 seconds | 20 seconds |

---

**Your code is now ready to run! Load `dht22_thingspeak.ino` and start sending data to ThingSpeak!** 🚀
