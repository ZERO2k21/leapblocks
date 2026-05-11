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
import '../blocks/definitions/control_complete';
import '../blocks/definitions/components';
import '../blocks/generators/reactnative';
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

        // Create toolbox
        const toolbox = createToolbox(appState);

        // Workspace configuration
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
            move: {
                scrollbars: {
                    horizontal: true,
                    vertical: true
                },
                drag: true,
                wheel: true
            },
            theme: createCustomTheme()
        });

        workspaceRef.current = workspace;

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

        // Cleanup
        return () => {
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

    // Create custom theme
    const createCustomTheme = () => {
        return Blockly.Theme.defineTheme('appinventor', {
            'base': Blockly.Themes.Classic,
            'blockStyles': {
                'control_blocks': {
                    'colourPrimary': BLOCK_COLORS.control,
                    'colourSecondary': '#D4A017',
                    'colourTertiary': '#B8860B'
                },
                'logic_blocks': {
                    'colourPrimary': BLOCK_COLORS.logic,
                    'colourSecondary': '#3A7BC8',
                    'colourTertiary': '#2E5FA8'
                },
                'math_blocks': {
                    'colourPrimary': BLOCK_COLORS.math,
                    'colourSecondary': '#4A5785',
                    'colourTertiary': '#3A4765'
                },
                'text_blocks': {
                    'colourPrimary': BLOCK_COLORS.text,
                    'colourSecondary': '#68A83A',
                    'colourTertiary': '#588830'
                },
                'list_blocks': {
                    'colourPrimary': BLOCK_COLORS.lists,
                    'colourSecondary': '#C03838',
                    'colourTertiary': '#A02828'
                },
                'event_blocks': {
                    'colourPrimary': BLOCK_COLORS.events,
                    'colourSecondary': '#E8C520',
                    'colourTertiary': '#D0B010'
                },
                'method_blocks': {
                    'colourPrimary': BLOCK_COLORS.methods,
                    'colourSecondary': '#7A3F79',
                    'colourTertiary': '#6A2F69'
                }
            },
            'categoryStyles': {
                'control_category': {
                    'colour': BLOCK_COLORS.control
                },
                'logic_category': {
                    'colour': BLOCK_COLORS.logic
                },
                'math_category': {
                    'colour': BLOCK_COLORS.math
                },
                'text_category': {
                    'colour': BLOCK_COLORS.text
                },
                'list_category': {
                    'colour': BLOCK_COLORS.lists
                },
                'color_category': {
                    'colour': BLOCK_COLORS.colors
                },
                'variable_category': {
                    'colour': BLOCK_COLORS.variables
                },
                'procedure_category': {
                    'colour': BLOCK_COLORS.procedures
                }
            }
        });
    };

    // Create toolbox XML
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
                // Built-in blocks
                {
                    kind: 'category',
                    name: 'Control',
                    colour: BLOCK_COLORS.control,
                    contents: [
                        { kind: 'block', type: 'controls_if' },
                        { kind: 'block', type: 'controls_if_else' },
                        { kind: 'block', type: 'controls_forEach' },
                        { kind: 'block', type: 'controls_forRange' },
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
                    colour: BLOCK_COLORS.logic,
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
                    colour: BLOCK_COLORS.text,
                    contents: [
                        { kind: 'block', type: 'text' },
                        { kind: 'block', type: 'text_join' },
                        { kind: 'block', type: 'text_length' },
                        { kind: 'block', type: 'text_isEmpty' },
                        { kind: 'block', type: 'text_indexOf' },
                        { kind: 'block', type: 'text_charAt' },
                        { kind: 'block', type: 'text_getSubstring' },
                        { kind: 'block', type: 'text_changeCase' },
                        { kind: 'block', type: 'text_trim' }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Lists',
                    colour: BLOCK_COLORS.lists,
                    contents: [
                        { kind: 'block', type: 'lists_create_empty' },
                        { kind: 'block', type: 'lists_create_with' },
                        { kind: 'block', type: 'lists_repeat' },
                        { kind: 'block', type: 'lists_length' },
                        { kind: 'block', type: 'lists_isEmpty' },
                        { kind: 'block', type: 'lists_indexOf' },
                        { kind: 'block', type: 'lists_getIndex' },
                        { kind: 'block', type: 'lists_setIndex' }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Colors',
                    colour: BLOCK_COLORS.colors,
                    contents: [
                        { kind: 'block', type: 'colour_picker' },
                        { kind: 'block', type: 'colour_random' },
                        { kind: 'block', type: 'colour_rgb' },
                        { kind: 'block', type: 'colour_blend' }
                    ]
                },
                {
                    kind: 'sep'
                },
                // Component blocks
                ...generateComponentCategories(components)
            ]
        };
    };

    // Generate component categories
    const generateComponentCategories = (components) => {
        const categories = [];

        components.forEach(comp => {
            const category = {
                kind: 'category',
                name: comp.id,
                colour: BLOCK_COLORS.events,
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

            categories.push(category);
        });

        return categories;
    };

    // Get component events
    const getComponentEvents = (componentType) => {
        const eventMap = {
            'Button': [
                { name: 'Click', description: 'User tapped and released the button' },
                { name: 'LongClick', description: 'User held the button down' },
                { name: 'TouchDown', description: 'User touched the button' },
                { name: 'TouchUp', description: 'User released the button' }
            ],
            'Label': [
                { name: 'Click', description: 'User tapped the label' }
            ],
            'TextBox': [
                { name: 'GotFocus', description: 'User tapped on the text box' },
                { name: 'LostFocus', description: 'User tapped outside the text box' }
            ],
            'Screen': [
                { name: 'Initialize', description: 'Screen started' },
                { name: 'BackPressed', description: 'User pressed back button' }
            ]
        };

        return eventMap[componentType] || [];
    };

    // Get component properties
    const getComponentProperties = (componentType) => {
        const propMap = {
            'Button': [
                { name: 'Text', type: 'String' },
                { name: 'BackgroundColor', type: 'Color' },
                { name: 'Enabled', type: 'Boolean' },
                { name: 'FontSize', type: 'Number' }
            ],
            'Label': [
                { name: 'Text', type: 'String' },
                { name: 'TextColor', type: 'Color' },
                { name: 'FontSize', type: 'Number' }
            ],
            'TextBox': [
                { name: 'Text', type: 'String' },
                { name: 'Hint', type: 'String' },
                { name: 'Enabled', type: 'Boolean' }
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
        <div className="flex flex-col h-full bg-[#edf1f6]">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#dfe6ee] border-b border-[#c6cfda]">
                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search blocks..."
                            className="pl-8 pr-3 py-1.5 text-sm border border-[#b7c4d4] rounded focus:outline-none focus:ring-1 focus:ring-[#4a90e2]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Zoom controls */}
                    <div className="flex gap-1 ml-4">
                        <button
                            onClick={handleZoomIn}
                            className="p-1.5 hover:bg-[#e4ebf3] rounded"
                            title="Zoom In"
                        >
                            <ZoomIn className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleZoomOut}
                            className="p-1.5 hover:bg-[#e4ebf3] rounded"
                            title="Zoom Out"
                        >
                            <ZoomOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Actions */}
                    <button
                        onClick={handleGenerateCode}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#4a90e2] hover:bg-[#3f79bf] text-white text-sm font-medium rounded transition-colors"
                    >
                        <Code className="h-4 w-4" />
                        Generate Code
                    </button>
                    <button
                        onClick={handleExport}
                        className="p-1.5 hover:bg-[#e4ebf3] rounded"
                        title="Export Blocks"
                    >
                        <Download className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleImport}
                        className="p-1.5 hover:bg-[#e4ebf3] rounded"
                        title="Import Blocks"
                    >
                        <Upload className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleClear}
                        className="p-1.5 hover:bg-red-100 text-red-600 rounded"
                        title="Clear All"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Blockly Workspace */}
            <div ref={blocklyDiv} className="flex-1" />

            {/* Code Preview Modal */}
            {showCode && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-3/4 h-3/4 flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <h3 className="text-lg font-semibold">Generated Code</h3>
                            <button
                                onClick={() => setShowCode(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono">
                                {generatedCode}
                            </pre>
                        </div>
                        <div className="flex justify-end gap-2 px-4 py-3 border-t">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedCode);
                                    alert('Code copied to clipboard!');
                                }}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                            >
                                Copy Code
                            </button>
                            <button
                                onClick={() => setShowCode(false)}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
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
