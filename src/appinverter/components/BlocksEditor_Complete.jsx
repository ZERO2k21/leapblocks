/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Complete Blocks Editor - MIT App Inventor Style
 * Original implementation inspired by MIT App Inventor (Apache 2.0)
 */
import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

// Import our custom blocks
import { initializeAllBlocks, createComponentBlocks } from '../blocks/definitions/index';
import { BLOCK_COLORS } from '../blocks/utils/blockColors';
import { COMPONENT_METADATA, ANY_COMPONENT_METADATA } from '../data/componentMetadata';
const MIT_COLORS = BLOCK_COLORS;

// Import icons
import { Search, ZoomIn, ZoomOut, Trash2, Download, Upload, Code } from 'lucide-react';

export default function BlocksEditorComplete({ appState }) {
    const blocklyDiv = useRef(null);
    const workspaceRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCode, setShowCode] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');

    // Initialize Blockly workspace
    useEffect(() => {
        if (!blocklyDiv.current || workspaceRef.current) return;

        // Initialize all MIT App Inventor blocks
        initializeAllBlocks();

        // Ensure the div has dimensions before injecting Blockly
        const divRect = blocklyDiv.current.getBoundingClientRect();
        if (divRect.width === 0 || divRect.height === 0) {
            console.warn('Blockly div has no dimensions yet, waiting...');
            return;
        }

        // Create toolbox
        const toolbox = createToolbox(appState);

        // Workspace configuration - MIT App Inventor Style
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
            renderer: 'zelos',
            media: 'https://unpkg.com/blockly/media/',
            oneBasedIndex: true
        });

        // GLOBAL FIX: Disable collapse feature completely
        // This prevents double-click from collapsing blocks
        if (Blockly.Block.prototype.setCollapsed && !Blockly.Block.prototype.setCollapsed.isOverridden) {
            const originalSetCollapsed = Blockly.Block.prototype.setCollapsed;
            Blockly.Block.prototype.setCollapsed = function (collapsed) {
                // Always keep blocks expanded (never collapse)
                if (collapsed) {
                    return; // Ignore collapse requests
                }
                originalSetCollapsed.call(this, false);
            };
            Blockly.Block.prototype.setCollapsed.isOverridden = true;
        }

        workspaceRef.current = workspace;

        const flyout = workspace.getFlyout();
        if (flyout) {
            flyout.autoClose = false;
        }

        // Workspace should not be read-only by default when toolbox is present
        // but we ensure it here if needed.
        if (workspace.options.readOnly) {
            workspace.options.readOnly = false;
        }

        // CRITICAL: Ensure the workspace SVG allows pointer events
        const workspaceSvg = workspace.getParentSvg();
        if (workspaceSvg) {
            workspaceSvg.style.pointerEvents = 'auto';
            workspaceSvg.style.touchAction = 'none';
        }

        // CRITICAL: Enable pointer events on all block groups
        const enableBlockInteractions = () => {
            const allBlocks = workspace.getAllBlocks(false);
            allBlocks.forEach(block => {
                if (block.svgGroup_) {
                    block.svgGroup_.style.pointerEvents = 'auto';
                    block.svgGroup_.style.cursor = 'grab';
                }
            });
        };

        // Run immediately and after any block changes
        enableBlockInteractions();

        // MIT App Inventor Style: Block behavior
        // Blocks should be freely draggable and copyable from flyout
        workspace.addChangeListener((event) => {
            if (event.type === Blockly.Events.BLOCK_CREATE) {
                const block = workspace.getBlockById(event.blockId);
                if (block) {
                    // MIT App Inventor style: blocks never collapse
                    block.setCollapsed(false);

                    // CRITICAL: Ensure blocks are fully interactive and draggable
                    block.setMovable(true);
                    block.setDeletable(true);
                    block.setEditable(true);

                    // Enable all interactions on SVG element
                    if (block.svgGroup_) {
                        block.svgGroup_.style.pointerEvents = 'auto';
                        block.svgGroup_.style.cursor = 'grab';
                        block.svgGroup_.style.touchAction = 'none'; // Enable touch dragging
                    }

                    // Ensure the block's path element is also interactive
                    const pathElement = block.pathObject?.svgPath;
                    if (pathElement) {
                        pathElement.style.pointerEvents = 'auto';
                    }

                    // FIX: Ensure the block is added to the drag surface correctly
                    if (block.svgGroup_) {
                        block.svgGroup_.classList.add('blocklyDraggable');
                    }

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

            // Re-enable interactions after any workspace change
            if (event.type === Blockly.Events.FINISHED_LOADING ||
                event.type === Blockly.Events.BLOCK_MOVE ||
                event.type === Blockly.Events.BLOCK_CREATE) {
                requestAnimationFrame(() => {
                    const allBlocks = workspace.getAllBlocks(false);
                    allBlocks.forEach(block => {
                        if (block.svgGroup_) {
                            block.svgGroup_.style.pointerEvents = 'auto';
                        }
                    });
                });
            }
        });

        // Load saved blocks if any
        const savedBlocks = appState.blockLogic;
        if (savedBlocks) {
            try {
                const xml = Blockly.utils.xml.textToDom(savedBlocks);
                Blockly.Xml.domToWorkspace(xml, workspace);
            } catch (e) {
                console.error('Error loading blocks:', e);
            }
        }

        // Save blocks on change
        workspace.addChangeListener(() => {
            const xml = Blockly.Xml.workspaceToDom(workspace);
            const xmlText = Blockly.Xml.domToText(xml);
            if (appState.setBlockLogic) {
                appState.setBlockLogic(xmlText);
            }
        });

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
            clearTimeout(resizeTimeout);
            window.removeEventListener('resize', debouncedResize);
            window.removeEventListener('orientationchange', handleResize);
            if (workspaceRef.current) {
                console.log('🧹 Disposing Blockly workspace');
                workspaceRef.current.dispose();
                workspaceRef.current = null;
            }
        };
    }, [appState.activeScreen]); // Only re-inject if the screen changes

    // Update toolbox when components change
    useEffect(() => {
        if (workspaceRef.current && appState.screens) {
            const toolbox = createToolbox(appState);
            workspaceRef.current.updateToolbox(toolbox);
        }
    }, [appState.screens, appState.activeScreen]);

    // Create custom theme - MIT App Inventor Colors
    const createCustomTheme = () => {
        return Blockly.Theme.defineTheme('appinventor', {
            'base': Blockly.Themes.Classic,
            'blockStyles': {
                'control_blocks': {
                    'colourPrimary': MIT_COLORS.control,
                    'colourSecondary': '#E89B0C',
                    'colourTertiary': '#D08B0B'
                },
                'logic_blocks': {
                    'colourPrimary': MIT_COLORS.logic,
                    'colourSecondary': '#3A7BC8',
                    'colourTertiary': '#2E5FA8'
                },
                'math_blocks': {
                    'colourPrimary': MIT_COLORS.math,
                    'colourSecondary': '#4A5785',
                    'colourTertiary': '#3A4765'
                },
                'text_blocks': {
                    'colourPrimary': MIT_COLORS.text,
                    'colourSecondary': '#58983A',
                    'colourTertiary': '#488830'
                },
                'list_blocks': {
                    'colourPrimary': MIT_COLORS.lists,
                    'colourSecondary': '#B03030',
                    'colourTertiary': '#A02020'
                },
                'color_blocks': {
                    'colourPrimary': MIT_COLORS.colors,
                    'colourSecondary': '#954B95',
                    'colourTertiary': '#853B85'
                },
                'variable_blocks': {
                    'colourPrimary': MIT_COLORS.variables,
                    'colourSecondary': '#E96316',
                    'colourTertiary': '#D95306'
                },
                'procedure_blocks': {
                    'colourPrimary': MIT_COLORS.procedures,
                    'colourSecondary': '#793FB4',
                    'colourTertiary': '#692FA4'
                },
                'event_blocks': {
                    'colourPrimary': MIT_COLORS.events,
                    'colourSecondary': '#E8BC15',
                    'colourTertiary': '#D0AC05'
                },
                'method_blocks': {
                    'colourPrimary': MIT_COLORS.methods,
                    'colourSecondary': '#793FB4',
                    'colourTertiary': '#692FA4'
                },
                'getter_blocks': {
                    'colourPrimary': MIT_COLORS.getters,
                    'colourSecondary': '#338960',
                    'colourTertiary': '#237950'
                },
                'setter_blocks': {
                    'colourPrimary': MIT_COLORS.setters,
                    'colourSecondary': '#1E5633',
                    'colourTertiary': '#0E4623'
                }
            },
            'categoryStyles': {
                'control_category': {
                    'colour': MIT_COLORS.control
                },
                'logic_category': {
                    'colour': MIT_COLORS.logic
                },
                'math_category': {
                    'colour': MIT_COLORS.math
                },
                'text_category': {
                    'colour': MIT_COLORS.text
                },
                'list_category': {
                    'colour': MIT_COLORS.lists
                },
                'color_category': {
                    'colour': MIT_COLORS.colors
                },
                'variable_category': {
                    'colour': MIT_COLORS.variables
                },
                'procedure_category': {
                    'colour': MIT_COLORS.procedures
                }
            }
        });
    };

    // Create toolbox XML - MIT App Inventor Style
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

        return {
            kind: 'categoryToolbox',
            contents: [
                // Built-in blocks - MIT App Inventor Standard
                {
                    kind: 'category',
                    name: 'Control',
                    colour: MIT_COLORS.control,
                    contents: [
                        { kind: 'block', type: 'controls_if' },
                        { kind: 'block', type: 'controls_if_else' },
                        { kind: 'block', type: 'controls_forRange' },
                        { kind: 'block', type: 'controls_forEach' },
                        { kind: 'block', type: 'controls_while' },
                        { kind: 'block', type: 'controls_choose' },
                        { kind: 'block', type: 'controls_do_then_return' },
                        { kind: 'block', type: 'controls_eval_but_ignore' },
                        { kind: 'block', type: 'controls_openAnotherScreen' },
                        { kind: 'block', type: 'controls_closeScreen' },
                        { kind: 'block', type: 'controls_break' }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Logic',
                    colour: MIT_COLORS.logic,
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
                        { kind: 'block', type: 'math_arithmetic' },
                        { kind: 'block', type: 'math_bitwise' },
                        { kind: 'block', type: 'math_random_int' },
                        { kind: 'block', type: 'math_random_float' },
                        { kind: 'block', type: 'math_random_set_seed' },
                        { kind: 'block', type: 'math_single' },
                        { kind: 'block', type: 'math_trig' },
                        { kind: 'block', type: 'math_round' },
                        { kind: 'block', type: 'math_modulo' },
                        { kind: 'block', type: 'math_constant' },
                        { kind: 'block', type: 'math_number_property' }
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
                        { kind: 'block', type: 'matrices_get_dimensions' }
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
                        { kind: 'block', type: 'text_contains' },
                        { kind: 'block', type: 'text_split' }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Lists',
                    colour: MIT_COLORS.lists,
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
                    colour: MIT_COLORS.lists,
                    contents: [
                        { kind: 'block', type: 'dictionaries_create_with' },
                        { kind: 'block', type: 'dictionaries_pair' },
                        { kind: 'block', type: 'dictionaries_set_pair' },
                        { kind: 'block', type: 'dictionaries_delete_pair' },
                        { kind: 'block', type: 'dictionaries_get_value' },
                        { kind: 'block', type: 'dictionaries_alist_to_dict' },
                        { kind: 'block', type: 'dictionaries_dict_to_alist' }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Colors',
                    colour: MIT_COLORS.colors,
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
                    colour: MIT_COLORS.variables,
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
                    colour: MIT_COLORS.procedures,
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
                { kind: 'sep' },
                // Generic Component blocks (Any Component)
                ...generateAnyComponentCategories(components)
            ]
        };
    };

    // Generate component categories - MIT App Inventor Style
    const generateComponentCategories = (components) => {
        const categories = [];

        // Always add Screen category first
        const currentScreen = appState.screens?.find(s => s.id === appState.activeScreen) || appState.screens?.[0];
        if (currentScreen) {
            const metadata = COMPONENT_METADATA['Screen'];
            const screenCategory = {
                kind: 'category',
                name: currentScreen.id,
                colour: MIT_COLORS.events,
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

            const category = {
                kind: 'category',
                name: comp.id,
                colour: comp.type === 'Screen' ? MIT_COLORS.control : MIT_COLORS.variables,
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

            // 3. Add property setter blocks (Setters first in MIT)
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

            // 5. Add component instance block at the end (mit app inventor style)
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

    // Generate Any Component categories
    const generateAnyComponentCategories = (components) => {
        const types = [...new Set(components.map(c => c.type))];
        const categories = [];

        types.forEach(type => {
            const metadata = ANY_COMPONENT_METADATA[type];
            if (!metadata) return;

            const category = {
                kind: 'category',
                name: `Any ${type}`,
                colour: '#3366cc',
                contents: [
                    {
                        kind: 'block',
                        type: 'any_component_event',
                        extraState: {
                            component_type: type,
                            is_generic: true,
                            event_name: 'Click' // Default
                        }
                    },
                    ...metadata.methods.map(method => ({
                        kind: 'block',
                        type: 'any_component_method',
                        extraState: {
                            component_type: type,
                            method_name: method,
                            is_generic: true
                        }
                    })),
                    ...metadata.properties.flatMap(prop => [
                        {
                            kind: 'block',
                            type: 'any_component_set_property',
                            extraState: {
                                component_type: type,
                                property_name: prop,
                                is_generic: true
                            }
                        },
                        {
                            kind: 'block',
                            type: 'any_component_get_property',
                            extraState: {
                                component_type: type,
                                property_name: prop,
                                is_generic: true
                            }
                        }
                    ])
                ]
            };
            categories.push(category);
        });

        if (categories.length > 0) {
            return [{ kind: 'category', name: 'Any Component', contents: categories }];
        }
        return [];
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
            workspaceRef.current.zoomCenter(1.2);
        }
    };

    const handleZoomOut = () => {
        if (workspaceRef.current) {
            workspaceRef.current.zoomCenter(0.8);
        }
    };

    // Clear workspace
    const handleClear = () => {
        if (workspaceRef.current && window.confirm('Clear all blocks?')) {
            workspaceRef.current.clear();
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
        <div className="flex flex-col w-full h-full min-h-screen bg-[#edf1f6]">
            {/* Toolbar - Responsive */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 sm:px-4 py-2 bg-[#dfe6ee] border-b border-[#c6cfda] gap-2 sm:gap-0">
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 sm:flex-initial min-w-[200px]">
                        <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search blocks..."
                            className="w-full pl-8 pr-3 py-1.5 text-sm border border-[#b7c4d4] rounded focus:outline-none focus:ring-2 focus:ring-[#4a90e2] transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Zoom controls */}
                    <div className="flex gap-1">
                        <button
                            onClick={handleZoomIn}
                            className="p-1.5 hover:bg-[#e4ebf3] rounded transition-colors active:scale-95"
                            title="Zoom In"
                            aria-label="Zoom In"
                        >
                            <ZoomIn className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleZoomOut}
                            className="p-1.5 hover:bg-[#e4ebf3] rounded transition-colors active:scale-95"
                            title="Zoom Out"
                            aria-label="Zoom Out"
                        >
                            <ZoomOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    {/* Actions */}
                    <button
                        onClick={handleGenerateCode}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#4a90e2] hover:bg-[#3f79bf] text-white text-sm font-medium rounded transition-all active:scale-95 shadow-sm hover:shadow-md"
                        aria-label="Generate Code"
                    >
                        <Code className="h-4 w-4" />
                        <span className="hidden sm:inline">Generate Code</span>
                        <span className="sm:hidden">Code</span>
                    </button>
                    <button
                        onClick={handleExport}
                        className="p-1.5 hover:bg-[#e4ebf3] rounded transition-colors active:scale-95"
                        title="Export Blocks"
                        aria-label="Export Blocks"
                    >
                        <Download className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleImport}
                        className="p-1.5 hover:bg-[#e4ebf3] rounded transition-colors active:scale-95"
                        title="Import Blocks"
                        aria-label="Import Blocks"
                    >
                        <Upload className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleClear}
                        className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors active:scale-95"
                        title="Clear All"
                        aria-label="Clear All Blocks"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Blockly Workspace - MIT App Inventor Style (Fixed for Dragging) */}
            <div
                ref={blocklyDiv}
                className="flex-1 w-full h-full min-h-[400px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[700px] blockly-injection-container"
                style={{
                    position: 'relative',
                    overflow: 'visible' // Ensure drag surface is not clipped
                }}
            />

            {/* CRITICAL CSS FIXES FOR BLOCKLY DRAG SURFACE */}
            <style dangerouslySetInnerHTML={{ __html: `
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
            `}} />

            {/* Code Preview Modal - Responsive */}
            {showCode && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-800">Generated Code</h3>
                            <button
                                onClick={() => setShowCode(false)}
                                className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
                                aria-label="Close"
                            >
                                <span className="text-xl">✕</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-2 sm:p-4">
                            <pre className="bg-gray-900 text-green-400 p-3 sm:p-4 rounded-lg text-xs sm:text-sm font-mono overflow-x-auto">
                                {generatedCode}
                            </pre>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-2 px-4 py-3 border-t bg-gray-50">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedCode);
                                    alert('Code copied to clipboard!');
                                }}
                                className="w-full sm:w-auto px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors active:scale-95 font-medium"
                            >
                                Copy Code
                            </button>
                            <button
                                onClick={() => setShowCode(false)}
                                className="w-full sm:w-auto px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors active:scale-95 font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
