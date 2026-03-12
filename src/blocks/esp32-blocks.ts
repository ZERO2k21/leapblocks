import * as Blockly from 'blockly';
import { common } from 'blockly';

const COLORS = {
    control: '#F59E0B',
    operators: '#22C55E',
    arduino: '#4C97FF', // Match the blue from the screenshot
    esp32: '#4C97FF', // Custom blue for ESP32 category
    sensors: '#06B6D4',
    actuators: '#10B981',
    variables: '#F97316',
    events: '#FACC15',
    serial: '#8B5CF6',
};

// ESP32 common pins
const ESP32_DIGITAL_PINS: [string, string][] = [
    ['2', '2'], ['4', '4'], ['5', '5'], ['12', '12'], ['13', '13'],
    ['14', '14'], ['15', '15'], ['18', '18'], ['19', '19'], ['21', '21'],
    ['22', '22'], ['23', '23'], ['25', '25'], ['26', '26'], ['27', '27'],
    ['32', '32'], ['33', '33']
];

const ESP32_ANALOG_PINS: [string, string][] = [
    ['32', '32'], ['33', '33'], ['34', '34'], ['35', '35'], ['36', '36'], ['39', '39']
];

const ESP32_PWM_PINS = ESP32_DIGITAL_PINS;

const ESP32_TOUCH_PINS: [string, string][] = [
    ['T0', '4'], ['T1', '0'], ['T2', '2'], ['T3', '15'], ['T4', '13'],
    ['T5', '12'], ['T6', '14'], ['T7', '27'], ['T8', '33'], ['T9', '32']
];

