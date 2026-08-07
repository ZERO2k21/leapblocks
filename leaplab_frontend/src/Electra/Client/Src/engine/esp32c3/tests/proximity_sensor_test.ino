// Proximity Sensor Test Program
// Connect: OUT → D2, VCC → 5V, GND → GND

const int OUT_PIN = 2;  // Digital output (active LOW)

void setup() {
  Serial.begin(9600);
  pinMode(OUT_PIN, INPUT);
  Serial.println("=== Proximity Sensor Test ===");
  Serial.println("Click the PROXIMITY SENSOR node to toggle object detection.");
  Serial.println("OUT = Digital (LOW = object detected)");
  Serial.println("---");
}

void loop() {
  // Read digital value (LOW = object detected)
  int digitalState = digitalRead(OUT_PIN);

  // Print values
  Serial.print("OUT Pin: ");
  Serial.print(digitalState == LOW ? "LOW" : "HIGH");
  Serial.print(" | Status: ");
  Serial.println(digitalState == LOW ? "OBJECT DETECTED!" : "No object");

  // Alert on detection
  if (digitalState == LOW) {
    Serial.println(">> PROXIMITY ALERT!");
  }

  delay(300);
}
