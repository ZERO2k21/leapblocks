/**
 * Vision3D - TinkerCAD-Style Resize Handles
 * Shows white square handles at bounding box corners and face centers.
 * Corner handles → uniform scale. Face handles → single-axis scale.
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { use3DStore } from '../store/use3DStore';

const HANDLE_SIZE = 0.15;

const setHandleRef = (data) => (mesh) => {
  if (mesh) mesh.userData.resizeHandle = data;
};

const ResizeHandles = () => {
  const { camera, gl } = useThree();
  const selectedIds = use3DStore((s) => s.selectedIds);
  const shapes = use3DStore((s) => s.shapes);
  const updateShape = use3DStore((s) => s.updateShape);

  const [hoveredHandle, setHoveredHandle] = useState(null);
  const [dragInfo, setDragInfo] = useState(null);
  const dragRef = useRef({ active: false });
  const groupRef = useRef();

  const handleDataRef = useRef(null);
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;

  const selectedShape = useMemo(
    () => shapes.find((s) => selectedIds.includes(s.id)),
    [shapes, selectedIds]
  );

  const handleData = useMemo(() => {
    if (!selectedShape || selectedShape.locked) return null;

    const baseW = selectedShape.width ?? 2;
    const baseH = selectedShape.height ?? 2;
    const baseD = selectedShape.depth ?? 2;
    const sc = selectedShape.scale ?? [1, 1, 1];
    const pos = selectedShape.position ?? [0, 0, 0];
    const rot = selectedShape.rotation ?? [0, 0, 0];

    const vw = baseW * sc[0];
    const vh = baseH * sc[1];
    const vd = baseD * sc[2];
    const euler = new THREE.Euler(rot[0], rot[1], rot[2]);
    const quat = new THREE.Quaternion().setFromEuler(euler);

    const cornerSigns = [
      [-1, -1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1],
    ];

    const faceData = [
      { sign: [1, 0, 0], axis: 0 },
      { sign: [-1, 0, 0], axis: 0 },
      { sign: [0, 1, 0], axis: 1 },
      { sign: [0, -1, 0], axis: 1 },
      { sign: [0, 0, 1], axis: 2 },
      { sign: [0, 0, -1], axis: 2 },
    ];

    const toWorld = (lx, ly, lz) => {
      const v = new THREE.Vector3(lx, ly, lz).applyQuaternion(quat);
      return [v.x + pos[0], v.y + pos[1], v.z + pos[2]];
    };

    const corners = cornerSigns.map((s) => ({
      pos: toWorld(s[0] * vw / 2, s[1] * vh / 2, s[2] * vd / 2),
      signs: s,
      opposite: s.map((v) => -v),
      type: 'corner',
      idx: cornerSigns.indexOf(s),
    }));

    const faces = faceData.map((f) => ({
      pos: toWorld(f.sign[0] * vw / 2, f.sign[1] * vh / 2, f.sign[2] * vd / 2),
      axis: f.axis,
      type: 'face',
      sign: f.sign,
    }));

    return {
      corners,
      faces,
      baseW, baseH, baseD, sc, pos, rot, quat,
    };
  }, [selectedShape]);

  handleDataRef.current = handleData;

  const raycastHandles = useCallback((clientX, clientY) => {
    const grp = groupRef.current;
    if (!grp) return null;
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    const rc = new THREE.Raycaster();
    rc.setFromCamera(mouse, camera);
    const targets = [];
    grp.traverse((child) => {
      if (child.isMesh && child.userData.resizeHandle) targets.push(child);
    });
    if (targets.length === 0) return null;
    const hits = rc.intersectObjects(targets, false);
    if (hits.length === 0) return null;
    return hits[0].object.userData.resizeHandle;
  }, [camera, gl]);

  useEffect(() => {
    if (!gl) return;

    const canvas = gl.domElement;

    const handleDown = (e) => {
      const currentHandleData = handleDataRef.current;
      const currentSelectedIds = selectedIdsRef.current;
      if (!currentHandleData || currentSelectedIds.length === 0) return;
      if (dragRef.current.active || window.__gizmoActive) return;

      const hit = raycastHandles(e.clientX, e.clientY);
      if (!hit) return;

      e.preventDefault();

      const initialScale = [...currentHandleData.sc];
      const initialPos = [...currentHandleData.pos];
      const baseW = currentHandleData.baseW;
      const baseH = currentHandleData.baseH;
      const baseD = currentHandleData.baseD;
      const quat = currentHandleData.quat.clone();
      const startX = e.clientX;
      const startY = e.clientY;
      let activated = false;

      window.__gizmoActive = true;

      const findCornerBySigns = (signs) => {
        return currentHandleData.corners.find((c) =>
          c.signs[0] === signs[0] && c.signs[1] === signs[1] && c.signs[2] === signs[2]
        );
      };

      const onMove = (ev) => {
        const d = dragRef.current;
        if (!activated) {
          if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 3) return;
          activated = true;
          d.active = true;
          setDragInfo({ type: hit.type, axis: hit.axis || hit.idx });
          if (window.__externalOrbitRef?.current) window.__externalOrbitRef.current.enabled = false;
          canvas.style.cursor = 'nwse-resize';
        }
        if (!d.active) return;

        const store = use3DStore.getState();
        const shape = store.shapes.find((s) => store.selectedIds.includes(s.id));

        if (hit.type === 'corner') {
          const rect = gl.domElement.getBoundingClientRect();
          const mouse = new THREE.Vector2(
            ((ev.clientX - rect.left) / rect.width) * 2 - 1,
            -((ev.clientY - rect.top) / rect.height) * 2 + 1
          );
          const rc = new THREE.Raycaster();
          rc.setFromCamera(mouse, camera);

          const viewDir = new THREE.Vector3();
          camera.getWorldDirection(viewDir);
          const planeNormal = viewDir.clone();
          const cornerWorld = new THREE.Vector3(...hit.pos);
          const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, cornerWorld);
          const pt = new THREE.Vector3();
          rc.ray.intersectPlane(plane, pt);

          if (!pt) return;

          const oppositeSigns = hit.signs.map((v) => -v);
          const oppositeCorner = findCornerBySigns(oppositeSigns);
          if (!oppositeCorner) return;
          const fixedPos = new THREE.Vector3(...oppositeCorner.pos);

          const oldVec = new THREE.Vector3(...hit.pos).sub(fixedPos);
          const newVec = pt.clone().sub(fixedPos);

          const oldLen = oldVec.length();
          if (oldLen < 0.001) return;
          const projLen = newVec.dot(oldVec.clone().normalize());
          if (projLen < 0.01) return;
          const factor = projLen / oldLen;

          const finalFactor = Math.max(0.05, Math.min(10, factor));
          const newScale = initialScale.map((s) => Math.max(0.01, s * finalFactor));

          const newVisW = baseW * newScale[0];
          const newVisH = baseH * newScale[1];
          const newVisD = baseD * newScale[2];

          const newCornerLocal = new THREE.Vector3(
            hit.signs[0] * newVisW / 2,
            hit.signs[1] * newVisH / 2,
            hit.signs[2] * newVisD / 2
          ).applyQuaternion(quat);

          const newCornerWorld = new THREE.Vector3(
            newCornerLocal.x + initialPos[0],
            newCornerLocal.y + initialPos[1],
            newCornerLocal.z + initialPos[2]
          );

          const newPos = [
            (fixedPos.x + newCornerWorld.x) / 2,
            (fixedPos.y + newCornerWorld.y) / 2,
            (fixedPos.z + newCornerWorld.z) / 2,
          ];

          const gSnap = store.gridSnap;
          const sv = (v, s) => s > 0 ? Math.round(v / s) * s : v;
          if (shape) updateShape(shape.id, {
            scale: newScale.map((v) => Math.round(v * 100) / 100),
            position: newPos.map((v) => sv(v, gSnap)),
          });
        } else if (hit.type === 'face') {
          const axis = hit.axis;
          const sign = hit.sign[axis];

          const rect = gl.domElement.getBoundingClientRect();
          const mouse = new THREE.Vector2(
            ((ev.clientX - rect.left) / rect.width) * 2 - 1,
            -((ev.clientY - rect.top) / rect.height) * 2 + 1
          );
          const rc = new THREE.Raycaster();
          rc.setFromCamera(mouse, camera);

          const viewDir = new THREE.Vector3();
          camera.getWorldDirection(viewDir);
          const planeNormal = viewDir.clone();
          const faceWorld = new THREE.Vector3(...hit.pos);
          const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, faceWorld);
          const pt = new THREE.Vector3();
          rc.ray.intersectPlane(plane, pt);
          if (!pt) return;

          const axisVec = new THREE.Vector3(axis === 0 ? 1 : 0, axis === 1 ? 1 : 0, axis === 2 ? 1 : 0);
          const rotatedAxis = axisVec.clone().applyQuaternion(quat);

          const oppositeAxisPos = new THREE.Vector3(...initialPos);
          const offset = axis === 0 ? baseW * initialScale[0] / 2 * (-sign) :
                        axis === 1 ? baseH * initialScale[1] / 2 * (-sign) :
                        baseD * initialScale[2] / 2 * (-sign);
          const localOffset = new THREE.Vector3(
            axis === 0 ? offset : 0,
            axis === 1 ? offset : 0,
            axis === 2 ? offset : 0
          ).applyQuaternion(quat);
          oppositeAxisPos.add(localOffset);

          const ptToFixed = pt.clone().sub(oppositeAxisPos);
          const projLen = ptToFixed.dot(rotatedAxis);
          const clampedProj = Math.max(0.05, projLen);

          const oldFaceOffset = axis === 0 ? baseW * initialScale[0] / 2 :
                               axis === 1 ? baseH * initialScale[1] / 2 :
                               baseD * initialScale[2] / 2;

          const newScaleVal = (clampedProj / oldFaceOffset) * initialScale[axis];
          const finalScaleVal = Math.max(0.01, Math.min(10, newScaleVal));
          const newScale = [...initialScale];
          newScale[axis] = Math.round(finalScaleVal * 100) / 100;

          const newFaceOffset = axis === 0 ? baseW * newScale[0] / 2 :
                               axis === 1 ? baseH * newScale[1] / 2 :
                               baseD * newScale[2] / 2;
          const midpoint = (newFaceOffset * sign + (-oldFaceOffset) * (-sign)) / 2;
          const localMid = new THREE.Vector3(
            axis === 0 ? midpoint : 0,
            axis === 1 ? midpoint : 0,
            axis === 2 ? midpoint : 0
          ).applyQuaternion(quat);
          const newPos = [
            initialPos[0] + localMid.x,
            initialPos[1] + localMid.y,
            initialPos[2] + localMid.z,
          ];

          const gSnap = store.gridSnap;
          const sv = (v, s) => s > 0 ? Math.round(v / s) * s : v;
          if (shape) updateShape(shape.id, {
            scale: newScale,
            position: newPos.map((v) => sv(v, gSnap)),
          });
        }
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        dragRef.current.active = false;
        setDragInfo(null);
        window.__gizmoActive = false;
        if (window.__externalOrbitRef?.current) window.__externalOrbitRef.current.enabled = true;
        canvas.style.cursor = 'auto';
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };

    canvas.addEventListener('pointerdown', handleDown, { capture: true });
    return () => canvas.removeEventListener('pointerdown', handleDown, { capture: true });
  }, [gl]);

  if (!handleData || selectedIds.length !== 1 || selectedShape?.locked) return null;

  const hs = HANDLE_SIZE;
  const s = (handleData.sc[0] + handleData.sc[1] + handleData.sc[2]) / 3;
  const handleScale = Math.max(1, s);

  const hovCol = (key) => dragInfo?.axis === key || hoveredHandle === key ? '#ffffff' : '#e0e0e0';

  const renderHandle = (data, key) => (
    <mesh
      key={key}
      position={data.pos}
      ref={setHandleRef(data)}
      onPointerOver={(e) => { e.stopPropagation(); setHoveredHandle(key); gl.domElement.style.cursor = 'nwse-resize'; }}
      onPointerOut={(e) => { e.stopPropagation(); setHoveredHandle(null); if (!dragRef.current.active) gl.domElement.style.cursor = 'auto'; }}
    >
      <boxGeometry args={[hs * handleScale, hs * handleScale, hs * handleScale]} />
      <meshBasicMaterial color={hovCol(key)} depthTest={false} transparent opacity={0.9} />
    </mesh>
  );

  return (
    <group ref={groupRef}>
      {handleData.corners.map((c, i) => renderHandle(c, `corner_${i}`))}
      {handleData.faces.map((f, i) => renderHandle({
        pos: f.pos,
        type: 'face',
        axis: f.axis,
        sign: f.sign,
        handleIdx: i,
      }, `face_${i}`))}
    </group>
  );
};

export default ResizeHandles;
