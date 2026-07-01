/**
 * Vision3D - Export Engine
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import * as THREE from 'three';
import { Shape3D, ExportOptions } from '../types';
import { createGeometry } from '../utils/helpers';
import * as log from '../utils/logger';

/**
 * Create a Three.js mesh from shape data
 */
function createMesh(shape: Shape3D): THREE.Mesh {
  const geometry = createGeometry(shape);
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
export async function exportSTL(shapes: Shape3D[], options: ExportOptions): Promise<Blob> {
  const visibleShapes = options.includeHidden
    ? shapes
    : shapes.filter((s) => s.visible && s.type !== 'group');

  const scene = new THREE.Scene();
  visibleShapes.forEach((shape) => {
    const mesh = createMesh(shape);
    scene.add(mesh);
  });

  // Use Three.js STLExporter
  const { STLExporter } = await import('three/addons/exporters/STLExporter.js');
  const exporter = new STLExporter();
  const result = exporter.parse(scene, { binary: true });

  // Cleanup
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
    }
  });

  return new Blob([result], { type: 'application/octet-stream' });
}

/**
 * Export shapes as OBJ
 */
export async function exportOBJ(shapes: Shape3D[], options: ExportOptions): Promise<Blob> {
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

  // Cleanup
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
    }
  });

  return new Blob([result], { type: 'text/plain' });
}

/**
 * Export shapes as GLTF
 */
export async function exportGLTF(shapes: Shape3D[], options: ExportOptions): Promise<Blob> {
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
export async function exportGLB(shapes: Shape3D[], options: ExportOptions): Promise<Blob> {
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
        resolve(new Blob([result as ArrayBuffer], { type: 'application/octet-stream' }));
      },
      (error) => reject(error),
      { binary: true }
    );
  });
}

/**
 * Export shapes based on format
 */
export async function exportShapes(
  shapes: Shape3D[],
  options: ExportOptions
): Promise<Blob> {
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
export function downloadBlob(blob: Blob, filename: string): void {
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
export async function importSTL(file: File): Promise<THREE.BufferGeometry> {
  const { STLLoader } = await import('three/addons/loaders/STLLoader.js');
  const loader = new STLLoader();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = loader.parse(event.target?.result as ArrayBuffer);
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
export async function importOBJ(file: File): Promise<THREE.Group> {
  const { OBJLoader } = await import('three/addons/loaders/OBJLoader.js');
  const loader = new OBJLoader();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = loader.parse(event.target?.result as string);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
