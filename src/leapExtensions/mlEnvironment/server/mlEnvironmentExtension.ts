/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * ML Environment Extension - Server (block definitions + code generators)
 */

import { javascriptGenerator } from '../../server/blockly/runtime';
import type { ExtensionDef } from '../../shared/extensionTypes';

// ─── Colors ───────────────────────────────────────────────────────────────────

const ML_COLOR_STATEMENT = '#D43D41';
const ML_COLOR_REPORTER = '#b71c1c';

// ─── Block Definitions ────────────────────────────────────────────────────────

export const mlEnvironmentBlockDefs = [
    {
        type: 'ml_analyze', message0: '%1 classification',
        args0: [{ type: 'field_dropdown', name: 'ACTION', options: [['on', 'on'], ['off', 'off']] }],
        previousStatement: null, nextStatement: null, colour: ML_COLOR_STATEMENT,
    },
    {
        type: 'ml_get_prediction', message0: 'prediction',
        output: 'String', colour: ML_COLOR_REPORTER,
    },
    {
        type: 'ml_get_confidence', message0: 'confidence',
        output: 'Number', colour: ML_COLOR_REPORTER,
    },
    {
        type: 'ml_is_class', message0: 'prediction is %1?',
        args0: [{ type: 'field_input', name: 'CLASS', text: 'Class 1' }],
        output: 'Boolean', colour: ML_COLOR_REPORTER,
    },
];

// ─── Register Blocks ──────────────────────────────────────────────────────────

export function registerMlEnvironmentBlocks(Blockly: any): void {
    const newDefs = mlEnvironmentBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
    if (newDefs.length > 0) {
        Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newDefs));
    }
}

// ─── Register Generators ──────────────────────────────────────────────────────

export function registerMlEnvironmentGenerators(_Blockly: any): void {
    const jsGen = javascriptGenerator;
    if (!jsGen) return;

    jsGen.forBlock['ml_analyze'] = (b: any) => `if(window.runtime?.ml) window.runtime.ml.analyse('${b.getFieldValue('ACTION')}');\n`;
    jsGen.forBlock['ml_get_prediction'] = () => [`window.runtime?.ml?.getPrediction()||''`, 0];
    jsGen.forBlock['ml_get_confidence'] = () => [`window.runtime?.ml?.getConfidence()||0`, 0];
    jsGen.forBlock['ml_is_class'] = (b: any) => [`window.runtime?.ml?.getPrediction()==='${b.getFieldValue('CLASS')}'`, 0];
}

// ─── Toolbox ──────────────────────────────────────────────────────────────────

export function getMlEnvironmentToolbox(): any[] {
    return [
        { kind: 'block', type: 'ml_analyze' },
        { kind: 'block', type: 'ml_get_prediction' },
        { kind: 'block', type: 'ml_get_confidence' },
        { kind: 'block', type: 'ml_is_class' },
    ];
}

// ─── Extension Definition ─────────────────────────────────────────────────────

export const mlEnvironmentExtension: ExtensionDef = {
    id: 'ml_machine_learning',
    name: 'ML Environment',
    color: ML_COLOR_STATEMENT,
    icon: '🤖',
    registerBlocks: registerMlEnvironmentBlocks,
    registerGenerators: registerMlEnvironmentGenerators,
    getToolbox: getMlEnvironmentToolbox,
};
