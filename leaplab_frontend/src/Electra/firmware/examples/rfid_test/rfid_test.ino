/**
 * RFID RC522 Test Sketch for Electra Simulation
 * 
 * Connections (Arduino Uno):
 *   RC522 SDA  -> D10
 *   RC522 SCK  -> D13
 *   RC522 MOSI -> D11
 *   RC522 MISO -> D12
 *   RC522 RST  -> D9
 *   RC522 VCC  -> 3.3V
 *   RC522 GND  -> GND
 * 
 * Steps:
 *   1. Drag Arduino Uno + RFID RC522 onto the canvas
 *   2. Wire the SPI pins as shown above
 *   3. Upload this sketch
 *   4. Click the RC522 module to open the overlay
 *   5. Select a card preset and click "PRESENT CARD"
 *   6. Check Serial Monitor for the UID output
 */

#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN   10
#define RST_PIN  9

MFRC522 rfid(SS_PIN, RST_PIN);

// Store the last read UID for comparison
byte lastUID[4] = {0, 0, 0, 0};

void setup() {
  Serial.begin(9600);
  while (!Serial) { }

  SPI.begin();
  rfid.PCD_Init();

  Serial.println(F("========================================"));
  Serial.println(F("  RFID RC522 Test - Electra Simulation"));
  Serial.println(F("========================================"));
  Serial.println(F("Scan an RFID card..."));
  Serial.println();
}

void loop() {
  // Look for new cards
  if (!rfid.PICC_IsNewCardPresent()) {
    return;
  }

  // Verify the UID
  if (!rfid.PICC_ReadCardSerial()) {
    return;
  }

  // Check if this is a new card (different UID from last read)
  bool isNewCard = false;
  for (byte i = 0; i < 4; i++) {
    if (rfid.uid.uidByte[i] != lastUID[i]) {
      isNewCard = true;
      break;
    }
  }

  if (isNewCard) {
    Serial.println(F("--- New Card Detected ---"));
  } else {
    Serial.println(F("--- Same Card Re-read ---"));
  }

  // Print card type
  Serial.print(F("Card Type : "));
  Serial.println(rfid.PICC_GetTypeName(rfid.PICC_GetType(rfid.uid.sak)));

  // Print UID in HEX
  Serial.print(F("Card UID  : "));
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) {
      Serial.print(F(" 0"));
    } else {
      Serial.print(F(" "));
    }
    Serial.print(rfid.uid.uidByte[i], HEX);
  }
  Serial.println();

  // Print UID in DEC
  Serial.print(F("UID (DEC) : "));
  for (byte i = 0; i < rfid.uid.size; i++) {
    Serial.print(rfid.uid.uidByte[i], DEC);
    if (i < rfid.uid.size - 1) Serial.print(F("."));
  }
  Serial.println();

  // Save last UID
  for (byte i = 0; i < 4; i++) {
    lastUID[i] = rfid.uid.uidByte[i];
  }

  // Simple access control demo
  if (rfid.uid.uidByte[0] == 0xA1 &&
      rfid.uid.uidByte[1] == 0xB2 &&
      rfid.uid.uidByte[2] == 0xC3 &&
      rfid.uid.uidByte[3] == 0xD4) {
    Serial.println(F(">> ACCESS GRANTED (Card A)"));
  }
  else if (rfid.uid.uidByte[0] == 0x11 &&
           rfid.uid.uidByte[1] == 0x22 &&
           rfid.uid.uidByte[2] == 0x33 &&
           rfid.uid.uidByte[3] == 0x44) {
    Serial.println(F(">> ACCESS GRANTED (Card B - Admin)"));
  }
  else if (rfid.uid.uidByte[0] == 0xDE &&
           rfid.uid.uidByte[1] == 0xAD &&
           rfid.uid.uidByte[2] == 0xBE &&
           rfid.uid.uidByte[3] == 0xEF) {
    Serial.println(F(">> ACCESS GRANTED (Key Fob)"));
  }
  else {
    Serial.println(F(">> ACCESS DENIED"));
  }

  Serial.println();

  // Halt PICC
  rfid.PICC_HaltA();

  // Small delay before next read
  delay(500);
}
