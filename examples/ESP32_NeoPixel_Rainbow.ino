/**
 * ESP32 NeoPixel Rainbow Example
 * 
 * This example creates a rainbow effect on a NeoPixel LED strip.
 * The rainbow continuously cycles through all colors.
 * 
 * Hardware:
 * - ESP32-C3 board
 * - NeoPixel LED strip (8 LEDs) connected to pin 6
 * 
 * Circuit:
 * - NeoPixel Data In → GPIO 6
 * - NeoPixel VCC → 5V
 * - NeoPixel GND → GND
 */

#include <Adafruit_NeoPixel.h>

#define LED_PIN 6
#define LED_COUNT 8

Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 NeoPixel Rainbow Example");
  
  strip.begin();
  strip.setBrightness(50);  // Set brightness to 50% (0-255)
  strip.show();  // Initialize all pixels to 'off'
  
  Serial.println("NeoPixel strip initialized");
}

void loop() {
  rainbow(10);  // Rainbow cycle with 10ms delay
}

// Rainbow cycle along whole strip
void rainbow(int wait) {
  static long firstPixelHue = 0;
  
  for(int i=0; i<strip.numPixels(); i++) {
    // Calculate hue for each pixel
    int pixelHue = firstPixelHue + (i * 65536L / strip.numPixels());
    
    // Convert HSV to RGB and set pixel color
    strip.setPixelColor(i, Adafruit_NeoPixel::ColorHSV(pixelHue));
  }
  
  strip.show();  // Update strip with new contents
  delay(wait);   // Pause for a moment
  
  firstPixelHue += 256;  // Advance hue for next frame
  
  // Print current hue to Serial Monitor
  if (firstPixelHue % 5120 == 0) {  // Print every ~20 frames
    Serial.print("Rainbow hue: ");
    Serial.println(firstPixelHue);
  }
}

// Alternative: Theater chase rainbow effect
void theaterChaseRainbow(int wait) {
  static int firstPixelHue = 0;
  static int b = 0;
  
  for(int i=0; i<strip.numPixels(); i+=3) {
    int c = (i+b) % 3;
    if(c == 0) {
      int hue = firstPixelHue + i * 65536L / strip.numPixels();
      strip.setPixelColor(i, Adafruit_NeoPixel::ColorHSV(hue));
    } else {
      strip.setPixelColor(i, 0);  // Turn off
    }
  }
  
  strip.show();
  delay(wait);
  
  b++;
  if(b >= 3) {
    b = 0;
    firstPixelHue += 65536 / 90;  // One cycle of hues over 90 frames
  }
}
