import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const AnimatedFace = ({ face, t, opacity }) => {
  const ref = useRef();
  const op = opacity !== undefined ? opacity : 1;
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: face.color, side: THREE.DoubleSide, roughness: 0.35, metalness: 0.05,
    transparent: op < 1, opacity: op,
  }), [face.color, op]);

  useFrame(() => {
    if (!ref.current) return;
    const f = face.flat; const g = face.folded;
    ref.current.position.set(
      f.pos[0]+(g.pos[0]-f.pos[0])*t,
      f.pos[1]+(g.pos[1]-f.pos[1])*t,
      f.pos[2]+(g.pos[2]-f.pos[2])*t
    );
    const qf = new THREE.Quaternion().setFromEuler(new THREE.Euler(f.rot[0],f.rot[1],f.rot[2]));
    const qg = new THREE.Quaternion().setFromEuler(new THREE.Euler(g.rot[0],g.rot[1],g.rot[2]));
    ref.current.quaternion.copy(qf).slerp(qg, t);
    if (ref.current.material) {
      ref.current.material.opacity = op;
      ref.current.material.transparent = op < 1;
    }
  });

  return <mesh ref={ref} geometry={face.geo} material={mat} position={face.flat.pos} rotation={face.flat.rot} />;
};

export { AnimatedFace };
