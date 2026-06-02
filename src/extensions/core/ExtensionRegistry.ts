// ExtensionRegistry - Central registry for all extensions
// Manages loading, toolbox generation, and generator registration

import Blockly from '@blockly-runtime';
import { javascriptGenerator } from '@blockly-runtime';
import { Extension, BlockDefinition, blocksToBlocklyDefs } from './Extension';

export interface RegisteredExtension {
    id: string;
    name: string;
    color1: string;
    icon: string;
    blocks: BlockDefinition[];
    handlers: Record<string, (...args: any[]) => any>;
    toolbox: any[];
}

export class ExtensionRegistry {
    private static instance: ExtensionRegistry;
    private extensions: Map<string, RegisteredExtension> = new Map();
    private initialized = false;

    private constructor() {}

    static getInstance(): ExtensionRegistry {
        if (!ExtensionRegistry.instance) {
            ExtensionRegistry.instance = new ExtensionRegistry();
        }
        return ExtensionRegistry.instance;
    }

    /**
     * Register an extension instance
     */
    register(extension: Extension): void {
        const info = extension.getInfo();
        if (this.extensions.has(info.id)) {
            console.warn(`[Registry] Extension ${info.id} already registered`);
            return;
        }

        const handlers = extension.getHandlerMap();
        const blockDefs = blocksToBlocklyDefs(info.blocks, info.color1);
        const toolbox = this.buildToolbox(info.blocks);

        this.extensions.set(info.id, {
            id: info.id,
            name: info.name,
            color1: info.color1,
            icon: info.blocks[0]?.opcode?.charAt(0)?.toUpperCase() || 'E',
            blocks: info.blocks,
            handlers,
            toolbox,
        });

        console.log(`[Registry] Registered: ${info.name} (${info.id})`);
    }

    /**
     * Register all blocks with Blockly and wire up generators
     */
    initBlockly(Blockly: any): void {
        if (this.initialized) return;
        this.initialized = true;

        this.extensions.forEach((ext) => {
            // Define blocks
            const blockDefs = blocksToBlocklyDefs(ext.blocks, ext.color1);
            const newDefs = blockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newDefs.length > 0) {
                Blockly.common.defineBlocks(
                    Blockly.common.createBlockDefinitionsFromJsonArray(newDefs)
                );
            }
        });
    }

    /**
     * Register JS generators for all extensions
     */
    registerGenerators(): void {
        this.extensions.forEach((ext) => {
            ext.blocks.forEach((block) => {
                const opcode = block.opcode;
                if (javascriptGenerator.forBlock[opcode]) return; // already registered

                if (block.blockType === 'hat') {
                    // Hat blocks return empty string (trigger handled by runtime)
                    javascriptGenerator.forBlock[opcode] = () => '';
                } else if (block.blockType === 'reporter' || block.blockType === 'Boolean') {
                    // Reporter blocks return runtime calls
                    javascriptGenerator.forBlock[opcode] = this.buildReporterGen(ext, block);
                } else {
                    // Command blocks
                    javascriptGenerator.forBlock[opcode] = this.buildCommandGen(ext, block);
                }
            });
        });
    }

    private buildCommandGen(ext: RegisteredExtension, block: BlockDefinition): (block: any) => string {
        return (b: any) => {
            const args = this.extractArgs(b, block);
            const argsStr = Object.values(args).map(v => JSON.stringify(v)).join(', ');
            return `window.runtime?.${ext.id}?.${block.opcode}(${argsStr});\n`;
        };
    }

    private buildReporterGen(ext: RegisteredExtension, block: BlockDefinition): (block: any) => [string, number] {
        return (b: any) => {
            const args = this.extractArgs(b, block);
            const argsStr = Object.values(args).map(v => JSON.stringify(v)).join(', ');
            const outputType = block.blockType === 'Boolean' ? 0 : 0;
            return [`window.runtime?.${ext.id}?.${block.opcode}(${argsStr})`, outputType];
        };
    }

    private extractArgs(block: any, blockDef: BlockDefinition): Record<string, any> {
        const args: Record<string, any> = {};
        if (blockDef.arguments) {
            for (const [name, arg] of Object.entries(blockDef.arguments)) {
                args[name] = block.getFieldValue(name) ?? arg.defaultValue;
            }
        }
        return args;
    }

    private buildToolbox(blocks: BlockDefinition[]): any[] {
        const toolbox: any[] = [];
        let lastType = '';

        for (const block of blocks) {
            const currentType = block.blockType;
            if (currentType !== lastType) {
                if (currentType === 'command') {
                    toolbox.push({ kind: 'label', text: 'Commands' });
                } else if (currentType === 'reporter' || currentType === 'Boolean') {
                    toolbox.push({ kind: 'label', text: 'Reporters' });
                } else if (currentType === 'hat') {
                    toolbox.push({ kind: 'label', text: 'Events' });
                }
                lastType = currentType;
            }
            toolbox.push({ kind: 'block', type: block.opcode });
        }

        return toolbox;
    }

    /**
     * Get all registered extension IDs
     */
    getIds(): string[] {
        return Array.from(this.extensions.keys());
    }

    /**
     * Get extension by ID
     */
    get(id: string): RegisteredExtension | undefined {
        return this.extensions.get(id);
    }

    /**
     * Get toolbox contents for an extension
     */
    getToolbox(id: string): any[] {
        return this.extensions.get(id)?.toolbox || [];
    }

    /**
     * Check if extension is registered
     */
    has(id: string): boolean {
        return this.extensions.has(id);
    }
}

export const extensionRegistry = ExtensionRegistry.getInstance();
