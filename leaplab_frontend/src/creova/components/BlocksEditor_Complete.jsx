/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Complete Blocks Editor - leap app inventor style
 * Original implementation inspired by Leap App Inventor (Apache 2.0)
 */
import React, { useEffect, useRef, useState } from 'react';

// ── FIX: Neutralize AMD define() before Blockly imports ─────────────────────
// Monaco Editor's CDN loader re-installs window.define after startup cleanup.
// When navigating from Electra → App Inventor, Blockly's UMD wrapper detects
// the stale AMD define and crashes with:
// "Error: Can only have one anonymous define call per script file"
if (typeof window !== 'undefined' && typeof window.define === 'function' && window.define.amd) {
    window.define = undefined;
}

import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import 'blockly/blocks';

// ── OVERRIDE: Allow all blocks to connect to each other ─────────────────────
if (typeof Blockly !== 'undefined') {
    if (Blockly.ConnectionChecker && Blockly.ConnectionChecker.prototype) {
        Blockly.ConnectionChecker.prototype.doTypeChecks = function() {
            return true;
        };
    }
    if (Blockly.Connection && Blockly.Connection.prototype) {
        Blockly.Connection.prototype.checkType_ = function() {
            return true;
        };
    }
}


// Import our custom blocks
import { initializeAllBlocks, createComponentBlocks } from '../blocks/definitions/index';
import { BLOCK_COLORS } from '../blocks/utils/blockColors';
import { COMPONENT_METADATA } from '../data/componentMetadata';
import { PALETTE_ENHANCED } from '../data/paletteComponents_Enhanced';
const LEAP_COLORS = BLOCK_COLORS;

// Map palette category names to Leap block category colors
const CATEGORY_COLORS = {
    'User Interface': LEAP_COLORS.math,
    'Layout': LEAP_COLORS.lists,
    'Media': LEAP_COLORS.procedures,
    'Drawing and Animation': LEAP_COLORS.text,
    'Maps': LEAP_COLORS.getters,
    'Sensors': LEAP_COLORS.variables,
    'Social': LEAP_COLORS.control,
    'Storage': LEAP_COLORS.logic,
    'Connectivity': LEAP_COLORS.dictionaries,
    'LEGO MINDSTORMS': LEAP_COLORS.colors,
    'Experimental': LEAP_COLORS.setters,
    'Charts': LEAP_COLORS.text,
    'Data Science': LEAP_COLORS.matrices,
};
const GET_CATEGORY_COLOR = (() => {
    const cache = {};
    PALETTE_ENHANCED.forEach(p => { cache[p.type] = CATEGORY_COLORS[p.category] || LEAP_COLORS.variables; });
    return (type) => cache[type] || LEAP_COLORS.variables;
})();

// Import icons
import { Search, ZoomIn, ZoomOut, Trash2, Download, Upload, Code, AlertTriangle, XCircle } from 'lucide-react';

