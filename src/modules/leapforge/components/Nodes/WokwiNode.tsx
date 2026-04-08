import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { getComponentPins } from '../../lib/PinMap';
import { useForgeStore } from '../../store/useForgeStore';
import { SensorOverlay } from './SensorOverlay';

// This is a generic wrapper for our internalized Leap elements (rebranded Wokwi)
export const WokwiNode = memo(({ id, data, selected }: NodeProps) => {
  const selectedNodeId = useForgeStore((state) => state.selectedNodeId);
  const isSelected = selected || selectedNodeId === id;
  const Tag = `wokwi-${data.type}` as any;
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
  // Translating electrical logic (HIGH/LOW on pins) directly into Wokwi's visual attributes!
  const mappedProps: any = { ...data };

  if (data.type === 'led') {
    // If the Anode (A) is High, visually light up the LED
    if (data.pinStates?.pin_A === true) {
      mappedProps.value = true;
    } else {
      mappedProps.value = false;
    }
  } else if (data.type === 'buzzer') {
    // Buzzers usually use `hasSignal` in Wokwi
    if (data.pinStates?.pin_PIEZO === true || data.pinStates?.pin_1 === true) {
      mappedProps.hasSignal = true;
    }
  }

  // Optional: Fallback for generic elements that listen to 'value'
  if (mappedProps.value === undefined && data.value !== undefined) {
    mappedProps.value = data.value;
  }

  return (
    <div style={nodeStyle} className="wokwi-node-wrapper">
      {/* Dynamic Leap Element */}
      <div>
        <Tag 
          {...mappedProps} 
          onPinStateChange={(pinName: string, state: boolean) => {
            console.log(`[WOKWI NODE] Interaction event fired on Node ${data.id}, pin ${pinName} = ${state}`);
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

      {/* ── DYNAMIC PIN HANDLES (Routing) ────────────────── */}
      {pins.map((pin, idx) => (
        <Handle
          key={`${pin.name}-${idx}`}
          id={pin.name}
          type={pin.type || 'source'}
          position={pin.y < 50 ? Position.Top : Position.Bottom}
          style={{ 
            background: data.pinStates?.[`pin_${pin.name}`] ? '#ef4444' : '#BEF264', 
            border: '1.5px solid #1e293b',
            width: '8px',
            height: '8px',
            left: `${pin.x}%`,
            top: `${pin.y}%`,
            opacity: selected ? 1 : 0.3, // Subtle visibility for non-selected nodes
            transition: 'opacity 0.2s',
            zIndex: 10,
            pointerEvents: 'all'
          }}
          title={pin.name}
        />
      ))}
    </div>
  );
});

WokwiNode.displayName = 'WokwiNode';
