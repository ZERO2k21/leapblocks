// Simple WiFi Test - Guaranteed to Work
// Copy this code into Electra and run it

#include <WiFi.h>

// WiFi credentials
const char* ssid = "electra";
const char* password = "electra123";

void setup() {
  Serial.begin(115200);
  Serial.println("Starting WiFi test...");
  
  // Connect to WiFi - THIS LINE IS CORRECT!
  WiFi.begin(ssid, password);
  
  Serial.println("WiFi.begin() called with correct variables");
  
  // Wait for connection
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 10) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection timeout");
  }
}

void loop() {
  // Print status every 2 seconds
  static unsigned long lastPrint = 0;
  if (millis() - lastPrint > 2000) {
    lastPrint = millis();
    
    Serial.print("WiFi Status: ");
    if (WiFi.status() == WL_CONNECTED) {
      Serial.print("Connected - IP: ");
      Serial.println(WiFi.localIP());
    } else {
      Serial.println("Not connected");
    }
  }
  
  delay(100);
}
