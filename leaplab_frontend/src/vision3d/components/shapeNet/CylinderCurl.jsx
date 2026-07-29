import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getFaceShades } from './netDefinitions';

const CylinderCurl = ({ radius, height, color, t }) => {
  const sideRef = useRef();
  const bottomRef = useRef();
  const topRef = useRef();
  const halfH = height / 2;
  const origPos = useRef(null);

  const shades = useMemo(() => getFaceShades(color || '#22d3ee', 3), [color]);

  const sideGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(2 * Math.PI * radius, height, 64, 1);
    origPos.current = geo.attributes.position.array.slice();
    return geo;
  }, [radius, height]);

  useFrame(() => {
    if (!sideRef.current || !origPos.current) return;
    const posAttr = sideRef.current.geometry.attributes.position;
    const src = origPos.current;

    for (let i = 0; i < posAttr.count; i++) {
      const ox = src[i * 3];
      const oy = src[i * 3 + 1];
      const theta = ox / radius;

      if (t < 0.001) {
        posAttr.setXYZ(i, ox, 0, oy);
      } else {
        const angle = theta * t;
        const nx = radius * Math.sin(angle);
        const nz = radius * (1 - Math.cos(angle));
        posAttr.setXYZ(i, nx, oy, nz);
      }
    }
    posAttr.needsUpdate = true;
    sideRef.current.geometry.computeBoundingSphere();

    const gap = radius + 0.5;
    const flatBotZ = halfH + gap;
    const flatTopZ = -(halfH + gap);
    const foldedZ = radius;

    if (bottomRef.current) {
      const bz = flatBotZ * (1 - t) + foldedZ * t;
      const by = -halfH * t;
      bottomRef.current.position.set(0, by, bz);
      bottomRef.current.rotation.x = -Math.PI / 2 + Math.PI * t;
    }
    if (topRef.current) {
      const tz = flatTopZ * (1 - t) + foldedZ * t;
      const ty = halfH * t;
      topRef.current.position.set(0, ty, tz);
      topRef.current.rotation.x = -Math.PI / 2;
    }
  });

  return (
    <group>
      <mesh ref={sideRef} geometry={sideGeo}>
        <meshStandardMaterial color={shades[0]} side={THREE.DoubleSide} roughness={0.35} />
      </mesh>
      <mesh ref={bottomRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 48]} />
        <meshStandardMaterial color={shades[1]} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={topRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 48]} />
        <meshStandardMaterial color={shades[2]} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export { CylinderCurl };
