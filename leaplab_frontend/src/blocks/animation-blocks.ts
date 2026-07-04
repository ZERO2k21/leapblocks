/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import Blockly from '@blockly-runtime';

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION BLOCKS - For Stage Mode (sprites and animation)
// ═══════════════════════════════════════════════════════════════════════════

const COLORS = {
    motion: '#4C97FF',       // leap Blue - Motion blocks
    looks: '#9966FF',        // leap Purple - Looks blocks
    sound: '#CF63CF',        // leap Magenta - Sound blocks
    events: '#FFBF00',       // leap Yellow - Events
    control: '#FFAB19',      // leap Orange - Control blocks
    sensing: '#5CB1D6',      // leap Cyan - Sensing
    operators: '#59C059',    // leap Green - Operators
    data: '#FF8C1A',         // leap Orange - Variables
    variables: '#FF8C1A',    // Alias
    list: '#FF8C1A',         // Unified orange
    myblocks: '#FF6680',     // leap Pink - My Blocks
    pen: '#0FBD8C',          // leap Green - Pen blocks
};

export const animationBlocks = [
    // ═══════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'event_flag_clicked',
        message0: '🏳️ when green flag clicked',
        nextStatement: null,
        colour: COLORS.events,
        tooltip: 'Runs when the green flag is clicked',
        helpUrl: '',
    },
    {
        type: 'event_sprite_clicked',
        message0: '👆 when this sprite clicked',
        nextStatement: null,
        colour: COLORS.events,
        tooltip: 'Runs when this sprite is clicked',
        helpUrl: '',
    },
    {
        type: 'event_stage_clicked',
        message0: '👆 when stage clicked',
        nextStatement: null,
        colour: COLORS.events,
        tooltip: 'Runs when the stage is clicked',
        helpUrl: '',
    },
    {
        type: 'event_key_pressed',
        message0: '⌨️ when %1 key pressed',
        args0: [{
            type: 'field_dropdown',
            name: 'KEY',
            options: [
                ['any', 'any'], ['space', 'space'], ['up arrow', 'ArrowUp'], ['down arrow', 'ArrowDown'],
                ['left arrow', 'ArrowLeft'], ['right arrow', 'ArrowRight'], ['enter', 'enter'],
                ['a', 'a'], ['b', 'b'], ['c', 'c'], ['d', 'd'], ['e', 'e'], ['f', 'f'], ['g', 'g'], ['h', 'h'], ['i', 'i'], ['j', 'j'], ['k', 'k'], ['l', 'l'], ['m', 'm'], ['n', 'n'], ['o', 'o'], ['p', 'p'], ['q', 'q'], ['r', 'r'], ['s', 's'], ['t', 't'], ['u', 'u'], ['v', 'v'], ['w', 'w'], ['x', 'x'], ['y', 'y'], ['z', 'z'],
                ['0', '0'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6'], ['7', '7'], ['8', '8'], ['9', '9'],
            ],
        }],
        nextStatement: null,
        colour: COLORS.events,
        tooltip: 'Runs when a key is pressed',
        helpUrl: '',
    },
    {
        type: 'event_backdrop_switch',
        message0: '🎭 when backdrop switches to %1',
        args0: [{
            type: 'field_dropdown',
            name: 'BACKDROP',
            options: [['backdrop1', 'backdrop1']],
        }],
        nextStatement: null,
        colour: COLORS.events,
        tooltip: 'Runs when backdrop changes',
        helpUrl: '',
    },
    {
        type: 'event_greater_than',
        message0: '📊 when %1 > %2',
        args0: [
            { type: 'field_dropdown', name: 'SENSOR', options: [['loudness', 'loudness'], ['timer', 'timer']] },
            { type: 'field_number', name: 'VALUE', value: 10 },
        ],
        nextStatement: null,
        colour: COLORS.events,
        tooltip: 'Runs when value exceeds threshold',
        helpUrl: '',
    },
    {
        type: 'event_clone_start',
        message0: '🔄 when I start as a clone',
        nextStatement: null,
        colour: COLORS.events,
        tooltip: 'Runs when this sprite starts as clone',
        helpUrl: '',
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MOTION
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'motion_move_steps',
        message0: '➡️ move right %1 steps',
        args0: [{ type: 'input_value', name: 'STEPS' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Move sprite forward',
        helpUrl: '',
    },
    {
        type: 'motion_move_left',
        message0: '⬅️ move left %1 steps',
        args0: [{ type: 'input_value', name: 'STEPS' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Move sprite to the left',
        helpUrl: '',
    },
    {
        type: 'motion_move_up',
        message0: '⬆️ move up %1 steps',
        args0: [{ type: 'input_value', name: 'STEPS' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Move sprite up',
        helpUrl: '',
    },
    {
        type: 'motion_move_down',
        message0: '⬇️ move down %1 steps',
        args0: [{ type: 'input_value', name: 'STEPS' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Move sprite down',
        helpUrl: '',
    },
    {
        type: 'motion_turn_right',
        message0: '↻ turn right %1 degrees',
        args0: [{ type: 'input_value', name: 'DEGREES' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Turn clockwise',
        helpUrl: '',
    },
    {
        type: 'motion_turn_left',
        message0: '↺ turn left %1 degrees',
        args0: [{ type: 'input_value', name: 'DEGREES' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Turn counter-clockwise',
        helpUrl: '',
    },
    {
        type: 'motion_go_to_xy',
        message0: 'go to x: %1 y: %2',
        args0: [
            { type: 'input_value', name: 'X' },
            { type: 'input_value', name: 'Y' },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Move sprite to position',
        helpUrl: '',
    },
    {
        type: 'motion_glide_to_xy',
        message0: 'glide %1 secs to x: %2 y: %3',
        args0: [
            { type: 'input_value', name: 'SECS' },
            { type: 'input_value', name: 'X' },
            { type: 'input_value', name: 'Y' },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Glide smoothly to position',
        helpUrl: '',
    },
    {
        type: 'motion_point_direction',
        message0: '🧭 point in direction %1',
        args0: [{ type: 'input_value', name: 'DIRECTION' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Point sprite in direction (90 = right)',
        helpUrl: '',
    },
    {
        type: 'motion_change_x',
        message0: '↔️ change x by %1',
        args0: [{ type: 'input_value', name: 'DX' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Change horizontal position',
        helpUrl: '',
    },
    {
        type: 'motion_change_y',
        message0: '↕️ change y by %1',
        args0: [{ type: 'input_value', name: 'DY' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Change vertical position',
        helpUrl: '',
    },
    {
        type: 'motion_set_x',
        message0: '📐 set x to %1',
        args0: [{ type: 'input_value', name: 'X' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Set horizontal position',
        helpUrl: '',
    },
    {
        type: 'motion_set_y',
        message0: '📐 set y to %1',
        args0: [{ type: 'input_value', name: 'Y' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Set vertical position',
        helpUrl: '',
    },
    {
        type: 'motion_x_position',
        message0: 'x position',
        output: 'Number',
        colour: COLORS.motion,
        tooltip: 'Get x position of sprite',
        helpUrl: '',
    },
    {
        type: 'motion_y_position',
        message0: 'y position',
        output: 'Number',
        colour: COLORS.motion,
        tooltip: 'Get y position of sprite',
        helpUrl: '',
    },
    {
        type: 'motion_direction',
        message0: 'direction',
        output: 'Number',
        colour: COLORS.motion,
        tooltip: 'Get direction of sprite',
        helpUrl: '',
    },

    // Additional leap-style motion blocks
    {
        type: 'motion_point_towards',
        message0: '👉 point towards %1',
        args0: [{
            type: 'field_dropdown',
            name: 'TOWARDS',
            options: [
                ['mouse-pointer', 'mouse'],
                // Sprite options will be populated dynamically at runtime
            ],
        }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Point towards mouse-pointer or another sprite',
        helpUrl: '',
    },
    {
        type: 'motion_change_rotation_style',
        message0: '🔄 set rotation style %1',
        args0: [{
            type: 'field_dropdown',
            name: 'STYLE',
            options: [
                ['left-right', 'left-right'],
                ['don\'t rotate', 'none'],
                ['all around', 'all-around'],
            ],
        }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Set how sprite rotates',
        helpUrl: '',
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // LeapblOX MOTION BLOCKS (Additional)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'motion_go_to',
        message0: 'go to %1',
        args0: [{
            type: 'field_dropdown',
            name: 'TO',
            options: [
                ['random position', '_random_'],
                ['mouse-pointer', '_mouse_'],
                // Sprite options will be populated dynamically at runtime
            ],
        }],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Go to random position or mouse-pointer',
        helpUrl: '',
    },
    {
        type: 'motion_glide_to',
        message0: 'glide %1 secs to %2',
        args0: [
            { type: 'field_number', name: 'SECS', value: 1, min: 0.1 },
            {
                type: 'field_dropdown',
                name: 'TO',
                options: [
                    ['random position', '_random_'],
                    ['mouse-pointer', '_mouse_'],
                    // Sprite options will be populated dynamically at runtime
                ],
            },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Glide smoothly to random position or mouse',
        helpUrl: '',
    },
    {
        type: 'motion_point_towards',
        message0: '🧭 point towards %1',
        args0: [{
            type: 'field_dropdown',
            name: 'TOWARDS',
            options: [
                ['mouse-pointer', 'mouse'],
                ['random direction', 'random'],
                // Sprite options will be populated dynamically at runtime
            ],
        }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Point towards mouse or random direction',
        helpUrl: '',
    },
    {
        type: 'motion_if_on_edge_bounce',
        message0: '🔄 if on edge, bounce',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Bounce when reaching stage edge',
        helpUrl: '',
    },
    {
        type: 'motion_set_rotation_style',
        message0: '🔄 set rotation style to %1',
        args0: [{
            type: 'field_dropdown',
            name: 'STYLE',
            options: [
                ['left-right', 'left-right'],
                ['all around', 'all around'],
                ["don't rotate", 'none'],
            ],
        }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'How sprite rotates when moving',
        helpUrl: '',
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // LOOKS
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'looks_say_for_secs',
        message0: '🗣️ say %1 for %2 seconds',
        args0: [
            { type: 'input_value', name: 'MESSAGE', check: ['String', 'Number'] },
            { type: 'input_value', name: 'SECS', check: 'Number' },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Say message for seconds',
        helpUrl: '',
    },
    {
        type: 'looks_say',
        message0: '🗣️ say %1',
        args0: [{ type: 'input_value', name: 'MESSAGE', check: ['String', 'Number'] }],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Say message',
        helpUrl: '',
    },
    {
        type: 'looks_show',
        message0: '👁️ show',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Make sprite visible',
        helpUrl: '',
    },
    {
        type: 'looks_hide',
        message0: '🙈 hide',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Make sprite invisible',
        helpUrl: '',
    },
    {
        type: 'looks_next_costume',
        message0: '👔 next costume',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Switch to next costume',
        helpUrl: '',
    },
    {
        type: 'looks_set_size',
        message0: '📏 set size to %1 %',
        args0: [{ type: 'field_number', name: 'SIZE', value: 100, min: 1, max: 500 }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Set sprite size',
        helpUrl: '',
    },
    {
        type: 'looks_change_size',
        message0: '📏 change size by %1',
        args0: [{ type: 'field_number', name: 'CHANGE', value: 10 }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Change sprite size',
        helpUrl: '',
    },
    {
        type: 'looks_set_effect',
        message0: '🎨 set %1 effect to %2',
        args0: [
            {
                type: 'field_dropdown',
                name: 'EFFECT',
                options: [
                    ['color', 'color'],
                    ['fisheye', 'fisheye'],
                    ['whirl', 'whirl'],
                    ['pixelate', 'pixelate'],
                    ['mosaic', 'mosaic'],
                    ['brightness', 'brightness'],
                    ['ghost', 'ghost'],
                ],
            },
            { type: 'field_number', name: 'VALUE', value: 0, min: 0, max: 100 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Set graphic effect',
        helpUrl: '',
    },
    {
        type: 'looks_change_effect',
        message0: '🎨 change %1 effect by %2',
        args0: [
            {
                type: 'field_dropdown',
                name: 'EFFECT',
                options: [
                    ['color', 'color'],
                    ['fisheye', 'fisheye'],
                    ['whirl', 'whirl'],
                    ['pixelate', 'pixelate'],
                    ['mosaic', 'mosaic'],
                    ['brightness', 'brightness'],
                    ['ghost', 'ghost'],
                ],
            },
            { type: 'field_number', name: 'CHANGE', value: 25 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Change graphic effect by amount',
        helpUrl: '',
    },
    {
        type: 'looks_clear_effects',
        message0: '🎨 clear graphic effects',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Reset all effects',
        helpUrl: '',
    },
    {
        type: 'looks_think_for_secs',
        message0: '💭 think %1 for %2 seconds',
        args0: [
            { type: 'input_value', name: 'MESSAGE', check: ['String', 'Number'] },
            { type: 'input_value', name: 'SECS', check: 'Number' },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Show thought bubble for seconds',
        helpUrl: '',
    },
    {
        type: 'looks_think',
        message0: '💭 think %1',
        args0: [{ type: 'input_value', name: 'MESSAGE', check: ['String', 'Number'] }],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Show thought bubble',
        helpUrl: '',
    },
    {
        type: 'looks_switch_costume',
        message0: '👔 switch costume to %1',
        args0: [{
            type: 'field_dropdown',
            name: 'COSTUME',
            options: () => {
                if (typeof window !== 'undefined' && (window as any).getActiveSpriteCostumes) {
                    const costumes = (window as any).getActiveSpriteCostumes();
                    if (costumes && costumes.length > 0) return costumes.map((c: string) => [c, c]);
                }
                return [['costume1', 'costume1'], ['costume2', 'costume2']];
            },
        }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Switch to specific costume',
        helpUrl: '',
    },
    {
        type: 'looks_switch_backdrop',
        message0: '🎭 switch backdrop to %1',
        args0: [{
            type: 'field_dropdown',
            name: 'BACKDROP',
            options: () => {
                if (typeof window !== 'undefined' && (window as any).getActiveStageBackdrops) {
                    const backdrops = (window as any).getActiveStageBackdrops();
                    if (backdrops && backdrops.length > 0) return backdrops.map((b: string) => [b, b]);
                }
                return [['backdrop1', 'backdrop1']];
            },
        }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Change stage backdrop',
        helpUrl: '',
    },
    {
        type: 'looks_next_backdrop',
        message0: '🎭 next backdrop',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Switch to next backdrop',
        helpUrl: '',
    },
    {
        type: 'looks_go_to_layer',
        message0: '📚 go to %1 layer',
        args0: [{ type: 'field_dropdown', name: 'LAYER', options: [['front', 'front'], ['back', 'back']] }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Go to front or back layer',
        helpUrl: '',
    },
    {
        type: 'looks_go_forward_layers',
        message0: '📚 go %1 %2 layers',
        args0: [
            { type: 'field_dropdown', name: 'DIRECTION', options: [['forward', 'forward'], ['backward', 'backward']] },
            { type: 'field_number', name: 'LAYERS', value: 1, min: 1 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Move layers forward/backward',
        helpUrl: '',
    },
    {
        type: 'looks_mirror',
        message0: '🪞 mirror',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Mirror the sprite image (lateral inversion)',
        helpUrl: '',
    },
    {
        type: 'looks_size',
        message0: 'size',
        output: 'Number',
        colour: COLORS.looks,
        tooltip: 'Get sprite size',
        helpUrl: '',
    },
    {
        type: 'looks_costume_number',
        message0: 'costume #',
        output: 'Number',
        colour: COLORS.looks,
        tooltip: 'Get current costume number (1-based)',
        helpUrl: '',
    },
    {
        type: 'looks_costume_name',
        message0: 'costume name',
        output: 'String',
        colour: COLORS.looks,
        tooltip: 'Get current costume name',
        helpUrl: '',
    },
    {
        type: 'looks_backdrop_number',
        message0: 'backdrop #',
        output: 'Number',
        colour: COLORS.looks,
        tooltip: 'Get current backdrop number (1-based)',
        helpUrl: '',
    },
    {
        type: 'looks_backdrop_name',
        message0: 'backdrop name',
        output: 'String',
        colour: COLORS.looks,
        tooltip: 'Get current backdrop name',
        helpUrl: '',
    },

    // Additional leap-style looks blocks
    {
        type: 'looks_set_brightness',
        message0: '💡 set brightness to %1',
        args0: [{ type: 'field_number', name: 'BRIGHTNESS', value: 100, min: 0, max: 100 }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Set sprite brightness',
        helpUrl: '',
    },
    {
        type: 'looks_change_brightness',
        message0: '💡 change brightness by %1',
        args0: [{ type: 'field_number', name: 'CHANGE', value: 10, min: -100, max: 100 }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Change sprite brightness',
        helpUrl: '',
    },
    {
        type: 'looks_set_transparency',
        message0: '👻 set transparency to %1',
        args0: [{ type: 'field_number', name: 'TRANSPARENCY', value: 0, min: 0, max: 100 }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Set sprite transparency',
        helpUrl: '',
    },
    {
        type: 'looks_change_transparency',
        message0: '👻 change transparency by %1',
        args0: [{ type: 'field_number', name: 'CHANGE', value: 10, min: -100, max: 100 }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Change sprite transparency',
        helpUrl: '',
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // CONTROL (Animation)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'control_wait',
        message0: '⏱️ wait %1 seconds',
        args0: [{ type: 'input_value', name: 'SECS' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.control,
        tooltip: 'Wait before continuing',
        helpUrl: '',
    },
    {
        type: 'control_repeat',
        message0: '🔁 repeat %1 times',
        args0: [{ type: 'input_value', name: 'TIMES' }],
        message1: '%1',
        args1: [{ type: 'input_statement', name: 'DO' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.control,
        tooltip: 'Repeat code N times',
        helpUrl: '',
    },
    {
        type: 'control_forever',
        message0: '🔄 forever',
        message1: '%1',
        args1: [{ type: 'input_statement', name: 'DO' }],
        previousStatement: null,
        colour: COLORS.control,
        tooltip: 'Repeat forever',
        helpUrl: '',
    },
    {
        type: 'control_if',
        message0: '❓ if %1 then',
        args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
        message1: '%1',
        args1: [{ type: 'input_statement', name: 'DO' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.control,
        tooltip: 'If condition is true',
        helpUrl: '',
    },
    {
        type: 'control_stop',
        message0: '🛑 stop %1',
        args0: [{
            type: 'field_dropdown',
            name: 'STOP_OPTION',
            options: [['all', 'all'], ['this script', 'this script'], ['other scripts in sprite', 'other scripts']],
        }],
        previousStatement: null,
        colour: COLORS.control,
        tooltip: 'Stop scripts',
        helpUrl: '',
    },
    {
        type: 'control_if_else',
        message0: '❓ if %1 then',
        args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
        message1: '%1',
        args1: [{ type: 'input_statement', name: 'DO' }],
        message2: 'else %1',
        args2: [{ type: 'input_statement', name: 'ELSE' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.control,
        tooltip: 'If-else condition',
        helpUrl: '',
    },
    {
        type: 'control_wait_until',
        message0: '⏳ wait until %1',
        args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.control,
        tooltip: 'Wait until condition is true',
        helpUrl: '',
    },
    {
        type: 'control_repeat_until',
        message0: '🔁 repeat until %1',
        args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
        message1: '%1',
        args1: [{ type: 'input_statement', name: 'DO' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.control,
        tooltip: 'Repeat until condition is true',
        helpUrl: '',
    },
    {
        type: 'control_create_clone',
        message0: '🔄 create clone of %1',
        args0: [{
            type: 'field_dropdown',
            name: 'CLONE_OPTION',
            options: () => {
                const baseOptions: [string, string][] = [['myself', '_myself_']];
                if (typeof window !== 'undefined' && (window as any).getAllSpriteNames) {
                    const names: string[] = (window as any).getAllSpriteNames();
                    if (names && names.length > 0) {
                        for (const name of names) {
                            baseOptions.push([name, name]);
                        }
                    }
                }
                return baseOptions;
            },
        }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.control,
        tooltip: 'Create a clone of this sprite',
        helpUrl: '',
    },
    {
        type: 'control_delete_clone',
        message0: '🗑️ delete this clone',
        previousStatement: null,
        colour: COLORS.control,
        tooltip: 'Delete this clone',
        helpUrl: '',
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SENSING
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'sensing_key_pressed',
        message0: 'key %1 pressed?',
        args0: [{
            type: 'field_dropdown',
            name: 'KEY',
            options: [
                ['any', 'any'], ['space', 'space'], ['up arrow', 'ArrowUp'], ['down arrow', 'ArrowDown'],
                ['left arrow', 'ArrowLeft'], ['right arrow', 'ArrowRight'], ['enter', 'enter'],
                ['a', 'a'], ['b', 'b'], ['c', 'c'], ['d', 'd'], ['e', 'e'], ['f', 'f'], ['g', 'g'], ['h', 'h'], ['i', 'i'], ['j', 'j'], ['k', 'k'], ['l', 'l'], ['m', 'm'], ['n', 'n'], ['o', 'o'], ['p', 'p'], ['q', 'q'], ['r', 'r'], ['s', 's'], ['t', 't'], ['u', 'u'], ['v', 'v'], ['w', 'w'], ['x', 'x'], ['y', 'y'], ['z', 'z'],
                ['0', '0'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6'], ['7', '7'], ['8', '8'], ['9', '9'],
            ],
        }],
        output: 'Boolean',
        colour: COLORS.sensing,
        tooltip: 'Check if key is pressed',
        helpUrl: '',
    },
    {
        type: 'sensing_mouse_x',
        message0: 'mouse x',
        output: 'Number',
        colour: COLORS.sensing,
        tooltip: 'Mouse x position',
        helpUrl: '',
    },
    {
        type: 'sensing_mouse_y',
        message0: 'mouse y',
        output: 'Number',
        colour: COLORS.sensing,
        tooltip: 'Mouse y position',
        helpUrl: '',
    },
    {
        type: 'sensing_timer',
        message0: 'timer',
        output: 'Number',
        colour: COLORS.sensing,
        tooltip: 'Timer value in seconds',
        helpUrl: '',
    },
    {
        type: 'sensing_reset_timer',
        message0: 'reset timer',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.sensing,
        tooltip: 'Reset the timer to 0',
        helpUrl: '',
    },
    {
        type: 'sensing_touching',
        message0: 'touching %1 ?',
        args0: [{
            type: 'field_dropdown',
            name: 'OBJECT',
            options: () => {
                const baseOptions: [string, string][] = [['mouse-pointer', '_mouse_'], ['edge', '_edge_']];
                if (typeof window !== 'undefined' && (window as any).getAllSpriteNames) {
                    const names: string[] = (window as any).getAllSpriteNames();
                    if (names && names.length > 0) {
                        for (const name of names) {
                            baseOptions.push([name, name]);
                        }
                    }
                }
                return baseOptions;
            },
        }],
        output: 'Boolean',
        colour: COLORS.sensing,
        tooltip: 'Check if touching object',
        helpUrl: '',
    },
    {
        type: 'sensing_touching_color',
        message0: 'touching color %1 ?',
        args0: [{ type: 'field_colour', name: 'COLOR', colour: '#ff0000' }],
        output: 'Boolean',
        colour: COLORS.sensing,
        tooltip: 'Check if touching a color',
        helpUrl: '',
    },
    {
        type: 'sensing_color_touching_color',
        message0: 'color %1 is touching %2 ?',
        args0: [
            { type: 'field_colour', name: 'COLOR1', colour: '#ff0000' },
            { type: 'field_colour', name: 'COLOR2', colour: '#00ff00' },
        ],
        output: 'Boolean',
        colour: COLORS.sensing,
        tooltip: 'Check if colors are touching',
        helpUrl: '',
    },
    {
        type: 'sensing_distance_to',
        message0: 'distance to %1',
        args0: [{
            type: 'field_dropdown',
            name: 'OBJECT',
            options: () => {
                const baseOptions: [string, string][] = [['mouse-pointer', '_mouse_'], ['edge', '_edge_']];
                if (typeof window !== 'undefined' && (window as any).getAllSpriteNames) {
                    const names: string[] = (window as any).getAllSpriteNames();
                    if (names && names.length > 0) {
                        for (const name of names) {
                            baseOptions.push([name, name]);
                        }
                    }
                }
                return baseOptions;
            },
        }],
        output: 'Number',
        colour: COLORS.sensing,
        tooltip: 'Distance to object',
        helpUrl: '',
    },
    {
        type: 'sensing_ask',
        message0: 'ask %1 and wait',
        args0: [{ type: 'input_value', name: 'QUESTION' }],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.sensing,
        tooltip: 'Ask a question and wait for answer',
        helpUrl: '',
    },
    {
        type: 'sensing_answer',
        message0: 'answer',
        output: ['String', 'Number'],
        colour: COLORS.sensing,
        tooltip: 'The answer to the last question',
        helpUrl: '',
    },
    {
        type: 'sensing_speech',
        message0: 'speech',
        output: ['String', 'Number'],
        colour: COLORS.sensing,
        tooltip: 'The last recognized speech text',
        helpUrl: '',
    },
    {
        type: 'sensing_mouse_down',
        message0: 'mouse down?',
        output: 'Boolean',
        colour: COLORS.sensing,
        tooltip: 'Check if mouse button is pressed',
        helpUrl: '',
    },

    // Additional leap-style sensing blocks
    {
        type: 'sensing_loudness',
        message0: 'loudness',
        output: 'Number',
        colour: COLORS.sensing,
        tooltip: 'Loudness level from microphone',
        helpUrl: '',
    },
    {
        type: 'sensing_current_year',
        message0: 'current year',
        output: 'Number',
        colour: COLORS.sensing,
        tooltip: 'Current year',
        helpUrl: '',
    },
    {
        type: 'sensing_current_month',
        message0: 'current month',
        output: 'Number',
        colour: COLORS.sensing,
        tooltip: 'Current month (1-12)',
        helpUrl: '',
    },
    {
        type: 'sensing_current_date',
        message0: 'current date',
        output: 'Number',
        colour: COLORS.sensing,
        tooltip: 'Current date of month',
        helpUrl: '',
    },
    {
        type: 'sensing_current_day_of_week',
        message0: 'day of week',
        output: 'String',
        colour: COLORS.sensing,
        tooltip: 'Current day of week',
        helpUrl: '',
    },
    {
        type: 'sensing_current_hour',
        message0: 'current hour',
        output: 'Number',
        colour: COLORS.sensing,
        tooltip: 'Current hour (0-23)',
        helpUrl: '',
    },
    {
        type: 'sensing_current_minute',
        message0: 'current minute',
        output: 'Number',
        colour: COLORS.sensing,
        tooltip: 'Current minute (0-59)',
        helpUrl: '',
    },
    {
        type: 'sensing_current_second',
        message0: 'current second',
        output: 'Number',
        colour: COLORS.sensing,
        tooltip: 'Current second (0-59)',
        helpUrl: '',
    },

    {
        type: 'sensing_days_since_2000',
        message0: 'days since 2000',
        output: 'Number',
        colour: COLORS.sensing,
        tooltip: 'Days since January 1, 2000',
        helpUrl: '',
    },
    {
        type: 'sensing_username',
        message0: 'username',
        output: 'String',
        colour: COLORS.sensing,
        tooltip: 'Current username',
        helpUrl: '',
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA / VARIABLES
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'data_setvariableto',
        message0: 'set %1 to %2',
        args0: [
            {
                type: 'field_variable',
                name: 'VARIABLE',
                variable: 'my variable',
                variableTypes: ['Number', 'String', '']
            },
            { type: 'input_value', name: 'VALUE' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.data,
        tooltip: 'Set variable to value',
        helpUrl: '',
    },
    {
        type: 'data_changevariableby',
        message0: 'change %1 by %2',
        args0: [
            {
                type: 'field_variable',
                name: 'VARIABLE',
                variable: 'my variable',
                variableTypes: ['Number', 'String', '']
            },
            { type: 'input_value', name: 'VALUE', check: 'Number' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.data,
        tooltip: 'Change variable by value',
        helpUrl: '',
    },
    {
        type: 'data_showvariable',
        message0: 'show variable %1',
        args0: [{
            type: 'field_variable',
            name: 'VARIABLE',
            variable: 'my variable',
            variableTypes: ['Number', 'String', '']
        }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.data,
        tooltip: 'Show variable monitor',
        helpUrl: '',
    },
    {
        type: 'data_hidevariable',
        message0: 'hide variable %1',
        args0: [{
            type: 'field_variable',
            name: 'VARIABLE',
            variable: 'my variable',
            variableTypes: ['Number', 'String', '']
        }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.data,
        tooltip: 'Hide variable monitor',
        helpUrl: '',
    },

    // Variable Reporter block (leap style)
    {
        type: 'data_variable',
        message0: '%1',
        args0: [{
            type: 'field_variable',
            name: 'VARIABLE',
            variable: 'my variable',
            variableTypes: ['Number', 'String', '']
        }],
        output: null,
        colour: COLORS.data,
        tooltip: 'Variable value',
        helpUrl: '',
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // LISTS - WITH DIRECT TEXT INPUT FIELDS
    // ═══════════════════════════════════════════════════════════════════════════

    // Add to List - Direct editable text field
    {
        type: 'data_addtolist',
        message0: 'add %1 to %2',
        args0: [
            { type: 'field_input', name: 'ITEM', text: 'thing' },
            { type: 'field_variable', name: 'LIST', variable: 'hi', variableTypes: ['list'] }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF8C00',
        tooltip: 'Add item to list',
        helpUrl: ''
    },

    // Delete at index - Direct editable text field
    {
        type: 'data_deleteoflist',
        message0: 'delete %1 of %2',
        args0: [
            { type: 'field_input', name: 'INDEX', text: '1' },
            { type: 'field_variable', name: 'LIST', variable: 'hi', variableTypes: ['list'] }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF8C00',
        tooltip: 'Delete item at index from list',
        helpUrl: ''
    },

    // Delete all items
    {
        type: 'data_deletealloflist',
        message0: 'delete all of %1',
        args0: [{ type: 'field_variable', name: 'LIST', variable: 'hi', variableTypes: ['list'] }],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF8C00'
    },

    // Insert at position
    {
        type: 'data_insertatlist',
        message0: 'insert %1 at %2 of %3',
        args0: [
            { type: 'field_input', name: 'ITEM', text: 'thing' },
            { type: 'field_input', name: 'INDEX', text: '1' },
            { type: 'field_variable', name: 'LIST', variable: 'hi', variableTypes: ['list'] }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF8C00',
        tooltip: 'Insert item at position',
        helpUrl: ''
    },

    // Replace item
    {
        type: 'data_replaceitemoflist',
        message0: 'replace item %1 of %2 with %3',
        args0: [
            { type: 'field_input', name: 'INDEX', text: '1' },
            { type: 'field_variable', name: 'LIST', variable: 'hi', variableTypes: ['list'] },
            { type: 'field_input', name: 'ITEM', text: 'thing' }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF8C00',
        tooltip: 'Replace item in list',
        helpUrl: ''
    },

    // Show list
    {
        type: 'data_showlist',
        message0: 'show list %1',
        args0: [{ type: 'field_variable', name: 'LIST', variable: 'hi', variableTypes: ['list'] }],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF8C00'
    },

    // Hide list
    {
        type: 'data_hidelist',
        message0: 'hide list %1',
        args0: [{ type: 'field_variable', name: 'LIST', variable: 'hi', variableTypes: ['list'] }],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF8C00'
    },

    // List Reporter blocks
    {
        type: 'data_list',
        message0: '%1',
        args0: [{ type: 'field_variable', name: 'LIST', variable: 'hi', variableTypes: ['list'] }],
        output: 'String',
        colour: '#FF8C00'
    },
    {
        type: 'data_itemoflist',
        message0: 'item %1 of %2',
        args0: [
            { type: 'field_input', name: 'INDEX', text: '1' },
            { type: 'field_variable', name: 'LIST', variable: 'hi', variableTypes: ['list'] }
        ],
        output: null,
        colour: '#FF8C00'
    },
    {
        type: 'data_itemnumoflist',
        message0: 'item # of %1 in %2',
        args0: [
            { type: 'field_input', name: 'ITEM', text: 'thing' },
            { type: 'field_variable', name: 'LIST', variable: 'hi', variableTypes: ['list'] }
        ],
        output: 'Number',
        colour: '#FF8C00',
        tooltip: 'Get index of item'
    },
    {
        type: 'data_lengthoflist',
        message0: 'length of %1',
        args0: [{ type: 'field_variable', name: 'LIST', variable: 'hi', variableTypes: ['list'] }],
        output: 'Number',
        colour: '#FF8C00'
    },

    // List Boolean block
    {
        type: 'data_listcontainsitem',
        message0: '%1 contains %2 ?',
        args0: [
            { type: 'field_variable', name: 'LIST', variable: 'hi', variableTypes: ['list'] },
            { type: 'field_input', name: 'ITEM', text: '' }
        ],
        output: 'Boolean',
        colour: '#FF8C00'
    },


    // ═══════════════════════════════════════════════════════════════════════════
    // SOUND
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'sound_play',
        message0: '🔊 start sound %1',
        args0: [{
            type: 'field_dropdown',
            name: 'SOUND',
            options: () => {
                if (typeof window !== 'undefined' && (window as any).getActiveSpriteSounds) {
                    const sounds = (window as any).getActiveSpriteSounds();
                    if (sounds && sounds.length > 0) return sounds.map((s: string) => [s, s]);
                }
                return [['pop', 'pop'], ['meow', 'meow'], ['boing', 'boing']];
            },
        }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.sound,
        tooltip: 'Play a sound',
        helpUrl: '',
    },
    {
        type: 'sound_play_until_done',
        message0: '🔊 play sound %1 until done',
        args0: [{
            type: 'field_dropdown',
            name: 'SOUND',
            options: () => {
                if (typeof window !== 'undefined' && (window as any).getActiveSpriteSounds) {
                    const sounds = (window as any).getActiveSpriteSounds();
                    if (sounds && sounds.length > 0) return sounds.map((s: string) => [s, s]);
                }
                return [['pop', 'pop'], ['meow', 'meow'], ['boing', 'boing']];
            },
        }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.sound,
        tooltip: 'Play sound and wait',
        helpUrl: '',
    },
    {
        type: 'sound_stop_all',
        message0: '🔇 stop all sounds',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.sound,
        tooltip: 'Stop all sounds',
        helpUrl: '',
    },
    {
        type: 'sound_set_volume',
        message0: '🔊 set volume to %1 %',
        args0: [{ type: 'field_number', name: 'VOLUME', value: 100, min: 0, max: 100 }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.sound,
        tooltip: 'Set volume level',
        helpUrl: '',
    },
    {
        type: 'sound_change_volume',
        message0: '🔊 change volume by %1',
        args0: [{ type: 'field_number', name: 'VOLUME', value: -10 }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.sound,
        tooltip: 'Change volume',
        helpUrl: '',
    },
    {
        type: 'sound_set_effect',
        message0: '🔊 set %1 effect to %2',
        args0: [
            { type: 'field_dropdown', name: 'EFFECT', options: [['pitch', 'pitch'], ['pan', 'pan']] },
            { type: 'field_number', name: 'VALUE', value: 100 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.sound,
        tooltip: 'Set sound effect',
        helpUrl: '',
    },
    {
        type: 'sound_change_effect',
        message0: '🔊 change %1 effect by %2',
        args0: [
            { type: 'field_dropdown', name: 'EFFECT', options: [['pitch', 'pitch'], ['pan', 'pan']] },
            { type: 'field_number', name: 'VALUE', value: 10 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.sound,
        tooltip: 'Change sound effect',
        helpUrl: '',
    },
    {
        type: 'sound_clear_effects',
        message0: '🔊 clear sound effects',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.sound,
        tooltip: 'Clear all sound effects',
        helpUrl: '',
    },
    {
        type: 'sound_volume',
        message0: 'volume',
        output: 'Number',
        colour: COLORS.sound,
        tooltip: 'Get current volume',
        helpUrl: '',
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // OPERATORS
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'operator_add',
        message0: '%1 + %2',
        args0: [
            { type: 'input_value', name: 'NUM1' },
            { type: 'input_value', name: 'NUM2' },
        ],
        inputsInline: true,
        output: 'Number',
        colour: COLORS.operators,
        tooltip: 'Add two numbers',
        helpUrl: '',
    },
    {
        type: 'operator_subtract',
        message0: '%1 - %2',
        args0: [
            { type: 'input_value', name: 'NUM1' },
            { type: 'input_value', name: 'NUM2' },
        ],
        inputsInline: true,
        output: 'Number',
        colour: COLORS.operators,
        tooltip: 'Subtract two numbers',
        helpUrl: '',
    },
    {
        type: 'operator_multiply',
        message0: '%1 × %2',
        args0: [
            { type: 'input_value', name: 'NUM1' },
            { type: 'input_value', name: 'NUM2' },
        ],
        inputsInline: true,
        output: 'Number',
        colour: COLORS.operators,
        tooltip: 'Multiply two numbers',
        helpUrl: '',
    },
    {
        type: 'operator_divide',
        message0: '%1 ÷ %2',
        args0: [
            { type: 'input_value', name: 'NUM1' },
            { type: 'input_value', name: 'NUM2' },
        ],
        inputsInline: true,
        output: 'Number',
        colour: COLORS.operators,
        tooltip: 'Divide two numbers',
        helpUrl: '',
    },
    {
        type: 'operator_random',
        message0: 'pick random %1 to %2',
        args0: [
            { type: 'input_value', name: 'FROM' },
            { type: 'input_value', name: 'TO' },
        ],
        inputsInline: true,
        output: 'Number',
        colour: COLORS.operators,
        tooltip: 'Random number',
        helpUrl: '',
    },
    {
        type: 'operator_gt',
        message0: '%1 > %2',
        args0: [
            { type: 'input_value', name: 'OPERAND1' },
            { type: 'input_value', name: 'OPERAND2' },
        ],
        inputsInline: true,
        output: 'Boolean',
        colour: COLORS.operators,
        tooltip: 'Greater than',
        helpUrl: '',
    },
    {
        type: 'operator_lt',
        message0: '%1 < %2',
        args0: [
            { type: 'input_value', name: 'OPERAND1' },
            { type: 'input_value', name: 'OPERAND2' },
        ],
        inputsInline: true,
        output: 'Boolean',
        colour: COLORS.operators,
        tooltip: 'Less than',
        helpUrl: '',
    },
    {
        type: 'operator_equals',
        message0: '%1 = %2',
        args0: [
            { type: 'input_value', name: 'OPERAND1' },
            { type: 'input_value', name: 'OPERAND2' },
        ],
        inputsInline: true,
        output: 'Boolean',
        colour: COLORS.operators,
        tooltip: 'Equals',
        helpUrl: '',
    },
    {
        type: 'operator_and',
        message0: '%1 and %2',
        args0: [
            { type: 'input_value', name: 'OPERAND1', check: 'Boolean' },
            { type: 'input_value', name: 'OPERAND2', check: 'Boolean' },
        ],
        output: 'Boolean',
        colour: COLORS.operators,
        inputsInline: true,
        tooltip: 'And',
        helpUrl: '',
    },
    {
        type: 'operator_or',
        message0: '%1 or %2',
        args0: [
            { type: 'input_value', name: 'OPERAND1', check: 'Boolean' },
            { type: 'input_value', name: 'OPERAND2', check: 'Boolean' },
        ],
        output: 'Boolean',
        colour: COLORS.operators,
        inputsInline: true,
        tooltip: 'Or',
        helpUrl: '',
    },
    {
        type: 'operator_not',
        message0: 'not %1',
        args0: [{ type: 'input_value', name: 'OPERAND', check: 'Boolean' }],
        output: 'Boolean',
        colour: COLORS.operators,
        tooltip: 'Not',
        helpUrl: '',
    },
    {
        type: 'operator_mod',
        message0: '%1 mod %2',
        args0: [
            { type: 'input_value', name: 'NUM1' },
            { type: 'input_value', name: 'NUM2' },
        ],
        inputsInline: true,
        output: 'Number',
        colour: COLORS.operators,
        tooltip: 'Modulo (remainder)',
        helpUrl: '',
    },
    {
        type: 'operator_round',
        message0: 'round %1',
        args0: [{ type: 'input_value', name: 'NUM' }],
        output: 'Number',
        colour: COLORS.operators,
        tooltip: 'Round to nearest integer',
        helpUrl: '',
    },
    {
        type: 'operator_round_to_decimals',
        message0: 'round %1 to %2 decimals',
        args0: [
            { type: 'input_value', name: 'NUM' },
            {
                type: 'field_dropdown', name: 'DECIMALS', options: [
                    ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5']
                ]
            }
        ],
        inputsInline: true,
        output: 'Number',
        colour: COLORS.operators,
        tooltip: 'Round number to specified decimal places',
        helpUrl: '',
    },
    {
        type: 'operator_mathop',
        message0: '%1 of %2',
        args0: [
            {
                type: 'field_dropdown', name: 'OPERATOR', options: [
                    ['abs', 'abs'], ['floor', 'floor'], ['ceiling', 'ceiling'],
                    ['sqrt', 'sqrt'], ['sin', 'sin'], ['cos', 'cos'], ['tan', 'tan'],
                    ['asin', 'asin'], ['acos', 'acos'], ['atan', 'atan'],
                    ['ln', 'ln'], ['log', 'log'], ['e ^', 'e ^'], ['10 ^', '10 ^']
                ]
            },
            { type: 'input_value', name: 'NUM' },
        ],
        inputsInline: true,
        output: 'Number',
        colour: COLORS.operators,
        tooltip: 'Math operation',
        helpUrl: '',
    },
    {
        type: 'operator_join',
        message0: 'join %1 %2',
        args0: [
            { type: 'input_value', name: 'STRING1' },
            { type: 'input_value', name: 'STRING2' },
        ],
        inputsInline: true,
        output: 'String',
        colour: COLORS.operators,
        tooltip: 'Join two strings',
        helpUrl: '',
    },
    {
        type: 'operator_letter_of',
        message0: 'letter %1 of %2',
        args0: [
            { type: 'input_value', name: 'LETTER' },
            { type: 'input_value', name: 'STRING' },
        ],
        inputsInline: true,
        output: 'String',
        colour: COLORS.operators,
        tooltip: 'Letter at position',
        helpUrl: '',
    },
    {
        type: 'operator_length',
        message0: 'length of %1',
        args0: [{ type: 'input_value', name: 'STRING' }],
        output: 'Number',
        colour: COLORS.operators,
        tooltip: 'Length of string',
        helpUrl: '',
    },
    {
        type: 'operator_contains',
        message0: '%1 contains %2 ?',
        args0: [
            { type: 'input_value', name: 'STRING1' },
            { type: 'input_value', name: 'STRING2' },
        ],
        inputsInline: true,
        output: 'Boolean',
        colour: COLORS.operators,
        tooltip: 'Check if string contains substring',
        helpUrl: '',
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // VARIABLES
    // ═══════════════════════════════════════════════════════════════════════════
    // LISTS - WITH DIRECT TEXT INPUT FIELDS
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'data_listcontents',
        message0: 'list %1',
        args0: [{ type: 'field_variable', name: 'LIST', variable: 'hi', variableTypes: ['list'] }],
        output: 'String',
        colour: '#FF8C00'
    },
    {
        type: 'data_addtolist',
        message0: 'add %1 to %2',
        args0: [
            { type: 'field_input', name: 'ITEM', text: 'thing' },
            { type: 'field_variable', name: 'LIST', variable: 'hi', variableTypes: ['list'] }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF8C00',
        tooltip: 'Add item to list',
        helpUrl: ''
    },
    {
        type: 'data_deleteoflist',
        message0: 'delete %1 of %2',
        args0: [
            { type: 'field_input', name: 'INDEX', text: '1' },
            { type: 'field_variable', name: 'LIST', variable: 'hi', variableTypes: ['list'] }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF8C00'
    },
    {
        type: 'data_deletealloflist',
        message0: 'delete all of %1',
        args0: [{ type: 'field_variable', name: 'LIST', variable: 'hi', variableTypes: ['list'] }],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF8C00'
    },
    {
        type: 'data_insertatlist',
        message0: 'insert %1 at %2 of %3',
        args0: [
            { type: 'field_input', name: 'ITEM', text: 'thing' },
            { type: 'field_input', name: 'INDEX', text: '1' },
            { type: 'field_variable', name: 'LIST', variable: 'hi', variableTypes: ['list'] }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF8C00',
        tooltip: 'Insert item at position',
        helpUrl: ''
    },
    {
        type: 'data_replaceitemoflist',
        message0: 'replace item %1 of %2 with %3',
        args0: [
            { type: 'field_input', name: 'INDEX', text: '1' },
            { type: 'field_variable', name: 'LIST', variable: 'hi', variableTypes: ['list'] },
            { type: 'field_input', name: 'ITEM', text: 'thing' }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF8C00',
        tooltip: 'Replace item in list',
        helpUrl: ''
    },
    {
        type: 'data_itemoflist',
        message0: 'item %1 of %2',
        args0: [
            { type: 'field_input', name: 'INDEX', text: '1' },
            { type: 'field_variable', name: 'LIST', variable: 'hi', variableTypes: ['list'] }
        ],
        output: null,
        colour: '#FF8C00'
    },
    {
        type: 'data_itemnumoflist',
        message0: 'item # of %1 in %2',
        args0: [
            { type: 'field_input', name: 'ITEM', text: 'thing' },
            { type: 'field_variable', name: 'LIST', variable: 'hi', variableTypes: ['list'] }
        ],
        output: 'Number',
        colour: '#FF8C00',
        tooltip: 'Get index of item'
    },
    {
        type: 'data_lengthoflist',
        message0: 'length of %1',
        args0: [{ type: 'field_variable', name: 'LIST', variable: 'hi', variableTypes: ['list'] }],
        output: 'Number',
        colour: '#FF8C00'
    },
    {
        type: 'data_listcontainsitem',
        message0: '%1 contains %2 ?',
        args0: [
            { type: 'field_variable', name: 'LIST', variable: 'hi', variableTypes: ['list'] },
            { type: 'field_input', name: 'ITEM', text: '' }
        ],
        output: 'Boolean',
        colour: '#FF8C00'
    },
    {
        type: 'data_showlist',
        message0: 'show list %1',
        args0: [{ type: 'field_variable', name: 'LIST', variable: 'hi', variableTypes: ['list'] }],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF8C00'
    },
    {
        type: 'data_hidelist',
        message0: 'hide list %1',
        args0: [{ type: 'field_variable', name: 'LIST', variable: 'hi', variableTypes: ['list'] }],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF8C00'
    },


    // ═══════════════════════════════════════════════════════════════════════════
    // MY BLOCKS (Custom procedures)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'procedures_definition',
        message0: 'define %1',
        args0: [{ type: 'field_input', name: 'NAME', text: 'my block' }],
        nextStatement: null,
        colour: COLORS.myblocks,
        tooltip: 'Define a custom block',
        helpUrl: '',
    },
    {
        type: 'procedures_call',
        message0: 'my block',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.myblocks,
        tooltip: 'Call custom block',
        helpUrl: '',
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // PEN
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'pen_clear',
        message0: '🖌️ erase all',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.pen,
        tooltip: 'Clear all pen marks',
        helpUrl: '',
    },
    {
        type: 'pen_stamp',
        message0: '🖼️ stamp',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.pen,
        tooltip: 'Stamp the sprite onto the background',
        helpUrl: '',
    },
    {
        type: 'pen_penDown',
        message0: '🖋️ pen down',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.pen,
        tooltip: 'Start drawing with the pen',
        helpUrl: '',
    },
    {
        type: 'pen_penUp',
        message0: '🖊️ pen up',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.pen,
        tooltip: 'Stop drawing with the pen',
        helpUrl: '',
    },
    {
        type: 'pen_setPenColorToColor',
        message0: '🎨 set pen color to %1',
        args0: [{ type: 'field_colour', name: 'COLOR', colour: '#4c97ff' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.pen,
        tooltip: 'Set the pen color',
        helpUrl: '',
    },
    {
        type: 'pen_setPenColorToNumber',
        message0: '🎨 set pen color to %1',
        args0: [{ type: 'field_number', name: 'COLOR', value: 50, min: 0, max: 200 }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.pen,
        tooltip: 'Set the pen color using a number (0=black, 100=blue, 200=white)',
        helpUrl: '',
    },
    {
        type: 'pen_changePenSizeBy',
        message0: '📏 change pen size by %1',
        args0: [{ type: 'field_number', name: 'SIZE', value: 1 }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.pen,
        tooltip: 'Change the pen thickness',
        helpUrl: '',
    },
    {
        type: 'pen_setPenSizeTo',
        message0: '📏 set pen size to %1',
        args0: [{ type: 'field_number', name: 'SIZE', value: 1 }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.pen,
        tooltip: 'Set the pen thickness',
        helpUrl: '',
    },
    {
        type: 'pen_changePenColorParamBy',
        message0: '🎨 change pen %1 by %2',
        args0: [
            {
                type: 'field_dropdown',
                name: 'PARAM',
                options: [
                    ['color', 'color'],
                    ['saturation', 'saturation'],
                    ['brightness', 'brightness'],
                    ['transparency', 'transparency'],
                ],
            },
            { type: 'field_number', name: 'CHANGE', value: 10 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.pen,
        tooltip: 'Change pen color parameter by amount',
        helpUrl: '',
    },
    {
        type: 'pen_setPenColorParamTo',
        message0: '🎨 set pen %1 to %2',
        args0: [
            {
                type: 'field_dropdown',
                name: 'PARAM',
                options: [
                    ['color', 'color'],
                    ['saturation', 'saturation'],
                    ['brightness', 'brightness'],
                    ['transparency', 'transparency'],
                ],
            },
            { type: 'field_number', name: 'VALUE', value: 50 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.pen,
        tooltip: 'Set pen color parameter to value',
        helpUrl: '',
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SENSING (Additional)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'sensing_of',
        message0: '%1 of %2',
        args0: [
            {
                type: 'field_dropdown',
                name: 'PROPERTY',
                options: [
                    ['x position', 'x position'],
                    ['y position', 'y position'],
                    ['direction', 'direction'],
                    ['costume #', 'costume #'],
                    ['costume name', 'costume name'],
                    ['size', 'size'],
                    ['volume', 'volume'],
                ],
            },
            {
                type: 'field_dropdown',
                name: 'OBJECT',
                options: () => {
                    const baseOptions: [string, string][] = [['Stage', '_stage_']];
                    if (typeof window !== 'undefined' && (window as any).getAllSpriteNames) {
                        const names: string[] = (window as any).getAllSpriteNames();
                        if (names && names.length > 0) {
                            for (const name of names) {
                                baseOptions.push([name, name]);
                            }
                        }
                    }
                    return baseOptions;
                },
            },
        ],
        output: null,
        colour: COLORS.sensing,
        tooltip: 'Get attribute of a sprite or the stage',
        helpUrl: '',
    }
];

// Animation Toolbox
export const animationToolbox = {
    kind: 'categoryToolbox',
    contents: [
        {
            kind: 'leapbloxCategory',
            name: 'Events',
            colour: COLORS.events,
            contents: [
                { kind: 'block', type: 'event_flag_clicked' },
                { kind: 'block', type: 'event_sprite_clicked' },
                { kind: 'block', type: 'event_key_pressed' },
                { kind: 'label', text: '── Broadcast ──' },
                { kind: 'block', type: 'event_broadcast' },
                { kind: 'block', type: 'event_broadcast_wait' },
                { kind: 'block', type: 'event_receive' },
                { kind: 'label', text: '── Other ──' },
                { kind: 'block', type: 'event_backdrop_switch' },
                { kind: 'block', type: 'event_greater_than' },
                { kind: 'block', type: 'event_clone_start' },
            ],
        },
        {
            kind: 'leapbloxCategory',
            name: 'Motion',
            colour: COLORS.motion,
            contents: [
                {
                    kind: 'block',
                    type: 'motion_move_steps',
                    inputs: { STEPS: { shadow: { type: 'math_number', fields: { NUM: 10 } } } }
                },
                {
                    kind: 'block',
                    type: 'motion_move_left',
                    inputs: { STEPS: { shadow: { type: 'math_number', fields: { NUM: 10 } } } }
                },
                {
                    kind: 'block',
                    type: 'motion_move_up',
                    inputs: { STEPS: { shadow: { type: 'math_number', fields: { NUM: 10 } } } }
                },
                {
                    kind: 'block',
                    type: 'motion_move_down',
                    inputs: { STEPS: { shadow: { type: 'math_number', fields: { NUM: 10 } } } }
                },
                {
                    kind: 'block',
                    type: 'motion_turn_right',
                    inputs: { DEGREES: { shadow: { type: 'math_number', fields: { NUM: 15 } } } }
                },
                {
                    kind: 'block',
                    type: 'motion_turn_left',
                    inputs: { DEGREES: { shadow: { type: 'math_number', fields: { NUM: 15 } } } }
                },
                { kind: 'label', text: '── Position ──' },
                { kind: 'block', type: 'motion_go_to' },
                {
                    kind: 'block',
                    type: 'motion_go_to_xy',
                    inputs: {
                        X: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                        Y: { shadow: { type: 'math_number', fields: { NUM: 0 } } }
                    }
                },
                { kind: 'block', type: 'motion_glide_to' },
                {
                    kind: 'block',
                    type: 'motion_glide_to_xy',
                    inputs: {
                        SECS: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
                        X: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                        Y: { shadow: { type: 'math_number', fields: { NUM: 0 } } }
                    }
                },
                {
                    kind: 'block',
                    type: 'motion_point_direction',
                    inputs: { DIRECTION: { shadow: { type: 'math_number', fields: { NUM: 90 } } } }
                },
                { kind: 'label', text: '── More Motion ──' },
                { kind: 'block', type: 'motion_point_towards' },
                { kind: 'label', text: '── Change ──' },
                {
                    kind: 'block',
                    type: 'motion_change_x',
                    inputs: { DX: { shadow: { type: 'math_number', fields: { NUM: 10 } } } }
                },
                {
                    kind: 'block',
                    type: 'motion_change_y',
                    inputs: { DY: { shadow: { type: 'math_number', fields: { NUM: 10 } } } }
                },
                {
                    kind: 'block',
                    type: 'motion_set_x',
                    inputs: { X: { shadow: { type: 'math_number', fields: { NUM: 0 } } } }
                },
                {
                    kind: 'block',
                    type: 'motion_set_y',
                    inputs: { Y: { shadow: { type: 'math_number', fields: { NUM: 0 } } } }
                },
                { kind: 'label', text: '── Edge & Rotation ──' },
                { kind: 'block', type: 'motion_if_on_edge_bounce' },
                { kind: 'block', type: 'motion_set_rotation_style' },
                { kind: 'label', text: '── Reporters ──' },
                { kind: 'block', type: 'motion_x_position' },
                { kind: 'block', type: 'motion_y_position' },
                { kind: 'block', type: 'motion_direction' },
            ],
        },
        {
            kind: 'leapbloxCategory',
            name: 'Looks',
            colour: COLORS.looks,
            contents: [
                {
                    kind: 'block',
                    type: 'looks_say_for_secs',
                    inputs: {
                        MESSAGE: {
                            shadow: {
                                type: 'text',
                                fields: { TEXT: 'Hi!' }
                            }
                        },
                        SECS: {
                            shadow: {
                                type: 'math_number',
                                fields: { NUM: 2 }
                            }
                        }
                    }
                },
                {
                    kind: 'block',
                    type: 'looks_say',
                    inputs: {
                        MESSAGE: {
                            shadow: {
                                type: 'text',
                                fields: { TEXT: 'Hi!' }
                            }
                        }
                    }
                },
                {
                    kind: 'block',
                    type: 'looks_think_for_secs',
                    inputs: {
                        MESSAGE: {
                            shadow: {
                                type: 'text',
                                fields: { TEXT: 'Hm...' }
                            }
                        },
                        SECS: {
                            shadow: {
                                type: 'math_number',
                                fields: { NUM: 2 }
                            }
                        }
                    }
                },
                {
                    kind: 'block',
                    type: 'looks_think',
                    inputs: {
                        MESSAGE: {
                            shadow: {
                                type: 'text',
                                fields: { TEXT: 'Hm...' }
                            }
                        }
                    }
                },
                { kind: 'label', text: '── Visibility ──' },
                { kind: 'block', type: 'looks_show' },
                { kind: 'block', type: 'looks_hide' },
                { kind: 'label', text: '── Costume ──' },
                { kind: 'block', type: 'looks_switch_costume' },
                { kind: 'block', type: 'looks_next_costume' },
                { kind: 'block', type: 'looks_switch_backdrop' },
                { kind: 'block', type: 'looks_next_backdrop' },
                { kind: 'label', text: '── Size ──' },
                { kind: 'block', type: 'looks_set_size' },
                { kind: 'block', type: 'looks_change_size' },
                { kind: 'label', text: '── Effects ──' },
                { kind: 'block', type: 'looks_set_effect' },
                { kind: 'block', type: 'looks_change_effect' },
                { kind: 'block', type: 'looks_clear_effects' },
                { kind: 'label', text: '── Transform ──' },
                { kind: 'block', type: 'looks_mirror' },
                { kind: 'label', text: '── Layers ──' },
                { kind: 'block', type: 'looks_go_to_layer' },
                { kind: 'block', type: 'looks_go_forward_layers' },
                { kind: 'label', text: '── Reporters ──' },
                { kind: 'block', type: 'looks_size' },
                { kind: 'block', type: 'looks_costume_number' },
                { kind: 'block', type: 'looks_costume_name' },
                { kind: 'block', type: 'looks_backdrop_number' },
                { kind: 'block', type: 'looks_backdrop_name' },
            ],
        },
        {
            kind: 'leapbloxCategory',
            name: 'Sound',
            colour: COLORS.sound,
            contents: [
                { kind: 'block', type: 'sound_play' },
                { kind: 'block', type: 'sound_play_until_done' },
                { kind: 'block', type: 'sound_stop_all' },
                { kind: 'label', text: '── Volume ──' },
                { kind: 'block', type: 'sound_set_volume' },
                { kind: 'block', type: 'sound_change_volume' },
                { kind: 'block', type: 'sound_volume' },
                { kind: 'label', text: '── Effects ──' },
                { kind: 'block', type: 'sound_set_effect' },
                { kind: 'block', type: 'sound_change_effect' },
                { kind: 'block', type: 'sound_clear_effects' },
            ],
        },
        {
            kind: 'leapbloxCategory',
            name: 'Control',
            colour: COLORS.control,
            contents: [
                // Note: Control blocks are registered from leapBlocks.ts which uses field_number
                // (not input_value), so no shadow inputs should be specified here.
                {
                    kind: 'block',
                    type: 'control_wait',
                    inputs: {
                        SECS: { shadow: { type: 'math_number', fields: { NUM: 1 } } }
                    }
                },
                { kind: 'label', text: '── Loops ──' },
                {
                    kind: 'block',
                    type: 'control_repeat',
                    inputs: {
                        TIMES: { shadow: { type: 'math_number', fields: { NUM: 10 } } }
                    }
                },
                { kind: 'block', type: 'control_forever' },
                { kind: 'block', type: 'control_repeat_until' },
                { kind: 'label', text: '── Conditions ──' },
                { kind: 'block', type: 'control_if' },
                { kind: 'block', type: 'control_if_else' },
                { kind: 'block', type: 'control_wait_until' },
                { kind: 'label', text: '── Cloning ──' },
                { kind: 'block', type: 'control_create_clone' },
                { kind: 'block', type: 'control_delete_clone' },
                { kind: 'label', text: '── Stop ──' },
                { kind: 'block', type: 'control_stop' },
            ],
        },
        {
            kind: 'leapbloxCategory',
            name: 'Sensing',
            colour: COLORS.sensing,
            custom: 'LEAP_SENSING'
        },
        {
            kind: 'leapbloxCategory',
            name: 'Operators',
            colour: COLORS.operators,
            contents: [
                {
                    kind: 'block',
                    type: 'operator_add',
                    inputs: {
                        NUM1: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                        NUM2: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                    },
                },
                {
                    kind: 'block',
                    type: 'operator_subtract',
                    inputs: {
                        NUM1: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                        NUM2: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                    },
                },
                {
                    kind: 'block',
                    type: 'operator_multiply',
                    inputs: {
                        NUM1: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                        NUM2: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                    },
                },
                {
                    kind: 'block',
                    type: 'operator_divide',
                    inputs: {
                        NUM1: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                        NUM2: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                    },
                },
                { kind: 'label', text: '── Random ──' },
                {
                    kind: 'block',
                    type: 'operator_random',
                    inputs: {
                        FROM: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
                        TO: { shadow: { type: 'math_number', fields: { NUM: 10 } } },
                    },
                },
                { kind: 'label', text: '── Compare ──' },
                {
                    kind: 'block',
                    type: 'operator_gt',
                    inputs: {
                        OPERAND1: { shadow: { type: 'text', fields: { TEXT: '0' } } },
                        OPERAND2: { shadow: { type: 'text', fields: { TEXT: '50' } } },
                    },
                },
                {
                    kind: 'block',
                    type: 'operator_lt',
                    inputs: {
                        OPERAND1: { shadow: { type: 'text', fields: { TEXT: '0' } } },
                        OPERAND2: { shadow: { type: 'text', fields: { TEXT: '50' } } },
                    },
                },
                {
                    kind: 'block',
                    type: 'operator_equals',
                    inputs: {
                        OPERAND1: { shadow: { type: 'text', fields: { TEXT: '0' } } },
                        OPERAND2: { shadow: { type: 'text', fields: { TEXT: '50' } } },
                    },
                },
                { kind: 'label', text: '── Logic ──' },
                { kind: 'block', type: 'operator_and' },
                { kind: 'block', type: 'operator_or' },
                { kind: 'block', type: 'operator_not' },
                { kind: 'label', text: '── Strings ──' },
                {
                    kind: 'block',
                    type: 'operator_join',
                    inputs: {
                        STRING1: { shadow: { type: 'text', fields: { TEXT: 'a' } } },
                        STRING2: { shadow: { type: 'text', fields: { TEXT: 'b' } } },
                    },
                },
                {
                    kind: 'block',
                    type: 'operator_letter_of',
                    inputs: {
                        LETTER: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
                        STRING: { shadow: { type: 'text', fields: { TEXT: 'a' } } },
                    },
                },
                {
                    kind: 'block',
                    type: 'operator_length',
                    inputs: {
                        STRING: { shadow: { type: 'text', fields: { TEXT: 'a' } } },
                    },
                },
                {
                    kind: 'block',
                    type: 'operator_contains',
                    inputs: {
                        STRING1: { shadow: { type: 'text', fields: { TEXT: 'a' } } },
                        STRING2: { shadow: { type: 'text', fields: { TEXT: 'b' } } },
                    },
                },
                { kind: 'label', text: '── Math ──' },
                {
                    kind: 'block',
                    type: 'operator_mod',
                    inputs: {
                        NUM1: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                        NUM2: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
                    },
                },
                {
                    kind: 'block',
                    type: 'operator_round',
                    inputs: {
                        NUM: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                    },
                },
                {
                    kind: 'block',
                    type: 'operator_mathop',
                    inputs: {
                        NUM: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
                    },
                },
                {
                    kind: 'block',
                    type: 'operator_round_to_decimals',
                    inputs: {
                        NUM: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
                    },
                },
            ],
        },
        {
            kind: 'leapbloxCategory',
            name: 'Variables',
            colour: COLORS.data,
            custom: 'LEAP_VARIABLES'
        },
        {
            kind: 'leapbloxCategory',
            name: 'My Blocks',
            colour: COLORS.myblocks,
            custom: 'LEAP_MYBLOCKS'
        },
        {
            kind: 'leapbloxCategory',
            name: 'Pen',
            colour: COLORS.pen,
            contents: [
                { kind: 'block', type: 'pen_clear' },
                { kind: 'block', type: 'pen_stamp' },
                { kind: 'block', type: 'pen_penDown' },
                { kind: 'block', type: 'pen_penUp' },
                { kind: 'block', type: 'pen_setPenColorToColor' },
                { kind: 'block', type: 'pen_setPenColorToNumber' },
                { kind: 'block', type: 'pen_changePenColorParamBy' },
                { kind: 'block', type: 'pen_setPenColorParamTo' },
                { kind: 'block', type: 'pen_changePenSizeBy' },
                { kind: 'block', type: 'pen_setPenSizeTo' },
            ],
        },
    ],
};
