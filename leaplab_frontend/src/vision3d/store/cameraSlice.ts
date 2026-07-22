/**
 * Vision3D - Camera Slice
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import type { StateCreator } from 'zustand'
import { log } from '../utils/logger'

interface ShapeRef {
  id: string
  position: [number, number, number]
}

interface CameraSliceState {
  cameraPosition: [number, number, number]
  cameraMode: 'perspective' | 'orthographic'
  fitSelectionTarget: [number, number, number] | null
  fitAllTarget: [number, number, number] | null
}

interface CameraSliceActions {
  setCameraMode: (mode: 'perspective' | 'orthographic') => void
  toggleCameraMode: () => void
  setFitSelection: (ids: string[]) => void
  setFitAll: () => void
}

export type CameraSlice = CameraSliceState & CameraSliceActions

interface StoreState extends CameraSliceState {
  shapes: ShapeRef[]
}

export const createCameraSlice: StateCreator<StoreState, [], [], CameraSlice> = (set, get) => ({
  cameraPosition: [8, 6, 8],
  cameraMode: 'perspective',
  fitSelectionTarget: null,
  fitAllTarget: null,

  setCameraMode: (mode) => {
    log('setCameraMode:', mode)
    set({ cameraMode: mode })
  },
  toggleCameraMode: () => {
    const current = get().cameraMode
    const next = current === 'perspective' ? 'orthographic' : 'perspective'
    log('toggleCameraMode:', current, '->', next)
    set({ cameraMode: next })
  },

  setFitSelection: (ids) => {
    const state = get()
    const selected = state.shapes.filter((s) => ids.includes(s.id))
    if (selected.length === 0) return
    const center = selected.reduce(
      (acc, s) => [acc[0] + s.position[0], acc[1] + s.position[1], acc[2] + s.position[2]],
      [0, 0, 0]
    )
    center[0] /= selected.length
    center[1] /= selected.length
    center[2] /= selected.length
    log('setFitSelection:', center)
    set({ fitSelectionTarget: center as [number, number, number] })
    setTimeout(() => set({ fitSelectionTarget: null }), 100)
  },

  setFitAll: () => {
    const state = get()
    if (state.shapes.length === 0) return
    const center = state.shapes.reduce(
      (acc, s) => [acc[0] + s.position[0], acc[1] + s.position[1], acc[2] + s.position[2]],
      [0, 0, 0]
    )
    center[0] /= state.shapes.length
    center[1] /= state.shapes.length
    center[2] /= state.shapes.length
    log('setFitAll:', center)
    set({ fitAllTarget: center as [number, number, number] })
    setTimeout(() => set({ fitAllTarget: null }), 100)
  },
})
