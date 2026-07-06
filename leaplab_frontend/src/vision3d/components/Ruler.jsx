import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { use3DStore } from '../store/use3DStore';
import { log } from '../utils/logger';

const dotGeo = new THREE.SphereGeometry(0.06, 6, 6);

function closestPointOnSegment(p, a, b) {
  const ab = new THREE.Vector3().copy(b).sub(a);
  const ap = new THREE.Vector3().copy(p).sub(a);
  const lenSq = ab.dot(ab);
  if (lenSq === 0) return a.clone();
  const t = Math.max(0, Math.min(1, ap.dot(ab) / lenSq));
  return new THREE.Vector3().copy(a).add(ab.clone().multiplyScalar(t));
}

const EdgeLine = ({ edge, color }) =>
  edge ? (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={2} array={new Float32Array([...edge.start, ...edge.end])} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial color={color} />
    </line>
  ) : null;

export const Ruler = () => {
  const rulerActive = use3DStore((s) => s.rulerActive);
  const rulerOrigin = use3DStore((s) => s.rulerOrigin);
  const rulerTarget = use3DStore((s) => s.rulerTarget);
  const setRulerOrigin = use3DStore((s) => s.setRulerOrigin);
  const setRulerTarget = use3DStore((s) => s.setRulerTarget);
  const clearRuler = use3DStore((s) => s.clearRuler);
  const { camera, gl, scene } = useThree();

  const [hoverPoint, setHoverPoint] = useState(null);
  const [originEdge, setOriginEdge] = useState(null);
  const [targetEdge, setTargetEdge] = useState(null);
  const [hoverEdge, setHoverEdge] = useState(null);

  const rc = useRef(new THREE.Raycaster());
  const api = useRef({
    camera, gl, scene, setRulerOrigin, setRulerTarget, clearRuler,
  }).current;
  api.camera = camera;
  api.gl = gl;
  api.scene = scene;
  api.setRulerOrigin = setRulerOrigin;
  api.setRulerTarget = setRulerTarget;
  api.clearRuler = clearRuler;

  const processClickRef = useRef(null);
  const processPointerMoveRef = useRef(null);

  api.raycastShapes = (clientX, clientY) => {
    const rect = api.gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    rc.current.setFromCamera(mouse, api.camera);
    const targets = [];
    api.scene?.traverse?.((child) => {
      if (child.isMesh && child.userData.shapeId) targets.push(child);
    });
    if (targets.length === 0) return null;
    const hits = rc.current.intersectObjects(targets, false);
    if (hits.length === 0) return null;
    return hits[0];
  };

  api.getClosestEdgeInfo = (hit) => {
    const geometry = hit.object.geometry;
    const pos = geometry.attributes.position;
    const face = hit.face;
    if (!pos || !face) return null;

    const matrix = hit.object.matrixWorld;
    const a = new THREE.Vector3().fromBufferAttribute(pos, face.a).applyMatrix4(matrix);
    const b = new THREE.Vector3().fromBufferAttribute(pos, face.b).applyMatrix4(matrix);
    const c = new THREE.Vector3().fromBufferAttribute(pos, face.c).applyMatrix4(matrix);

    const edges = [
      { start: a, end: b },
      { start: b, end: c },
      { start: c, end: a },
    ];

    const point = hit.point;
    let minDist = Infinity;
    let bestEdge = null;
    let bestClosest = null;

    for (const edge of edges) {
      const cp = closestPointOnSegment(point, edge.start, edge.end);
      const dist = cp.distanceTo(point);
      if (dist < minDist) {
        minDist = dist;
        bestEdge = edge;
        bestClosest = cp;
      }
    }

    return {
      edge: { start: [bestEdge.start.x, bestEdge.start.y, bestEdge.start.z], end: [bestEdge.end.x, bestEdge.end.y, bestEdge.end.z] },
      point: [bestClosest.x, bestClosest.y, bestClosest.z],
    };
  };

  const processClick = (clientX, clientY) => {
    if (!use3DStore.getState().rulerActive) return;
    const hit = api.raycastShapes(clientX, clientY);
    if (!hit) return;
    const edgeInfo = api.getClosestEdgeInfo(hit);
    if (!edgeInfo) return;

    const st = use3DStore.getState();
    if (!st.rulerOrigin) {
      api.setRulerOrigin(edgeInfo.point);
      setOriginEdge(edgeInfo.edge);
      setHoverEdge(null);
      log('Ruler: origin set at edge', edgeInfo.point);
    } else if (!st.rulerTarget) {
      api.setRulerTarget(edgeInfo.point);
      setTargetEdge(edgeInfo.edge);
      log('Ruler: target set at edge', edgeInfo.point);
    } else {
      api.clearRuler();
      setOriginEdge(null);
      setTargetEdge(null);
      setHoverEdge(null);
      setHoverPoint(null);
    }
  };

  const processPointerMove = (clientX, clientY) => {
    if (!use3DStore.getState().rulerActive) return;
    const hit = api.raycastShapes(clientX, clientY);
    if (hit) {
      const edgeInfo = api.getClosestEdgeInfo(hit);
      if (edgeInfo) {
        setHoverPoint(edgeInfo.point);
        const st = use3DStore.getState();
        if (!st.rulerOrigin || st.rulerTarget) {
          setHoverEdge(edgeInfo.edge);
        } else {
          setHoverEdge(null);
        }
        return;
      }
    }
    setHoverPoint(null);
    setHoverEdge(null);
  };

  processClickRef.current = processClick;
  processPointerMoveRef.current = processPointerMove;

  useEffect(() => {
    const canvas = gl.domElement;

    const handleDown = (e) => {
      if (!use3DStore.getState().rulerActive) return;
      if (window.__gizmoActive) return;
      e.preventDefault();
      window.__gizmoActive = true;
      try {
        processClickRef.current(e.clientX, e.clientY);
      } finally {
        window.__gizmoActive = false;
      }
    };

    const handleMove = (e) => {
      processPointerMoveRef.current(e.clientX, e.clientY);
    };

    canvas.addEventListener('pointerdown', handleDown, { capture: true });
    canvas.addEventListener('pointermove', handleMove);
    return () => {
      canvas.removeEventListener('pointerdown', handleDown, { capture: true });
      canvas.removeEventListener('pointermove', handleMove);
    };
  }, [gl]);

  const measurement = useMemo(() => {
    if (!rulerOrigin) return null;
    const end = rulerTarget || hoverPoint;
    if (!end) return null;
    const dx = end[0] - rulerOrigin[0];
    const dy = end[1] - rulerOrigin[1];
    const dz = end[2] - rulerOrigin[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    let labelPos;
    if (hoverPoint) {
      labelPos = [hoverPoint[0], hoverPoint[1] + 1.5, hoverPoint[2]];
    } else if (rulerTarget) {
      labelPos = [rulerTarget[0], rulerTarget[1] + 1.5, rulerTarget[2]];
    } else {
      const mid = [(rulerOrigin[0] + end[0]) / 2, (rulerOrigin[1] + end[1]) / 2, (rulerOrigin[2] + end[2]) / 2];
      labelPos = [mid[0], mid[1] + 1.5, mid[2]];
    }
    return {
      distance,
      labelPos,
      midpoint: [(rulerOrigin[0] + end[0]) / 2, (rulerOrigin[1] + end[1]) / 2, (rulerOrigin[2] + end[2]) / 2],
      dx, dy, dz,
      isFinal: !!rulerTarget,
    };
  }, [rulerOrigin, rulerTarget, hoverPoint]);

  const lineEnd = rulerTarget || hoverPoint;

  const lineDots = useMemo(() => {
    if (!rulerOrigin || !lineEnd) return [];
    const from = new THREE.Vector3(...rulerOrigin);
    const to = new THREE.Vector3(...lineEnd);
    const dir = new THREE.Vector3().copy(to).sub(from);
    const len = dir.length();
    dir.normalize();
    const dotCount = Math.max(2, Math.floor(len / 0.3));
    const pts = [];
    for (let i = 0; i <= dotCount; i++) {
      const t = i / dotCount;
      pts.push(new THREE.Vector3().copy(from).addScaledVector(dir, len * t).toArray());
    }
    return pts;
  }, [rulerOrigin, lineEnd]);

  if (!rulerActive) return null;

  return (
    <group>
      <EdgeLine edge={originEdge} color="#ef4444" />
      <EdgeLine edge={targetEdge} color="#f97316" />
      {!rulerOrigin && <EdgeLine edge={hoverEdge} color="#6366f1" />}
      {rulerOrigin && rulerTarget && <EdgeLine edge={hoverEdge} color="#6366f1" />}

      {rulerOrigin && (
        <mesh position={rulerOrigin}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      )}

      {lineEnd && (
        <mesh position={lineEnd}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshBasicMaterial color={rulerTarget ? '#f97316' : '#6366f1'} />
        </mesh>
      )}

      {lineDots.map((p, i) => (
        <mesh key={i} position={p} geometry={dotGeo}>
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      ))}

      {measurement && (
        <Html position={measurement.labelPos} center>
          <div
            style={{
              background: 'rgba(0,0,0,0.92)',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: '4px',
              fontSize: '13px',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              userSelect: 'none',
              borderTop: `3px solid ${measurement.isFinal ? '#f97316' : '#e83e8c'}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px', letterSpacing: '0.5px' }}>
              {measurement.distance.toFixed(2)} mm
            </div>
            <div style={{ fontSize: '11px', color: '#aaa', letterSpacing: '0.3px' }}>
              X: {measurement.dx.toFixed(2)} | Y: {measurement.dy.toFixed(2)} | Z: {measurement.dz.toFixed(2)}
            </div>
          </div>
        </Html>
      )}

      {!rulerOrigin && (
        <Html position={[0, 3, 0]} center>
          <div
            style={{
              background: 'rgba(0,0,0,0.85)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontFamily: 'sans-serif',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              userSelect: 'none',
              border: '1px solid #6366f1',
            }}
          >
            Click a shape edge to start measuring (Esc to cancel)
          </div>
        </Html>
      )}
    </group>
  );
};
