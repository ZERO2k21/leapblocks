/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * constants.ts — Animation timings, orbital parameters, color palette, and
 * material settings for the 3D hero scene.  Every magic number lives here so
 * component files stay clean.
 */

import * as THREE from 'three';

/* ───────────────────────────── COLORS ─────────────────────────────── */

export const COLORS = {
  /** Primary brand blue */
  blue: new THREE.Color('#4F8EF7'),
  /** Accent purple */
  purple: new THREE.Color('#7C3AED'),
  /** Accent cyan */
  cyan: new THREE.Color('#06B6D4'),
  /** White body for the AI assistant */
  white: new THREE.Color('#F8FAFC'),
  /** Soft warm white for ambient light */
  ambientWhite: new THREE.Color('#E8E4F0'),
  /** Platform ring glow */
  platformBlue: new THREE.Color('#3B82F6'),
  /** Platform inner grid */
  platformCyan: new THREE.Color('#22D3EE'),
  /** Connection line blue */
  connectionBlue: new THREE.Color('#60A5FA'),
  /** Connection line purple */
  connectionPurple: new THREE.Color('#A78BFA'),
  /** Connection line cyan */
  connectionCyan: new THREE.Color('#67E8F9'),
  /** Student shirt */
  studentShirt: new THREE.Color('#E2E8F0'),
  /** Student pants */
  studentPants: new THREE.Color('#334155'),
  /** Student skin */
  studentSkin: new THREE.Color('#FCD5B4'),
  /** Student hair */
  studentHair: new THREE.Color('#1E293B'),
  /** PCB green */
  pcbGreen: new THREE.Color('#22C55E'),
  /** Arduino teal */
  arduinoTeal: new THREE.Color('#00979D'),
  /** Raspberry Pi red */
  raspberryRed: new THREE.Color('#C51A4A'),
  /** ESP32 dark blue */
  esp32Blue: new THREE.Color('#1565C0'),
  /** Python blue */
  pythonBlue: new THREE.Color('#306998'),
  /** Python yellow */
  pythonYellow: new THREE.Color('#FFD43B'),
  /** Blockly yellow */
  blocklyYellow: new THREE.Color('#FFAB19'),
  /** Blockly blue */
  blocklyBlue: new THREE.Color('#4C97FF'),
  /** Blockly green */
  blocklyGreen: new THREE.Color('#59C059'),
  /** Gold accent */
  gold: new THREE.Color('#F59E0B'),
  /** Chip dark */
  chipDark: new THREE.Color('#1E293B'),
  /** Signal green */
  signalGreen: new THREE.Color('#34D399'),
} as const;

/* ───────────────────── ANIMATION TIMING (seconds) ────────────────── */

export const TIMING = {
  /** AI float cycle period */
  aiFloatPeriod: 4.0,
  /** AI float amplitude (world units) */
  aiFloatAmplitude: 0.15,
  /** AI rotation speed (radians per second) */
  aiRotationSpeed: 0.08,
  /** AI blink interval */
  aiBlinkInterval: 4.0,
  /** AI blink duration */
  aiBlinkDuration: 0.15,
  /** AI look‑around interval */
  aiLookInterval: 6.0,

  /** Platform outer ring rotation speed */
  platformOuterSpeed: 0.3,
  /** Platform inner grid rotation speed (opposite) */
  platformInnerSpeed: -0.2,
  /** Platform pulse period */
  platformPulsePeriod: 3.0,

  /** Student breathing period */
  studentBreathPeriod: 3.5,
  /** Student breathing amplitude (scale factor) */
  studentBreathAmplitude: 0.012,
  /** Student sway period */
  studentSwayPeriod: 5.0,
  /** Student sway amplitude (radians) */
  studentSwayAmplitude: 0.015,

  /** Connection pulse period */
  connectionPulsePeriod: 3.0,
  /** Energy particle travel speed */
  energyParticleSpeed: 0.25,

  /** Background hex float period */
  bgFloatPeriod: 12.0,

  /** Particle drift speed multiplier */
  particleDriftSpeed: 0.02,

  /** Scene entrance animation duration (seconds) */
  entranceDuration: 1.5,

  /** Robot arm wave interval */
  robotArmWaveInterval: 10.0,

  /** Drone propeller speed */
  dronePropellerSpeed: 15.0,
  /** 3D cube rotation speed */
  cubeRotationSpeed: 0.8,
} as const;

