/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import Blockly from "@blockly-runtime";
import { showToast } from "../components/Toast";

const normalizeJuniorSpriteType = (rawType) => {
    const normalized = String(rawType || "").trim().toLowerCase();

    if (!normalized) return "custom";
    if (normalized === "pen" || normalized === "drawing_pen") return "pen";
    if (normalized.includes("pencil")) return "pencil";
    if (normalized.includes("drawing_pen")) return "pen";

    return normalized;
};

const cloneWorkspaceData = (workspaceJson) => JSON.parse(JSON.stringify(workspaceJson || {}));

export function addSprite(workspaceRef, activeSpriteIdRef, spriteWorkspacesRef, saveCurrentWorkspace, scenes, currentSceneId, setScenes, scenesRef, isLoadingWorkspaceRef, setActiveSpriteId, setIsSpriteModalOpen, spriteData = null) {
    if (workspaceRef && workspaceRef.current && spriteWorkspacesRef && spriteWorkspacesRef.current && activeSpriteIdRef && activeSpriteIdRef.current) {
        const activeId = activeSpriteIdRef.current;
        const json = cloneWorkspaceData(Blockly.serialization.workspaces.save(workspaceRef.current));
        spriteWorkspacesRef.current.set(activeId, cloneWorkspaceData(json));
        console.log(`[useJuniorUIHandlers] Saved workspace to ref for sprite: ${activeId}`);
    }

    saveCurrentWorkspace();
    const newId = `sprite_${Date.now()}`;

    let costumes = { default: "🐻" };
    let spriteName = "Bear";
    let spriteType = "bear";

    if (spriteData && typeof spriteData === 'object') {
        spriteName = spriteData.name || 'Sprite';
        spriteType = normalizeJuniorSpriteType(spriteData.id || spriteData.name || 'custom');

        if (spriteData.costumes && spriteData.costumes.length > 0) {
            costumes = {};
            spriteData.costumes.forEach((c, index) => {
                const key = index === 0 ? 'default' : `costume${index}`;
                costumes[key] = c;
            });
        } else if (spriteData.image) {
            costumes = { default: spriteData.image };
        } else if (spriteData.emoji) {
            costumes = { default: spriteData.emoji };
        }
    } else {
        const type = spriteData || 'robot';
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

    const newSprite = {
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

export function addScene(scenes, setScenes, setCurrentSceneId) {
    const newId = `scene${scenes.length + 1}`;
    const newScene = {
        id: newId,
        name: `Scene ${scenes.length + 1}`,
        background: "white",
        sprites: []
    };
    setScenes([...scenes, newScene]);
    setCurrentSceneId(newId);
}

export function deleteSprite(sprites, workspaceRef, activeSpriteIdRef, isLoadingWorkspaceRef, spriteWorkspacesRef, currentSceneId, setScenes, setActiveSpriteId, spriteId) {
    if (sprites.length <= 1) {
        showToast("Cannot delete the last sprite!", 'warning');
        return;
    }
    if (!confirm(`Delete sprite?`)) return;

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

export function deleteScene(scenes, setScenes, setCurrentSceneId, setActiveSpriteId, sceneId) {
    if (scenes.length <= 1) {
        showToast("Cannot delete the last scene!", 'warning');
        return;
    }
    if (!confirm(`Delete scene?`)) return;

    setScenes(prev => prev.filter(s => s.id !== sceneId));

    const remaining = scenes.filter(s => s.id !== sceneId);
    if (remaining.length > 0) {
        setCurrentSceneId(remaining[0].id);
        setActiveSpriteId(remaining[0].sprites[0]?.id || null);
    }
}
