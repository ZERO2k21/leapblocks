/**
 * Block Definition Registry for LeapBlocks Intermediate
 * Full parity with leap 3.0 blocks
 *
 * Each block is defined with:
 * - opcode: The unique identifier (leap VM compatible)
 * - category: The category name
 * - color: Hex color code matching leap 3.0
 * - shape: hat | stack | reporter | boolean | cap | c-block
 * - message: The display text (with %1, %2 placeholders for inputs)
 * - inputs: Array of input definitions (type, name, default)
 *
 * This file exports both:
 * - blockDefinitions: Simple format for React components
 * - getBlocklyBlockDefinitions(): Converts to Blockly JSON format
 */

export const COLORS = {
    motion: '#4C97FF',
    looks: '#9966FF',
    sound: '#CF63CF',
    events: '#FFBF00',
    control: '#FFAB19',
    sensing: '#5CB1D6',
    operators: '#59C059',
    variables: '#FF8C1A',
    list: '#FF8C1A',
    myblocks: '#FF6680',
    extensions: '#0FBD8C'
};

// Helper to convert our simple format to Blockly JSON
const convertToBlocklyFormat = (def, opcode) => {
    const blocklyDef = {
        type: opcode,
        message0: def.message,
        previousStatement: def.shape === 'hat' ? null : (def.shape === 'cap' ? null : 'any'),
        nextStatement: def.shape === 'hat' || def.shape === 'reporter' || def.shape === 'boolean' ? null : 'any',
        colour: def.color,
        tooltip: def.tooltip || '',
        helpUrl: def.helpUrl || ''
    };

    // Add output for reporter/boolean blocks
    if (def.shape === 'reporter') {
        blocklyDef.output = 'Number';
    } else if (def.shape === 'boolean') {
        blocklyDef.output = 'Boolean';
    }

    // Build args/inputs based on shape and inputs
    if (def.inputs && def.inputs.length > 0) {
        const args0 = [];
        const hasCBlockMouth = def.shape === 'c-block' && def.message2;

        def.inputs.forEach((input, index) => {
            let argType;
            switch (input.type) {
                case 'number':
                    argType = 'field_number';
                    break;
                case 'string':
                    argType = 'field_input';
                    break;
                case 'dropdown':
                    argType = 'field_dropdown';
                    break;
                case 'boolean':
                    argType = 'input_value'; // Boolean input slot
                    break;
                case 'variable':
                    argType = 'field_variable';
                    break;
                case 'list':
                    argType = 'field_variable';
                    break;
                case 'color':
                    argType = 'field_colour';
                    break;
                case 'angle':
                    argType = 'field_angle';
                    break;
                default:
                    argType = 'field_input';
            }

            const arg = {
                type: argType,
                name: input.name
            };

            // Add value for field types
            if (argType.startsWith('field_')) {
                if (input.default !== undefined) {
                    arg.value = input.default;
                }
                if (input.options) {
                    arg.options = input.options;
                }
                if (input.min !== undefined) arg.min = input.min;
                if (input.max !== undefined) arg.max = input.max;
            }

            args0.push(arg);
        });

        blocklyDef.args0 = args0;

        // Add second message and inputs for c-blocks with else
        if (hasCBlockMouth) {
            blocklyDef.message1 = def.message2;
            blocklyDef.args1 = [{ type: 'input_statement', name: 'ELSE' }];
        }

        // Add substack input for c-blocks
        if (def.shape === 'c-block') {
            // Add the DO input after condition
            blocklyDef.args1 = [{ type: 'input_statement', name: 'DO' }];
        }
    }

    return blocklyDef;
};

// Export function to get Blockly-compatible definitions
export const getBlocklyBlockDefinitions = () => {
    const blocks = [];
    for (const [opcode, def] of Object.entries(blockDefinitions)) {
        blocks.push(convertToBlocklyFormat(def, opcode));
    }
    return blocks;
};

// Export variable/list block factories (dynamic)
export const createVariableBlock = (variableName, variableType = 'Number') => ({
    type: 'data_variable',
    message0: variableName,
    output: 'Number',
    colour: COLORS.variables,
    tooltip: `Variable: ${variableName}`
});

export const createListBlock = (listName) => ({
    type: 'data_list',
    message0: listName,
    output: 'String',
    colour: COLORS.list,
    tooltip: `List: ${listName}`
});

