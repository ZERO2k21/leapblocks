/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * OrbitModules.tsx — 18 educational modules orbiting around the central
 * platform at different radii, speeds, and heights.  Each module is built
 * entirely from Three.js primitive geometry, no external GLTF models.
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ORBIT_MODULES, COLORS, TIMING, type OrbitModuleDef } from './constants';

/* ────────────────────────────────────────────────────────────────────
   Individual module geometry builders.
   Each returns a JSX group with the module's visual representation.
   ──────────────────────────────────────────────────────────────────── */

/** Arduino UNO — green PCB + chip + pin headers */
const ArduinoModule: React.FC = () => (
  <group>
    <mesh><boxGeometry args={[1, 0.08, 0.7]} /><meshStandardMaterial color={COLORS.arduinoTeal} roughness={0.4} /></mesh>
    {/* Main chip */}
    <mesh position={[0.1, 0.06, 0]}><boxGeometry args={[0.35, 0.06, 0.15]} /><meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.3} /></mesh>
    {/* USB port */}
    <mesh position={[-0.4, 0.06, 0]}><boxGeometry args={[0.12, 0.08, 0.14]} /><meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} /></mesh>
    {/* Pin headers (top) */}
    {Array.from({ length: 8 }).map((_, i) => (
      <mesh key={`pt${i}`} position={[- 0.3 + i * 0.08, 0.07, -0.28]}><boxGeometry args={[0.02, 0.08, 0.02]} /><meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.1} /></mesh>
    ))}
    {/* Pin headers (bottom) */}
    {Array.from({ length: 6 }).map((_, i) => (
      <mesh key={`pb${i}`} position={[-0.2 + i * 0.08, 0.07, 0.28]}><boxGeometry args={[0.02, 0.08, 0.02]} /><meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.1} /></mesh>
    ))}
    {/* LED */}
    <mesh position={[0.35, 0.06, 0.2]}><sphereGeometry args={[0.025, 8, 8]} /><meshStandardMaterial color="#22C55E" emissive="#22C55E" emissiveIntensity={2} /></mesh>
  </group>
);

/** ESP32 — smaller blue PCB + antenna */
const ESP32Module: React.FC = () => (
  <group>
    <mesh><boxGeometry args={[0.7, 0.06, 0.4]} /><meshStandardMaterial color={COLORS.esp32Blue} roughness={0.4} /></mesh>
    <mesh position={[0, 0.05, 0]}><boxGeometry args={[0.25, 0.05, 0.2]} /><meshStandardMaterial color="#0D1117" metalness={0.7} roughness={0.3} /></mesh>
    {/* Antenna */}
    <mesh position={[0.3, 0.05, 0]}><boxGeometry args={[0.08, 0.04, 0.25]} /><meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} /></mesh>
    {/* USB-C */}
    <mesh position={[-0.32, 0.04, 0]}><boxGeometry args={[0.08, 0.04, 0.1]} /><meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} /></mesh>
  </group>
);

/** Raspberry Pi — small red/green PCB + GPIO */
const RaspberryPiModule: React.FC = () => (
  <group>
    <mesh><boxGeometry args={[0.85, 0.06, 0.56]} /><meshStandardMaterial color={COLORS.pcbGreen} roughness={0.45} /></mesh>
    {/* SoC */}
    <mesh position={[0.05, 0.05, 0.05]}><boxGeometry args={[0.18, 0.04, 0.18]} /><meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.2} /></mesh>
    {/* GPIO header row */}
    {Array.from({ length: 10 }).map((_, i) => (
      <mesh key={i} position={[-0.32 + i * 0.06, 0.06, -0.2]}><boxGeometry args={[0.015, 0.1, 0.015]} /><meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.1} /></mesh>
    ))}
    {/* Raspberry Pi logo indicator — red accent */}
    <mesh position={[-0.25, 0.04, 0.15]}><sphereGeometry args={[0.03, 8, 8]} /><meshStandardMaterial color={COLORS.raspberryRed} emissive={COLORS.raspberryRed} emissiveIntensity={0.5} /></mesh>
    {/* USB ports */}
    <mesh position={[0.38, 0.05, 0.1]}><boxGeometry args={[0.08, 0.08, 0.1]} /><meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.2} /></mesh>
    <mesh position={[0.38, 0.05, -0.1]}><boxGeometry args={[0.08, 0.08, 0.1]} /><meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.2} /></mesh>
  </group>
);

