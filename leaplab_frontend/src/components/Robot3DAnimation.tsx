/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * Robot3DAnimation.tsx — Three.js-based interactive GLB 3D model viewer.
 */

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Center, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Configure Draco decoder path in case the GLB model is Draco-compressed
useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

const MODEL_PATH = 'assets/sprites/robot/robot_bright_colors_1.glb';

/**
 * Modifies the texture at runtime to replace the dark charcoal body parts
 * with a premium white/light grey color, while preserving shadows, highlights, and screens.
 */
const makeTextureWhite = (texture: THREE.Texture) => {
  const image = texture.image as any;
  if (!image) return texture;

  const canvas = document.createElement('canvas');
  canvas.width = image.width || image.naturalWidth || 1024;
  canvas.height = image.height || image.naturalHeight || 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return texture;

  ctx.drawImage(image, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // User-tuned optimal filter values
  const grayTolerance = 49;
  const minBright = 78;
  const maxBright = 234;
  const targetR = 210;
  const targetG = 232;
  const targetB = 241;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    // Gray color detection: small difference between RGB channels,
    // and fits in the brightness window of the charcoal body
    if (diff <= grayTolerance && max >= minBright && max <= maxBright) {
      // Calculate scale factor to preserve shading detail
      const range = maxBright - minBright;
      const pct = (max - minBright) / (range || 1);
      
      // Interpolate to white/light grey
      const newR = Math.round(targetR - (1 - pct) * 35);
      const newG = Math.round(targetG - (1 - pct) * 35);
      const newB = Math.round(targetB - (1 - pct) * 35);

      data[i] = Math.min(255, Math.max(0, newR));
      data[i + 1] = Math.min(255, Math.max(0, newG));
      data[i + 2] = Math.min(255, Math.max(0, newB));
    }
  }

  ctx.putImageData(imgData, 0, 0);
  
  const newTexture = new THREE.CanvasTexture(canvas);
  newTexture.flipY = texture.flipY;
  newTexture.wrapS = texture.wrapS;
  newTexture.wrapT = texture.wrapT;
  newTexture.colorSpace = texture.colorSpace;
  newTexture.needsUpdate = true;
  
  return newTexture;
};

interface ModelProps {
  url: string;
}

const Model: React.FC<ModelProps> = ({ url }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(url);
  const { actions, names } = useAnimations(animations, groupRef);

  // Auto-scale, center the model, and apply the white texture filter
  useEffect(() => {
    if (scene) {
      const processedTextures = new Map<THREE.Texture, THREE.Texture>();

      // Traverse and enable shadows + apply texture filter
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          if (mesh.material) {
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach((mat: any) => {
              if (mat && mat.map) {
                if (!url.includes('bright_colors')) {
                  if (!processedTextures.has(mat.map)) {
                    const whiteTex = makeTextureWhite(mat.map);
                    processedTextures.set(mat.map, whiteTex);
                  }
                  mat.map = processedTextures.get(mat.map)!;
                  mat.needsUpdate = true;
                }
              }
            });
          }
        }
      });

      // Calculate size to scale appropriately
      const box = new THREE.Box3().setFromObject(scene);
      const size = new THREE.Vector3();
      box.getSize(size);
      
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 2.4; // Fits nicely in the canvas
      const scaleFactor = targetSize / (maxDim || 1);
      
      scene.scale.setScalar(scaleFactor);
    }
  }, [scene]);

  // Handle animation playing
  useEffect(() => {
    if (names.length > 0) {
      // Find idle animation, or default to the first one
      const idleAnim = names.find(n => n.toLowerCase().includes('idle')) || names[0];
      if (idleAnim && actions[idleAnim]) {
        actions[idleAnim].reset().fadeIn(0.5).play();
      }
    }
  }, [actions, names]);

  useFrame((state) => {
    if (groupRef.current) {
      // 1. Mouse parallax tilt (tilt based on pointer position)
      const targetRotationX = -state.pointer.y * 0.20; // Vertical tilt
      const targetRotationY = state.pointer.x * 0.25; // Horizontal tilt
      
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotationX, 0.08);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotationY, 0.08);

      // 2. Subtle float/sway effect
      const t = state.clock.getElapsedTime();
      const floatOffset = Math.sin(t * 1.5) * 0.08;
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, floatOffset, 0.08);
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  );
};

