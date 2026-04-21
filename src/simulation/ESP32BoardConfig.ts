/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * ESP32 board configuration — pure data, no simulator library dependencies.
 */

// ── Pin metadata type ─────────────────────────────────────────────────────────
export type ESP32PinInfo = {
    /** GPIO number on the ESP32 silicon */
    gpioNum: number;
    /** ADC1 channel index (0–9). Absent if pin has no ADC1 capability. */
    adcChannel?: number;
    /** True if this pin is the default I²C SDA line */
    isI2CSDA?: boolean;
    /** True if this pin is the default I²C SCL line */
    isI2CSCL?: boolean;
};

// ── Board configuration type ──────────────────────────────────────────────────
export type ESP32BoardConfig = {
    /** Short machine identifier */
    id: string;
    /** Human-readable board name */
    name: string;
    /** arduino-cli fully-qualified board name */
    fqbn: string;
    /** CPU frequency in Hz */
    frequency: number;
    /** Flash size in bytes */
    flashSize: number;
    /** SRAM size in bytes */
    sramSize: number;
    /**
     * Arduino pin label → GPIO number mapping.
     * Only pins exposed on the DevKit V1 header are listed.
     */
    gpio: Record<string, number>;
    /**
     * Arduino pin label → ADC1 channel index.
     * ADC2 pins (GPIO 0, 2, 4, 12–15) are intentionally omitted —
     * ADC2 is shared with the Wi-Fi radio and unreliable when Wi-Fi is active.
     */
    adc: Record<string, number>;
    /** Default I²C bus pin assignment */
    i2c: { sda: number; scl: number };
    /** Default SPI bus pin assignment */
    spi: { mosi: number; miso: number; sck: number; ss: number };
    /**
     * UART port assignments.
     * Index 0 = UART0 (Serial / USB console)
     * Index 1 = UART1
     * Index 2 = UART2
     */
    uart: Array<{ tx: number; rx: number }>;
};

// ── ESP32 DevKit V1 ───────────────────────────────────────────────────────────
export const ESP32_BOARD_CONFIG: ESP32BoardConfig = {
    id: 'esp32-devkit',
    name: 'ESP32 DevKit V1',
    fqbn: 'esp32:esp32:esp32',
    frequency: 240_000_000,          // 240 MHz dual-core Xtensa LX6
    flashSize: 4 * 1024 * 1024,      // 4 MB
    sramSize: 520 * 1024,           // 520 KB (internal SRAM)

    // ── GPIO map: Arduino label → GPIO number ──────────────────────────────
    // Pins 6–11 (connected to internal flash SPI) are excluded.
    // Pins 34, 35, 36, 39 are input-only and have no internal pull-up/down.
    gpio: {
        '0': 0,
        '1': 1,
        '2': 2,
        '3': 3,
        '4': 4,
        '5': 5,
        '12': 12,
        '13': 13,
        '14': 14,
        '15': 15,
        '16': 16,
        '17': 17,
        '18': 18,
        '19': 19,
        '21': 21,
        '22': 22,
        '23': 23,
        '25': 25,
        '26': 26,
        '27': 27,
        '32': 32,
        '33': 33,
        '34': 34,
        '35': 35,
        '36': 36,
        '39': 39,
    },

    // ── ADC1 map: Arduino pin label → ADC1 channel index ───────────────────
    // ADC1 channels only — safe to use alongside Wi-Fi.
    // ADC2 (GPIO 0, 2, 4, 12–15) is omitted due to Wi-Fi radio conflict.
    //
    // ADC1 channel assignments (from ESP32 TRM):
    //   CH0 → GPIO36 (VP)   CH1 → GPIO37 (internal, not on header)
    //   CH2 → GPIO38 (internal, not on header)
    //   CH3 → GPIO39 (VN)   CH4 → GPIO32
    //   CH5 → GPIO33        CH6 → GPIO34
    //   CH7 → GPIO35        CH8 → GPIO25
    //   CH9 → GPIO26
    adc: {
        '36': 0,   // ADC1_CH0 — GPIO36 / VP  (input-only)
        '39': 3,   // ADC1_CH3 — GPIO39 / VN  (input-only)
        '34': 6,   // ADC1_CH6 — GPIO34       (input-only)
        '35': 7,   // ADC1_CH7 — GPIO35       (input-only)
        '32': 4,   // ADC1_CH4 — GPIO32
        '33': 5,   // ADC1_CH5 — GPIO33
        '25': 8,   // ADC1_CH8 — GPIO25
        '26': 9,   // ADC1_CH9 — GPIO26
    },

    // ── I²C default bus ────────────────────────────────────────────────────
    i2c: { sda: 21, scl: 22 },

    // ── SPI default bus (VSPI) ─────────────────────────────────────────────
    spi: { mosi: 23, miso: 19, sck: 18, ss: 5 },

    // ── UART ports ─────────────────────────────────────────────────────────
    uart: [
        { tx: 1, rx: 3 },   // UART0 — Serial (USB console, shared with GPIO1/3)
        { tx: 17, rx: 16 },   // UART1
        { tx: 25, rx: 26 },   // UART2
    ],
};

// ── Supported FQBN set ────────────────────────────────────────────────────────
// Used by compile/upload routing and SimulationRunner board detection.
// Includes both FQBN-style IDs (used by arduino-cli) and short store board IDs
// (used by the canvas node type → store.board mapping).
export const ESP32_BOARDS = new Set<string>([
    // FQBN-style (arduino-cli) — platform ID is esp32:esp32, not espressif:esp32
    'esp32:esp32:esp32',
    'esp32:esp32:esp32s3',
    // Short store board IDs (set by BOARD_NODE_TO_BOARD_ID in useForgeStore)
    'esp32',
    'esp32-devkit-v1',
    'esp32-s2',
    'esp32-s3',
    'esp32-c3',
]);

// ── Convenience lookup: GPIO number → ESP32PinInfo ───────────────────────────
// Derived from ESP32_BOARD_CONFIG at module load time.
// Useful for the simulation engine to quickly resolve pin capabilities.
const _adcByGpio = new Map<number, number>(
    Object.entries(ESP32_BOARD_CONFIG.adc).map(([label, ch]) => [
        ESP32_BOARD_CONFIG.gpio[label] ?? parseInt(label, 10),
        ch,
    ])
);

export function getPinInfo(gpioNum: number): ESP32PinInfo {
    const info: ESP32PinInfo = { gpioNum };

    const adcCh = _adcByGpio.get(gpioNum);
    if (adcCh !== undefined) info.adcChannel = adcCh;

    if (gpioNum === ESP32_BOARD_CONFIG.i2c.sda) info.isI2CSDA = true;
    if (gpioNum === ESP32_BOARD_CONFIG.i2c.scl) info.isI2CSCL = true;

    return info;
}
