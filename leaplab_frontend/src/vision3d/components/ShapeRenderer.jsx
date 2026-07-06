/**
 * Vision3D - Shape Renderer Component
 * Renders shape meshes, handles hover cursor, tags meshes for raycasting.
 * All drag/click handled by ShapeInteraction (DOM capture).
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { createGeometry } from '../utils/helpers';
import { use3DStore } from '../store/use3DStore';

const setShapeIdRef = (id) => (mesh) => {
  if (mesh) mesh.userData.shapeId = id;
};

export const ShapeRenderer = ({ shape }) => {
  const selectedIds = use3DStore((s) => s.selectedIds);
  const editMode = use3DStore((s) => s.editMode);
  const editShapeId = use3DStore((s) => s.editShapeId);
  const isSelected = selectedIds.includes(shape.id);
  const isEdited = editMode !== 'object' && editShapeId === shape.id;

  const geometry = useMemo(() => {
    if (shape._csgGeometry) return shape._csgGeometry;
    if (shape._customGeometry) return shape._customGeometry;
    return createGeometry(shape);
  }, [
    shape._customGeometry, shape._csgGeometry,
    shape.type, shape.width, shape.height, shape.depth, shape.cornerRadius,
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

  // During edit mode, MeshEditor handles geometry directly via refs.
  // Skip applying geometry prop to avoid R3F overwriting MeshEditor's changes.
  const effectiveGeometry = isEdited ? undefined : geometry;

  const material = useMemo(() => {
    const isHole = shape.isHole;
    const color = isHole ? '#888888' : shape.color;
    const isCSG = shape.type === 'csg_result' || !!shape._csgGeometry;
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      metalness: shape.metalness ?? 0.1,
      roughness: shape.roughness ?? 0.7,
      transparent: isHole || (shape.opacity ?? 1) < 1,
      opacity: isHole ? 0.4 : (shape.opacity ?? 1),
      side: isCSG ? THREE.DoubleSide : THREE.FrontSide,
      wireframe: isHole,
    });
  }, [shape.color, shape.isHole, shape.metalness, shape.roughness, shape.opacity, shape.type, shape._csgGeometry]);

  // Don't dispose geometry during edit mode — MeshEditor manages it via refs
  useEffect(() => () => {
    if (!isEdited) { geometry.dispose(); material.dispose(); }
  }, [geometry, material, isEdited]);

  if (!shape.visible) return null;

  return (
    <mesh
      ref={setShapeIdRef(shape.id)}
      geometry={effectiveGeometry}
      material={material}
      position={shape.position}
      rotation={shape.rotation}
      scale={shape.scale}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = 'auto'; }}
      castShadow
      receiveShadow
    >
      {isSelected && !isEdited && (
        <mesh scale={[1.02, 1.02, 1.02]} geometry={effectiveGeometry}>
          <meshBasicMaterial color="#6366f1" wireframe transparent opacity={0.5} />
        </mesh>
      )}
    </mesh>
  );
};
