import { useEffect, useRef, useState } from "react";
import Blockly from "@blockly-runtime";
import { javascriptGenerator } from "@blockly-runtime";
import { Interpreter as LeapInterpreter, ExecutionStop } from "../../server/engine/Interpreter";
import { executionEngine } from "../../../engine/ExecutionEngine";
import { WorkspaceValidator } from "../../server/engine/WorkspaceValidator";
import { showToast } from "../components/Toast";

interface UseJuniorExecutionProps {
    workspaceRef: React.RefObject<any>;
    scenes: any[];
    currentSceneId: string;
    activeSpriteIdRef: React.MutableRefObject<string>;
    activeSpriteId: string;
    spriteActions: any;
    spriteWorkspacesRef: React.MutableRefObject<Map<string, any>>;
    saveCurrentWorkspace: () => void;
}

interface SpriteEntry {
    spriteId: string;
    blocks: any;
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
    const interpreterRef = useRef<InstanceType<typeof LeapInterpreter> | null>(null);
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
            onHighlight: (id: string | null, spriteId?: string) => {
                if (workspaceRef.current && (!spriteId || (activeSpriteIdRef && spriteId === activeSpriteIdRef.current))) {
                    workspaceRef.current.highlightBlock(id);
                }
            }
        });
    }, [workspaceRef, activeSpriteIdRef]);

    const getSpriteBlocks = (sprite: any, currentActiveId: string): any => {
        if (sprite.id === currentActiveId && workspaceRef.current) {
            return Blockly.serialization.workspaces.save(workspaceRef.current);
        }
        return spriteWorkspacesRef?.current?.get(sprite.id) || sprite.blocks || {};
    };

    useEffect(() => {
        if (!interpreterRef.current) return;

        interpreterRef.current.setupBroadcastListener(() => {
            const currentActiveId = activeSpriteIdRef?.current || activeSpriteId;

            const allEntries: SpriteEntry[] = [];
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

    const runBlocks = async (): Promise<void> => {
        const validation = WorkspaceValidator.validateWorkspace(workspaceRef.current);
        if (!validation.isValid) {
            if (!validation.error!.includes("connected to a Start") && !validation.error!.includes("Start block")) {
                showToast(`Oops! ${validation.error}`, 'error');
                return;
            }
        }

        if (isRunning.current) {
            stopBlocks();
            if (window.wait) await window.wait(0.1);
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
        if (window.wait) await window.wait(0.3);

        const currentScene = scenes.find(s => s.id === currentSceneId);
        if (!currentScene) return;

        const spriteEntries: SpriteEntry[] = currentScene.sprites.map((sprite: any) => {
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

    const handleSpriteClick = async (clickedId: string): Promise<void> => {
        const currentActiveSpriteId = activeSpriteIdRef?.current || activeSpriteId;
        if (clickedId !== currentActiveSpriteId) {
            saveCurrentWorkspace?.();
        }

        const currentScene = scenes.find(s => s.id === currentSceneId);
        if (!currentScene) return;

        const sprite = currentScene.sprites.find((s: any) => s.id === clickedId);
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
            const spriteEntries: SpriteEntry[] = [{ spriteId: clickedId, blocks: savedBlocks }];
            await interpreterRef.current?.runAllSpritesStacks(['event_press', 'event_sprite_clicked'], spriteEntries, Blockly);
        }
    };

    const stopBlocks = (): void => {
        interpreterRef.current?.stopAll();
        interpreterRef.current?.clearPauseFlag();
        executionEngine.stopAll();
        if (window.stopAll) window.stopAll();
        setIsBlocksRunning(false);
    };

    const handleReset = (): void => {
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
