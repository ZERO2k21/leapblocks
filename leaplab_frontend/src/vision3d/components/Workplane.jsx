/**
 * Vision3D - Workplane Component
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React from 'react';
import { use3DStore } from '../store/use3DStore';
import { debug } from '../utils/logger';

const WORKPLANE_SIZE = 20;

export const Workplane = () => {
  const showGrid = use3DStore((s) => s.showGrid);
  const showAxes = use3DStore((s) => s.showAxes);
  const gridSnap = use3DStore((s) => s.gridSnap);
  debug('Workplane: grid=' + showGrid + ' axes=' + showAxes + ' snap=' + gridSnap);

  if (!showGrid && !showAxes) return null;

  return (
    <group>
      {showGrid && (
        <gridHelper
          args={[WORKPLANE_SIZE, gridSnap > 0 ? WORKPLANE_SIZE / gridSnap : 20, '#cbd5e1', '#e2e8f0']}
          position={[0, 0, 0]}
        />
      )}

      {showAxes && (
        <>
          <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[WORKPLANE_SIZE, 0.05]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.7} />
          </mesh>

          <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
            <planeGeometry args={[WORKPLANE_SIZE, 0.05]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.7} />
          </mesh>
        </>
      )}

      {(showGrid || showAxes) && (
        <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.15, 32]} />
          <meshBasicMaterial color="#6366f1" />
        </mesh>
      )}
    </group>
  );
};
