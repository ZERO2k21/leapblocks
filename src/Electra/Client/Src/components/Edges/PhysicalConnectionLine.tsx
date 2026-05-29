/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * PhysicalConnectionLine — Clean Wokwi/Velxio style wire preview while dragging.
 */
import React from 'react';
import { ConnectionLineComponentProps, getBezierPath } from 'reactflow';

export const PhysicalConnectionLine: React.FC<ConnectionLineComponentProps> = ({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
}) => {
  // Use bezier path matching the placed wire style
  const [edgePath] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
  });

  const wireColor = '#22c55e'; // Default dragging color (Green)

  return (
    <g className="physical-connection-line">
      {/* 1. SELECTION HIGHLIGHT */}
      <path
        style={{
          stroke: wireColor,
          strokeWidth: 5,
          opacity: 0.2,
          fill: 'none',
          filter: 'blur(3px)',
        }}
        d={edgePath}
      />

      {/* 2. MAIN WIRE — clean thin line */}
      <path
        style={{
          stroke: wireColor,
          strokeWidth: 2.5,
          fill: 'none',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }}
        d={edgePath}
      />

      {/* 3. SOURCE PIN DOT */}
      <circle
        cx={fromX}
        cy={fromY}
        r={3}
        fill={wireColor}
        stroke="#fff"
        strokeWidth={0.5}
      />

      {/* 4. TARGET PREVIEW DOT */}
      <circle
        cx={toX}
        cy={toY}
        r={3}
        fill={wireColor}
        stroke="#fff"
        strokeWidth={0.5}
        opacity={0.6}
      />
    </g>
  );
};
