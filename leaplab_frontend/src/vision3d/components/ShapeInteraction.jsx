/**
 * Vision3D - Blender-Style Shape Interaction (Ultimate Performance)
 * Handles both shape selection (click) and transform (drag).
 * Takes over rendering completely during drag:
 * - Stops R3F animation loop
 * - Drops pixel ratio to 1
 * - Disables shadows
 * - Renders manually
 * Restores everything on pointerup.
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { use3DStore } from '../store/use3DStore';

const _mouse = new THREE.Vector2();
const _raycaster = new THREE.Raycaster();
const _planeNormal = new THREE.Vector3(0, 1, 0);
const _plane = new THREE.Plane();
const _intersection = new THREE.Vector3();
const _center = new THREE.Vector3();

const ShapeInteraction = () => {
  const { camera, gl, scene } = useThree();
  const pushHistory = use3DStore((s) => s.pushHistory);
  const selectShape = use3DStore((s) => s.selectShape);
  const deselectAll = use3DStore((s) => s.deselectAll);
  const activeRef = useRef(false);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleDown = (e) => {
      if (activeRef.current || window.__gizmoActive) return;
      if (e.button !== 0) return;

      const store = use3DStore.getState();
      // Skip object-level interaction when in edit mode (MeshEditor handles it)
      if (store.editMode !== 'object') return;

      const tool = store.activeTool;
      const isCtrl = e.ctrlKey || e.metaKey;

      // ── Shape selection by raycasting ─────────────────────
      const rect = canvas.getBoundingClientRect();
      const mouseNDC = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      _raycaster.setFromCamera(mouseNDC, camera);

      // Collect all shape meshes in scene
      const allMeshes = [];
      scene?.traverse?.((child) => {
        if (child.isMesh && child.userData.shapeId && !child.userData.gizmoAxis) {
          allMeshes.push(child);
        }
      });

      const hits = _raycaster.intersectObjects(allMeshes, false);
      const clickedShapeId = hits.length > 0 ? hits[0].object.userData.shapeId : null;

      // If we clicked on a shape, handle selection
      if (clickedShapeId) {
        if (isCtrl) {
          // Ctrl+click: toggle selection
          const currentIds = use3DStore.getState().selectedIds;
          if (currentIds.includes(clickedShapeId)) {
            selectShape(clickedShapeId, false); // deselect
          } else {
            selectShape(clickedShapeId, true); // add to selection
          }
        } else {
          // Normal click: select only this shape (always select, never toggle off)
          selectShape(clickedShapeId, false);
        }
      }

      // ── Transform drag on shapes (works for click+drag on shapes or empty space) ──
      // Re-read state after selection
      const postStore = use3DStore.getState();
      const postIds = postStore.selectedIds;
      if (postIds.length === 0) return;
      if (tool === 'select') return;

      const sel = postStore.shapes.filter((s) => postIds.includes(s.id));
      if (sel.length === 0) return;

      // ── Take over rendering (Blender-style) ──────────────
      gl.setAnimationLoop(null);
      const prevPixelRatio = gl.getPixelRatio();
      gl.setPixelRatio(1);
      const prevShadowEnabled = gl.shadowMap?.enabled;
      if (gl.shadowMap) gl.shadowMap.enabled = false;

      const startX = e.clientX;
      const startY = e.clientY;
      const gSnap = store.gridSnap;
      const rSnap = store.rotationSnap;

      const rectCx = rect.left + rect.width * 0.5;
      const rectCy = rect.top + rect.height * 0.5;

      const snapVal = (v, s) => s > 0 ? Math.round(v / s) * s : v;
      const snapAng = (v, deg) => {
        if (deg <= 0) return v;
        const rad = deg * 0.017453292519943295;
        return Math.round(v / rad) * rad;
      };

      _center.set(0, 0, 0);
      for (let i = 0; i < sel.length; i++) {
        const p = sel[i].position;
        _center.x += p[0];
        _center.y += p[1];
        _center.z += p[2];
      }
      _center.divideScalar(sel.length);

      const startPos = new Float64Array(sel.length * 3);
      const startRot = new Float64Array(sel.length * 3);
      const startScale = new Float64Array(sel.length * 3);
      for (let i = 0; i < sel.length; i++) {
        const s = sel[i];
        const i3 = i * 3;
        startPos[i3] = s.position[0]; startPos[i3 + 1] = s.position[1]; startPos[i3 + 2] = s.position[2];
        startRot[i3] = s.rotation[0]; startRot[i3 + 1] = s.rotation[1]; startRot[i3 + 2] = s.rotation[2];
        startScale[i3] = s.scale[0]; startScale[i3 + 1] = s.scale[1]; startScale[i3 + 2] = s.scale[2];
      }

      const meshes = [];
      const meshIdx = new Map();
      let idx = 0;
      scene?.traverse?.((child) => {
        if (child.isMesh && child.userData.shapeId && postIds.includes(child.userData.shapeId)) {
          meshes.push(child);
          meshIdx.set(child.userData.shapeId, idx++);
        }
      });
      if (meshes.length === 0) { restoreState(); return; }

      let startProjX = 0, startProjZ = 0;
      let startScaleDist = 0;
      let activated = false;

      const intersectYPlane = (clientX, clientY, yLevel) => {
        _mouse.set(
          ((clientX - rect.left) / rect.width) * 2 - 1,
          -((clientY - rect.top) / rect.height) * 2 + 1
        );
        _raycaster.setFromCamera(_mouse, camera);
        _planeNormal.set(0, 1, 0);
        _plane.setFromNormalAndCoplanarPoint(_planeNormal, _center);
        _plane.constant = -yLevel;
        return _raycaster.ray.intersectPlane(_plane, _intersection);
      };

      let renderQueued = false;
      const queueRender = () => {
        if (!renderQueued) {
          renderQueued = true;
          requestAnimationFrame(() => {
            renderQueued = false;
            gl.render(scene, camera);
          });
        }
      };

      const onMove = (ev) => {
        if (!activated) {
          if (Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) < 3) return;
          activated = true;
          window.__gizmoActive = true;
          if (window.__externalOrbitRef?.current) window.__externalOrbitRef.current.enabled = false;
          canvas.style.cursor = 'grabbing';

          if (tool === 'move') {
            if (intersectYPlane(startX, startY, _center.y)) {
              startProjX = _intersection.x; startProjZ = _intersection.z;
            }
          } else if (tool === 'scale') {
            const dx = startX - rectCx, dy = startY - rectCy;
            startScaleDist = Math.sqrt(dx * dx + dy * dy);
          }
        }

        if (tool === 'move') {
          if (!intersectYPlane(ev.clientX, ev.clientY, _center.y)) return;
          const dx = _intersection.x - startProjX;
          const dz = _intersection.z - startProjZ;
          for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            const i3 = meshIdx.get(mesh.userData.shapeId) * 3;
            mesh.position.x = startPos[i3] + dx;
            mesh.position.z = startPos[i3 + 2] + dz;
          }
        } else if (tool === 'rotate') {
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;
          const angle = snapAng((dx + dy) * 0.01, rSnap);
          // Rotate around camera view axis (perpendicular to screen)
          const viewDir = new THREE.Vector3();
          camera.getWorldDirection(viewDir);
          for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            const i3 = meshIdx.get(mesh.userData.shapeId) * 3;
            // Apply rotation around view axis using quaternion
            const quat = new THREE.Quaternion();
            quat.setFromAxisAngle(viewDir, angle);
            const currentQuat = new THREE.Quaternion().setFromEuler(
              new THREE.Euler(startRot[i3], startRot[i3 + 1], startRot[i3 + 2])
            );
            currentQuat.premultiply(quat);
            const euler = new THREE.Euler().setFromQuaternion(currentQuat);
            mesh.rotation.x = euler.x;
            mesh.rotation.y = euler.y;
            mesh.rotation.z = euler.z;
          }
        } else if (tool === 'scale') {
          const dx = ev.clientX - rectCx, dy = ev.clientY - rectCy;
          if (startScaleDist < 1) return;
          const sf = Math.round(Math.max(0.05, Math.sqrt(dx * dx + dy * dy) / startScaleDist) / 0.05) * 0.05;
          for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            const i3 = meshIdx.get(mesh.userData.shapeId) * 3;
            mesh.scale.x = Math.max(0.001, startScale[i3] * sf);
            mesh.scale.y = Math.max(0.001, startScale[i3 + 1] * sf);
            mesh.scale.z = Math.max(0.001, startScale[i3 + 2] * sf);
          }
        }

        queueRender();
      };

      function restoreState() {
        gl.setPixelRatio(prevPixelRatio);
        if (gl.shadowMap) gl.shadowMap.enabled = prevShadowEnabled;
      }

      const commitToStore = (confirm) => {
        const curStore = use3DStore.getState();
        for (let i = 0; i < meshes.length; i++) {
          const mesh = meshes[i];
          const id = mesh.userData.shapeId;
          const i3 = meshIdx.get(id) * 3;
          if (confirm) {
            curStore.updateShape(id, {
              position: [
                snapVal(mesh.position.x, gSnap),
                mesh.position.y,
                snapVal(mesh.position.z, gSnap),
              ],
              rotation: [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z],
              scale: [mesh.scale.x, mesh.scale.y, mesh.scale.z],
            });
          } else {
            mesh.position.set(startPos[i3], startPos[i3 + 1], startPos[i3 + 2]);
            mesh.rotation.set(startRot[i3], startRot[i3 + 1], startRot[i3 + 2]);
            mesh.scale.set(startScale[i3], startScale[i3 + 1], startScale[i3 + 2]);
            curStore.updateShape(id, {
              position: [startPos[i3], startPos[i3 + 1], startPos[i3 + 2]],
              rotation: [startRot[i3], startRot[i3 + 1], startRot[i3 + 2]],
              scale: [startScale[i3], startScale[i3 + 1], startScale[i3 + 2]],
            });
          }
        }
      };

      const cleanup = (confirm) => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('contextmenu', onContext);
        window.removeEventListener('keydown', onKey);
        activeRef.current = false;
        window.__gizmoActive = false;
        if (window.__externalOrbitRef?.current) window.__externalOrbitRef.current.enabled = true;
        canvas.style.cursor = 'auto';

        if (activated) {
          commitToStore(confirm);
          if (confirm) pushHistory();
        }

        restoreState();
        gl.render(scene, camera);
      };

      const onUp = () => cleanup(true);
      const onContext = (e) => { e.preventDefault(); cleanup(false); };
      const onKey = (e) => { if (e.key === 'Escape') cleanup(false); };

      activeRef.current = true;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('contextmenu', onContext);
      window.addEventListener('keydown', onKey);
    };

    canvas.addEventListener('pointerdown', handleDown, { capture: true });
    return () => canvas.removeEventListener('pointerdown', handleDown, { capture: true });
  }, [camera, gl, scene, pushHistory, selectShape, deselectAll]);

  return null;
};

export default ShapeInteraction;
