import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getFaceShades } from './netDefinitions';

const ConeCurl = ({ radius, height, color, t }) => {
  const sideRef = useRef();
  const baseRef = useRef();
  const slant = Math.sqrt(radius * radius + height * height);
  const sectorAngle = (2 * Math.PI * radius) / slant;
  const origPos = useRef(null);
  const segments = 48;
  const rows = 20;

  const shades = useMemo(() => getFaceShades(color || '#fb923c', 2), [color]);

  const sideGeo = useMemo(() => {
    const positions = [];
    const indices = [];

    for (let j = 0; j <= rows; j++) {
      const d = (j / rows) * slant;
      for (let i = 0; i <= segments; i++) {
        const alpha = (i / segments - 0.5) * sectorAngle;
        positions.push(d * Math.sin(alpha), 0, d * Math.cos(alpha));
      }
    }
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < segments; i++) {
        const a = j * (segments + 1) + i;
        const b = a + 1;
        const c = a + (segments + 1);
        const d2 = c + 1;
        indices.push(a, c, b, b, c, d2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    origPos.current = geo.attributes.position.array.slice();
    return geo;
  }, [radius, height]);

  useFrame(() => {
    if (!sideRef.current || !origPos.current) return;
    const posAttr = sideRef.current.geometry.attributes.position;
    const src = origPos.current;

    for (let j = 0; j <= rows; j++) {
      const d = (j / rows) * slant;

      for (let i = 0; i <= segments; i++) {
        const idx = j * (segments + 1) + i;
        const alpha = (i / segments - 0.5) * sectorAngle;

        if (t < 0.001) {
          posAttr.setXYZ(idx, src[idx * 3], 0, src[idx * 3 + 2]);
        } else {
          const angleFactor = 1 + (Math.PI * 2 / sectorAngle - 1) * t;
          const radiusFactor = 1 + (radius / slant - 1) * t;
          const theta = alpha * angleFactor;
          const r = d * radiusFactor;
          const nx = r * Math.sin(theta);
          const nz = r * Math.cos(theta);
          const ny = height * (1 - d / slant) * t;
          posAttr.setXYZ(idx, nx, ny, nz);
        }
      }
    }
    posAttr.needsUpdate = true;
    sideRef.current.geometry.computeBoundingSphere();

    if (baseRef.current) {
      const flatX = slant + radius + 0.5;
      const bx = flatX * (1 - t);
      baseRef.current.position.set(bx, 0, 0);
      baseRef.current.rotation.x = -Math.PI / 2;
    }
  });

  return (
    <group>
      <mesh ref={sideRef} geometry={sideGeo}>
        <meshStandardMaterial color={shades[0]} side={THREE.DoubleSide} roughness={0.35} />
      </mesh>
      <mesh ref={baseRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 48]} />
        <meshStandardMaterial color={shades[1]} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export { ConeCurl };
