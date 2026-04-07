/**
 * PinMap.ts
 * Defines hardware pin coordinates for Leap Elements within the Forge workspace.
 * Coordinates (x, y) are relative to the component's internal SVG container.
 */

export interface PinEntry {
  name: string;
  x: number;
  y: number;
  type?: 'source' | 'target'; // React Flow sense
}

export type PinLayout = { [componentId: string]: PinEntry[] };

export const PIN_MAP: PinLayout = {
  'arduino-uno': [
    // Digital Pins (Top Row)
    { name: '0', x: 89.4, y: 4.3 },
    { name: '1', x: 86.1, y: 4.3 },
    { name: '2', x: 82.8, y: 4.3 },
    { name: '3', x: 79.5, y: 4.3 },
    { name: '4', x: 76.1, y: 4.3 },
    { name: '5', x: 72.8, y: 4.3 },
    { name: '6', x: 69.5, y: 4.3 },
    { name: '7', x: 66.2, y: 4.3 },
    { name: '8', x: 60.5, y: 4.3 },
    { name: '9', x: 57.1, y: 4.3 },
    { name: '10', x: 53.7, y: 4.3 },
    { name: '11', x: 50.4, y: 4.3 },
    { name: '12', x: 47.1, y: 4.3 },
    { name: '13', x: 43.8, y: 4.3 },
    { name: 'GND.1', x: 40.4, y: 4.3 },
    { name: 'AREF', x: 37.1, y: 4.3 },
    { name: 'A4.2', x: 34.0, y: 4.3 },
    { name: 'A5.2', x: 30.5, y: 4.3 },

    // Power/Analog Pins (Bottom Row)
    { name: 'IOREF', x: 45.9, y: 91.2 },
    { name: 'RESET', x: 49.2, y: 91.2 },
    { name: '3.3V', x: 52.5, y: 91.2 },
    { name: '5V', x: 56.0, y: 91.2 },
    { name: 'GND.2', x: 59.3, y: 91.2 },
    { name: 'GND.3', x: 62.7, y: 91.2 },
    { name: 'VIN', x: 66.0, y: 91.2 },
    { name: 'A0', x: 72.8, y: 91.2 },
    { name: 'A1', x: 76.1, y: 91.2 },
    { name: 'A2', x: 79.5, y: 91.2 },
    { name: 'A3', x: 82.8, y: 91.2 },
    { name: 'A4', x: 86.1, y: 91.2 },
    { name: 'A5', x: 89.4, y: 91.2 },
  ],
  'arduino-mega': [
    // Top Row
    { name: 'SCL', x: 22.3, y: 4.5 }, { name: 'SDA', x: 24.8, y: 4.5 },
    { name: '13', x: 31.9, y: 4.5 }, { name: '12', x: 34.2, y: 4.5 },
    { name: '11', x: 36.6, y: 4.5 }, { name: '10', x: 39.0, y: 4.5 },
    { name: '9', x: 41.5, y: 4.5 }, { name: '8', x: 43.8, y: 4.5 },
    { name: '7', x: 47.0, y: 4.5 }, { name: '6', x: 49.5, y: 4.5 },
    { name: '5', x: 51.9, y: 4.5 }, { name: '4', x: 54.2, y: 4.5 },
    { name: '3', x: 56.6, y: 4.5 }, { name: '2', x: 58.9, y: 4.5 },
    { name: '1', x: 61.3, y: 4.5 }, { name: '0', x: 63.8, y: 4.5 },
    // Right Headers... (Omitting for brevity or adding key ones)
    { name: 'A0', x: 51.6, y: 92.2 }, { name: 'A1', x: 54.0, y: 92.2 },
    { name: 'A15', x: 88.5, y: 92.2 },
  ],
  'arduino-nano': [
    { name: 'D12', x: 11.1, y: 6.8 }, { name: 'D11', x: 16.6, y: 6.8 },
    { name: 'D10', x: 22.0, y: 6.8 }, { name: 'D9', x: 27.4, y: 6.8 },
    { name: 'D8', x: 32.8, y: 6.8 }, { name: 'D7', x: 38.3, y: 6.8 },
    { name: 'D6', x: 43.7, y: 6.8 }, { name: 'D5', x: 49.1, y: 6.8 },
    { name: 'D4', x: 54.6, y: 6.8 }, { name: 'D3', x: 60.0, y: 6.8 },
    { name: 'D2', x: 65.4, y: 6.8 }, { name: 'GND', x: 70.9, y: 6.8 },
    { name: 'RESET', x: 76.3, y: 6.8 }, { name: 'RX0', x: 81.7, y: 6.8 },
    { name: 'TX1', x: 87.2, y: 6.8 },

    { name: 'D13', x: 11.1, y: 89.1 }, { name: '3V3', x: 16.6, y: 89.1 },
    { name: 'AREF', x: 22.0, y: 89.1 }, { name: 'A0', x: 27.4, y: 89.1 },
    { name: 'A1', x: 32.8, y: 89.1 }, { name: 'GND.1', x: 81.7, y: 89.1 },
    { name: 'VIN', x: 87.2, y: 89.1 },
  ],
  'led': [
    { name: 'A', x: 15, y: 80 }, // Anode
    { name: 'K', x: 35, y: 80 }, // Cathode
  ],
  'lcd1602': [
    { name: 'VSS', x: 32, y: 120 }, { name: 'VDD', x: 41, y: 120 },
    { name: 'RS', x: 60, y: 120 }, { name: 'E', x: 80, y: 120 },
    { name: 'D4', x: 128, y: 120 }, { name: 'D5', x: 137, y: 120 },
    { name: 'D6', x: 147, y: 120 }, { name: 'D7', x: 156, y: 120 },
    { name: 'A', x: 166, y: 120 }, { name: 'K', x: 176, y: 120 },
  ],
  'dht22': [
    { name: 'VCC', x: 10, y: 50 },
    { name: 'DATA', x: 20, y: 50 },
    { name: 'NC', x: 30, y: 50 },
    { name: 'GND', x: 40, y: 50 },
  ],
  'pushbutton': [
    { name: '1.L', x: 5, y: 15 }, { name: '1.R', x: 25, y: 15 },
    { name: '2.L', x: 5, y: 35 }, { name: '2.R', x: 25, y: 35 },
  ]
};

/**
 * Gets the pin layout for a specific component type.
 * Returns default generic pins if not found.
 */
export function getComponentPins(type: string): PinEntry[] {
  return PIN_MAP[type] || [
    { name: 'IN', x: 25, y: 5, type: 'target' },
    { name: 'OUT', x: 25, y: 45, type: 'source' }
  ];
}
