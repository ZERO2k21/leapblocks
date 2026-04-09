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
    }, 5000); // 5 seconds
  }, [setSelectedNode]);

  // Start/Reset timer on mount and activity
  React.useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  // --- Configuration Mapping ---
  const isDistanceSensor = type === 'hc-sr04';
  const isAnalogSensor = ['potentiometer', 'photoresistor', 'ntc-temperature-sensor', 'mq2', 'resistor'].includes(type);

  if (!isDistanceSensor && !isAnalogSensor) return null;

  // Configuration for display
  const config = isDistanceSensor 
    ? { label: 'DISTANCE', unit: 'cm', min: 2, max: 400, key: 'distance' }
    : type === 'potentiometer' ? { label: 'RESISTANCE', unit: '%', min: 0, max: 100, key: 'value' }
    : type === 'resistor' ? { label: 'RESISTANCE', unit: 'Ω', min: 0, max: 10000, key: 'value' } 
    : type === 'photoresistor' ? { label: 'LIGHT', unit: 'lux', min: 0, max: 1000, key: 'value' }
    : type === 'ntc-temperature-sensor' ? { label: 'TEMP', unit: '°C', min: -40, max: 125, key: 'value' }
    : { label: 'VALUE', unit: '', min: 0, max: 1023, key: 'value' };

  const currentValue = currentValues?.[config.key] ?? config.min;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    resetTimer();
    const newValue = parseFloat(e.target.value);
    
    updateNodeData(nodeId, {
      sensorValues: {
        ...currentValues,
        [config.key]: newValue
      }
    });

    // Proactively push to simulation engine if it's an analog input
    if (isAnalogSensor) {
      import('../../engine/CircuitEngine').then(({ circuitEngine }) => {
        // We push 'true' as a dummy for digital, the engine will pull the analog value from store
        circuitEngine.pushInputSignal(nodeId, 'SIG', true); 
      });
    }
  };

  return (
    <div 
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="nodrag nopan"
      style={{
        position: 'absolute',
        bottom: '-70px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '180px',
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(186, 242, 100, 0.3)',
        borderRadius: '12px',
        padding: '10px 14px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        cursor: 'default'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'system-ui' }}>{config.label}</span>
        <span style={{ fontSize: '12px', color: '#BEF264', fontWeight: 800, fontFamily: 'monospace' }}>
          {currentValue >= 1000 ? `${(currentValue / 1000).toFixed(1)} k` : currentValue} {config.unit}
        </span>
      </div>
      <input 
        type="range" 
        min={config.min} 
        max={config.max} 
        value={currentValue} 
        onChange={handleChange}
        style={{
          width: '100%',
          accentColor: '#BEF264',
          height: '4px',
          cursor: 'pointer',
          borderRadius: '2px'
        }}
      />
    </div>
  );
};
