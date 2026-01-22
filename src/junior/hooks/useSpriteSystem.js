import { useState, useCallback, useRef } from "react";

// Grid Constants (Junior is typically 20x15 grid)
const CELL_SIZE = 24;
const GRID_W = 20; // 480px
const GRID_H = 15; // 360px
// Stage Pixel Dimensions
const STAGE_WIDTH = GRID_W * CELL_SIZE; // 480
const STAGE_HEIGHT = GRID_H * CELL_SIZE; // 360

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
    const clampX = (x) => Math.max(0, Math.min(x, STAGE_WIDTH));
    const clampY = (y) => Math.max(0, Math.min(y, STAGE_HEIGHT));

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

                    // Apply Functional Updates
                    for (const key in updates) {
                        const val = updates[key];
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
        moveRelative: (spriteId, direction) => {
            updateSprite(spriteId, (prev) => {
                let { x, y } = prev;
                switch (direction) {
                    case "UP": y -= CELL_SIZE; break;
                    case "DOWN": y += CELL_SIZE; break;
                    case "LEFT": x -= CELL_SIZE; break; // Inverted? No, 0 is left.
                    // Wait, Junior Grid: 1 is Left, 20 is Right.
                    // Pixels: 0 is Left.
                    // "Move Right" -> Increase X.
                    // "Move Left" -> Decrease X.
                    case "RIGHT": x += CELL_SIZE; break;
                }
                return { x, y };
            });
        },

        // Go To Grid Location (1-20, 1-15)
        goToGrid: (spriteId, gridX, gridY) => {
            const px = (gridX - 1) * CELL_SIZE;
            const py = STAGE_HEIGHT - (gridY * CELL_SIZE); // Junior Y=1 is Bottom
            updateSprite(spriteId, { x: px, y: py });
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
