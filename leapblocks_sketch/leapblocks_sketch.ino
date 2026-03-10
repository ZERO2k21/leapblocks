// LeapBlocks - Arduino Code

void setup() {
  pinMode(8, OUTPUT);
  while (true) {
    digitalWrite(8, HIGH);
    delay(1000);
    digitalWrite(8, LOW);
    delay(1000);
    delay(1);
  }
}


void loop() {
  // main loop
}
