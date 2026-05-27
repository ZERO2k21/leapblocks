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
  const highlightColor = '#86efac';

  return (
    <g className="physical-connection-line">
      {/* 1. GROUND SHADOW */}
      <path
        style={{
          stroke: 'rgba(0,0,0,0.15)',
          strokeWidth: 4,
          fill: 'none',
          strokeLinecap: 'round',
          transform: 'translate(1px, 1.5px)',
          filter: 'blur(1px)'
        }}
        d={edgePath}
      />

      {/* 2. OUTER TUBE BODY */}
      <path
        style={{
          stroke: wireColor,
          strokeWidth: 4,
          fill: 'none',
          strokeLinecap: 'round',
          strokeLinejoin: 'round'
        }}
        d={edgePath}
      />

      {/* 3. INNER GLOWING CORE */}
      <path
        style={{
          stroke: highlightColor,
          strokeWidth: 1.5,
          fill: 'none',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          pointerEvents: 'none',
          opacity: 0.9
        }}
        d={edgePath}
      />

      {/* TERMINAL PLUG (On source Pin) */}
      <circle cx={fromX} cy={fromY} r={3.5} fill={wireColor} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
    </g>
  );
};
