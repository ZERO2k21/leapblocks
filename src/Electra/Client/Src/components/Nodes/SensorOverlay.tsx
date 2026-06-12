/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { useForgeStore, getCircuitEngineSync } from '../../../utlis/store/useForgeStore';

const withEngine = (cb: (engine: any) => void) => {
  const engine = getCircuitEngineSync();
  if (engine) {
    cb(engine);
  } else {
    import('../../engine/Arduino/CircuitEngine').then(({ circuitEngine }) => {
      cb(circuitEngine);
    });
  }
};

interface SensorOverlayProps {
  nodeId: string;
  type: string;
  currentValues: any;
}

// ── Single-value slider row (Horizontal and Compact) ─────────────────────────
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

const clamp = (min: number, max: number, value: number) => Math.max(min, Math.min(max, value));

const SliderRow: React.FC<SliderRowProps> = ({ label, unit, min, max, step = 1, value, color = '#BEF264', onChange }) => {
  const uiTheme = useForgeStore(state => state.uiTheme);
  const isLightTheme = uiTheme === 'light';

  const [inputVal, setInputVal] = React.useState(value.toString());
  const lastUpdatedRef = React.useRef<number>(0);
  const timeoutRef = React.useRef<any>(null);

  // Keep input val in sync with props changes
  React.useEffect(() => {
    if (parseFloat(inputVal) !== value) {
      setInputVal(value.toString());
    }
  }, [value]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const displayColor = isLightTheme ? '#0f172a' : '#f8fafc';
  const labelColor = isLightTheme ? '#475569' : '#94a3b8';

  const sendUpdate = (val: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    onChange(val);
    lastUpdatedRef.current = Date.now();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setInputVal(v.toString());

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdatedRef.current;

    // Throttle updates: send immediate updates at most every 100ms
    if (timeSinceLastUpdate >= 100) {
      sendUpdate(v);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        sendUpdate(v);
      }, 100 - timeSinceLastUpdate);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const clean = raw.replace(/[^0-9.]/g, '');
    setInputVal(clean);
    
    const v = parseFloat(clean);
    if (!isNaN(v)) {
      sendUpdate(v);
    }
  };

  const handleBlur = () => {
    const v = clamp(min, max, parseFloat(inputVal) || 0);
    const rounded = step >= 1 ? Math.round(v) : parseFloat(v.toFixed(1));
    setInputVal(rounded.toString());
    sendUpdate(rounded);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', userSelect: 'none' }}>
      <span style={{ fontSize: '9px', color: labelColor, fontWeight: 700, width: '45px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={parseFloat(inputVal) || 0}
        onChange={handleChange}
        style={{ flex: 1, accentColor: color, height: '4px', cursor: 'pointer', borderRadius: '2px', outline: 'none' }}
      />
      <input
        type="text"
        value={inputVal}
        onChange={handleTextChange}
        onBlur={handleBlur}
        style={{
          width: '65px',
          background: isLightTheme ? '#f1f5f9' : '#1e293b',
          border: `1px solid ${isLightTheme ? '#cbd5e1' : '#334155'}`,
          borderRadius: '4px',
          padding: '2px 4px',
          fontSize: '10px',
          color: displayColor,
          fontWeight: 800,
          fontFamily: 'monospace',
          textAlign: 'right',
          outline: 'none',
        }}
      />
      {unit && <span style={{ fontSize: '10px', color: displayColor, fontWeight: 800, fontFamily: 'monospace' }}>{unit}</span>}
    </div>
  );
};

// ── Compact theme-aware Card Wrapper sitting right above the component ──────
interface CompactCardProps {
  borderColor?: string;
  children: React.ReactNode;
}

const CompactCard: React.FC<CompactCardProps> = ({ borderColor, children }) => {
  const uiTheme = useForgeStore(state => state.uiTheme);
  const isLightTheme = uiTheme === 'light';

  const defaultBorder = isLightTheme ? '#cbd5e1' : (borderColor || 'rgba(255, 255, 255, 0.08)');

  return (
    <div
      onPointerDown={e => e.stopPropagation()}
      onPointerUp={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
      className="nodrag nopan"
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 6px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '250px',
        background: isLightTheme ? 'rgba(255, 255, 255, 0.92)' : 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(8px)',
        border: `1px solid ${defaultBorder}`,
        borderRadius: '8px',
        padding: '6px 14px',
        boxShadow: isLightTheme
          ? '0 4px 6px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02)'
          : '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        userSelect: 'none',
      }}
    >
      {children}
    </div>
  );
};

// ── Main overlay ──────────────────────────────────────────────────────────────
export const SensorOverlay: React.FC<SensorOverlayProps> = ({ nodeId, type, currentValues }) => {
  const updateNodeData = useForgeStore(state => state.updateNodeData);
  const uiTheme = useForgeStore(state => state.uiTheme);
  const isLightTheme = uiTheme === 'light';

  const isDHT = type === 'dht22' || type === 'dht11';
  const isDistance = type === 'hc-sr04';
  const isAnalog = ['potentiometer', 'slide-potentiometer', 'mq2', 'resistor', 'photoresistor'].includes(type);
  const isNTC = type === 'ntc-temperature-sensor';
  const isPIR = type === 'pir-motion-sensor';
  const isMPU6050 = type === 'mpu6050';
  const isLDR = type === 'photoresistor-sensor';
  const isFlame = type === 'flame-sensor';
  const isGas = type === 'gas-sensor';
  const isHeartRate = type === 'heart-beat-sensor';
  const isBigSound = type === 'big-sound-sensor' || type === 'small-sound-sensor';
  const isHX711 = type === 'hx711';

  if (!isDHT && !isDistance && !isAnalog && !isNTC && !isPIR && !isMPU6050 && !isLDR && !isFlame && !isGas && !isHeartRate && !isBigSound && !isHX711) return null;

  // ── DHT Sensor ──────────────────────────────────────────────────────────
  if (isDHT) {
    const temp = currentValues?.temperature ?? 25;
    const humidity = currentValues?.humidity ?? 50;

    const update = (key: 'temperature' | 'humidity', val: number) => {
      updateNodeData(nodeId, {
        sensorValues: { ...currentValues, [key]: val },
      });
    };

    return (
      <CompactCard borderColor="rgba(186, 242, 100, 0.2)">
        <SliderRow
          label="TEMP"
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
      </CompactCard>
    );
  }

  // ── PIR Motion Sensor ───────────────────────────────────────────────────
  if (isPIR) {
    const motionDetected = currentValues?.motionDetected ?? false;

    const toggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const next = !motionDetected;
      updateNodeData(nodeId, {
        sensorValues: { ...currentValues, motionDetected: next },
      });
      withEngine(engine => engine.pushInputSignal(nodeId, 'OUT', next));
    };

    return (
      <CompactCard borderColor={motionDetected ? 'rgba(74,222,128,0.4)' : 'rgba(186,242,100,0.2)'}>
        <button
          onClick={toggle}
          style={{
            width: '100%',
            padding: '4px 0',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '9px',
            fontFamily: 'monospace',
            letterSpacing: '0.05em',
            background: motionDetected
              ? 'rgba(74, 222, 128, 0.9)'
              : (isLightTheme ? '#e2e8f0' : 'rgba(51, 65, 85, 0.9)'),
            color: motionDetected ? '#0f172a' : (isLightTheme ? '#334155' : '#94a3b8'),
            boxShadow: motionDetected ? '0 0 6px rgba(74,222,128,0.3)' : 'none',
          }}
        >
          {motionDetected ? '● MOTION DETECTED' : '○ TRIGGER MOTION'}
        </button>
      </CompactCard>
    );
  }

  // ── MPU6050 3D IMU ──────────────────────────────────────────────────────
  if (isMPU6050) {
    const sv = currentValues ?? {};
    const accelX = sv.accelX ?? 0;
    const accelY = sv.accelY ?? 0;
    const accelZ = sv.accelZ ?? 1;
    const gyroX = sv.gyroX ?? 0;
    const gyroY = sv.gyroY ?? 0;
    const gyroZ = sv.gyroZ ?? 0;
    const temp = sv.temp ?? 25;

    const update = (key: string, val: number) => {
      const next = { accelX, accelY, accelZ, gyroX, gyroY, gyroZ, temp, [key]: val };
      updateNodeData(nodeId, { sensorValues: next });
      withEngine(engine => engine.pushMPU6050Values(nodeId, next));
    };

    return (
      <CompactCard borderColor="rgba(186, 242, 100, 0.2)">
        <SliderRow label="ACCEL X" unit="g" min={-2} max={2} step={0.01} value={accelX} color="#38bdf8" onChange={v => update('accelX', v)} />
        <SliderRow label="ACCEL Y" unit="g" min={-2} max={2} step={0.01} value={accelY} color="#38bdf8" onChange={v => update('accelY', v)} />
        <SliderRow label="ACCEL Z" unit="g" min={-2} max={2} step={0.01} value={accelZ} color="#38bdf8" onChange={v => update('accelZ', v)} />
        <SliderRow label="GYRO X" unit="°" min={-250} max={250} step={1} value={gyroX} color="#a78bfa" onChange={v => update('gyroX', v)} />
        <SliderRow label="GYRO Y" unit="°" min={-250} max={250} step={1} value={gyroY} color="#a78bfa" onChange={v => update('gyroY', v)} />
        <SliderRow label="GYRO Z" unit="°" min={-250} max={250} step={1} value={gyroZ} color="#a78bfa" onChange={v => update('gyroZ', v)} />
        <SliderRow label="TEMP" unit="°C" min={-40} max={85} step={0.1} value={temp} color="#f97316" onChange={v => update('temp', v)} />
      </CompactCard>
    );
  }

  // ── NTC Temperature Sensor ───────────────────────────────────────────────
  if (isNTC) {
    const tempC = currentValues?.value ?? 25;

    const R0 = 10000, B = 3950, T0 = 298.15, Rs = 10000, VCC = 5.0;
    const T = tempC + 273.15;
    const R_ntc = R0 * Math.exp(B * (1 / T - 1 / T0));
    const voltage = VCC * R_ntc / (Rs + R_ntc);
    const adcRaw = Math.round((voltage / VCC) * 1023);

    const handleChange = (val: number) => {
      updateNodeData(nodeId, { sensorValues: { ...currentValues, value: val } });
      withEngine(engine => engine.pushInputSignal(nodeId, 'OUT', true));
    };

    return (
      <CompactCard borderColor="rgba(249,115,22,0.3)">
        <SliderRow
          label="TEMP"
          unit="°C"
          min={-40}
          max={125}
          step={0.5}
          value={tempC}
          color="#f97316"
          onChange={handleChange}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'monospace', fontWeight: 700, padding: '0 2px' }}>
          <span style={{ color: isLightTheme ? '#64748b' : '#64748b' }}>Vout</span>
          <span style={{ color: isLightTheme ? '#0284c7' : '#bef264' }}>{voltage.toFixed(2)}V</span>
          <span style={{ color: isLightTheme ? '#64748b' : '#64748b' }}>ADC</span>
          <span style={{ color: isLightTheme ? '#0284c7' : '#bef264' }}>{adcRaw}</span>
        </div>
      </CompactCard>
    );
  }

  // ── Photoresistor (LDR) Sensor ──────────────────────────────────────────
  if (isLDR) {
    const lux = Number(currentValues?.value ?? 500);
    const threshold = Number(currentValues?.threshold ?? 500);

    const R_ldr = 500000 / Math.max(1, lux);
    const R_series = 10000;
    const voltage = 5.0 * R_series / (R_ldr + R_series);
    const adcRaw = Math.round((voltage / 5.0) * 1023);
    const doLow = lux < threshold;

    const handleChange = (key: 'value' | 'threshold', val: number) => {
      const next = { ...currentValues, [key]: val };
      updateNodeData(nodeId, { sensorValues: next });
      withEngine(engine => {
        engine.pushInputSignal(nodeId, 'AO', true);
        const doIsLow = (key === 'value' ? val : lux) < (key === 'threshold' ? val : threshold);
        engine.pushInputSignal(nodeId, 'DO', !doIsLow);
      });
    };

    return (
      <CompactCard borderColor="rgba(251,191,36,0.3)">
        <SliderRow
          label="LIGHT"
          unit="lx"
          min={0}
          max={1000}
          step={1}
          value={lux}
          color="#fbbf24"
          onChange={v => handleChange('value', v)}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'monospace', fontWeight: 700, padding: '0 2px' }}>
          <span style={{ color: '#64748b' }}>Vout</span>
          <span style={{ color: isLightTheme ? '#0284c7' : '#bef264' }}>{voltage.toFixed(1)}V</span>
          <span style={{ color: '#64748b' }}>ADC</span>
          <span style={{ color: isLightTheme ? '#0284c7' : '#bef264' }}>{adcRaw}</span>
          <span style={{ color: '#64748b' }}>DO</span>
          <span style={{ color: doLow ? '#ef4444' : '#4ade80', fontWeight: 900 }}>
            {doLow ? 'LOW' : 'HIGH'}
          </span>
        </div>
      </CompactCard>
    );
  }

  // ── Flame Sensor ────────────────────────────────────────────────────────
  if (isFlame) {
    const intensity = Number(currentValues?.value ?? 0);
    const threshold = Number(currentValues?.threshold ?? 50);
    const flameOn = intensity > threshold;
    const voltage = 5.0 * (1 - intensity / 100);

    const handleChange = (key: 'value' | 'threshold', val: number) => {
      const next = { ...currentValues, [key]: val };
      updateNodeData(nodeId, { sensorValues: next });
      withEngine(engine => {
        engine.pushInputSignal(nodeId, 'AOUT', true);
        const nowFlame = (key === 'value' ? val : intensity) > (key === 'threshold' ? val : threshold);
        engine.pushInputSignal(nodeId, 'DOUT', !nowFlame);
      });
    };

    return (
      <CompactCard borderColor={flameOn ? 'rgba(249,115,22,0.4)' : 'rgba(186,242,100,0.2)'}>
        <SliderRow
          label="FLAME"
          unit="%"
          min={0}
          max={100}
          step={1}
          value={intensity}
          color="#f97316"
          onChange={v => handleChange('value', v)}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'monospace', fontWeight: 700, padding: '0 2px' }}>
          <span style={{ color: '#64748b' }}>State</span>
          <span style={{ color: flameOn ? '#ef4444' : '#4ade80', fontWeight: 900 }}>
            {flameOn ? 'ACTIVE' : 'SAFE'}
          </span>
          <span style={{ color: '#64748b' }}>Vout</span>
          <span style={{ color: isLightTheme ? '#0284c7' : '#bef264' }}>{voltage.toFixed(2)}V</span>
        </div>
      </CompactCard>
    );
  }

  // ── Gas Sensor ──────────────────────────────────────────────────────────
  if (isGas) {
    const concentration = Number(currentValues?.value ?? 0);
    const threshold = Number(currentValues?.threshold ?? 50);
    const gasDetected = concentration > threshold;
    const voltage = 5.0 * concentration / 100;

    const handleChange = (key: 'value' | 'threshold', val: number) => {
      const next = { ...currentValues, [key]: val };
      updateNodeData(nodeId, { sensorValues: next });
      withEngine(engine => {
        engine.pushInputSignal(nodeId, 'AOUT', true);
        const nowGas = (key === 'value' ? val : concentration) > (key === 'threshold' ? val : threshold);
        engine.pushInputSignal(nodeId, 'DOUT', !nowGas);
      });
    };

    return (
      <CompactCard borderColor={gasDetected ? 'rgba(251,146,60,0.4)' : 'rgba(186,242,100,0.2)'}>
        <SliderRow
          label="GAS"
          unit="%"
          min={0}
          max={100}
          step={1}
          value={concentration}
          color="#fb923c"
          onChange={v => handleChange('value', v)}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'monospace', fontWeight: 700, padding: '0 2px' }}>
          <span style={{ color: '#64748b' }}>Air</span>
          <span style={{ color: gasDetected ? '#ef4444' : '#4ade80', fontWeight: 900 }}>
            {gasDetected ? 'SMOKE' : 'CLEAN'}
          </span>
          <span style={{ color: '#64748b' }}>Vout</span>
          <span style={{ color: isLightTheme ? '#0284c7' : '#bef264' }}>{voltage.toFixed(2)}V</span>
        </div>
      </CompactCard>
    );
  }

  // ── Heart Rate Sensor ────────────────────────────────────────────────────
  if (isHeartRate) {
    const bpm = Number(currentValues?.bpm ?? 72);

    const handleChange = (val: number) => {
      updateNodeData(nodeId, { sensorValues: { ...currentValues, bpm: val } });
    };

    return (
      <CompactCard borderColor="rgba(239,68,68,0.3)">
        <SliderRow
          label="PULSE"
          unit="bpm"
          min={20}
          max={200}
          step={1}
          value={bpm}
          color="#ef4444"
          onChange={handleChange}
        />
      </CompactCard>
    );
  }

  // ── Sound Sensor ────────────────────────────────────────────────────────
  if (isBigSound) {
    const level = Number(currentValues?.value ?? 0);
    const threshold = Number(currentValues?.threshold ?? 50);
    const soundOn = level > threshold;
    const voltage = 5.0 * level / 100;

    const handleChange = (key: 'value' | 'threshold', val: number) => {
      const next = { ...currentValues, [key]: val };
      updateNodeData(nodeId, { sensorValues: next });
      withEngine(engine => {
        engine.pushInputSignal(nodeId, 'AOUT', true);
        const nowSound = (key === 'value' ? val : level) > (key === 'threshold' ? val : threshold);
        engine.pushInputSignal(nodeId, 'DOUT', nowSound);
      });
    };

    return (
      <CompactCard borderColor={soundOn ? 'rgba(251,146,60,0.4)' : 'rgba(186,242,100,0.2)'}>
        <SliderRow
          label="SOUND"
          unit="%"
          min={0}
          max={100}
          step={1}
          value={level}
          color="#fb923c"
          onChange={v => handleChange('value', v)}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'monospace', fontWeight: 700, padding: '0 2px' }}>
          <span style={{ color: '#64748b' }}>Mic</span>
          <span style={{ color: soundOn ? '#fb923c' : '#64748b', fontWeight: 900 }}>
            {soundOn ? 'LOUD' : 'QUIET'}
          </span>
          <span style={{ color: '#64748b' }}>Vout</span>
          <span style={{ color: isLightTheme ? '#0284c7' : '#bef264' }}>{voltage.toFixed(2)}V</span>
        </div>
      </CompactCard>
    );
  }

  // ── HX711 Load Cell ─────────────────────────────────────────────────────
  if (isHX711) {
    const weight = Number(currentValues?.weight ?? 0);
    const maxWeight = Number(currentValues?.maxWeight ?? 5000);
    const weightKg = (weight / 1000).toFixed(2);

    const handleWeightChange = (val: number) => {
      updateNodeData(nodeId, { sensorValues: { ...currentValues, weight: val } });
    };

    return (
      <CompactCard borderColor="rgba(186,242,100,0.2)">
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
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'monospace', fontWeight: 700, padding: '0 2px' }}>
          <span style={{ color: '#64748b' }}>Mass</span>
          <span style={{ color: isLightTheme ? '#0284c7' : '#bef264' }}>{weightKg} kg</span>
          <span style={{ color: '#64748b' }}>Max</span>
          <span style={{ color: isLightTheme ? '#0284c7' : '#bef264' }}>{maxWeight}g</span>
        </div>
      </CompactCard>
    );
  }

  // ── Single-value sensors (hc-sr04, resistor, etc.) ──────────────────────
  const config = isDistance
    ? { label: 'DIST', unit: 'cm', min: 2, max: 400, step: 0.1, key: 'distance', default: 100, color: '#BEF264' }
    : type === 'potentiometer'
      ? { label: 'POS', unit: '', min: 0, max: 1023, step: 1, key: 'value', default: 0, color: '#BEF264' }
      : type === 'slide-potentiometer'
        ? { label: 'POS', unit: '', min: 0, max: 1023, step: 1, key: 'value', default: 0, color: '#BEF264' }
        : type === 'resistor'
          ? { label: 'RES', unit: 'Ω', min: 0, max: 1000000, step: 100, key: 'value', default: 1000, color: '#BEF264' }
          : type === 'photoresistor'
            ? { label: 'LIGHT', unit: 'lux', min: 0, max: 1000, step: 1, key: 'value', default: 500, color: '#fbbf24' }
            : type === 'ntc-temperature-sensor'
              ? { label: 'TEMP', unit: '°C', min: -40, max: 125, step: 0.1, key: 'value', default: 25, color: '#f97316' }
              : { label: 'VAL', unit: '', min: 0, max: 1023, step: 1, key: 'value', default: 512, color: '#BEF264' };

  const currentValue = currentValues?.[config.key] ?? config.default ?? config.min;

  const handleChange = (val: number) => {
    updateNodeData(nodeId, {
      sensorValues: { ...currentValues, [config.key]: val },
    });
    if (isAnalog) {
      const outPin = type === 'photoresistor' || type === 'photoresistor-sensor' ? 'AO'
        : type === 'potentiometer' || type === 'slide-potentiometer' ? 'SIG'
          : 'OUT';
      withEngine(engine => engine.pushInputSignal(nodeId, outPin, true));
    }
  };

  return (
    <CompactCard borderColor="rgba(186, 242, 100, 0.2)">
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
    </CompactCard>
  );
};
