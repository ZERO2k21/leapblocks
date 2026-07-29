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
    // Top hemisphere hinges 180 degrees over the shared back rim edge (Z = -r)
    // angle transitions from -180 deg (flat net at t=0) to 0 deg (closed sphere at t=1)
    const angle = -Math.PI * (1 - t);

    if (topRef.current) {
      // Rotate in a 180-degree overhead arc around pivot at (0, 0, -r)
      const posY = -r * Math.sin(angle);
      const posZ = -r + r * Math.cos(angle);
      topRef.current.position.set(0, posY, posZ);
      topRef.current.rotation.set(angle, 0, 0);
    }

    if (bottomRef.current) {
      // Bottom hemisphere remains stationary on the floor
      bottomRef.current.position.set(0, 0, 0);
      bottomRef.current.rotation.set(0, 0, 0);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Bottom Hemisphere (Stationary Base) */}
      <mesh ref={bottomRef} geometry={bottomFace.geo} castShadow receiveShadow>
        <meshStandardMaterial color={bottomFace.color} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Top Hemisphere (180-Degree Hinge Lid) */}
      <mesh ref={topRef} geometry={topFace.geo} castShadow receiveShadow>
        <meshStandardMaterial color={topFace.color} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export { SphereFold };
