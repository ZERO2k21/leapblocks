/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import Blockly from '@blockly-runtime';



// Block colors matching Scratch style

const COLORS = {

    control: '#FFAB19',      // Scratch Orange - Control blocks

    operators: '#59C059',    // Scratch Green - Operators/Math

    arduino: '#4C97FF',      // Scratch Blue - Arduino blocks

    sensors: '#5CB1D6',      // Scratch Cyan - Sensors

    actuators: '#0FBD8C',    // Scratch Green - Actuators

    variables: '#FF8C1A',    // Scratch Orange - Variables

    events: '#FFBF00',       // Scratch Yellow - Events

    serial: '#9966FF',       // Scratch Purple - Serial

};



// Common pin options to ensure consistency

const DIGITAL_PINS: [string, string][] = [

    ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6'], ['7', '7'],

    ['8', '8'], ['9', '9'], ['10', '10'], ['11', '11'], ['12', '12'], ['13', '13']

];



const ANALOG_PINS: [string, string][] = [

    ['A0', 'A0'], ['A1', 'A1'], ['A2', 'A2'], ['A3', 'A3'], ['A4', 'A4'], ['A5', 'A5']

];



const PWM_PINS: [string, string][] = [

    ['3', '3'], ['5', '5'], ['6', '6'], ['9', '9'], ['10', '10'], ['11', '11']

];



const ALL_PINS = [...DIGITAL_PINS, ...ANALOG_PINS];



// Define Arduino blocks with better styling

