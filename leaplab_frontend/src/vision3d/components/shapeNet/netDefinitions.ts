import * as THREE from 'three'

interface NetFaceTransform {
  pos: [number, number, number]
  rot: [number, number, number]
}

interface NetFace {
  id: string
  geo: THREE.PlaneGeometry | THREE.ShapeGeometry | THREE.SphereGeometry
  color: string
  flat: NetFaceTransform
  folded: NetFaceTransform
}

interface NetDefinition {
  flat: NetFace[]
  tube?: { radius: number; height: number; color?: string }
  cone?: { radius: number; height: number; color?: string }
  pyramid?: { base: number; height: number; color?: string }
}

export const getFaceShades = (baseColorHex?: string, count: number = 6): string[] => {
  const hex = baseColorHex || '#6366f1'
  const base = new THREE.Color(hex)
  const hsl = { h: 0, s: 0, l: 0 }
  base.getHSL(hsl)

  const shades: string[] = []
  const step = 0.05
  const startOffset = -((count - 1) / 2) * step

  for (let i = 0; i < count; i++) {
    const l = Math.min(0.92, Math.max(0.08, hsl.l + startOffset + i * step))
    const c = new THREE.Color().setHSL(hsl.h, hsl.s, l)
    shades.push('#' + c.getHexString())
  }
  return shades
}

const createBoxNet = (w: number, h: number, d: number, color?: string): NetFace[] => {
  const shades = getFaceShades(color, 6)
  return [
    {
      id: "Bottom", geo: new THREE.PlaneGeometry(w, d), color: shades[0],
      flat: { pos: [0, 0, 0], rot: [-Math.PI / 2, 0, 0] }, folded: { pos: [0, 0, 0], rot: [-Math.PI / 2, 0, 0] },
    },
    {
      id: "Front", geo: new THREE.PlaneGeometry(w, h), color: shades[1],
      flat: { pos: [0, 0, -d / 2 - h / 2], rot: [-Math.PI / 2, 0, 0] }, folded: { pos: [0, h / 2, -d / 2], rot: [0, 0, 0] },
    },
    {
      id: "Back", geo: new THREE.PlaneGeometry(w, h), color: shades[2],
      flat: { pos: [0, 0, d / 2 + h / 2], rot: [-Math.PI / 2, 0, 0] }, folded: { pos: [0, h / 2, d / 2], rot: [0, Math.PI, 0] },
    },
    {
      id: "Left", geo: new THREE.PlaneGeometry(h, d), color: shades[3],
      flat: { pos: [-w / 2 - h / 2, 0, 0], rot: [-Math.PI / 2, 0, 0] }, folded: { pos: [-w / 2, h / 2, 0], rot: [0, Math.PI / 2, 0] },
    },
    {
      id: "Right", geo: new THREE.PlaneGeometry(h, d), color: shades[4],
      flat: { pos: [w / 2 + h / 2, 0, 0], rot: [-Math.PI / 2, 0, 0] }, folded: { pos: [w / 2, h / 2, 0], rot: [0, -Math.PI / 2, 0] },
    },
    {
      id: "Top", geo: new THREE.PlaneGeometry(w, d), color: shades[5],
      flat: { pos: [0, 0, -d / 2 - h - d / 2], rot: [-Math.PI / 2, 0, 0] }, folded: { pos: [0, h, 0], rot: [-Math.PI / 2, 0, 0] },
    },
  ]
}

const createCylinderNet = (r: number, h: number, color?: string): NetDefinition => ({
  flat: [],
  tube: { radius: r, height: h, color },
})

const createConeNet = (r: number, h: number, color?: string): NetDefinition => ({
  flat: [],
  cone: { radius: r, height: h, color },
})

