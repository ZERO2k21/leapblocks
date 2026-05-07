/**
 * ESP32-C3 WiFi Test Sketch
 * 
 * This sketch demonstrates WiFi functionality in Leapforge.
 * It will trigger WiFi events that should appear in the WiFi tab.
 */

#include <WiFi.h>

const char* ssid = "TestNetwork";
const char* password = "password123";

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("ESP32-C3 WiFi Test Starting...");
  Serial.println("Attempting to connect to WiFi...");
  
  // Begin WiFi connection
  // This will trigger __LF_WIFI events injected by ArduinoUploader
  WiFi.begin(ssid, password);
  
  Serial.println("WiFi.begin() called");
  Serial.println("Check the WiFi tab for connection events!");
}

void loop() {
  // Print WiFi status every 2 seconds
  static unsigned long lastPrint = 0;
  if (millis() - lastPrint > 2000) {
    lastPrint = millis();
    
    Serial.print("WiFi Status: ");
    switch(WiFi.status()) {
      case WL_CONNECTED:
        Serial.println("Connected");
        Serial.print("IP Address: ");
        Serial.println(WiFi.localIP());
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
        Serial.println("Unknown");
    }
  }
  
  delay(100);
}
