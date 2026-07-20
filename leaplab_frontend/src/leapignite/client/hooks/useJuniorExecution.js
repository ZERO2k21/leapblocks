/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { useEffect, useRef, useState } from "react";
import Blockly from "@blockly-runtime";
import { javascriptGenerator } from "@blockly-runtime";
import { Interpreter as LeapInterpreter, ExecutionStop } from "../../server/engine/Interpreter";
import { executionEngine } from "../../../engine/ExecutionEngine";
import { WorkspaceValidator } from "../../server/engine/WorkspaceValidator";
import { showToast } from "../components/Toast";

export function useJuniorExecution({
    workspaceRef,
    scenes,
    currentSceneId,
    activeSpriteIdRef,
    activeSpriteId,
    spriteActions,
    spriteWorkspacesRef,
    saveCurrentWorkspace
}) {
    const interpreterRef = useRef(null);
    const isRunning = useRef(false);
    const [isBlocksRunning, setIsBlocksRunning] = useState(false);

    useEffect(() => {
        interpreterRef.current = new LeapInterpreter(workspaceRef, javascriptGenerator, {
            onRun: () => {
                isRunning.current = true;
                setIsBlocksRunning(true);
            },
            onStop: () => {
                isRunning.current = false;
                setIsBlocksRunning(false);
            },
            onHighlight: (id, spriteId) => {
                if (workspaceRef.current && (!spriteId || (activeSpriteIdRef && spriteId === activeSpriteIdRef.current))) {
                    workspaceRef.current.highlightBlock(id);
                }
            }
        });
    }, [workspaceRef, activeSpriteIdRef]);

    const getSpriteBlocks = (sprite, currentActiveId) => {
        if (sprite.id === currentActiveId && workspaceRef.current) {
            return Blockly.serialization.workspaces.save(workspaceRef.current);
        }
        return spriteWorkspacesRef?.current?.get(sprite.id) || sprite.blocks || {};
    };

    useEffect(() => {
        if (!interpreterRef.current) return;

        interpreterRef.current.setupBroadcastListener(() => {
            const currentActiveId = activeSpriteIdRef?.current || activeSpriteId;

            const allEntries = [];
            for (const scene of scenes) {
                for (const sprite of scene.sprites) {
                    allEntries.push({
                        spriteId: sprite.id,
                        blocks: getSpriteBlocks(sprite, currentActiveId)
                    });
                }
            }
            return allEntries;
        }, Blockly);
    }, [scenes, currentSceneId, activeSpriteIdRef, activeSpriteId, spriteWorkspacesRef, workspaceRef]);

    const runBlocks = async () => {
        const validation = WorkspaceValidator.validateWorkspace(workspaceRef.current);
        if (!validation.isValid) {
            if (!validation.error.includes("connected to a Start") && !validation.error.includes("Start block")) {
                showToast(`Oops! ${validation.error}`, 'error');
                return;
            }
        }

        if (isRunning.current) {
            stopBlocks();
            await window.wait(0.1);
        }

        if (interpreterRef.current?.isPaused) {
            console.log("Resuming paused execution...");
            setIsBlocksRunning(true);
            interpreterRef.current.resumeExecution();
            return;
        }

        const currentSceneSprites = scenes.find(s => s.id === currentSceneId)?.sprites || [];
        if (currentSceneSprites.length > 0) {
            spriteActions.softResetAll();
        }

        if (window.clearPen) window.clearPen();
        await window.wait(0.3);

        const currentScene = scenes.find(s => s.id === currentSceneId);
        if (!currentScene) return;

        const spriteEntries = currentScene.sprites.map(sprite => {
            if (sprite.id === activeSpriteId && workspaceRef.current) {
                return {
                    spriteId: sprite.id,
                    blocks: Blockly.serialization.workspaces.save(workspaceRef.current)
                };
            }
            return {
                spriteId: sprite.id,
                blocks: sprite.blocks || {}
            };
        });

        console.log(`[Junior] Running blocks for all sprites in scene: ${currentScene.name}`);
        if (interpreterRef.current) {
            await interpreterRef.current.runAllSpritesStacks(['event_flag', 'event_flag_clicked'], spriteEntries, Blockly);
        }
    };

    const handleSpriteClick = async (clickedId) => {
        const currentActiveSpriteId = activeSpriteIdRef?.current || activeSpriteId;
        if (clickedId !== currentActiveSpriteId) {
            saveCurrentWorkspace?.();
        }

        const currentScene = scenes.find(s => s.id === currentSceneId);
        if (!currentScene) return;

        const sprite = currentScene.sprites.find(s => s.id === clickedId);
        const activeWorkspaceSnapshot =
            clickedId === currentActiveSpriteId && workspaceRef.current
                ? Blockly.serialization.workspaces.save(workspaceRef.current)
                : null;
        const savedBlocks =
            activeWorkspaceSnapshot ||
            spriteWorkspacesRef?.current?.get(clickedId) ||
            sprite?.blocks ||
            null;

        if (savedBlocks && Object.keys(savedBlocks).length > 0) {
            const spriteEntries = [{ spriteId: clickedId, blocks: savedBlocks }];
            await interpreterRef.current?.runAllSpritesStacks(['event_press', 'event_sprite_clicked'], spriteEntries, Blockly);
        }
    };

    const stopBlocks = () => {
        interpreterRef.current?.stopAll();
        interpreterRef.current?.clearPauseFlag();
        executionEngine.stopAll();
        if (window.stopAll) window.stopAll();
        setIsBlocksRunning(false);
    };

    const handleReset = () => {
        stopBlocks();
        spriteActions.resetAll();
        if (window.clearPen) window.clearPen();
    };

    return {
        interpreterRef,
        isRunning,
        isBlocksRunning,
        runBlocks,
        stopBlocks,
        handleReset,
        handleSpriteClick,
        setIsBlocksRunning
    };
}
