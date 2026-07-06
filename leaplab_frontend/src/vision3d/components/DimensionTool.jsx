/**
 * Vision3D - Dimension Tool Component
 * Displays measurements between points on shapes.
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { use3DStore } from '../store/use3DStore';

const DimensionLine = ({ start, end, label, color = '#ef4444' }) => {
  const midpoint = useMemo(() => {
    return [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2 + 0.3,
      (start[2] + end[2]) / 2,
    ];
  }, [start, end]);

  const distance = useMemo(() => {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dz = end[2] - start[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }, [start, end]);

  const points = useMemo(() => {
    return [
      new THREE.Vector3(...start),
      new THREE.Vector3(...end),
    ];
  }, [start, end]);

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  return (
    <group>
      <line geometry={lineGeometry}>
        <lineBasicMaterial color={color} linewidth={2} />
      </line>

      {/* End markers */}
      <mesh position={start}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={end}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Distance label */}
      <Html position={midpoint} center style={{ pointerEvents: 'none' }}>
        <div style={{
          background: color,
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '11px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}>
          {label || `${distance.toFixed(2)} units`}
        </div>
      </Html>
    </group>
  );
};

const BoundingBoxDimensions = ({ shape }) => {
  const dimensions = useMemo(() => {
    let w, h, d;

    switch (shape.type) {
      case 'box':
        w = shape.width ?? 2;
        h = shape.height ?? 2;
        d = shape.depth ?? 2;
        break;
      case 'cylinder':
      case 'cone':
        w = (shape.radiusTop ?? shape.radiusBottom ?? shape.coneRadius ?? 1) * 2;
        h = shape.cylinderHeight ?? shape.coneHeight ?? 2;
        d = w;
        break;
      case 'sphere':
      case 'dodecahedron':
      case 'icosahedron':
      case 'octahedron':
      case 'tetrahedron':
        w = (shape.radius ?? 1) * 2;
        h = w;
        d = w;
        break;
      case 'torus':
        w = (shape.torusRadius ?? 1) * 2 + (shape.tubeRadius ?? 0.4) * 2;
        h = (shape.tubeRadius ?? 0.4) * 2;
        d = w;
        break;
      default:
        w = 2;
        h = 2;
        d = 2;
    }

    // Apply scale
    w *= shape.scale?.[0] ?? 1;
    h *= shape.scale?.[1] ?? 1;
    d *= shape.scale?.[2] ?? 1;

    return { w, h, d };
  }, [shape]);

  const pos = shape.position;
  const halfW = dimensions.w / 2;
  const halfH = dimensions.h / 2;
  const halfD = dimensions.d / 2;

  return (
    <group>
      {/* Width dimension (X) */}
      <DimensionLine
        start={[pos[0] - halfW, pos[1] - halfH - 0.5, pos[2]]}
        end={[pos[0] + halfW, pos[1] - halfH - 0.5, pos[2]]}
        label={`W: ${dimensions.w.toFixed(2)}`}
        color="#ef4444"
      />

      {/* Height dimension (Y) */}
      <DimensionLine
        start={[pos[0] - halfW - 0.5, pos[1] - halfH, pos[2]]}
        end={[pos[0] - halfW - 0.5, pos[1] + halfH, pos[2]]}
        label={`H: ${dimensions.h.toFixed(2)}`}
        color="#22c55e"
      />

      {/* Depth dimension (Z) */}
      <DimensionLine
        start={[pos[0], pos[1] - halfH - 0.5, pos[2] - halfD]}
        end={[pos[0], pos[1] - halfH - 0.5, pos[2] + halfD]}
        label={`D: ${dimensions.d.toFixed(2)}`}
        color="#3b82f6"
      />
    </group>
  );
};

export const DimensionTool = () => {
  const shapes = use3DStore((s) => s.shapes);
  const selectedIds = use3DStore((s) => s.selectedIds);
  const showDimensions = use3DStore((s) => s.showDimensions);

  if (!showDimensions || selectedIds.length === 0) return null;

  return (
    <group>
      {selectedIds.map(id => {
        const shape = shapes.find(s => s.id === id);
        if (!shape || !shape.visible) return null;
        return <BoundingBoxDimensions key={id} shape={shape} />;
      })}
    </group>
  );
};
