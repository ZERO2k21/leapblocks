/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { EdgeProps, getSmoothStepPath } from 'reactflow';

export const WireEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  selected,
}) => {
  // Switch to SmoothStep (Manhattan) routing for hardware realism
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 5, // Slightly rounded corners for physical cable feel
  });

  const wireColor = data?.color || '#22c55e';

  return (
    <>
      {/* 1. SELECTION GLOW (Elevated) */}
      {selected && (
        <path
          id={`${id}_glow`}
          style={{ 
            stroke: wireColor, 
            strokeWidth: 16, 
            opacity: 0.2, 
            fill: 'none',
            filter: 'blur(8px)'
          }}
          className="react-flow__edge-path"
          d={edgePath}
        />
      )}

      {/* 2. GROUND SHADOW (Elevated Z-Axis Offset) */}
      <path
        id={`${id}_ground_shadow`}
        style={{ 
          stroke: 'rgba(0,0,0,0.45)', 
          strokeWidth: 12, 
          fill: 'none',
          strokeLinecap: 'round',
          transform: 'translate(4px, 5px)',
          filter: 'blur(2px)'
        }}
        className="react-flow__edge-path"
        d={edgePath}
      />

      {/* 3. MAIN WIRE BODY (Vibrant Outer Shell) */}
      <path
        id={`${id}_body`}
        style={{ 
          ...style, 
          stroke: wireColor, 
          strokeWidth: 10, 
          fill: 'none',
          strokeLinecap: 'round'
        }}
        className="react-flow__edge-path"
        d={edgePath}
      />

      {/* 4. THE WHITE CORE (Highest Contrast Detail) */}
      {/* Matches the bright central stripe in the reference image */}
      <path
        id={`${id}_central_core`}
        style={{ 
          stroke: '#ffffff', 
          strokeWidth: 4, 
          fill: 'none',
          strokeLinecap: 'round',
          opacity: 0.85,
        }}
        className="react-flow__edge-path"
        d={edgePath}
      />

      {/* 5. TOP EDGE GLOSS (Sharpened) */}
      <path
        id={`${id}_edge_gloss`}
        style={{ 
          stroke: 'rgba(255,255,255,0.4)', 
          strokeWidth: 2, 
          fill: 'none',
          strokeLinecap: 'round',
          transform: 'translate(-1.5px, -2px)'
        }}
        className="react-flow__edge-path"
        d={edgePath}
      />

      {/* 6. INTERACTIVE HIT AREA */}
      <path
        id={`${id}_interaction`}
        style={{ 
          stroke: 'transparent', 
          strokeWidth: 25, 
          fill: 'none',
          cursor: 'pointer'
        }}
        className="react-flow__edge-interaction"
        d={edgePath}
      />

      {/* 7. PLUG TERMINALS (Now rendered ON TOP of pins) */}
      <g className="wire-terminal">
        {/* Outer casing */}
        <circle cx={sourceX} cy={sourceY} r={5} fill="#0a0a0a" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
        {/* Inner wire core */}
        <circle cx={sourceX} cy={sourceY} r={2.5} fill="#fff" opacity={0.9} />
        
        <circle cx={targetX} cy={targetY} r={5} fill="#0a0a0a" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
        <circle cx={targetX} cy={targetY} r={2.5} fill="#fff" opacity={0.9} />
      </g>
    </>
  );
};
