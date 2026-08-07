// Rain Sensor Test Program
// Connect: AO → A0, DO → D2, VCC → 5V, GND → GND

const int AO_PIN = A0;   // Analog output
const int DO_PIN = 2;    // Digital output (active LOW)
const int THRESHOLD = 50; // Rain detection threshold (%)

void setup() {
  Serial.begin(9600);
  pinMode(DO_PIN, INPUT);
  Serial.println("=== Rain Sensor Test ===");
  Serial.println("Move the RAIN slider to simulate rain.");
  Serial.println("AO = Analog rain level, DO = Digital (LOW = rain detected)");
  Serial.println("---");
}

void loop() {
  // Read analog value (0-1023 maps to 0-100%)
  int rawADC = analogRead(AO_PIN);
  int rainPercent = map(rawADC, 0, 1023, 0, 100);

  // Read digital value (LOW = rain detected)
  int digitalState = digitalRead(DO_PIN);

  // Print values
  Serial.print("ADC: ");
  Serial.print(rawADC);
  Serial.print(" | Rain: ");
  Serial.print(rainPercent);
  Serial.print("% | DO: ");
  Serial.print(digitalState == LOW ? "RAIN" : "DRY");
  Serial.print(" | Voltage: ");
  Serial.print((rawADC * 5.0) / 1023.0);
  Serial.println("V");

  // LED alert simulation
  if (digitalState == LOW) {
    Serial.println(">> RAIN DETECTED!");
  }

  delay(500);
}
