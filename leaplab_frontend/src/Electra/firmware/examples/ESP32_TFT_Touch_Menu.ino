/**
 * ESP32 TFT Touch Menu Example
 * 
 * This example displays a touch menu on a 2.8" SPI TFT (ILI9341) 
 * with a capacitive touchscreen (FT6206). It allows toggling the
 * ESP32 built-in LED and navigating between Home and About pages.
 * 
 * Hardware:
 * - ESP32-C3 board
 * - ILI9341 TFT Display (SPI) + FT6206 Touch (I2C)
 * 
 * Circuit Connections (Wired in simulator or physically):
 * - TFT VCC  → 3.3V / 5V
 * - TFT GND  → GND
 * - TFT CS   → GPIO 5
 * - TFT RST  → GPIO 4
 * - TFT D/C  → GPIO 2
 * - TFT MOSI → GPIO 23 (SPI MOSI)
 * - TFT SCK  → GPIO 18 (SPI SCK)
 * - TFT LED  → 3.3V
 * - TFT MISO → GPIO 19 (SPI MISO)
 * - TFT SDA  → GPIO 21 (I2C SDA)
 * - TFT SCL  → GPIO 22 (I2C SCL)
 */

#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include <Adafruit_FT6206.h>

// TFT Pins
#define TFT_CS   5
#define TFT_DC   2
#define TFT_RST  4

// ESP32 Built-in LED
#define LED_PIN 2

Adafruit_ILI9341 tft(TFT_CS, TFT_DC, TFT_RST);
Adafruit_FT6206 ctp = Adafruit_FT6206();

void drawMainMenu();
void drawAbout();
void drawButton(int x, int y, int w, int h, uint16_t color, const char *text);

void setup()
{
  Serial.begin(115200);
  Serial.println("Starting TFT Touch Menu...");

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  tft.begin();
  tft.setRotation(1); // Landscape mode
  tft.fillScreen(ILI9341_BLACK);

  if (!ctp.begin(40))
  {
    Serial.println("Touch controller FT6206 not found!");
    tft.setTextColor(ILI9341_RED);
    tft.setTextSize(2);
    tft.setCursor(20, 100);
    tft.println("Touch Not Found");
    while(1);
  }

  Serial.println("TFT Touch screen initialized.");
  drawMainMenu();
}

void loop()
{
  if (!ctp.touched())
    return;

  TS_Point p = ctp.getPoint();

  // Map touch screen hardware coordinates (portrait) to landscape display coordinates
  int x = map(p.y, 0, 240, 0, 320);
  int y = map(p.x, 0, 320, 0, 240);

  // Simple debounce delay
  delay(200);

  Serial.print("Touch X=");
  Serial.print(x);
  Serial.print(" Y=");
  Serial.println(y);

  // Check buttons based on (x, y) coordinates
  
  // HOME / MAIN MENU
  if (x > 20 && x < 140 && y > 40 && y < 90)
  {
    drawMainMenu();
  }
  // LED ON
  else if (x > 180 && x < 300 && y > 40 && y < 90)
  {
    digitalWrite(LED_PIN, HIGH);
    tft.fillRect(20, 180, 280, 30, ILI9341_BLACK);
    tft.setTextColor(ILI9341_GREEN);
    tft.setTextSize(2);
    tft.setCursor(30, 185);
    tft.print("LED TURNED ON");
  }
  // LED OFF
  else if (x > 20 && x < 140 && y > 110 && y < 160)
  {
    digitalWrite(LED_PIN, LOW);
    tft.fillRect(20, 180, 280, 30, ILI9341_BLACK);
    tft.setTextColor(ILI9341_RED);
    tft.setTextSize(2);
    tft.setCursor(30, 185);
    tft.print("LED TURNED OFF");
  }
  // ABOUT page
  else if (x > 180 && x < 300 && y > 110 && y < 160)
  {
    drawAbout();
  }
  // BACK button on ABOUT page
  else if (x > 100 && x < 220 && y > 200)
  {
    drawMainMenu();
  }
}

void drawButton(int x, int y, int w, int h, uint16_t color, const char *text)
{
  tft.fillRoundRect(x, y, w, h, 8, color);
  tft.drawRoundRect(x, y, w, h, 8, ILI9341_WHITE);

  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(2);
  tft.setCursor(x + 20, y + 18);
  tft.print(text);
}

void drawMainMenu()
{
  tft.fillScreen(ILI9341_BLACK);

  tft.setTextColor(ILI9341_YELLOW);
  tft.setTextSize(3);
  tft.setCursor(80, 10);
  tft.println("MAIN MENU");

  drawButton(20, 40, 120, 50, ILI9341_BLUE, "HOME");
  drawButton(180, 40, 120, 50, ILI9341_GREEN, "LED ON");

  drawButton(20, 110, 120, 50, ILI9341_RED, "LED OFF");
  drawButton(180, 110, 120, 50, ILI9341_MAGENTA, "ABOUT");
}

void drawAbout()
{
  tft.fillScreen(ILI9341_BLACK);

  tft.setTextColor(ILI9341_CYAN);
  tft.setTextSize(3);
  tft.setCursor(110, 20);
  tft.println("ABOUT");

  tft.setTextSize(2);
  tft.setTextColor(ILI9341_WHITE);

  tft.setCursor(20, 80);
  tft.println("ESP32 TFT Touch");

  tft.setCursor(20, 110);
  tft.println("Menu System");

  tft.setCursor(20, 140);
  tft.println("ILI9341 + FT6206");

  drawButton(100, 200, 120, 40, ILI9341_RED, "BACK");
}
