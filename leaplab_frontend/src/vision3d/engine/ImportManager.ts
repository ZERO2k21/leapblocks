/**
 * Vision3D - Import Manager (STL/OBJ)
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import * as THREE from 'three'
import { log, error } from '../utils/logger'

interface ImportResult {
  type: 'stl' | 'obj' | 'gltf' | 'glb'
  name: string
  geometry: THREE.BufferGeometry
  color: string
}

let STLLoader: new () => { parse(buffer: ArrayBuffer): THREE.BufferGeometry } | null = null
let OBJLoader: new () => { parse(text: string): THREE.Group } | null = null
let GLTFLoader: any = null

async function loadSTLLoader() {
  if (!STLLoader) {
    const module = await import('three/addons/loaders/STLLoader.js')
    STLLoader = module.STLLoader
  }
  return STLLoader
}

async function loadOBJLoader() {
  if (!OBJLoader) {
    const module = await import('three/addons/loaders/OBJLoader.js')
    OBJLoader = module.OBJLoader
  }
  return OBJLoader
}

async function loadGLTFLoader() {
  if (!GLTFLoader) {
    const module = await import('three/addons/loaders/GLTFLoader.js')
    GLTFLoader = module.GLTFLoader
  }
  return GLTFLoader
}

export async function importSTL(file: File): Promise<ImportResult | null> {
  try {
    const LoaderClass = await loadSTLLoader()
    const loader = new LoaderClass()
    const buffer = await file.arrayBuffer()
    const geometry = loader.parse(buffer)
    geometry.computeVertexNormals()
    geometry.center()

    log(
      'STL imported:',
      file.name,
      'triangles:',
      geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3
    )
    return {
      type: 'stl',
      name: file.name.replace(/\.stl$/i, ''),
      geometry,
      color: '#4F46E5',
    }
  } catch (err) {
    error('Failed to import STL:', err)
    return null
  }
}

export async function importOBJ(file: File): Promise<ImportResult | null> {
  try {
    const LoaderClass = await loadOBJLoader()
    const loader = new LoaderClass()
    const text = await file.text()
    const object = loader.parse(text)

    const geometries: THREE.BufferGeometry[] = []
    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.geometry.computeVertexNormals()
        mesh.geometry.center()
        geometries.push(mesh.geometry)
      }
    })

    if (geometries.length === 0) {
      error('OBJ: no meshes found')
      return null
    }

    if (geometries.length > 1) {
      const { mergeBufferGeometries } = await import(
        'three/addons/utils/BufferGeometryUtils.js'
      )
      const merged = mergeBufferGeometries(geometries, false)
      geometries.forEach((g) => g.dispose())
      log('OBJ imported:', file.name, '(merged', geometries.length, 'meshes)')
      return {
        type: 'obj',
        name: file.name.replace(/\.obj$/i, ''),
        geometry: merged,
        color: '#4F46E5',
      }
    }

    log('OBJ imported:', file.name)
    return {
      type: 'obj',
      name: file.name.replace(/\.obj$/i, ''),
      geometry: geometries[0],
      color: '#4F46E5',
    }
  } catch (err) {
    error('Failed to import OBJ:', err)
    return null
  }
}

export async function importGLTF(file: File): Promise<ImportResult | null> {
  try {
    const LoaderClass = await loadGLTFLoader()
    const loader = new LoaderClass()
    const buffer = await file.arrayBuffer()

    return new Promise((resolve) => {
      loader.parse(
        buffer,
        '',
        async (gltf: { scene: THREE.Group }) => {
          const geometries: THREE.BufferGeometry[] = []
          gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh
              mesh.geometry.computeVertexNormals()
              mesh.geometry.center()
              geometries.push(mesh.geometry)
            }
          })

          if (geometries.length === 0) {
            error('GLTF: no meshes found')
            resolve(null)
            return
          }

          let mergedGeo: THREE.BufferGeometry
          if (geometries.length > 1) {
            const { mergeBufferGeometries } = await import(
              'three/addons/utils/BufferGeometryUtils.js'
            )
            mergedGeo = mergeBufferGeometries(geometries, false) as THREE.BufferGeometry
            geometries.forEach((g) => g.dispose())
            log('GLTF imported:', file.name, '(merged', geometries.length, 'meshes)')
          } else {
            mergedGeo = geometries[0]
          }

          const isGLB = /\.glb$/i.test(file.name)
          resolve({
            type: isGLB ? 'glb' : 'gltf',
            name: file.name.replace(/\.(gltf|glb)$/i, ''),
            geometry: mergedGeo,
            color: '#4F46E5',
          })
        },
        (err: unknown) => {
          error('Failed to import GLTF:', err)
          resolve(null)
        }
      )
    })
  } catch (err) {
    error('Failed to import GLTF:', err)
    return null
  }
}

export function isImportableFile(filename: string): boolean {
  return /\.(stl|obj|gltf|glb)$/i.test(filename)
}

export function getFileType(filename: string): 'stl' | 'obj' | 'gltf' | 'glb' | null {
  if (/\.stl$/i.test(filename)) return 'stl'
  if (/\.obj$/i.test(filename)) return 'obj'
  if (/\.gltf$/i.test(filename)) return 'gltf'
  if (/\.glb$/i.test(filename)) return 'glb'
  return null
}
