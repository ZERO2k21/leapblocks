// LeapBlocks - Arduino Code

void setup() {
  pinMode(2, OUTPUT);
  while (true) {
    digitalWrite(2, HIGH);
    delay(1000);
    digitalWrite(2, LOW);
    delay(1000);
    delay(1);
  }
}


void loop() {
  // main loop
}
