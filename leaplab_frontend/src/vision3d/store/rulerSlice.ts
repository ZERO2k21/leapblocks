/**
 * Vision3D - Ruler Slice
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import type { StateCreator } from 'zustand'
import { log } from '../utils/logger'

type Vec3 = [number, number, number]

interface RulerSliceState {
  rulerActive: boolean
  rulerOrigin: Vec3 | null
  rulerTarget: Vec3 | null
  rulerMeasurements: Vec3[]
}

interface RulerSliceActions {
  toggleRuler: () => void
  setRulerOrigin: (pos: Vec3) => void
  setRulerTarget: (pos: Vec3) => void
  clearRuler: () => void
}

export type RulerSlice = RulerSliceState & RulerSliceActions

export const createRulerSlice: StateCreator<RulerSlice, [], [], RulerSlice> = (set, get) => ({
  rulerActive: false,
  rulerOrigin: null,
  rulerTarget: null,
  rulerMeasurements: [],

  toggleRuler: () => {
    const active = !get().rulerActive
    log('toggleRuler:', active)
    set({ rulerActive: active, rulerOrigin: null, rulerTarget: null })
  },
  setRulerOrigin: (pos) => {
    log('setRulerOrigin:', pos)
    set({ rulerOrigin: pos })
  },
  setRulerTarget: (pos) => {
    log('setRulerTarget:', pos)
    set({ rulerTarget: pos })
  },
  clearRuler: () => {
    set({ rulerActive: false, rulerOrigin: null, rulerTarget: null, rulerMeasurements: [] })
  },
})
