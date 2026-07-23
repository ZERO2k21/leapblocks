/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * HeroScene.tsx — Root component for the 3D hero animation.
 * Wraps an R3F `<Canvas>` with transparent background, perspective camera,
 * mouse parallax, and all scene sub-components.
 */

import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA, TIMING } from './constants';
import { useMouseParallax } from './useMouseParallax';

import Lights from './Lights';
import Platform from './Platform';
import AIAssistant from './AIAssistant';
import Student from './Student';
import OrbitModules from './OrbitModules';
import Connections from './Connections';
import Particles from './Particles';
import BackgroundElements from './BackgroundElements';

/* ────────────────────────────────────────────────────────────────────
   Inner scene — must be a child of <Canvas> so R3F hooks work.
   ──────────────────────────────────────────────────────────────────── */

const SceneContent: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const parallax = useMouseParallax();

  /** Entrance animation — opacity fade + slight zoom */
  const entranceRef = useRef({ progress: 0, started: false });

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    const entrance = entranceRef.current;

    // Entrance animation
    if (!entrance.started) {
      entrance.started = true;
    }
    if (entrance.progress < 1) {
      entrance.progress = Math.min(1, entrance.progress + 0.016 / TIMING.entranceDuration);
      const eased = 1 - Math.pow(1 - entrance.progress, 3); // easeOutCubic

      // Zoom camera slightly
      camera.position.z = CAMERA.position[2] + 2 * (1 - eased);
      camera.position.y = CAMERA.position[1] + 0.5 * (1 - eased);
    }

    // Apply parallax rotation to the scene group
    if (groupRef.current) {
      const p = parallax.current;
      groupRef.current.rotation.x = p.rotationX;
      groupRef.current.rotation.y = p.rotationY;

      // Entrance fade: scale from 0.85 → 1
      if (entrance.progress < 1) {
        const eased = 1 - Math.pow(1 - entrance.progress, 3);
        const s = 0.85 + 0.15 * eased;
        groupRef.current.scale.setScalar(s);
      }
    }

    // Very slow cinematic camera drift
    camera.position.x = Math.sin(t * 0.03) * 0.15;
    camera.lookAt(CAMERA.lookAt[0], CAMERA.lookAt[1], CAMERA.lookAt[2]);
  });

  return (
    <group ref={groupRef}>
      <Lights />
      <Platform />
      <AIAssistant />
      <Student />
      <OrbitModules />
      <Connections />
      <Particles />
      <BackgroundElements />
    </group>
  );
};

/* ────────────────────────────────────────────────────────────────────
   Fallback while scene loads
   ──────────────────────────────────────────────────────────────────── */

const LoadingFallback: React.FC = () => (
  <div className="w-full h-full flex items-center justify-center bg-transparent">
    <div className="w-10 h-10 border-[3px] border-[rgba(99,102,241,0.15)] border-t-[#6366F1] rounded-full animate-[hero3d-spin_0.8s_linear_infinite]" />
    <style>{`@keyframes hero3d-spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

/* ────────────────────────────────────────────────────────────────────
   HeroScene — exported component, drop-in replacement for the Lottie anim
   ──────────────────────────────────────────────────────────────────── */

const HeroScene: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /** Fade in once the component mounts */
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[300px] relative"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: `opacity ${TIMING.entranceDuration}s cubic-bezier(0.4, 0, 0.2, 1)`,
      }}
    >
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{
            fov: CAMERA.fov,
            near: CAMERA.near,
            far: CAMERA.far,
            position: CAMERA.position,
          }}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
          }}
          dpr={[1, 1.5]} // Cap pixel ratio for performance
          className="bg-transparent"
        >
          <SceneContent />
        </Canvas>
      </Suspense>
    </div>
  );
};

export default HeroScene;
