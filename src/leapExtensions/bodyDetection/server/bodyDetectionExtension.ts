/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Body Detection Extension - Server (block definitions + code generators)
 */

import { javascriptGenerator } from '../../server/blockly/runtime';
import type { ExtensionDef } from '../../shared/extensionTypes';

// ─── Colors ───────────────────────────────────────────────────────────────────

const BD_COLOR_STATEMENT = '#D43D41';
const BD_COLOR_REPORTER = '#b71c1c';

const LANDMARK_OPTIONS = [
    ['nose', 'nose'],
    ['left shoulder', 'left_shoulder'],
    ['right shoulder', 'right_shoulder'],
    ['left elbow', 'left_elbow'],
    ['right elbow', 'right_elbow'],
    ['left wrist', 'left_wrist'],
    ['right wrist', 'right_wrist'],
    ['left hip', 'left_hip'],
    ['right hip', 'right_hip'],
    ['left knee', 'left_knee'],
    ['right knee', 'right_knee'],
    ['left ankle', 'left_ankle'],
    ['right ankle', 'right_ankle'],
];

// ─── Block Definitions ────────────────────────────────────────────────────────

export const bodyDetectionBlockDefs = [
    {
        type: 'bd_camera', message0: 'camera %1',
        args0: [{ type: 'field_dropdown', name: 'ACTION', options: [['on', 'on'], ['off', 'off']] }],
        previousStatement: null, nextStatement: null, colour: BD_COLOR_STATEMENT,
    },
    {
        type: 'bd_analyze', message0: '%1 body',
        args0: [{ type: 'field_dropdown', name: 'ACTION', options: [['analyze', 'analyze'], ['on', 'on'], ['off', 'off']] }],
        previousStatement: null, nextStatement: null, colour: BD_COLOR_STATEMENT,
    },
    {
        type: 'bd_body_count', message0: 'body count',
        output: 'Number', colour: BD_COLOR_REPORTER,
    },
    {
        type: 'bd_get_x', message0: 'x position of %1 of body %2',
        args0: [
            { type: 'field_dropdown', name: 'LANDMARK', options: LANDMARK_OPTIONS.slice(0, 3) },
            { type: 'field_number', name: 'N', value: 1 },
        ],
        output: 'Number', colour: BD_COLOR_REPORTER,
    },
    {
        type: 'bd_get_y', message0: 'y position of %1 of body %2',
        args0: [
            { type: 'field_dropdown', name: 'LANDMARK', options: LANDMARK_OPTIONS.slice(0, 3) },
            { type: 'field_number', name: 'N', value: 1 },
        ],
        output: 'Number', colour: BD_COLOR_REPORTER,
    },
];

// ─── Register Blocks ──────────────────────────────────────────────────────────

export function registerBodyDetectionBlocks(Blockly: any): void {
    const newDefs = bodyDetectionBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
    if (newDefs.length > 0) {
        Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newDefs));
    }
}

// ─── Register Generators ──────────────────────────────────────────────────────

export function registerBodyDetectionGenerators(_Blockly: any): void {
    const jsGen = javascriptGenerator;
    if (!jsGen) return;

    jsGen.forBlock['bd_camera'] = (b: any) => `if(window.__setCameraOn) window.__setCameraOn(${b.getFieldValue('ACTION') === 'on'});\n`;
    jsGen.forBlock['bd_analyze'] = (b: any) => `if(window.runtime?.bodyDetection) window.runtime.bodyDetection.analyse('${b.getFieldValue('ACTION')}');\n`;
    jsGen.forBlock['bd_body_count'] = () => [`window.runtime?.bodyDetection?.getBodyCount()||0`, 0];
    jsGen.forBlock['bd_get_x'] = (b: any) => [`window.runtime?.bodyDetection?.getX(${b.getFieldValue('N')},'${b.getFieldValue('LANDMARK')}')||0`, 0];
    jsGen.forBlock['bd_get_y'] = (b: any) => [`window.runtime?.bodyDetection?.getY(${b.getFieldValue('N')},'${b.getFieldValue('LANDMARK')}')||0`, 0];
}

// ─── Toolbox ──────────────────────────────────────────────────────────────────

export function getBodyDetectionToolbox(): any[] {
    return [
        { kind: 'block', type: 'bd_camera' },
        { kind: 'block', type: 'bd_analyze' },
        { kind: 'block', type: 'bd_body_count' },
        { kind: 'block', type: 'bd_get_x' },
        { kind: 'block', type: 'bd_get_y' },
    ];
}

// ─── Extension Definition ─────────────────────────────────────────────────────

export const bodyDetectionExtension: ExtensionDef = {
    id: 'body_detection',
    name: 'Body Detection',
    color: BD_COLOR_STATEMENT,
    icon: '🤸',
    registerBlocks: registerBodyDetectionBlocks,
    registerGenerators: registerBodyDetectionGenerators,
    getToolbox: getBodyDetectionToolbox,
};
