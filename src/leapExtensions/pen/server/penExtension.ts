/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Pen Extension - Server (block definitions + code generators)
 */

import { javascriptGenerator } from '../../server/blockly/runtime';
import type { ExtensionDef } from '../../shared/extensionTypes';

// ─── Block Definitions ────────────────────────────────────────────────────────

const PEN_COLOR = '#0FBD8C';

export const penBlockDefs = [
    { type: 'pen_clear', message0: 'erase all', previousStatement: null, nextStatement: null, colour: PEN_COLOR },
    { type: 'pen_stamp', message0: 'stamp', previousStatement: null, nextStatement: null, colour: PEN_COLOR },
    { type: 'pen_penDown', message0: 'pen down', previousStatement: null, nextStatement: null, colour: PEN_COLOR },
    { type: 'pen_penUp', message0: 'pen up', previousStatement: null, nextStatement: null, colour: PEN_COLOR },
    { type: 'pen_setPenColorToColor', message0: 'set pen color to %1', args0: [{ type: 'field_colour', name: 'COLOR', colour: '#ff0000' }], previousStatement: null, nextStatement: null, colour: PEN_COLOR },
    { type: 'pen_changePenSizeBy', message0: 'change pen size by %1', args0: [{ type: 'field_number', name: 'SIZE', value: 1 }], previousStatement: null, nextStatement: null, colour: PEN_COLOR },
    { type: 'pen_setPenSizeTo', message0: 'set pen size to %1', args0: [{ type: 'field_number', name: 'SIZE', value: 1 }], previousStatement: null, nextStatement: null, colour: PEN_COLOR },
];

// ─── Register Blocks ──────────────────────────────────────────────────────────

export function registerPenBlocks(Blockly: any): void {
    const newDefs = penBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
    if (newDefs.length > 0) {
        Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newDefs));
    }
}

// ─── Register Generators ──────────────────────────────────────────────────────

export function registerPenGenerators(_Blockly: any): void {
    const jsGen = javascriptGenerator;
    if (!jsGen) return;

    jsGen.forBlock['pen_clear'] = () => 'if(window.runtime?.pen) window.runtime.pen.eraseAll();\n';
    jsGen.forBlock['pen_stamp'] = () => 'if(window.runtime?.pen) window.runtime.pen.stamp();\n';
    jsGen.forBlock['pen_penDown'] = () => 'if(window.runtime?.pen) window.runtime.pen.penDown();\n';
    jsGen.forBlock['pen_penUp'] = () => 'if(window.runtime?.pen) window.runtime.pen.penUp();\n';
    jsGen.forBlock['pen_setPenColorToColor'] = (b: any) => {
        const color = b.getFieldValue('COLOR') || '#000000';
        return `if(window.runtime?.pen) window.runtime.pen.setColor('${color}');\n`;
    };
    jsGen.forBlock['pen_changePenSizeBy'] = (b: any) => {
        const size = b.getFieldValue('SIZE') || 1;
        return `if(window.runtime?.pen) window.runtime.pen.changeSize(${size});\n`;
    };
    jsGen.forBlock['pen_setPenSizeTo'] = (b: any) => {
        const size = b.getFieldValue('SIZE') || 1;
        return `if(window.runtime?.pen) window.runtime.pen.setSize(${size});\n`;
    };
}

// ─── Toolbox ──────────────────────────────────────────────────────────────────

export function getPenToolbox(): any[] {
    return [
        { kind: 'block', type: 'pen_clear' },
        { kind: 'block', type: 'pen_stamp' },
        { kind: 'block', type: 'pen_penDown' },
        { kind: 'block', type: 'pen_penUp' },
        { kind: 'block', type: 'pen_setPenColorToColor' },
        { kind: 'block', type: 'pen_changePenSizeBy' },
        { kind: 'block', type: 'pen_setPenSizeTo' },
    ];
}

// ─── Extension Definition ─────────────────────────────────────────────────────

export const penExtension: ExtensionDef = {
    id: 'pen',
    name: 'Pen',
    color: PEN_COLOR,
    icon: '✏️',
    registerBlocks: registerPenBlocks,
    registerGenerators: registerPenGenerators,
    getToolbox: getPenToolbox,
};
