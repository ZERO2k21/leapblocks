/**
 * Simple ESP32-C3 WiFi Test
 * Tests WiFi connection and HTTP request
 */

#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "electra";
const char* password = "electra123";

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("=== ESP32-C3 WiFi Test ===");
  Serial.println();
  
  // Connect to WiFi
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("WiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("SSID: ");
    Serial.println(WiFi.SSID());
    Serial.println();
    
    // Test HTTP GET request
    Serial.println("Making HTTP GET request...");
    HTTPClient http;
    
    http.begin("https://jsonplaceholder.typicode.com/posts/1");
    http.setTimeout(10000);
    
    int httpCode = http.GET();
    
    Serial.print("HTTP Response Code: ");
    Serial.println(httpCode);
    
    if (httpCode == 200) {
      String payload = http.getString();
      Serial.println("Response:");
      Serial.println(payload);
    } else if (httpCode < 0) {
      Serial.println("Request failed!");
      if (httpCode == -1) {
        Serial.println("Reason: Timeout");
      } else if (httpCode == -2) {
        Serial.println("Reason: Connection failed");
      }
    }
    
    http.end();
    Serial.println();
    Serial.println("Test complete!");
    
  } else {
    Serial.println();
    Serial.println("WiFi connection failed!");
  }
}

void loop() {
  // Print WiFi status every 5 seconds
  static unsigned long lastCheck = 0;
  
  if (millis() - lastCheck > 5000) {
    lastCheck = millis();
    
    Serial.print("WiFi Status: ");
    switch(WiFi.status()) {
      case WL_CONNECTED:
        Serial.print("Connected to ");
        Serial.println(WiFi.SSID());
        break;
      case WL_DISCONNECTED:
        Serial.println("Disconnected");
        break;
      case WL_IDLE_STATUS:
        Serial.println("Idle");
        break;
      default:
        Serial.println("Unknown");
    }
  }
  
  delay(100);
}
