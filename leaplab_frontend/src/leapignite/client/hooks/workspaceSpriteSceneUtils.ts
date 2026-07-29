import Blockly from "@blockly-runtime";
import { showToast } from "../components/Toast";
import { showConfirm } from "../components/ConfirmDialog";
import type { SpriteEntry } from "../../../components/SpriteLibrary";

interface CostumeMap {
    [key: string]: string;
}

interface SpriteData {
    id: string;
    name: string;
    type?: string;
    x?: number;
    y?: number;
    angle?: number;
    size?: number;
    visible?: boolean;
    mirrored?: boolean;
    costumes?: CostumeMap | string[];
    currentCostume?: string;
    textColor?: string;
    blocks?: any;
}

interface SceneData {
    id: string;
    name: string;
    background: string;
    sprites: SpriteData[];
}

const normalizeJuniorSpriteType = (rawType: string): string => {
    const normalized = String(rawType || "").trim().toLowerCase();

    if (!normalized) return "custom";
    if (normalized === "pen" || normalized === "drawing_pen") return "pen";
    if (normalized.includes("pencil")) return "pencil";
    if (normalized.includes("drawing_pen")) return "pen";

    return normalized;
};

const cloneWorkspaceData = (workspaceJson: any): any => JSON.parse(JSON.stringify(workspaceJson || {}));

