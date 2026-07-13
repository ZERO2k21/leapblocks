import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SphereFold = ({ data, t }) => {
  const topRef = useRef();
  const bottomRef = useRef();

  const faces = data.flat || [];
  const topFace = faces.find((f) => f.id === 'Top') || { color: '#ef4444' };
  const bottomFace = faces.find((f) => f.id === 'Bottom') || { color: '#f87171' };

  // Read radius from geometry parameters
  const r = topFace.geo?.parameters?.radius || 1;

  useFrame(() => {
    // d is the flat offset distance matching netDefinitions.js
    const d = r * 1.5;
    const arcY = d * Math.sin(t * Math.PI) * 0.5;

    if (topRef.current) {
      // Top hemisphere: translate in arc from -d to 0, rotate X from -90 deg to 0
      topRef.current.position.set(-d * (1 - t), arcY, 0);
      topRef.current.rotation.set(-Math.PI / 2 * (1 - t), 0, 0);
    }

    if (bottomRef.current) {
      // Bottom hemisphere: translate in arc from +d to 0, rotate X from +90 deg to 0
      bottomRef.current.position.set(d * (1 - t), arcY, 0);
      bottomRef.current.rotation.set(Math.PI / 2 * (1 - t), 0, 0);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Top Hemisphere */}
      <mesh ref={topRef} geometry={topFace.geo} castShadow receiveShadow>
        <meshStandardMaterial color={topFace.color} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Bottom Hemisphere */}
      <mesh ref={bottomRef} geometry={bottomFace.geo} castShadow receiveShadow>
        <meshStandardMaterial color={bottomFace.color} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export { SphereFold };
