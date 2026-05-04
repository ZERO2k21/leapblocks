/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Face Detection Extension - Module Entry Point
 */

export {
    faceDetectionExtension,
    registerFaceDetectionBlocks,
    registerFaceDetectionGenerators,
    getFaceDetectionToolbox,
    faceDetectionBlockDefs,
} from './server/faceDetectionExtension';

export const FACE_DETECTION_EXTENSION_ID = 'face_detection';
