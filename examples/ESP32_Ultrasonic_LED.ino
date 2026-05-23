/**
 * ESP32 Ultrasonic Distance Sensor with LED Indicator
 * 
 * This example uses an HC-SR04 ultrasonic sensor to measure distance
 * and controls an LED brightness based on the distance.
 * Closer objects = brighter LED.
 * 
 * Hardware:
 * - ESP32-C3 board
 * - HC-SR04 ultrasonic sensor
 * - LED connected to pin 2
 * 
 * Circuit:
 * - HC-SR04 TRIG → GPIO 12
 * - HC-SR04 ECHO → GPIO 13
 * - HC-SR04 VCC → 5V
 * - HC-SR04 GND → GND
 * - LED Anode (+) → GPIO 2
 * - LED Cathode (-) → GND (with 220Ω resistor)
 */

#include <NewPing.h>

#define TRIGGER_PIN 12
#define ECHO_PIN 13
#define MAX_DISTANCE 200  // Maximum distance in cm
#define LED_PIN 2

NewPing sonar(TRIGGER_PIN, ECHO_PIN, MAX_DISTANCE);

void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 Ultrasonic Distance Sensor Example");
  
  pinMode(LED_PIN, OUTPUT);
  
  Serial.println("Sensor ready. Move your hand closer/farther to see LED change.");
}

void loop() {
  // Measure distance
  delay(50);  // Wait 50ms between pings
  int distance = sonar.ping_cm();
  
  // Print distance to Serial Monitor
  Serial.print("Distance: ");
  if (distance == 0) {
    Serial.println("Out of range");
    analogWrite(LED_PIN, 0);  // Turn off LED
  } else {
    Serial.print(distance);
    Serial.println(" cm");
    
    // Map distance to LED brightness
    // 0-50cm range: closer = brighter
    int brightness = map(distance, 0, 50, 255, 0);
    brightness = constrain(brightness, 0, 255);
    
    analogWrite(LED_PIN, brightness);
    
    Serial.print("LED Brightness: ");
    Serial.print(brightness);
    Serial.println("/255");
  }
  
  // Visual indicator in Serial Monitor
  int bars = map(distance, 0, 50, 20, 0);
  bars = constrain(bars, 0, 20);
  Serial.print("[");
  for(int i=0; i<20; i++) {
    if(i < bars) Serial.print("=");
    else Serial.print(" ");
  }
  Serial.println("]");
  Serial.println();
}
