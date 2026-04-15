/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
// ═══════════════════════════════════════════════════════════════════════════
// FIRMWARE PROTOCOL - Command/Response protocol for real-time hardware control
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Command format: <CMD><ARGS>\n
 * Response format: <OK|ERR>:<DATA>\n
 * 
 * This protocol is designed for simple real-time communication between
 * the Stage mode and Arduino. Commands are single-letter for speed.
 */

// Command bytes
export const COMMANDS = {
    // Core commands
    PING: 'P',           // P -> OK

    // Digital I/O
    SET_DIGITAL: 'D',    // D<pin>:<0|1> -> OK (e.g., D13:1 sets pin 13 HIGH)
    READ_DIGITAL: 'R',   // R<pin> -> OK:<0|1> (e.g., R13 -> OK:1)

    // Analog I/O
    READ_ANALOG: 'A',    // A<pin> -> OK:<value> (e.g., A0 -> OK:512)
    SET_PWM: 'W',        // W<pin>:<value> -> OK (e.g., W9:128)

    // Servo control
    SET_SERVO: 'S',      // S<pin>:<angle> -> OK (e.g., S9:90)

    // Motor control (for motor shields)
    SET_MOTOR: 'M',      // M<id>:<speed> -> OK (e.g., M1:255, M1:-255 for reverse)
    STOP_MOTORS: 'X',    // X -> OK (stop all motors)

    // LED control
    SET_LED: 'L',        // L<pin>:<r>,<g>,<b> -> OK (for RGB LEDs)

    // Buzzer/Sound
    TONE: 'T',           // T<pin>:<freq>,<duration> -> OK (e.g., T8:440,500)
    NOTONE: 'N',         // N<pin> -> OK

    // Advanced Sensors
    READ_ULTRASONIC: 'U', // U<trig>:<echo> -> OK:<distance>
} as const;

export type CommandType = typeof COMMANDS[keyof typeof COMMANDS];

// Response codes
export const RESPONSES = {
    OK: 'OK',
    ERROR: 'ERR',
} as const;

/**
 * Parse a response from the firmware
 */
export interface FirmwareResponse {
    success: boolean;
    data?: string;
    error?: string;
}

export function parseResponse(raw: string): FirmwareResponse {
    const trimmed = raw.trim();

    if (trimmed.startsWith('OK')) {
        const data = trimmed.includes(':') ? trimmed.split(':')[1] : undefined;
        return { success: true, data };
    }

    if (trimmed.startsWith('ERR')) {
        const error = trimmed.includes(':') ? trimmed.split(':')[1] : 'Unknown error';
        return { success: false, error };
    }

    // Unknown response format
    return { success: false, error: `Unknown response: ${trimmed}` };
}

/**
 * Build a command string
 */
export function buildCommand(cmd: CommandType, ...args: (string | number)[]): string {
    if (args.length === 0) {
        return cmd + '\n';
    }
    return cmd + args.join(':') + '\n';
}

// Pin mode constants (for reference)
export const PIN_MODE = {
    INPUT: 0,
    OUTPUT: 1,
    INPUT_PULLUP: 2,
} as const;

// Built-in LED pin for most Arduino boards
export const BUILTIN_LED = 13;
