// LeapBlocks - Arduino Code

float _readUltrasonicDistance(int trigPin, int echoPin) {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  digitalWrite(trigPin, LOW);
  delayMicroseconds(4);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseInLong(echoPin, HIGH, 38000UL); // interrupt-safe, 38ms timeout
  if (duration == 0) return 0.0; // no echo / out of range
  return (float)duration / 58.2; // convert microseconds to cm
}
double my_variable = 0;
double distance = 0;

void setup() {
  Serial.begin(9600);
  Serial.begin(9600);
  while (true) {
    my_variable = _readUltrasonicDistance(2, 2);
    Serial.println(distance);
    delay(1);
  }
}


void loop() {
  // main loop
}
