import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PyramidFold = ({ base, height, t }) => {
  const baseRef = useRef();
  const frontRef = useRef();
  const backRef = useRef();
  const leftRef = useRef();
  const rightRef = useRef();
  const slant = Math.sqrt(height * height + (base / 2) * (base / 2));
  const halfB = base / 2;

  const baseGeo = useMemo(() => new THREE.PlaneGeometry(base, base), [base]);

  const frontGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const verts = new Float32Array([
      -halfB, 0, 0,   halfB, 0, 0,   0, slant, 0,
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geo.computeVertexNormals();
    return geo;
  }, [base, height]);

  const backGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const verts = new Float32Array([
      halfB, 0, 0,   -halfB, 0, 0,   0, slant, 0,
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geo.computeVertexNormals();
    return geo;
  }, [base, height]);

  const leftGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const verts = new Float32Array([
      0, 0, -halfB,   0, 0, halfB,   -slant, 0, 0,
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geo.computeVertexNormals();
    return geo;
  }, [base, height]);

  const rightGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const verts = new Float32Array([
      0, 0, halfB,   0, 0, -halfB,   slant, 0, 0,
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geo.computeVertexNormals();
    return geo;
  }, [base, height]);

  useFrame(() => {
    const eps = 0.001;

    if (baseRef.current) {
      baseRef.current.rotation.x = -Math.PI / 2;
    }

    if (frontRef.current) {
      const posAttr = frontRef.current.geometry.attributes.position;
      const arr = posAttr.array;
      const flat = [0, 0, -halfB,   0, 0, -halfB,   0, slant, -halfB];
      const folded = [-halfB, 0, -halfB,   halfB, 0, -halfB,   0, height, 0];
      for (let i = 0; i < 9; i++) arr[i] = flat[i] + (folded[i] - flat[i]) * t;
      posAttr.needsUpdate = true;
      frontRef.current.geometry.computeVertexNormals();
    }

    if (backRef.current) {
      const posAttr = backRef.current.geometry.attributes.position;
      const arr = posAttr.array;
      const flat = [0, 0, halfB,   0, 0, halfB,   0, slant, halfB];
      const folded = [-halfB, 0, halfB,   halfB, 0, halfB,   0, height, 0];
      for (let i = 0; i < 9; i++) arr[i] = flat[i] + (folded[i] - flat[i]) * t;
      posAttr.needsUpdate = true;
      backRef.current.geometry.computeVertexNormals();
    }

    if (leftRef.current) {
      const posAttr = leftRef.current.geometry.attributes.position;
      const arr = posAttr.array;
      const flat = [-halfB, 0, 0,   -halfB, 0, 0,   -halfB - slant, 0, 0];
      const folded = [-halfB, 0, -halfB,   -halfB, 0, halfB,   0, height, 0];
      for (let i = 0; i < 9; i++) arr[i] = flat[i] + (folded[i] - flat[i]) * t;
      posAttr.needsUpdate = true;
      leftRef.current.geometry.computeVertexNormals();
    }

    if (rightRef.current) {
      const posAttr = rightRef.current.geometry.attributes.position;
      const arr = posAttr.array;
      const flat = [halfB, 0, 0,   halfB, 0, 0,   halfB + slant, 0, 0];
      const folded = [halfB, 0, -halfB,   halfB, 0, halfB,   0, height, 0];
      for (let i = 0; i < 9; i++) arr[i] = flat[i] + (folded[i] - flat[i]) * t;
      posAttr.needsUpdate = true;
      rightRef.current.geometry.computeVertexNormals();
    }
  });

  return (
    <group>
      <mesh ref={baseRef} geometry={baseGeo} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#eab308" side={THREE.DoubleSide} roughness={0.35} />
      </mesh>
      <mesh ref={frontRef} geometry={frontGeo}>
        <meshStandardMaterial color="#facc15" side={THREE.DoubleSide} roughness={0.35} />
      </mesh>
      <mesh ref={backRef} geometry={backGeo}>
        <meshStandardMaterial color="#fde047" side={THREE.DoubleSide} roughness={0.35} />
      </mesh>
      <mesh ref={leftRef} geometry={leftGeo}>
        <meshStandardMaterial color="#fef08a" side={THREE.DoubleSide} roughness={0.35} />
      </mesh>
      <mesh ref={rightRef} geometry={rightGeo}>
        <meshStandardMaterial color="#fef9c3" side={THREE.DoubleSide} roughness={0.35} />
      </mesh>
    </group>
  );
};

export { PyramidFold };
