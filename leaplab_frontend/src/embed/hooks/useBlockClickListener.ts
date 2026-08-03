import { useEffect, useRef, useCallback } from 'react';
import Blockly from '@blockly-runtime';
import type { WorkspaceSvg, Events } from '@blockly-runtime';
import { AnimationCompiler } from '../../generators/animation-generator';
import { animationVM } from '../../vm/AnimationVM';
import type { CompiledScript } from '../../vm/AnimationVM';
import { setActiveSpriteId } from '../../runtime/RuntimeBridge';
import { hardwareAdapter } from '../../serial/HardwareAdapter';
import { log } from '../utils/log';

interface BlockClickListenerOptions {
    workspaceRef: React.MutableRefObject<WorkspaceSvg | null>;
    selectedSpriteId: string | null;
    sprites: any[];
    editorMode: string;
    isConnected: boolean;
    activeTab: string;
    setActiveTab: (tab: 'log' | 'serial') => void;
    setIsRunning: (running: boolean) => void;
    addLog: (msg: string) => void;
    previewBlockActionRef: React.MutableRefObject<(block: Blockly.Block) => void>;
    syncAllWorkspacesRef: React.MutableRefObject<(() => CompiledScript[]) | null>;
}

/**
 * Attaches a DOM-level click/touchstart listener on the workspace's blocklyBlockCanvas
 * using event delegation. This captures interactions across the ENTIRE block area
 * (blocklyPath, inputs, icons, connections) — not just the main body path.
 *
 * Blockly's internal Blockly.Events.CLICK only fires for clicks on the block body.
 * This hook fills the gap by catching clicks on all sub-elements of the block SVG group.
 */
