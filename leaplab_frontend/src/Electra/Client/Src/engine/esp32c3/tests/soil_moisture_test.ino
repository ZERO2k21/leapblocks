// Soil Moisture Sensor Test Program
// Connect: AO → A0, DO → D2, VCC → 5V, GND → GND

const int AO_PIN = A0;   // Analog output
const int DO_PIN = 2;    // Digital output (active LOW)
const int THRESHOLD = 50; // Moisture detection threshold (%)

void setup() {
  Serial.begin(9600);
  pinMode(DO_PIN, INPUT);
  Serial.println("=== Soil Moisture Sensor Test ===");
  Serial.println("Move the MOISTURE slider to simulate soil moisture.");
  Serial.println("AO = Analog moisture level, DO = Digital (LOW = soil wet)");
  Serial.println("---");
}

void loop() {
  // Read analog value (0-1023 maps to 0-100%)
  int rawADC = analogRead(AO_PIN);
  int moisturePercent = map(rawADC, 0, 1023, 0, 100);

  // Read digital value (LOW = wet soil detected)
  int digitalState = digitalRead(DO_PIN);

  // Print values
  Serial.print("ADC: ");
  Serial.print(rawADC);
  Serial.print(" | Moisture: ");
  Serial.print(moisturePercent);
  Serial.print("% | DO: ");
  Serial.print(digitalState == LOW ? "WET" : "DRY");
  Serial.print(" | Voltage: ");
  Serial.print((rawADC * 5.0) / 1023.0);
  Serial.println("V");

  // Soil wet alert
  if (digitalState == LOW) {
    Serial.println(">> SOIL IS WET!");
  } else {
    Serial.println(">> SOIL IS DRY - Water needed!");
  }

  delay(500);
}
