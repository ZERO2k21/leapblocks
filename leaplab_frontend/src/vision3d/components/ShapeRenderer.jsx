/**
 * Vision3D - Shape Renderer Component
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React, { useRef, useMemo, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import { TransformControls } from '@react-three/drei';
import { createGeometry } from '../utils/helpers';
import { use3DStore } from '../store/use3DStore';
import { debug } from '../utils/logger';

export const ShapeRenderer = ({ shape }) => {
  const meshRef = useRef(null);
  const selectedIds = use3DStore((s) => s.selectedIds);
  const selectShape = use3DStore((s) => s.selectShape);
  const activeTool = use3DStore((s) => s.activeTool);
  const updateShape = use3DStore((s) => s.updateShape);
  const pushHistory = use3DStore((s) => s.pushHistory);
  const rotationSnap = use3DStore((s) => s.rotationSnap);
  const [shiftHeld, setShiftHeld] = useState(false);
  const [altHeld, setAltHeld] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Shift') setShiftHeld(true);
      if (e.key === 'Alt') setAltHeld(true);
    };
    const onKeyUp = (e) => {
      if (e.key === 'Shift') setShiftHeld(false);
      if (e.key === 'Alt') setAltHeld(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const isSelected = selectedIds.includes(shape.id);
  const isTransforming = isSelected && selectedIds.length === 1;

  const geometry = useMemo(() => {
    // CSG result shapes store their geometry directly
    if (shape._csgGeometry) {
      return shape._csgGeometry;
    }
    // Imported shapes with custom geometry
    if (shape._customGeometry) {
      return shape._customGeometry;
    }
    return createGeometry(shape);
  }, [
    shape.type,
    shape.width,
    shape.height,
    shape.depth,
    shape.radiusTop,
    shape.radiusBottom,
    shape.cylinderHeight,
    shape.radialSegments,
    shape.radius,
    shape.widthSegments,
    shape.heightSegments,
    shape.coneRadius,
    shape.coneHeight,
    shape.torusRadius,
    shape.tubeRadius,
    shape.torusRadialSegments,
    shape.torusTubularSegments,
    shape.innerRadius,
    shape.outerRadius,
    shape.roofWidth,
    shape.roofDepth,
    shape.roofHeight,
    shape.roundRoofWidth,
    shape.roundRoofDepth,
    shape.roundRoofHeight,
    shape.wedgeWidth,
    shape.wedgeDepth,
    shape.wedgeHeight,
    shape.pyramidRadius,
    shape.pyramidHeight,
    shape.pyramidSides,
    shape.halfSphereRadius,
    shape.halfSphereSegments,
    shape.paraboloidRadius,
    shape.paraboloidHeight,
    shape.paraboloidSegments,
    shape.tubeOuterRadius,
    shape.tubeInnerRadius,
    shape.tubeHeight,
    shape.tubeRadialSegments,
    shape.starOuterRadius,
    shape.starInnerRadius,
    shape.starPoints,
    shape.starHeight,
    shape.heartSize,
    shape.heartDepth,
    shape.polygonRadius,
    shape.polygonSides,
    shape.polygonHeight,
  ]);

  const material = useMemo(() => {
    const color = shape.isHole ? '#888888' : shape.color;
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      metalness: shape.metalness ?? 0.1,
      roughness: shape.roughness ?? 0.7,
      transparent: (shape.opacity ?? 1) < 1,
      opacity: shape.opacity ?? 1,
      wireframe: false,
    });
  }, [shape.color, shape.isHole, shape.metalness, shape.roughness, shape.opacity]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  const handleTransformStart = useCallback(() => {
    pushHistory();
  }, [pushHistory]);

  const handleObjectChange = useCallback(() => {
    if (!meshRef.current) return;
    const obj = meshRef.current;
    const position = [obj.position.x, obj.position.y, obj.position.z];
    const rotation = [obj.rotation.x, obj.rotation.y, obj.rotation.z];
    const scale = [obj.scale.x, obj.scale.y, obj.scale.z];
    updateShape(shape.id, { position, rotation, scale });
  }, [shape.id, updateShape]);

  const getTransformMode = useCallback(() => {
    switch (activeTool) {
      case 'move': return 'translate';
      case 'rotate': return 'rotate';
      case 'scale': return 'scale';
      case 'select': return 'translate';
      default: return 'translate';
    }
  }, [activeTool]);

  if (!shape.visible) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    debug('ShapeRenderer: click id=' + shape.id + ' type=' + shape.type);
    if (activeTool === 'select') {
      selectShape(shape.id, e.shiftKey);
    }
  };

  const mesh = (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'auto';
      }}
      castShadow
      receiveShadow
    >
      {isSelected && (
        <mesh scale={[1.02, 1.02, 1.02]}>
          <primitive object={geometry.clone()} attach="geometry" />
          <meshBasicMaterial
            color="#6366f1"
            wireframe
            transparent
            opacity={0.5}
          />
        </mesh>
      )}
    </mesh>
  );

  if (isTransforming) {
    return (
      <TransformControls
        mode={getTransformMode()}
        position={shape.position}
        rotation={shape.rotation}
        scale={shape.scale}
        onObjectChange={handleObjectChange}
        onDraggingChanged={handleTransformStart}
        size={0.7}
        rotationSnap={activeTool === 'rotate' && shiftHeld ? (rotationSnap * Math.PI) / 180 : null}
        scaleSnap={activeTool === 'scale' && shiftHeld ? 0.25 : null}
        space="world"
      >
        {mesh}
      </TransformControls>
    );
  }

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={shape.position}
      rotation={shape.rotation}
      scale={shape.scale}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'auto';
      }}
      castShadow
      receiveShadow
    >
      {isSelected && (
        <mesh scale={[1.02, 1.02, 1.02]}>
          <primitive object={geometry.clone()} attach="geometry" />
          <meshBasicMaterial
            color="#6366f1"
            wireframe
            transparent
            opacity={0.5}
          />
        </mesh>
      )}
    </mesh>
  );
};
