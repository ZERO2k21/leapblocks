/**
 * Vision3D - Transform Gizmo Render Functions
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React from 'react';
import * as THREE from 'three';

const AXIS_COLORS = { x: '#ef4444', y: '#22c55e', z: '#3b82f6' };
const AXIS_HOVER = { x: '#ff6666', y: '#66ff66', z: '#6666ff' };

export const setAxisRef = (axis) => (mesh) => {
  if (mesh) mesh.userData.gizmoAxis = axis;
};

export function useGizmoColors(dragInfo, hoveredAxis) {
  return (ax) => dragInfo?.axis === ax ? AXIS_HOVER[ax] : hoveredAxis === ax ? AXIS_HOVER[ax] : AXIS_COLORS[ax];
}

export function axisRot(ax) {
  return ax === 'x' ? [0, 0, -Math.PI / 2] : ax === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0];
}

export function shaftPos(ax, arrowLen) {
  return ax === 'x' ? [arrowLen / 2, 0, 0] : ax === 'y' ? [0, arrowLen / 2, 0] : [0, 0, arrowLen / 2];
}

export function headPos(ax, arrowLen) {
  return ax === 'x' ? [arrowLen, 0, 0] : ax === 'y' ? [0, arrowLen, 0] : [0, 0, arrowLen];
}

export function hitProps(ax, onHover, onUnhover, col) {
  return {
    ref: setAxisRef(ax),
    onPointerOver: (e) => { e.stopPropagation(); onHover(ax); },
    onPointerOut: (e) => { e.stopPropagation(); onUnhover(); },
  };
}

export function renderTranslate(s, col, onHover, onUnhover) {
  const arrowLen = 3 * s;
  const headLen = 0.5 * s;
  const headRad = 0.15 * s;
  const shaftRad = 0.04 * s;
  const hitR = 0.4 * s;

  return ['x', 'y', 'z'].map((ax) => {
    const c = col(ax);
    const rot = axisRot(ax);
    const hp = headPos(ax, arrowLen);
    const sp = shaftPos(ax, arrowLen);
    return (
      <group key={ax}>
        <mesh position={hp} rotation={rot}>
          <coneGeometry args={[headRad, headLen, 12]} />
          <meshBasicMaterial color={c} depthTest={false} />
        </mesh>
        <mesh position={sp} rotation={rot}>
          <cylinderGeometry args={[shaftRad, shaftRad, arrowLen, 8]} />
          <meshBasicMaterial color={c} depthTest={false} transparent opacity={0.9} />
        </mesh>
        <mesh position={sp} rotation={rot} {...hitProps(ax, onHover, onUnhover)}>
          <cylinderGeometry args={[hitR, hitR, arrowLen + headLen, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    );
  });
}

export function renderRotate(s, col, onHover, onUnhover) {
  const ringR = 2.5 * s;
  const ringT = 0.06 * s;

  return ['x', 'y', 'z'].map((ax) => {
    const c = col(ax);
    const rot = ax === 'x' ? [0, Math.PI / 2, 0] : ax === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0];
    return (
      <group key={ax}>
        <mesh rotation={rot} {...hitProps(ax, onHover, onUnhover)}>
          <torusGeometry args={[ringR, ringT, 16, 64]} />
          <meshBasicMaterial color={c} depthTest={false} transparent opacity={0.8} />
        </mesh>
      </group>
    );
  });
}

export function renderScale(s, col, onHover, onUnhover) {
  const len = 2.5 * s;
  const headLen = 0.5 * s;
  const shaftRad = 0.04 * s;
  const boxS = 0.2 * s;

  return ['x', 'y', 'z'].map((ax) => {
    const c = col(ax);
    const bp = headPos(ax, len / 2.5 * 3);
    const sp = shaftPos(ax, len / 2.5 * 3);
    const rot = axisRot(ax);
    return (
      <group key={ax}>
        <mesh position={bp}>
          <boxGeometry args={[boxS, boxS, boxS]} />
          <meshBasicMaterial color={c} depthTest={false} />
        </mesh>
        <mesh position={sp} rotation={rot}>
          <cylinderGeometry args={[shaftRad, shaftRad, len, 8]} />
          <meshBasicMaterial color={c} depthTest={false} transparent opacity={0.8} />
        </mesh>
        <mesh position={bp} {...hitProps(ax, onHover, onUnhover)}>
          <boxGeometry args={[boxS * 3, boxS * 3, boxS * 3]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    );
  });
}
