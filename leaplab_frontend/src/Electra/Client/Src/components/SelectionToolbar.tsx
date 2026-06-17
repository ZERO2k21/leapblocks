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
  const isAnalogSensor = ['potentiometer', 'slide-potentiometer', 'photoresistor', 'ntc-temperature-sensor', 'mq2', 'resistor'].includes(nodeType);
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
      config = { label: 'Distance', unit: 'cm', min: 2, max: 400, step: 0.1, default: 100, key: 'distance' };
    } else if (nodeType === 'potentiometer' || nodeType === 'slide-potentiometer') {
      config = { label: 'Resistance', unit: '', min: 0, max: 1023, step: 1, default: 0, key: 'value' };
    } else if (nodeType === 'resistor') {
      config = { label: 'Resistance', unit: 'Ω', min: 0, max: 1000000, step: 100, default: 1000, key: 'value' };
    } else if (nodeType === 'photoresistor') {
      config = { label: 'Light', unit: 'lux', min: 0, max: 1000, step: 1, default: 500, key: 'value' };
    } else if (nodeType === 'ntc-temperature-sensor') {
      config = { label: 'Temp', unit: '°C', min: -40, max: 125, step: 0.5, default: 25, key: 'value' };
    } else if (isBuzzer) {
      config = { label: 'Volume', unit: '', min: 0.01, max: 1.0, step: 0.01, default: 1.0, key: 'volume', isTopLevel: true };
    } else {
      config = { label: 'Value', unit: '', min: 0, max: 1023, step: 1, default: 512, key: 'value' };
    }

    const currentValue = config.isTopLevel
      ? (selectedNode?.data?.[config.key] ?? config.default ?? config.min)
      : (currentValues?.[config.key] ?? config.default ?? config.min);

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
          const pinName = nodeType === 'ntc-temperature-sensor' ? 'OUT'
            : (nodeType === 'photoresistor' || nodeType === 'photoresistor-sensor') ? 'AO'
              : (nodeType === 'potentiometer' || nodeType === 'slide-potentiometer') ? 'SIG'
                : 'OUT';
          circuitEngine.pushInputSignal(selectedNode.id, pinName, true);
        });
      }
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--lp-zinc-800)', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--lp-border)', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
        <Sliders size={12} style={{ color: 'var(--lp-zinc-600)' }} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--lp-zinc-400)', textTransform: 'uppercase', minWidth: '60px' }}>{config.label}</span>
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step ?? (config.min < 1 ? 0.01 : 1)}
          value={currentValue}
          onChange={handleSliderChange}
          style={{ width: '100px', accentColor: 'var(--lp-accent-primary)' }}
        />
        <input
          type="number"
          value={currentValue}
          min={config.min}
          max={config.max}
          step={config.step ?? (config.min < 1 ? 0.01 : 1)}
          onChange={handleSliderChange}
          style={{
            width: '65px',
            background: 'var(--lp-zinc-900)',
            border: '1px solid var(--lp-border)',
            borderRadius: '4px',
            padding: '2px 4px',
            fontSize: '10px',
            color: 'var(--lp-accent-primary)',
            fontWeight: 900,
            fontFamily: "'Space Mono', monospace",
            textAlign: 'right',
            outline: 'none',
          }}
        />
        {config.unit && (
          <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--lp-accent-primary)', fontFamily: "'Space Mono', monospace" }}>
            {config.unit}
          </span>
        )}
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
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'var(--lp-zinc-800)', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--lp-border)', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
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
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--lp-text-color)', textTransform: 'uppercase' }}>ADDR</span>
        <input
          type="text"
          value={irAddress}
          onChange={(e) => setIrAddress(e.target.value)}
          title="IR Address (0-255)"
          style={{ width: '30px', background: 'var(--lp-dark-surface)', color: 'var(--lp-text-color)', border: '1px solid var(--lp-border)', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', fontFamily: "'Space Mono', monospace", outline: 'none' }}
        />
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--lp-text-color)', textTransform: 'uppercase' }}>CMD</span>
        <input
          type="text"
          value={irCommand}
          onChange={(e) => setIrCommand(e.target.value)}
          title="IR Command (0-255)"
          style={{ width: '30px', background: 'var(--lp-dark-surface)', color: 'var(--lp-text-color)', border: '1px solid var(--lp-border)', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', fontFamily: "'Space Mono', monospace", outline: 'none' }}
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
            color: 'var(--lp-text-color)',
            border: 'none',
            padding: '2px 8px',
                    borderRadius: '8px',
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

  const renderStepperControls = () => {
    if (nodeType !== 'stepper-motor' && nodeType !== 'stepperMotor') return null;

    const currentSize = selectedNode?.data?.size ?? '23';
    const currentDisplay = selectedNode?.data?.display ?? 'steps';
    const currentGearRatio = selectedNode?.data?.gearRatio ?? '1:1';
    const currentArrow = selectedNode?.data?.arrow ?? '';

    const sizes = ['8', '11', '14', '17', '23', '34'];
    const displays = [
      { value: 'steps', label: 'Steps' },
      { value: 'angle', label: 'Angle' },
      { value: 'none', label: 'None' }
    ];
    const gearRatios = ['1:1', '2:1', '2048:200', '64:1', '10:1', '100:1'];
    const arrowColors = [
      { value: '', label: 'Dynamic (Orange)' },
      { value: 'none', label: 'None (Hidden)' },
      { value: 'orange', label: 'Orange' },
      { value: 'white', label: 'White' },
      { value: 'green', label: 'Green' },
      { value: 'blue', label: 'Blue' },
      { value: 'yellow', label: 'Yellow' },
      { value: 'red', label: 'Red' }
    ];

    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--lp-zinc-800)', padding: '4px 10px', borderRadius: '2px', border: '1px solid var(--lp-border)' }}>
        {/* Size Selector */}
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--lp-zinc-400)' }}>SIZE</span>
        <select
          value={currentSize}
          onChange={(e) => updateNodeData(selectedNode!.id, { size: parseInt(e.target.value) || 23 })}
          style={{ background: 'var(--lp-dark-surface)', color: 'var(--lp-text-color)', border: '1px solid var(--lp-border)', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', fontFamily: "'Space Mono', monospace", outline: 'none' }}
        >
          {sizes.map(s => <option key={s} value={s}>NEMA {s}</option>)}
        </select>

        {/* Display Selector */}
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--lp-zinc-400)', marginLeft: '6px' }}>DISP</span>
        <select
          value={currentDisplay}
          onChange={(e) => updateNodeData(selectedNode!.id, { display: e.target.value })}
          style={{ background: 'var(--lp-dark-surface)', color: 'var(--lp-text-color)', border: '1px solid var(--lp-border)', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', fontFamily: "'Space Mono', monospace", outline: 'none' }}
        >
          {displays.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>

        {/* Gear Ratio Selector */}
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--lp-zinc-400)', marginLeft: '6px' }}>GEAR</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <select
            value={gearRatios.includes(currentGearRatio) ? currentGearRatio : 'custom'}
            onChange={(e) => {
              if (e.target.value !== 'custom') {
                updateNodeData(selectedNode!.id, { gearRatio: e.target.value });
              }
            }}
            style={{ background: 'var(--lp-dark-surface)', color: 'var(--lp-text-color)', border: '1px solid var(--lp-border)', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', fontFamily: "'Space Mono', monospace", outline: 'none' }}
          >
            {gearRatios.map(g => <option key={g} value={g}>{g}</option>)}
            {!gearRatios.includes(currentGearRatio) && <option value={currentGearRatio}>{currentGearRatio} (Custom)</option>}
            <option value="custom">Custom...</option>
          </select>
          
          {(!gearRatios.includes(currentGearRatio) || currentGearRatio === 'custom') && (
            <input
              type="text"
              placeholder="e.g. 5:1"
              value={currentGearRatio === 'custom' ? '' : currentGearRatio}
              onChange={(e) => updateNodeData(selectedNode!.id, { gearRatio: e.target.value })}
              style={{ width: '50px', background: 'var(--lp-dark-surface)', color: 'var(--lp-text-color)', border: '1px solid var(--lp-border)', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', fontFamily: "'Space Mono', monospace", outline: 'none' }}
            />
          )}
        </div>

        {/* Arrow Color Selector */}
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--lp-zinc-400)', marginLeft: '6px' }}>ARROW</span>
        <select
          value={currentArrow}
          onChange={(e) => updateNodeData(selectedNode!.id, { arrow: e.target.value })}
          style={{ background: 'var(--lp-dark-surface)', color: 'var(--lp-text-color)', border: '1px solid var(--lp-border)', borderRadius: '2px', padding: '2px 4px', fontSize: '10px', fontFamily: "'Space Mono', monospace", outline: 'none' }}
        >
          {arrowColors.map(ac => <option key={ac.value} value={ac.value}>{ac.label}</option>)}
        </select>
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
      background: 'var(--lp-glass)',
      padding: '6px 16px',
      borderRadius: '12px',
      border: '1px solid var(--lp-border-active)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(34, 211, 238, 0.1)',
      backdropFilter: 'blur(12px)',
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
            {renderStepperControls()}
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

      {/* Hide delete for board elements — they are essential */}
      {!(selectedNode && ['esp32-c3', 'esp32', 'arduino-uno'].includes(nodeType)) && (
        <div style={{ display: 'flex', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid var(--lp-border)' }}>
          <button
            onClick={handleDelete}
            title="REMOVE_ELEMENT"
            style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid var(--lp-rose)',
              color: 'var(--lp-rose)',
              padding: '4px 8px',
                      borderRadius: '8px',
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
      )}
    </div>
  );
};