export const arduinoBlocks = [

    // Arduino-specific blocks (excluding standard Blockly variables which are already defined)
    
    // Arduino-specific variable block for distance
    {
        type: 'set_distance',
        message0: 'set distance to %1',
        args0: [
            { type: 'input_value', name: 'VALUE', check: 'Number' },
        ],
        previousStatement: null,
        nextStatement: null,
        inputsInline: true,
        colour: COLORS.variables,
        tooltip: 'Set distance value',
        helpUrl: '',
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // ARDUINO EVENTS
    // ═══════════════════════════════════════════════════════════════════════════

    {
        type: 'arduino_setup',
        message0: '⚙️ when Arduino starts up',
        nextStatement: null,
        colour: COLORS.events,
        tooltip: 'Runs once when the Arduino starts',
        helpUrl: '',
    },

    {
        type: 'arduino_loop',
        message0: '🔄 forever',
        message1: '%1',
        args1: [{ type: 'input_statement', name: 'DO' }],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.control,
        tooltip: 'Runs code repeatedly forever',
        helpUrl: '',
    },



    // ═══════════════════════════════════════════════════════════════════════════

    // CONTROL - Orange

    // ═══════════════════════════════════════════════════════════════════════════

    {

        type: 'arduino_delay',

        message0: '⏱️ wait %1 seconds',

        args0: [{ type: 'field_number', name: 'SECS', value: 1, min: 0, precision: 0.1 }],

        previousStatement: null,

        nextStatement: null,

        colour: COLORS.control,

        tooltip: 'Wait for specified seconds',

        helpUrl: '',

    },

    {

        type: 'arduino_repeat',

        message0: '🔁 repeat %1 times',

        args0: [{ type: 'field_number', name: 'TIMES', value: 10, min: 1 }],

        message1: '%1',

        args1: [{ type: 'input_statement', name: 'DO' }],

        previousStatement: null,

        nextStatement: null,

        colour: COLORS.control,

        tooltip: 'Repeat code N times',

        helpUrl: '',

    },

    {

        type: 'arduino_if',

        message0: '❓ if %1 then',

        args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],

        message1: '%1',

        args1: [{ type: 'input_statement', name: 'DO' }],

        previousStatement: null,

        nextStatement: null,

        colour: COLORS.control,

        tooltip: 'If condition is true, do something',

        helpUrl: '',

    },

    {

        type: 'arduino_if_else',

        message0: '❓ if %1 then',

        args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],

        message1: '%1',

        args1: [{ type: 'input_statement', name: 'DO' }],

        message2: 'else',

        message3: '%1',

        args3: [{ type: 'input_statement', name: 'ELSE' }],

        previousStatement: null,

        nextStatement: null,

        colour: COLORS.control,

        tooltip: 'If-else conditional',

        helpUrl: '',

    },

    {

        type: 'arduino_wait_until',

        message0: '⏳ wait until %1',

        args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],

        previousStatement: null,

        nextStatement: null,

        colour: COLORS.control,

        tooltip: 'Wait until condition is true',

        helpUrl: '',

    },

    {

        type: 'arduino_repeat_until',

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

        type: 'arduino_stop',

        message0: '🛑 stop %1',

        args0: [{ type: 'field_dropdown', name: 'MODE', options: [['all', 'all'], ['this script', 'this']] }],

        previousStatement: null,

        colour: COLORS.control,

        tooltip: 'Stop script',

        helpUrl: '',

    },



    // ═══════════════════════════════════════════════════════════════════════════

    // ARDUINO GPIO - Blue

    // ═══════════════════════════════════════════════════════════════════════════

    {

        type: 'arduino_digital_write',

        message0: ' set digital pin %1 output as %2',

        args0: [

            {

                type: 'field_dropdown',

                name: 'PIN',

                options: ALL_PINS

            },

            { type: 'field_dropdown', name: 'VALUE', options: [['HIGH', 'HIGH'], ['LOW', 'LOW']] },

        ],

        previousStatement: null,

        nextStatement: null,

        colour: COLORS.arduino,

        tooltip: 'Set digital pin HIGH or LOW',

        helpUrl: '',

    },

    {

        type: 'arduino_digital_read',

        message0: '📖 read digital pin %1',

        args0: [

            {

                type: 'field_dropdown',

                name: 'PIN',

                options: ALL_PINS

            }

        ],

        output: ['Number', 'String', 'Boolean'],

        colour: COLORS.arduino,

        tooltip: 'Read digital value from pin',

        helpUrl: '',

    },

    {

        type: 'arduino_analog_write',

        message0: '📊 set PWM pin %1 to %2',

        args0: [

            { type: 'field_dropdown', name: 'PIN', options: PWM_PINS },

            { type: 'field_number', name: 'VALUE', value: 255, min: 0, max: 255 },

        ],

        previousStatement: null,

        nextStatement: null,

        colour: COLORS.arduino,

        tooltip: 'Set PWM value (0-255) on pin',

        helpUrl: '',

    },

    {

        type: 'arduino_analog_read',

        message0: '📈 read analog pin %1',

        args0: [{ type: 'field_dropdown', name: 'PIN', options: ANALOG_PINS }],

        output: ['Number', 'String', 'Boolean'],

        colour: COLORS.arduino,

        tooltip: 'Read analog value from pin (0-1023)',

        helpUrl: '',

    },

    {

        type: 'arduino_tone',

        message0: '🔊 play tone on pin %1 frequency %2 Hz',

        args0: [

            { type: 'field_dropdown', name: 'PIN', options: PWM_PINS },

            { type: 'field_number', name: 'FREQ', value: 440, min: 20, max: 20000 },

        ],

        previousStatement: null,

        nextStatement: null,

        colour: COLORS.arduino,

        tooltip: 'Play a tone on speaker/buzzer',

        helpUrl: '',

    },

    {

        type: 'arduino_notone',

        message0: '🔇 stop tone on pin %1',

        args0: [

            { type: 'field_dropdown', name: 'PIN', options: PWM_PINS },

        ],

        previousStatement: null,

        nextStatement: null,

        colour: COLORS.arduino,

        tooltip: 'Stop playing tone',

        helpUrl: '',

    },

    {

        type: 'arduino_millis',

        message0: '⏱️ timer value (ms)',

        inputsInline: true,

        output: 'Number',

        colour: COLORS.arduino,

        tooltip: 'Time since program started (milliseconds)',

        helpUrl: '',

    },

    {

        type: 'arduino_map',

        message0: '🗺️ map %1 from ( %2 - %3 ) to ( %4 - %5 )',

        args0: [

            { type: 'input_value', name: 'VALUE', check: 'Number' },

            { type: 'field_number', name: 'IN_MIN', value: 0 },

            { type: 'field_number', name: 'IN_MAX', value: 1023 },

            { type: 'field_number', name: 'OUT_MIN', value: 0 },

            { type: 'field_number', name: 'OUT_MAX', value: 255 },

        ],

        inputsInline: true,

        output: ['Number', 'String', 'Boolean'],

        colour: COLORS.arduino,

        tooltip: 'Map value from one range to another',

        helpUrl: '',

    },

    {

        type: 'arduino_constrain',

        message0: '📏 constrain %1 between %2 and %3',

        args0: [

            { type: 'input_value', name: 'VALUE', check: 'Number' },

            { type: 'field_number', name: 'MIN', value: 0 },

            { type: 'field_number', name: 'MAX', value: 255 },

        ],

        inputsInline: true,

        output: ['Number', 'String', 'Boolean'],

        colour: COLORS.arduino,

        tooltip: 'Constrain value within range',

        helpUrl: '',

    },



    // ═══════════════════════════════════════════════════════════════════════════

    // SERIAL - Purple

    // ═══════════════════════════════════════════════════════════════════════════

    {

        type: 'arduino_serial_begin',

        message0: 'set serial baud rate to %1',

        args0: [{ type: 'field_dropdown', name: 'BAUD', options: [['9600', '9600'], ['115200', '115200'], ['57600', '57600'], ['38400', '38400'], ['19200', '19200']] }],

        previousStatement: null,

        nextStatement: null,

        colour: COLORS.serial,

        tooltip: 'Initialize serial communication',

        helpUrl: '',

    },

    {

        type: 'arduino_serial_print',

        message0: '📝 serial print %1',

        args0: [{ type: 'input_value', name: 'TEXT' }],

        previousStatement: null,

        nextStatement: null,

        colour: COLORS.serial,

        tooltip: 'Print to serial monitor',

        helpUrl: '',

    },

    {

        type: 'arduino_serial_println',

        message0: '📝 serial print line %1',

        args0: [{ type: 'input_value', name: 'TEXT' }],

        previousStatement: null,

        nextStatement: null,

        colour: COLORS.serial,

        tooltip: 'Print line to serial monitor',

        helpUrl: '',

    },

    {

        type: 'arduino_serial_print_labeled',

        message0: 'serial print label: %1 value: %2',

        args0: [

            { type: 'input_value', name: 'LABEL', check: 'String' },

            { type: 'input_value', name: 'VALUE' },

        ],

        previousStatement: null,

        nextStatement: null,

        colour: COLORS.serial,

        tooltip: 'Print a label followed by a value to the serial monitor',

        helpUrl: '',

    },

    {

        type: 'arduino_serial_available',

        message0: 'serial available?',

        output: ['Number', 'String', 'Boolean'],

        colour: COLORS.serial,

        tooltip: 'Check if data is available on serial',

        helpUrl: '',

    },

    {

        type: 'arduino_serial_read',

        message0: 'read from serial',

        inputsInline: true,

        output: 'Number',

        colour: COLORS.serial,

        tooltip: 'Read byte from serial',

        helpUrl: '',

    },

    // Advanced Communication Blocks

    {

        type: 'arduino_bluetooth_serial_begin',

        message0: 'set bluetooth serial baudrate to %1',

        args0: [

            {

                type: 'field_dropdown',

                name: 'BAUD',

                options: [['9600', '9600'], ['115200', '115200'], ['57600', '57600']]

            }

        ],

        previousStatement: null,

        nextStatement: null,

        colour: COLORS.serial,

        tooltip: 'Initialize Bluetooth Serial (for ESP32)',

        helpUrl: '',

    },

    {

        type: 'arduino_serial_multi_begin',

        message0: 'set serial %1 baud rate to %2',

        args0: [

            {

                type: 'field_dropdown',

                name: 'PORT',

                options: [['0', '0'], ['1', '1'], ['2', '2'], ['3', '3']]

            },

            {

                type: 'field_dropdown',

                name: 'BAUD',

                options: [['9600', '9600'], ['115200', '115200'], ['57600', '57600']]

            }

        ],

        previousStatement: null,

        nextStatement: null,

        colour: COLORS.serial,

        tooltip: 'Initialize specific serial port (Mega/ESP32)',

        helpUrl: '',

    },

    {

        type: 'arduino_serial_multi_available',

        message0: 'bytes available on serial %1 ?',

        args0: [

            {

                type: 'field_dropdown',

                name: 'PORT',

                options: [['0', '0'], ['1', '1'], ['2', '2'], ['3', '3']]

            }

        ],

        output: 'Number',

        colour: COLORS.serial,

        tooltip: 'Check bytes available on specific serial port',

        helpUrl: '',

    },

    {

        type: 'arduino_serial_multi_read',

        message0: 'read bytes on serial %1',

        args0: [

            {

                type: 'field_dropdown',

                name: 'PORT',

                options: [['0', '0'], ['1', '1'], ['2', '2'], ['3', '3']]

            }

        ],

        output: 'Number',

        colour: COLORS.serial,

        tooltip: 'Read byte from specific serial port',

        helpUrl: '',

    },

    {

        type: 'arduino_serial_multi_read_number',

        message0: 'get a number from serial %1',

        args0: [

            {

                type: 'field_dropdown',

                name: 'PORT',

                options: [['0', '0'], ['1', '1'], ['2', '2'], ['3', '3']]

            }

        ],

        output: 'Number',

        colour: COLORS.serial,

        tooltip: 'Parse integer from specific serial port',

        helpUrl: '',

    },

    {

        type: 'arduino_serial_multi_read_string',

        message0: 'read bytes as a string from serial %1',

        args0: [

            {

                type: 'field_dropdown',

                name: 'PORT',

                options: [['0', '0'], ['1', '1'], ['2', '2'], ['3', '3']]

            }

        ],

        output: 'String',

        colour: COLORS.serial,

        tooltip: 'Read string from specific serial port',

        helpUrl: '',

    },

    {

        type: 'arduino_serial_multi_write',

        message0: 'write %1 to serial',

        args0: [

            { type: 'input_value', name: 'VALUE' },

        ],

        previousStatement: null,

        nextStatement: null,

        colour: COLORS.serial,

        tooltip: 'Write to serial port',

        helpUrl: '',

    },



    // ═══════════════════════════════════════════════════════════════════════════

    // OPERATORS - Green (oval shaped for values)

    // ═══════════════════════════════════════════════════════════════════════════

    {

        type: 'arduino_math_add',

        message0: '%1 + %2',

        args0: [

            { type: 'input_value', name: 'A', check: 'Number' },

            { type: 'input_value', name: 'B', check: 'Number' },

        ],

        inputsInline: true,

        output: 'Number',

        colour: COLORS.operators,

        tooltip: 'Add two numbers',

        helpUrl: '',

    },

    {

        type: 'arduino_math_subtract',

        message0: '%1 − %2',

        args0: [

            { type: 'input_value', name: 'A', check: 'Number' },

            { type: 'input_value', name: 'B', check: 'Number' },

        ],

        inputsInline: true,

        output: 'Number',

        colour: COLORS.operators,

        tooltip: 'Subtract two numbers',

        helpUrl: '',

    },

    {

        type: 'arduino_math_multiply',

        message0: '%1 × %2',

        args0: [

            { type: 'input_value', name: 'A', check: 'Number' },

            { type: 'input_value', name: 'B', check: 'Number' },

        ],

        inputsInline: true,

        output: 'Number',

        colour: COLORS.operators,

        tooltip: 'Multiply two numbers',

        helpUrl: '',

    },

    {

        type: 'arduino_math_divide',

        message0: '%1 ÷ %2',

        args0: [

            { type: 'input_value', name: 'A', check: 'Number' },

            { type: 'input_value', name: 'B', check: 'Number' },

        ],

        inputsInline: true,

        output: 'Number',

        colour: COLORS.operators,

        tooltip: 'Divide two numbers',

        helpUrl: '',

    },

    {

        type: 'arduino_random',

        message0: '🎲 random %1 to %2',

        args0: [

            { type: 'field_number', name: 'MIN', value: 1 },

            { type: 'field_number', name: 'MAX', value: 10 },

        ],

        output: 'Number',

        inputsInline: true,

        colour: COLORS.operators,

        tooltip: 'Random number in range',

        helpUrl: '',

    },

    {

        type: 'arduino_compare_gt',

        message0: '%1 > %2',

        args0: [

            { type: 'input_value', name: 'A', check: 'Number' },

            { type: 'input_value', name: 'B', check: 'Number' },

        ],

        inputsInline: true,

        output: 'Boolean',

        colour: COLORS.operators,

        tooltip: 'Greater than',

        helpUrl: '',

    },

    {

        type: 'arduino_compare_lt',

        message0: '%1 < %2',

        args0: [

            { type: 'input_value', name: 'A', check: 'Number' },

            { type: 'input_value', name: 'B', check: 'Number' },

        ],

        inputsInline: true,

        output: 'Boolean',

        colour: COLORS.operators,

        tooltip: 'Less than',

        helpUrl: '',

    },

    {

        type: 'arduino_compare_eq',

        message0: '%1 = %2',

        args0: [

            { type: 'input_value', name: 'A', check: 'Number' },

            { type: 'input_value', name: 'B', check: 'Number' },

        ],

        inputsInline: true,

        output: 'Boolean',

        colour: COLORS.operators,

        tooltip: 'Equal to',

        helpUrl: '',

    },

    {

        type: 'arduino_logic_and',

        message0: '%1 and %2',

        args0: [

            { type: 'input_value', name: 'A', check: 'Boolean' },

            { type: 'input_value', name: 'B', check: 'Boolean' },

        ],

        inputsInline: true,

        output: 'Boolean',

        colour: COLORS.operators,

        tooltip: 'Returns true if both are true',

        helpUrl: '',

    },

    {

        type: 'arduino_logic_or',

        message0: '%1 or %2',

        args0: [

            { type: 'input_value', name: 'A', check: 'Boolean' },

            { type: 'input_value', name: 'B', check: 'Boolean' },

        ],

        inputsInline: true,

        output: 'Boolean',

        colour: COLORS.operators,

        tooltip: 'Returns true if either is true',

        helpUrl: '',

    },

    {

        type: 'arduino_logic_not',

        message0: 'not %1',

        args0: [{ type: 'input_value', name: 'A', check: 'Boolean' }],

        output: 'Boolean',

        colour: COLORS.operators,

        tooltip: 'Returns opposite boolean',

        helpUrl: '',

    },

    {

        type: 'arduino_number',

        message0: '%1',

        args0: [{ type: 'field_number', name: 'NUM', value: 0 }],

        output: 'Number',

        colour: COLORS.operators,

        tooltip: 'A number',

        helpUrl: '',

    },

    {

        type: 'arduino_text',

        message0: '"%1"',

        args0: [{ type: 'field_input', name: 'TEXT', text: 'hello' }],

        output: 'String',

        colour: COLORS.operators,

        tooltip: 'Text string',

        helpUrl: '',

    },

    {

        type: 'arduino_mod',

        message0: '%1 mod %2',

        args0: [

            { type: 'input_value', name: 'A', check: 'Number' },

            { type: 'input_value', name: 'B', check: 'Number' },

        ],

        inputsInline: true,

        output: 'Number',

        colour: COLORS.operators,

        tooltip: 'Modulo (remainder)',

        helpUrl: '',

    },

    {

        type: 'arduino_round',

        message0: 'round %1',

        args0: [{ type: 'input_value', name: 'NUM', check: 'Number' }],

        inputsInline: true,

        output: 'Number',

        colour: COLORS.operators,

        tooltip: 'Round to nearest integer',

        helpUrl: '',

    },

    {

        type: 'arduino_abs',

        message0: 'abs %1',

        args0: [{ type: 'input_value', name: 'NUM', check: 'Number' }],

        inputsInline: true,

        output: 'Number',

        colour: COLORS.operators,

        tooltip: 'Absolute value',

        helpUrl: '',

    },



    // ═══════════════════════════════════════════════════════════════════════════

    // ACTUATORS - Teal

    // ═══════════════════════════════════════════════════════════════════════════

    {

        type: 'arduino_servo',

        message0: '🎚️ set servo on pin %1 to %2 °',

        args0: [

            { type: 'field_dropdown', name: 'PIN', options: PWM_PINS },

            { type: 'field_angle', name: 'ANGLE', angle: 90 },

        ],

        previousStatement: null,

        nextStatement: null,

        colour: COLORS.actuators,

        tooltip: 'Set servo angle (0-180)',

        helpUrl: '',

    },

    {

        type: 'arduino_motor',

        message0: '⚙️ motor %1 direction %2 speed %3',

        args0: [

            { type: 'field_dropdown', name: 'MOTOR', options: [['A', 'A'], ['B', 'B']] },

            { type: 'field_dropdown', name: 'DIR', options: [['forward', 'forward'], ['backward', 'backward'], ['stop', 'stop']] },

            { type: 'field_number', name: 'SPEED', value: 255, min: 0, max: 255 },

        ],

        previousStatement: null,

        nextStatement: null,

        colour: COLORS.actuators,

        tooltip: 'Control DC motor',

        helpUrl: '',

    },

    {

        type: 'arduino_led',

        message0: '💡 LED on pin %1 brightness %2',

        args0: [

            { type: 'field_dropdown', name: 'PIN', options: [...PWM_PINS, ['13', '13']] },

            { type: 'field_number', name: 'BRIGHTNESS', value: 255, min: 0, max: 255 },

        ],

        previousStatement: null,

        nextStatement: null,

        colour: COLORS.actuators,

        tooltip: 'Set LED brightness',

        helpUrl: '',

    },

    {

        type: 'arduino_relay',

        message0: '🔌 relay on pin %1 set %2',

        args0: [

            { type: 'field_dropdown', name: 'PIN', options: [['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6'], ['7', '7']] },

            { type: 'field_dropdown', name: 'STATE', options: [['ON', 'HIGH'], ['OFF', 'LOW']] },

        ],

        previousStatement: null,

        nextStatement: null,

        colour: COLORS.actuators,

        tooltip: 'Control relay',

        helpUrl: '',

    },



    // ═══════════════════════════════════════════════════════════════════════════

    // SENSORS - Light Blue

    // ═══════════════════════════════════════════════════════════════════════════

    {

        type: 'arduino_ultrasonic',

        message0: '📏 ultrasonic distance (cm) trig %1 echo %2',

        args0: [

            { type: 'field_dropdown', name: 'TRIG', options: ALL_PINS },

            { type: 'field_dropdown', name: 'ECHO', options: ALL_PINS },

        ],

        inputsInline: true,

        output: 'Number',

        colour: COLORS.sensors,

        tooltip: 'Read ultrasonic distance in cm',

        helpUrl: '',

    },

    {

        type: 'arduino_dht_temp',

        message0: '🌡️ DHT %1 on pin %2',

        args0: [

            { type: 'field_dropdown', name: 'TYPE', options: [['temperature °C', 'temperature'], ['humidity %', 'humidity']] },

            { type: 'field_dropdown', name: 'PIN', options: [['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6'], ['7', '7']] },

        ],

        inputsInline: true,

        output: 'Number',

        colour: COLORS.sensors,

        tooltip: 'Read DHT temperature or humidity',

        helpUrl: '',

    },

    {

        type: 'arduino_button',

        message0: '🔘 button on pin %1 pressed?',

        args0: [

            { type: 'field_dropdown', name: 'PIN', options: [['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6'], ['7', '7'], ['8', '8']] },

        ],

        inputsInline: true,

        output: 'Boolean',

        colour: COLORS.sensors,

        tooltip: 'Check if button is pressed',

        helpUrl: '',

    },

    {

        type: 'arduino_ldr',

        message0: '☀️ light sensor on %1',

        args0: [{ type: 'field_dropdown', name: 'PIN', options: [['A0', 'A0'], ['A1', 'A1'], ['A2', 'A2'], ['A3', 'A3']] }],

        inputsInline: true,

        output: 'Number',

        colour: COLORS.sensors,

        tooltip: 'Read light level (0-1023)',

        helpUrl: '',

    },

    {

        type: 'arduino_potentiometer',

        message0: '🎛️ potentiometer on %1',

        args0: [{ type: 'field_dropdown', name: 'PIN', options: [['A0', 'A0'], ['A1', 'A1'], ['A2', 'A2'], ['A3', 'A3']] }],

        inputsInline: true,

        output: 'Number',

        colour: COLORS.sensors,

        tooltip: 'Read potentiometer value (0-1023)',

        helpUrl: '',

    },

    {

        type: 'arduino_pir',

        message0: '🚶 motion detected on pin %1?',

        args0: [

            { type: 'field_dropdown', name: 'PIN', options: [['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6'], ['7', '7']] },

        ],

        inputsInline: true,

        output: 'Boolean',

        colour: COLORS.sensors,

        tooltip: 'Check if motion is detected',

        helpUrl: '',

    },

    {

        type: 'arduino_digital_sensor',

        message0: '🌡️ read digital sensor %1 at %2',

        args0: [

            {

                type: 'field_dropdown',

                name: 'SENSOR',

                options: [

                    ['IR (proximity)', 'IR'],

                    ['PIR', 'PIR'],

                    ['soil moisture', 'SOIL'],

                    ['hall effect / magnetic field', 'HALL'],

                    ['touch', 'TOUCH'],

                    ['Generic', 'GENERIC'],

                ]

            },

            {

                type: 'field_dropdown',

                name: 'PIN',

                options: DIGITAL_PINS

            }

        ],

        inputsInline: true,

        output: 'Boolean',

        colour: COLORS.sensors,

        tooltip: 'Read status from various digital sensors',

        helpUrl: '',

    },

];

