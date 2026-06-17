// extensions/index.ts - Central export for all extensions
// Extensions are initialized lazily when added via the Extension Library

export { ExtensionManager, extensionManager } from './ExtensionManager';
export type { ExtensionCategory, ExtensionBlock } from './ExtensionManager';

// Core extension infrastructure
export { Extension, blocksToBlocklyDefs } from './core/Extension';
export { ExtensionRegistry, extensionRegistry } from './core/ExtensionRegistry';

// Extension definitions (new folder pattern)
export { VideoPlayerExtension, videoPlayerExtension, VideoPlayerRuntime } from './video-player';
export { ObjectDetectionRuntime } from './object-detection/runtime';
export { MusicRuntime } from './music/runtime';
export { VideoSensingRuntime } from './video-sensing/runtime';
export { QRScannerRuntime } from './qr-scanner/runtime';
export { PhysicsEngineRuntime } from './physics-engine/runtime';
export { MakeyMakeyRuntime } from './makey-makey/runtime';
export { TTSRuntime } from './text-to-speech/runtime';
export { SpeechRecognitionRuntime } from './speech-recognition/runtime';
export { OCRRuntime } from './text-recognition/runtime';
export { WeatherRuntime } from './weather-data/runtime';
export { TranslateRuntime } from './translate/runtime';
export { DataLoggerRuntime } from './data-logger/runtime';
export { VisionRuntime } from './computer-vision/runtime';
export { FaceDetectionRuntimeSingleton as FaceDetectionRuntime } from './face-detection/runtime';
export { HandPoseRuntimeSingleton as HandPoseRuntimeFolder } from './hand-pose/runtime';
export { HumanBodyRuntimeSingleton as HumanBodyRuntimeFolder } from './human-body/runtime';
export { MLMachineLearningRuntimeSingleton as MLMachineLearningRuntimeFolder } from './ml-machine-learning/runtime';

// Legacy exports (backward compatible)
export {
    ObjectDetectionRuntime as ObjectDetectionRuntimeLegacy,
} from './ObjectDetectionExtension';
export {
    MusicRuntime as MusicRuntimeLegacy,
} from './MusicExtension';

// Intermediate extension block files
export { HandPoseRuntime } from './HandPose';
export { HumanBodyRuntime } from './HumanBody';
export { MLMachineLearningRuntime } from './MLMachineLearning';
export { PenRuntime } from './Pen';
