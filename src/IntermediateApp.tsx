import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as Blockly from 'blockly';
import { arduinoBlocks, arduinoToolbox } from './blocks/arduino-blocks';
import { esp32Blocks, esp32Toolbox } from './blocks/esp32-blocks';
import { animationBlocks, animationToolbox } from './blocks/animation-blocks';
import { hardwareBlocks } from './blocks/hardware-blocks';
import { arduinoGenerator } from './generators/arduino-generator';
import { AnimationCompiler } from './generators/animation-generator';
import { animationVM, CompiledScript } from './vm/AnimationVM';
import { Sprite, SpriteType } from './stage/Sprite';
import Stage from './stage/Stage';
import SpritePanel from './stage/SpritePanel';
import MenuBar from './junior/components/MenuBar';
import BoardSelectionModal from './junior/components/BoardSelectionModal';
import PaintEditor from './components/PaintEditor';
import StagePanel from './stage/StagePanel';
import BackdropLibrary from './components/BackdropLibrary';
import BackdropEditor from './components/BackdropEditor';
import { stageManager } from './engine/StageManager';
import { hardwareAdapter } from './hardware/HardwareAdapter';
import SerialMonitor from './components/SerialMonitor';
import UploadModal from './components/UploadModal';
import { SpriteLibrary, SpriteEntry } from './components/SpriteLibrary';
import WorkspaceControls from './components/WorkspaceControls';
import WorkspaceTrash from './components/WorkspaceTrash';
import { Flag, Square, Upload, Camera, CameraOff, Grid3X3, Maximize, Minimize, LayoutTemplate, LayoutPanelLeft } from 'lucide-react';
import './custom-toolbox';
import { block } from 'blockly/core/tooltip';

// ═══════════════════════════════════════════════════════════════════════════
// LOGGING UTILITY
// ═══════════════════════════════════════════════════════════════════════════
const log = {
    app: (msg: string, data?: any) => console.log(`[APP] ${msg}`, data ?? ''),
    blockly: (msg: string, data?: any) => console.log(`[BLOCKLY] ${msg}`, data ?? ''),
    generator: (msg: string, data?: any) => console.log(`[GENERATOR] ${msg}`, data ?? ''),
};

// Register all blocks
log.app('Registering blocks...');
Blockly.common.defineBlocks(arduinoBlocks);
Blockly.common.defineBlocks(esp32Blocks);
Blockly.common.defineBlocks(animationBlocks);
Blockly.common.defineBlocks(hardwareBlocks);
log.app('All blocks registered successfully');

// Configure Blockly dialogs for Electron (native prompt/alert not supported)
Blockly.dialog.setPrompt((message, defaultValue, callback) => {
    // Use a simple window.prompt replacement with a custom modal approach
    // For now, using a workaround that works in Electron
    const result = window.prompt(message, defaultValue);
    callback(result);
});

Blockly.dialog.setAlert((message, callback) => {
    window.alert(message);
    if (callback) callback();
});

