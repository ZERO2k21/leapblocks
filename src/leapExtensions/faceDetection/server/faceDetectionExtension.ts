/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Face Detection Extension - Server (block definitions + code generators)
 *
 * HOW IT WORKS:
 * 1. User adds Face Detection from Extension Library
 * 2. Blocks appear in toolbox under "Face Detection"
 * 3. "turn on video on stage" + "analyse image from camera" starts detection loop
 * 4. Reporter blocks (face count, x/y, emotion) return live values
 * 5. Sprites react in real-time via forever loops
 *
 * DETECTION STRATEGY:
 * 1. Try browser FaceDetector API (Chrome/Edge with experimental flag)
 * 2. Fallback: canvas pixel analysis for presence + center position
 */

import { javascriptGenerator } from '../../server/blockly/runtime';
import type { ExtensionDef } from '../../shared/extensionTypes';

// ─── Colors ───────────────────────────────────────────────────────────────────

const FD_COLOR_STATEMENT = '#D43D41';
const FD_COLOR_REPORTER = '#b71c1c';

// ─── Block Definitions ────────────────────────────────────────────────────────

export const faceDetectionBlockDefs = [
    // Settings
    {
        type: 'fd_video_on_stage',
        message0: 'turn %1 video on stage with %2 % transparency',
        args0: [
            { type: 'field_dropdown', name: 'STATE', options: [['on', 'on'], ['off', 'off']] },
            { type: 'field_number', name: 'TRANSPARENCY', value: 0, min: 0, max: 100 },
        ],
        previousStatement: null, nextStatement: null, colour: FD_COLOR_STATEMENT,
    },
    {
        type: 'fd_show_bounding_box',
        message0: '%1 bounding box',
        args0: [{ type: 'field_dropdown', name: 'STATE', options: [['show', 'show'], ['hide', 'hide']] }],
        previousStatement: null, nextStatement: null, colour: FD_COLOR_STATEMENT,
    },
    {
        type: 'fd_set_threshold',
        message0: 'set detection threshold to %1',
        args0: [{ type: 'field_dropdown', name: 'THRESHOLD', options: [['0.5', '0.5'], ['0.6', '0.6'], ['0.7', '0.7'], ['0.8', '0.8'], ['0.9', '0.9']] }],
        previousStatement: null, nextStatement: null, colour: FD_COLOR_STATEMENT,
    },
    // Detection
    {
        type: 'fd_analyse_image',
        message0: 'analyse image from %1',
        args0: [{ type: 'field_dropdown', name: 'SOURCE', options: [['camera', 'camera'], ['image', 'image']] }],
        previousStatement: null, nextStatement: null, colour: FD_COLOR_STATEMENT,
    },
    {
        type: 'fd_get_num_faces',
        message0: 'get # faces',
        previousStatement: null, nextStatement: null, colour: FD_COLOR_STATEMENT,
    },
    {
        type: 'fd_get_expression',
        message0: 'get expression of face %1',
        args0: [{ type: 'field_number', name: 'N', value: 1, min: 1 }],
        output: 'String', colour: FD_COLOR_REPORTER,
    },
    {
        type: 'fd_get_dimension',
        message0: 'get %1 of face %2',
        args0: [
            { type: 'field_dropdown', name: 'DIM', options: [['width', 'width'], ['height', 'height']] },
            { type: 'field_number', name: 'N', value: 1, min: 1 },
        ],
        output: 'Number', colour: FD_COLOR_REPORTER,
    },
    {
        type: 'fd_is_expression',
        message0: 'is expression of face %1 %2',
        args0: [
            { type: 'field_number', name: 'N', value: 1, min: 1 },
            { type: 'field_dropdown', name: 'EXPRESSION', options: [['happy', 'happy'], ['sad', 'sad'], ['angry', 'angry'], ['surprised', 'surprised'], ['neutral', 'neutral']] },
        ],
        output: 'Boolean', colour: FD_COLOR_REPORTER,
    },
    {
        type: 'fd_get_xy_position',
        message0: 'get %1 position %2 of face %3',
        args0: [
            { type: 'field_dropdown', name: 'AXIS', options: [['x', 'x'], ['y', 'y']] },
            { type: 'field_dropdown', name: 'DUMMY', options: [['', '']] },
            { type: 'field_number', name: 'N', value: 1, min: 1 },
        ],
        output: 'Number', colour: FD_COLOR_REPORTER,
    },
    {
        type: 'fd_get_landmark_pos',
        message0: 'get %1 position of %2 of face %3',
        args0: [
            { type: 'field_dropdown', name: 'AXIS', options: [['x', 'x'], ['y', 'y']] },
            { type: 'field_dropdown', name: 'LANDMARK', options: [['left eye', 'left_eye'], ['right eye', 'right_eye'], ['nose', 'nose'], ['mouth', 'mouth'], ['left ear', 'left_ear'], ['right ear', 'right_ear']] },
            { type: 'field_number', name: 'N', value: 1, min: 1 },
        ],
        output: 'Number', colour: FD_COLOR_REPORTER,
    },
    {
        type: 'fd_get_landmark_num',
        message0: 'get %1 position of landmark %2 of face %3',
        args0: [
            { type: 'field_dropdown', name: 'AXIS', options: [['x', 'x'], ['y', 'y']] },
            { type: 'field_number', name: 'LANDMARK_N', value: 1, min: 1 },
            { type: 'field_number', name: 'N', value: 1, min: 1 },
        ],
        output: 'Number', colour: FD_COLOR_REPORTER,
    },
    // Reporter blocks
    { type: 'fd_face_count', message0: 'face count', output: 'Number', colour: FD_COLOR_REPORTER },
    { type: 'fd_emotion', message0: 'emotion', output: 'String', colour: FD_COLOR_REPORTER },
    {
        type: 'fd_face_x', message0: 'face %1 x position',
        args0: [{ type: 'field_number', name: 'N', value: 1 }],
        output: 'Number', colour: FD_COLOR_REPORTER,
    },
    {
        type: 'fd_face_y', message0: 'face %1 y position',
        args0: [{ type: 'field_number', name: 'N', value: 1 }],
        output: 'Number', colour: FD_COLOR_REPORTER,
    },
    // Face Recognition: Training
    {
        type: 'fd_add_class',
        message0: 'add class %1 as %2 from %3',
        args0: [
            { type: 'field_number', name: 'CLASS_N', value: 1, min: 1 },
            { type: 'field_input', name: 'CLASS_NAME', text: 'Jarvis' },
            { type: 'field_dropdown', name: 'SOURCE', options: [['camera', 'camera'], ['image', 'image']] },
        ],
        previousStatement: null, nextStatement: null, colour: FD_COLOR_STATEMENT,
    },
    {
        type: 'fd_reset_class',
        message0: 'reset class',
        previousStatement: null, nextStatement: null, colour: FD_COLOR_STATEMENT,
    },
    // Face Recognition: Testing
    {
        type: 'fd_do_face_matching',
        message0: 'do face matching on %1',
        args0: [{ type: 'field_dropdown', name: 'SOURCE', options: [['camera', 'camera'], ['image', 'image']] }],
        previousStatement: null, nextStatement: null, colour: FD_COLOR_STATEMENT,
    },
    {
        type: 'fd_is_class_detected',
        message0: 'is %1 class detected',
        args0: [{ type: 'field_number', name: 'CLASS_N', value: 1, min: 1 }],
        output: 'Boolean', colour: FD_COLOR_REPORTER,
    },
    {
        type: 'fd_get_class_detected',
        message0: 'get class of face %1 detected',
        args0: [{ type: 'field_number', name: 'N', value: 1, min: 1 }],
        output: 'String', colour: FD_COLOR_REPORTER,
    },
    // Legacy blocks (kept for backward compatibility)
    {
        type: 'fd_camera', message0: 'camera %1',
        args0: [{ type: 'field_dropdown', name: 'ACTION', options: [['on', 'on'], ['off', 'off'], ['flip', 'flip']] }],
        previousStatement: null, nextStatement: null, colour: FD_COLOR_STATEMENT,
    },
    {
        type: 'fd_analyze', message0: '%1 face',
        args0: [{ type: 'field_dropdown', name: 'ACTION', options: [['analyze', 'analyze'], ['show detection', 'show'], ['hide detection', 'hide']] }],
        previousStatement: null, nextStatement: null, colour: FD_COLOR_STATEMENT,
    },
];

