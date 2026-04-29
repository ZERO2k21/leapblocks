/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * LeapExtensions - Main Entry Point
 *
 * Exports everything consumers need from one stable import path:
 *   import { EXTENSIONS, registerExtensions, ExtensionManager } from 'src/leapExtensions/leapExtensions';
 */

// ─── Registry & Manager ───────────────────────────────────────────────────────
export { EXTENSIONS, registerExtensions } from './server/extensionRegistry';
export { ExtensionManager, extensionManager } from './server/extensionManager';

// ─── Shared Types ─────────────────────────────────────────────────────────────
export type { ExtensionDef, ExtensionBlock, ExtensionCategory, ExtensionId } from './shared/extensionTypes';

// ─── Individual Extensions ────────────────────────────────────────────────────
export { penExtension } from './pen/pen';
export { faceDetectionExtension } from './faceDetection/faceDetection';
export { objectDetectionExtension, ObjectDetectionRuntime } from './objectDetection/objectDetection';
export { musicExtension, MusicRuntime } from './music/music';
export { handPoseExtension } from './handPose/handPose';
export { bodyDetectionExtension } from './bodyDetection/bodyDetection';
export { mlEnvironmentExtension } from './mlEnvironment/mlEnvironment';
