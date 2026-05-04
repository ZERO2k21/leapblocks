/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Extension Manager - manages dynamic loading and registration of extensions
 * into the Blockly workspace toolbox.
 */

import Blockly from './blockly/runtime';
import type { ExtensionCategory, ExtensionBlock } from '../shared/extensionTypes';

export type { ExtensionCategory, ExtensionBlock };

export class ExtensionManager {
    private static instance: ExtensionManager;
    private loadedExtensions: Set<string> = new Set();
    private workspace: Blockly.WorkspaceSvg | null = null;

    private constructor() { }

    static getInstance(): ExtensionManager {
        if (!ExtensionManager.instance) {
            ExtensionManager.instance = new ExtensionManager();
        }
        return ExtensionManager.instance;
    }

    setWorkspace(workspace: Blockly.WorkspaceSvg): void {
        this.workspace = workspace;
    }

    isExtensionLoaded(extensionId: string): boolean {
        return this.loadedExtensions.has(extensionId);
    }

    addExtension(extension: ExtensionCategory): boolean {
        if (!this.workspace) {
            console.error('[ExtensionManager] Workspace not set');
            return false;
        }
        if (this.loadedExtensions.has(extension.id)) {
            console.warn(`[ExtensionManager] Extension "${extension.id}" already loaded`);
            return false;
        }

        try {
            this.workspace.registerToolboxCategoryCallback(
                extension.id.toUpperCase(),
                (_ws: Blockly.WorkspaceSvg) => {
                    const contents: any[] = [
                        { kind: 'label', text: extension.name, 'web-class': 'category-header' },
                        ...extension.blocks,
                    ];
                    return contents;
                }
            );
            this.loadedExtensions.add(extension.id);
            console.log(`[ExtensionManager] Extension "${extension.name}" loaded`);
            return true;
        } catch (error) {
            console.error(`[ExtensionManager] Failed to load "${extension.name}":`, error);
            return false;
        }
    }

    removeExtension(extensionId: string): boolean {
        if (!this.loadedExtensions.has(extensionId)) return false;
        this.loadedExtensions.delete(extensionId);
        return true;
    }

    getLoadedExtensions(): string[] {
        return Array.from(this.loadedExtensions);
    }
}

export const extensionManager = ExtensionManager.getInstance();
