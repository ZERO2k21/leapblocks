/**
 * Vision3D - ViewCube Component
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React from 'react';
import { Canvas } from '@react-three/fiber';

const ViewCubeScene = ({ onCameraChange }) => {
  const faces = [
    { name: 'Front', position: [0, 0, 1], color: '#3b82f6' },
    { name: 'Back', position: [0, 0, -1], color: '#6366f1' },
    { name: 'Right', position: [1, 0, 0], color: '#22c55e' },
    { name: 'Left', position: [-1, 0, 0], color: '#eab308' },
    { name: 'Top', position: [0, 1, 0], color: '#ef4444' },
    { name: 'Bottom', position: [0, -1, 0], color: '#f97316' },
  ];

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />

      {faces.map((face) => (
        <mesh
          key={face.name}
          position={face.position}
          onClick={() => {
            const scale = 10;
            const newPos = [
              face.position[0] * scale,
              face.position[1] * scale,
              face.position[2] * scale,
            ];
            onCameraChange?.(newPos);
          }}
        >
          <boxGeometry args={[0.9, 0.9, 0.1]} />
          <meshStandardMaterial color={face.color} />
        </mesh>
      ))}

      <mesh position={[0, 0, 1.5]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.1, 0.3, 16]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>
      <mesh position={[1.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.1, 0.3, 16]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
      <mesh position={[0, 1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.1, 0.3, 16]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </>
  );
};

export const ViewCube = ({ onCameraChange }) => {
  return (
    <div className="view-cube">
      <Canvas
        camera={{ position: [2, 2, 2], fov: 50 }}
        style={{ width: '100px', height: '100px' }}
      >
        <ViewCubeScene onCameraChange={onCameraChange} />
      </Canvas>
    </div>
  );
};
