/**
 * useAnimationControls.ts
 * Run/stop animation, sync all workspaces, block interaction preview.
 */
import { useCallback, useRef, useEffect } from 'react';
import Blockly from '../../server/blockly/runtime';
import { animationVM } from '../../server/vm/animationVM';
import { leapRuntime } from '../../server/runtime/leapRuntime';
import { setActiveSpriteId } from '../../server/runtime/runtimeBridge';
import { spriteManager } from '../../server/engine/spriteManager';
import { stageManager } from '../../server/engine/stageManager';
import { hardwareAdapter } from '../../server/hardware/hardwareAdapter';
import { AnimationCompiler } from '../../server/generators/animationGenerator';
import type { CompiledScript } from '../../server/vm/animationVM';
import type { Sprite } from '../stage/Sprite';

interface UseAnimationControlsOptions {
    sprites: Sprite[];
    selectedSpriteId: string | null;
    workspaceRef: React.MutableRefObject<Blockly.WorkspaceSvg | null>;
    spriteWorkspacesRef: React.MutableRefObject<Map<string, object>>;
    activeSpriteIdRef: React.MutableRefObject<string | null>;
    editorMode: 'stage' | 'upload';
    isConnected: boolean;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    setIsRunning: (v: boolean) => void;
    setCompiledScripts: (v: CompiledScript[] | ((prev: CompiledScript[]) => CompiledScript[])) => void;
    setAskState: (v: any) => void;
    setIsCameraOn: (v: boolean) => void;
    saveCurrentSpriteWorkspace: () => void;
    addLog: (msg: string) => void;
}