export function useBlockClickListener({
    workspaceRef,
    selectedSpriteId,
    sprites,
    editorMode,
    isConnected,
    activeTab,
    setActiveTab,
    setIsRunning,
    addLog,
    previewBlockActionRef,
    syncAllWorkspacesRef,
}: BlockClickListenerOptions) {
    const lastClickTimeRef = useRef<number>(0);
    const lastClickBlockIdRef = useRef<string | null>(null);

    const handleBlockClick = useCallback((block: Blockly.Block) => {
        if (!workspaceRef.current) return;

        // Animation block interaction on click
        if (!block.type.startsWith('arduino_')) {
            log.app('[BlockClickListener] Running stack with AnimationVM', { blockType: block.type });
            setIsRunning(true);

            // Ensure the current sprite workspace is saved and all sprite workspaces are loaded
            if (syncAllWorkspacesRef.current) {
                syncAllWorkspacesRef.current();
            }

            // Update active sprite for window.runtime.pen / window.runtime.sprite
            if (selectedSpriteId) setActiveSpriteId(selectedSpriteId);

            // Compile and execute via AnimationVM
            const compiler = new AnimationCompiler(selectedSpriteId || '');
            const script = compiler.compileStack(block);
            if (script) {
                animationVM.runScript(script);
                return;
            }
        }

        // Fallback: Preview single block action
        previewBlockActionRef.current(block);

        // Hardware block interaction (Arduino)
        if (editorMode !== 'stage' || !isConnected) return;
        if (!block.type.startsWith('arduino_')) return;

        if (block.type === 'arduino_setup' || block.type === 'arduino_loop') {
            log.app('[BlockClickListener] Starting Arduino scripts from block click');
            setIsRunning(true);
            animationVM.triggerFlag();
            addLog('Started Arduino script');
            return;
        }

        if (activeTab !== 'serial') setActiveTab('serial');

        log.app('[BlockClickListener] Real-time interaction', { type: block.type });

        const handleArduinoInteraction = async () => {
            try {
                switch (block.type) {
                    case 'arduino_digital_write': {
                        const pin = parseInt(block.getFieldValue('PIN'), 10);
                        const val = block.getFieldValue('VALUE') === 'HIGH';
                        await hardwareAdapter.setDigitalPin(pin, val);
                        break;
                    }
                    case 'arduino_analog_write': {
                        const pin = parseInt(block.getFieldValue('PIN'), 10);
                        const val = parseInt(block.getFieldValue('VALUE'), 10);
                        await hardwareAdapter.setPWM(pin, val);
                        break;
                    }
                    case 'arduino_led': {
                        const pin = parseInt(block.getFieldValue('PIN'), 10);
                        const val = parseInt(block.getFieldValue('BRIGHTNESS'), 10);
                        await hardwareAdapter.setPWM(pin, val);
                        break;
                    }
                    case 'arduino_servo': {
                        const pin = parseInt(block.getFieldValue('PIN'), 10);
                        const angle = parseInt(block.getFieldValue('ANGLE'), 10);
                        await hardwareAdapter.setServo(pin, angle);
                        break;
                    }
                    case 'arduino_tone': {
                        const pin = parseInt(block.getFieldValue('PIN'), 10);
                        const freq = parseInt(block.getFieldValue('FREQ'), 10);
                        await hardwareAdapter.playTone(pin, freq, 500);
                        break;
                    }
                    case 'arduino_notone': {
                        const pin = parseInt(block.getFieldValue('PIN'), 10);
                        await hardwareAdapter.stopTone(pin);
                        break;
                    }
                    case 'arduino_relay': {
                        const pin = parseInt(block.getFieldValue('PIN'), 10);
                        const state = block.getFieldValue('STATE') === 'HIGH';
                        await hardwareAdapter.setDigitalPin(pin, state);
                        break;
                    }
                    case 'arduino_motor': {
                        const motor = block.getFieldValue('MOTOR');
                        const motorId = motor === 'A' ? 1 : 2;
                        const dir = block.getFieldValue('DIR');
                        const speedVal = parseInt(block.getFieldValue('SPEED'), 10);
                        let speed = 0;
                        if (dir === 'forward') speed = speedVal;
                        else if (dir === 'backward') speed = -speedVal;
                        await hardwareAdapter.setMotor(motorId, speed);
                        break;
                    }
                    case 'arduino_analog_read': {
                        const pin = block.getFieldValue('PIN');
                        const val = await hardwareAdapter.readAnalogPin(pin);
                        addLog(`[Hardware] Read Analog ${pin}: ${val}`);
                        break;
                    }
                    case 'arduino_digital_read': {
                        const pin = parseInt(block.getFieldValue('PIN'), 10);
                        const val = await hardwareAdapter.readDigitalPin(pin);
                        addLog(`[Hardware] Read Digital ${pin}: ${val ? 'HIGH' : 'LOW'}`);
                        break;
                    }
                    case 'arduino_button': {
                        const pin = parseInt(block.getFieldValue('PIN'), 10);
                        const val = await hardwareAdapter.readDigitalPin(pin);
                        addLog(`[Hardware] Button on ${pin}: ${val ? 'Pressed' : 'Released'}`);
                        break;
                    }
                    case 'arduino_digital_sensor': {
                        const sensor = block.getFieldValue('SENSOR');
                        const pin = parseInt(block.getFieldValue('PIN'), 10);
                        const val = await hardwareAdapter.readDigitalPin(pin);
                        const status = (sensor === 'IR' ? !val : val) ? 'Detected' : 'Not Detected';
                        addLog(`[Hardware] ${sensor} Sensor on ${pin}: ${status} (Raw: ${val ? 'HIGH' : 'LOW'})`);
                        break;
                    }
                }
            } catch (err) {
                log.app('[BlockClickListener] Interaction error', err);
            }
        };

        handleArduinoInteraction();
    }, [workspaceRef, selectedSpriteId, editorMode, isConnected, activeTab, setActiveTab, setIsRunning, addLog, previewBlockActionRef, syncAllWorkspacesRef]);

    useEffect(() => {
        const DEBOUNCE_MS = 200;

        const handleClick = (e: Event) => {
            const now = Date.now();
            const target = e.target as HTMLElement | SVGElement;

            // Walk up from the click target to find the closest .blocklyDraggable group
            // This covers clicks on blocklyPath, blocklyIconMark, input fields, etc.
            const draggableGroup = (target as Element).closest?.('.blocklyDraggable') as SVGGElement | null;
            if (!draggableGroup) return;

            // Extract block ID from the data-id attribute set by Blockly on each block group
            const blockId = draggableGroup.getAttribute('data-id');
            if (!blockId) return;

            // Deduplicate: Blockly may fire both a DOM click and a Blockly.Events.CLICK
            // for the same interaction. Skip if we just handled this block within DEBOUNCE_MS.
            if (blockId === lastClickBlockIdRef.current && now - lastClickTimeRef.current < DEBOUNCE_MS) {
                return;
            }

            lastClickTimeRef.current = now;
            lastClickBlockIdRef.current = blockId;

            const block = workspaceRef.current?.getBlockById(blockId);
            if (!block) return;

            // Skip blocks in the flyout (they are templates, not real blocks)
            if (block.isInFlyout) return;

            // Skip dragging blocks — only handle clicks, not drag ends
            if ((draggableGroup as any).classList?.contains('blocklyDragging')) return;

            handleBlockClick(block);
        };

        // Attach to the STABLE container div (blocklyDiv) that wraps the workspace SVG,
        // not to the blocklyBlockCanvas. The canvas is only created when Blockly is
        // injected — which happens asynchronously (inside a setTimeout after mount),
        // so attaching to the canvas here would never find it. The container div is
        // always mounted and survives workspace re-injection, so a single attach covers
        // the whole block area (body path, inputs, icons, connections) for the app's life.
        let attachedTo: HTMLElement | null = null;
        let cancelled = false;
        let raf = 0;

        const attach = (): boolean => {
            if (attachedTo) return true;
            const ws = workspaceRef.current;
            if (!ws) return false;
            const svg = (ws as any).getParentSvg?.() as SVGSVGElement | null;
            if (!svg) return false;
            const container = svg.parentElement as HTMLElement | null;
            if (!container) return false;

            // Use pointerdown + capture to intercept before Blockly's gesture system
            container.addEventListener('pointerdown', handleClick, { capture: true, passive: true });
            container.addEventListener('mousedown', handleClick, { capture: true, passive: true });
            container.addEventListener('touchstart', handleClick, { capture: true, passive: true });
            container.addEventListener('click', handleClick, { capture: true, passive: true });
            attachedTo = container;
            return true;
        };

        // ALSO: attach directly to each block's .blocklyDraggable group when created.
        // This catches clicks on ALL descendants (including HTML fields in foreignObject)
        // without relying on event bubbling through the container.
        let changeListener: ((event: Events.Abstract) => void) | null = null;

        const attachDirectlyToBlocks = (ws: any) => {
            // Attach to existing blocks
            const blocks = ws.getTopBlocks(true);
            for (const b of blocks) {
                attachToBlock(b);
            }

            // Listen for new blocks
            changeListener = (event: any) => {
                if (event.type === Blockly.Events.BLOCK_CREATE) {
                    const block = ws.getBlockById(event.blockId);
                    if (block && !block.isInFlyout) {
                        attachToBlock(block);
                    }
                }
            };
            ws.addChangeListener(changeListener);
        };

        const attachToBlock = (block: any) => {
            const group = block.getSvgRoot?.();
            if (group && (group as any).classList?.contains('blocklyDraggable')) {
                // Avoid double-attaching
                if ((group as any).__leapClickAttached) return;
                // Use pointerdown + capture to catch events before Blockly's gesture system
                (group as any).addEventListener('pointerdown', handleClick, { capture: true, passive: true });
                (group as any).addEventListener('mousedown', handleClick, { capture: true, passive: true });
                (group as any).addEventListener('touchstart', handleClick, { capture: true, passive: true });
                (group as any).addEventListener('click', handleClick, { passive: true });
                (group as any).__leapClickAttached = true;
            }

            // Also attach directly to field elements that may not bubble events properly
            // Use pointerdown + capture to intercept before Blockly's gesture handlers
            const fieldSelectors = [
                '.blocklyEditableField',
                '.blocklyEditableText',
                '.blocklyText',
                '.blocklyIconGroup',
                '.blocklyIconMark',
                'foreignObject',
                '.blocklyConnection',
            ];
            for (const sel of fieldSelectors) {
                const els = group?.querySelectorAll?.(sel);
                if (els) {
                    for (const el of els) {
                        if ((el as any).__leapClickAttached) continue;
                        el.addEventListener('pointerdown', handleClick, { capture: true, passive: true });
                        el.addEventListener('mousedown', handleClick, { capture: true, passive: true });
                        el.addEventListener('touchstart', handleClick, { capture: true, passive: true });
                        el.addEventListener('click', handleClick, { passive: true });
                        (el as any).__leapClickAttached = true;
                    }
                }
            }
        };

        // Poll with requestAnimationFrame until the workspace is injected and the
        // container is reachable. Once attached, the loop stops.
        const tick = () => {
            if (cancelled) return;
            if (!attach()) {
                raf = requestAnimationFrame(tick);
            } else if (!changeListener && workspaceRef.current) {
                // Container attached; now wire direct block listeners
                attachDirectlyToBlocks(workspaceRef.current);
            }
        };
        raf = requestAnimationFrame(tick);

        return () => {
            cancelled = true;
            cancelAnimationFrame(raf);
            if (attachedTo) {
                attachedTo.removeEventListener('pointerdown', handleClick, { capture: true } as EventListenerOptions);
                attachedTo.removeEventListener('mousedown', handleClick, { capture: true } as EventListenerOptions);
                attachedTo.removeEventListener('touchstart', handleClick, { capture: true } as EventListenerOptions);
                attachedTo.removeEventListener('click', handleClick, { capture: true } as EventListenerOptions);
                attachedTo = null;
            }
            if (changeListener && workspaceRef.current) {
                workspaceRef.current.removeChangeListener(changeListener);
                changeListener = null;
            }
            // Note: individual block listeners are cleaned up when blocks are disposed
        };
    }, [workspaceRef, handleBlockClick]);

    return { handleBlockClick };
}