// ─── Register Blocks ──────────────────────────────────────────────────────────

export function registerFaceDetectionBlocks(Blockly: any): void {
    const newDefs = faceDetectionBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
    if (newDefs.length > 0) {
        Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newDefs));
    }
}

// ─── Register Generators ──────────────────────────────────────────────────────

export function registerFaceDetectionGenerators(_Blockly: any): void {
    const jsGen = javascriptGenerator;
    if (!jsGen) return;

    // Settings
    jsGen.forBlock['fd_video_on_stage'] = (b: any) => {
        const state = b.getFieldValue('STATE');
        const t = b.getFieldValue('TRANSPARENCY') || 0;
        return `if(window.__setCameraOn) window.__setCameraOn(${state === 'on'});\nif(window.runtime?.face) window.runtime.face.setVideoTransparency?.(${t});\n`;
    };
    jsGen.forBlock['fd_show_bounding_box'] = (b: any) =>
        `if(window.runtime?.face) window.runtime.face.setBoundingBox?.('${b.getFieldValue('STATE')}');\n`;
    jsGen.forBlock['fd_set_threshold'] = (b: any) =>
        `if(window.runtime?.face) window.runtime.face.setThreshold?.(${b.getFieldValue('THRESHOLD')});\n`;

    // Detection
    jsGen.forBlock['fd_analyse_image'] = (b: any) => {
        const src = b.getFieldValue('SOURCE');
        return `if(window.__setCameraOn) window.__setCameraOn(${src === 'camera'});\nif(window.runtime?.face) window.runtime.face.analyse('analyze');\n`;
    };
    jsGen.forBlock['fd_get_num_faces'] = () =>
        `if(window.runtime?.face){const _s=window.__activeSpriteId;if(_s&&window.spriteManager)window.spriteManager.getSprite(_s)?.say(window.runtime.face.getFaceCount()+" faces");}\n`;
    jsGen.forBlock['fd_get_expression'] = (_b: any) => [`window.runtime?.face?.getEmotion()||''`, 0];
    jsGen.forBlock['fd_get_dimension'] = (b: any) => {
        const dim = b.getFieldValue('DIM');
        const n = b.getFieldValue('N') || 1;
        return [`window.runtime?.face?.${dim === 'width' ? 'getWidth' : 'getHeight'}(${n})||0`, 0];
    };
    jsGen.forBlock['fd_is_expression'] = (b: any) =>
        [`(window.runtime?.face?.getEmotion()||'').toLowerCase()==='${b.getFieldValue('EXPRESSION')}'`, 0];
    jsGen.forBlock['fd_get_xy_position'] = (b: any) => {
        const axis = b.getFieldValue('AXIS');
        const n = b.getFieldValue('N') || 1;
        return [`window.runtime?.face?.get${axis.toUpperCase()}(${n})||0`, 0];
    };
    jsGen.forBlock['fd_get_landmark_pos'] = (b: any) => {
        const axis = b.getFieldValue('AXIS');
        const lm = b.getFieldValue('LANDMARK');
        const n = b.getFieldValue('N') || 1;
        return [`window.runtime?.face?.getLandmark?.('${lm}',${n},'${axis}')||0`, 0];
    };
    jsGen.forBlock['fd_get_landmark_num'] = (b: any) => {
        const axis = b.getFieldValue('AXIS');
        const lmN = b.getFieldValue('LANDMARK_N') || 1;
        const n = b.getFieldValue('N') || 1;
        return [`window.runtime?.face?.getLandmarkByIndex?.(${lmN},${n},'${axis}')||0`, 0];
    };

    // Reporters
    jsGen.forBlock['fd_face_count'] = () => [`window.runtime?.face?.getFaceCount()||0`, 0];
    jsGen.forBlock['fd_emotion'] = () => [`window.runtime?.face?.getEmotion()||''`, 0];
    jsGen.forBlock['fd_face_x'] = (b: any) => [`window.runtime?.face?.getX(${b.getFieldValue('N')})||0`, 0];
    jsGen.forBlock['fd_face_y'] = (b: any) => [`window.runtime?.face?.getY(${b.getFieldValue('N')})||0`, 0];

    // Face Recognition: Training
    jsGen.forBlock['fd_add_class'] = (b: any) =>
        `if(window.runtime?.face) window.runtime.face.addClass?.(${b.getFieldValue('CLASS_N')},'${b.getFieldValue('CLASS_NAME')}','${b.getFieldValue('SOURCE')}');\n`;
    jsGen.forBlock['fd_reset_class'] = () =>
        `if(window.runtime?.face) window.runtime.face.resetClasses?.();\n`;

    // Face Recognition: Testing
    jsGen.forBlock['fd_do_face_matching'] = (b: any) =>
        `if(window.runtime?.face) await window.runtime.face.doFaceMatching?.('${b.getFieldValue('SOURCE')}');\n`;
    jsGen.forBlock['fd_is_class_detected'] = (b: any) =>
        [`window.runtime?.face?.isClassDetected?.(${b.getFieldValue('CLASS_N')})||false`, 0];
    jsGen.forBlock['fd_get_class_detected'] = (b: any) =>
        [`window.runtime?.face?.getClassOfFace?.(${b.getFieldValue('N')})||''`, 0];

    // Legacy
    jsGen.forBlock['fd_camera'] = (b: any) => {
        const action = b.getFieldValue('ACTION');
        return `if(window.__setCameraOn) window.__setCameraOn(${action === 'on'});\nif(window.runtime?.face) window.runtime.face.analyse('${action}');\n`;
    };
    jsGen.forBlock['fd_analyze'] = (b: any) =>
        `if(window.runtime?.face) window.runtime.face.analyse('${b.getFieldValue('ACTION')}');\n`;
}

