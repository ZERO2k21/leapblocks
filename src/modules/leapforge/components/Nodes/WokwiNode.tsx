import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { getComponentPins } from '../../lib/PinMap';

// This is a generic wrapper for our internalized Leap elements (rebranded Wokwi)
export const WokwiNode = memo(({ data, selected }: NodeProps) => {
  const Tag = `leap-${data.type}` as any;
  const pins = getComponentPins(data.type);
  
  // Custom styling for the node container
  const nodeStyle: React.CSSProperties = {
    padding: 0,
    borderRadius: '4px',
    background: 'transparent',
    border: `1px solid ${selected ? '#BEF264' : 'transparent'}`,
    transition: 'all 0.2s ease-out',
    position: 'relative',
    boxSizing: 'border-box'
  };

  return (
    <div style={nodeStyle} className="wokwi-node-wrapper">
      {/* Dynamic Leap Element */}
      <div style={{ pointerEvents: 'none' }}>
        <Tag {...data} value={data.value} />
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
