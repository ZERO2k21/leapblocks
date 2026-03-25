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

    // Helper: Clamp values to Stage Boundaries
    // Allows sprites to partially hide/peek (PEEK_LIMIT) from all edges
    const clampX = (x) => Math.max(-(SPRITE_DIM - PEEK_LIMIT), Math.min(x, STAGE_WIDTH - PEEK_LIMIT));
    const clampY = (y) => Math.max(-(SPRITE_DIM - PEEK_LIMIT), Math.min(y, STAGE_HEIGHT - PEEK_LIMIT));

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
            if (scene.id !== currentSceneId) return scene;

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

                    // Logic: Size Limits
                    if (newState.size !== undefined) {
                        if (newState.size < 10) newState.size = 10;
                        if (newState.size > 300) newState.size = 300;
                    }

                    return newState;
                })
            };
        }));
    }, [currentSceneId, captureInitialState]);

    // Actions exposed to Interpreter
    const actions = {
        // Move with Clamping
        moveRelative: (spriteId, direction, steps = 1) => {
            updateSprite(spriteId, (prev) => {
                let { x, y } = prev;
                const distance = CELL_SIZE * Math.max(1, Number(steps) || 1);
                switch (direction) {
                    case "UP": y -= distance; break;
                    case "DOWN": y += distance; break;
                    case "LEFT": x -= distance; break;
                    case "RIGHT": x += distance; break;
                }
                return { x, y };
            });
        },

        // Go To Grid Location (1-20, 1-15)
        goToGrid: (spriteId, gridX, gridY) => {
            const safeX = Math.max(1, Math.min(GRID_W, Number(gridX) || 1));
            const safeY = Math.max(1, Math.min(GRID_H, Number(gridY) || 1));
            const px = (safeX - 1) * CELL_SIZE;
            const py = STAGE_HEIGHT - (safeY * CELL_SIZE); // Junior Y=1 is Bottom
            updateSprite(spriteId, { x: px, y: py });
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
                        size: 100,
                        visible: true,
                        currentCostume: "default",
                        speech: null,
                        mirrored: false,
                        textColor: sprite.textColor || "#FF8C1A",
                        // x, y are PRESERVED — sprites stay where user placed them
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
