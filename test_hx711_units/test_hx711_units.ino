#include "HX711.h"

HX711 scale;
float calibration_factor = -1000;

void setup() {
  Serial.begin(9600);
  scale.begin(2, 3);
  scale.set_scale(calibration_factor);
}

void loop() {
  float weight = scale.get_units(10);
  Serial.print("Weight: ");
  Serial.print(weight);
  Serial.println(" g");
  delay(1000);
}