export default function BlocksEditorComplete({ appState }) {
    const blocklyDiv = useRef(null);
    const workspaceRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCode, setShowCode] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    const [lastSyncTime, setLastSyncTime] = useState(Date.now());
    const [errorCount, setErrorCount] = useState(0);
    const [warningCount, setWarningCount] = useState(0);

    // Helper for structured logging
    const logSession = (action, details = {}) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[BLOCKS SESSION] ${timestamp} - ${action}`, details);
    };

    // Initialize Blockly workspace
    useEffect(() => {
        if (!blocklyDiv.current || workspaceRef.current) return;

        // Initialize all Leap App Inventor blocks
        logSession('INITIALIZING_WORKSPACE', { screen: appState.activeScreen });
        initializeAllBlocks();

        // Ensure the div has dimensions before injecting Blockly
        const divRect = blocklyDiv.current.getBoundingClientRect();
        if (divRect.width === 0 || divRect.height === 0) {
            console.warn('Blockly div has no dimensions yet, waiting...');
            return;
        }

        // Create toolbox
        const toolbox = createToolbox(appState);

        // Workspace configuration - leap app inventor style
        const workspace = Blockly.inject(blocklyDiv.current, {
            toolbox: toolbox,
            grid: {
                spacing: 20,
                length: 3,
                colour: '#ccc',
                snap: true
            },
            zoom: {
                controls: true,
                wheel: true,
                startScale: 1.0,
                maxScale: 3,
                minScale: 0.3,
                scaleSpeed: 1.2
            },
            trashcan: true,
            scrollbars: true,
            theme: createCustomTheme(),
            collapse: false,
            comments: true,
            disable: true,
            sounds: true,
            // CRITICAL: Enable all move/drag interactions
            move: {
                scrollbars: {
                    horizontal: true,
                    vertical: true
                },
                drag: true,
                wheel: true
            },
            horizontalLayout: false,
            toolboxPosition: 'start',
            renderer: 'geras',
            media: './blockly-media/',
            oneBasedIndex: true
        });

        // leap app inventor style: Blocks are expanded by default
        // We handle this via theme or block initialization instead of a global override

        workspaceRef.current = workspace;
        logSession('WORKSPACE_INJECTED', { id: workspace.id });

        const getLeapSkinForType = (type) => {
            if (!type) return null;
            if (type === 'component_method' || type === 'any_component_method') {
                return {
                    bodyFill: LEAP_COLORS.methods,
                    bodyStroke: '#63406B',
                    fieldFill: '#B7A0BE',
                    fieldStroke: '#93789D',
                    bodyText: '#ffffff',
                    fieldText: '#1f1f1f'
                };
            }
            if (type === 'component_event' || type === 'any_component_event') {
                return {
                    bodyFill: LEAP_COLORS.events,
                    bodyStroke: '#8F7227',
                    fieldFill: '#D7BB72',
                    fieldStroke: '#A98B43',
                    bodyText: '#ffffff',
                    fieldText: '#1f1f1f'
                };
            }
            if (type === 'component_get_property' || type === 'any_component_get_property') {
                return {
                    bodyFill: LEAP_COLORS.getters,
                    bodyStroke: '#347A59',
                    fieldFill: '#8CC0A3',
                    fieldStroke: '#5F9A7B',
                    bodyText: '#ffffff',
                    fieldText: '#1f1f1f'
                };
            }
            if (type === 'component_set_property' || type === 'any_component_set_property') {
                return {
                    bodyFill: LEAP_COLORS.setters,
                    bodyStroke: '#1B4D31',
                    fieldFill: '#6B9A7E',
                    fieldStroke: '#44785F',
                    bodyText: '#ffffff',
                    fieldText: '#1f1f1f'
                };
            }
            return null;
        };

        const applyLeapSkinToBlock = (block) => {
            if (!block || !block.svgGroup_ || !block.type) return;
            const skin = getLeapSkinForType(block.type);
            if (!skin) return;

            const group = block.svgGroup_;
            group.setAttribute('data-type', block.type);

            const bodyPath = group.querySelector('.blocklyPath');
            if (bodyPath) {
                bodyPath.style.fill = skin.bodyFill;
                bodyPath.style.stroke = skin.bodyStroke;
                bodyPath.style.strokeWidth = '1.2px';
            }

            const fieldRects = group.querySelectorAll('.blocklyFieldRect, .blocklyEditableText > rect');
            fieldRects.forEach((rect) => {
                rect.style.fill = skin.fieldFill;
                rect.style.stroke = skin.fieldStroke;
                rect.style.strokeWidth = '1px';
                rect.setAttribute('rx', '4');
                rect.setAttribute('ry', '4');
            });

            const texts = group.querySelectorAll('.blocklyText');
            texts.forEach((text) => {
                text.style.fill = skin.bodyText;
                text.style.fontWeight = '700';
                text.style.fontSize = '12px';
            });

            const fieldTexts = group.querySelectorAll('.blocklyEditableText .blocklyText');
            fieldTexts.forEach((text) => {
                text.style.fill = skin.fieldText;
                text.style.fontWeight = '700';
            });
        };

        const tagRenderedBlocks = () => {
            if (!workspaceRef.current) return;
            const allBlocks = workspaceRef.current.getAllBlocks(false);
            allBlocks.forEach((block) => {
                if (block?.svgGroup_ && block?.type) {
                    block.svgGroup_.setAttribute('data-type', block.type);
                }
                applyLeapSkinToBlock(block);
            });
        };

        // Tag once after inject so CSS selectors can target specific block types.
        Promise.resolve().then(tagRenderedBlocks);

        const flyout = workspace.getFlyout();
        if (flyout) {
            flyout.autoClose = false;
        }

        // Workspace should not be read-only by default when toolbox is present
        // but we ensure it here if needed.
        if (workspace.options.readOnly) {
            workspace.options.readOnly = false;
        }

        // Async helpers: yield work to next frame to keep drag/move smooth.
        const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
        let validationTimer = null;
        let persistTimer = null;

        const scheduleValidation = () => {
            if (validationTimer) clearTimeout(validationTimer);
            validationTimer = setTimeout(async () => {
                await nextFrame();
                if (!workspaceRef.current) return;
                let errors = 0;
                let warnings = 0;
                const allBlocks = workspaceRef.current.getAllBlocks(false);

                allBlocks.forEach(block => {
                    if (block?.svgGroup_ && block?.type) {
                        block.svgGroup_.setAttribute('data-type', block.type);
                    }
                    applyLeapSkinToBlock(block);
                    let blockError = null;
                    let blockWarning = null;

                    block.inputList.forEach(input => {
                        if (input.type === Blockly.inputs.inputTypes.VALUE && !input.connection?.targetConnection) {
                            blockError = "Error: Missing expected input block.";
                            errors++;
                        }
                    });

                    const isRootType = block.type.includes('event') ||
                        block.type.includes('procedures_def') ||
                        block.type === 'global_declaration';

                    if (!block.getParent() && !isRootType) {
                        if (block.outputConnection || block.previousConnection) {
                            blockWarning = "Warning: This block is not connected to any event or procedure, so it will not run.";
                            warnings++;
                        }
                    }

                    if (blockError) block.setWarningText(blockError);
                    else if (blockWarning) block.setWarningText(blockWarning);
                    else block.setWarningText(null);
                });

                setErrorCount(errors);
                setWarningCount(warnings);
            }, 80);
        };

        const schedulePersistBlockXml = () => {
            if (persistTimer) clearTimeout(persistTimer);
            persistTimer = setTimeout(async () => {
                await nextFrame();
                if (!workspaceRef.current) return;
                const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
                const xmlText = Blockly.Xml.domToText(xml);
                window.__LEAP_BLOCK_XML__ = xmlText;
                if (appState.setBlockLogic) {
                    appState.setBlockLogic(xmlText);
                }
            }, 120);
        };

        // leap app inventor style: Block behavior
        // Blocks should be freely draggable and copyable from flyout
        workspace.addChangeListener((event) => {
            // Log toolbox interactions
            if (event.type === Blockly.Events.TOOLBOX_ITEM_SELECT) {
                logSession('TOOLBOX_CATEGORY_SELECTED', { item: event.newItem });
            }

            // Log significant events
            if (event.type === Blockly.Events.BLOCK_CREATE ||
                event.type === Blockly.Events.BLOCK_DELETE ||
                event.type === Blockly.Events.BLOCK_MOVE ||
                event.type === Blockly.Events.BLOCK_CHANGE) {
                logSession('BLOCK_EVENT', { type: event.type, blockId: event.blockId });
            }

            // leap app inventor style: blocks never collapse
            if (event.type === Blockly.Events.BLOCK_CREATE) {
                const block = workspace.getBlockById(event.blockId);
                if (block) {
                    if (block.svgGroup_ && block.type) {
                        block.svgGroup_.setAttribute('data-type', block.type);
                    }
                    applyLeapSkinToBlock(block);
                    logSession('BLOCK_CREATED', { type: block.type });
                    block.setCollapsed(false);
                    block.setMovable(true);
                    block.setDeletable(true);
                    block.setEditable(true);

                    // Prevent double-click collapse
                    const originalOnMouseDown = block.onMouseDown_;
                    if (originalOnMouseDown) {
                        block.onMouseDown_ = function (e) {
                            if (e.detail === 2) {  // Double-click
                                e.stopPropagation();
                                e.preventDefault();
                                return;
                            }
                            originalOnMouseDown.call(this, e);
                        };
                    }
                }
            }

            // Real-time validation for Errors and Warnings
            if (event.type === Blockly.Events.BLOCK_CREATE ||
                event.type === Blockly.Events.BLOCK_CHANGE ||
                event.type === Blockly.Events.BLOCK_MOVE ||
                event.type === Blockly.Events.BLOCK_DELETE) {
                scheduleValidation();
            }

            if (event.type !== Blockly.Events.UI) {
                schedulePersistBlockXml();
            }
        });

        // Load saved blocks if any
        const savedBlocks = appState.blockLogic;
        if (savedBlocks) {
            try {
                logSession('LOADING_SAVED_BLOCKS');
                const xml = Blockly.utils.xml.textToDom(savedBlocks);
                Blockly.Xml.domToWorkspace(xml, workspace);

                // Clean up orphaned blocks immediately on load
                const currentScreen = appState.screens?.find(s => s.id === appState.activeScreen) || appState.screens?.[0];
                if (currentScreen) {
                    const flattenVisible = (list = []) => list.flatMap(item => [item, ...(item.children ? flattenVisible(item.children) : [])]);
                    const allComps = [
                        ...flattenVisible(currentScreen.components || []),
                        ...(currentScreen.nonVisibleComponents || [])
                    ];
                    const validNames = new Set([
                        currentScreen.id,
                        ...allComps.map(c => c.id)
                    ]);
                    const allBlocks = workspace.getAllBlocks(false);
                    let deletedAny = false;
                    allBlocks.forEach(block => {
                        if (block.getField('INSTANCE')) {
                            const instanceName = block.getFieldValue('INSTANCE');
                            console.log(`[BLOCK DEBUG] Orphan check: block=${block.type} id=${block.id} INSTANCE=${instanceName} validNames=${JSON.stringify([...validNames])}`);
                            if (!instanceName || !validNames.has(instanceName)) {
                                block.dispose(false);
                                deletedAny = true;
                            }
                        }
                    });
                    if (deletedAny) {
                        const cleanXml = Blockly.Xml.workspaceToDom(workspace);
                        const cleanXmlText = Blockly.Xml.domToText(cleanXml);
                        window.__LEAP_BLOCK_XML__ = cleanXmlText;
                        if (appState.setBlockLogic) {
                            appState.setBlockLogic(cleanXmlText);
                        }
                    } else {
                        window.__LEAP_BLOCK_XML__ = savedBlocks;
                    }
                } else {
                    window.__LEAP_BLOCK_XML__ = savedBlocks;
                }

                logSession('BLOCKS_LOADED_SUCCESSFULLY');
            } catch (e) {
                logSession('ERROR_LOADING_BLOCKS', { error: e.message });
                console.error('Error loading blocks:', e);
            }
        }

        // Save blocks on change is handled via debounced async scheduler above.

        // Handle window resize and orientation changes
        const handleResize = () => {
            if (workspaceRef.current) {
                // Use requestAnimationFrame for smooth resizing
                requestAnimationFrame(() => {
                    Blockly.svgResize(workspaceRef.current);
                });
            }
        };

        // Debounce resize for better performance
        let resizeTimeout;
        const debouncedResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(handleResize, 100);
        };

        window.addEventListener('resize', debouncedResize);
        window.addEventListener('orientationchange', handleResize);

        // Initial resize after a short delay to ensure proper dimensions
        setTimeout(handleResize, 100);

        // Cleanup
        return () => {
            logSession('CLEANING_UP_WORKSPACE');
            clearTimeout(resizeTimeout);
            if (validationTimer) clearTimeout(validationTimer);
            if (persistTimer) clearTimeout(persistTimer);
            window.removeEventListener('resize', debouncedResize);
            window.removeEventListener('orientationchange', handleResize);
            if (workspaceRef.current) {
                // Save block XML immediately before disposing the workspace.
                // The debounced persister may not have fired yet, so we save
                // explicitly here to prevent loss when switching tabs.
                try {
                    const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
                    const xmlText = Blockly.Xml.domToText(xml);
                    if (xmlText) {
                        window.__LEAP_BLOCK_XML__ = xmlText;
                        if (appState.setBlockLogic) {
                            appState.setBlockLogic(xmlText);
                        }
                    }
                } catch (e) {
                    logSession('ERROR_SAVING_BLOCKS_ON_CLEANUP', { error: e.message });
                }
                logSession('DISPOSING_BLOCKLY_WORKSPACE');
                workspaceRef.current.dispose();
                workspaceRef.current = null;
            }
        };
    }, [appState.activeScreen]); // Only re-inject if the screen changes

    // Track component state to detect changes
    const prevComponentsSnapshotRef = useRef(null);

    // Update toolbox when components change (skip initial mount — toolbox was already set by Blockly.inject)
    useEffect(() => {
        if (workspaceRef.current && appState.screens) {
            const currentScreen = appState.screens?.find(s => s.id === appState.activeScreen) || appState.screens?.[0];
            const flattenVisible = (list = []) => list.flatMap(item => [item, ...(item.children ? flattenVisible(item.children) : [])]);
            const allComps = [
                ...flattenVisible(currentScreen?.components || []),
                ...(currentScreen?.nonVisibleComponents || [])
            ];
            const snapshot = JSON.stringify(allComps.map(c => c.id).sort());

            // First mount of this workspace instance — toolbox was set during Blockly.inject
            if (prevComponentsSnapshotRef.current === null) {
                prevComponentsSnapshotRef.current = snapshot;
                return;
            }

            // No actual component changes — skip
            if (snapshot === prevComponentsSnapshotRef.current) {
                return;
            }
            prevComponentsSnapshotRef.current = snapshot;

            logSession('COMPONENTS_CHANGED_SYNCING_TOOLBOX');
            let cancelled = false;
            const run = async () => {
                await new Promise((resolve) => requestAnimationFrame(resolve));
                if (cancelled || !workspaceRef.current) return;

                // Clean up orphaned blocks if any components were deleted
                if (currentScreen) {
                    const validNames = new Set([
                        currentScreen.id,
                        ...allComps.map(c => c.id)
                    ]);
                    const allBlocks = workspaceRef.current.getAllBlocks(false);
                    let deletedAny = false;

                    Blockly.Events.disable();
                    try {
                        allBlocks.forEach(block => {
                            if (block.getField('INSTANCE')) {
                                const instanceName = block.getFieldValue('INSTANCE');
                                if (!instanceName || !validNames.has(instanceName)) {
                                    block.dispose(false);
                                    deletedAny = true;
                                }
                            }
                        });
                    } finally {
                        Blockly.Events.enable();
                    }

                    if (deletedAny) {
                        logSession('CLEANED_UP_ORPHANED_BLOCKS');
                        const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
                        const xmlText = Blockly.Xml.domToText(xml);
                        window.__LEAP_BLOCK_XML__ = xmlText;
                        if (appState.setBlockLogic) {
                            appState.setBlockLogic(xmlText);
                        }
                    }
                }

                const toolbox = createToolbox(appState);
                workspaceRef.current.updateToolbox(toolbox);
                logSession('TOOLBOX_UPDATED');
            };
            run();
            return () => { cancelled = true; };
        }
    }, [appState.screens, appState.activeScreen]);

    // Create custom theme - Leap App Inventor Colors
    const createCustomTheme = () => {
        return Blockly.Theme.defineTheme('appinventor', {
            'base': Blockly.Themes.Classic,
            'blockStyles': {
                'control_blocks': {
                    'colourPrimary': LEAP_COLORS.control,
                    'colourSecondary': '#E89B0C',
                    'colourTertiary': '#D08B0B'
                },
                'logic_blocks': {
                    'colourPrimary': LEAP_COLORS.logic,
                    'colourSecondary': '#3A7BC8',
                    'colourTertiary': '#2E5FA8'
                },
                'math_blocks': {
                    'colourPrimary': LEAP_COLORS.math,
                    'colourSecondary': '#4A5785',
                    'colourTertiary': '#3A4765'
                },
                'text_blocks': {
                    'colourPrimary': LEAP_COLORS.text,
                    'colourSecondary': '#58983A',
                    'colourTertiary': '#488830'
                },
                'list_blocks': {
                    'colourPrimary': LEAP_COLORS.lists,
                    'colourSecondary': '#B03030',
                    'colourTertiary': '#A02020'
                },
                'color_blocks': {
                    'colourPrimary': LEAP_COLORS.colors,
                    'colourSecondary': '#954B95',
                    'colourTertiary': '#853B85'
                },
                'variable_blocks': {
                    'colourPrimary': LEAP_COLORS.variables,
                    'colourSecondary': '#E96316',
                    'colourTertiary': '#D95306'
                },
                'procedure_blocks': {
                    'colourPrimary': LEAP_COLORS.procedures,
                    'colourSecondary': '#793FB4',
                    'colourTertiary': '#692FA4'
                },
                'event_blocks': {
                    'colourPrimary': LEAP_COLORS.events,
                    'colourSecondary': '#B08805',
                    'colourTertiary': '#906800'
                },
                'method_blocks': {
                    'colourPrimary': LEAP_COLORS.methods,
                    'colourSecondary': '#610CA5',
                    'colourTertiary': '#410085'
                },
                'getter_blocks': {
                    'colourPrimary': LEAP_COLORS.getters,
                    'colourSecondary': '#419245',
                    'colourTertiary': '#217225'
                },
                'setter_blocks': {
                    'colourPrimary': LEAP_COLORS.setters,
                    'colourSecondary': '#0E5D12',
                    'colourTertiary': '#003D00'
                }
            },
            'categoryStyles': {
                'control_category': {
                    'colour': LEAP_COLORS.control
                },
                'logic_category': {
                    'colour': LEAP_COLORS.logic
                },
                'math_category': {
                    'colour': LEAP_COLORS.math
                },
                'text_category': {
                    'colour': LEAP_COLORS.text
                },
                'list_category': {
                    'colour': LEAP_COLORS.lists
                },
                'color_category': {
                    'colour': LEAP_COLORS.colors
                },
                'variable_category': {
                    'colour': LEAP_COLORS.variables
                },
                'procedure_category': {
                    'colour': LEAP_COLORS.procedures
                }
            }
        });
    };

    // Create toolbox XML - leap app inventor style
    const createToolbox = (appState) => {
        const currentScreen = appState.screens?.find(s => s.id === appState.activeScreen) || appState.screens?.[0];
        const flattenVisible = (list = []) => list.flatMap(item => [item, ...(item.children ? flattenVisible(item.children) : [])]);
        const components = [
            ...flattenVisible(currentScreen?.components || []),
            ...(currentScreen?.nonVisibleComponents || [])
        ];

        // GLOBAL: Expose components for block dropdowns
        window.LeapLab_Components = components;
        window.LeapLab_ActiveScreen = currentScreen;

        logSession('CONSTRUCTING_TOOLBOX', {
            componentCount: components.length,
            screen: currentScreen?.id
        });

        return {
            kind: 'categoryToolbox',
            contents: [
                // Built-in blocks - Leap App Inventor Standard
                {
                    kind: 'category',
                    name: 'Control',
                    colour: LEAP_COLORS.control,
                    contents: [
                        { kind: 'block', type: 'controls_if' },
                        {
                            kind: 'block',
                            type: 'controls_if',
                            extraState: '<mutation else="1"></mutation>'
                        },
                        {
                            kind: 'block',
                            type: 'controls_if',
                            extraState: '<mutation elseif="1" else="1"></mutation>'
                        },
                        { kind: 'block', type: 'controls_forRange' },
                        { kind: 'block', type: 'controls_forEach' },
                        { kind: 'block', type: 'controls_forEachDict' },
                        { kind: 'block', type: 'controls_while' },
                        { kind: 'block', type: 'controls_choose' },
                        { kind: 'block', type: 'controls_do_then_return' },
                        { kind: 'block', type: 'controls_eval_but_ignore' },
                        { kind: 'block', type: 'controls_openAnotherScreen' },
                        { kind: 'block', type: 'controls_openAnotherScreenWithStartValue' },
                        { kind: 'block', type: 'controls_getStartValue' },
                        { kind: 'block', type: 'controls_getPlainStartText' },
                        { kind: 'block', type: 'controls_closeScreen' },
                        { kind: 'block', type: 'controls_closeScreenWithValue' },
                        { kind: 'block', type: 'controls_closeScreenWithPlainText' },
                        { kind: 'block', type: 'controls_closeApplication' },
                        { kind: 'block', type: 'controls_break' }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Logic',
                    colour: LEAP_COLORS.logic,
                    contents: [
                        { kind: 'block', type: 'logic_boolean' },
                        { kind: 'block', type: 'logic_negate' },
                        { kind: 'block', type: 'logic_compare' },
                        { kind: 'block', type: 'logic_operation' }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Math',
                    colour: BLOCK_COLORS.math,
                    contents: [
                        { kind: 'block', type: 'math_number' },
                        { kind: 'block', type: 'math_number_radix' },
                        { kind: 'block', type: 'math_compare' },
                        { kind: 'block', type: 'math_add' },
                        { kind: 'block', type: 'math_subtract' },
                        { kind: 'block', type: 'math_multiply' },
                        { kind: 'block', type: 'math_divide_regular' },
                        { kind: 'block', type: 'math_power' },
                        { kind: 'block', type: 'math_bitwise' },
                        { kind: 'block', type: 'math_random_int' },
                        { kind: 'block', type: 'math_random_float' },
                        { kind: 'block', type: 'math_random_set_seed' },
                        { kind: 'block', type: 'math_on_list' },
                        { kind: 'block', type: 'math_on_list2' },
                        { kind: 'block', type: 'math_mode_of_list' },
                        { kind: 'block', type: 'math_single', fields: { OP: 'ROOT' } },
                        { kind: 'block', type: 'math_single', fields: { OP: 'ABS' } },
                        { kind: 'block', type: 'math_single', fields: { OP: 'NEG' } },
                        { kind: 'block', type: 'math_round', fields: { OP: 'ROUND' } },
                        { kind: 'block', type: 'math_round', fields: { OP: 'CEILING' } },
                        { kind: 'block', type: 'math_round', fields: { OP: 'FLOOR' } },
                        { kind: 'block', type: 'math_divide', fields: { OP: 'MODULO' } },
                        { kind: 'block', type: 'math_trig', fields: { OP: 'SIN' } },
                        { kind: 'block', type: 'math_trig', fields: { OP: 'COS' } },
                        { kind: 'block', type: 'math_trig', fields: { OP: 'TAN' } },
                        { kind: 'block', type: 'math_atan2' },
                        { kind: 'block', type: 'math_convert_angles' },
                        { kind: 'block', type: 'math_format_as_decimal' },
                        { kind: 'block', type: 'math_is_a_number' },
                        { kind: 'block', type: 'math_convert_number' }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Matrices',
                    colour: BLOCK_COLORS.matrices,
                    contents: [
                        { kind: 'block', type: 'matrices_create_2d' },
                        { kind: 'block', type: 'matrices_create_with_dimensions' },
                        { kind: 'block', type: 'matrices_get_cell' },
                        { kind: 'block', type: 'matrices_set_cell' },
                        { kind: 'block', type: 'matrices_get_row' },
                        { kind: 'block', type: 'matrices_get_column' },
                        { kind: 'block', type: 'matrices_get_dimensions' },
                        { kind: 'block', type: 'matrices_add' },
                        { kind: 'block', type: 'matrices_subtract' },
                        { kind: 'block', type: 'matrices_multiply' },
                        { kind: 'block', type: 'matrices_power' },
                        { kind: 'block', type: 'matrices_operation', fields: { OP: 'INVERSE' } },
                        { kind: 'block', type: 'matrices_operation', fields: { OP: 'TRANSPOSE' } },
                        { kind: 'block', type: 'matrices_operation', fields: { OP: 'ROTATE_LEFT' } },
                        { kind: 'block', type: 'matrices_operation', fields: { OP: 'ROTATE_RIGHT' } },
                        { kind: 'block', type: 'matrices_is_matrix' }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Text',
                    colour: BLOCK_COLORS.text,
                    contents: [
                        { kind: 'block', type: 'text' },
                        { kind: 'block', type: 'text_join' },
                        { kind: 'block', type: 'text_length' },
                        { kind: 'block', type: 'text_isEmpty' },
                        { kind: 'block', type: 'text_compare' },
                        { kind: 'block', type: 'text_trim' },
                        { kind: 'block', type: 'text_changeCase' },
                        { kind: 'block', type: 'text_starts_at' },
                        { kind: 'block', type: 'text_contains' },
                        { kind: 'block', type: 'text_split' },
                        { kind: 'block', type: 'text_segment' },
                        { kind: 'block', type: 'text_replace_all' },
                        { kind: 'block', type: 'text_obfuscated' },
                        { kind: 'block', type: 'text_is_string' },
                        { kind: 'block', type: 'text_reverse' },
                        { kind: 'block', type: 'text_replace_all_mappings' }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Lists',
                    colour: LEAP_COLORS.lists,
                    contents: [
                        { kind: 'block', type: 'lists_create_empty' },
                        { kind: 'block', type: 'lists_create_with' },
                        { kind: 'block', type: 'lists_add_items' },
                        { kind: 'block', type: 'lists_is_in' },
                        { kind: 'block', type: 'lists_length' },
                        { kind: 'block', type: 'lists_isEmpty' },
                        { kind: 'block', type: 'lists_pick_random' },
                        { kind: 'block', type: 'lists_indexOf' },
                        { kind: 'block', type: 'lists_getIndex' },
                        { kind: 'block', type: 'lists_setIndex' },
                        { kind: 'block', type: 'lists_remove_item' },
                        { kind: 'block', type: 'lists_insert_item' },
                        { kind: 'block', type: 'lists_append' },
                        { kind: 'block', type: 'lists_copy' },
                        { kind: 'block', type: 'lists_is_list' },
                        { kind: 'block', type: 'lists_reverse' },
                        { kind: 'block', type: 'lists_to_csv_row' },
                        { kind: 'block', type: 'lists_from_csv_row' },
                        { kind: 'block', type: 'lists_to_csv_table' },
                        { kind: 'block', type: 'lists_from_csv_table' },
                        { kind: 'block', type: 'lists_lookup_in_pairs' },
                        { kind: 'block', type: 'lists_join_with_separator' },
                        { kind: 'block', type: 'lists_sort' },
                        { kind: 'block', type: 'lists_repeat' }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Dictionaries',
                    colour: LEAP_COLORS.dictionaries,
                    contents: [
                        { kind: 'block', type: 'dictionaries_create_with' },
                        { kind: 'block', type: 'dictionaries_pair' },
                        { kind: 'block', type: 'dictionaries_set_pair' },
                        { kind: 'block', type: 'dictionaries_delete_pair' },
                        { kind: 'block', type: 'dictionaries_get_value' },
                        { kind: 'block', type: 'dictionaries_is_key_in' },
                        { kind: 'block', type: 'dictionaries_length' },
                        { kind: 'block', type: 'dictionaries_alist_to_dict' },
                        { kind: 'block', type: 'dictionaries_dict_to_alist' },
                        { kind: 'block', type: 'dictionaries_get_keys' },
                        { kind: 'block', type: 'dictionaries_get_values' },
                        { kind: 'block', type: 'dictionaries_combine' },
                        { kind: 'block', type: 'dictionaries_is_a_dictionary' },
                        { kind: 'block', type: 'dictionaries_walk_tree' },
                        { kind: 'block', type: 'dictionaries_walk_all' }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Colors',
                    colour: LEAP_COLORS.colors,
                    contents: [
                        { kind: 'block', type: 'colour_picker' },
                        { kind: 'block', type: 'colour_random' },
                        { kind: 'block', type: 'colour_rgb' },
                        { kind: 'block', type: 'colour_split' },
                        { kind: 'block', type: 'colour_blend' }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Variables',
                    colour: LEAP_COLORS.variables,
                    contents: [
                        { kind: 'block', type: 'global_declaration' },
                        { kind: 'block', type: 'lexical_variable_get' },
                        { kind: 'block', type: 'lexical_variable_set' },
                        { kind: 'block', type: 'local_declaration_statement' },
                        { kind: 'block', type: 'local_declaration_expression' }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Procedures',
                    colour: LEAP_COLORS.procedures,
                    contents: [
                        { kind: 'block', type: 'procedures_defnoreturn' },
                        { kind: 'block', type: 'procedures_defreturn' },
                        { kind: 'block', type: 'procedures_callnoreturn' },
                        { kind: 'block', type: 'procedures_callreturn' }
                    ]
                },
                {
                    kind: 'sep'
                },
                // Component blocks (Dynamic based on added components)
                ...generateComponentCategories(components),

            ]
        };
    };

    // Generate component categories - leap app inventor style
    const generateComponentCategories = (components) => {
        logSession('GENERATING_COMPONENT_CATEGORIES', { count: components.length });
        const categories = [];

        // Always add Screen category first
        const currentScreen = appState.screens?.find(s => s.id === appState.activeScreen) || appState.screens?.[0];
        if (currentScreen) {
            const metadata = COMPONENT_METADATA['Screen'];
            const screenCategory = {
                kind: 'category',
                name: currentScreen.id,
                colour: LEAP_COLORS.events,
                contents: [
                    ...metadata.events.map(event => ({
                        kind: 'block',
                        type: 'component_event',
                        extraState: {
                            component_type: 'Screen',
                            instance_name: currentScreen.id,
                            event_name: event.name,
                            is_generic: false
                        }
                    })),
                    ...metadata.methods.map(method => ({
                        kind: 'block',
                        type: 'component_method',
                        extraState: {
                            component_type: 'Screen',
                            instance_name: currentScreen.id,
                            method_name: method.name,
                            is_generic: false
                        }
                    })),
                    ...metadata.properties.flatMap(prop => [
                        {
                            kind: 'block',
                            type: 'component_set_property',
                            extraState: {
                                component_type: 'Screen',
                                instance_name: currentScreen.id,
                                property_name: prop.name,
                                is_generic: false
                            }
                        },
                        {
                            kind: 'block',
                            type: 'component_get_property',
                            extraState: {
                                component_type: 'Screen',
                                instance_name: currentScreen.id,
                                property_name: prop.name,
                                is_generic: false
                            }
                        },
                        ...(prop.options ? [{
                            kind: 'block',
                            type: 'component_choice',
                            extraState: {
                                component_type: 'Screen',
                                property_name: prop.name,
                                choice_value: prop.options[0]
                            }
                        }] : [])
                    ])
                ]
            };
            categories.push(screenCategory);
        }
        components.forEach(comp => {
            const metadata = COMPONENT_METADATA[comp.type];
            if (!metadata) return;

            const propPreview = comp.props?.Text || comp.props?.Hint || '';
            const categoryName = propPreview ? `${comp.id} (${propPreview})` : comp.id;

            const category = {
                kind: 'category',
                name: categoryName,
                colour: GET_CATEGORY_COLOR(comp.type),
                contents: []
            };

            // 1. Add event blocks
            metadata.events.forEach(event => {
                category.contents.push({
                    kind: 'block',
                    type: 'component_event',
                    extraState: {
                        component_type: comp.type,
                        instance_name: comp.id,
                        event_name: event.name,
                        is_generic: false
                    }
                });
            });

            // 2. Add method blocks
            metadata.methods.forEach(method => {
                category.contents.push({
                    kind: 'block',
                    type: 'component_method',
                    extraState: {
                        component_type: comp.type,
                        instance_name: comp.id,
                        method_name: method.name,
                        is_generic: false
                    }
                });
            });

            // 3. Add property setter blocks (Setters first in Leap)
            metadata.properties.forEach(prop => {
                category.contents.push({
                    kind: 'block',
                    type: 'component_set_property',
                    extraState: {
                        component_type: comp.type,
                        instance_name: comp.id,
                        property_name: prop.name,
                        is_generic: false
                    }
                });
            });

            // 4. Add property getter blocks
            metadata.properties.forEach(prop => {
                category.contents.push({
                    kind: 'block',
                    type: 'component_get_property',
                    extraState: {
                        component_type: comp.type,
                        instance_name: comp.id,
                        property_name: prop.name,
                        is_generic: false
                    }
                });

                // Add choice block if property has options
                if (prop.options) {
                    category.contents.push({
                        kind: 'block',
                        type: 'component_choice',
                        extraState: {
                            component_type: comp.type,
                            property_name: prop.name,
                            choice_value: prop.options[0]
                        }
                    });
                }
            });

            // 5. Add component instance block at the end (leap app inventor style)
            category.contents.push({
                kind: 'block',
                type: 'component_component_block',
                extraState: {
                    component_type: comp.type,
                    instance_name: comp.id
                }
            });

            if (category.contents.length > 0) {
                categories.push(category);
            }
        });

        return categories;
    };

    // Generate code
    const handleGenerateCode = () => {
        if (!workspaceRef.current) return;

        try {
            const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
            setGeneratedCode(code);
            setShowCode(true);
        } catch (e) {
            console.error('Error generating code:', e);
            setGeneratedCode('// Error generating code\n' + e.message);
            setShowCode(true);
        }
    };

    // Zoom controls
    const handleZoomIn = () => {
        if (workspaceRef.current) {
            workspaceRef.current.zoomCenter(1);
        }
    };

    const handleZoomOut = () => {
        if (workspaceRef.current) {
            workspaceRef.current.zoomCenter(-1);
        }
    };

    // Clear workspace
    const handleClear = async () => {
        if (workspaceRef.current) {
            const confirmed = await appState.confirm({
                title: "Clear Workspace",
                message: "Are you sure you want to clear all blocks from the workspace? This action cannot be undone.",
                confirmText: "Clear All",
                type: "danger"
            });
            if (confirmed) {
                workspaceRef.current.clear();
            }
        }
    };

    // Export blocks
    const handleExport = () => {
        if (!workspaceRef.current) return;

        const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
        const xmlText = Blockly.Xml.domToText(xml);

        const blob = new Blob([xmlText], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${appState.appName}_blocks.xml`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Import blocks
    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xml';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const xml = Blockly.utils.xml.textToDom(event.target.result);
                    if (workspaceRef.current) {
                        workspaceRef.current.clear();
                        Blockly.Xml.domToWorkspace(xml, workspaceRef.current);
                    }
                } catch (error) {
                    alert('Error importing blocks: ' + error.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    return (
        <div className="flex flex-col w-full h-full bg-[#f8fafc] overflow-hidden">
            {/* Toolbar - Responsive */}
            <div className="flex items-center justify-between p-3 px-6 bg-gradient-to-b from-white to-slate-50 border-b border-slate-200 shrink-0 gap-4">
                <div className="flex items-center gap-3.5 flex-wrap">
                    {/* Search */}
                    <div className="relative w-[220px] flex items-center">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search blocks..."
                            className="w-full p-2 px-3 pl-9 text-xs border border-slate-200 rounded-xl outline-none bg-slate-50 text-slate-800 font-medium box-border transition-all focus:border-indigo-400 focus:ring-3 focus:ring-indigo-400/15"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
 
                    {/* Zoom controls */}
                    <div className="flex gap-1.5">
                        <button
                            onClick={handleZoomIn}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 border border-slate-200 bg-white cursor-pointer transition-all shrink-0 hover:bg-slate-100 hover:text-slate-800"
                            title="Zoom In"
                            aria-label="Zoom In"
                        >
                            <ZoomIn className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleZoomOut}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 border border-slate-200 bg-white cursor-pointer transition-all shrink-0 hover:bg-slate-100 hover:text-slate-800"
                            title="Zoom Out"
                            aria-label="Zoom Out"
                        >
                            <ZoomOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Error & Warning Counters */}
                    {(errorCount > 0 || warningCount > 0) && (
                        <div className="flex items-center gap-2 mr-2">
                            {errorCount > 0 && (
                                <div className="flex items-center text-rose-600 bg-rose-50 border border-rose-100 p-1.5 px-3 rounded-lg text-xs font-extrabold" title={`${errorCount} empty sockets or errors`}>
                                    <XCircle className="w-3.5 h-3.5 mr-1.5" />
                                    <span>{errorCount}</span>
                                </div>
                            )}
                            {warningCount > 0 && (
                                <div className="flex items-center text-amber-600 bg-amber-50 border border-amber-200 p-1.5 px-3 rounded-lg text-xs font-extrabold" title={`${warningCount} orphan blocks`}>
                                    <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                                    <span>{warningCount}</span>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* Blockly Workspace - leap app inventor style (Fixed for Dragging) */}
            <div
                ref={blocklyDiv}
                className="flex-1 w-full h-full blockly-injection-container leap-blockly-workspace relative overflow-visible"
            />

            {/* CRITICAL CSS FIXES FOR BLOCKLY DRAG SURFACE */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .blockly-injection-container {
                    position: relative !important;
                }
                .blocklyBlockDragSurface {
                    pointer-events: none !important;
                    display: block !important;
                    visibility: visible !important;
                    z-index: 1000 !important;
                }
                .blocklyBlockDragSurface g {
                    pointer-events: none !important;
                }
                .blocklyDragging {
                    cursor: grabbing !important;
                    pointer-events: none !important;
                }
                .blocklyDraggable {
                    cursor: grab !important;
                    pointer-events: auto !important;
                }
                /* Ensure zelos blocks are rendered correctly in drag surface */
                .blocklyBlockDragSurface .blocklyPath {
                    fill-opacity: 0.8 !important;
                    stroke-width: 2px !important;
                }
                /* Prevent workspace from capturing drag events when they should go to surface */
                .blocklyWorkspace {
                    pointer-events: auto !important;
                }
                /* Fix for flyout dragging */
                .blocklyFlyout {
                    pointer-events: auto !important;
                }
                .blocklyFlyout .blocklyDraggable {
                    pointer-events: auto !important;
                }

                /* Leap component call styling */
                .leap-blockly-workspace .blocklyDraggable[data-type="component_method"] .blocklyPath,
                .leap-blockly-workspace .blocklyDraggable[data-type="any_component_method"] .blocklyPath {
                    fill: #8F5DB7 !important;
                    stroke: #734A94 !important;
                    stroke-width: 1.2px !important;
                }

                .leap-blockly-workspace .blocklyDraggable[data-type="component_method"] .blocklyFieldRect,
                .leap-blockly-workspace .blocklyDraggable[data-type="any_component_method"] .blocklyFieldRect {
                    fill: #CFC7D8 !important;
                    stroke: #A79CB5 !important;
                    stroke-width: 1px !important;
                    rx: 4px !important;
                    ry: 4px !important;
                }

                .leap-blockly-workspace .blocklyDraggable[data-type="component_method"] .blocklyText,
                .leap-blockly-workspace .blocklyDraggable[data-type="any_component_method"] .blocklyText {
                    fill: #ffffff !important;
                    font-weight: 700 !important;
                    font-size: 12px !important;
                }

                .leap-blockly-workspace .blocklyDraggable[data-type="component_method"] .blocklyEditableText .blocklyText,
                .leap-blockly-workspace .blocklyDraggable[data-type="any_component_method"] .blocklyEditableText .blocklyText {
                    fill: #1f1f1f !important;
                    font-weight: 700 !important;
                }

                /* Leap component event styling (gold) */
                .leap-blockly-workspace .blocklyDraggable[data-type="component_event"] .blocklyPath,
                .leap-blockly-workspace .blocklyDraggable[data-type="any_component_event"] .blocklyPath {
                    fill: #b49235 !important;
                    stroke: #8f7227 !important;
                    stroke-width: 1.2px !important;
                }

                .leap-blockly-workspace .blocklyDraggable[data-type="component_event"] .blocklyFieldRect,
                .leap-blockly-workspace .blocklyDraggable[data-type="any_component_event"] .blocklyFieldRect {
                    fill: #d7bb72 !important;
                    stroke: #a98b43 !important;
                    stroke-width: 1px !important;
                    rx: 4px !important;
                    ry: 4px !important;
                }

                .leap-blockly-workspace .blocklyDraggable[data-type="component_event"] .blocklyEditableText .blocklyText,
                .leap-blockly-workspace .blocklyDraggable[data-type="any_component_event"] .blocklyEditableText .blocklyText {
                    fill: #1f1f1f !important;
                    font-weight: 700 !important;
                }

                /* Leap getter/setter styling (green) */
                .leap-blockly-workspace .blocklyDraggable[data-type="component_get_property"] .blocklyPath,
                .leap-blockly-workspace .blocklyDraggable[data-type="component_set_property"] .blocklyPath,
                .leap-blockly-workspace .blocklyDraggable[data-type="any_component_get_property"] .blocklyPath,
                .leap-blockly-workspace .blocklyDraggable[data-type="any_component_set_property"] .blocklyPath {
                    fill: #3f8d67 !important;
                    stroke: #2f6f51 !important;
                    stroke-width: 1.2px !important;
                }

                .leap-blockly-workspace .blocklyDraggable[data-type="component_get_property"] .blocklyFieldRect,
                .leap-blockly-workspace .blocklyDraggable[data-type="component_set_property"] .blocklyFieldRect,
                .leap-blockly-workspace .blocklyDraggable[data-type="any_component_get_property"] .blocklyFieldRect,
                .leap-blockly-workspace .blocklyDraggable[data-type="any_component_set_property"] .blocklyFieldRect {
                    fill: #8cc0a3 !important;
                    stroke: #5f9a7b !important;
                    stroke-width: 1px !important;
                    rx: 4px !important;
                    ry: 4px !important;
                }

                .leap-blockly-workspace .blocklyDraggable[data-type="component_get_property"] .blocklyEditableText .blocklyText,
                .leap-blockly-workspace .blocklyDraggable[data-type="component_set_property"] .blocklyEditableText .blocklyText,
                .leap-blockly-workspace .blocklyDraggable[data-type="any_component_get_property"] .blocklyEditableText .blocklyText,
                .leap-blockly-workspace .blocklyDraggable[data-type="any_component_set_property"] .blocklyEditableText .blocklyText {
                    fill: #1f1f1f !important;
                    font-weight: 700 !important;
                }
            `}} />

            {/* Code Preview Modal - Responsive */}
            {showCode && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70"
                    onClick={() => setShowCode(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-[800px] max-w-[90vw] max-h-[85vh] m-auto flex flex-col overflow-hidden border border-slate-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-200 shrink-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                                    <Code className="w-5.5 h-5.5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight m-0">Generated Code</h3>
                                    <p className="text-xs text-slate-400 font-medium mt-1 mb-0">Translate visual blocks to Javascript</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCode(false)}
                                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 border border-slate-200 bg-transparent cursor-pointer transition-all shrink-0 hover:bg-slate-100 hover:text-slate-800"
                                title="Close"
                            >
                                <XCircle className="w-4.5 h-4.5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 px-6 flex-1 overflow-y-auto min-h-0">
                            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                                <pre className="m-0 p-5 text-xs font-mono text-sky-400 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
                                    {generatedCode || '// No code generated'}
                                </pre>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-7 px-6 flex justify-end gap-3 items-center bg-slate-50 border-t border-slate-200 shrink-0">
                            <button
                                onClick={() => setShowCode(false)}
                                className="min-w-[120px] p-3.5 px-7 inline-flex items-center justify-center rounded-xl font-extrabold text-sm transition-all border border-slate-300 bg-slate-50 text-slate-700 cursor-pointer hover:bg-slate-100 hover:text-slate-900"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    try { 
                                        navigator.clipboard?.writeText(generatedCode)
                                            .then(() => alert('Code copied to clipboard!'))
                                            .catch(() => alert('Failed to copy code. Please select and copy manually.')); 
                                    } catch (_) { 
                                        alert('Failed to copy code. Please select and copy manually.'); 
                                    }
                                }}
                                className="min-w-[150px] p-3.5 px-7 inline-flex items-center justify-center gap-2.5 rounded-xl font-extrabold text-sm transition-all border-none bg-indigo-600 text-white cursor-pointer shadow-md shadow-indigo-600/25 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/30"
                            >
                                <Code className="w-4.5 h-4.5" />
                                <span>Copy Code</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
