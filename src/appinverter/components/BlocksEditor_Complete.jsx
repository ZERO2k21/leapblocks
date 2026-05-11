/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Complete Blocks Editor - MIT App Inventor Style
 * Original implementation inspired by MIT App Inventor (Apache 2.0)
 */
import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript';
import 'blockly/blocks';

// Import our custom blocks
import { initializeAllBlocks, MIT_COLORS, createComponentBlocks } from '../blocks/definitions/index';
import { BLOCK_COLORS } from '../blocks/utils/blockColors';

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

        // Workspace configuration - MIT App Inventor Style (Simplified & Working)
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
            trashcan: false,
            scrollbars: true,
            theme: createCustomTheme(),
            collapse: false,
            comments: true,
            disable: true,
            sounds: false,
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
            media: './',
            oneBasedIndex: true
        });

        // GLOBAL FIX: Disable collapse feature completely
        // This prevents double-click from collapsing blocks
        if (Blockly.Block.prototype.setCollapsed) {
            const originalSetCollapsed = Blockly.Block.prototype.setCollapsed;
            Blockly.Block.prototype.setCollapsed = function (collapsed) {
                // Always keep blocks expanded (never collapse)
                if (collapsed) {
                    return; // Ignore collapse requests
                }
                originalSetCollapsed.call(this, false);
            };
        }

        workspaceRef.current = workspace;

        // MIT App Inventor Style: Enable workspace panning and flyout behavior
        const flyout = workspace.getFlyout();
        if (flyout) {
            flyout.autoClose = false;
            // Ensure flyout blocks are draggable
            flyout.workspace_.options.readOnly = false;
        }

        // CRITICAL FIX: Enable drag gestures on the workspace
        // This ensures blocks can be dragged from flyout to workspace
        workspace.options.readOnly = false;

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
                workspaceRef.current.dispose();
                workspaceRef.current = null;
            }
        };
    }, [appState]);

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
                    colour: MIT_COLORS.math,
                    contents: [
                        { kind: 'block', type: 'math_number' },
                        { kind: 'block', type: 'math_arithmetic' },
                        { kind: 'block', type: 'math_single' },
                        { kind: 'block', type: 'math_trig' },
                        { kind: 'block', type: 'math_constant' },
                        { kind: 'block', type: 'math_number_property' },
                        { kind: 'block', type: 'math_round' },
                        { kind: 'block', type: 'math_modulo' },
                        { kind: 'block', type: 'math_random_int' },
                        { kind: 'block', type: 'math_random_float' }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Text',
                    colour: MIT_COLORS.text,
                    contents: [
                        { kind: 'block', type: 'text' },
                        { kind: 'block', type: 'text_join' },
                        { kind: 'block', type: 'text_length' },
                        { kind: 'block', type: 'text_isEmpty' },
                        { kind: 'block', type: 'text_compare' },
                        { kind: 'block', type: 'text_trim' },
                        { kind: 'block', type: 'text_changeCase' },
                        { kind: 'block', type: 'text_indexOf' },
                        { kind: 'block', type: 'text_contains' },
                        { kind: 'block', type: 'text_split' },
                        { kind: 'block', type: 'text_charAt' },
                        { kind: 'block', type: 'text_getSubstring' },
                        { kind: 'block', type: 'text_replace_all' }
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
                    kind: 'sep'
                },
                // Component blocks (Dynamic based on added components)
                ...generateComponentCategories(components)
            ]
        };
    };

    // Generate component categories - MIT App Inventor Style
    const generateComponentCategories = (components) => {
        const categories = [];

        // Always add Screen category first
        const currentScreen = appState.screens?.find(s => s.id === appState.activeScreen) || appState.screens?.[0];
        if (currentScreen) {
            const screenCategory = {
                kind: 'category',
                name: currentScreen.id,
                colour: MIT_COLORS.events,
                contents: [
                    {
                        kind: 'block',
                        type: 'component_event',
                        fields: {
                            COMPONENT: currentScreen.id,
                            EVENT: 'Initialize'
                        }
                    },
                    {
                        kind: 'block',
                        type: 'component_event',
                        fields: {
                            COMPONENT: currentScreen.id,
                            EVENT: 'BackPressed'
                        }
                    },
                    {
                        kind: 'block',
                        type: 'component_event',
                        fields: {
                            COMPONENT: currentScreen.id,
                            EVENT: 'ErrorOccurred'
                        }
                    }
                ]
            };
            categories.push(screenCategory);
        }

        // Add categories for each component
        components.forEach(comp => {
            const category = {
                kind: 'category',
                name: comp.id,
                colour: MIT_COLORS.events,
                contents: []
            };

            // Add event blocks
            const events = getComponentEvents(comp.type);
            events.forEach(event => {
                category.contents.push({
                    kind: 'block',
                    type: 'component_event',
                    fields: {
                        COMPONENT: comp.id,
                        EVENT: event.name
                    }
                });
            });

            // Add method blocks
            const methods = getComponentMethods(comp.type);
            methods.forEach(method => {
                category.contents.push({
                    kind: 'block',
                    type: 'component_method',
                    fields: {
                        COMPONENT: comp.id,
                        METHOD: method.name
                    }
                });
            });

            // Add property getter/setter blocks
            const properties = getComponentProperties(comp.type);
            properties.forEach(prop => {
                // Getter
                category.contents.push({
                    kind: 'block',
                    type: 'component_get_property',
                    fields: {
                        COMPONENT: comp.id,
                        PROPERTY: prop.name
                    }
                });
                // Setter
                category.contents.push({
                    kind: 'block',
                    type: 'component_set_property',
                    fields: {
                        COMPONENT: comp.id,
                        PROPERTY: prop.name
                    }
                });
            });

            // Only add category if it has content
            if (category.contents.length > 0) {
                categories.push(category);
            }
        });

        return categories;
    };

    // Get component methods - NEW!
    const getComponentMethods = (componentType) => {
        const methodMap = {
            'Button': [],
            'Label': [],
            'TextBox': [],
            'Image': [],
            'Canvas': [
                { name: 'Clear', description: 'Clear the canvas' },
                { name: 'DrawCircle', description: 'Draw a circle' },
                { name: 'DrawLine', description: 'Draw a line' },
                { name: 'DrawPoint', description: 'Draw a point' },
                { name: 'DrawText', description: 'Draw text' }
            ],
            'Camera': [
                { name: 'TakePicture', description: 'Take a picture' }
            ],
            'VideoPlayer': [
                { name: 'Start', description: 'Start playing' },
                { name: 'Pause', description: 'Pause playback' },
                { name: 'Stop', description: 'Stop playback' }
            ],
            'Sound': [
                { name: 'Play', description: 'Play the sound' },
                { name: 'Pause', description: 'Pause the sound' },
                { name: 'Resume', description: 'Resume the sound' },
                { name: 'Stop', description: 'Stop the sound' },
                { name: 'Vibrate', description: 'Vibrate device' }
            ],
            'Player': [
                { name: 'Start', description: 'Start playing' },
                { name: 'Pause', description: 'Pause playback' },
                { name: 'Stop', description: 'Stop playback' }
            ],
            'TinyDB': [
                { name: 'StoreValue', description: 'Store a value' },
                { name: 'GetValue', description: 'Get a value' },
                { name: 'ClearAll', description: 'Clear all data' },
                { name: 'ClearTag', description: 'Clear specific tag' }
            ],
            'File': [
                { name: 'SaveFile', description: 'Save text to file' },
                { name: 'ReadFrom', description: 'Read from file' },
                { name: 'Delete', description: 'Delete file' }
            ],
            'Web': [
                { name: 'Get', description: 'HTTP GET request' },
                { name: 'Post', description: 'HTTP POST request' },
                { name: 'PostText', description: 'POST text data' },
                { name: 'PostFile', description: 'POST file' }
            ],
            'Notifier': [
                { name: 'ShowAlert', description: 'Show alert dialog' },
                { name: 'ShowChooseDialog', description: 'Show choice dialog' },
                { name: 'ShowTextDialog', description: 'Show text input dialog' },
                { name: 'ShowMessageDialog', description: 'Show message' }
            ],
            'Clock': [
                { name: 'Now', description: 'Get current time' },
                { name: 'MakeInstant', description: 'Create instant' },
                { name: 'FormatDate', description: 'Format date' },
                { name: 'FormatTime', description: 'Format time' }
            ],
            'LocationSensor': [
                { name: 'LatitudeFromAddress', description: 'Get latitude from address' },
                { name: 'LongitudeFromAddress', description: 'Get longitude from address' }
            ],
            'TextToSpeech': [
                { name: 'Speak', description: 'Speak text' }
            ],
            'SpeechRecognizer': [
                { name: 'GetText', description: 'Start speech recognition' }
            ]
        };

        return methodMap[componentType] || [];
    };

    // Get component events - EXPANDED for all components
    const getComponentEvents = (componentType) => {
        const eventMap = {
            'Button': [
                { name: 'Click', description: 'User tapped and released the button' },
                { name: 'LongClick', description: 'User held the button down' },
                { name: 'TouchDown', description: 'User touched the button' },
                { name: 'TouchUp', description: 'User released the button' },
                { name: 'GotFocus', description: 'Button gained focus' },
                { name: 'LostFocus', description: 'Button lost focus' }
            ],
            'Label': [
                { name: 'Click', description: 'User tapped the label' }
            ],
            'TextBox': [
                { name: 'GotFocus', description: 'User tapped on the text box' },
                { name: 'LostFocus', description: 'User tapped outside the text box' },
                { name: 'TextChanged', description: 'Text content changed' }
            ],
            'PasswordTextBox': [
                { name: 'GotFocus', description: 'User tapped on the password box' },
                { name: 'LostFocus', description: 'User tapped outside the password box' },
                { name: 'TextChanged', description: 'Password content changed' }
            ],
            'CheckBox': [
                { name: 'Changed', description: 'Checkbox state changed' },
                { name: 'GotFocus', description: 'Checkbox gained focus' },
                { name: 'LostFocus', description: 'Checkbox lost focus' }
            ],
            'Switch': [
                { name: 'Changed', description: 'Switch state changed' }
            ],
            'Slider': [
                { name: 'PositionChanged', description: 'Slider position changed' }
            ],
            'Spinner': [
                { name: 'AfterSelecting', description: 'User selected an item' }
            ],
            'ListPicker': [
                { name: 'BeforePicking', description: 'Before picker opens' },
                { name: 'AfterPicking', description: 'After user picks an item' }
            ],
            'ListView': [
                { name: 'AfterPicking', description: 'User selected a list item' }
            ],
            'Image': [
                { name: 'Click', description: 'User tapped the image' }
            ],
            'Canvas': [
                { name: 'Touched', description: 'User touched the canvas' },
                { name: 'Dragged', description: 'User dragged on the canvas' },
                { name: 'Flung', description: 'User flung on the canvas' },
                { name: 'TouchDown', description: 'User touched down' },
                { name: 'TouchUp', description: 'User released touch' }
            ],
            'Camera': [
                { name: 'AfterPicture', description: 'After picture is taken' }
            ],
            'VideoPlayer': [
                { name: 'Completed', description: 'Video finished playing' }
            ],
            'Sound': [
                { name: 'SoundError', description: 'Error playing sound' }
            ],
            'Player': [
                { name: 'Completed', description: 'Audio finished playing' },
                { name: 'PlayerError', description: 'Error playing audio' }
            ],
            'AccelerometerSensor': [
                { name: 'AccelerationChanged', description: 'Acceleration changed' },
                { name: 'Shaking', description: 'Device is shaking' }
            ],
            'LocationSensor': [
                { name: 'LocationChanged', description: 'Location changed' },
                { name: 'StatusChanged', description: 'GPS status changed' }
            ],
            'GyroscopeSensor': [
                { name: 'GyroscopeChanged', description: 'Gyroscope values changed' }
            ],
            'Clock': [
                { name: 'Timer', description: 'Timer fired' }
            ],
            'TinyDB': [],
            'File': [
                { name: 'AfterFileSaved', description: 'File saved successfully' },
                { name: 'GotText', description: 'Text read from file' }
            ],
            'Web': [
                { name: 'GotText', description: 'Response received' },
                { name: 'GotFile', description: 'File downloaded' }
            ],
            'BluetoothClient': [
                { name: 'BluetoothError', description: 'Bluetooth error occurred' }
            ],
            'Screen': [
                { name: 'Initialize', description: 'Screen started' },
                { name: 'BackPressed', description: 'User pressed back button' },
                { name: 'ErrorOccurred', description: 'Error occurred' },
                { name: 'ScreenOrientationChanged', description: 'Orientation changed' }
            ],
            'HorizontalArrangement': [
                { name: 'Click', description: 'User tapped the arrangement' }
            ],
            'VerticalArrangement': [
                { name: 'Click', description: 'User tapped the arrangement' }
            ],
            'TableArrangement': [
                { name: 'Click', description: 'User tapped the arrangement' }
            ]
        };

        return eventMap[componentType] || [];
    };

    // Get component properties - EXPANDED for all components
    const getComponentProperties = (componentType) => {
        const propMap = {
            'Button': [
                { name: 'Text', type: 'String' },
                { name: 'BackgroundColor', type: 'Color' },
                { name: 'TextColor', type: 'Color' },
                { name: 'Enabled', type: 'Boolean' },
                { name: 'FontSize', type: 'Number' },
                { name: 'FontBold', type: 'Boolean' },
                { name: 'Width', type: 'Number' },
                { name: 'Height', type: 'Number' },
                { name: 'Visible', type: 'Boolean' }
            ],
            'Label': [
                { name: 'Text', type: 'String' },
                { name: 'TextColor', type: 'Color' },
                { name: 'BackgroundColor', type: 'Color' },
                { name: 'FontSize', type: 'Number' },
                { name: 'FontBold', type: 'Boolean' },
                { name: 'TextAlignment', type: 'String' },
                { name: 'Width', type: 'Number' },
                { name: 'Height', type: 'Number' },
                { name: 'Visible', type: 'Boolean' }
            ],
            'TextBox': [
                { name: 'Text', type: 'String' },
                { name: 'Hint', type: 'String' },
                { name: 'Enabled', type: 'Boolean' },
                { name: 'FontSize', type: 'Number' },
                { name: 'TextColor', type: 'Color' },
                { name: 'BackgroundColor', type: 'Color' },
                { name: 'MultiLine', type: 'Boolean' },
                { name: 'Width', type: 'Number' },
                { name: 'Height', type: 'Number' },
                { name: 'Visible', type: 'Boolean' }
            ],
            'PasswordTextBox': [
                { name: 'Text', type: 'String' },
                { name: 'Hint', type: 'String' },
                { name: 'Enabled', type: 'Boolean' },
                { name: 'FontSize', type: 'Number' },
                { name: 'Width', type: 'Number' },
                { name: 'Height', type: 'Number' },
                { name: 'Visible', type: 'Boolean' }
            ],
            'CheckBox': [
                { name: 'Text', type: 'String' },
                { name: 'Checked', type: 'Boolean' },
                { name: 'Enabled', type: 'Boolean' },
                { name: 'TextColor', type: 'Color' },
                { name: 'FontSize', type: 'Number' },
                { name: 'Visible', type: 'Boolean' }
            ],
            'Switch': [
                { name: 'Text', type: 'String' },
                { name: 'On', type: 'Boolean' },
                { name: 'Enabled', type: 'Boolean' },
                { name: 'Visible', type: 'Boolean' }
            ],
            'Slider': [
                { name: 'MinValue', type: 'Number' },
                { name: 'MaxValue', type: 'Number' },
                { name: 'ThumbPosition', type: 'Number' },
                { name: 'Visible', type: 'Boolean' }
            ],
            'Spinner': [
                { name: 'Selection', type: 'String' },
                { name: 'Elements', type: 'List' },
                { name: 'Visible', type: 'Boolean' }
            ],
            'ListPicker': [
                { name: 'Text', type: 'String' },
                { name: 'Selection', type: 'String' },
                { name: 'Elements', type: 'List' },
                { name: 'Visible', type: 'Boolean' }
            ],
            'ListView': [
                { name: 'Elements', type: 'List' },
                { name: 'Selection', type: 'String' },
                { name: 'TextColor', type: 'Color' },
                { name: 'BackgroundColor', type: 'Color' },
                { name: 'Visible', type: 'Boolean' }
            ],
            'Image': [
                { name: 'Picture', type: 'String' },
                { name: 'Width', type: 'Number' },
                { name: 'Height', type: 'Number' },
                { name: 'ScalePictureToFit', type: 'Boolean' },
                { name: 'Visible', type: 'Boolean' }
            ],
            'Canvas': [
                { name: 'BackgroundColor', type: 'Color' },
                { name: 'Width', type: 'Number' },
                { name: 'Height', type: 'Number' },
                { name: 'Visible', type: 'Boolean' }
            ],
            'VideoPlayer': [
                { name: 'Source', type: 'String' },
                { name: 'Width', type: 'Number' },
                { name: 'Height', type: 'Number' },
                { name: 'Visible', type: 'Boolean' }
            ],
            'Sound': [
                { name: 'Source', type: 'String' },
                { name: 'MinimumInterval', type: 'Number' }
            ],
            'Player': [
                { name: 'Source', type: 'String' },
                { name: 'Loop', type: 'Boolean' },
                { name: 'Volume', type: 'Number' }
            ],
            'TinyDB': [],
            'File': [],
            'Clock': [
                { name: 'TimerInterval', type: 'Number' },
                { name: 'TimerEnabled', type: 'Boolean' }
            ],
            'AccelerometerSensor': [
                { name: 'Enabled', type: 'Boolean' },
                { name: 'XAccel', type: 'Number' },
                { name: 'YAccel', type: 'Number' },
                { name: 'ZAccel', type: 'Number' }
            ],
            'LocationSensor': [
                { name: 'Enabled', type: 'Boolean' },
                { name: 'Latitude', type: 'Number' },
                { name: 'Longitude', type: 'Number' }
            ],
            'GyroscopeSensor': [
                { name: 'Enabled', type: 'Boolean' }
            ],
            'Web': [
                { name: 'Url', type: 'String' }
            ],
            'HorizontalArrangement': [
                { name: 'BackgroundColor', type: 'Color' },
                { name: 'Width', type: 'Number' },
                { name: 'Height', type: 'Number' },
                { name: 'Visible', type: 'Boolean' }
            ],
            'VerticalArrangement': [
                { name: 'BackgroundColor', type: 'Color' },
                { name: 'Width', type: 'Number' },
                { name: 'Height', type: 'Number' },
                { name: 'Visible', type: 'Boolean' }
            ],
            'TableArrangement': [
                { name: 'BackgroundColor', type: 'Color' },
                { name: 'Columns', type: 'Number' },
                { name: 'Rows', type: 'Number' },
                { name: 'Width', type: 'Number' },
                { name: 'Height', type: 'Number' },
                { name: 'Visible', type: 'Boolean' }
            ]
        };

        return propMap[componentType] || [];
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
                className="flex-1 w-full h-full min-h-[400px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[700px]"
                style={{
                    position: 'relative'
                }}
            />

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
