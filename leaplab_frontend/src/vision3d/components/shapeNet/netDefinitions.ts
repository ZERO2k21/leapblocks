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
  tube?: { radius: number; height: number }
  cone?: { radius: number; height: number }
  pyramid?: { base: number; height: number }
}

const createBoxNet = (w: number, h: number, d: number): NetFace[] => [
  {
    id: "Bottom", geo: new THREE.PlaneGeometry(w, d), color: "#6366f1",
    flat: { pos: [0, 0, 0], rot: [-Math.PI / 2, 0, 0] }, folded: { pos: [0, 0, 0], rot: [-Math.PI / 2, 0, 0] },
  },
  {
    id: "Front", geo: new THREE.PlaneGeometry(w, h), color: "#8b5cf6",
    flat: { pos: [0, 0, -d / 2 - h / 2], rot: [-Math.PI / 2, 0, 0] }, folded: { pos: [0, h / 2, -d / 2], rot: [0, 0, 0] },
  },
  {
    id: "Back", geo: new THREE.PlaneGeometry(w, h), color: "#a78bfa",
    flat: { pos: [0, 0, d / 2 + h / 2], rot: [-Math.PI / 2, 0, 0] }, folded: { pos: [0, h / 2, d / 2], rot: [0, Math.PI, 0] },
  },
  {
    id: "Left", geo: new THREE.PlaneGeometry(h, d), color: "#7c3aed",
    flat: { pos: [-w / 2 - h / 2, 0, 0], rot: [-Math.PI / 2, 0, 0] }, folded: { pos: [-w / 2, h / 2, 0], rot: [0, Math.PI / 2, 0] },
  },
  {
    id: "Right", geo: new THREE.PlaneGeometry(h, d), color: "#6d28d9",
    flat: { pos: [w / 2 + h / 2, 0, 0], rot: [-Math.PI / 2, 0, 0] }, folded: { pos: [w / 2, h / 2, 0], rot: [0, -Math.PI / 2, 0] },
  },
  {
    id: "Top", geo: new THREE.PlaneGeometry(w, d), color: "#c4b5fd",
    flat: { pos: [0, 0, -d / 2 - h - d / 2], rot: [-Math.PI / 2, 0, 0] }, folded: { pos: [0, h, 0], rot: [-Math.PI / 2, 0, 0] },
  },
]

const createCylinderNet = (r: number, h: number): NetDefinition => ({
  flat: [],
  tube: { radius: r, height: h },
})

const createConeNet = (r: number, h: number): NetDefinition => ({
  flat: [],
  cone: { radius: r, height: h },
})

const createTetrahedronNet = (s: number): NetDefinition => {
  const th = s * Math.sqrt(3) / 2
  const tri = new THREE.Shape()
  tri.moveTo(-s / 2, 0); tri.lineTo(s / 2, 0); tri.lineTo(0, th); tri.closePath()
  return {
    flat: [
      {
        id: "Base", geo: new THREE.ShapeGeometry(tri), color: "#10b981",
        flat: { pos: [0, 0, 0], rot: [-Math.PI / 2, 0, 0] }, folded: { pos: [0, 0, 0], rot: [-Math.PI / 2, 0, 0] },
      },
      {
        id: "Front", geo: new THREE.ShapeGeometry(tri), color: "#34d399",
        flat: { pos: [0, 0, -th], rot: [-Math.PI / 2, 0, 0] }, folded: { pos: [0, 0, -s / 2], rot: [Math.PI / 3, 0, 0] },
      },
      {
        id: "Left", geo: new THREE.ShapeGeometry(tri), color: "#6ee7b7",
        flat: { pos: [-s / 2 - th / 2, 0, th / 4], rot: [-Math.PI / 2, 0, 0] }, folded: { pos: [-s / 2, 0, 0], rot: [0, 0, Math.PI / 3] },
      },
      {
        id: "Right", geo: new THREE.ShapeGeometry(tri), color: "#a7f3d0",
        flat: { pos: [s / 2 + th / 2, 0, th / 4], rot: [-Math.PI / 2, 0, 0] }, folded: { pos: [s / 2, 0, 0], rot: [0, 0, -Math.PI / 3] },
      },
    ],
  }
}

const createPyramidNet = (b: number, h: number): NetDefinition => ({
  flat: [],
  pyramid: { base: b, height: h },
})

const createSphereNet = (r: number): NetDefinition => ({
  flat: [
    {
      id: "Top", geo: new THREE.SphereGeometry(r, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), color: "#ef4444",
      flat: { pos: [-r * 1.5, 0, 0], rot: [-Math.PI / 2, 0, 0] }, folded: { pos: [0, 0, 0], rot: [0, 0, 0] },
    },
    {
      id: "Bottom", geo: new THREE.SphereGeometry(r, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), color: "#f87171",
      flat: { pos: [r * 1.5, 0, 0], rot: [Math.PI / 2, 0, 0] }, folded: { pos: [0, 0, 0], rot: [0, 0, 0] },
    },
  ],
})

interface ShapeConfig {
  type: string
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
  switch (shape.type) {
    case 'box': case 'cube':
      return { flat: createBoxNet(shape.width ?? 2, shape.height ?? 1, shape.depth ?? 1.5) }
    case 'cylinder':
      return createCylinderNet(shape.radiusTop ?? 0.8, shape.cylinderHeight ?? 1.5)
    case 'cone':
      return createConeNet(shape.coneRadius ?? 0.8, shape.coneHeight ?? 1.5)
    case 'tetrahedron':
      return createTetrahedronNet(shape.size ?? 1.5)
    case 'pyramid':
      return createPyramidNet(shape.width ?? 1.5, shape.height ?? 1.5)
    case 'sphere': case 'halfSphere':
      return createSphereNet(shape.radius ?? shape.halfSphereRadius ?? 1)
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
