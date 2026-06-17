/**
 * ESP32-C3 Board Configuration
 * 
 * Defines pin mappings and board configurations for ESP32-C3 boards
 * used by the RISC-V simulation path.
 */

export interface ESP32PinInfo {
    gpioNum: number;
    avrPin: string;
    adcChannel?: number;
    isI2CSDA?: boolean;
    isI2CSCL?: boolean;
}

// ESP32-C3 specific configuration
export const ESP32_C3_BOARD_CONFIG = {
    gpio: {
        // ESP32-C3 has fewer pins than ESP32
        'D0': 0, 'D1': 1, 'D2': 2, 'D3': 3, 'D4': 4, 'D5': 5,
        'D6': 6, 'D7': 7, 'D8': 8, 'D9': 9, 'D10': 10,
        'D18': 18, 'D19': 19, 'D20': 20, 'D21': 21,

        // ADC-capable pins (ADC1 only on ESP32-C3)
        'A0': 0, 'A1': 1, 'A2': 2, 'A3': 3, 'A4': 4,

        // Raw GPIO numbers
        '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
        '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        '18': 18, '19': 19, '20': 20, '21': 21,
    } as Record<string, number>,

    adc: {
        // ESP32-C3 ADC1 channels (GPIO0-4)
        'A0': 0, '0': 0,
        'A1': 1, '1': 1,
        'A2': 2, '2': 2,
        'A3': 3, '3': 3,
        'A4': 4, '4': 4,
    } as Record<string, number>,

    i2c: {
        sda: 8,  // Default I2C SDA for ESP32-C3
        scl: 9,  // Default I2C SCL for ESP32-C3
    },
};

// Only ESP32-C3 is supported (RISC-V simulation)
export const ESP32_C3_BOARDS = new Set([
    'esp32:esp32c3'
]);

// ESP32-C3 specific configuration (replaces old ESP32_BOARD_CONFIG)
export const ESP32_BOARD_CONFIG = ESP32_C3_BOARD_CONFIG;

// Only ESP32-C3 is supported (RISC-V simulation) - replaces old ESP32_BOARDS
export const ESP32_BOARDS = ESP32_C3_BOARDS;