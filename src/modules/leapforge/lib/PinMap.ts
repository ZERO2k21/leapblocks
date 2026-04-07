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
    { name: '0', x: 94.92, y: 4.28 },
    { name: '1', x: 91.42, y: 4.28 },
    { name: '2', x: 87.92, y: 4.28 },
    { name: '3', x: 84.42, y: 4.28 },
    { name: '4', x: 80.92, y: 4.28 },
    { name: '5', x: 77.42, y: 4.28 },
    { name: '6', x: 73.92, y: 4.28 },
    { name: '7', x: 70.42, y: 4.28 },
    { name: '8', x: 66.93, y: 4.28 },
    { name: '9', x: 63.43, y: 4.28 },
    { name: '10', x: 59.93, y: 4.28 },
    { name: '11', x: 56.43, y: 4.28 },
    { name: '12', x: 52.93, y: 4.28 },
    { name: '13', x: 49.43, y: 4.28 },
    { name: 'GND.1', x: 45.93, y: 4.28 },
    { name: 'AREF', x: 42.43, y: 4.28 },
    { name: 'SDA', x: 38.93, y: 4.28 },
    { name: 'SCL', x: 35.43, y: 4.28 },

    // Power/Analog Pins (Bottom Row)
    { name: 'IOREF', x: 39.80, y: 91.19 },
    { name: 'RESET', x: 43.30, y: 91.19 },
    { name: '3.3V', x: 46.80, y: 91.19 },
    { name: '5V', x: 50.30, y: 91.19 },
    { name: 'GND.2', x: 53.80, y: 91.19 },
    { name: 'GND.3', x: 57.30, y: 91.19 },
    { name: 'VIN', x: 60.80, y: 91.19 },
    { name: 'A0', x: 71.30, y: 91.19 },
    { name: 'A1', x: 74.80, y: 91.19 },
    { name: 'A2', x: 78.30, y: 91.19 },
    { name: 'A3', x: 81.80, y: 91.19 },
    { name: 'A4', x: 85.30, y: 91.19 },
    { name: 'A5', x: 88.80, y: 91.19 },
  ],
  'arduino-mega': [
    // Top Row: Formula: ((rawX * 0.254) + 4) / 102.66 * 100
    { name: 'SCL', x: 26.17, y: 4.50 },
    { name: 'SDA', x: 28.65, y: 4.50 },
    { name: 'AREF', x: 30.87, y: 4.50 },
    { name: 'GND.1', x: 33.35, y: 4.50 },
    { name: '13', x: 35.82, y: 4.50 },
    { name: '12', x: 38.05, y: 4.50 },
    { name: '11', x: 40.52, y: 4.50 },
    { name: '10', x: 42.87, y: 4.50 },
    { name: '9', x: 45.35, y: 4.50 },
    { name: '8', x: 47.70, y: 4.50 },
    { name: '7', x: 50.92, y: 4.50 },
    { name: '6', x: 53.40, y: 4.50 },
    { name: '5', x: 55.75, y: 4.50 },
    { name: '4', x: 58.10, y: 4.50 },
    { name: '3', x: 60.45, y: 4.50 },
    { name: '2', x: 62.80, y: 4.50 },
    { name: '1', x: 65.15, y: 4.50 },
    { name: '0', x: 67.62, y: 4.50 },
    { name: '14', x: 70.84, y: 4.50 },
    { name: '15', x: 73.19, y: 4.50 },
    { name: '16', x: 75.54, y: 4.50 },
    { name: '17', x: 77.89, y: 4.50 },
    { name: '18', x: 80.24, y: 4.50 },
    { name: '19', x: 82.72, y: 4.50 },
    { name: '20', x: 85.07, y: 4.50 },
    { name: '21', x: 87.42, y: 4.50 },

    // Analog/Power: Y = (184.5 * 0.254) / 50.80 = 92.25%
    { name: 'IOREF', x: 37.55, y: 92.25 },
    { name: 'RESET', x: 39.90, y: 92.25 },
    { name: '3.3V', x: 42.25, y: 92.25 },
    { name: '5V', x: 44.60, y: 92.25 },
    { name: 'GND.2', x: 47.02, y: 92.25 },
    { name: 'GND.3', x: 49.37, y: 92.25 },
    { name: 'VIN', x: 51.78, y: 92.25 },
    { name: 'A0', x: 55.49, y: 92.25 },
    { name: 'A1', x: 57.84, y: 92.25 },
    { name: 'A15', x: 87.52, y: 92.25 },
  ],
  'arduino-nano': [
    // Top Row: X = ((raw * 0.254) + 1.4) / 44.9 * 100, Y = (4.8 * 0.254) / 17.8 = 6.85%
    { name: 'D12', x: 14.26, y: 6.85 }, { name: 'D11', x: 19.69, y: 6.85 },
    { name: 'D10', x: 25.12, y: 6.85 }, { name: 'D9', x: 30.55, y: 6.85 },
    { name: 'D8', x: 35.98, y: 6.85 }, { name: 'D7', x: 41.41, y: 6.85 },
    { name: 'D6', x: 46.85, y: 6.85 }, { name: 'D5', x: 52.28, y: 6.85 },
    { name: 'D4', x: 57.71, y: 6.85 }, { name: 'D3', x: 63.14, y: 6.85 },
    { name: 'D2', x: 68.57, y: 6.85 }, { name: 'GND.2', x: 74.00, y: 6.85 },
    { name: 'RESET.2', x: 79.43, y: 6.85 }, { name: 'D0', x: 84.86, y: 6.85 },
    { name: 'D1', x: 90.29, y: 6.85 },

    // Bottom Row: Y = (62.4 * 0.254) / 17.8 = 89.04%
    { name: 'D13', x: 14.26, y: 89.04 }, { name: '3.3V', x: 19.69, y: 89.04 },
    { name: 'AREF', x: 25.12, y: 89.04 }, { name: 'A0', x: 30.55, y: 89.04 },
    { name: 'A1', x: 35.98, y: 89.04 }, { name: 'A2', x: 41.41, y: 89.04 },
    { name: 'A3', x: 46.85, y: 89.04 }, { name: 'A4', x: 52.28, y: 89.04 },
    { name: 'A5', x: 57.71, y: 89.04 }, { name: 'A6', x: 63.14, y: 89.04 },
    { name: 'A7', x: 68.57, y: 89.04 }, { name: '5V', x: 74.00, y: 89.04 },
    { name: 'RESET', x: 79.43, y: 89.04 }, { name: 'GND.1', x: 84.86, y: 89.04 },
    { name: 'VIN', x: 90.29, y: 89.04 },
  ],
  'led': [
    { name: 'A', x: 38.3, y: 88.9 }, // Anode center
    { name: 'K', x: 64.8, y: 88.9 }, // Cathode center
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
