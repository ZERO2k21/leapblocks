/**
 * Vision3D - Blender-Style Transform Gizmo (Zero-Lag)
 * Directly mutates Three.js objects during drag, commits to store on pointerup.
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { use3DStore } from '../store/use3DStore';

const AXIS_COLORS = { x: '#ef4444', y: '#22c55e', z: '#3b82f6' };
const AXIS_HOVER = { x: '#ff6666', y: '#66ff66', z: '#6666ff' };
const AXIS_VEC = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};

let externalOrbitRef = null;
export const setOrbitRef = (ref) => { externalOrbitRef = ref; };

const setAxisRef = (axis) => (mesh) => {
  if (mesh) mesh.userData.gizmoAxis = axis;
};

const TransformGizmo = () => {
  const { camera, gl, scene } = useThree();
  const selectedIds = use3DStore((s) => s.selectedIds);
  const shapes = use3DStore((s) => s.shapes);
  const updateShape = use3DStore((s) => s.updateShape);
  const pushHistory = use3DStore((s) => s.pushHistory);
  const activeTool = use3DStore((s) => s.activeTool);

  const [hoveredAxis, setHoveredAxis] = useState(null);
  const [dragInfo, setDragInfo] = useState(null);
  const dragRef = useRef({ active: false });
  const groupRef = useRef();

  const gizmoCenterRef = useRef(null);
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;

  const gizmoCenter = useMemo(() => {
    if (selectedIds.length === 0) return null;
    const sel = shapes.filter((s) => selectedIds.includes(s.id));
    if (sel.length === 0) return null;
    const c = new THREE.Vector3();
    sel.forEach((s) => { c.x += s.position[0]; c.y += s.position[1]; c.z += s.position[2]; });
    c.divideScalar(sel.length);
    return c;
  }, [selectedIds, shapes]);

  gizmoCenterRef.current = gizmoCenter;

  const gizmoScale = useMemo(() => {
    if (!gizmoCenter) return 1;
    return Math.max(0.5, Math.min(3, camera.position.distanceTo(gizmoCenter) * 0.08));
  }, [gizmoCenter, camera.position]);

  const mode = activeTool === 'move' ? 'translate' : activeTool === 'rotate' ? 'rotate' : activeTool === 'scale' ? 'scale' : null;

  const projectMouse = useCallback((clientX, clientY, axis, origin) => {
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    const rc = new THREE.Raycaster();
    rc.setFromCamera(mouse, camera);
    const viewDir = new THREE.Vector3();
    camera.getWorldDirection(viewDir);
    const axisDir = AXIS_VEC[axis];
    const perp = new THREE.Vector3().crossVectors(viewDir, axisDir);
    if (perp.lengthSq() < 0.0001) {
      const fallback = new THREE.Vector3(1, 0, 0);
      if (Math.abs(axisDir.dot(fallback)) > 0.9) fallback.set(0, 0, 1);
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
        new THREE.Vector3().crossVectors(axisDir, fallback).normalize(), origin
      );
      const pt = new THREE.Vector3();
      const hit = rc.ray.intersectPlane(plane, pt);
      if (!hit) return null;
      return pt.clone().sub(origin).dot(axisDir);
    }
    const perp2 = new THREE.Vector3().crossVectors(axisDir, perp).normalize();
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(perp2, origin);
    const pt = new THREE.Vector3();
    const hit = rc.ray.intersectPlane(plane, pt);
    if (!hit) return null;
    return pt.clone().sub(origin).dot(axisDir);
  }, [camera, gl]);

  const hitTestGizmo = useCallback((clientX, clientY) => {
    const group = groupRef.current;
    if (!group) return null;
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    const rc = new THREE.Raycaster();
    rc.setFromCamera(mouse, camera);
    const targets = [];
    group.traverse((child) => {
      if (child.isMesh && child.userData.gizmoAxis) targets.push(child);
    });
    if (targets.length === 0) return null;
    const intersects = rc.intersectObjects(targets, false);
    if (intersects.length === 0) return null;
    return intersects[0].object.userData.gizmoAxis;
  }, [camera, gl]);

  useEffect(() => {
    if (!gl) return;
    const canvas = gl.domElement;

    const renderFrame = () => { gl.render(scene, camera); };

    const handleDown = (e) => {
      const currentGizmoCenter = gizmoCenterRef.current;
      const currentSelectedIds = selectedIdsRef.current;
      if (!currentGizmoCenter || currentSelectedIds.length === 0) return;
      if (dragRef.current.active) return;

      const axis = hitTestGizmo(e.clientX, e.clientY);
      if (!axis) return;

      e.preventDefault();
      e.stopImmediatePropagation();
      window.__gizmoActive = true;

      // ── Take over rendering ──────────────────────────────
      gl.setAnimationLoop(null);
      const prevPixelRatio = gl.getPixelRatio();
      gl.setPixelRatio(1);
      const prevShadowEnabled = gl.shadowMap?.enabled;
      if (gl.shadowMap) gl.shadowMap.enabled = false;

      const store = use3DStore.getState();
      const curMode = store.activeTool === 'move' ? 'translate' : store.activeTool === 'rotate' ? 'rotate' : store.activeTool === 'scale' ? 'scale' : null;
      if (!curMode) { restoreState(); return; }
      const ids = store.selectedIds;
      const allShapes = store.shapes;
      const sel = allShapes.filter((s) => ids.includes(s.id));
      const gSnap = store.gridSnap;
      const rSnap = store.rotationSnap;
      const origin = currentGizmoCenter.clone();
      const startX = e.clientX;
      const startY = e.clientY;
      const snapVal = (v, s) => s > 0 ? Math.round(v / s) * s : v;
      const snapAng = (v, deg) => deg > 0 ? Math.round(v / (deg * Math.PI / 180)) * (deg * Math.PI / 180) : v;

      // Snapshot + find meshes
      const startPosMap = new Map();
      const startRotMap = new Map();
      const startScaleMap = new Map();
      const meshes = [];
      const meshIdx = new Map();
      let idx = 0;

      scene?.traverse?.((child) => {
        if (child.isMesh && child.userData.shapeId && ids.includes(child.userData.shapeId)) {
          meshes.push(child);
          meshIdx.set(child.userData.shapeId, idx++);
        }
      });

      sel.forEach((s) => {
        startPosMap.set(s.id, [...s.position]);
        startRotMap.set(s.id, [...s.rotation]);
        startScaleMap.set(s.id, [...s.scale]);
      });

      let activated = false;
      let startProjected = 0;
      let renderQueued = false;
      const queueRender = () => {
        if (!renderQueued) {
          renderQueued = true;
          requestAnimationFrame(() => { renderQueued = false; renderFrame(); });
        }
      };

      const onMove = (ev) => {
        const d = dragRef.current;

        if (!activated) {
          if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 3) return;
          activated = true;
          d.active = true;
          d.axis = axis;
          d.mode = curMode;
          d.origin = origin;
          d.startMouse = { x: startX, y: startY };
          d.lastDelta = 0;
          startProjected = projectMouse(startX, startY, axis, origin) || 0;
          setDragInfo({ axis, mode: curMode, value: 0 });
          if (externalOrbitRef?.current) externalOrbitRef.current.enabled = false;
          canvas.style.cursor = 'grabbing';
        }

        if (!d.active) return;

        if (curMode === 'translate') {
          let current = projectMouse(ev.clientX, ev.clientY, axis, origin);
          if (current === null) return;
          let delta = current - startProjected;
          d.lastDelta = delta;
          const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
          for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            const id = mesh.userData.shapeId;
            const sp = startPosMap.get(id);
            if (!sp) return;
            const val = sp[idx] + delta;
            if (idx === 0) mesh.position.x = val;
            else if (idx === 1) mesh.position.y = val;
            else mesh.position.z = val;
          }
        } else if (curMode === 'rotate') {
          const sv = projectMouse(startX, startY, axis, origin);
          const cv = projectMouse(ev.clientX, ev.clientY, axis, origin);
          if (sv === null || cv === null) return;
          let angle = snapAng(cv - sv, rSnap);
          d.lastDelta = angle;
          const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
          for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            const id = mesh.userData.shapeId;
            const sr = startRotMap.get(id);
            if (!sr) return;
            const val = sr[idx] + angle;
            if (idx === 0) mesh.rotation.x = val;
            else if (idx === 1) mesh.rotation.y = val;
            else mesh.rotation.z = val;
          }
        } else if (curMode === 'scale') {
          const movement = axis === 'y' ? -(ev.clientY - startY) : ev.clientX - startX;
          let factor = Math.round(Math.max(0.05, 1 + movement * 0.003) / 0.05) * 0.05;
          d.lastDelta = factor;
          const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
          for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            const id = mesh.userData.shapeId;
            const ss = startScaleMap.get(id);
            if (!ss || ss.length <= idx) return;
            const val = Math.max(0.01, ss[idx] * factor);
            if (idx === 0) mesh.scale.x = val;
            else if (idx === 1) mesh.scale.y = val;
            else mesh.scale.z = val;
          }
        }

        queueRender();
      };

      function restoreState() {
        gl.setPixelRatio(prevPixelRatio);
        if (gl.shadowMap) gl.shadowMap.enabled = prevShadowEnabled;
      }

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        dragRef.current.active = false;
        setDragInfo(null);
        window.__gizmoActive = false;
        if (externalOrbitRef?.current) externalOrbitRef.current.enabled = true;
        canvas.style.cursor = 'auto';

        if (activated) {
          // Commit final state to store (with snap)
          const curStore = use3DStore.getState();
          for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            const id = mesh.userData.shapeId;
            curStore.updateShape(id, {
              position: [
                snapVal(mesh.position.x, gSnap),
                mesh.position.y,
                snapVal(mesh.position.z, gSnap),
              ],
              rotation: [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z],
              scale: [mesh.scale.x, mesh.scale.y, mesh.scale.z],
            });
          }
          pushHistory();
        }

        restoreState();
        renderFrame();
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };

    canvas.addEventListener('pointerdown', handleDown, { capture: true });
    return () => canvas.removeEventListener('pointerdown', handleDown, { capture: true });
  }, [gl, scene, camera, hitTestGizmo, projectMouse, pushHistory, updateShape]);

  useEffect(() => () => {
    if (externalOrbitRef?.current) externalOrbitRef.current.enabled = true;
  }, []);

  const onHover = useCallback((ax) => {
    setHoveredAxis(ax);
    gl.domElement.style.cursor = 'grab';
  }, [gl]);

  const onUnhover = useCallback(() => {
    setHoveredAxis(null);
    if (!dragRef.current.active) gl.domElement.style.cursor = 'auto';
  }, [gl]);

  if (!gizmoCenter || selectedIds.length === 0) return null;

  const s = gizmoScale;
  const arrowLen = 3 * s;
  const headLen = 0.5 * s;
  const headRad = 0.15 * s;
  const shaftRad = 0.04 * s;
  const hitR = 0.4 * s;
  const ringR = 2.5 * s;
  const ringT = 0.06 * s;
  const boxS = 0.2 * s;

  const col = (ax) => dragInfo?.axis === ax ? AXIS_HOVER[ax] : hoveredAxis === ax ? AXIS_HOVER[ax] : AXIS_COLORS[ax];

  const axisRot = (ax) => ax === 'x' ? [0, 0, -Math.PI / 2] : ax === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0];
  const shaftPos = (ax) => ax === 'x' ? [arrowLen / 2, 0, 0] : ax === 'y' ? [0, arrowLen / 2, 0] : [0, 0, arrowLen / 2];
  const headPos = (ax) => ax === 'x' ? [arrowLen, 0, 0] : ax === 'y' ? [0, arrowLen, 0] : [0, 0, arrowLen];

  const hitProps = (ax) => ({
    ref: setAxisRef(ax),
    onPointerOver: (e) => { e.stopPropagation(); onHover(ax); },
    onPointerOut: (e) => { e.stopPropagation(); onUnhover(); },
  });

  const renderTranslate = () => ['x', 'y', 'z'].map((ax) => {
    const c = col(ax);
    const rot = axisRot(ax);
    const hp = headPos(ax);
    const sp = shaftPos(ax);
    return (
      <group key={ax}>
        <mesh position={hp} rotation={rot}>
          <coneGeometry args={[headRad, headLen, 12]} />
          <meshBasicMaterial color={c} depthTest={false} />
        </mesh>
        <mesh position={sp} rotation={rot}>
          <cylinderGeometry args={[shaftRad, shaftRad, arrowLen, 8]} />
          <meshBasicMaterial color={c} depthTest={false} transparent opacity={0.9} />
        </mesh>
        <mesh position={sp} rotation={rot} {...hitProps(ax)}>
          <cylinderGeometry args={[hitR, hitR, arrowLen + headLen, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    );
  });

  const renderRotate = () => ['x', 'y', 'z'].map((ax) => {
    const c = col(ax);
    const rot = ax === 'x' ? [0, Math.PI / 2, 0] : ax === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0];
    return (
      <group key={ax}>
        <mesh rotation={rot} {...hitProps(ax)}>
          <torusGeometry args={[ringR, ringT, 16, 64]} />
          <meshBasicMaterial color={c} depthTest={false} transparent opacity={0.8} />
        </mesh>
      </group>
    );
  });

  const renderScale = () => ['x', 'y', 'z'].map((ax) => {
    const c = col(ax);
    const len = 2.5 * s;
    const bp = headPos(ax).map((v) => v / arrowLen * len);
    const sp = shaftPos(ax).map((v) => v / arrowLen * len);
    const rot = axisRot(ax);
    return (
      <group key={ax}>
        <mesh position={bp}>
          <boxGeometry args={[boxS, boxS, boxS]} />
          <meshBasicMaterial color={c} depthTest={false} />
        </mesh>
        <mesh position={sp} rotation={rot}>
          <cylinderGeometry args={[shaftRad, shaftRad, len, 8]} />
          <meshBasicMaterial color={c} depthTest={false} transparent opacity={0.8} />
        </mesh>
        <mesh position={bp} {...hitProps(ax)}>
          <boxGeometry args={[boxS * 3, boxS * 3, boxS * 3]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    );
  });

  return (
    <group ref={groupRef} position={gizmoCenter.toArray()}>
      {mode === 'translate' && renderTranslate()}
      {mode === 'rotate' && renderRotate()}
      {mode === 'scale' && renderScale()}
    </group>
  );
};

export default TransformGizmo;
