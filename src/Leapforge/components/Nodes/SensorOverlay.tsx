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
  const isAnalog    = ['potentiometer', 'mq2', 'resistor'].includes(type);
  const isNTC       = type === 'ntc-temperature-sensor';
  const isPIR       = type === 'pir-motion-sensor';
  const isMPU6050   = type === 'mpu6050';
  const isLDR       = type === 'photoresistor-sensor';
  const isFlame     = type === 'flame-sensor';
  const isGas       = type === 'gas-sensor';
  const isHeartRate = type === 'heart-beat-sensor';
  const isBigSound  = type === 'big-sound-sensor' || type === 'small-sound-sensor';
  const isHX711     = type === 'hx711';

  if (!isDHT && !isDistance && !isAnalog && !isNTC && !isPIR && !isMPU6050 && !isLDR && !isFlame && !isGas && !isHeartRate && !isBigSound && !isHX711) return null;

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

  // ── NTC Temperature Sensor ───────────────────────────────────────────────
  if (isNTC) {
    const tempC = currentValues?.value ?? 25;

    // NTC voltage-divider formula (same as CircuitEngine) — shown live in the overlay
    const R0 = 10000, B = 3950, T0 = 298.15, Rs = 10000, VCC = 5.0;
    const T = tempC + 273.15;
    const R_ntc = R0 * Math.exp(B * (1 / T - 1 / T0));
    const voltage = VCC * R_ntc / (Rs + R_ntc);
    const adcRaw  = Math.round((voltage / VCC) * 1023);

    const handleChange = (val: number) => {
      updateNodeData(nodeId, { sensorValues: { ...currentValues, value: val } });
      import('../../engine/CircuitEngine').then(({ circuitEngine }) => {
        circuitEngine.pushInputSignal(nodeId, 'OUT', true);
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
          bottom: '-140px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          background: 'rgba(15, 23, 42, 0.97)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(249,115,22,0.4)',
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
          NTC THERMISTOR
        </div>

        <SliderRow
          label="TEMPERATURE"
          unit="°C"
          min={-40}
          max={125}
          step={0.5}
          value={tempC}
          color="#f97316"
          onChange={handleChange}
        />

        {/* Live readout row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'monospace', fontWeight: 700 }}>
          <span style={{ color: '#64748b' }}>V<sub>out</sub></span>
          <span style={{ color: '#bef264' }}>{voltage.toFixed(3)} V</span>
          <span style={{ color: '#64748b' }}>ADC</span>
          <span style={{ color: '#bef264' }}>{adcRaw}</span>
        </div>
      </div>
    );
  }

  // ── Photoresistor (LDR) Sensor ──────────────────────────────────────────
  if (isLDR) {
    const lux       = Number(currentValues?.value     ?? 500);
    const threshold = Number(currentValues?.threshold ?? 500);

    // Live voltage + ADC calculation (LDR voltage-divider model)
    const R_ldr    = 500000 / Math.max(1, lux);
    const R_series = 10000;
    const voltage  = 5.0 * R_series / (R_ldr + R_series);
    const adcRaw   = Math.round((voltage / 5.0) * 1023);
    const doLow    = lux < threshold; // DO is active-LOW

    const handleChange = (key: 'value' | 'threshold', val: number) => {
      const next = { ...currentValues, [key]: val };
      updateNodeData(nodeId, { sensorValues: next });
      import('../../engine/CircuitEngine').then(({ circuitEngine }) => {
        // AO — analog output
        circuitEngine.pushInputSignal(nodeId, 'AO', true);
        // DO — digital output (active-LOW: LOW when dark, HIGH when bright)
        const doIsLow = (key === 'value' ? val : lux) < (key === 'threshold' ? val : threshold);
        circuitEngine.pushInputSignal(nodeId, 'DO', !doIsLow);
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
          bottom: '-185px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '210px',
          background: 'rgba(15, 23, 42, 0.97)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(251,191,36,0.4)',
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
          PHOTORESISTOR (LDR)
        </div>

        <SliderRow
          label="LIGHT LEVEL"
          unit="lux"
          min={0}
          max={1000}
          step={1}
          value={lux}
          color="#fbbf24"
          onChange={v => handleChange('value', v)}
        />

        <SliderRow
          label="DO THRESHOLD"
          unit="lux"
          min={0}
          max={1000}
          step={1}
          value={threshold}
          color="#94a3b8"
          onChange={v => handleChange('threshold', v)}
        />

        {/* Live readout */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, flexWrap: 'wrap', gap: '4px' }}>
          <span style={{ color: '#64748b' }}>AO</span>
          <span style={{ color: '#bef264' }}>{voltage.toFixed(3)} V</span>
          <span style={{ color: '#64748b' }}>ADC</span>
          <span style={{ color: '#bef264' }}>{adcRaw}</span>
          <span style={{ color: '#64748b' }}>DO</span>
          <span style={{ color: doLow ? '#ef4444' : '#4ade80', fontWeight: 900 }}>
            {doLow ? 'LOW ●' : 'HIGH ○'}
          </span>
        </div>
      </div>
    );
  }

  // ── Flame Sensor ────────────────────────────────────────────────────────
  if (isFlame) {
    const intensity = Number(currentValues?.value     ?? 0);
    const threshold = Number(currentValues?.threshold ?? 50);
    const flameOn   = intensity > threshold;
    const voltage   = 5.0 * (1 - intensity / 100);
    const adcRaw    = Math.round((voltage / 5.0) * 1023);

    const handleChange = (key: 'value' | 'threshold', val: number) => {
      const next = { ...currentValues, [key]: val };
      updateNodeData(nodeId, { sensorValues: next });
      import('../../engine/CircuitEngine').then(({ circuitEngine }) => {
        circuitEngine.pushInputSignal(nodeId, 'AOUT', true);
        const nowFlame = (key === 'value' ? val : intensity) > (key === 'threshold' ? val : threshold);
        circuitEngine.pushInputSignal(nodeId, 'DOUT', !nowFlame); // DOUT active-LOW
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
          bottom: '-185px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '210px',
          background: 'rgba(15, 23, 42, 0.97)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${flameOn ? 'rgba(249,115,22,0.6)' : 'rgba(186,242,100,0.3)'}`,
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
          FLAME SENSOR
        </div>

        {/* Flame status indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '6px',
          borderRadius: '8px',
          background: flameOn ? 'rgba(249,115,22,0.15)' : 'rgba(51,65,85,0.4)',
          border: `1px solid ${flameOn ? 'rgba(249,115,22,0.4)' : 'rgba(100,116,139,0.2)'}`,
          transition: 'all 0.3s',
        }}>
          <span style={{ fontSize: '18px' }}>{flameOn ? '🔥' : '💧'}</span>
          <span style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'monospace', color: flameOn ? '#f97316' : '#64748b' }}>
            {flameOn ? 'FLAME DETECTED' : 'NO FLAME'}
          </span>
        </div>

        <SliderRow
          label="FLAME INTENSITY"
          unit="%"
          min={0}
          max={100}
          step={1}
          value={intensity}
          color="#f97316"
          onChange={v => handleChange('value', v)}
        />

        <SliderRow
          label="DOUT THRESHOLD"
          unit="%"
          min={0}
          max={100}
          step={1}
          value={threshold}
          color="#94a3b8"
          onChange={v => handleChange('threshold', v)}
        />

        {/* Live readout */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, flexWrap: 'wrap', gap: '4px' }}>
          <span style={{ color: '#64748b' }}>AOUT</span>
          <span style={{ color: '#bef264' }}>{voltage.toFixed(3)} V</span>
          <span style={{ color: '#64748b' }}>ADC</span>
          <span style={{ color: '#bef264' }}>{adcRaw}</span>
          <span style={{ color: '#64748b' }}>DOUT</span>
          <span style={{ color: flameOn ? '#ef4444' : '#4ade80', fontWeight: 900 }}>
            {flameOn ? 'LOW ●' : 'HIGH ○'}
          </span>
        </div>
      </div>
    );
  }

  // ── Gas Sensor (MQ-series) ───────────────────────────────────────────────
  if (isGas) {
    const concentration = Number(currentValues?.value     ?? 0);
    const threshold     = Number(currentValues?.threshold ?? 50);
    const gasDetected   = concentration > threshold;
    const voltage       = 5.0 * concentration / 100;
    const adcRaw        = Math.round((voltage / 5.0) * 1023);

    const handleChange = (key: 'value' | 'threshold', val: number) => {
      const next = { ...currentValues, [key]: val };
      updateNodeData(nodeId, { sensorValues: next });
      import('../../engine/CircuitEngine').then(({ circuitEngine }) => {
        circuitEngine.pushInputSignal(nodeId, 'AOUT', true);
        const nowGas = (key === 'value' ? val : concentration) > (key === 'threshold' ? val : threshold);
        circuitEngine.pushInputSignal(nodeId, 'DOUT', !nowGas); // DOUT active-LOW
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
          bottom: '-185px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '210px',
          background: 'rgba(15, 23, 42, 0.97)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${gasDetected ? 'rgba(251,146,60,0.6)' : 'rgba(186,242,100,0.3)'}`,
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
          GAS SENSOR (MQ)
        </div>

        {/* Gas status indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '6px',
          borderRadius: '8px',
          background: gasDetected ? 'rgba(251,146,60,0.15)' : 'rgba(51,65,85,0.4)',
          border: `1px solid ${gasDetected ? 'rgba(251,146,60,0.4)' : 'rgba(100,116,139,0.2)'}`,
          transition: 'all 0.3s',
        }}>
          <span style={{ fontSize: '18px' }}>{gasDetected ? '☁️' : '✅'}</span>
          <span style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'monospace', color: gasDetected ? '#fb923c' : '#64748b' }}>
            {gasDetected ? 'GAS DETECTED' : 'CLEAN AIR'}
          </span>
        </div>

        <SliderRow
          label="GAS CONCENTRATION"
          unit="%"
          min={0}
          max={100}
          step={1}
          value={concentration}
          color="#fb923c"
          onChange={v => handleChange('value', v)}
        />

        <SliderRow
          label="DOUT THRESHOLD"
          unit="%"
          min={0}
          max={100}
          step={1}
          value={threshold}
          color="#94a3b8"
          onChange={v => handleChange('threshold', v)}
        />

        {/* Live readout */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, flexWrap: 'wrap', gap: '4px' }}>
          <span style={{ color: '#64748b' }}>AOUT</span>
          <span style={{ color: '#bef264' }}>{voltage.toFixed(3)} V</span>
          <span style={{ color: '#64748b' }}>ADC</span>
          <span style={{ color: '#bef264' }}>{adcRaw}</span>
          <span style={{ color: '#64748b' }}>DOUT</span>
          <span style={{ color: gasDetected ? '#ef4444' : '#4ade80', fontWeight: 900 }}>
            {gasDetected ? 'LOW ●' : 'HIGH ○'}
          </span>
        </div>
      </div>
    );
  }

  // ── Heart Rate Sensor ────────────────────────────────────────────────────
  if (isHeartRate) {
    const bpm     = Number(currentValues?.bpm      ?? 72);
    const liveADC = Number(currentValues?.adcValue ?? 512);

    // Derived values for display
    const beatIntervalMs = Math.round(60000 / bpm);
    const liveVoltage    = ((liveADC / 1023) * 5.0).toFixed(2);

    const handleChange = (val: number) => {
      updateNodeData(nodeId, { sensorValues: { ...currentValues, bpm: val } });
      // CircuitEngine picks up the new BPM from sensorValues on next tick
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
          bottom: '-155px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '210px',
          background: 'rgba(15, 23, 42, 0.97)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(239,68,68,0.4)',
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
          HEART RATE SENSOR
        </div>

        {/* BPM indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '6px',
          borderRadius: '8px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
        }}>
          <span style={{ fontSize: '20px' }}>❤️</span>
          <span style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'monospace', color: '#ef4444' }}>
            {bpm}
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>BPM</span>
        </div>

        <SliderRow
          label="HEART RATE"
          unit="BPM"
          min={20}
          max={200}
          step={1}
          value={bpm}
          color="#ef4444"
          onChange={handleChange}
        />

        {/* Live readout — matches Serial.println(analogRead(A0)) output */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, flexWrap: 'wrap', gap: '4px' }}>
          <span style={{ color: '#64748b' }}>analogRead</span>
          <span style={{ color: liveADC > 650 ? '#ef4444' : '#bef264', fontWeight: 900 }}>{liveADC}</span>
          <span style={{ color: '#64748b' }}>V</span>
          <span style={{ color: '#bef264' }}>{liveVoltage}</span>
          <span style={{ color: '#64748b' }}>interval</span>
          <span style={{ color: '#bef264' }}>{beatIntervalMs}ms</span>
        </div>
      </div>
    );
  }

  // ── Big Sound Sensor ─────────────────────────────────────────────────────
  if (isBigSound) {
    const level     = Number(currentValues?.value     ?? 0);
    const threshold = Number(currentValues?.threshold ?? 50);
    const soundOn   = level > threshold;
    const voltage   = 5.0 * level / 100;
    const adcRaw    = Math.round((voltage / 5.0) * 1023);

    const handleChange = (key: 'value' | 'threshold', val: number) => {
      const next = { ...currentValues, [key]: val };
      updateNodeData(nodeId, { sensorValues: next });
      import('../../engine/CircuitEngine').then(({ circuitEngine }) => {
        circuitEngine.pushInputSignal(nodeId, 'AOUT', true);
        const nowSound = (key === 'value' ? val : level) > (key === 'threshold' ? val : threshold);
        circuitEngine.pushInputSignal(nodeId, 'DOUT', !nowSound); // DOUT active-LOW
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
          bottom: '-185px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '210px',
          background: 'rgba(15, 23, 42, 0.97)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${soundOn ? 'rgba(251,146,60,0.6)' : 'rgba(186,242,100,0.3)'}`,
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
          {type === 'small-sound-sensor' ? 'SMALL SOUND SENSOR' : 'SOUND SENSOR'}
        </div>

        {/* Sound status indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '6px',
          borderRadius: '8px',
          background: soundOn ? 'rgba(251,146,60,0.15)' : 'rgba(51,65,85,0.4)',
          border: `1px solid ${soundOn ? 'rgba(251,146,60,0.4)' : 'rgba(100,116,139,0.2)'}`,
          transition: 'all 0.3s',
        }}>
          <span style={{ fontSize: '18px' }}>{soundOn ? '🔊' : '🔇'}</span>
          <span style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'monospace', color: soundOn ? '#fb923c' : '#64748b' }}>
            {soundOn ? 'SOUND DETECTED' : 'SILENT'}
          </span>
        </div>

        <SliderRow
          label="SOUND LEVEL"
          unit="%"
          min={0}
          max={100}
          step={1}
          value={level}
          color="#fb923c"
          onChange={v => handleChange('value', v)}
        />

        <SliderRow
          label="DOUT THRESHOLD"
          unit="%"
          min={0}
          max={100}
          step={1}
          value={threshold}
          color="#94a3b8"
          onChange={v => handleChange('threshold', v)}
        />

        {/* Live readout */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, flexWrap: 'wrap', gap: '4px' }}>
          <span style={{ color: '#64748b' }}>AOUT</span>
          <span style={{ color: '#bef264' }}>{voltage.toFixed(3)} V</span>
          <span style={{ color: '#64748b' }}>ADC</span>
          <span style={{ color: '#bef264' }}>{adcRaw}</span>
          <span style={{ color: '#64748b' }}>DOUT</span>
          <span style={{ color: soundOn ? '#ef4444' : '#4ade80', fontWeight: 900 }}>
            {soundOn ? 'LOW ●' : 'HIGH ○'}
          </span>
        </div>
      </div>
    );
  }

  // ── HX711 Load Cell Amplifier ────────────────────────────────────────────
  if (isHX711) {
    const weight    = Number(currentValues?.weight    ?? 0);
    const maxWeight = Number(currentValues?.maxWeight ?? 5000);
    const weightKg  = (weight / 1000).toFixed(3);
    const rawValue  = Math.round((weight / maxWeight) * 8388607);
    const pct       = Math.round((weight / maxWeight) * 100);

    const handleWeightChange = (val: number) => {
      updateNodeData(nodeId, { sensorValues: { ...currentValues, weight: val } });
    };
    const handleMaxChange = (val: number) => {
      updateNodeData(nodeId, { sensorValues: { ...currentValues, maxWeight: val } });
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
          bottom: '-165px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '220px',
          background: 'rgba(15, 23, 42, 0.97)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(186,242,100,0.3)',
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
          HX711 LOAD CELL AMP
        </div>

        {/* Weight display */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '6px',
          borderRadius: '8px',
          background: 'rgba(190,242,100,0.08)',
          border: '1px solid rgba(190,242,100,0.2)',
        }}>
          <span style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'monospace', color: '#bef264' }}>
            {weightKg}
          </span>
          <span style={{ fontSize: '13px', color: '#94a3b8', fontFamily: 'monospace' }}>kg</span>
          <span style={{ fontSize: '10px', color: '#475569', fontFamily: 'monospace', marginLeft: '8px' }}>
            ({pct}%)
          </span>
        </div>

        <SliderRow
          label="WEIGHT"
          unit="g"
          min={0}
          max={maxWeight}
          step={1}
          value={weight}
          color="#bef264"
          onChange={handleWeightChange}
        />

        <SliderRow
          label="MAX CAPACITY"
          unit="g"
          min={100}
          max={50000}
          step={100}
          value={maxWeight}
          color="#94a3b8"
          onChange={handleMaxChange}
        />

        {/* Raw value readout */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'monospace', fontWeight: 700 }}>
          <span style={{ color: '#64748b' }}>24-bit raw</span>
          <span style={{ color: '#bef264' }}>{rawValue}</span>
          <span style={{ color: '#64748b' }}>hex</span>
          <span style={{ color: '#bef264' }}>0x{rawValue.toString(16).toUpperCase().padStart(6, '0')}</span>
        </div>
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
      // Determine the correct output pin name for this sensor type
      const outPin = type === 'photoresistor' || type === 'photoresistor-sensor' ? 'AO'
                   : type === 'potentiometer' ? 'SIG'
                   : 'OUT';
      import('../../engine/CircuitEngine').then(({ circuitEngine }) => {
        circuitEngine.pushInputSignal(nodeId, outPin, true);
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
