/**
 * Vision3D - Material Library
 * Preset materials for quick application.
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

export interface MaterialPreset {
  id: string
  name: string
  category: string
  color: string
  metalness: number
  roughness: number
  opacity?: number
  icon: string
}

interface MaterialCategory {
  id: string
  name: string
  icon: string
}

export const MATERIAL_PRESETS: MaterialPreset[] = [
  { id: 'steel', name: 'Steel', category: 'metal', color: '#8C8C8C', metalness: 0.9, roughness: 0.2, icon: '⚙️' },
  { id: 'aluminum', name: 'Aluminum', category: 'metal', color: '#C0C0C0', metalness: 0.85, roughness: 0.15, icon: '⚙️' },
  { id: 'gold', name: 'Gold', category: 'metal', color: '#FFD700', metalness: 0.95, roughness: 0.1, icon: '🥇' },
  { id: 'copper', name: 'Copper', category: 'metal', color: '#B87333', metalness: 0.9, roughness: 0.25, icon: '🪙' },
  { id: 'bronze', name: 'Bronze', category: 'metal', color: '#CD7F32', metalness: 0.85, roughness: 0.3, icon: '🪙' },
  { id: 'chrome', name: 'Chrome', category: 'metal', color: '#E8E8E8', metalness: 0.95, roughness: 0.05, icon: '✨' },
  { id: 'plastic_white', name: 'White Plastic', category: 'plastic', color: '#F5F5F5', metalness: 0.0, roughness: 0.5, icon: '⬜' },
  { id: 'plastic_black', name: 'Black Plastic', category: 'plastic', color: '#1A1A1A', metalness: 0.0, roughness: 0.4, icon: '⬛' },
  { id: 'plastic_red', name: 'Red Plastic', category: 'plastic', color: '#E63946', metalness: 0.0, roughness: 0.45, icon: '🟥' },
  { id: 'plastic_blue', name: 'Blue Plastic', category: 'plastic', color: '#457B9D', metalness: 0.0, roughness: 0.45, icon: '🟦' },
  { id: 'plastic_green', name: 'Green Plastic', category: 'plastic', color: '#2A9D8F', metalness: 0.0, roughness: 0.45, icon: '🟩' },
  { id: 'plastic_yellow', name: 'Yellow Plastic', category: 'plastic', color: '#E9C46A', metalness: 0.0, roughness: 0.45, icon: '🟨' },
  { id: 'oak', name: 'Oak Wood', category: 'wood', color: '#C4A77D', metalness: 0.0, roughness: 0.8, icon: '🪵' },
  { id: 'walnut', name: 'Walnut', category: 'wood', color: '#5C4033', metalness: 0.0, roughness: 0.75, icon: '🪵' },
  { id: 'pine', name: 'Pine', category: 'wood', color: '#DEB887', metalness: 0.0, roughness: 0.85, icon: '🪵' },
  { id: 'glass_clear', name: 'Clear Glass', category: 'glass', color: '#FFFFFF', metalness: 0.0, roughness: 0.05, opacity: 0.3, icon: '🪟' },
  { id: 'glass_tinted', name: 'Tinted Glass', category: 'glass', color: '#87CEEB', metalness: 0.0, roughness: 0.05, opacity: 0.4, icon: '🪟' },
  { id: 'rubber_black', name: 'Black Rubber', category: 'rubber', color: '#2D2D2D', metalness: 0.0, roughness: 0.95, icon: '⚫' },
  { id: 'rubber_red', name: 'Red Rubber', category: 'rubber', color: '#CC3333', metalness: 0.0, roughness: 0.9, icon: '🔴' },
  { id: 'concrete', name: 'Concrete', category: 'stone', color: '#A9A9A9', metalness: 0.0, roughness: 0.9, icon: '🧱' },
  { id: 'marble', name: 'Marble', category: 'stone', color: '#F0EDE5', metalness: 0.1, roughness: 0.2, icon: '🪨' },
]

export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  { id: 'metal', name: 'Metal', icon: '⚙️' },
  { id: 'plastic', name: 'Plastic', icon: '🎨' },
  { id: 'wood', name: 'Wood', icon: '🪵' },
  { id: 'glass', name: 'Glass', icon: '🪟' },
  { id: 'rubber', name: 'Rubber', icon: '⚫' },
  { id: 'stone', name: 'Stone', icon: '🪨' },
]

export function getMaterialPreset(id: string): MaterialPreset | undefined {
  return MATERIAL_PRESETS.find((m) => m.id === id)
}

export function getMaterialsByCategory(category: string): MaterialPreset[] {
  return MATERIAL_PRESETS.filter((m) => m.category === category)
}

export function applyMaterialToShape<T extends Record<string, unknown>>(
  shape: T,
  presetId: string
): T {
  const preset = getMaterialPreset(presetId)
  if (!preset) return shape

  return {
    ...shape,
    color: preset.color,
    metalness: preset.metalness,
    roughness: preset.roughness,
    opacity: preset.opacity ?? 1,
    materialPreset: presetId,
  } as T
}
