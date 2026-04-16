/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { memo, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { getComponentPins } from '../../lib/PinMap';
import { useForgeStore } from '../../store/useForgeStore';
import { SensorOverlay } from './SensorOverlay';

// This is a generic wrapper for our internalized Leap elements (rebranded Leap)
export const LeapNode = memo(({ id, data, selected }: NodeProps) => {
  const selectedNodeId = useForgeStore((state) => state.selectedNodeId);
  const isSelected = selected || selectedNodeId === id;

  // I2C variants map to the same element as their parallel counterpart
  const elementType = data.type === 'lcd1602-i2c' ? 'lcd1602'
                    : data.type === 'lcd2004-i2c'  ? 'lcd2004'
                    : data.type;
  const Tag = `leap-${elementType}` as any;
  const pins = getComponentPins(data.type);

  // Custom styling for the node container
  const nodeStyle: React.CSSProperties = {
    padding: 0,
    borderRadius: '4px',
    background: 'transparent',
    border: `1px solid ${isSelected ? '#BEF264' : 'transparent'}`,
    transition: 'all 0.2s ease-out',
    position: 'relative',
    boxSizing: 'border-box'
  };

  // ── Hardware Property Mapper ──
  // Translating electrical logic (HIGH/LOW on pins) directly into Leap's visual attributes!
  const mappedProps: any = { ...data };

  if (data.type === 'led') {
    // Hardware pins are "Anode" and "Cathode". Using pin_Anode for state.
    mappedProps.value = data.pinStates?.pin_Anode === true || data.pinStates?.pin_A === true;
    mappedProps.brightness = data.brightness ?? (mappedProps.value ? 1.0 : 0.0);
    mappedProps.damaged = false;
  } else if (data.type === 'rgb-led') {
    // RGB LED uses Red, Green, and Blue channels relative to Common pin (COM)
    // We expect intensity per channel if provided by CircuitEngine, otherwise fallback to digital
    mappedProps.ledRed = data.pinStates?.pin_R === true ? (data.intensity_R ?? 1.0) : 0;
    mappedProps.ledGreen = data.pinStates?.pin_G === true ? (data.intensity_G ?? 1.0) : 0;
    mappedProps.ledBlue = data.pinStates?.pin_B === true ? (data.intensity_B ?? 1.0) : 0;
    mappedProps.damaged = false;
  } else if (data.type === 'buzzer') {
    // Buzzers use Pin 2 as Positive (Red) signal pin as per spec
    if (data.pinStates?.pin_PIEZO === true || data.pinStates?.pin_1 === true || data.pinStates?.pin_2 === true || data.pinStates?.pin_SIG === true) {
      mappedProps.hasSignal = true;
      mappedProps.intensity = data.intensity ?? 1.0;
      mappedProps.damaged = false;
      mappedProps.mode = data.mode ?? 'smooth';
      mappedProps.volume = data.volume ?? 1.0;
    } else {
      mappedProps.hasSignal = false;
      mappedProps.mode = data.mode ?? 'smooth';
      mappedProps.volume = data.volume ?? 1.0;
    }
  } else if (data.type === 'servo') {
    // Servos use the 'angle' property calculated in CircuitEngine
    mappedProps.angle = data.angle ?? 0;
  } else if (data.type === 'stepper-motor') {
    mappedProps.angle = data.angle ?? 0;
    mappedProps.value = data.value ?? '0.0°';
    mappedProps.units = data.units ?? '0 steps';
    mappedProps.arrow = data.arrow ?? '';
  } else if (data.type === 'ks2e-m-dc5') {
    // Relay: energized when COIL1 is HIGH (COIL2 is typically GND)
    mappedProps.energized = data.relayEnergized ?? false;
  } else if (data.type === 'biaxial-stepper') {
    mappedProps.outerHandAngle = data.outerHandAngle ?? 0;
    mappedProps.innerHandAngle = data.innerHandAngle ?? 0;
    mappedProps.outerHandColor = data.outerHandColor ?? 'gold';
    mappedProps.innerHandColor = data.innerHandColor ?? 'silver';
    mappedProps.outerHandShape = data.outerHandShape ?? 'plain';
    mappedProps.innerHandShape = data.innerHandShape ?? 'plain';
    mappedProps.outerHandLength = data.outerHandLength ?? 30;
    mappedProps.innerHandLength = data.innerHandLength ?? 30;
  } else if (['potentiometer', 'photoresistor', 'ntc-temperature-sensor', 'mq2', 'resistor'].includes(data.type)) {
    // Analog sensors (and resistors) use the 'value' from sensorValues
    mappedProps.value = data.sensorValues?.value ?? 0;
  } else if (data.type === 'lcd1602' || data.type === 'lcd2004' || data.type === 'lcd1602-i2c' || data.type === 'lcd2004-i2c') {
    // LCD Displays map the internal emulator state to visual properties
    const state = data.lcdState;
    // I2C variants render with i2c pins, parallel variants with full pins
    mappedProps.pins = (data.type === 'lcd1602-i2c' || data.type === 'lcd2004-i2c') ? 'i2c' : 'full';
    if (state) {
      mappedProps.characters = new Uint8Array(state.characters);
      mappedProps.cursorX = state.cursorX;
      mappedProps.cursorY = state.cursorY;
      mappedProps.cursor = state.cursor;
      mappedProps.blink = state.blink;
      mappedProps.backlight = state.backlight;
    }
  } else if (data.type === 'led-bar-graph') {
    // LED Bar Graph has 10 segments controlled by pins A1 to A10
    const values = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 10; i++) {
      values[i] = data.pinStates?.[`pin_A${i + 1}`] === true ? 1 : 0;
    }
    mappedProps.values = values;
  } else if (data.type === 'neopixel') {
    // Single NeoPixel: map decoded WS2812B RGB values (0-1 range)
    mappedProps.r = data.neopixelR ?? 0;
    mappedProps.g = data.neopixelG ?? 0;
    mappedProps.b = data.neopixelB ?? 0;
  } else if (data.type === 'neopixel-matrix' || data.type === 'led-ring') {
    // NeoPixel Matrix / LED Ring: pass through configuration
    if (data.type === 'neopixel-matrix') {
      mappedProps.rows = data.rows ?? 8;
      mappedProps.cols = data.cols ?? 8;
    } else {
      mappedProps.pixels = data.pixels ?? 16;
    }
  }

  // ── Ref for NeoPixel DOM access (setPixel requires DOM methods) ──
  const elementRef = useRef<any>(null);

  // Push pixel data to matrix/ring elements via DOM setPixel() method
  useEffect(() => {
    if (!elementRef.current || !data.neopixelPixels) return;
    const el = elementRef.current;
    const pixels = data.neopixelPixels;

    if (data.type === 'neopixel-matrix' && typeof el.setPixel === 'function') {
      const cols = data.cols ?? 8;
      for (let i = 0; i < pixels.length; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        el.setPixel(row, col, {
          r: pixels[i].r / 255,
          g: pixels[i].g / 255,
          b: pixels[i].b / 255,
        });
      }
    } else if (data.type === 'led-ring' && typeof el.setPixel === 'function') {
      for (let i = 0; i < pixels.length; i++) {
        el.setPixel(i, {
          r: pixels[i].r / 255,
          g: pixels[i].g / 255,
          b: pixels[i].b / 255,
        });
      }
    }
  }, [data.neopixelPixels, data.type, data.cols]);

  // Optional: Fallback for generic elements that listen to 'value'
  if (mappedProps.value === undefined && data.value !== undefined) {
    mappedProps.value = data.value;
  }

  return (
    <div style={nodeStyle} className="leap-node-wrapper">
      {/* ── COMPONENT & HANDLES CONTAINER ── */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* Dynamic Leap Element */}
        <Tag
          ref={elementRef}
          {...mappedProps}
          onPinStateChange={(pinName: string, state: boolean) => {
            console.log(`[LEAP NODE] Interaction event fired on Node ${data.id}, pin ${pinName} = ${state}`);
            // Lazy load to prevent circular dependencies in React mapping
            import('../../engine/CircuitEngine').then(({ circuitEngine }) => {
              circuitEngine.pushInputSignal(data.id || '', pinName, state);
            });
          }}
        />

        {/* ── DYNAMIC PIN HANDLES (Relativized to the Tag itself) ── */}
        {pins.map((pin, idx) => {
          const pinPosition = pin.y < 50 ? Position.Top : Position.Bottom;
          const handleStyle: React.CSSProperties = {
            left: `${pin.x}%`,
            top: `${pin.y}%`,
            width: '8px',
            height: '8px',
            zIndex: 10,
            pointerEvents: 'all',
            transition: 'opacity 0.2s',
          };

          return (
            <React.Fragment key={`${pin.name}-${idx}`}>
              {/* Hidden handle (target) — renders first, underneath */}
              <Handle
                id={`${pin.name}__target`}
                type="target"
                position={pinPosition}
                style={{
                  ...handleStyle,
                  background: 'transparent',
                  border: 'none',
                  opacity: 0,
                }}
              />
              {/* Visible handle (source) — renders last, on top for hover tooltip */}
              <Handle
                id={`${pin.name}`}
                type="source"
                position={pinPosition}
                style={{
                  ...handleStyle,
                  background: data.pinStates?.[`pin_${pin.name}`] ? '#ef4444' : '#BEF264',
                  border: '1.5px solid #1e293b',
                  opacity: selected ? 1 : 0.3,
                }}
                title={pin.name}
              />
            </React.Fragment>
          );
        })}
      </div>

      {/* Labels or sub-info if needed */}
      {data.label && (
        <div style={{
          marginTop: '8px',
          fontSize: '10px',
          color: '#94a3b8',
          fontWeight: 600,
          fontFamily: 'JetBrains Mono, monospace',
          pointerEvents: 'none'
        }}>
          {data.label}
        </div>
      )}

      {/* ── SENSOR OVERLAY (sliders shown when node is selected) ── */}
      {isSelected && (
        <SensorOverlay
          nodeId={id}
          type={data.type}
          currentValues={data.sensorValues}
        />
      )}
    </div>
  );
});

LeapNode.displayName = 'LeapNode';