/* ────────────────────── CAMERA ────────────────────────────────────── */

export const CAMERA = {
  fov: 45,
  near: 0.1,
  far: 100,
  /** Initial position [x, y, z] */
  position: [0, 2.5, 8] as [number, number, number],
  /** LookAt target */
  lookAt: [0, 0.5, 0] as [number, number, number],
} as const;

/* ────────────────────── MOUSE PARALLAX ───────────────────────────── */

export const PARALLAX = {
  /** Maximum rotation in radians (~8°) */
  maxRotation: 0.14,
  /** Lerp damping factor (0‑1, lower = smoother) */
  damping: 0.05,
} as const;

/* ────────────────────── ORBIT MODULE DEFINITIONS ─────────────────── */

export interface OrbitModuleDef {
  id: string;
  label: string;
  /** Distance from center */
  radius: number;
  /** Starting angle in radians */
  startAngle: number;
  /** Angular speed (radians per second) */
  speed: number;
  /** Vertical offset from the platform */
  height: number;
  /** Small float amplitude */
  floatAmplitude: number;
  /** Float frequency multiplier */
  floatFrequency: number;
  /** Scale */
  scale: number;
}

export const ORBIT_MODULES: OrbitModuleDef[] = [
  /* ─── Inner ring (radius ≈ 2.2–2.8) ─── */
  { id: 'arduino',    label: 'Arduino UNO',      radius: 2.3, startAngle: 0,            speed: 0.12, height: 0.8,  floatAmplitude: 0.08, floatFrequency: 1.1, scale: 0.28 },
  { id: 'esp32',      label: 'ESP32 Board',       radius: 2.5, startAngle: Math.PI / 3,  speed: 0.14, height: 1.2,  floatAmplitude: 0.06, floatFrequency: 1.3, scale: 0.24 },
  { id: 'raspberrypi',label: 'Raspberry Pi',      radius: 2.7, startAngle: 2*Math.PI/3,  speed: 0.10, height: 0.5,  floatAmplitude: 0.10, floatFrequency: 0.9, scale: 0.26 },
  { id: 'python',     label: 'Python Logo',       radius: 2.4, startAngle: Math.PI,      speed: 0.15, height: 1.5,  floatAmplitude: 0.07, floatFrequency: 1.2, scale: 0.25 },
  { id: 'blockly',    label: 'Blockly Blocks',    radius: 2.6, startAngle: 4*Math.PI/3,  speed: 0.11, height: 0.3,  floatAmplitude: 0.09, floatFrequency: 1.0, scale: 0.24 },
  { id: 'circuit',    label: 'Circuit PCB',       radius: 2.2, startAngle: 5*Math.PI/3,  speed: 0.13, height: 1.0,  floatAmplitude: 0.05, floatFrequency: 1.4, scale: 0.26 },

  /* ─── Middle ring (radius ≈ 3.2–3.8) ─── */
  { id: 'neuralnet',  label: 'AI Neural Network', radius: 3.3, startAngle: Math.PI / 6,  speed: 0.08, height: 1.4,  floatAmplitude: 0.06, floatFrequency: 0.8, scale: 0.30 },
  { id: 'robotarm',   label: 'Robot Arm',         radius: 3.5, startAngle: Math.PI / 2,  speed: 0.09, height: 0.6,  floatAmplitude: 0.07, floatFrequency: 1.1, scale: 0.28 },
  { id: 'mobile',     label: 'Mobile Phone',      radius: 3.7, startAngle: 5*Math.PI/6,  speed: 0.07, height: 1.1,  floatAmplitude: 0.08, floatFrequency: 0.9, scale: 0.22 },
  { id: 'cube3d',     label: '3D Cube',           radius: 3.2, startAngle: 7*Math.PI/6,  speed: 0.10, height: 1.6,  floatAmplitude: 0.05, floatFrequency: 1.3, scale: 0.20 },
  { id: 'drone',      label: 'Drone',             radius: 3.6, startAngle: 3*Math.PI/2,  speed: 0.06, height: 1.8,  floatAmplitude: 0.10, floatFrequency: 0.7, scale: 0.26 },
  { id: 'camera',     label: 'Camera Module',     radius: 3.4, startAngle: 11*Math.PI/6, speed: 0.11, height: 0.4,  floatAmplitude: 0.06, floatFrequency: 1.2, scale: 0.22 },

  /* ─── Outer ring (radius ≈ 4.2–4.8) ─── */
  { id: 'sensor',     label: 'Electronic Sensor', radius: 4.3, startAngle: Math.PI / 4,  speed: 0.05, height: 0.7,  floatAmplitude: 0.04, floatFrequency: 1.0, scale: 0.20 },
  { id: 'joystick',   label: 'Joystick',          radius: 4.5, startAngle: 3*Math.PI/4,  speed: 0.06, height: 1.3,  floatAmplitude: 0.07, floatFrequency: 0.8, scale: 0.22 },
  { id: 'checklist',  label: 'Checklist',         radius: 4.7, startAngle: 5*Math.PI/4,  speed: 0.04, height: 0.9,  floatAmplitude: 0.05, floatFrequency: 1.1, scale: 0.20 },
  { id: 'cloud',      label: 'Cloud',             radius: 4.2, startAngle: 7*Math.PI/4,  speed: 0.07, height: 1.7,  floatAmplitude: 0.08, floatFrequency: 0.6, scale: 0.28 },
  { id: 'microchip',  label: 'Microchip',         radius: 4.6, startAngle: 0,            speed: 0.05, height: 0.2,  floatAmplitude: 0.03, floatFrequency: 1.5, scale: 0.18 },
  { id: 'iotnode',    label: 'IoT Node',          radius: 4.4, startAngle: Math.PI,      speed: 0.06, height: 1.5,  floatAmplitude: 0.06, floatFrequency: 0.9, scale: 0.22 },
];

