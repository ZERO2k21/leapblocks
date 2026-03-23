import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as Blockly from 'blockly';
import { arduinoBlocks, arduinoToolbox } from './blocks/arduino-blocks';
import { esp32Blocks, esp32Toolbox } from './blocks/esp32-blocks';
import { animationBlocks, animationToolbox } from './blocks/animation-blocks';
import { hardwareBlocks } from './blocks/hardware-blocks';
import { arduinoGenerator } from './generators/arduino-generator';
import { AnimationCompiler } from './generators/animation-generator';
import './generators/python-generator'; // Register Python code generation handlers
import { animationVM, CompiledScript } from './vm/AnimationVM';
import { Sprite, SpriteType } from './stage/Sprite';
import Stage from './stage/Stage';
import SpritePanel from './stage/SpritePanel';
import MenuBar from './junior/components/MenuBar';
import BoardSelectionModal from './junior/components/BoardSelectionModal';
import { CostumesTab } from './stage/CostumesTab';
import { SoundsTab } from './stage/SoundsTab';
import { PythonEditorTab } from './components/PythonEditorTab';
// import StagePanel from './stage/StagePanel'; // Temporarily disabled - component needs to be created
import BackdropLibrary from './components/BackdropLibrary';
// import BackdropEditor from './components/BackdropEditor'; // Temporarily disabled
import { stageManager } from './engine/StageManager';
import { hardwareAdapter } from './hardware/HardwareAdapter';
import SerialMonitor from './components/SerialMonitor';
import UploadModal from './components/UploadModal';
import { SpriteLibrary, SpriteEntry } from './components/SpriteLibrary';
import WorkspaceControls from './components/WorkspaceControls';
import WorkspaceTrash from './components/WorkspaceTrash';
import UnsavedWarningModal from './junior/components/UnsavedWarningModal';
import { fileService } from './services/FileService';
import { Flag, Square, Upload, Camera, CameraOff, Grid3X3, Maximize, Minimize, LayoutTemplate, LayoutPanelLeft, Pen, Volume2, Undo2, Redo2, Terminal } from 'lucide-react';
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
// GLOBAL BLOCKLY OVERRIDES
// ═══════════════════════════════════════════════════════════════════════════

// 1. Persist Flyout: Prevent hiding when autoClose is false (Continuous Toolbox)
// Also override show() to always show ALL contents (continuous mode)
let _continuousFlyoutContents: any[] = []; // Module-level storage for continuous flyout contents