const createTetrahedronNet = (s: number, color?: string): NetDefinition => {
  const th = s * Math.sqrt(3) / 2
  const tri = new THREE.Shape()
  tri.moveTo(-s / 2, 0); tri.lineTo(s / 2, 0); tri.lineTo(0, th); tri.closePath()
  const shades = getFaceShades(color, 4)
  return {
    flat: [
      {
        id: "Base", geo: new THREE.ShapeGeometry(tri), color: shades[0],
        flat: { pos: [0, 0, 0], rot: [-Math.PI / 2, 0, 0] }, folded: { pos: [0, 0, 0], rot: [-Math.PI / 2, 0, 0] },
      },
      {
        id: "Front", geo: new THREE.ShapeGeometry(tri), color: shades[1],
        flat: { pos: [0, 0, -th], rot: [-Math.PI / 2, 0, 0] }, folded: { pos: [0, 0, -s / 2], rot: [Math.PI / 3, 0, 0] },
      },
      {
        id: "Left", geo: new THREE.ShapeGeometry(tri), color: shades[2],
        flat: { pos: [-s / 2 - th / 2, 0, th / 4], rot: [-Math.PI / 2, 0, 0] }, folded: { pos: [-s / 2, 0, 0], rot: [0, 0, Math.PI / 3] },
      },
      {
        id: "Right", geo: new THREE.ShapeGeometry(tri), color: shades[3],
        flat: { pos: [s / 2 + th / 2, 0, th / 4], rot: [-Math.PI / 2, 0, 0] }, folded: { pos: [s / 2, 0, 0], rot: [0, 0, -Math.PI / 3] },
      },
    ],
  }
}

const createPyramidNet = (b: number, h: number, color?: string): NetDefinition => ({
  flat: [],
  pyramid: { base: b, height: h, color },
})

const createSphereNet = (r: number, color?: string): NetDefinition => {
  const shades = getFaceShades(color, 2)
  return {
    flat: [
      {
        id: "Bottom", geo: new THREE.SphereGeometry(r, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), color: shades[1],
        flat: { pos: [0, 0, 0], rot: [0, 0, 0] }, folded: { pos: [0, 0, 0], rot: [0, 0, 0] },
      },
      {
        id: "Top", geo: new THREE.SphereGeometry(r, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), color: shades[0],
        flat: { pos: [0, 0, -r * 2], rot: [-Math.PI, 0, 0] }, folded: { pos: [0, 0, 0], rot: [0, 0, 0] },
      },
    ],
  }
}

interface ShapeConfig {
  type: string
  color?: string
  width?: number
  height?: number
  depth?: number
  radiusTop?: number
  cylinderHeight?: number
  coneRadius?: number
  coneHeight?: number
  size?: number
  radius?: number
  halfSphereRadius?: number
}

const getNetFaces = (shape: ShapeConfig): NetDefinition => {
  const color = shape.color
  switch (shape.type) {
    case 'box': case 'cube':
      return { flat: createBoxNet(shape.width ?? 2, shape.height ?? 1, shape.depth ?? 1.5, color) }
    case 'cylinder':
      return createCylinderNet(shape.radiusTop ?? 0.8, shape.cylinderHeight ?? 1.5, color)
    case 'cone':
      return createConeNet(shape.coneRadius ?? 0.8, shape.coneHeight ?? 1.5, color)
    case 'tetrahedron':
      return createTetrahedronNet(shape.size ?? 1.5, color)
    case 'pyramid':
      return createPyramidNet(shape.width ?? 1.5, shape.height ?? 1.5, color)
    case 'sphere': case 'halfSphere':
      return createSphereNet(shape.radius ?? shape.halfSphereRadius ?? 1, color)
    default:
      return { flat: [] }
  }
}

const SHAPE_NAMES: Record<string, string> = {
  box: 'Box', cube: 'Cube', cylinder: 'Cylinder',
  cone: 'Cone', tetrahedron: 'Tetrahedron',
  pyramid: 'Pyramid', sphere: 'Sphere', halfSphere: 'Sphere',
}

const NET_HAS: Record<string, { f: number; e: number; v: number }> = {
  box: { f: 6, e: 12, v: 8 }, cube: { f: 6, e: 12, v: 8 },
  cylinder: { f: 3, e: 2, v: 0 }, cone: { f: 2, e: 1, v: 1 },
  tetrahedron: { f: 4, e: 6, v: 4 }, pyramid: { f: 5, e: 8, v: 5 },
  sphere: { f: 2, e: 1, v: 0 }, halfSphere: { f: 2, e: 1, v: 0 },
}

export { createBoxNet, createCylinderNet, createConeNet, createTetrahedronNet, createPyramidNet, createSphereNet, getNetFaces, SHAPE_NAMES, NET_HAS }
