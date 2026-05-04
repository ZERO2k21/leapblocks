/**
 * StepperMotor.tsx - React Component for NEMA Stepper Motor
 * 
 * Wokwi-style stepper motor visual with:
 * - Configurable NEMA sizes (8, 11, 14, 17, 23, 34)
 * - Real-time simulation and rotation animation
 * - Display modes: steps, angle, none
 * - Custom arrow color indicator
 */

import React, { useEffect, useRef, useState } from 'react';
import StepperMotorSimulator from './StepperMotorSim';
import './StepperMotor.css';

export interface StepperMotorProps {
  id: string;
  size?: '8' | '11' | '14' | '17' | '23' | '34';
  display?: 'steps' | 'angle' | 'none';
  gearRatio?: string;
  arrow?: string;
  pinStates: {
    'A-': boolean;
    'A+': boolean;
    'B+': boolean;
    'B-': boolean;
  };
  onPinClick?: (pin: string) => void;
}

/**
 * NEMA size to radius mapping (in SVG units)
 * Determines motor visual size
 */
const NEMA_SIZE_MAP: Record<string, number> = {
  '8': 28,
  '11': 34,
  '14': 40,
  '17': 46,
  '23': 52,
  '34': 62,
};

/**
 * Pin configuration: name, color, and relative Y position
 */
interface PinConfig {
  name: string;
  color: string;
  number: number;
}

const PIN_CONFIGS: PinConfig[] = [
  { name: 'A-', color: '#e74c3c', number: 1 }, // Red
  { name: 'A+', color: '#2ecc71', number: 2 }, // Green
  { name: 'B+', color: '#f1c40f', number: 3 }, // Yellow
  { name: 'B-', color: '#3498db', number: 4 }, // Blue
];

const StepperMotor: React.FC<StepperMotorProps> = ({
  id,
  size = '23',
  display = 'steps',
  gearRatio = '1:1',
  arrow = '',
  pinStates,
  onPinClick,
}) => {
  // Simulator reference
  const simRef = useRef<StepperMotorSimulator>(
    new StepperMotorSimulator(gearRatio, false)
  );

  // Component state
  const [stepCount, setStepCount] = useState(0);
  const [angle, setAngle] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Geometry calculations
  const motorRadius = NEMA_SIZE_MAP[size] || 52;
  const centerX = motorRadius + 20;
  const centerY = motorRadius + 20;
  const totalWidth = centerX * 2 + 30;
  const totalHeight = centerY * 2;

  // Inner ring radius (73% of motor radius)
  const innerRadius = motorRadius * 0.73;

  // Shaft radius (19% of motor radius)
  const shaftRadius = motorRadius * 0.19;

  // Arrow geometry
  const arrowLength = motorRadius - 8;
  const arrowAngleRad = (angle - 90) * (Math.PI / 180);
  const arrowX = centerX + arrowLength * Math.cos(arrowAngleRad);
  const arrowY = centerY + arrowLength * Math.sin(arrowAngleRad);

  // Display text
  const displayText =
    display === 'steps'
      ? String(stepCount)
      : display === 'angle'
        ? `${angle.toFixed(1)}°`
        : '';

  // Mounting hole positions (4 corners at 70% of radius)
  const cornerOffset = motorRadius * 0.7;
  const mountingHoles = [
    { cx: centerX - cornerOffset, cy: centerY - cornerOffset },
    { cx: centerX + cornerOffset, cy: centerY - cornerOffset },
    { cx: centerX - cornerOffset, cy: centerY + cornerOffset },
    { cx: centerX + cornerOffset, cy: centerY + cornerOffset },
  ];

  // Pin Y positions (evenly spaced around center)
  const pinSpacing = 16;
  const pinYPositions = [
    centerY - pinSpacing * 1.5,
    centerY - pinSpacing * 0.5,
    centerY + pinSpacing * 0.5,
    centerY + pinSpacing * 1.5,
  ];

  /**
   * Initialize simulator and set up callbacks
   */
  useEffect(() => {
    const sim = simRef.current;

    // Set up update callback
    sim.onStepUpdate((steps, ang) => {
      setStepCount(steps);
      setAngle(ang);
      setIsAnimating(true);
      // Disable animation class after transition completes
      setTimeout(() => setIsAnimating(false), 100);
    });

    // Set gear ratio
    sim.setGearRatio(gearRatio);
  }, [gearRatio]);

  /**
   * Update simulator when pin states change
   */
  useEffect(() => {
    const sim = simRef.current;
    const pinEntries = Object.entries(pinStates) as Array<
      [keyof typeof pinStates, boolean]
    >;

    pinEntries.forEach(([pin, value]) => {
      sim.onPinChange(pin, value);
    });
  }, [pinStates]);

  return (
    <svg
      id={id}
      width={totalWidth}
      height={totalHeight}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className="stepper-motor"
    >
      {/* Motor body (outer circle) */}
      <circle
        cx={centerX}
        cy={centerY}
        r={motorRadius}
        fill="#555555"
        stroke="#333333"
        strokeWidth="3"
      />

      {/* Inner ring */}
      <circle
        cx={centerX}
        cy={centerY}
        r={innerRadius}
        fill="#444444"
        stroke="#222222"
        strokeWidth="2"
      />

      {/* Shaft (center metallic circle) */}
      <circle
        cx={centerX}
        cy={centerY}
        r={shaftRadius}
        fill="#888888"
        stroke="#666666"
        strokeWidth="1.5"
      />

      {/* Mounting holes (4 corners) */}
      {mountingHoles.map((hole, idx) => (
        <circle
          key={`hole-${idx}`}
          cx={hole.cx}
          cy={hole.cy}
          r="4"
          fill="#333333"
          stroke="#222222"
          strokeWidth="1"
        />
      ))}

      {/* Arrow indicator (rotation indicator) */}
      {arrow && (
        <g className={`stepper-arrow ${isAnimating ? 'stepper-step' : ''}`}>
          {/* Arrow line from center to edge */}
          <line
            x1={centerX}
            y1={centerY}
            x2={arrowX}
            y2={arrowY}
            stroke={arrow}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Arrow tip circle */}
          <circle cx={arrowX} cy={arrowY} r="3" fill={arrow} />
        </g>
      )}

      {/* Display text (center) */}
      {displayText && (
        <text
          x={centerX}
          y={centerY + 4}
          textAnchor="middle"
          fill="white"
          fontSize="11"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {displayText}
        </text>
      )}

      {/* NEMA size label (bottom) */}
      <text
        x={centerX}
        y={centerY + motorRadius - 8}
        textAnchor="middle"
        fill="#aaaaaa"
        fontSize="9"
        fontFamily="monospace"
      >
        NEMA {size}
      </text>

      {/* Wiring pins (left side) */}
      {PIN_CONFIGS.map((pin, idx) => (
        <g
          key={pin.name}
          className="stepper-pin"
          onClick={() => onPinClick?.(pin.name)}
          style={{ cursor: 'pointer' }}
        >
          {/* Pin rectangle */}
          <rect
            x="4"
            y={pinYPositions[idx] - 3}
            width="16"
            height="6"
            rx="1"
            fill={pin.color}
            stroke="#222222"
            strokeWidth="0.5"
          />

          {/* Pin label */}
          <text
            x="22"
            y={pinYPositions[idx] + 3}
            fontSize="8"
            fill="#cccccc"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {pin.name}
          </text>
        </g>
      ))}
    </svg>
  );
};

export default StepperMotor;
