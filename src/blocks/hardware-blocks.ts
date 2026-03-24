import * as Blockly from 'blockly';

// ═══════════════════════════════════════════════════════════════════════════
// HARDWARE BLOCKS - Blocks for real-time hardware control in Stage mode
// ═══════════════════════════════════════════════════════════════════════════

const COLORS = {
    hardware: '#00979D',     // Arduino teal
    sensor: '#5CB1D6',       // Light blue
};

export const hardwareBlocks = [
    // ═══════════════════════════════════════════════════════════════════════
    // DIGITAL OUTPUT
    // ═══════════════════════════════════════════════════════════════════════
    {
        type: 'hw_set_digital',
        message0: '💡 set pin %1 to %2',
        args0: [
            { type: 'field_number', name: 'PIN', value: 13, min: 0, max: 53 },
            {
                type: 'field_dropdown',
                name: 'VALUE',
                options: [
                    ['HIGH', '1'],
                    ['LOW', '0'],
                ],
            },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.hardware,
        tooltip: 'Set a digital pin HIGH or LOW',
        helpUrl: '',
    },
    {
        type: 'hw_set_led',
        message0: '💡 set built-in LED %1',
        args0: [
            {
                type: 'field_dropdown',
                name: 'STATE',
                options: [
                    ['ON', '1'],
                    ['OFF', '0'],
                ],
            },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.hardware,
        tooltip: 'Turn the built-in LED on or off',
        helpUrl: '',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // PWM / ANALOG OUTPUT
    // ═══════════════════════════════════════════════════════════════════════
    {
        type: 'hw_set_pwm',
        message0: '🔆 set PWM pin %1 to %2',
        args0: [
            { type: 'field_number', name: 'PIN', value: 9, min: 0, max: 13 },
            { type: 'field_number', name: 'VALUE', value: 128, min: 0, max: 255 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.hardware,
        tooltip: 'Set PWM output (0-255)',
        helpUrl: '',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SERVO
    // ═══════════════════════════════════════════════════════════════════════
    {
        type: 'hw_set_servo',
        message0: '🎚️ set servo on pin %1 to %2 degrees',
        args0: [
            { type: 'field_number', name: 'PIN', value: 9, min: 0, max: 13 },
            { type: 'field_number', name: 'ANGLE', value: 90, min: 0, max: 180 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.hardware,
        tooltip: 'Set servo angle (0-180)',
        helpUrl: '',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // MOTOR
    // ═══════════════════════════════════════════════════════════════════════
    {
        type: 'hw_set_motor',
        message0: '⚙️ set motor %1 speed to %2',
        args0: [
            {
                type: 'field_dropdown',
                name: 'MOTOR',
                options: [
                    ['1', '1'],
                    ['2', '2'],
                ],
            },
            { type: 'field_number', name: 'SPEED', value: 128, min: -255, max: 255 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.hardware,
        tooltip: 'Set motor speed (-255 to 255, negative for reverse)',
        helpUrl: '',
    },
    {
        type: 'hw_stop_motors',
        message0: '🛑 stop all motors',
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.hardware,
        tooltip: 'Stop all motors',
        helpUrl: '',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SOUND
    // ═══════════════════════════════════════════════════════════════════════
    {
        type: 'hw_play_tone',
        message0: '🔊 play tone on pin %1 frequency %2 Hz for %3 ms',
        args0: [
            { type: 'field_number', name: 'PIN', value: 8, min: 0, max: 13 },
            { type: 'field_number', name: 'FREQ', value: 440, min: 31, max: 65535 },
            { type: 'field_number', name: 'DURATION', value: 500, min: 0, max: 10000 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.hardware,
        tooltip: 'Play a tone on a buzzer',
        helpUrl: '',
    },
    {
        type: 'hw_stop_tone',
        message0: '🔇 stop tone on pin %1',
        args0: [
            { type: 'field_number', name: 'PIN', value: 8, min: 0, max: 13 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.hardware,
        tooltip: 'Stop playing tone',
        helpUrl: '',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SENSORS (for reading values)
    // ═══════════════════════════════════════════════════════════════════════
    {
        type: 'hw_read_digital',
        message0: 'read digital pin %1',
        args0: [
            { type: 'field_number', name: 'PIN', value: 2, min: 0, max: 53 },
        ],
        output: 'Boolean',
        colour: COLORS.sensor,
        tooltip: 'Read digital pin value (true/false)',
        helpUrl: '',
    },
    {
        type: 'hw_read_analog',
        message0: 'read analog pin %1',
        args0: [
            { type: 'field_number', name: 'PIN', value: 0, min: 0, max: 15 },
        ],
        output: 'Number',
        colour: COLORS.sensor,
        tooltip: 'Read analog value (0-1023)',
        helpUrl: '',
    },
];

// Hardware Toolbox for Stage Mode
export const hardwareToolbox = {
    kind: 'category',
    name: 'Hardware',
    colour: COLORS.hardware,
    contents: [
        { kind: 'label', text: 'Digital Output' },
        { kind: 'block', type: 'hw_set_digital' },
        { kind: 'block', type: 'hw_set_led' },
        { kind: 'sep', gap: '8' },
        { kind: 'label', text: 'PWM' },
        { kind: 'block', type: 'hw_set_pwm' },
        { kind: 'sep', gap: '8' },
        { kind: 'label', text: 'Servo' },
        { kind: 'block', type: 'hw_set_servo' },
        { kind: 'sep', gap: '8' },
        { kind: 'label', text: 'Motors' },
        { kind: 'block', type: 'hw_set_motor' },
        { kind: 'block', type: 'hw_stop_motors' },
        { kind: 'sep', gap: '8' },
        { kind: 'label', text: 'Sound' },
        { kind: 'block', type: 'hw_play_tone' },
        { kind: 'block', type: 'hw_stop_tone' },
        { kind: 'sep', gap: '8' },
        { kind: 'label', text: 'Sensors' },
        { kind: 'block', type: 'hw_read_digital' },
        { kind: 'block', type: 'hw_read_analog' },
    ],
};
