/**
 * ESP32-C3 HTTP Request Example
 * 
 * This sketch demonstrates real internet connectivity in Electra.
 * The simulated ESP32 will make actual HTTP requests using your computer's network.
 */

#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "TestNetwork";
const char* password = "password123";

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("ESP32-C3 HTTP Test Starting...");
  Serial.println("Connecting to WiFi...");
  
  WiFi.begin(ssid, password);
  
  // Wait for connection
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    
    // Make a real HTTP GET request
    Serial.println("\n--- Making HTTP GET Request ---");
    makeHttpGetRequest();
    
    // Make a real HTTP POST request
    Serial.println("\n--- Making HTTP POST Request ---");
    makeHttpPostRequest();
  } else {
    Serial.println("\nWiFi Connection Failed!");
  }
}

void makeHttpGetRequest() {
  HTTPClient http;
  
  // Test with a public API (JSONPlaceholder - free fake API for testing)
  String url = "https://jsonplaceholder.typicode.com/posts/1";
  
  Serial.print("Requesting: ");
  Serial.println(url);
  
  http.begin(url);
  http.setTimeout(10000); // 10 second timeout
  
  int httpCode = http.GET();
  
  if (httpCode > 0) {
    Serial.print("HTTP Response Code: ");
    Serial.println(httpCode);
    
    if (httpCode == 200) {
      String payload = http.getString();
      Serial.println("Response:");
      Serial.println(payload);
    }
  } else {
    Serial.print("HTTP Request Failed, error: ");
    Serial.println(httpCode);
  }
  
  http.end();
}

void makeHttpPostRequest() {
  HTTPClient http;
  
  String url = "https://jsonplaceholder.typicode.com/posts";
  
  Serial.print("Posting to: ");
  Serial.println(url);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);
  
  // Create JSON payload
  String jsonPayload = "{\"title\":\"ESP32 Test\",\"body\":\"Hello from Electra!\",\"userId\":1}";
  
  int httpCode = http.POST(jsonPayload);
  
  if (httpCode > 0) {
    Serial.print("HTTP Response Code: ");
    Serial.println(httpCode);
    
    if (httpCode == 201 || httpCode == 200) {
      String response = http.getString();
      Serial.println("Response:");
      Serial.println(response);
    }
  } else {
    Serial.print("HTTP Request Failed, error: ");
    Serial.println(httpCode);
  }
  
  http.end();
}

void loop() {
  // Make a request every 30 seconds
  static unsigned long lastRequest = 0;
  
  if (millis() - lastRequest > 30000) {
    lastRequest = millis();
    
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\n--- Periodic Request ---");
      
      HTTPClient http;
      http.begin("https://jsonplaceholder.typicode.com/users/1");
      
      int code = http.GET();
      if (code == 200) {
        Serial.println("User data:");
        Serial.println(http.getString());
      }
      
      http.end();
    }
  }
  
  delay(100);
}
