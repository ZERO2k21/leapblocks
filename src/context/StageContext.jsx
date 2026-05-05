/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

// ─── Unified Sprite Data Structure ─────────────────────────────────────────
// This structure is shared across all programming modes
const createDefaultSprite = (id, name, type = 'robot') => ({
    id,
    name,
    type,
    position: { x: 0, y: 0 },
    direction: 0,
    size: 100,
    visible: true,
    currentCostume: 'default',
    costumes: {},
    sounds: [],
    speech: '',
    mirrored: false,
    variables: {},
    lists: {},
    scripts: {
        juniorBlocks: [],
        intermediateBlocks: [],
        python: '',
        notebookCells: []
    }
});

// ─── Default Sprites ───────────────────────────────────────────────────────
const DEFAULT_SPRITES = [
    {
        id: 'robot-1',
        name: 'Robot',
        type: 'robot',
        position: { x: 0, y: 0 },
        direction: 0,
        size: 100,
        visible: true,
        currentCostume: 'default',
        costumes: {
            default: "assets/sprites/robot/robot_idle.svg",
            wave1: "assets/sprites/robot/robot_wave1.svg",
            wave2: "assets/sprites/robot/robot_wave2.svg",
            talk: "assets/sprites/robot/robot_talk1.svg"
        },
        sounds: [],
        speech: '',
        mirrored: false,
        variables: {},
        lists: {},
        scripts: {
            juniorBlocks: [],
            intermediateBlocks: [],
            python: '',
            notebookCells: []
        }
    }
];

// ─── Sprite Library Presets ────────────────────────────────────────────────
export const SPRITE_PRESETS = {
    robot: {
        name: 'Robot',
        type: 'robot',
        costumes: {
            default: "assets/sprites/robot/robot_idle.svg",
            wave1: "assets/sprites/robot/robot_wave1.svg",
            wave2: "assets/sprites/robot/robot_wave2.svg",
            talk: "assets/sprites/robot/robot_talk1.svg"
        }
    },
    cat: {
        name: 'Cat',
        type: 'cat',
        costumes: {
            default: "assets/sprites/cat/cat_idle.svg",
            walk1: "assets/sprites/cat/cat_walk1.svg",
            walk2: "assets/sprites/cat/cat_walk2.svg"
        }
    },
    ball: {
        name: 'Ball',
        type: 'ball',
        costumes: {
            default: "assets/sprites/ball/ball.svg"
        }
    },
    abby: {
        name: 'Abby',
        type: 'people',
        costumes: {
            default: "👩",
            walking: "🚶‍♀️"
        }
    },
    dog: {
        name: 'Dog',
        type: 'dog',
        costumes: {
            default: "🐶",
            walk1: "🐕",
            walk2: "🐕‍🦺"
        }
    }
};

// ─── Stage Context ─────────────────────────────────────────────────────────
const StageContext = createContext(null);

