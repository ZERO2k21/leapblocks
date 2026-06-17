import React from 'react';
import { type ConnectionLineComponentProps } from 'reactflow';
import { computeOrthogonalPath, buildOrthogonalPath } from '../../lib/orthogonalRouting';

export const PhysicalConnectionLine: React.FC<ConnectionLineComponentProps> = ({
  fromX,
  fromY,
  toX,
  toY,
}) => {
  const src = { x: fromX, y: fromY };
  const tgt = { x: toX, y: toY };
  const bends = computeOrthogonalPath(src, tgt);
  const edgePath = buildOrthogonalPath([src, ...bends, tgt]);

  const wireColor = '#22c55e';

  return (
    <g className="physical-connection-line">
      <path
        style={{
          stroke: wireColor,
          strokeWidth: 2,
          fill: 'none',
          strokeLinejoin: 'round',
        }}
        d={edgePath}
      />

      <circle
        cx={fromX}
        cy={fromY}
        r={1.5}
        fill={wireColor}
        stroke="none"
      />

      <circle
        cx={toX}
        cy={toY}
        r={1.5}
        fill={wireColor}
        stroke="none"
        opacity={0.5}
      />
    </g>
  );
};
