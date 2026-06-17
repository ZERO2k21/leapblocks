// ExtensionManager.ts - Manages dynamic extension loading and registration

import Blockly from '@blockly-runtime';

export interface ExtensionBlock {
    kind: 'block';
    type: string;
    gap?: number;
}

export interface ExtensionCategory {
    id: string;
    name: string;
    colour: string;
    icon: string;
    blocks: ExtensionBlock[];
}

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

    setWorkspace(workspace: Blockly.WorkspaceSvg) {
        this.workspace = workspace;
    }

    isExtensionLoaded(extensionId: string): boolean {
        return this.loadedExtensions.has(extensionId);
    }

    addExtension(extension: ExtensionCategory): boolean {
        if (!this.workspace) {
            console.error('Workspace not set');
            return false;
        }

        if (this.loadedExtensions.has(extension.id)) {
            console.warn(`Extension ${extension.id} already loaded`);
            return false;
        }

        try {
            // Register the category callback
            this.workspace.registerToolboxCategoryCallback(
                extension.id.toUpperCase(),
                (ws: Blockly.WorkspaceSvg) => {
                    const contents: any[] = [];

                    // Add category header
                    contents.push({
                        kind: 'label',
                        text: extension.name,
                        'web-class': 'category-header'
                    });

                    // Add blocks
                    extension.blocks.forEach(block => {
                        contents.push(block);
                    });

                    return contents;
                }
            );

            this.loadedExtensions.add(extension.id);
            console.log(`✅ Extension ${extension.name} loaded successfully`);
            return true;
        } catch (error) {
            console.error(`Failed to load extension ${extension.name}:`, error);
            return false;
        }
    }

    removeExtension(extensionId: string): boolean {
        if (!this.loadedExtensions.has(extensionId)) {
            return false;
        }

        this.loadedExtensions.delete(extensionId);
        // Note: Blockly doesn't provide a way to unregister categories dynamically
        // You would need to refresh the toolbox
        return true;
    }

    getLoadedExtensions(): string[] {
        return Array.from(this.loadedExtensions);
    }
}

export const extensionManager = ExtensionManager.getInstance();
