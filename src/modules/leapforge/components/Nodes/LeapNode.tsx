import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { getComponentPins } from '../../lib/PinMap';
import { useForgeStore } from '../../store/useForgeStore';
import { SensorOverlay } from './SensorOverlay';

// This is a generic wrapper for our internalized Leap elements (rebranded Leap)
export const LeapNode = memo(({ id, data, selected }: NodeProps) => {
  const selectedNodeId = useForgeStore((state) => state.selectedNodeId);
  const isSelected = selected || selectedNodeId === id;
  const Tag = `leap-${data.type}` as any;
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
    // If the Anode (A) is High, visually light up the LED
    if (data.pinStates?.pin_A === true) {
      mappedProps.value = true;
    } else {
      mappedProps.value = false;
    }
  } else if (data.type === 'buzzer') {
    // Buzzers usually use `hasSignal` in Leap
    if (data.pinStates?.pin_PIEZO === true || data.pinStates?.pin_1 === true) {
      mappedProps.hasSignal = true;
    }
  } else if (data.type === 'servo') {
    // Servos use the 'angle' property calculated in CircuitEngine
    mappedProps.angle = data.angle ?? 0;
  } else if (['potentiometer', 'photoresistor', 'ntc-temperature-sensor', 'mq2', 'resistor'].includes(data.type)) {
    // Analog sensors (and resistors) use the 'value' from sensorValues
    mappedProps.value = data.sensorValues?.value ?? 0;
  } else if (data.type === 'lcd1602' || data.type === 'lcd2004') {
    // LCD Displays map the internal emulator state to visual properties
    const state = data.lcdState;
    if (state) {
      mappedProps.characters = new Uint8Array(state.characters);
      mappedProps.cursorX = state.cursorX;
      mappedProps.cursorY = state.cursorY;
      mappedProps.cursor = state.cursor;
      mappedProps.blink = state.blink;
      mappedProps.backlight = state.backlight;
    }
  }

  // Optional: Fallback for generic elements that listen to 'value'
  if (mappedProps.value === undefined && data.value !== undefined) {
    mappedProps.value = data.value;
  }

  return (
    <div style={nodeStyle} className="leap-node-wrapper">
      {/* Dynamic Leap Element */}
      <div>
        <Tag 
          {...mappedProps} 
          onPinStateChange={(pinName: string, state: boolean) => {
            console.log(`[LEAP NODE] Interaction event fired on Node ${data.id}, pin ${pinName} = ${state}`);
            // Lazy load to prevent circular dependencies in React mapping
            import('../../engine/CircuitEngine').then(({ circuitEngine }) => {
              circuitEngine.pushInputSignal(data.id || '', pinName, state);
            });
          }}
        />
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

      {/* Sensor Controls Overlay */}
      {isSelected && (
        <SensorOverlay 
          nodeId={id} 
          type={data.type} 
          currentValues={data.sensorValues} 
        />
      )}

      {/* ── DYNAMIC PIN HANDLES (Dual Source+Target for bidirectional wiring) ── */}
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
  );
});

LeapNode.displayName = 'LeapNode';