Blockly.dialog.setConfirm((message, callback) => {
    const result = window.confirm(message);
    callback(result);
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
// Main app mode: home (welcome screen) or one of the coding modes
type AppMode = 'home' | 'blocks' | 'python' | 'notebook' | 'ml' | 'xr';
// Editor sub-mode for blocks: stage (animation) or upload (hardware)
type EditorMode = 'stage' | 'upload';

const IntermediateApp: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════
    const blocklyDiv = useRef<HTMLDivElement>(null);
    const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

    const [appMode, setAppMode] = useState<AppMode>('blocks');
    const [editorMode, setEditorMode] = useState<EditorMode>('stage');
    const [projectName, setProjectName] = useState('My Project');
    const [generatedCode, setGeneratedCode] = useState<string>('// Select blocks to generate code');
    const [activeTab, setActiveTab] = useState<'log' | 'serial'>('log');
    const [workspaceTab, setWorkspaceTab] = useState<'blocks' | 'python' | 'costumes' | 'sounds'>('blocks');
    const [logMessages, setLogMessages] = useState<string[]>(['Ready']);
    const [isRunning, setIsRunning] = useState(false);

    // Sprites
    const [sprites, setSprites] = useState<Sprite[]>([]);
    const [selectedSpriteId, setSelectedSpriteId] = useState<string | null>(null);
    const [compiledScripts, setCompiledScripts] = useState<CompiledScript[]>([]);

    // Per-sprite workspace storage: maps spriteId -> Blockly serialized JSON
    const spriteWorkspacesRef = useRef<Map<string, object>>(new Map());

    // Hardware
    const [ports, setPorts] = useState<{ path: string; manufacturer?: string }[]>([]);
    const [selectedPort, setSelectedPort] = useState<string>('');
    const [selectedBoard, setSelectedBoard] = useState<string>('arduino_uno');
    const [selectedBoardName, setSelectedBoardName] = useState<string>('Arduino Uno');
    const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [serialMessages, setSerialMessages] = useState<string[]>([]);
    const [baudRate, setBaudRate] = useState<number>(9600);
    const [lineEnding, setLineEnding] = useState<string>('\r\n');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>('');

    // Stage enhancements state
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [showGrid, setShowGrid] = useState(false);
    const [isDraggingSprite, setIsDraggingSprite] = useState(false);
    const [stageLayout, setStageLayout] = useState<'normal' | 'small' | 'large'>('normal');
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Backdrop state
    const [showBackdropLibrary, setShowBackdropLibrary] = useState(false);
    const [showBackdropEditor, setShowBackdropEditor] = useState(false);
    const [, setBackdropRefresh] = useState(0); // Force re-render on backdrop change

    // Sprite Library state
    const [showSpriteLibrary, setShowSpriteLibrary] = useState(false);

    // Force re-render for sprite updates
    const [, forceUpdate] = useState({});
    const triggerUpdate = useCallback(() => forceUpdate({}), []);

    // ═══════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════
    const handleBackdropSelect = async (name: string, src: string) => {
        await stageManager.addBackdrop(name, src);
        stageManager.setBackdrop(name); // Force the stage to switch to this backdrop
        setShowBackdropLibrary(false);
        setBackdropRefresh(prev => prev + 1);
        window.dispatchEvent(new Event('leap-stage-update')); // Ensure canvas repaints
    };

    const [promptState, setPromptState] = useState<{
        isOpen: boolean;
        message: string;
        defaultValue: string;
        callback: ((value: string | null) => void) | null;
        type: 'standard' | 'variable' | 'list';
    }>({
        isOpen: false,
        message: '',
        defaultValue: '',
        callback: null,
        type: 'standard',
    });
    const [promptInput, setPromptInput] = useState('');
    const [variableType, setVariableType] = useState('Number'); // Number | String
    const [variableScope, setVariableScope] = useState('global'); // global | local

    useEffect(() => {
        Blockly.dialog.setPrompt((message, defaultValue, callback) => {
            setPromptState({
                isOpen: true,
                message,
                defaultValue,
                callback,
                type: 'standard',
            });
            setPromptInput(defaultValue);
        });
    }, []);

    const handlePromptSubmit = () => {
        if (promptState.callback) {
            // For variable creation, we might handle it differently but keeping simple string callback for now
            // Code utilizing 'CREATE_VARIABLE' callback needs to handle the actual creation
            // if we are in 'variable' mode, we need to create the variable directly here

            if (promptState.type === 'variable' && workspaceRef.current) {
                // Manually create variable since we bypassed the standard flow
                // Standard prompt callback expects a string name
                const ws = workspaceRef.current;
                const newVar = ws.createVariable(promptInput, variableType); // Type is loosely used here
                if (newVar) {
                    // If scoped 'local', we'd need custom handling, but effectively global for now
                    if (variableScope === 'local') {
                        console.warn('Local variables not fully supported, created as global');
                    }
                }
            } else if (promptState.type === 'list' && workspaceRef.current) {
                // Manually create list
                const ws = workspaceRef.current;
                ws.createVariable(promptInput, 'list'); // 'list' type is crucial
            }

            // If it was a standard prompt (or simple variable prompt)
            promptState.callback(promptInput);
        }
        setPromptState(prev => ({ ...prev, isOpen: false }));
    };

    const handlePromptCancel = () => {
        if (promptState.callback) {
            promptState.callback(null);
        }
        setPromptState(prev => ({ ...prev, isOpen: false }));
    };

    const addLog = useCallback((message: string) => {
        setLogMessages(prev => [...prev.slice(-50), `[${new Date().toLocaleTimeString()}] ${message}`]);
    }, []);

    const getCurrentToolbox = useCallback(() => {
        if (editorMode === 'stage') return animationToolbox;
        return selectedBoard === 'esp32' ? esp32Toolbox : arduinoToolbox;
    }, [editorMode, selectedBoard]);

    // ═══════════════════════════════════════════════════════════════════════
    // WORKSPACE CHANGE HANDLER
    // ═══════════════════════════════════════════════════════════════════════
    const handleWorkspaceChange = useCallback((event: Blockly.Events.Abstract) => {
        if (event.isUiEvent) return;
        if (!workspaceRef.current) return;

        try {
            if (editorMode === 'upload') {
                // Generate Arduino C++ code
                const code = arduinoGenerator.workspaceToCode(workspaceRef.current);
                const formattedCode = `// LeapBlocks - Arduino Code\n\n${code || 'void setup() {\n  // Setup code here\n}\n\nvoid loop() {\n  // Loop code here\n}'}`;
                setGeneratedCode(formattedCode);
            } else {
                // Compile animation scripts
                console.log('[APP] Workspace changed, recompiling scripts...');
                console.log('[APP] AppMode:', appMode, 'editorMode:', editorMode, 'selectedSpriteId:', selectedSpriteId);
                console.log('[APP] Sprites available:', sprites.map(s => ({ id: s.id, name: s.name })));

                const sprite = sprites.find(s => s.id === selectedSpriteId);
                if (sprite) {
                    console.log('[APP] Compiling for sprite:', sprite.id, sprite.name);
                    const compiler = new AnimationCompiler(sprite.id);
                    const scripts = compiler.compile(workspaceRef.current);
                    console.log('[APP] Compiled', scripts.length, 'scripts');
                    scripts.forEach((s, i) => {
                        console.log(`[APP]   Script ${i}: trigger=${s.trigger}, steps=${s.steps.length}`);
                        s.steps.forEach((step, j) => {
                            console.log(`[APP]     Step ${j}:`, step.type);
                        });
                    });
                    setCompiledScripts(scripts);
                    const modeLabel = 'Stage Mode';
                    setGeneratedCode(`// ${modeLabel} - ${scripts.length} script(s) compiled\n// Click 🏳️ to run animation`);
                } else {
                    console.log('[APP] ✗ No sprite selected, cannot compile');
                    setGeneratedCode('// Add a sprite to start programming!');
                }
            }

            // Auto-save workspace for current sprite on every meaningful change
            if (workspaceRef.current && selectedSpriteId) {
                const json = Blockly.serialization.workspaces.save(workspaceRef.current);
                spriteWorkspacesRef.current.set(selectedSpriteId, json);
            }
        } catch (e) {
            console.error('[APP] Code generation error:', e);
            log.generator('Code generation error', e);
        }
    }, [editorMode, appMode, sprites, selectedSpriteId]);

    /**
     * Handle real-time hardware interaction when a block is clicked or changed
     */
    const handleBlockInteraction = useCallback(async (event: Blockly.Events.Abstract) => {
        if (!workspaceRef.current || editorMode !== 'stage' || !isConnected) return;

        // We only care about clicks or UI changes that represent immediate intent
        if (event.type !== Blockly.Events.CLICK && event.type !== Blockly.Events.BLOCK_CHANGE) return;

        const blockId = (event as any).blockId;
        const block = workspaceRef.current.getBlockById(blockId);

        // --- VISUAL FEEDBACK: Jiggle sprite on block interaction ---
        if (block && event.type === Blockly.Events.CLICK && selectedSpriteId) {
            const activeSprite = sprites.find(s => s.id === selectedSpriteId);
            if (activeSprite) {
                activeSprite.jiggle();
            }
        }

        if (!block || !block.type.startsWith('arduino_')) return;

        // If clicking a setup or loop block, trigger the flag scripts (which include arduino_setup)
        if (event.type === Blockly.Events.CLICK && (block.type === 'arduino_setup' || block.type === 'arduino_loop')) {
            console.log('[APP] Starting Arduino scripts from block click');
            setIsRunning(true);
            animationVM.triggerFlag(compiledScripts);
            addLog('Started Arduino script');
            return;
        }

        if (event.type === Blockly.Events.BLOCK_CHANGE) {
            // "make them serial monitor visible when user drag blocks in the workspace"
            // If they interact with the workspace and add blocks, especially serial ones, switch tab
            if (activeTab !== 'serial') {
                setActiveTab('serial');
            }
        }

        log.app('Real-time interaction', { type: block.type, event: event.type });


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
                    await hardwareAdapter.playTone(pin, freq, 500); // 500ms default for preview
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
                    const motor = block.getFieldValue('MOTOR'); // 'A' or 'B'
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
            log.app('Interaction error', err);
        }
    }, [editorMode, isConnected]);

    // ═══════════════════════════════════════════════════════════════════════
    // MODE SWITCHING
    // ═══════════════════════════════════════════════════════════════════════
    const switchEditorMode = useCallback((newMode: EditorMode) => {
        if (newMode === editorMode) return;

        setEditorMode(newMode);
        //open flyout

        addLog(`Switched to ${newMode === 'stage' ? 'Stage' : 'Upload'} Mode`);

        // Note: The workspace injection will be handled by the useEffect dependent on editorMode
    }, [editorMode, addLog]);

    // ═══════════════════════════════════════════════════════════════════════
    // SPRITE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    // Save current workspace blocks to the per-sprite map
    const saveCurrentSpriteWorkspace = useCallback(() => {
        if (!workspaceRef.current || !selectedSpriteId) return;
        const json = Blockly.serialization.workspaces.save(workspaceRef.current);
        spriteWorkspacesRef.current.set(selectedSpriteId, json);
        console.log('[APP] Saved workspace for sprite:', selectedSpriteId);
    }, [selectedSpriteId]);

    // Load workspace blocks from the per-sprite map
    const loadSpriteWorkspace = useCallback((spriteId: string) => {
        if (!workspaceRef.current) return;
        const json = spriteWorkspacesRef.current.get(spriteId);
        if (json && Object.keys(json).length > 0) {
            Blockly.serialization.workspaces.load(json, workspaceRef.current);
            console.log('[APP] Loaded workspace for sprite:', spriteId);
        } else {
            workspaceRef.current.clear();
            console.log('[APP] Cleared workspace for new sprite:', spriteId);
        }
    }, []);

    // Handle sprite selection: save old, load new
    const handleSpriteSelect = useCallback((newId: string) => {
        if (newId === selectedSpriteId) return;

        // Clear highlights in old workspace before switching
        if (workspaceRef.current) {
            // @ts-ignore
            workspaceRef.current.highlightBlock(null);
        }

        saveCurrentSpriteWorkspace();
        setSelectedSpriteId(newId);
        loadSpriteWorkspace(newId);
    }, [selectedSpriteId, saveCurrentSpriteWorkspace, loadSpriteWorkspace]);

    const addSprite = useCallback((spriteType: SpriteType = 'cat') => {
        // Save current sprite's workspace before switching
        saveCurrentSpriteWorkspace();

        const id = `sprite_${Date.now()}`;
        const typeNames: Record<SpriteType, string> = { cat: 'Cat', ball: 'Ball', arrow: 'Arrow', robot: 'Robot' };
        const name = `${typeNames[spriteType]} ${sprites.filter(s => s.spriteType === spriteType).length + 1}`;
        const newSprite = new Sprite(id, name, triggerUpdate, spriteType);

        // Set unique position in Scratch coords (-240..240, -180..180)
        // Predefined spread-out positions across the stage
        const spreadPositions = [
            { x: 120, y: 0 },      // Right area
            { x: -120, y: 0 },     // Left area
            { x: 0, y: 80 },       // Top center
            { x: 0, y: -80 },      // Bottom center
            { x: -160, y: 100 },   // Top-left
            { x: 160, y: 100 },    // Top-right
            { x: -160, y: -100 },  // Bottom-left
            { x: 160, y: -100 },   // Bottom-right
        ];

        const MIN_DIST = 80;
        let assigned = false;
        for (const pos of spreadPositions) {
            const tooClose = sprites.some(s => {
                const dx = Math.abs(s.x - pos.x);
                const dy = Math.abs(s.y - pos.y);
                return dx < MIN_DIST && dy < MIN_DIST;
            });
            if (!tooClose) {
                newSprite.setX(pos.x);
                newSprite.setY(pos.y);
                assigned = true;
                break;
            }
        }
        if (!assigned) {
            newSprite.setX(Math.random() * 320 - 160);
            newSprite.setY(Math.random() * 240 - 120);
        }

        animationVM.registerSprite(newSprite);
        setSprites(prev => [...prev, newSprite]);
        setSelectedSpriteId(id);
        // Clear workspace for the new sprite
        if (workspaceRef.current) workspaceRef.current.clear();
        addLog(`Added sprite: ${name}`);
    }, [sprites, addLog, triggerUpdate, saveCurrentSpriteWorkspace]);

    const deleteSprite = useCallback((id: string) => {
        animationVM.unregisterSprite(id);
        spriteWorkspacesRef.current.delete(id); // Clean up saved workspace
        setSprites(prev => prev.filter(s => s.id !== id));
        if (selectedSpriteId === id) {
            const remaining = sprites.filter(s => s.id !== id);
            const newSelected = remaining.length > 0 ? remaining[0].id : null;
            setSelectedSpriteId(newSelected);
            if (newSelected) loadSpriteWorkspace(newSelected);
            else if (workspaceRef.current) workspaceRef.current.clear();
        }
        addLog('Deleted sprite');
    }, [sprites, selectedSpriteId, addLog, loadSpriteWorkspace]);

    // ═══════════════════════════════════════════════════════════════════════
    // ANIMATION CONTROLS
    // ═══════════════════════════════════════════════════════════════════════
    const handleRunClick = useCallback(() => {
        console.log('[APP] ══════════════════════════════════════════');
        console.log('[APP] Run button clicked - MULTI-SPRITE MODE');
        console.log('[APP] All sprites:', sprites.map(s => ({ id: s.id, name: s.name })));

        // Check if execution was paused (stopped by stop_all block)
        if (animationVM.isPaused) {
            console.log('[APP] Resuming paused animation...');
            setIsRunning(true);
            animationVM.resume();
            addLog('Resumed animation');
            return;
        }

        // Save current sprite's workspace before compiling all
        saveCurrentSpriteWorkspace();

        // Compile scripts for ALL sprites by loading each sprite's saved workspace
        const allScripts: CompiledScript[] = [];

        for (const sprite of sprites) {
            const savedJson = spriteWorkspacesRef.current.get(sprite.id);
            if (!savedJson || Object.keys(savedJson).length === 0) {
                console.log(`[APP] Sprite ${sprite.name} has no blocks, skipping`);
                continue;
            }

            let tempWs: Blockly.Workspace | null = null;
            try {
                // Disable Blockly events to prevent FocusManager crash on temp workspace
                Blockly.Events.disable();
                tempWs = new Blockly.Workspace();
                Blockly.serialization.workspaces.load(savedJson, tempWs);
                Blockly.Events.enable();

                const compiler = new AnimationCompiler(sprite.id);
                const scripts = compiler.compile(tempWs);
                console.log(`[APP] Compiled ${scripts.length} scripts for sprite: ${sprite.name}`);
                allScripts.push(...scripts);

                tempWs.dispose();
                tempWs = null;
            } catch (e) {
                Blockly.Events.enable();
                console.error(`[APP] Error compiling sprite ${sprite.name}:`, e);
                if (tempWs) { try { tempWs.dispose(); } catch (_) { } }
            }
        }

        if (allScripts.length === 0) {
            console.log('[APP] ✗ No scripts to run across all sprites!');
            addLog('No scripts to run!');
            return;
        }

        console.log(`[APP] Total scripts across all sprites: ${allScripts.length}`);
        allScripts.forEach((s, i) => {
            console.log(`[APP]   ${i}: trigger=${s.trigger}, spriteId=${s.spriteId}, steps=${s.steps.length}`);
        });

        // Soft reset: clear speech bubbles and effects but preserve positions
        sprites.forEach(s => {
            if (s.sayText) s.clearSay();
            s.clearEffects();
        });

        setIsRunning(true);
        setCompiledScripts(allScripts);
        animationVM.triggerFlag(allScripts);
        addLog(`Started animation for ${sprites.length} sprite(s)`);
        console.log('[APP] ══════════════════════════════════════════');
    }, [sprites, addLog, saveCurrentSpriteWorkspace]);


    const handleStopClick = useCallback(() => {
        setIsRunning(false);
        animationVM.stopAll();

        // Clear highlight
        if (workspaceRef.current) {
            // @ts-ignore
            workspaceRef.current.highlightBlock(null);
        }

        hardwareAdapter.stopAllPolling();
        addLog('Stopped animation');
    }, [addLog]);

    // ═══════════════════════════════════════════════════════════════════════
    // HARDWARE CONTROLS
    // ═══════════════════════════════════════════════════════════════════════
    const refreshPorts = useCallback(async () => {
        try {
            const portList = await window.electronAPI.getPorts();
            setPorts(portList);
            if (portList.length === 0) {
                // Only log if manual refresh was clicked, or be subtle? 
                // We'll keep it simple for now. The UI says "Searching..."
            }
        } catch (e) {
            addLog('Failed to scan ports');
        }
    }, [addLog]);

    // Auto-refresh ports every 5 seconds when in upload mode and no port is selected
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (editorMode === 'upload' && !selectedPort && !isConnected) {
            timer = setInterval(() => {
                window.electronAPI.getPorts().then(portList => {
                    setPorts(portList);
                }).catch(() => { });
            }, 5000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [editorMode, selectedPort, isConnected]);

    // Auto-reconnect when baud rate changes while connected
    useEffect(() => {
        if (isConnected && selectedPort) {
            log.app(`Baud rate changed to ${baudRate}, reconnecting...`);
            const timer = setTimeout(() => {
                handleConnect(); // Disconnect
                setTimeout(() => {
                    handleConnect(); // Reconnect with new baud
                }, 500);
            }, 100);
            return () => clearTimeout(timer);
        }
        // We only want to trigger this when baudRate specifically changes while connected
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [baudRate]);


    const handleConnect = useCallback(async () => {
        if (!selectedPort) {
            addLog('Select a port first');
            return;
        }
        if (selectedPort === 'BRIDGE_DETECTED') {
            addLog('⚠ Device detected but no COM port assigned. Please install drivers or try a different USB cable.');
            return;
        }
        try {
            if (isConnected) {
                const result = await window.electronAPI.disconnectPort();
                if (result.success) {
                    setIsConnected(false);
                    addLog(`Disconnected from ${selectedPort}`);
                }
            } else {
                const result = await window.electronAPI.connectPort(selectedPort, baudRate, selectedBoard);
                if (result.success) {
                    setIsConnected(true);
                    addLog(`Connected to ${selectedPort}`);
                } else {
                    addLog(`Connection failed: ${result.error}`);
                }
            }
        } catch (e) {
            addLog('Connection error');
        }
    }, [selectedPort, isConnected, baudRate, addLog]);

    const handleSendSerial = useCallback(async (data: string) => {
        if (!isConnected) return;
        try {
            await window.electronAPI.sendSerial(data);
            setSerialMessages(prev => [...prev.slice(-100), `> ${data.trim()}`]);
        } catch (e) {
            addLog('Failed to send');
        }
    }, [isConnected, addLog]);

    const handleUpload = useCallback(async () => {
        if (!generatedCode || isUploading) return;

        if (!selectedPort) {
            addLog('No port selected! Please connect your board and select a COM port first.');
            setUploadProgress('No port selected');
            return;
        }

        // Clear old serial data before new upload
        setSerialMessages([]);

        // Auto-disconnect if serial is connected to release the port
        if (isConnected) {
            addLog('Disconnecting serial for upload...');
            await window.electronAPI.disconnectPort();
            setIsConnected(false);

            // Critical delay: Windows needs time to physically release the COM port 
            // before avrdude sweeps it for compiling/uploading to prevent getsync() errors.
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        setIsUploading(true);
        setUploadProgress('Uploading...');
        addLog('Starting upload...');

        // Map board ID to FQBN
        const fqbnMap: Record<string, string> = {
            'arduino_uno': 'arduino:avr:uno',
            'arduino_mega': 'arduino:avr:mega',
            'arduino_nano': 'arduino:avr:nano',
            'esp32': 'esp32:esp32:esp32', // Generic ESP32 dev board (NodeMCU, DOIT, etc.)
        };
        const fqbn = fqbnMap[selectedBoard] || 'arduino:avr:uno';

        try {
            const result = await window.electronAPI.uploadCode(generatedCode, selectedPort, fqbn);
            if (result.success) {
                addLog('Upload complete!');
                setUploadProgress('Upload complete!');

                // Always auto-connect serial after successful upload to show sensor data
                if (selectedPort) {
                    addLog('Connecting serial monitor...');
                    setActiveTab('serial'); // Auto-switch to serial monitor tab
                    setTimeout(async () => {
                        try {
                            const reconnectResult = await window.electronAPI.connectPort(selectedPort, baudRate, selectedBoard);
                            if (reconnectResult.success) {
                                setIsConnected(true);
                                addLog('Serial monitor connected — showing live data');
                            }
                        } catch (reconnectErr) {
                            console.error('Auto-reconnect failed:', reconnectErr);
                        }
                        setIsUploading(false); // Close modal AFTER reconnect attempt
                    }, 2000); // 2s delay to allow board to initialize after upload
                } else {
                    setIsUploading(false);
                }
            } else {
                let errorMsg = result.error || 'Unknown error occurred';
                if (errorMsg.includes('busy') || errorMsg.includes('Access is denied')) {
                    errorMsg += "\nTIP: Close any other serial monitors or wait 2 seconds and try again.";
                }
                addLog(`Upload failed: ${errorMsg}`);
                setUploadProgress(`Failed: ${errorMsg}`);
                setIsUploading(false);
            }
        } catch (e) {
            addLog('Upload error');
            setUploadProgress('Upload error');
            setIsUploading(false);
        }
    }, [generatedCode, isUploading, addLog, selectedPort, selectedBoard, isConnected, baudRate]);

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    // Create default sprite FIRST (before workspace) so it's available for compilation
    useEffect(() => {
        if (editorMode === 'stage' && sprites.length === 0) {
            console.log('[APP] Creating default sprite...');
            const defaultSprite = new Sprite('sprite_default', 'Robot', triggerUpdate, 'robot');
            // Scratch coords: (0,0) is center of stage
            defaultSprite.setX(0);
            defaultSprite.setY(0);

            // Add robot costumes
            const loadCostumes = async () => {
                await defaultSprite.addCostume('idle', '/assets/sprites/robot/robot_idle.svg');
                await defaultSprite.addCostume('wave 1', '/assets/sprites/robot/robot_wave1.svg');
                await defaultSprite.addCostume('wave 2', '/assets/sprites/robot/robot_wave2.svg');
                await defaultSprite.addCostume('talk', '/assets/sprites/robot/robot_talk1.svg');
                triggerUpdate();
            };
            loadCostumes().catch(err => console.error('[APP] Failed to initialize costumes:', err));

            animationVM.registerSprite(defaultSprite);
            setSprites([defaultSprite]);
            setSelectedSpriteId('sprite_default');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Initialize Blockly workspace AFTER sprite state is set
    useEffect(() => {
        log.app('Initializing Blockly workspace');

        if (blocklyDiv.current && !workspaceRef.current) {
            workspaceRef.current = Blockly.inject(blocklyDiv.current, {
                toolbox: getCurrentToolbox(),
                grid: { spacing: 20, length: 3, colour: '#e8e8e8', snap: true },
                zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
                trashcan: true,
                sounds: false,
                renderer: 'zelos',
                theme: Blockly.Theme.defineTheme('leapblocks', {
                    name: 'leapblocks',
                    base: Blockly.Themes.Zelos,
                    componentStyles: {
                        workspaceBackgroundColour: '#f9f9f9',
                        toolboxBackgroundColour: '#ffffff',
                        toolboxForegroundColour: '#575E75',
                        flyoutBackgroundColour: '#f9f9f9',
                        flyoutForegroundColour: '#575E75',
                        flyoutOpacity: 1,
                        scrollbarColour: '#ccc',
                        insertionMarkerColour: '#000',
                        insertionMarkerOpacity: 0.3,
                        scrollbarOpacity: 0.4,
                        cursorColour: '#d0d0d0',


                    },
                }),
            });

            const flyout = workspaceRef.current.getFlyout();
            if (flyout) {
                flyout.autoClose = false;
            }

            // ZOOM & TOOLBOX FIX: Lock flyout scale so it never changes with workspace zoom.
            // ROOT CAUSE: Blockly's reflowInternal_() directly sets:
            //   this.workspace_.scale = this.getFlyoutScale()
            // And getFlyoutScale() by default returns this.targetWorkspace.scale (the zoomed scale).
            // By overriding getFlyoutScale() we intercept ALL scale sync paths.
            const initialWs = workspaceRef.current;
            if (initialWs) {
                const flyout = initialWs.getFlyout() as any;
                if (flyout) {
                    const FIXED_SCALE = 0.9;
                    flyout.getFlyoutScale = () => FIXED_SCALE;
                    // Also immediately apply the fixed scale
                    if (flyout.getWorkspace()) {
                        flyout.getWorkspace().setScale(FIXED_SCALE);
                    }
                }
            }

            // Dynamic Dropdown Colors: Update highlight and background color based on block color
            if (!(Blockly.FieldDropdown.prototype as any)._originalShowEditor) {
                (Blockly.FieldDropdown.prototype as any)._originalShowEditor = (Blockly.FieldDropdown.prototype as any).showEditor_;
                (Blockly.FieldDropdown.prototype as any).showEditor_ = function (this: Blockly.FieldDropdown, opt_e: any) {
                    const block = this.getSourceBlock();
                    if (block) {
                        const color = block.getColour();
                        document.documentElement.style.setProperty('--blockly-menu-highlight-color', color);
                        // Add a subtle tint for the background (10% opacity)
                        const tint = color.startsWith('#') ? `${color}1A` : 'rgba(0,0,0,0.05)';
                        document.documentElement.style.setProperty('--blockly-menu-bg-color', tint);
                    }
                    (this as any)._originalShowEditor(opt_e);
                };
            }

            addLog('Blockly workspace initialized');
        }

        // Set up serial data listener (only if electronAPI is available)
        if (window.electronAPI?.onSerialData) {
            window.electronAPI.onSerialData((data) => {
                setSerialMessages(prev => [...prev.slice(-100), data]);
            });
        }

        if (window.electronAPI?.onConnectionChange) {
            window.electronAPI.onConnectionChange((connected) => {
                setIsConnected(connected);
            });
        }

        if (window.electronAPI?.onUploadProgress) {
            window.electronAPI.onUploadProgress((progress, message) => {
                setUploadProgress(`${progress}%: ${message}`);
            });
        }

        // Initial port scan
        if (window.electronAPI?.getPorts) {
            window.electronAPI.getPorts().then(portList => {
                setPorts(portList);
            });
        }

        // --- VM CALLBACKS ---
        animationVM.onRunningChange = (running) => {
            setIsRunning(running);
        };

        return () => {
            if (window.electronAPI?.removeAllListeners) {
                window.electronAPI.removeAllListeners();
            }
            if (workspaceRef.current) {
                workspaceRef.current.dispose();
                workspaceRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update workspace change listener whenever sprites/selectedSpriteId change
    // This ensures the listener closure has the latest state
    useEffect(() => {
        if (workspaceRef.current) {
            // Remove old listener and add new one with updated closure
            workspaceRef.current.removeChangeListener(handleWorkspaceChange);
            workspaceRef.current.addChangeListener(handleWorkspaceChange);

            workspaceRef.current.removeChangeListener(handleBlockInteraction);
            workspaceRef.current.addChangeListener(handleBlockInteraction);

            // Trigger an initial recompile with the current workspace state
            if (sprites.length > 0 && selectedSpriteId) {
                console.log('[APP] Sprites/selection changed, triggering recompile...');
                handleWorkspaceChange({ isUiEvent: false } as Blockly.Events.Abstract);
            }
        }

        // Register highlighting callback that knows about the selectedSpriteId
        animationVM.onHighlightBlock = (spriteId, blockId) => {
            if (workspaceRef.current && spriteId === selectedSpriteId) {
                // @ts-ignore
                workspaceRef.current.highlightBlock(blockId);
            }
        };

        // Clear highlight initially
        if (workspaceRef.current) {
            // @ts-ignore
            workspaceRef.current.highlightBlock(null);
        }
    }, [sprites, selectedSpriteId, handleWorkspaceChange, handleBlockInteraction]);

    // Reinitialize workspace when appMode changes (e.g., from home to blocks/junior)
    // This ensures the correct toolbox is shown
    // Reinitialize workspace when appMode or editorMode changes
    useEffect(() => {
        if (appMode === 'blocks' && blocklyDiv.current) {
            console.log('[APP] Mode changed (App:', appMode, 'Editor:', editorMode, ') - reinitializing workspace');

            // Dispose existing workspace
            if (workspaceRef.current) {
                workspaceRef.current.dispose();
                workspaceRef.current = null;
            }

            // Short timeout to ensure DOM is ready and ref is updated
            const timer = setTimeout(() => {
                if (blocklyDiv.current) {
                    // Inject Blockly
                    const blocksWorkspace = Blockly.inject(blocklyDiv.current, {
                        toolbox: getCurrentToolbox(),
                        grid: { spacing: 20, length: 3, colour: '#e8e8e8', snap: true },
                        zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
                        trashcan: true,
                        sounds: false,
                        renderer: 'zelos',
                        theme: Blockly.Theme.defineTheme('leapblocks', {
                            name: 'leapblocks',
                            base: Blockly.Themes.Zelos,
                            componentStyles: {
                                workspaceBackgroundColour: '#f9f9f9',
                                toolboxBackgroundColour: '#ffffff',
                                toolboxForegroundColour: '#575E75',
                                flyoutBackgroundColour: '#f9f9f9',
                                flyoutForegroundColour: '#575E75',
                                flyoutOpacity: 1,
                                scrollbarColour: '#ccc',
                                insertionMarkerColour: '#4C97FF',
                                insertionMarkerOpacity: 0.3,
                                scrollbarOpacity: 0.4,
                                cursorColour: '#d0d0d0',
                            },
                        }),
                    });

                    workspaceRef.current = blocksWorkspace;

                    // ZOOM & TOOLBOX FIX: Lock flyout scale permanently.
                    // Override getFlyoutScale() — this is what Blockly's reflowInternal_() reads.
                    if (blocksWorkspace) {
                        const flyout = blocksWorkspace.getFlyout() as any;
                        if (flyout) {
                            flyout.autoClose = false;
                            const FIXED_SCALE = 0.9;
                            flyout.getFlyoutScale = () => FIXED_SCALE;
                            if (flyout.getWorkspace()) {
                                flyout.getWorkspace().setScale(FIXED_SCALE);
                            }
                        }
                    }

                    // Auto-open toolbox on load/mode switch
                    setTimeout(() => {
                        if (workspaceRef.current) {
                            const toolbox = workspaceRef.current.getToolbox();
                            if (toolbox) {
                                toolbox.selectItemByPosition(0);
                            }
                        }
                    }, 50);

                    // Register custom variable category callback
                    workspaceRef.current.registerToolboxCategoryCallback('LEAP_VARIABLES', (ws: any) => {
                        const xmlList: Element[] = [];
                        const btn = document.createElement('button');
                        btn.setAttribute('text', 'Make a Variable');
                        btn.setAttribute('callbackKey', 'CREATE_VARIABLE');
                        xmlList.push(btn); // Standard vars button

                        const allVars = ws.getAllVariables() || [];
                        const scalars = allVars.filter((v: any) => v.type === '' || v.type === 'Number' || v.type === 'String');
                        const lists = allVars.filter((v: any) => v.type === 'list'); // Filter by 'list' type

                        // 1. Scalar Variables
                        scalars.sort((a: any, b: any) => a.name.localeCompare(b.name));
                        if (scalars.length > 0) {
                            const firstVar = scalars[0];
                            scalars.forEach((v: any) => {
                                const block = document.createElement('block');
                                block.setAttribute('type', 'variables_get');
                                const field = document.createElement('field');
                                field.setAttribute('name', 'VAR');
                                field.setAttribute('id', v.getId());
                                field.setAttribute('variabletype', v.type);
                                field.textContent = v.name;
                                block.appendChild(field);
                                xmlList.push(block);
                            });

                            const blockTypes = [
                                'variables_set_intermediate',
                                'data_setvariableto',
                                'data_changevariableby',
                                'data_showvariable',
                                'data_hidevariable'
                            ];
                            const defaultVar = scalars[scalars.length - 1]; // Use last created or simply one of them
                            blockTypes.forEach((type) => {
                                const block = document.createElement('block');
                                block.setAttribute('type', type);
                                if (defaultVar) {
                                    const field = document.createElement('field');
                                    field.setAttribute('name', 'VARIABLE');
                                    field.setAttribute('id', defaultVar.getId());
                                    field.setAttribute('variabletype', defaultVar.type);
                                    field.textContent = defaultVar.name;
                                    block.appendChild(field);
                                }
                                if (type === 'variables_set_intermediate' || type === 'data_setvariableto' || type === 'data_changevariableby') {
                                    const value = document.createElement('value');
                                    value.setAttribute('name', 'VALUE');
                                    const shadow = document.createElement('shadow');
                                    shadow.setAttribute('type', 'arduino_number');
                                    const field = document.createElement('field');
                                    field.setAttribute('name', 'NUM');
                                    field.textContent = type === 'data_changevariableby' ? '1' : '0';
                                    shadow.appendChild(field);
                                    value.appendChild(shadow);
                                    block.appendChild(value);
                                }
                                xmlList.push(block);
                            });
                        }

                        // 2. Lists
                        const btnList = document.createElement('button');
                        btnList.setAttribute('text', 'Make a List');
                        btnList.setAttribute('callbackKey', 'CREATE_LIST');
                        xmlList.push(btnList);

                        lists.sort((a: any, b: any) => a.name.localeCompare(b.name));
                        if (lists.length > 0) {
                            lists.forEach((v: any) => {
                                const block = document.createElement('block');
                                block.setAttribute('type', 'data_listcontents'); // Reporter
                                // Ensure field name matches block definition (LIST)
                                const field = document.createElement('field');
                                field.setAttribute('name', 'LIST');
                                field.setAttribute('id', v.getId());
                                field.textContent = v.name;
                                block.appendChild(field);
                                xmlList.push(block);
                            });

                            const listBlockTypes = [
                                'data_addtolist',
                                'data_deleteoflist',
                                'data_deletealloflist',
                                'data_insertatlist',
                                'data_replaceitemoflist',
                                'data_itemoflist',
                                'data_itemnumoflist',
                                'data_lengthoflist',
                                'data_listcontainsitem',
                                'data_showlist',
                                'data_hidelist'
                            ];
                            const defaultList = lists[lists.length - 1];

                            listBlockTypes.forEach(type => {
                                const block = document.createElement('block');
                                block.setAttribute('type', type);
                                if (defaultList) {
                                    const field = document.createElement('field');
                                    field.setAttribute('name', 'LIST');
                                    field.setAttribute('id', defaultList.getId());
                                    field.setAttribute('variabletype', 'list');
                                    field.textContent = defaultList.name;
                                    block.appendChild(field);
                                }
                                // Add default values/shadows for inputs if needed
                                // e.g. for 'ITEM' or 'INDEX'
                                // For now, basic block is fine, user can drag inputs.
                                // Adding a shadow text/number would be nice but not strictly required for parity check.
                                xmlList.push(block);
                            });
                        }

                        return xmlList;
                    });

                    // Register button callback for "Make a Variable"
                    workspaceRef.current.registerButtonCallback('CREATE_VARIABLE', ((btn: any) => {
                        setPromptState({
                            isOpen: true,
                            message: 'New variable name:',
                            defaultValue: '',
                            callback: (name) => { /* handled in prompt */ },
                            type: 'variable',
                        });
                        setPromptInput('');
                        setVariableType('');
                        setVariableScope('global');
                    }));

                    // Register button callback for "Make a List"
                    workspaceRef.current.registerButtonCallback('CREATE_LIST', ((btn: any) => {
                        setPromptState({
                            isOpen: true,
                            message: 'New list name:',
                            defaultValue: '',
                            callback: (name) => { /* handled in prompt */ },
                            type: 'list', // New type
                        });
                        setPromptInput('');
                        setVariableType('list'); // Reuse or ignore
                        setVariableScope('global');
                    }));

                    workspaceRef.current.addChangeListener(handleWorkspaceChange);

                    // Restore the selected sprite's blocks after workspace re-initialization
                    if (selectedSpriteId) {
                        const savedJson = spriteWorkspacesRef.current.get(selectedSpriteId);
                        if (savedJson && Object.keys(savedJson).length > 0) {
                            console.log('[APP] Restoring workspace for sprite after re-init:', selectedSpriteId);
                            Blockly.serialization.workspaces.load(savedJson, blocksWorkspace);
                        }
                    }

                    addLog(`Workspace initialized for ${editorMode === 'stage' ? 'Stage' : 'Upload'} mode`);
                }
            }, 0);

            return () => clearTimeout(timer);
        }
    }, [appMode, editorMode, getCurrentToolbox, handleWorkspaceChange, addLog]);

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════

    // Show "Coming Soon" placeholder for unimplemented modes (not blocks)
    if (appMode !== 'blocks') {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#855CD6',
                color: 'white',
                fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
            }}>
                <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>
                    {appMode === 'python' && '🐍 Py Editor'}
                    {appMode === 'notebook' && '📓 Py Notebook'}
                    {appMode === 'ml' && '🧠 Machine Learning'}
                    {appMode === 'xr' && '🌐 3D & XR Studio'}
                </h1>
                <p style={{ fontSize: '24px', opacity: 0.8, marginBottom: '32px' }}>Coming Soon!</p>
                <button
                    onClick={() => setAppMode('blocks')}
                    style={{
                        padding: '12px 32px',
                        fontSize: '18px',
                        backgroundColor: 'white',
                        color: '#855CD6',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                    }}
                >
                    ← Back to Editor
                </button>
            </div>
        );
    }

    // Main Block Editor UI
    return (
        <div style={styles.container}>
            {/* Premium Menu Bar */}
            <MenuBar
                onBack={onBack}
                projectName={projectName}
                onProjectNameChange={setProjectName}
                mode={editorMode}
                onModeChange={(m: string) => switchEditorMode(m as EditorMode)}
                selectedBoard={selectedBoardName}
                onBoardSelect={() => setIsBoardModalOpen(true)}
                connectionStatus={isConnected ? "connected" : "disconnected"}
                onConnect={handleConnect}
                // @ts-ignore
                ports={ports as any}
                selectedPort={selectedPort}
                onPortSelect={setSelectedPort}
                onRefreshPorts={refreshPorts}
                onUpload={handleUpload}
                isUploading={isUploading}
                onFileAction={(action: string) => addLog(`File action: ${action}`)}
                onEditAction={(action: string) => addLog(`Edit action: ${action}`)}
            />

            {/* Main Content */}
            <div style={styles.main}>
                {/* Blockly Workspace with Tabs */}
                <div style={styles.workspaceContainer}>
                    {/* PictoBlox-style tabs - ONLY in Stage Mode */}
                    {appMode === 'blocks' && editorMode === 'stage' && (
                        <div style={styles.tabBar}>
                            <div style={{ display: 'flex', height: '100%' }}>
                                <button
                                    style={workspaceTab === 'blocks' ? styles.tabActive : styles.tab}
                                    onClick={() => setWorkspaceTab('blocks')}
                                >
                                    🧩 Blocks
                                </button>
                                <button
                                    style={workspaceTab === 'python' ? styles.tabActive : styles.tab}
                                    onClick={() => setWorkspaceTab('python')}
                                >
                                    🐍 Python
                                </button>
                                <button
                                    style={workspaceTab === 'costumes' ? styles.tabActive : styles.tab}
                                    onClick={() => setWorkspaceTab('costumes')}
                                >
                                    🎨 Costumes
                                </button>
                                <button
                                    style={workspaceTab === 'sounds' ? styles.tabActive : styles.tab}
                                    onClick={() => setWorkspaceTab('sounds')}
                                >
                                    🔊 Sounds
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Workspace content */}
                    {/* Show Blockly if:
                        1. In Stage mode AND 'blocks' tab is active
                        2. In Upload mode (always shows blocks)
                    */}
                    {((editorMode === 'stage' && workspaceTab === 'blocks') || editorMode === 'upload') && (
                        <>
                            {/* Selected Sprite Indicator overlay */}
                            {editorMode === 'stage' && (
                                (() => {
                                    const activeSprite = sprites.find(s => s.id === selectedSpriteId);
                                    if (activeSprite && activeSprite.currentCostume) {
                                        return (
                                            <div style={{
                                                position: 'absolute',
                                                top: '16px',
                                                right: '16px',
                                                width: '60px',
                                                height: '60px',
                                                background: 'white',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                border: '2px solid #855CD6',
                                                pointerEvents: 'none',
                                                zIndex: 10,
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                padding: '6px',
                                            }}>
                                                <img
                                                    src={activeSprite.currentCostume.image.src}
                                                    alt={activeSprite.name}
                                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                                />
                                            </div>
                                        );
                                    }
                                    return null;
                                })()
                            )}
                            <div ref={blocklyDiv} style={styles.blockly} />
                            <WorkspaceControls workspaceRef={workspaceRef} onAfterZoom={undefined} style={undefined} />
                            <WorkspaceTrash workspaceRef={workspaceRef} />
                        </>
                    )}

                    {/* Other Tabs - Only relevant in Stage Mode */}
                    {editorMode === 'stage' && workspaceTab === 'python' && (
                        <div style={styles.pythonEditor}>
                            <div style={styles.pythonPlaceholder}>
                                <span style={{ fontSize: '48px' }}>🐍</span>
                                <h3>Python Editor</h3>
                                <p>Coming soon! Write Python code to control your sprites.</p>
                            </div>
                        </div>
                    )}
                    {editorMode === 'stage' && workspaceTab === 'costumes' && (
                        <div style={styles.costumesEditor}>
                            {(() => {
                                const selectedSprite = sprites.find(s => s.id === selectedSpriteId);
                                if (selectedSprite) {
                                    return (
                                        <PaintEditor
                                            mode="intermediate"
                                            spriteName={selectedSprite.name}
                                            initialImage={selectedSprite.currentCostume?.image.src || ''}
                                            costumes={selectedSprite.costumes.map((c, i) => ({
                                                id: i.toString(),
                                                name: c.name,
                                                image: c.image.src
                                            }))}
                                            onSave={async (imageData: string, svgData?: string) => {
                                                const savedData = svgData || imageData;
                                                await selectedSprite.addCostume('custom', savedData);
                                                selectedSprite.switchCostume('custom');
                                                addLog(`Saved costume for ${selectedSprite.name}`);
                                            }}
                                            onClose={() => setWorkspaceTab('blocks')}
                                        />
                                    );
                                }
                                return (
                                    <div style={styles.costumePlaceholder}>
                                        <span style={{ fontSize: '48px' }}>🎨</span>
                                        <h3>No Sprite Selected</h3>
                                        <p>Select a sprite from the panel to edit its costumes.</p>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                    {editorMode === 'stage' && workspaceTab === 'sounds' && (
                        <div style={styles.soundsEditor}>
                            <div style={styles.soundPlaceholder}>
                                <span style={{ fontSize: '48px' }}>🔊</span>
                                <h3>Sounds Editor</h3>
                                <p>Coming soon! Add and edit sounds for your project.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel */}
                <div style={styles.rightPanel}>
                    {editorMode === 'stage' ? (
                        <>
                            {/* Stage */}
                            {/* Stage */}
                            <div style={styles.stageContainer}>
                                <div style={styles.iconBar}>
                                    <div style={styles.actionButtons}>
                                        <button
                                            style={styles.runButtonTop}
                                            onClick={handleRunClick}
                                            title="Run"
                                        >
                                            <Flag size={22} fill="white" stroke="white" />
                                        </button>
                                        <button
                                            style={styles.stopButtonTop}
                                            onClick={handleStopClick}
                                            title="Stop"
                                        >
                                            <Square size={20} fill="white" stroke="white" />
                                        </button>
                                    </div>

                                    <div style={styles.layoutButtons}>
                                        <button
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                background: 'white', color: '#575E75', border: '1px solid #D9D9D9',
                                                padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                                                fontWeight: '600', fontSize: '12px', marginRight: '8px'
                                            }}
                                            onClick={() => alert("Upload Firmware (Coming Soon)")}
                                            title="Upload Firmware"
                                        >
                                            <Upload size={16} color="#855CD6" /> Upload Firmware
                                        </button>

                                        <div style={{ width: '1px', height: '24px', background: '#d9d9d9', margin: '0 4px' }} />

                                        <button
                                            style={{ ...styles.iconBtn, ...(isCameraOn ? styles.iconBtnActive : {}) }}
                                            onClick={() => setIsCameraOn(!isCameraOn)}
                                            title="Toggle Camera"
                                        >
                                            {isCameraOn ? <Camera size={20} /> : <CameraOff size={20} />}
                                        </button>

                                        <button
                                            style={{ ...styles.iconBtn, ...(showGrid ? styles.iconBtnActive : {}) }}
                                            onClick={() => setShowGrid(!showGrid)}
                                            title="Toggle Grid"
                                        >
                                            <Grid3X3 size={20} />
                                        </button>

                                        <button
                                            style={{ ...styles.iconBtn, ...(stageLayout === 'small' ? styles.iconBtnActive : {}) }}
                                            onClick={() => setStageLayout('small')}
                                            title="Small Stage"
                                        >
                                            <LayoutTemplate size={20} />
                                        </button>
                                        <button
                                            style={{ ...styles.iconBtn, ...(stageLayout === 'large' ? styles.iconBtnActive : {}) }}
                                            onClick={() => setStageLayout('large')}
                                            title="Large Stage"
                                        >
                                            <LayoutPanelLeft size={20} />
                                        </button>

                                        <button
                                            style={{ ...styles.iconBtn, ...(isFullscreen ? styles.iconBtnActive : {}) }}
                                            onClick={() => setIsFullscreen(!isFullscreen)}
                                            title="Fullscreen"
                                        >
                                            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <Stage
                                    width={480}
                                    height={360}
                                    sprites={sprites}
                                    isRunning={isRunning}
                                    showGridNumbers={showGrid}
                                    onSpriteSelect={handleSpriteSelect}
                                    isCameraOn={isCameraOn}
                                />
                            </div>

                            {/* Sprite & Stage Panels */}
                            <div style={styles.assetsContainer}>
                                <SpritePanel
                                    sprites={sprites}
                                    selectedSpriteId={selectedSpriteId}
                                    onSelectSprite={handleSpriteSelect}
                                    onAddSprite={addSprite}
                                    onDeleteSprite={deleteSprite}
                                    onOpenSpriteLibrary={() => setShowSpriteLibrary(true)}
                                />
                                <StagePanel
                                    onOpenLibrary={() => setShowBackdropLibrary(true)}
                                    onOpenEditor={() => setShowBackdropEditor(true)}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Code Preview */}
                            <div style={styles.codeHeader}>
                                <span>💻 Arduino Code</span>
                                {uploadProgress && <span style={styles.uploadStatus}>{uploadProgress}</span>}
                            </div>
                            <div style={styles.codeArea}>
                                <pre style={styles.codeContent}>
                                    {generatedCode.split('\n').map((line, i) => (
                                        <div key={i} style={styles.codeLine}>
                                            <span style={styles.lineNumber}>{i + 1}</span>
                                            <span>{line}</span>
                                        </div>
                                    ))}
                                </pre>
                            </div>
                        </>
                    )}

                    {/* Bottom tabs - Only visible in Upload mode */}
                    {editorMode !== 'stage' && (
                        <>
                            <div style={styles.bottomTabs}>
                                <button
                                    style={activeTab === 'log' ? styles.bottomTabActive : styles.bottomTab}
                                    onClick={() => setActiveTab('log')}
                                >⏩ Log</button>
                                <button
                                    style={activeTab === 'serial' ? styles.bottomTabActive : styles.bottomTab}
                                    onClick={() => setActiveTab('serial')}
                                >📟 Serial Monitor</button>
                            </div>
                            <div style={styles.logArea}>
                                {activeTab === 'log' ? (
                                    logMessages.map((msg, i) => <div key={i} style={styles.logLine}>{msg}</div>)
                                ) : (
                                    <SerialMonitor
                                        baudRate={baudRate}
                                        setBaudRate={setBaudRate}
                                        lineEnding={lineEnding}
                                        setLineEnding={setLineEnding}
                                        messages={serialMessages}
                                        setMessages={setSerialMessages}
                                        onSendMessage={handleSendSerial}
                                        isConnected={isConnected}
                                    />
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Custom Prompt Modal */}
            {
                promptState.isOpen && (
                    <div style={styles.modalOverlay}>
                        <div style={styles.modalContent}>
                            <div style={{ ...styles.modalTitle, backgroundColor: promptState.type === 'variable' ? '#855CD6' : '#855CD6' }}>
                                {promptState.type === 'variable' ? 'New Variable' : 'Input'}
                                <div
                                    onClick={handlePromptCancel}
                                    style={{ cursor: 'pointer', float: 'right', fontSize: '20px', fontWeight: 'bold' }}
                                >×</div>
                            </div>

                            <div style={{ padding: '20px' }}>
                                {promptState.type === 'variable' && (
                                    <div style={{ marginBottom: '10px', fontSize: '14px', color: '#575E75' }}>
                                        New variable name:
                                    </div>
                                )}

                                <input
                                    ref={(input) => { if (input) input.focus(); }}
                                    type="text"
                                    value={promptInput}
                                    onChange={(e) => setPromptInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handlePromptSubmit();
                                        if (e.key === 'Escape') handlePromptCancel();
                                    }}
                                    style={styles.modalInput}
                                />

                                {promptState.type === 'variable' && (
                                    <>
                                        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '14px', color: '#575E75' }}>Data Type :</span>
                                            <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid #ddd' }}>
                                                <div
                                                    onClick={() => setVariableType('Number')}
                                                    style={{
                                                        padding: '4px 12px',
                                                        backgroundColor: variableType === 'Number' ? '#855CD6' : '#eee',
                                                        color: variableType === 'Number' ? 'white' : '#555',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: 'bold'
                                                    }}
                                                >Number</div>
                                                <div
                                                    onClick={() => setVariableType('String')}
                                                    style={{
                                                        padding: '4px 12px',
                                                        backgroundColor: variableType === 'String' ? '#855CD6' : '#eee',
                                                        color: variableType === 'String' ? 'white' : '#555',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: 'bold'
                                                    }}
                                                >String</div>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '16px', display: 'flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid #ddd' }}>
                                            <div
                                                onClick={() => setVariableScope('global')}
                                                style={{
                                                    flex: 1,
                                                    padding: '8px 12px',
                                                    backgroundColor: variableScope === 'global' ? '#855CD6' : '#eee',
                                                    color: variableScope === 'global' ? 'white' : '#555',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    textAlign: 'center',
                                                    fontWeight: 'bold'
                                                }}
                                            >For all sprites</div>
                                            <div
                                                onClick={() => setVariableScope('local')}
                                                style={{
                                                    flex: 1,
                                                    padding: '8px 12px',
                                                    backgroundColor: variableScope === 'local' ? '#855CD6' : '#eee',
                                                    color: variableScope === 'local' ? 'white' : '#555',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    textAlign: 'center',
                                                    fontWeight: 'bold'
                                                }}
                                            >For this sprite only</div>
                                        </div>
                                    </>
                                )}

                                <div style={styles.modalButtons}>
                                    <button onClick={handlePromptCancel} style={styles.modalCancel}>Cancel</button>
                                    <button onClick={handlePromptSubmit} style={styles.modalSubmit}>OK</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Board Selection Modal */}
            <BoardSelectionModal
                isOpen={isBoardModalOpen}
                onClose={() => setIsBoardModalOpen(false)}
                onSelect={(id: string, name: string) => {
                    setSelectedBoard(id);
                    setSelectedBoardName(name);
                    addLog(`Selected board: ${name}`);
                }}
                currentBoard={selectedBoard}
            />

            {/* Backdrop Modals */}
            {
                showBackdropLibrary && (
                    <BackdropLibrary
                        onSelect={handleBackdropSelect}
                        onClose={() => setShowBackdropLibrary(false)}
                    />
                )
            }
            {
                showBackdropEditor && (
                    <BackdropEditor
                        onClose={() => setShowBackdropEditor(false)}
                    />
                )
            }

            {/* Sprite Library Modal */}
            <SpriteLibrary
                isOpen={showSpriteLibrary}
                onClose={() => setShowSpriteLibrary(false)}
                onSelectSprite={(entry: SpriteEntry) => {
                    // Save current sprite workspace before adding new one
                    saveCurrentSpriteWorkspace();

                    const id = `sprite_${Date.now()}`;
                    const newSprite = new Sprite(id, entry.name, triggerUpdate, 'cat');

                    // If the sprite has an image, use it as the costume
                    if (entry.image) {
                        newSprite.addCostume(entry.name, entry.image).then(() => {
                            newSprite.switchCostume(entry.name);
                        });
                    } else {
                        // Create costume from emoji by drawing on canvas
                        const canvas = document.createElement('canvas');
                        canvas.width = 100;
                        canvas.height = 100;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.font = '72px serif';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(entry.emoji, 50, 55);
                        }
                        const dataUrl = canvas.toDataURL();
                        newSprite.addCostume(entry.name, dataUrl).then(() => {
                            newSprite.switchCostume(entry.name);
                        });
                    }

                    animationVM.registerSprite(newSprite);
                    setSprites(prev => [...prev, newSprite]);
                    setSelectedSpriteId(id);
                    if (workspaceRef.current) workspaceRef.current.clear();
                    setShowSpriteLibrary(false);
                    addLog(`Added sprite: ${entry.name}`);
                }}
                onPaintSprite={() => {
                    setShowSpriteLibrary(false);
                    alert('Paint editor - select a sprite first, then edit its costume');
                }}
            />

            {/* Premium Upload Modal */}
            <UploadModal
                isOpen={isUploading}
                progress={uploadProgress}
            />
        </div >
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 12px',
        height: '48px',
        backgroundColor: '#855CD6',
        color: 'white',
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
    logo: { fontSize: '18px', fontWeight: 'bold' },
    nav: { display: 'flex', gap: '16px', marginLeft: '24px' },
    navItem: { fontSize: '13px', cursor: 'pointer', opacity: 0.9 },
    projectName: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: 'rgba(255,255,255,0.15)',
        padding: '4px 12px',
        borderRadius: '4px',
        marginLeft: '16px',
    },
    projectInput: { background: 'transparent', border: 'none', color: 'white', fontSize: '13px', width: '100px' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '8px' },
    headerDivider: { width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.3)', margin: '0 4px' },
    modeButton: {
        padding: '6px 12px',
        backgroundColor: 'rgba(255,255,255,0.2)',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        fontSize: '12px',
        cursor: 'pointer'
    },
    modeButtonActive: {
        padding: '6px 12px',
        backgroundColor: '#4C97FF',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        fontSize: '12px',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
    portSelect: {
        padding: '4px 8px',
        borderRadius: '4px',
        border: 'none',
        fontSize: '12px',
    },
    uploadButton: {
        padding: '6px 14px',
        backgroundColor: '#4C97FF',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold',
        cursor: 'pointer'
    },
    headerIcon: { cursor: 'pointer', opacity: 0.9, fontSize: '14px' },

    iconBar: {
        background: '#f5f5f5',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        height: '40px',
    },
    actionButtons: { display: 'flex', gap: '12px', alignItems: 'center' },
    layoutButtons: { display: 'flex', gap: '4px', alignItems: 'center' },
    iconBtn: {
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px',
        borderRadius: '4px',
        color: '#855CD6',
        transition: 'background 0.2s',
        outline: 'none',
    },
    iconBtnActive: {
        background: '#e0d6ff',
        color: '#855CD6'
    },
    runButtonTop: {
        backgroundColor: '#2e7d32',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '32px',
        height: '32px',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    stopButtonTop: {
        backgroundColor: '#c62828',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '32px',
        height: '32px',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },

    main: { flex: 1, display: 'flex', overflow: 'hidden' },

    // Workspace
    workspaceContainer: { flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' },
    blockly: { flex: 1, width: '100%' },

    // PictoBlox-style tabs
    tabBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #ddd',
        padding: '0 8px',
        height: '40px',
    },
    tab: {
        padding: '10px 16px',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: '2px solid transparent',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 500,
        color: '#666',
        marginBottom: '-1px',
    },
    tabActive: {
        padding: '10px 16px',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: '2px solid #855CD6',
        backgroundColor: 'white',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 600,
        color: '#855CD6',
        marginBottom: '-1px',
        borderRadius: '8px 8px 0 0',
    },

    // Placeholder editors
    pythonEditor: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e1e1e',
    },
    pythonPlaceholder: {
        textAlign: 'center',
        color: '#888',
    },
    costumesEditor: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    costumePlaceholder: {
        textAlign: 'center',
        color: '#666',
    },
    soundsEditor: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9f9f9',
    },
    soundPlaceholder: {
        textAlign: 'center',
        color: '#666',
    },

    // Right Panel
    rightPanel: {
        width: '496px',
        backgroundColor: '#f5f5f5',
        borderLeft: '1px solid #d9d9d9',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '8px',
    },
    assetsContainer: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Stage
    stageContainer: {
        backgroundColor: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    stageHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 10px',
        backgroundColor: '#f8f8f8',
        borderBottom: '1px solid #e0e0e0',
        fontSize: '12px',
        fontWeight: 500,
    },
    flagButton: {
        padding: '4px 8px',
        border: '1px solid #4CAF50',
        borderRadius: '4px',
        backgroundColor: 'white',
        cursor: 'pointer',
        fontSize: '12px',
        marginRight: '4px',
    },
    stopButtonSmall: {
        padding: '4px 8px',
        border: '1px solid #f44336',
        borderRadius: '4px',
        backgroundColor: 'white',
        cursor: 'pointer',
        fontSize: '12px',
    },

    // Code Panel (Upload Mode)
    codeHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        borderBottom: '1px solid #eee',
        backgroundColor: '#f9f9f9',
        fontSize: '13px',
        fontWeight: 500,
        borderRadius: '8px 8px 0 0',
    },
    uploadCodeBtn: {
        padding: '6px 12px',
        backgroundColor: '#4C97FF',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        fontSize: '11px',
        cursor: 'pointer'
    },
    codeArea: {
        flex: 1,
        overflow: 'auto',
        backgroundColor: '#fafafa',
        borderRadius: '0 0 8px 8px',
        borderBottom: '1px solid #eee',
        borderLeft: '1px solid #eee',
        borderRight: '1px solid #eee',
        borderTop: 'none',
    },
    codeContent: {
        margin: 0,
        padding: '12px',
        fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
        fontSize: '12px',
        lineHeight: '1.6',
        color: '#333',
    },
    codeLine: { display: 'flex' },
    lineNumber: {
        width: '35px',
        paddingRight: '10px',
        textAlign: 'right',
        color: '#999',
        userSelect: 'none'
    },

    bottomTabs: { display: 'flex', borderTop: '1px solid #ddd', marginTop: 'auto' },
    bottomTab: {
        padding: '8px 16px',
        backgroundColor: '#f5f5f5',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: '2px solid transparent',
        fontSize: '12px',
        cursor: 'pointer',
        color: '#666'
    },
    bottomTabActive: {
        padding: '8px 16px',
        backgroundColor: '#ffffff',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: '2px solid #4C97FF',
        fontSize: '12px',
        cursor: 'pointer',
        color: '#4C97FF',
        fontWeight: 'bold'
    },
    logArea: {
        height: '250px',
        overflow: 'auto',
        padding: '8px 12px',
        backgroundColor: '#fff',
        fontSize: '11px',
        fontFamily: 'monospace',
        borderRadius: '0 0 8px 8px',
    },
    logLine: { color: '#666', marginBottom: '2px' },

    // Hardware controls
    refreshButton: {
        padding: '4px 8px',
        backgroundColor: 'rgba(255,255,255,0.2)',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        fontSize: '12px',
        cursor: 'pointer',
    },
    connectButton: {
        padding: '6px 12px',
        backgroundColor: 'rgba(255,255,255,0.2)',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        fontSize: '12px',
        cursor: 'pointer',
    },
    connectedButton: {
        padding: '6px 12px',
        backgroundColor: '#4CAF50',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        fontSize: '12px',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
    uploadButtonDisabled: {
        padding: '6px 14px',
        backgroundColor: '#999',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        fontSize: '12px',
        cursor: 'not-allowed',
    },
    uploadStatus: {
        fontSize: '11px',
        color: '#4CAF50',
    },

    // Serial monitor
    serialContainer: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
    serialMessages: {
        flex: 1,
        overflow: 'auto',
        paddingBottom: '4px',
    },
    serialLine: {
        color: '#333',
        marginBottom: '1px',
        fontFamily: 'monospace',
        fontSize: '11px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
    },
    serialHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 8px',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: '1px solid #eee',
        backgroundColor: '#f9f9f9',
    },
    serialSelect: {
        padding: '2px 4px',
        fontSize: '10px',
        border: '1px solid #ddd',
        borderRadius: '3px',
        outline: 'none',
    },
    clearButton: {
        padding: '2px 6px',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: '12px',
        opacity: 0.7,
        transition: 'opacity 0.2s',
    },
    serialPlaceholder: {
        color: '#999',
        textAlign: 'center',
        padding: '12px',
        fontSize: '11px',
    },
    serialInputRow: {
        display: 'flex',
        gap: '4px',
        paddingTop: '4px',
        borderBottom: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderTop: '1px solid #eee',
    },
    serialInput: {
        flex: 1,
        padding: '4px 8px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '11px',
        fontFamily: 'monospace',
    },
    sendButton: {
        padding: '4px 12px',
        backgroundColor: '#4C97FF',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        fontSize: '11px',
        cursor: 'pointer',
    },

    // Modal Styles
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(2px)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: '8px',
        width: '400px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        animation: 'popIn 0.2s ease-out',
    },
    modalTitle: {
        backgroundColor: '#855CD6',
        color: 'white',
        padding: '12px 16px',
        fontSize: '16px',
        fontWeight: 'bold',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalInput: {
        padding: '12px',
        fontSize: '16px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        width: '100%',
        fontFamily: 'inherit',
        outline: 'none',
        transition: 'border-color 0.2s',
    },
    modalButtons: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
    },
    modalCancel: {
        padding: '8px 16px',
        borderRadius: '6px',
        border: '1px solid #ddd',
        backgroundColor: 'white',
        cursor: 'pointer',
        fontSize: '14px',
        color: '#666',
    },
    modalSubmit: {
        padding: '8px 16px',
        borderRadius: '6px',
        border: 'none',
        backgroundColor: '#4C97FF',
        color: 'white',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
    },
};

export default IntermediateApp;
