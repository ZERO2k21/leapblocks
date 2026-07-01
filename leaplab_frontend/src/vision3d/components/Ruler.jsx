/**
 * Vision3D - Ruler Measurement Tool
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React, { useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { use3DStore } from '../store/use3DStore';
import { log } from '../utils/logger';

export const Ruler = () => {
  const rulerActive = use3DStore((s) => s.rulerActive);
  const rulerOrigin = use3DStore((s) => s.rulerOrigin);
  const setRulerOrigin = use3DStore((s) => s.setRulerOrigin);
  const clearRuler = use3DStore((s) => s.clearRuler);
  const { camera, raycaster, gl } = useThree();
  const [hoverPoint, setHoverPoint] = useState(null);

  const getIntersection = useCallback(
    (event) => {
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);

      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersection);
      return intersection ? [intersection.x, intersection.y, intersection.z] : null;
    },
    [camera, raycaster, gl]
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (!rulerActive) return;
      const point = getIntersection(event);
      if (point) setHoverPoint(point);
    },
    [rulerActive, getIntersection]
  );

  const handleClick = useCallback(
    (event) => {
      if (!rulerActive) return;
      event.stopPropagation();
      const point = getIntersection(event);
      if (!point) return;

      if (!rulerOrigin) {
        setRulerOrigin(point);
        log('Ruler: origin set at', point);
      } else {
        clearRuler();
        log('Ruler: measurement complete');
      }
    },
    [rulerActive, rulerOrigin, getIntersection, setRulerOrigin, clearRuler]
  );

  const measurement = useMemo(() => {
    if (!rulerOrigin || !hoverPoint) return null;
    const dx = hoverPoint[0] - rulerOrigin[0];
    const dy = hoverPoint[1] - rulerOrigin[1];
    const dz = hoverPoint[2] - rulerOrigin[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const midpoint = [
      (rulerOrigin[0] + hoverPoint[0]) / 2,
      (rulerOrigin[1] + hoverPoint[1]) / 2,
      (rulerOrigin[2] + hoverPoint[2]) / 2,
    ];
    return { distance, midpoint, dx, dy, dz };
  }, [rulerOrigin, hoverPoint]);

  if (!rulerActive) return null;

  return (
    <group>
      {/* Invisible click plane */}
      <mesh
        visible={false}
        onClick={handleClick}
        onPointerMove={handlePointerMove}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Origin point marker */}
      {rulerOrigin && (
        <mesh position={rulerOrigin}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      )}

      {/* Line from origin to hover */}
      {rulerOrigin && hoverPoint && (
        <>
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([...rulerOrigin, ...hoverPoint])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#ef4444" linewidth={2} />
          </line>

          {/* Distance label */}
          {measurement && (
            <Html position={measurement.midpoint} center>
              <div
                style={{
                  background: 'rgba(0,0,0,0.85)',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  border: '1px solid #ef4444',
                }}
              >
                {measurement.distance.toFixed(2)} mm
                <br />
                <span style={{ fontSize: '10px', color: '#aaa' }}>
                  X: {measurement.dx.toFixed(2)} | Y: {measurement.dy.toFixed(2)} | Z: {measurement.dz.toFixed(2)}
                </span>
              </div>
            </Html>
          )}

          {/* Endpoint marker */}
          <mesh position={hoverPoint}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshBasicMaterial color="#f97316" />
          </mesh>
        </>
      )}

      {/* Instruction label */}
      {rulerActive && !rulerOrigin && (
        <Html position={[0, 3, 0]} center>
          <div
            style={{
              background: 'rgba(0,0,0,0.85)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontFamily: 'sans-serif',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              userSelect: 'none',
              border: '1px solid #6366f1',
            }}
          >
            Click to set measurement start point (Esc to cancel)
          </div>
        </Html>
      )}
    </group>
  );
};