/** Python Logo — two intertwined curves (approximated with torus segments) */
const PythonModule: React.FC = () => {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const pulse = 0.8 + 0.4 * Math.sin(clock.getElapsedTime() * 2);
      ref.current.children.forEach((c) => {
        if ((c as THREE.Mesh).material) {
          ((c as THREE.Mesh).material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
        }
      });
    }
  });
  return (
    <group ref={ref}>
      {/* Blue half */}
      <mesh position={[-0.08, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.05, 8, 16, Math.PI]} />
        <meshStandardMaterial color={COLORS.pythonBlue} emissive={COLORS.pythonBlue} emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-0.08, 0.08, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.25, 8]} />
        <meshStandardMaterial color={COLORS.pythonBlue} emissive={COLORS.pythonBlue} emissiveIntensity={0.8} />
      </mesh>
      {/* Yellow half */}
      <mesh position={[0.08, -0.08, 0]} rotation={[Math.PI / 2, 0, Math.PI]}>
        <torusGeometry args={[0.18, 0.05, 8, 16, Math.PI]} />
        <meshStandardMaterial color={COLORS.pythonYellow} emissive={COLORS.pythonYellow} emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0.08, -0.08, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.25, 8]} />
        <meshStandardMaterial color={COLORS.pythonYellow} emissive={COLORS.pythonYellow} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
};

/** Blockly Blocks — coloured interlocking boxes */
const BlocklyModule: React.FC = () => (
  <group>
    <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.4, 0.12, 0.2]} /><meshStandardMaterial color={COLORS.blocklyYellow} roughness={0.35} /></mesh>
    <mesh position={[0, 0, 0]}><boxGeometry args={[0.4, 0.12, 0.2]} /><meshStandardMaterial color={COLORS.blocklyBlue} roughness={0.35} /></mesh>
    <mesh position={[0, -0.12, 0]}><boxGeometry args={[0.4, 0.12, 0.2]} /><meshStandardMaterial color={COLORS.blocklyGreen} roughness={0.35} /></mesh>
    {/* Notch connectors */}
    <mesh position={[-0.12, 0.06, 0.1]}><boxGeometry args={[0.06, 0.04, 0.04]} /><meshStandardMaterial color={COLORS.blocklyYellow} roughness={0.35} /></mesh>
    <mesh position={[-0.12, -0.06, 0.1]}><boxGeometry args={[0.06, 0.04, 0.04]} /><meshStandardMaterial color={COLORS.blocklyBlue} roughness={0.35} /></mesh>
  </group>
);

/** Circuit PCB — green board + copper traces */
const CircuitModule: React.FC = () => {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    // Electric pulse — flash traces
    const pulse = Math.sin(clock.getElapsedTime() * 4) > 0.7 ? 2.0 : 0.3;
    ref.current.children.forEach((c, i) => {
      if (i > 0 && (c as THREE.Mesh).material) {
        ((c as THREE.Mesh).material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
      }
    });
  });
  return (
    <group ref={ref}>
      <mesh><boxGeometry args={[0.8, 0.05, 0.6]} /><meshStandardMaterial color={COLORS.pcbGreen} roughness={0.5} /></mesh>
      {/* Copper traces */}
      <mesh position={[0, 0.03, 0.1]}><boxGeometry args={[0.6, 0.008, 0.02]} /><meshStandardMaterial color="#D97706" emissive="#D97706" emissiveIntensity={0.3} metalness={0.9} roughness={0.1} /></mesh>
      <mesh position={[0.15, 0.03, 0]} rotation={[0, 0, 0]}><boxGeometry args={[0.02, 0.008, 0.4]} /><meshStandardMaterial color="#D97706" emissive="#D97706" emissiveIntensity={0.3} metalness={0.9} roughness={0.1} /></mesh>
      <mesh position={[-0.15, 0.03, -0.05]}><boxGeometry args={[0.4, 0.008, 0.02]} /><meshStandardMaterial color="#D97706" emissive="#D97706" emissiveIntensity={0.3} metalness={0.9} roughness={0.1} /></mesh>
      {/* Components */}
      <mesh position={[0.2, 0.05, 0.15]}><boxGeometry args={[0.08, 0.04, 0.04]} /><meshStandardMaterial color="#1E293B" /></mesh>
      <mesh position={[-0.2, 0.05, -0.12]}><cylinderGeometry args={[0.03, 0.03, 0.06, 8]} /><meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} /></mesh>
    </group>
  );
};

