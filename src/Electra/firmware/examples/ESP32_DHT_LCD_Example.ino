/**
 * ESP32 DHT + LCD Example
 * 
 * This example reads temperature and humidity from a DHT22 sensor
 * and displays the values on a 16x2 I2C LCD display.
 * 
 * Hardware:
 * - ESP32-C3 board
 * - DHT22 sensor connected to pin 2
 * - 16x2 I2C LCD at address 0x27
 * 
 * Circuit:
 * - DHT22 Data → GPIO 2
 * - DHT22 VCC → 3.3V
 * - DHT22 GND → GND
 * - LCD SDA → GPIO 21 (I2C SDA)
 * - LCD SCL → GPIO 22 (I2C SCL)
 * - LCD VCC → 5V
 * - LCD GND → GND
 */

#include <DHT.h>
#include <LiquidCrystal_I2C.h>

#define DHTPIN 2
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 DHT + LCD Example");
  
  // Initialize DHT sensor
  dht.begin();
  Serial.println("DHT22 sensor initialized");
  
  // Initialize LCD
  lcd.begin();
  lcd.backlight();
  lcd.clear();
  
  // Display welcome message
  lcd.setCursor(0, 0);
  lcd.print("DHT22 Sensor");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");
  delay(2000);
}

void loop() {
  // Read temperature and humidity
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  // Check if readings are valid
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Failed to read from DHT sensor!");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Sensor Error!");
    delay(2000);
    return;
  }
  
  // Print to Serial Monitor
  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.print("°C, Humidity: ");
  Serial.print(humidity);
  Serial.println("%");
  
  // Display on LCD
  lcd.clear();
  
  // Line 1: Temperature
  lcd.setCursor(0, 0);
  lcd.print("Temp: ");
  lcd.print(temperature, 1);
  lcd.print((char)223);  // Degree symbol
  lcd.print("C");
  
  // Line 2: Humidity
  lcd.setCursor(0, 1);
  lcd.print("Humidity: ");
  lcd.print(humidity, 1);
  lcd.print("%");
  
  // Wait 2 seconds before next reading
  delay(2000);
}
