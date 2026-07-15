/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * BackgroundElements.tsx — Subtle background decorations:
 * floating hexagons, circuit nodes, and soft glowing dots.
 * All rendered with InstancedMesh for GPU performance.
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BACKGROUND, COLORS, TIMING } from './constants';

/* ── Helper: create hexagon shape geometry ── */
function createHexGeometry(size: number): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = Math.cos(angle) * size;
    const y = Math.sin(angle) * size;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

/* ── Seed data for hexagons ── */
interface HexData {
  position: THREE.Vector3;
  phase: number;
  rotSpeed: number;
}

const BackgroundElements: React.FC = () => {
  const hexRef = useRef<THREE.InstancedMesh>(null);
  const dotRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  /** Hexagon seed data */
  const hexData = useMemo<HexData[]>(() => {
    const arr: HexData[] = [];
    for (let i = 0; i < BACKGROUND.hexCount; i++) {
      arr.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * BACKGROUND.hexSpread * 2,
          Math.random() * BACKGROUND.hexSpread * 0.8 + 0.5,
          (Math.random() - 0.5) * BACKGROUND.hexSpread - 2,
        ),
        phase: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.15,
      });
    }
    return arr;
  }, []);

  /** Dot positions */
  const dotPositions = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i < BACKGROUND.dotCount; i++) {
      arr.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * BACKGROUND.dotSpread * 2,
          Math.random() * BACKGROUND.dotSpread * 0.6 + 0.3,
          (Math.random() - 0.5) * BACKGROUND.dotSpread - 3,
        ),
      );
    }
    return arr;
  }, []);

  /** Hexagon geometry (shared) */
  const hexGeo = useMemo(() => createHexGeometry(BACKGROUND.hexSize), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Hexagons — slow float
    if (hexRef.current) {
      for (let i = 0; i < hexData.length; i++) {
        const d = hexData[i];
        dummy.position.copy(d.position);
        dummy.position.y += Math.sin(t * (2 * Math.PI / TIMING.bgFloatPeriod) + d.phase) * 0.15;
        dummy.rotation.z = t * d.rotSpeed;
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        hexRef.current.setMatrixAt(i, dummy.matrix);
      }
      hexRef.current.instanceMatrix.needsUpdate = true;
    }

    // Dots — gentle pulse via scale
    if (dotRef.current) {
      for (let i = 0; i < dotPositions.length; i++) {
        dummy.position.copy(dotPositions[i]);
        const pulse = 0.6 + 0.4 * Math.sin(t * 1.2 + i * 0.4);
        dummy.scale.setScalar(pulse);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        dotRef.current.setMatrixAt(i, dummy.matrix);
      }
      dotRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Floating hexagons */}
      <instancedMesh
        ref={hexRef}
        args={[hexGeo, undefined, BACKGROUND.hexCount]}
        frustumCulled={false}
      >
        <meshBasicMaterial
          color={COLORS.blue}
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
          wireframe
        />
      </instancedMesh>

      {/* Glowing dots */}
      <instancedMesh
        ref={dotRef}
        args={[undefined, undefined, BACKGROUND.dotCount]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshBasicMaterial color={COLORS.purple} transparent opacity={0.12} />
      </instancedMesh>
    </group>
  );
};

export default React.memo(BackgroundElements);
