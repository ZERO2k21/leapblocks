import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const TetrahedronFold = ({ data, t }) => {
  const frontPivot = useRef();
  const leftPivot = useRef();
  const rightPivot = useRef();

  const faces = data.flat || [];
  const base = faces.find((f) => f.id === 'Base') || { color: '#10b981' };
  const front = faces.find((f) => f.id === 'Front') || { color: '#34d399' };
  const left = faces.find((f) => f.id === 'Left') || { color: '#6ee7b7' };
  const right = faces.find((f) => f.id === 'Right') || { color: '#a7f3d0' };

  // Determine size s from the geometry
  // ShapeGeometry parameters contain shape curves
  const s = 2.0; // Default fallback size
  const th = (s * Math.sqrt(3)) / 2;
  const foldAngle = (Math.PI - Math.acos(1 / 3)) * t;

  useFrame(() => {
    // 1. Front face hinges along X-axis at Z = 0
    if (frontPivot.current) {
      frontPivot.current.rotation.x = foldAngle;
    }

    // 2. Left face hinges along base's left edge (angled at -60 deg relative to X-axis)
    if (leftPivot.current) {
      const axis = new THREE.Vector3(-0.5, 0, -Math.sqrt(3) / 2).normalize();
      leftPivot.current.quaternion.setFromAxisAngle(axis, foldAngle);
    }

    // 3. Right face hinges along base's right edge (angled at +60 deg relative to X-axis)
    if (rightPivot.current) {
      const axis = new THREE.Vector3(0.5, 0, -Math.sqrt(3) / 2).normalize();
      rightPivot.current.quaternion.setFromAxisAngle(axis, foldAngle);
    }
  });

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {/* Base Face (remains flat on XZ plane after parent rotation) */}
      <mesh geometry={base.geo} castShadow receiveShadow>
        <meshStandardMaterial color={base.color} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Front Face Hinge Group */}
      <group ref={frontPivot} position={[0, 0, 0]}>
        <mesh geometry={front.geo} castShadow receiveShadow>
          <meshStandardMaterial color={front.color} roughness={0.35} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Left Face Hinge Group */}
      <group ref={leftPivot} position={[-s / 4, th / 2, 0]}>
        {/* Local offset to keep it aligned with left edge when flat */}
        <mesh geometry={left.geo} position={[s / 4, -th / 2, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={left.color} roughness={0.35} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Right Face Hinge Group */}
      <group ref={rightPivot} position={[s / 4, th / 2, 0]}>
        {/* Local offset to keep it aligned with right edge when flat */}
        <mesh geometry={right.geo} position={[-s / 4, -th / 2, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={right.color} roughness={0.35} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
};

export { TetrahedronFold };
