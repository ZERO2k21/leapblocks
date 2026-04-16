import { javascriptGenerator } from '@blockly-runtime';

export interface ExtensionDef {
    id: string;
    name: string;
    color: string;
    icon: string;
    registerBlocks: (Blockly: any) => void;
    registerGenerators: (Blockly: any) => void;
    getToolbox: () => any[];
}

export const EXTENSIONS: Record<string, ExtensionDef> = {
    pen: {
        id: 'pen',
        name: 'Pen',
        color: '#0FBD8C',
        icon: '✏️',
        registerBlocks: (Blockly: any) => {
            const penBlockDefs = [
                { type: 'pen_clear', message0: '🏷️ erase all', previousStatement: null, nextStatement: null, colour: '#0FBD8C' },
                { type: 'pen_stamp', message0: '🖼️ stamp', previousStatement: null, nextStatement: null, colour: '#0FBD8C' },
                { type: 'pen_down', message0: '🖋️ pen down', previousStatement: null, nextStatement: null, colour: '#0FBD8C' },
                { type: 'pen_up', message0: '🖋️ pen up', previousStatement: null, nextStatement: null, colour: '#0FBD8C' },
                { type: 'pen_set_color', message0: '🎨 set pen color to %1', args0: [{ type: 'input_value', name: 'COLOR' }], previousStatement: null, nextStatement: null, colour: '#0FBD8C' },
                { type: 'pen_change_size', message0: '📏 change pen size by %1', args0: [{ type: 'input_value', name: 'SIZE' }], previousStatement: null, nextStatement: null, colour: '#0FBD8C' },
                { type: 'pen_set_size', message0: '📏 set pen size to %1', args0: [{ type: 'input_value', name: 'SIZE' }], previousStatement: null, nextStatement: null, colour: '#0FBD8C' }
            ];
            const newPenDefs = penBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newPenDefs.length > 0) {
                Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newPenDefs));
            }
        },
        registerGenerators: (Blockly: any) => {
            const jsGen = (Blockly as any).JavaScript || (Blockly as any).javascriptGenerator;
            if (!jsGen) return;

            jsGen.forBlock['pen_clear'] = () => 'if(window.runtime?.pen) window.runtime.pen.clear();\n';
            jsGen.forBlock['pen_stamp'] = () => 'if(window.runtime?.pen) window.runtime.pen.stamp();\n';
            jsGen.forBlock['pen_down'] = () => 'if(window.runtime?.pen) window.runtime.pen.down();\n';
            jsGen.forBlock['pen_up'] = () => 'if(window.runtime?.pen) window.runtime.pen.up();\n';
            jsGen.forBlock['pen_set_color'] = (b: any) => {
                const color = jsGen.valueToCode(b, 'COLOR', 0) || "'#000000'";
                return `if(window.runtime?.pen) window.runtime.pen.setColor(${color});\n`;
            };
            jsGen.forBlock['pen_change_size'] = (b: any) => {
                const size = jsGen.valueToCode(b, 'SIZE', 0) || '1';
                return `if(window.runtime?.pen) window.runtime.pen.changeSize(${size});\n`;
            };
            jsGen.forBlock['pen_set_size'] = (b: any) => {
                const size = jsGen.valueToCode(b, 'SIZE', 0) || '1';
                return `if(window.runtime?.pen) window.runtime.pen.setSize(${size});\n`;
            };
        },
        getToolbox: () => [
            { kind: 'block', type: 'pen_clear' },
            { kind: 'block', type: 'pen_stamp' },
            { kind: 'block', type: 'pen_down' },
            { kind: 'block', type: 'pen_up' },
            { kind: 'block', type: 'pen_set_color', inputs: { COLOR: { shadow: { type: 'colour_picker', fields: { COLOUR: '#ff0000' } } } } },
            { kind: 'block', type: 'pen_change_size', inputs: { SIZE: { shadow: { type: 'math_number', fields: { NUM: 1 } } } } },
            { kind: 'block', type: 'pen_set_size', inputs: { SIZE: { shadow: { type: 'math_number', fields: { NUM: 1 } } } } }
        ]
    },
    face_detection: {
        id: 'face_detection',
        name: 'Face Detection',
        color: '#D43D41',
        icon: '👤',
        registerBlocks: (Blockly: any) => {
            const fdBlockDefs = [
                {
                    type: 'fd_camera', message0: '📷 camera %1',
                    args0: [{ type: 'field_dropdown', name: 'ACTION', options: [['on', 'on'], ['off', 'off'], ['flip', 'flip']] }],
                    previousStatement: null, nextStatement: null, colour: '#D43D41'
                },
                {
                    type: 'fd_analyze', message0: '👤 %1 face',
                    args0: [{ type: 'field_dropdown', name: 'ACTION', options: [['analyze', 'analyze'], ['show detection', 'show'], ['hide detection', 'hide']] }],
                    previousStatement: null, nextStatement: null, colour: '#D43D41'
                },
                { type: 'fd_count', message0: '👥 count faces', previousStatement: null, nextStatement: null, colour: '#D43D41' },
                { type: 'fd_guess_emotion', message0: '🙂 guess emotion', previousStatement: null, nextStatement: null, colour: '#D43D41' },
                {
                    type: 'fd_feature', message0: '👁️ %1',
                    args0: [{ type: 'field_dropdown', name: 'FEATURE', options: [['Eye L', 'left_eye'], ['Eye R', 'right_eye'], ['Smile', 'smile'], ['Nose', 'nose'], ['Face', 'face']] }],
                    previousStatement: null, nextStatement: null, colour: '#D43D41'
                },
                {
                    type: 'fd_when_emotion', message0: '🎭 when emotion %1',
                    args0: [{ type: 'field_dropdown', name: 'EMOTION', options: [['Smile', 'smile'], ['Angry', 'angry'], ['Sad', 'sad'], ['Neutral', 'neutral']] }],
                    nextStatement: true, colour: '#D43D41'
                },
                {
                    type: 'fd_face_x', message0: 'face %1 x position',
                    args0: [{ type: 'field_number', name: 'N', value: 1 }],
                    output: 'Number', colour: '#b71c1c'
                },
                {
                    type: 'fd_face_y', message0: 'face %1 y position',
                    args0: [{ type: 'field_number', name: 'N', value: 1 }],
                    output: 'Number', colour: '#b71c1c'
                },
                { type: 'fd_face_count', message0: 'face count', output: 'Number', colour: '#b71c1c' },
                { type: 'fd_emotion', message0: 'emotion', output: 'String', colour: '#b71c1c' },
            ];
            const newFdDefs = fdBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newFdDefs.length > 0) {
                Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newFdDefs));
            }
        },
        registerGenerators: (Blockly: any) => {
            const jsGen = (Blockly as any).JavaScript || (Blockly as any).javascriptGenerator;
            if (!jsGen) return;

            jsGen.forBlock['fd_camera'] = (b: any) => `if(window.runtime?.face) window.runtime.face.analyse('${b.getFieldValue("ACTION")}');\n`;
            jsGen.forBlock['fd_analyze'] = (b: any) => `if(window.runtime?.face) window.runtime.face.analyse('${b.getFieldValue("ACTION")}');\n`;
            jsGen.forBlock['fd_count'] = () => `if(window.runtime?.face){const s=window.__activeSpriteId;if(s&&window.spriteManager)window.spriteManager.getSprite(s)?.say(window.runtime.face.getFaceCount()+" faces");}\n`;
            jsGen.forBlock['fd_guess_emotion'] = () => `if(window.runtime?.face){const s=window.__activeSpriteId;if(s&&window.spriteManager)window.spriteManager.getSprite(s)?.say("Emotion: "+window.runtime.face.getEmotion());}\n`;
            jsGen.forBlock['fd_feature'] = (b: any) => `if(window.runtime?.face) window.runtime.face.detectFeature('${b.getFieldValue("FEATURE")}');\n`;
            jsGen.forBlock['fd_when_emotion'] = () => '// On Emotion\n';
            jsGen.forBlock['fd_face_x'] = (b: any) => [`window.runtime?.face?.getX(${b.getFieldValue('N')})||0`, 0];
            jsGen.forBlock['fd_face_y'] = (b: any) => [`window.runtime?.face?.getY(${b.getFieldValue('N')})||0`, 0];
            jsGen.forBlock['fd_face_count'] = () => [`window.runtime?.face?.getFaceCount()||0`, 0];
            jsGen.forBlock['fd_emotion'] = () => [`window.runtime?.face?.getEmotion()||''`, 0];
        },
        getToolbox: () => [
            { kind: 'block', type: 'fd_camera' },
            { kind: 'block', type: 'fd_analyze' },
            { kind: 'block', type: 'fd_face_count' },
            { kind: 'block', type: 'fd_emotion' },
            { kind: 'block', type: 'fd_face_x' },
            { kind: 'block', type: 'fd_face_y' },
            { kind: 'block', type: 'fd_count' },
            { kind: 'block', type: 'fd_guess_emotion' },
            { kind: 'block', type: 'fd_feature' },
            { kind: 'block', type: 'fd_when_emotion' },
        ]
    },
    object_detection: {
        id: 'object_detection',
        name: 'Object Detection',
        color: '#3dba7e',
        icon: '📷',
        registerBlocks: (Blockly: any) => {
            const odBlockDefs = [
                { type: 'object_detect', message0: 'detect objects in camera', previousStatement: null, nextStatement: null, colour: '#3dba7e' },
                { type: 'object_when_detected', message0: 'when %1 detected', args0: [{ type: 'field_dropdown', name: 'OBJECT', options: [['cat', 'cat'], ['dog', 'dog'], ['person', 'person'], ['car', 'car'], ['ball', 'ball']] }], previousStatement: null, nextStatement: null, colour: '#3dba7e' },
                { type: 'object_label', message0: 'label of object %1', args0: [{ type: 'field_number', name: 'N', value: 1, min: 1 }], output: 'String', colour: '#2e9e66' },
                { type: 'object_confidence', message0: 'confidence of object %1', args0: [{ type: 'field_number', name: 'N', value: 1, min: 1 }], output: 'Number', colour: '#2e9e66' },
                { type: 'object_x', message0: 'x of object %1', args0: [{ type: 'field_number', name: 'N', value: 1, min: 1 }], output: 'Number', colour: '#1e7e50' },
                { type: 'object_y', message0: 'y of object %1', args0: [{ type: 'field_number', name: 'N', value: 1, min: 1 }], output: 'Number', colour: '#1e7e50' },
                { type: 'object_count', message0: 'number of objects', output: 'Number', colour: '#1e7e50' }
            ];
            const newOdDefs = odBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newOdDefs.length > 0) {
                Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newOdDefs));
            }
        },
        registerGenerators: (Blockly: any) => {
            const jsGen = (Blockly as any).JavaScript || (Blockly as any).javascriptGenerator;
            if (!jsGen) return;

            jsGen.forBlock['object_detect'] = () => 'if(window.runtime?.objectDetection) await window.runtime.objectDetection.detectObjects();\n';
            jsGen.forBlock['object_when_detected'] = (b: any) => `// when ${b.getFieldValue("OBJECT")} detected\n`;
            jsGen.forBlock['object_label'] = (b: any) => [`window.runtime?.objectDetection?.getLabel(${b.getFieldValue('N')})||''`, 0];
            jsGen.forBlock['object_confidence'] = (b: any) => [`window.runtime?.objectDetection?.getConfidence(${b.getFieldValue('N')})||0`, 0];
            jsGen.forBlock['object_x'] = (b: any) => [`window.runtime?.objectDetection?.getX(${b.getFieldValue('N')})||0`, 0];
            jsGen.forBlock['object_y'] = (b: any) => [`window.runtime?.objectDetection?.getY(${b.getFieldValue('N')})||0`, 0];
            jsGen.forBlock['object_count'] = () => [`window.runtime?.objectDetection?.getNumberOfObjects()||0`, 0];
        },
        getToolbox: () => [
            { kind: 'block', type: 'object_detect' },
            { kind: 'block', type: 'object_when_detected' },
            { kind: 'block', type: 'object_count' },
            { kind: 'block', type: 'object_label' },
            { kind: 'block', type: 'object_confidence' },
            { kind: 'block', type: 'object_x' },
            { kind: 'block', type: 'object_y' },
        ]
    },
    music: {
        id: 'music',
        name: 'Music',
        color: '#c62828',
        icon: '🎵',
        registerBlocks: (Blockly: any) => {
            const musicBlockDefs = [
                { type: 'music_play_note', message0: 'play note %1 for %2 beats', args0: [{ type: 'field_number', name: 'NOTE', value: 60, min: 0, max: 127 }, { type: 'field_number', name: 'BEATS', value: 0.25, min: 0 }], previousStatement: null, nextStatement: null, colour: '#c62828' },
                { type: 'music_set_instrument', message0: 'set instrument %1', args0: [{ type: 'field_number', name: 'INST', value: 1, min: 1, max: 21 }], previousStatement: null, nextStatement: null, colour: '#c62828' },
                { type: 'music_play_drum', message0: 'play drum %1 for %2 beats', args0: [{ type: 'field_number', name: 'DRUM', value: 1, min: 1, max: 18 }, { type: 'field_number', name: 'BEATS', value: 0.25, min: 0 }], previousStatement: null, nextStatement: null, colour: '#b71c1c' },
                { type: 'music_set_tempo', message0: 'set tempo %1 bpm', args0: [{ type: 'field_number', name: 'BPM', value: 60, min: 20, max: 500 }], previousStatement: null, nextStatement: null, colour: '#b71c1c' },
                { type: 'music_change_tempo', message0: 'change tempo by %1', args0: [{ type: 'field_number', name: 'AMOUNT', value: 20 }], previousStatement: null, nextStatement: null, colour: '#7f0000' },
                { type: 'music_get_tempo', message0: 'tempo', output: 'Number', colour: '#7f0000' },
                { type: 'music_rest', message0: 'rest for %1 beats', args0: [{ type: 'field_number', name: 'BEATS', value: 0.25, min: 0 }], previousStatement: null, nextStatement: null, colour: '#c62828' }
            ];
            const newMusicDefs = musicBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newMusicDefs.length > 0) {
                Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newMusicDefs));
            }
        },
        registerGenerators: (Blockly: any) => {
            const jsGen = (Blockly as any).JavaScript || (Blockly as any).javascriptGenerator;
            if (!jsGen) return;

            jsGen.forBlock['music_play_note'] = (b: any) => `if(window.runtime?.music) await window.runtime.music.playNote(${b.getFieldValue('NOTE')}, ${b.getFieldValue('BEATS')});\n`;
            jsGen.forBlock['music_set_instrument'] = (b: any) => `if(window.runtime?.music) window.runtime.music.setInstrument(${b.getFieldValue('INST')});\n`;
            jsGen.forBlock['music_play_drum'] = (b: any) => `if(window.runtime?.music) await window.runtime.music.playDrum(${b.getFieldValue('DRUM')}, ${b.getFieldValue('BEATS')});\n`;
            jsGen.forBlock['music_set_tempo'] = (b: any) => `if(window.runtime?.music) window.runtime.music.setTempo(${b.getFieldValue('BPM')});\n`;
            jsGen.forBlock['music_change_tempo'] = (b: any) => `if(window.runtime?.music) window.runtime.music.changeTempoBy(${b.getFieldValue('AMOUNT')});\n`;
            jsGen.forBlock['music_get_tempo'] = () => [`window.runtime?.music?.getTempo()||60`, 0];
            jsGen.forBlock['music_rest'] = (b: any) => `if(window.runtime?.music) await window.runtime.music.rest(${b.getFieldValue('BEATS')});\n`;
        },
        getToolbox: () => [
            { kind: 'block', type: 'music_play_note' },
            { kind: 'block', type: 'music_set_instrument' },
            { kind: 'block', type: 'music_play_drum' },
            { kind: 'block', type: 'music_rest' },
            { kind: 'block', type: 'music_set_tempo' },
            { kind: 'block', type: 'music_change_tempo' },
            { kind: 'block', type: 'music_get_tempo' },
        ]
    },
    hand_pose: {
        id: 'hand_pose',
        name: 'Hand Pose',
        color: '#D43D41',
        icon: '✋',
        registerBlocks: (Blockly: any) => {
            const hpBlockDefs = [
                {
                    type: 'hp_camera', message0: '📷 camera %1',
                    args0: [{ type: 'field_dropdown', name: 'ACTION', options: [['on', 'on'], ['off', 'off'], ['flip', 'flip']] }],
                    previousStatement: null, nextStatement: null, colour: '#D43D41'
                },
                {
                    type: 'hp_analyze', message0: '✋ %1 hand',
                    args0: [{ type: 'field_dropdown', name: 'ACTION', options: [['analyze', 'analyze'], ['show detection', 'show'], ['hide detection', 'hide']] }],
                    previousStatement: null, nextStatement: null, colour: '#D43D41'
                },
                {
                    type: 'hp_move_with', message0: '👆 move %1 with %2',
                    args0: [
                        { type: 'field_label', text: 'sprite' },
                        { type: 'field_dropdown', name: 'FINGER', options: [['Thumb', 'thumb'], ['Index', 'index'], ['Middle', 'middle'], ['Ring', 'ring'], ['Pinky', 'pinky'], ['Base', 'base']] }
                    ],
                    previousStatement: null, nextStatement: null, colour: '#D43D41'
                },
                { type: 'hp_guess_sign', message0: '✌️ guess sign', previousStatement: null, nextStatement: null, colour: '#D43D41' },
                {
                    type: 'hp_when_sign', message0: '🖐️ when hand sign %1',
                    args0: [{ type: 'field_dropdown', name: 'SIGN', options: [['Peace', '2'], ['Open', '5'], ['Thumbs Up', 'thumbs_up']] }],
                    nextStatement: true, colour: '#D43D41'
                }
            ];
            const newHpDefs = hpBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newHpDefs.length > 0) {
                Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newHpDefs));
            }
        },
        registerGenerators: (Blockly: any) => {
            const jsGen = (Blockly as any).JavaScript || (Blockly as any).javascriptGenerator;
            if (!jsGen) return;

            jsGen.forBlock['hp_camera'] = (b: any) => `if(window.runtime?.handPose) window.runtime.handPose.analyse('${b.getFieldValue("ACTION")}');\n`;
            jsGen.forBlock['hp_analyze'] = (b: any) => `if(window.runtime?.handPose) window.runtime.handPose.analyse('${b.getFieldValue("ACTION")}');\n`;
            jsGen.forBlock['hp_move_with'] = (b: any) => `if(window.runtime?.handPose) window.runtime.handPose.moveSpriteToFinger('${b.getFieldValue("FINGER")}');\n`;
            jsGen.forBlock['hp_guess_sign'] = () => `if(window.runtime?.handPose){const s=window.__activeSpriteId;if(s&&window.spriteManager)window.spriteManager.getSprite(s)?.say("Sign: "+window.runtime.handPose.getSign());}\n`;
            jsGen.forBlock['hp_when_sign'] = () => '// On Hand Sign\n';
        },
        getToolbox: () => [
            { kind: 'block', type: 'hp_camera' },
            { kind: 'block', type: 'hp_analyze' },
            { kind: 'block', type: 'hp_move_with' },
            { kind: 'block', type: 'hp_guess_sign' },
            { kind: 'block', type: 'hp_when_sign' },
        ]
    }
};

export function registerExtensions(Blockly: any, extensionIds: string[]) {
    extensionIds.forEach(id => {
        const ext = EXTENSIONS[id];
        if (ext) {
            ext.registerBlocks(Blockly);
            ext.registerGenerators(Blockly);
        }
    });
}
