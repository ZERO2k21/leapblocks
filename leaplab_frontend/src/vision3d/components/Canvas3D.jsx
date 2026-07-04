/**
 * Vision3D - Main 3D Canvas Component
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React, { useRef, useEffect, Suspense, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import { use3DStore } from '../store/use3DStore';
import { snapPositionToGrid } from '../utils/helpers';
import { Workplane } from './Workplane';
import { ShapeRenderer } from './ShapeRenderer';
import { Ruler } from './Ruler';
import TransformGizmo, { setOrbitRef } from './TransformGizmo';
import ShapeInteraction from './ShapeInteraction';
import { MeshEditor } from './MeshEditor';
import { MeshEditOverlay } from './MeshEditOverlay';
import { log, debug } from '../utils/logger';

const CameraController = () => {
  const fitTarget = use3DStore((s) => s.fitSelectionTarget);
  const fitAll = use3DStore((s) => s.fitAllTarget);
  const { camera } = useThree();

  useEffect(() => {
    const target = fitTarget || fitAll;
    if (target) {
      const vec = new THREE.Vector3(target[0], target[1], target[2]);
      const distance = 12;
      const direction = new THREE.Vector3(1, 0.75, 1).normalize();
      camera.position.copy(vec).addScaledVector(direction, distance);
      camera.lookAt(vec);
    }
  }, [fitTarget, fitAll, camera]);

  return null;
};

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
  const orbitRef = useRef();

  useEffect(() => {
    setOrbitRef(orbitRef);
    window.__externalOrbitRef = orbitRef;
    return () => { window.__externalOrbitRef = null; };
  }, []);

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

      <TransformGizmo />

      <ShapeInteraction />

      <MeshEditor />
      <MeshEditOverlay />

      <Ruler />

      <DropHandler />

      <OrbitControls
        ref={orbitRef}
        makeDefault
        enableDamping
        dampingFactor={0.1}
        minDistance={2}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2}
      />

      <CameraController />

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
  const cameraMode = use3DStore((s) => s.cameraMode);
  const deselectAll = use3DStore((s) => s.deselectAll);
  const deselectOnClick = use3DStore((s) => s.deselectOnClick);
  debug('Canvas3D: rendering, camera:', cameraMode);

  // ResizeObserver to force R3F canvas re-measurement on container size changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          debug('Canvas3D: container resized', width, 'x', height);
          window.dispatchEvent(new Event('resize'));
        }
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handleCanvasClick = useCallback((e) => {
    // If click is on the canvas background (not on a shape), deselect
    if (e.target === e.currentTarget || e.target.tagName === 'CANVAS') {
      // This is handled by the R3F scene background click
    }
  }, []);

  return (
    <div ref={containerRef} className="canvas-3d-container">
      <Canvas
        shadows
        orthographic={cameraMode === 'orthographic'}
        camera={{
          position: [8, 6, 8],
          fov: 50,
          near: 0.1,
          far: 1000,
          zoom: cameraMode === 'orthographic' ? 50 : 1,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        style={{ background: '#f8fafc' }}
        onPointerMissed={() => deselectAll()}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
};
