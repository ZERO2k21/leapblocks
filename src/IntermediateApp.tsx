import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as Blockly from 'blockly';
import { arduinoBlocks, arduinoToolbox } from './blocks/arduino-blocks';
import { animationBlocks, animationToolbox } from './blocks/animation-blocks';
import { hardwareBlocks } from './blocks/hardware-blocks';
import { arduinoGenerator } from './generators/arduino-generator';
import { AnimationCompiler } from './generators/animation-generator';
import { animationVM, CompiledScript } from './vm/AnimationVM';
import { Sprite, SpriteType } from './stage/Sprite';
import Stage from './stage/Stage';
import SpritePanel from './stage/SpritePanel';
import './custom-toolbox';

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
    const [generatedCode, setGeneratedCode] = useState<string>('// Select blocks to generate code');
    const [activeTab, setActiveTab] = useState<'log' | 'serial'>('log');
    const [workspaceTab, setWorkspaceTab] = useState<'blocks' | 'python' | 'costumes' | 'sounds'>('blocks');
    const [logMessages, setLogMessages] = useState<string[]>(['Ready']);
    const [isRunning, setIsRunning] = useState(false);

    // Sprites
    const [sprites, setSprites] = useState<Sprite[]>([]);
    const [selectedSpriteId, setSelectedSpriteId] = useState<string | null>(null);
    const [compiledScripts, setCompiledScripts] = useState<CompiledScript[]>([]);

    // Hardware
    const [ports, setPorts] = useState<{ path: string; manufacturer?: string }[]>([]);
    const [selectedPort, setSelectedPort] = useState<string>('');
    const [isConnected, setIsConnected] = useState(false);
    const [serialMessages, setSerialMessages] = useState<string[]>([]);
    const [serialInput, setSerialInput] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>('');

    // Force re-render for sprite updates
    const [, forceUpdate] = useState({});
    const triggerUpdate = useCallback(() => forceUpdate({}), []);

    // ═══════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════
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
        return editorMode === 'stage' ? animationToolbox : arduinoToolbox;
    }, [editorMode]);

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
        } catch (e) {
            console.error('[APP] Code generation error:', e);
            log.generator('Code generation error', e);
        }
    }, [editorMode, appMode, sprites, selectedSpriteId]);

    // ═══════════════════════════════════════════════════════════════════════
    // MODE SWITCHING
    // ═══════════════════════════════════════════════════════════════════════
    const switchEditorMode = useCallback((newMode: EditorMode) => {
        if (newMode === editorMode) return;

        setEditorMode(newMode);
        addLog(`Switched to ${newMode === 'stage' ? 'Stage' : 'Upload'} Mode`);

        // Note: The workspace injection will be handled by the useEffect dependent on editorMode
    }, [editorMode, addLog]);

    // ═══════════════════════════════════════════════════════════════════════
    // SPRITE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    const addSprite = useCallback((spriteType: SpriteType = 'cat') => {
        const id = `sprite_${Date.now()}`;
        const typeNames: Record<SpriteType, string> = { cat: 'Cat', ball: 'Ball', arrow: 'Arrow', robot: 'Robot' };
        const name = `${typeNames[spriteType]} ${sprites.filter(s => s.spriteType === spriteType).length + 1}`;
        const newSprite = new Sprite(id, name, triggerUpdate, spriteType);

        animationVM.registerSprite(newSprite);
        setSprites(prev => [...prev, newSprite]);
        setSelectedSpriteId(id);
        addLog(`Added sprite: ${name}`);
    }, [sprites, addLog, triggerUpdate]);

    const deleteSprite = useCallback((id: string) => {
        animationVM.unregisterSprite(id);
        setSprites(prev => prev.filter(s => s.id !== id));
        if (selectedSpriteId === id) {
            setSelectedSpriteId(sprites.length > 1 ? sprites[0].id : null);
        }
        addLog('Deleted sprite');
    }, [sprites, selectedSpriteId, addLog]);

    // ═══════════════════════════════════════════════════════════════════════
    // ANIMATION CONTROLS
    // ═══════════════════════════════════════════════════════════════════════
    const handleRunClick = useCallback(() => {
        console.log('[APP] ══════════════════════════════════════════');
        console.log('[APP] Run button clicked');
        console.log('[APP] compiledScripts:', compiledScripts.length);
        console.log('[APP] Selected sprite:', selectedSpriteId);
        console.log('[APP] All sprites:', sprites.map(s => ({ id: s.id, name: s.name })));

        if (compiledScripts.length === 0) {
            console.log('[APP] ✗ No scripts to run!');
            addLog('No scripts to run!');
            return;
        }

        console.log('[APP] Scripts to run:');
        compiledScripts.forEach((s, i) => {
            console.log(`[APP]   ${i}: trigger=${s.trigger}, spriteId=${s.spriteId}, steps=${s.steps.length}`);
        });

        setIsRunning(true);
        animationVM.triggerFlag(compiledScripts);
        addLog('Started animation');
        console.log('[APP] ══════════════════════════════════════════');
    }, [compiledScripts, addLog, selectedSpriteId, sprites]);

    const handleStopClick = useCallback(() => {
        setIsRunning(false);
        animationVM.stopAll();
        addLog('Stopped animation');
    }, [addLog]);

    // ═══════════════════════════════════════════════════════════════════════
    // HARDWARE CONTROLS
    // ═══════════════════════════════════════════════════════════════════════
    const refreshPorts = useCallback(async () => {
        try {
            const portList = await window.electronAPI.getPorts();
            setPorts(portList);
            addLog(`Found ${portList.length} port(s)`);
        } catch (e) {
            addLog('Failed to scan ports');
        }
    }, [addLog]);

    const handleConnect = useCallback(async () => {
        if (!selectedPort) {
            addLog('Select a port first');
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
                const result = await window.electronAPI.connectPort(selectedPort, 115200);
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
    }, [selectedPort, isConnected, addLog]);

    const handleSendSerial = useCallback(async () => {
        if (!serialInput.trim() || !isConnected) return;
        try {
            await window.electronAPI.sendSerial(serialInput + '\n');
            setSerialMessages(prev => [...prev.slice(-100), `> ${serialInput}`]);
            setSerialInput('');
        } catch (e) {
            addLog('Failed to send');
        }
    }, [serialInput, isConnected, addLog]);

    const handleUpload = useCallback(async () => {
        if (!generatedCode || isUploading) return;
        setIsUploading(true);
        setUploadProgress('Uploading...');
        addLog('Starting upload...');
        try {
            const result = await window.electronAPI.uploadCode(generatedCode, selectedPort || undefined);
            if (result.success) {
                addLog('Upload complete!');
                setUploadProgress('Upload complete!');
            } else {
                addLog(`Upload failed: ${result.error}`);
                setUploadProgress(`Failed: ${result.error}`);
            }
        } catch (e) {
            addLog('Upload error');
            setUploadProgress('Upload error');
        }
        setIsUploading(false);
    }, [generatedCode, isUploading, addLog, selectedPort]);

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    // Create default sprite FIRST (before workspace) so it's available for compilation
    useEffect(() => {
        if (editorMode === 'stage' && sprites.length === 0) {
            console.log('[APP] Creating default sprite...');
            const defaultSprite = new Sprite('sprite_default', 'Cat', triggerUpdate);
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
                theme: Blockly.Theme.defineTheme('leapblocks', {
                    name: 'leapblocks',
                    base: 'classic',
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

            // Trigger an initial recompile with the current workspace state
            if (sprites.length > 0 && selectedSpriteId) {
                console.log('[APP] Sprites/selection changed, triggering recompile...');
                handleWorkspaceChange({ isUiEvent: false } as Blockly.Events.Abstract);
            }
        }
    }, [sprites, selectedSpriteId, handleWorkspaceChange]);

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
                    workspaceRef.current = Blockly.inject(blocklyDiv.current, {
                        toolbox: getCurrentToolbox(),
                        grid: { spacing: 20, length: 3, colour: '#e8e8e8', snap: true },
                        zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
                        trashcan: true,
                        sounds: false,
                        theme: Blockly.Theme.defineTheme('leapblocks', {
                            name: 'leapblocks',
                            base: 'classic',
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

                    const workspace = workspaceRef.current; // Alias for clarity

                    // Register custom variable category callback
                    workspaceRef.current.registerToolboxCategoryCallback('LEAP_VARIABLES', (workspace: any) => {
                        const xmlList: Element[] = [];
                        const btn = document.createElement('button');
                        btn.setAttribute('text', 'Make a Variable');
                        btn.setAttribute('callbackKey', 'CREATE_VARIABLE');
                        xmlList.push(btn); // Standard vars button

                        const allVars = workspace.getAllVariables() || [];
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
                                field.textContent = v.name;
                                block.appendChild(field);
                                xmlList.push(block);
                            });

                            const blockTypes = [
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
                                    field.textContent = defaultVar.name;
                                    block.appendChild(field);
                                }
                                if (type === 'data_setvariableto' || type === 'data_changevariableby') {
                                    const value = document.createElement('value');
                                    value.setAttribute('name', 'VALUE');
                                    const shadow = document.createElement('shadow');
                                    shadow.setAttribute('type', 'math_number');
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
                        setVariableType('Number');
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
            {/* Home Button */}
            {/* Home Button */}
            <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center' }}>
                <button
                    onClick={onBack}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#6C4BB4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    🏠 Home
                </button>
            </div>


            {/* Header */}
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <span style={styles.logo}>
                        🔌 LeapBlocks
                    </span>
                    <nav style={styles.nav}>
                        <span style={styles.navItem}>File</span>
                        <span style={styles.navItem}>Edit</span>
                        <span style={styles.navItem}>Tutorials</span>
                        {editorMode === 'upload' && <span style={styles.navItem}>Board</span>}
                    </nav>
                    <div style={styles.projectName}>
                        <span>📁</span>
                        <input type="text" defaultValue="My Project" style={styles.projectInput} />
                    </div>
                </div>
                <div style={styles.headerRight}>
                    {/* Mode Toggle - Only show for regular blocks mode */}
                    {appMode === 'blocks' && (
                        <>
                            <button
                                style={editorMode === 'stage' ? styles.modeButtonActive : styles.modeButton}
                                onClick={() => switchEditorMode('stage')}
                            >
                                🎭 Stage
                            </button>
                            <button
                                style={editorMode === 'upload' ? styles.modeButtonActive : styles.modeButton}
                                onClick={() => switchEditorMode('upload')}
                            >
                                ⬆️ Upload
                            </button>
                        </>
                    )}

                    {/* Hardware controls - available in both modes */}
                    <div style={styles.headerDivider} />
                    <button
                        style={styles.refreshButton}
                        onClick={refreshPorts}
                        title="Refresh ports"
                    >
                        🔄
                    </button>
                    <select
                        style={styles.portSelect}
                        value={selectedPort}
                        onChange={(e) => setSelectedPort(e.target.value)}
                    >
                        <option value="">Select Port</option>
                        {ports.map(p => (
                            <option key={p.path} value={p.path}>
                                {p.path}{p.manufacturer ? ` (${p.manufacturer})` : ''}
                            </option>
                        ))}
                    </select>
                    <button
                        style={isConnected ? styles.connectedButton : styles.connectButton}
                        onClick={handleConnect}
                    >
                        {isConnected ? '🔗 Connected' : '🔌 Connect'}
                    </button>

                    {/* Upload button - only in Upload mode */}
                    {editorMode === 'upload' && (
                        <button
                            style={isUploading ? styles.uploadButtonDisabled : styles.uploadButton}
                            onClick={handleUpload}
                            disabled={isUploading}
                        >
                            {isUploading ? '⏳ Uploading...' : '📤 Upload'}
                        </button>
                    )}

                    <span style={styles.headerIcon}>⚙️</span>
                </div>
            </header>

            {/* Main Content */}
            <div style={styles.main}>
                {/* Blockly Workspace with Tabs */}
                <div style={styles.workspaceContainer}>
                    {/* PictoBlox-style tabs - ONLY in Stage Mode */}
                    {appMode === 'blocks' && editorMode === 'stage' && (
                        <div style={styles.tabBar}>
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
                    )}

                    {/* Workspace content */}
                    {/* Show Blockly if:
                        1. In Stage mode AND 'blocks' tab is active
                        2. In Upload mode (always shows blocks)
                    */}
                    {((editorMode === 'stage' && workspaceTab === 'blocks') || editorMode === 'upload') && (
                        <div ref={blocklyDiv} style={styles.blockly} />
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
                            <div style={styles.costumePlaceholder}>
                                <span style={{ fontSize: '48px' }}>🎨</span>
                                <h3>Costumes Editor</h3>
                                <p>Coming soon! Draw and edit sprite costumes.</p>
                            </div>
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
                            <div style={styles.stageContainer}>
                                <div style={styles.stageHeader}>
                                    <span>🎬 Stage</span>
                                    <div>
                                        <button
                                            style={styles.flagButton}
                                            onClick={handleRunClick}
                                            title="Run"
                                        >
                                            🏳️▶
                                        </button>
                                        <button
                                            style={styles.stopButtonSmall}
                                            onClick={handleStopClick}
                                            title="Stop"
                                        >
                                            🛑
                                        </button>
                                    </div>
                                </div>
                                <Stage
                                    width={320}
                                    height={240}
                                    sprites={sprites}
                                    isRunning={isRunning}
                                />
                            </div>

                            {/* Sprite Panel */}
                            <SpritePanel
                                sprites={sprites}
                                selectedSpriteId={selectedSpriteId}
                                onSelectSprite={setSelectedSpriteId}
                                onAddSprite={addSprite}
                                onDeleteSprite={deleteSprite}
                            />
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

                    {/* Bottom tabs */}
                    <div style={styles.bottomTabs}>
                        <button
                            style={activeTab === 'log' ? styles.bottomTabActive : styles.bottomTab}
                            onClick={() => setActiveTab('log')}
                        >⏩ Log</button>
                        <button
                            style={activeTab === 'serial' ? styles.bottomTabActive : styles.bottomTab}
                            onClick={() => setActiveTab('serial')}
                        >📟 Serial</button>
                    </div>
                    <div style={styles.logArea}>
                        {activeTab === 'log' ? (
                            logMessages.map((msg, i) => <div key={i} style={styles.logLine}>{msg}</div>)
                        ) : (
                            <div style={styles.serialContainer}>
                                <div style={styles.serialMessages}>
                                    {serialMessages.length > 0 ? (
                                        serialMessages.map((msg, i) => (
                                            <div key={i} style={styles.serialLine}>{msg}</div>
                                        ))
                                    ) : (
                                        <div style={styles.serialPlaceholder}>
                                            {isConnected ? 'Waiting for data...' : 'Connect to a device to see serial data'}
                                        </div>
                                    )}
                                </div>
                                <div style={styles.serialInputRow}>
                                    <input
                                        type="text"
                                        value={serialInput}
                                        onChange={(e) => setSerialInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendSerial()}
                                        placeholder="Send data..."
                                        style={styles.serialInput}
                                        disabled={!isConnected}
                                    />
                                    <button
                                        style={styles.sendButton}
                                        onClick={handleSendSerial}
                                        disabled={!isConnected}
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Prompt Modal */}
            {promptState.isOpen && (
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

    main: { flex: 1, display: 'flex', overflow: 'hidden' },

    // Workspace
    workspaceContainer: { flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' },
    blockly: { flex: 1, width: '100%' },

    // PictoBlox-style tabs
    tabBar: {
        display: 'flex',
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #ddd',
        padding: '0 8px',
    },
    tab: {
        padding: '10px 16px',
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 500,
        color: '#666',
        borderBottom: '2px solid transparent',
        marginBottom: '-1px',
    },
    tabActive: {
        padding: '10px 16px',
        border: 'none',
        backgroundColor: 'white',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 600,
        color: '#855CD6',
        borderBottom: '2px solid #855CD6',
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
        width: '340px',
        backgroundColor: '#f5f5f5',
        borderLeft: '1px solid #ddd',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '8px',
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
        border: '1px solid #eee',
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
        border: 'none',
        fontSize: '12px',
        cursor: 'pointer',
        color: '#666'
    },
    bottomTabActive: {
        padding: '8px 16px',
        backgroundColor: '#ffffff',
        border: 'none',
        borderBottom: '2px solid #4C97FF',
        fontSize: '12px',
        cursor: 'pointer',
        color: '#4C97FF',
        fontWeight: 'bold'
    },
    logArea: {
        height: '100px',
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