export function StageProvider({ children }) {
    // Sprites state (shared across all modes)
    const [sprites, setSprites] = useState(DEFAULT_SPRITES);
    const [selectedSpriteId, setSelectedSpriteId] = useState('robot-1');
    
    // Stage state
    const [backdrop, setBackdrop] = useState(null);
    const [stageSize, setStageSize] = useState({ w: 480, h: 360 });
    const stageRef = useRef(null);
    
    // Backdrop library
    const [backdropLibrary] = useState([
        { name: 'Blank', img: null },
        { name: 'Blue Sky', img: 'assets/backdrops/blue_sky.svg' },
        { name: 'City', img: 'assets/backdrops/city.svg' },
        { name: 'Forest', img: 'assets/backdrops/forest.svg' },
        { name: 'Space', img: 'assets/backdrops/space.svg' }
    ]);

    // ─── Sprite Actions ─────────────────────────────────────────────────────
    const addSprite = useCallback((spriteData) => {
        const newSprite = {
            ...createDefaultSprite(`sprite-${Date.now()}`, spriteData.name || 'Sprite', spriteData.type),
            ...spriteData,
            id: `sprite-${Date.now()}`
        };
        setSprites(prev => [...prev, newSprite]);
        setSelectedSpriteId(newSprite.id);
        return newSprite.id;
    }, []);

    const deleteSprite = useCallback((spriteId) => {
        setSprites(prev => {
            const filtered = prev.filter(s => s.id !== spriteId);
            // If we deleted the selected sprite, select the first one
            if (spriteId === selectedSpriteId && filtered.length > 0) {
                setSelectedSpriteId(filtered[0].id);
            }
            return filtered;
        });
    }, [selectedSpriteId]);

    const updateSprite = useCallback((spriteId, updates) => {
        setSprites(prev => prev.map(s => 
            s.id === spriteId ? { ...s, ...updates } : s
        ));
    }, []);

    const updateSpriteProperty = useCallback((spriteId, property, value) => {
        setSprites(prev => prev.map(s => {
            if (s.id !== spriteId) return s;
            
            // Handle nested properties
            if (property === 'x' || property === 'y') {
                return { ...s, position: { ...s.position, [property]: value } };
            }
            return { ...s, [property]: value };
        }));
    }, []);

    const duplicateSprite = useCallback((spriteId) => {
        const spriteToDuplicate = sprites.find(s => s.id === spriteId);
        if (!spriteToDuplicate) return null;
        
        const newSprite = {
            ...JSON.parse(JSON.stringify(spriteToDuplicate)),
            id: `sprite-${Date.now()}`,
            name: `${spriteToDuplicate.name} (copy)`,
            position: { x: spriteToDuplicate.position.x + 20, y: spriteToDuplicate.position.y - 20 }
        };
        setSprites(prev => [...prev, newSprite]);
        setSelectedSpriteId(newSprite.id);
        return newSprite.id;
    }, [sprites]);

    // ─── Backdrop Actions ───────────────────────────────────────────────────
    const setBackdropByName = useCallback((backdropName) => {
        const found = backdropLibrary.find(b => b.name === backdropName);
        setBackdrop(found?.img || null);
    }, [backdropLibrary]);

    const setBackdropByImg = useCallback((img) => {
        setBackdrop(img);
    }, []);

    // ─── Stage Actions ──────────────────────────────────────────────────────
    const resetStage = useCallback(() => {
        setSprites(DEFAULT_SPRITES);
        setSelectedSpriteId('robot-1');
        setBackdrop(null);
    }, []);

    // ─── Getters ────────────────────────────────────────────────────────────
    const selectedSprite = sprites.find(s => s.id === selectedSpriteId) || null;

    // ─── Window Global for Drag Support ─────────────────────────────────────
    useEffect(() => {
        window.updateSprite = (spriteIdOrName, updates) => {
            setSprites(prev => prev.map(s => {
                // Match by ID or by name (case-insensitive)
                if (s.id !== spriteIdOrName && s.name.toLowerCase() !== String(spriteIdOrName).toLowerCase()) {
                    return s;
                }
                // Handle position updates from drag
                if (updates.x !== undefined || updates.y !== undefined) {
                    return { 
                        ...s, 
                        position: {
                            ...s.position,
                            ...(updates.x !== undefined && { x: updates.x }),
                            ...(updates.y !== undefined && { y: updates.y })
                        },
                        ...updates
                    };
                }
                return { ...s, ...updates };
            }));
        };
        
        return () => {
            delete window.updateSprite;
        };
    }, []);

    // ─── Stage Size Observer ────────────────────────────────────────────────
    useEffect(() => {
        if (!stageRef.current) return;
        
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    setStageSize({ w: width, h: height });
                }
            }
        });
        
        observer.observe(stageRef.current);
        return () => observer.disconnect();
    }, []);

    const value = {
        // State
        sprites,
        setSprites,
        selectedSpriteId,
        setSelectedSpriteId,
        selectedSprite,
        backdrop,
        stageSize,
        stageRef,
        backdropLibrary,
        
        // Sprite Actions
        addSprite,
        deleteSprite,
        updateSprite,
        updateSpriteProperty,
        duplicateSprite,
        
        // Backdrop Actions
        setBackdrop: setBackdropByImg,
        setBackdropByName,
        
        // Stage Actions
        resetStage,
        setStageSize
    };

    return (
        <StageContext.Provider value={value}>
            {children}
        </StageContext.Provider>
    );
}

export function useStage() {
    const context = useContext(StageContext);
    if (!context) {
        throw new Error('useStage must be used within a StageProvider');
    }
    return context;
}

export default StageContext;
