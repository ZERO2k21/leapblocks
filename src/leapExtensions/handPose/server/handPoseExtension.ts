/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Hand Pose Extension - Server (block definitions + code generators)
 */

import { javascriptGenerator } from '../../server/blockly/runtime';
import type { ExtensionDef } from '../../shared/extensionTypes';

// ─── Colors ───────────────────────────────────────────────────────────────────

const HP_COLOR_STATEMENT = '#D43D41';
const HP_COLOR_REPORTER = '#b71c1c';

const FINGER_OPTIONS = [
    ['Thumb', 'thumb'],
    ['Index', 'index'],
    ['Middle', 'middle'],
    ['Ring', 'ring'],
    ['Pinky', 'pinky'],
    ['Base', 'base'],
];

// ─── Block Definitions ────────────────────────────────────────────────────────

export const handPoseBlockDefs = [
    {
        type: 'hp_camera', message0: 'camera %1',
        args0: [{ type: 'field_dropdown', name: 'ACTION', options: [['on', 'on'], ['off', 'off'], ['flip', 'flip']] }],
        previousStatement: null, nextStatement: null, colour: HP_COLOR_STATEMENT,
    },
    {
        type: 'hp_analyze', message0: '%1 hand',
        args0: [{ type: 'field_dropdown', name: 'ACTION', options: [['analyze', 'analyze'], ['show detection', 'show'], ['hide detection', 'hide']] }],
        previousStatement: null, nextStatement: null, colour: HP_COLOR_STATEMENT,
    },
    {
        type: 'hp_move_with', message0: 'move sprite with %1',
        args0: [{ type: 'field_dropdown', name: 'FINGER', options: FINGER_OPTIONS }],
        previousStatement: null, nextStatement: null, colour: HP_COLOR_STATEMENT,
    },
    {
        type: 'hp_guess_sign', message0: 'guess sign',
        previousStatement: null, nextStatement: null, colour: HP_COLOR_STATEMENT,
    },
    {
        type: 'hp_when_sign', message0: 'when hand sign %1',
        args0: [{ type: 'field_dropdown', name: 'SIGN', options: [['Peace', '2'], ['Open', '5'], ['Thumbs Up', 'thumbs_up']] }],
        nextStatement: true, colour: HP_COLOR_STATEMENT,
    },
    {
        type: 'hp_finger_x', message0: '%1 x position',
        args0: [{ type: 'field_dropdown', name: 'FINGER', options: FINGER_OPTIONS }],
        output: 'Number', colour: HP_COLOR_REPORTER,
    },
    {
        type: 'hp_finger_y', message0: '%1 y position',
        args0: [{ type: 'field_dropdown', name: 'FINGER', options: FINGER_OPTIONS }],
        output: 'Number', colour: HP_COLOR_REPORTER,
    },
];

// ─── Register Blocks ──────────────────────────────────────────────────────────

export function registerHandPoseBlocks(Blockly: any): void {
    const newDefs = handPoseBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
    if (newDefs.length > 0) {
        Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newDefs));
    }
}

// ─── Register Generators ──────────────────────────────────────────────────────

export function registerHandPoseGenerators(_Blockly: any): void {
    const jsGen = javascriptGenerator;
    if (!jsGen) return;

    jsGen.forBlock['hp_camera'] = (b: any) => `if(window.runtime?.handPose) window.runtime.handPose.analyse('${b.getFieldValue('ACTION')}');\n`;
    jsGen.forBlock['hp_analyze'] = (b: any) => `if(window.runtime?.handPose) window.runtime.handPose.analyse('${b.getFieldValue('ACTION')}');\n`;
    jsGen.forBlock['hp_move_with'] = (b: any) => `if(window.runtime?.handPose) window.runtime.handPose.moveSpriteToFinger('${b.getFieldValue('FINGER')}');\n`;
    jsGen.forBlock['hp_guess_sign'] = () =>
        `if(window.runtime?.handPose){const s=window.__activeSpriteId;if(s&&window.spriteManager)window.spriteManager.getSprite(s)?.say("Sign: "+window.runtime.handPose.getSign());}\n`;
    jsGen.forBlock['hp_when_sign'] = () => '// On Hand Sign\n';
    jsGen.forBlock['hp_finger_x'] = (b: any) => [`window.runtime?.handPose?.getLandmarkX('${b.getFieldValue('FINGER')}')||0`, 0];
    jsGen.forBlock['hp_finger_y'] = (b: any) => [`window.runtime?.handPose?.getLandmarkY('${b.getFieldValue('FINGER')}')||0`, 0];
}

// ─── Toolbox ──────────────────────────────────────────────────────────────────

export function getHandPoseToolbox(): any[] {
    return [
        { kind: 'block', type: 'hp_camera' },
        { kind: 'block', type: 'hp_analyze' },
        { kind: 'block', type: 'hp_move_with' },
        { kind: 'block', type: 'hp_guess_sign' },
        { kind: 'block', type: 'hp_when_sign' },
        { kind: 'block', type: 'hp_finger_x' },
        { kind: 'block', type: 'hp_finger_y' },
    ];
}

// ─── Extension Definition ─────────────────────────────────────────────────────

export const handPoseExtension: ExtensionDef = {
    id: 'hand_pose',
    name: 'Hand Pose',
    color: HP_COLOR_STATEMENT,
    icon: '✋',
    registerBlocks: registerHandPoseBlocks,
    registerGenerators: registerHandPoseGenerators,
    getToolbox: getHandPoseToolbox,
};
