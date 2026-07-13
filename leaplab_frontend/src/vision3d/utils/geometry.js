/**
 * Vision3D - Geometry Creation & Serialization Utilities
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import helvetikerFont from '../assets/helvetiker_regular.typeface.json';

const fontLoader = new FontLoader();
const defaultFont = fontLoader.parse(helvetikerFont);

export function serializeGeometry(geo) {
  if (!geo || !geo.attributes) return null;
  const data = { attributes: {}, index: null };
  for (const [name, attr] of Object.entries(geo.attributes)) {
    data.attributes[name] = {
      array: Array.from(attr.array),
      itemSize: attr.itemSize,
      normalized: attr.normalized,
    };
  }
  if (geo.index) {
    data.index = { array: Array.from(geo.index.array), itemSize: 1 };
  }
  return data;
}

export function deserializeGeometry(data) {
  if (!data || !data.attributes) return null;
  const geo = new THREE.BufferGeometry();
  for (const [name, attrData] of Object.entries(data.attributes)) {
    geo.setAttribute(name, new THREE.BufferAttribute(new Float32Array(attrData.array), attrData.itemSize, attrData.normalized));
  }
  if (data.index) {
    geo.setIndex(new THREE.BufferAttribute(new Uint32Array(data.index.array), 1));
  }
  return geo;
}

export function createGeometry(shape) {
  if (shape._csgGeometry) {
    if (!shape._csgGeometry.isBufferGeometry) {
      shape._csgGeometry = deserializeGeometry(shape._csgGeometry);
    }
    return shape._csgGeometry.clone();
  }
  if (shape._customGeometry) {
    if (!shape._customGeometry.isBufferGeometry) {
      shape._customGeometry = deserializeGeometry(shape._customGeometry);
    }
    return shape._customGeometry.clone();
  }
  switch (shape.type) {
    case 'box': {
      const w = shape.width ?? 2;
      const h = shape.height ?? 2;
      const d = shape.depth ?? 2;
      const r = shape.cornerRadius ?? 0;
      if (r > 0) {
        const hw = w / 2, hh = h / 2, hd = d / 2;
        const cr = Math.min(r, hw, hh, hd);
        const shape2d = new THREE.Shape();
        shape2d.moveTo(-hw + cr, -hh);
        shape2d.lineTo(hw - cr, -hh);
        shape2d.quadraticCurveTo(hw, -hh, hw, -hh + cr);
        shape2d.lineTo(hw, hh - cr);
        shape2d.quadraticCurveTo(hw, hh, hw - cr, hh);
        shape2d.lineTo(-hw + cr, hh);
        shape2d.quadraticCurveTo(-hw, hh, -hw, hh - cr);
        shape2d.lineTo(-hw, -hh + cr);
        shape2d.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);
        const geo = new THREE.ExtrudeGeometry(shape2d, { depth: d, bevelEnabled: false });
        geo.translate(0, 0, -hd);
        return geo;
      }
      return new THREE.BoxGeometry(w, h, d);
    }

    case 'cylinder': {
      const rTop = shape.radiusTop ?? 1;
      const rBot = shape.radiusBottom ?? 1;
      const taperAmount = shape.taper ?? 0;
      const cylH = shape.cylinderHeight ?? 2;
      const smooth = shape.cornerRadius ?? 0;
      const segs = Math.round((shape.radialSegments ?? 32) * (1 + smooth * 2));
      const heightSegs = Math.round(1 + smooth * 4);
      if (taperAmount !== 0) {
        const t = taperAmount / 100;
        return new THREE.CylinderGeometry(
          rTop * (1 + t),
          rBot * (1 - t),
          cylH,
          segs, 1, false, 0, Math.PI * 2
        );
      }
      return new THREE.CylinderGeometry(rTop, rBot, cylH, segs, heightSegs);
    }

    case 'sphere': {
      const smooth = shape.cornerRadius ?? 0;
      const sw = Math.round((shape.widthSegments ?? 32) * (1 + smooth * 2));
      const sh = Math.round((shape.heightSegments ?? 16) * (1 + smooth * 2));
      return new THREE.SphereGeometry(shape.radius ?? 1, sw, sh);
    }

    case 'cone': {
      const smooth = shape.cornerRadius ?? 0;
      const segs = Math.round((shape.radialSegments ?? 32) * (1 + smooth * 2));
      return new THREE.ConeGeometry(
        shape.coneRadius ?? 1,
        shape.coneHeight ?? 2,
        segs
      );
    }

    case 'torus': {
      const smooth = shape.cornerRadius ?? 0;
      const rSegs = Math.round((shape.torusRadialSegments ?? 16) * (1 + smooth * 2));
      const tSegs = Math.round((shape.torusTubularSegments ?? 32) * (1 + smooth * 2));
      return new THREE.TorusGeometry(
        shape.torusRadius ?? 1,
        shape.tubeRadius ?? 0.4,
        rSegs,
        tSegs
      );
    }

    case 'roof': {
      const w = shape.roofWidth ?? 2;
      const d = shape.roofDepth ?? 2;
      const h = shape.roofHeight ?? 1;
      const geo = new THREE.BufferGeometry();
      const hw = w / 2, hd = d / 2;
      const vertices = new Float32Array([
        -hw, 0, -hd,  -hw, 0,  hd,   hw, 0,  hd,
        -hw, 0, -hd,   hw, 0,  hd,   hw, 0, -hd,
        -hw, 0, -hd,   hw, 0, -hd,   0,  h,  0,
         hw, 0, -hd,   hw, 0,  hd,   0,  h,  0,
         hw, 0,  hd,  -hw, 0,  hd,   0,  h,  0,
        -hw, 0,  hd,  -hw, 0, -hd,   0,  h,  0,
      ]);
      geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geo.computeVertexNormals();
      return geo;
    }

    case 'roundRoof': {
      const w = shape.roundRoofWidth ?? 2;
      const d = shape.roundRoofDepth ?? 2;
      const h = shape.roundRoofHeight ?? 1;
      const smooth = shape.cornerRadius ?? 0;
      const segs = Math.round(32 * (1 + smooth * 2));
      const geo = new THREE.CylinderGeometry(d / 2, d / 2, w, segs, 1, false, 0, Math.PI);
      geo.rotateZ(Math.PI / 2);
      geo.scale(1, h / (d / 2), 1);
      return geo;
    }

    case 'wedge': {
      const w = shape.wedgeWidth ?? 2;
      const d = shape.wedgeDepth ?? 2;
      const h = shape.wedgeHeight ?? 2;
      const geo = new THREE.BufferGeometry();
      const hw = w / 2, hd = d / 2;
      const vertices = new Float32Array([
        -hw, 0, -hd,  -hw, 0,  hd,   hw, 0,  hd,
        -hw, 0, -hd,   hw, 0,  hd,   hw, 0, -hd,
        -hw, 0, -hd,   hw, 0, -hd,  -hw,  h, -hd,
         hw, 0, -hd,   hw,  h, -hd, -hw,  h, -hd,
         hw, 0, -hd,   hw, 0,  hd,   hw,  h, -hd,
        -hw, 0,  hd,  -hw, 0, -hd,  -hw,  h, -hd,
        -hw,  h, -hd,   hw,  h, -hd,   hw, 0,  hd,
        -hw,  h, -hd,   hw, 0,  hd,  -hw, 0,  hd,
      ]);
      geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geo.computeVertexNormals();
      return geo;
    }

    case 'pyramid': {
      const smooth = shape.cornerRadius ?? 0;
      const sides = Math.round((shape.pyramidSides ?? 4) + smooth * 12);
      return new THREE.ConeGeometry(
        shape.pyramidRadius ?? 1,
        shape.pyramidHeight ?? 2,
        sides
      );
    }

    case 'halfSphere': {
      const r = shape.halfSphereRadius ?? 1;
      const smooth = shape.cornerRadius ?? 0;
      const segs = Math.round((shape.halfSphereSegments ?? 32) * (1 + smooth * 2));
      const geo = new THREE.SphereGeometry(r, segs, Math.round(segs / 2), 0, Math.PI * 2, 0, Math.PI / 2);
      return geo;
    }

    case 'paraboloid': {
      const r = shape.paraboloidRadius ?? 1;
      const h = shape.paraboloidHeight ?? 2;
      const segs = shape.paraboloidSegments ?? 32;
      const pts = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const y = t * h;
        const radius = r * (1 - t * t);
        pts.push(new THREE.Vector2(radius, y));
      }
      return new THREE.LatheGeometry(pts, segs);
    }

    case 'tube': {
      const outerR = shape.tubeOuterRadius ?? 1;
      const innerR = shape.tubeInnerRadius ?? 0.7;
      const h = shape.tubeHeight ?? 2;
      const halfH = h / 2;
      const pts = [];
      pts.push(new THREE.Vector2(outerR, -halfH));
      pts.push(new THREE.Vector2(innerR, -halfH));
      pts.push(new THREE.Vector2(innerR, halfH));
      pts.push(new THREE.Vector2(outerR, halfH));
      pts.push(new THREE.Vector2(outerR, -halfH));
      const segs = shape.tubeRadialSegments ?? 32;
      return new THREE.LatheGeometry(pts, segs);
    }

    case 'star': {
      const outer = shape.starOuterRadius ?? 1;
      const inner = shape.starInnerRadius ?? 0.5;
      const points = shape.starPoints ?? 5;
      const height = shape.starHeight ?? 0.5;
      const shape2d = new THREE.Shape();
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const r = i % 2 === 0 ? outer : inner;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) shape2d.moveTo(x, y);
        else shape2d.lineTo(x, y);
      }
      shape2d.closePath();
      return new THREE.ExtrudeGeometry(shape2d, { depth: height, bevelEnabled: false });
    }

    case 'heart': {
      const s = shape.heartSize ?? 1;
      const depth = shape.heartDepth ?? 0.5;
      const shape2d = new THREE.Shape();
      shape2d.moveTo(0, -s * 0.7);
      shape2d.bezierCurveTo(-s * 1.0, -s * 0.3, -s * 1.0, s * 0.6, 0, s * 0.3);
      shape2d.bezierCurveTo(s * 1.0, s * 0.6, s * 1.0, -s * 0.3, 0, -s * 0.7);
      return new THREE.ExtrudeGeometry(shape2d, { depth, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 });
    }

    case 'polygon': {
      const r = shape.polygonRadius ?? 1;
      const sides = shape.polygonSides ?? 6;
      const h = shape.polygonHeight ?? 2;
      const smooth = shape.cornerRadius ?? 0;
      const segs = Math.round(sides * (1 + smooth * 4));
      return new THREE.CylinderGeometry(r, r, h, segs);
    }

    case 'dodecahedron':
      return new THREE.DodecahedronGeometry(shape.radius ?? 1);

    case 'icosahedron':
      return new THREE.IcosahedronGeometry(shape.radius ?? 1);

    case 'octahedron':
      return new THREE.OctahedronGeometry(shape.radius ?? 1);

    case 'tetrahedron':
      return new THREE.TetrahedronGeometry(shape.radius ?? 1);

    case 'text3d': {
      const text = shape.text || 'Hello';
      const size = shape.fontSize ?? 1;
      const depth = shape.textDepth ?? 0.5;
      const geo = new TextGeometry(text, {
        font: defaultFont,
        size,
        height: depth,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelSegments: 5,
      });
      geo.computeBoundingBox();
      geo.center();
      return geo;
    }

    case 'ring': {
      const innerR = shape.innerRadius ?? 0.5;
      const outerR = shape.outerRadius ?? 1;
      const thickness = (outerR - innerR) * 0.5;
      const pts = [];
      const steps = 12;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const r = outerR - t * (outerR - innerR);
        const y = -thickness / 2;
        pts.push(new THREE.Vector2(r, y));
      }
      pts.push(new THREE.Vector2(innerR, thickness / 2));
      for (let i = steps; i >= 0; i--) {
        const t = i / steps;
        const r = outerR - t * (outerR - innerR);
        const y = thickness / 2;
        pts.push(new THREE.Vector2(r, y));
      }
      pts.push(new THREE.Vector2(outerR, -thickness / 2));
      const segs = 48;
      return new THREE.LatheGeometry(pts, segs);
    }

    case 'plane':
      return new THREE.PlaneGeometry(2, 2);

    default:
      return new THREE.BoxGeometry(1, 1, 1);
  }
}

export function calculateBoundingBox(shape) {
  const geometry = createGeometry(shape);
  geometry.computeBoundingBox();

  const bbox = geometry.boundingBox;
  const scale = new THREE.Vector3(...shape.scale);
  const position = new THREE.Vector3(...shape.position);

  const min = bbox.min.clone().multiply(scale).add(position);
  const max = bbox.max.clone().multiply(scale).add(position);

  geometry.dispose();

  return { min, max };
}
