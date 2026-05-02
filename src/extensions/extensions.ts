/**
 * Backward-compatibility shim.
 * All extension code now lives in src/leapExtensions/.
 * This file re-exports so existing imports keep working.
 */

export { ExtensionManager, extensionManager } from '../leapExtensions/server/extensionManager';
export type { ExtensionCategory, ExtensionBlock } from '../leapExtensions/shared/extensionTypes';

export { ObjectDetectionRuntime, objectDetectionExtension } from '../leapExtensions/objectDetection/objectDetection';
export { MusicRuntime, musicExtension } from '../leapExtensions/music/music';
