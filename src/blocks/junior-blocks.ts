import * as Blockly from '@blockly-runtime';

// ═══════════════════════════════════════════════════════════════════════════
// JUNIOR BLOCKS - Simplified blocks for ages 4+
// ═══════════════════════════════════════════════════════════════════════════
// Junior blocks are
// - Fewer in number
// - Larger with bigger text
// - More visual (icons/emojis)
// - Simpler concepts (no variables, loops with fixed counts)

const COLORS = {
    motion: '#4A90E2',       // Premium Blue
    looks: '#8B5CF6',        // Vibrant Violet
    sound: '#D946EF',        // Bright Fuchsia
    events: '#FACC15',       // Sun Yellow
    control: '#F59E0B',      // Warm Amber
};

// Junior Block Definitions
export const juniorBlocks = Blockly.common.createBlockDefinitionsFromJsonArray([
    // ═══════════════════════════════════════════════════════════════════════════
    // EVENTS (Simplified)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'junior_event_start',
        message0: '🚀 START',
        nextStatement: null,
        colour: COLORS.events,
        tooltip: 'When you press the play button',
        helpUrl: '',
    },
    {
        type: 'junior_event_click',
        message0: '👆 WHEN CLICKED',
        nextStatement: null,
        colour: COLORS.events,
        tooltip: 'When you click on the sprite',
        helpUrl: '',
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MOTION (Simplified)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'junior_move_forward',
        message0: '➡️ MOVE FORWARD',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Move forward',
        helpUrl: '',
    },
    {
        type: 'junior_move_backward',
        message0: '⬅️ MOVE BACKWARD',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Move backward',
        helpUrl: '',
    },
    {
        type: 'junior_turn_right',
        message0: '↪️ TURN RIGHT',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Turn right',
        helpUrl: '',
    },
    {
        type: 'junior_turn_left',
        message0: '↩️ TURN LEFT',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Turn left',
        helpUrl: '',
    },
    {
        type: 'junior_jump',
        message0: '⬆️ JUMP',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Jump up and down',
        helpUrl: '',
    },
    {
        type: 'junior_go_home',
        message0: '🏠 GO HOME',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.motion,
        tooltip: 'Go back to the center',
        helpUrl: '',
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // LOOKS (Simplified)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'junior_say_hello',
        message0: '💬 SAY HELLO',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Say hello!',
        helpUrl: '',
    },
    {
        type: 'junior_say_goodbye',
        message0: '👋 SAY GOODBYE',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Say goodbye!',
        helpUrl: '',
    },
    {
        type: 'junior_grow',
        message0: '📈 GROW',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Get bigger',
        helpUrl: '',
    },
    {
        type: 'junior_shrink',
        message0: '📉 SHRINK',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Get smaller',
        helpUrl: '',
    },
    {
        type: 'junior_show',
        message0: '👁️ SHOW',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Make visible',
        helpUrl: '',
    },
    {
        type: 'junior_hide',
        message0: '🙈 HIDE',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Become invisible',
        helpUrl: '',
    },
    {
        type: 'junior_change_costume',
        message0: '👔 NEXT COSTUME',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.looks,
        tooltip: 'Change to the next costume',
        helpUrl: '',
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SOUND (Simplified)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'junior_play_pop',
        message0: '🔊 POP!',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.sound,
        tooltip: 'Play a pop sound',
        helpUrl: '',
    },
    {
        type: 'junior_play_meow',
        message0: '🐱 MEOW!',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.sound,
        tooltip: 'Play a meow sound',
        helpUrl: '',
    },
    {
        type: 'junior_play_boing',
        message0: '🎾 BOING!',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.sound,
        tooltip: 'Play a boing sound',
        helpUrl: '',
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // CONTROL (Simplified)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        type: 'junior_wait',
        message0: '⏰ WAIT',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.control,
        tooltip: 'Wait a moment',
        helpUrl: '',
    },
    {
        type: 'junior_repeat_3',
        message0: '🔄 REPEAT 3 TIMES %1',
        args0: [{ type: 'input_statement', name: 'DO' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.control,
        tooltip: 'Do something 3 times',
        helpUrl: '',
    },
    {
        type: 'junior_repeat_forever',
        message0: '♾️ REPEAT FOREVER %1',
        args0: [{ type: 'input_statement', name: 'DO' }],
        previousStatement: null,
        colour: COLORS.control,
        tooltip: 'Keep doing this forever',
        helpUrl: '',
    },
]);

// Junior Toolbox - simplified for young children
export const juniorToolbox = {
    kind: 'categoryToolbox',
    contents: [
        {
            kind: 'pictobloxCategory',
            name: 'Start',
            colour: COLORS.events,
            contents: [
                { kind: 'block', type: 'junior_event_start' },
                { kind: 'block', type: 'junior_event_click' },
            ],
        },
        {
            kind: 'pictobloxCategory',
            name: 'Move',
            colour: COLORS.motion,
            contents: [
                { kind: 'block', type: 'junior_move_forward' },
                { kind: 'block', type: 'junior_move_backward' },
                { kind: 'block', type: 'junior_turn_right' },
                { kind: 'block', type: 'junior_turn_left' },
                { kind: 'block', type: 'junior_jump' },
                { kind: 'block', type: 'junior_go_home' },
            ],
        },
        {
            kind: 'pictobloxCategory',
            name: 'Look',
            colour: COLORS.looks,
            contents: [
                { kind: 'block', type: 'junior_say_hello' },
                { kind: 'block', type: 'junior_say_goodbye' },
                { kind: 'block', type: 'junior_grow' },
                { kind: 'block', type: 'junior_shrink' },
                { kind: 'block', type: 'junior_show' },
                { kind: 'block', type: 'junior_hide' },
                { kind: 'block', type: 'junior_change_costume' },
            ],
        },
        {
            kind: 'pictobloxCategory',
            name: 'Sound',
            colour: COLORS.sound,
            contents: [
                { kind: 'block', type: 'junior_play_pop' },
                { kind: 'block', type: 'junior_play_meow' },
                { kind: 'block', type: 'junior_play_boing' },
            ],
        },
        {
            kind: 'pictobloxCategory',
            name: 'Control',
            colour: COLORS.control,
            contents: [
                { kind: 'block', type: 'junior_wait' },
                { kind: 'block', type: 'junior_repeat_3' },
                { kind: 'block', type: 'junior_repeat_forever' },
            ],
        },
    ],
};
