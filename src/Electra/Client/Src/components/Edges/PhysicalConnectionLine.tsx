/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * PhysicalConnectionLine — Flat, clean wire preview while dragging (no 3D effects).
 * Matches Wokwi style: simple colored line with pin dots.
 */
import React from 'react';
import { type ConnectionLineComponentProps, getBezierPath } from 'reactflow';

export const PhysicalConnectionLine: React.FC<ConnectionLineComponentProps> = ({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
}) => {
  const [edgePath] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
  });

  const wireColor = '#22c55e';

  return (
    <g className="physical-connection-line">
      <path
        style={{
          stroke: wireColor,
          strokeWidth: 2,
          fill: 'none',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }}
        d={edgePath}
      />

      <circle
        cx={fromX}
        cy={fromY}
        r={2.5}
        fill={wireColor}
        stroke="none"
      />

      <circle
        cx={toX}
        cy={toY}
        r={2.5}
        fill={wireColor}
        stroke="none"
        opacity={0.5}
      />
    </g>
  );
};