/* ────────────────── CONNECTION PAIRS ─────────────────────────────── */

/** Indices into ORBIT_MODULES for connection splines */
export const CONNECTION_PAIRS: [number, number][] = [
  [0, 1],   // Arduino ↔ ESP32
  [1, 2],   // ESP32 ↔ Raspberry Pi
  [2, 5],   // Raspberry Pi ↔ Circuit
  [3, 6],   // Python ↔ Neural Network
  [4, 3],   // Blockly ↔ Python
  [5, 0],   // Circuit ↔ Arduino
  [6, 7],   // Neural Network ↔ Robot Arm
  [7, 10],  // Robot Arm ↔ Drone
  [8, 9],   // Mobile ↔ 3D Cube
  [10, 11], // Drone ↔ Camera
  [12, 16], // Sensor ↔ Microchip
  [13, 14], // Joystick ↔ Checklist
  [15, 17], // Cloud ↔ IoT Node
  [16, 17], // Microchip ↔ IoT Node
];

/* ────────────────── PARTICLE FIELD ───────────────────────────────── */

export const PARTICLES = {
  count: 200,
  /** Spread range (cube half‑size) */
  spread: 8,
  /** Minimum particle size */
  sizeMin: 0.01,
  /** Maximum particle size */
  sizeMax: 0.04,
  /** Opacity range */
  opacityMin: 0.15,
  opacityMax: 0.5,
} as const;

/* ────────────────── BACKGROUND ───────────────────────────────────── */

export const BACKGROUND = {
  hexCount: 12,
  hexSpread: 7,
  hexSize: 0.15,
  dotCount: 30,
  dotSpread: 8,
} as const;
