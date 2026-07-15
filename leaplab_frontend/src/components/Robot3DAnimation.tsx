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

const MODEL_PATH = 'assets/sprites/robot/Copilot3D-398ee172-2137-410a-8037-6c4db796610a.glb';

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
                if (!processedTextures.has(mat.map)) {
                  const whiteTex = makeTextureWhite(mat.map);
                  processedTextures.set(mat.map, whiteTex);
                }
                mat.map = processedTextures.get(mat.map)!;
                mat.needsUpdate = true;
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
      const targetRotationX = state.pointer.y * 0.20; // Vertical tilt
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

const Robot3DAnimation: React.FC = () => {
  return (
    <div className="robot-3d-container">
      <style>{`
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
        }

        .robot-3d-canvas {
          width: 100%;
          height: 100%;
          max-height: 450px;
          opacity: 1;
          outline: none;
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
      </div>
    </div>
  );
};

// Preload the GLB model for faster interactive loads
useGLTF.preload(MODEL_PATH);

export default Robot3DAnimation;

