/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Block Color Scheme - Matches MIT App Inventor
 */

export const BLOCK_COLORS = {
    // Built-in blocks (MIT App Inventor colors)
    control: '#E8B024',      // Yellow/Gold - Control flow
    logic: '#4A90E2',        // Blue - Boolean logic
    math: '#5B67A5',         // Purple - Math operations
    text: '#77C043',         // Green - Text/String operations
    lists: '#D94848',        // Red - List/Array operations
    colors: '#A55B80',       // Pink/Purple - Color operations
    variables: '#9C27B0',    // Purple - Variables
    procedures: '#632D99',   // Dark Purple - Functions/Procedures

    // Component blocks
    events: '#FFD700',       // Gold - Event handlers (when blocks)
    methods: '#8B4789',      // Purple - Method calls (call blocks)
    properties: '#4A90E2',   // Blue - Property get/set blocks

    // Special blocks
    screen: '#FF6F00',       // Orange - Screen blocks
    sensor: '#10B981',       // Green - Sensor blocks
    storage: '#6366F1',      // Indigo - Storage blocks
    media: '#EC4899',        // Pink - Media blocks
    social: '#F59E0B',       // Amber - Social blocks
    connectivity: '#06B6D4', // Cyan - Connectivity blocks
};

export const BLOCK_STYLES = {
    // Hat blocks (event handlers)
    hat: {
        hat: 'cap'
    },

    // Statement blocks
    statement: {
        previousStatement: true,
        nextStatement: true
    },

    // Value blocks (return a value)
    value: {
        output: true
    },

    // Boolean blocks
    boolean: {
        output: 'Boolean'
    }
};
