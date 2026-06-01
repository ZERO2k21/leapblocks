/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { STAGE_CONFIG } from './engine/StageConfig';

import Blockly, { LEAP_CUSTOM_BLOCK_CONTEXT_MENU_FLAG } from '@blockly-runtime';

import leaplabBlocksCss from './styles/Leaplab-blocks.css?inline'; // Import leap-style blocks CSS (inlined for dynamic injection)
import { registerCustomFields } from './blockly/registerCustomFields'; // Register field_colour, field_angle, etc.


import { arduinoBlocks, arduinoToolbox } from './blocks/arduino-blocks';

import { esp32Blocks, esp32Toolbox } from './blocks/esp32-blocks';

import { animationBlocks, animationToolbox } from './blocks/animation-blocks';
import { COLORS } from './blocks/blockDefinitions';
import { registerleapBlocks } from './blocks/leapBlocks';

import { hardwareBlocks } from './blocks/hardware-blocks';

import { arduinoGenerator } from './generators/arduino-generator';

import { AnimationCompiler } from './generators/animation-generator';

import { initPythonGenerator } from './generators/python-generator'; // Deferred registration

import { animationVM } from './vm/AnimationVM';
import type { CompiledScript } from './vm/AnimationVM';

import { Sprite } from './stage/Sprite';
import type { SpriteType } from './stage/Sprite';

import Stage from './stage/Stage';
import AskBar from './components/AskBar';

import SpritePanel from './stage/SpritePanel';

import MenuBar from './leapignite/client/components/MenuBar';

import BoardSelectionModal from './leapignite/client/components/BoardSelectionModal';

import { PythonEditorTab } from './components/PythonEditorTab';

// import StagePanel from './stage/StagePanel'; // Temporarily disabled - component needs to be created

// Lazy load large components for better performance
const BackdropLibrary = React.lazy(() => import('./components/BackdropLibrary'));
const SpriteLibrary = React.lazy(() => import('./components/SpriteLibrary').then(m => ({ default: m.SpriteLibrary })));
const JuniorExtensionLibrary = React.lazy(() => import('./leapignite/client/components/JuniorExtensionLibrary'));

// Lazy load heavy tabs that import fabric.js and wav-encoder - prevents 60s startup delay
const CostumesTab = React.lazy(() => import('./stage/CostumesTab').then(m => ({ default: m.CostumesTab })));
const SoundsTab = React.lazy(() => import('./stage/SoundsTab').then(m => ({ default: m.SoundsTab })));

// import BackdropEditor from './components/BackdropEditor'; // Temporarily disabled

import { stageManager } from './engine/StageManager';
import { spriteManager } from './engine/SpriteManager';
import { leapRuntime } from './runtime/leapRuntime';
import { initRuntime, setActiveSpriteId, setFaceVideoElement } from './runtime/RuntimeBridge';
import { hardwareAdapter } from './hardware/HardwareAdapter';

import SerialMonitor from './components/SerialMonitor';

import UploadModal from './components/UploadModal';

import type { SpriteEntry } from './components/SpriteLibrary';

import WorkspaceControls from './components/WorkspaceControls';

import WorkspaceTrash from './components/WorkspaceTrash';

import UnsavedWarningModal from './leapignite/client/components/UnsavedWarningModal';
import { EXTENSIONS, registerExtensions } from './extensions/extensionDefinitions';


import { fileService } from './Electra/Client/Src/services/FileService';
import { registerLeapRenderer } from './leapignite/server/blocks/LeapRenderer';

import { Flag, Square, Upload, Camera, CameraOff, Grid3X3, Maximize, Minimize, LayoutTemplate, LayoutPanelLeft, Library, Pen, Volume2, Undo2, Redo2, Terminal } from 'lucide-react';

import { registerLeapBloxCategory } from './custom-toolbox';

// Import dialog components
import MakeVariableDialog from './components/MakeVariableDialog';
import MakeListDialog from './components/MakeListDialog';
import MakeTableDialog from './components/MakeTableDialog';
import MakeBlockDialog from './components/MakeBlockDialog';
import type { BlockArgument } from './components/MakeBlockDialog';

// Import monitor components
import VariableMonitor from './components/VariableMonitor';
import ListMonitor from './components/ListMonitor';
import TableMonitor from './components/TableMonitor';



// Global initialization guards to prevent duplicate block registration and recursive prototype patching
let blocksInitialized = false;
let originalCheckboxSetValue: any = null;

// Initialize Extension Runtime mapping — delegates to RuntimeBridge
// which wires pen → PenManager and face → FaceRuntime (browser FaceDetector API)
// and extension runtimes → ObjectDetection, Music, etc.
if (typeof window !== 'undefined') {
    initRuntime();
    // Extensions are initialized lazily when added via the Extension Library
}


// ═══════════════════════════════════════════════════════════════════════════



// LOGGING UTILITY

// ═══════════════════════════════════════════════════════════════════════════

const log = {

    app: (msg: string, data?: any) => console.log(`[APP] ${msg}`, data ?? ''),

    blockly: (msg: string, data?: any) => console.log(`[BLOCKLY] ${msg}`, data ?? ''),

    generator: (msg: string, data?: any) => console.log(`[GENERATOR] ${msg}`, data ?? ''),

};



// Register all blocks