// Define toolbox with improved categories

export const arduinoToolbox = {

    kind: 'categoryToolbox',

    contents: [

        {

            kind: 'pictobloxCategory',

            name: 'Events',

            colour: COLORS.events,

            contents: [

                { kind: 'block', type: 'arduino_setup' },

            ],

        },

        {

            kind: 'pictobloxCategory',

            name: 'Control',

            colour: COLORS.control,

            contents: [

                { kind: 'block', type: 'arduino_loop' },

                { kind: 'block', type: 'arduino_delay' },

                { kind: 'block', type: 'arduino_repeat' },

                { kind: 'block', type: 'arduino_if' },

                { kind: 'block', type: 'arduino_if_else' },

                { kind: 'block', type: 'arduino_wait_until' },

                { kind: 'block', type: 'arduino_repeat_until' },

                { kind: 'block', type: 'arduino_stop' },

            ],

        },

        {

            kind: 'pictobloxCategory',

            name: 'Operators',

            colour: COLORS.operators,

            contents: [

                {

                    kind: 'block',

                    type: 'arduino_math_add',

                    inputs: {

                        A: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } },

                        B: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } }

                    }

                },

                {

                    kind: 'block',

                    type: 'arduino_math_subtract',

                    inputs: {

                        A: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } },

                        B: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } }

                    }

                },

                {

                    kind: 'block',

                    type: 'arduino_math_multiply',

                    inputs: {

                        A: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } },

                        B: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } }

                    }

                },

                {

                    kind: 'block',

                    type: 'arduino_math_divide',

                    inputs: {

                        A: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } },

                        B: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } }

                    }

                },

                {

                    kind: 'block',

                    type: 'arduino_mod',

                    inputs: {

                        A: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } },

                        B: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } }

                    }

                },

                { kind: 'label', text: '── Comparison ──' },

                {

                    kind: 'block',

                    type: 'arduino_compare_gt',

                    inputs: {

                        A: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } },

                        B: { shadow: { type: 'arduino_number', fields: { NUM: 50 } } }

                    }

                },

                {

                    kind: 'block',

                    type: 'arduino_compare_lt',

                    inputs: {

                        A: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } },

                        B: { shadow: { type: 'arduino_number', fields: { NUM: 50 } } }

                    }

                },

                {

                    kind: 'block',

                    type: 'arduino_compare_eq',

                    inputs: {

                        A: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } },

                        B: { shadow: { type: 'arduino_number', fields: { NUM: 50 } } }

                    }

                },

                { kind: 'label', text: '── Logic ──' },

                { kind: 'block', type: 'arduino_logic_and' },

                { kind: 'block', type: 'arduino_logic_or' },

                { kind: 'block', type: 'arduino_logic_not' },

                { kind: 'label', text: '── Math ──' },

                { kind: 'block', type: 'arduino_random' },

                { kind: 'block', type: 'arduino_round' },

                { kind: 'block', type: 'arduino_abs' },

                { kind: 'label', text: '── Values ──' },

                { kind: 'block', type: 'arduino_number' },

                { kind: 'block', type: 'arduino_text' },

            ],

        },

        {

            kind: 'pictobloxCategory',

            name: 'Variables',

            colour: COLORS.variables,

            custom: 'LEAP_VARIABLES',

        },

        {

            kind: 'sep',

        },

        {

            kind: 'pictobloxCategory',

            name: 'Arduino',

            colour: COLORS.arduino,

            contents: [

                { kind: 'label', text: '── Digital I/O ──' },

                { kind: 'block', type: 'arduino_digital_write' },

                { kind: 'block', type: 'arduino_digital_read' },

                { kind: 'label', text: '── Analog I/O ──' },

                { kind: 'block', type: 'arduino_analog_write' },

                { kind: 'block', type: 'arduino_analog_read' },

                { kind: 'label', text: '── Sound ──' },

                { kind: 'block', type: 'arduino_tone' },

                { kind: 'block', type: 'arduino_notone' },

                { kind: 'label', text: '── Utilities ──' },

                { kind: 'block', type: 'arduino_millis' },

                { kind: 'block', type: 'arduino_map' },

                { kind: 'block', type: 'arduino_constrain' },

            ],

        },

        {

            kind: 'pictobloxCategory',

            name: 'Communication',

            colour: COLORS.serial,

            contents: [

                { kind: 'block', type: 'arduino_serial_begin' },

                {

                    kind: 'block',

                    type: 'arduino_serial_multi_write',

                    inputs: {

                        VALUE: { shadow: { type: 'arduino_text', fields: { TEXT: 'Hello World' } } }

                    }

                },

                { kind: 'block', type: 'arduino_serial_available' },

                { kind: 'block', type: 'arduino_serial_read' },

                { kind: 'sep', gap: '16' },

                { kind: 'label', text: '── Details ──' },

                { kind: 'block', type: 'arduino_serial_print' },

                { kind: 'block', type: 'arduino_serial_println' },

                {

                    kind: 'block',

                    type: 'arduino_serial_print_labeled',

                    inputs: {

                        LABEL: { shadow: { type: 'arduino_text', fields: { TEXT: 'value: ' } } },

                        VALUE: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } }

                    }

                },

                { kind: 'sep', gap: '16' },

                { kind: 'label', text: '── Advanced ──' },

                { kind: 'block', type: 'arduino_bluetooth_serial_begin' },

            ],

        },

        {

            kind: 'pictobloxCategory',

            name: 'Actuators',

            colour: COLORS.actuators,

            contents: [

                { kind: 'block', type: 'arduino_servo' },

                { kind: 'block', type: 'arduino_motor' },

                { kind: 'block', type: 'arduino_led' },

                { kind: 'block', type: 'arduino_relay' },

            ],

        },

        {

            kind: 'pictobloxCategory',

            name: 'Sensors',

            colour: COLORS.sensors,

            contents: [

                { kind: 'block', type: 'arduino_digital_sensor' },

                { kind: 'block', type: 'arduino_button' },

                { kind: 'block', type: 'arduino_ultrasonic' },

                { kind: 'block', type: 'arduino_dht_temp' },

                { kind: 'block', type: 'arduino_ldr' },

                { kind: 'block', type: 'arduino_potentiometer' },

                { kind: 'block', type: 'arduino_pir' },

            ],

        },

    ],

};

