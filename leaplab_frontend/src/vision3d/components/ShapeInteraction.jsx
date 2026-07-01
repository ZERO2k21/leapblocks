/**
 * Vision3D - Shape Body Drag Handler
 * DOM capture listener for TinkerCAD-style click-drag shape movement.
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { use3DStore } from '../store/use3DStore';

const ShapeInteraction = () => {
  const { camera, gl, scene } = useThree();
  const updateShape = use3DStore((s) => s.updateShape);
  const selectShape = use3DStore((s) => s.selectShape);
  const activeRef = useRef(false);
  const rc = useRef(new THREE.Raycaster());

  const raycastShape = useCallback((clientX, clientY) => {
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    rc.current.setFromCamera(mouse, camera);

    const targets = [];
    scene?.traverse?.((child) => {
      if (child.isMesh && child.userData.shapeId) targets.push(child);
    });

    if (targets.length === 0) return null;
    const hits = rc.current.intersectObjects(targets, false);
    if (hits.length === 0) return null;
    return { shapeId: hits[0].object.userData.shapeId };
  }, [camera, gl, scene]);

  useEffect(() => {
    const canvas = gl.domElement;
    const raycaster = rc.current;

    const handleDown = (e) => {
      if (activeRef.current || window.__gizmoActive) return;

      const hit = raycastShape(e.clientX, e.clientY);
      if (!hit) return;

      const allShapes = use3DStore.getState().shapes;
      const shape = allShapes.find((s) => s.id === hit.shapeId);
      if (!shape || shape.locked) return;

      e.preventDefault();

      const shapeId = shape.id;
      const initialPos = [...shape.position];
      const yLevel = shape.position[1];
      const startX = e.clientX;
      const startY = e.clientY;
      const rect = canvas.getBoundingClientRect();
      let moved = false;

      window.__gizmoActive = true;

      const m2d = (x, y) => new THREE.Vector2(
        ((x - rect.left) / rect.width) * 2 - 1,
        -((y - rect.top) / rect.height) * 2 + 1
      );

      const projOnY = (x, y, yL) => {
        const m = m2d(x, y);
        raycaster.setFromCamera(m, camera);
        const pl = new THREE.Plane(new THREE.Vector3(0, 1, 0), -yL);
        const pt = new THREE.Vector3();
        raycaster.ray.intersectPlane(pl, pt);
        return pt;
      };

      const startPt = projOnY(startX, startY, yLevel);

      const onMove = (ev) => {
        if (!moved) {
          if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 4) return;
          moved = true;
          if (window.__externalOrbitRef?.current) window.__externalOrbitRef.current.enabled = false;
        }

        const curPt = projOnY(ev.clientX, ev.clientY, yLevel);
        if (!startPt || !curPt || curPt.length() === 0) return;

        const delta = curPt.clone().sub(startPt);
        const snap = (v, s) => s > 0 ? Math.round(v / s) * s : v;
        const gSnap = use3DStore.getState().gridSnap;
        updateShape(shapeId, {
          position: [
            snap(initialPos[0] + delta.x, gSnap),
            initialPos[1],
            snap(initialPos[2] + delta.z, gSnap),
          ],
        });
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        activeRef.current = false;

        if (!moved) {
          selectShape(shapeId, e.shiftKey);
        }

        window.__gizmoActive = false;
        if (window.__externalOrbitRef?.current) window.__externalOrbitRef.current.enabled = true;
      };

      activeRef.current = true;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };

    canvas.addEventListener('pointerdown', handleDown, { capture: true });
    return () => canvas.removeEventListener('pointerdown', handleDown, { capture: true });
  }, [camera, gl, raycastShape, updateShape, selectShape]);

  return null;
};

export default ShapeInteraction;
