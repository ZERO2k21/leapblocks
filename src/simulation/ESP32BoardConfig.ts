/**
 * ESP32 Board Configuration
 * 
 * Defines pin mappings and board configurations for ESP32 boards
 * used by the QEMU simulation path.
 */

export interface ESP32PinInfo {
    gpioNum: number;
    adcChannel?: number;
    isI2CSDA?: boolean;
    isI2CSCL?: boolean;
}

// ESP32 DevKit V1 pin mapping
export const ESP32_BOARD_CONFIG = {
    gpio: {
        // Digital pins
        'D0': 0, 'D2': 2, 'D4': 4, 'D5': 5,
        'D12': 12, 'D13': 13, 'D14': 14, 'D15': 15,
        'D18': 18, 'D19': 19, 'D21': 21, 'D22': 22, 'D23': 23,
        'RX2': 16, 'TX2': 17, 'RX0': 3, 'TX0': 1,

        // Analog pins (ADC-capable)
        'A0': 36, 'VP': 36,
        'A1': 39, 'VN': 39,
        'A2': 34, 'D34': 34,
        'A3': 35, 'D35': 35,
        'A4': 32, 'D32': 32,
        'A5': 33, 'D33': 33,
        'A6': 25, 'D25': 25,
        'A7': 26, 'D26': 26,
        'D27': 27,

        // Raw GPIO numbers
        '0': 0, '2': 2, '4': 4, '5': 5,
        '12': 12, '13': 13, '14': 14, '15': 15,
        '16': 16, '17': 17, '18': 18, '19': 19,
        '21': 21, '22': 22, '23': 23, '25': 25,
        '26': 26, '27': 27, '32': 32, '33': 33,
        '34': 34, '35': 35, '36': 36, '39': 39,
    } as Record<string, number>,

    adc: {
        // ADC channel mapping
        'A0': 0, 'VP': 0, '36': 0,
        'A1': 1, 'VN': 1, '39': 1,
        'A2': 2, 'D34': 2, '34': 2,
        'A3': 3, 'D35': 3, '35': 3,
        'A4': 4, 'D32': 4, '32': 4,
        'A5': 5, 'D33': 5, '33': 5,
        'A6': 6, 'D25': 6, '25': 6,
        'A7': 7, 'D26': 7, '26': 7,
        'D27': 7, '27': 7,
    } as Record<string, number>,

    i2c: {
        sda: 21,
        scl: 22,
    },
};

// Set of ESP32 board IDs that use QEMU simulation
export const ESP32_BOARDS = new Set([
    'esp32:esp32:esp32',
    'esp32:esp32:esp32s2',
    'esp32:esp32:esp32s3',
    // Note: esp32c3 uses RISC-V simulation, not QEMU
]);

// ESP32-C3 specific configuration (for reference)
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