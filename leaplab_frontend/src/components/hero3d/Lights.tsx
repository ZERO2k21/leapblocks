/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * Lights.tsx — Scene lighting setup.
 * Soft ambient + directional key + blue/purple accents + HDRI environment.
 */

import React from 'react';
import { Environment } from '@react-three/drei';
import { COLORS } from './constants';

const Lights: React.FC = () => {
  return (
    <>
      {/* Soft ambient fill */}
      <ambientLight color={COLORS.ambientWhite} intensity={0.6} />

      {/* Main directional key light — top‑right */}
      <directionalLight
        position={[5, 8, 4]}
        intensity={1.0}
        color="#ffffff"
        castShadow={false}
      />

      {/* Rim / back light — cool tone */}
      <directionalLight
        position={[-4, 3, -5]}
        intensity={0.4}
        color="#c7d2fe"
      />

      {/* Blue accent point light */}
      <pointLight
        position={[3, 1, 2]}
        intensity={1.5}
        color={COLORS.blue}
        distance={10}
        decay={2}
      />

      {/* Purple accent point light */}
      <pointLight
        position={[-3, 2, -1]}
        intensity={1.2}
        color={COLORS.purple}
        distance={10}
        decay={2}
      />

      {/* Subtle HDRI environment for reflections (no background visible) */}
      <Environment preset="city" environmentIntensity={0.3} />
    </>
  );
};

export default React.memo(Lights);