/** AI Neural Network — interconnected glowing nodes */
const NeuralNetModule: React.FC = () => {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    // Pulse each node with phase offset
    ref.current.children.forEach((c, i) => {
      if ((c as THREE.Mesh).material && 'emissiveIntensity' in ((c as THREE.Mesh).material as any)) {
        ((c as THREE.Mesh).material as THREE.MeshStandardMaterial).emissiveIntensity =
          0.5 + 0.8 * Math.sin(t * 3 + i * 0.7);
      }
    });
  });

  const nodePositions = [
    [0, 0.2, 0], [-0.2, 0, 0.1], [0.2, 0, -0.1],
    [-0.1, -0.2, 0], [0.15, -0.18, 0.1], [0, 0, 0],
  ];

  const edges: [number, number][] = [[0, 1], [0, 2], [1, 3], [2, 4], [1, 5], [2, 5], [3, 5], [4, 5]];

  return (
    <group ref={ref}>
      {nodePositions.map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color={COLORS.purple} emissive={COLORS.purple} emissiveIntensity={1} />
        </mesh>
      ))}
      {edges.map(([a, b], i) => {
        const start = new THREE.Vector3(...(nodePositions[a] as [number, number, number]));
        const end = new THREE.Vector3(...(nodePositions[b] as [number, number, number]));
        const mid = start.clone().add(end).multiplyScalar(0.5);
        const dir = end.clone().sub(start);
        const len = dir.length();
        return (
          <mesh key={`e${i}`} position={[mid.x, mid.y, mid.z]} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())}>
            <cylinderGeometry args={[0.006, 0.006, len, 4]} />
            <meshBasicMaterial color={COLORS.purple} transparent opacity={0.5} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Robot Arm — jointed cylinders + gripper */
const RobotArmModule: React.FC = () => {
  const gripperRef = useRef<THREE.Group>(null);
  const waveRef = useRef(0);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Wave every 10 seconds
    if (gripperRef.current) {
      const cycle = t % TIMING.robotArmWaveInterval;
      const wave = cycle < 1.5 ? Math.sin(cycle * Math.PI * 2) * 0.3 : 0;
      gripperRef.current.rotation.z = wave;
    }
  });

  return (
    <group>
      {/* Base */}
      <mesh position={[0, -0.15, 0]}><cylinderGeometry args={[0.12, 0.15, 0.08, 16]} /><meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} /></mesh>
      {/* Lower arm */}
      <mesh position={[0, 0, 0]}><cylinderGeometry args={[0.04, 0.05, 0.25, 8]} /><meshStandardMaterial color="#94A3B8" metalness={0.7} roughness={0.25} /></mesh>
      {/* Joint */}
      <mesh position={[0, 0.13, 0]}><sphereGeometry args={[0.05, 12, 12]} /><meshStandardMaterial color={COLORS.blue} metalness={0.6} roughness={0.3} /></mesh>
      {/* Upper arm */}
      <group ref={gripperRef} position={[0, 0.13, 0]}>
        <mesh position={[0.1, 0.08, 0]} rotation={[0, 0, -0.5]}><cylinderGeometry args={[0.03, 0.035, 0.2, 8]} /><meshStandardMaterial color="#94A3B8" metalness={0.7} roughness={0.25} /></mesh>
        {/* Gripper claws */}
        <mesh position={[0.2, 0.14, 0.02]} rotation={[0, 0, 0.3]}><boxGeometry args={[0.06, 0.015, 0.01]} /><meshStandardMaterial color="#E2E8F0" metalness={0.5} roughness={0.3} /></mesh>
        <mesh position={[0.2, 0.14, -0.02]} rotation={[0, 0, 0.3]}><boxGeometry args={[0.06, 0.015, 0.01]} /><meshStandardMaterial color="#E2E8F0" metalness={0.5} roughness={0.3} /></mesh>
      </group>
    </group>
  );
};

/** Mobile Phone — rounded box + glowing screen */
const MobileModule: React.FC = () => {
  const screenRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (screenRef.current) {
      // Screen colour transitions
      const t = clock.getElapsedTime();
      const hue = (t * 0.1) % 1;
      ((screenRef.current.material as THREE.MeshStandardMaterial).emissive as THREE.Color).setHSL(hue, 0.7, 0.5);
    }
  });
  return (
    <group>
      {/* Phone body */}
      <mesh><boxGeometry args={[0.28, 0.5, 0.03]} /><meshStandardMaterial color="#1E293B" metalness={0.4} roughness={0.3} /></mesh>
      {/* Screen */}
      <mesh ref={screenRef} position={[0, 0.01, 0.017]}>
        <planeGeometry args={[0.24, 0.42]} />
        <meshStandardMaterial color="#1E293B" emissive={COLORS.blue} emissiveIntensity={0.8} />
      </mesh>
      {/* Camera notch */}
      <mesh position={[0, 0.2, 0.017]}><circleGeometry args={[0.015, 12]} /><meshBasicMaterial color="#0F172A" /></mesh>
    </group>
  );
};