// ─── Toolbox ──────────────────────────────────────────────────────────────────

export function getFaceDetectionToolbox(): any[] {
    return [
        { kind: 'label', text: 'Settings' },
        { kind: 'block', type: 'fd_video_on_stage' },
        { kind: 'block', type: 'fd_show_bounding_box' },
        { kind: 'block', type: 'fd_set_threshold' },
        { kind: 'label', text: 'Detection' },
        { kind: 'block', type: 'fd_analyse_image' },
        { kind: 'block', type: 'fd_get_num_faces' },
        { kind: 'block', type: 'fd_get_expression' },
        { kind: 'block', type: 'fd_get_dimension' },
        { kind: 'block', type: 'fd_is_expression' },
        { kind: 'block', type: 'fd_get_xy_position' },
        { kind: 'block', type: 'fd_get_landmark_pos' },
        { kind: 'block', type: 'fd_get_landmark_num' },
        { kind: 'label', text: 'Face Recognition: Training' },
        { kind: 'block', type: 'fd_add_class' },
        { kind: 'block', type: 'fd_reset_class' },
        { kind: 'label', text: 'Face Recognition: Testing' },
        { kind: 'block', type: 'fd_do_face_matching' },
        { kind: 'block', type: 'fd_is_class_detected' },
        { kind: 'block', type: 'fd_get_class_detected' },
    ];
}

// ─── Extension Definition ─────────────────────────────────────────────────────

export const faceDetectionExtension: ExtensionDef = {
    id: 'face_detection',
    name: 'Face Detection',
    color: FD_COLOR_STATEMENT,
    icon: '👤',
    registerBlocks: registerFaceDetectionBlocks,
    registerGenerators: registerFaceDetectionGenerators,
    getToolbox: getFaceDetectionToolbox,
};
