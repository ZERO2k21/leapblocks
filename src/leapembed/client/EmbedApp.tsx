/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { STAGE_CONFIG } from '../server/engine/stageConfig';

import Blockly, { LEAP_CUSTOM_BLOCK_CONTEXT_MENU_FLAG } from '../server/blockly/runtime';

import './styles/leapembedBlocks.css'; // Import leap-style blocks CSS
import '../../leapignite/client/styles/juniorBlocks.css';
import '../../leapignite/client/styles/juniorLooksBlocks.css';
import { embedStyles as styles } from './styles/embedApp.styles';


import { arduinoBlocks, arduinoToolbox } from '../server/blocks/arduinoBlocks';

import { esp32Blocks, esp32Toolbox } from '../server/blocks/esp32Blocks';

import { animationBlocks, animationToolbox } from '../server/blocks/animationBlocks';
import { COLORS } from '../server/blocks/blockDefinitions';
import { registerleapBlocks } from '../server/blocks/leapBlocks';

import { hardwareBlocks } from '../server/blocks/hardwareBlocks';

import { arduinoGenerator } from '../server/generators/arduinoGenerator';

import { AnimationCompiler } from '../server/generators/animationGenerator';

import { initPythonGenerator } from '../server/generators/pythonGenerator'; // Deferred registration

import { animationVM } from '../server/vm/animationVM';
import type { CompiledScript } from '../server/vm/animationVM';

import { Sprite } from './stage/Sprite';
import type { SpriteType } from './stage/Sprite';

import Stage from './stage/Stage';
import AskBar from './components/AskBar';

import SpritePanel from './stage/SpritePanel';

import MenuBar from './components/MenuBar';

import BoardSelectionModal from './components/BoardSelectionModal';

import { PythonEditorTab } from './components/PythonEditorTab';

// import StagePanel from './stage/StagePanel'; // Temporarily disabled - component needs to be created

// Lazy load large components for better performance
const BackdropLibrary = React.lazy(() => import('./components/BackdropLibrary'));
const SpriteLibrary = React.lazy(() => import('./components/SpriteLibrary').then(m => ({ default: m.SpriteLibrary })));
const JuniorExtensionLibrary = React.lazy(() => import('../../leapignite/client/components/JuniorExtensionLibrary'));

// Lazy load heavy tabs that import fabric.js and wav-encoder - prevents 60s startup delay
const CostumesTab = React.lazy(() => import('./stage/CostumesTab').then(m => ({ default: m.CostumesTab })));
const SoundsTab = React.lazy(() => import('./stage/SoundsTab').then(m => ({ default: m.SoundsTab })));

// import BackdropEditor from './components/BackdropEditor'; // Temporarily disabled

import { stageManager } from '../server/engine/stageManager';
import { spriteManager } from '../server/engine/spriteManager';
import { leapRuntime } from '../server/runtime/leapRuntime';
import { initRuntime, setActiveSpriteId, setFaceVideoElement } from '../server/runtime/runtimeBridge';
import { hardwareAdapter } from '../server/hardware/hardwareAdapter';

import SerialMonitor from './components/SerialMonitor';

import UploadModal from './components/UploadModal';

import type { SpriteEntry } from './components/SpriteLibrary';

import WorkspaceControls from './components/WorkspaceControls';

import WorkspaceTrash from './components/WorkspaceTrash';

import UnsavedWarningModal from '../../leapignite/client/components/UnsavedWarningModal';
import { EXTENSIONS, registerExtensions } from '../server/extensions/extensionDefinitions';


import { fileService } from '../server/services/fileService';
import { registerLeapRenderer } from '../../leapignite/server/blocks/LeapRenderer';

import { Flag, Square, Upload, Camera, CameraOff, Grid3X3, Maximize, Minimize, LayoutTemplate, LayoutPanelLeft, Library, Pen, Volume2, Undo2, Redo2, Terminal } from 'lucide-react';

import { registerPictoBloxCategory } from '../server/blockly/customToolbox';

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
// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { EmbedToolbar } from './components/EmbedToolbar';
import { EmbedDialogs } from './components/EmbedDialogs';
import { EmbedMonitors } from './components/EmbedMonitors';
import { EmbedRightPanel } from './components/EmbedRightPanel';

// â”€â”€â”€ Extracted hooks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { useMonitors, normalizeVariableMonitor } from './hooks/useMonitors';
import type { VariableMonitorState, ListMonitorState, TableMonitorState } from './hooks/useMonitors';
import { useHardware } from './hooks/useHardware';
import { useProject } from './hooks/useProject';
import { useAnimationControls } from './hooks/useAnimationControls';
import { useSprites } from './hooks/useSprites';
import { initBlocklyOnce as _initBlocklyOnce, useToolbox } from './hooks/useBlocklyInit';







// Global initialization guards to prevent duplicate block registration and recursive prototype patching
let blocksInitialized = false;
let originalCheckboxSetValue: any = null;

// Initialize Extension Runtime mapping Î“Ã‡Ã¶ delegates to RuntimeBridge
// which wires pen Î“Ã¥Ã† PenManager and face Î“Ã¥Ã† FaceRuntime (browser FaceDetector API)
// and extension runtimes Î“Ã¥Ã† ObjectDetection, Music, etc.
if (typeof window !== 'undefined') {
    initRuntime();
    // Extensions are initialized lazily when added via the Extension Library
}


// Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰



// LOGGING UTILITY

// Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰

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

// Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰
// DEFERRED BLOCKLY INITIALIZATION
// All Blockly monkey-patches and registrations are deferred to first render
// to avoid TDZ errors when webpack chunk splitting reorders module evaluation.
// Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰

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
    registerPictoBloxCategory();

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

    // Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰
    // GLOBAL BLOCKLY OVERRIDES
    // Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰

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
    category?.kind === 'pictobloxCategory' ||
    category?.kind === 'pictoBloxCategory' ||
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
    kind: 'pictobloxCategory',
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
            contents: [...category.contents]
        };
    });
};



// Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰

// MAIN APP COMPONENT

// Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰

// Main app mode: home (welcome screen) or one of the coding modes

type AppMode = 'home' | 'blocks' | 'python' | 'notebook' | 'ml' | 'xr';

// Editor sub-mode for blocks: stage (animation) or upload (hardware)

type EditorMode = 'stage' | 'upload';











