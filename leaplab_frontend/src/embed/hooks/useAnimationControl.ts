import { useCallback, useEffect } from 'react';
import type React from 'react';
import Blockly from '@blockly-runtime';
import { spriteManager } from '../../engine/SpriteManager';
import { animationVM } from '../../vm/AnimationVM';
import type { CompiledScript } from '../../vm/AnimationVM';
import { AnimationCompiler } from '../../generators/animation-generator';
import { soundManager } from '../../engine/SoundManager';
import { leapRuntime } from '../../runtime/leapRuntime';
import { setActiveSpriteId } from '../../runtime/RuntimeBridge';
import { hardwareAdapter } from '../../serial/HardwareAdapter';
import { migrateWorkspaceBlocks } from '../../utils/blocklyMigration';
import { extractBroadcastValues, fixCostumeDropdownValues } from '../utils/blocklyInit';
import { log } from '../utils/log';

export function useAnimationControl(
    selectedSpriteId: string | null,
    setSelectedSpriteId: React.Dispatch<React.SetStateAction<string | null>>,
    sprites: any[],
    setSprites: React.Dispatch<React.SetStateAction<any[]>>,
    setIsCameraOn: React.Dispatch<React.SetStateAction<boolean>>,
    setIsRunning: React.Dispatch<React.SetStateAction<boolean>>,
    setCompiledScripts: React.Dispatch<React.SetStateAction<CompiledScript[]>>,
    setAskState: React.Dispatch<React.SetStateAction<{ isAsking: boolean; question: string; resolve: ((value: string) => void) | null }>>,
    addLog: (msg: string) => void,
    spriteWorkspacesRef: React.MutableRefObject<Map<string, any>>,
    workspaceRef: React.MutableRefObject<Blockly.WorkspaceSvg | null>,
) {

    const syncAllWorkspaces = useCallback(() => {
        log.app('Syncing all entities (Sprites + Stage) for global events');
        let allScripts: CompiledScript[] = [];
        const stageScripts: CompiledScript[] = [];

        const allLiveSprites = spriteManager.getAllSprites();
        if (!allLiveSprites.some(s => s.id === 'stage')) {
            const stage = spriteManager.getSprite('stage');
            if (stage) allLiveSprites.push(stage);
        }

        for (const s of allLiveSprites) {
            let savedJson = spriteWorkspacesRef.current.get(s.id);
            if (s.id === selectedSpriteId && workspaceRef.current) {
                savedJson = Blockly.serialization.workspaces.save(workspaceRef.current);
            }

            if (!savedJson || Object.keys(savedJson).length === 0) {
                if (typeof s.setScripts === 'function') {
                    s.setScripts([]);
                }
                continue;
            }

            let tempWs: Blockly.Workspace | null = null;
            try {
                let compileWs: Blockly.Workspace;
                let usedLiveWs = false;

                if (s.id === selectedSpriteId && workspaceRef.current) {
                    compileWs = workspaceRef.current;
                    usedLiveWs = true;
                } else {
                    Blockly.Events.disable();
                    tempWs = new Blockly.Workspace();
                    const migratedSavedJson = migrateWorkspaceBlocks(savedJson);
                    extractBroadcastValues(migratedSavedJson as any, animationVM);
                    fixCostumeDropdownValues(migratedSavedJson as any, s.id);
                    Blockly.serialization.workspaces.load(migratedSavedJson, tempWs);
                    Blockly.Events.enable();
                    compileWs = tempWs;
                }

                const compiler = new AnimationCompiler(s.id);
                const scripts = compiler.compile(compileWs);
                allScripts = allScripts.concat(scripts);

                if (s.id === 'stage') {
                    stageScripts.push(...scripts);
                }

                if (typeof s.setScripts === 'function') {
                    log.app(`  Updating scripts for ${s.name} (${s.id}): ${scripts.length} scripts found`);
                    s.setScripts(scripts);
                }

                if (!usedLiveWs) tempWs?.dispose();
            } catch (e) {
                Blockly.Events.enable();
                log.app(`  ✗ Error compiling entity ${s.name}:`, e);
                if (tempWs) { try { (tempWs as any).dispose(); } catch (_) {} }
            }
        }

        animationVM.stageScripts = stageScripts;
        animationVM.setScripts(allScripts);

        return allScripts;
    }, [selectedSpriteId, spriteWorkspacesRef, workspaceRef]);

    const handleRunClick = useCallback(() => {
        addLog('Green flag clicked');
        soundManager.init();
        animationVM.stopAll();
        leapRuntime.stopAll();

        (window as any).__setCameraOn = (on: boolean) => {
            setIsCameraOn(on);
            if ((window as any).runtime?.bodyDetection) {
                (window as any).runtime.bodyDetection.setCameraOn(on ? "on" : "off");
            }
        };

        try {
            const allScripts = syncAllWorkspaces();
            if (allScripts.length > 0 || spriteWorkspacesRef.current.size > 0) {
                setCompiledScripts(allScripts);
                setIsRunning(true);
                leapRuntime.loadProject(spriteWorkspacesRef.current);
                if (selectedSpriteId) setActiveSpriteId(selectedSpriteId);
                animationVM.triggerFlag();
                addLog('Started animation');
            }
        } catch (e) {
            console.error('[APP] Error during multi-sprite compilation:', e);
        }
    }, [addLog, syncAllWorkspaces, selectedSpriteId, setIsCameraOn, setIsRunning, setCompiledScripts, spriteWorkspacesRef]);

    const handleStopClick = useCallback(() => {
        setIsRunning(false);
        leapRuntime.stopAll();
        animationVM.stopAll();

        setAskState(prev => {
            if (prev.resolve) prev.resolve('');
            return { isAsking: false, question: '', resolve: null };
        });

        sprites.forEach(sprite => {
            sprite.clearSay();
            sprite.stopGlide();
            sprite.clearEffects();
        });

        if (workspaceRef.current) {
            try {
                (workspaceRef.current as any).highlightBlock(null);
            } catch (e) {
                console.log('[APP] Ignoring highlight clear error', e);
            }
        }

        hardwareAdapter.stopAllPolling();
        addLog('Stopped animation');
    }, [sprites, workspaceRef, addLog, setIsRunning, setAskState]);

    const handleUndo = useCallback(() => {
        if (workspaceRef.current) {
            workspaceRef.current.undo(false);
        }
    }, [workspaceRef]);

    const handleRedo = useCallback(() => {
        if (workspaceRef.current) {
            workspaceRef.current.undo(true);
        }
    }, [workspaceRef]);

    // Bridge leapRuntime broadcasts to AnimationVM
    useEffect(() => {
        (leapRuntime as any)._onBroadcast = (message: string) => {
            animationVM.triggerBroadcast(message);
        };
        (leapRuntime as any)._onBroadcastAndWait = async (message: string) => {
            await animationVM.triggerBroadcastAndWait(message);
        };

        return () => {
            (leapRuntime as any)._onBroadcast = undefined;
            (leapRuntime as any)._onBroadcastAndWait = undefined;
        };
    }, []);

    return { syncAllWorkspaces, handleRunClick, handleStopClick, handleUndo, handleRedo };
}
