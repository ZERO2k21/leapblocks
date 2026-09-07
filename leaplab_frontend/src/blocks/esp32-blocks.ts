/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import Blockly from '@blockly-runtime';

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

export const esp32Blocks = [
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
        output: ['Number', 'Boolean'],
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
            { type: 'field_angle', name: 'ANGLE', angle: 90 },
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
        message0: '🌡️ DHT %1 %2 on pin %3',
        args0: [
            { type: 'field_dropdown', name: 'SENSOR_TYPE', options: [['DHT11', '11'], ['DHT22', '22']] },
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
        output: ['Number', 'Boolean'],
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
        output: ['Number', 'Boolean'],
        colour: COLORS.sensors,
        tooltip: 'Check if motion is detected on ESP32',
        helpUrl: '',
    },
    {
        type: 'esp32_ir_obstacle',
        message0: '🚧 IR obstacle detected on pin %1?',
        args0: [
            { type: 'field_dropdown', name: 'PIN', options: ESP32_DIGITAL_PINS },
        ],
        inputsInline: true,
        output: ['Number', 'Boolean'],
        colour: COLORS.sensors,
        tooltip: 'Check if an obstacle is detected by the IR sensor on ESP32',
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
        output: ['Number', 'Boolean'],
        colour: COLORS.sensors,
        tooltip: 'Read status from various digital sensors on ESP32',
        helpUrl: '',
    },

    // ── WiFi Blocks ───────────────────────────────────────────────────────────
    {
        type: 'esp32_wifi_connect',
        message0: '📶 connect WiFi SSID %1 password %2',
        args0: [
            { type: 'input_value', name: 'SSID', check: 'String' },
            { type: 'input_value', name: 'PASSWORD', check: 'String' },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: '#E53935',
        tooltip: 'Connect ESP32 to WiFi network',
        helpUrl: '',
    },
    {
        type: 'esp32_wifi_connected',
        message0: '📶 WiFi connected?',
        args0: [],
        output: 'Boolean',
        colour: '#E53935',
        tooltip: 'Returns true if WiFi is connected',
        helpUrl: '',
    },
    {
        type: 'esp32_wifi_ip',
        message0: '📶 WiFi IP address',
        args0: [],
        output: 'String',
        colour: '#E53935',
        tooltip: 'Get the local IP address',
        helpUrl: '',
    },
    {
        type: 'esp32_wifi_disconnect',
        message0: '📶 disconnect WiFi',
        args0: [],
        previousStatement: null,
        nextStatement: null,
        colour: '#E53935',
        tooltip: 'Disconnect from WiFi',
        helpUrl: '',
    },

    // ── HTTP Blocks ───────────────────────────────────────────────────────────
    {
        type: 'esp32_http_get',
        message0: '🌐 HTTP GET %1',
        args0: [{ type: 'input_value', name: 'URL', check: 'String' }],
        inputsInline: true,
        output: 'String',
        colour: '#1565C0',
        tooltip: 'Send HTTP GET request and return response body',
        helpUrl: '',
    },
    {
        type: 'esp32_http_post',
        message0: '🌐 HTTP POST %1 body %2',
        args0: [
            { type: 'input_value', name: 'URL', check: 'String' },
            { type: 'input_value', name: 'BODY', check: 'String' },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: '#1565C0',
        tooltip: 'Send HTTP POST request with JSON body',
        helpUrl: '',
    },
    {
        type: 'esp32_http_status',
        message0: '🌐 HTTP GET status code %1',
        args0: [{ type: 'input_value', name: 'URL', check: 'String' }],
        inputsInline: true,
        output: 'Number',
        colour: '#1565C0',
        tooltip: 'Get HTTP response status code',
        helpUrl: '',
    },

    // ── MQTT Blocks ───────────────────────────────────────────────────────────
    {
        type: 'esp32_mqtt_connect',
        message0: '📡 MQTT connect broker %1 port %2 id %3',
        args0: [
            { type: 'input_value', name: 'BROKER', check: 'String' },
            { type: 'field_number', name: 'PORT', value: 1883 },
            { type: 'input_value', name: 'CLIENT_ID', check: 'String' },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: '#6A1B9A',
        tooltip: 'Connect to MQTT broker',
        helpUrl: '',
    },
    {
        type: 'esp32_mqtt_publish',
        message0: '📡 MQTT publish topic %1 message %2',
        args0: [
            { type: 'input_value', name: 'TOPIC', check: 'String' },
            { type: 'input_value', name: 'PAYLOAD', check: 'String' },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: '#6A1B9A',
        tooltip: 'Publish message to MQTT topic',
        helpUrl: '',
    },
    {
        type: 'esp32_mqtt_subscribe',
        message0: '📡 MQTT subscribe topic %1',
        args0: [{ type: 'input_value', name: 'TOPIC', check: 'String' }],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: '#6A1B9A',
        tooltip: 'Subscribe to MQTT topic',
        helpUrl: '',
    },
    {
        type: 'esp32_mqtt_loop',
        message0: '📡 MQTT loop',
        args0: [],
        previousStatement: null,
        nextStatement: null,
        colour: '#6A1B9A',
        tooltip: 'Keep MQTT connection alive (call in loop)',
        helpUrl: '',
    },
    {
        type: 'esp32_mqtt_connected',
        message0: '📡 MQTT connected?',
        args0: [],
        output: 'Boolean',
        colour: '#6A1B9A',
        tooltip: 'Returns true if MQTT client is connected',
        helpUrl: '',
    },

    // ── WebSocket Blocks ──────────────────────────────────────────────────────
    {
        type: 'esp32_ws_connect',
        message0: '🔌 WebSocket connect %1 port %2 path %3',
        args0: [
            { type: 'input_value', name: 'HOST', check: 'String' },
            { type: 'field_number', name: 'PORT', value: 80 },
            { type: 'input_value', name: 'PATH', check: 'String' },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: '#00838F',
        tooltip: 'Connect to a WebSocket server',
        helpUrl: '',
    },
    {
        type: 'esp32_ws_send',
        message0: '🔌 WebSocket send %1',
        args0: [{ type: 'input_value', name: 'MESSAGE', check: 'String' }],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: '#00838F',
        tooltip: 'Send a text message over WebSocket',
        helpUrl: '',
    },
    {
        type: 'esp32_ws_connected',
        message0: '🔌 WebSocket connected?',
        args0: [],
        output: 'Boolean',
        colour: '#00838F',
        tooltip: 'Returns true if WebSocket is connected',
        helpUrl: '',
    },
    {
        type: 'esp32_ws_loop',
        message0: '🔌 WebSocket loop',
        args0: [],
        previousStatement: null,
        nextStatement: null,
        colour: '#00838F',
        tooltip: 'Keep WebSocket connection alive (call in loop)',
        helpUrl: '',
    },
];

export const esp32Toolbox = {
    kind: 'categoryToolbox',
    contents: [
        {
            kind: 'leapbloxCategory',
            name: 'Events',
            colour: COLORS.events,
            contents: [
                { kind: 'block', type: 'esp32_setup' },
            ],
        },
        {
            kind: 'leapbloxCategory',
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
            kind: 'leapbloxCategory',
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
            kind: 'leapbloxCategory',
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
            kind: 'leapbloxCategory',
            name: 'Variables',
            colour: COLORS.variables,
            custom: 'LEAP_VARIABLES',
        },
        { kind: 'sep' },
        {
            kind: 'leapbloxCategory',
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
            kind: 'leapbloxCategory',
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
            kind: 'leapbloxCategory',
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
                { kind: 'block', type: 'esp32_ir_obstacle' },
            ],
        },
        { kind: 'sep' },
        {
            kind: 'leapbloxCategory',
            name: 'WiFi',
            colour: '#E53935',
            contents: [
                {
                    kind: 'block', type: 'esp32_wifi_connect',
                    inputs: {
                        SSID: { shadow: { type: 'arduino_text', fields: { TEXT: '' } } },
                        PASSWORD: { shadow: { type: 'arduino_text', fields: { TEXT: '' } } },
                    }
                },
                { kind: 'block', type: 'esp32_wifi_connected' },
                { kind: 'block', type: 'esp32_wifi_ip' },
                { kind: 'block', type: 'esp32_wifi_disconnect' },
            ],
        },
        {
            kind: 'leapbloxCategory',
            name: 'HTTP',
            colour: '#1565C0',
            contents: [
                {
                    kind: 'block', type: 'esp32_http_get',
                    inputs: { URL: { shadow: { type: 'arduino_text', fields: { TEXT: 'api.example.com' } } } }
                },
                {
                    kind: 'block', type: 'esp32_http_post',
                    inputs: {
                        URL: { shadow: { type: 'arduino_text', fields: { TEXT: 'api.example.com' } } },
                        BODY: { shadow: { type: 'arduino_text', fields: { TEXT: '{"data":1}' } } },
                    }
                },
                {
                    kind: 'block', type: 'esp32_http_status',
                    inputs: { URL: { shadow: { type: 'arduino_text', fields: { TEXT: 'api.example.com' } } } }
                },
            ],
        },
        {
            kind: 'leapbloxCategory',
            name: 'MQTT',
            colour: '#6A1B9A',
            contents: [
                {
                    kind: 'block', type: 'esp32_mqtt_connect',
                    inputs: {
                        BROKER: { shadow: { type: 'arduino_text', fields: { TEXT: 'hivemq.com' } } },
                        CLIENT_ID: { shadow: { type: 'arduino_text', fields: { TEXT: 'client1' } } },
                    }
                },
                {
                    kind: 'block', type: 'esp32_mqtt_publish',
                    inputs: {
                        TOPIC: { shadow: { type: 'arduino_text', fields: { TEXT: 'electra/data' } } },
                        PAYLOAD: { shadow: { type: 'arduino_text', fields: { TEXT: 'hello' } } },
                    }
                },
                {
                    kind: 'block', type: 'esp32_mqtt_subscribe',
                    inputs: { TOPIC: { shadow: { type: 'arduino_text', fields: { TEXT: 'electra/cmd' } } } }
                },
                { kind: 'block', type: 'esp32_mqtt_loop' },
                { kind: 'block', type: 'esp32_mqtt_connected' },
            ],
        },
        {
            kind: 'leapbloxCategory',
            name: 'WebSocket',
            colour: '#00838F',
            contents: [
                {
                    kind: 'block', type: 'esp32_ws_connect',
                    inputs: {
                        HOST: { shadow: { type: 'arduino_text', fields: { TEXT: 'websocket.org' } } },
                        PATH: { shadow: { type: 'arduino_text', fields: { TEXT: '/' } } },
                    }
                },
                {
                    kind: 'block', type: 'esp32_ws_send',
                    inputs: { MESSAGE: { shadow: { type: 'arduino_text', fields: { TEXT: 'hello' } } } }
                },
                { kind: 'block', type: 'esp32_ws_connected' },
                { kind: 'block', type: 'esp32_ws_loop' },
            ],
        },
    ],
};