const ESP32_ICON = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="2" fill="%235A6169"/><rect x="6" y="7" width="12" height="10" fill="%23757B82"/><path d="M 2 5 L 2 19" stroke="%23F1C40F" stroke-width="3" stroke-dasharray="2 2"/><path d="M 8 10 A 4 4 0 0 1 16 10 M 10 12 A 2 2 0 0 1 14 12 M 12 14 v 0.1" stroke="%23FFF" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`;

export const esp32Blocks = common.createBlockDefinitionsFromJsonArray([
    // Core ESP32 Category Blocks
    {
        type: 'esp32_setup',
        message0: '%1 when ESP32 starts up',
        args0: [{ type: 'field_image', src: ESP32_ICON, width: 24, height: 24, alt: '*' }],
        nextStatement: null,
        colour: COLORS.esp32,
        tooltip: 'Runs once when the ESP32 starts',
        helpUrl: '',
    },
    {
        type: 'esp32_digital_read',
        message0: '%1 read status of digital pin %2',
        args0: [
            { type: 'field_image', src: ESP32_ICON, width: 24, height: 24, alt: '*' },
            { type: 'field_dropdown', name: 'PIN', options: ESP32_DIGITAL_PINS }
        ],
        output: 'Boolean',
        colour: COLORS.esp32,
        tooltip: 'Read digital value from ESP32 pin',
        helpUrl: '',
    },
    {
        type: 'esp32_analog_read',
        message0: '%1 read analog pin %2',
        args0: [
            { type: 'field_image', src: ESP32_ICON, width: 24, height: 24, alt: '*' },
            { type: 'field_dropdown', name: 'PIN', options: ESP32_ANALOG_PINS }
        ],
        output: 'Number',
        colour: COLORS.esp32,
        tooltip: 'Read analog value from ESP32 pin (0-4095)',
        helpUrl: '',
    },
    {
        type: 'esp32_digital_write',
        message0: '%1 set digital pin %2 output as %3',
        args0: [
            { type: 'field_image', src: ESP32_ICON, width: 24, height: 24, alt: '*' },
            { type: 'field_dropdown', name: 'PIN', options: ESP32_DIGITAL_PINS },
            { type: 'field_dropdown', name: 'VALUE', options: [['HIGH', 'HIGH'], ['LOW', 'LOW']] },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.esp32,
        tooltip: 'Set digital pin HIGH or LOW on ESP32',
        helpUrl: '',
    },
    {
        type: 'esp32_pwm_write',
        message0: '%1 set PWM pin %2 output as %3',
        args0: [
            { type: 'field_image', src: ESP32_ICON, width: 24, height: 24, alt: '*' },
            { type: 'field_dropdown', name: 'PIN', options: ESP32_PWM_PINS },
            { type: 'input_value', name: 'VALUE', check: 'Number' },
        ],
        previousStatement: null,
        nextStatement: null,
        inputsInline: true,
        colour: COLORS.esp32,
        tooltip: 'Set PWM value (0-255) on ESP32 pin',
        helpUrl: '',
    },
    {
        type: 'esp32_touch_read',
        message0: '%1 get value of touch pin %2',
        args0: [
            { type: 'field_image', src: ESP32_ICON, width: 24, height: 24, alt: '*' },
            { type: 'field_dropdown', name: 'PIN', options: ESP32_TOUCH_PINS }
        ],
        output: 'Number',
        colour: COLORS.esp32,
        tooltip: 'Read touch sensor value on ESP32',
        helpUrl: '',
    },
    {
        type: 'esp32_hall_read',
        message0: '%1 get hall sensor value',
        args0: [
            { type: 'field_image', src: ESP32_ICON, width: 24, height: 24, alt: '*' }
        ],
        output: 'Number',
        colour: COLORS.esp32,
        tooltip: 'Read internal hall sensor on ESP32',
        helpUrl: '',
    },
    {
        type: 'esp32_mac_address',
        message0: '%1 get bluetooth Mac Address',
        args0: [
            { type: 'field_image', src: ESP32_ICON, width: 24, height: 24, alt: '*' }
        ],
        output: 'String',
        colour: COLORS.esp32,
        tooltip: 'Get ESP32 Bluetooth MAC Address',
        helpUrl: '',
    },
    {
        type: 'esp32_map',
        message0: '%1 map %2 from %3 ~ %4 to %5 ~ %6',
        args0: [
            { type: 'field_image', src: ESP32_ICON, width: 24, height: 24, alt: '*' },
            { type: 'input_value', name: 'VALUE', check: 'Number' },
            { type: 'input_value', name: 'IN_MIN', check: 'Number' },
            { type: 'input_value', name: 'IN_MAX', check: 'Number' },
            { type: 'input_value', name: 'OUT_MIN', check: 'Number' },
            { type: 'input_value', name: 'OUT_MAX', check: 'Number' },
        ],
        inputsInline: true,
        output: 'Number',
        colour: COLORS.esp32,
        tooltip: 'Map value from one range to another',
        helpUrl: '',
    },

    // Actuator / Sensor compatibility blocks omitted for brevity, but they stay in toolboxes
    {
        type: 'esp32_tone',
        message0: '🔊 play tone on pin %1 frequency %2 Hz',
        args0: [
            { type: 'field_dropdown', name: 'PIN', options: ESP32_PWM_PINS },
            { type: 'field_number', name: 'FREQ', value: 440, min: 20, max: 20000 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.arduino,
        tooltip: 'Play a tone on ESP32',
        helpUrl: '',
    },
    {
        type: 'esp32_notone',
        message0: '🔇 stop tone on pin %1',
        args0: [
            { type: 'field_dropdown', name: 'PIN', options: ESP32_PWM_PINS },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.arduino,
        tooltip: 'Stop playing tone on ESP32',
        helpUrl: '',
    },
    {
        type: 'esp32_servo',
        message0: '🎚️ set servo on pin %1 to %2 °',
        args0: [
            { type: 'field_dropdown', name: 'PIN', options: ESP32_PWM_PINS },
            { type: 'field_number', name: 'ANGLE', value: 90, min: 0, max: 180 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.actuators,
        tooltip: 'Set servo angle (0-180) on ESP32',
        helpUrl: '',
    },
    {
        type: 'esp32_led',
        message0: '💡 LED on pin %1 brightness %2',
        args0: [
            { type: 'field_dropdown', name: 'PIN', options: ESP32_PWM_PINS },
            { type: 'field_number', name: 'BRIGHTNESS', value: 255, min: 0, max: 255 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.actuators,
        tooltip: 'Set LED brightness on ESP32',
        helpUrl: '',
    },
    {
        type: 'esp32_relay',
        message0: '🔌 relay on pin %1 set %2',
        args0: [
            { type: 'field_dropdown', name: 'PIN', options: ESP32_DIGITAL_PINS },
            { type: 'field_dropdown', name: 'STATE', options: [['ON', 'HIGH'], ['OFF', 'LOW']] },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: COLORS.actuators,
        tooltip: 'Control relay on ESP32',
        helpUrl: '',
    },
    {
        type: 'esp32_ultrasonic',
        message0: '📏 ultrasonic distance (cm) trig %1 echo %2',
        args0: [
            { type: 'field_dropdown', name: 'TRIG', options: ESP32_DIGITAL_PINS },
            { type: 'field_dropdown', name: 'ECHO', options: ESP32_DIGITAL_PINS },
        ],
        inputsInline: true,
        output: 'Number',
        colour: COLORS.sensors,
        tooltip: 'Read ultrasonic distance in cm on ESP32',
        helpUrl: '',
    },
    {
        type: 'esp32_dht_temp',
        message0: '🌡️ DHT %1 on pin %2',
        args0: [
            { type: 'field_dropdown', name: 'TYPE', options: [['temperature °C', 'temperature'], ['humidity %', 'humidity']] },
            { type: 'field_dropdown', name: 'PIN', options: ESP32_DIGITAL_PINS },
        ],
        inputsInline: true,
        output: 'Number',
        colour: COLORS.sensors,
        tooltip: 'Read DHT temperature or humidity on ESP32',
        helpUrl: '',
    },
    {
        type: 'esp32_button',
        message0: '🔘 button on pin %1 pressed?',
        args0: [
            { type: 'field_dropdown', name: 'PIN', options: ESP32_DIGITAL_PINS },
        ],
        inputsInline: true,
        output: 'Boolean',
        colour: COLORS.sensors,
        tooltip: 'Check if button is pressed on ESP32',
        helpUrl: '',
    },
    {
        type: 'esp32_ldr',
        message0: '☀️ light sensor on %1',
        args0: [{ type: 'field_dropdown', name: 'PIN', options: ESP32_ANALOG_PINS }],
        inputsInline: true,
        output: 'Number',
        colour: COLORS.sensors,
        tooltip: 'Read light level on ESP32',
        helpUrl: '',
    },
    {
        type: 'esp32_potentiometer',
        message0: '🎛️ potentiometer on %1',
        args0: [{ type: 'field_dropdown', name: 'PIN', options: ESP32_ANALOG_PINS }],
        inputsInline: true,
        output: 'Number',
        colour: COLORS.sensors,
        tooltip: 'Read potentiometer value on ESP32',
        helpUrl: '',
    },
    {
        type: 'esp32_pir',
        message0: '🚶 motion detected on pin %1?',
        args0: [
            { type: 'field_dropdown', name: 'PIN', options: ESP32_DIGITAL_PINS },
        ],
        inputsInline: true,
        output: 'Boolean',
        colour: COLORS.sensors,
        tooltip: 'Check if motion is detected on ESP32',
        helpUrl: '',
    },
    {
        type: 'esp32_digital_sensor',
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
            { type: 'field_dropdown', name: 'PIN', options: ESP32_DIGITAL_PINS }
        ],
        inputsInline: true,
        output: 'Boolean',
        colour: COLORS.sensors,
        tooltip: 'Read status from various digital sensors on ESP32',
        helpUrl: '',
    }
]);

export const esp32Toolbox = {
    kind: 'categoryToolbox',
    contents: [
        {
            kind: 'pictobloxCategory',
            name: 'Events',
            colour: COLORS.events,
            contents: [
                { kind: 'block', type: 'esp32_setup' },
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
            name: 'ESP32',
            colour: COLORS.esp32,
            contents: [
                { kind: 'block', type: 'esp32_setup' },
                { kind: 'block', type: 'esp32_digital_read' },
                { kind: 'block', type: 'esp32_analog_read' },
                { kind: 'block', type: 'esp32_digital_write' },
                {
                    kind: 'block',
                    type: 'esp32_pwm_write',
                    inputs: {
                        VALUE: { shadow: { type: 'arduino_number', fields: { NUM: 255 } } }
                    }
                },
                { kind: 'block', type: 'esp32_touch_read' },
                { kind: 'block', type: 'esp32_hall_read' },
                { kind: 'block', type: 'esp32_mac_address' },
                {
                    kind: 'block',
                    type: 'esp32_map',
                    inputs: {
                        VALUE: { shadow: { type: 'arduino_number', fields: { NUM: 50 } } },
                        IN_MIN: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } },
                        IN_MAX: { shadow: { type: 'arduino_number', fields: { NUM: 255 } } },
                        OUT_MIN: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } },
                        OUT_MAX: { shadow: { type: 'arduino_number', fields: { NUM: 1023 } } },
                    }
                },
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
                    inputs: { A: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } }, B: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } } }
                },
                {
                    kind: 'block',
                    type: 'arduino_math_subtract',
                    inputs: { A: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } }, B: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } } }
                },
                {
                    kind: 'block',
                    type: 'arduino_math_multiply',
                    inputs: { A: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } }, B: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } } }
                },
                {
                    kind: 'block',
                    type: 'arduino_math_divide',
                    inputs: { A: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } }, B: { shadow: { type: 'arduino_number', fields: { NUM: 1 } } } }
                },
                {
                    kind: 'block',
                    type: 'arduino_mod',
                    inputs: { A: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } }, B: { shadow: { type: 'arduino_number', fields: { NUM: 1 } } } }
                },
                { kind: 'label', text: '── Comparison ──' },
                {
                    kind: 'block',
                    type: 'arduino_compare_gt',
                    inputs: { A: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } }, B: { shadow: { type: 'arduino_number', fields: { NUM: 50 } } } }
                },
                {
                    kind: 'block',
                    type: 'arduino_compare_lt',
                    inputs: { A: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } }, B: { shadow: { type: 'arduino_number', fields: { NUM: 50 } } } }
                },
                {
                    kind: 'block',
                    type: 'arduino_compare_eq',
                    inputs: { A: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } }, B: { shadow: { type: 'arduino_number', fields: { NUM: 50 } } } }
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
        { kind: 'sep' },
        {
            kind: 'pictobloxCategory',
            name: 'Communication',
            colour: COLORS.serial,
            contents: [
                { kind: 'block', type: 'arduino_serial_begin' },
                {
                    kind: 'block', type: 'arduino_serial_multi_write',
                    inputs: { VALUE: { shadow: { type: 'arduino_text', fields: { TEXT: 'Hello World' } } } }
                },
                { kind: 'block', type: 'arduino_serial_available' },
                { kind: 'block', type: 'arduino_serial_read' },
                { kind: 'sep', gap: '16' },
                { kind: 'label', text: '── Details ──' },
                { kind: 'block', type: 'arduino_serial_print' },
                { kind: 'block', type: 'arduino_serial_println' },
                {
                    kind: 'block', type: 'arduino_serial_print_labeled',
                    inputs: {
                        LABEL: { shadow: { type: 'arduino_text', fields: { TEXT: 'value: ' } } },
                        VALUE: { shadow: { type: 'arduino_number', fields: { NUM: 0 } } }
                    }
                },
            ],
        },
        {
            kind: 'pictobloxCategory',
            name: 'Actuators',
            colour: COLORS.actuators,
            contents: [
                { kind: 'block', type: 'esp32_servo' },
                { kind: 'block', type: 'arduino_motor' },
                { kind: 'block', type: 'esp32_led' },
                { kind: 'block', type: 'esp32_relay' },
            ],
        },
        {
            kind: 'pictobloxCategory',
            name: 'Sensors',
            colour: COLORS.sensors,
            contents: [
                { kind: 'block', type: 'esp32_digital_sensor' },
                { kind: 'block', type: 'esp32_button' },
                { kind: 'block', type: 'esp32_ultrasonic' },
                { kind: 'block', type: 'esp32_dht_temp' },
                { kind: 'block', type: 'esp32_ldr' },
                { kind: 'block', type: 'esp32_potentiometer' },
                { kind: 'block', type: 'esp32_pir' },
            ],
        },
    ],
};
