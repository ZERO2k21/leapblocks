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
    borderRadius: 12,
  });

  const wireColor = '#22c55e'; // Default dragging color (Green)

  return (
    <g className="physical-connection-line">
      {/* 1. GROUND SHADOW */}
      <path
        style={{ 
          stroke: 'rgba(0,0,0,0.3)', 
          strokeWidth: 10, 
          fill: 'none',
          strokeLinecap: 'round',
          transform: 'translate(4px, 5px)',
          filter: 'blur(2px)'
        }}
        d={edgePath}
      />

      {/* 2. MAIN BODY */}
      <path
        style={{ 
          stroke: wireColor, 
          strokeWidth: 9, 
          fill: 'none',
          strokeLinecap: 'round'
        }}
        d={edgePath}
      />

      {/* 3. WHITE CORE HIGHLIGHT */}
      <path
        style={{ 
          stroke: '#ffffff', 
          strokeWidth: 4, 
          fill: 'none',
          strokeLinecap: 'round',
          opacity: 0.8,
        }}
        d={edgePath}
      />

      {/* 4. TOP EDGE GLOSS */}
      <path
        style={{ 
          stroke: 'rgba(255,255,255,0.4)', 
          strokeWidth: 2, 
          fill: 'none',
          strokeLinecap: 'round',
          transform: 'translate(-1.5px, -2px)'
        }}
        d={edgePath}
      />

      {/* TERMINAL PLUG (On source Pin) */}
      <circle cx={fromX} cy={fromY} r={5} fill="#0a0a0a" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
      <circle cx={fromX} cy={fromY} r={2.5} fill="#fff" opacity={0.9} />
    </g>
  );
};
