/**
 * Vision3D - Marquee Slice
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import type { StateCreator } from 'zustand'

interface Point {
  x: number
  y: number
}

interface MarqueeSliceState {
  marqueeActive: boolean
  marqueeStart: Point | null
  marqueeEnd: Point | null
}

interface MarqueeSliceActions {
  startMarquee: (point: Point) => void
  updateMarquee: (point: Point) => void
  endMarquee: () => void
}

export type MarqueeSlice = MarqueeSliceState & MarqueeSliceActions

export const createMarqueeSlice: StateCreator<MarqueeSlice, [], [], MarqueeSlice> = (set) => ({
  marqueeActive: false,
  marqueeStart: null,
  marqueeEnd: null,

  startMarquee: (point) => {
    set({ marqueeActive: true, marqueeStart: point, marqueeEnd: point })
  },
  updateMarquee: (point) => {
    set({ marqueeEnd: point })
  },
  endMarquee: () => {
    set({ marqueeActive: false, marqueeStart: null, marqueeEnd: null })
  },
})
