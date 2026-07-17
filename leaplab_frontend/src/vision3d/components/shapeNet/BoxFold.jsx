import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BoxFold = ({ data, t }) => {
  const frontPivot = useRef();
  const topPivot = useRef();
  const backPivot = useRef();
  const leftPivot = useRef();
  const rightPivot = useRef();

  // Extract faces and parameters from original net definitions
  const faces = data.flat || [];
  const bottom = faces.find((f) => f.id === 'Bottom') || { color: '#6366f1' };
  const front = faces.find((f) => f.id === 'Front') || { color: '#8b5cf6' };
  const back = faces.find((f) => f.id === 'Back') || { color: '#a78bfa' };
  const left = faces.find((f) => f.id === 'Left') || { color: '#7c3aed' };
  const right = faces.find((f) => f.id === 'Right') || { color: '#6d28d9' };
  const top = faces.find((f) => f.id === 'Top') || { color: '#c4b5fd' };

  // Read sizes dynamically from plane geometry parameters
  const w = bottom.geo?.parameters?.width || 2;
  const d = bottom.geo?.parameters?.height || 1.5;
  const h = front.geo?.parameters?.height || 1;

  const HP = Math.PI / 2;

  useFrame(() => {
    const angle = HP * t;
    if (frontPivot.current) frontPivot.current.rotation.x = -angle;
    if (topPivot.current) topPivot.current.rotation.x = -angle;
    if (backPivot.current) backPivot.current.rotation.x = angle;
    if (leftPivot.current) leftPivot.current.rotation.y = angle;
    if (rightPivot.current) rightPivot.current.rotation.y = -angle;
  });

  return (
    <group rotation={[-HP, 0, 0]}>
      {/* Bottom (Base) */}
      <mesh geometry={bottom.geo} castShadow receiveShadow>
        <meshStandardMaterial color={bottom.color} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Front + Top chain */}
      <group ref={frontPivot} position={[0, -d / 2, 0]}>
        <mesh geometry={front.geo} position={[0, -h / 2, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={front.color} roughness={0.35} side={THREE.DoubleSide} />
        </mesh>

        <group ref={topPivot} position={[0, -h, 0]}>
          <mesh geometry={top.geo} position={[0, -d / 2, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={top.color} roughness={0.35} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>

      {/* Back */}
      <group ref={backPivot} position={[0, d / 2, 0]}>
        <mesh geometry={back.geo} position={[0, h / 2, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={back.color} roughness={0.35} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Left */}
      <group ref={leftPivot} position={[-w / 2, 0, 0]}>
        <mesh geometry={left.geo} position={[-h / 2, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={left.color} roughness={0.35} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Right */}
      <group ref={rightPivot} position={[w / 2, 0, 0]}>
        <mesh geometry={right.geo} position={[h / 2, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={right.color} roughness={0.35} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
};

export { BoxFold };
