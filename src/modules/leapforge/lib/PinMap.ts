import { LEAP_PINS } from '../engine/PinHarness';

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

  return pins.map(pin => {
    // Leap pin coordinates are usually in CSS pixels (96 DPI).
    // but the component itself defines width in mm inside its SVGs, rendering to native CSS pixels.
    // If the element renders at intrinsic size, its width in pixels is viewBox.width * PX_PER_MM.
    
    let xPercent = 0;
    let yPercent = 0;

    if (type === 'led' || type === 'pushbutton') {
        // Special case: LED natively defines its pin.x within its viewBox width!
        // LED viewBox width: 35.456. Pin x=25. Percentage = 25 / 35.456
        xPercent = (pin.x / viewBox.width) * 100;
        yPercent = (pin.y / viewBox.height) * 100;
    } else {
        // For MM based components like Arduino:
        // Convert viewBox width (mm) to CSS pixels
        const widthPx = viewBox.width * PX_PER_MM;
        const heightPx = viewBox.height * PX_PER_MM;
        
        // We account for 'minX' shifting if necessary, though Leap's px coordinates
        // generally map from the absolute top-left visual corner (0,0).
        xPercent = (pin.x / widthPx) * 100;
        yPercent = (pin.y / heightPx) * 100;

        // Tweak: if it's Arduino, Leap actually shifts minX by -4mm, so the "0" of the drawing board is displaced.
        if (viewBox.minX < 0) {
           const offsetPx = Math.abs(viewBox.minX) * PX_PER_MM;
           xPercent = ((pin.x + offsetPx) / widthPx) * 100;
        }
        if (viewBox.minY < 0) {
           const offsetPx = Math.abs(viewBox.minY) * PX_PER_MM;
           yPercent = ((pin.y + offsetPx) / heightPx) * 100;
        }
    }

    return {
      name: pin.name,
      x: xPercent,
      y: yPercent,
      type: pin.y < 50 ? 'target' : 'source'
    };
  });
}
