/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * Platform.tsx — Circular holographic platform with glowing outer ring,
 * counter‑rotating inner grid, and a pulsing glow effect.
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, TIMING } from './constants';

const Platform: React.FC = () => {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerGridRef = useRef<THREE.Mesh>(null);
  const glowRingRef = useRef<THREE.Mesh>(null);
  const basePlateRef = useRef<THREE.Mesh>(null);

  /* ── Materials (memoised) ── */
  const outerMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COLORS.platformBlue,
        emissive: COLORS.platformBlue,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      }),
    [],
  );

  const innerMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COLORS.platformCyan,
        emissive: COLORS.platformCyan,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.3,
        wireframe: true,
        side: THREE.DoubleSide,
      }),
    [],
  );

  const glowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: COLORS.platformBlue,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      }),
    [],
  );

  const baseMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1a1a2e',
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      }),
    [],
  );

  /* ── Animation loop ── */
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Outer ring — slow clockwise rotation
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = t * TIMING.platformOuterSpeed;
    }

    // Inner grid — counter‑rotate
    if (innerGridRef.current) {
      innerGridRef.current.rotation.z = t * TIMING.platformInnerSpeed;
    }

    // Pulsing glow
    if (glowRingRef.current) {
      const pulse = 0.10 + 0.08 * Math.sin(t * (2 * Math.PI / TIMING.platformPulsePeriod));
      (glowRingRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
      glowRingRef.current.scale.setScalar(1 + 0.03 * Math.sin(t * 2));
    }

    // Base plate subtle pulse
    if (basePlateRef.current) {
      const pulse = 0.12 + 0.05 * Math.sin(t * 1.5);
      (basePlateRef.current.material as THREE.MeshStandardMaterial).opacity = pulse;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Translucent base plate */}
      <mesh ref={basePlateRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[1.8, 64]} />
        <primitive object={baseMaterial} attach="material" />
      </mesh>

      {/* Outer glowing ring */}
      <mesh ref={outerRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.65, 1.8, 64]} />
        <primitive object={outerMaterial} attach="material" />
      </mesh>

      {/* Inner wireframe grid disc */}
      <mesh ref={innerGridRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.3, 1.6, 6, 3]} />
        <primitive object={innerMaterial} attach="material" />
      </mesh>

      {/* Glow disc (bloom substitute) */}
      <mesh ref={glowRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[2.2, 64]} />
        <primitive object={glowMaterial} attach="material" />
      </mesh>

      {/* Tiny tick marks around the outer ring */}
      {Array.from({ length: 36 }).map((_, i) => {
        const angle = (i / 36) * Math.PI * 2;
        const r = 1.85;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * r, 0.025, Math.sin(angle) * r]}
            rotation={[-Math.PI / 2, 0, angle]}
          >
            <boxGeometry args={[0.04, 0.005, 0.001]} />
            <meshBasicMaterial color={COLORS.platformBlue} transparent opacity={0.4} />
          </mesh>
        );
      })}
    </group>
  );
};

export default React.memo(Platform);
