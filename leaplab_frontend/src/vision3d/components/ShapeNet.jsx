/**
 * Vision3D - Interactive 3D Net Folding Animations
 * Shows how 3D shapes are constructed from their nets.
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const createBoxNet = (w, h, d) => [
  { id:"Bottom", geo:new THREE.PlaneGeometry(w,d), color:"#6366f1",
    flat:{pos:[0,0,0],rot:[-Math.PI/2,0,0]}, folded:{pos:[0,0,0],rot:[-Math.PI/2,0,0]} },
  { id:"Front", geo:new THREE.PlaneGeometry(w,h), color:"#8b5cf6",
    flat:{pos:[0,0,-d/2-h/2],rot:[-Math.PI/2,0,0]}, folded:{pos:[0,h/2,-d/2],rot:[0,0,0]} },
  { id:"Back", geo:new THREE.PlaneGeometry(w,h), color:"#a78bfa",
    flat:{pos:[0,0,d/2+h/2],rot:[-Math.PI/2,0,0]}, folded:{pos:[0,h/2,d/2],rot:[0,Math.PI,0]} },
  { id:"Left", geo:new THREE.PlaneGeometry(h,d), color:"#7c3aed",
    flat:{pos:[-w/2-h/2,0,0],rot:[-Math.PI/2,0,0]}, folded:{pos:[-w/2,h/2,0],rot:[0,Math.PI/2,0]} },
  { id:"Right", geo:new THREE.PlaneGeometry(h,d), color:"#6d28d9",
    flat:{pos:[w/2+h/2,0,0],rot:[-Math.PI/2,0,0]}, folded:{pos:[w/2,h/2,0],rot:[0,-Math.PI/2,0]} },
  { id:"Top", geo:new THREE.PlaneGeometry(w,d), color:"#c4b5fd",
    flat:{pos:[0,0,-d/2-h-d/2],rot:[-Math.PI/2,0,0]}, folded:{pos:[0,h,0],rot:[-Math.PI/2,0,0]} },
];
const createCylinderNet = (r, h) => ({
  flat: [],
  tube: { radius: r, height: h },
});

const createConeNet = (r, h) => ({
  flat: [],
  cone: { radius: r, height: h },
});


const createTetrahedronNet = (s) => {
  const th = s*Math.sqrt(3)/2;
  const tri = new THREE.Shape();
  tri.moveTo(-s/2,0); tri.lineTo(s/2,0); tri.lineTo(0,th); tri.closePath();
  return {
    flat: [
      { id:"Base", geo:new THREE.ShapeGeometry(tri), color:"#10b981",
        flat:{pos:[0,0,0],rot:[-Math.PI/2,0,0]}, folded:{pos:[0,0,0],rot:[-Math.PI/2,0,0]} },
      { id:"Front", geo:new THREE.ShapeGeometry(tri), color:"#34d399",
        flat:{pos:[0,0,-th],rot:[-Math.PI/2,0,0]}, folded:{pos:[0,0,-s/2],rot:[Math.PI/3,0,0]} },
      { id:"Left", geo:new THREE.ShapeGeometry(tri), color:"#6ee7b7",
        flat:{pos:[-s/2-th/2,0,th/4],rot:[-Math.PI/2,0,0]}, folded:{pos:[-s/2,0,0],rot:[0,0,Math.PI/3]} },
      { id:"Right", geo:new THREE.ShapeGeometry(tri), color:"#a7f3d0",
        flat:{pos:[s/2+th/2,0,th/4],rot:[-Math.PI/2,0,0]}, folded:{pos:[s/2,0,0],rot:[0,0,-Math.PI/3]} },
    ],
  };
};

const createPyramidNet = (b, h) => ({
  flat: [],
  pyramid: { base: b, height: h },
});

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

const createSphereNet = (r) => ({
  flat: [
    { id:"Top", geo:new THREE.SphereGeometry(r,48,24,0,Math.PI*2,0,Math.PI/2), color:"#ef4444",
      flat:{pos:[-r*1.5,0,0],rot:[-Math.PI/2,0,0]}, folded:{pos:[0,0,0],rot:[0,0,0]} },
    { id:"Bottom", geo:new THREE.SphereGeometry(r,48,24,0,Math.PI*2,Math.PI/2,Math.PI/2), color:"#f87171",
      flat:{pos:[r*1.5,0,0],rot:[Math.PI/2,0,0]}, folded:{pos:[0,0,0],rot:[0,0,0]} },
  ],
});


const getNetFaces = (shape) => {
  switch(shape.type) {
    case 'box': case 'cube':
      return { flat: createBoxNet(shape.width??2, shape.height??1, shape.depth??1.5) };
    case 'cylinder':
      return createCylinderNet(shape.radiusTop??0.8, shape.cylinderHeight??1.5);
    case 'cone':
      return createConeNet(shape.coneRadius??0.8, shape.coneHeight??1.5);
    case 'tetrahedron':
      return createTetrahedronNet(shape.size??1.5);
    case 'pyramid':
      return createPyramidNet(shape.width??1.5, shape.height??1.5);
    case 'sphere': case 'halfSphere':
      return createSphereNet(shape.radius??shape.halfSphereRadius??1);
    default:
      return { flat: [] };
  }
};

const SHAPE_NAMES = {
  box:'Box', cube:'Cube', cylinder:'Cylinder',
  cone:'Cone', tetrahedron:'Tetrahedron',
  pyramid:'Pyramid', sphere:'Sphere', halfSphere:'Sphere',
};

const NET_HAS = {
  box:{f:6,e:12,v:8}, cube:{f:6,e:12,v:8},
  cylinder:{f:3,e:2,v:0}, cone:{f:2,e:1,v:1},
  tetrahedron:{f:4,e:6,v:4}, pyramid:{f:5,e:8,v:5},
  sphere:{f:2,e:1,v:0}, halfSphere:{f:2,e:1,v:0},
};


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


const CylinderCurl = ({ radius, height, t }) => {
  const sideRef = useRef();
  const bottomRef = useRef();
  const topRef = useRef();
  const halfH = height / 2;
  const origPos = useRef(null);

  const sideGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(2 * Math.PI * radius, height, 64, 1);
    origPos.current = geo.attributes.position.array.slice();
    return geo;
  }, [radius, height]);

  useFrame(() => {
    if (!sideRef.current || !origPos.current) return;
    const posAttr = sideRef.current.geometry.attributes.position;
    const src = origPos.current;

    for (let i = 0; i < posAttr.count; i++) {
      const ox = src[i * 3];
      const oy = src[i * 3 + 1];
      const theta = ox / radius;

      if (t < 0.001) {
        posAttr.setXYZ(i, ox, 0, oy);
      } else {
        const angle = theta * t;
        const nx = radius * Math.sin(angle);
        const nz = radius * (1 - Math.cos(angle));
        posAttr.setXYZ(i, nx, oy, nz);
      }
    }
    posAttr.needsUpdate = true;
    sideRef.current.geometry.computeBoundingSphere();

    const gap = radius + 0.5;
    const flatBotZ = halfH + gap;
    const flatTopZ = -(halfH + gap);
    const foldedZ = radius;

    if (bottomRef.current) {
      const bz = flatBotZ * (1 - t) + foldedZ * t;
      const by = -halfH * t;
      bottomRef.current.position.set(0, by, bz);
      bottomRef.current.rotation.x = -Math.PI / 2 + Math.PI * t;
    }
    if (topRef.current) {
      const tz = flatTopZ * (1 - t) + foldedZ * t;
      const ty = halfH * t;
      topRef.current.position.set(0, ty, tz);
      topRef.current.rotation.x = -Math.PI / 2;
    }
  });

  return (
    <group>
      <mesh ref={sideRef} geometry={sideGeo}>
        <meshStandardMaterial color="#22d3ee" side={THREE.DoubleSide} roughness={0.35} />
      </mesh>
      <mesh ref={bottomRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 48]} />
        <meshStandardMaterial color="#06b6d4" side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={topRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 48]} />
        <meshStandardMaterial color="#67e8f9" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const ConeCurl = ({ radius, height, t }) => {
  const sideRef = useRef();
  const baseRef = useRef();
  const slant = Math.sqrt(radius * radius + height * height);
  const sectorAngle = (2 * Math.PI * radius) / slant;
  const origPos = useRef(null);
  const segments = 48;
  const rows = 20;

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
        <meshStandardMaterial color="#fb923c" side={THREE.DoubleSide} roughness={0.35} />
      </mesh>
      <mesh ref={baseRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 48]} />
        <meshStandardMaterial color="#f97316" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};


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


const ShapeNet = ({ shape, onClose }) => {
  const data = useMemo(function() { return getNetFaces(shape); }, [shape]);
  const label = SHAPE_NAMES[shape.type] || shape.type;
  const has = NET_HAS[shape.type] || { f:0, e:0, v:0 };
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(function() {
    if (!playing) return;
    const start = performance.now();
    const duration = 3000;
    let id;

    function tick() {
      const elapsed = (performance.now() - start) / duration;
      const p = Math.min(elapsed, 1);
      setT(p);
      if (p < 1) {
        id = requestAnimationFrame(tick);
      } else {
        setCompleted(true);
      }
    }

    id = requestAnimationFrame(tick);
    return function() { cancelAnimationFrame(id); };
  }, [playing, shape.type]);

  const handleReset = function() {
    setT(0);
    setPlaying(true);
    setCompleted(false);
  };

  return (
    <div style={{
      position:'fixed', top:0, left:0, right:0, bottom:0,
      background:'#0f172a', display:'flex', flexDirection:'column', zIndex:10000,
    }}>
      <div style={{
        padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between',
        background:'#1e293b', borderBottom:'1px solid #334155', flexShrink:0,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#818cf8" strokeWidth="2">
            <polygon points="5,3 19,12 5,21" />
          </svg>
          <span style={{ color:'#e2e8f0', fontSize:17, fontWeight:600 }}>How to Make a {label}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={handleReset} style={{
            background:'#334155', border:'1px solid #475569', color:'#e2e8f0',
            padding:'7px 14px', borderRadius:6, cursor:'pointer', fontSize:13,
          }}>Reset</button>
          <button onClick={onClose} style={{
            background:'#334155', border:'1px solid #475569', color:'#e2e8f0',
            padding:'7px 14px', borderRadius:6, cursor:'pointer', fontSize:13,
          }}>&times; Close</button>
        </div>
      </div>
      <div style={{ flex:1, position:'relative' }}>
        <Canvas camera={{ position:[6,5,6], fov:50 }} shadows style={{ background:'#f8fafc' }}>
          <NetScene data={data} t={t} shapeType={shape.type} />
        </Canvas>
        <div style={{
          position:'absolute', top:16, left:16, background:'rgba(30,41,59,0.94)',
          borderRadius:10, padding:'14px 16px', color:'#e2e8f0', fontSize:13, minWidth:150,
        }}>
          <div style={{ fontWeight:700, marginBottom:8, color:'#a5b4fc' }}>{label}</div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ color:'#94a3b8' }}>Faces</span><span>{has.f}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ color:'#94a3b8' }}>Edges</span><span>{has.e}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ color:'#94a3b8' }}>Vertices</span><span>{has.v}</span>
          </div>
          <div style={{ borderTop:'1px solid #334155', paddingTop:8 }}>
            {(data.flat||[]).map(function(f) {
              return (
                <div key={f.id} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:f.color }} />
                  <span style={{ color:'#cbd5e1', fontSize:12 }}>{f.id}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{
          position:'absolute', bottom:16, left:16, background:'rgba(30,41,59,0.9)',
          borderRadius:6, padding:'8px 12px', color:'#94a3b8', fontSize:11,
        }}>
          Drag to rotate &bull; Scroll to zoom
        </div>
      </div>
      <div style={{
        padding:'14px 20px', display:'flex', alignItems:'center', gap:14,
        background:'#1e293b', borderTop:'1px solid #334155', flexShrink:0,
      }}>
        <span style={{ color:'#94a3b8', fontSize:13, fontWeight:600, minWidth:50 }}>Flat Net</span>
        <input type="range" min={0} max={100} value={Math.round(t*100)}
          onChange={function(e) { setT(parseInt(e.target.value)/100); setPlaying(false); }}
          style={{ flex:1, accentColor:'#818cf8', height:6 }} />
        <span style={{ color:'#94a3b8', fontSize:13, fontWeight:600, minWidth:50 }}>3D Shape</span>
        <span style={{ color:'#818cf8', fontSize:15, fontWeight:700, minWidth:50, textAlign:'right' }}>
          {Math.round(t*100)}%
        </span>
      </div>
    </div>
  );
};

export default ShapeNet;







