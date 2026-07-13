/**
 * Vision3D - Export Engine
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import * as THREE from 'three';
import { createGeometry } from '../utils/geometry';
import { log } from '../utils/logger';

/**
 * Create a Three.js mesh from shape data
 */
function createMesh(shape) {
  let geometry;
  if (shape.type === 'csg_result' && shape._csgGeometry) {
    // Clone and convert to non-indexed for proper export
    geometry = shape._csgGeometry.clone();
    if (geometry.index) {
      geometry = geometry.toNonIndexed();
    }
  } else {
    geometry = createGeometry(shape);
  }
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(shape.color),
    metalness: shape.metalness ?? 0.1,
    roughness: shape.roughness ?? 0.7,
    transparent: (shape.opacity ?? 1) < 1,
    opacity: shape.opacity ?? 1,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...shape.position);
  mesh.rotation.set(...shape.rotation);
  mesh.scale.set(...shape.scale);

  return mesh;
}

/**
 * Export shapes as STL
 */
export async function exportSTL(shapes, options) {
  log('exportSTL:', shapes.length, 'shapes');
  const visibleShapes = options.includeHidden
    ? shapes
    : shapes.filter((s) => s.visible && s.type !== 'group');

  const scene = new THREE.Scene();
  visibleShapes.forEach((shape) => {
    const mesh = createMesh(shape);
    scene.add(mesh);
  });

  const { STLExporter } = await import('three/addons/exporters/STLExporter.js');
  const exporter = new STLExporter();
  const result = exporter.parse(scene, { binary: true });

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      child.material.dispose();
    }
  });

  return new Blob([result], { type: 'application/octet-stream' });
}

/**
 * Export shapes as OBJ
 */
export async function exportOBJ(shapes, options) {
  log('exportOBJ:', shapes.length, 'shapes');
  const visibleShapes = options.includeHidden
    ? shapes
    : shapes.filter((s) => s.visible && s.type !== 'group');

  const scene = new THREE.Scene();
  visibleShapes.forEach((shape) => {
    const mesh = createMesh(shape);
    scene.add(mesh);
  });

  const { OBJExporter } = await import('three/addons/exporters/OBJExporter.js');
  const exporter = new OBJExporter();
  const result = exporter.parse(scene);

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      child.material.dispose();
    }
  });

  return new Blob([result], { type: 'text/plain' });
}

/**
 * Export shapes as GLTF
 */
export async function exportGLTF(shapes, options) {
  log('exportGLTF:', shapes.length, 'shapes');
  const visibleShapes = options.includeHidden
    ? shapes
    : shapes.filter((s) => s.visible && s.type !== 'group');

  const scene = new THREE.Scene();
  visibleShapes.forEach((shape) => {
    const mesh = createMesh(shape);
    scene.add(mesh);
  });

  const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
  const exporter = new GLTFExporter();

  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => {
        const output = JSON.stringify(result);
        resolve(new Blob([output], { type: 'application/json' }));
      },
      (error) => reject(error),
      { binary: false }
    );
  });
}

/**
 * Export shapes as GLB (binary GLTF)
 */
export async function exportGLB(shapes, options) {
  log('exportGLB:', shapes.length, 'shapes');
  const visibleShapes = options.includeHidden
    ? shapes
    : shapes.filter((s) => s.visible && s.type !== 'group');

  const scene = new THREE.Scene();
  visibleShapes.forEach((shape) => {
    const mesh = createMesh(shape);
    scene.add(mesh);
  });

  const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
  const exporter = new GLTFExporter();

  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => {
        resolve(new Blob([result], { type: 'application/octet-stream' }));
      },
      (error) => reject(error),
      { binary: true }
    );
  });
}

/**
 * Export shapes based on format
 */
export async function exportShapes(shapes, options) {
  log('exportShapes: format=' + options.format + ', shapes=' + shapes.length);
  switch (options.format) {
    case 'stl':
      return exportSTL(shapes, options);
    case 'obj':
      return exportOBJ(shapes, options);
    case 'gltf':
      return exportGLTF(shapes, options);
    case 'glb':
      return exportGLB(shapes, options);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

/**
 * Download exported file
 */
export function downloadBlob(blob, filename) {
  log('downloadBlob:', filename, '(' + blob.size + ' bytes)');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import STL file
 */
export async function importSTL(file) {
  log('importSTL:', file.name, '(' + file.size + ' bytes)');
  const { STLLoader } = await import('three/addons/loaders/STLLoader.js');
  const loader = new STLLoader();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = loader.parse(event.target?.result);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Import OBJ file
 */
export async function importOBJ(file) {
  log('importOBJ:', file.name, '(' + file.size + ' bytes)');
  const { OBJLoader } = await import('three/addons/loaders/OBJLoader.js');
  const loader = new OBJLoader();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = loader.parse(event.target?.result);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
