/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Extension Registry - central map of all registered extensions.
 *
 * This replaces the old extensionDefinitions.ts monolith.
 * Each extension lives in its own folder; this file just assembles them.
 *
 * Usage (same API as before):
 *   import { EXTENSIONS, registerExtensions } from 'src/leapExtensions/server/extensionRegistry';
 */

import type { ExtensionDef, ExtensionId } from '../shared/extensionTypes';

import { penExtension } from '../pen/server/penExtension';
import { faceDetectionExtension } from '../faceDetection/server/faceDetectionExtension';
import { objectDetectionExtension } from '../objectDetection/server/objectDetectionExtension';
import { musicExtension } from '../music/server/musicExtension';
import { handPoseExtension } from '../handPose/server/handPoseExtension';
import { bodyDetectionExtension } from '../bodyDetection/server/bodyDetectionExtension';
import { mlEnvironmentExtension } from '../mlEnvironment/server/mlEnvironmentExtension';

// ─── Central Registry ─────────────────────────────────────────────────────────

export const EXTENSIONS: Record<string, ExtensionDef> = {
    [penExtension.id]: penExtension,
    [faceDetectionExtension.id]: faceDetectionExtension,
    [objectDetectionExtension.id]: objectDetectionExtension,
    [musicExtension.id]: musicExtension,
    [handPoseExtension.id]: handPoseExtension,
    [bodyDetectionExtension.id]: bodyDetectionExtension,
    [mlEnvironmentExtension.id]: mlEnvironmentExtension,
};

// ─── Register Helper ──────────────────────────────────────────────────────────

/**
 * Register blocks + generators for the given extension IDs.
 * Called by EmbedApp and useBlocklyInit when a user adds an extension.
 */
export function registerExtensions(Blockly: any, extensionIds: string[]): void {
    extensionIds.forEach(id => {
        const ext = EXTENSIONS[id];
        if (ext) {
            ext.registerBlocks(Blockly);
            ext.registerGenerators(Blockly);
        } else {
            console.warn(`[ExtensionRegistry] Unknown extension id: "${id}"`);
        }
    });
}