const FloatingParticles: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 50;
  
  const [positions] = useState(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1.5;
    }
    return pos;
  });

  useFrame((state) => {
    if (pointsRef.current) {
      const elapsed = state.clock.getElapsedTime();
      pointsRef.current.rotation.y = elapsed * 0.04;
      pointsRef.current.rotation.x = elapsed * 0.02;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#6366F1"
        size={0.07}
        sizeAttenuation
        transparent
        opacity={0.4}
      />
    </points>
  );
};

interface Robot3DAnimationProps {
  onSelect?: (mode: string) => void;
}

const Robot3DAnimation: React.FC<Robot3DAnimationProps> = ({ onSelect }) => {
  return (
    <div className="robot-3d-container">
      <style>{`
        :root {
          --orbit-radius: 170px;
          --card-width: 110px;
          --card-height: 110px;
          --icon-size: 96px;
          --orbit-offset-y: 40px;
        }

        @media (max-width: 1024px) {
          :root {
            --orbit-radius: 140px;
            --card-width: 90px;
            --card-height: 90px;
            --icon-size: 80px;
            --orbit-offset-y: 30px;
          }
        }

        @media (max-width: 768px) {
          :root {
            --orbit-radius: 100px;
            --card-width: 70px;
            --card-height: 70px;
            --icon-size: 60px;
            --orbit-offset-y: 20px;
          }
        }

        @keyframes autoRun3d {
          from {
            transform: rotateY(-360deg);
          }
          to {
            transform: rotateY(0deg);
          }
        }

        @keyframes animateBrightness {
          10% {
            filter: brightness(1) drop-shadow(0 0 10px rgba(99, 102, 241, 0.25));
          }
          50% {
            filter: brightness(0.2) drop-shadow(0 0 2px rgba(99, 102, 241, 0.05));
          }
          90% {
            filter: brightness(1) drop-shadow(0 0 10px rgba(99, 102, 241, 0.25));
          }
        }

        .robot-3d-container {
          width: 100%;
          height: 100%;
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: visible;
        }

        .robot-3d-wrapper {
          width: 100%;
          height: 100%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transform-style: preserve-3d;
          perspective: 1000px;
        }

        .robot-3d-canvas {
          width: 100%;
          height: 100%;
          max-height: 450px;
          opacity: 1;
          outline: none;
          transform: translateZ(0);
        }

        .card-3d {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          transform-style: preserve-3d;
          pointer-events: none;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: autoRun3d 24s linear infinite;
          will-change: transform;
        }

        .carousel-card-wrapper {
          position: absolute;
          width: var(--card-width);
          height: var(--card-height);
          top: calc(50% - (var(--card-height) / 2) + var(--orbit-offset-y));
          left: calc(50% - (var(--card-width) / 2));
          transform-style: preserve-3d;
          animation: animateBrightness 24s linear infinite;
          will-change: transform, filter;
        }

        .carousel-card-inner {
          pointer-events: auto;
          width: 100%;
          height: 100%;
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          cursor: pointer;
        }

        .carousel-card-inner img {
          width: var(--icon-size);
          height: var(--icon-size);
          object-fit: contain;
          transition: transform 0.3s ease, filter 0.3s ease;
          filter: drop-shadow(0 4px 10px rgba(16, 0, 81, 0.12));
        }

        .carousel-card-inner:hover {
          transform: scale(1.12);
        }

        .carousel-card-inner:hover img {
          transform: scale(1.1);
          filter: drop-shadow(0 8px 20px rgba(99, 102, 241, 0.45));
        }

        .card-3d:hover,
        .card-3d:hover .carousel-card-wrapper {
          animation-play-state: paused !important;
        }

        /* 3D positioning for 8 cards */
        .carousel-card-wrapper:nth-child(1) {
          transform: rotateY(0deg) translateZ(var(--orbit-radius));
          animation-delay: -0s;
        }
        .carousel-card-wrapper:nth-child(2) {
          transform: rotateY(45deg) translateZ(var(--orbit-radius));
          animation-delay: -3s;
        }
        .carousel-card-wrapper:nth-child(3) {
          transform: rotateY(90deg) translateZ(var(--orbit-radius));
          animation-delay: -6s;
        }
        .carousel-card-wrapper:nth-child(4) {
          transform: rotateY(135deg) translateZ(var(--orbit-radius));
          animation-delay: -9s;
        }
        .carousel-card-wrapper:nth-child(5) {
          transform: rotateY(180deg) translateZ(var(--orbit-radius));
          animation-delay: -12s;
        }
        .carousel-card-wrapper:nth-child(6) {
          transform: rotateY(225deg) translateZ(var(--orbit-radius));
          animation-delay: -15s;
        }
        .carousel-card-wrapper:nth-child(7) {
          transform: rotateY(270deg) translateZ(var(--orbit-radius));
          animation-delay: -18s;
        }
        .carousel-card-wrapper:nth-child(8) {
          transform: rotateY(315deg) translateZ(var(--orbit-radius));
          animation-delay: -21s;
        }

        @media (max-width: 1024px) {
          .robot-3d-container {
            min-height: 300px;
          }
          .robot-3d-canvas {
            max-height: 380px;
          }
        }

        @media (max-width: 768px) {
          .robot-3d-container {
            min-height: 250px;
          }
          .robot-3d-canvas {
            max-height: 300px;
          }
        }
      `}</style>

      <div className="robot-3d-wrapper">
        <Suspense fallback={
          <div style={{ width: 40, height: 40, border: '3px solid rgba(99,102,241,0.15)', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'hero3d-spin 0.8s linear infinite' }} />
        }>
          <Canvas
            className="robot-3d-canvas"
            camera={{ position: [0, 0, 4.0], fov: 45 }}
            gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
          >
            {/* Ambient fill */}
            <ambientLight intensity={0.8} />

            {/* Main Key Light */}
            <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />

            {/* Accent colored lights to make it look premium */}
            <pointLight position={[-4, 3, 2]} intensity={2.0} color="#6366F1" />
            <pointLight position={[4, -3, 2]} intensity={1.5} color="#8B5CF6" />
            
            {/* Environment map for realistic materials & reflections */}
            <Environment preset="city" environmentIntensity={0.6} />

            {/* Floating background particles */}
            <FloatingParticles />

            {/* The 3D GLB Model itself */}
            <Model url={MODEL_PATH} />
          </Canvas>
        </Suspense>

        {/* 3D Orbiting Cards */}
        <div className="card-3d">
          <div className="carousel-card-wrapper">
            <div className="carousel-card-inner" onClick={() => onSelect?.('pulse')}>
              <img src="assets/quiz_icon.png" alt="Pulse" />
            </div>
          </div>
          <div className="carousel-card-wrapper">
            <div className="carousel-card-inner" onClick={() => onSelect?.('creova')}>
              <img src="assets/app_game_dev_icon.png" alt="Creova" />
            </div>
          </div>
          <div className="carousel-card-wrapper">
            <div className="carousel-card-inner" onClick={() => onSelect?.('vision3d')}>
              <img src="assets/vision3d_icon.png" alt="Vision3D" />
            </div>
          </div>
          <div className="carousel-card-wrapper">
            <div className="carousel-card-inner" onClick={() => onSelect?.('electra')}>
              <img src="assets/creocad_icon.png" alt="Electra" />
            </div>
          </div>
          <div className="carousel-card-wrapper">
            <div className="carousel-card-inner" onClick={() => onSelect?.('neura')}>
              <img src="assets/ml_brain_icon.png" alt="Neura" />
            </div>
          </div>
          <div className="carousel-card-wrapper">
            <div className="carousel-card-inner" onClick={() => onSelect?.('python')}>
              <img src="assets/python_icon.png" alt="Logix" />
            </div>
          </div>
          <div className="carousel-card-wrapper">
            <div className="carousel-card-inner" onClick={() => onSelect?.('intermediate')}>
              <img src="assets/arduino_icon.png" alt="Embed" />
            </div>
          </div>
          <div className="carousel-card-wrapper">
            <div className="carousel-card-inner" onClick={() => onSelect?.('junior')}>
              <img src="assets/ignite_icon.png" alt="Ignite" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Preload the GLB model for faster interactive loads
useGLTF.preload(MODEL_PATH);

export default Robot3DAnimation;

