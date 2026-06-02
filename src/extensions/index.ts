// extensions/index.ts - Central export for all extensions
// Extensions are initialized lazily when added via the Extension Library

export { ExtensionManager, extensionManager } from './ExtensionManager';
export type { ExtensionCategory, ExtensionBlock } from './ExtensionManager';

export {
    ObjectDetectionRuntime,
    objectDetectionExtension
} from './ObjectDetectionExtension';

export {
    MusicRuntime,
    musicExtension
} from './MusicExtension';

export {
    VideoPlayerRuntime,
    videoPlayerExtension
} from './VideoPlayer';