const registerBlocks = () => {
    // 1. Register leap 3.0 compatible blocks (100+ blocks)
    try {
        registerleapBlocks();
        log.app('Registered leap 3.0 blocks (100+ blocks)');
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        log.app(`Error registering leap blocks: ${errorMessage}`);
    }

    // 2. Register other platform-specific blocks (Arduino, ESP32, Hardware, Animation)
    const blocksToRegister = [
        ...(Array.isArray(arduinoBlocks) ? arduinoBlocks : []),
        ...(Array.isArray(esp32Blocks) ? esp32Blocks : []),
        ...(Array.isArray(animationBlocks) ? animationBlocks : []),
        ...(Array.isArray(hardwareBlocks) ? hardwareBlocks : [])
    ];

    // Filter out blocks that are already registered in Blockly.Blocks
    const newBlocks = blocksToRegister.filter(block => block && block.type && !Blockly.Blocks[block.type]);

    if (newBlocks.length > 0) {
        try {
            Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newBlocks));
            log.app(`Registered ${newBlocks.length} additional blocks (Arduino/ESP32/Hardware).`);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// DEFERRED BLOCKLY INITIALIZATION
// All Blockly monkey-patches and registrations are deferred to first render
// to avoid TDZ errors when webpack chunk splitting reorders module evaluation.
// ═══════════════════════════════════════════════════════════════════════════

let _blocklyInitialized = false;
const BLOCKLY_MEDIA_PATH = './blockly-media/';

function initBlocklyOnce() {
    if (_blocklyInitialized) return;
    _blocklyInitialized = true;

    // Register Leap Renderer
    registerLeapRenderer(Blockly);

    registerBlocks();

    // Initialize Python generator (deferred from module scope)
    initPythonGenerator();

    // Register custom toolbox category (deferred from module scope)
    registerLeapBloxCategory();

    // Register custom fields (field_angle, field_colour) before any Blockly.inject call
    registerCustomFields();

    // Configure Blockly dialogs for Electron (native prompt/alert not supported)
    Blockly.dialog.setPrompt((message, defaultValue, callback) => {
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

    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL BLOCKLY OVERRIDES
    // ═══════════════════════════════════════════════════════════════════════

    // Extension for broadcast dropdowns to handle "New message..."
    if (!Blockly.Extensions.isRegistered('broadcast_dropdown_ext')) {
        Blockly.Extensions.register('broadcast_dropdown_ext', function (this: any) {
            this.setOnChange(function (this: any, event: any) {
                if (event.type === Blockly.Events.BLOCK_CHANGE && event.blockId === this.id) {
                    const fieldName = event.name;
                    if (fieldName === 'BROADCAST_INPUT' || fieldName === 'BROADCAST_OPTION') {
                        const newValue = event.newValue;
                        if (newValue === 'new') {
                            (window as any).createNewBroadcast((name: string | null) => {
                                if (name) {
                                    this.setFieldValue(name, fieldName);
                                } else {
                                    // Revert to default or previous if cancelled
                                    this.setFieldValue('message1', fieldName);
                                }
                            });
                        }
                    }
                }
            });
        });
    }

}

const MORE_BLOCKS_CATEGORY_NAME = 'More Blocks';
const MORE_BLOCKS_CATEGORY_COLOUR = '#94A3B8';

const isToolboxCategory = (category: any) =>
    category?.kind === 'leapbloxCategory' ||
    category?.kind === 'leapBloxCategory' ||
    category?.kind === 'category';

const normalizeCategoryClassName = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const createFlyoutCategoryLabel = (text: string) => ({
    kind: 'label',
    text,
    'web-class': `category-header category-header-${normalizeCategoryClassName(text)}`
});

const createFlyoutSectionLabel = (text: string, className: string) => ({
    kind: 'label',
    text,
    'web-class': `category-subheader ${className}`
});

const createMonitorReporterPlaceholder = (
    blockType: string,
    fieldName: string,
    fieldValue: string,
    checked: boolean,
    gap?: number
) => ({
    kind: 'block',
    type: blockType,
    ...(typeof gap === 'number' ? { gap } : {}),
    fields: {
        CHECK: checked ? 'TRUE' : 'FALSE',
        [fieldName]: fieldValue
    }
});

const createMoreBlocksCategory = () => ({
    kind: 'leapbloxCategory',
    name: MORE_BLOCKS_CATEGORY_NAME,
    colour: MORE_BLOCKS_CATEGORY_COLOUR,
    custom: 'LEAP_MOREBLOCKS'
});

const withCategoryHeaders = (contents: any[]) => {
    const categoriesWithMoreBlocks = contents.some((category: any) => category?.name === MORE_BLOCKS_CATEGORY_NAME)
        ? contents
        : [...contents, createMoreBlocksCategory()];

    return categoriesWithMoreBlocks.map((category: any) => {
        if (!isToolboxCategory(category) || !Array.isArray(category.contents)) {
            return category;
        }

        return {
            ...category,
            contents: [createFlyoutCategoryLabel(category.name), ...category.contents]
        };
    });
};



// ═══════════════════════════════════════════════════════════════════════════

// MAIN APP COMPONENT

// ═══════════════════════════════════════════════════════════════════════════

// Main app mode: home (welcome screen) or one of the coding modes

type AppMode = 'home' | 'blocks' | 'python' | 'notebook' | 'ml' | 'xr';

// Editor sub-mode for blocks: stage (animation) or upload (hardware)

type EditorMode = 'stage' | 'upload';

// Monitor interfaces
interface VariableMonitorState {
    id: string;
    name: string;
    type: 'Number' | 'String';
    scope: 'all_sprites' | 'this_sprite';
    spriteId?: string;
    visible: boolean;
    value: number | string;
    x: number;
    y: number;
    zIndex?: number;
    mode?: 'normal' | 'large' | 'slider';
    sliderMin?: number;
    sliderMax?: number;
}

const DEFAULT_VARIABLE_MONITOR_MODE: 'normal' = 'normal';
const DEFAULT_VARIABLE_SLIDER_MIN = 0;
const DEFAULT_VARIABLE_SLIDER_MAX = 100;

const hasFiniteNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value);

const normalizeVariableMonitor = (monitor: VariableMonitorState, index = 0): VariableMonitorState => ({
    ...monitor,
    visible: monitor.visible ?? true,
    value: monitor.value ?? (monitor.type === 'String' ? '' : 0),
    x: hasFiniteNumber(monitor.x) ? monitor.x : 10,
    y: hasFiniteNumber(monitor.y) ? monitor.y : 10 + (index * 30),
    zIndex: hasFiniteNumber(monitor.zIndex) ? monitor.zIndex : 100 + index,
    mode: monitor.mode || DEFAULT_VARIABLE_MONITOR_MODE,
    sliderMin: hasFiniteNumber(monitor.sliderMin) ? monitor.sliderMin : DEFAULT_VARIABLE_SLIDER_MIN,
    sliderMax: hasFiniteNumber(monitor.sliderMax) ? monitor.sliderMax : DEFAULT_VARIABLE_SLIDER_MAX
});

interface ListMonitorState {
    id: string;
    name: string;
    scope: 'all_sprites' | 'this_sprite';
    spriteId?: string;
    visible: boolean;
    items: (string | number)[];
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex?: number;
}

interface TableMonitorState {
    id: string;
    name: string;
    rows: number;
    cols: number;
    scope: 'all_sprites' | 'this_sprite';
    spriteId?: string;
    visible: boolean;
    data: (string | number)[][];
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex?: number;
}



const IntermediateApp: React.FC<{ onBack: () => void; onOpenPython?: () => void; openTab?: 'blocks' | 'python' | 'costumes' | 'sounds' }> = ({ onBack, onOpenPython, openTab = 'blocks' }) => {

    // Initialize Blockly patches on first render (deferred from module scope to avoid TDZ)
    initBlocklyOnce();

    // Dynamically inject Leaplab-blocks CSS only while Intermediate is mounted.
    // This prevents the global unscoped rules from leaking into Junior mode.
    useEffect(() => {
        const styleEl = document.createElement('style');
        styleEl.textContent = leaplabBlocksCss;
        styleEl.setAttribute('data-leaplab-blocks', 'true');
        document.head.appendChild(styleEl);
        return () => {
            styleEl.remove();
        };
    }, []);

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

    const [sprites, setSprites] = useState<Sprite[]>(spriteManager.getAllSprites());

    // Runtime Sprite Sync (Clones, Deletions, etc.)
    useEffect(() => {
        const handleUpdate = () => setSprites([...spriteManager.getAllSprites()]);
        spriteManager.setUpdateCallback(handleUpdate);
        handleUpdate();
        return () => spriteManager.setUpdateCallback(() => { });
    }, []);

    const [selectedSpriteId, setSelectedSpriteId] = useState<string | null>(null);

    const [compiledScripts, setCompiledScripts] = useState<CompiledScript[]>([]);



    // Per-sprite workspace storage: maps spriteId -> Blockly serialized JSON

    const spriteWorkspacesRef = useRef<Map<string, object>>(new Map());

    const activeSpriteIdRef = useRef<string | null>(null); // Tracks true owner of current blocks

    const isLoadingWorkspaceRef = useRef(false);

    const syncAllWorkspacesRef = useRef<(() => CompiledScript[]) | null>(null);

    // Drag-tracking refs for block-to-sprite copying
    const draggedBlockStateRef = useRef<any>(null);
    const lastPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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

    // Tracks which extension categories have been installed (pen, face_detection, etc.)
    // Used by getCurrentToolbox() to inject them after "My Blocks"
    const [installedExtensions, setInstalledExtensions] = useState<Set<string>>(new Set());
    const installedExtensionsRef = useRef<Set<string>>(new Set());

    // ─── EXTENSIONS ──────────────────────────────────────────────────────────
    const handleAddExtension = useCallback((extId: string) => {
        if (!workspaceRef.current) return;

        console.log(`[Extension] Adding extension: ${extId}`);

        // Normalize ID (face-detection -> face_detection)
        const id = extId.replace(/-/g, '_');
        const ext = EXTENSIONS[id];

        if (ext) {
            // 1. Register blocks and generators
            registerExtensions(Blockly, [id]);

            // 2. Mark installed
            if (!installedExtensionsRef.current.has(id)) {
                installedExtensionsRef.current = new Set([...installedExtensionsRef.current, id]);
                setInstalledExtensions(new Set(installedExtensionsRef.current));
                console.log(`[Extension] ${ext.name} marked as installed.`);
            }
        } else {
            console.warn(`[Extension] Unknown extension ID: ${extId}`);
        }
    }, [workspaceRef]);

    // Listen for extension iframe messages
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'ADD_EXTENSION') {
                const extId = event.data.extension || event.data.extensionId || event.data.ext;
                if (extId) {
                    handleAddExtension(extId);
                    setShowExtensionLibrary(false);
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [handleAddExtension]);



    const [isDraggingSprite, setIsDraggingSprite] = useState(false);

    const [stageLayout, setStageLayout] = useState<'normal' | 'small' | 'large'>('normal');

    const [isFullscreen, setIsFullscreen] = useState(false);

    const [fullscreenScale, setFullscreenScale] = useState(1);

    const stageContainerRef = useRef<HTMLDivElement>(null);



    const handleFullscreen = () => {
        if (!isFullscreen) {
            setIsFullscreen(true);
            // Calculate initial scale
            const scaleX = window.innerWidth / 480;
            const scaleY = (window.innerHeight - 54) / 360; // 54px toolbar
            setFullscreenScale(Math.min(scaleX, scaleY));
        } else {
            setIsFullscreen(false);
            setFullscreenScale(1);
        }
    };



    useEffect(() => {

        const updateScale = () => {
            if (isFullscreen) {
                // Scale stage canvas (480×360) to fill viewport minus toolbar (54px)
                const scaleX = window.innerWidth / 480;
                const scaleY = (window.innerHeight - 54) / 360;
                setFullscreenScale(Math.min(scaleX, scaleY));
            } else {
                setFullscreenScale(1);
            }
        };

        updateScale();
        window.addEventListener('resize', updateScale);

        return () => {
            window.removeEventListener('resize', updateScale);
        };

    }, [isFullscreen]);



    // Backdrop state

    const [showBackdropLibrary, setShowBackdropLibrary] = useState(false);

    const [showBackdropEditor, setShowBackdropEditor] = useState(false);

    const [backdropRefresh, setBackdropRefresh] = useState(0); // Force re-render on backdrop change



    // Sprite Library state


    const [showSpriteLibrary, setShowSpriteLibrary] = useState(false);

    // Extension Library state
    const [showExtensionLibrary, setShowExtensionLibrary] = useState(false);


    const lastToolboxJsonRef = useRef<string>('');
    const isRebuildingToolboxRef = useRef(false);
    const [toolboxUpdateKey, setToolboxUpdateKey] = useState(0);



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

        type: 'standard' | 'variable' | 'list' | 'table';

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

    const selectedSpriteIdRef = useRef(selectedSpriteId);
    useEffect(() => { selectedSpriteIdRef.current = selectedSpriteId; }, [selectedSpriteId]);



    // Dialog states
    const [isMakeVariableOpen, setIsMakeVariableOpen] = useState(false);
    const [isMakeListOpen, setIsMakeListOpen] = useState(false);
    const [isMakeTableOpen, setIsMakeTableOpen] = useState(false);
    const [isMakeBlockOpen, setIsMakeBlockOpen] = useState(false);

    // Ask-and-wait state
    const [askState, setAskState] = useState<{
        isAsking: boolean;
        question: string;
        resolve: ((answer: string) => void) | null;
    }>({ isAsking: false, question: '', resolve: null });

    const handleAskSubmit = useCallback((answer: string) => {
        if (askState.resolve) askState.resolve(answer);
        setAskState({ isAsking: false, question: '', resolve: null });
    }, [askState.resolve]);

    // Monitor states
    const [variableMonitors, setVariableMonitors] = useState<VariableMonitorState[]>([]);
    const [listMonitors, setListMonitors] = useState<ListMonitorState[]>([]);
    const [tableMonitors, setTableMonitors] = useState<TableMonitorState[]>([]);
    const [sensingMonitors, setSensingMonitors] = useState<VariableMonitorState[]>([
        { id: 'answer', name: 'answer', type: 'String', scope: 'all_sprites', visible: false, value: '', x: 10, y: 350 },
        { id: 'timer', name: 'timer', type: 'Number', scope: 'all_sprites', visible: false, value: 0, x: 10, y: 380 },
        { id: 'loudness', name: 'loudness', type: 'Number', scope: 'all_sprites', visible: false, value: 0, x: 10, y: 410 }
    ]);

    const variableMonitorsRef = useRef(variableMonitors);
    const listMonitorsRef = useRef(listMonitors);
    const sensingMonitorsRef = useRef(sensingMonitors);
    const syncedVariableMonitorNamesRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        variableMonitorsRef.current = variableMonitors;
    }, [variableMonitors]);

    useEffect(() => {
        listMonitorsRef.current = listMonitors;
    }, [listMonitors]);

    useEffect(() => {
        sensingMonitorsRef.current = sensingMonitors;
    }, [sensingMonitors]);

    // Keep window monitors in sync for Blockly toolbox checkboxes
    useEffect(() => {
        (window as any)._monitors_for_sync = {
            variable: variableMonitors,
            list: listMonitors,
            table: tableMonitors,
            sensing: sensingMonitors
        };
    }, [variableMonitors, listMonitors, tableMonitors, sensingMonitors]);

    useEffect(() => {
        const activeVariableNames = new Set<string>();
        const previouslySyncedVariableNames = syncedVariableMonitorNamesRef.current;

        variableMonitors.forEach((monitor) => {
            activeVariableNames.add(monitor.name);

            if (!animationVM.hasVariable(monitor.name) || animationVM.getVariable(monitor.name) !== monitor.value) {
                animationVM.setVariable(monitor.name, monitor.value);
            }
        });

        previouslySyncedVariableNames.forEach((name) => {
            if (!activeVariableNames.has(name)) {
                animationVM.deleteVariable(name);
            }
        });

        syncedVariableMonitorNamesRef.current = activeVariableNames;
    }, [variableMonitors]);

    const handleMonitorPositionChange = useCallback((type: 'variable' | 'list' | 'table' | 'sensing', id: string, x: number, y: number) => {
        if (type === 'variable') setVariableMonitors(prev => prev.map(m => m.id === id ? { ...m, x, y } : m));
        if (type === 'list') setListMonitors(prev => prev.map(m => m.id === id ? { ...m, x, y } : m));
        if (type === 'table') setTableMonitors(prev => prev.map(m => m.id === id ? { ...m, x, y } : m));
        if (type === 'sensing') setSensingMonitors(prev => prev.map(m => m.id === id ? { ...m, x, y } : m));
    }, []);

    const handleMonitorResize = useCallback((type: 'list' | 'table', id: string, width: number, height: number) => {
        if (type === 'list') setListMonitors(prev => prev.map(m => m.id === id ? { ...m, width, height } : m));
        if (type === 'table') setTableMonitors(prev => prev.map(m => m.id === id ? { ...m, width, height } : m));
    }, []);

    const handleMonitorBringToFront = useCallback((type: 'variable' | 'list' | 'table' | 'sensing', id: string) => {
        const vMax = Math.max(100, ...variableMonitors.map(m => m.zIndex || 100));
        const lMax = Math.max(100, ...listMonitors.map(m => m.zIndex || 100));
        const tMax = Math.max(100, ...tableMonitors.map(m => m.zIndex || 100));
        const sMax = Math.max(100, ...sensingMonitors.map(m => m.zIndex || 100));
        const maxZ = Math.max(vMax, lMax, tMax, sMax);
        const newZ = maxZ + 1;

        if (type === 'variable') setVariableMonitors(prev => prev.map(m => m.id === id ? { ...m, zIndex: newZ } : m));
        if (type === 'list') setListMonitors(prev => prev.map(m => m.id === id ? { ...m, zIndex: newZ } : m));
        if (type === 'table') setTableMonitors(prev => prev.map(m => m.id === id ? { ...m, zIndex: newZ } : m));
        if (type === 'sensing') setSensingMonitors(prev => prev.map(m => m.id === id ? { ...m, zIndex: newZ } : m));
    }, [variableMonitors, listMonitors, tableMonitors, sensingMonitors]);

    const handleVariableModeChange = useCallback((id: string, mode: 'normal' | 'large' | 'slider') => {
        setVariableMonitors(prev => prev.map(m => m.id === id ? { ...m, mode } : m));
    }, []);

    const handleVariableValueChange = useCallback((id: string, value: string | number) => {
        setVariableMonitors(prev => {
            const monitor = prev.find(m => m.id === id);
            if (monitor) {
                animationVM.setVariable(monitor.name, value);
                return prev.map(m => m.id === id ? { ...m, value } : m);
            }
            return prev;
        });
    }, []);

    const handleVariableSliderRangeChange = useCallback((id: string, min: number, max: number) => {
        if (!Number.isFinite(min) || !Number.isFinite(max)) {
            return;
        }

        const nextMin = Math.min(min, max);
        const nextMax = Math.max(min, max);
        setVariableMonitors(prev => prev.map(m => m.id === id ? { ...m, sliderMin: nextMin, sliderMax: nextMax } : m));
    }, []);

    const handleListAddItem = useCallback((listName: string, item: string) => {
        animationVM.addToList(listName, item);
    }, []);

    const handleListEditItem = useCallback((listName: string, index: number, value: string) => {
        animationVM.replaceItemOfList(listName, index + 1, value);
    }, []);

    const handleListDeleteItem = useCallback((listName: string, index: number) => {
        animationVM.deleteOfList(listName, index + 1);
    }, []);

    // Bind AnimationVM execution callbacks to update React state
    useEffect(() => {
        animationVM.onShowVariable = (name) => {
            setVariableMonitors(prev => {
                const existing = prev.find(m => m.name === name);
                if (existing) return prev.map(m => m.name === name ? { ...m, visible: true } : m);
                // If the monitor doesn't exist, we can't create it here without the ID
                return prev;
            });
        };
        animationVM.onHideVariable = (name) => setVariableMonitors(prev => prev.map(m => m.name === name ? { ...m, visible: false } : m));

        animationVM.onShowList = (name) => {
            setListMonitors(prev => {
                const existing = prev.find(m => m.name === name);
                if (existing) return prev.map(m => m.name === name ? { ...m, visible: true } : m);
                return prev;
            });
        };
        animationVM.onHideList = (name) => setListMonitors(prev => prev.map(m => m.name === name ? { ...m, visible: false } : m));

        animationVM.onShowTable = (name) => {
            setTableMonitors(prev => {
                const existing = prev.find(m => m.name === name);
                if (existing) return prev.map(m => m.name === name ? { ...m, visible: true } : m);
                return prev;
            });
        };
        animationVM.onHideTable = (name) => setTableMonitors(prev => prev.map(m => m.name === name ? { ...m, visible: false } : m));

        // Ask-and-wait: VM calls this, returns a Promise that blocks execution
        animationVM.onAskQuestion = (question: string) => {
            return new Promise<string>((resolve) => {
                setAskState({ isAsking: true, question, resolve });
            });
        };

        animationVM.onVariableChange = (name, value) => {
            setVariableMonitors(prev => prev.map(m => m.name === name ? { ...m, value } : m));
        };

        animationVM.onListChange = (name, value) => {
            setListMonitors(prev => prev.map(m => m.name === name ? { ...m, items: value } : m));
        };

        animationVM.onTableChange = (name, data) => {
            setTableMonitors(prev => prev.map(m => m.name === name ? { ...m, data } : m));
        };

        animationVM.onAnswerChange = (answer: string) => {
            setSensingMonitors(prev => prev.map(m => m.name === 'answer' ? { ...m, value: answer } : m));
        };

        return () => {
            animationVM.onShowVariable = undefined;
            animationVM.onHideVariable = undefined;
            animationVM.onShowList = undefined;
            animationVM.onHideList = undefined;
            animationVM.onShowTable = undefined;
            animationVM.onHideTable = undefined;
            animationVM.onAskQuestion = undefined;
            animationVM.onVariableChange = undefined;
            animationVM.onListChange = undefined;
            animationVM.onTableChange = undefined;
            animationVM.onAnswerChange = undefined;
        };
    }, []);



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

                const newVar = ws.getVariableMap().createVariable(promptInput, variableType); // Type is loosely used here

                if (newVar) {

                    // If scoped 'local', we'd need custom handling, but effectively global for now

                    if (variableScope === 'local') {

                        console.warn('Local variables not fully supported, created as global');

                    }

                }

            } else if (promptState.type === 'list' && workspaceRef.current) {

                // Manually create list

                const ws = workspaceRef.current;

                ws.getVariableMap().createVariable(promptInput, 'list'); // 'list' type is crucial

            } else if (promptState.type === 'table' && workspaceRef.current) {

                // Manually create table

                const ws = workspaceRef.current;

                ws.getVariableMap().createVariable(promptInput, 'table'); // 'table' type

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



    // Dialog handlers
    const handleCreateVariable = (variable: { name: string; type: 'Number' | 'String'; scope: 'all_sprites' | 'this_sprite' }) => {
        setVariableMonitors(prev => {
            const existing = prev.find(m => m.name === variable.name);
            if (existing) {
                return prev.map(m =>
                    m.name === variable.name
                        ? { ...m, type: variable.type, scope: variable.scope, spriteId: variable.scope === 'this_sprite' ? selectedSpriteId || 'stage' : undefined, visible: true }
                        : m
                );
            }
            const newMonitor = normalizeVariableMonitor({
                id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: variable.name,
                type: variable.type,
                scope: variable.scope,
                spriteId: variable.scope === 'this_sprite' ? selectedSpriteId || 'stage' : undefined,
                visible: true,
                value: variable.type === 'Number' ? 0 : '',
                x: 10 + (prev.length * 20),
                y: 10 + (prev.length * 30)
            }, prev.length);
            return [...prev, newMonitor];
        });
        addLog(`Created variable: ${variable.name} (${variable.type})`);
    };

    const handleCreateList = (list: { name: string; scope: 'all_sprites' | 'this_sprite' }) => {
        setListMonitors(prev => {
            const existing = prev.find(m => m.name === list.name);
            if (existing) {
                return prev.map(m =>
                    m.name === list.name
                        ? { ...m, scope: list.scope, spriteId: list.scope === 'this_sprite' ? selectedSpriteId || 'stage' : undefined, visible: true }
                        : m
                );
            }
            const newMonitor: ListMonitorState = {
                id: `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: list.name,
                scope: list.scope,
                spriteId: list.scope === 'this_sprite' ? selectedSpriteId || 'stage' : undefined,
                visible: true,
                items: [],
                x: 10 + (prev.length * 20),
                y: 60 + (prev.length * 30),
                width: 140,
                height: 180
            };
            return [...prev, newMonitor];
        });
        addLog(`Created list: ${list.name}`);
    };

    const handleCreateTable = (table: { name: string; rows: number; cols: number; scope: 'all_sprites' | 'this_sprite' }) => {
        const emptyData = Array(table.rows).fill(null).map(() => Array(table.cols).fill(''));
        setTableMonitors(prev => {
            const existing = prev.find(m => m.name === table.name);
            if (existing) {
                return prev.map(m =>
                    m.name === table.name
                        ? { ...m, scope: table.scope, spriteId: table.scope === 'this_sprite' ? selectedSpriteId || 'stage' : undefined, visible: true }
                        : m
                );
            }
            const newMonitor: TableMonitorState = {
                id: `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: table.name,
                rows: table.rows,
                cols: table.cols,
                scope: table.scope,
                spriteId: table.scope === 'this_sprite' ? selectedSpriteId || 'stage' : undefined,
                visible: true,
                data: emptyData,
                x: 10 + (prev.length * 20),
                y: 260 + (prev.length * 30),
                width: 200,
                height: 150
            };
            return [...prev, newMonitor];
        });
        addLog(`Created table: ${table.name} (${table.rows}×${table.cols})`);
    };

    const handleCreateBlock = (block: { name: string; arguments: BlockArgument[]; warp: boolean }) => {
        const ws = workspaceRef.current;
        if (!ws) return;

        Blockly.Events.setGroup(true);
        try {
            // leap-style procedure codes: %s for string/number, %b for boolean
            let proccode = block.name;
            const argumentnames: string[] = [];
            const argumentids: string[] = [];

            block.arguments.forEach((arg) => {
                if (arg.type === 'label') {
                    proccode += ` ${arg.value}`;
                } else {
                    proccode += arg.type === 'boolean' ? ' %b' : ' %s';
                    argumentnames.push(arg.value);
                    argumentids.push(arg.id);
                }
            });

            // Using procedures_definition for leap parity
            const xmlText = `
                <xml>
                    <block type="procedures_definition" x="50" y="50">
                        <statement name="custom_block">
                            <shadow type="procedures_prototype">
                                <mutation 
                                    proccode="${proccode.replace(/"/g, '&quot;')}" 
                                    argumentnames='${JSON.stringify(argumentnames).replace(/"/g, '&quot;')}' 
                                    argumentids='${JSON.stringify(argumentids).replace(/"/g, '&quot;')}' 
                                    warp="${block.warp}" 
                                />
                            </shadow>
                        </statement>
                    </block>
                </xml>`;

            const xmlDom = Blockly.utils.xml.textToDom(xmlText);
            Blockly.Xml.domToWorkspace(xmlDom, ws);

            addLog(`Created custom block: ${block.name}`);
        } catch (e) {
            console.error('Failed to create custom block', e);
            // Fallback for non-leap renderers
            try {
                let mutationXml = `<mutation>`;
                block.arguments.forEach(arg => {
                    if (arg.type !== 'label') {
                        mutationXml += `<arg name="${arg.value}"></arg>`;
                    }
                });
                mutationXml += `</mutation>`;
                const xmlText = `<xml><block type="procedures_defnoreturn" x="50" y="50"><field name="NAME">${block.name}</field>${mutationXml}</block></xml>`;
                const xmlDom = Blockly.utils.xml.textToDom(xmlText);
                Blockly.Xml.domToWorkspace(xmlDom, ws);
            } catch (e2) { }
        } finally {
            Blockly.Events.setGroup(false);
        }
    };

    // Monitor callback handlers
    const handleShowVariable = useCallback((name: string) => {
        (window as any).onToggleVisibility?.(name, 'variable', true);
    }, []);

    const handleHideVariable = useCallback((name: string) => {
        (window as any).onToggleVisibility?.(name, 'variable', false);
    }, []);

    const handleShowList = useCallback((name: string) => {
        (window as any).onToggleVisibility?.(name, 'list', true);
    }, []);

    const handleHideList = useCallback((name: string) => {
        (window as any).onToggleVisibility?.(name, 'list', false);
    }, []);

    const handleShowTable = useCallback((name: string) => {
        (window as any).onToggleVisibility?.(name, 'table', true);
    }, []);

    const handleHideTable = useCallback((name: string) => {
        (window as any).onToggleVisibility?.(name, 'table', false);
    }, []);




    const addLog = useCallback((message: string) => {

        setLogMessages(prev => [...prev.slice(-50), `[${new Date().toLocaleTimeString()}] ${message}`]);

    }, []);



    const getCurrentToolbox = useCallback(() => {

        // Build the extension categories to inject after "My Blocks"
        const extensionCategories: any[] = [];
        const ext = installedExtensionsRef.current;

        console.log('[Toolbox] Building toolbox. Installed extensions:', Array.from(ext));

        ext.forEach(id => {
            const definition = EXTENSIONS[id];
            if (definition) {
                extensionCategories.push({
                    kind: 'leapbloxCategory',
                    name: definition.name,
                    colour: definition.color,
                    contents: definition.getToolbox(),
                });
            }
        });

        // Helper: inject extension categories immediately after "My Blocks"
        const injectExtensions = (contents: any[]) => {
            if (extensionCategories.length === 0) return contents;
            const myBlocksIdx = contents.findIndex((c: any) => c.name === 'My Blocks');
            if (myBlocksIdx === -1) return [...contents, ...extensionCategories];
            return [
                ...contents.slice(0, myBlocksIdx + 1),
                ...extensionCategories,
                ...contents.slice(myBlocksIdx + 1),
            ];
        };

        if (editorMode === 'stage') {

            // Always strip the built-in Pen category — extensions inject their own
            const filteredContents = animationToolbox.contents.filter((cat: any) => cat.name !== 'Pen');



            if (selectedSpriteId === 'stage') {

                return {

                    ...animationToolbox,

                    contents: withCategoryHeaders(
                        injectExtensions(filteredContents

                            .filter((cat: any) => cat.name !== 'Motion')

                            .map((cat: any) => {

                                let contents = cat.contents;
                                if (!contents) return cat;

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
                        ))

                };

            }

            // Return animation toolbox without Pen category for all intermediate sessions

            return {

                ...animationToolbox,

                contents: withCategoryHeaders(injectExtensions(filteredContents))

            };

        }

        const hardwareToolbox = selectedBoard === 'esp32' ? esp32Toolbox : arduinoToolbox;

        return {
            ...hardwareToolbox,
            contents: withCategoryHeaders(hardwareToolbox.contents)
        };

    }, [editorMode, selectedBoard, selectedSpriteId, installedExtensions]);

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


        // Handle Variable Creation, Renaming, and Deletion
        if (event.type === Blockly.Events.VAR_CREATE) {
            const createEvent = event as any;
            const varName = createEvent.varName || createEvent.json?.name;
            const varType = createEvent.json?.type || '';

            if (varName) {
                if (varType === '' || varType === 'Number' || varType === 'String') {
                    setVariableMonitors(prev => {
                        if (prev.find(m => m.name === varName)) return prev;
                        return [...prev, {
                            id: `var_${Date.now()}`,
                            name: varName,
                            type: 'Number',
                            scope: 'all_sprites' as const,
                            visible: false,
                            value: 0,
                            x: 10, y: 10 + (prev.length * 30)
                        }];
                    });
                } else if (varType === 'list') {
                    setListMonitors(prev => {
                        if (prev.find(m => m.name === varName)) return prev;
                        return [...prev, {
                            id: `list_${Date.now()}`,
                            name: varName,
                            scope: 'all_sprites' as const,
                            visible: true,
                            x: 10, y: 10 + (prev.length * 30),
                            items: [],
                            width: 100, height: 200
                        } as ListMonitorState];
                    });
                } else if (varType === 'table') {
                    setTableMonitors(prev => {
                        if (prev.find(m => m.name === varName)) return prev;
                        return [...prev, {
                            id: `table_${Date.now()}`,
                            name: varName,
                            scope: 'all_sprites' as const,
                            visible: true,
                            x: 10, y: 10 + (prev.length * 30),
                            data: [],
                            rows: 0, cols: 0,
                            width: 250, height: 200
                        } as TableMonitorState];
                    });
                }
                setToolboxUpdateKey(k => k + 1);
            }
        } else if (event.type === Blockly.Events.VAR_RENAME) {
            const renameEvent = event as any;
            const oldName = renameEvent.oldName;
            const newName = renameEvent.newName;

            setVariableMonitors(prev => prev.map(m => m.name === oldName ? { ...m, name: newName } : m));
            setListMonitors(prev => prev.map(m => m.name === oldName ? { ...m, name: newName } : m));
            setTableMonitors(prev => prev.map(m => m.name === oldName ? { ...m, name: newName } : m));
        } else if (event.type === Blockly.Events.VAR_DELETE) {
            const deleteEvent = event as any;
            const deletedName = deleteEvent.varName;

            setVariableMonitors(prev => prev.filter(m => m.name !== deletedName));
            setListMonitors(prev => prev.filter(m => m.name !== deletedName));
            setTableMonitors(prev => prev.filter(m => m.name !== deletedName));
            setToolboxUpdateKey(k => k + 1);
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

                    // Update global compiled scripts for this sprite only
                    setCompiledScripts(prev => {
                        const otherSpritesScripts = prev.filter(s => s.spriteId !== sprite.id);
                        return [...otherSpritesScripts, ...scripts];
                    });

                    // SYNC: Update the Sprite object's internal script registry
                    // This allows the AnimationVM to find scripts even when the sprite is not currently selected.
                    sprite.setScripts(scripts);

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

    }, [editorMode, appMode, sprites, selectedSpriteId, setToolboxUpdateKey]);



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

            case 'motion_move_left': {

                const steps = Math.abs(Number(block.getFieldValue('STEPS')) || 10);

                activeSprite.setX(activeSprite.x - steps);

                break;

            }

            case 'motion_move_up': {

                const steps = Math.abs(Number(block.getFieldValue('STEPS')) || 10);

                activeSprite.setY(activeSprite.y + steps);

                break;

            }

            case 'motion_move_down': {

                const steps = Math.abs(Number(block.getFieldValue('STEPS')) || 10);

                activeSprite.setY(activeSprite.y - steps);

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

            case 'looks_say_for_secs': {
                const message = String(block.getFieldValue('MESSAGE') || 'Hello!');
                const secs = Number(block.getFieldValue('SECS')) || 2;
                addLog(`Preview: Say "${message}" for ${secs} seconds`);
                activeSprite.say(message, secs);
                break;
            }

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

    // Save current workspace blocks to the per-sprite map
    const saveCurrentSpriteWorkspace = useCallback(() => {

        const activeId = activeSpriteIdRef.current;

        if (!workspaceRef.current || !activeId) return;

        const json = Blockly.serialization.workspaces.save(workspaceRef.current);
        spriteWorkspacesRef.current.set(activeId, json);

        console.log('[APP] Saved workspace for sprite:', activeId);
    }, []);

    // ── Block-to-sprite copy helpers ──────────────────────────────────────

    function reassignBlockIds(blockJson: any): any {
        const newId = Blockly.utils.idGenerator.genUid();
        const result: any = { ...blockJson, id: newId };

        if (result.next) {
            if (result.next.block) {
                result.next = { ...result.next, block: reassignBlockIds(result.next.block) };
            }
            if (result.next.shadow) {
                result.next = { ...result.next, shadow: reassignBlockIds(result.next.shadow) };
            }
        }

        if (result.inputs) {
            const newInputs: Record<string, any> = {};
            for (const [name, input] of Object.entries(result.inputs)) {
                const inp = input as any;
                const newInp: any = {};
                if (inp.block) newInp.block = reassignBlockIds(inp.block);
                if (inp.shadow) newInp.shadow = reassignBlockIds(inp.shadow);
                newInputs[name] = { ...inp, ...newInp };
            }
            result.inputs = newInputs;
        }

        return result;
    }

    const handleCopyBlocksToSprite = useCallback((targetSpriteId: string, blocksState: any[]) => {
        if (!targetSpriteId || !blocksState || blocksState.length === 0) return;

        const targetJson = spriteWorkspacesRef.current.get(targetSpriteId);
        const merged: any = targetJson ? JSON.parse(JSON.stringify(targetJson)) : {};

        if (!merged.blocks) {
            merged.blocks = { languageVersion: 0, blocks: [] };
        }
        if (!merged.blocks.blocks) {
            merged.blocks.blocks = [];
        }

        for (const b of blocksState) {
            merged.blocks.blocks.push(reassignBlockIds(b));
        }

        spriteWorkspacesRef.current.set(targetSpriteId, merged);

        if (targetSpriteId === activeSpriteIdRef.current && workspaceRef.current) {
            const json = spriteWorkspacesRef.current.get(targetSpriteId);
            workspaceRef.current.clear();
            if (json && Object.keys(json).length > 0) {
                Blockly.serialization.workspaces.load(json, workspaceRef.current);
            }
        }
    }, []);

    const handleCopyCodeToSprite = useCallback((sourceSpriteId: string, targetSpriteId: string) => {
        if (sourceSpriteId === targetSpriteId) return;

        // If source is the active sprite, force-save its workspace first to capture latest blocks
        if (sourceSpriteId === activeSpriteIdRef.current && workspaceRef.current) {
            const json = Blockly.serialization.workspaces.save(workspaceRef.current);
            spriteWorkspacesRef.current.set(sourceSpriteId, json);
        }

        const sourceJson = spriteWorkspacesRef.current.get(sourceSpriteId);
        if (!sourceJson) return;

        const sourceBlocks = (sourceJson as any)?.blocks?.blocks;
        if (!sourceBlocks || sourceBlocks.length === 0) return;

        handleCopyBlocksToSprite(targetSpriteId, sourceBlocks);
    }, [handleCopyBlocksToSprite]);

    const handleBlockDrag = useCallback((event: any) => {
        if (event.type !== Blockly.Events.BLOCK_DRAG) return;

        if (event.isStart && event.blockId) {
            if (!workspaceRef.current) return;
            const block = workspaceRef.current.getBlockById(event.blockId);
            if (block) {
                const rootBlock = block.getRootBlock();
                draggedBlockStateRef.current = Blockly.serialization.blocks.save(rootBlock);
            }
        } else if (!event.isStart) {
            if (!draggedBlockStateRef.current) return;

            const pos = lastPointerPosRef.current;
            // Use bounding rects to find the sprite under the cursor
            // (elementFromPoint is unreliable because Blockly's drag surface may intercept it)
            const spriteCards = document.querySelectorAll('[data-sprite-id]');
            let targetId: string | null = null;
            for (const card of spriteCards) {
                const rect = card.getBoundingClientRect();
                if (pos.x >= rect.left && pos.x <= rect.right &&
                    pos.y >= rect.top && pos.y <= rect.bottom) {
                    targetId = card.getAttribute('data-sprite-id');
                    break;
                }
            }
            if (targetId && targetId !== activeSpriteIdRef.current) {
                handleCopyBlocksToSprite(targetId, [draggedBlockStateRef.current]);
            }
            draggedBlockStateRef.current = null;
        }
    }, [handleCopyBlocksToSprite]);

    const handleBlockInteraction = useCallback(async (event: Blockly.Events.Abstract) => {

        if (!workspaceRef.current) return;

        if (event.type !== Blockly.Events.CLICK && event.type !== Blockly.Events.BLOCK_CHANGE) return;



        const blockId = (event as any).blockId;

        if (!blockId) return;

        const block = workspaceRef.current.getBlockById(blockId);

        if (!block) return;


        // Animation block interaction on click

        if (event.type === Blockly.Events.CLICK) {
            // Use AnimationVM compiler for leap blocks (supports operators, variables, etc.)
            if (!block.type.startsWith('arduino_')) {
                console.log(`[APP] Running stack with AnimationVM for sprite ${selectedSpriteId}`);
                setIsRunning(true);

                // Ensure the current sprite workspace is saved and all sprite workspaces are loaded
                saveCurrentSpriteWorkspace();
                syncAllWorkspaces(); // Sync everything to the VM so broadcasts work across sprites

                // Update active sprite for window.runtime.pen / window.runtime.sprite
                if (selectedSpriteId) setActiveSpriteId(selectedSpriteId);

                // Compile and execute via AnimationVM for correct operator/variable handling
                const compiler = new AnimationCompiler(selectedSpriteId || '');
                const script = compiler.compileStack(block);
                if (script) {
                    animationVM.runScript(script);
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

            animationVM.triggerFlag();

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

    }, [editorMode, isConnected, saveCurrentSpriteWorkspace, sprites, selectedSpriteId]);



    // ═══════════════════════════════════════════════════════════════════════

    // SPRITE MANAGEMENT HELPERS

    // ═══════════════════════════════════════════════════════════════════════

    // Save current workspace blocks to the per-sprite map



    // Load workspace blocks from the per-sprite map

    const loadSpriteWorkspace = useCallback((spriteId: string) => {
        // ALWAYS update the true owner tracking
        activeSpriteIdRef.current = spriteId;

        // Auto-detect pen tip when switching to a pencil/pen sprite
        const sprite = spriteManager.getSprite(spriteId);
        if (sprite) {
            const sName = sprite.name.toLowerCase();
            if (sName.includes('pencil') || sName.includes('pen')) {
                sprite.autoDetectPenTip();
            }
        }

        if (!workspaceRef.current) {
            console.log('[APP] Workspace unmounted, deferred loading for sprite:', spriteId);
            return;
        }

        const json = spriteWorkspacesRef.current.get(spriteId);
        const ws = workspaceRef.current;
        if (!ws) return;

        isLoadingWorkspaceRef.current = true;
        Blockly.Events.disable();
        console.log('[APP] Switching workspace to:', spriteId);

        try {
            // ALWAYS clear first to prevent blocks from previous target leaking
            workspaceRef.current.clear();

            if (json && Object.keys(json).length > 0) {
                Blockly.serialization.workspaces.load(json, workspaceRef.current);
                console.log('[APP] Successfully loaded workspace for target:', spriteId);
            } else {
                console.log('[APP] Initialized empty workspace for target:', spriteId);
            }

            // Sync global variables found in state to this workspace's variable map
            variableMonitors.forEach(m => {
                const existing = ws.getVariableMap().getAllVariables().find((v: any) => v.name === m.name);
                if (!existing) {
                    ws.getVariableMap().createVariable(m.name, m.type || '');
                }
            });

            listMonitors.forEach(m => {
                const existing = ws.getVariableMap().getAllVariables().find((v: any) => v.name === m.name);
                if (!existing) {
                    ws.getVariableMap().createVariable(m.name, 'list');
                }
            });

            tableMonitors.forEach(m => {
                const existing = ws.getVariableMap().getAllVariables().find((v: any) => v.name === m.name);
                if (!existing) {
                    ws.getVariableMap().createVariable(m.name, 'table');
                }
            });

        } catch (err) {
            console.error('[APP] Error loading workspace JSON:', err);
        } finally {
            Blockly.Events.enable();

            const toolbox = workspaceRef.current.getToolbox() as any;
            if (toolbox?.getSelectedItem?.()) {
                workspaceRef.current.refreshToolboxSelection();
            } else if (toolbox && typeof toolbox.selectItemByPosition === 'function') {
                toolbox.selectItemByPosition(0);
            }

            const flyout = workspaceRef.current.getFlyout() as any;
            if (flyout?.reflowInternal_) flyout.reflowInternal_();

            // Use setTimeout to allow Blockly to process internal events before enabling saving
            setTimeout(() => {
                isLoadingWorkspaceRef.current = false;
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

        if (newMode === 'upload') {

            setWorkspaceTab('blocks');

        }



        addLog(`Switched to ${newMode === 'stage' ? 'Stage' : 'Upload'} Mode`);

    }, [editorMode, addLog, saveCurrentSpriteWorkspace]);



    // Handle workspace tab switching (Blocks, Python, Costumes, etc.)

    const handleWorkspaceTabChange = useCallback((newTab: 'blocks' | 'python' | 'costumes' | 'sounds') => {

        if (newTab === workspaceTab) return;



        // Save blocks if we are moving AWAY from blocks or switching between sprites

        saveCurrentSpriteWorkspace();



        // In leap-like UX, tabs maintain the current selection.

        // Costumes/Sounds tabs will dynamically show content for the selected target.



        setWorkspaceTab(newTab);

        addLog(`Switched to ${newTab} tab`);

    }, [workspaceTab, saveCurrentSpriteWorkspace, addLog, loadSpriteWorkspace]);



    // ═══════════════════════════════════════════════════════════════════════

    // SPRITE MANAGEMENT

    // Handle sprite selection: save old, load new
    const handleSpriteSelect = useCallback((newId: string) => {
        if (newId === selectedSpriteId) {

            // Compile scripts so the sprite has up-to-date scripts
            syncAllWorkspacesRef.current?.();

            // Trigger click event even if already selected (leap behavior)

            animationVM.triggerSpriteClick(newId);
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

    const handleSpriteClick = useCallback((id: string) => {
        if (id !== selectedSpriteId) {
            handleSpriteSelect(id);
        }

        // Update active sprite for window.runtime.pen / window.runtime.sprite
        setActiveSpriteId(id);

        // Compile all scripts so the clicked sprite has up-to-date scripts
        syncAllWorkspacesRef.current?.();

        // Trigger click event in the animation VM.
        animationVM.triggerSpriteClick(id);
    }, [selectedSpriteId, handleSpriteSelect]);

    // Map sprite tags/category/name to an appropriate default sound
    const getDefaultSoundForSprite = useCallback((tags?: string[], name?: string): { name: string; src: string } => {
        const t = (tags || []).map(s => s.toLowerCase());
        const n = (name || '').toLowerCase();

        // Animals
        if (t.includes('cat') || n.includes('cat')) return { name: 'Meow', src: 'assets/sounds/83c36d806dc92327b9e7049a565c6bff.wav' };
        if (t.includes('dog') || n.includes('dog')) return { name: 'Bark', src: 'assets/sounds/cd8fa8390b0efdd281882533fbfcfcfb.wav' };
        if (t.includes('bird') || n.includes('bird') || n.includes('parrot') || n.includes('toucan') || n.includes('duck')) return { name: 'Chirp', src: 'assets/sounds/3b8236bbb288019d93ae38362e865972.wav' };
        if (t.includes('animals') || t.includes('animal')) return { name: 'Pop', src: 'assets/sounds/83a9787d4cb6f3b7632b4ddfebf74367.wav' };

        // People/Dance/Fantasy
        if (t.includes('people') || t.includes('person') || t.includes('dance') || t.includes('dancing')) return { name: 'Pop', src: 'assets/sounds/83a9787d4cb6f3b7632b4ddfebf74367.wav' };

        // Sports
        if (t.includes('sports') || t.includes('sport')) return { name: 'Boing', src: 'assets/sounds/53a3c2e27d1fb5fdb14aaf0cb41e7889.wav' };

        // Built-in sprite types
        if (n.includes('robot')) return { name: 'Meow', src: 'assets/sounds/meow.wav' };

        // Default: Pop
        return { name: 'Pop', src: 'assets/sounds/83a9787d4cb6f3b7632b4ddfebf74367.wav' };
    }, []);

    const addSprite = useCallback((spriteType: SpriteType = 'cat') => {

        // Save current sprite's workspace before switching

        saveCurrentSpriteWorkspace();



        const id = `sprite_${Date.now()}`;

        const typeNames: Record<SpriteType, string> = { cat: 'Cat', ball: 'Ball', arrow: 'Arrow', robot: 'Robot' };

        const name = `${typeNames[spriteType]} ${sprites.filter(s => s.spriteType === spriteType).length + 1}`;

        const newSprite = new Sprite(id, name, triggerUpdate, spriteType);



        // Set unique position in leap coords (-240..240, -180..180)

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

        // Add a default sound based on sprite type
        const defaultSound = getDefaultSoundForSprite([], name);
        newSprite.addSound(defaultSound.name, defaultSound.src);

        // 1. Explicitly initialize an empty workspace for the new sprite in our map

        spriteWorkspacesRef.current.set(id, {});



        // 2. Clear the actual Blockly workspace on screen (SILENTLY)

        if (workspaceRef.current) {

            isLoadingWorkspaceRef.current = true;
            Blockly.Events.disable();
            console.log('[APP] Initializing empty workspace for new sprite:', id);

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

        const relativePath = imagePath.split('assets/')[1];

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
            console.log('[APP] Clearing workspace for new project');

            workspaceRef.current.clear();

            Blockly.Events.enable();

            setTimeout(() => {

                isLoadingWorkspaceRef.current = false;

            }, 50);

        }

        // Clear all monitor states (prevents stale variables from previous project)
        setVariableMonitors([]);
        setListMonitors([]);
        setTableMonitors([]);
        setCompiledScripts([]);
        setIsRunning(false);

        // Reset AnimationVM state (variables, lists, tables, answer, timer)
        animationVM.resetState();

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

        robotSprite.setX(0); // Center of leap-like stage

        robotSprite.setY(0);

        spriteWorkspacesRef.current.set(robotId, {}); // Initialize empty workspace for robot



        // Load robot costumes

        const loadAssets = async () => {

            await robotSprite.addCostume('idle', 'assets/sprites/robot/robot_idle.svg');

            await robotSprite.addCostume('wave 1', 'assets/sprites/robot/image-removebg-preview (1).png');

            await robotSprite.addCostume('wave 2', 'assets/sprites/robot/image-Photoroom.png');

            await robotSprite.addCostume('talk', 'assets/sprites/robot/image-removebg-preview.png');

            await robotSprite.addSound('Meow', 'assets/sounds/meow.wav');



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

            volume: s.volume,

            soundEffects: { ...s.soundEffects },

            sounds: (s.id === 'stage' ? stageManager.getAllSounds() : s.sounds).map(sound => ({

                name: sound.name,

                src: sound.src

            })),

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
            backdrops: stageManager.getAllBackdrops().map(b => ({
                name: b.name,
                src: b.src
            })),
            currentBackdropIndex: stageManager.getCurrentBackdropIndex(),
            broadcasts: animationVM.getBroadcastMessages(),
            monitors: {
                variables: variableMonitors,
                lists: listMonitors,
                tables: tableMonitors
            }
        };



        fileService.saveProject(projectName, 'intermediate', payload);

        addLog(`Project saved: ${projectName}`);

    }, [projectName, sprites, variableMonitors, listMonitors, tableMonitors, addLog]);



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
                stageManager.clearSounds();
                stageManager.clearBackdrops();

                for (const sData of data.sprites) {

                    const s = new Sprite(sData.id, sData.name, triggerUpdate, sData.spriteType || 'cat');

                    s.setX(sData.x);

                    s.setY(sData.y);

                    s.pointInDirection(sData.direction);

                    s.setSize(sData.size);

                    if (sData.visible) s.show(); else s.hide();

                    if (typeof sData.volume === 'number') {
                        s.setVolume(sData.volume);
                    }

                    if (sData.soundEffects) {
                        if (typeof sData.soundEffects.pitch === 'number') {
                            s.setSoundEffect('pitch', sData.soundEffects.pitch);
                        }
                        if (typeof sData.soundEffects.pan === 'number') {
                            s.setSoundEffect('pan', sData.soundEffects.pan);
                        }
                    }



                    for (const cData of sData.costumes) {

                        await s.addCostume(cData.name, cData.src);

                    }

                    if (Array.isArray(sData.sounds)) {
                        if (sData.id === 'stage') {
                            for (const soundData of sData.sounds) {
                                await stageManager.addSound(soundData.name, soundData.src);
                            }
                        } else {
                            for (const soundData of sData.sounds) {
                                await s.addSound(soundData.name, soundData.src);
                            }
                        }
                    }

                    newSprites.push(s);

                    animationVM.registerSprite(s);

                }



                // 3. Restore backdrops from saved data

                if (Array.isArray(data.backdrops)) {
                    for (const bData of data.backdrops) {
                        await stageManager.addBackdrop(bData.name, bData.src);
                    }
                    if (typeof data.currentBackdropIndex === 'number' && data.currentBackdropIndex >= 0) {
                        stageManager.setBackdrop(data.currentBackdropIndex);
                    }
                }

                // 4. Restore broadcast messages from saved data

                if (Array.isArray(data.broadcasts)) {
                    for (const msg of data.broadcasts) {
                        animationVM.registerBroadcast(msg);
                    }
                }

                // 5. Restore All Workspaces to the Map FIRST

                Object.keys(data.workspaces).forEach(id => {

                    spriteWorkspacesRef.current.set(id, data.workspaces[id]);

                });



                // 6. Update UI state (triggers re-render)
                if (data.monitors) {
                    setVariableMonitors((data.monitors.variables || []).map((monitor: VariableMonitorState, index: number) => normalizeVariableMonitor(monitor, index)));
                    setListMonitors(data.monitors.lists || []);
                    setTableMonitors(data.monitors.tables || []);
                } else {
                    setVariableMonitors([]);
                    setListMonitors([]);
                    setTableMonitors([]);
                }

                setSprites(newSprites);

                const initialTarget = newSprites.find(s => s.id !== 'stage' && !s.id.includes('_clone_'))
                    || newSprites.find(s => s.id !== 'stage')
                    || newSprites[0]
                    || null;
                const initialId = initialTarget ? initialTarget.id : null;

                activeSpriteIdRef.current = initialId;
                setSelectedSpriteId(initialId);
                if (initialId) {
                    setActiveSpriteId(initialId);
                }



                // 7. Final attempt to load the workspace for the selected sprite

                if (initialId) {

                    let attempts = 0;

                    const tryLoad = () => {

                        if (workspaceRef.current) {

                            loadSpriteWorkspace(initialId);
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

    const syncAllWorkspaces = useCallback(() => {
        log.app('Syncing all entities (Sprites + Stage) for global events');
        let allScripts: CompiledScript[] = [];
        const stageScripts: CompiledScript[] = [];

        const allLiveSprites = spriteManager.getAllSprites();
        // Ensure the stage is included in the sync even if it's not in the main sprites list
        // (though it usually is, explicitly checking ensures no scripts are lost)
        if (!allLiveSprites.some(s => s.id === 'stage')) {
            const stage = spriteManager.getSprite('stage');
            if (stage) allLiveSprites.push(stage);
        }

        console.log(`[APP] SyncAllWorkspaces: Syncing ${allLiveSprites.length} entities for global event readiness.`);
        for (const s of allLiveSprites) {
            let savedJson = spriteWorkspacesRef.current.get(s.id);
            if (s.id === selectedSpriteId && workspaceRef.current) {
                savedJson = Blockly.serialization.workspaces.save(workspaceRef.current);
            }

            if (!savedJson || Object.keys(savedJson).length === 0) continue;

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
                    Blockly.serialization.workspaces.load(savedJson, tempWs);
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
                if (tempWs) { try { (tempWs as any).dispose(); } catch (_) { } }
            }
        }

        animationVM.stageScripts = stageScripts;

        // Also update the VM's internal script cache to ensure broadcasts work immediately
        animationVM.setScripts(allScripts);

        return allScripts;
    }, [selectedSpriteId]);

    // Keep ref in sync so earlier-declared callbacks can call syncAllWorkspaces
    syncAllWorkspacesRef.current = syncAllWorkspaces;

    useEffect(() => {
        animationVM.onBeforeBroadcast = (message) => {
            console.log(`[APP] Intercepted broadcast "${message}" - Triggering global synchronization.`);
            syncAllWorkspaces();
        };

        // Bridge leapRuntime broadcasts to AnimationVM for global reach
        (leapRuntime as any)._onBroadcast = (message: string) => {
            console.log(`[APP] leapRuntime broadcast "${message}" -> Bridging to AnimationVM`);
            animationVM.triggerBroadcast(message);
        };
        (leapRuntime as any)._onBroadcastAndWait = async (message: string) => {
            console.log(`[APP] leapRuntime broadcast_wait "${message}" -> Bridging to AnimationVM`);
            await animationVM.triggerBroadcastAndWait(message);
        };

        return () => {
            animationVM.onBeforeBroadcast = undefined;
            (leapRuntime as any)._onBroadcast = undefined;
            (leapRuntime as any)._onBroadcastAndWait = undefined;
        };
    }, [syncAllWorkspaces]);

    // ═══════════════════════════════════════════════════════════════════════
    // ANIMATION CONTROLS
    // ═══════════════════════════════════════════════════════════════════════
    const handleRunClick = useCallback(() => {
        console.log('[APP] Run button clicked - MULTI-SPRITE MODE');
        addLog('Green flag clicked');
        animationVM.stopAll();
        leapRuntime.stopAll();

        // Expose camera toggle so fd_camera/bd_camera blocks can turn camera on/off
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
                // Load workspace data into leapRuntime for broadcast bridging only
                leapRuntime.loadProject(spriteWorkspacesRef.current);
                // Set the active sprite for window.runtime.pen / window.runtime.sprite
                if (selectedSpriteId) setActiveSpriteId(selectedSpriteId);
                // Only trigger AnimationVM - it has the proper compiler that handles
                // operators, variables, and all block types correctly.
                // leapRuntime.triggerFlag() is NOT called because it uses an incomplete
                // interpreter that doesn't handle math_number/arduino_number shadows,
                // causing all numeric inputs to resolve to 0. It also writes to a
                // separate variableStore, creating race conditions with the AnimationVM.
                animationVM.triggerFlag();
                addLog(`Started animation`);
            }
        } catch (e) {
            console.error(`[APP] Error during multi-sprite compilation:`, e);
        }
    }, [addLog, syncAllWorkspaces, selectedSpriteId]);





    const handleStopClick = useCallback(() => {
        setIsRunning(false);
        leapRuntime.stopAll();
        animationVM.stopAll();

        // Cancel any pending ask prompt
        setAskState(prev => {
            if (prev.resolve) prev.resolve('');
            return { isAsking: false, question: '', resolve: null };
        });



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
            let portList: any[] = [];
            const electronAPI = (window as any).electronAPI;
            if (electronAPI?.getPorts) {
                portList = await electronAPI.getPorts();
                setPorts(portList);
            } else {
                // Mock port for web demo
                portList = [{ path: 'WEB_DEMO', manufacturer: 'LeapBlocks Web' }];
                setPorts(portList);
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
                const electronAPI = (window as any).electronAPI;
                if (electronAPI?.getPorts) {
                    electronAPI.getPorts().then((portList: any[]) => {
                        setPorts(portList);
                    }).catch(() => { });
                }
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
                handleConnect(); // Toggle off
                setTimeout(() => {
                    handleConnect(); // Toggle back on with new baud
                }, 500);
            }, 100);
            return () => clearTimeout(timer);
        }
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

        if (isConnected) {
            const electronAPI = (window as any).electronAPI;
            if (electronAPI?.disconnectPort) {
                const result = await electronAPI.disconnectPort();
                if (result.success) {
                    setIsConnected(false);
                    addLog(`Disconnected from ${selectedPort}`);
                }
            } else {
                setIsConnected(false);
                addLog(`Disconnected from ${selectedPort}`);
            }
        }

        try {
            const electronAPI = (window as any).electronAPI;
            if (electronAPI?.connectPort) {
                const result = await electronAPI.connectPort(selectedPort, baudRate, selectedBoard);
                if (result.success) {
                    setIsConnected(true);
                    addLog(`Connected to ${selectedPort} at ${baudRate} baud`);
                } else {
                    addLog(`Connection failed: ${result.error}`);
                }
            } else if (selectedPort === 'WEB_DEMO') {
                setIsConnected(true);
                addLog('Connected to LeapBlocks Web (Simulation Mode)');
            } else {
                addLog('Serial connection requires LeapBlocks Desktop');
            }
        } catch (err) {
            addLog('Connection error occurred');
            console.error(err);
        }
    }, [selectedPort, isConnected, baudRate, selectedBoard, addLog]);

    const handleSendSerial = useCallback(async (data: string) => {
        if (!isConnected) return;
        try {
            const electronAPI = (window as any).electronAPI;
            if (electronAPI?.sendSerial) {
                await electronAPI.sendSerial(data);
                setSerialMessages(prev => [...prev.slice(-100), `> ${data.trim()}`]);
            } else if (selectedPort === 'WEB_DEMO') {
                setSerialMessages(prev => [...prev.slice(-100), `> ${data.trim()}`]);
            }
        } catch (e) {
            addLog('Failed to send');
        }
    }, [isConnected, selectedPort, addLog]);

    const handleUpload = useCallback(async () => {
        if (!generatedCode || isUploading) return;

        if (!selectedPort) {
            addLog('No port selected!');
            alert('⚠️ No port selected!\n\nPlease connect your board and select a COM port.');
            return;
        }

        // Auto-disconnect if serial is connected
        const electronAPI = (window as any).electronAPI;
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

            'esp32': 'esp32:esp32:esp32c3', // ESP32 boards now use ESP32-C3 RISC-V simulation

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

            // leap coords: (0,0) is center of stage

            defaultSprite.setX(0);

            defaultSprite.setY(0);

            spriteWorkspacesRef.current.set('sprite_default', {}); // Initialize empty workspace for robot



            // Add robot costumes

            const loadAssets = async () => {

                console.log('[APP] Loading assets for robot...');

                await defaultSprite.addCostume('idle', 'assets/sprites/robot/robot_idle.svg');

                await defaultSprite.addCostume('wave 1', 'assets/sprites/robot/image-removebg-preview (1).png');

                await defaultSprite.addCostume('wave 2', 'assets/sprites/robot/image-Photoroom.png');

                await defaultSprite.addCostume('talk', 'assets/sprites/robot/image-removebg-preview.png');



                // Add default sound

                await defaultSprite.addSound('Meow', 'assets/sounds/meow.wav');

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

            if (activeId === 'stage') {
                return stageManager.getAllSounds().map((s: any) => s.name);
            }

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

        (window as any).getBroadcastMessages = () => {
            return animationVM.getBroadcastMessages();
        };

        // ── Pen tip calibration helpers (accessible from browser console) ──
        // Usage: window.setPenTip(nx, ny)  e.g. window.setPenTip(-0.3, 0.45)
        // Usage: window.autoDetectPenTip()
        (window as any).setPenTip = (nx: number, ny: number) => {
            const id = activeSpriteIdRef.current;
            if (!id) { console.warn('[PenTip] No active sprite'); return; }
            const sprite = spriteManager.getSprite(id);
            if (!sprite) { console.warn('[PenTip] Sprite not found:', id); return; }
            sprite.setPenTipOffset(nx, ny);
            console.log(`[PenTip] Set tip offset for "${sprite.name}" to (${nx}, ${ny})`);
        };
        (window as any).autoDetectPenTip = () => {
            const id = activeSpriteIdRef.current;
            if (!id) { console.warn('[PenTip] No active sprite'); return; }
            const sprite = spriteManager.getSprite(id);
            if (!sprite) { console.warn('[PenTip] Sprite not found:', id); return; }
            sprite.autoDetectPenTip();
        };
        // Expose spriteManager for fd_count/fd_guess_emotion generators
        (window as any).spriteManager = spriteManager;

        (window as any).createNewBroadcast = (callback: (name: string | null) => void) => {
            const existing = document.querySelector('body>div[data-broadcast-prompt]');
            if (existing) return;

            const overlay = document.createElement('div');
            overlay.setAttribute('data-broadcast-prompt', '');
            overlay.setAttribute('style', 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);');

            const box = document.createElement('div');
            box.setAttribute('style', 'background:#fff;border-radius:12px;padding:24px;min-width:320px;box-shadow:0 8px 32px rgba(0,0,0,0.25);font-family:sans-serif;');

            const label = document.createElement('div');
            label.textContent = 'New message name:';
            label.setAttribute('style', 'font-size:14px;font-weight:600;margin-bottom:12px;color:#333;');

            const input = document.createElement('input');
            input.type = 'text';
            input.autofocus = true;
            input.setAttribute('style', 'width:100%;padding:10px 12px;font-size:14px;border:2px solid #ddd;border-radius:8px;outline:none;box-sizing:border-box;');
            input.addEventListener('focus', () => input.style.borderColor = '#FFBF00');
            input.addEventListener('blur', () => input.style.borderColor = '#ddd');

            const btnRow = document.createElement('div');
            btnRow.setAttribute('style', 'display:flex;justify-content:flex-end;gap:8px;margin-top:16px;');

            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancel';
            cancelBtn.setAttribute('style', 'padding:8px 16px;font-size:14px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;');

            const okBtn = document.createElement('button');
            okBtn.textContent = 'OK';
            okBtn.setAttribute('style', 'padding:8px 16px;font-size:14px;border:none;border-radius:8px;background:#FFBF00;color:#fff;cursor:pointer;font-weight:600;');

            const cleanup = (result: string | null) => {
                document.body.removeChild(overlay);
                if (result) {
                    animationVM.registerBroadcast(result);
                }
                callback(result);
            };

            cancelBtn.addEventListener('click', () => cleanup(null));
            okBtn.addEventListener('click', () => cleanup(input.value || null));
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') okBtn.click();
                if (e.key === 'Escape') cancelBtn.click();
            });

            btnRow.appendChild(cancelBtn);
            btnRow.appendChild(okBtn);
            box.appendChild(label);
            box.appendChild(input);
            box.appendChild(btnRow);
            overlay.appendChild(box);
            document.body.appendChild(overlay);

            setTimeout(() => input.focus(), 50);
        };

        // Expose all sprite names for sensing_touching dropdown
        (window as any).getAllSpriteNames = () => {
            const allSprites = spriteManager.getAllSprites();
            const activeId = activeSpriteIdRef.current;
            // Return names of all non-clone sprites, excluding the active one
            const names: string[] = [];
            const seen = new Set<string>();
            for (const sprite of allSprites) {
                // Skip clones (they have '_clone_' in their ID) and the active sprite
                if (!sprite.id.includes('_clone_') && sprite.id !== activeId && !seen.has(sprite.name)) {
                    names.push(sprite.name);
                    seen.add(sprite.name);
                }
            }
            return names;
        };

        return () => {
            delete (window as any).getActiveSpriteSounds;

            delete (window as any).getActiveSpriteCostumes;

            delete (window as any).getActiveStageBackdrops;

            delete (window as any).getAllSpriteNames;

            delete (window as any).onToggleVisibility;

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



        // Monitor callbacks (unified for both VMs)
        const commonCallbacks = {
            onShowVariable: handleShowVariable,
            onHideVariable: handleHideVariable,
            onShowList: handleShowList,
            onHideList: handleHideList,
            onShowTable: handleShowTable,
            onHideTable: handleHideTable,
            onLog: addLog
        };

        Object.assign(animationVM, commonCallbacks);
        Object.assign(leapRuntime, commonCallbacks);

        // --- VM CHANGE CALLBACKS (Real-time Sync) ---
        animationVM.onVariableChange = (name, value) => {
            setVariableMonitors(prev => prev.map(m => m.name === name ? { ...m, value } : m));
        };
        animationVM.onListChange = (name, items) => {
            setListMonitors(prev => prev.map(m => m.name === name ? { ...m, items, value: items } : m));
        };
        animationVM.onTableChange = (name, data) => {
            setTableMonitors(prev => prev.map(m => m.name === name ? { ...m, data, value: data } : m));
        };

        // --- SENSING SYNC ---
        const sensingSyncInterval = setInterval(() => {
            if (isRunning) {
                setSensingMonitors(prev => prev.map(m => {
                    if (m.name === 'timer') return { ...m, value: Math.round(animationVM.getTimer() * 10) / 10 };
                    if (m.name === 'answer') return { ...m, value: animationVM.getAnswer() };
                    if (m.name === 'loudness') return { ...m, value: animationVM.getLoudness() || 0 };
                    return m;
                }));
            }
        }, 100);

        // --- BLOCKLY VISIBILITY CALLBACKS ---
        // We use refs here to avoid stale closures in the window functions
        // since this useEffect only runs once for VM/Runtime setup.
        const monitorsRef = {
            variable: variableMonitors,
            list: listMonitors,
            table: tableMonitors
        };

        (window as any).getVariableVisibility = (name: string, type: string) => {
            const currentMonitors = (window as any)._monitors_for_sync?.[type] || [];
            const monitor = currentMonitors.find((m: any) => m.name === name);
            return monitor ? monitor.visible : false;
        };

        (window as any).onToggleVisibility = (name: string, type: string, forceVisible?: boolean) => {
            const setFn = type === 'variable' ? setVariableMonitors : (type === 'list' ? setListMonitors : (type === 'table' ? setTableMonitors : setSensingMonitors));

            setFn((prev: any[]) => {
                const existing = prev.find(m => m.name === name);
                const newVisible = forceVisible !== undefined ? forceVisible : (existing ? !existing.visible : true);

                if (existing) {
                    return prev.map(m => m.name === name ? { ...m, visible: newVisible } : m);
                } else if (type !== 'sensing') {
                    // Create new with defaults
                    const newY = 10 + (prev.length * 30);
                    if (type === 'variable') {
                        return [...prev, normalizeVariableMonitor({
                            id: `var_${Date.now()}`,
                            name,
                            type: 'Number',
                            scope: 'all_sprites',
                            visible: true,
                            x: 10, y: newY,
                            value: animationVM.hasVariable(name) ? animationVM.getVariable(name) : 0
                        }, prev.length)];
                    } else if (type === 'list') {
                        return [...prev, {
                            id: `list_${Date.now()}`,
                            name,
                            scope: 'all_sprites',
                            visible: true,
                            x: 10, y: newY,
                            items: [...animationVM.getList(name)],
                            value: [...animationVM.getList(name)],
                            width: 100,
                            height: 200
                        }];
                    } else if (type === 'table') {
                        return [...prev, {
                            id: `table_${Date.now()}`,
                            name,
                            scope: 'all_sprites',
                            visible: true,
                            x: 10, y: newY,
                            rows: animationVM.getTableCount(name, 'row'),
                            cols: animationVM.getTableCount(name, 'column'),
                            data: [...animationVM.getTable(name)],
                            value: [...animationVM.getTable(name)],
                            width: 250,
                            height: 200
                        }];
                    }
                }
                return prev;
            });
        };



        return () => {

            console.log('[IntermediateApp] Cleaning up workspace...');

            animationVM.resetState();
            stageManager.reset();
            spriteManager.clear();
            hardwareAdapter.stopAllPolling();

            if (window.electronAPI?.removeAllListeners) {

                window.electronAPI.removeAllListeners();

            }

            try {
                if ((Blockly as any).WidgetDiv) {
                    (Blockly as any).WidgetDiv.hide();
                }
            } catch (_) { }

            try {
                if ((Blockly as any).DropDownDiv) {
                    (Blockly as any).DropDownDiv.hideWithoutAnimation();
                }
            } catch (_) { }

            const wsToDispose = workspaceRef.current;

            if (wsToDispose) {

                wsToDispose.dispose();

                workspaceRef.current = null;

            }

            try {
                const allWorkspaces: any[] = (Blockly as any).Workspace?.getAllWorkspaces?.();
                if (allWorkspaces && allWorkspaces.length > 0) {
                    allWorkspaces.forEach((ws: any) => {
                        if (ws && ws !== wsToDispose && ws !== workspaceRef.current && typeof ws.dispose === 'function') {
                            try { ws.dispose(); } catch (_) { }
                        }
                    });
                }
            } catch (_) { }

        };

        // eslint-disable-next-line react-hooks/exhaustive-deps

    }, []);





    // Update toolbox and selected category contents when sprite or category structure changes
    // NOTE: variableMonitors/listMonitors/tableMonitors intentionally excluded from deps — 
    // checkbox toggles update internally via Blockly's FieldCheckbox; a full rebuild on 
    // every visibility toggle would cause a cascade through the patched setValue → 
    // onToggleVisibility → setVariableMonitors → rebuild loop.
    // Toolbox is rebuilt only when sprite changes, editor mode switches, or 
    // VAR_CREATE/VAR_DELETE events trigger toolboxUpdateKey.

    useEffect(() => {
        if (!workspaceRef.current || appMode !== 'blocks') {
            return;
        }
        if (isRebuildingToolboxRef.current) return;
        isRebuildingToolboxRef.current = true;

        const nextToolboxConfig = getCurrentToolbox();
        const nextToolboxJson = JSON.stringify(nextToolboxConfig);
        const currentToolbox = workspaceRef.current.getToolbox() as any;
        const selectedCategoryName = typeof currentToolbox?.getSelectedItem?.()?.getName === 'function'
            ? currentToolbox.getSelectedItem().getName()
            : null;

        if (nextToolboxJson !== lastToolboxJsonRef.current) {
            console.log('[APP] Updating toolbox dynamically (Sprite:', selectedSpriteId, ')');

            workspaceRef.current.updateToolbox(nextToolboxConfig);
            lastToolboxJsonRef.current = nextToolboxJson;

            const refreshedToolbox = workspaceRef.current.getToolbox() as any;
            const toolboxItems = typeof refreshedToolbox?.getToolboxItems === 'function'
                ? refreshedToolbox.getToolboxItems().filter((item: any) => typeof item?.getName === 'function')
                : [];

            if (selectedCategoryName) {
                const matchingItem = toolboxItems.find((item: any) => item.getName() === selectedCategoryName);
                if (matchingItem && typeof refreshedToolbox?.setSelectedItem === 'function') {
                    refreshedToolbox.setSelectedItem(matchingItem);
                }
            }

            if (!refreshedToolbox?.getSelectedItem?.() && typeof refreshedToolbox?.selectItemByPosition === 'function') {
                refreshedToolbox.selectItemByPosition(0);
            } else {
                workspaceRef.current.refreshToolboxSelection();
            }

            const flyout = workspaceRef.current.getFlyout() as any;
            if (flyout?.reflowInternal_) flyout.reflowInternal_();
        }

        setTimeout(() => { isRebuildingToolboxRef.current = false; }, 0);
    }, [selectedSpriteId, editorMode, appMode, getCurrentToolbox, toolboxUpdateKey]);



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
                        renderer: 'leap',
                        toolbox: getCurrentToolbox(),
                        media: BLOCKLY_MEDIA_PATH,
                        comments: true,


                        grid: { spacing: 20, length: 3, colour: '#e8e8e8', snap: true },

                        zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },

                        trashcan: true,

                        sounds: false,

                        theme: Blockly.Theme.defineTheme('leapblocks', {

                            name: 'leapblocks',

                            base: Blockly.Themes.Classic,

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
                    (blocksWorkspace as any)[LEAP_CUSTOM_BLOCK_CONTEXT_MENU_FLAG] = true;

                    // Ensure workspace SVG is sized correctly even if inject ran before layout settled
                    Blockly.svgResize(blocksWorkspace);

                    // 1. BLOCK REPLACEMENT LISTENER
                    // Auto-replace checkbox-reporters from flyout with standard reporters in workspace
                    blocksWorkspace.addChangeListener((event: any) => {
                        if ((event.type === Blockly.Events.BLOCK_CREATE || event.type === Blockly.Events.BLOCK_MOVE) && !isLoadingWorkspaceRef.current) {
                            const blockId = event.type === Blockly.Events.BLOCK_CREATE ? event.blockId : event.id;
                            const block = blocksWorkspace.getBlockById(blockId);

                            if (block && (block.type === 'variable_reporter_checkbox' || block.type === 'list_reporter_checkbox' || block.type === 'sensing_reporter_checkbox')) {
                                // IMPORTANT: Do not replace while dragging or it breaks the gesture
                                if (typeof (blocksWorkspace as any).isDragging === 'function' && (blocksWorkspace as any).isDragging()) return;

                                const isVariable = block.type === 'variable_reporter_checkbox';
                                const isSensing = block.type === 'sensing_reporter_checkbox';
                                const nameField = isVariable ? 'VARIABLE' : (isSensing ? 'VARIABLE' : 'LIST');
                                const name = block.getFieldValue(nameField);

                                // Determine type (Variable, List, Table, or Sensing)
                                let newType = isVariable ? 'data_variable' : (isSensing ? `sensing_${name}` : 'data_listcontents');
                                let varType: string = isVariable ? '' : (isSensing ? 'sensing' : 'list');

                                if (block.type === 'list_reporter_checkbox') {
                                    // Check if this is actually a table (they share the same checkbox block type)
                                    const variable = blocksWorkspace.getVariable(name, 'table');
                                    if (variable) {
                                        newType = 'data_tablecontents';
                                        varType = 'table';
                                    }
                                }

                                // Record position and parent connection before disposal
                                const xy = block.getRelativeToSurfaceXY();
                                // Save the parent input connection so we can reconnect the replacement block
                                const parentConnection = block.outputConnection?.targetConnection || null;

                                // New block logic - resolve the real variable ID
                                // We use setTimeout to ensure we don't interfere with the current event loop/gesture
                                setTimeout(() => {
                                    if (!blocksWorkspace.getBlockById(blockId)) return; // Already gone

                                    Blockly.Events.disable();
                                    try {
                                        block.dispose(false);
                                        const newBlock = blocksWorkspace.newBlock(newType);

                                        if (!isSensing) {
                                            // Find real variable ID for the name
                                            // Try all variable types since variables may be created with 'Number', 'String', or ''
                                            const variable = blocksWorkspace.getVariable(name, varType)
                                                || blocksWorkspace.getVariable(name, 'Number')
                                                || blocksWorkspace.getVariable(name, 'String')
                                                || blocksWorkspace.getVariable(name, '');
                                            const valueToSet = variable ? variable.getId() : name;
                                            newBlock.setFieldValue(valueToSet, nameField);
                                        }

                                        newBlock.initSvg();
                                        newBlock.render();

                                        // Reconnect to parent input if the old block was connected
                                        if (parentConnection && newBlock.outputConnection) {
                                            try {
                                                parentConnection.connect(newBlock.outputConnection);
                                            } catch (connectErr) {
                                                // If reconnection fails, fall back to positioning
                                                console.warn('[BlockReplace] Could not reconnect to parent:', connectErr);
                                                newBlock.moveBy(xy.x, xy.y);
                                            }
                                        } else {
                                            newBlock.moveBy(xy.x, xy.y);
                                        }
                                        newBlock.select();
                                    } finally {
                                        Blockly.Events.enable();
                                    }
                                }, 0);
                            }
                        }
                    });

                    lastToolboxJsonRef.current = JSON.stringify(getCurrentToolbox());

                    // Initialize custom blocks and field overrides only once globally
                    if (!blocksInitialized) {
                        // 1. Define custom blocks for reporter checkboxes
                        Blockly.common.defineBlocksWithJsonArray([
                            {
                                "type": "variable_reporter_checkbox",
                                "message0": "%1 %2",
                                "args0": [
                                    { "type": "field_checkbox", "name": "CHECK", "checked": false },
                                    { "type": "field_input", "name": "VARIABLE", "text": "variable", "enabled": false }
                                ],
                                "output": "Number",
                                "colour": "#FF8C1A",
                                "tooltip": "Toggle variable visibility",
                                "web-class": "variable-checkbox-container"
                            },
                            {
                                "type": "list_reporter_checkbox",
                                "message0": "%1 %2",
                                "args0": [
                                    { "type": "field_checkbox", "name": "CHECK", "checked": false },
                                    { "type": "field_input", "name": "LIST", "text": "list", "enabled": false }
                                ],
                                "output": "String",
                                "colour": "#FF8C1A",
                                "tooltip": "Toggle list visibility",
                                "web-class": "list-checkbox-container"
                            },
                            {
                                "type": "sensing_reporter_checkbox",
                                "message0": "%1 %2",
                                "args0": [
                                    { "type": "field_checkbox", "name": "CHECK", "checked": false },
                                    { "type": "field_input", "name": "VARIABLE", "text": "variable", "enabled": false }
                                ],
                                "output": "String",
                                "colour": "#5CB1D6",
                                "tooltip": "Toggle sensing monitor visibility",
                                "web-class": "sensing-checkbox-container"
                            }
                        ]);

                        // 2. Define custom generators for the reporter blocks
                        const javascriptGenerator = (Blockly as any).javascriptGenerator || (Blockly as any).JavaScript;
                        if (javascriptGenerator) {
                            javascriptGenerator['variable_reporter_checkbox'] = (block: any) => {
                                const varName = block.getFieldValue('VARIABLE');
                                return [varName, (Blockly as any).javascriptGenerator.ORDER_ATOMIC];
                            };
                            javascriptGenerator['list_reporter_checkbox'] = (block: any) => {
                                const listName = block.getFieldValue('LIST');
                                return [listName, (Blockly as any).javascriptGenerator.ORDER_ATOMIC];
                            };
                            javascriptGenerator['sensing_reporter_checkbox'] = (block: any) => {
                                const varName = block.getFieldValue('VARIABLE');
                                return [varName, (Blockly as any).javascriptGenerator.ORDER_ATOMIC];
                            };
                        }

                        // 4. Hook FieldCheckbox to toggle visibility
                        // We capture the original setValue only once to avoid recursive wrapping
                        if (!originalCheckboxSetValue) {
                            originalCheckboxSetValue = Blockly.FieldCheckbox.prototype.setValue;
                            Blockly.FieldCheckbox.prototype.setValue = function (this: any, newValue: any) {
                                // Call original logic first to ensure the value is updated
                                if (originalCheckboxSetValue) {
                                    originalCheckboxSetValue.call(this, newValue);
                                }

                                const block = this.getSourceBlock();
                                // Performance: Only run logic if we are on a reporter checkbox block and not during disposal
                                if (block && !block.isDisposed() && (block.type === 'variable_reporter_checkbox' || block.type === 'list_reporter_checkbox' || block.type === 'sensing_reporter_checkbox')) {
                                    // GUARD: Only trigger on actual user-initiated events to prevent flickering/loops during toolbox rebuilds
                                    if (isRebuildingToolboxRef.current || !Blockly.Events.isEnabled()) return;

                                    const isSensing = block.type === 'sensing_reporter_checkbox';
                                    const type = isSensing ? 'sensing' : (block.type === 'variable_reporter_checkbox' ? 'variable' : 'list');
                                    const nameField = isSensing ? 'VARIABLE' : (type === 'variable' ? 'VARIABLE' : 'LIST');
                                    const name = block.getFieldValue(nameField);

                                    // Robust check for boolean vs string 'TRUE'
                                    const checked = this.getValue() === 'TRUE' || this.getValue() === true;

                                    if (name) {
                                        // Check if current visibility matches checkbox to avoid loops/stale updates
                                        // Use direct sync monitor check if window helper isn't available
                                        const currentVisible = (window as any).getVariableVisibility ?
                                            (window as any).getVariableVisibility(name, type) :
                                            !!(window as any)._monitors_for_sync?.[type]?.find((m: any) => m.name === name)?.visible;

                                        if (checked !== currentVisible) {
                                            console.log(`[BLOCKLY] Checkbox toggle for ${type} '${name}': ${checked}`);
                                            (window as any).onToggleVisibility?.(name, type, checked);
                                        }
                                    }
                                }
                                return null;
                            };
                        }

                        blocksInitialized = true;
                    }



                    // Keep the flyout pinned open and at a fixed scale so it
                    // does not zoom with the workspace viewport.
                    if (blocksWorkspace) {

                        const flyout = blocksWorkspace.getFlyout() as any;

                        if (flyout) {

                            flyout.autoClose = false;

                            // Lock the flyout scale so blocks inside don't zoom
                            // with the main workspace viewport.
                            const FIXED_FLYOUT_SCALE = 1.0;
                            flyout.getFlyoutScale = () => FIXED_FLYOUT_SCALE;
                            if (flyout.getWorkspace()) {
                                flyout.getWorkspace().setScale(FIXED_FLYOUT_SCALE);
                            }

                            // Reset flyout scale after any viewport change (wheel zoom, pinch, etc.)
                            blocksWorkspace.addChangeListener((event: any) => {
                                if (event.type === Blockly.Events.VIEWPORT_CHANGE) {
                                    const flyoutWs = flyout.getWorkspace();
                                    if (flyoutWs && flyoutWs.getScale() !== FIXED_FLYOUT_SCALE) {
                                        flyoutWs.setScale(FIXED_FLYOUT_SCALE);
                                    }
                                }
                            });

                        }
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

                        // 5. KEEP FLYOUT ALWAYS OPEN
                        // Re-select a toolbox category whenever the flyout gets closed
                        // (e.g. by clicking on the workspace background).
                        blocksWorkspace.addChangeListener((event: any) => {
                            if (event.type === Blockly.Events.TOOLBOX_ITEM_SELECT) {
                                // If the toolbox selection was cleared (flyout closing),
                                // re-select the previously active category.
                                if (!(event as any).newItem) {
                                    const toolbox = blocksWorkspace.getToolbox() as any;
                                    if (toolbox) {
                                        // Re-select old item or default to first
                                        const oldId = (event as any).oldItem;
                                        if (oldId) {
                                            const items = toolbox.getToolboxItems?.() || [];
                                            const prev = items.find((i: any) => i.getId?.() === oldId);
                                            if (prev) {
                                                toolbox.setSelectedItem(prev);
                                                return;
                                            }
                                        }
                                        toolbox.selectItemByPosition(0);
                                    }
                                }
                            }
                        });

                    }






                    // Auto-open toolbox on load/mode switch

                    setTimeout(() => {

                        if (workspaceRef.current) {

                            const toolbox = workspaceRef.current.getToolbox();

                            if (toolbox) {

                                toolbox.selectItemByPosition(0);

                                workspaceRef.current.refreshToolboxSelection();

                                const flyout = workspaceRef.current.getFlyout() as any;
                                if (flyout?.reflowInternal_) flyout.reflowInternal_();

                            }

                        }

                    }, 50);



                    // Register custom variable category callback
                    workspaceRef.current.registerToolboxCategoryCallback('LEAP_VARIABLES', (ws: any) => {
                        const contents: any[] = [];

                        contents.push(createFlyoutCategoryLabel('Variables'));
                        contents.push(createFlyoutSectionLabel('Variables', 'category-subheader-variables'));
                        contents.push({
                            kind: 'button',
                            text: 'Make a Variable',
                            callbackKey: 'CREATE_VARIABLE'
                        });

                        const allVars = ws.getVariableMap().getAllVariables() || [];
                        const scalars = allVars.filter((v: any) => v.type === '' || v.type === 'Number' || v.type === 'String');
                        const lists = allVars.filter((v: any) => v.type === 'list');
                        const tables = allVars.filter((v: any) => v.type === 'table');

                        scalars.sort((a: any, b: any) => a.getName().localeCompare(b.getName()));

                        scalars.forEach((v: any) => {
                            const currentMonitors = (window as any)._monitors_for_sync?.variable || [];
                            const monitor = currentMonitors.find((m: any) => m.name === v.getName());
                            const isVisible = monitor ? monitor.visible : false;

                            contents.push(createMonitorReporterPlaceholder(
                                'variable_reporter_checkbox',
                                'VARIABLE',
                                v.getName(),
                                isVisible
                            ));
                        });

                        // Add variable blocks — use the first variable alphabetically as default
                        if (scalars.length > 0) {
                            const defaultVar = scalars[0];
                            const blockTypes = [
                                'data_setvariableto',
                                'data_changevariableby',
                                'data_showvariable',
                                'data_hidevariable'
                            ];
                            blockTypes.forEach((type) => {
                                const block: any = {
                                    kind: 'block',
                                    type: type,
                                    fields: {
                                        // Pass full variable object so Blockly resolves by ID, not auto-create
                                        'VARIABLE': {
                                            id: defaultVar.getId(),
                                            name: defaultVar.getName(),
                                            type: defaultVar.type || ''
                                        }
                                    }
                                };
                                if (type === 'data_setvariableto' || type === 'data_changevariableby') {
                                    block.inputs = {
                                        'VALUE': {
                                            shadow: {
                                                type: 'arduino_number',
                                                fields: {
                                                    'NUM': type === 'data_changevariableby' ? '1' : '0'
                                                }
                                            }
                                        }
                                    };
                                }
                                contents.push(block);
                            });
                        }

                        contents.push({ kind: 'sep', gap: 20 });
                        contents.push(createFlyoutSectionLabel('Lists', 'category-subheader-lists'));
                        contents.push({
                            kind: 'button',
                            text: 'Make a List',
                            callbackKey: 'CREATE_LIST'
                        });

                        lists.sort((a: any, b: any) => a.getName().localeCompare(b.getName()));
                        lists.forEach((v: any) => {
                            const currentMonitors = (window as any)._monitors_for_sync?.list || [];
                            const monitor = currentMonitors.find((m: any) => m.name === v.getName());
                            const isVisible = monitor ? monitor.visible : false;

                            contents.push(createMonitorReporterPlaceholder(
                                'list_reporter_checkbox',
                                'LIST',
                                v.getName(),
                                isVisible
                            ));
                        });

                        if (lists.length > 0) {
                            const defaultList = lists[0];
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
                            listBlockTypes.forEach(type => {
                                contents.push({
                                    kind: 'block',
                                    type: type,
                                    fields: {
                                        'LIST': {
                                            id: defaultList.getId(),
                                            name: defaultList.getName(),
                                            type: defaultList.type || 'list'
                                        }
                                    }
                                });
                            });
                        }

                        contents.push({ kind: 'sep', gap: 20 });
                        contents.push(createFlyoutSectionLabel('Tables', 'category-subheader-tables'));
                        contents.push({
                            kind: 'button',
                            text: 'Make a Table',
                            callbackKey: 'CREATE_TABLE'
                        });

                        tables.sort((a: any, b: any) => a.getName().localeCompare(b.getName()));
                        tables.forEach((v: any) => {
                            const currentMonitors = (window as any)._monitors_for_sync?.table || [];
                            const monitor = currentMonitors.find((m: any) => m.name === v.getName());
                            const isVisible = monitor ? monitor.visible : false;

                            contents.push(createMonitorReporterPlaceholder(
                                'list_reporter_checkbox',
                                'LIST',
                                v.getName(),
                                isVisible
                            ));
                        });

                        if (tables.length > 0) {
                            const defaultTable = tables[0];
                            const tableBlockTypes = [
                                'data_setintable',
                                'data_addcolumn',
                                'data_deletecolumn',
                                'data_showtable',
                                'data_hidetable',
                                'data_deleterow',
                                'data_cleartable',
                                'data_getvalueattable',
                                'data_gettablecount',
                                'data_gettimestamp',
                                'data_exporttable'
                            ];
                            tableBlockTypes.forEach(type => {
                                contents.push({
                                    kind: 'block',
                                    type: type,
                                    fields: {
                                        'TABLE': {
                                            id: defaultTable.getId(),
                                            name: defaultTable.getName(),
                                            type: defaultTable.type || 'table'
                                        }
                                    }
                                });
                            });
                        }

                        return contents;
                    });



                    // Register button callback for "Make a Variable"

                    // Register LEAP_SENSING custom category callback
                    workspaceRef.current.registerToolboxCategoryCallback('LEAP_SENSING', (ws: any) => {
                        const contents: any[] = [];
                        const isStage = selectedSpriteIdRef.current === 'stage';

                        contents.push({
                            kind: 'label',
                            text: 'Sensing',
                            'web-class': 'category-header'
                        });

                        if (!isStage) {
                            contents.push({ kind: 'block', type: 'sensing_touching' });
                            contents.push({ kind: 'block', type: 'sensing_touching_color' });
                            contents.push({ kind: 'block', type: 'sensing_color_touching_color' });
                            contents.push({ kind: 'block', type: 'sensing_distance_to' });
                            contents.push({ kind: 'sep', gap: 20 });
                        }
                        contents.push({ kind: 'label', text: 'Ask', 'web-class': 'category-subheader' });
                        contents.push({
                            kind: 'block',
                            type: 'sensing_ask',
                            inputs: {
                                QUESTION: {
                                    shadow: { type: 'text', fields: { TEXT: 'What is your name?' } }
                                }
                            }
                        });
                        contents.push({ kind: 'block', type: 'sensing_answer' });

                        const sensingReporters = ['answer', 'loudness'];
                        sensingReporters.forEach(name => {
                            const monitor = sensingMonitorsRef.current.find(m => m.name === name);
                            contents.push(createMonitorReporterPlaceholder(
                                'sensing_reporter_checkbox',
                                'VARIABLE',
                                name,
                                !!monitor?.visible
                            ));
                        });

                        // Add timer block without checkbox
                        contents.push({ kind: 'block', type: 'sensing_timer' });
                        contents.push({ kind: 'block', type: 'sensing_reset_timer' });

                        contents.push({ kind: 'sep', gap: 20 });
                        contents.push({ kind: 'label', text: 'Keyboard/Mouse', 'web-class': 'category-subheader' });
                        contents.push({ kind: 'block', type: 'sensing_key_pressed' });
                        contents.push({ kind: 'block', type: 'sensing_mouse_down' });
                        contents.push({ kind: 'block', type: 'sensing_mouse_x' });
                        contents.push({ kind: 'block', type: 'sensing_mouse_y' });

                        contents.push({ kind: 'sep', gap: 20 });
                        contents.push({ kind: 'label', text: 'Date/Time', 'web-class': 'category-subheader' });
                        contents.push({ kind: 'block', type: 'sensing_current_year' });
                        contents.push({ kind: 'block', type: 'sensing_days_since_2000' });
                        contents.push({ kind: 'block', type: 'sensing_username' });

                        contents.push({ kind: 'sep', gap: 20 });
                        contents.push({ kind: 'label', text: 'Attributes', 'web-class': 'category-subheader' });
                        contents.push({ kind: 'block', type: 'sensing_of' });

                        return contents;
                    });

                    // Register LEAP_MYBLOCKS custom category callback
                    workspaceRef.current.registerToolboxCategoryCallback('LEAP_MYBLOCKS', (ws: any) => {
                        const contents: any[] = [];
                        contents.push(createFlyoutCategoryLabel('My Blocks'));
                        contents.push(createFlyoutSectionLabel('Custom Blocks', 'category-subheader-myblocks'));
                        contents.push({
                            kind: 'button',
                            text: 'Make a Block',
                            callbackKey: 'CREATE_PROCEDURE'
                        });

                        // Add existing procedure call blocks
                        const allBlocks = ws.getAllBlocks(false) || [];
                        const defBlocks = allBlocks.filter((b: any) => b.type === 'procedures_defnoreturn');
                        defBlocks.forEach((defBlock: any) => {
                            const name = defBlock.getFieldValue('NAME');
                            if (name) {
                                const mutation = defBlock.mutationToDom();
                                const mutationXml = mutation ? Blockly.Xml.domToText(mutation) : '';
                                contents.push({
                                    kind: 'block',
                                    type: 'procedures_callnoreturn',
                                    extraState: mutationXml,
                                    fields: { 'NAME': name }
                                });
                            }
                        });

                        return contents;
                    });

                    workspaceRef.current.registerToolboxCategoryCallback('LEAP_MOREBLOCKS', () => {
                        const contents: any[] = [];
                        contents.push(createFlyoutCategoryLabel(MORE_BLOCKS_CATEGORY_NAME));
                        contents.push(createFlyoutSectionLabel('Reserved for future use', 'category-subheader-moreblocks'));
                        contents.push({
                            kind: 'label',
                            text: 'Future blocks will appear here',
                            'web-class': 'category-subheader category-subheader-moreblocks-note'
                        });
                        return contents;
                    });


                    // Register button callback for "Make a Variable"

                    workspaceRef.current.registerButtonCallback('CREATE_VARIABLE', ((btn: any) => {
                        setIsMakeVariableOpen(true);
                    }));



                    // Register button callback for "Make a List"

                    workspaceRef.current.registerButtonCallback('CREATE_LIST', ((btn: any) => {
                        setIsMakeListOpen(true);
                    }));



                    // Register button callback for "Make a Table"

                    workspaceRef.current.registerButtonCallback('CREATE_TABLE', ((btn: any) => {
                        setIsMakeTableOpen(true);
                    }));



                    // Register button callback for "Make a Block"
                    workspaceRef.current.registerButtonCallback('CREATE_PROCEDURE', ((btn: any) => {
                        setIsMakeBlockOpen(true);
                    }));



                    // Register checkbox callbacks for toggling monitor visibility
                    workspaceRef.current.registerButtonCallback('TOGGLE_VARIABLE_*', ((btn: any) => {
                        const variableId = btn.target_.replace('TOGGLE_VARIABLE_', '');
                        const ws = workspaceRef.current;
                        if (ws) {
                            const variable = ws.getVariableById(variableId);
                            if (variable) {
                                setVariableMonitors(prev =>
                                    prev.map(monitor =>
                                        monitor.name === variable.getName()
                                            ? { ...monitor, visible: !monitor.visible }
                                            : monitor
                                    )
                                );
                            }
                        }
                    }));

                    workspaceRef.current.registerButtonCallback('TOGGLE_LIST_*', ((btn: any) => {
                        const listId = btn.target_.replace('TOGGLE_LIST_', '');
                        const ws = workspaceRef.current;
                        if (ws) {
                            const list = ws.getVariableById(listId);
                            if (list) {
                                setListMonitors(prev =>
                                    prev.map(monitor =>
                                        monitor.name === list.getName()
                                            ? { ...monitor, visible: !monitor.visible }
                                            : monitor
                                    )
                                );
                            }
                        }
                    }));

                    workspaceRef.current.registerButtonCallback('TOGGLE_TABLE_*', ((btn: any) => {
                        const tableId = btn.target_.replace('TOGGLE_TABLE_', '');
                        const ws = workspaceRef.current;
                        if (ws) {
                            const table = ws.getVariableById(tableId);
                            if (table) {
                                setTableMonitors(prev =>
                                    prev.map(monitor =>
                                        monitor.name === table.getName()
                                            ? { ...monitor, visible: !monitor.visible }
                                            : monitor
                                    )
                                );
                            }
                        }
                    }));

                    workspaceRef.current.registerButtonCallback('TOGGLE_SENSING_*', ((btn: any) => {
                        const monitorName = btn.target_.replace('TOGGLE_SENSING_', '');
                        setSensingMonitors(prev =>
                            prev.map(monitor =>
                                monitor.name === monitorName
                                    ? { ...monitor, visible: !monitor.visible }
                                    : monitor
                            )
                        );
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
        const ws = workspaceRef.current;
        if (!ws) return;

        console.log('[APP] Attaching listeners for target:', selectedSpriteId);

        // Capture current function instances to ensure correct removal during cleanup
        const currentWsChange = handleWorkspaceChange;
        const currentBlockInteract = handleBlockInteraction;
        const currentBlockDrag = handleBlockDrag;

        ws.addChangeListener(currentWsChange);
        ws.addChangeListener(currentBlockInteract);
        ws.addChangeListener(currentBlockDrag);

        // Highlight
        animationVM.onHighlightBlock = (spriteId, blockId) => {
            if (workspaceRef.current && spriteId === selectedSpriteId) {
                // @ts-ignore
                workspaceRef.current.highlightBlock(blockId);
            }
        };

        // Recompile
        if (sprites.length > 0 && selectedSpriteId) {
            handleWorkspaceChange({ isUiEvent: false } as Blockly.Events.Abstract);
        }

        return () => {
            console.log('[APP] Removing listeners for target:', selectedSpriteId);
            ws.removeChangeListener(currentWsChange);
            ws.removeChangeListener(currentBlockInteract);
            ws.removeChangeListener(currentBlockDrag);
            // Clear highlighting when switching or unmounting
            // @ts-ignore
            ws.highlightBlock(null);
        };
    }, [selectedSpriteId, handleWorkspaceChange, handleBlockInteraction, handleBlockDrag, sprites.length]);



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

    // Track pointer position for block-to-sprite drag detection
    // Uses capture phase to ensure we get events even during Blockly's pointer capture
    useEffect(() => {
        const handler = (e: PointerEvent) => {
            lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
        };
        document.addEventListener('pointermove', handler, true);
        return () => document.removeEventListener('pointermove', handler, true);
    }, []);



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

        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: '100vw',           // ← FIX 5: explicit width anchors children
            overflow: 'hidden',
            backgroundColor: '#f5f5f5',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        }}>
            {/* Responsive Styles */}
            <style>{`
                /* ── Blockly toolbox: flush with top of workspace ─────────── */
                .blocklyToolboxDiv {
                    top: 0 !important;
                    padding-top: 0 !important;
                }
                .blocklyFlyout {
                    top: 0 !important;
                }

                /* ── MenuBar always visible ───────────────────────────────── */
                @media (max-width: 768px) {
                    .menubar-container {
                        padding: 0 8px !important;
                        height: 52px !important;
                    }
                    .menubar-container button:first-child {
                        display: flex !important;
                        flex-shrink: 0 !important;
                    }
                }

                /* ── RIGHT PANEL: flex column, fills its allocated width ──── */
                /* NEVER set height/max-height here — the flex parent controls  */
                /* height. NEVER set min-width — flexShrink:0 + explicit width  */
                /* on the inline style is the correct pattern.                  */
                .right-panel-responsive {
                    display: flex !important;
                    flex-direction: column !important;
                    overflow: hidden !important;
                    /* height is controlled by the flex parent — do NOT set it */
                }

                /* ── STAGE CONTAINER: fixed size, never shrinks ───────────── */
                .stage-container-responsive {
                    flex-shrink: 0 !important;
                }

                /* ── Tablet (≤ 1024px): narrow the right panel ───────────── */
                @media (max-width: 1024px) {
                    .right-panel-responsive {
                        width: 380px !important;
                        /* NO min-width override — inline flexShrink:0 handles it */
                    }
                    .stage-container-responsive {
                        /* width stays 100% — right panel width controls the size */
                    }
                    .log-area-responsive {
                        height: 180px !important;
                        max-height: 180px !important;
                    }
                }

                /* ── Mobile (≤ 768px): stack vertically ──────────────────── */
                @media (max-width: 768px) {
                    .main-container-responsive {
                        flex-direction: column !important;
                        height: auto !important;
                        min-height: calc(100vh - 52px) !important;
                    }
                    .workspace-container-responsive {
                        width: 100% !important;
                        min-width: 0 !important;
                        height: 60vh !important;
                        min-height: 400px !important;
                    }
                    .right-panel-responsive {
                        width: 100% !important;
                        flex-shrink: 1 !important;
                        border-left: none !important;
                        border-top: 1px solid #d9d9d9 !important;
                        height: auto !important;
                        max-height: 40vh !important;
                    }
                    .stage-container-responsive {
                        width: 100% !important;
                        max-width: 450px !important;
                        margin: 0 auto !important;
                    }
                    .log-area-responsive {
                        height: 150px !important;
                        max-height: 150px !important;
                    }
                }

                /* ── Extra small (≤ 480px) ────────────────────────────────── */
                @media (max-width: 480px) {
                    .workspace-container-responsive {
                        height: 50vh !important;
                        min-height: 350px !important;
                    }
                    .stage-container-responsive {
                        max-width: 100% !important;
                    }
                    .log-area-responsive {
                        height: 120px !important;
                        max-height: 120px !important;
                    }
                }

                /* ── Landscape mobile ─────────────────────────────────────── */
                @media (max-width: 768px) and (orientation: landscape) {
                    .main-container-responsive {
                        flex-direction: row !important;
                    }
                    .workspace-container-responsive {
                        width: 60% !important;
                        min-width: 0 !important;
                        height: calc(100vh - 52px) !important;
                    }
                    .right-panel-responsive {
                        width: 40% !important;
                        border-left: 1px solid #d9d9d9 !important;
                        border-top: none !important;
                        height: calc(100vh - 52px) !important;
                        max-height: none !important;
                    }
                    .log-area-responsive {
                        height: 120px !important;
                        max-height: 120px !important;
                    }
                }

                /* ── Code preview (upload mode) ───────────────────────────── */
                .code-preview-area {
                    flex: 1 1 auto !important;
                    min-height: 150px !important;
                    max-height: calc(50vh - 200px) !important;
                    overflow-y: auto !important;
                }
                @media (max-height: 900px) {
                    .code-preview-area { max-height: calc(40vh - 150px) !important; min-height: 140px !important; }
                }
                @media (max-height: 768px) {
                    .code-preview-area { max-height: 200px !important; min-height: 120px !important; }
                }
                @media (max-height: 600px) {
                    .code-preview-area { max-height: 150px !important; min-height: 100px !important; }
                }

                /* ── Log area ─────────────────────────────────────────────── */
                .log-area-responsive {
                    height: 180px !important;
                    max-height: 180px !important;
                    min-height: 120px !important;
                    flex-shrink: 0 !important;
                }
                @media (max-height: 900px) {
                    .log-area-responsive { height: 160px !important; max-height: 160px !important; }
                }
                @media (max-height: 768px) {
                    .log-area-responsive { height: 140px !important; max-height: 140px !important; }
                }
                @media (max-height: 600px) {
                    .log-area-responsive { height: 120px !important; max-height: 120px !important; }
                }

                /* ── Blockly workspace min-height ─────────────────────────── */
                .blocklyWorkspace {
                    min-height: 350px !important;
                }
            `}</style>

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

                        <button style={{ ...styles.iconBtn, ...(stageLayout === 'small' ? styles.iconBtnActive : {}) }} onClick={() => { setStageLayout('small'); addLog("Switched to Small Stage mode"); }} title="Small Stage">

                            <LayoutTemplate size={18} />

                        </button>

                        <button style={{ ...styles.iconBtn, ...(stageLayout === 'large' ? styles.iconBtnActive : {}) }} onClick={() => { setStageLayout('large'); addLog("Switched to Large Stage mode"); }} title="Large Stage">

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
            {showSpriteLibrary && (
                <React.Suspense fallback={<div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '18px', color: '#855CD6' }}>Loading...</div>}>
                    <SpriteLibrary
                        isOpen={showSpriteLibrary}
                        onClose={() => setShowSpriteLibrary(false)}
                        onSelectSprite={(sprite: any) => {
                            addSprite(sprite.id as any); // Adapt as needed
                            setShowSpriteLibrary(false);
                        }}
                    />
                </React.Suspense>
            )}

            {showBackdropLibrary && (
                <React.Suspense fallback={<div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '18px', color: '#855CD6' }}>Loading...</div>}>
                    <BackdropLibrary
                        isOpen={showBackdropLibrary}
                        onClose={() => setShowBackdropLibrary(false)}
                        onSelectBackdrop={(backdrop) => handleBackdropSelect(backdrop.name, backdrop.image)}
                    />
                </React.Suspense>
            )}

            {/* Main Content */}

            <div style={styles.main} className="main-container-responsive">

                {/* Blockly Workspace */}

                <div style={styles.workspaceContainer} className="workspace-container-responsive">



                    {/* Workspace content */}

                    {/* Show Blockly if:

                        1. In Stage mode AND 'blocks' tab is active

                        2. In Upload mode (always shows blocks)

                    */}

                    {((editorMode === 'stage' && workspaceTab === 'blocks') || editorMode === 'upload') && (

                        <>

                            <div
                                ref={blocklyDiv}
                                className={editorMode === 'stage' && workspaceTab !== 'blocks' ? 'hide-flyout' : ''}
                                style={styles.blockly}
                            />

                            {/* Add Extension Button - Premium integrated design */}
                            {((editorMode === 'stage' && workspaceTab === 'blocks') || editorMode === 'upload') && (
                                <div className="absolute bottom-3 left-3 z-[100] add-extension-btn-container">
                                    <button
                                        onClick={() => setShowExtensionLibrary(true)}
                                        className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#855CD6] to-[#9B6FE8] hover:from-[#7348C4] hover:to-[#8A5DD6] rounded-xl border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                                        style={{
                                            width: '52px',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            backdropFilter: 'blur(10px)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.width = '180px';
                                            e.currentTarget.style.paddingRight = '16px';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.width = '52px';
                                            e.currentTarget.style.paddingRight = '12px';
                                        }}
                                        title="Add Extension"
                                    >
                                        <div className="w-8 h-8 flex items-center justify-center text-white flex-shrink-0">
                                            <Library size={20} strokeWidth={2.5} />
                                        </div>
                                        <div className="text-left whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                                            <div className="text-xs font-semibold text-white leading-tight">Extensions</div>
                                            <div className="text-[10px] text-white/80 leading-tight">Add blocks</div>
                                        </div>
                                    </button>
                                </div>
                            )}

                            <WorkspaceControls workspaceRef={workspaceRef} onAfterZoom={() => {
                                const flyout = workspaceRef.current?.getFlyout() as any;
                                if (flyout?.getWorkspace()) {
                                    flyout.getWorkspace().setScale(1.0);
                                }
                            }} style={undefined} />

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
                            <React.Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Loading Paint Editor...</div>}>
                                <CostumesTab

                                    selectedSpriteId={selectedSpriteId}

                                    sprites={sprites}

                                    stageManager={stageManager}

                                    addLog={addLog}

                                    onClose={() => handleWorkspaceTabChange('blocks')}

                                    onOpenLibrary={selectedSpriteId === 'stage' ? () => setShowBackdropLibrary(true) : undefined}

                                />
                            </React.Suspense>
                        </div>

                    )}

                    {editorMode === 'stage' && workspaceTab === 'sounds' && (

                        <div style={styles.soundsEditor}>
                            <React.Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Loading Sound Editor...</div>}>
                                <SoundsTab

                                    selectedSpriteId={selectedSpriteId}

                                    sprites={sprites}

                                    stageManager={stageManager}

                                    addLog={addLog}

                                    onClose={() => handleWorkspaceTabChange('blocks')}

                                />
                            </React.Suspense>
                        </div>

                    )}

                </div>



                {/* Right Panel */}

                <div style={{

                    ...styles.rightPanel,
                    width: isFullscreen ? '100vw' : (stageLayout === 'small' ? '256px' : '496px'),

                    transition: 'width 0.2s ease-in-out',

                }} className="right-panel-responsive">

                    {/* Stage Container */}
                    <div ref={stageContainerRef} className="stage-container-responsive" style={{
                        ...(!isFullscreen ? styles.stageContainer : {}),
                        width: isFullscreen ? '100vw' : '100%',
                        height: isFullscreen ? '100vh' : (stageLayout === 'small' ? '155px' : (editorMode === 'stage' ? 'auto' : '310px')),
                        transition: isFullscreen ? 'none' : 'all 0.2s ease-in-out',
                        position: isFullscreen ? 'fixed' : 'relative',
                        top: isFullscreen ? 0 : 'auto',
                        left: isFullscreen ? 0 : 'auto',
                        zIndex: isFullscreen ? 9999 : 1,
                        display: (editorMode === 'stage' || isFullscreen) ? 'flex' : 'none',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        background: isFullscreen ? '#f0f0f0' : 'transparent',
                        overflowX: 'hidden',
                        overflowY: 'hidden',
                        gap: 0,
                    }}>

                        {/* Fullscreen Toolbar — light gray, matches reference images */}
                        {isFullscreen && (
                            <div style={{
                                width: '100%',
                                height: '48px',
                                background: '#f0f0f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0 16px',
                                boxSizing: 'border-box',
                                borderBottom: '1px solid #ddd',
                                flexShrink: 0,
                                zIndex: 10,
                            }}>
                                {/* Left: Run + Stop */}
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button
                                        onClick={handleRunClick}
                                        title="Run"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                                    >
                                        <svg viewBox="0 0 24 24" width="28" height="28">
                                            <circle cx="12" cy="12" r="11" fill="#4CAF50" />
                                            <polygon fill="white" points="10,8 17,12 10,16" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={handleStopClick}
                                        title="Stop"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                                    >
                                        <svg viewBox="0 0 24 24" width="28" height="28">
                                            <circle cx="12" cy="12" r="11" fill="#F44336" />
                                            <rect x="8" y="8" width="8" height="8" fill="white" rx="1" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Center: Camera, Image, Sound, Timer */}
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <button
                                        onClick={() => setIsCameraOn(!isCameraOn)}
                                        title="Toggle Camera"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: '#555' }}
                                    >
                                        {isCameraOn ? <Camera size={20} /> : <CameraOff size={20} />}
                                    </button>
                                    <button title="Screenshot" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: '#555' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <rect x="3" y="3" width="18" height="14" rx="2" />
                                            <polyline points="3 13 8 8 13 12" />
                                            <polyline points="13 12 16 9 21 13" />
                                        </svg>
                                    </button>
                                    <button title="Sound" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: '#555' }}>
                                        <Volume2 size={20} />
                                    </button>
                                    {/* Timer pill */}
                                    <div style={{
                                        background: '#6c3fc5',
                                        color: 'white',
                                        padding: '3px 12px',
                                        borderRadius: '20px',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}>
                                        <span>0 : 00</span>
                                    </div>
                                </div>

                                {/* Right: Exit fullscreen */}
                                <button
                                    onClick={handleFullscreen}
                                    title="Exit Fullscreen"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: '#555' }}
                                >
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                                    </svg>
                                </button>
                            </div>
                        )}



                        {/* --- STAGE RENDERING --- */}
                        {(() => {
                            const CANVAS_WIDTH = 480;
                            const CANVAS_HEIGHT = 360;

                            // Fullscreen: scale canvas to fill viewport minus 48px toolbar
                            const TOOLBAR_H = 48;
                            const fsScale = isFullscreen
                                ? Math.min(
                                    window.innerWidth / CANVAS_WIDTH,
                                    (window.innerHeight - TOOLBAR_H) / CANVAS_HEIGHT
                                )
                                : 1;
                            const displayW = isFullscreen ? Math.round(CANVAS_WIDTH * fsScale) : CANVAS_WIDTH;
                            const displayH = isFullscreen ? Math.round(CANVAS_HEIGHT * fsScale) : CANVAS_HEIGHT;

                            return (
                                <div style={{
                                    flex: 1,
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: isFullscreen ? 'center' : 'stretch',
                                    justifyContent: isFullscreen ? 'center' : 'flex-start',
                                    position: 'relative',
                                    overflow: 'visible',
                                    height: isFullscreen ? `calc(100vh - ${TOOLBAR_H}px)` : 'auto',
                                }}>
                                    {/* Stage canvas */}
                                    <div style={{
                                        width: `${displayW}px`,
                                        height: `${displayH}px`,
                                        background: 'white',
                                        boxShadow: isFullscreen ? '0 4px 32px rgba(0,0,0,0.18)' : 'none',
                                        borderRadius: isFullscreen ? '4px' : '0',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        flex: '0 0 auto',
                                    }}>
                                        <Stage

                                            width={displayW}

                                            height={displayH}

                                            sprites={sprites}

                                            isRunning={isRunning}

                                            showGridNumbers={showGrid}

                                            onSpriteSelect={handleSpriteSelect}

                                            onSpriteClick={handleSpriteClick}

                                            isCameraOn={isCameraOn}

                                            variableMonitors={variableMonitors}

                                            listMonitors={listMonitors}

                                            tableMonitors={tableMonitors}

                                            selectedSpriteId={selectedSpriteId}

                                            onMonitorPositionChange={handleMonitorPositionChange}

                                            onMonitorResize={handleMonitorResize}

                                            onMonitorBringToFront={handleMonitorBringToFront}

                                            onVariableModeChange={handleVariableModeChange}

                                            onVariableValueChange={handleVariableValueChange}

                                            onVariableSliderRangeChange={handleVariableSliderRangeChange}

                                            onListAddItem={handleListAddItem}

                                            onListEditItem={handleListEditItem}

                                            onListDeleteItem={handleListDeleteItem}

                                        />

                                        {/* Ask-and-wait input overlay */}
                                        {askState.isAsking && (
                                            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', zIndex: 100 }}>
                                                <AskBar question={askState.question} onSubmit={handleAskSubmit} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Sprite & Stage Panel Unit — hidden in fullscreen */}
                                    {editorMode === 'stage' && !isFullscreen && (
                                        <div style={{
                                            ...styles.assetsContainer,
                                            width: '100%',
                                            flex: '1 1 auto',
                                            minHeight: 0,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'flex-start',
                                            alignItems: 'stretch',
                                            overflow: 'visible',
                                        }}>
                                            <SpritePanel
                                                sprites={sprites}
                                                selectedSpriteId={selectedSpriteId}
                                                onSelectSprite={handleSpriteSelect}
                                                onAddSprite={addSprite}
                                                onDeleteSprite={deleteSprite}
                                                onRemoveBackground={handleRemoveBackground}
                                                onOpenSpriteLibrary={() => setShowSpriteLibrary(true)}
                                                onOpenBackdropLibrary={() => setShowBackdropLibrary(true)}
                                                stageManager={stageManager}
                                                backdropVersion={backdropRefresh}
                                                isFullscreen={isFullscreen}
                                                onCopyCodeToSprite={handleCopyCodeToSprite}
                                            />
                                        </div>
                                    )}
                                </div>

                            );

                        })()}

                    </div>

                    {/* Code Preview - Only in Upload mode AND NOT Fullscreen */}
                    {editorMode === 'upload' && !isFullscreen && (
                        <>

                            {/* Code Preview */}

                            <div style={styles.codeHeader}>

                                <span>💻 Arduino Code</span>

                                {uploadProgress && <span style={styles.uploadStatus}>{uploadProgress}</span>}

                            </div>

                            <div style={styles.codeArea} className="code-preview-area">

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

                            <div style={styles.logArea} className="log-area-responsive">

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

                            <div style={{ ...styles.modalTitle, backgroundColor: '#855CD6' }}>

                                {promptState.type === 'variable' ? 'New Variable' : (promptState.message?.includes('Rename') ? 'Rename Variable' : 'Input')}

                                <div

                                    onClick={handlePromptCancel}

                                    style={{ cursor: 'pointer', float: 'right', fontSize: '20px', fontWeight: 'bold' }}

                                >×</div>

                            </div>



                            <div style={{ padding: '20px' }}>

                                {promptState.type === 'variable' ? (

                                    <div style={{ marginBottom: '10px', fontSize: '14px', color: '#575E75' }}>

                                        New variable name:

                                    </div>

                                ) : promptState.message ? (

                                    <div style={{ marginBottom: '10px', fontSize: '14px', color: '#575E75' }}>

                                        {promptState.message}

                                    </div>

                                ) : null}



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



            {/* New Dialog Components */}
            <MakeVariableDialog
                isOpen={isMakeVariableOpen}
                onClose={() => setIsMakeVariableOpen(false)}
                onCreateVariable={handleCreateVariable}
                workspace={workspaceRef.current}
            />

            <MakeListDialog
                isOpen={isMakeListOpen}
                onClose={() => setIsMakeListOpen(false)}
                onCreateList={handleCreateList}
                workspace={workspaceRef.current}
            />

            <MakeTableDialog
                isOpen={isMakeTableOpen}
                onClose={() => setIsMakeTableOpen(false)}
                onCreateTable={handleCreateTable}
                workspace={workspaceRef.current}
            />

            <MakeBlockDialog
                isOpen={isMakeBlockOpen}
                onClose={() => setIsMakeBlockOpen(false)}
                onCreateBlock={handleCreateBlock}
                workspace={workspaceRef.current}
            />



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
            {showSpriteLibrary && (
                <React.Suspense fallback={<div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '18px', color: '#855CD6' }}>Loading...</div>}>
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

                                    // Add default sound based on sprite tags/name
                                    const defaultSound = getDefaultSoundForSprite(
                                        (entry as any).tags || [],
                                        entry.name
                                    );
                                    await newSprite.addSound(defaultSound.name, defaultSound.src);



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

                            // Add default sound based on sprite tags/name
                            // (Image-based sprites already get a sound in their async loader above,
                            //  but emoji-only sprites don't — this covers both as a fallback.)
                            if (newSprite.sounds.length === 0) {
                                const defaultSound = getDefaultSoundForSprite(
                                    (entry as any).tags || [],
                                    entry.name
                                );
                                newSprite.addSound(defaultSound.name, defaultSound.src);
                            }

                            // Initialize empty workspace for the new sprite

                            spriteWorkspacesRef.current.set(id, {});



                            // Silently clear workspace to prevent event bleed

                            if (workspaceRef.current) {

                                isLoadingWorkspaceRef.current = true;
                                Blockly.Events.disable();
                                console.log('[APP] Initializing empty workspace for new sprite:', id);

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
                </React.Suspense>
            )}

            {/* Premium Upload Modal */}

            <UploadModal

                isOpen={isUploading}

                progress={uploadProgress}

            />


            {/* Extension Library Modal */}
            {showExtensionLibrary && (
                <React.Suspense fallback={<div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '18px', color: '#855CD6' }}>Loading...</div>}>
                    <JuniorExtensionLibrary
                        onClose={() => setShowExtensionLibrary(false)}
                        onSelectExtension={(id: string) => {
                            handleAddExtension(id);
                            setShowExtensionLibrary(false);
                        }}
                    />
                </React.Suspense>
            )}
        </div>
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



    main: {
        flex: 1,
        display: 'flex',
        overflow: 'hidden',           // ← KEY FIX: Prevents page scroll
        minHeight: 0,                 // ← FIX 4: Allows row to shrink below content height
        position: 'relative'
    },



    // Workspace

    workspaceContainer: {
        flex: 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,                  // ← FIX 1 (ROOT CAUSE): Overrides min-width:auto so workspace compresses
        overflow: 'hidden'
    },

    blockly: {
        flex: 1,
        width: '100%',
        minHeight: 0                // ← Allows flex shrinking
    },



    // Leapblocks-style tabs

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

        gap: '10px',

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

        width: '450px',
        flexShrink: 0,                // ← FIX 2: Column never squishes; workspace absorbs all size changes
        // minWidth/maxWidth removed — flexShrink:0 + explicit width is the correct pattern

        backgroundColor: '#f5f5f5',

        borderLeft: '1px solid #d9d9d9',

        display: 'flex',

        flexDirection: 'column',

        gap: '8px',

        padding: '8px',
        overflow: 'hidden',
        height: '100%',

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

        fontSize: '15px',

        marginRight: '4px',

    },

    stopButtonSmall: {

        padding: '4px 8px',

        border: '1px solid #f44336',

        borderRadius: '4px',

        backgroundColor: 'white',

        cursor: 'pointer',

        fontSize: '15px',

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
        flexShrink: 0,

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

        flex: '1 1 auto',
        minHeight: '150px',

        overflow: 'auto',

        backgroundColor: '#fafafa',

        borderRadius: '0 0 8px 8px',

        borderBottom: '1px solid #eee',

        borderLeft: '1px solid #eee',

        borderRight: '1px solid #eee',

        borderTop: 'none',

        maxHeight: 'calc(50vh - 200px)',

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



    bottomTabs: {
        display: 'flex',
        borderTop: '1px solid #ddd',
        marginTop: 'auto',
        flexShrink: 0
    },

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

        height: '180px',
        maxHeight: '180px',
        minHeight: '120px',

        overflow: 'auto',

        padding: '8px 12px',

        backgroundColor: '#fff',

        fontSize: '11px',

        fontFamily: 'monospace',

        borderRadius: '0 0 8px 8px',
        flexShrink: 0,

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

