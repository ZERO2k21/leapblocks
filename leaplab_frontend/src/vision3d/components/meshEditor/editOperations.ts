import * as THREE from 'three'
import { getDirectSelection, getConnectedVertices, applyProportionalFalloff } from './geometryUtils'

const _vA = new THREE.Vector3()
const _vB = new THREE.Vector3()
const _vC = new THREE.Vector3()
const _normal = new THREE.Vector3()
const _faceCenter = new THREE.Vector3()

interface ComponentSelection {
  shapeId: string
  index: number
}

interface ApplyEditToolParams {
  geoRef: React.MutableRefObject<THREE.BufferGeometry | null>
  meshRef: React.MutableRefObject<THREE.Mesh | null>
  editShapeIdRef: React.MutableRefObject<string | null>
  selectedFaces: ComponentSelection[]
  selectedVertices: ComponentSelection[]
  cacheGeometry: (shapeId: string, geo: THREE.BufferGeometry) => void
  applyGeometryEdit: (shapeId: string, geo: THREE.BufferGeometry) => void
  clearComponentSelection: () => void
}

export function applyEditTool(tool: string, {
  geoRef, meshRef, editShapeIdRef,
  selectedFaces, selectedVertices,
  cacheGeometry, applyGeometryEdit, clearComponentSelection,
}: ApplyEditToolParams): void {
  const geo = geoRef.current
  const mesh = meshRef.current
  if (!geo || !mesh || !editShapeIdRef.current) return
  const shapeId = editShapeIdRef.current

  const commitToolResult = (newGeo: THREE.BufferGeometry) => {
    newGeo.computeVertexNormals()
    mesh.geometry = newGeo
    geoRef.current = newGeo
    cacheGeometry(shapeId, newGeo)
    applyGeometryEdit(shapeId, newGeo)
  }

  if (tool === 'extrude' && selectedFaces.length > 0) {
    const newGeo = geo.clone()
    const pos = newGeo.attributes.position as THREE.BufferAttribute
    const idx = newGeo.index

    for (const sel of selectedFaces) {
      if (sel.shapeId !== shapeId) continue
      const faceIdx = sel.index

      let a: number, b: number, c: number
      if (idx) {
        a = idx.getX(faceIdx * 3)
        b = idx.getX(faceIdx * 3 + 1)
        c = idx.getX(faceIdx * 3 + 2)
      } else {
        a = faceIdx * 3
        b = faceIdx * 3 + 1
        c = faceIdx * 3 + 2
      }

      _vA.fromBufferAttribute(pos, a)
      _vB.fromBufferAttribute(pos, b)
      _vC.fromBufferAttribute(pos, c)
      _normal.crossVectors(_vB.sub(_vA), _vC.sub(_vA)).normalize()

      const newCount = pos.count
      const arr = pos.array as Float32Array
      const newArr = new Float32Array(arr.length + 9)
      newArr.set(arr)
      newArr[arr.length] = arr[a * 3]; newArr[arr.length + 1] = arr[a * 3 + 1]; newArr[arr.length + 2] = arr[a * 3 + 2]
      newArr[arr.length + 3] = arr[b * 3]; newArr[arr.length + 4] = arr[b * 3 + 1]; newArr[arr.length + 5] = arr[b * 3 + 2]
      newArr[arr.length + 6] = arr[c * 3]; newArr[arr.length + 7] = arr[c * 3 + 1]; newArr[arr.length + 8] = arr[c * 3 + 2]

      pos.array = newArr
      pos.count = pos.count + 3
      pos.needsUpdate = true

      const extrudeDist = 1.0
      for (const vi of [a, b, c]) {
        pos.array[vi * 3] += _normal.x * extrudeDist
        pos.array[vi * 3 + 1] += _normal.y * extrudeDist
        pos.array[vi * 3 + 2] += _normal.z * extrudeDist
      }

      if (idx) {
        const newIdx = new Uint32Array(idx.count + 3)
        newIdx.set(idx.array)
        newIdx[idx.count] = newCount
        newIdx[idx.count + 1] = newCount + 1
        newIdx[idx.count + 2] = newCount + 2
        newGeo.index = new THREE.BufferAttribute(newIdx, 1)
      }
    }

    commitToolResult(newGeo)
  }

  if (tool === 'inset' && selectedFaces.length > 0) {
    const newGeo = geo.clone()
    const pos = newGeo.attributes.position as THREE.BufferAttribute

    for (const sel of selectedFaces) {
      if (sel.shapeId !== shapeId) continue
      const faceIdx = sel.index

      let a: number, b: number, c: number
      if (newGeo.index) {
        a = newGeo.index.getX(faceIdx * 3)
        b = newGeo.index.getX(faceIdx * 3 + 1)
        c = newGeo.index.getX(faceIdx * 3 + 2)
      } else {
        a = faceIdx * 3
        b = faceIdx * 3 + 1
        c = faceIdx * 3 + 2
      }

      _vA.fromBufferAttribute(pos, a)
      _vB.fromBufferAttribute(pos, b)
      _vC.fromBufferAttribute(pos, c)
      _faceCenter.copy(_vA).add(_vB).add(_vC).divideScalar(3)

      const insetFactor = 0.6
      _vA.lerp(_faceCenter, 1 - insetFactor)
      _vB.lerp(_faceCenter, 1 - insetFactor)
      _vC.lerp(_faceCenter, 1 - insetFactor)

      pos.array[a * 3] = _vA.x; pos.array[a * 3 + 1] = _vA.y; pos.array[a * 3 + 2] = _vA.z
      pos.array[b * 3] = _vB.x; pos.array[b * 3 + 1] = _vB.y; pos.array[b * 3 + 2] = _vB.z
      pos.array[c * 3] = _vC.x; pos.array[c * 3 + 1] = _vC.y; pos.array[c * 3 + 2] = _vC.z
    }

    commitToolResult(newGeo)
  }

  if (tool === 'merge' && selectedVertices.length >= 2) {
    const newGeo = geo.clone()
    const pos = newGeo.attributes.position as THREE.BufferAttribute

    _faceCenter.set(0, 0, 0)
    let count = 0
    for (const sel of selectedVertices) {
      if (sel.shapeId !== shapeId) continue
      _vA.fromBufferAttribute(pos, sel.index)
      _faceCenter.add(_vA)
      count++
    }
    if (count > 0) _faceCenter.divideScalar(count)

    for (const sel of selectedVertices) {
      if (sel.shapeId !== shapeId) continue
      pos.array[sel.index * 3] = _faceCenter.x
      pos.array[sel.index * 3 + 1] = _faceCenter.y
      pos.array[sel.index * 3 + 2] = _faceCenter.z
    }

    commitToolResult(newGeo)
    clearComponentSelection()
  }
}
