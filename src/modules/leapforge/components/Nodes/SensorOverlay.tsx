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
    : type === 'resistor' ? { label: 'RESISTANCE', unit: 'Ω', min: 0, max: 1000000, key: 'value' } 
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
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <input 
            type="number" 
            value={currentValue}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              updateNodeData(nodeId, {
                sensorValues: {
                  ...currentValues,
                  [config.key]: val
                }
              });
              
              // Proactively push to simulation engine
              if (isAnalogSensor) {
                import('../../engine/CircuitEngine').then(({ circuitEngine }) => {
                  circuitEngine.pushInputSignal(nodeId, 'SIG', true); 
                });
              }
            }}
            style={{
              width: '80px',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px dotted rgba(190, 242, 100, 0.5)',
              color: '#BEF264',
              fontSize: '13px',
              fontWeight: 800,
              fontFamily: 'monospace',
              textAlign: 'right',
              outline: 'none',
              padding: '0 2px'
            }}
          />
          <span style={{ fontSize: '12px', color: '#BEF264', fontWeight: 800, fontFamily: 'monospace' }}>
            {config.unit}
          </span>
        </div>
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
