/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { useForgeStore } from '../../store/useForgeStore';

interface SensorOverlayProps {
  nodeId: string;
  type: string;
  currentValues: any;
}

// ── Single-value slider row ───────────────────────────────────────────────────
interface SliderRowProps {
  label: string;
  unit: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  color?: string;
  onChange: (v: number) => void;
}

const SliderRow: React.FC<SliderRowProps> = ({ label, unit, min, max, step = 1, value, color = '#BEF264', onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'system-ui' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          style={{
            width: '56px',
            background: 'transparent',
            border: 'none',
            borderBottom: `1px dotted ${color}80`,
            color,
            fontSize: '13px',
            fontWeight: 800,
            fontFamily: 'monospace',
            textAlign: 'right',
            outline: 'none',
            padding: '0 2px',
          }}
        />
        <span style={{ fontSize: '11px', color, fontWeight: 800, fontFamily: 'monospace' }}>{unit}</span>
      </div>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      style={{ width: '100%', accentColor: color, height: '4px', cursor: 'pointer', borderRadius: '2px' }}
    />
  </div>
);

// ── Main overlay ──────────────────────────────────────────────────────────────
export const SensorOverlay: React.FC<SensorOverlayProps> = ({ nodeId, type, currentValues }) => {
  const updateNodeData = useForgeStore(state => state.updateNodeData);

  const isDHT       = type === 'dht22' || type === 'dht11';
  const isDistance  = type === 'hc-sr04';
  const isAnalog    = ['potentiometer', 'photoresistor', 'ntc-temperature-sensor', 'mq2', 'resistor'].includes(type);
  const isPIR       = type === 'pir-motion-sensor';
  const isMPU6050   = type === 'mpu6050';

  if (!isDHT && !isDistance && !isAnalog && !isPIR && !isMPU6050) return null;

  // ── DHT: two sliders ─────────────────────────────────────────────────────
  if (isDHT) {
    const temp     = currentValues?.temperature ?? 25;
    const humidity = currentValues?.humidity    ?? 50;

    const update = (key: 'temperature' | 'humidity', val: number) => {
      updateNodeData(nodeId, {
        sensorValues: { ...currentValues, [key]: val },
      });
    };

    return (
      <div
        onPointerDown={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        className="nodrag nopan"
        style={{
          position: 'absolute',
          bottom: '-130px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(186, 242, 100, 0.3)',
          borderRadius: '12px',
          padding: '12px 14px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Header */}
        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, letterSpacing: '0.08em', textAlign: 'center', fontFamily: 'system-ui' }}>
          {type.toUpperCase()} SENSOR
        </div>

        <SliderRow
          label="TEMPERATURE"
          unit="°C"
          min={type === 'dht11' ? 0 : -40}
          max={type === 'dht11' ? 50 : 80}
          step={0.1}
          value={temp}
          color="#f97316"
          onChange={v => update('temperature', v)}
        />

        <SliderRow
          label="HUMIDITY"
          unit="%"
          min={0}
          max={100}
          step={1}
          value={humidity}
          color="#38bdf8"
          onChange={v => update('humidity', v)}
        />
      </div>
    );
  }

  // ── PIR Motion Sensor: toggle button ────────────────────────────────────
  if (isPIR) {
    const motionDetected = currentValues?.motionDetected ?? false;

    const toggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const next = !motionDetected;
      // 1. Update the store so the visual element re-renders
      updateNodeData(nodeId, {
        sensorValues: { ...currentValues, motionDetected: next },
      });
      // 2. Inject the OUT pin signal directly into the AVR simulation
      import('../../engine/CircuitEngine').then(({ circuitEngine }) => {
        circuitEngine.pushInputSignal(nodeId, 'OUT', next);
      });
    };

    return (
      <div
        onPointerDown={e => e.stopPropagation()}
        onPointerUp={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        className="nodrag nopan"
        style={{
          position: 'absolute',
          bottom: '-90px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '170px',
          background: 'rgba(15, 23, 42, 0.97)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${motionDetected ? 'rgba(74,222,128,0.5)' : 'rgba(186,242,100,0.3)'}`,
          borderRadius: '12px',
          padding: '10px 14px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'center',
          userSelect: 'none',
        }}
      >
        <div style={{
          fontSize: '10px',
          color: '#64748b',
          fontWeight: 800,
          letterSpacing: '0.08em',
          fontFamily: 'system-ui',
        }}>
          PIR SENSOR
        </div>

        {/* Status indicator dot */}
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: motionDetected ? '#4ade80' : '#475569',
          boxShadow: motionDetected ? '0 0 8px rgba(74,222,128,0.8)' : 'none',
          transition: 'all 0.2s',
        }} />

        <button
          onPointerDown={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onClick={toggle}
          style={{
            width: '100%',
            padding: '8px 0',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '11px',
            fontFamily: 'monospace',
            letterSpacing: '0.05em',
            transition: 'all 0.2s',
            background: motionDetected
              ? 'rgba(74, 222, 128, 0.9)'
              : 'rgba(51, 65, 85, 0.9)',
            color: motionDetected ? '#0f172a' : '#94a3b8',
            boxShadow: motionDetected
              ? '0 0 12px rgba(74,222,128,0.4)'
              : 'none',
          }}
        >
          {motionDetected ? '● MOTION DETECTED' : '○ TRIGGER MOTION'}
        </button>
      </div>
    );
  }

  // ── MPU6050 — 7 sliders (accel X/Y/Z, gyro X/Y/Z, temp) ────────────────
  if (isMPU6050) {
    const sv = currentValues ?? {};
    const accelX = sv.accelX ?? 0;
    const accelY = sv.accelY ?? 0;
    const accelZ = sv.accelZ ?? 1;
    const gyroX  = sv.gyroX  ?? 0;
    const gyroY  = sv.gyroY  ?? 0;
    const gyroZ  = sv.gyroZ  ?? 0;
    const temp   = sv.temp   ?? 25;

    const update = (key: string, val: number) => {
      const next = { accelX, accelY, accelZ, gyroX, gyroY, gyroZ, temp, [key]: val };
      updateNodeData(nodeId, { sensorValues: next });
      // Push live into the I2C emulator
      import('../../engine/CircuitEngine').then(({ circuitEngine }) => {
        circuitEngine.pushMPU6050Values(nodeId, next);
      });
    };

    return (
      <div
        onPointerDown={e => e.stopPropagation()}
        onPointerUp={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        className="nodrag nopan"
        style={{
          position: 'absolute',
          bottom: '-340px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '220px',
          background: 'rgba(15, 23, 42, 0.97)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(186, 242, 100, 0.3)',
          borderRadius: '12px',
          padding: '12px 14px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          userSelect: 'none',
        }}
      >
        {/* Header */}
        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, letterSpacing: '0.08em', textAlign: 'center', fontFamily: 'system-ui' }}>
          MPU-6050 IMU
        </div>

        {/* Accelerometer group */}
        <div style={{ fontSize: '9px', color: '#38bdf8', fontWeight: 800, letterSpacing: '0.06em', fontFamily: 'system-ui', borderBottom: '1px solid rgba(56,189,248,0.2)', paddingBottom: '2px' }}>
          ACCELEROMETER (g)
        </div>
        <SliderRow label="ACCEL X" unit="g"   min={-2}   max={2}   step={0.01} value={accelX} color="#38bdf8" onChange={v => update('accelX', v)} />
        <SliderRow label="ACCEL Y" unit="g"   min={-2}   max={2}   step={0.01} value={accelY} color="#38bdf8" onChange={v => update('accelY', v)} />
        <SliderRow label="ACCEL Z" unit="g"   min={-2}   max={2}   step={0.01} value={accelZ} color="#38bdf8" onChange={v => update('accelZ', v)} />

        {/* Gyroscope group */}
        <div style={{ fontSize: '9px', color: '#a78bfa', fontWeight: 800, letterSpacing: '0.06em', fontFamily: 'system-ui', borderBottom: '1px solid rgba(167,139,250,0.2)', paddingBottom: '2px' }}>
          GYROSCOPE (°/s)
        </div>
        <SliderRow label="GYRO X"  unit="°/s" min={-250} max={250} step={1}    value={gyroX}  color="#a78bfa" onChange={v => update('gyroX',  v)} />
        <SliderRow label="GYRO Y"  unit="°/s" min={-250} max={250} step={1}    value={gyroY}  color="#a78bfa" onChange={v => update('gyroY',  v)} />
        <SliderRow label="GYRO Z"  unit="°/s" min={-250} max={250} step={1}    value={gyroZ}  color="#a78bfa" onChange={v => update('gyroZ',  v)} />

        {/* Temperature */}
        <div style={{ fontSize: '9px', color: '#f97316', fontWeight: 800, letterSpacing: '0.06em', fontFamily: 'system-ui', borderBottom: '1px solid rgba(249,115,22,0.2)', paddingBottom: '2px' }}>
          TEMPERATURE
        </div>
        <SliderRow label="TEMP"    unit="°C"  min={-40}  max={85}  step={0.1}  value={temp}   color="#f97316" onChange={v => update('temp',   v)} />
      </div>
    );
  }

  // ── Single-value sensors ─────────────────────────────────────────────────
  const config = isDistance
    ? { label: 'DISTANCE', unit: 'cm',  min: 2,   max: 400,     step: 1,   key: 'distance', color: '#BEF264' }
    : type === 'potentiometer'
    ? { label: 'POSITION',  unit: '%',   min: 0,   max: 100,     step: 1,   key: 'value',    color: '#BEF264' }
    : type === 'resistor'
    ? { label: 'RESISTANCE',unit: 'Ω',   min: 0,   max: 1000000, step: 100, key: 'value',    color: '#BEF264' }
    : type === 'photoresistor'
    ? { label: 'LIGHT',     unit: 'lux', min: 0,   max: 1000,    step: 1,   key: 'value',    color: '#fbbf24' }
    : type === 'ntc-temperature-sensor'
    ? { label: 'TEMP',      unit: '°C',  min: -40, max: 125,     step: 0.1, key: 'value',    color: '#f97316' }
    : { label: 'VALUE',     unit: '',    min: 0,   max: 1023,    step: 1,   key: 'value',    color: '#BEF264' };

  const currentValue = currentValues?.[config.key] ?? config.min;

  const handleChange = (val: number) => {
    updateNodeData(nodeId, {
      sensorValues: { ...currentValues, [config.key]: val },
    });
    if (isAnalog) {
      import('../../engine/CircuitEngine').then(({ circuitEngine }) => {
        circuitEngine.pushInputSignal(nodeId, 'SIG', true);
      });
    }
  };

  return (
    <div
      onPointerDown={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
      className="nodrag nopan"
      style={{
        position: 'absolute',
        bottom: '-80px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '190px',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(186, 242, 100, 0.3)',
        borderRadius: '12px',
        padding: '10px 14px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <SliderRow
        label={config.label}
        unit={config.unit}
        min={config.min}
        max={config.max}
        step={config.step}
        value={currentValue}
        color={config.color}
        onChange={handleChange}
      />
    </div>
  );
};
