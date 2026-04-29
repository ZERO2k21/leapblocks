/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Shared Extension Types - used by all extensions
 */

/** Shape every extension must satisfy */
export interface ExtensionDef {
    id: string;
    name: string;
    color: string;
    icon: string;
    registerBlocks: (Blockly: any) => void;
    registerGenerators: (Blockly: any) => void;
    getToolbox: () => any[];
}

/** Blockly toolbox block entry */
export interface ExtensionBlock {
    kind: 'block';
    type: string;
    gap?: number;
}

/** Blockly toolbox category entry */
export interface ExtensionCategory {
    id: string;
    name: string;
    colour: string;
    icon: string;
    blocks: ExtensionBlock[];
}

/** All valid extension IDs */
export type ExtensionId =
    | 'pen'
    | 'face_detection'
    | 'object_detection'
    | 'music'
    | 'hand_pose'
    | 'body_detection'
    | 'ml_machine_learning';
