import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { createGeometry } from '../utils/helpers';
import { use3DStore } from '../store/use3DStore';

const SceneShapes = ({ exploded, explosionFactor }) => {
  const shapes = use3DStore((s) => s.shapes);

  const visible = useMemo(
    () => shapes.filter((s) => s.visible && s.type !== 'group'),
    [shapes]
  );

  const center = useMemo(() => {
    if (visible.length === 0) return new THREE.Vector3();
    const bbox = new THREE.Box3();
    visible.forEach((s) => {
      const p = new THREE.Vector3(...(s.position || [0, 0, 0]));
      bbox.expandByPoint(p);
    });
    const c = new THREE.Vector3();
    bbox.getCenter(c);
    return c;
  }, [visible]);

  return visible.map((shape) => (
    <PreviewShape
      key={shape.id}
      shape={shape}
      exploded={exploded}
      explosionFactor={explosionFactor}
      center={center}
    />
  ));
};

const PreviewShape = React.memo(({ shape, exploded, explosionFactor, center }) => {
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

  const position = useMemo(() => {
    const pos = new THREE.Vector3(...(shape.position || [0, 0, 0]));
    if (exploded) {
      const dir = pos.clone().sub(center);
      if (dir.length() < 0.01) {
        dir.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
      }
      dir.normalize();
      pos.add(dir.multiplyScalar(explosionFactor * 4));
    }
    return [pos.x, pos.y, pos.z];
  }, [shape.position, exploded, explosionFactor, center]);

  if (!geoCache) return null;

  return (
    <group position={position} rotation={shape.rotation}>
      <mesh geometry={geoCache}>
        <meshStandardMaterial
          color={shape.color || '#4F46E5'}
          metalness={shape.metalness ?? 0.1}
          roughness={shape.roughness ?? 0.7}
          transparent={(shape.opacity ?? 1) < 1}
          opacity={shape.opacity ?? 1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {exploded && explosionFactor > 0.3 && (
        <Html distanceFactor={15} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(0,0,0,0.75)',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 12,
            fontFamily: 'sans-serif',
            whiteSpace: 'nowrap',
            transform: 'translateY(-20px)',
          }}>
            {shape.name || shape.type}
          </div>
        </Html>
      )}
    </group>
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
  const [exploded, setExploded] = useState(false);
  const [explosionFactor, setExplosionFactor] = useState(0);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setExploded(false);
      setExplosionFactor(0);
    }
  }, [open]);

  const toggleExplode = useCallback(() => {
    setExploded((prev) => !prev);
  }, []);

  useEffect(() => {
    const target = exploded ? 1 : 0;
    const animate = () => {
      setExplosionFactor((prev) => {
        const diff = target - prev;
        if (Math.abs(diff) < 0.01) return target;
        animationRef.current = requestAnimationFrame(animate);
        return prev + diff * 0.08;
      });
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [exploded]);

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
        <SceneShapes exploded={exploded} explosionFactor={explosionFactor} />
      </Canvas>

      <div style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 12, zIndex: 10000,
        background: 'rgba(0,0,0,0.6)', padding: '10px 20px', borderRadius: 12,
        backdropFilter: 'blur(8px)',
      }}>
        <button
          onClick={toggleExplode}
          style={{
            background: exploded ? '#6366f1' : 'rgba(255,255,255,0.15)',
            border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 8,
            cursor: 'pointer', fontSize: 13, fontFamily: 'sans-serif',
            fontWeight: 600, whiteSpace: 'nowrap',
          }}
        >
          {exploded ? 'Assemble' : 'Explode'}
        </button>

        {exploded && (
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={explosionFactor}
            onChange={(e) => {
              setExplosionFactor(parseFloat(e.target.value));
              setExploded(true);
            }}
            style={{ width: 140, accentColor: '#6366f1' }}
          />
        )}
      </div>
    </div>
  );
};

export default PreviewModal;