/** 3D Cube — wireframe, continuously rotating */
const Cube3DModule: React.FC = () => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.x = clock.getElapsedTime() * TIMING.cubeRotationSpeed;
      ref.current.rotation.y = clock.getElapsedTime() * TIMING.cubeRotationSpeed * 0.7;
    }
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[0.35, 0.35, 0.35]} />
      <meshStandardMaterial color={COLORS.cyan} emissive={COLORS.cyan} emissiveIntensity={0.6} wireframe />
    </mesh>
  );
};

/** Drone — X frame + 4 spinning propellers */
const DroneModule: React.FC = () => {
  const propsRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (propsRef.current) {
      propsRef.current.children.forEach((prop) => {
        prop.rotation.y = clock.getElapsedTime() * TIMING.dronePropellerSpeed;
      });
    }
  });
  const armPositions: [number, number, number][] = [
    [0.15, 0, 0.15], [-0.15, 0, 0.15],
    [0.15, 0, -0.15], [-0.15, 0, -0.15],
  ];
  return (
    <group>
      {/* Center body */}
      <mesh><boxGeometry args={[0.1, 0.04, 0.1]} /><meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} /></mesh>
      {/* Arms */}
      {armPositions.map((pos, i) => (
        <mesh key={i} position={pos} rotation={[0, i < 2 ? Math.PI / 4 : -Math.PI / 4, 0]}>
          <boxGeometry args={[0.22, 0.015, 0.025]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.7} roughness={0.25} />
        </mesh>
      ))}
      {/* Propellers */}
      <group ref={propsRef}>
        {armPositions.map((pos, i) => (
          <mesh key={`p${i}`} position={[pos[0], 0.02, pos[2]]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.06, 0.004, 4, 16]} />
            <meshBasicMaterial color={COLORS.blue} transparent opacity={0.6} />
          </mesh>
        ))}
      </group>
      {/* Camera underneath */}
      <mesh position={[0, -0.03, 0]}><sphereGeometry args={[0.02, 8, 8]} /><meshStandardMaterial color="#0F172A" /></mesh>
    </group>
  );
};

/** Camera Module — box body + lens cylinder */
const CameraModule: React.FC = () => {
  const lensRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (lensRef.current) {
      // Lens scan — pulsing emissive
      const scan = 0.3 + 0.7 * Math.abs(Math.sin(clock.getElapsedTime() * 1.5));
      ((lensRef.current.material as THREE.MeshStandardMaterial)).emissiveIntensity = scan;
    }
  });
  return (
    <group>
      <mesh><boxGeometry args={[0.3, 0.2, 0.15]} /><meshStandardMaterial color="#334155" metalness={0.5} roughness={0.3} /></mesh>
      <mesh ref={lensRef} position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.08, 16]} />
        <meshStandardMaterial color="#1E293B" emissive={COLORS.cyan} emissiveIntensity={0.5} metalness={0.6} roughness={0.2} />
      </mesh>
      {/* Flash */}
      <mesh position={[0.1, 0.06, 0.08]}><sphereGeometry args={[0.02, 8, 8]} /><meshStandardMaterial color="#FDE68A" emissive="#FDE68A" emissiveIntensity={0.5} /></mesh>
    </group>
  );
};

