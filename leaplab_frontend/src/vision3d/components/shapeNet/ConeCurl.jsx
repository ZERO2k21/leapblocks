import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getFaceShades } from './netDefinitions';

const ConeCurl = ({ radius = 1, height = 2, color, t }) => {
  const sideRef = useRef();
  const baseRef = useRef();

  const slant = Math.sqrt(radius * radius + height * height);
  const sectorAngle = (2 * Math.PI * radius) / slant;
  const origPos = useRef(null);
  const segments = 64;
  const rows = 24;

  const shades = useMemo(() => getFaceShades(color || '#fb923c', 2), [color]);

  // Create sector geometry flat on XZ plane initially
  const sideGeo = useMemo(() => {
    const positions = [];
    const indices = [];

    for (let j = 0; j <= rows; j++) {
      const d = (j / rows) * slant;
      for (let i = 0; i <= segments; i++) {
        const alpha = (i / segments - 0.5) * sectorAngle;
        positions.push(d * Math.sin(alpha), 0, -slant + d * Math.cos(alpha));
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
  }, [radius, height, slant, sectorAngle]);

  useFrame(() => {
    if (!sideRef.current || !origPos.current) return;
    const posAttr = sideRef.current.geometry.attributes.position;

    // Continuous sector curling around Y axis centered over base circle (0,0,0)
    const angleFactor = 1 + t * ((Math.PI * 2) / sectorAngle - 1);
    const rFactor = (1 - t) + t * (radius / slant);
    const centerZ = -(1 - t) * (radius + slant);

    for (let j = 0; j <= rows; j++) {
      const d = (j / rows) * slant;
      const currentRadius = d * rFactor;
      const currentHeight = height * t * (1 - d / slant);

      for (let i = 0; i <= segments; i++) {
        const idx = j * (segments + 1) + i;
        const alpha = (i / segments - 0.5) * sectorAngle;
        const beta = alpha * angleFactor;

        const nx = currentRadius * Math.sin(beta);
        const nz = centerZ + currentRadius * Math.cos(beta);
        const ny = currentHeight;

        posAttr.setXYZ(idx, nx, ny, nz);
      }
    }
    posAttr.needsUpdate = true;
    sideRef.current.geometry.computeVertexNormals();
    sideRef.current.geometry.computeBoundingSphere();

    // Base circle stays anchored flat on floor at (0,0,0)
    if (baseRef.current) {
      baseRef.current.position.set(0, 0, 0);
      baseRef.current.rotation.set(-Math.PI / 2, 0, 0);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Curved Sector Surface */}
      <mesh ref={sideRef} geometry={sideGeo} castShadow receiveShadow>
        <meshStandardMaterial color={shades[0]} side={THREE.DoubleSide} roughness={0.35} />
      </mesh>

      {/* Circular Base Cap (Anchored at origin) */}
      <mesh ref={baseRef} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <circleGeometry args={[radius, 64]} />
        <meshStandardMaterial color={shades[1]} side={THREE.DoubleSide} roughness={0.35} />
      </mesh>
    </group>
  );
};

export { ConeCurl };
