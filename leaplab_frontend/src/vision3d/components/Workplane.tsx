/**
 * Vision3D - Workplane Component
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React from 'react';
import { use3DStore } from '../store/use3DStore';

const WORKPLANE_SIZE = 20;

export const Workplane: React.FC = () => {
  const showGrid = use3DStore((s) => s.showGrid);
  const showAxes = use3DStore((s) => s.showAxes);
  const gridSnap = use3DStore((s) => s.gridSnap);

  if (!showGrid) return null;

  return (
    <group>
      {/* Main grid */}
      <gridHelper
        args={[WORKPLANE_SIZE, WORKPLANE_SIZE / gridSnap, '#cbd5e1', '#e2e8f0']}
        position={[0, 0, 0]}
      />

      {/* Axes - Simple colored planes */}
      {showAxes && (
        <>
          {/* X axis - Red */}
          <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[WORKPLANE_SIZE, 0.05]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.7} />
          </mesh>

          {/* Z axis - Blue */}
          <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
            <planeGeometry args={[WORKPLANE_SIZE, 0.05]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.7} />
          </mesh>
        </>
      )}

      {/* Center indicator */}
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 32]} />
        <meshBasicMaterial color="#6366f1" />
      </mesh>
    </group>
  );
};
