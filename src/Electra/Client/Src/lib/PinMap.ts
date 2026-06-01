/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { LEAP_PINS } from '../engine/Arduino/PinHarness';

export interface PinEntry {
  name: string;
  x: number;
  y: number;
  type?: 'source' | 'target';
}

const DPI = 96;
const MM_PER_INCH = 25.4;
const PX_PER_MM = DPI / MM_PER_INCH; // ~3.7795

export function getComponentPins(type: string): PinEntry[] {
  const componentData = LEAP_PINS[type];

  if (!componentData || !componentData.viewBox) {
    // Fallback generic
    return [
      { name: 'IN', x: 25, y: 5, type: 'target' },
      { name: 'OUT', x: 25, y: 45, type: 'source' }
    ];
  }

  const { viewBox, pins } = componentData;
  const isArduino = type.includes('arduino') || type.includes('mega');

  return pins.map((pin: any) => {
    // Leap pin coordinates are usually in CSS pixels (96 DPI).
    // but the component itself defines width in mm inside its SVGs, rendering to native CSS pixels.
    // If the element renders at intrinsic size, its width in pixels is viewBox.width * PX_PER_MM.

    let xPercent = 0;
    let yPercent = 0;

    const isSvgComponent = ['led', 'rgb-led', 'pushbutton', 'pushbutton-6mm', 'led-bar-graph', 'neopixel', 'neopixel-matrix', 'led-ring', 'stepper-motor', 'a4988', 'biaxial-stepper', 'ks2e-m-dc5', 'relay-module', 'ili9341', 'ssd1306', 'mpu6050', 'pir-motion-sensor', 'hc-sr04', 'dht22', 'dht11', 'ntc-temperature-sensor', 'photoresistor-sensor', 'flame-sensor', 'gas-sensor', 'heart-beat-sensor', 'big-sound-sensor', 'small-sound-sensor', 'hx711', 'ds1307', 'membrane-keypad', 'rotary-dialer', 'l298n', 'dc-motor', 'battery-12v', 'esp32-c3'].includes(type);

    if (isSvgComponent) {
      // SVG components define pin coordinates in leur internal viewBox space.
      // We calculate percentage relative to the total width/height after offset.
      xPercent = ((pin.x - viewBox.minX) / viewBox.width) * 100;
      yPercent = ((pin.y - viewBox.minY) / viewBox.height) * 100;
    } else {
      // For MM based components like Arduino:
      // Convert viewBox width (mm) to CSS pixels
      const widthPx = viewBox.width * PX_PER_MM;
      const heightPx = viewBox.height * PX_PER_MM;

      // Account for 'minX' shifting if necessary
      const offsetXPx = viewBox.minX < 0 ? Math.abs(viewBox.minX) * PX_PER_MM : 0;
      const offsetYPx = viewBox.minY < 0 ? Math.abs(viewBox.minY) * PX_PER_MM : 0;

      xPercent = ((pin.x + offsetXPx) / widthPx) * 100;
      yPercent = ((pin.y + offsetYPx) / heightPx) * 100;
    }

    return {
      name: pin.name,
      x: xPercent,
      y: yPercent,
    };
  });
}