export function addSprite(
    workspaceRef: React.RefObject<any>,
    activeSpriteIdRef: React.MutableRefObject<string>,
    spriteWorkspacesRef: React.MutableRefObject<Map<string, any>>,
    saveCurrentWorkspace: () => void,
    scenes: SceneData[],
    currentSceneId: string,
    setScenes: React.Dispatch<React.SetStateAction<SceneData[]>>,
    scenesRef: React.MutableRefObject<SceneData[]>,
    isLoadingWorkspaceRef: React.MutableRefObject<boolean>,
    setActiveSpriteId: (id: string) => void,
    setIsSpriteModalOpen: (open: boolean) => void,
    spriteData: SpriteEntry | string | null = null
): void {
    if (workspaceRef && workspaceRef.current && spriteWorkspacesRef && spriteWorkspacesRef.current && activeSpriteIdRef && activeSpriteIdRef.current) {
        const activeId = activeSpriteIdRef.current;
        const json = cloneWorkspaceData(Blockly.serialization.workspaces.save(workspaceRef.current));
        spriteWorkspacesRef.current.set(activeId, cloneWorkspaceData(json));
        console.log(`[useJuniorUIHandlers] Saved workspace to ref for sprite: ${activeId}`);
    }

    saveCurrentWorkspace();
    const newId = `sprite_${Date.now()}`;

    let costumes: CostumeMap = { default: "🐻" };
    let spriteName = "Bear";
    let spriteType = "bear";

    if (spriteData && typeof spriteData === 'object') {
        spriteName = (spriteData as SpriteEntry).name || 'Sprite';
        spriteType = normalizeJuniorSpriteType((spriteData as SpriteEntry).id || (spriteData as SpriteEntry).name || 'custom');

        if ((spriteData as SpriteEntry).costumes && (spriteData as SpriteEntry).costumes!.length > 0) {
            costumes = {};
            (spriteData as SpriteEntry).costumes!.forEach((c: string, index: number) => {
                const key = index === 0 ? 'default' : `costume${index}`;
                costumes[key] = c;
            });
        } else if ((spriteData as SpriteEntry).image) {
            costumes = { default: (spriteData as SpriteEntry).image! };
        } else if ((spriteData as SpriteEntry).emoji) {
            costumes = { default: (spriteData as SpriteEntry).emoji };
        }
    } else {
        const type = (spriteData as string) || 'robot';
        spriteType = normalizeJuniorSpriteType(type);
        spriteName = type.charAt(0).toUpperCase() + type.slice(1);

        if (type === "robot") {
            costumes = {
                default: 'assets/sprites/robot/robot_idle.svg',
                wave1: 'assets/sprites/robot/image-Photoroom.png',
                wave2: 'assets/sprites/robot/image-removebg-preview (1).png',
                talk: 'assets/sprites/robot/image-removebg-preview.png'
            };
        } else if (type === "bear") {
            costumes = { default: "🐻", wave: "👋", angry: "😠" };
        } else if (type === "dog") {
            costumes = { default: "🐶", wave: "🐩", bark: "🗣️" };
        } else if (type === "cat") {
            costumes = { default: "🐱", sleep: "😴", wave: "🐾" };
        }
    }

    const CELL_SIZE = 24;
    const currentScene = scenes.find(s => s.id === currentSceneId);
    const existingSprites = currentScene?.sprites || [];
    const spreadPositions = [
        { x: 14 * CELL_SIZE, y: 6 * CELL_SIZE },
        { x: 5 * CELL_SIZE, y: 6 * CELL_SIZE },
        { x: 10 * CELL_SIZE, y: 3 * CELL_SIZE },
        { x: 10 * CELL_SIZE, y: 10 * CELL_SIZE },
        { x: 3 * CELL_SIZE, y: 3 * CELL_SIZE },
        { x: 16 * CELL_SIZE, y: 3 * CELL_SIZE },
        { x: 3 * CELL_SIZE, y: 10 * CELL_SIZE },
        { x: 16 * CELL_SIZE, y: 10 * CELL_SIZE },
        { x: 7 * CELL_SIZE, y: 8 * CELL_SIZE },
        { x: 12 * CELL_SIZE, y: 4 * CELL_SIZE },
    ];

    const MIN_DISTANCE = CELL_SIZE * 3;
    let newX = 200, newY = 150;

    let foundPosition = false;
    for (const pos of spreadPositions) {
        const tooClose = existingSprites.some(s => {
            const dx = Math.abs(s.x - pos.x);
            const dy = Math.abs(s.y - pos.y);
            return dx < MIN_DISTANCE && dy < MIN_DISTANCE;
        });
        if (!tooClose) {
            newX = pos.x;
            newY = pos.y;
            foundPosition = true;
            break;
        }
    }

    if (!foundPosition) {
        newX = Math.floor(Math.random() * 14 + 3) * CELL_SIZE;
        newY = Math.floor(Math.random() * 9 + 3) * CELL_SIZE;
    }

    const newSprite: SpriteData = {
        id: newId,
        name: spriteName,
        type: spriteType,
        x: newX, y: newY, angle: 0, size: 100, visible: true,
        mirrored: false,
        costumes: costumes,
        currentCostume: "default",
        textColor: (spriteType.startsWith('letter_') || spriteType.startsWith('number_')) ? "#FF8C1A" : "#575E75",
        blocks: {}
    };

    setScenes(prev => {
        const updated = prev.map(s => {
            if (s.id === currentSceneId) return { ...s, sprites: [...s.sprites, newSprite] };
            return s;
        });
        if (scenesRef && scenesRef.current) {
            scenesRef.current = updated;
        }
        return updated;
    });

    if (spriteWorkspacesRef && spriteWorkspacesRef.current) {
        spriteWorkspacesRef.current.set(newId, {});
        console.log(`[useJuniorUIHandlers] Initialized empty workspace for new sprite: ${newId}`);
    }

    if (isLoadingWorkspaceRef) {
        isLoadingWorkspaceRef.current = true;
    }
    if (workspaceRef && workspaceRef.current) {
        Blockly.Events.disable();
        try {
            workspaceRef.current.clear();
            console.log(`[useJuniorUIHandlers] Cleared workspace for new sprite: ${newId}`);
        } finally {
            Blockly.Events.enable();
            if (activeSpriteIdRef) {
                activeSpriteIdRef.current = newId;
            }
            setTimeout(() => {
                if (isLoadingWorkspaceRef) {
                    isLoadingWorkspaceRef.current = false;
                }
            }, 50);
        }
    } else {
        if (activeSpriteIdRef) {
            activeSpriteIdRef.current = newId;
        }
    }

    setActiveSpriteId(newId);
    setIsSpriteModalOpen(false);
}