export function useAnimationControls({
    sprites, selectedSpriteId, workspaceRef, spriteWorkspacesRef,
    activeSpriteIdRef, editorMode, isConnected, activeTab, setActiveTab,
    setIsRunning, setCompiledScripts, setAskState, setIsCameraOn,
    saveCurrentSpriteWorkspace, addLog,
}: UseAnimationControlsOptions) {

    // ─── Sync all sprite workspaces → AnimationVM ─────────────────────────────

    const syncAllWorkspaces = useCallback((): CompiledScript[] => {
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
            if (!savedJson || Object.keys(savedJson).length === 0) continue;

            let tempWs: Blockly.Workspace | null = null;
            try {
                let compileWs: Blockly.Workspace;
                let usedLive = false;
                if (s.id === selectedSpriteId && workspaceRef.current) {
                    compileWs = workspaceRef.current; usedLive = true;
                } else {
                    Blockly.Events.disable();
                    tempWs = new Blockly.Workspace();
                    Blockly.serialization.workspaces.load(savedJson, tempWs);
                    Blockly.Events.enable();
                    compileWs = tempWs;
                }
                const compiler = new AnimationCompiler(s.id);
                const scripts = compiler.compile(compileWs);
                allScripts = allScripts.concat(scripts);
                if (s.id === 'stage') stageScripts.push(...scripts);
                if (typeof s.setScripts === 'function') s.setScripts(scripts);
                if (!usedLive) tempWs?.dispose();
            } catch (e) {
                Blockly.Events.enable();
                if (tempWs) { try { (tempWs as any).dispose(); } catch (_) { } }
            }
        }

        animationVM.stageScripts = stageScripts;
        animationVM.setScripts(allScripts);
        return allScripts;
    }, [selectedSpriteId, workspaceRef, spriteWorkspacesRef]);

    // Keep a ref so earlier-declared callbacks can call syncAllWorkspaces
    const syncAllWorkspacesRef = useRef(syncAllWorkspaces);
    syncAllWorkspacesRef.current = syncAllWorkspaces;

    // Wire broadcast interception
    useEffect(() => {
        animationVM.onBeforeBroadcast = (message: string) => {
            console.log(`[AnimControls] Broadcast "${message}" → syncing`);
            syncAllWorkspaces();
        };
        (leapRuntime as any)._onBroadcast = (message: string) => {
            animationVM.triggerBroadcast(message);
        };
        (leapRuntime as any)._onBroadcastAndWait = async (message: string) => {
            await animationVM.triggerBroadcastAndWait(message);
        };
        return () => {
            animationVM.onBeforeBroadcast = undefined;
            (leapRuntime as any)._onBroadcast = undefined;
            (leapRuntime as any)._onBroadcastAndWait = undefined;
        };
    }, [syncAllWorkspaces]);

    // ─── Run / Stop ───────────────────────────────────────────────────────────

    const handleRunClick = useCallback(() => {
        addLog('Green flag clicked');
        animationVM.stopAll();
        leapRuntime.stopAll();
        (window as any).__setCameraOn = (on: boolean) => setIsCameraOn(on);
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
            console.error('[AnimControls] Run error:', e);
        }
    }, [addLog, syncAllWorkspaces, selectedSpriteId, spriteWorkspacesRef,
        setCompiledScripts, setIsRunning, setIsCameraOn]);

    const handleStopClick = useCallback(() => {
        setIsRunning(false);
        leapRuntime.stopAll();
        animationVM.stopAll();
        setAskState((prev: any) => {
            if (prev.resolve) prev.resolve('');
            return { isAsking: false, question: '', resolve: null };
        });
        sprites.forEach(sprite => {
            sprite.clearSay();
            sprite.stopGlide();
            sprite.clearEffects();
        });
        if (workspaceRef.current) {
            try { (workspaceRef.current as any).highlightBlock(null); } catch { }
        }
        hardwareAdapter.stopAllPolling();
        addLog('Stopped animation');
    }, [sprites, workspaceRef, addLog, setIsRunning, setAskState]);

    // ─── Block interaction (click preview + hardware) ─────────────────────────

    const previewRevertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const previewBlockAction = useCallback((block: Blockly.Block) => {
        const activeSprite = selectedSpriteId ? sprites.find(s => s.id === selectedSpriteId) : null;
        if (!activeSprite) return;

        if (previewRevertTimerRef.current) {
            clearTimeout(previewRevertTimerRef.current);
            previewRevertTimerRef.current = null;
        }

        const saved = {
            x: activeSprite.x, y: activeSprite.y,
            direction: activeSprite.direction, size: activeSprite.size,
            visible: activeSprite.visible, sayText: activeSprite.sayText,
            effects: { ...activeSprite.effects }, rotationStyle: activeSprite.rotationStyle,
        };

        let previewed = true;
        switch (block.type) {
            case 'motion_move_steps': {
                const steps = Number(block.getFieldValue('STEPS')) || 10;
                const rad = (activeSprite.direction - 90) * Math.PI / 180;
                activeSprite.setX(activeSprite.x + Math.cos(rad) * steps);
                activeSprite.setY(activeSprite.y - Math.sin(rad) * steps);
                break;
            }
            case 'motion_move_left': activeSprite.setX(activeSprite.x - (Math.abs(Number(block.getFieldValue('STEPS'))) || 10)); break;
            case 'motion_move_up': activeSprite.setY(activeSprite.y + (Math.abs(Number(block.getFieldValue('STEPS'))) || 10)); break;
            case 'motion_move_down': activeSprite.setY(activeSprite.y - (Math.abs(Number(block.getFieldValue('STEPS'))) || 10)); break;
            case 'motion_turn_right': activeSprite.pointInDirection(activeSprite.direction + (Number(block.getFieldValue('DEGREES')) || 15)); break;
            case 'motion_turn_left': activeSprite.pointInDirection(activeSprite.direction - (Number(block.getFieldValue('DEGREES')) || 15)); break;
            case 'motion_go_to_xy': activeSprite.setX(Number(block.getFieldValue('X')) || 0); activeSprite.setY(Number(block.getFieldValue('Y')) || 0); break;
            case 'motion_glide_to_xy': activeSprite.startGlide(Number(block.getFieldValue('X')) || 0, Number(block.getFieldValue('Y')) || 0, Number(block.getFieldValue('SECS')) || 1); break;
            case 'motion_point_direction': activeSprite.pointInDirection(Number(block.getFieldValue('DIRECTION')) || 90); break;
            case 'motion_change_x': activeSprite.setX(activeSprite.x + (Number(block.getFieldValue('DX')) || 10)); break;
            case 'motion_change_y': activeSprite.setY(activeSprite.y + (Number(block.getFieldValue('DY')) || 10)); break;
            case 'motion_set_x': activeSprite.setX(Number(block.getFieldValue('X')) || 0); break;
            case 'motion_set_y': activeSprite.setY(Number(block.getFieldValue('Y')) || 0); break;
            case 'motion_if_on_edge_bounce': activeSprite.ifOnEdgeBounce(); break;
            case 'motion_set_rotation_style': activeSprite.setRotationStyle(block.getFieldValue('STYLE') as any); break;
            case 'looks_say': activeSprite.say(String(block.getFieldValue('MESSAGE') || 'Hello!')); break;
            case 'looks_say_for_secs': activeSprite.say(String(block.getFieldValue('MESSAGE') || 'Hello!'), Number(block.getFieldValue('SECS')) || 2); break;
            case 'looks_think': activeSprite.think(String(block.getFieldValue('MESSAGE') || 'Hmm...')); break;
            case 'looks_think_for_secs': activeSprite.think(String(block.getFieldValue('MESSAGE') || 'Hmm...'), Number(block.getFieldValue('SECS')) || 2); break;
            case 'looks_show': activeSprite.show(); break;
            case 'looks_hide': activeSprite.hide(); break;
            case 'looks_next_costume': activeSprite.nextCostume(); break;
            case 'looks_switch_costume': { const c = block.getFieldValue('COSTUME'); if (c) activeSprite.switchCostume(c); break; }
            case 'looks_set_size': activeSprite.setSize(Number(block.getFieldValue('SIZE')) || 100); break;
            case 'looks_change_size': activeSprite.changeSize(Number(block.getFieldValue('CHANGE')) || 10); break;
            case 'looks_set_effect': activeSprite.setEffect(block.getFieldValue('EFFECT') as any, Number(block.getFieldValue('VALUE')) || 0); break;
            case 'looks_clear_effects': activeSprite.clearEffects(); break;
            case 'looks_switch_backdrop': { const b = block.getFieldValue('BACKDROP'); if (b) stageManager.setBackdrop(b); break; }
            case 'looks_next_backdrop': stageManager.nextBackdrop(); break;
            default: previewed = false; break;
        }

        if (previewed) {
            activeSprite.jiggle();
            previewRevertTimerRef.current = setTimeout(() => {
                activeSprite.setX(saved.x); activeSprite.setY(saved.y);
                activeSprite.pointInDirection(saved.direction); activeSprite.setSize(saved.size);
                if (saved.visible) activeSprite.show(); else activeSprite.hide();
                activeSprite.setRotationStyle(saved.rotationStyle);
                activeSprite.clearEffects();
                if (saved.effects) {
                    Object.entries(saved.effects).forEach(([eff, val]) => {
                        if (val !== 0) activeSprite.setEffect(eff as any, val as number);
                    });
                }
                if (saved.sayText) activeSprite.say(saved.sayText); else activeSprite.clearSay();
                previewRevertTimerRef.current = null;
            }, 2000);
        }
    }, [selectedSpriteId, sprites]);

    const previewBlockActionRef = useRef(previewBlockAction);
    previewBlockActionRef.current = previewBlockAction;

    const handleBlockInteraction = useCallback(async (event: Blockly.Events.Abstract) => {
        if (!workspaceRef.current) return;
        if (event.type !== Blockly.Events.CLICK && event.type !== Blockly.Events.BLOCK_CHANGE) return;
        const blockId = (event as any).blockId;
        if (!blockId) return;
        const block = workspaceRef.current.getBlockById(blockId);
        if (!block) return;

        if (event.type === Blockly.Events.CLICK) {
            if (!block.type.startsWith('arduino_')) {
                setIsRunning(true);
                saveCurrentSpriteWorkspace();
                syncAllWorkspaces();
                if (selectedSpriteId) setActiveSpriteId(selectedSpriteId);
                const compiler = new AnimationCompiler(selectedSpriteId || '');
                const script = compiler.compileStack(block);
                if (script) { animationVM.runScript(script); return; }
            }
            previewBlockActionRef.current(block);
        }

        if (editorMode !== 'stage' || !isConnected || !block.type.startsWith('arduino_')) return;

        if (event.type === Blockly.Events.CLICK &&
            (block.type === 'arduino_setup' || block.type === 'arduino_loop')) {
            setIsRunning(true); animationVM.triggerFlag(); addLog('Started Arduino script'); return;
        }
        if (event.type === Blockly.Events.BLOCK_CHANGE && activeTab !== 'serial') setActiveTab('serial');

        try {
            switch (block.type) {
                case 'arduino_digital_write': await hardwareAdapter.setDigitalPin(parseInt(block.getFieldValue('PIN'), 10), block.getFieldValue('VALUE') === 'HIGH'); break;
                case 'arduino_analog_write': await hardwareAdapter.setPWM(parseInt(block.getFieldValue('PIN'), 10), parseInt(block.getFieldValue('VALUE'), 10)); break;
                case 'arduino_led': await hardwareAdapter.setPWM(parseInt(block.getFieldValue('PIN'), 10), parseInt(block.getFieldValue('BRIGHTNESS'), 10)); break;
                case 'arduino_servo': await hardwareAdapter.setServo(parseInt(block.getFieldValue('PIN'), 10), parseInt(block.getFieldValue('ANGLE'), 10)); break;
                case 'arduino_tone': await hardwareAdapter.playTone(parseInt(block.getFieldValue('PIN'), 10), parseInt(block.getFieldValue('FREQ'), 10), 500); break;
                case 'arduino_notone': await hardwareAdapter.stopTone(parseInt(block.getFieldValue('PIN'), 10)); break;
                case 'arduino_relay': await hardwareAdapter.setDigitalPin(parseInt(block.getFieldValue('PIN'), 10), block.getFieldValue('STATE') === 'HIGH'); break;
                case 'arduino_motor': {
                    const motorId = block.getFieldValue('MOTOR') === 'A' ? 1 : 2;
                    const dir = block.getFieldValue('DIR');
                    const spd = parseInt(block.getFieldValue('SPEED'), 10);
                    await hardwareAdapter.setMotor(motorId, dir === 'forward' ? spd : dir === 'backward' ? -spd : 0);
                    break;
                }
                case 'arduino_analog_read': { const v = await hardwareAdapter.readAnalogPin(block.getFieldValue('PIN')); addLog(`[HW] Analog ${block.getFieldValue('PIN')}: ${v}`); break; }
                case 'arduino_digital_read': { const v = await hardwareAdapter.readDigitalPin(parseInt(block.getFieldValue('PIN'), 10)); addLog(`[HW] Digital ${block.getFieldValue('PIN')}: ${v ? 'HIGH' : 'LOW'}`); break; }
                case 'arduino_button': { const v = await hardwareAdapter.readDigitalPin(parseInt(block.getFieldValue('PIN'), 10)); addLog(`[HW] Button ${block.getFieldValue('PIN')}: ${v ? 'Pressed' : 'Released'}`); break; }
            }
        } catch (err) { console.error('[AnimControls] Hardware interaction error:', err); }
    }, [editorMode, isConnected, saveCurrentSpriteWorkspace, sprites, selectedSpriteId,
        workspaceRef, activeTab, setActiveTab, setIsRunning, addLog, syncAllWorkspaces]);

    return {
        syncAllWorkspaces,
        syncAllWorkspacesRef,
        handleRunClick,
        handleStopClick,
        handleBlockInteraction,
        previewBlockActionRef,
    };
}
