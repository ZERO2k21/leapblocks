/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * Particles.tsx — 200 GPU‑instanced floating particles.
 * Slow movement, varying sizes, some rotate, some fade.
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PARTICLES, COLORS, TIMING } from './constants';

/** Seed data for each particle (position, velocity, size, phase) */
interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  size: number;
  phase: number;
  rotationSpeed: number;
}

const Particles: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  /** Pre‑compute particle data once */
  const data = useMemo<ParticleData[]>(() => {
    const arr: ParticleData[] = [];
    for (let i = 0; i < PARTICLES.count; i++) {
      arr.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * PARTICLES.spread * 2,
          Math.random() * PARTICLES.spread,
          (Math.random() - 0.5) * PARTICLES.spread * 2,
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * TIMING.particleDriftSpeed,
          (Math.random() - 0.3) * TIMING.particleDriftSpeed * 0.5,
          (Math.random() - 0.5) * TIMING.particleDriftSpeed,
        ),
        size: PARTICLES.sizeMin + Math.random() * (PARTICLES.sizeMax - PARTICLES.sizeMin),
        phase: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.5,
      });
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    for (let i = 0; i < data.length; i++) {
      const d = data[i];

      // Drift
      d.position.add(d.velocity.clone().multiplyScalar(0.016)); // ~60fps dt

      // Wrap around bounds
      const half = PARTICLES.spread;
      if (d.position.x > half) d.position.x = -half;
      if (d.position.x < -half) d.position.x = half;
      if (d.position.y > half) d.position.y = 0;
      if (d.position.y < 0) d.position.y = half;
      if (d.position.z > half) d.position.z = -half;
      if (d.position.z < -half) d.position.z = half;

      dummy.position.copy(d.position);
      dummy.rotation.y = t * d.rotationSpeed;
      dummy.rotation.x = t * d.rotationSpeed * 0.3;

      // Fade effect via scale modulation
      const fade = 0.6 + 0.4 * Math.sin(t * 0.8 + d.phase);
      dummy.scale.setScalar(d.size * fade);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLES.count]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color={COLORS.blue}
        transparent
        opacity={0.35}
      />
    </instancedMesh>
  );
};

export default React.memo(Particles);