export function addScene(
    scenes: SceneData[],
    setScenes: React.Dispatch<React.SetStateAction<SceneData[]>>,
    setCurrentSceneId: (id: string) => void
): void {
    const newId = `scene${scenes.length + 1}`;
    const newScene: SceneData = {
        id: newId,
        name: `Scene ${scenes.length + 1}`,
        background: "white",
        sprites: []
    };
    setScenes([...scenes, newScene]);
    setCurrentSceneId(newId);
}

export async function deleteSprite(
    sprites: SpriteData[],
    workspaceRef: React.RefObject<any>,
    activeSpriteIdRef: React.MutableRefObject<string>,
    isLoadingWorkspaceRef: React.MutableRefObject<boolean>,
    spriteWorkspacesRef: React.MutableRefObject<Map<string, any>>,
    currentSceneId: string,
    setScenes: React.Dispatch<React.SetStateAction<SceneData[]>>,
    setActiveSpriteId: (id: string) => void,
    spriteId: string
): Promise<void> {
    if (sprites.length <= 1) {
        showToast("Cannot delete the last sprite!", 'warning');
        return;
    }
    if (!await showConfirm('Delete sprite?', { title: 'Delete Sprite', confirmText: 'Delete' })) return;

    if (workspaceRef && workspaceRef.current && activeSpriteIdRef && activeSpriteIdRef.current && !isLoadingWorkspaceRef?.current) {
        const json = cloneWorkspaceData(Blockly.serialization.workspaces.save(workspaceRef.current));
        if (spriteWorkspacesRef && spriteWorkspacesRef.current) {
            spriteWorkspacesRef.current.set(activeSpriteIdRef.current, cloneWorkspaceData(json));
        }
    }

    if (spriteWorkspacesRef && spriteWorkspacesRef.current) {
        spriteWorkspacesRef.current.delete(spriteId);
        console.log(`[useJuniorUIHandlers] Deleted workspace for sprite: ${spriteId}`);
    }

    setScenes(prev => prev.map(scene => {
        if (scene.id !== currentSceneId) return scene;
        const updatedSprites = scene.sprites.filter(s => s.id !== spriteId);
        return { ...scene, sprites: updatedSprites };
    }));

    const remaining = sprites.filter(s => s.id !== spriteId);
    if (remaining.length > 0) {
        const newActiveId = remaining[0].id;
        setActiveSpriteId(newActiveId);

        if (workspaceRef && workspaceRef.current && spriteWorkspacesRef && spriteWorkspacesRef.current) {
            isLoadingWorkspaceRef.current = true;
            Blockly.Events.disable();
            try {
                const json = spriteWorkspacesRef.current.get(newActiveId);
                workspaceRef.current.clear();
                if (json && Object.keys(json).length > 0) {
                    Blockly.serialization.workspaces.load(cloneWorkspaceData(json), workspaceRef.current);
                    console.log(`[useJuniorUIHandlers] Loaded workspace for new active sprite: ${newActiveId}`);
                }
            } catch (err) {
                console.error(`[useJuniorUIHandlers] Error loading workspace after delete:`, err);
            } finally {
                Blockly.Events.enable();
                if (activeSpriteIdRef) {
                    activeSpriteIdRef.current = newActiveId;
                }
                setTimeout(() => {
                    isLoadingWorkspaceRef.current = false;
                }, 50);
            }
        }
    }
}

export async function deleteScene(
    scenes: SceneData[],
    setScenes: React.Dispatch<React.SetStateAction<SceneData[]>>,
    setCurrentSceneId: (id: string) => void,
    setActiveSpriteId: (id: string | null) => void,
    sceneId: string
): Promise<void> {
    if (scenes.length <= 1) {
        showToast("Cannot delete the last scene!", 'warning');
        return;
    }
    if (!await showConfirm('Delete scene?', { title: 'Delete Scene', confirmText: 'Delete' })) return;

    setScenes(prev => prev.filter(s => s.id !== sceneId));

    const remaining = scenes.filter(s => s.id !== sceneId);
    if (remaining.length > 0) {
        setCurrentSceneId(remaining[0].id);
        setActiveSpriteId(remaining[0].sprites[0]?.id || null);
    }
}
