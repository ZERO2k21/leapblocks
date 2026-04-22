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
                { type: 'pen_clear', message0: 'erase all', previousStatement: null, nextStatement: null, colour: '#0FBD8C' },
                { type: 'pen_stamp', message0: 'stamp', previousStatement: null, nextStatement: null, colour: '#0FBD8C' },
                { type: 'pen_penDown', message0: 'pen down', previousStatement: null, nextStatement: null, colour: '#0FBD8C' },
                { type: 'pen_penUp', message0: 'pen up', previousStatement: null, nextStatement: null, colour: '#0FBD8C' },
                { type: 'pen_setPenColorToColor', message0: 'set pen color to %1', args0: [{ type: 'field_colour', name: 'COLOR', colour: '#ff0000' }], previousStatement: null, nextStatement: null, colour: '#0FBD8C' },
                { type: 'pen_changePenSizeBy', message0: 'change pen size by %1', args0: [{ type: 'field_number', name: 'SIZE', value: 1 }], previousStatement: null, nextStatement: null, colour: '#0FBD8C' },
                { type: 'pen_setPenSizeTo', message0: 'set pen size to %1', args0: [{ type: 'field_number', name: 'SIZE', value: 1 }], previousStatement: null, nextStatement: null, colour: '#0FBD8C' }
            ];
            const newPenDefs = penBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newPenDefs.length > 0) {
                Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newPenDefs));
            }
        },
        registerGenerators: (_Blockly: any) => {
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
        },
        getToolbox: () => [
            { kind: 'block', type: 'pen_clear' },
            { kind: 'block', type: 'pen_stamp' },
            { kind: 'block', type: 'pen_penDown' },
            { kind: 'block', type: 'pen_penUp' },
            { kind: 'block', type: 'pen_setPenColorToColor' },
            { kind: 'block', type: 'pen_changePenSizeBy' },
            { kind: 'block', type: 'pen_setPenSizeTo' }
        ]
    },
    face_detection: {
        id: 'face_detection',
        name: 'Face Detection',
        color: '#D43D41',
        icon: '👤',
        registerBlocks: (Blockly: any) => {
            const fdBlockDefs = [
                // ── Settings ──────────────────────────────────────────────
                {
                    type: 'fd_video_on_stage',
                    message0: 'turn %1 video on stage with %2 % transparency',
                    args0: [
                        { type: 'field_dropdown', name: 'STATE', options: [['on', 'on'], ['off', 'off']] },
                        { type: 'field_number', name: 'TRANSPARENCY', value: 0, min: 0, max: 100 }
                    ],
                    previousStatement: null, nextStatement: null, colour: '#D43D41'
                },
                {
                    type: 'fd_show_bounding_box',
                    message0: '%1 bounding box',
                    args0: [{ type: 'field_dropdown', name: 'STATE', options: [['show', 'show'], ['hide', 'hide']] }],
                    previousStatement: null, nextStatement: null, colour: '#D43D41'
                },
                {
                    type: 'fd_set_threshold',
                    message0: 'set detection threshold to %1',
                    args0: [{ type: 'field_dropdown', name: 'THRESHOLD', options: [['0.5', '0.5'], ['0.6', '0.6'], ['0.7', '0.7'], ['0.8', '0.8'], ['0.9', '0.9']] }],
                    previousStatement: null, nextStatement: null, colour: '#D43D41'
                },
                // ── Detection ─────────────────────────────────────────────
                {
                    type: 'fd_analyse_image',
                    message0: 'analyse image from %1',
                    args0: [{ type: 'field_dropdown', name: 'SOURCE', options: [['camera', 'camera'], ['image', 'image']] }],
                    previousStatement: null, nextStatement: null, colour: '#D43D41'
                },
                {
                    type: 'fd_get_num_faces',
                    message0: 'get # faces',
                    previousStatement: null, nextStatement: null, colour: '#D43D41'
                },
                {
                    type: 'fd_get_expression',
                    message0: 'get expression of face %1',
                    args0: [{ type: 'field_number', name: 'N', value: 1, min: 1 }],
                    output: 'String', colour: '#b71c1c'
                },
                {
                    type: 'fd_get_dimension',
                    message0: 'get %1 of face %2',
                    args0: [
                        { type: 'field_dropdown', name: 'DIM', options: [['width', 'width'], ['height', 'height']] },
                        { type: 'field_number', name: 'N', value: 1, min: 1 }
                    ],
                    output: 'Number', colour: '#b71c1c'
                },
                {
                    type: 'fd_is_expression',
                    message0: 'is expression of face %1 %2',
                    args0: [
                        { type: 'field_number', name: 'N', value: 1, min: 1 },
                        { type: 'field_dropdown', name: 'EXPRESSION', options: [['happy', 'happy'], ['sad', 'sad'], ['angry', 'angry'], ['surprised', 'surprised'], ['neutral', 'neutral']] }
                    ],
                    output: 'Boolean', colour: '#b71c1c'
                },
                {
                    type: 'fd_get_xy_position',
                    message0: 'get %1 position %2 of face %3',
                    args0: [
                        { type: 'field_dropdown', name: 'AXIS', options: [['x', 'x'], ['y', 'y']] },
                        { type: 'field_dropdown', name: 'DUMMY', options: [['', '']] },
                        { type: 'field_number', name: 'N', value: 1, min: 1 }
                    ],
                    output: 'Number', colour: '#b71c1c'
                },
                {
                    type: 'fd_get_landmark_pos',
                    message0: 'get %1 position of %2 of face %3',
                    args0: [
                        { type: 'field_dropdown', name: 'AXIS', options: [['x', 'x'], ['y', 'y']] },
                        { type: 'field_dropdown', name: 'LANDMARK', options: [['left eye', 'left_eye'], ['right eye', 'right_eye'], ['nose', 'nose'], ['mouth', 'mouth'], ['left ear', 'left_ear'], ['right ear', 'right_ear']] },
                        { type: 'field_number', name: 'N', value: 1, min: 1 }
                    ],
                    output: 'Number', colour: '#b71c1c'
                },
                {
                    type: 'fd_get_landmark_num',
                    message0: 'get %1 position of landmark %2 of face %3',
                    args0: [
                        { type: 'field_dropdown', name: 'AXIS', options: [['x', 'x'], ['y', 'y']] },
                        { type: 'field_number', name: 'LANDMARK_N', value: 1, min: 1 },
                        { type: 'field_number', name: 'N', value: 1, min: 1 }
                    ],
                    output: 'Number', colour: '#b71c1c'
                },
                // Reporter blocks
                { type: 'fd_face_count', message0: 'face count', output: 'Number', colour: '#b71c1c' },
                { type: 'fd_emotion', message0: 'emotion', output: 'String', colour: '#b71c1c' },
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
                // ── Face Recognition: Training ─────────────────────────────
                {
                    type: 'fd_add_class',
                    message0: 'add class %1 as %2 from %3',
                    args0: [
                        { type: 'field_number', name: 'CLASS_N', value: 1, min: 1 },
                        { type: 'field_input', name: 'CLASS_NAME', text: 'Jarvis' },
                        { type: 'field_dropdown', name: 'SOURCE', options: [['camera', 'camera'], ['image', 'image']] }
                    ],
                    previousStatement: null, nextStatement: null, colour: '#D43D41'
                },
                {
                    type: 'fd_reset_class',
                    message0: 'reset class',
                    previousStatement: null, nextStatement: null, colour: '#D43D41'
                },
                // ── Face Recognition: Testing ──────────────────────────────
                {
                    type: 'fd_do_face_matching',
                    message0: 'do face matching on %1',
                    args0: [{ type: 'field_dropdown', name: 'SOURCE', options: [['camera', 'camera'], ['image', 'image']] }],
                    previousStatement: null, nextStatement: null, colour: '#D43D41'
                },
                {
                    type: 'fd_is_class_detected',
                    message0: 'is %1 class detected',
                    args0: [{ type: 'field_number', name: 'CLASS_N', value: 1, min: 1 }],
                    output: 'Boolean', colour: '#b71c1c'
                },
                {
                    type: 'fd_get_class_detected',
                    message0: 'get class of face %1 detected',
                    args0: [{ type: 'field_number', name: 'N', value: 1, min: 1 }],
                    output: 'String', colour: '#b71c1c'
                },
                // Legacy blocks (kept for backward compat)
                {
                    type: 'fd_camera', message0: 'camera %1',
                    args0: [{ type: 'field_dropdown', name: 'ACTION', options: [['on', 'on'], ['off', 'off'], ['flip', 'flip']] }],
                    previousStatement: null, nextStatement: null, colour: '#D43D41'
                },
                {
                    type: 'fd_analyze', message0: '%1 face',
                    args0: [{ type: 'field_dropdown', name: 'ACTION', options: [['analyze', 'analyze'], ['show detection', 'show'], ['hide detection', 'hide']] }],
                    previousStatement: null, nextStatement: null, colour: '#D43D41'
                },
            ];
            const newFdDefs = fdBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newFdDefs.length > 0) {
                Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newFdDefs));
            }
        },
        registerGenerators: (_Blockly: any) => {
            const jsGen = javascriptGenerator;
            if (!jsGen) return;

            // Settings
            jsGen.forBlock['fd_video_on_stage'] = (b: any) => {
                const state = b.getFieldValue('STATE');
                const t = b.getFieldValue('TRANSPARENCY') || 0;
                return `if(window.__setCameraOn) window.__setCameraOn(${state === 'on'});\nif(window.runtime?.face) window.runtime.face.setVideoTransparency?.(${t});\n`;
            };
            jsGen.forBlock['fd_show_bounding_box'] = (b: any) =>
                `if(window.runtime?.face) window.runtime.face.setBoundingBox?.('${b.getFieldValue("STATE")}');\n`;
            jsGen.forBlock['fd_set_threshold'] = (b: any) =>
                `if(window.runtime?.face) window.runtime.face.setThreshold?.(${b.getFieldValue("THRESHOLD")});\n`;

            // Detection
            jsGen.forBlock['fd_analyse_image'] = (b: any) => {
                const src = b.getFieldValue('SOURCE');
                return `if(window.__setCameraOn) window.__setCameraOn(${src === 'camera'});\nif(window.runtime?.face) window.runtime.face.analyse('analyze');\n`;
            };
            jsGen.forBlock['fd_get_num_faces'] = () =>
                `if(window.runtime?.face){const _s=window.__activeSpriteId;if(_s&&window.spriteManager)window.spriteManager.getSprite(_s)?.say(window.runtime.face.getFaceCount()+" faces");}\n`;
            jsGen.forBlock['fd_get_expression'] = (b: any) => [`window.runtime?.face?.getEmotion()||''`, 0];
            jsGen.forBlock['fd_get_dimension'] = (b: any) => {
                const dim = b.getFieldValue('DIM');
                const n = b.getFieldValue('N') || 1;
                const method = dim === 'width' ? 'getWidth' : 'getHeight';
                return [`window.runtime?.face?.${method}(${n})||0`, 0];
            };
            jsGen.forBlock['fd_is_expression'] = (b: any) =>
                [`(window.runtime?.face?.getEmotion()||'').toLowerCase()==='${b.getFieldValue("EXPRESSION")}'`, 0];
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
                `if(window.runtime?.face) window.runtime.face.analyse('${b.getFieldValue("ACTION")}');\n`;
        },
        getToolbox: () => [
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
        registerGenerators: (_Blockly: any) => {
            const jsGen = javascriptGenerator;
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
        registerGenerators: (_Blockly: any) => {
            const jsGen = javascriptGenerator;
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
        getToolbox: () => [
            { kind: 'block', type: 'hp_camera' },
            { kind: 'block', type: 'hp_analyze' },
            { kind: 'block', type: 'hp_move_with' },
            { kind: 'block', type: 'hp_guess_sign' },
            { kind: 'block', type: 'hp_when_sign' },
            { kind: 'block', type: 'hp_finger_x' },
            { kind: 'block', type: 'hp_finger_y' },
        ],
        registerBlocks: (Blockly: any) => {
            const hpBlockDefs = [
                {
                    type: 'hp_camera', message0: 'camera %1',
                    args0: [{ type: 'field_dropdown', name: 'ACTION', options: [['on', 'on'], ['off', 'off'], ['flip', 'flip']] }],
                    previousStatement: null, nextStatement: null, colour: '#D43D41'
                },
                {
                    type: 'hp_analyze', message0: '%1 hand',
                    args0: [{ type: 'field_dropdown', name: 'ACTION', options: [['analyze', 'analyze'], ['show detection', 'show'], ['hide detection', 'hide']] }],
                    previousStatement: null, nextStatement: null, colour: '#D43D41'
                },
                {
                    type: 'hp_move_with', message0: 'move sprite with %1',
                    args0: [
                        { type: 'field_dropdown', name: 'FINGER', options: [['Thumb', 'thumb'], ['Index', 'index'], ['Middle', 'middle'], ['Ring', 'ring'], ['Pinky', 'pinky'], ['Base', 'base']] }
                    ],
                    previousStatement: null, nextStatement: null, colour: '#D43D41'
                },
                { type: 'hp_guess_sign', message0: 'guess sign', previousStatement: null, nextStatement: null, colour: '#D43D41' },
                {
                    type: 'hp_when_sign', message0: 'when hand sign %1',
                    args0: [{ type: 'field_dropdown', name: 'SIGN', options: [['Peace', '2'], ['Open', '5'], ['Thumbs Up', 'thumbs_up']] }],
                    nextStatement: true, colour: '#D43D41'
                },
                {
                    type: 'hp_finger_x', message0: '%1 x position',
                    args0: [{ type: 'field_dropdown', name: 'FINGER', options: [['Thumb', 'thumb'], ['Index', 'index'], ['Middle', 'middle'], ['Ring', 'ring'], ['Pinky', 'pinky'], ['Base', 'base']] }],
                    output: 'Number', colour: '#b71c1c'
                },
                {
                    type: 'hp_finger_y', message0: '%1 y position',
                    args0: [{ type: 'field_dropdown', name: 'FINGER', options: [['Thumb', 'thumb'], ['Index', 'index'], ['Middle', 'middle'], ['Ring', 'ring'], ['Pinky', 'pinky'], ['Base', 'base']] }],
                    output: 'Number', colour: '#b71c1c'
                }
            ];
            const newHpDefs = hpBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newHpDefs.length > 0) {
                Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newHpDefs));
            }
        },
        registerGenerators: (_Blockly: any) => {
            const jsGen = javascriptGenerator;
            if (!jsGen) return;

            jsGen.forBlock['hp_camera'] = (b: any) => `if(window.runtime?.handPose) window.runtime.handPose.analyse('${b.getFieldValue("ACTION")}');\n`;
            jsGen.forBlock['hp_analyze'] = (b: any) => `if(window.runtime?.handPose) window.runtime.handPose.analyse('${b.getFieldValue("ACTION")}');\n`;
            jsGen.forBlock['hp_move_with'] = (b: any) => `if(window.runtime?.handPose) window.runtime.handPose.moveSpriteToFinger('${b.getFieldValue("FINGER")}');\n`;
            jsGen.forBlock['hp_guess_sign'] = () => `if(window.runtime?.handPose){const s=window.__activeSpriteId;if(s&&window.spriteManager)window.spriteManager.getSprite(s)?.say("Sign: "+window.runtime.handPose.getSign());}\n`;
            jsGen.forBlock['hp_when_sign'] = () => '// On Hand Sign\n';
            jsGen.forBlock['hp_finger_x'] = (b: any) => [`window.runtime?.handPose?.getLandmarkX('${b.getFieldValue("FINGER")}')||0`, 0];
            jsGen.forBlock['hp_finger_y'] = (b: any) => [`window.runtime?.handPose?.getLandmarkY('${b.getFieldValue("FINGER")}')||0`, 0];
        }

    },
    body_detection: {
        id: 'body_detection',
        name: 'Body Detection',
        color: '#D43D41',
        icon: '🤸',
        registerBlocks: (Blockly: any) => {
            const bdBlockDefs = [
                { type: 'bd_camera', message0: 'camera %1', args0: [{ type: 'field_dropdown', name: 'ACTION', options: [['on', 'on'], ['off', 'off']] }], previousStatement: null, nextStatement: null, colour: '#D43D41' },
                { type: 'bd_analyze', message0: '%1 body', args0: [{ type: 'field_dropdown', name: 'ACTION', options: [['analyze', 'analyze'], ['on', 'on'], ['off', 'off']] }], previousStatement: null, nextStatement: null, colour: '#D43D41' },
                { type: 'bd_body_count', message0: 'body count', output: 'Number', colour: '#b71c1c' },
                { type: 'bd_get_x', message0: 'x position of %1 of body %2', args0: [{ type: 'field_dropdown', name: 'LANDMARK', options: [['nose', 'nose'], ['left shoulder', 'left_shoulder'], ['right shoulder', 'right_shoulder']] }, { type: 'field_number', name: 'N', value: 1 }], output: 'Number', colour: '#b71c1c' },
                { type: 'bd_get_y', message0: 'y position of %1 of body %2', args0: [{ type: 'field_dropdown', name: 'LANDMARK', options: [['nose', 'nose'], ['left shoulder', 'left_shoulder'], ['right shoulder', 'right_shoulder']] }, { type: 'field_number', name: 'N', value: 1 }], output: 'Number', colour: '#b71c1c' }
            ];
            const newDefs = bdBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newDefs.length > 0) Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newDefs));
        },
        registerGenerators: (_Blockly: any) => {
            const jsGen = javascriptGenerator;
            if (!jsGen) return;
            jsGen.forBlock['bd_camera'] = (b: any) => `if(window.__setCameraOn) window.__setCameraOn(${b.getFieldValue('ACTION') === 'on'});\n`;
            jsGen.forBlock['bd_analyze'] = (b: any) => `if(window.runtime?.bodyDetection) window.runtime.bodyDetection.analyse('${b.getFieldValue('ACTION')}');\n`;
            jsGen.forBlock['bd_body_count'] = () => [`window.runtime?.bodyDetection?.getBodyCount()||0`, 0];
            jsGen.forBlock['bd_get_x'] = (b: any) => [`window.runtime?.bodyDetection?.getX(${b.getFieldValue('N')},'${b.getFieldValue('LANDMARK')}')||0`, 0];
            jsGen.forBlock['bd_get_y'] = (b: any) => [`window.runtime?.bodyDetection?.getY(${b.getFieldValue('N')},'${b.getFieldValue('LANDMARK')}')||0`, 0];
        },
        getToolbox: () => [
            { kind: 'block', type: 'bd_camera' },
            { kind: 'block', type: 'bd_analyze' },
            { kind: 'block', type: 'bd_body_count' },
            { kind: 'block', type: 'bd_get_x' },
            { kind: 'block', type: 'bd_get_y' },
        ]
    },
    ml_machine_learning: {
        id: 'ml_machine_learning',
        name: 'ML Environment',
        color: '#D43D41',
        icon: '🤖',
        registerBlocks: (Blockly: any) => {
            const mlBlockDefs = [
                { type: 'ml_analyze', message0: '%1 classification', args0: [{ type: 'field_dropdown', name: 'ACTION', options: [['on', 'on'], ['off', 'off']] }], previousStatement: null, nextStatement: null, colour: '#D43D41' },
                { type: 'ml_get_prediction', message0: 'prediction', output: 'String', colour: '#b71c1c' },
                { type: 'ml_get_confidence', message0: 'confidence', output: 'Number', colour: '#b71c1c' },
                { type: 'ml_is_class', message0: 'prediction is %1?', args0: [{ type: 'field_input', name: 'CLASS', text: 'Class 1' }], output: 'Boolean', colour: '#b71c1c' }
            ];
            const newDefs = mlBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newDefs.length > 0) Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newDefs));
        },
        registerGenerators: (_Blockly: any) => {
            const jsGen = javascriptGenerator;
            if (!jsGen) return;
            jsGen.forBlock['ml_analyze'] = (b: any) => `if(window.runtime?.ml) window.runtime.ml.analyse('${b.getFieldValue('ACTION')}');\n`;
            jsGen.forBlock['ml_get_prediction'] = () => [`window.runtime?.ml?.getPrediction()||''`, 0];
            jsGen.forBlock['ml_get_confidence'] = () => [`window.runtime?.ml?.getConfidence()||0`, 0];
            jsGen.forBlock['ml_is_class'] = (b: any) => [`window.runtime?.ml?.getPrediction()==='${b.getFieldValue('CLASS')}'`, 0];
        },
        getToolbox: () => [
            { kind: 'block', type: 'ml_analyze' },
            { kind: 'block', type: 'ml_get_prediction' },
            { kind: 'block', type: 'ml_get_confidence' },
            { kind: 'block', type: 'ml_is_class' },
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
