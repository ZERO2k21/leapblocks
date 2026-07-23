import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { createGeometry } from '../utils/geometry';
import { use3DStore } from '../store/use3DStore';

const SceneShapes = ({ explosionFactor }) => {
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

  const directions = useMemo(() => {
    const count = visible.length;
    if (count === 0) return [];
    if (count === 1) return [new THREE.Vector3(0, 1, 0)];

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    return visible.map((s, i) => {
      const theta = goldenAngle * i;
      const y = 1 - (2 * i) / (count - 1);
      const r = Math.sqrt(1 - y * y);
      return new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta)).normalize();
    });
  }, [visible]);

  return visible.map((shape, index) => (
    <PreviewShape
      key={shape.id}
      shape={shape}
      explosionFactor={explosionFactor}
      center={center}
      dir={directions[index]}
      index={index}
      total={visible.length}
    />
  ));
};

const PreviewShape = React.memo(({ shape, explosionFactor, center, dir, index, total }) => {
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

  const t = explosionFactor;

  const position = useMemo(() => {
    const pos = new THREE.Vector3(...(shape.position || [0, 0, 0]));
    if (t > 0 && dir) {
      pos.add(dir.clone().multiplyScalar(t * 5));
    }
    return [pos.x, pos.y, pos.z];
  }, [shape.position, t, dir]);

  const rotation = useMemo(() => {
    const base = shape.rotation || [0, 0, 0];
    if (t <= 0) return base;
    const spinAngle = t * Math.PI * 0.5;
    const axisOffset = (index / Math.max(total, 1)) * Math.PI * 2;
    return [
      base[0] + Math.sin(spinAngle + axisOffset) * 0.4,
      base[1] + spinAngle,
      base[2] + Math.cos(spinAngle + axisOffset) * 0.4,
    ];
  }, [shape.rotation, t, index, total]);

  const scale = useMemo(() => {
    const base = new THREE.Vector3(...(shape.scale || [1, 1, 1]));
    if (t <= 0) return [base.x, base.y, base.z];
    const pulse = 1 + Math.sin(t * Math.PI) * 0.08;
    return [base.x * pulse, base.y * pulse, base.z * pulse];
  }, [shape.scale, t]);

  const opacity = useMemo(() => {
    const base = shape.opacity ?? 1;
    if (t <= 0) return base;
    return base * (1 - t * 0.15);
  }, [shape.opacity, t]);

  if (!geoCache) return null;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geoCache}>
        <meshStandardMaterial
          color={shape.color || '#4F46E5'}
          metalness={shape.metalness ?? 0.1}
          roughness={shape.roughness ?? 0.7}
          transparent={opacity < 1 || t > 0}
          opacity={opacity}
          side={THREE.DoubleSide}
        />
      </mesh>
      {t > 0.3 && (
        <Html distanceFactor={15} className="pointer-events-none">
          <div
            className="bg-black/75 text-white px-2 py-0.5 rounded text-xs font-sans whitespace-nowrap -translate-y-5"
            style={{ opacity: Math.min(1, (t - 0.3) / 0.3) }}
          >
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
  const [explosionFactor, setExplosionFactor] = useState(1);

  useEffect(() => {
    if (!open) {
      setExplosionFactor(1);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen z-[9999] bg-[#1e1e2e]">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-[10000] bg-white/15 border-none text-white text-xl cursor-pointer w-10 h-10 rounded-lg flex items-center justify-center font-sans hover:bg-white/25 transition-colors"
      >✕</button>

      <Canvas
        camera={{ position: [10, 8, 10], fov: 40, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false }}
        className="w-full h-full"
        onCreated={({ scene }) => { scene.background = new THREE.Color(0x1e1e2e); }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} />
        <directionalLight position={[-5, 10, -5]} intensity={0.5} />
        <hemisphereLight args={['#b1e1ff', '#2a2a3e', 0.6]} />
        <PreviewControls />
        <SceneShapes explosionFactor={explosionFactor} />
      </Canvas>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-[10000] bg-black/60 px-6 py-2.5 rounded-xl backdrop-blur-md">
        <span className="text-white/50 text-[11px] font-sans font-semibold">ASSEMBLED</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={explosionFactor}
          onChange={(e) => setExplosionFactor(parseFloat(e.target.value))}
          className="w-50 accent-indigo-500 cursor-pointer"
        />
        <span className="text-white/50 text-[11px] font-sans font-semibold">EXPLODED</span>
      </div>
    </div>
  );
};

export default PreviewModal;
