# 🔧 Fix "WIFI_NAME is not defined" Error

## ❌ The Problem

You're seeing this error:
```
[ERROR in setup()]: WIFI_NAME is not defined
```

**This means you're running the OLD CODE with the error, not the fixed version!**

---

## ✅ The Solution (3 Steps)

### Step 1: Stop the Current Simulation
Click the **Stop** button in Electra

### Step 2: Open the Correct File
You have **3 options** - choose one:

#### Option A: ThingSpeak + DHT22 (Full Project)
**File**: `dht22_thingspeak.ino`
- Complete ThingSpeak integration
- Sends temperature/humidity to cloud
- Includes LED control

#### Option B: Simple WiFi Test (Recommended First)
**File**: `wifi_test_simple.ino`
- Just tests WiFi connection
- Prints IP address
- Verifies WiFi works

#### Option C: Basic WiFi Example
**File**: `test_wifi_example.ino`
- Another simple WiFi test
- Shows connection status

### Step 3: Run the Correct Code
1. Make sure the correct file is open in Electra editor
2. Select **ESP32-C3** board (not Arduino!)
3. Click **Play** ▶️

---

## 🔍 How to Check You Have the Right Code

### ✅ CORRECT Code (Should See This)
```cpp
const char* ssid = "electra";
const char* password = "electra123";

void setup() {
  WiFi.begin(ssid, password);  // ✅ Uses ssid and password
}
```

### ❌ WRONG Code (If You See This, Wrong File!)
```cpp
const char* ssid = "electra";
const char* password = "electra123";

void setup() {
  WiFi.begin(WIFI_NAME, WIFI_PASSWORD);  // ❌ Uses WIFI_NAME
}
```

---

## 📋 Quick Checklist

Before clicking Play:
- [ ] Correct file is open (`dht22_thingspeak.ino` or `wifi_test_simple.ino`)
- [ ] Code shows `WiFi.begin(ssid, password)` (NOT `WIFI_NAME`)
- [ ] Board is set to **ESP32-C3**
- [ ] Old simulation is stopped

---

## 🎯 Recommended: Start with Simple Test

**Try this first:**

1. **Open**: `wifi_test_simple.ino`
2. **Verify** the code shows:
   ```cpp
   WiFi.begin(ssid, password);  // ✅ Correct!
   ```
3. **Select**: ESP32-C3 board
4. **Click**: Play ▶️

**Expected output:**
```
Starting WiFi test...
WiFi.begin() called with correct variables
..........
WiFi connected!
IP Address: 192.168.1.100
WiFi Status: Connected - IP: 192.168.1.100
```

Once this works, then try `dht22_thingspeak.ino`

---

## 🐛 Still Getting the Error?

### Check 1: Which File is Actually Open?
Look at the **file name** in the Electra editor tab. Is it:
- ✅ `dht22_thingspeak.ino` - Good!
- ✅ `wifi_test_simple.ino` - Good!
- ❌ Something else - Wrong file!

### Check 2: What Does Line 27 Say?
Find the line that says `WiFi.begin(...)` in your code.

Does it say:
- ✅ `WiFi.begin(ssid, password);` - Correct!
- ❌ `WiFi.begin(WIFI_NAME, WIFI_PASSWORD);` - Wrong file!

### Check 3: Did You Save After Opening?
Some editors need you to:
1. Open the file
2. Make sure it's loaded
3. Click Play

---

## 💡 Understanding the Error

### What Happened
Your **original code** had this:
```cpp
// Line 13-14: You defined these
const char* ssid = "electra";
const char* password = "electra123";

// Line 27: But used these (which don't exist!)
WiFi.begin(WIFI_NAME, WIFI_PASSWORD);  // ❌ ERROR!
```

The variables `WIFI_NAME` and `WIFI_PASSWORD` were **never defined**, so you get:
```
ReferenceError: WIFI_NAME is not defined
```

### The Fix
The **fixed code** uses the correct variable names:
```cpp
// Line 13-14: Define these
const char* ssid = "electra";
const char* password = "electra123";

// Line 32: Use the same names!
WiFi.begin(ssid, password);  // ✅ CORRECT!
```

---

## 📁 File Locations

All files are in the root directory:
```
d:\leapblocks\
  ├── dht22_thingspeak.ino          ← Full ThingSpeak project
  ├── wifi_test_simple.ino          ← Simple WiFi test (NEW!)
  ├── test_wifi_example.ino         ← Another WiFi test
  └── test_http_example.ino         ← HTTP examples
```

---

## 🚀 Quick Start (Copy-Paste This)

**If you just want it to work RIGHT NOW:**

1. **Stop** the current simulation
2. **Open** file: `wifi_test_simple.ino`
3. **Select** board: ESP32-C3
4. **Click** Play ▶️

**You should see:**
```
Starting WiFi test...
WiFi.begin() called with correct variables
..........
WiFi connected!
IP Address: 192.168.1.100
```

**If this works**, then open `dht22_thingspeak.ino` and run that!

---

## ❓ FAQ

### Q: I opened the file but still get the error
**A**: Make sure the file is actually **loaded** in the editor. Check the code in the editor window - does it show `WiFi.begin(ssid, password)` or `WiFi.begin(WIFI_NAME, WIFI_PASSWORD)`?

### Q: How do I know which file is running?
**A**: Look at the **editor tab** at the top. The file name should be visible.

### Q: Can I just fix my current code?
**A**: Yes! Find the line that says:
```cpp
WiFi.begin(WIFI_NAME, WIFI_PASSWORD);
```
And change it to:
```cpp
WiFi.begin(ssid, password);
```

### Q: Why does the error mention line numbers?
**A**: The transpiler converts your C++ code to JavaScript. The error happens in the JavaScript version, so line numbers might be different.

---

## ✅ Success Indicators

You'll know it's working when you see:

**Serial Monitor:**
```
Starting WiFi test...
WiFi.begin() called with correct variables
..........
WiFi connected!
IP Address: 192.168.1.100
WiFi Status: Connected - IP: 192.168.1.100
```

**No errors!** ✨

---

## 📞 Next Steps

Once `wifi_test_simple.ino` works:

1. ✅ WiFi is working!
2. Open `dht22_thingspeak.ino`
3. Add DHT22 sensor to GPIO 15
4. Run it
5. Check ThingSpeak.com for data!

---

**The fix is simple: Open the correct file!** 🎯

All the fixed code is ready - you just need to load it in Electra.
