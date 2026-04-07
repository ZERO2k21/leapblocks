import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

// This is a generic wrapper for our internalized Leap elements (rebranded Wokwi)
export const WokwiNode = memo(({ data }: NodeProps) => {
  const Tag = `leap-${data.type}` as any;
  
  // Custom styling for the node container
  const nodeStyle: React.CSSProperties = {
    padding: '10px',
    borderRadius: '12px',
    background: 'rgba(30, 41, 59, 0.5)',
    border: '1.5px solid rgba(148, 163, 184, 0.2)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '50px',
    minHeight: '50px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  return (
    <div style={nodeStyle} className="wokwi-node-wrapper">
      {/* Dynamic Leap Element */}
      <Tag {...data.attrs} />
      
      {/* Labels or sub-info if needed */}
      {data.label && (
        <div style={{ 
          marginTop: '8px', 
          fontSize: '10px', 
          color: '#94a3b8', 
          fontWeight: 600,
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          {data.label}
        </div>
      )}

      {/* Handles for wiring - in a real circuit simulator, 
          these would be positioned exactly over the component's pins.
          For Phase 1, we use generic entry/exit handles. */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#BEF264', border: '1px solid #1e293b' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#BEF264', border: '1px solid #1e293b' }}
      />
    </div>
  );
});

WokwiNode.displayName = 'WokwiNode';