/** Sensor — small PCB + dome */
const SensorModule: React.FC = () => (
  <group>
    <mesh><boxGeometry args={[0.25, 0.04, 0.18]} /><meshStandardMaterial color={COLORS.pcbGreen} roughness={0.5} /></mesh>
    <mesh position={[0, 0.06, 0]}><sphereGeometry args={[0.06, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshPhysicalMaterial color="#E2E8F0" transmission={0.5} thickness={0.3} roughness={0.1} /></mesh>
    {/* Pins */}
    {Array.from({ length: 3 }).map((_, i) => (
      <mesh key={i} position={[-0.06 + i * 0.06, -0.04, 0]}><cylinderGeometry args={[0.008, 0.008, 0.06, 4]} /><meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.1} /></mesh>
    ))}
  </group>
);

/** Joystick — base + stick + ball */
const JoystickModule: React.FC = () => {
  const stickRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (stickRef.current) {
      const t = clock.getElapsedTime();
      stickRef.current.rotation.x = Math.sin(t * 0.8) * 0.15;
      stickRef.current.rotation.z = Math.cos(t * 0.6) * 0.12;
    }
  });
  return (
    <group>
      <mesh><cylinderGeometry args={[0.12, 0.14, 0.06, 16]} /><meshStandardMaterial color="#334155" metalness={0.4} roughness={0.4} /></mesh>
      <group ref={stickRef} position={[0, 0.03, 0]}>
        <mesh><cylinderGeometry args={[0.02, 0.025, 0.18, 8]} /><meshStandardMaterial color="#94A3B8" metalness={0.7} roughness={0.2} /></mesh>
        <mesh position={[0, 0.11, 0]}><sphereGeometry args={[0.04, 12, 12]} /><meshStandardMaterial color={COLORS.blue} roughness={0.3} /></mesh>
      </group>
    </group>
  );
};

/** Checklist — flat panel + animated checkmarks */
const ChecklistModule: React.FC = () => {
  const checkRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (checkRef.current) {
      // Show/hide checkmarks cyclically
      const phase = clock.getElapsedTime() % 4;
      checkRef.current.visible = phase < 2.5;
      checkRef.current.children.forEach((c, i) => {
        c.visible = phase > (i * 0.6 + 0.3);
      });
    }
  });
  return (
    <group>
      {/* Board */}
      <mesh><boxGeometry args={[0.3, 0.4, 0.02]} /><meshStandardMaterial color="#F8FAFC" roughness={0.6} /></mesh>
      {/* Lines */}
      {[0.12, 0, -0.12].map((y, i) => (
        <mesh key={i} position={[0.03, y, 0.012]}><boxGeometry args={[0.18, 0.015, 0.002]} /><meshBasicMaterial color="#CBD5E1" /></mesh>
      ))}
      {/* Checkmarks */}
      <group ref={checkRef}>
        {[0.12, 0, -0.12].map((y, i) => (
          <mesh key={i} position={[-0.1, y, 0.012]}><boxGeometry args={[0.04, 0.04, 0.002]} /><meshBasicMaterial color="#22C55E" /></mesh>
        ))}
      </group>
      {/* Clip at top */}
      <mesh position={[0, 0.22, 0]}><boxGeometry args={[0.1, 0.04, 0.04]} /><meshStandardMaterial color="#94A3B8" metalness={0.7} roughness={0.3} /></mesh>
    </group>
  );
};

/** Cloud — merged spheres */
const CloudModule: React.FC = () => {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      // Upload animation — small arrow moves up
      const arrow = ref.current.children[ref.current.children.length - 1];
      if (arrow) {
        const y = (clock.getElapsedTime() * 0.5) % 1;
        arrow.position.y = -0.02 + y * 0.15;
        (arrow as THREE.Mesh).visible = y < 0.8;
      }
    }
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0, 0]}><sphereGeometry args={[0.12, 16, 16]} /><meshPhysicalMaterial color="#E2E8F0" roughness={0.2} transmission={0.2} thickness={0.3} /></mesh>
      <mesh position={[-0.1, -0.02, 0]}><sphereGeometry args={[0.09, 12, 12]} /><meshPhysicalMaterial color="#E2E8F0" roughness={0.2} transmission={0.2} thickness={0.3} /></mesh>
      <mesh position={[0.1, -0.02, 0]}><sphereGeometry args={[0.09, 12, 12]} /><meshPhysicalMaterial color="#E2E8F0" roughness={0.2} transmission={0.2} thickness={0.3} /></mesh>
      <mesh position={[0, 0.06, 0]}><sphereGeometry args={[0.08, 12, 12]} /><meshPhysicalMaterial color="#F1F5F9" roughness={0.2} transmission={0.2} thickness={0.3} /></mesh>
      {/* Upload arrow */}
      <mesh position={[0, 0, 0]}>
        <coneGeometry args={[0.025, 0.06, 6]} />
        <meshBasicMaterial color={COLORS.blue} />
      </mesh>
    </group>
  );
};

