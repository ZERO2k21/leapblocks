/**
 * Driver path registry for LeapEmbed board drivers.
 * Provides resolved paths to driver files for Arduino and ESP32 boards.
 */
import path from 'path';
import { app } from 'electron';

/**
 * Get the base path for drivers.
 * In production (packaged), drivers are in extraResources.
 * In development, they're relative to the project root.
 */
function getDriversBasePath(): string {
    if (process.env.NODE_ENV === 'production' || app?.isPackaged) {
        return path.join(process.resourcesPath, 'drivers');
    }
    return path.join(__dirname, '..', '..', '..', 'src', 'leapembed', 'drivers');
}

export const DRIVER_PATHS = {
    arduino: {
        cp210x: {
            inf: () => path.join(getDriversBasePath(), 'arduino', 'cp210x', 'silabser.inf'),
            dir: () => path.join(getDriversBasePath(), 'arduino', 'cp210x'),
        },
    },
    esp32: {
        dir: () => path.join(getDriversBasePath(), 'esp32'),
    },
};

/**
 * Board-to-driver mapping.
 * Maps board IDs to their required driver info.
 */
export const BOARD_DRIVERS: Record<string, { name: string; chip: string; driverPath: () => string }> = {
    arduino_uno: {
        name: 'Arduino Uno',
        chip: 'CP210x / CH340',
        driverPath: DRIVER_PATHS.arduino.cp210x.dir,
    },
    arduino_nano: {
        name: 'Arduino Nano',
        chip: 'CP210x / CH340',
        driverPath: DRIVER_PATHS.arduino.cp210x.dir,
    },
    arduino_mega: {
        name: 'Arduino Mega',
        chip: 'CP210x / CH340',
        driverPath: DRIVER_PATHS.arduino.cp210x.dir,
    },
    esp32: {
        name: 'ESP32',
        chip: 'CP210x / CH340',
        driverPath: DRIVER_PATHS.esp32.dir,
    },
};
