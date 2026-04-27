// extensions/index.ts - Central export for all extensions
// Extensions are initialized lazily when added via the Extension Library

export { ExtensionManager, extensionManager } from '../leapembed/server/extensions/extensionManager';
export type { ExtensionCategory, ExtensionBlock } from '../leapembed/server/extensions/extensionManager';

export {
    ObjectDetectionRuntime,
    objectDetectionExtension
} from '../leapembed/server/extensions/objectDetectionExtension';

export {
    MusicRuntime,
    musicExtension
} from '../leapembed/server/extensions/musicExtension';
