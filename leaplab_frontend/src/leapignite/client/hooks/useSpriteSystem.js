/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { useState, useCallback, useRef } from "react";

// Grid Constants (Junior is typically 20x15 grid)
const CELL_SIZE = 24;
const GRID_W = 20; // 480px
const GRID_H = 15; // 360px
// Stage Pixel Dimensions
const STAGE_WIDTH = GRID_W * CELL_SIZE; // 480
const STAGE_HEIGHT = GRID_H * CELL_SIZE; // 360

// Hiding/Peeking Constants
const PEEK_LIMIT = 20; // Pixels to keep visible
const SPRITE_DIM = 80; // Standard sprite bounding box (80x80)

/**
 * useSpriteSystem Hook
 * Manages the "Physics" and "State" of the sprites.
 * strictly enforcing boundaries and valid states.
 */
export function useSpriteSystem(initialScenes) {
    const [scenes, setScenes] = useState(initialScenes);
    const [currentSceneId, setCurrentSceneId] = useState(initialScenes[0]?.id || "scene1");
    // We track initial state for Reset functionality
    const initialStatesRef = useRef(new Map());

    const getStageBounds = () => {
        const stageEl = document.querySelector('.stage');
        return stageEl ? { w: stageEl.offsetWidth, h: stageEl.offsetHeight } : { w: STAGE_WIDTH, h: STAGE_HEIGHT };
    };

    const clampX = (x) => {
        const bounds = getStageBounds();
        return Math.max(0, Math.min(x, bounds.w - 100));
    };

    const clampY = (y) => {
        const bounds = getStageBounds();
        return Math.max(0, Math.min(y, bounds.h - 100));
    };

    const clampSize = (size) => Math.max(10, Math.min(300, size));

    // Capture initial state on first load (or add) for Reset
    // In a real app, this might be more robust
    const captureInitialState = useCallback((sprite) => {
        if (!initialStatesRef.current.has(sprite.id)) {
            initialStatesRef.current.set(sprite.id, { ...sprite });
        }
    }, []);

    // Core Update Logic
    const updateSprite = useCallback((spriteId, updates) => {
        setScenes(prev => prev.map(scene => {
            return {
                ...scene,
                sprites: scene.sprites.map(sprite => {
                    if (sprite.id !== spriteId) return sprite;

                    captureInitialState(sprite); // Ensure we have a reset point

                    // Calculate New State
                    let newState = { ...sprite };
                    const actualUpdates = typeof updates === 'function' ? updates(sprite) : updates;

                    // Apply Updates
                    for (const key in actualUpdates) {
                        const val = actualUpdates[key];
                        newState[key] = typeof val === 'function' ? val(sprite[key]) : val;
                    }

                    // Enforce Logic (Clamping)
                    if (newState.x !== undefined) newState.x = clampX(newState.x);
                    if (newState.y !== undefined) newState.y = clampY(newState.y);

                    if (newState.size !== undefined) {
                        newState.size = clampSize(newState.size);
                    }

                    return newState;
                })
            };
        }));
    }, [captureInitialState]);

    // Actions exposed to Interpreter
    const actions = {
        // Move with Clamping
        moveRelative: (spriteId, direction, steps = 1) => {
            updateSprite(spriteId, (prev) => {
                let { x, y } = prev;
                const distance = CELL_SIZE * Math.max(1, Number(steps) || 1);
                let newX = x, newY = y;
                switch (direction) {
                    case "UP": newY = y - distance; break;
                    case "DOWN": newY = y + distance; break;
                    case "LEFT": newX = x - distance; break;
                    case "RIGHT": newX = x + distance; break;
                }
                if (window._spritePenCallbacks?.[spriteId]) {
                    window._spritePenCallbacks[spriteId](spriteId, x, y, newX, newY);
                }
                return { x: newX, y: newY };
            });
        },

        // Go To Grid Location (-1-22, -1-20)
        goToGrid: (spriteId, gridX, gridY) => {
            const safeX = Math.max(-1, Math.min(22, Number(gridX) || 0));
            const safeY = Math.max(-1, Math.min(20, Number(gridY) || 0));
            const px = (safeX - 1) * CELL_SIZE;
            const py = STAGE_HEIGHT - (safeY * CELL_SIZE); // Junior Y=1 is Bottom
            updateSprite(spriteId, (prev) => {
                if (window._spritePenCallbacks?.[spriteId]) {
                    window._spritePenCallbacks[spriteId](spriteId, prev.x, prev.y, px, py);
                }
                return { x: px, y: py };
            });
        },

        nextCostume: (spriteId) => {
            updateSprite(spriteId, (prev) => {
                const costumeKeys = Object.keys(prev.costumes);
                if (costumeKeys.length === 0) return {};
                const currentIndex = costumeKeys.indexOf(prev.currentCostume);
                const nextIndex = (currentIndex + 1) % costumeKeys.length;
                return { currentCostume: costumeKeys[nextIndex] };
            });
        },

        resetAll: () => {
            setScenes(prev => prev.map(scene => {
                return {
                    ...scene,
                    sprites: scene.sprites.map(sprite => {
                        const init = initialStatesRef.current.get(sprite.id);
                        return init ? { ...init, blocks: sprite.blocks } : sprite; // Keep current blocks
                    })
                };
            }));
        },

        // Soft reset: clears visual state but preserves each sprite's current position
        // Used by green flag so sprites execute from where the user placed them
        softResetAll: () => {
            setScenes(prev => prev.map(scene => {
                return {
                    ...scene,
                    sprites: scene.sprites.map(sprite => ({
                        ...sprite,
                        angle: 0,
                        visible: true,
                        currentCostume: "default",
                        speech: null,
                        mirrored: false,
                        textColor: sprite.textColor || "#FF8C1A",
                        // x, y, size are PRESERVED — sprites keep user-set values
                    }))
                };
            }));
        },

        // Generic accessor
        update: updateSprite
    };

    return {
        scenes,
        setScenes,
        currentSceneId,
        setCurrentSceneId,
        actions
    };
}
