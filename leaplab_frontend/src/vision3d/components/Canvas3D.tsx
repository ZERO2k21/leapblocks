/**
 * Vision3D - Main 3D Canvas Component
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React, { useRef, useCallback, useEffect, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, TransformControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import { use3DStore } from '../store/use3DStore';
import { Shape3D, ActiveTool } from '../types';
import { snapPositionToGrid } from '../utils/helpers';
import { Workplane } from './Workplane';
import { ShapeRenderer } from './ShapeRenderer';

// Drop zone handler component
const DropHandler: React.FC = () => {
  const { camera, gl, scene } = useThree();
  const addShape = use3DStore((s) => s.addShape);
  const gridSnap = use3DStore((s) => s.gridSnap);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'copy';
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const shapeType = e.dataTransfer?.getData('shapeType');
      if (!shapeType) return;

      // Calculate drop position
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      // Intersect with the ground plane (y=0)
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersection);

      if (intersection) {
        const snappedPos = snapPositionToGrid(
          [intersection.x, 1, intersection.z],
          gridSnap
        );
        addShape(shapeType as any, snappedPos);
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

// Transform controls wrapper
const TransformController: React.FC = () => {
  const shapes = use3DStore((s) => s.shapes);
  const selectedIds = use3DStore((s) => s.selectedIds);
  const activeTool = use3DStore((s) => s.activeTool);
  const updateShape = use3DStore((s) => s.updateShape);
  const gridSnap = use3DStore((s) => s.gridSnap);

  const selectedShape = shapes.find((s) => s.id === selectedIds[0]);
  const transformRef = useRef<THREE.Group>(null);

  const getMode = useCallback((): 'translate' | 'rotate' | 'scale' => {
    switch (activeTool) {
      case 'move':
        return 'translate';
      case 'rotate':
        return 'rotate';
      case 'scale':
        return 'scale';
      default:
        return 'translate';
    }
  }, [activeTool]);

  const handleObjectChange = useCallback(() => {
    if (!transformRef.current || !selectedShape) return;

    const obj = transformRef.current;
    const position: [number, number, number] = [
      obj.position.x,
      obj.position.y,
      obj.position.z,
    ];
    const rotation: [number, number, number] = [
      obj.rotation.x,
      obj.rotation.y,
      obj.rotation.z,
    ];
    const scale: [number, number, number] = [
      obj.scale.x,
      obj.scale.y,
      obj.scale.z,
    ];

    updateShape(selectedShape.id, { position, rotation, scale });
  }, [selectedShape, updateShape]);

  if (!selectedShape || selectedIds.length !== 1) {
    return null;
  }

  return (
    <TransformControls
      mode={getMode()}
      position={selectedShape.position}
      rotation={selectedShape.rotation}
      scale={selectedShape.scale}
      onObjectChange={handleObjectChange}
      size={0.7}
    >
      <group ref={transformRef} />
    </TransformControls>
  );
};

// Scene content
const SceneContent: React.FC = () => {
  const shapes = use3DStore((s) => s.shapes);
  const showGrid = use3DStore((s) => s.showGrid);
  const deselectAll = use3DStore((s) => s.deselectAll);

  return (
    <>
      {/* Lighting */}
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

      {/* Workplane */}
      <Workplane />

      {/* Shapes */}
      {shapes.map((shape) => (
        <ShapeRenderer key={shape.id} shape={shape} />
      ))}

      {/* Transform Controls */}
      <TransformController />

      {/* Drop Handler */}
      <DropHandler />

      {/* Orbit Controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.1}
        minDistance={2}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2}
      />

      {/* Gizmo */}
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport
          axisColors={['#ef4444', '#22c55e', '#3b82f6']}
          labelColor="white"
        />
      </GizmoHelper>
    </>
  );
};

// Main Canvas3D component
export const Canvas3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

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
