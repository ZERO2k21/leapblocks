import { useState, useCallback, useRef } from "react";

const CELL_SIZE = 24;
const GRID_W = 20;
const GRID_H = 15;
const STAGE_WIDTH = GRID_W * CELL_SIZE;
const STAGE_HEIGHT = GRID_H * CELL_SIZE;
const PEEK_LIMIT = 20;
const SPRITE_DIM = 80;

interface StageBounds {
    w: number;
    h: number;
}

interface SpriteState {
    id: string;
    x: number;
    y: number;
    angle: number;
    size: number;
    visible: boolean;
    mirrored: boolean;
    costumes: Record<string, string>;
    currentCostume: string;
    speech: string | null;
    blocks?: any;
    [key: string]: any;
}

interface SceneState {
    id: string;
    name: string;
    background: string;
    backgroundImage?: string | null;
    backdropName?: string;
    sprites: SpriteState[];
    [key: string]: any;
}

type SpriteUpdates = Partial<SpriteState> | ((prev: SpriteState) => Partial<SpriteState>);

interface SpriteActions {
    moveRelative: (spriteId: string, direction: string, steps?: number) => void;
    goToGrid: (spriteId: string, gridX: number, gridY: number) => void;
    nextCostume: (spriteId: string) => void;
    resetAll: () => void;
    softResetAll: () => void;
    update: (spriteId: string, updates: SpriteUpdates) => void;
}

interface UseSpriteSystemReturn {
    scenes: SceneState[];
    setScenes: React.Dispatch<React.SetStateAction<SceneState[]>>;
    currentSceneId: string;
    setCurrentSceneId: React.Dispatch<React.SetStateAction<string>>;
    actions: SpriteActions;
}

declare global {
    interface Window {
        _spritePenCallbacks?: Record<string, (spriteId: string, fromX: number, fromY: number, toX: number, toY: number) => void>;
    }
}

export function useSpriteSystem(initialScenes: SceneState[]): UseSpriteSystemReturn {
    const [scenes, setScenes] = useState<SceneState[]>(initialScenes);
    const [currentSceneId, setCurrentSceneId] = useState<string>(initialScenes[0]?.id || "scene1");
    const initialStatesRef = useRef<Map<string, SpriteState>>(new Map());

    const getStageBounds = (): StageBounds => {
        const stageEl = document.querySelector('.stage');
        return stageEl ? { w: stageEl.offsetWidth, h: stageEl.offsetHeight } : { w: STAGE_WIDTH, h: STAGE_HEIGHT };
    };

    const clampX = (x: number): number => {
        const bounds = getStageBounds();
        return Math.max(0, Math.min(x, bounds.w - 100));
    };

    const clampY = (y: number): number => {
        const bounds = getStageBounds();
        return Math.max(0, Math.min(y, bounds.h - 100));
    };

    const clampSize = (size: number): number => Math.max(10, Math.min(300, size));

    const captureInitialState = useCallback((sprite: SpriteState) => {
        if (!initialStatesRef.current.has(sprite.id)) {
            initialStatesRef.current.set(sprite.id, { ...sprite });
        }
    }, []);

    const updateSprite = useCallback((spriteId: string, updates: SpriteUpdates) => {
        setScenes(prev => prev.map(scene => {
            return {
                ...scene,
                sprites: scene.sprites.map(sprite => {
                    if (sprite.id !== spriteId) return sprite;

                    captureInitialState(sprite);

                    let newState = { ...sprite };
                    const actualUpdates: Partial<SpriteState> = typeof updates === 'function' ? updates(sprite) : updates;

                    for (const key in actualUpdates) {
                        const val = (actualUpdates as any)[key];
                        (newState as any)[key] = typeof val === 'function' ? val(sprite[key]) : val;
                    }

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

    const actions: SpriteActions = {
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

        goToGrid: (spriteId, gridX, gridY) => {
            const safeX = Math.max(-1, Math.min(22, Number(gridX) || 0));
            const safeY = Math.max(-1, Math.min(20, Number(gridY) || 0));
            const px = (safeX - 1) * CELL_SIZE;
            const py = STAGE_HEIGHT - (safeY * CELL_SIZE);
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
                        return init ? { ...init, blocks: sprite.blocks } : sprite;
                    })
                };
            }));
        },

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
                    }))
                };
            }));
        },

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
