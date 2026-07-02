import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { createGeometry } from '../utils/helpers';
import { use3DStore } from '../store/use3DStore';

const SceneShapes = () => {
  const shapes = use3DStore((s) => s.shapes);

  const visible = shapes.filter((s) => s.visible && s.type !== 'group');

  return visible.map((shape) => (
    <PreviewShape key={shape.id} shape={shape} />
  ));
};

const PreviewShape = React.memo(({ shape }) => {
  const [geoCache, setGeoCache] = useState(null);

  useEffect(() => {
    const geo = createGeometry(shape);
    const scale = new THREE.Vector3(...(shape.scale || [1, 1, 1]));
    const matrix = new THREE.Matrix4();
    matrix.makeScale(scale.x, scale.y, scale.z);
    geo.applyMatrix4(matrix);
    geo.computeBoundingBox();
    setGeoCache(geo);
    return () => geo.dispose();
  }, [shape]);

  if (!geoCache) return null;

  return (
    <mesh
      position={shape.position}
      rotation={shape.rotation}
      geometry={geoCache}
    >
      <meshStandardMaterial
        color={shape.color || '#4F46E5'}
        metalness={shape.metalness ?? 0.1}
        roughness={shape.roughness ?? 0.7}
        transparent={(shape.opacity ?? 1) < 1}
        opacity={shape.opacity ?? 1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
});

const PreviewControls = () => {
  const controlsRef = useRef();
  const [autoRotate, setAutoRotate] = useState(true);

  return (
    <OrbitControls
      ref={controlsRef}
      autoRotate={autoRotate}
      autoRotateSpeed={3}
      enableDamping
      enablePan
      enableZoom
      minDistance={2}
      maxDistance={50}
      onStart={() => setAutoRotate(false)}
    />
  );
};

const PreviewModal = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      zIndex: 9999, background: '#1e1e2e',
    }}>
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 16, right: 16, zIndex: 10000,
          background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
          fontSize: 20, cursor: 'pointer', width: 40, height: 40, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >✕</button>

      <Canvas
        camera={{ position: [10, 8, 10], fov: 40, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%' }}
        onCreated={({ scene }) => { scene.background = new THREE.Color(0x1e1e2e); }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} />
        <directionalLight position={[-5, 10, -5]} intensity={0.5} />
        <hemisphereLight args={['#b1e1ff', '#2a2a3e', 0.6]} />
        <PreviewControls />
        <SceneShapes />
      </Canvas>
    </div>
  );
};

export default PreviewModal;
