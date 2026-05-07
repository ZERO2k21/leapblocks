/**
 * ESP32 + DHT22 + ThingSpeak Example
 * Adapted for LeapForge from Wokwi
 * https://wokwi.com/arduino/projects/322410731508073042
 */

#include <WiFi.h>
#include "DHTesp.h"
#include <HTTPClient.h>

const int DHT_PIN = 15;
const int LED_PIN = 13;

// WiFi credentials
const char* ssid = "electra";
const char* password = "electra123";

// ThingSpeak settings
const int myChannelNumber = 3372736;
const char* myApiKey = "FXL4GV1FL2TNW2DW";

DHTesp dhtSensor;

void setup() {
  Serial.begin(115200);
  dhtSensor.setup(DHT_PIN, DHTesp::DHT22);
  pinMode(LED_PIN, OUTPUT);
  
  // Connect to WiFi
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);  // ← FIXED: Use ssid and password, not WIFI_NAME
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("Local IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  TempAndHumidity data = dhtSensor.getTempAndHumidity();
  
  // Control LED based on temperature and humidity
  if (data.temperature > 35 || data.temperature < 12 || 
      data.humidity > 70 || data.humidity < 40) {
    digitalWrite(LED_PIN, HIGH);
  } else {
    digitalWrite(LED_PIN, LOW);
  }
  
  // Display sensor data
  Serial.print("Temp: ");
  Serial.print(data.temperature, 2);
  Serial.println("°C");
  Serial.print("Humidity: ");
  Serial.print(data.humidity, 1);
  Serial.println("%");
  
  // Send data to ThingSpeak
  HTTPClient http;
  
  // Build ThingSpeak URL
  String url = "https://api.thingspeak.com/update?api_key=";
  url += myApiKey;
  url += "&field1=";
  url += String(data.temperature, 2);
  url += "&field2=";
  url += String(data.humidity, 1);
  
  Serial.print("Sending to ThingSpeak: ");
  Serial.println(url);
  
  http.begin(url);
  http.setTimeout(10000);
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String response = http.getString();
    Serial.print("Data pushed successfully! Entry ID: ");
    Serial.println(response);
  } else {
    Serial.print("Push error: ");
    Serial.println(httpCode);
  }
  
  http.end();
  Serial.println("---");
  
  delay(20000);  // ThingSpeak free tier: 15 second minimum between updates
}
