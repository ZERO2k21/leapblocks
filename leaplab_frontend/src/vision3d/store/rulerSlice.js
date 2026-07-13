/**
 * Vision3D - Ruler Slice
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import { log } from '../utils/logger';

export const createRulerSlice = (set, get) => ({
  rulerActive: false,
  rulerOrigin: null,
  rulerTarget: null,
  rulerMeasurements: [],

  toggleRuler: () => {
    const active = !get().rulerActive;
    log('toggleRuler:', active);
    set({ rulerActive: active, rulerOrigin: null, rulerTarget: null });
  },
  setRulerOrigin: (pos) => {
    log('setRulerOrigin:', pos);
    set({ rulerOrigin: pos });
  },
  setRulerTarget: (pos) => {
    log('setRulerTarget:', pos);
    set({ rulerTarget: pos });
  },
  clearRuler: () => {
    set({ rulerActive: false, rulerOrigin: null, rulerTarget: null, rulerMeasurements: [] });
  },
});
