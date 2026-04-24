/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { useForgeStore } from '../store/useForgeStore';
import { Trash2, Settings2, Sliders } from 'lucide-react';

export const SelectionToolbar: React.FC = () => {
  const {
    selectedNodeId,
    selectedEdgeId,
    nodes,
    edges,
    removeNode,
    removeEdge,
    setSelectedNode,
    setSelectedEdge,
    updateNodeData,
    updateEdgeData
  } = useForgeStore();

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const selectedEdge = edges.find(e => e.id === selectedEdgeId);

  if (!selectedNode && !selectedEdge) return null;

  // Basic properties with defensive checks
  const nodeType = selectedNode?.data?.type;
  const currentValues = selectedNode?.data?.sensorValues;

  // --- Configuration Mapping (Standard Sensors) ---
  const isDistanceSensor = nodeType === 'hc-sr04';
  const isAnalogSensor = ['potentiometer', 'photoresistor', 'ntc-temperature-sensor', 'mq2', 'resistor'].includes(nodeType);
  const isBuzzer = nodeType === 'buzzer';

  const handleDelete = () => {
    if (selectedNodeId) {
      removeNode(selectedNodeId);
      setSelectedNode(null);
    } else if (selectedEdgeId) {
      removeEdge(selectedEdgeId);
      setSelectedEdge(null);
    }
  };

  const renderSlider = () => {
    if (!isDistanceSensor && !isAnalogSensor && !isBuzzer) return null;

    let config: any;
    if (isDistanceSensor) {
      config = { label: 'Distance', unit: 'cm', min: 2, max: 400, key: 'distance' };
    } else if (nodeType === 'potentiometer') {
      config = { label: 'Resistance', unit: '%', min: 0, max: 100, key: 'value' };
    } else if (nodeType === 'resistor') {
      config = { label: 'Resistance', unit: 'Ω', min: 0, max: 10000, key: 'value' };
    } else if (nodeType === 'photoresistor') {
      config = { label: 'Light', unit: 'lux', min: 0, max: 1000, key: 'value' };
    } else if (nodeType === 'ntc-temperature-sensor') {
      config = { label: 'Temp', unit: '°C', min: -40, max: 125, key: 'value' };
    } else if (isBuzzer) {
      config = { label: 'Volume', unit: '', min: 0.01, max: 1.0, key: 'volume', isTopLevel: true };
    } else {
      config = { label: 'Value', unit: '', min: 0, max: 1023, key: 'value' };
    }

    const currentValue = config.isTopLevel
      ? (selectedNode?.data?.[config.key] ?? config.min)
      : (currentValues?.[config.key] ?? config.min);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (config.isTopLevel) {
        updateNodeData(selectedNode.id, { [config.key]: val });
      } else {
        updateNodeData(selectedNode.id, {
          sensorValues: { ...currentValues, [config.key]: val }
        });
      }

      // Proactively notify engine if it's an analog input
      if (isAnalogSensor && selectedNode?.id) {
        import('../engine/CircuitEngine').then(({ circuitEngine }) => {
          circuitEngine.pushInputSignal(selectedNode.id, 'SIG', true);
        });
      }
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#1e293b', padding: '4px 12px', borderRadius: '8px', border: '1px solid #334155' }}>
        <Sliders size={14} className="text-slate-400" />
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', minWidth: '70px' }}>{config.label}</span>
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.min < 1 ? 0.01 : 1}
          value={currentValue}
          onChange={handleSliderChange}
          style={{ width: '120px', accentColor: '#BEF264' }}
        />
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#BEF264', fontFamily: 'monospace', minWidth: '50px' }}>
          {currentValue >= 1000 ? `${(currentValue / 1000).toFixed(1)}k` : currentValue.toString().slice(0, 5)} {config.unit}
        </span>
      </div>
    );
  };

  const WIRE_COLORS = [
    { name: 'Red', color: '#ef4444' },
    { name: 'Black', color: '#000000' },
    { name: 'Green', color: '#22c55e' },
    { name: 'Blue', color: '#3b82f6' },
    { name: 'Yellow', color: '#eab308' },
    { name: 'Orange', color: '#f59e0b' },
    { name: 'White', color: '#ffffff' },
    { name: 'Brown', color: '#78350f' },
  ];

  const renderColorPalette = () => {
    if (!selectedEdge) return null;
    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {WIRE_COLORS.map((wc) => (
          <button
            key={wc.color}
            onClick={() => updateEdgeData(selectedEdge.id, { color: wc.color })}
            title={wc.name}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: wc.color,
              border: selectedEdge.data?.color === wc.color ? '2px solid #bef264' : '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
              transition: 'transform 0.1s',
              boxShadow: wc.color === '#ffffff' ? 'inset 0 0 0 1px #ccc' : 'none'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          />
        ))}
      </div>
    );
  };

  return (
    <div style={{
      position: 'absolute',
      top: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(12px)',
      padding: '6px 16px',
      borderRadius: '16px',
      border: '1px solid rgba(186, 242, 100, 0.2)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translate(-50%, -20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>

      {selectedNode ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid #334155', paddingRight: '16px' }}>
            <Settings2 size={16} className="text-lime-400" />
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>
              {selectedNode?.data?.type.replace(/-/g, ' ').toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {renderSlider()}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid #334155', paddingRight: '16px' }}>
            <Settings2 size={16} className="text-lime-400" />
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>
              WIRE COLOR
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {renderColorPalette()}
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid #334155' }}>
        <button
          onClick={handleDelete}
          title="Delete Component"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '6px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.borderColor = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
          }}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};
