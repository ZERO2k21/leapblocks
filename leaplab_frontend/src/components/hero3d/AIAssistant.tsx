/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * AIAssistant.tsx — Floating AI companion.
 * Rounded capsule body, glowing eyes, antenna, holographic rings,
 * blue/purple accent strips, and organic float/rotate animations.
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, TIMING } from './constants';

const AIAssistant: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const holoRing1Ref = useRef<THREE.Mesh>(null);
  const holoRing2Ref = useRef<THREE.Mesh>(null);
  const holoRing3Ref = useRef<THREE.Mesh>(null);

  /** Track blink state without causing re‑renders */
  const blinkRef = useRef({ lastBlink: 0, isBlinking: false });

  /* ── Materials ── */
  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: COLORS.white,
        metalness: 0.05,
        roughness: 0.15,
        transmission: 0.3,
        thickness: 0.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        ior: 1.5,
        envMapIntensity: 1.0,
      }),
    [],
  );

  const eyeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COLORS.blue,
        emissive: COLORS.blue,
        emissiveIntensity: 1.5,
      }),
    [],
  );

  const accentMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COLORS.blue,
        emissive: COLORS.blue,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.8,
      }),
    [],
  );

  const holoMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: COLORS.cyan,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
      }),
    [],
  );

  const antennaMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#CBD5E1',
        metalness: 0.8,
        roughness: 0.2,
      }),
    [],
  );

  /* ── Animation loop ── */
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (!groupRef.current) return;

    // Float up and down
    groupRef.current.position.y =
      1.8 + Math.sin(t * (2 * Math.PI / TIMING.aiFloatPeriod)) * TIMING.aiFloatAmplitude;

    // Slow rotation
    groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.035; // ~2° sway

    // Look around: slight tilt toward different directions
    const lookPhase = Math.sin(t * (2 * Math.PI / TIMING.aiLookInterval));
    groupRef.current.rotation.z = lookPhase * 0.04;
    groupRef.current.rotation.x = Math.cos(t * 0.1) * 0.02;

    // Blink eyes
    const blink = blinkRef.current;
    if (t - blink.lastBlink > TIMING.aiBlinkInterval) {
      blink.lastBlink = t;
      blink.isBlinking = true;
    }
    if (blink.isBlinking && t - blink.lastBlink > TIMING.aiBlinkDuration) {
      blink.isBlinking = false;
    }
    const eyeScale = blink.isBlinking ? 0.1 : 1;
    if (leftEyeRef.current) leftEyeRef.current.scale.y = eyeScale;
    if (rightEyeRef.current) rightEyeRef.current.scale.y = eyeScale;

    // Holographic rings — different rotation speeds
    if (holoRing1Ref.current) {
      holoRing1Ref.current.rotation.z = t * 0.5;
      (holoRing1Ref.current.material as THREE.MeshBasicMaterial).opacity =
        0.15 + 0.1 * Math.sin(t * 2);
    }
    if (holoRing2Ref.current) {
      holoRing2Ref.current.rotation.z = -t * 0.35;
      (holoRing2Ref.current.material as THREE.MeshBasicMaterial).opacity =
        0.12 + 0.08 * Math.sin(t * 2.5 + 1);
    }
    if (holoRing3Ref.current) {
      holoRing3Ref.current.rotation.z = t * 0.25;
      (holoRing3Ref.current.material as THREE.MeshBasicMaterial).opacity =
        0.10 + 0.06 * Math.sin(t * 1.8 + 2);
    }
  });

  return (
    <group ref={groupRef} position={[0.6, 1.8, 0.3]}>
      {/* ── Main body — rounded capsule ── */}
      <mesh>
        <capsuleGeometry args={[0.28, 0.35, 16, 32]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>

      {/* ── Head dome — top sphere ── */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>

      {/* ── Eyes ── */}
      <mesh ref={leftEyeRef} position={[-0.09, 0.30, 0.19]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <primitive object={eyeMaterial} attach="material" />
      </mesh>
      <mesh ref={rightEyeRef} position={[0.09, 0.30, 0.19]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <primitive object={eyeMaterial} attach="material" />
      </mesh>

      {/* ── Blue accent strip — chest band ── */}
      <mesh position={[0, 0.0, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.285, 0.015, 8, 32]} />
        <primitive object={accentMaterial} attach="material" />
      </mesh>

      {/* ── Purple accent strip — lower ── */}
      <mesh position={[0, -0.12, 0]}>
        <torusGeometry args={[0.27, 0.012, 8, 32]} />
        <meshStandardMaterial
          color={COLORS.purple}
          emissive={COLORS.purple}
          emissiveIntensity={0.5}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* ── Antenna ── */}
      <group position={[0, 0.52, 0]}>
        {/* Stick */}
        <mesh>
          <cylinderGeometry args={[0.012, 0.012, 0.15, 8]} />
          <primitive object={antennaMaterial} attach="material" />
        </mesh>
        {/* Ball tip */}
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial
            color={COLORS.blue}
            emissive={COLORS.blue}
            emissiveIntensity={2}
          />
        </mesh>
      </group>

      {/* ── Holographic rings below ── */}
      <mesh ref={holoRing1Ref} position={[0, -0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.32, 0.36, 32]} />
        <primitive object={holoMaterial} attach="material" />
      </mesh>
      <mesh ref={holoRing2Ref} position={[0, -0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.38, 0.41, 32]} />
        <meshBasicMaterial color={COLORS.blue} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={holoRing3Ref} position={[0, -0.65, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.44, 0.46, 32]} />
        <meshBasicMaterial color={COLORS.purple} transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>

      {/* ── Soft glow sprite beneath ── */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6, 32]} />
        <meshBasicMaterial color={COLORS.blue} transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export default React.memo(AIAssistant);
