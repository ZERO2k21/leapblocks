# Electra Error Display - Testing Guide

## How to Test the Serial Monitor Error Display Feature

### Test 1: Syntax Error
**Code to test:**
```cpp
void setup() {
  Serial.begin(9600)  // Missing semicolon
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
}
```

**Expected Result:**
```
❌ COMPILATION ERROR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
sketch.ino:2:22: error: expected ';' before 'pinMode'
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please fix the errors and try again.
```

### Test 2: Undefined Variable
**Code to test:**
```cpp
void setup() {
  Serial.begin(9600);
  pinMode(ledPin, OUTPUT);  // ledPin not defined
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
}
```

**Expected Result:**
```
❌ COMPILATION ERROR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
sketch.ino:3:10: error: 'ledPin' was not declared in this scope
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please fix the errors and try again.
```

### Test 3: Typo in Function Name
**Code to test:**
```cpp
void setup() {
  Serial.begin(9600);
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrit(13, HIGH);  // Typo: should be digitalWrite
  delay(1000);
}
```

**Expected Result:**
```
❌ COMPILATION ERROR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
sketch.ino:7:3: error: 'digitalWrit' was not declared in this scope
   digitalWrit(13, HIGH);
   ^~~~~~~~~~~
Did you mean 'digitalWrite'?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please fix the errors and try again.
```

### Test 4: Missing Library (Arduino Uno)
**Code to test:**
```cpp
#include <NonExistentLibrary.h>

void setup() {
  Serial.begin(9600);
}

void loop() {
  delay(1000);
}
```

**Expected Result:**
```
❌ COMPILATION ERROR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
sketch.ino:1:10: fatal error: NonExistentLibrary.h: No such file or directory
 #include <NonExistentLibrary.h>
          ^~~~~~~~~~~~~~~~~~~~~~
compilation terminated.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please fix the errors and try again.
```

### Test 5: ESP32-C3 Transpilation Error
**Board:** ESP32-C3  
**Code to test:**
```cpp
void setup() {
  Serial.begin(9600);
  pinMode(2, OUTPUT);
}

void loop() {
  digitalWrite(2, HIGH);
  delay(1000)  // Missing semicolon
}
```

**Expected Result:**
```
❌ TRANSPILATION ERROR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Transpilation error details]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please fix the errors and try again.
```

### Test 6: Valid Code (Should Compile Successfully)
**Code to test:**
```cpp
void setup() {
  Serial.begin(9600);
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  Serial.println("LED ON");
  delay(1000);
  digitalWrite(13, LOW);
  Serial.println("LED OFF");
  delay(1000);
}
```

**Expected Result:**
- No error messages in Serial Monitor
- Simulation starts successfully
- Serial output shows "LED ON" and "LED OFF" messages

## Testing Steps

1. **Open Electra Module**
   - Click on "Electra" card from landing page
   - Select board (Arduino Uno or ESP32-C3)

2. **Navigate to Sketch Tab**
   - Click on "SKETCH" tab in the editor pane

3. **Paste Test Code**
   - Copy one of the test codes above
   - Paste into the Monaco editor

4. **Click Run Simulation**
   - Click the Play button (▶) in the canvas pane
   - Wait for compilation to complete

5. **Check Serial Monitor**
   - Click on "SERIAL OUTPUT" tab
   - Verify error message appears with proper formatting
   - Verify error message is readable and helpful

6. **Fix the Error**
   - Correct the error in the code
   - Click Run Simulation again
   - Verify simulation starts successfully

## Success Criteria

✅ Error messages appear in Serial Monitor (not just console)  
✅ Error messages are formatted with clear visual separators  
✅ Error messages include helpful instructions  
✅ All error types are handled (syntax, undefined, library, transpilation)  
✅ Valid code compiles and runs without errors  
✅ User can copy error text from Serial Monitor  
✅ Error display works for both Arduino Uno and ESP32-C3  

## Notes

- Errors are displayed in the **SERIAL OUTPUT** tab, not the WiFi LOG tab
- The Serial Monitor automatically switches to the SERIAL OUTPUT tab when errors occur
- Error messages persist until the next compilation attempt
- Users can clear the Serial Monitor using the CLEAR button

---
**Module:** Electra  
**Feature:** Serial Monitor Error Display  
**Status:** Ready for Testing  
**Date:** 2026-05-08