if (Blockly.Flyout && !(Blockly.Flyout.prototype as any)._hidePatched) {
    // Set default to false globally
    Blockly.Flyout.prototype.autoClose = false;

    // Override hide: suppress if continuous mode
    const originalHide = Blockly.Flyout.prototype.hide;
    Blockly.Flyout.prototype.hide = function (this: any) {
        if (this.autoClose === false) {
            return; // NEVER hide in continuous mode
        }
        originalHide.call(this);
    };

    // Override setVisible: suppress setVisible(false) if continuous mode
    const originalSetVisible = Blockly.Flyout.prototype.setVisible;
    Blockly.Flyout.prototype.setVisible = function (this: any, visible: boolean) {
        if (this.autoClose === false && visible === false) {
            return; // NEVER make invisible in continuous mode
        }
        originalSetVisible.call(this, visible);
    };

    // Override show: in continuous mode, always show ALL blocks
    const originalShow = Blockly.Flyout.prototype.show;
    Blockly.Flyout.prototype.show = function (this: any, flyoutDef: any) {
        if (this.autoClose === false && _continuousFlyoutContents.length > 0) {
            // Always use the full flattened contents regardless of what Blockly internally requests
            originalShow.call(this, _continuousFlyoutContents);
        } else {
            originalShow.call(this, flyoutDef);
        }
    };

    (Blockly.Flyout.prototype as any)._hidePatched = true;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
// Main app mode: home (welcome screen) or one of the coding modes
type AppMode = 'home' | 'blocks' | 'python' | 'notebook' | 'ml' | 'xr';
// Editor sub-mode for blocks: stage (animation) or upload (hardware)
type EditorMode = 'stage' | 'upload';

const IntermediateApp: React.FC<{ onBack: () => void; onOpenPython?: () => void; openTab?: 'blocks' | 'python' | 'costumes' | 'sounds' }> = ({ onBack, onOpenPython, openTab = 'blocks' }) => {
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
    const [workspaceTab, setWorkspaceTab] = useState<'blocks' | 'python' | 'costumes' | 'sounds'>(openTab);
    const [logMessages, setLogMessages] = useState<string[]>(['Ready']);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        if (openTab && openTab !== workspaceTab) {
            setWorkspaceTab(openTab);
        }
    }, [openTab]);

    // Sprites
    const [sprites, setSprites] = useState<Sprite[]>([]);
    const [selectedSpriteId, setSelectedSpriteId] = useState<string | null>(null);
    const [compiledScripts, setCompiledScripts] = useState<CompiledScript[]>([]);

    // Per-sprite workspace storage: maps spriteId -> Blockly serialized JSON
    const spriteWorkspacesRef = useRef<Map<string, object>>(new Map());
    const activeSpriteIdRef = useRef<string | null>(null); // Tracks true owner of current blocks
    const isLoadingWorkspaceRef = useRef(false);

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
    const [fullscreenScale, setFullscreenScale] = useState(1);
    const stageContainerRef = useRef<HTMLDivElement>(null);

    const handleFullscreen = async () => {
        if (!document.fullscreenElement) {
            if (stageContainerRef.current) {
                try {
                    await stageContainerRef.current.requestFullscreen();
                } catch (err) {
                    console.error("Error attempting to enable fullscreen:", err);
                }
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    useEffect(() => {
        const updateScale = () => {
            if (document.fullscreenElement) {
                const scaleX = window.innerWidth / 480;
                const scaleY = window.innerHeight / 360;
                setFullscreenScale(Math.min(scaleX, scaleY));
            } else {
                setFullscreenScale(1);
            }
        };

        const onFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
            updateScale();
        };

        document.addEventListener('fullscreenchange', onFullscreenChange);
        window.addEventListener('resize', updateScale);

        return () => {
            document.removeEventListener('fullscreenchange', onFullscreenChange);
            window.removeEventListener('resize', updateScale);
        };
    }, []);

    // Backdrop state
    const [showBackdropLibrary, setShowBackdropLibrary] = useState(false);
    const [showBackdropEditor, setShowBackdropEditor] = useState(false);
    const [backdropRefresh, setBackdropRefresh] = useState(0); // Force re-render on backdrop change

    // Sprite Library state
    const [showSpriteLibrary, setShowSpriteLibrary] = useState(false);

    // Dynamic toolbox state for continuous flyout
    const [currentToolboxContents, setCurrentToolboxContents] = useState<any[]>([]);
    const currentToolboxContentsRef = useRef<any[]>([]);
    const lastToolboxJsonRef = useRef<string>('');

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

    // Unsaved Changes Modal State
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<string | null>(null);

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

        // Global click listener to force blur on Blockly input fields
        const handleGlobalClick = (e: MouseEvent) => {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.classList.contains('blocklyHtmlInput')) {
                // Check if the click was *outside* the input field itself
                if (!activeElement.contains(e.target as Node)) {
                    (activeElement as HTMLElement).blur();
                    // Force Blockly's widget div (which holds the input) to hide
                    if (Blockly.WidgetDiv) {
                        Blockly.WidgetDiv.hide();
                    }
                }
            }
        };
        window.addEventListener('mousedown', handleGlobalClick);

        return () => window.removeEventListener('mousedown', handleGlobalClick);
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
        if (editorMode === 'stage') {
            // Remove Pen category from intermediate session
            const filteredContents = animationToolbox.contents.filter((cat: any) => cat.name !== 'Pen');

            if (selectedSpriteId === 'stage') {
                return {
                    ...animationToolbox,
                    contents: filteredContents
                        .filter((cat: any) => cat.name !== 'Motion')
                        .map((cat: any) => {
                            let contents = cat.contents;
                            if (cat.name === 'Looks') {
                                contents = contents.filter((item: any) => {
                                    if (item.kind !== 'block') return true;
                                    const t = item.type;
                                    // Stage does not have costumes, size, or layers in the same way sprites do
                                    return !t.startsWith('looks_say') && !t.startsWith('looks_think') &&
                                        t !== 'looks_show' && t !== 'looks_hide' &&
                                        t !== 'looks_switch_costume' && t !== 'looks_next_costume' &&
                                        t !== 'looks_set_size' && t !== 'looks_change_size' &&
                                        t !== 'looks_go_to_layer' && t !== 'looks_go_forward_layers' &&
                                        t !== 'looks_size' && !t.startsWith('looks_costume_');
                                });
                            } else if (cat.name === 'Events') {
                                contents = contents.map((item: any) =>
                                    (item.kind === 'block' && item.type === 'event_sprite_clicked')
                                        ? { ...item, type: 'event_stage_clicked' } : item
                                );
                            } else if (cat.name === 'Control') {
                                contents = contents.filter((item: any) =>
                                    item.kind !== 'block' || item.type !== 'control_delete_clone'
                                );
                            } else if (cat.name === 'Sensing') {
                                contents = contents.filter((item: any) => {
                                    if (item.kind !== 'block') return true;
                                    const t = item.type;
                                    // Stage cannot touch other things or have distance to them
                                    return t !== 'sensing_touching' && t !== 'sensing_touching_color' &&
                                        t !== 'sensing_color_touching_color' && t !== 'sensing_distance_to';
                                });
                            }
                            return { ...cat, contents };
                        })
                };
            }
            // Return animation toolbox without Pen category for all intermediate sessions
            return {
                ...animationToolbox,
                contents: filteredContents
            };
        }
        return selectedBoard === 'esp32' ? esp32Toolbox : arduinoToolbox;
    }, [editorMode, selectedBoard, selectedSpriteId]);

    // Helper to extract all blocks/labels from a categorized toolbox into a single flyout list
    const getFlattenedFlyoutContents = (toolbox: any) => {
        if (!toolbox || !toolbox.contents) return [];
        const flattened: any[] = [];
        toolbox.contents.forEach((category: any, index: number) => {
            if (category.kind === 'pictobloxCategory' || category.kind === 'pictoBloxCategory' || category.kind === 'category') {
                // Add a label/header for the category
                flattened.push({
                    kind: 'label',
                    text: category.name,
                    'web-class': 'category-header'
                });
                // Add all blocks/buttons from this category
                if (Array.isArray(category.contents)) {
                    flattened.push(...category.contents);
                }
                // Add some spacing
                flattened.push({ kind: 'sep', gap: 24 });
            }
        });
        return flattened;
    };

    // ═══════════════════════════════════════════════════════════════════════
    // WORKSPACE CHANGE HANDLER
    // ═══════════════════════════════════════════════════════════════════════
    const handleWorkspaceChange = useCallback((event: Blockly.Events.Abstract) => {
        if (event.isUiEvent) return;
        if (!workspaceRef.current) return;
        if (isLoadingWorkspaceRef.current) {
            console.log('[APP] Ignoring workspace change during load phase');
            return;
        }

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
            // IMPORTANT: use activeSpriteIdRef to avoid closure staleness during switches
            const activeId = activeSpriteIdRef.current;
            if (activeId && workspaceRef.current) {
                const json = Blockly.serialization.workspaces.save(workspaceRef.current);
                spriteWorkspacesRef.current.set(activeId, json);
            }
        } catch (e) {
            console.error('[APP] Code generation error:', e);
            log.generator('Code generation error', e);
        }
    }, [editorMode, appMode, sprites, selectedSpriteId]);

    /**
     * Preview a block's action on the selected sprite with 2-second auto-revert.
     * Stored as a ref so the flyout listener (attached once) always accesses latest state.
     */
    const previewRevertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const previewBlockActionRef = useRef<(block: Blockly.Block) => void>(() => { });
    previewBlockActionRef.current = (block: Blockly.Block) => {
        const activeSprite = selectedSpriteId ? sprites.find(s => s.id === selectedSpriteId) : null;
        if (!activeSprite) return;

        // Cancel any previous revert timer
        if (previewRevertTimerRef.current) {
            clearTimeout(previewRevertTimerRef.current);
            previewRevertTimerRef.current = null;
        }

        // Save current sprite state before preview
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
            case 'motion_turn_right': {
                const deg = Number(block.getFieldValue('DEGREES')) || 15;
                activeSprite.pointInDirection(activeSprite.direction + deg);
                break;
            }
            case 'motion_turn_left': {
                const deg = Number(block.getFieldValue('DEGREES')) || 15;
                activeSprite.pointInDirection(activeSprite.direction - deg);
                break;
            }
            case 'motion_go_to_xy': {
                activeSprite.setX(Number(block.getFieldValue('X')) || 0);
                activeSprite.setY(Number(block.getFieldValue('Y')) || 0);
                break;
            }
            case 'motion_glide_to_xy': {
                activeSprite.startGlide(
                    Number(block.getFieldValue('X')) || 0,
                    Number(block.getFieldValue('Y')) || 0,
                    Number(block.getFieldValue('SECS')) || 1);
                break;
            }
            case 'motion_point_direction':
                activeSprite.pointInDirection(Number(block.getFieldValue('DIRECTION')) || 90);
                break;
            case 'motion_change_x':
                activeSprite.setX(activeSprite.x + (Number(block.getFieldValue('DX')) || 10));
                break;
            case 'motion_change_y':
                activeSprite.setY(activeSprite.y + (Number(block.getFieldValue('DY')) || 10));
                break;
            case 'motion_set_x':
                activeSprite.setX(Number(block.getFieldValue('X')) || 0);
                break;
            case 'motion_set_y':
                activeSprite.setY(Number(block.getFieldValue('Y')) || 0);
                break;
            case 'motion_if_on_edge_bounce':
                activeSprite.ifOnEdgeBounce();
                break;
            case 'motion_set_rotation_style':
                activeSprite.setRotationStyle(block.getFieldValue('STYLE') as any);
                break;
            case 'looks_say':
                activeSprite.say(String(block.getFieldValue('MESSAGE') || 'Hello!'));
                break;
            case 'looks_say_for_secs':
                activeSprite.say(String(block.getFieldValue('MESSAGE') || 'Hello!'), Number(block.getFieldValue('SECS')) || 2);
                break;
            case 'looks_think':
                activeSprite.think(String(block.getFieldValue('MESSAGE') || 'Hmm...'));
                break;
            case 'looks_think_for_secs':
                activeSprite.think(String(block.getFieldValue('MESSAGE') || 'Hmm...'), Number(block.getFieldValue('SECS')) || 2);
                break;
            case 'looks_show': activeSprite.show(); break;
            case 'looks_hide': activeSprite.hide(); break;
            case 'looks_next_costume': activeSprite.nextCostume(); break;
            case 'looks_switch_costume': { const c = block.getFieldValue('COSTUME'); if (c) activeSprite.switchCostume(c); break; }
            case 'looks_set_size': activeSprite.setSize(Number(block.getFieldValue('SIZE')) || 100); break;
            case 'looks_change_size': activeSprite.changeSize(Number(block.getFieldValue('CHANGE')) || 10); break;
            case 'looks_set_effect':
                activeSprite.setEffect(block.getFieldValue('EFFECT') as any, Number(block.getFieldValue('VALUE')) || 0);
                break;
            case 'looks_clear_effects': activeSprite.clearEffects(); break;
            case 'looks_switch_backdrop': { const b = block.getFieldValue('BACKDROP'); if (b) stageManager.setBackdrop(b); break; }
            case 'looks_next_backdrop': stageManager.nextBackdrop(); break;
            default: previewed = false; break;
        }

        if (previewed) {
            activeSprite.jiggle();
            console.log(`[APP] Block preview: ${block.type} on sprite ${activeSprite.name}`);
            // Revert to original state after 2 seconds
            previewRevertTimerRef.current = setTimeout(() => {
                activeSprite.setX(saved.x);
                activeSprite.setY(saved.y);
                activeSprite.pointInDirection(saved.direction);
                activeSprite.setSize(saved.size);
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
                console.log(`[APP] Preview reverted for sprite ${activeSprite.name}`);
            }, 2000);
        }
    };

    /**
     * Handle real-time block interaction: preview animation blocks + hardware control
     */
    const handleBlockInteraction = useCallback(async (event: Blockly.Events.Abstract) => {
        if (!workspaceRef.current) return;
        if (event.type !== Blockly.Events.CLICK && event.type !== Blockly.Events.BLOCK_CHANGE) return;

        const blockId = (event as any).blockId;
        if (!blockId) return;
        const block = workspaceRef.current.getBlockById(blockId);
        if (!block) return;

        // Animation block interaction on click
        if (event.type === Blockly.Events.CLICK) {
            // Try to compile and run the whole stack if it's an animation/event block
            if (!block.type.startsWith('arduino_')) {
                const compiler = new AnimationCompiler(selectedSpriteId || '');
                const stackScript = compiler.compileStack(block);

                if (stackScript && stackScript.steps.length > 0) {
                    console.log(`[APP] Running stack for sprite ${selectedSpriteId}`);
                    setIsRunning(true);
                    // Stop previous scripts for THIS sprite specifically to allow restart
                    if (selectedSpriteId) animationVM.stopSpriteScripts(selectedSpriteId);
                    animationVM.runScript(stackScript);
                    return;
                }
            }

            // Fallback: Preview single block action
            previewBlockActionRef.current(block);
        }

        // Hardware block interaction (Arduino)
        if (editorMode !== 'stage' || !isConnected) return;
        if (!block.type.startsWith('arduino_')) return;

        if (event.type === Blockly.Events.CLICK && (block.type === 'arduino_setup' || block.type === 'arduino_loop')) {
            console.log('[APP] Starting Arduino scripts from block click');
            setIsRunning(true);
            animationVM.triggerFlag(compiledScripts);
            addLog('Started Arduino script');
            return;
        }

        if (event.type === Blockly.Events.BLOCK_CHANGE) {
            if (activeTab !== 'serial') setActiveTab('serial');
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
            log.app('Interaction error', err);
        }
    }, [editorMode, isConnected, sprites, selectedSpriteId]);

    // ═══════════════════════════════════════════════════════════════════════
    // SPRITE MANAGEMENT HELPERS
    // ═══════════════════════════════════════════════════════════════════════
    // Save current workspace blocks to the per-sprite map
    const saveCurrentSpriteWorkspace = useCallback(() => {
        const activeId = activeSpriteIdRef.current;
        if (!workspaceRef.current || !activeId) return;
        const json = Blockly.serialization.workspaces.save(workspaceRef.current);
        spriteWorkspacesRef.current.set(activeId, json);
        console.log('[APP] Saved workspace for sprite:', activeId);
    }, []);

    // Load workspace blocks from the per-sprite map
    const loadSpriteWorkspace = useCallback((spriteId: string) => {
        // ALWAYS update the true owner tracking, even if workspace is null (unmounted)
        // This ensures that when the workspace is re-initialized, it knows what it should be loading.
        activeSpriteIdRef.current = spriteId;

        if (!workspaceRef.current) {
            console.log('[APP] Workspace unmounted, deferred loading for sprite:', spriteId);
            return;
        }

        const json = spriteWorkspacesRef.current.get(spriteId);

        // ALWAYS disable events when manually changing workspace content
        // to prevent handleWorkspaceChange from saving intermediate/wrong states
        isLoadingWorkspaceRef.current = true;
        Blockly.Events.disable();
        try {
            if (json && Object.keys(json).length > 0) {
                workspaceRef.current.clear();
                Blockly.serialization.workspaces.load(json, workspaceRef.current);
                console.log('[APP] Successfully loaded workspace for sprite:', spriteId);
            } else {
                workspaceRef.current.clear();
                console.log('[APP] Cleared workspace (no saved blocks) for sprite:', spriteId);
            }
        } catch (err) {
            console.error('[APP] Error loading workspace JSON:', err);
        } finally {
            Blockly.Events.enable();

            // PERSIST FLYOUT: Ensure flyout stays open after workspace load/clear
            const flyout = workspaceRef.current.getFlyout() as any;
            if (flyout) {
                const contents = currentToolboxContentsRef.current;
                if (contents && contents.length > 0) {
                    console.log('[APP] Restoring flyout after workspace load');
                    flyout.show(contents);
                    // @ts-ignore
                    if (flyout.reflowInternal_) flyout.reflowInternal_();
                }
            }

            // Use setTimeout to ensure any strictly asynchronous layout events 
            // thrown by Blockly immediately after enable() are also swallowed.
            setTimeout(() => {
                isLoadingWorkspaceRef.current = false;
                // Force a recompile for the newly loaded sprite/backdrop
                if (workspaceRef.current) {
                    handleWorkspaceChange({ isUiEvent: false } as Blockly.Events.Abstract);
                }
            }, 50);
        }
    }, [handleWorkspaceChange]);

    // ═══════════════════════════════════════════════════════════════════════
    // MODE SWITCHING
    // ═══════════════════════════════════════════════════════════════════════
    const switchEditorMode = useCallback((newMode: EditorMode) => {
        if (newMode === editorMode) return;

        // Save current workspace before switching modes (as it might be disposed)
        saveCurrentSpriteWorkspace();
        setEditorMode(newMode);

        addLog(`Switched to ${newMode === 'stage' ? 'Stage' : 'Upload'} Mode`);
    }, [editorMode, addLog, saveCurrentSpriteWorkspace]);

    // Handle workspace tab switching (Blocks, Python, Costumes, etc.)
    const handleWorkspaceTabChange = useCallback((newTab: 'blocks' | 'python' | 'costumes' | 'sounds') => {
        if (newTab === workspaceTab) return;

        // Save blocks if we are moving AWAY from blocks or switching between sprites
        saveCurrentSpriteWorkspace();

        // In Scratch-like UX, tabs maintain the current selection.
        // Costumes/Sounds tabs will dynamically show content for the selected target.

        setWorkspaceTab(newTab);
        addLog(`Switched to ${newTab} tab`);
    }, [workspaceTab, saveCurrentSpriteWorkspace, addLog, loadSpriteWorkspace]);

    // ═══════════════════════════════════════════════════════════════════════
    // SPRITE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    // Handle sprite selection: save old, load new
    const handleSpriteSelect = useCallback((newId: string) => {
        if (newId === selectedSpriteId) {
            // Trigger click event even if already selected (Scratch behavior)
            animationVM.triggerSpriteClick(newId, compiledScripts);
            return;
        }

        // Clear highlights in old workspace before switching
        if (workspaceRef.current) {
            // @ts-ignore
            workspaceRef.current.highlightBlock(null);
        }

        saveCurrentSpriteWorkspace();
        setSelectedSpriteId(newId);
        loadSpriteWorkspace(newId);
    }, [selectedSpriteId, compiledScripts, saveCurrentSpriteWorkspace, loadSpriteWorkspace]);

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
            // Generate a small random offset explicitly close to the center 
            // instead of completely scattering them across the stage
            const offsetX = Math.floor(Math.random() * 60) - 30;
            const offsetY = Math.floor(Math.random() * 60) - 30;
            newSprite.setX(offsetX);
            newSprite.setY(offsetY);
        }

        animationVM.registerSprite(newSprite);
        setSprites(prev => [...prev, newSprite]);

        // 1. Explicitly initialize an empty workspace for the new sprite in our map
        spriteWorkspacesRef.current.set(id, {});

        // 2. Clear the actual Blockly workspace on screen (SILENTLY)
        if (workspaceRef.current) {
            isLoadingWorkspaceRef.current = true;
            Blockly.Events.disable();
            workspaceRef.current.clear();
            Blockly.Events.enable();
            setTimeout(() => {
                isLoadingWorkspaceRef.current = false;
            }, 50);
        }

        // 3. Update the selected ID
        activeSpriteIdRef.current = id;
        setSelectedSpriteId(id);

        addLog(`Added sprite: ${name}`);
    }, [sprites, addLog, triggerUpdate, saveCurrentSpriteWorkspace]);

    const handleRemoveBackground = useCallback(async (spriteId: string) => {
        const sprite = sprites.find(s => s.id === spriteId);
        if (!sprite || !sprite.currentCostume) return;

        addLog(`Removing background for ${sprite.name}...`);
        const imagePath = sprite.currentCostume.image.src;
        // The src might be a full URL, we need the relative path from public/
        const relativePath = imagePath.split('/assets/')[1];
        if (!relativePath) {
            addLog('Error: Could not resolve image path');
            return;
        }

        const fullRelativePath = `public/assets/${relativePath}`;
        try {
            const result = await window.electronAPI.removeBackground(fullRelativePath);
            if (result.success) {
                addLog(`Background removed for ${sprite.name}`);

                // If it was a jpeg/jpg, the script converted it to png
                let finalSrc = imagePath;
                if (imagePath.toLowerCase().endsWith('.jpeg') || imagePath.toLowerCase().endsWith('.jpg')) {
                    finalSrc = imagePath.replace(/\.(jpeg|jpg)$/i, '.png');
                }

                const name = sprite.currentCostume.name;
                const cacheBuster = `t=${Date.now()}`;
                const newSrc = `${finalSrc}${finalSrc.includes('?') ? '&' : '?'}${cacheBuster}`;

                // Re-add the costume (this will update the image object in the costume map)
                await sprite.addCostume(name, newSrc);

                triggerUpdate();
                window.dispatchEvent(new Event('leap-stage-update'));
            } else {
                addLog(`Failed to remove background: ${result.error}`);
            }
        } catch (e) {
            addLog('Error in background removal');
            console.error(e);
        }
    }, [sprites, addLog, triggerUpdate]);

    const executeNewProject = useCallback(() => {
        // Clear all sprites and workspaces
        sprites.forEach(s => animationVM.unregisterSprite(s.id));
        setSprites([]);
        setSelectedSpriteId(null);
        setProjectName('Untitled');
        spriteWorkspacesRef.current.clear();
        if (workspaceRef.current) {
            isLoadingWorkspaceRef.current = true;
            Blockly.Events.disable();
            workspaceRef.current.clear();
            Blockly.Events.enable();
            setTimeout(() => {
                isLoadingWorkspaceRef.current = false;
            }, 50);
        }

        // Reset stage manager (clears old backdrops and creates fresh default)
        stageManager.reset();

        // Create Stage Sprite (for backdrop management and stage scripts)
        const stageSprite = new Sprite('stage', 'Stage', triggerUpdate, 'cat');
        stageSprite.hide(); // Hide the stage sprite so the user doesn't see the default cat-like placeholder
        animationVM.registerSprite(stageSprite);
        spriteWorkspacesRef.current.set('stage', {}); // Initialize empty workspace for stage

        // Create Default Robot Sprite
        const robotId = 'sprite_default';
        const robotSprite = new Sprite(robotId, 'Robot', triggerUpdate, 'robot');
        robotSprite.setX(0); // Center of Scratch-like stage
        robotSprite.setY(0);
        spriteWorkspacesRef.current.set(robotId, {}); // Initialize empty workspace for robot

        // Load robot costumes
        const loadAssets = async () => {
            await robotSprite.addCostume('idle', '/assets/sprites/robot/robot_idle.svg');
            await robotSprite.addCostume('wave 1', '/assets/sprites/robot/image-removebg-preview (1).png');
            await robotSprite.addCostume('wave 2', '/assets/sprites/robot/image-Photoroom.png');
            await robotSprite.addCostume('talk', '/assets/sprites/robot/image-removebg-preview.png');
            await robotSprite.addSound('Meow', '/assets/sounds/meow.wav');

            animationVM.registerSprite(robotSprite);
            setSprites([stageSprite, robotSprite]);
            activeSpriteIdRef.current = robotId;
            setSelectedSpriteId(robotId);
            triggerUpdate();
            window.dispatchEvent(new Event('leap-stage-update'));
        };
        loadAssets().catch(err => console.error('[APP] Failed to initialize assets:', err));

        addLog('New project created');
    }, [triggerUpdate, addLog, sprites]);

    const handleNewProject = useCallback(() => {
        setPendingAction('new');
        setShowUnsavedModal(true);
    }, []);

    const handleSaveProject = useCallback((isSilent = false) => {
        // 1. Force save of current workspace if it's active
        const activeId = activeSpriteIdRef.current;
        if (workspaceRef.current && activeId) {
            const json = Blockly.serialization.workspaces.save(workspaceRef.current);
            spriteWorkspacesRef.current.set(activeId, json);
            console.log('[APP] Force-saved current workspace before project export');
        }

        // 2. Prepare sprite metadata
        const spritesData = sprites.map(s => ({
            id: s.id,
            name: s.name,
            spriteType: s.spriteType,
            x: s.x,
            y: s.y,
            direction: s.direction,
            size: s.size,
            visible: s.visible,
            costumes: s.costumes.map(c => ({
                name: c.name,
                src: c.image.src
            }))
        }));

        // 3. Prepare workspace data (convert Map to plain object for JSON)
        const workspacesData: Record<string, any> = {};
        spriteWorkspacesRef.current.forEach((val, key) => {
            if (val && Object.keys(val).length > 0) {
                workspacesData[key] = val;
            }
        });

        const payload = {
            sprites: spritesData,
            workspaces: workspacesData,
        };

        fileService.saveProject(projectName, 'intermediate', payload);
        addLog(`Project saved: ${projectName}`);
    }, [projectName, sprites, addLog]);

    const executeOpenProject = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.leap,.lbproject,application/json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const data = await fileService.loadProject(file);
                const validation = fileService.validateProject(data, 'intermediate');

                if (!validation.isValid) {
                    alert(validation.error);
                    return;
                }

                // Standard intermediate project format validation
                if (!data.sprites || !data.workspaces) {
                    throw new Error('Invalid project file (missing sprites or workspaces)');
                }

                addLog(`Loading project: ${data.projectName || 'Untitled'}`);

                // Full Reset before loading
                sprites.forEach(s => animationVM.unregisterSprite(s.id));
                spriteWorkspacesRef.current.clear();
                if (workspaceRef.current) workspaceRef.current.clear();

                setProjectName(data.projectName || 'My Project');

                const newSprites: Sprite[] = [];
                for (const sData of data.sprites) {
                    const s = new Sprite(sData.id, sData.name, triggerUpdate, sData.spriteType || 'cat');
                    s.setX(sData.x);
                    s.setY(sData.y);
                    s.pointInDirection(sData.direction);
                    s.setSize(sData.size);
                    if (sData.visible) s.show(); else s.hide();

                    for (const cData of sData.costumes) {
                        await s.addCostume(cData.name, cData.src);
                    }
                    newSprites.push(s);
                    animationVM.registerSprite(s);
                }

                // 3. Restore All Workspaces to the Map FIRST
                Object.keys(data.workspaces).forEach(id => {
                    spriteWorkspacesRef.current.set(id, data.workspaces[id]);
                });

                // 4. Update UI state (triggers re-render)
                setSprites(newSprites);
                const firstId = newSprites.length > 0 ? newSprites[0].id : null;
                setSelectedSpriteId(firstId);

                // 5. Final attempt to load the workspace for the selected sprite
                if (firstId) {
                    let attempts = 0;
                    const tryLoad = () => {
                        if (workspaceRef.current) {
                            loadSpriteWorkspace(firstId);
                            triggerUpdate();
                            addLog('Project loaded successfully');
                        } else if (attempts < 10) {
                            attempts++;
                            setTimeout(tryLoad, 200);
                        } else {
                            console.warn('[APP] Project loaded but workspace injection timed out');
                            addLog('Project loaded (Workspace loading delayed)');
                        }
                    };
                    tryLoad();
                } else {
                    triggerUpdate();
                    addLog('Project loaded successfully (Empty)');
                }
            } catch (err: any) {
                console.error('Failed to load project:', err);
                alert(`Failed to load project file: ${err.message}`);
            }
        };
        input.click();
    }, [triggerUpdate, sprites, loadSpriteWorkspace, addLog]);

    const handleOpenProject = useCallback(() => {
        setPendingAction('open');
        setShowUnsavedModal(true);
    }, []);

    const confirmUnsavedAction = useCallback((saveFirst: boolean) => {
        setShowUnsavedModal(false);
        if (saveFirst) {
            handleSaveProject(true);
            setTimeout(() => {
                if (pendingAction === 'new') executeNewProject();
                if (pendingAction === 'open') executeOpenProject();
                setPendingAction(null);
            }, 500);
        } else {
            if (pendingAction === 'new') executeNewProject();
            if (pendingAction === 'open') executeOpenProject();
            setPendingAction(null);
        }
    }, [pendingAction, handleSaveProject, executeNewProject, executeOpenProject]);

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

        // Stop any currently running scripts before starting
        animationVM.stopAll();

        let allScripts: CompiledScript[] = [];
        try {
            // Compile scripts for EVERY sprite
            for (const s of sprites) {
                // Determine workspace JSON for this sprite
                let savedJson = spriteWorkspacesRef.current.get(s.id);
                // If it's the active sprite, always use real-time workspace state
                if (s.id === selectedSpriteId && workspaceRef.current) {
                    savedJson = Blockly.serialization.workspaces.save(workspaceRef.current);
                }

                if (!savedJson || Object.keys(savedJson).length === 0) {
                    continue; // Skip sprites with no blocks
                }

                let tempWs: Blockly.Workspace | null = null;
                try {
                    Blockly.Events.disable();
                    tempWs = new Blockly.Workspace();
                    Blockly.serialization.workspaces.load(savedJson, tempWs);
                    Blockly.Events.enable();

                    const compiler = new AnimationCompiler(s.id);
                    const scripts = compiler.compile(tempWs);
                    allScripts = allScripts.concat(scripts);

                    // Soft reset effects for this sprite
                    if (s.sayText) s.clearSay();
                    s.clearEffects();

                    tempWs.dispose();
                } catch (e) {
                    Blockly.Events.enable();
                    console.error(`[APP] Error compiling isolated sprite ${s.name}:`, e);
                    if (tempWs) { try { tempWs.dispose(); } catch (_) { } }
                }
            }

            if (allScripts.length > 0) {
                setCompiledScripts(allScripts);
                setIsRunning(true);
                animationVM.triggerFlag(allScripts);
                addLog(`Started animation for ${sprites.length} sprites`);
            } else {
                console.log('[APP] No sprites have blocks to run');
            }
        } catch (e) {
            console.error(`[APP] Error during multi-sprite compilation:`, e);
        }
    }, [sprites, selectedSpriteId, addLog, saveCurrentSpriteWorkspace]);


    const handleStopClick = useCallback(() => {
        setIsRunning(false);
        animationVM.stopAll();

        // Clear ongoing visual actions for all sprites
        sprites.forEach(sprite => {
            sprite.clearSay();
            sprite.stopGlide();
            sprite.clearEffects();
        });

        // Clear highlight, wrapped in try-catch in case Blockly throws on null ID
        if (workspaceRef.current) {
            try {
                // @ts-ignore
                workspaceRef.current.highlightBlock(null);
            } catch (e) {
                console.log('[APP] Ignoring highlight clear error', e);
            }
        }

        hardwareAdapter.stopAllPolling();
        addLog('Stopped animation');
    }, [sprites, workspaceRef, addLog]);

    const handleUndo = useCallback(() => {
        if (workspaceRef.current) {
            workspaceRef.current.undo(false);
        }
    }, []);

    const handleRedo = useCallback(() => {
        if (workspaceRef.current) {
            workspaceRef.current.undo(true);
        }
    }, []);

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
            alert('⚠️ No port selected!\n\nPlease:\n1. Connect your Arduino/ESP32 board via USB\n2. Click the refresh (↻) button in the toolbar\n3. Select a COM port from the dropdown\n4. Then click Upload again');
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

    // Create default sprites (Stage + Robot) on mount
    useEffect(() => {
        if (editorMode === 'stage' && sprites.length === 0) {
            console.log('[APP] Initializing sprites (Stage + Default Robot)...');

            // 1. Create Stage Sprite (for backdrop management and stage scripts)
            const stageSprite = new Sprite('stage', 'Stage', triggerUpdate, 'cat'); // cat is dummy type
            stageSprite.hide(); // Stage sprite is only for scripting/backdrops and should not be visible on canvas
            spriteWorkspacesRef.current.set('stage', {}); // Initialize empty workspace for stage

            // 2. Create Default Robot Sprite
            const defaultSprite = new Sprite('sprite_default', 'Robot', triggerUpdate, 'robot');
            // Scratch coords: (0,0) is center of stage
            defaultSprite.setX(0);
            defaultSprite.setY(0);
            spriteWorkspacesRef.current.set('sprite_default', {}); // Initialize empty workspace for robot

            // Add robot costumes
            const loadAssets = async () => {
                console.log('[APP] Loading assets for robot...');
                await defaultSprite.addCostume('idle', '/assets/sprites/robot/robot_idle.svg');
                await defaultSprite.addCostume('wave 1', '/assets/sprites/robot/image-removebg-preview (1).png');
                await defaultSprite.addCostume('wave 2', '/assets/sprites/robot/image-Photoroom.png');
                await defaultSprite.addCostume('talk', '/assets/sprites/robot/image-removebg-preview.png');

                // Add default sound
                await defaultSprite.addSound('Meow', '/assets/sounds/meow.wav');

                console.log('[APP] Assets loaded:', defaultSprite.costumes.length, 'costumes', defaultSprite.sounds.length, 'sounds');
                triggerUpdate();
                // Manually nudge the stage to repaint in case it didn't catch the update
                window.dispatchEvent(new Event('leap-stage-update'));
            };
            loadAssets().catch(err => console.error('[APP] Failed to initialize assets:', err));

            // Register both with VM
            animationVM.registerSprite(stageSprite);
            animationVM.registerSprite(defaultSprite);

            setSprites([stageSprite, defaultSprite]);
            setSelectedSpriteId('sprite_default');
            activeSpriteIdRef.current = 'sprite_default';
        }
    }, [editorMode]);

    // Define sound, costume, and backdrop helpers for Blockly
    useEffect(() => {
        (window as any).getActiveSpriteSounds = () => {
            const activeId = activeSpriteIdRef.current;
            if (!activeId) return [];
            const sprite = animationVM.getSprite(activeId);
            if (sprite && sprite.sounds) {
                return sprite.sounds.map((s: any) => s.name);
            }
            return [];
        };
        (window as any).getActiveSpriteCostumes = () => {
            const activeId = activeSpriteIdRef.current;
            if (!activeId) return [];
            const sprite = animationVM.getSprite(activeId);
            if (sprite && sprite.costumes) {
                return sprite.costumes.map((c: any) => c.name);
            }
            return [];
        };
        (window as any).getActiveStageBackdrops = () => {
            if (stageManager) {
                return stageManager.getAllBackdrops().map(b => b.name);
            }
            return [];
        };
        return () => {
            delete (window as any).getActiveSpriteSounds;
            delete (window as any).getActiveSpriteCostumes;
            delete (window as any).getActiveStageBackdrops;
        };
    }, []);

    // Initialize Blockly workspace AFTER sprite state is set
    useEffect(() => {
        log.app('Initializing Blockly workspace');

        log.app('Initializing Blockly workspace on first mount avoided. Will be handled by mode change effect.');

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
            // Clear the module-level flyout contents to prevent interference with Junior mode
            _continuousFlyoutContents = [];
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // Update flyout contents when sprite changes
    useEffect(() => {
        if (workspaceRef.current && appMode === 'blocks') {
            const toolbox = getCurrentToolbox();
            const toolboxJson = JSON.stringify(toolbox);

            // Recompute continuous flyout contents
            const contents = getFlattenedFlyoutContents(toolbox);
            setCurrentToolboxContents(contents);
            currentToolboxContentsRef.current = contents;
            _continuousFlyoutContents = contents; // Update module-level storage for prototype override

            console.log('[APP] Updating flyout contents for sprite:', selectedSpriteId, '(', contents.length, 'items)');

            // Update the toolbox sidebar (category icons) if the definition changed
            if (toolboxJson !== lastToolboxJsonRef.current) {
                console.log('[APP] Updating toolbox dynamically (Sprite:', selectedSpriteId, ')');
                lastToolboxJsonRef.current = toolboxJson;
                workspaceRef.current.updateToolbox(toolbox);
            }

            // Always ensure flyout is showing the latest contents
            const flyout = workspaceRef.current.getFlyout() as any;
            if (flyout) {
                flyout.autoClose = false;
                flyout.show(contents);
                // Ensure flyout is properly laid out
                if (flyout.reflowInternal_) flyout.reflowInternal_();
                console.log('[APP] Flyout re-shown with', contents.length, 'items');
            }
        }
    }, [selectedSpriteId, editorMode, appMode, getCurrentToolbox]);

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
                        const toolbox = (blocksWorkspace as any).getToolbox() as any;

                        if (flyout) {
                            flyout.autoClose = false;
                            const FIXED_SCALE = 0.9;
                            flyout.getFlyoutScale = () => FIXED_SCALE;
                            if (flyout.getWorkspace()) {
                                flyout.getWorkspace().setScale(FIXED_SCALE);
                            }

                            // Initialize continuous flyout contents
                            const initContents = getFlattenedFlyoutContents(getCurrentToolbox());
                            currentToolboxContentsRef.current = initContents;
                            _continuousFlyoutContents = initContents; // Update module-level storage

                            // Force first show (prototype override will use _continuousFlyoutContents)
                            flyout.show(initContents);
                        }

                        // 2. TOOLBOX -> FLYOUT (Click to Scroll)
                        if (toolbox && flyout) {
                            const scrollFlyoutToCategory = (categoryName: string) => {
                                const flyoutWs = flyout.getWorkspace();
                                if (!flyoutWs) {
                                    log.blockly('[ToolboxSync] Flyout workspace unavailable', { categoryName });
                                    return;
                                }

                                window.requestAnimationFrame(() => {
                                    if (flyout.reflowInternal_) flyout.reflowInternal_();

                                    const metricsManager = typeof flyoutWs.getMetricsManager === 'function'
                                        ? flyoutWs.getMetricsManager()
                                        : null;
                                    const scrollMetrics = metricsManager?.getScrollMetrics?.();
                                    const viewMetrics = metricsManager?.getViewMetrics?.();
                                    const currentScrollY = scrollMetrics && viewMetrics
                                        ? viewMetrics.top - scrollMetrics.top
                                        : 0;
                                    const maxScrollY = scrollMetrics && viewMetrics
                                        ? Math.max(scrollMetrics.height - viewMetrics.height, 0)
                                        : Number.POSITIVE_INFINITY;
                                    const flyoutSvg = typeof flyoutWs.getParentSvg === 'function'
                                        ? flyoutWs.getParentSvg()
                                        : null;
                                    const flyoutSvgRect = flyoutSvg?.getBoundingClientRect?.();
                                    const desiredTopOffsetPx = 12;

                                    log.blockly('[ToolboxSync] Resolving category scroll target', {
                                        categoryName,
                                        currentScrollY,
                                        maxScrollY,
                                        flyoutItemCount: typeof flyout.getContents === 'function' ? flyout.getContents().length : 0
                                    });

                                    const scrollTargetIntoView = (targetSvg: SVGElement | null, targetInfo: Record<string, any>) => {
                                        if (!targetSvg || !flyoutSvgRect) {
                                            log.blockly('[ToolboxSync] Target or flyout SVG unavailable', {
                                                categoryName,
                                                ...targetInfo
                                            });
                                            return;
                                        }

                                        const targetRect = targetSvg.getBoundingClientRect();
                                        const deltaY = targetRect.top - (flyoutSvgRect.top + desiredTopOffsetPx);
                                        const nextScrollY = Math.min(
                                            Math.max(currentScrollY + deltaY, 0),
                                            maxScrollY
                                        );

                                        log.blockly('[ToolboxSync] Applying flyout scroll', {
                                            categoryName,
                                            deltaY,
                                            currentScrollY,
                                            nextScrollY,
                                            ...targetInfo
                                        });

                                        if (flyoutWs.scrollbar?.setY) {
                                            flyoutWs.scrollbar.setY(nextScrollY);
                                            return;
                                        }

                                        if (flyoutWs.scrollbar?.set) {
                                            flyoutWs.scrollbar.set(0, nextScrollY);
                                            return;
                                        }

                                        log.blockly('[ToolboxSync] Flyout scrollbar unavailable for target scroll', {
                                            categoryName,
                                            nextScrollY,
                                            ...targetInfo
                                        });
                                    };

                                    const flyoutContents = typeof flyout.getContents === 'function'
                                        ? flyout.getContents()
                                        : [];

                                    const categoryHeader = flyoutContents.find((item: any) => {
                                        if (typeof item?.getType !== 'function' || item.getType() !== 'label') return false;
                                        const element = item.getElement?.();
                                        return element &&
                                            typeof element.getButtonText === 'function' &&
                                            element.getButtonText() === categoryName &&
                                            element.info?.['web-class'] === 'category-header';
                                    });

                                    const headerElement = categoryHeader?.getElement?.();
                                    const headerSvg = headerElement?.getSvgRoot?.() || null;
                                    if (headerSvg) {
                                        log.blockly('[ToolboxSync] Scrolling to category header', { categoryName });
                                        scrollTargetIntoView(headerSvg, { targetType: 'category-header' });
                                        return;
                                    }

                                    log.blockly('[ToolboxSync] Category header not found, using block fallback', { categoryName });

                                    const blocks = flyoutWs.getTopBlocks(false);
                                    const targetBlock = blocks.find((b: any) => {
                                        const type = b.type;
                                        const matches = (cat: string) => {
                                            if (cat === 'Motion') return type.startsWith('motion_');
                                            if (cat === 'Looks') return type.startsWith('looks_');
                                            if (cat === 'Sound') return type.startsWith('sound_');
                                            if (cat === 'Events') return type.startsWith('event_');
                                            if (cat === 'Control') return type.startsWith('control_');
                                            if (cat === 'Sensing') return type.startsWith('sensing_');
                                            if (cat === 'Operators') return type.startsWith('operator_') || type.startsWith('arduino_math_');
                                            if (cat === 'Variables') return type.startsWith('data_') || type.startsWith('variables_');
                                            if (cat === 'My Blocks') return type.startsWith('procedures_');
                                            if (cat === 'Arduino' || cat === 'ESP32') return type.startsWith('arduino_') || type.startsWith('esp32_');
                                            return false;
                                        };
                                        return matches(categoryName);
                                    });

                                    if (!targetBlock) {
                                        log.blockly('[ToolboxSync] No fallback block found for category', { categoryName });
                                        return;
                                    }

                                    log.blockly('[ToolboxSync] Scrolling to fallback block', {
                                        categoryName,
                                        blockType: targetBlock.type
                                    });
                                    scrollTargetIntoView(targetBlock.getSvgRoot?.() || null, {
                                        targetType: 'fallback-block',
                                        blockType: targetBlock.type
                                    });
                                });
                            };

                            const originalSetSelectedItem = toolbox.setSelectedItem.bind(toolbox);
                            toolbox.setSelectedItem = (newItem: any) => {
                                originalSetSelectedItem(newItem);

                                if (newItem && typeof newItem.getName === 'function') {
                                    const categoryName = newItem.getName();
                                    log.blockly('[ToolboxSync] Toolbox category selected', { categoryName });
                                    scrollFlyoutToCategory(categoryName);
                                }
                            };
                        }

                        // 3. FLYOUT -> TOOLBOX (Scroll to Highlight) - DISABLED
                        // Note: In continuous flyout mode, all blocks are visible, so automatic
                        // category switching on scroll is unnecessary and disruptive.
                        // Users can manually select categories in the toolbox if needed.

                        // 4. FLYOUT BLOCK PREVIEW (Click to Preview)
                        if (flyout && flyout.getWorkspace()) {
                            flyout.getWorkspace().addChangeListener((event: any) => {
                                if (event.type !== Blockly.Events.CLICK) return;
                                const blockId = (event as any).blockId;
                                if (!blockId) return;
                                const block = flyout.getWorkspace().getBlockById(blockId);
                                if (!block) return;
                                previewBlockActionRef.current(block);
                            });
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

                    // Force all dropdown arrows to be black
                    if (!(Blockly.FieldDropdown.prototype as any)._arrowColourPatched) {
                        const origApplyColour = Blockly.FieldDropdown.prototype.applyColour;
                        (Blockly.FieldDropdown.prototype as any).applyColour = function (this: Blockly.FieldDropdown) {
                            if (origApplyColour) origApplyColour.call(this);
                            const self = this as any;
                            // Handle both property naming conventions (svgArrow / svgArrow_)
                            const svgArrow = self.svgArrow_ || self.svgArrow;
                            if (svgArrow) {
                                svgArrow.style.filter = 'brightness(0)';
                            }
                            // Handle text-based arrow element
                            const arrow = self.arrow_ || self.arrow;
                            if (arrow) {
                                try {
                                    const arrowEl = arrow.getSvgRoot ? arrow.getSvgRoot() : arrow;
                                    if (arrowEl && arrowEl.style) arrowEl.style.fill = '#333333';
                                    if (arrowEl && arrowEl.setAttribute) arrowEl.setAttribute('fill', '#333333');
                                } catch (e) { /* ignore */ }
                            }
                            // Fallback: find any image child within the field group
                            try {
                                const fieldGroup = self.fieldGroup_ || self.fieldGroup;
                                if (fieldGroup) {
                                    const images = fieldGroup.querySelectorAll('image');
                                    images.forEach((img: any) => { img.style.filter = 'brightness(0)'; });
                                }
                            } catch (e) { /* ignore */ }
                        };
                        (Blockly.FieldDropdown.prototype as any)._arrowColourPatched = true;
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

                        const allVars = ws.getVariableMap().getAllVariables() || [];
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

                    // Add click listener to the workspace to handle blurring inputs
                    workspaceRef.current.addChangeListener((event: any) => {
                        if (event.type === Blockly.Events.UI && event.element === 'click') {
                            // If a user clicks anywhere on the workspace, blur any active HTML inputs
                            // This fixes the issue where Blockly text inputs stay focused when clicking away
                            const activeElement = document.activeElement;
                            if (activeElement && activeElement.classList.contains('blocklyHtmlInput')) {
                                (activeElement as HTMLElement).blur();
                            }
                        }
                    });

                    // Restore the selected sprite's blocks after workspace re-initialization
                    // Crucial: prioritize activeSpriteIdRef.current as the source of truth for current state
                    const targetSpriteId = activeSpriteIdRef.current || selectedSpriteId;
                    if (targetSpriteId) {
                        const savedJson = spriteWorkspacesRef.current.get(targetSpriteId);
                        if (savedJson && Object.keys(savedJson).length > 0) {
                            console.log('[APP] Restoring workspace for sprite after re-init:', targetSpriteId);
                            Blockly.serialization.workspaces.load(savedJson, blocksWorkspace);
                        }
                        // Ensure activeSpriteIdRef is set and matches selectedSpriteId if they diverged
                        activeSpriteIdRef.current = targetSpriteId;
                        if (targetSpriteId !== selectedSpriteId) {
                            setSelectedSpriteId(targetSpriteId);
                        }
                    }

                    addLog(`Workspace initialized for ${editorMode === 'stage' ? 'Stage' : 'Upload'} mode`);

                    // ── ATTACH LISTENERS ─────────────────────────────────
                    if (workspaceRef.current) {
                        workspaceRef.current.addChangeListener(handleBlockInteraction);

                        // Trigger an initial recompile
                        if (sprites.length > 0 && selectedSpriteId) {
                            handleWorkspaceChange({ isUiEvent: false } as Blockly.Events.Abstract);
                        }

                        // Register highlighting callback
                        animationVM.onHighlightBlock = (spriteId, blockId) => {
                            if (workspaceRef.current && spriteId === selectedSpriteId) {
                                // @ts-ignore
                                workspaceRef.current.highlightBlock(blockId);
                            }
                        };

                        // Clear highlight initially
                        // @ts-ignore
                        workspaceRef.current.highlightBlock(null);
                    }
                }
            }, 0);

            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appMode, editorMode, selectedBoard, workspaceTab]); // Re-inject on these changes

    // Update workspace listeners and highlights when sprite selection or workspace changes
    useEffect(() => {
        if (!workspaceRef.current) {
            console.log('[APP] No workspaceRef.current, skipping listener attachment');
            return;
        }

        console.log('[APP] Updating listeners for sprite:', selectedSpriteId);

        // Remove old and add new (to ensure only ONE instance of the handler is attached)
        workspaceRef.current.removeChangeListener(handleWorkspaceChange);
        workspaceRef.current.addChangeListener(handleWorkspaceChange);

        workspaceRef.current.removeChangeListener(handleBlockInteraction);
        workspaceRef.current.addChangeListener(handleBlockInteraction);

        // Trigger an initial recompile for the new sprite
        if (sprites.length > 0 && selectedSpriteId) {
            handleWorkspaceChange({ isUiEvent: false } as Blockly.Events.Abstract);
        }

        // Register highlighting callback that knows about the *current* selectedSpriteId
        animationVM.onHighlightBlock = (spriteId, blockId) => {
            if (workspaceRef.current && spriteId === selectedSpriteId) {
                // @ts-ignore
                workspaceRef.current.highlightBlock(blockId);
            }
        };

        // Clear highlights initially
        // @ts-ignore
        workspaceRef.current.highlightBlock(null);

    }, [sprites, selectedSpriteId, handleWorkspaceChange, handleBlockInteraction, workspaceTab]);

    // Keep Blockly resized correctly when container transitions (like stageLayout changes)
    useEffect(() => {
        if (!blocklyDiv.current) return;
        const resizeObserver = new ResizeObserver(() => {
            if (workspaceRef.current) {
                Blockly.svgResize(workspaceRef.current as Blockly.WorkspaceSvg);
            }
        });
        resizeObserver.observe(blocklyDiv.current);
        return () => resizeObserver.disconnect();
    }, [blocklyDiv, workspaceRef]);

    // Route to Python IDE when appMode changes to 'python'
    useEffect(() => {
        if (appMode === 'python' && onOpenPython) {
            onOpenPython();
        }
    }, [appMode, onOpenPython]);

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════

    // Show "Coming Soon" for non-blocks modes (python mode will trigger routing via useEffect)
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
                onFileAction={(action: string) => {
                    if (action === 'new') handleNewProject();
                    if (action === 'save' || action === 'save_as') handleSaveProject();
                    if (action === 'open') handleOpenProject();
                }}
                onEditAction={(action: string) => addLog(`Edit action: ${action}`)}
            />

            {/* Unified Toolbar - Tabs on left, Stage controls on right */}
            {appMode === 'blocks' && editorMode === 'stage' && (
                <div style={styles.unifiedToolbar}>
                    {/* Left: Workspace Tabs */}
                    <div style={{ display: 'flex', height: '100%', alignItems: 'flex-end', paddingLeft: '20px', flex: 1 }}>
                        <button
                            style={workspaceTab === 'blocks' ? styles.tabActive : styles.tab}
                            onClick={() => handleWorkspaceTabChange('blocks')}
                        >
                            <LayoutTemplate size={18} color={workspaceTab === 'blocks' ? '#855CD6' : '#999'} /> Blocks
                        </button>
                        <button
                            style={workspaceTab === 'python' ? styles.tabActive : styles.tab}
                            onClick={() => {
                                if (onOpenPython) {
                                    onOpenPython();
                                } else {
                                    handleWorkspaceTabChange('python');
                                }
                            }}
                        >
                            <Terminal size={18} color={workspaceTab === 'python' ? '#855CD6' : '#999'} /> Python
                        </button>
                        <button
                            style={workspaceTab === 'costumes' ? styles.tabActive : styles.tab}
                            onClick={() => handleWorkspaceTabChange('costumes')}
                        >
                            <Pen size={18} color={workspaceTab === 'costumes' ? '#855CD6' : '#999'} /> {selectedSpriteId === 'stage' ? 'Backdrops' : 'Costumes'}
                        </button>
                        <button
                            style={workspaceTab === 'sounds' ? styles.tabActive : styles.tab}
                            onClick={() => handleWorkspaceTabChange('sounds')}
                        >
                            <Volume2 size={18} color={workspaceTab === 'sounds' ? '#855CD6' : '#999'} /> Sounds
                        </button>
                    </div>

                    {/* Middle: Undo/Redo Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '16px', borderRight: '1px solid #ddd', height: '100%', paddingLeft: '16px' }}>
                        <button style={styles.undoRedoBtn} onClick={handleUndo} title="Undo">
                            <Undo2 size={18} color="#575E75" />
                        </button>
                        <button style={styles.undoRedoBtn} onClick={handleRedo} title="Redo">
                            <Redo2 size={18} color="#575E75" />
                        </button>
                    </div>

                    {/* Right: Stage Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '12px', paddingLeft: '12px' }}>
                        <div style={styles.actionButtons}>
                            <button style={styles.runButtonTop} onClick={handleRunClick} title="Run">
                                <svg viewBox="0 0 24 24" width="22" height="22"><path fill="#4CBB17" d="M5 3v18M19 8l-14-5v10l14 5V8z" stroke="#4CBB17" strokeWidth="1.5" strokeLinejoin="round" /></svg>
                            </button>
                            <button style={styles.stopButtonTop} onClick={handleStopClick} title="Stop">
                                <svg viewBox="0 0 24 24" width="22" height="22"><polygon fill="#EC5959" points="7.3,2 16.7,2 22,7.3 22,16.7 16.7,22 7.3,22 2,16.7 2,7.3" /></svg>
                            </button>
                        </div>



                        <div style={{ width: '1px', height: '22px', background: '#d9d9d9' }} />

                        <button style={{ ...styles.iconBtn, ...(isCameraOn ? styles.iconBtnActive : {}) }} onClick={() => setIsCameraOn(!isCameraOn)} title="Toggle Camera">
                            {isCameraOn ? <Camera size={18} /> : <CameraOff size={18} />}
                        </button>
                        <button style={{ ...styles.iconBtn, ...(showGrid ? styles.iconBtnActive : {}) }} onClick={() => setShowGrid(!showGrid)} title="Toggle Grid">
                            <Grid3X3 size={18} />
                        </button>
                        <button style={{ ...styles.iconBtn, ...(stageLayout === 'small' ? styles.iconBtnActive : {}) }} onClick={() => setStageLayout('small')} title="Small Stage">
                            <LayoutTemplate size={18} />
                        </button>
                        <button style={{ ...styles.iconBtn, ...(stageLayout === 'large' ? styles.iconBtnActive : {}) }} onClick={() => setStageLayout('large')} title="Large Stage">
                            <LayoutPanelLeft size={18} />
                        </button>
                        <button style={{ ...styles.iconBtn, ...(isFullscreen ? styles.iconBtnActive : {}) }} onClick={handleFullscreen} title="Fullscreen">
                            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                        </button>
                    </div>
                </div>
            )}

            <UnsavedWarningModal
                isOpen={showUnsavedModal}
                onYes={() => confirmUnsavedAction(true)}
                onNo={() => confirmUnsavedAction(false)}
                onCancel={() => {
                    setShowUnsavedModal(false);
                    setPendingAction(null);
                }}
            />

            {/* Sprite Library Modal */}
            <SpriteLibrary
                isOpen={showSpriteLibrary}
                onClose={() => setShowSpriteLibrary(false)}
                onSelectSprite={(sprite: any) => {
                    addSprite(sprite.id as any); // Adapt as needed
                    setShowSpriteLibrary(false);
                }}
            />

            <BackdropLibrary
                isOpen={showBackdropLibrary}
                onClose={() => setShowBackdropLibrary(false)}
                onSelectBackdrop={(backdrop) => handleBackdropSelect(backdrop.name, backdrop.image)}
            />
            {/* Main Content */}
            <div style={styles.main}>
                {/* Blockly Workspace */}
                <div style={styles.workspaceContainer}>

                    {/* Workspace content */}
                    {/* Show Blockly if:
                        1. In Stage mode AND 'blocks' tab is active
                        2. In Upload mode (always shows blocks)
                    */}
                    {((editorMode === 'stage' && workspaceTab === 'blocks') || editorMode === 'upload') && (
                        <>
                            <div ref={blocklyDiv} style={styles.blockly} />
                            <WorkspaceControls workspaceRef={workspaceRef} onAfterZoom={undefined} style={undefined} />
                            <WorkspaceTrash workspaceRef={workspaceRef} />
                        </>
                    )}

                    {/* Other Tabs - Only relevant in Stage Mode */}
                    {editorMode === 'stage' && workspaceTab === 'python' && (
                        <div style={styles.pythonEditor}>
                            <PythonEditorTab
                                workspace={workspaceRef.current}
                                onOpenFullIDE={() => setAppMode('python')}
                            />
                        </div>
                    )}
                    {editorMode === 'stage' && workspaceTab === 'costumes' && (
                        <div style={styles.costumesEditor}>
                            <CostumesTab
                                selectedSpriteId={selectedSpriteId}
                                sprites={sprites}
                                stageManager={stageManager}
                                addLog={addLog}
                                onClose={() => handleWorkspaceTabChange('blocks')}
                                onOpenLibrary={() => setShowBackdropLibrary(true)}
                            />
                        </div>
                    )}
                    {editorMode === 'stage' && workspaceTab === 'sounds' && (
                        <div style={styles.soundsEditor}>
                            <SoundsTab
                                selectedSpriteId={selectedSpriteId}
                                sprites={sprites}
                                stageManager={stageManager}
                                addLog={addLog}
                                onClose={() => handleWorkspaceTabChange('blocks')}
                            />
                        </div>
                    )}
                </div>

                {/* Right Panel */}
                <div style={{
                    ...styles.rightPanel,
                    width: stageLayout === 'small' ? '256px' : '496px',
                    transition: 'width 0.2s ease-in-out',
                }}>
                    {editorMode === 'stage' ? (
                        <>
                            {/* Stage */}
                            <div ref={stageContainerRef} style={{
                                ...styles.stageContainer,
                                width: isFullscreen ? '100vw' : (stageLayout === 'small' ? '240px' : '480px'),
                                height: isFullscreen ? '100vh' : (stageLayout === 'small' ? '180px' : '360px'),
                                transition: 'all 0.2s ease-in-out',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: isFullscreen ? '#000' : '#fff',
                            }}>
                                <div style={{
                                    transform: isFullscreen ? `scale(${fullscreenScale})` : (stageLayout === 'small' ? 'scale(0.5)' : 'scale(1)'),
                                    transformOrigin: 'center',
                                    width: '480px',
                                    height: '360px',
                                }}>
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
                            </div>

                            {/* Sprite & Stage Panels */}
                            <div style={styles.assetsContainer}>
                                <SpritePanel
                                    sprites={sprites}
                                    selectedSpriteId={selectedSpriteId}
                                    onSelectSprite={handleSpriteSelect}
                                    onAddSprite={addSprite}
                                    onDeleteSprite={deleteSprite}
                                    onRemoveBackground={handleRemoveBackground} // v2
                                    onOpenSpriteLibrary={() => setShowSpriteLibrary(true)}
                                    onOpenBackdropLibrary={() => setShowBackdropLibrary(true)}
                                    stageManager={stageManager}
                                    backdropVersion={backdropRefresh}
                                />
                                {/* <StagePanel
                                    isSelected={selectedSpriteId === 'stage'}
                                    onSelect={() => handleSpriteSelect('stage')}
                                    onOpenLibrary={() => setShowBackdropLibrary(true)}
                                    onOpenEditor={() => {
                                        handleSpriteSelect('stage');
                                        handleWorkspaceTabChange('costumes');
                                    }}
                                /> */}
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
                                    onBlur={() => {
                                        // Slight delay so if they clicked Submit it still registers
                                        setTimeout(handlePromptCancel, 100);
                                    }}
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
            {/*
                showBackdropLibrary && (
                    <BackdropLibrary
                        onSelect={handleBackdropSelect}
                        onClose={() => setShowBackdropLibrary(false)}
                    />
                )
            */}
            {/*
                showBackdropEditor && (
                    <BackdropEditor
                        onClose={() => setShowBackdropEditor(false)}
                    />
                )
            */}

            {/* Sprite Library Modal */}
            <SpriteLibrary
                isOpen={showSpriteLibrary}
                onClose={() => setShowSpriteLibrary(false)}
                onSelectSprite={(entry: SpriteEntry) => {
                    // Save current sprite workspace before adding new one
                    saveCurrentSpriteWorkspace();

                    const id = `sprite_${Date.now()}`;
                    const newSprite = new Sprite(id, entry.name, triggerUpdate, 'cat');

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
                        // Generate a small random offset explicitly close to the center 
                        // instead of completely scattering them across the stage
                        const offsetX = Math.floor(Math.random() * 60) - 30;
                        const offsetY = Math.floor(Math.random() * 60) - 30;
                        newSprite.setX(offsetX);
                        newSprite.setY(offsetY);
                    }

                    // If the sprite has an image or costumes, use them
                    const costumesToLoad = entry.costumes && entry.costumes.length > 0
                        ? entry.costumes
                        : (entry.image ? [entry.image] : []);

                    if (costumesToLoad.length > 0) {
                        // Load all costumes sequentially to maintain order and wait for completion
                        (async () => {
                            for (let i = 0; i < costumesToLoad.length; i++) {
                                const costumeSrc = costumesToLoad[i];
                                const costumeName = i === 0 ? entry.name : `${entry.name} ${i + 1}`;
                                await newSprite.addCostume(costumeName, costumeSrc);
                            }
                            // Add default sound
                            await newSprite.addSound('Meow', '/assets/sounds/meow.wav');

                            // Set initial costume
                            newSprite.switchCostume(0);
                            triggerUpdate();
                        })();
                    } else if (entry.emoji) {
                        // Create costume from emoji by drawing on canvas
                        const canvas = document.createElement('canvas');
                        canvas.width = 200;
                        canvas.height = 200;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.font = '120px Arial';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(entry.emoji, 100, 100);
                            newSprite.addCostume(entry.name, canvas.toDataURL()).then(() => {
                                newSprite.switchCostume(entry.name);
                                triggerUpdate();
                            });
                        }
                    }
                    animationVM.registerSprite(newSprite);
                    setSprites(prev => [...prev, newSprite]);

                    // Initialize empty workspace for the new sprite
                    spriteWorkspacesRef.current.set(id, {});

                    // Silently clear workspace to prevent event bleed
                    if (workspaceRef.current) {
                        isLoadingWorkspaceRef.current = true;
                        Blockly.Events.disable();
                        workspaceRef.current.clear();
                        Blockly.Events.enable();
                        // Allow layout events to fizzle before accepting changes
                        setTimeout(() => {
                            isLoadingWorkspaceRef.current = false;
                        }, 50);
                    }

                    activeSpriteIdRef.current = id;
                    setSelectedSpriteId(id);
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

    unifiedToolbar: {
        display: 'flex',
        alignItems: 'flex-end',
        backgroundColor: '#fff',
        borderBottom: '1px solid #ddd',
        height: '44px',
        padding: '0',
    },
    actionButtons: { display: 'flex', gap: '6px', alignItems: 'center' },
    iconBtn: {
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5px',
        borderRadius: '4px',
        color: '#575E75',
        transition: 'background 0.2s',
        outline: 'none',
    },
    iconBtnActive: {
        background: '#e0d6ff',
        color: '#855CD6'
    },
    runButtonTop: {
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '4px',
    },
    stopButtonTop: {
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '4px',
    },
    undoRedoBtn: {
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '50%',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'all 0.2s',
        outline: 'none',
    },

    main: { flex: 1, display: 'flex', overflow: 'hidden' },

    // Workspace
    workspaceContainer: { flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' },
    blockly: { flex: 1, width: '100%' },

    // PictoBlox-style tabs
    tabBar: {
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'end',
        backgroundColor: '#fff',
        borderBottom: '1px solid #ddd',
        padding: '0 20px',
        height: '44px',
        gap: '4px',
    },
    tab: {
        padding: '8px 24px',
        borderTop: '1px solid #ddd',
        borderLeft: '1px solid #ddd',
        borderRight: '1px solid #ddd',
        borderBottom: 'none',
        backgroundColor: '#f9f9f9',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 600,
        color: '#999',
        borderTopLeftRadius: '10px',
        borderTopRightRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s',
    },
    tabActive: {
        padding: '10px 24px',
        borderTop: '1px solid #ddd',
        borderLeft: '1px solid #ddd',
        borderRight: '1px solid #ddd',
        borderBottom: '1px solid #fff',
        backgroundColor: '#fff',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 600,
        color: '#855CD6',
        marginBottom: '-1px',
        borderTopLeftRadius: '10px',
        borderTopRightRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 5,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
    },

    // Placeholder editors
    pythonEditor: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1e1e1e',
        overflow: 'hidden'
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
