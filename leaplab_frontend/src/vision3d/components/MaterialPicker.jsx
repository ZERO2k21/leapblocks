/**
 * Vision3D - Material Picker Component
 * Quick access to material presets.
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React, { useState } from 'react';
import { use3DStore } from '../store/use3DStore';
import { MATERIAL_PRESETS, MATERIAL_CATEGORIES } from '../utils/materialLibrary';
import { log } from '../utils/logger';

export const MaterialPicker = ({ onClose }) => {
  const [activeCategory, setActiveCategory] = useState('metal');
  const selectedIds = use3DStore((s) => s.selectedIds);
  const applyMaterialPreset = use3DStore((s) => s.applyMaterialPreset);

  const filteredMaterials = MATERIAL_PRESETS.filter(m => m.category === activeCategory);

  const handleApply = (preset) => {
    log('MaterialPicker: apply', preset.id);
    applyMaterialPreset(preset);
    onClose?.();
  };

  if (selectedIds.length === 0) {
    return (
      <div className="material-picker">
        <div className="material-picker-header">
          <span>Material Library</span>
          <button onClick={onClose} className="close-btn">x</button>
        </div>
        <div className="material-picker-empty">
          Select an object first
        </div>
      </div>
    );
  }

  return (
    <div className="material-picker">
      <div className="material-picker-header">
        <span>Material Library</span>
        <button onClick={onClose} className="close-btn">x</button>
      </div>

      <div className="material-categories">
        {MATERIAL_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      <div className="material-grid">
        {filteredMaterials.map(preset => (
          <button
            key={preset.id}
            className="material-swatch"
            onClick={() => handleApply(preset)}
            title={preset.name}
          >
            <div
              className="swatch-preview"
              style={{
                backgroundColor: preset.color,
                opacity: preset.opacity ?? 1,
                border: preset.metalness > 0.5 ? '2px solid #666' : '2px solid #ddd',
              }}
            />
            <span className="swatch-name">{preset.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
