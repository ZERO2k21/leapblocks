/**
 * Vision3D - Shape Renderer Component
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { createGeometry } from '../utils/helpers';
import { use3DStore } from '../store/use3DStore';
import { debug } from '../utils/logger';

export const ShapeRenderer = ({ shape }) => {
  const meshRef = useRef(null);
  const selectedIds = use3DStore((s) => s.selectedIds);
  const selectShape = use3DStore((s) => s.selectShape);

  const isSelected = selectedIds.includes(shape.id);

  const geometry = useMemo(() => {
    if (shape._csgGeometry) return shape._csgGeometry;
    if (shape._customGeometry) return shape._customGeometry;
    return createGeometry(shape);
  }, [
    shape.type, shape.width, shape.height, shape.depth,
    shape.radiusTop, shape.radiusBottom, shape.cylinderHeight, shape.radialSegments,
    shape.radius, shape.widthSegments, shape.heightSegments,
    shape.coneRadius, shape.coneHeight,
    shape.torusRadius, shape.tubeRadius, shape.torusRadialSegments, shape.torusTubularSegments,
    shape.innerRadius, shape.outerRadius,
    shape.roofWidth, shape.roofDepth, shape.roofHeight,
    shape.roundRoofWidth, shape.roundRoofDepth, shape.roundRoofHeight,
    shape.wedgeWidth, shape.wedgeDepth, shape.wedgeHeight,
    shape.pyramidRadius, shape.pyramidHeight, shape.pyramidSides,
    shape.halfSphereRadius, shape.halfSphereSegments,
    shape.paraboloidRadius, shape.paraboloidHeight, shape.paraboloidSegments,
    shape.tubeOuterRadius, shape.tubeInnerRadius, shape.tubeHeight, shape.tubeRadialSegments,
    shape.starOuterRadius, shape.starInnerRadius, shape.starPoints, shape.starHeight,
    shape.heartSize, shape.heartDepth,
    shape.polygonRadius, shape.polygonSides, shape.polygonHeight,
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

  const wireframeGeometry = useMemo(() => {
    if (!isSelected) return null;
    return geometry;
  }, [isSelected, geometry]);

  if (!shape.visible) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    debug('ShapeRenderer: click id=' + shape.id + ' type=' + shape.type);
    selectShape(shape.id, e.shiftKey);
  };

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
      {isSelected && wireframeGeometry && (
        <mesh scale={[1.02, 1.02, 1.02]} geometry={wireframeGeometry}>
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
