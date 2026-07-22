/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { useState, useCallback } from "react"
import { FULL_CATALOG, type SpriteEntry } from "../../../components/SpriteLibrary"

interface Sprite {
  id: string
  name: string
  type: string
  position: { x: number; y: number }
  direction: number
  size: number
  visible: boolean
  speech: string
  currentCostume: string
  costumes: Record<string, string>
  mirrored: boolean
}

interface LibrarySprite {
  name: string
  img: string
  type: string
  costumes: string[]
  category: string
}

interface UseSpriteManagerProps {
  sprites: Sprite[]
  setSprites: React.Dispatch<React.SetStateAction<Sprite[]>>
  setSelectedSpriteId: (id: string) => void
  addLog: (message: string, type: string) => void
}

let _SPRITE_LIBRARY: LibrarySprite[] | undefined

function getSpriteLibrary(): LibrarySprite[] {
  if (!_SPRITE_LIBRARY) {
    _SPRITE_LIBRARY = FULL_CATALOG.map((sprite: SpriteEntry) => ({
      name: sprite.name,
      img: sprite.image || sprite.emoji,
      type: sprite.id,
      costumes: sprite.costumes || [],
      category: sprite.category,
    }))
  }
  return _SPRITE_LIBRARY
}

export function useSpriteManager({ sprites, setSprites, setSelectedSpriteId, addLog }: UseSpriteManagerProps) {
  const [showSpriteLibrary, setShowSpriteLibrary] = useState(false)
  const [libraryMode, setLibraryMode] = useState("sprite")

  const addSpriteFromLibrary = useCallback((sp: { name: string; img?: string; image?: string; emoji?: string; costumes?: string[]; type?: string }) => {
    const id = sp.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    const spriteImage = sp.img || sp.image || sp.emoji || 'assets/sprites/robot/robot_idle.svg'
    const spriteCostumes = sp.costumes && sp.costumes.length > 0
      ? sp.costumes.reduce((acc, c, i) => ({ ...acc, [`costume_${i}`]: c }), { default: spriteImage } as Record<string, string>)
      : { default: spriteImage }
    const newSprite: Sprite = {
      id,
      name: sp.name,
      type: sp.type || 'sprite',
      position: { x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80 },
      direction: 0,
      size: 100,
      visible: true,
      speech: '',
      currentCostume: 'default',
      costumes: spriteCostumes,
      mirrored: false,
    }
    setSprites(prev => [...prev, newSprite])
    setSelectedSpriteId(id)
    addLog('Added sprite: ' + sp.name, 'success')
  }, [setSprites, setSelectedSpriteId, addLog])

  const onOpenAssetLibrary = useCallback((mode?: string) => {
    setLibraryMode(mode || "sprite")
    setShowSpriteLibrary(true)
  }, [])

  return {
    showSpriteLibrary,
    setShowSpriteLibrary,
    libraryMode,
    setLibraryMode,
    addSpriteFromLibrary,
    onOpenAssetLibrary,
    getSpriteLibrary,
  }
}

export default useSpriteManager