const blockDefinitions = {
    // ═══════════════════════════════════════════════════════════════════════════
    // MOTION
    // ═══════════════════════════════════════════════════════════════════════════
    'motion_movesteps': {
        opcode: 'motion_movesteps',
        category: 'motion',
        color: COLORS.motion,
        shape: 'stack',
        message: 'move %1 steps',
        inputs: [{ type: 'number', name: 'STEPS', default: 10 }]
    },
    'motion_turnright': {
        opcode: 'motion_turnright',
        category: 'motion',
        color: COLORS.motion,
        shape: 'stack',
        message: 'turn ↻ %1 degrees',
        inputs: [{ type: 'angle', name: 'DEGREES', default: 15 }]
    },
    'motion_turnleft': {
        opcode: 'motion_turnleft',
        category: 'motion',
        color: COLORS.motion,
        shape: 'stack',
        message: 'turn ↺ %1 degrees',
        inputs: [{ type: 'angle', name: 'DEGREES', default: 15 }]
    },
    'motion_goto': {
        opcode: 'motion_goto',
        category: 'motion',
        color: COLORS.motion,
        shape: 'stack',
        message: 'go to %1',
        inputs: [{ type: 'dropdown', name: 'TO', options: [['random position', '_random_'], ['mouse-pointer', '_mouse_']], default: '_random_' }]
    },
    'motion_gotoxy': {
        opcode: 'motion_gotoxy',
        category: 'motion',
        color: COLORS.motion,
        shape: 'stack',
        message: 'go to x: %1 y: %2',
        inputs: [
            { type: 'number', name: 'X', default: 0 },
            { type: 'number', name: 'Y', default: 0 }
        ]
    },
    'motion_glideto': {
        opcode: 'motion_glideto',
        category: 'motion',
        color: COLORS.motion,
        shape: 'stack',
        message: 'glide %1 secs to %2',
        inputs: [
            { type: 'number', name: 'SECS', default: 1 },
            { type: 'dropdown', name: 'TO', options: [['random position', '_random_'], ['mouse-pointer', '_mouse_']], default: '_random_' }
        ]
    },
    'motion_glidesecstoxy': {
        opcode: 'motion_glidesecstoxy',
        category: 'motion',
        color: COLORS.motion,
        shape: 'stack',
        message: 'glide %1 secs to x: %2 y: %3',
        inputs: [
            { type: 'number', name: 'SECS', default: 1 },
            { type: 'number', name: 'X', default: 0 },
            { type: 'number', name: 'Y', default: 0 }
        ]
    },
    'motion_pointindirection': {
        opcode: 'motion_pointindirection',
        category: 'motion',
        color: COLORS.motion,
        shape: 'stack',
        message: 'point in direction %1',
        inputs: [{ type: 'angle', name: 'DIRECTION', default: 90 }]
    },
    'motion_pointtowards': {
        opcode: 'motion_pointtowards',
        category: 'motion',
        color: COLORS.motion,
        shape: 'stack',
        message: 'point towards %1',
        inputs: [{ type: 'dropdown', name: 'TOWARDS', options: [['mouse-pointer', '_mouse_']], default: '_mouse_' }]
    },
    'motion_changexby': {
        opcode: 'motion_changexby',
        category: 'motion',
        color: COLORS.motion,
        shape: 'stack',
        message: 'change x by %1',
        inputs: [{ type: 'number', name: 'DX', default: 10 }]
    },
    'motion_setx': {
        opcode: 'motion_setx',
        category: 'motion',
        color: COLORS.motion,
        shape: 'stack',
        message: 'set x to %1',
        inputs: [{ type: 'number', name: 'X', default: 0 }]
    },
    'motion_changeyby': {
        opcode: 'motion_changeyby',
        category: 'motion',
        color: COLORS.motion,
        shape: 'stack',
        message: 'change y by %1',
        inputs: [{ type: 'number', name: 'DY', default: 10 }]
    },
    'motion_sety': {
        opcode: 'motion_sety',
        category: 'motion',
        color: COLORS.motion,
        shape: 'stack',
        message: 'set y to %1',
        inputs: [{ type: 'number', name: 'Y', default: 0 }]
    },
    'motion_ifonedgebounce': {
        opcode: 'motion_ifonedgebounce',
        category: 'motion',
        color: COLORS.motion,
        shape: 'stack',
        message: 'if on edge, bounce',
        inputs: []
    },
    'motion_setrotationstyle': {
        opcode: 'motion_setrotationstyle',
        category: 'motion',
        color: COLORS.motion,
        shape: 'stack',
        message: 'set rotation style %1',
        inputs: [{ type: 'dropdown', name: 'STYLE', options: [['left-right', 'left-right'], ["don't rotate", "don't rotate"], ['all around', 'all around']], default: 'all around' }]
    },
    'motion_xposition': {
        opcode: 'motion_xposition',
        category: 'motion',
        color: COLORS.motion,
        shape: 'reporter',
        message: 'x position',
        inputs: []
    },
    'motion_yposition': {
        opcode: 'motion_yposition',
        category: 'motion',
        color: COLORS.motion,
        shape: 'reporter',
        message: 'y position',
        inputs: []
    },
    'motion_direction': {
        opcode: 'motion_direction',
        category: 'motion',
        color: COLORS.motion,
        shape: 'reporter',
        message: 'direction',
        inputs: []
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // LOOKS
    // ═══════════════════════════════════════════════════════════════════════════
    'looks_sayforsecs': {
        opcode: 'looks_sayforsecs',
        category: 'looks',
        color: COLORS.looks,
        shape: 'stack',
        message: 'say %1 for %2 seconds',
        inputs: [
            { type: 'string', name: 'MESSAGE', default: 'Hello!' },
            { type: 'number', name: 'SECS', default: 2 }
        ]
    },
    'looks_say': {
        opcode: 'looks_say',
        category: 'looks',
        color: COLORS.looks,
        shape: 'stack',
        message: 'say %1',
        inputs: [{ type: 'string', name: 'MESSAGE', default: 'Hello!' }]
    },
    'looks_thinkforsecs': {
        opcode: 'looks_thinkforsecs',
        category: 'looks',
        color: COLORS.looks,
        shape: 'stack',
        message: 'think %1 for %2 seconds',
        inputs: [
            { type: 'string', name: 'MESSAGE', default: 'Hmm...' },
            { type: 'number', name: 'SECS', default: 2 }
        ]
    },
    'looks_think': {
        opcode: 'looks_think',
        category: 'looks',
        color: COLORS.looks,
        shape: 'stack',
        message: 'think %1',
        inputs: [{ type: 'string', name: 'MESSAGE', default: 'Hmm...' }]
    },
    'looks_switchcostumeto': {
        opcode: 'looks_switchcostumeto',
        category: 'looks',
        color: COLORS.looks,
        shape: 'stack',
        message: 'switch costume to %1',
        inputs: [{ type: 'dropdown', name: 'COSTUME', options: [['costume1', 'costume1']], default: 'costume1' }]
    },
    'looks_nextcostume': {
        opcode: 'looks_nextcostume',
        category: 'looks',
        color: COLORS.looks,
        shape: 'stack',
        message: 'next costume',
        inputs: []
    },
    'looks_switchbackdropto': {
        opcode: 'looks_switchbackdropto',
        category: 'looks',
        color: COLORS.looks,
        shape: 'stack',
        message: 'switch backdrop to %1',
        inputs: [{ type: 'dropdown', name: 'BACKDROP', options: [['backdrop1', 'backdrop1']], default: 'backdrop1' }]
    },
    'looks_nextbackdrop': {
        opcode: 'looks_nextbackdrop',
        category: 'looks',
        color: COLORS.looks,
        shape: 'stack',
        message: 'next backdrop',
        inputs: []
    },
    'looks_changesizeby': {
        opcode: 'looks_changesizeby',
        category: 'looks',
        color: COLORS.looks,
        shape: 'stack',
        message: 'change size by %1',
        inputs: [{ type: 'number', name: 'CHANGE', default: 10 }]
    },
    'looks_setsizeto': {
        opcode: 'looks_setsizeto',
        category: 'looks',
        color: COLORS.looks,
        shape: 'stack',
        message: 'set size to %1 %',
        inputs: [{ type: 'number', name: 'SIZE', default: 100 }]
    },
    'looks_changeeffectby': {
        opcode: 'looks_changeeffectby',
        category: 'looks',
        color: COLORS.looks,
        shape: 'stack',
        message: 'change %1 effect by %2',
        inputs: [
            { type: 'dropdown', name: 'EFFECT', options: [['color', 'COLOR'], ['fisheye', 'FISHEYE'], ['whirl', 'WHIRL'], ['pixelate', 'PIXELATE'], ['mosaic', 'MOSAIC'], ['brightness', 'BRIGHTNESS'], ['ghost', 'GHOST']], default: 'COLOR' },
            { type: 'number', name: 'CHANGE', default: 25 }
        ]
    },
    'looks_seteffectto': {
        opcode: 'looks_seteffectto',
        category: 'looks',
        color: COLORS.looks,
        shape: 'stack',
        message: 'set %1 effect to %2',
        inputs: [
            { type: 'dropdown', name: 'EFFECT', options: [['color', 'COLOR'], ['fisheye', 'FISHEYE'], ['whirl', 'WHIRL'], ['pixelate', 'PIXELATE'], ['mosaic', 'MOSAIC'], ['brightness', 'BRIGHTNESS'], ['ghost', 'GHOST']], default: 'COLOR' },
            { type: 'number', name: 'VALUE', default: 0 }
        ]
    },
    'looks_cleargraphiceffects': {
        opcode: 'looks_cleargraphiceffects',
        category: 'looks',
        color: COLORS.looks,
        shape: 'stack',
        message: 'clear graphic effects',
        inputs: []
    },
    'looks_show': {
        opcode: 'looks_show',
        category: 'looks',
        color: COLORS.looks,
        shape: 'stack',
        message: 'show',
        inputs: []
    },
    'looks_hide': {
        opcode: 'looks_hide',
        category: 'looks',
        color: COLORS.looks,
        shape: 'stack',
        message: 'hide',
        inputs: []
    },
    'looks_gotofrontback': {
        opcode: 'looks_gotofrontback',
        category: 'looks',
        color: COLORS.looks,
        shape: 'stack',
        message: 'go to %1 layer',
        inputs: [{ type: 'dropdown', name: 'FRONT_BACK', options: [['front', 'front'], ['back', 'back']], default: 'front' }]
    },
    'looks_goforwardbackwardlayers': {
        opcode: 'looks_goforwardbackwardlayers',
        category: 'looks',
        color: COLORS.looks,
        shape: 'stack',
        message: 'go %1 %2 layers',
        inputs: [
            { type: 'dropdown', name: 'FORWARD_BACKWARD', options: [['forward', 'forward'], ['backward', 'backward']], default: 'forward' },
            { type: 'number', name: 'NUM', default: 1 }
        ]
    },
    'looks_costumenumbername': {
        opcode: 'looks_costumenumbername',
        category: 'looks',
        color: COLORS.looks,
        shape: 'reporter',
        message: 'costume %1',
        inputs: [{ type: 'dropdown', name: 'NUMBER_NAME', options: [['number', 'number'], ['name', 'name']], default: 'number' }]
    },
    'looks_backdropnumbername': {
        opcode: 'looks_backdropnumbername',
        category: 'looks',
        color: COLORS.looks,
        shape: 'reporter',
        message: 'backdrop %1',
        inputs: [{ type: 'dropdown', name: 'NUMBER_NAME', options: [['number', 'number'], ['name', 'name']], default: 'number' }]
    },
    'looks_size': {
        opcode: 'looks_size',
        category: 'looks',
        color: COLORS.looks,
        shape: 'reporter',
        message: 'size',
        inputs: []
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SOUND
    // ═══════════════════════════════════════════════════════════════════════════
    'sound_playuntildone': {
        opcode: 'sound_playuntildone',
        category: 'sound',
        color: COLORS.sound,
        shape: 'stack',
        message: 'play sound %1 until done',
        inputs: [{ type: 'dropdown', name: 'SOUND_MENU', options: [['pop', 'pop']], default: 'pop' }]
    },
    'sound_play': {
        opcode: 'sound_play',
        category: 'sound',
        color: COLORS.sound,
        shape: 'stack',
        message: 'start sound %1',
        inputs: [{ type: 'dropdown', name: 'SOUND_MENU', options: [['pop', 'pop']], default: 'pop' }]
    },
    'sound_stopallsounds': {
        opcode: 'sound_stopallsounds',
        category: 'sound',
        color: COLORS.sound,
        shape: 'stack',
        message: 'stop all sounds',
        inputs: []
    },
    'sound_changeeffectby': {
        opcode: 'sound_changeeffectby',
        category: 'sound',
        color: COLORS.sound,
        shape: 'stack',
        message: 'change %1 effect by %2',
        inputs: [
            { type: 'dropdown', name: 'EFFECT', options: [['pitch', 'PITCH'], ['pan left/right', 'PAN']], default: 'PITCH' },
            { type: 'number', name: 'VALUE', default: 10 }
        ]
    },
    'sound_seteffectto': {
        opcode: 'sound_seteffectto',
        category: 'sound',
        color: COLORS.sound,
        shape: 'stack',
        message: 'set %1 effect to %2',
        inputs: [
            { type: 'dropdown', name: 'EFFECT', options: [['pitch', 'PITCH'], ['pan left/right', 'PAN']], default: 'PITCH' },
            { type: 'number', name: 'VALUE', default: 100 }
        ]
    },
    'sound_cleareffects': {
        opcode: 'sound_cleareffects',
        category: 'sound',
        color: COLORS.sound,
        shape: 'stack',
        message: 'clear sound effects',
        inputs: []
    },
    'sound_changevolumeby': {
        opcode: 'sound_changevolumeby',
        category: 'sound',
        color: COLORS.sound,
        shape: 'stack',
        message: 'change volume by %1',
        inputs: [{ type: 'number', name: 'VOLUME', default: -10 }]
    },
    'sound_setvolumeto': {
        opcode: 'sound_setvolumeto',
        category: 'sound',
        color: COLORS.sound,
        shape: 'stack',
        message: 'set volume to %1%',
        inputs: [{ type: 'number', name: 'VOLUME', default: 100 }]
    },
    'sound_volume': {
        opcode: 'sound_volume',
        category: 'sound',
        color: COLORS.sound,
        shape: 'reporter',
        message: 'volume',
        inputs: []
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════════
    'event_whenflagclicked': {
        opcode: 'event_whenflagclicked',
        category: 'events',
        color: COLORS.events,
        shape: 'hat',
        message: 'when %1 clicked',
        inputs: [{ type: 'image', src: 'https://leap.mit.edu/static/assets/40a08e64c22e43f55050f22495914a27.svg', width: 24, height: 24, alt: 'flag' }]
    },
    'event_whenkeypressed': {
        opcode: 'event_whenkeypressed',
        category: 'events',
        color: COLORS.events,
        shape: 'hat',
        message: 'when %1 key pressed',
        inputs: [{ type: 'dropdown', name: 'KEY_OPTION', options: [['space', 'space'], ['up arrow', 'up arrow'], ['down arrow', 'down arrow'], ['any', 'any'], ['a', 'a'], ['b', 'b']], default: 'space' }]
    },
    'event_whenthisspriteclicked': {
        opcode: 'event_whenthisspriteclicked',
        category: 'events',
        color: COLORS.events,
        shape: 'hat',
        message: 'when this sprite clicked',
        inputs: []
    },
    'event_whenbackdropswitchesto': {
        opcode: 'event_whenbackdropswitchesto',
        category: 'events',
        color: COLORS.events,
        shape: 'hat',
        message: 'when backdrop switches to %1',
        inputs: [{ type: 'dropdown', name: 'BACKDROP', options: [['backdrop1', 'backdrop1']], default: 'backdrop1' }]
    },
    'event_whengreaterthan': {
        opcode: 'event_whengreaterthan',
        category: 'events',
        color: COLORS.events,
        shape: 'hat',
        message: 'when %1 > %2',
        inputs: [
            { type: 'dropdown', name: 'WHN', options: [['loudness', 'LOUDNESS'], ['timer', 'TIMER']], default: 'LOUDNESS' },
            { type: 'number', name: 'VALUE', default: 10 }
        ]
    },
    'event_whenbroadcastreceived': {
        opcode: 'event_whenbroadcastreceived',
        category: 'events',
        color: COLORS.events,
        shape: 'hat',
        message: 'when I receive %1',
        inputs: [{ type: 'dropdown', name: 'BROADCAST_OPTION', options: [['message1', 'message1']], default: 'message1' }]
    },
    'event_broadcast': {
        opcode: 'event_broadcast',
        category: 'events',
        color: COLORS.events,
        shape: 'stack',
        message: 'broadcast %1',
        inputs: [{ type: 'dropdown', name: 'BROADCAST_INPUT', options: [['message1', 'message1']], default: 'message1' }]
    },
    'event_broadcastandwait': {
        opcode: 'event_broadcastandwait',
        category: 'events',
        color: COLORS.events,
        shape: 'stack',
        message: 'broadcast %1 and wait',
        inputs: [{ type: 'dropdown', name: 'BROADCAST_INPUT', options: [['message1', 'message1']], default: 'message1' }]
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // CONTROL
    // ═══════════════════════════════════════════════════════════════════════════
    'control_wait': {
        opcode: 'control_wait',
        category: 'control',
        color: COLORS.control,
        shape: 'stack',
        message: 'wait %1 seconds',
        inputs: [{ type: 'number', name: 'DURATION', default: 1 }]
    },
    'control_repeat': {
        opcode: 'control_repeat',
        category: 'control',
        color: COLORS.control,
        shape: 'c-block',
        message: 'repeat %1',
        inputs: [{ type: 'number', name: 'TIMES', default: 10 }]
    },
    'control_forever': {
        opcode: 'control_forever',
        category: 'control',
        color: COLORS.control,
        shape: 'c-block', // cap-block at the bottom
        message: 'forever',
        inputs: []
    },
    'control_if': {
        opcode: 'control_if',
        category: 'control',
        color: COLORS.control,
        shape: 'c-block',
        message: 'if %1 then',
        inputs: [{ type: 'boolean', name: 'CONDITION' }]
    },
    'control_if_else': {
        opcode: 'control_if_else',
        category: 'control',
        color: COLORS.control,
        shape: 'c-block',
        message: 'if %1 then',
        message2: 'else',
        inputs: [{ type: 'boolean', name: 'CONDITION' }]
    },
    'control_wait_until': {
        opcode: 'control_wait_until',
        category: 'control',
        color: COLORS.control,
        shape: 'stack',
        message: 'wait until %1',
        inputs: [{ type: 'boolean', name: 'CONDITION' }]
    },
    'control_repeat_until': {
        opcode: 'control_repeat_until',
        category: 'control',
        color: COLORS.control,
        shape: 'c-block',
        message: 'repeat until %1',
        inputs: [{ type: 'boolean', name: 'CONDITION' }]
    },
    'control_stop': {
        opcode: 'control_stop',
        category: 'control',
        color: COLORS.control,
        shape: 'cap',
        message: 'stop %1',
        inputs: [{ type: 'dropdown', name: 'STOP_OPTION', options: [['all', 'all'], ['this script', 'this script'], ['other scripts in sprite', 'other scripts in sprite']], default: 'all' }]
    },
    'control_start_as_clone': {
        opcode: 'control_start_as_clone',
        category: 'control',
        color: COLORS.control,
        shape: 'hat',
        message: 'when I start as a clone',
        inputs: []
    },
    'control_create_clone_of': {
        opcode: 'control_create_clone_of',
        category: 'control',
        color: COLORS.control,
        shape: 'stack',
        message: 'create clone of %1',
        inputs: [{ type: 'dropdown', name: 'CLONE_OPTION', options: [['myself', '_myself_']], default: '_myself_' }]
    },
    'control_delete_this_clone': {
        opcode: 'control_delete_this_clone',
        category: 'control',
        color: COLORS.control,
        shape: 'cap',
        message: 'delete this clone',
        inputs: []
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SENSING
    // ═══════════════════════════════════════════════════════════════════════════
    'sensing_touchingobject': {
        opcode: 'sensing_touchingobject',
        category: 'sensing',
        color: COLORS.sensing,
        shape: 'boolean',
        message: 'touching %1?',
        inputs: [{ type: 'dropdown', name: 'TOUCHINGOBJECTMENU', options: [['mouse-pointer', '_mouse_'], ['edge', '_edge_']], default: '_mouse_' }]
    },
    'sensing_touchingcolor': {
        opcode: 'sensing_touchingcolor',
        category: 'sensing',
        color: COLORS.sensing,
        shape: 'boolean',
        message: 'touching color %1?',
        inputs: [{ type: 'color', name: 'COLOR' }]
    },
    'sensing_coloristouchingcolor': {
        opcode: 'sensing_coloristouchingcolor',
        category: 'sensing',
        color: COLORS.sensing,
        shape: 'boolean',
        message: 'color %1 is touching %2?',
        inputs: [{ type: 'color', name: 'COLOR' }, { type: 'color', name: 'COLOR2' }]
    },
    'sensing_distanceto': {
        opcode: 'sensing_distanceto',
        category: 'sensing',
        color: COLORS.sensing,
        shape: 'reporter',
        message: 'distance to %1',
        inputs: [{ type: 'dropdown', name: 'DISTANCETOMENU', options: [['mouse-pointer', '_mouse_']], default: '_mouse_' }]
    },
    'sensing_askandwait': {
        opcode: 'sensing_askandwait',
        category: 'sensing',
        color: COLORS.sensing,
        shape: 'stack',
        message: 'ask %1 and wait',
        inputs: [{ type: 'string', name: 'QUESTION', default: "What's your name?" }]
    },
    'sensing_answer': {
        opcode: 'sensing_answer',
        category: 'sensing',
        color: COLORS.sensing,
        shape: 'reporter',
        message: 'answer',
        inputs: []
    },
    'sensing_keypressed': {
        opcode: 'sensing_keypressed',
        category: 'sensing',
        color: COLORS.sensing,
        shape: 'boolean',
        message: 'key %1 pressed?',
        inputs: [{ type: 'dropdown', name: 'KEY_OPTION', options: [['space', 'space'], ['any', 'any'], ['a', 'a']], default: 'space' }]
    },
    'sensing_mousedown': {
        opcode: 'sensing_mousedown',
        category: 'sensing',
        color: COLORS.sensing,
        shape: 'boolean',
        message: 'mouse down?',
        inputs: []
    },
    'sensing_mousex': {
        opcode: 'sensing_mousex',
        category: 'sensing',
        color: COLORS.sensing,
        shape: 'reporter',
        message: 'mouse x',
        inputs: []
    },
    'sensing_mousey': {
        opcode: 'sensing_mousey',
        category: 'sensing',
        color: COLORS.sensing,
        shape: 'reporter',
        message: 'mouse y',
        inputs: []
    },
    'sensing_setdragmode': {
        opcode: 'sensing_setdragmode',
        category: 'sensing',
        color: COLORS.sensing,
        shape: 'stack',
        message: 'set drag mode %1',
        inputs: [{ type: 'dropdown', name: 'DRAG_MODE', options: [['draggable', 'draggable'], ['not draggable', 'not draggable']], default: 'draggable' }]
    },
    'sensing_loudness': {
        opcode: 'sensing_loudness',
        category: 'sensing',
        color: COLORS.sensing,
        shape: 'reporter',
        message: 'loudness',
        inputs: []
    },
    'sensing_timer': {
        opcode: 'sensing_timer',
        category: 'sensing',
        color: COLORS.sensing,
        shape: 'reporter',
        message: 'timer',
        inputs: []
    },
    'sensing_resettimer': {
        opcode: 'sensing_resettimer',
        category: 'sensing',
        color: COLORS.sensing,
        shape: 'stack',
        message: 'reset timer',
        inputs: []
    },
    'sensing_of': {
        opcode: 'sensing_of',
        category: 'sensing',
        color: COLORS.sensing,
        shape: 'reporter',
        message: '%1 of %2',
        inputs: [
            { type: 'dropdown', name: 'PROPERTY', options: [['x position', 'x position'], ['y position', 'y position'], ['direction', 'direction'], ['costume #', 'costume #'], ['size', 'size'], ['volume', 'volume']], default: 'x position' },
            { type: 'dropdown', name: 'OBJECT', options: [['Sprite1', 'Sprite1'], ['Stage', '_stage_']], default: 'Sprite1' }
        ]
    },
    'sensing_current': {
        opcode: 'sensing_current',
        category: 'sensing',
        color: COLORS.sensing,
        shape: 'reporter',
        message: 'current %1',
        inputs: [{ type: 'dropdown', name: 'CURRENTMENU', options: [['year', 'YEAR'], ['month', 'MONTH'], ['date', 'DATE'], ['day of week', 'DAYOFWEEK'], ['hour', 'HOUR'], ['minute', 'MINUTE'], ['second', 'SECOND']], default: 'YEAR' }]
    },
    'sensing_dayssince2000': {
        opcode: 'sensing_dayssince2000',
        category: 'sensing',
        color: COLORS.sensing,
        shape: 'reporter',
        message: 'days since 2000',
        inputs: []
    },
    'sensing_username': {
        opcode: 'sensing_username',
        category: 'sensing',
        color: COLORS.sensing,
        shape: 'reporter',
        message: 'username',
        inputs: []
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // OPERATORS
    // ═══════════════════════════════════════════════════════════════════════════
    'operator_add': {
        opcode: 'operator_add',
        category: 'operators',
        color: COLORS.operators,
        shape: 'reporter',
        message: '%1 + %2',
        inputs: [{ type: 'number', name: 'NUM1', default: 0 }, { type: 'number', name: 'NUM2', default: 0 }]
    },
    'operator_subtract': {
        opcode: 'operator_subtract',
        category: 'operators',
        color: COLORS.operators,
        shape: 'reporter',
        message: '%1 - %2',
        inputs: [{ type: 'number', name: 'NUM1', default: 0 }, { type: 'number', name: 'NUM2', default: 0 }]
    },
    'operator_multiply': {
        opcode: 'operator_multiply',
        category: 'operators',
        color: COLORS.operators,
        shape: 'reporter',
        message: '%1 * %2',
        inputs: [{ type: 'number', name: 'NUM1', default: 0 }, { type: 'number', name: 'NUM2', default: 0 }]
    },
    'operator_divide': {
        opcode: 'operator_divide',
        category: 'operators',
        color: COLORS.operators,
        shape: 'reporter',
        message: '%1 / %2',
        inputs: [{ type: 'number', name: 'NUM1', default: 0 }, { type: 'number', name: 'NUM2', default: 1 }]
    },
    'operator_random': {
        opcode: 'operator_random',
        category: 'operators',
        color: COLORS.operators,
        shape: 'reporter',
        message: 'pick random %1 to %2',
        inputs: [{ type: 'number', name: 'FROM', default: 1 }, { type: 'number', name: 'TO', default: 10 }]
    },
    'operator_gt': {
        opcode: 'operator_gt',
        category: 'operators',
        color: COLORS.operators,
        shape: 'boolean',
        message: '%1 > %2',
        inputs: [{ type: 'string', name: 'OPERAND1', default: '' }, { type: 'string', name: 'OPERAND2', default: '50' }]
    },
    'operator_lt': {
        opcode: 'operator_lt',
        category: 'operators',
        color: COLORS.operators,
        shape: 'boolean',
        message: '%1 < %2',
        inputs: [{ type: 'string', name: 'OPERAND1', default: '' }, { type: 'string', name: 'OPERAND2', default: '50' }]
    },
    'operator_equals': {
        opcode: 'operator_equals',
        category: 'operators',
        color: COLORS.operators,
        shape: 'boolean',
        message: '%1 = %2',
        inputs: [{ type: 'string', name: 'OPERAND1', default: '' }, { type: 'string', name: 'OPERAND2', default: '50' }]
    },
    'operator_and': {
        opcode: 'operator_and',
        category: 'operators',
        color: COLORS.operators,
        shape: 'boolean',
        message: '%1 and %2',
        inputs: [{ type: 'boolean', name: 'OPERAND1' }, { type: 'boolean', name: 'OPERAND2' }]
    },
    'operator_or': {
        opcode: 'operator_or',
        category: 'operators',
        color: COLORS.operators,
        shape: 'boolean',
        message: '%1 or %2',
        inputs: [{ type: 'boolean', name: 'OPERAND1' }, { type: 'boolean', name: 'OPERAND2' }]
    },
    'operator_not': {
        opcode: 'operator_not',
        category: 'operators',
        color: COLORS.operators,
        shape: 'boolean',
        message: 'not %1',
        inputs: [{ type: 'boolean', name: 'OPERAND' }]
    },
    'operator_join': {
        opcode: 'operator_join',
        category: 'operators',
        color: COLORS.operators,
        shape: 'reporter',
        message: 'join %1 %2',
        inputs: [{ type: 'string', name: 'STRING1', default: 'apple' }, { type: 'string', name: 'STRING2', default: 'banana' }]
    },
    'operator_letter_of': {
        opcode: 'operator_letter_of',
        category: 'operators',
        color: COLORS.operators,
        shape: 'reporter',
        message: 'letter %1 of %2',
        inputs: [{ type: 'number', name: 'LETTER', default: 1 }, { type: 'string', name: 'STRING', default: 'apple' }]
    },
    'operator_length': {
        opcode: 'operator_length',
        category: 'operators',
        color: COLORS.operators,
        shape: 'reporter',
        message: 'length of %1',
        inputs: [{ type: 'string', name: 'STRING', default: 'apple' }]
    },
    'operator_contains': {
        opcode: 'operator_contains',
        category: 'operators',
        color: COLORS.operators,
        shape: 'boolean',
        message: '%1 contains %2?',
        inputs: [{ type: 'string', name: 'STRING1', default: 'apple' }, { type: 'string', name: 'STRING2', default: 'a' }]
    },
    'operator_mod': {
        opcode: 'operator_mod',
        category: 'operators',
        color: COLORS.operators,
        shape: 'reporter',
        message: '%1 mod %2',
        inputs: [{ type: 'number', name: 'NUM1', default: 0 }, { type: 'number', name: 'NUM2', default: 0 }]
    },
    'operator_round': {
        opcode: 'operator_round',
        category: 'operators',
        color: COLORS.operators,
        shape: 'reporter',
        message: 'round %1',
        inputs: [{ type: 'number', name: 'NUM', default: 0 }]
    },
    'operator_mathop': {
        opcode: 'operator_mathop',
        category: 'operators',
        color: COLORS.operators,
        shape: 'reporter',
        message: '%1 of %2',
        inputs: [
            { type: 'dropdown', name: 'OPERATOR', options: [['abs', 'abs'], ['floor', 'floor'], ['ceiling', 'ceiling'], ['sqrt', 'sqrt'], ['sin', 'sin'], ['cos', 'cos'], ['tan', 'tan'], ['asin', 'asin'], ['acos', 'acos'], ['atan', 'atan'], ['ln', 'ln'], ['log', 'log'], ['e ^', 'e ^'], ['10 ^', '10 ^']], default: 'abs' },
            { type: 'number', name: 'NUM', default: 10 }
        ]
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // VARIABLES
    // ═══════════════════════════════════════════════════════════════════════════
    'data_variable': {
        opcode: 'data_variable',
        category: 'variables',
        color: COLORS.variables,
        shape: 'reporter',
        message: '%1',
        inputs: [{ type: 'variable', name: 'VARIABLE', default: 'my variable' }]
    },
    'data_setvariableto': {
        opcode: 'data_setvariableto',
        category: 'variables',
        color: COLORS.variables,
        shape: 'stack',
        message: 'set %1 to %2',
        inputs: [{ type: 'variable', name: 'VARIABLE', default: 'my variable' }, { type: 'string', name: 'VALUE', default: '0' }]
    },
    'data_changevariableby': {
        opcode: 'data_changevariableby',
        category: 'variables',
        color: COLORS.variables,
        shape: 'stack',
        message: 'change %1 by %2',
        inputs: [{ type: 'variable', name: 'VARIABLE', default: 'my variable' }, { type: 'number', name: 'VALUE', default: 1 }]
    },
    'data_showvariable': {
        opcode: 'data_showvariable',
        category: 'variables',
        color: COLORS.variables,
        shape: 'stack',
        message: 'show variable %1',
        inputs: [{ type: 'variable', name: 'VARIABLE', default: 'my variable' }]
    },
    'data_hidevariable': {
        opcode: 'data_hidevariable',
        category: 'variables',
        color: COLORS.variables,
        shape: 'stack',
        message: 'hide variable %1',
        inputs: [{ type: 'variable', name: 'VARIABLE', default: 'my variable' }]
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // LISTS
    // ═══════════════════════════════════════════════════════════════════════════
    'data_addtolist': {
        opcode: 'data_addtolist',
        category: 'list',
        color: COLORS.list,
        shape: 'stack',
        message: 'add %1 to %2',
        inputs: [{ type: 'string', name: 'ITEM', default: 'thing' }, { type: 'list', name: 'LIST', default: 'my list' }]
    },
    'data_deleteoflist': {
        opcode: 'data_deleteoflist',
        category: 'list',
        color: COLORS.list,
        shape: 'stack',
        message: 'delete %1 of %2',
        inputs: [{ type: 'number', name: 'INDEX', default: 1 }, { type: 'list', name: 'LIST', default: 'my list' }]
    },
    'data_deletealloflist': {
        opcode: 'data_deletealloflist',
        category: 'list',
        color: COLORS.list,
        shape: 'stack',
        message: 'delete all of %1',
        inputs: [{ type: 'list', name: 'LIST', default: 'my list' }]
    },
    'data_insertatlist': {
        opcode: 'data_insertatlist',
        category: 'list',
        color: COLORS.list,
        shape: 'stack',
        message: 'insert %1 at %2 of %3',
        inputs: [{ type: 'string', name: 'ITEM', default: 'thing' }, { type: 'number', name: 'INDEX', default: 1 }, { type: 'list', name: 'LIST', default: 'my list' }]
    },
    'data_replaceitemoflist': {
        opcode: 'data_replaceitemoflist',
        category: 'list',
        color: COLORS.list,
        shape: 'stack',
        message: 'replace item %1 of %2 with %3',
        inputs: [{ type: 'number', name: 'INDEX', default: 1 }, { type: 'list', name: 'LIST', default: 'my list' }, { type: 'string', name: 'ITEM', default: 'thing' }]
    },
    'data_itemoflist': {
        opcode: 'data_itemoflist',
        category: 'list',
        color: COLORS.list,
        shape: 'reporter',
        message: 'item %1 of %2',
        inputs: [{ type: 'number', name: 'INDEX', default: 1 }, { type: 'list', name: 'LIST', default: 'my list' }]
    },
    'data_itemnumoflist': {
        opcode: 'data_itemnumoflist',
        category: 'list',
        color: COLORS.list,
        shape: 'reporter',
        message: 'item # of %1 in %2',
        inputs: [{ type: 'string', name: 'ITEM', default: 'thing' }, { type: 'list', name: 'LIST', default: 'my list' }]
    },
    'data_lengthoflist': {
        opcode: 'data_lengthoflist',
        category: 'list',
        color: COLORS.list,
        shape: 'reporter',
        message: 'length of %1',
        inputs: [{ type: 'list', name: 'LIST', default: 'my list' }]
    },
    'data_listcontainsitem': {
        opcode: 'data_listcontainsitem',
        category: 'list',
        color: COLORS.list,
        shape: 'boolean',
        message: '%1 contains %2?',
        inputs: [{ type: 'list', name: 'LIST', default: 'my list' }, { type: 'string', name: 'ITEM', default: 'thing' }]
    },
    'data_showlist': {
        opcode: 'data_showlist',
        category: 'list',
        color: COLORS.list,
        shape: 'stack',
        message: 'show list %1',
        inputs: [{ type: 'list', name: 'LIST', default: 'my list' }]
    },
    'data_hidelist': {
        opcode: 'data_hidelist',
        category: 'list',
        color: COLORS.list,
        shape: 'stack',
        message: 'hide list %1',
        inputs: [{ type: 'list', name: 'LIST', default: 'my list' }]
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MY BLOCKS
    // ═══════════════════════════════════════════════════════════════════════════
    'procedures_definition': {
        opcode: 'procedures_definition',
        category: 'myblocks',
        color: COLORS.myblocks,
        shape: 'hat',
        message: 'define %1',
        inputs: [{ type: 'custom', name: 'custom_block' }]
    },
    'procedures_call': {
        opcode: 'procedures_call',
        category: 'myblocks',
        color: COLORS.myblocks,
        shape: 'stack',
        message: '%1',
        inputs: [{ type: 'custom', name: 'custom_call' }]
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // TABLES (Added for parity and deduplication)
    // ═══════════════════════════════════════════════════════════════════════════
    'data_showtable': {
        opcode: 'data_showtable',
        category: 'list',
        color: COLORS.list,
        shape: 'stack',
        message: 'show table %1 as %2',
        inputs: [
            { type: 'variable', name: 'TABLE', default: 'my table' },
            { type: 'dropdown', name: 'FORMAT', options: [['stage', 'stage'], ['bar chart', 'bar'], ['line chart', 'line']], default: 'stage' }
        ]
    },
    'data_hidetable': {
        opcode: 'data_hidetable',
        category: 'list',
        color: COLORS.list,
        shape: 'stack',
        message: 'hide table %1',
        inputs: [{ type: 'variable', name: 'TABLE', default: 'my table' }]
    },
    'data_tablecontents': {
        opcode: 'data_tablecontents',
        category: 'list',
        color: COLORS.list,
        shape: 'reporter',
        message: 'table %1',
        inputs: [{ type: 'variable', name: 'TABLE', default: 'my table' }]
    },
    'data_setintable': {
        opcode: 'data_setintable',
        category: 'list',
        color: COLORS.list,
        shape: 'stack',
        message: 'set in table %1 column %2 row %3 value %4',
        inputs: [
            { type: 'variable', name: 'TABLE', default: 'my table' },
            { type: 'number', name: 'COLUMN', default: 1 },
            { type: 'number', name: 'ROW', default: 1 },
            { type: 'string', name: 'VALUE', default: '0' }
        ]
    },
    'data_addcolumn': {
        opcode: 'data_addcolumn',
        category: 'list',
        color: COLORS.list,
        shape: 'stack',
        message: 'add column %1 to table %2',
        inputs: [
            { type: 'string', name: 'COLUMN', default: 'new col' },
            { type: 'variable', name: 'TABLE', default: 'my table' }
        ]
    },
    'data_deletecolumn': {
        opcode: 'data_deletecolumn',
        category: 'list',
        color: COLORS.list,
        shape: 'stack',
        message: 'delete column %1 from table %2',
        inputs: [
            { type: 'number', name: 'COLUMN', default: 1 },
            { type: 'variable', name: 'TABLE', default: 'my table' }
        ]
    },
    'data_deleterow': {
        opcode: 'data_deleterow',
        category: 'list',
        color: COLORS.list,
        shape: 'stack',
        message: 'delete row %1 from table %2',
        inputs: [
            { type: 'number', name: 'ROW', default: 1 },
            { type: 'variable', name: 'TABLE', default: 'my table' }
        ]
    },
    'data_cleartable': {
        opcode: 'data_cleartable',
        category: 'list',
        color: COLORS.list,
        shape: 'stack',
        message: 'clear table %1',
        inputs: [{ type: 'variable', name: 'TABLE', default: 'my table' }]
    },
    'data_getvalueattable': {
        opcode: 'data_getvalueattable',
        category: 'list',
        color: COLORS.list,
        shape: 'reporter',
        message: 'get value at column %1 row %2 from %3',
        inputs: [
            { type: 'number', name: 'COLUMN', default: 1 },
            { type: 'number', name: 'ROW', default: 1 },
            { type: 'variable', name: 'TABLE', default: 'my table' }
        ]
    },
    'data_gettablecount': {
        opcode: 'data_gettablecount',
        category: 'list',
        color: COLORS.list,
        shape: 'reporter',
        message: 'get %1 count of table %2',
        inputs: [
            { type: 'dropdown', name: 'TYPE', options: [['row', 'row'], ['column', 'column']], default: 'row' },
            { type: 'variable', name: 'TABLE', default: 'my table' }
        ]
    },
    'data_gettimestamp': {
        opcode: 'data_gettimestamp',
        category: 'list',
        color: COLORS.list,
        shape: 'reporter',
        message: 'get timestamp',
        inputs: []
    },
    'data_exporttable': {
        opcode: 'data_exporttable',
        category: 'list',
        color: COLORS.list,
        shape: 'stack',
        message: 'export %1 as csv file',
        inputs: [{ type: 'variable', name: 'TABLE', default: 'my table' }]
    }
};

export default blockDefinitions;
