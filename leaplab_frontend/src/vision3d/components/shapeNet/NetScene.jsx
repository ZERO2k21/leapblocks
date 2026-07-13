import React from 'react';
import { OrbitControls } from '@react-three/drei';
import { AnimatedFace } from './AnimatedFace';
import { CylinderCurl } from './CylinderCurl';
import { ConeCurl } from './ConeCurl';
import { PyramidFold } from './PyramidFold';

const NetScene = ({ data, t, shapeType }) => {
  const flatFaces = data.flat || [];
  const isCurved = !!data.tube || !!data.cone;
  const liftY = 2;

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[8,12,8]} intensity={0.7} castShadow />
      <directionalLight position={[-4,8,-4]} intensity={0.3} />
      <group position={[0, liftY, 0]}>
      {flatFaces.map(function(f) {
        const opacity = isCurved ? 1 - t : 1;
        return <AnimatedFace key={f.id} face={f} t={t} opacity={opacity} />;
      })}
      {data.tube && (
        <CylinderCurl radius={data.tube.radius} height={data.tube.height} t={t} />
      )}
      {data.cone && (
        <ConeCurl radius={data.cone.radius} height={data.cone.height} t={t} />
      )}
      {data.pyramid && (
        <PyramidFold base={data.pyramid.base} height={data.pyramid.height} t={t} />
      )}
      </group>
      <mesh position={[0,-0.01,0]} rotation={[-Math.PI/2,0,0]} receiveShadow>
        <planeGeometry args={[40,40]} />
        <meshStandardMaterial color="#f1f5f9" />
      </mesh>
      <gridHelper args={[40,40,"#cbd5e1","#e2e8f0"]} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.1} minDistance={3} maxDistance={30} />
    </>
  );
};

export { NetScene };
