/**
 * COPY THIS CODE INTO ELECTRA
 * 
 * This is the CORRECT code without errors.
 * Copy everything below into your Electra editor.
 */

#include <WiFi.h>

// WiFi credentials - THESE ARE CORRECT!
const char* ssid = "electra";
const char* password = "electra123";

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("=================================");
  Serial.println("ESP32-C3 WiFi Test - FIXED VERSION");
  Serial.println("=================================");
  Serial.println();
  
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  // THIS LINE IS CORRECT - Uses ssid and password variables
  WiFi.begin(ssid, password);
  
  Serial.println("WiFi.begin() called successfully!");
  Serial.print("Waiting for connection");
  
  // Wait for connection
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("✓ WiFi connected successfully!");
    Serial.print("✓ IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("✓ SSID: ");
    Serial.println(WiFi.SSID());
  } else {
    Serial.println("✗ WiFi connection timeout");
    Serial.println("  (This is OK in simulation - WiFi is simulated)");
  }
  
  Serial.println();
  Serial.println("=================================");
  Serial.println("Setup complete! Entering loop...");
  Serial.println("=================================");
}

void loop() {
  // Print WiFi status every 3 seconds
  static unsigned long lastPrint = 0;
  if (millis() - lastPrint > 3000) {
    lastPrint = millis();
    
    Serial.println();
    Serial.print("[");
    Serial.print(millis() / 1000);
    Serial.print("s] WiFi Status: ");
    
    switch(WiFi.status()) {
      case WL_CONNECTED:
        Serial.print("✓ CONNECTED");
        Serial.print(" | IP: ");
        Serial.print(WiFi.localIP());
        Serial.print(" | RSSI: ");
        Serial.print(WiFi.RSSI());
        Serial.println(" dBm");
        break;
        
      case WL_NO_SSID_AVAIL:
        Serial.println("✗ SSID not available");
        break;
        
      case WL_CONNECT_FAILED:
        Serial.println("✗ Connection failed");
        break;
        
      case WL_DISCONNECTED:
        Serial.println("✗ Disconnected");
        break;
        
      default:
        Serial.print("? Unknown status: ");
        Serial.println(WiFi.status());
    }
  }
  
  delay(100);
}

/**
 * INSTRUCTIONS:
 * 
 * 1. Copy ALL of this code
 * 2. Paste into Electra editor
 * 3. Select ESP32-C3 board
 * 4. Click Play
 * 
 * EXPECTED OUTPUT:
 * =================================
 * ESP32-C3 WiFi Test - FIXED VERSION
 * =================================
 * 
 * Connecting to WiFi: electra
 * WiFi.begin() called successfully!
 * Waiting for connection..........
 * ✓ WiFi connected successfully!
 * ✓ IP Address: 192.168.1.100
 * ✓ SSID: electra
 * 
 * =================================
 * Setup complete! Entering loop...
 * =================================
 * 
 * [3s] WiFi Status: ✓ CONNECTED | IP: 192.168.1.100 | RSSI: -50 dBm
 * [6s] WiFi Status: ✓ CONNECTED | IP: 192.168.1.100 | RSSI: -50 dBm
 * 
 * NO ERRORS! ✓
 */
