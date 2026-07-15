/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * Student.tsx — Minimal low‑poly student standing on the platform.
 * Capsule head, box torso, cylinder limbs, no facial details.
 * Subtle breathing and idle sway animations.
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, TIMING } from './constants';

const Student: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (!groupRef.current) return;

    // Breathing — subtle Y scale oscillation on torso
    if (torsoRef.current) {
      torsoRef.current.scale.y =
        1 + Math.sin(t * (2 * Math.PI / TIMING.studentBreathPeriod)) * TIMING.studentBreathAmplitude;
    }

    // Idle sway — very slight rotation
    groupRef.current.rotation.z =
      Math.sin(t * (2 * Math.PI / TIMING.studentSwayPeriod)) * TIMING.studentSwayAmplitude;
    groupRef.current.rotation.y =
      Math.sin(t * 0.08) * 0.02;
  });

  return (
    <group ref={groupRef} position={[-0.5, 0.04, 0.2]}>
      {/* ── Head ── */}
      <mesh position={[0, 1.38, 0]}>
        <capsuleGeometry args={[0.1, 0.08, 8, 16]} />
        <meshStandardMaterial color={COLORS.studentSkin} roughness={0.6} />
      </mesh>

      {/* ── Hair ── */}
      <mesh position={[0, 1.48, -0.01]}>
        <sphereGeometry args={[0.105, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={COLORS.studentHair} roughness={0.8} />
      </mesh>

      {/* ── Torso ── */}
      <mesh ref={torsoRef} position={[0, 1.05, 0]}>
        <boxGeometry args={[0.24, 0.36, 0.14]} />
        <meshStandardMaterial color={COLORS.studentShirt} roughness={0.5} />
      </mesh>

      {/* ── Left arm ── */}
      <mesh position={[-0.17, 1.02, 0]} rotation={[0, 0, 0.08]}>
        <capsuleGeometry args={[0.035, 0.28, 6, 8]} />
        <meshStandardMaterial color={COLORS.studentShirt} roughness={0.5} />
      </mesh>

      {/* ── Right arm ── */}
      <mesh position={[0.17, 1.02, 0]} rotation={[0, 0, -0.08]}>
        <capsuleGeometry args={[0.035, 0.28, 6, 8]} />
        <meshStandardMaterial color={COLORS.studentShirt} roughness={0.5} />
      </mesh>

      {/* ── Legs ── */}
      {/* Left leg */}
      <mesh position={[-0.065, 0.55, 0]}>
        <capsuleGeometry args={[0.04, 0.42, 6, 8]} />
        <meshStandardMaterial color={COLORS.studentPants} roughness={0.7} />
      </mesh>
      {/* Right leg */}
      <mesh position={[0.065, 0.55, 0]}>
        <capsuleGeometry args={[0.04, 0.42, 6, 8]} />
        <meshStandardMaterial color={COLORS.studentPants} roughness={0.7} />
      </mesh>

      {/* ── Shoes ── */}
      <mesh position={[-0.065, 0.28, 0.02]}>
        <boxGeometry args={[0.07, 0.04, 0.1]} />
        <meshStandardMaterial color="#1E293B" roughness={0.8} />
      </mesh>
      <mesh position={[0.065, 0.28, 0.02]}>
        <boxGeometry args={[0.07, 0.04, 0.1]} />
        <meshStandardMaterial color="#1E293B" roughness={0.8} />
      </mesh>

      {/* ── Backpack (small box on back, gives modern look) ── */}
      <mesh position={[0, 1.08, -0.12]}>
        <boxGeometry args={[0.16, 0.22, 0.08]} />
        <meshStandardMaterial color={COLORS.blue} roughness={0.4} metalness={0.1} />
      </mesh>
    </group>
  );
};

export default React.memo(Student);