const IntermediateApp: React.FC<{ onBack: () => void; onOpenPython?: () => void; openTab?: 'blocks' | 'python' | 'costumes' | 'sounds' }> = ({ onBack, onOpenPython, openTab = 'blocks' }) => {

    // â”€â”€â”€ Refs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const blocklyDiv = useRef<HTMLDivElement>(null);
    const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
    const selectedSpriteIdRef = useRef<string | null>(null);
    // Refs used by the Blockly workspace useEffect
    const lastToolboxJsonRef = useRef<string>('');
    const previewBlockActionRef = useRef<(block: Blockly.Block) => void>(() => {});
    const monitorsRef = useRef<any>({});

    // â”€â”€â”€ Core UI state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [appMode, setAppMode] = useState<AppMode>('blocks');
    const [editorMode, setEditorMode] = useState<EditorMode>('stage');
    const [projectName, setProjectName] = useState('My Project');
    const [generatedCode, setGeneratedCode] = useState('// Select blocks to generate code');
    const [activeTab, setActiveTab] = useState<'log' | 'serial'>('log');
    const [workspaceTab, setWorkspaceTab] = useState<'blocks' | 'python' | 'costumes' | 'sounds'>(openTab);
    const [logMessages, setLogMessages] = useState<string[]>(['Ready']);
    const [isRunning, setIsRunning] = useState(false);
    const [compiledScripts, setCompiledScripts] = useState<CompiledScript[]>([]);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [showGrid, setShowGrid] = useState(false);
    const [stageLayout, setStageLayout] = useState<'normal' | 'small' | 'large'>('normal');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fullscreenScale, setFullscreenScale] = useState(1);
    const stageContainerRef = useRef<HTMLDivElement>(null);
    const [showBackdropLibrary, setShowBackdropLibrary] = useState(false);
    const [showSpriteLibrary, setShowSpriteLibrary] = useState(false);
    const [showExtensionLibrary, setShowExtensionLibrary] = useState(false);
    const [backdropRefresh, setBackdropRefresh] = useState(0);
    const [isMakeVariableOpen, setIsMakeVariableOpen] = useState(false);
    const [isMakeListOpen, setIsMakeListOpen] = useState(false);
    const [isMakeTableOpen, setIsMakeTableOpen] = useState(false);
    const [isMakeBlockOpen, setIsMakeBlockOpen] = useState(false);
    const [installedExtensions, setInstalledExtensions] = useState<Set<string>>(new Set());
    const installedExtensionsRef = useRef<Set<string>>(new Set());
    const [promptState, setPromptState] = useState<{
        isOpen: boolean; message: string; defaultValue: string;
        callback: ((v: string | null) => void) | null; type: 'standard' | 'variable' | 'list' | 'table';
    }>({ isOpen: false, message: '', defaultValue: '', callback: null, type: 'standard' });
    const [promptInput, setPromptInput] = useState('');
    const [variableType, setVariableType] = useState('Number');
    const [variableScope, setVariableScope] = useState('global');
    const [askState, setAskState] = useState<{
        isAsking: boolean; question: string; resolve: ((a: string) => void) | null;
    }>({ isAsking: false, question: '', resolve: null });

    // â”€â”€â”€ Logging â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const addLog = useCallback((message: string) => {
        setLogMessages(prev => [...prev.slice(-50), `[${new Date().toLocaleTimeString()}] ${message}`]);
    }, []);

    // â”€â”€â”€ Monitors hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const {
        variableMonitors, setVariableMonitors,
        listMonitors, setListMonitors,
        tableMonitors, setTableMonitors,
        sensingMonitors, setSensingMonitors,
        sensingMonitorsRef,
        handleMonitorPositionChange, handleMonitorResize, handleMonitorBringToFront,
        handleVariableModeChange, handleVariableValueChange, handleVariableSliderRangeChange,
        handleToggleVisibility,
    } = useMonitors();

    // â”€â”€â”€ Hardware hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const {
        ports, setPorts,
        selectedPort, setSelectedPort,
        selectedBoard, setSelectedBoard,
        selectedBoardName, setSelectedBoardName,
        isBoardModalOpen, setIsBoardModalOpen,
        isConnected, setIsConnected,
        serialMessages, setSerialMessages,
        baudRate, setBaudRate,
        lineEnding, setLineEnding,
        isUploading, setIsUploading,
        uploadProgress, setUploadProgress,
        refreshPorts, handleConnect, handleSendSerial, handleUpload,
        setGeneratedCode: setHwGeneratedCode,
    } = useHardware(addLog);

    // Sync generatedCode into useHardware so handleUpload can access it
    useEffect(() => { setHwGeneratedCode(generatedCode); }, [generatedCode]);

    // â”€â”€â”€ Sprites hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleWorkspaceChangeRef = useRef<(e: Blockly.Events.Abstract) => void>(() => {});

    const {
        sprites, setSprites,
        selectedSpriteId, setSelectedSpriteId,
        spriteWorkspacesRef, activeSpriteIdRef, isLoadingWorkspaceRef,
        triggerUpdate,
        saveCurrentSpriteWorkspace, loadSpriteWorkspace,
        handleSpriteSelect, handleSpriteClick,
        addSprite, addSpriteFromLibrary, deleteSprite, handleRemoveBackground,
    } = useSprites({
        workspaceRef,
        variableMonitors, listMonitors, tableMonitors,
        handleWorkspaceChange: (e) => handleWorkspaceChangeRef.current(e),
        setCompiledScripts,
        addLog,
    });

    useEffect(() => { selectedSpriteIdRef.current = selectedSpriteId; }, [selectedSpriteId]);

    // â”€â”€â”€ Workspace change handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleWorkspaceChange = useCallback((event: Blockly.Events.Abstract) => {
        if (event.isUiEvent || !workspaceRef.current || isLoadingWorkspaceRef.current) return;
        if (event.type === Blockly.Events.VAR_RENAME) {
            const e = event as any;
            setVariableMonitors(prev => prev.map(m => m.name === e.oldName ? { ...m, name: e.newName } : m));
            setListMonitors(prev => prev.map(m => m.name === e.oldName ? { ...m, name: e.newName } : m));
            setTableMonitors(prev => prev.map(m => m.name === e.oldName ? { ...m, name: e.newName } : m));
        } else if (event.type === Blockly.Events.VAR_DELETE) {
            const name = (event as any).varName;
            setVariableMonitors(prev => prev.filter(m => m.name !== name));
            setListMonitors(prev => prev.filter(m => m.name !== name));
            setTableMonitors(prev => prev.filter(m => m.name !== name));
        }
        try {
            if (editorMode === 'upload') {
                const code = arduinoGenerator.workspaceToCode(workspaceRef.current);
                setGeneratedCode(`// LeapBlocks - Arduino Code\n\n${code || 'void setup() {}\nvoid loop() {}'}`);
            } else {
                const sprite = sprites.find(s => s.id === selectedSpriteId);
                if (sprite) {
                    const compiler = new AnimationCompiler(sprite.id);
                    const scripts = compiler.compile(workspaceRef.current);
                    setCompiledScripts(prev => [...prev.filter(s => s.spriteId !== sprite.id), ...scripts]);
                    sprite.setScripts(scripts);
                    setGeneratedCode(`// Stage Mode - ${scripts.length} script(s) compiled\n// Click to run`);
                } else {
                    setGeneratedCode('// Add a sprite to start programming!');
                }
            }
            const activeId = activeSpriteIdRef.current;
            if (activeId && workspaceRef.current) {
                spriteWorkspacesRef.current.set(activeId, Blockly.serialization.workspaces.save(workspaceRef.current));
            }
        } catch (e) { console.error('[EmbedApp] Code generation error:', e); }
    }, [editorMode, sprites, selectedSpriteId, activeSpriteIdRef, spriteWorkspacesRef, isLoadingWorkspaceRef,
        setVariableMonitors, setListMonitors, setTableMonitors]);

    useEffect(() => { handleWorkspaceChangeRef.current = handleWorkspaceChange; }, [handleWorkspaceChange]);

    // â”€â”€â”€ Animation controls hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const {
        syncAllWorkspaces, syncAllWorkspacesRef,
        handleRunClick, handleStopClick, handleBlockInteraction,
    } = useAnimationControls({
        sprites, selectedSpriteId, workspaceRef, spriteWorkspacesRef,
        activeSpriteIdRef, editorMode, isConnected,
        activeTab, setActiveTab,
        setIsRunning, setCompiledScripts, setAskState, setIsCameraOn,
        saveCurrentSpriteWorkspace, addLog,
    });

    // â”€â”€â”€ Toolbox hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const { getCurrentToolbox } = useToolbox(editorMode, selectedBoard, selectedSpriteId, installedExtensions);

    // â”€â”€â”€ Project hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const {
        showUnsavedModal, setShowUnsavedModal,
        handleNewProject, handleOpenProject, handleSaveProject,
        executeNewProject, confirmUnsavedAction,
    } = useProject({
        sprites, spriteWorkspacesRef, workspaceRef, activeSpriteIdRef,
        isLoadingWorkspaceRef, variableMonitors, listMonitors, tableMonitors,
        setSprites, setSelectedSpriteId, setProjectName,
        setVariableMonitors, setListMonitors, setTableMonitors,
        setCompiledScripts, setIsRunning, triggerUpdate, addLog,
        loadSpriteWorkspace, projectName,
    });

    // â”€â”€â”€ Extensions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleAddExtension = useCallback((extId: string) => {
        if (!workspaceRef.current) return;
        const id = extId.replace(/-/g, '_');
        const ext = EXTENSIONS[id];
        if (ext) {
            registerExtensions(Blockly, [id]);
            if (!installedExtensionsRef.current.has(id)) {
                installedExtensionsRef.current = new Set([...installedExtensionsRef.current, id]);
                setInstalledExtensions(new Set(installedExtensionsRef.current));
            }
        }
    }, []);

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.data?.type === 'ADD_EXTENSION') {
                const id = event.data.extension || event.data.extensionId;
                if (id) { handleAddExtension(id); setShowExtensionLibrary(false); }
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [handleAddExtension]);

    // â”€â”€â”€ Fullscreen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleFullscreen = () => {
        if (!isFullscreen) {
            setIsFullscreen(true);
            setFullscreenScale(Math.min(window.innerWidth / 480, (window.innerHeight - 54) / 360));
        } else { setIsFullscreen(false); setFullscreenScale(1); }
    };
    useEffect(() => {
        const update = () => isFullscreen
            ? setFullscreenScale(Math.min(window.innerWidth / 480, (window.innerHeight - 54) / 360))
            : setFullscreenScale(1);
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [isFullscreen]);

    // â”€â”€â”€ Backdrop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleBackdropSelect = async (name: string, src: string) => {
        await stageManager.addBackdrop(name, src);
        stageManager.setBackdrop(name);
        setShowBackdropLibrary(false);
        setBackdropRefresh(prev => prev + 1);
        window.dispatchEvent(new Event('leap-stage-update'));
    };

    // â”€â”€â”€ Prompt dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handlePromptSubmit = () => {
        if (promptState.callback) {
            if (promptState.type === 'variable' && workspaceRef.current)
                workspaceRef.current.getVariableMap().createVariable(promptInput, variableType);
            else if (promptState.type === 'list' && workspaceRef.current)
                workspaceRef.current.getVariableMap().createVariable(promptInput, 'list');
            else if (promptState.type === 'table' && workspaceRef.current)
                workspaceRef.current.getVariableMap().createVariable(promptInput, 'table');
            promptState.callback(promptInput);
        }
        setPromptState(prev => ({ ...prev, isOpen: false }));
    };
    const handlePromptCancel = () => {
        promptState.callback?.(null);
        setPromptState(prev => ({ ...prev, isOpen: false }));
    };

    // â”€â”€â”€ Ask-and-wait â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleAskSubmit = useCallback((answer: string) => {
        if (askState.resolve) askState.resolve(answer);
        setAskState({ isAsking: false, question: '', resolve: null });
    }, [askState.resolve]);

    useEffect(() => {
        animationVM.onAskQuestion = (question: string) =>
            new Promise<string>(resolve => setAskState({ isAsking: true, question, resolve }));
        return () => { animationVM.onAskQuestion = undefined; };
    }, []);

    // â”€â”€â”€ Dialog handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleCreateVariable = (v: { name: string; type: 'Number' | 'String'; scope: 'all_sprites' | 'this_sprite' }) => {
        setVariableMonitors(prev => [...prev, normalizeVariableMonitor({
            id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: v.name, type: v.type, scope: v.scope,
            spriteId: v.scope === 'this_sprite' ? selectedSpriteId || 'stage' : undefined,
            visible: true, value: v.type === 'Number' ? 0 : '',
            x: 10 + variableMonitors.length * 20, y: 10 + variableMonitors.length * 30,
        }, variableMonitors.length)]);
        addLog(`Created variable: ${v.name}`);
        // Refresh toolbox so new variable appears immediately in the Variables flyout
        setTimeout(() => { workspaceRef.current?.refreshToolboxSelection?.(); }, 50);
    };
    const handleCreateList = (l: { name: string; scope: 'all_sprites' | 'this_sprite' }) => {
        setListMonitors(prev => [...prev, {
            id: `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: l.name, scope: l.scope,
            spriteId: l.scope === 'this_sprite' ? selectedSpriteId || 'stage' : undefined,
            visible: true, items: [],
            x: 10 + listMonitors.length * 20, y: 60 + listMonitors.length * 30,
            width: 140, height: 180,
        }]);
        addLog(`Created list: ${l.name}`);
        setTimeout(() => { workspaceRef.current?.refreshToolboxSelection?.(); }, 50);
    };
    const handleCreateTable = (t: { name: string; rows: number; cols: number; scope: 'all_sprites' | 'this_sprite' }) => {
        setTableMonitors(prev => [...prev, {
            id: `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: t.name, rows: t.rows, cols: t.cols, scope: t.scope,
            spriteId: t.scope === 'this_sprite' ? selectedSpriteId || 'stage' : undefined,
            visible: true, data: Array(t.rows).fill(null).map(() => Array(t.cols).fill('')),
            x: 10 + tableMonitors.length * 20, y: 260 + tableMonitors.length * 30,
            width: 200, height: 150,
        }]);
        addLog(`Created table: ${t.name} (${t.rows}x${t.cols})`);
        setTimeout(() => { workspaceRef.current?.refreshToolboxSelection?.(); }, 50);
    };
    const handleCreateBlock = (block: { name: string; arguments: BlockArgument[]; warp: boolean }) => {
        const ws = workspaceRef.current;
        if (!ws) return;
        Blockly.Events.setGroup(true);
        try {
            let proccode = block.name;
            const argnames: string[] = [], argids: string[] = [];
            block.arguments.forEach(a => {
                if (a.type === 'label') proccode += ` ${a.value}`;
                else { proccode += a.type === 'boolean' ? ' %b' : ' %s'; argnames.push(a.value); argids.push(a.id); }
            });
            const xml = `<xml><block type="procedures_definition" x="50" y="50"><statement name="custom_block"><shadow type="procedures_prototype"><mutation proccode="${proccode.replace(/"/g, '&quot;')}" argumentnames='${JSON.stringify(argnames).replace(/"/g, '&quot;')}' argumentids='${JSON.stringify(argids).replace(/"/g, '&quot;')}' warp="${block.warp}"/></shadow></statement></block></xml>`;
            Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(xml), ws);
            addLog(`Created custom block: ${block.name}`);
        } catch {
            try {
                let mut = '<mutation>';
                block.arguments.forEach(a => { if (a.type !== 'label') mut += `<arg name="${a.value}"></arg>`; });
                Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(`<xml><block type="procedures_defnoreturn" x="50" y="50"><field name="NAME">${block.name}</field>${mut}</mutation></block></xml>`), ws);
            } catch {}
        } finally { Blockly.Events.setGroup(false); }
    };

    // â”€â”€â”€ Monitor visibility (toolbox checkboxes) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    useEffect(() => { (window as any).onToggleVisibility = handleToggleVisibility; }, [handleToggleVisibility]);

    // â”€â”€â”€ Mode switching â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const switchEditorMode = useCallback((newMode: EditorMode) => {
        if (newMode === editorMode) return;
        saveCurrentSpriteWorkspace();
        setEditorMode(newMode);
        if (newMode === 'upload') setWorkspaceTab('blocks');
        addLog(`Switched to ${newMode === 'stage' ? 'Stage' : 'Upload'} Mode`);
    }, [editorMode, addLog, saveCurrentSpriteWorkspace]);

    const handleWorkspaceTabChange = useCallback((newTab: 'blocks' | 'python' | 'costumes' | 'sounds') => {
        if (newTab === workspaceTab) return;
        saveCurrentSpriteWorkspace();
        setWorkspaceTab(newTab);
        addLog(`Switched to ${newTab} tab`);
    }, [workspaceTab, saveCurrentSpriteWorkspace, addLog]);

    // ─── Paint sprite: create blank costume then open costumes tab ─────────────
    const handlePaintSprite = useCallback(async () => {
        if (selectedSpriteId && selectedSpriteId !== 'stage') {
            const sprite = spriteManager.getSprite(selectedSpriteId);
            if (sprite) {
                const canvas = document.createElement('canvas');
                canvas.width = 800; canvas.height = 600;
                const ctx = canvas.getContext('2d');
                if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                const data = canvas.toDataURL('image/png');
                const name = `costume${sprite.costumes.length + 1}`;
                await sprite.addCostume(name, data);
                sprite.switchCostume(sprite.costumes.length - 1);
                triggerUpdate();
                window.dispatchEvent(new Event('leap-stage-update'));
                addLog(`Created blank costume: ${name}`);
            }
        }
        handleWorkspaceTabChange('costumes');
    }, [selectedSpriteId, handleWorkspaceTabChange, triggerUpdate, addLog]);

    // â”€â”€â”€ Undo / Redo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleUndo = useCallback(() => workspaceRef.current?.undo(false), []);
    const handleRedo = useCallback(() => workspaceRef.current?.undo(true), []);

    // â”€â”€â”€ Default sprite init on mount â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    useEffect(() => {
        if (editorMode === 'stage' && sprites.length === 0) {
            const stageSprite = new Sprite('stage', 'Stage', triggerUpdate, 'cat');
            stageSprite.hide();
            spriteWorkspacesRef.current.set('stage', {});
            const defaultSprite = new Sprite('sprite_default', 'Robot', triggerUpdate, 'robot');
            defaultSprite.setX(0); defaultSprite.setY(0);
            spriteWorkspacesRef.current.set('sprite_default', {});
            const load = async () => {
                await defaultSprite.addCostume('idle', 'assets/sprites/robot/robot_idle.svg');
                await defaultSprite.addCostume('wave 1', 'assets/sprites/robot/image-removebg-preview (1).png');
                await defaultSprite.addCostume('wave 2', 'assets/sprites/robot/image-Photoroom.png');
                await defaultSprite.addCostume('talk', 'assets/sprites/robot/image-removebg-preview.png');
                await defaultSprite.addSound('Meow', 'assets/sounds/meow.wav');
                triggerUpdate();
                window.dispatchEvent(new Event('leap-stage-update'));
            };
            animationVM.registerSprite(stageSprite);
            animationVM.registerSprite(defaultSprite);
            setSprites([stageSprite, defaultSprite]);
            setSelectedSpriteId('sprite_default');
            activeSpriteIdRef.current = 'sprite_default';
            load().catch(console.error);
        }
    }, [editorMode]);

    // â”€â”€â”€ Misc effects â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    useEffect(() => { if (openTab && openTab !== workspaceTab) setWorkspaceTab(openTab); }, [openTab]);
    useEffect(() => { if (appMode === 'python' && onOpenPython) onOpenPython(); }, [appMode, onOpenPython]);
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const el = document.activeElement;
            if (el?.classList.contains('blocklyHtmlInput') && !el.contains(e.target as Node)) {
                (el as HTMLElement).blur();
                Blockly.WidgetDiv?.hide();
            }
        };
        window.addEventListener('mousedown', handler);
        return () => window.removeEventListener('mousedown', handler);
    }, []);

    // â”€â”€â”€ Workspace listener attachment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    useEffect(() => {
        const ws = workspaceRef.current;
        if (!ws) return;
        ws.addChangeListener(handleWorkspaceChange);
        ws.addChangeListener(handleBlockInteraction);
        animationVM.onHighlightBlock = (spriteId: string, blockId: string) => {
            if (workspaceRef.current && spriteId === selectedSpriteId)
                (workspaceRef.current as any).highlightBlock(blockId);
        };
        if (sprites.length > 0 && selectedSpriteId)
            handleWorkspaceChange({ isUiEvent: false } as Blockly.Events.Abstract);
        return () => {
            ws.removeChangeListener(handleWorkspaceChange);
            ws.removeChangeListener(handleBlockInteraction);
            (ws as any).highlightBlock?.(null);
        };
    }, [selectedSpriteId, handleWorkspaceChange, handleBlockInteraction, sprites.length]);

    useEffect(() => {
        if (!blocklyDiv.current) return;
        const ro = new ResizeObserver(() => {
            if (workspaceRef.current) Blockly.svgResize(workspaceRef.current as Blockly.WorkspaceSvg);
        });
        ro.observe(blocklyDiv.current);
        return () => ro.disconnect();
    }, [blocklyDiv, workspaceRef]);


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
            onShowVariable: (name: string) => (window as any).onToggleVisibility?.(name, 'variable', true),
            onHideVariable: (name: string) => (window as any).onToggleVisibility?.(name, 'variable', false),
            onShowList: (name: string) => (window as any).onToggleVisibility?.(name, 'list', true),
            onHideList: (name: string) => (window as any).onToggleVisibility?.(name, 'list', false),
            onShowTable: (name: string) => (window as any).onToggleVisibility?.(name, 'table', true),
            onHideTable: (name: string) => (window as any).onToggleVisibility?.(name, 'table', false),
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
        // getVariableVisibility reads from _monitors_for_sync which is kept fresh by useMonitors.
        // onToggleVisibility is set by the useEffect at the top of the component (line ~667).
        (window as any).getVariableVisibility = (name: string, type: string) => {
            const currentMonitors = (window as any)._monitors_for_sync?.[type] || [];
            const monitor = currentMonitors.find((m: any) => m.name === name);
            return monitor ? monitor.visible : false;
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





    // Update toolbox and selected category contents when sprite or monitor state changes

    useEffect(() => {
        if (!workspaceRef.current || appMode !== 'blocks') {
            return;
        }

        const nextToolboxConfig = getCurrentToolbox();
        const nextToolboxJson = JSON.stringify(nextToolboxConfig);
        const currentToolbox = workspaceRef.current.getToolbox() as any;
        const selectedCategoryName = typeof currentToolbox?.getSelectedItem?.()?.getName === 'function'
            ? currentToolbox.getSelectedItem().getName()
            : null;

        // Always update the toolbox when the sprite changes so dynamic dropdowns
        // (e.g. sound, costume) refresh with the new sprite's values.
        if (nextToolboxJson !== lastToolboxJsonRef.current) {
            console.log('[APP] Updating toolbox dynamically (Sprite:', selectedSpriteId, ')');
            lastToolboxJsonRef.current = nextToolboxJson;
        }
        try {
            workspaceRef.current.updateToolbox(nextToolboxConfig);

            const refreshedToolbox = workspaceRef.current.getToolbox() as any;
            const toolboxItems = typeof refreshedToolbox?.getToolboxItems === 'function'
                ? refreshedToolbox.getToolboxItems().filter((item: any) => typeof item?.getName === 'function')
                : [];

            // Only restore the selected category if the flyout was already open.
            // This preserves the toggle behavior — don't force-open on toolbox refresh.
            const flyoutIsOpen = !!(workspaceRef.current.getFlyout() as any)?.isVisible?.();
            if (flyoutIsOpen && selectedCategoryName && toolboxItems.length > 0) {
                const matchingIdx = toolboxItems.findIndex((item: any) => item.getName() === selectedCategoryName);
                if (matchingIdx >= 0) {
                    refreshedToolbox.selectItemByPosition(matchingIdx);
                }
            }
        } catch (e) {
            console.warn('[APP] Toolbox update error (non-fatal):', e);
        }
    }, [selectedSpriteId, editorMode, appMode, getCurrentToolbox, variableMonitors, listMonitors, tableMonitors]);



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

                    // Ensure blocks, renderer, and custom toolbox category are registered before inject
                    initBlocklyOnce();

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

                    // ── TOOLBOX CATEGORY CLICK FIX ──────────────────────────────────────
                    // The prototype-level patch in runtime.ts handles the toggle-close fix.
                    // Here we just ensure the first category is selected/visible on init.
                    const toolboxInst = blocksWorkspace.getToolbox() as any;
                    if (toolboxInst) {
                        // Select the first category by default so flyout is open on load
                        setTimeout(() => {
                            const items = toolboxInst.getToolboxItems?.();
                            if (items && items.length > 0 && !toolboxInst.getSelectedItem?.()) {
                                toolboxInst.selectItemByPosition?.(0);
                            }
                        }, 100);
                    }

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
                                // Performance: Only run logic if we are on a reporter checkbox block, not during disposal, and not in flyout
                                if (block && !block.isDisposed() && !block.workspace?.isFlyout && (block.type === 'variable_reporter_checkbox' || block.type === 'list_reporter_checkbox' || block.type === 'sensing_reporter_checkbox')) {
                                    const isSensing = block.type === 'sensing_reporter_checkbox';
                                    const type = isSensing ? 'sensing' : (block.type === 'variable_reporter_checkbox' ? 'variable' : 'list');
                                    const nameField = isSensing ? 'VARIABLE' : (type === 'variable' ? 'VARIABLE' : 'LIST');

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

                            // flyout.autoClose is left as default (true) — flyout closes when clicking workspace

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

                        // 5. CLICK-TO-TOGGLE FLYOUT
                        // Clicking the same category again closes the flyout (toggle behavior).
                        // Clicking a different category opens that category's flyout.
                        let _lastSelectedCategoryId: string | null = null;
                        blocksWorkspace.addChangeListener((event: any) => {
                            if (event.type === Blockly.Events.TOOLBOX_ITEM_SELECT) {
                                const newItem = (event as any).newItem;
                                const toolbox = blocksWorkspace.getToolbox() as any;
                                if (!toolbox) return;
                                if (newItem) {
                                    // A category was selected
                                    const newId = typeof newItem === 'string' ? newItem : newItem?.getId?.();
                                    if (newId && newId === _lastSelectedCategoryId) {
                                        // Same category clicked again — close the flyout
                                        toolbox.clearSelection?.();
                                        _lastSelectedCategoryId = null;
                                    } else {
                                        _lastSelectedCategoryId = newId ?? null;
                                    }
                                } else {
                                    // Flyout was closed (e.g. clicked workspace) — clear tracking
                                    _lastSelectedCategoryId = null;
                                }
                            }
                        });

                    }

                    // 6. HOVER-TO-PEEK: show flyout on toolbox hover, hide on mouse leave
                    // When user hovers over the narrow toolbox, the flyout peeks open.
                    // When mouse leaves both toolbox and flyout, it closes.
                    {
                        const toolboxEl = blocklyDiv.current?.querySelector('.blocklyToolboxDiv') as HTMLElement | null;
                        let hoverOpenTimer: ReturnType<typeof setTimeout> | null = null;
                        let hoverCloseTimer: ReturnType<typeof setTimeout> | null = null;
                        let isHoverOpen = false;
                        let isCategoryClickOpen = false;

                        // Track whether flyout was opened by a click (not hover)
                        blocksWorkspace.addChangeListener((event: any) => {
                            if (event.type === Blockly.Events.TOOLBOX_ITEM_SELECT) {
                                isCategoryClickOpen = !!(event as any).newItem;
                                if (isCategoryClickOpen) isHoverOpen = false;
                            }
                        });

                        const openFlyoutOnHover = () => {
                            if (isCategoryClickOpen) return; // click-opened flyout takes priority
                            if (hoverCloseTimer) { clearTimeout(hoverCloseTimer); hoverCloseTimer = null; }
                            if (isHoverOpen) return;
                            hoverOpenTimer = setTimeout(() => {
                                const toolbox = blocksWorkspace.getToolbox() as any;
                                if (!toolbox || isCategoryClickOpen) return;
                                // Select first category to show flyout
                                const items = toolbox.getToolboxItems?.() || [];
                                const firstCat = items.find((i: any) => typeof i.getName === 'function');
                                if (firstCat) {
                                    toolbox.setSelectedItem(firstCat);
                                    isHoverOpen = true;
                                }
                            }, 120); // small delay to avoid flicker
                        };

                        const closeFlyoutOnHoverLeave = () => {
                            if (isCategoryClickOpen) return;
                            if (hoverOpenTimer) { clearTimeout(hoverOpenTimer); hoverOpenTimer = null; }
                            hoverCloseTimer = setTimeout(() => {
                                if (isCategoryClickOpen) return;
                                const toolbox = blocksWorkspace.getToolbox() as any;
                                toolbox?.clearSelection?.();
                                isHoverOpen = false;
                            }, 200);
                        };

                        const cancelClose = () => {
                            if (hoverCloseTimer) { clearTimeout(hoverCloseTimer); hoverCloseTimer = null; }
                        };

                        if (toolboxEl) {
                            toolboxEl.addEventListener('mouseenter', openFlyoutOnHover);
                            toolboxEl.addEventListener('mouseleave', closeFlyoutOnHoverLeave);
                        }

                        // Also keep flyout open when mouse is over the flyout itself
                        const flyoutSvg = blocksWorkspace.getFlyout()?.svgGroup_ as SVGElement | null;
                        if (flyoutSvg) {
                            flyoutSvg.addEventListener('mouseenter', cancelClose);
                            flyoutSvg.addEventListener('mouseleave', closeFlyoutOnHoverLeave);
                        }
                    }






                    // Auto-select first toolbox category on load (flyout stays closed until user clicks)
                    setTimeout(() => {
                        if (workspaceRef.current) {
                            const toolbox = workspaceRef.current.getToolbox() as any;
                            if (toolbox) {
                                // Just highlight the first category without opening the flyout
                                // The flyout will open when the user clicks a category
                                const items = toolbox.getToolboxItems?.() || [];
                                if (items.length > 0 && items[0]?.setSelected) {
                                    items[0].setSelected(true);
                                }
                            }
                        }
                    }, 50);



                    // Register custom variable category callback
                    workspaceRef.current.registerToolboxCategoryCallback('LEAP_VARIABLES', (ws: any) => {
                        const contents: any[] = [];

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

                        // Add variable blocks Î“Ã‡Ã¶ use the first variable alphabetically as default
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



                    // Î“Ã¶Ã‡Î“Ã¶Ã‡ ATTACH LISTENERS Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡Î“Ã¶Ã‡

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

        ws.addChangeListener(currentWsChange);
        ws.addChangeListener(currentBlockInteract);

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
            // Clear highlighting when switching or unmounting
            // @ts-ignore
            ws.highlightBlock(null);
        };
    }, [selectedSpriteId, handleWorkspaceChange, handleBlockInteraction, sprites.length]);



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



    // Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰

    // RENDER

    // Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰Î“Ã²Ã‰



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

                    {appMode === 'notebook' && 'â‰¡Æ’Ã´Ã´ Py Notebook'}

                    {appMode === 'ml' && 'â‰¡Æ’ÂºÃ¡ Machine Learning'}

                    {appMode === 'xr' && 'â‰¡Æ’Ã®Ã‰ 3D & XR Studio'}

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

                    Î“Ã¥Ã‰ Back to Editor

                </button>

            </div>

        );

    }



    // ─── Main Block Editor UI ─────────────────────────────────────────────────
    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            height: '100vh', width: '100vw',
            overflow: 'hidden', backgroundColor: '#f5f5f5',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        }}>
            {/* ── Global CSS overrides ─────────────────────────────────────── */}
            <style>{`
                .blocklyToolboxDiv { top: 0 !important; padding-top: 0 !important; }
                .blocklyFlyout { top: 0 !important; }
                .right-panel-responsive { display: flex !important; flex-direction: column !important; overflow: hidden !important; }
                .stage-container-responsive { flex-shrink: 0 !important; }
                .hide-flyout .blocklyFlyout { display: none !important; }
                @media (max-width: 1024px) { .right-panel-responsive { width: 380px !important; } }
                @media (max-width: 768px) { .main-container-responsive { flex-direction: column !important; } }
            `}</style>

            {/* ── Top MenuBar ──────────────────────────────────────────────── */}
            <MenuBar
                onBack={onBack}
                projectName={projectName}
                onProjectNameChange={setProjectName}
                mode={editorMode}
                onModeChange={(m: string) => switchEditorMode(m as EditorMode)}
                selectedBoard={selectedBoardName}
                onBoardSelect={() => setIsBoardModalOpen(true)}
                connectionStatus={isConnected ? 'connected' : 'disconnected'}
                onConnect={handleConnect}
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
                onEditAction={(action: string) => addLog(`Edit: ${action}`)}
            />

            {/* ── Workspace Tabs + Stage Controls toolbar ───────────────────── */}
            <EmbedToolbar
                appMode={appMode}
                editorMode={editorMode}
                workspaceTab={workspaceTab}
                selectedSpriteId={selectedSpriteId}
                sprites={sprites}
                isRunning={isRunning}
                isCameraOn={isCameraOn}
                showGrid={showGrid}
                stageLayout={stageLayout}
                isFullscreen={isFullscreen}
                onTabChange={handleWorkspaceTabChange}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onRun={handleRunClick}
                onStop={handleStopClick}
                onToggleCamera={() => setIsCameraOn(prev => !prev)}
                onToggleGrid={() => setShowGrid(prev => !prev)}
                onLayoutChange={setStageLayout}
                onFullscreen={handleFullscreen}
                onOpenPython={onOpenPython}
            />

            {/* ── Main content row: [Blockly workspace] + [Right panel] ─────── */}
            <div style={styles.main} className="main-container-responsive">

                {/* ── LEFT: Blockly workspace ──────────────────────────────── */}
                <div style={styles.workspaceContainer} className="workspace-container-responsive">

                    {/* Blockly canvas — shown in Blocks tab (both modes) */}
                    {((editorMode === 'stage' && workspaceTab === 'blocks') || editorMode === 'upload') && (
                        <>
                            {/* The Blockly div — toolbox auto-populates from getCurrentToolbox():
                                • Stage mode  → animationToolbox (Events/Motion/Looks/Sound/Control/Sensing/Operators/Variables/My Blocks)
                                • Upload mode → arduinoToolbox   (Events/Control/Digital/Analog/Sensors/Actuators/Serial/My Blocks) */}
                            <div
                                ref={blocklyDiv}
                                className={editorMode === 'stage' && workspaceTab !== 'blocks' ? 'hide-flyout' : ''}
                                style={styles.blockly}
                            />

                            {/* Add Extension button (stage mode only) */}
                            {editorMode === 'stage' && (
                                <div className="absolute bottom-3 left-3 z-[100] add-extension-btn-container">
                                    <button
                                        onClick={() => setShowExtensionLibrary(true)}
                                        className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl"
                                        style={{ width: '52px', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', backdropFilter: 'blur(10px)' }}
                                        onMouseEnter={e => { e.currentTarget.style.width = '180px'; e.currentTarget.style.paddingRight = '16px'; }}
                                        onMouseLeave={e => { e.currentTarget.style.width = '52px'; e.currentTarget.style.paddingRight = '12px'; }}
                                        title="Add Extension"
                                    >
                                        <div className="w-8 h-8 flex items-center justify-center text-white flex-shrink-0">
                                            <Library size={20} strokeWidth={2.5} />
                                        </div>
                                        <div className="text-left whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="text-xs font-semibold text-white leading-tight">Extensions</div>
                                            <div className="text-[10px] text-white/80 leading-tight">Add blocks</div>
                                        </div>
                                    </button>
                                </div>
                            )}

                            {/* Workspace zoom controls + trash */}
                            <WorkspaceControls
                                workspaceRef={workspaceRef}
                                onAfterZoom={() => {
                                    const flyout = workspaceRef.current?.getFlyout() as any;
                                    if (flyout?.getWorkspace()) flyout.getWorkspace().setScale(1.0);
                                }}
                                style={undefined}
                            />
                            <WorkspaceTrash workspaceRef={workspaceRef} />
                        </>
                    )}

                    {/* Python tab — stage mode only */}
                    {editorMode === 'stage' && workspaceTab === 'python' && (
                        <div style={styles.pythonEditor}>
                            <PythonEditorTab
                                workspace={workspaceRef.current}
                                onOpenFullIDE={() => setAppMode('python')}
                            />
                        </div>
                    )}

                    {/* Costumes tab — stage mode only */}
                    {editorMode === 'stage' && workspaceTab === 'costumes' && (
                        <div style={styles.costumesEditor}>
                            <React.Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>}>
                                <CostumesTab
                                    selectedSpriteId={selectedSpriteId}
                                    sprites={sprites}
                                    stageManager={stageManager}
                                    addLog={addLog}
                                    onClose={() => handleWorkspaceTabChange('blocks')}
                                    onOpenLibrary={selectedSpriteId === 'stage'
                                        ? () => setShowBackdropLibrary(true)
                                        : () => setShowSpriteLibrary(true)}
                                />
                            </React.Suspense>
                        </div>
                    )}

                    {/* Sounds tab — stage mode only */}
                    {editorMode === 'stage' && workspaceTab === 'sounds' && (
                        <div style={styles.soundsEditor}>
                            <React.Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>}>
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

                {/* Hide right panel when in costumes/sounds tab — those editors need full width */}
                {!(editorMode === 'stage' && (workspaceTab === 'costumes' || workspaceTab === 'sounds')) && (
                <EmbedRightPanel
                    editorMode={editorMode}
                    stageLayout={stageLayout}
                    isFullscreen={isFullscreen}
                    fullscreenScale={fullscreenScale}
                    stageContainerRef={stageContainerRef}
                    sprites={sprites}
                    selectedSpriteId={selectedSpriteId}
                    stageManager={stageManager}
                    backdropRefresh={backdropRefresh}
                    isCameraOn={isCameraOn}
                    showGrid={showGrid}
                    isRunning={isRunning}
                    askState={askState}
                    onAskSubmit={handleAskSubmit}
                    onSelectSprite={handleSpriteSelect}
                    onSpriteClick={handleSpriteClick}
                    onAddSprite={addSprite}
                    onDeleteSprite={deleteSprite}
                    onRemoveBackground={handleRemoveBackground}
                    onOpenSpriteLibrary={() => setShowSpriteLibrary(true)}
                    onOpenBackdropLibrary={() => setShowBackdropLibrary(true)}
                    onPaintSprite={handlePaintSprite}
                    onUploadSprite={addSpriteFromLibrary}
                    variableMonitors={variableMonitors}
                    listMonitors={listMonitors}
                    tableMonitors={tableMonitors}
                    sensingMonitors={sensingMonitors}
                    onMonitorPositionChange={handleMonitorPositionChange}
                    onMonitorResize={handleMonitorResize}
                    onMonitorBringToFront={handleMonitorBringToFront}
                    onVariableModeChange={handleVariableModeChange}
                    onVariableValueChange={handleVariableValueChange}
                    onVariableSliderRangeChange={handleVariableSliderRangeChange}
                    onShowVariable={(n) => (window as any).onToggleVisibility?.(n, 'variable', true)}
                    onHideVariable={(n) => (window as any).onToggleVisibility?.(n, 'variable', false)}
                    onShowList={(n) => (window as any).onToggleVisibility?.(n, 'list', true)}
                    onHideList={(n) => (window as any).onToggleVisibility?.(n, 'list', false)}
                    onShowTable={(n) => (window as any).onToggleVisibility?.(n, 'table', true)}
                    onHideTable={(n) => (window as any).onToggleVisibility?.(n, 'table', false)}
                    generatedCode={generatedCode}
                    logMessages={logMessages}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    serialMessages={serialMessages}
                    baudRate={baudRate}
                    setBaudRate={setBaudRate}
                    lineEnding={lineEnding}
                    setLineEnding={setLineEnding}
                    isConnected={isConnected}
                    onSendSerial={handleSendSerial}
                    onUpload={handleUpload}
                    onRun={handleRunClick}
                    onStop={handleStopClick}
                    onExitFullscreen={handleFullscreen}
                />
                )}
            </div>

            {/* ── All modals and dialogs ────────────────────────────────────── */}
            <EmbedDialogs
                workspace={workspaceRef.current}
                selectedSpriteId={selectedSpriteId}
                isMakeVariableOpen={isMakeVariableOpen}
                setIsMakeVariableOpen={setIsMakeVariableOpen}
                isMakeListOpen={isMakeListOpen}
                setIsMakeListOpen={setIsMakeListOpen}
                isMakeTableOpen={isMakeTableOpen}
                setIsMakeTableOpen={setIsMakeTableOpen}
                isMakeBlockOpen={isMakeBlockOpen}
                setIsMakeBlockOpen={setIsMakeBlockOpen}
                onCreateVariable={handleCreateVariable}
                onCreateList={handleCreateList}
                onCreateTable={handleCreateTable}
                onCreateBlock={handleCreateBlock}
                isBoardModalOpen={isBoardModalOpen}
                setIsBoardModalOpen={setIsBoardModalOpen}
                selectedBoard={selectedBoard}
                onSelectBoard={(id, name) => { setSelectedBoard(id); setSelectedBoardName(name); setIsBoardModalOpen(false); }}
                showSpriteLibrary={showSpriteLibrary}
                setShowSpriteLibrary={setShowSpriteLibrary}
                showBackdropLibrary={showBackdropLibrary}
                setShowBackdropLibrary={setShowBackdropLibrary}
                showExtensionLibrary={showExtensionLibrary}
                setShowExtensionLibrary={setShowExtensionLibrary}
                onSelectSprite={async (entry: any) => { await addSpriteFromLibrary(entry); setShowSpriteLibrary(false); }}
                onPaintSprite={() => setShowSpriteLibrary(false)}
                onSelectBackdrop={handleBackdropSelect}
                onAddExtension={handleAddExtension}
                installedExtensions={installedExtensions}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
                showUnsavedModal={showUnsavedModal}
                onConfirmUnsaved={confirmUnsavedAction}
                onCancelUnsaved={() => setShowUnsavedModal(false)}
            />

            {/* ── Custom Blockly prompt dialog ──────────────────────────────── */}
            {promptState.isOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalTitle}>
                            <span>{promptState.message}</span>
                            <button onClick={handlePromptCancel} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 18 }}>✕</button>
                        </div>
                        <div style={{ padding: '16px' }}>
                            <input
                                style={styles.modalInput}
                                value={promptInput}
                                onChange={e => setPromptInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handlePromptSubmit(); if (e.key === 'Escape') handlePromptCancel(); }}
                                autoFocus
                            />
                        </div>
                        <div style={{ ...styles.modalButtons, padding: '0 16px 16px' }}>
                            <button style={styles.modalCancel} onClick={handlePromptCancel}>Cancel</button>
                            <button style={styles.modalSubmit} onClick={handlePromptSubmit}>OK</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

};

export default IntermediateApp;
