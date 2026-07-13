/**
 * Vision3D - Marquee Slice
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

export const createMarqueeSlice = (set, get) => ({
  marqueeActive: false,
  marqueeStart: null,
  marqueeEnd: null,

  startMarquee: (point) => {
    set({ marqueeActive: true, marqueeStart: point, marqueeEnd: point });
  },
  updateMarquee: (point) => {
    set({ marqueeEnd: point });
  },
  endMarquee: () => {
    set({ marqueeActive: false, marqueeStart: null, marqueeEnd: null });
  },
});
