/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * useMouseParallax.ts — Custom hook that tracks normalised mouse position
 * and returns smoothly interpolated rotation values for the scene group.
 * Max rotation is clamped to ±8° (~0.14 rad).
 */

import { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { PARALLAX } from './constants';

interface ParallaxState {
  /** Current smoothed rotation X */
  rotationX: number;
  /** Current smoothed rotation Y */
  rotationY: number;
}

/**
 * Returns a ref object whose `.current` contains the smoothly
 * interpolated `rotationX` and `rotationY` values.
 * Designed to be read inside `useFrame` or applied to a group.
 */
export function useMouseParallax() {
  /** Raw target values (set directly from mousemove, no React state) */
  const targetRef = useRef({ x: 0, y: 0 });
  /** Smoothed output */
  const stateRef = useRef<ParallaxState>({ rotationX: 0, rotationY: 0 });

  /** Mousemove handler — runs outside React render cycle */
  const onMouseMove = useCallback((e: MouseEvent) => {
    // Normalise to -1 … +1
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    targetRef.current.x = nx;
    targetRef.current.y = ny;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [onMouseMove]);

  /** Lerp toward target every frame */
  useFrame(() => {
    const { damping, maxRotation } = PARALLAX;
    const s = stateRef.current;
    const t = targetRef.current;

    // Target rotation (inverted Y feels more natural)
    const targetRotY = t.x * maxRotation;
    const targetRotX = -t.y * maxRotation;

    s.rotationX += (targetRotX - s.rotationX) * damping;
    s.rotationY += (targetRotY - s.rotationY) * damping;
  });

  return stateRef;
}
