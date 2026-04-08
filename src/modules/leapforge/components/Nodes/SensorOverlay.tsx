import React from 'react';
import { useForgeStore } from '../../store/useForgeStore';

interface SensorOverlayProps {
  nodeId: string;
  type: string;
  currentValues: any;
}

export const SensorOverlay: React.FC<SensorOverlayProps> = ({ nodeId, type, currentValues }) => {
  const setSelectedNode = useForgeStore(state => state.setSelectedNode);
  const updateNodeData = useForgeStore(state => state.updateNodeData);
  const timerRef = React.useRef<any>(null);

  const resetTimer = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSelectedNode(null);
    }, 3000); // 3 seconds
  }, [setSelectedNode]);

  // Start/Reset timer on mount and activity
  React.useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  // Default values if not set
  const distance = currentValues?.distance ?? 100;
  
  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    resetTimer(); // Reset the 3s countdown on interaction
    updateNodeData(nodeId, {
      sensorValues: {
        ...currentValues,
        distance: parseInt(e.target.value, 10)
      }
    });
  };

  if (type !== 'hc-sr04') return null;

  return (
    <div 
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="nodrag nopan"
      style={{
        position: 'absolute',
        bottom: '-60px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '160px',
        background: 'rgba(30, 41, 59, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '8px',
        padding: '8px 12px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        cursor: 'default'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, fontFamily: 'sans-serif' }}>DISTANCE</span>
        <span style={{ fontSize: '11px', color: '#BEF264', fontWeight: 700, fontFamily: 'monospace' }}>{distance} cm</span>
      </div>
      <input 
        type="range" 
        min="2" 
        max="400" 
        value={distance} 
        onChange={handleDistanceChange}
        style={{
          width: '100%',
          accentColor: '#BEF264',
          cursor: 'pointer'
        }}
      />
    </div>
  );
};
