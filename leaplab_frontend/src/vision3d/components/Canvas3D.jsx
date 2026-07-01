/**
 * Vision3D - Main 3D Canvas Component
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import { use3DStore } from '../store/use3DStore';
import { snapPositionToGrid } from '../utils/helpers';
import { Workplane } from './Workplane';
import { ShapeRenderer } from './ShapeRenderer';
import { log, debug } from '../utils/logger';

const DropHandler = () => {
  const { camera, gl } = useThree();
  const addShape = use3DStore((s) => s.addShape);
  const gridSnap = use3DStore((s) => s.gridSnap);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (e) => {
      e.preventDefault();
      const shapeType = e.dataTransfer?.getData('shapeType');
      if (!shapeType) return;
      log('Canvas3D DropHandler: drop shapeType=' + shapeType);

      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersection);

      if (intersection) {
        const snappedPos = snapPositionToGrid(
          [intersection.x, 1, intersection.z],
          gridSnap
        );
        addShape(shapeType, snappedPos);
      }
    };

    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('drop', handleDrop);

    return () => {
      canvas.removeEventListener('dragover', handleDragOver);
      canvas.removeEventListener('drop', handleDrop);
    };
  }, [camera, gl, addShape, gridSnap]);

  return null;
};

const SceneContent = () => {
  const shapes = use3DStore((s) => s.shapes);
  const selectedIds = use3DStore((s) => s.selectedIds);
  const activeTool = use3DStore((s) => s.activeTool);
  const orbitRef = useRef(null);
  const isTransforming = selectedIds.length === 1 && ['move', 'rotate', 'scale'].includes(activeTool);

  return (
    <>
      <color attach="background" args={['#f8fafc']} />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-5, 10, -5]} intensity={0.3} />
      <hemisphereLight args={['#b1e1ff', '#000000', 0.3]} />

      <Workplane />

      {shapes.map((shape) => (
        <ShapeRenderer key={shape.id} shape={shape} />
      ))}

      <DropHandler />

      <OrbitControls
        ref={orbitRef}
        makeDefault
        enableDamping
        dampingFactor={0.1}
        minDistance={2}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2}
        enabled={!isTransforming}
      />

      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport
          axisColors={['#ef4444', '#22c55e', '#3b82f6']}
          labelColor="white"
        />
      </GizmoHelper>
    </>
  );
};

export const Canvas3D = () => {
  const containerRef = useRef(null);
  debug('Canvas3D: rendering');

  return (
    <div ref={containerRef} className="canvas-3d-container">
      <Canvas
        shadows
        camera={{
          position: [8, 6, 8],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        style={{ background: '#f8fafc' }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
};
