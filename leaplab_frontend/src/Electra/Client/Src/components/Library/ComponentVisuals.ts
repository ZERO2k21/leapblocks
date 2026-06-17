/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import * as fabric from 'fabric';

export interface ComponentMetadata {
  id: string;
  name: string;
  width: number;
  height: number;
  color: string;
  pins: { id: string; x: number; y: number; label: string }[];
}

export const COMPONENT_METADATA: Record<string, ComponentMetadata> = {
  arduino_uno: {
    id: 'arduino_uno',
    name: 'Arduino Uno',
    width: 160,
    height: 110,
    color: '#1e293b',
    pins: [
      { id: '13', x: 155, y: 10, label: '13' },
      { id: 'GND', x: 155, y: 20, label: 'GND' },
      { id: '5V', x: 155, y: 30, label: '5V' },
    ]
  },
  led: {
    id: 'led',
    name: 'LED',
    width: 30,
    height: 30,
    color: '#ef4444',
    pins: [
      { id: 'anode', x: 5, y: 15, label: 'A' },
      { id: 'cathode', x: 25, y: 15, label: 'K' },
    ]
  },
  resistor: {
    id: 'resistor',
    name: 'Resistor',
    width: 50,
    height: 15,
    color: '#cbd5e1',
    pins: [
      { id: 'p1', x: 0, y: 7.5, label: '1' },
      { id: 'p2', x: 50, y: 7.5, label: '2' },
    ]
  }
};

/**
 * Creates a high-fidelity visual for a component using Fabric.js
 */
export function createFabricComponent(type: string, id: string, x: number, y: number): fabric.Group {
  const meta = COMPONENT_METADATA[type] || {
    id: 'unknown',
    name: 'Unknown',
    width: 60,
    height: 40,
    color: '#334155',
    pins: []
  };

  // 1. Base PCB/Body
  const body = new fabric.Rect({
    width: meta.width,
    height: meta.height,
    fill: meta.color,
    stroke: '#BEF264',
    strokeWidth: 1.5,
    rx: 2,
    ry: 2,
    shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.5)', blur: 10, offsetX: 5, offsetY: 5 })
  });

  // 2. Component Name
  const label = new fabric.Text(meta.name.toUpperCase(), {
    fontSize: 9,
    fontFamily: 'Space Mono',
    fill: '#F8FAFC',
    left: 8,
    top: 8,
    fontWeight: 'bold'
  });

  // 3. Pin Pads
  const pinVisuals: fabric.Object[] = [];
  meta.pins.forEach(pin => {
    // PAD
    const pad = new fabric.Circle({
      radius: 3,
      fill: '#D1D5DB',
      stroke: '#4B5563',
      strokeWidth: 1,
      left: pin.x - 3,
      top: pin.y - 3,
    });
    
    // PIN LABEL
    const pinLabel = new fabric.Text(pin.label, {
      fontSize: 7,
      fontFamily: 'JetBrains Mono',
      fill: 'rgba(255,255,255,0.4)',
      left: pin.x < meta.width / 2 ? pin.x + 6 : pin.x - 14,
      top: pin.y - 4,
    });

    pinVisuals.push(pad, pinLabel);
  });

  // 4. Assemble Group
  const group = new fabric.Group([body, label, ...pinVisuals], {
    left: x,
    top: y,
    selectable: true,
    hasControls: false,
  });

  // Set custom data
  (group as any).data = { id, type };

  return group;
}
