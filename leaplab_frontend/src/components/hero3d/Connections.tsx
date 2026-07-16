/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * Connections.tsx — Animated glowing spline connections between orbiting
 * modules.  Curved lines pulse every 3 s, energy particles travel along them.
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ORBIT_MODULES, CONNECTION_PAIRS, COLORS, TIMING } from './constants';

/** Number of energy particles per connection */
const PARTICLES_PER_LINE = 2;
/** Curve segment count */
const CURVE_SEGMENTS = 32;

/**
 * Computes the current world position of a module given time `t`.
 */
function getModulePosition(index: number, t: number): THREE.Vector3 {
  const def = ORBIT_MODULES[index];
  const angle = def.startAngle + t * def.speed;
  return new THREE.Vector3(
    Math.cos(angle) * def.radius,
    def.height + Math.sin(t * def.floatFrequency) * def.floatAmplitude,
    Math.sin(angle) * def.radius,
  );
}

/** Palette of connection colours */
const LINE_COLORS = [COLORS.connectionBlue, COLORS.connectionPurple, COLORS.connectionCyan];

const Connections: React.FC = () => {
  /** Refs for line meshes — we update geometry every frame */
  const linesRef = useRef<(THREE.Line | null)[]>([]);
  /** Refs for particle meshes per connection */
  const particlesRef = useRef<(THREE.Mesh | null)[][]>(
    CONNECTION_PAIRS.map(() => Array(PARTICLES_PER_LINE).fill(null)),
  );

  /** Pre-allocate curve helper */
  const curveHelper = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(),
  ]), []);

  /** Line materials — one per colour in palette */
  const lineMaterials = useMemo(
    () =>
      LINE_COLORS.map(
        (color) =>
          new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity: 0.25,
            linewidth: 1,
          }),
      ),
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulseFactor = 0.15 + 0.15 * Math.sin(t * (2 * Math.PI / TIMING.connectionPulsePeriod));

    CONNECTION_PAIRS.forEach(([a, b], i) => {
      const posA = getModulePosition(a, t);
      const posB = getModulePosition(b, t);
      const mid = posA.clone().add(posB).multiplyScalar(0.5);
      // Lift midpoint for a nice arc
      mid.y += 0.3;

      // Update curve
      curveHelper.points[0].copy(posA);
      curveHelper.points[1].copy(mid);
      curveHelper.points[2].copy(posB);
      curveHelper.updateArcLengths();

      // Update line geometry
      const line = linesRef.current[i];
      if (line) {
        const pts = curveHelper.getPoints(CURVE_SEGMENTS);
        (line.geometry as THREE.BufferGeometry).setFromPoints(pts);
        (line.material as THREE.LineBasicMaterial).opacity = pulseFactor;
      }

      // Update particles
      const particles = particlesRef.current[i];
      if (particles) {
        particles.forEach((mesh, pi) => {
          if (!mesh) return;
          const progress = ((t * TIMING.energyParticleSpeed + pi * 0.5) % 1);
          const pos = curveHelper.getPointAt(progress);
          mesh.position.copy(pos);
          // Fade near ends
          const fade = Math.sin(progress * Math.PI);
          ((mesh.material as THREE.MeshBasicMaterial)).opacity = fade * 0.8;
          mesh.scale.setScalar(0.02 + fade * 0.015);
        });
      }
    });
  });

  return (
    <group>
      {/* Lines */}
      {CONNECTION_PAIRS.map(([a, b], i) => (
        <line
          key={`l${i}`}
          ref={(el: any) => { linesRef.current[i] = el; }}
        >
          <bufferGeometry />
          <primitive object={lineMaterials[i % lineMaterials.length]} attach="material" />
        </line>
      ))}

      {/* Energy particles */}
      {CONNECTION_PAIRS.map((_pair, i) =>
        Array.from({ length: PARTICLES_PER_LINE }).map((_, pi) => (
          <mesh
            key={`p${i}-${pi}`}
            ref={(el: THREE.Mesh | null) => {
              if (!particlesRef.current[i]) particlesRef.current[i] = [];
              particlesRef.current[i][pi] = el;
            }}
          >
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshBasicMaterial
              color={LINE_COLORS[i % LINE_COLORS.length]}
              transparent
              opacity={0.6}
            />
          </mesh>
        )),
      )}
    </group>
  );
};

export default React.memo(Connections);
