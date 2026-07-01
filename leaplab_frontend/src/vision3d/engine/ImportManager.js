/**
 * Vision3D - Import Manager (STL/OBJ)
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import { log, error } from '../utils/logger';

let STLLoader = null;
let OBJLoader = null;

async function loadSTLLoader() {
  if (!STLLoader) {
    const module = await import('three/addons/loaders/STLLoader.js');
    STLLoader = module.STLLoader;
  }
  return STLLoader;
}

async function loadOBJLoader() {
  if (!OBJLoader) {
    const module = await import('three/addons/loaders/OBJLoader.js');
    OBJLoader = module.OBJLoader;
  }
  return OBJLoader;
}

export async function importSTL(file) {
  try {
    const LoaderClass = await loadSTLLoader();
    const loader = new LoaderClass();
    const buffer = await file.arrayBuffer();
    const geometry = loader.parse(buffer);
    geometry.computeVertexNormals();
    geometry.center();

    log('STL imported:', file.name, 'triangles:', geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3);
    return {
      type: 'stl',
      name: file.name.replace(/\.stl$/i, ''),
      geometry,
      color: '#4F46E5',
    };
  } catch (err) {
    error('Failed to import STL:', err);
    return null;
  }
}

export async function importOBJ(file) {
  try {
    const LoaderClass = await loadOBJLoader();
    const loader = new LoaderClass();
    const text = await file.text();
    const object = loader.parse(text);

    const geometries = [];
    object.traverse((child) => {
      if (child.isMesh) {
        child.geometry.computeVertexNormals();
        child.geometry.center();
        geometries.push(child.geometry);
      }
    });

    if (geometries.length === 0) {
      error('OBJ: no meshes found');
      return null;
    }

    // Merge all geometries into one
    if (geometries.length > 1) {
      const { mergeBufferGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
      const merged = mergeBufferGeometries(geometries, false);
      geometries.forEach((g) => g.dispose());
      log('OBJ imported:', file.name, '(merged', geometries.length, 'meshes)');
      return {
        type: 'obj',
        name: file.name.replace(/\.obj$/i, ''),
        geometry: merged,
        color: '#4F46E5',
      };
    }

    log('OBJ imported:', file.name);
    return {
      type: 'obj',
      name: file.name.replace(/\.obj$/i, ''),
      geometry: geometries[0],
      color: '#4F46E5',
    };
  } catch (err) {
    error('Failed to import OBJ:', err);
    return null;
  }
}

export function isImportableFile(filename) {
  return /\.(stl|obj)$/i.test(filename);
}

export function getFileType(filename) {
  if (/\.stl$/i.test(filename)) return 'stl';
  if (/\.obj$/i.test(filename)) return 'obj';
  return null;
}
