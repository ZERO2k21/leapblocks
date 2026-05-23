/**
 * ESP32 Servo Example
 * 
 * This example demonstrates how to control a servo motor with ESP32.
 * The servo will sweep from 0 to 180 degrees and back.
 * 
 * Hardware:
 * - ESP32-C3 board
 * - Servo motor connected to pin 9
 * 
 * Circuit:
 * - Servo Signal (Orange) → GPIO 9
 * - Servo VCC (Red) → 5V
 * - Servo GND (Brown) → GND
 */

#include <Servo.h>

Servo myServo;  // Create servo object
int servoPin = 9;

void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 Servo Example");
  
  myServo.attach(servoPin);  // Attach servo to pin 9
  Serial.println("Servo attached to pin 9");
}

void loop() {
  // Sweep from 0 to 180 degrees
  for (int angle = 0; angle <= 180; angle++) {
    myServo.write(angle);
    Serial.print("Angle: ");
    Serial.println(angle);
    delay(15);
  }
  
  delay(500);
  
  // Sweep from 180 to 0 degrees
  for (int angle = 180; angle >= 0; angle--) {
    myServo.write(angle);
    Serial.print("Angle: ");
    Serial.println(angle);
    delay(15);
  }
  
  delay(500);
}
