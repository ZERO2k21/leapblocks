/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { ConnectionLineComponentProps, getSmoothStepPath } from 'reactflow';

export const PhysicalConnectionLine: React.FC<ConnectionLineComponentProps> = ({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
}) => {
  // Use SmoothStep path for Manhattan routing while dragging
  const [edgePath] = getSmoothStepPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
    borderRadius: 4,
  });

  const wireColor = '#22c55e'; // Default dragging color (Green)

  return (
    <g className="physical-connection-line">
      {/* 1. GROUND SHADOW */}
      <path
        style={{
          stroke: 'rgba(0,0,0,0.2)',
          strokeWidth: 6,
          fill: 'none',
          strokeLinecap: 'round',
          transform: 'translate(2px, 3px)',
          filter: 'blur(1px)'
        }}
        d={edgePath}
      />

      {/* 2. MAIN BODY */}
      <path
        style={{
          stroke: wireColor,
          strokeWidth: 5,
          fill: 'none',
          strokeLinecap: 'round'
        }}
        d={edgePath}
      />

      {/* TERMINAL PLUG (On source Pin) */}
      <circle cx={fromX} cy={fromY} r={3.5} fill={wireColor} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
    </g>
  );
};
