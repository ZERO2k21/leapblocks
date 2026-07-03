/**
 * Vision3D - Shape Net Component (3D View - All Shapes Fixed)
 * Displays 3D nets of shapes with proper fold/unfold animation.
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// ==================== BOX NET ====================
const createBoxNet = (w, h, d) => [
  // Bottom - stays flat
  { id: 'Bottom', geo: new THREE.PlaneGeometry(w, d), color: '#6366f1',
    flat: { pos: [0, 0, 0], rot: [-Math.PI/2, 0, 0] },
    folded: { pos: [0, 0, 0], rot: [-Math.PI/2, 0, 0] } },
  // Front - folds up
  { id: 'Front', geo: new THREE.PlaneGeometry(w, h), color: '#8b5cf6',
    flat: { pos: [0, 0, -d/2 - h/2], rot: [-Math.PI/2, 0, 0] },
    folded: { pos: [0, h/2, -d/2], rot: [0, 0, 0] } },
  // Back - folds up
  { id: 'Back', geo: new THREE.PlaneGeometry(w, h), color: '#a78bfa',
    flat: { pos: [0, 0, d/2 + h/2], rot: [-Math.PI/2, 0, 0] },
    folded: { pos: [0, h/2, d/2], rot: [0, Math.PI, 0] } },
  // Left - folds up
  { id: 'Left', geo: new THREE.PlaneGeometry(h, d), color: '#7c3aed',
    flat: { pos: [-w/2 - h/2, 0, 0], rot: [-Math.PI/2, 0, 0] },
    folded: { pos: [-w/2, h/2, 0], rot: [0, Math.PI/2, 0] } },
  // Right - folds up
  { id: 'Right', geo: new THREE.PlaneGeometry(h, d), color: '#6d28d9',
    flat: { pos: [w/2 + h/2, 0, 0], rot: [-Math.PI/2, 0, 0] },
    folded: { pos: [w/2, h/2, 0], rot: [0, -Math.PI/2, 0] } },
  // Top - folds over
  { id: 'Top', geo: new THREE.PlaneGeometry(w, d), color: '#c4b5fd',
    flat: { pos: [0, 0, -d/2 - h - d/2], rot: [-Math.PI/2, 0, 0] },
    folded: { pos: [0, h, 0], rot: [-Math.PI/2, 0, 0] } },
];

// ==================== CYLINDER NET ====================
// Net: rectangle (side) + 2 circles (top/bottom)
// The rectangle wraps around to form the tube
const createCylinderNet = (radius, height) => {
  const circum = 2 * Math.PI * radius;
  return [
    // Side rectangle - wraps into tube
    { id: 'Side', geo: new THREE.PlaneGeometry(circum, height), color: '#22d3ee',
      flat: { pos: [0, 0, 0], rot: [-Math.PI/2, 0, 0] },
      folded: { pos: [0, height/2, 0], rot: [0, 0, 0] } },
    // Bottom circle - attaches at bottom edge of side
    { id: 'Bottom', geo: new THREE.CircleGeometry(radius, 48), color: '#06b6d4',
      flat: { pos: [0, 0, -height/2 - radius], rot: [-Math.PI/2, 0, 0] },
      folded: { pos: [0, 0, 0], rot: [-Math.PI/2, 0, 0] } },
    // Top circle - attaches at top edge of side
    { id: 'Top', geo: new THREE.CircleGeometry(radius, 48), color: '#67e8f9',
      flat: { pos: [0, 0, height/2 + radius], rot: [-Math.PI/2, 0, 0] },
      folded: { pos: [0, height, 0], rot: [Math.PI/2, 0, 0] } },
  ];
};

// ==================== CONE NET ====================
// Net: sector (fan shape) + circle (base)
const createConeNet = (radius, height) => {
  const slant = Math.sqrt(radius * radius + height * height);
  const sectorAngle = (2 * Math.PI * radius) / slant;

  // Create sector shape
  const sectorShape = new THREE.Shape();
  sectorShape.moveTo(0, 0);
  const segments = 48;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * sectorAngle - sectorAngle / 2;
    sectorShape.lineTo(
      Math.cos(angle) * slant,
      Math.sin(angle) * slant
    );
  }
  sectorShape.closePath();

  return [
    // Sector (side surface) - folds into cone shape
    { id: 'Side', geo: new THREE.ShapeGeometry(sectorShape, 48), color: '#fb923c',
      flat: { pos: [0, 0, 0], rot: [-Math.PI/2, 0, 0] },
      folded: { pos: [0, 0, 0], rot: [0, 0, 0] } },
    // Base circle - folds to close bottom
    { id: 'Base', geo: new THREE.CircleGeometry(radius, 48), color: '#f97316',
      flat: { pos: [slant + radius + 0.3, 0, 0], rot: [-Math.PI/2, 0, 0] },
      folded: { pos: [0, 0, 0], rot: [-Math.PI/2, 0, 0] } },
  ];
};

// ==================== PYRAMID NET ====================
// Net: square base + 4 triangles
const createPyramidNet = (base, height) => {
  const slant = Math.sqrt(height * height + (base/2) * (base/2));

  // Triangle shape (pointing up)
  const triShape = new THREE.Shape();
  triShape.moveTo(-base/2, 0);
  triShape.lineTo(base/2, 0);
  triShape.lineTo(0, slant);
  triShape.closePath();

  // Triangle folds from base edge to apex
  // Fold angle = atan(height / (base/2)) from horizontal
  const foldAngle = Math.atan2(height, base/2);

  return [
    // Base square
    { id: 'Base', geo: new THREE.PlaneGeometry(base, base), color: '#eab308',
      flat: { pos: [0, 0, 0], rot: [-Math.PI/2, 0, 0] },
      folded: { pos: [0, 0, 0], rot: [-Math.PI/2, 0, 0] } },
    // Front triangle - folds up from front edge
    { id: 'Front', geo: new THREE.ShapeGeometry(triShape), color: '#facc15',
      flat: { pos: [0, 0, -base/2 - slant/2], rot: [-Math.PI/2, 0, 0] },
      folded: { pos: [0, 0, -base/2], rot: [foldAngle, 0, 0] } },
    // Back triangle - folds up from back edge
    { id: 'Back', geo: new THREE.ShapeGeometry(triShape), color: '#fde047',
      flat: { pos: [0, 0, base/2 + slant/2], rot: [-Math.PI/2, 0, 0] },
      folded: { pos: [0, 0, base/2], rot: [-foldAngle, 0, 0] } },
    // Left triangle - folds up from left edge
    { id: 'Left', geo: new THREE.ShapeGeometry(triShape), color: '#fef08a',
      flat: { pos: [-base/2 - slant/2, 0, 0], rot: [-Math.PI/2, 0, Math.PI/2] },
      folded: { pos: [-base/2, 0, 0], rot: [0, 0, foldAngle] } },
    // Right triangle - folds up from right edge
    { id: 'Right', geo: new THREE.ShapeGeometry(triShape), color: '#fef9c3',
      flat: { pos: [base/2 + slant/2, 0, 0], rot: [-Math.PI/2, 0, -Math.PI/2] },
      folded: { pos: [base/2, 0, 0], rot: [0, 0, -foldAngle] } },
  ];
};

// ==================== SPHERE NET ====================
// A sphere can't truly unfold, but we show 2 hemispheres side by side
// When folded, they come together to form the sphere
const createSphereNet = (radius) => [
  // Top hemisphere
  { id: 'Top', geo: new THREE.SphereGeometry(radius, 48, 24, 0, Math.PI*2, 0, Math.PI/2), color: '#ef4444',
    flat: { pos: [-radius * 1.1, 0, 0], rot: [0, 0, 0] },
    folded: { pos: [0, radius/2, 0], rot: [0, 0, 0] } },
  // Bottom hemisphere
  { id: 'Bottom', geo: new THREE.SphereGeometry(radius, 48, 24, 0, Math.PI*2, Math.PI/2, Math.PI/2), color: '#f87171',
    flat: { pos: [radius * 1.1, 0, 0], rot: [0, 0, 0] },
    folded: { pos: [0, -radius/2, 0], rot: [Math.PI, 0, 0] } },
];

// ==================== TRIANGULAR PRISM NET ====================
// Net: 3 rectangles (sides) + 2 triangles (ends)
const createTriangularPrismNet = (base, height, length) => {
  const triH = (base * Math.sqrt(3)) / 2;

  const triShape = new THREE.Shape();
  triShape.moveTo(-base/2, 0);
  triShape.lineTo(base/2, 0);
  triShape.lineTo(0, triH);
  triShape.closePath();

  return [
    // Bottom rectangle
    { id: 'Bottom', geo: new THREE.PlaneGeometry(length, base), color: '#10b981',
      flat: { pos: [0, 0, 0], rot: [-Math.PI/2, 0, 0] },
      folded: { pos: [0, 0, 0], rot: [-Math.PI/2, 0, 0] } },
    // Left rectangle
    { id: 'Left', geo: new THREE.PlaneGeometry(length, base), color: '#34d399',
      flat: { pos: [-length/2 - base/2 - triH/2, 0, 0], rot: [-Math.PI/2, 0, 0] },
      folded: { pos: [-base/2, triH/2, 0], rot: [0, Math.PI/3, 0] } },
    // Right rectangle
    { id: 'Right', geo: new THREE.PlaneGeometry(length, base), color: '#6ee7b7',
      flat: { pos: [length/2 + base/2 + triH/2, 0, 0], rot: [-Math.PI/2, 0, 0] },
      folded: { pos: [base/2, triH/2, 0], rot: [0, -Math.PI/3, 0] } },
    // Front triangle
    { id: 'Front', geo: new THREE.ShapeGeometry(triShape), color: '#a7f3d0',
      flat: { pos: [0, 0, -length/2 - triH/2], rot: [-Math.PI/2, 0, 0] },
      folded: { pos: [0, 0, -length/2], rot: [Math.PI/6, 0, 0] } },
    // Back triangle
    { id: 'Back', geo: new THREE.ShapeGeometry(triShape), color: '#d1fae5',
      flat: { pos: [0, 0, length/2 + triH/2], rot: [-Math.PI/2, 0, 0] },
      folded: { pos: [0, 0, length/2], rot: [-Math.PI/6, 0, 0] } },
  ];
};

// ==================== GET NET FOR SHAPE ====================
const getNetFaces = (shape) => {
  switch (shape.type) {
    case 'box':
      return createBoxNet(shape.width ?? 2, shape.height ?? 1, shape.depth ?? 1.5);
    case 'cube': {
      const s = shape.width ?? 1.5;
      return createBoxNet(s, s, s);
    }
    case 'cylinder':
      return createCylinderNet(shape.radiusTop ?? 0.8, shape.cylinderHeight ?? 1.5);
    case 'cone':
      return createConeNet(shape.coneRadius ?? 0.8, shape.coneHeight ?? 1.5);
    case 'pyramid':
      return createPyramidNet(shape.width ?? 1.5, shape.height ?? 1.5);
    case 'sphere':
    case 'halfSphere':
      return createSphereNet(shape.radius ?? shape.halfSphereRadius ?? 1);
    case 'triangularPrism':
      return createTriangularPrismNet(shape.width ?? 1.5, shape.height ?? 1, shape.depth ?? 2);
    default:
      return createBoxNet(shape.width ?? 2, shape.height ?? 1, shape.depth ?? 1.5);
  }
};

// ==================== ANIMATED FACE ====================
const AnimatedFace = ({ face, progress }) => {
  const meshRef = useRef();

  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: face.color,
    side: THREE.DoubleSide,
    roughness: 0.35,
    metalness: 0.05,
  }), [face.color]);

  useFrame(() => {
    if (!meshRef.current) return;
    const t = progress;

    // Lerp position
    meshRef.current.position.set(
      face.flat.pos[0] + (face.folded.pos[0] - face.flat.pos[0]) * t,
      face.flat.pos[1] + (face.folded.pos[1] - face.flat.pos[1]) * t,
      face.flat.pos[2] + (face.folded.pos[2] - face.flat.pos[2]) * t
    );

    // Slerp rotation
    const flatQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(face.flat.rot[0], face.flat.rot[1], face.flat.rot[2])
    );
    const foldedQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(face.folded.rot[0], face.folded.rot[1], face.folded.rot[2])
    );
    meshRef.current.quaternion.copy(flatQuat).slerp(foldedQuat, t);
  });

  return (
    <mesh ref={meshRef} geometry={face.geo} material={mat}
      position={face.flat.pos} rotation={face.flat.rot} />
  );
};

// ==================== FOLD LINES ====================
const FoldLines = ({ progress }) => {
  const opacity = Math.max(0, 1 - progress * 2);
  if (opacity <= 0) return null;
  return (
    <group position={[0, 0.015, 0]}>
      <mesh rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[14, 0.015]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={opacity * 0.5} />
      </mesh>
      <mesh rotation={[-Math.PI/2, 0, Math.PI/2]}>
        <planeGeometry args={[14, 0.015]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={opacity * 0.5} />
      </mesh>
    </group>
  );
};

// ==================== 3D SCENE ====================
const NetScene = ({ faces, progress }) => (
  <>
    <ambientLight intensity={0.5} />
    <directionalLight position={[8, 12, 8]} intensity={0.7} castShadow />
    <directionalLight position={[-4, 8, -4]} intensity={0.3} />
    {faces.map((f) => <AnimatedFace key={f.id} face={f} progress={progress} />)}
    <FoldLines progress={progress} />
    <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial color="#f1f5f9" />
    </mesh>
    <gridHelper args={[40, 40, '#cbd5e1', '#e2e8f0']} />
    <OrbitControls makeDefault enableDamping dampingFactor={0.1} minDistance={3} maxDistance={30} />
  </>
);

// ==================== MAIN COMPONENT ====================
const ShapeNet = ({ shape, foldProgress = 0, onClose, onFoldChange }) => {
  const faces = useMemo(() => getNetFaces(shape), [shape]);

  const name = {
    box: 'Cuboid', cube: 'Cube', cylinder: 'Cylinder',
    cone: 'Cone', pyramid: 'Pyramid', sphere: 'Sphere',
    halfSphere: 'Half Sphere', triangularPrism: 'Triangular Prism',
  }[shape.type] || shape.type;

  const stats = {
    box: { f: 6, e: 12, v: 8 },
    cube: { f: 6, e: 12, v: 8 },
    cylinder: { f: 3, e: 2, v: 0 },
    cone: { f: 2, e: 1, v: 1 },
    pyramid: { f: 5, e: 8, v: 5 },
    sphere: { f: 2, e: 1, v: 0 },
    halfSphere: { f: 2, e: 1, v: 0 },
    triangularPrism: { f: 5, e: 9, v: 6 },
  }[shape.type] || { f: 0, e: 0, v: 0 };

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: '#0f172a', display: 'flex', flexDirection: 'column', zIndex: 1000,
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#1e293b', borderBottom: '1px solid #334155', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#818cf8" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span style={{ color: '#e2e8f0', fontSize: 17, fontWeight: 600 }}>{name} — 3D Net</span>
        </div>
        <button onClick={onClose} style={{
          background: '#334155', border: '1px solid #475569', color: '#e2e8f0',
          padding: '7px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
        }}>✕ Close</button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas camera={{ position: [6, 5, 6], fov: 50 }} shadows style={{ background: '#f8fafc' }}>
          <NetScene faces={faces} progress={foldProgress} />
        </Canvas>

        {/* Info */}
        <div style={{
          position: 'absolute', top: 16, left: 16, background: 'rgba(30,41,59,0.94)',
          borderRadius: 10, padding: '14px 16px', color: '#e2e8f0', fontSize: 13, minWidth: 150,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: '#a5b4fc' }}>{name}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#94a3b8' }}>Faces</span><span>{stats.f}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#94a3b8' }}>Edges</span><span>{stats.e}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#94a3b8' }}>Vertices</span><span>{stats.v}</span>
          </div>
          <div style={{ borderTop: '1px solid #334155', paddingTop: 8 }}>
            {faces.map((f) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: f.color }} />
                <span style={{ color: '#cbd5e1', fontSize: 12 }}>{f.id}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{
          position: 'absolute', bottom: 16, left: 16, background: 'rgba(30,41,59,0.9)',
          borderRadius: 6, padding: '8px 12px', color: '#94a3b8', fontSize: 11,
        }}>
          Drag to rotate • Scroll to zoom
        </div>
      </div>

      {/* Slider */}
      <div style={{
        padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
        background: '#1e293b', borderTop: '1px solid #334155', flexShrink: 0,
      }}>
        <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, minWidth: 50 }}>2D Net</span>
        <input type="range" min={0} max={100} value={Math.round(foldProgress * 100)}
          onChange={(e) => onFoldChange(parseInt(e.target.value) / 100)}
          style={{ flex: 1, accentColor: '#818cf8', height: 6 }} />
        <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, minWidth: 50 }}>3D Shape</span>
        <span style={{ color: '#818cf8', fontSize: 15, fontWeight: 700, minWidth: 50, textAlign: 'right' }}>
          {Math.round(foldProgress * 100)}%
        </span>
      </div>
    </div>
  );
};

export default ShapeNet;
