// Extension base class -所有扩展的基类
// Provides standard interface for block definitions, generators, and runtime

import Blockly from '@blockly-runtime';

export type BlockType = 'command' | 'reporter' | 'Boolean' | 'hat';

export interface BlockDefinition {
    opcode: string;
    blockType: BlockType;
    text: string;
    arguments?: Record<string, {
        type: 'string' | 'number' | 'angle' | 'colour' | 'dropdown';
        defaultValue?: any;
        menu?: Array<[string, string]>;
    }>;
    returnType?: 'Number' | 'String' | 'Boolean';
    isEdge?: boolean;
}

export interface ExtensionInfo {
    id: string;
    name: string;
    color1: string;
    color2?: string;
    blockIconURI?: string;
    menuIconURI?: string;
    blocks: BlockDefinition[];
    docsURI?: string;
}

/**
 * Base class for all LeapLab extensions
 * Subclasses must implement getInfo() and block handler methods
 */
export abstract class Extension {
    protected _runtime: any;

    constructor(runtime?: any) {
        this._runtime = runtime;
    }

    /**
     * Returns extension metadata and block definitions
     */
    abstract getInfo(): ExtensionInfo;

    /**
     * Called when extension is loaded. Override for setup logic.
     */
    onInit?(): void;

    /**
     * Called when extension is unloaded. Override for cleanup.
     */
    onDispose?(): void;

    /**
     * Get the opcode-to-method mapping for block handlers
     */
    getHandlerMap(): Record<string, (...args: any[]) => any> {
        const info = this.getInfo();
        const map: Record<string, (...args: any[]) => any> = {};
        for (const block of info.blocks) {
            const method = (this as any)[block.opcode];
            if (typeof method === 'function') {
                map[block.opcode] = method.bind(this);
            }
        }
        return map;
    }
}

/**
 * Converts ExtensionInfo blocks to Blockly JSON block definitions
 */
export function blocksToBlocklyDefs(blocks: BlockDefinition[], colour: string): any[] {
    return blocks.map(block => {
        const def: any = {
            type: block.opcode,
            message0: block.text,
            colour: colour,
        };

        if (block.arguments) {
            def.args0 = Object.entries(block.arguments).map(([name, arg]) => {
                const field: any = { name };
                switch (arg.type) {
                    case 'dropdown':
                        field.type = 'field_dropdown';
                        field.options = arg.menu || [];
                        break;
                    case 'colour':
                        field.type = 'field_colour';
                        field.colour = arg.defaultValue || '#ff0000';
                        break;
                    case 'number':
                        field.type = 'field_number';
                        field.value = arg.defaultValue ?? 0;
                        break;
                    default:
                        field.type = 'field_input';
                        field.text = arg.defaultValue ?? '';
                        break;
                }
                return field;
            });
        }

        switch (block.blockType) {
            case 'command':
                def.previousStatement = null;
                def.nextStatement = null;
                break;
            case 'reporter':
                def.output = block.returnType || 'Number';
                break;
            case 'Boolean':
                def.output = 'Boolean';
                break;
            case 'hat':
                def.nextStatement = null;
                def.hat = 'event';
                break;
        }

        if (block.isEdge) {
            def.output = null;
        }

        return def;
    });
}
