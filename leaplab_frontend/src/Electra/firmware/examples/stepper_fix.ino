#include <Stepper.h>

const int stepsPerRevolution = 2048;

// Standard pin order for ULN2003 driver: IN1, IN2, IN3, IN4
// Connect: Pin8->IN1, Pin9->IN2, Pin10->IN3, Pin11->IN4
Stepper myStepper(stepsPerRevolution, 8, 9, 10, 11);

void setup() {
  Serial.begin(9600);
  myStepper.setSpeed(10);
}

void loop() {
  Serial.println("Clockwise");
  myStepper.step(stepsPerRevolution);
  Serial.println("Clockwise done");

  delay(500);

  Serial.println("Counterclockwise");
  myStepper.step(-stepsPerRevolution);
  Serial.println("Counterclockwise done");

  delay(500);
}
