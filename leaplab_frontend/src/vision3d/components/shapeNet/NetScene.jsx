import React from 'react';
import { OrbitControls } from '@react-three/drei';
import { AnimatedFace } from './AnimatedFace';
import { CylinderCurl } from './CylinderCurl';
import { ConeCurl } from './ConeCurl';
import { PyramidFold } from './PyramidFold';
import { BoxFold } from './BoxFold';
import { TetrahedronFold } from './TetrahedronFold';
import { SphereFold } from './SphereFold';

const NetScene = ({ data, t, shapeType }) => {
  const isCustomFold = ['box', 'cube', 'tetrahedron', 'sphere', 'halfSphere'].includes(shapeType);
  const flatFaces = isCustomFold ? [] : (data.flat || []);
  const isCurved = !!data.tube || !!data.cone;
  const liftY = 1.0; // Lower slightly to sit nicely on the grid

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[10, 15, 10]} intensity={0.8} castShadow />
      <directionalLight position={[-6, 10, -6]} intensity={0.25} />
      <group position={[0, liftY, 0]}>
        {flatFaces.map(function (f) {
          const opacity = isCurved ? 1 - t : 1;
          return <AnimatedFace key={f.id} face={f} t={t} opacity={opacity} />;
        })}
        {(shapeType === 'box' || shapeType === 'cube') && (
          <BoxFold data={data} t={t} />
        )}
        {shapeType === 'tetrahedron' && (
          <TetrahedronFold data={data} t={t} />
        )}
        {(shapeType === 'sphere' || shapeType === 'halfSphere') && (
          <SphereFold data={data} t={t} />
        )}
        {data.tube && (
          <CylinderCurl radius={data.tube.radius} height={data.tube.height} color={data.tube.color} t={t} />
        )}
        {data.cone && (
          <ConeCurl radius={data.cone.radius} height={data.cone.height} color={data.cone.color} t={t} />
        )}
        {data.pyramid && (
          <PyramidFold base={data.pyramid.base} height={data.pyramid.height} color={data.pyramid.color} t={t} />
        )}
      </group>
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <gridHelper args={[40, 40, "#cbd5e1", "#f1f5f9"]} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.1} minDistance={3} maxDistance={30} />
    </>
  );
};

export { NetScene };
