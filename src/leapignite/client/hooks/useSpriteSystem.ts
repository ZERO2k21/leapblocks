/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { useState, useCallback, useRef } from "react";
import { JuniorScene, JuniorSprite } from "../types";

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
export function useSpriteSystem(initialScenes: JuniorScene[]) {
    const [scenes, setScenes] = useState<JuniorScene[]>(initialScenes);
    const [currentSceneId, setCurrentSceneId] = useState<string>(initialScenes[0]?.id || "scene1");
    // We track initial state for Reset functionality
    const initialStatesRef = useRef<Map<string, JuniorSprite>>(new Map());

    const getStageBounds = () => {
        const stageEl = document.querySelector('.stage') as HTMLElement;
        return stageEl ? { w: stageEl.offsetWidth, h: stageEl.offsetHeight } : { w: STAGE_WIDTH, h: STAGE_HEIGHT };
    };

    const clampX = (x: number) => {
        const bounds = getStageBounds();
        return Math.max(0, Math.min(x, bounds.w - 100));
    };

    const clampY = (y: number) => {
        const bounds = getStageBounds();
        return Math.max(0, Math.min(y, bounds.h - 100));
    };

    // Capture initial state on first load (or add) for Reset
    const captureInitialState = useCallback((sprite: JuniorSprite) => {
        if (!initialStatesRef.current.has(sprite.id)) {
            initialStatesRef.current.set(sprite.id, { ...sprite });
        }
    }, []);

    // Core Update Logic
    const updateSprite = useCallback((spriteId: string, updates: Partial<JuniorSprite> | ((prev: JuniorSprite) => Partial<JuniorSprite>)) => {
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
                        const val = (actualUpdates as any)[key];
                        (newState as any)[key] = typeof val === 'function' ? val((sprite as any)[key]) : val;
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
        moveRelative: (spriteId: string, direction: "UP" | "DOWN" | "LEFT" | "RIGHT", steps: number = 1) => {
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

        // Go To Grid Location (-1-22, -1-20)
        goToGrid: (spriteId: string, gridX: number, gridY: number) => {
            const safeX = Math.max(-1, Math.min(22, Number(gridX) || 0));
            const safeY = Math.max(-1, Math.min(20, Number(gridY) || 0));
            const px = (safeX - 1) * CELL_SIZE;
            const py = STAGE_HEIGHT - (safeY * CELL_SIZE); // Junior Y=1 is Bottom
            updateSprite(spriteId, { x: px, y: py });
        },

        nextCostume: (spriteId: string) => {
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
