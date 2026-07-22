/**
 * Vision3D - Export Engine
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import * as THREE from 'three'
import { createGeometry } from '../utils/geometry'
import { log } from '../utils/logger'

interface ShapeData {
  type: string
  visible: boolean
  color?: string
  metalness?: number
  roughness?: number
  opacity?: number
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  _csgGeometry?: THREE.BufferGeometry
  [key: string]: unknown
}

interface ExportOptions {
  format: 'stl' | 'obj' | 'gltf' | 'glb'
  includeHidden?: boolean
}

function createMesh(shape: ShapeData): THREE.Mesh {
  let geometry: THREE.BufferGeometry
  if (shape.type === 'csg_result' && shape._csgGeometry) {
    geometry = shape._csgGeometry.clone()
    if (geometry.index) {
      geometry = geometry.toNonIndexed()
    }
  } else {
    geometry = createGeometry(shape)
  }
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(shape.color),
    metalness: shape.metalness ?? 0.1,
    roughness: shape.roughness ?? 0.7,
    transparent: (shape.opacity ?? 1) < 1,
    opacity: shape.opacity ?? 1,
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(...shape.position)
  mesh.rotation.set(...shape.rotation)
  mesh.scale.set(...shape.scale)

  return mesh
}

export async function exportSTL(shapes: ShapeData[], options: ExportOptions): Promise<Blob> {
  log('exportSTL:', shapes.length, 'shapes')
  const visibleShapes = options.includeHidden
    ? shapes
    : shapes.filter((s) => s.visible && s.type !== 'group')

  const scene = new THREE.Scene()
  visibleShapes.forEach((shape) => {
    const mesh = createMesh(shape)
    scene.add(mesh)
  })

  const { STLExporter } = await import('three/addons/exporters/STLExporter.js')
  const exporter = new STLExporter()
  const result = exporter.parse(scene, { binary: true })

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose()
      child.material.dispose()
    }
  })

  return new Blob([result], { type: 'application/octet-stream' })
}

export async function exportOBJ(shapes: ShapeData[], options: ExportOptions): Promise<Blob> {
  log('exportOBJ:', shapes.length, 'shapes')
  const visibleShapes = options.includeHidden
    ? shapes
    : shapes.filter((s) => s.visible && s.type !== 'group')

  const scene = new THREE.Scene()
  visibleShapes.forEach((shape) => {
    const mesh = createMesh(shape)
    scene.add(mesh)
  })

  const { OBJExporter } = await import('three/addons/exporters/OBJExporter.js')
  const exporter = new OBJExporter()
  const result = exporter.parse(scene)

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose()
      child.material.dispose()
    }
  })

  return new Blob([result], { type: 'text/plain' })
}

export async function exportGLTF(shapes: ShapeData[], options: ExportOptions): Promise<Blob> {
  log('exportGLTF:', shapes.length, 'shapes')
  const visibleShapes = options.includeHidden
    ? shapes
    : shapes.filter((s) => s.visible && s.type !== 'group')

  const scene = new THREE.Scene()
  visibleShapes.forEach((shape) => {
    const mesh = createMesh(shape)
    scene.add(mesh)
  })

  const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js')
  const exporter = new GLTFExporter()

  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result: object) => {
        const output = JSON.stringify(result)
        resolve(new Blob([output], { type: 'application/json' }))
      },
      (error: unknown) => reject(error),
      { binary: false }
    )
  })
}

export async function exportGLB(shapes: ShapeData[], options: ExportOptions): Promise<Blob> {
  log('exportGLB:', shapes.length, 'shapes')
  const visibleShapes = options.includeHidden
    ? shapes
    : shapes.filter((s) => s.visible && s.type !== 'group')

  const scene = new THREE.Scene()
  visibleShapes.forEach((shape) => {
    const mesh = createMesh(shape)
    scene.add(mesh)
  })

  const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js')
  const exporter = new GLTFExporter()

  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result: ArrayBuffer) => {
        resolve(new Blob([result], { type: 'application/octet-stream' }))
      },
      (error: unknown) => reject(error),
      { binary: true }
    )
  })
}

export async function exportShapes(shapes: ShapeData[], options: ExportOptions): Promise<Blob> {
  log('exportShapes: format=' + options.format + ', shapes=' + shapes.length)
  switch (options.format) {
    case 'stl':
      return exportSTL(shapes, options)
    case 'obj':
      return exportOBJ(shapes, options)
    case 'gltf':
      return exportGLTF(shapes, options)
    case 'glb':
      return exportGLB(shapes, options)
    default:
      throw new Error(`Unsupported export format: ${options.format}`)
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  log('downloadBlob:', filename, '(' + blob.size + ' bytes)')
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function importSTL(file: File): Promise<THREE.BufferGeometry> {
  log('importSTL:', file.name, '(' + file.size + ' bytes)')
  const { STLLoader } = await import('three/addons/loaders/STLLoader.js')
  const loader = new STLLoader()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        const result = loader.parse(event.target?.result as ArrayBuffer)
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

export async function importOBJ(file: File): Promise<THREE.Group> {
  log('importOBJ:', file.name, '(' + file.size + ' bytes)')
  const { OBJLoader } = await import('three/addons/loaders/OBJLoader.js')
  const loader = new OBJLoader()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        const result = loader.parse(event.target?.result as string)
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