/** Microchip — IC body + pin legs */
const MicrochipModule: React.FC = () => (
  <group>
    <mesh><boxGeometry args={[0.22, 0.04, 0.22]} /><meshStandardMaterial color={COLORS.chipDark} metalness={0.5} roughness={0.3} /></mesh>
    {/* Top marking */}
    <mesh position={[0, 0.022, 0]}><circleGeometry args={[0.02, 12]} /><meshBasicMaterial color="#475569" /></mesh>
    {/* Pin legs — four sides */}
    {Array.from({ length: 4 }).map((_, i) => {
      const side = i;
      return Array.from({ length: 3 }).map((_, j) => {
        const offset = -0.06 + j * 0.06;
        const pos: [number, number, number] =
          side === 0 ? [offset, -0.02, 0.13] :
          side === 1 ? [offset, -0.02, -0.13] :
          side === 2 ? [0.13, -0.02, offset] :
                       [-0.13, -0.02, offset];
        return (
          <mesh key={`${i}-${j}`} position={pos}>
            <boxGeometry args={[0.01, 0.03, 0.01]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.1} />
          </mesh>
        );
      });
    })}
  </group>
);

/** IoT Node — sphere + antenna + signal rings */
const IoTNodeModule: React.FC = () => {
  const ringsRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ringsRef.current) {
      const t = clock.getElapsedTime();
      ringsRef.current.children.forEach((ring, i) => {
        const phase = (t * 1.5 + i * 0.5) % 2;
        const scale = 1 + phase * 0.5;
        ring.scale.setScalar(scale);
        ((ring as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.4 - phase * 0.2);
      });
    }
  });
  return (
    <group>
      <mesh><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color={COLORS.signalGreen} emissive={COLORS.signalGreen} emissiveIntensity={0.5} /></mesh>
      {/* Antenna */}
      <mesh position={[0, 0.15, 0]}><cylinderGeometry args={[0.008, 0.008, 0.12, 4]} /><meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.2} /></mesh>
      <mesh position={[0, 0.22, 0]}><sphereGeometry args={[0.015, 8, 8]} /><meshStandardMaterial color={COLORS.signalGreen} emissive={COLORS.signalGreen} emissiveIntensity={2} /></mesh>
      {/* Signal rings */}
      <group ref={ringsRef} position={[0, 0.22, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.03, 0.035, 16]} />
            <meshBasicMaterial color={COLORS.signalGreen} transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

/* ────────────────────────────────────────────────────────────────────
   Module component lookup
   ──────────────────────────────────────────────────────────────────── */

const MODULE_COMPONENTS: Record<string, React.FC> = {
  arduino: ArduinoModule,
  esp32: ESP32Module,
  raspberrypi: RaspberryPiModule,
  python: PythonModule,
  blockly: BlocklyModule,
  circuit: CircuitModule,
  neuralnet: NeuralNetModule,
  robotarm: RobotArmModule,
  mobile: MobileModule,
  cube3d: Cube3DModule,
  drone: DroneModule,
  camera: CameraModule,
  sensor: SensorModule,
  joystick: JoystickModule,
  checklist: ChecklistModule,
  cloud: CloudModule,
  microchip: MicrochipModule,
  iotnode: IoTNodeModule,
};

/* ────────────────────────────────────────────────────────────────────
   Single orbiting module wrapper — handles orbital motion + float
   ──────────────────────────────────────────────────────────────────── */

interface OrbitWrapperProps {
  def: OrbitModuleDef;
}

const OrbitWrapper: React.FC<OrbitWrapperProps> = ({ def }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ModuleComponent = MODULE_COMPONENTS[def.id];

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    // Orbital position
    const angle = def.startAngle + t * def.speed;
    const x = Math.cos(angle) * def.radius;
    const z = Math.sin(angle) * def.radius;
    const y = def.height + Math.sin(t * def.floatFrequency) * def.floatAmplitude;

    groupRef.current.position.set(x, y, z);

    // Face roughly toward center (tangential tilt)
    groupRef.current.rotation.y = -angle + Math.PI / 2;
    // Slight tilt for organic feel
    groupRef.current.rotation.x = Math.sin(t * 0.3 + def.startAngle) * 0.05;
    groupRef.current.rotation.z = Math.cos(t * 0.25 + def.startAngle) * 0.04;
  });

  if (!ModuleComponent) return null;

  return (
    <group ref={groupRef}>
      <group scale={[def.scale, def.scale, def.scale]}>
        <ModuleComponent />
      </group>
    </group>
  );
};

/* ────────────────────────────────────────────────────────────────────
   Main OrbitModules component
   ──────────────────────────────────────────────────────────────────── */

const OrbitModules: React.FC = () => {
  return (
    <group>
      {ORBIT_MODULES.map((def) => (
        <OrbitWrapper key={def.id} def={def} />
      ))}
    </group>
  );
};

export default React.memo(OrbitModules);
