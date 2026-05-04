/**
 * Arduino SD Library Bridge
 * Maps Arduino SD.h API to SDCardSimulator
 */

import { sdCardSimulator, VirtualFile } from './SDCardSimulator';

// Arduino SD constants
export const FILE_READ = 0;
export const FILE_WRITE = 1;
export const FILE_APPEND = 2;

// SD object that mimics Arduino SD library
export const SD = {
    begin: (csPin: number): boolean => {
        return sdCardSimulator.begin(csPin);
    },

    open: (path: string, mode?: number): VirtualFile | null => {
        let modeStr = 'r';
        if (mode === FILE_WRITE) {
            modeStr = 'w';
        } else if (mode === FILE_APPEND) {
            modeStr = 'a';
        }
        return sdCardSimulator.open(path, modeStr);
    },

    exists: (path: string): boolean => {
        return sdCardSimulator.exists(path);
    },

    remove: (path: string): boolean => {
        return sdCardSimulator.remove(path);
    },

    mkdir: (path: string): boolean => {
        return sdCardSimulator.mkdir(path);
    },

    rmdir: (path: string): boolean => {
        return sdCardSimulator.rmdir(path);
    },
};

// File type alias for Arduino compatibility
export type File = VirtualFile;

// Export for use in Arduino runtime
export { sdCardSimulator, VirtualFile };
