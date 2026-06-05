import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { circuitEngine } from '../../engine/Arduino/CircuitEngine';

type Dir = 'CW' | 'CCW' | 'STOP';
type Model = '28byj48' | 'bipolar_nema';

interface StepperNodeData {
  angle?: number;
  totalDegrees?: number;
  stepCount?: number;
  currentSteps?: number;
  currentAngle?: number;
  rpm?: number;
  direction?: Dir;
  phase?: number;
  coilState?: number[];
  stalled?: boolean;
  model?: Model;
  stepsPerRevolution?: number;
  display?: 'steps' | 'angle' | 'none';
  label?: string;
}

interface StepperMotorNodeProps {
  nodeId: string;
  data: StepperNodeData;
  selected?: boolean;
}

export const StepperMotorNode = memo(({ nodeId, data }: StepperMotorNodeProps) => {
  const totalDegrees = data.totalDegrees ?? 0;
  const stepCount = data.stepCount ?? 0;
  const rpm = data.rpm ?? 0;
  const direction: Dir = data.direction ?? 'STOP';
  const stalled = data.stalled ?? false;
  const coilState = Array.isArray(data.coilState) ? data.coilState : [0, 0, 0, 0];
  const model: Model = data.model ?? 'bipolar_nema';
  const modelLabel = model === '28byj48' ? '28BYJ-48' : 'NEMA 17';
  const modelInfoLabel = model === '28byj48' ? '28BYJ-48 (ULN2003)' : 'Bipolar NEMA';
  const stepsPerRevolution = data.stepsPerRevolution ?? (model === '28byj48' ? 2048 : 200);
  const degreesPerStep = (360 / stepsPerRevolution).toFixed(4);
  const dirText = direction === 'CW' ? '↻' : direction === 'CCW' ? '↺' : '⏸';
  const dirColor = direction === 'CW' ? '#16a34a' : direction === 'CCW' ? '#2563eb' : '#64748b';

  const display = data.display ?? 'steps';
  const currentSteps = data.currentSteps ?? stepCount;
  const currentAngleRaw = (currentSteps % stepsPerRevolution) * 360.0 / stepsPerRevolution;
  const currentAngle = currentAngleRaw < 0 ? currentAngleRaw + 360.0 : currentAngleRaw;

  return (
    <div
      style={{
        width: 220,
        height: 230,
        borderRadius: 12,
        border: '1px solid #334155',
        background: '#0b1220',
        color: '#e2e8f0',
        position: 'relative',
        boxShadow: '0 8px 24px rgba(2,6,23,0.35)',
        transform: 'scale(0.75)',
        transformOrigin: 'center',
      }}
    >
      {(['IN1', 'IN2', 'IN3', 'IN4'] as const).map((pin, i) => (
        <Handle
          key={pin}
          id={pin}
          type="target"
          position={Position.Left}
          style={{
            top: 28 + i * 26,
            left: -6,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#94a3b8',
            border: '1px solid #cbd5e1',
          }}
        />
      ))}

      <svg width="220" height="230" viewBox="0 0 220 230">
        <rect x="8" y="8" width="204" height="214" rx="10" fill="#111827" stroke="#1f2937" />
        <circle cx="110" cy="64" r="34" fill="#1f2937" stroke="#334155" />
        <circle cx="110" cy="64" r="8" fill="#64748b" />
        <g
          style={{ transformBox: 'fill-box', transformOrigin: 'center', transition: 'transform 80ms ease-out' }}
          transform={`rotate(${totalDegrees}, 110, 64)`}
        >
          <line x1="110" y1="64" x2="110" y2="34" stroke="#e63" strokeWidth="3" strokeLinecap="round" />
        </g>

        <text x="16" y="24" fill="#e2e8f0" fontSize="12" fontWeight="700">{modelLabel}</text>
        <text x="178" y="24" fill={dirColor} fontSize="16" fontWeight="700">{dirText}</text>
        {stalled && (
          <g>
            <rect x="132" y="30" width="74" height="16" rx="8" fill="#7f1d1d" stroke="#ef4444" />
            <text x="138" y="42" fill="#fecaca" fontSize="9" fontWeight="700">⚠ stalled</text>
          </g>
        )}
        <text x="16" y="104" fill={direction === 'STOP' ? '#94a3b8' : '#f8fafc'} fontSize="12" fontWeight="600">
          {`${direction === 'STOP' ? '0.0' : rpm.toFixed(1)} RPM`}
        </text>
        <text x="16" y="120" fill={display === 'steps' ? '#f8fafc' : '#94a3b8'} fontSize={display === 'steps' ? 12 : 11} fontWeight={display === 'steps' ? '700' : '400'}>{`Steps: ${currentSteps}`}</text>
        <text x="16" y="134" fill={display === 'angle' ? '#f8fafc' : '#94a3b8'} fontSize={display === 'angle' ? 12 : 11} fontWeight={display === 'angle' ? '700' : '400'}>{`Angle: ${currentAngle.toFixed(1)}°`}</text>

        <rect x="14" y="144" width="192" height="54" rx="8" fill="#0b1220" stroke="#334155" />
        <text x="20" y="158" fill="#cbd5e1" fontSize="10">{`Steps/rev: ${stepsPerRevolution}`}</text>
        <text x="20" y="171" fill="#cbd5e1" fontSize="10">{`°/step: ${degreesPerStep}`}</text>
        <text x="20" y="184" fill="#cbd5e1" fontSize="10">{`Model: ${modelInfoLabel}`}</text>

        <g
          onClick={() => circuitEngine.resetStepper(nodeId)}
          style={{ cursor: 'pointer' }}
        >
          <rect x="146" y="202" width="56" height="16" rx="8" fill="#1d4ed8" />
          <text x="162" y="213" fill="#eff6ff" fontSize="10" fontWeight="700">Reset</text>
        </g>

        {coilState.slice(0, 4).map((active, i) => (
          <g key={`coil-${i}`}>
            <circle cx={80 + i * 20} cy="138" r="4" fill={active ? '#ff6b35' : '#2a2a2a'} />
            <text x={73 + i * 20} y="152" fill="#94a3b8" fontSize="8">{`IN${i + 1}`}</text>
          </g>
        ))}
      </svg>
    </div>
  );
});

StepperMotorNode.displayName = 'StepperMotorNode';
