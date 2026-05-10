/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { useForgeStore } from '../../utlis/store/useForgeStore';
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

  const [irAddress, setIrAddress] = React.useState('0');
  const [irCommand, setIrCommand] = React.useState('162');

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
        updateNodeData(selectedNode!.id, { [config.key]: val });
      } else {
        updateNodeData(selectedNode!.id, {
          sensorValues: { ...currentValues, [config.key]: val }
        });
      }

      // Proactively notify engine if it's an analog input
      if (isAnalogSensor && selectedNode?.id) {
        import('../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => {
          circuitEngine.pushInputSignal(selectedNode.id, 'SIG', true);
        });
      }
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--lp-zinc-800)', padding: '4px 10px', borderRadius: '2px', border: '1px solid var(--lp-border)' }}>
        <Sliders size={12} style={{ color: 'var(--lp-zinc-600)' }} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--lp-zinc-400)', textTransform: 'uppercase', minWidth: '60px' }}>{config.label}</span>
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.min < 1 ? 0.01 : 1}
          value={currentValue}
          onChange={handleSliderChange}
          style={{ width: '100px', accentColor: 'var(--lp-accent-primary)' }}
        />
        <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--lp-accent-primary)', fontFamily: "'Space Mono', monospace", minWidth: '40px' }}>
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
    { name: 'White', color: '#ffffff' },
  ];

  const LED_COLORS = [
    { name: 'Red', color: 'red' },
    { name: 'Green', color: '#10b981' },
    { name: 'Blue', color: '#3b82f6' },
    { name: 'Yellow', color: '#eab308' },
    { name: 'White', color: '#ffffff' },
  ];

  const renderLEDColorPalette = () => {
    if (nodeType !== 'led' && nodeType !== 'led-ring' && nodeType !== 'led-bar-graph') return null;
    return (
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'var(--lp-zinc-800)', padding: '4px 10px', borderRadius: '2px', border: '1px solid var(--lp-border)' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--lp-zinc-400)', textTransform: 'uppercase', marginRight: '4px' }}>LED_COLOR</span>
        {LED_COLORS.map((lc) => (
          <button
            key={lc.color}
            onClick={() => updateNodeData(selectedNode!.id, { color: lc.color })}
            title={lc.name}
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '1px',
              backgroundColor: lc.color,
              border: selectedNode?.data?.color === lc.color ? '2px solid var(--lp-accent-primary)' : '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              transition: 'all 0.1s',
            }}
          />
        ))}
      </div>
    );
  };

  const renderColorPalette = () => {
    if (!selectedEdge) return null;
    return (
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'var(--lp-zinc-800)', padding: '4px 10px', borderRadius: '2px', border: '1px solid var(--lp-border)' }}>
        {WIRE_COLORS.map((wc) => (
          <button
            key={wc.color}
            onClick={() => updateEdgeData(selectedEdge.id, { color: wc.color })}
            title={wc.name}
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: wc.color,
              border: selectedEdge.data?.color === wc.color ? '2px solid var(--lp-accent-primary)' : '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              transition: 'transform 0.1s',
            }}
          />
        ))}
      </div>
    );
  };

  const renderIRReceiverInput = () => {
    if (nodeType !== 'ir-receiver') return null;
    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--lp-zinc-800)', padding: '4px 10px', borderRadius: '2px', border: '1px solid var(--lp-border)' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--lp-zinc-400)', textTransform: 'uppercase' }}>ADDR</span>
        <input
          type="text"
          value={irAddress}
          onChange={(e) => setIrAddress(e.target.value)}
          title="IR Address (0-255)"
          style={{ width: '30px', background: 'var(--lp-dark-surface)', color: 'white', border: '1px solid var(--lp-border)', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', fontFamily: "'Space Mono', monospace", outline: 'none' }}
        />
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--lp-zinc-400)', textTransform: 'uppercase' }}>CMD</span>
        <input
          type="text"
          value={irCommand}
          onChange={(e) => setIrCommand(e.target.value)}
          title="IR Command (0-255)"
          style={{ width: '30px', background: 'var(--lp-dark-surface)', color: 'white', border: '1px solid var(--lp-border)', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', fontFamily: "'Space Mono', monospace", outline: 'none' }}
        />
        <button
          onClick={() => {
            const addr = parseInt(irAddress) || 0;
            const cmd = parseInt(irCommand) || 0;
            if (selectedNode?.id) {
              import('../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => {
                circuitEngine.sendIRSignalToReceiver(selectedNode.id, addr, cmd);
              });
            }
          }}
          style={{
            background: 'var(--lp-accent-primary)',
            color: 'black',
            border: 'none',
            padding: '2px 8px',
            borderRadius: '2px',
            fontSize: '9px',
            fontWeight: 900,
            cursor: 'pointer',
            textTransform: 'uppercase'
          }}
        >
          Send
        </button>
      </div>
    );
  };

  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      style={{
      position: 'absolute',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: 'var(--lp-dark-surface)',
      padding: '4px 12px',
      borderRadius: '2px',
      border: '1px solid var(--lp-border)',
      boxShadow: 'var(--lp-shadow)',
      animation: 'slideUp 0.2s ease-out'
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>

      {selectedNode ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid var(--lp-border)', paddingRight: '12px' }}>
            <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--lp-accent-primary)', letterSpacing: '1px' }}>
              UNIT::{selectedNode?.data?.type.replace(/-/g, '_').toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {renderSlider()}
            {renderLEDColorPalette()}
            {renderIRReceiverInput()}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid var(--lp-border)', paddingRight: '12px' }}>
            <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--lp-accent-primary)', letterSpacing: '1px' }}>
              WIRE_SPEC
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {renderColorPalette()}
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid var(--lp-border)' }}>
        <button
          onClick={handleDelete}
          title="REMOVE_ELEMENT"
          style={{
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid var(--lp-rose)',
            color: 'var(--lp-rose)',
            padding: '4px 8px',
            borderRadius: '2px',
            cursor: 'pointer',
            fontSize: '9px',
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s'
          }}
        >
          <Trash2 size={12} />
          DELETE
        </button>
      </div>
    </div>
  );
};
