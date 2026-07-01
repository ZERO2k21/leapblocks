/**
 * Vision3D - Custom Blender-Style Transform Gizmo
 * Infinite drag on axis arrows, rotation rings, scale handles
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { use3DStore } from '../store/use3DStore';
import { Html } from '@react-three/drei';
import { log } from '../utils/logger';

const AXIS_COLORS = { x: '#ef4444', y: '#22c55e', z: '#3b82f6' };
const AXIS_HOVER_COLORS = { x: '#ff6666', y: '#66ff66', z: '#6666ff' };
const AXIS_VEC = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};

let externalOrbitRef = null;
export const setOrbitRef = (ref) => { externalOrbitRef = ref; };

const TransformGizmo = () => {
  const { camera, raycaster, gl } = useThree();
  const selectedIds = use3DStore((s) => s.selectedIds);
  const shapes = use3DStore((s) => s.shapes);
  const updateShape = use3DStore((s) => s.updateShape);
  const pushHistory = use3DStore((s) => s.pushHistory);
  const activeTool = use3DStore((s) => s.activeTool);
  const gridSnap = use3DStore((s) => s.gridSnap);
  const rotationSnap = use3DStore((s) => s.rotationSnap);

  const [dragging, setDragging] = useState(false);
  const [dragAxis, setDragAxis] = useState(null);
  const [hoveredAxis, setHoveredAxis] = useState(null);
  const [dragValue, setDragValue] = useState(0);

  const dragState = useRef({
    startMouse: new THREE.Vector2(),
    axis: null,
    mode: 'translate',
    objectPositions: [],
    objectRotations: [],
    objectScales: [],
    gizmoOrigin: new THREE.Vector3(),
    startAngle: 0,
    lastAngle: 0,
    lastDelta: 0,
    historyPushed: false,
  });

  const gizmoCenter = useMemo(() => {
    if (selectedIds.length === 0) return null;
    const selected = shapes.filter((s) => selectedIds.includes(s.id));
    if (selected.length === 0) return null;
    const center = new THREE.Vector3();
    selected.forEach((s) => {
      center.x += s.position[0];
      center.y += s.position[1];
      center.z += s.position[2];
    });
    center.divideScalar(selected.length);
    return center;
  }, [selectedIds, shapes]);

  const gizmoScale = useMemo(() => {
    if (!gizmoCenter) return 1;
    const dist = camera.position.distanceTo(gizmoCenter);
    return Math.max(0.5, Math.min(3, dist * 0.08));
  }, [gizmoCenter, camera.position]);

  const mode = activeTool === 'rotate' ? 'rotate' : activeTool === 'scale' ? 'scale' : 'translate';

  const getMouseWorldOnPlane = useCallback((clientX, clientY, planeNormal, planePoint) => {
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, planePoint);
    const intersection = new THREE.Vector3();
    const hit = raycaster.ray.intersectPlane(plane, intersection);
    return hit ? intersection : null;
  }, [camera, raycaster, gl]);

  const getAxisIntersection = useCallback((clientX, clientY, axis, origin) => {
    const viewDir = new THREE.Vector3();
    camera.getWorldDirection(viewDir);
    const axisDir = AXIS_VEC[axis];

    const perp1 = new THREE.Vector3().crossVectors(viewDir, axisDir).normalize();
    if (perp1.length() < 0.001) {
      perp1.set(1, 0, 0);
    }
    const perp2 = new THREE.Vector3().crossVectors(axisDir, perp1).normalize();
    const planeNormal = new THREE.Vector3().crossVectors(perp1, perp2).normalize();

    return getMouseWorldOnPlane(clientX, clientY, planeNormal, origin);
  }, [camera, getMouseWorldOnPlane]);

  const projectOnAxis = useCallback((point, axis, origin) => {
    const axisDir = AXIS_VEC[axis];
    const delta = point.clone().sub(origin);
    return delta.dot(axisDir);
  }, []);

  const snapValue = useCallback((value, snap) => {
    if (snap > 0) return Math.round(value / snap) * snap;
    return value;
  }, []);

  const handlePointerDown = useCallback((e, axis) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    if (selectedIds.length === 0) return;

    const selected = shapes.filter((s) => selectedIds.includes(s.id));
    const objectPositions = selected.map((s) => [...s.position]);
    const objectRotations = selected.map((s) => [...s.rotation]);
    const objectScales = selected.map((s) => [...s.scale]);

    dragState.current = {
      startMouse: new THREE.Vector2(e.clientX, e.clientY),
      axis,
      mode,
      objectPositions,
      objectRotations,
      objectScales,
      gizmoOrigin: gizmoCenter.clone(),
      startAngle: 0,
      lastAngle: 0,
      lastDelta: 0,
      historyPushed: false,
    };

    setDragging(true);
    setDragAxis(axis);
    setDragValue(0);

    if (externalOrbitRef?.current) {
      externalOrbitRef.current.enabled = false;
    }
    gl.domElement.style.cursor = 'grabbing';
  }, [selectedIds, shapes, mode, gizmoCenter, gl]);

  const handlePointerMove = useCallback((e) => {
    if (!dragging || !dragAxis) return;

    const ds = dragState.current;

    if (!ds.historyPushed) {
      pushHistory();
      ds.historyPushed = true;
    }

    if (ds.mode === 'translate') {
      const worldPoint = getAxisIntersection(e.clientX, e.clientY, ds.axis, ds.gizmoOrigin);
      if (!worldPoint) return;

      let delta = projectOnAxis(worldPoint, ds.axis, ds.gizmoOrigin);
      delta = snapValue(delta, gridSnap);
      ds.lastDelta = delta;
      setDragValue(delta);

      const axisIndex = ds.axis === 'x' ? 0 : ds.axis === 'y' ? 1 : 2;
      selectedIds.forEach((id, i) => {
        if (ds.objectPositions[i]) {
          const newPos = [...ds.objectPositions[i]];
          newPos[axisIndex] = ds.objectPositions[i][axisIndex] + delta;
          updateShape(id, { position: newPos });
        }
      });
    } else if (ds.mode === 'rotate') {
      const startWorld = getAxisIntersection(ds.startMouse.x, ds.startMouse.y, ds.axis, ds.gizmoOrigin);
      const currentWorld = getAxisIntersection(e.clientX, e.clientY, ds.axis, ds.gizmoOrigin);
      if (!startWorld || !currentWorld) return;

      const axisDir = AXIS_VEC[ds.axis];
      const startVec = startWorld.clone().sub(ds.gizmoOrigin);
      const currentVec = currentWorld.clone().sub(ds.gizmoOrigin);

      let angle = startVec.angleTo(currentVec);
      const cross = new THREE.Vector3().crossVectors(startVec, currentVec);
      if (cross.dot(axisDir) < 0) angle = -angle;

      if (gridSnap > 0) {
        const snapRad = (rotationSnap * Math.PI) / 180;
        if (snapRad > 0) angle = Math.round(angle / snapRad) * snapRad;
      }

      ds.lastAngle = angle;
      setDragValue((angle * 180) / Math.PI);

      const axisIndex = ds.axis === 'x' ? 0 : ds.axis === 'y' ? 1 : 2;
      selectedIds.forEach((id, i) => {
        if (ds.objectRotations[i]) {
          const newRot = [...ds.objectRotations[i]];
          newRot[axisIndex] = ds.objectRotations[i][axisIndex] + angle;
          updateShape(id, { rotation: newRot });
        }
      });
    } else if (ds.mode === 'scale') {
      const dx = e.clientX - ds.startMouse.x;
      let factor = 1 + dx * 0.005;
      factor = Math.max(0.05, factor);

      if (gridSnap > 0) {
        factor = Math.round(factor / 0.25) * 0.25;
        factor = Math.max(0.25, factor);
      }

      ds.lastDelta = factor;
      setDragValue(factor);

      const axisIndex = ds.axis === 'x' ? 0 : ds.axis === 'y' ? 1 : 2;
      selectedIds.forEach((id, i) => {
        if (ds.objectScales[i]) {
          const newScale = [...ds.objectScales[i]];
          newScale[axisIndex] = Math.max(0.01, ds.objectScales[i][axisIndex] * factor);
          updateShape(id, { scale: newScale });
        }
      });
    }
  }, [dragging, dragAxis, selectedIds, gridSnap, rotationSnap, getAxisIntersection, projectOnAxis, snapValue, updateShape, pushHistory]);

  const handlePointerUp = useCallback(() => {
    if (dragging) {
      log('TransformGizmo: drag ended, axis:', dragAxis, 'value:', dragValue);
    }
    setDragging(false);
    setDragAxis(null);
    setDragValue(0);

    if (externalOrbitRef?.current) {
      externalOrbitRef.current.enabled = true;
    }
    if (gl?.domElement) {
      gl.domElement.style.cursor = 'auto';
    }
  }, [dragging, dragAxis, dragValue, gl]);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  useEffect(() => {
    return () => {
      if (externalOrbitRef?.current) {
        externalOrbitRef.current.enabled = true;
      }
    };
  }, []);

  if (!gizmoCenter || selectedIds.length === 0) return null;

  const arrowLen = 3 * gizmoScale;
  const arrowHeadLen = 0.5 * gizmoScale;
  const arrowHeadRad = 0.15 * gizmoScale;
  const shaftRad = 0.04 * gizmoScale;
  const ringRadius = 2.5 * gizmoScale;
  const ringTube = 0.04 * gizmoScale;
  const scaleBoxSize = 0.2 * gizmoScale;
  const hitAreaRadius = 0.3 * gizmoScale;

  const renderTranslateAxis = (axis) => {
    const isActive = dragAxis === axis;
    const isHovered = hoveredAxis === axis;
    const color = isActive ? AXIS_HOVER_COLORS[axis] : isHovered ? AXIS_HOVER_COLORS[axis] : AXIS_COLORS[axis];
    const len = arrowLen;
    const headPos = axis === 'x' ? [len, 0, 0] : axis === 'y' ? [0, len, 0] : [0, 0, len];
    const rot = axis === 'x' ? [0, 0, -Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0];

    return (
      <group key={axis}>
        <mesh position={headPos} rotation={rot}>
          <coneGeometry args={[arrowHeadRad, arrowHeadLen, 12]} />
          <meshBasicMaterial color={color} depthTest={false} transparent opacity={0.95} />
        </mesh>

        <mesh position={axis === 'x' ? [len / 2, 0, 0] : axis === 'y' ? [0, len / 2, 0] : [0, 0, len / 2]} rotation={rot}>
          <cylinderGeometry args={[shaftRad, shaftRad, len, 8]} />
          <meshBasicMaterial color={color} depthTest={false} transparent opacity={0.9} />
        </mesh>

        <mesh
          position={axis === 'x' ? [len * 0.6, 0, 0] : axis === 'y' ? [0, len * 0.6, 0] : [0, 0, len * 0.6]}
          onPointerDown={(e) => handlePointerDown(e, axis)}
          onPointerOver={(e) => { e.stopPropagation(); setHoveredAxis(axis); gl.domElement.style.cursor = 'grab'; }}
          onPointerOut={(e) => { e.stopPropagation(); setHoveredAxis(null); if (!dragging) gl.domElement.style.cursor = 'auto'; }}
        >
          <cylinderGeometry args={[hitAreaRadius, hitAreaRadius, len, 8]} />
          <meshBasicMaterial visible={false} />
        </mesh>

        {isActive && (
          <mesh position={axis === 'x' ? [len + arrowHeadLen, 0, 0] : axis === 'y' ? [0, len + arrowHeadLen, 0] : [0, 0, len + arrowHeadLen]}>
            <sphereGeometry args={[arrowHeadRad * 1.5, 12, 12]} />
            <meshBasicMaterial color={color} depthTest={false} />
          </mesh>
        )}
      </group>
    );
  };

  const renderRotateAxis = (axis) => {
    const isActive = dragAxis === axis;
    const isHovered = hoveredAxis === axis;
    const color = isActive ? AXIS_HOVER_COLORS[axis] : isHovered ? AXIS_HOVER_COLORS[axis] : AXIS_COLORS[axis];
    const rot = axis === 'x' ? [0, Math.PI / 2, 0] : axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0];

    return (
      <group key={axis}>
        <mesh
          rotation={rot}
          onPointerDown={(e) => handlePointerDown(e, axis)}
          onPointerOver={(e) => { e.stopPropagation(); setHoveredAxis(axis); gl.domElement.style.cursor = 'grab'; }}
          onPointerOut={(e) => { e.stopPropagation(); setHoveredAxis(null); if (!dragging) gl.domElement.style.cursor = 'auto'; }}
        >
          <torusGeometry args={[ringRadius, isActive ? ringTube * 2 : ringTube, 16, 64]} />
          <meshBasicMaterial color={color} depthTest={false} transparent opacity={isActive ? 1 : 0.8} />
        </mesh>

        {isActive && (
          <mesh rotation={rot}>
            <torusGeometry args={[ringRadius, ringTube * 3, 16, 64]} />
            <meshBasicMaterial color={color} depthTest={false} transparent opacity={0.3} />
          </mesh>
        )}
      </group>
    );
  };

  const renderScaleAxis = (axis) => {
    const isActive = dragAxis === axis;
    const isHovered = hoveredAxis === axis;
    const color = isActive ? AXIS_HOVER_COLORS[axis] : isHovered ? AXIS_HOVER_COLORS[axis] : AXIS_COLORS[axis];
    const len = 2.5 * gizmoScale;
    const boxPos = axis === 'x' ? [len, 0, 0] : axis === 'y' ? [0, len, 0] : [0, 0, len];
    const rot = axis === 'x' ? [0, 0, -Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0];

    return (
      <group key={axis}>
        <mesh position={boxPos}>
          <boxGeometry args={[scaleBoxSize, scaleBoxSize, scaleBoxSize]} />
          <meshBasicMaterial color={color} depthTest={false} />
        </mesh>

        <mesh position={axis === 'x' ? [len / 2, 0, 0] : axis === 'y' ? [0, len / 2, 0] : [0, 0, len / 2]} rotation={rot}>
          <cylinderGeometry args={[shaftRad, shaftRad, len, 8]} />
          <meshBasicMaterial color={color} depthTest={false} transparent opacity={0.8} />
        </mesh>

        <mesh
          position={boxPos}
          onPointerDown={(e) => handlePointerDown(e, axis)}
          onPointerOver={(e) => { e.stopPropagation(); setHoveredAxis(axis); gl.domElement.style.cursor = 'grab'; }}
          onPointerOut={(e) => { e.stopPropagation(); setHoveredAxis(null); if (!dragging) gl.domElement.style.cursor = 'auto'; }}
        >
          <boxGeometry args={[scaleBoxSize * 2, scaleBoxSize * 2, scaleBoxSize * 2]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </group>
    );
  };

  const renderDragLine = () => {
    if (!dragging || !dragAxis) return null;
    const ds = dragState.current;
    const axisDir = AXIS_VEC[dragAxis];
    const endPos = ds.gizmoOrigin.clone().add(axisDir.clone().multiplyScalar(ds.lastDelta || 0));

    return (
      <group>
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                ds.gizmoOrigin.x, ds.gizmoOrigin.y, ds.gizmoOrigin.z,
                endPos.x, endPos.y, endPos.z,
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#ffffff" linewidth={2} depthTest={false} />
        </line>

        <mesh position={endPos}>
          <sphereGeometry args={[0.08 * gizmoScale, 12, 12]} />
          <meshBasicMaterial color="#ffffff" depthTest={false} />
        </mesh>
      </group>
    );
  };

  const renderValueLabel = () => {
    if (!dragging || !dragAxis) return null;
    const ds = dragState.current;
    let label = '';
    if (ds.mode === 'translate') {
      label = `${dragAxis.toUpperCase()}: ${dragValue.toFixed(2)}`;
    } else if (ds.mode === 'rotate') {
      label = `${dragAxis.toUpperCase()}: ${dragValue.toFixed(1)}°`;
    } else {
      label = `${dragAxis.toUpperCase()}: x${dragValue.toFixed(2)}`;
    }

    const pos = ds.gizmoOrigin.clone().add(AXIS_VEC[dragAxis].clone().multiplyScalar((ds.lastDelta || 0) + 0.5 * gizmoScale));

    return (
      <Html position={pos.toArray()} center>
        <div style={{
          background: 'rgba(0,0,0,0.85)',
          color: '#fff',
          padding: '3px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
          border: `1px solid ${AXIS_COLORS[dragAxis]}`,
        }}>
          {label}
        </div>
      </Html>
    );
  };

  return (
    <group position={gizmoCenter.toArray()}>
      {mode === 'translate' && ['x', 'y', 'z'].map(renderTranslateAxis)}
      {mode === 'rotate' && ['x', 'y', 'z'].map(renderRotateAxis)}
      {mode === 'scale' && ['x', 'y', 'z'].map(renderScaleAxis)}
      {renderDragLine()}
      {renderValueLabel()}
    </group>
  );
};

export default TransformGizmo;
