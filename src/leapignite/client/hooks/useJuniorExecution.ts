/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useEffect, useRef, useState } from "react";
import Blockly from "@blockly-runtime";
import { javascriptGenerator } from "@blockly-runtime";
import { Interpreter as LeapInterpreter } from "../../server/engine/Interpreter";
import { executionEngine } from "../../../engine/ExecutionEngine";
import { WorkspaceValidator } from "../../server/engine/WorkspaceValidator";
import { JuniorScene } from "../types";

interface UseJuniorExecutionProps {
    workspaceRef: React.MutableRefObject<Blockly.WorkspaceSvg | null>;
    scenes: JuniorScene[];
    currentSceneId: string;
    activeSpriteIdRef: React.MutableRefObject<string | null>;
    activeSpriteId: string | null;
    spriteActions: any;
    spriteWorkspacesRef: React.MutableRefObject<Map<string, any>>;
    saveCurrentWorkspace: () => void;
}

export function useJuniorExecution({
    workspaceRef,
    scenes,
    currentSceneId,
    activeSpriteIdRef,
    activeSpriteId,
    spriteActions,
    spriteWorkspacesRef,
    saveCurrentWorkspace
}: UseJuniorExecutionProps) {
    const interpreterRef = useRef<LeapInterpreter | null>(null);
    const isRunning = useRef(false);
    const [isBlocksRunning, setIsBlocksRunning] = useState(false);

    useEffect(() => {
        interpreterRef.current = new LeapInterpreter(workspaceRef as any, javascriptGenerator, {
            onRun: () => {
                isRunning.current = true;
                setIsBlocksRunning(true);
            },
            onStop: () => {
                isRunning.current = false;
                setIsBlocksRunning(false);
            },
            onHighlight: (id: string, spriteId?: string) => {
                if (workspaceRef.current && (!spriteId || (activeSpriteIdRef && spriteId === activeSpriteIdRef.current))) {
                    workspaceRef.current.highlightBlock(id);
                }
            }
        });
    }, [workspaceRef, activeSpriteIdRef]);

    useEffect(() => {
        if (!interpreterRef.current) return;

        interpreterRef.current.setupBroadcastListener(() => {
            const currentScene = scenes.find(scene => scene.id === currentSceneId);
            if (!currentScene) return [];

            const currentActiveId = activeSpriteIdRef?.current || activeSpriteId;

            return currentScene.sprites.map(sprite => ({
                spriteId: sprite.id,
                blocks:
                    sprite.id === currentActiveId && workspaceRef.current
                        ? Blockly.serialization.workspaces.save(workspaceRef.current)
                        : spriteWorkspacesRef?.current?.get(sprite.id) || sprite.blocks || {}
            }));
        }, Blockly);
    }, [scenes, currentSceneId, activeSpriteIdRef, activeSpriteId, spriteWorkspacesRef, workspaceRef]);

    const runBlocks = async () => {
        if (!workspaceRef.current) return;
        
        const validation = WorkspaceValidator.validateWorkspace(workspaceRef.current) as { isValid: boolean; error: string };
        if (!validation.isValid) {
            if (!validation.error.includes("connected to a Start") && !validation.error.includes("Start block")) {
                alert(`Oops! ${validation.error}`);
                return;
            }
        }

        if (isRunning.current) {
            stopBlocks();
            await (window as any).wait(0.1);
        }

        if ((interpreterRef.current as any)?.isPaused) {
            console.log("Resuming paused execution...");
            setIsBlocksRunning(true);
            (interpreterRef.current as any).resumeExecution();
            return;
        }

        const currentSceneSprites = scenes.find(s => s.id === currentSceneId)?.sprites || [];
        if (currentSceneSprites.length > 0) {
            spriteActions.softResetAll();
        }

        if ((window as any).clearPen) (window as any).clearPen();
        await (window as any).wait(0.3);

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

    const handleSpriteClick = async (clickedId: string) => {
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
        (interpreterRef.current as any)?.clearPauseFlag();
        executionEngine.stopAll();
        if ((window as any).stopAll) (window as any).stopAll();
        setIsBlocksRunning(false);
    };

    const handleReset = () => {
        stopBlocks();
        spriteActions.resetAll();
        if ((window as any).clearPen) (window as any).clearPen();
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
