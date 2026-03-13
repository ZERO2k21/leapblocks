import { useEffect, useRef, useState } from "react";
import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import { Interpreter as LeapInterpreter, ExecutionStop } from "../engine/Interpreter";
import { executionEngine } from "../../engine/ExecutionEngine";
import { WorkspaceValidator } from "../engine/WorkspaceValidator";

export function useJuniorExecution({
    workspaceRef,
    scenes,
    currentSceneId,
    activeSpriteIdRef,
    activeSpriteId,
    setActiveSpriteId,
    spriteActions
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

    const runBlocks = async () => {
        const validation = WorkspaceValidator.validateWorkspace(workspaceRef.current);
        if (!validation.isValid) {
            if (!validation.error.includes("connected to a Start") && !validation.error.includes("Start block")) {
                alert(`Oops! ${validation.error}`);
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

    const handleSpriteClick = async (clickedId, saveCurrentWorkspace) => {
        if (clickedId !== activeSpriteId) {
            saveCurrentWorkspace();
            setActiveSpriteId(clickedId);
            await new Promise(r => setTimeout(r, 100));
        }

        const currentScene = scenes.find(s => s.id === currentSceneId);
        if (!currentScene) return;

        const sprite = currentScene.sprites.find(s => s.id === clickedId);
        if (sprite && sprite.blocks && Object.keys(sprite.blocks).length > 0) {
            const spriteEntries = [{ spriteId: clickedId, blocks: sprite.blocks }];
            interpreterRef.current?.runAllSpritesStacks(['event_press', 'event_sprite_clicked'], spriteEntries, Blockly);
        } else if (clickedId === activeSpriteId) {
            interpreterRef.current?.runStacks(['event_press', 'event_sprite_clicked']);
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
        if (window.hardResetBear) window.hardResetBear();
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
