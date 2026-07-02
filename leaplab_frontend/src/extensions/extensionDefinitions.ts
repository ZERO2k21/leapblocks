import { javascriptGenerator } from '@blockly-runtime';

export interface ExtensionDef {
    id: string;
    name: string;
    color: string;
    icon: string;
    registerBlocks: (Blockly: any) => void;
    registerGenerators: (Blockly: any) => void;
    getToolbox: () => any[];
    registerIgniteBlocks?: (Blockly: any) => void;
    getIgniteToolbox?: () => any[];
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
                { type: 'pen_setPenColorToNumber', message0: 'set pen color to %1', args0: [{ type: 'field_number', name: 'COLOR', value: 50, min: 0, max: 200 }], previousStatement: null, nextStatement: null, colour: '#0FBD8C' },
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
            jsGen.forBlock['pen_setPenColorToNumber'] = (b: any) => {
                const value = Number(b.getFieldValue('COLOR')) || 0;
                return `if(window.runtime?.pen) window.runtime.pen.setColorByNumber(${value});\n`;
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
            { kind: 'block', type: 'pen_setPenColorToNumber' },
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
        ],
        registerIgniteBlocks: (Blockly: any) => {
            const getTarget = () => 'window.activeSpriteId || "robot_default"';
            const igniteBlockDefs = [
                {
                    type: 'fd_analyse_image',
                    message0: 'analyse image from %1',
                    args0: [{ type: 'field_dropdown', name: 'SOURCE', options: [['camera', 'camera'], ['image', 'image']] }],
                    previousStatement: null, nextStatement: null, colour: '#D43D41'
                },
                { type: 'fd_face_count', message0: 'face count', output: 'Number', colour: '#b71c1c' },
                { type: 'fd_emotion', message0: 'emotion', output: 'String', colour: '#b71c1c' },
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
                    type: 'fd_face_x',
                    message0: 'face %1 x position',
                    args0: [{ type: 'field_number', name: 'N', value: 1 }],
                    output: 'Number', colour: '#b71c1c'
                },
                {
                    type: 'fd_face_y',
                    message0: 'face %1 y position',
                    args0: [{ type: 'field_number', name: 'N', value: 1 }],
                    output: 'Number', colour: '#b71c1c'
                },
                {
                    type: 'fd_camera',
                    message0: 'camera %1',
                    args0: [{ type: 'field_dropdown', name: 'ACTION', options: [['on', 'on'], ['off', 'off'], ['flip', 'flip']] }],
                    previousStatement: null, nextStatement: null, colour: '#D43D41'
                },
                // Bridge blocks — accept reporter inputs so face detection combines with other blocks
                {
                    type: 'fd_say_expression',
                    message0: '💬 say %1',
                    args0: [{ type: 'input_value', name: 'EXPRESSION', check: ['String', 'Number'] }],
                    previousStatement: null, nextStatement: null, colour: '#D43D41'
                },
                {
                    type: 'fd_go_to_face',
                    message0: 'go to x %1 y %2',
                    args0: [
                        { type: 'input_value', name: 'X', check: 'Number' },
                        { type: 'input_value', name: 'Y', check: 'Number' }
                    ],
                    previousStatement: null, nextStatement: null, colour: '#D43D41'
                },
                {
                    type: 'fd_if_expression',
                    message0: 'if %1 then %2',
                    args0: [
                        { type: 'input_value', name: 'CONDITION', check: 'Boolean' },
                        { type: 'input_statement', name: 'DO' }
                    ],
                    previousStatement: null, nextStatement: null, colour: '#D43D41'
                },
            ];
            const newDefs = igniteBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newDefs.length > 0) {
                Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newDefs));
            }

            // Register generators for bridge blocks (Ignite-only)
            const jsGen = javascriptGenerator;
            if (jsGen) {
                jsGen.forBlock['fd_say_expression'] = (b: any) => {
                    const expr = javascriptGenerator.valueToCode(b, 'EXPRESSION', 0) || "''";
                    return `say(${getTarget()}, String(${expr}));\nawait window.wait(window.getAnimationDelay ? window.getAnimationDelay() : 0.5);\n`;
                };
                jsGen.forBlock['fd_go_to_face'] = (b: any) => {
                    const x = javascriptGenerator.valueToCode(b, 'X', 0) || '0';
                    const y = javascriptGenerator.valueToCode(b, 'Y', 0) || '0';
                    return `goToLocation(${getTarget()}, ${x}, ${y});\nawait window.wait(window.getAnimationDelay ? window.getAnimationDelay() : 0.5);\n`;
                };
                jsGen.forBlock['fd_if_expression'] = (b: any) => {
                    const cond = javascriptGenerator.valueToCode(b, 'CONDITION', 0) || 'false';
                    const body = javascriptGenerator.statementToCode(b, 'DO');
                    return `if (${cond}) {\n${body}\n}\n`;
                };
            }
        },
        getIgniteToolbox: () => [
            { kind: 'block', type: 'fd_analyse_image' },
            { kind: 'block', type: 'fd_camera' },
            { kind: 'block', type: 'fd_face_count' },
            { kind: 'block', type: 'fd_emotion' },
            { kind: 'block', type: 'fd_is_expression' },
            { kind: 'block', type: 'fd_face_x' },
            { kind: 'block', type: 'fd_face_y' },
            { kind: 'block', type: 'fd_say_expression' },
            { kind: 'block', type: 'fd_go_to_face' },
            { kind: 'block', type: 'fd_if_expression' },
        ],
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
            { kind: 'label', text: 'Play' },
            { kind: 'block', type: 'music_play_note' },
            { kind: 'block', type: 'music_play_drum' },
            { kind: 'block', type: 'music_rest' },
            { kind: 'label', text: 'Settings' },
            { kind: 'block', type: 'music_set_instrument' },
            { kind: 'block', type: 'music_set_tempo' },
            { kind: 'block', type: 'music_change_tempo' },
            { kind: 'label', text: 'Reporters' },
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
                    nextStatement: true, colour: '#D43D41',
                    hat: 'event'
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

            jsGen.forBlock['hp_camera'] = (b: any) => {
                const action = b.getFieldValue('ACTION');
                return `if(window.__setCameraOn) window.__setCameraOn(${action === 'on'});\nif(window.runtime?.handPose) window.runtime.handPose.analyse('${action}');\n`;
            };
            jsGen.forBlock['hp_analyze'] = (b: any) => {
                const action = b.getFieldValue('ACTION');
                const needsCamera = action === 'analyze';
                return `${needsCamera ? 'if(window.__setCameraOn) window.__setCameraOn(true);\n' : ''}if(window.runtime?.handPose) window.runtime.handPose.analyse('${action}');\n`;
            };
            jsGen.forBlock['hp_move_with'] = (b: any) => `if(window.runtime?.handPose) window.runtime.handPose.moveSpriteToFinger('${b.getFieldValue("FINGER")}');\n`;
            jsGen.forBlock['hp_guess_sign'] = () => `if(window.runtime?.handPose){const s=window.__activeSpriteId||window.activeSpriteId;if(s&&window.spriteManager)window.spriteManager.getSprite(s)?.say("Sign: "+window.runtime.handPose.getSign());}\n`;
            jsGen.forBlock['hp_when_sign'] = () => '// On Hand Sign\n';
            jsGen.forBlock['hp_finger_x'] = (b: any) => [`window.runtime?.handPose?.getLandmarkX('${b.getFieldValue("FINGER")}')||0`, 0];
            jsGen.forBlock['hp_finger_y'] = (b: any) => [`window.runtime?.handPose?.getLandmarkY('${b.getFieldValue("FINGER")}')||0`, 0];
        }

    },
    human_body: {
        id: 'human_body',
        name: 'Human Body Detection',
        color: '#D43D41',
        icon: '🤸',
        registerBlocks: (Blockly: any) => {
            const bdBlockDefs = [
                { type: 'bd_camera', message0: 'camera %1', args0: [{ type: 'field_dropdown', name: 'STATE', options: [['on', 'on'], ['off', 'off']] }], previousStatement: null, nextStatement: null, colour: '#D43D41', tooltip: 'Turn camera on or off for body detection' },
                { type: 'bd_analyze', message0: 'detect body pose', previousStatement: null, nextStatement: null, colour: '#D43D41', tooltip: 'Run MoveNet pose detection on the current camera frame' },
                { type: 'bd_body_count', message0: 'body count', output: 'Number', colour: '#D43D41', tooltip: 'Number of people detected' },
                {
                    type: 'bd_get_x', message0: 'x position of %1 of body %2', args0: [
                        {
                            type: 'field_dropdown', name: 'PART', options: [
                                ['nose', 'nose'], ['left eye', 'left_eye'], ['right eye', 'right_eye'],
                                ['left ear', 'left_ear'], ['right ear', 'right_ear'],
                                ['left shoulder', 'left_shoulder'], ['right shoulder', 'right_shoulder'],
                                ['left elbow', 'left_elbow'], ['right elbow', 'right_elbow'],
                                ['left wrist', 'left_wrist'], ['right wrist', 'right_wrist'],
                                ['left hip', 'left_hip'], ['right hip', 'right_hip'],
                                ['left knee', 'left_knee'], ['right knee', 'right_knee'],
                                ['left ankle', 'left_ankle'], ['right ankle', 'right_ankle']
                            ]
                        },
                        { type: 'field_number', name: 'BODY', value: 1, min: 1 }
                    ], output: 'Number', colour: '#D43D41', tooltip: 'X position of a body part (stage coords)'
                },
                {
                    type: 'bd_get_y', message0: 'y position of %1 of body %2', args0: [
                        {
                            type: 'field_dropdown', name: 'PART', options: [
                                ['nose', 'nose'], ['left eye', 'left_eye'], ['right eye', 'right_eye'],
                                ['left ear', 'left_ear'], ['right ear', 'right_ear'],
                                ['left shoulder', 'left_shoulder'], ['right shoulder', 'right_shoulder'],
                                ['left elbow', 'left_elbow'], ['right elbow', 'right_elbow'],
                                ['left wrist', 'left_wrist'], ['right wrist', 'right_wrist'],
                                ['left hip', 'left_hip'], ['right hip', 'right_hip'],
                                ['left knee', 'left_knee'], ['right knee', 'right_knee'],
                                ['left ankle', 'left_ankle'], ['right ankle', 'right_ankle']
                            ]
                        },
                        { type: 'field_number', name: 'BODY', value: 1, min: 1 }
                    ], output: 'Number', colour: '#D43D41', tooltip: 'Y position of a body part (stage coords)'
                },
                {
                    type: 'bd_is_part_visible', message0: 'is %1 of body %2 visible?', args0: [
                        {
                            type: 'field_dropdown', name: 'PART', options: [
                                ['nose', 'nose'], ['left wrist', 'left_wrist'], ['right wrist', 'right_wrist'],
                                ['left knee', 'left_knee'], ['right knee', 'right_knee'],
                                ['left ankle', 'left_ankle'], ['right ankle', 'right_ankle']
                            ]
                        },
                        { type: 'field_number', name: 'BODY', value: 1, min: 1 }
                    ], output: 'Boolean', colour: '#D43D41', tooltip: 'Check if a body part is detected with high confidence'
                },
            ];
            const newDefs = bdBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newDefs.length > 0) Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newDefs));
        },
        registerGenerators: (_Blockly: any) => {
            const jsGen = javascriptGenerator;
            if (!jsGen) return;
            jsGen.forBlock['bd_camera'] = (b: any) => `if(window.runtime?.bodyDetection) window.runtime.bodyDetection.setCameraOn("${b.getFieldValue('STATE')}");\n`;
            jsGen.forBlock['bd_analyze'] = () => 'if(window.runtime?.bodyDetection) window.runtime.bodyDetection.analyse("analyze");\n';
            jsGen.forBlock['bd_body_count'] = () => [`window.runtime?.bodyDetection?.getBodyCount()||0`, 0];
            jsGen.forBlock['bd_get_x'] = (b: any) => [`window.runtime?.bodyDetection?.getX('${b.getFieldValue('PART')}', ${b.getFieldValue('BODY') || 1})||0`, 0];
            jsGen.forBlock['bd_get_y'] = (b: any) => [`window.runtime?.bodyDetection?.getY('${b.getFieldValue('PART')}', ${b.getFieldValue('BODY') || 1})||0`, 0];
            jsGen.forBlock['bd_is_part_visible'] = (b: any) => {
                const part = b.getFieldValue('PART');
                const body = b.getFieldValue('BODY') || 1;
                return [`(window.runtime?.bodyDetection?.getX('${part}',${body})!==0||window.runtime?.bodyDetection?.getY('${part}',${body})!==0)`, 0];
            };
        },
        getToolbox: () => [
            { kind: 'label', text: 'Camera' },
            { kind: 'block', type: 'bd_camera' },
            { kind: 'block', type: 'bd_analyze' },
            { kind: 'label', text: 'Body Parts' },
            { kind: 'block', type: 'bd_body_count' },
            { kind: 'block', type: 'bd_get_x' },
            { kind: 'block', type: 'bd_get_y' },
            { kind: 'block', type: 'bd_is_part_visible' },
        ]
    },
    ml_machine_learning: {
        id: 'ml_machine_learning',
        name: 'ML Environment',
        color: '#D43D41',
        icon: '🤖',
        registerBlocks: (Blockly: any) => {
            const mlBlockDefs = [
                // Training
                { type: 'ml_add_sample', message0: 'add camera sample as %1', args0: [{ type: 'field_input', name: 'LABEL', text: 'class1' }], previousStatement: null, nextStatement: null, colour: '#D43D41', tooltip: 'Capture current camera frame and add as training sample for the given class label' },
                { type: 'ml_train', message0: 'train model', previousStatement: null, nextStatement: null, colour: '#D43D41', tooltip: 'Train the classifier with all collected samples' },
                { type: 'ml_clear_all', message0: 'clear all samples', previousStatement: null, nextStatement: null, colour: '#D43D41', tooltip: 'Remove all training samples and reset the model' },
                { type: 'ml_clear_class', message0: 'clear samples of %1', args0: [{ type: 'field_input', name: 'LABEL', text: 'class1' }], previousStatement: null, nextStatement: null, colour: '#D43D41', tooltip: 'Remove all samples for the given class' },
                // Detection
                { type: 'ml_analyze', message0: '%1 classification', args0: [{ type: 'field_dropdown', name: 'ACTION', options: [['start', 'on'], ['stop', 'off']] }], previousStatement: null, nextStatement: null, colour: '#D43D41', tooltip: 'Start or stop live classification from camera' },
                // Reporters
                { type: 'ml_get_prediction', message0: 'prediction', output: 'String', colour: '#b71c1c', tooltip: 'Get the current classification prediction' },
                { type: 'ml_get_confidence', message0: 'confidence', output: 'Number', colour: '#b71c1c', tooltip: 'Get the confidence of the current prediction (0-100)' },
                { type: 'ml_is_class', message0: 'prediction is %1?', args0: [{ type: 'field_input', name: 'CLASS', text: 'class1' }], output: 'Boolean', colour: '#b71c1c', tooltip: 'Check if the current prediction matches the given class' },
                { type: 'ml_get_class_count', message0: 'number of classes', output: 'Number', colour: '#b71c1c', tooltip: 'Get the number of trained classes' },
                { type: 'ml_get_sample_count', message0: 'sample count of %1', args0: [{ type: 'field_input', name: 'LABEL', text: 'class1' }], output: 'Number', colour: '#b71c1c', tooltip: 'Get the number of samples collected for a class' },
                { type: 'ml_is_trained', message0: 'model trained?', output: 'Boolean', colour: '#b71c1c', tooltip: 'Check if the model has been trained' },
            ];
            const newDefs = mlBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newDefs.length > 0) Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newDefs));
        },
        registerGenerators: (_Blockly: any) => {
            const jsGen = javascriptGenerator;
            if (!jsGen) return;
            // Training
            jsGen.forBlock['ml_add_sample'] = (b: any) => `if(window.runtime?.ml) await window.runtime.ml.addSample('${(b.getFieldValue('LABEL') || 'class1').replace(/'/g, "\\'")}');\n`;
            jsGen.forBlock['ml_train'] = () => 'if(window.runtime?.ml) window.runtime.ml.train();\n';
            jsGen.forBlock['ml_clear_all'] = () => 'if(window.runtime?.ml) window.runtime.ml.clearAll();\n';
            jsGen.forBlock['ml_clear_class'] = (b: any) => `if(window.runtime?.ml) window.runtime.ml.clearClass('${(b.getFieldValue('LABEL') || 'class1').replace(/'/g, "\\'")}');\n`;
            // Detection
            jsGen.forBlock['ml_analyze'] = (b: any) => `if(window.runtime?.ml) window.runtime.ml.analyse('${b.getFieldValue('ACTION')}');\n`;
            // Reporters
            jsGen.forBlock['ml_get_prediction'] = () => [`window.runtime?.ml?.getPrediction()||'none'`, 0];
            jsGen.forBlock['ml_get_confidence'] = () => [`window.runtime?.ml?.getConfidence()||0`, 0];
            jsGen.forBlock['ml_is_class'] = (b: any) => [`window.runtime?.ml?.isClass('${(b.getFieldValue('CLASS') || '').replace(/'/g, "\\'")}')`, 0];
            jsGen.forBlock['ml_get_class_count'] = () => [`window.runtime?.ml?.getClassCount()||0`, 0];
            jsGen.forBlock['ml_get_sample_count'] = (b: any) => [`window.runtime?.ml?.getSampleCount('${(b.getFieldValue('LABEL') || 'class1').replace(/'/g, "\\'")}')||0`, 0];
            jsGen.forBlock['ml_is_trained'] = () => [`window.runtime?.ml?.isTrained()`, 0];
        },
        getToolbox: () => [
            { kind: 'label', text: 'Training' },
            { kind: 'block', type: 'ml_add_sample' },
            { kind: 'block', type: 'ml_train' },
            { kind: 'block', type: 'ml_clear_all' },
            { kind: 'block', type: 'ml_clear_class' },
            { kind: 'label', text: 'Detection' },
            { kind: 'block', type: 'ml_analyze' },
            { kind: 'label', text: 'Reporters' },
            { kind: 'block', type: 'ml_get_prediction' },
            { kind: 'block', type: 'ml_get_confidence' },
            { kind: 'block', type: 'ml_is_class' },
            { kind: 'block', type: 'ml_get_class_count' },
            { kind: 'block', type: 'ml_get_sample_count' },
            { kind: 'block', type: 'ml_is_trained' },
        ]
    },
    text_to_speech: {
        id: 'text_to_speech',
        name: 'Text to Speech',
        color: '#4a90d9',
        icon: '🔊',
        registerBlocks: (Blockly: any) => {
            const ttsBlockDefs = [
                {
                    type: 'tts_speak',
                    message0: 'speak %1',
                    args0: [{ type: 'field_input', name: 'MESSAGE', text: 'Hello world' }],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#4a90d9',
                    tooltip: 'Speak the given text aloud'
                },
                {
                    type: 'tts_set_voice',
                    message0: 'set voice to %1',
                    args0: [{ type: 'field_input', name: 'VOICE', text: '' }],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#4a90d9',
                    tooltip: 'Set the speech voice by name or language code'
                },
                {
                    type: 'tts_set_rate',
                    message0: 'set speech rate to %1',
                    args0: [{ type: 'field_number', name: 'RATE', value: 1, min: 0.1, max: 10, step: 0.1 }],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#4a90d9',
                    tooltip: 'Set the speech rate (0.1 - 10, default 1)'
                },
                {
                    type: 'tts_set_volume',
                    message0: 'set speech volume to %1',
                    args0: [{ type: 'field_number', name: 'VOLUME', value: 1, min: 0, max: 1, step: 0.1 }],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#4a90d9',
                    tooltip: 'Set the speech volume (0 - 1, default 1)'
                },
                {
                    type: 'tts_set_pitch',
                    message0: 'set speech pitch to %1',
                    args0: [{ type: 'field_number', name: 'PITCH', value: 1, min: 0, max: 2, step: 0.1 }],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#4a90d9',
                    tooltip: 'Set the speech pitch (0 - 2, default 1)'
                },
                {
                    type: 'tts_stop',
                    message0: 'stop speaking',
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#4a90d9',
                    tooltip: 'Stop current speech'
                },
                {
                    type: 'tts_is_speaking',
                    message0: 'is speaking',
                    output: 'Boolean',
                    colour: '#2d6cb5',
                    tooltip: 'Returns true if speech is in progress'
                },
                {
                    type: 'tts_get_rate',
                    message0: 'speech rate',
                    output: 'Number',
                    colour: '#2d6cb5',
                    tooltip: 'Get the current speech rate'
                },
                {
                    type: 'tts_get_volume',
                    message0: 'speech volume',
                    output: 'Number',
                    colour: '#2d6cb5',
                    tooltip: 'Get the current speech volume'
                }
            ];
            const newTtsDefs = ttsBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newTtsDefs.length > 0) {
                Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newTtsDefs));
            }
        },
        registerGenerators: (_Blockly: any) => {
            const jsGen = javascriptGenerator;
            if (!jsGen) return;

            jsGen.forBlock['tts_speak'] = (b: any) => {
                const msg = b.getFieldValue('MESSAGE') || 'Hello';
                return `if(window.runtime?.tts) await window.runtime.tts.speak('${msg.replace(/'/g, "\\'")}');\n`;
            };
            jsGen.forBlock['tts_set_voice'] = (b: any) => {
                const voice = b.getFieldValue('VOICE') || '';
                return `if(window.runtime?.tts) window.runtime.tts.setVoice('${voice.replace(/'/g, "\\'")}');\n`;
            };
            jsGen.forBlock['tts_set_rate'] = (b: any) => {
                const rate = b.getFieldValue('RATE') || 1;
                return `if(window.runtime?.tts) window.runtime.tts.setRate(${rate});\n`;
            };
            jsGen.forBlock['tts_set_volume'] = (b: any) => {
                const volume = b.getFieldValue('VOLUME') || 1;
                return `if(window.runtime?.tts) window.runtime.tts.setVolume(${volume});\n`;
            };
            jsGen.forBlock['tts_set_pitch'] = (b: any) => {
                const pitch = b.getFieldValue('PITCH') || 1;
                return `if(window.runtime?.tts) window.runtime.tts.setPitch(${pitch});\n`;
            };
            jsGen.forBlock['tts_stop'] = () =>
                'if(window.runtime?.tts) window.runtime.tts.stop();\n';
            jsGen.forBlock['tts_is_speaking'] = () =>
                [`window.runtime?.tts?.isSpeaking()||false`, 0];
            jsGen.forBlock['tts_get_rate'] = () =>
                [`window.runtime?.tts?.getRate()||1`, 0];
            jsGen.forBlock['tts_get_volume'] = () =>
                [`window.runtime?.tts?.getVolume()||1`, 0];
        },
        getToolbox: () => [
            { kind: 'label', text: 'Speak' },
            { kind: 'block', type: 'tts_speak' },
            { kind: 'block', type: 'tts_stop' },
            { kind: 'label', text: 'Settings' },
            { kind: 'block', type: 'tts_set_voice' },
            { kind: 'block', type: 'tts_set_rate' },
            { kind: 'block', type: 'tts_set_volume' },
            { kind: 'block', type: 'tts_set_pitch' },
            { kind: 'label', text: 'Reporters' },
            { kind: 'block', type: 'tts_is_speaking' },
            { kind: 'block', type: 'tts_get_rate' },
            { kind: 'block', type: 'tts_get_volume' },
        ]
    },
    speech_recognition: {
        id: 'speech_recognition',
        name: 'Speech Recognition',
        color: '#7b5ea7',
        icon: '🎤',
        registerBlocks: (Blockly: any) => {
            const srBlockDefs = [
                {
                    type: 'speech_start_listening',
                    message0: 'start listening',
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#7b5ea7',
                    tooltip: 'Start listening for speech input'
                },
                {
                    type: 'speech_stop_listening',
                    message0: 'stop listening',
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#7b5ea7',
                    tooltip: 'Stop listening for speech input'
                },
                {
                    type: 'speech_set_language',
                    message0: 'set speech language to %1',
                    args0: [{ type: 'field_input', name: 'LANGUAGE', text: 'en-US' }],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#7b5ea7',
                    tooltip: 'Set the recognition language (e.g. en-US, es-ES, fr-FR)'
                },
                {
                    type: 'speech_get_last_result',
                    message0: 'last speech result',
                    output: 'String',
                    colour: '#5e4299',
                    tooltip: 'Get the last recognized speech text'
                },
                {
                    type: 'speech_get_confidence',
                    message0: 'speech confidence',
                    output: 'Number',
                    colour: '#5e4299',
                    tooltip: 'Get the confidence of the last recognition (0-100)'
                },
                {
                    type: 'speech_is_listening',
                    message0: 'is listening',
                    output: 'Boolean',
                    colour: '#5e4299',
                    tooltip: 'Returns true if speech recognition is active'
                },
                {
                    type: 'speech_on_result',
                    message0: 'when speech recognized %1',
                    args0: [{ type: 'input_statement', name: 'BODY' }],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#7b5ea7',
                    tooltip: 'Event: triggered when speech is recognized'
                }
            ];
            const newSrDefs = srBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newSrDefs.length > 0) {
                Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newSrDefs));
            }
        },
        registerGenerators: (_Blockly: any) => {
            const jsGen = javascriptGenerator;
            if (!jsGen) return;

            jsGen.forBlock['speech_start_listening'] = () =>
                'if(window.runtime?.speech) window.runtime.speech.startListening();\n';
            jsGen.forBlock['speech_stop_listening'] = () =>
                'if(window.runtime?.speech) window.runtime.speech.stopListening();\n';
            jsGen.forBlock['speech_set_language'] = (b: any) => {
                const lang = b.getFieldValue('LANGUAGE') || 'en-US';
                return `if(window.runtime?.speech) window.runtime.speech.setLanguage('${lang.replace(/'/g, "\\'")}');\n`;
            };
            jsGen.forBlock['speech_get_last_result'] = () =>
                [`window.runtime?.speech?.getLastResult()||''`, 0];
            jsGen.forBlock['speech_get_confidence'] = () =>
                [`window.runtime?.speech?.getConfidence()||0`, 0];
            jsGen.forBlock['speech_is_listening'] = () =>
                [`window.runtime?.speech?.isListening()||false`, 0];
            jsGen.forBlock['speech_on_result'] = (b: any) => {
                const body = jsGen.statementToCode(b, 'BODY');
                return `if(window.runtime?.speech){window.runtime.speech.onResult((_sr_text, _sr_conf)=>{${body}});}\n`;
            };
        },
        getToolbox: () => [
            { kind: 'label', text: 'Listen' },
            { kind: 'block', type: 'speech_start_listening' },
            { kind: 'block', type: 'speech_stop_listening' },
            { kind: 'block', type: 'speech_set_language' },
            { kind: 'label', text: 'Events' },
            { kind: 'block', type: 'speech_on_result' },
            { kind: 'label', text: 'Reporters' },
            { kind: 'block', type: 'speech_get_last_result' },
            { kind: 'block', type: 'speech_get_confidence' },
            { kind: 'block', type: 'speech_is_listening' },
        ]
    },
    text_recognition: {
        id: 'text_recognition',
        name: 'Text Recognition',
        color: '#2196F3',
        icon: '📝',
        registerBlocks: (Blockly: any) => {
            const ocrBlockDefs = [
                {
                    type: 'ocr_from_camera',
                    message0: 'capture text from camera',
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#2196F3',
                    tooltip: 'Run OCR on the current camera frame'
                },
                {
                    type: 'ocr_from_image',
                    message0: 'capture text from image %1',
                    args0: [{
                        type: 'field_dropdown',
                        name: 'SOURCE',
                        options: [
                            ['uploaded image', 'uploaded'],
                            ['stage backdrop', 'backdrop'],
                            ['url', 'url']
                        ]
                    }],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#2196F3',
                    tooltip: 'Run OCR on an image source'
                },
                {
                    type: 'ocr_get_text',
                    message0: 'recognized text',
                    output: 'String',
                    colour: '#1565C0',
                    tooltip: 'Returns the last recognized text'
                },
                {
                    type: 'ocr_get_word_count',
                    message0: 'word count',
                    output: 'Number',
                    colour: '#1565C0',
                    tooltip: 'Returns the number of words recognized'
                },
                {
                    type: 'ocr_contains',
                    message0: 'text contains %1',
                    args0: [{ type: 'field_input', name: 'PHRASE', text: 'hello' }],
                    output: 'Boolean',
                    colour: '#1565C0',
                    tooltip: 'Returns true if recognized text contains the phrase'
                }
            ];
            const newOcrDefs = ocrBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newOcrDefs.length > 0) {
                Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newOcrDefs));
            }
        },
        registerGenerators: (_Blockly: any) => {
            const jsGen = javascriptGenerator;
            if (!jsGen) return;

            jsGen.forBlock['ocr_from_camera'] = () =>
                'if(window.runtime?.ocr) await window.runtime.ocr.recognizeFromCamera();\n';
            jsGen.forBlock['ocr_from_image'] = (b: any) => {
                const source = b.getFieldValue('SOURCE') || 'uploaded';
                return `if(window.runtime?.ocr) await window.runtime.ocr.recognizeFromImage('${source}');\n`;
            };
            jsGen.forBlock['ocr_get_text'] = () =>
                [`window.runtime?.ocr?.getLastResult()||''`, 0];
            jsGen.forBlock['ocr_get_word_count'] = () =>
                [`window.runtime?.ocr?.getWordCount()||0`, 0];
            jsGen.forBlock['ocr_contains'] = (b: any) => {
                const phrase = b.getFieldValue('PHRASE') || '';
                return [`window.runtime?.ocr?.contains('${phrase.replace(/'/g, "\\'")}')||false`, 0];
            };
        },
        getToolbox: () => [
            { kind: 'label', text: 'Capture' },
            { kind: 'block', type: 'ocr_from_camera' },
            { kind: 'block', type: 'ocr_from_image' },
            { kind: 'label', text: 'Results' },
            { kind: 'block', type: 'ocr_get_text' },
            { kind: 'block', type: 'ocr_get_word_count' },
            { kind: 'block', type: 'ocr_contains' },
        ]
    },
    weather_data: {
        id: 'weather_data',
        name: 'Weather Data',
        color: '#0288D1',
        icon: '🌤️',
        registerBlocks: (Blockly: any) => {
            const weatherBlockDefs = [
                {
                    type: 'weather_get_for_city',
                    message0: 'fetch weather for %1',
                    args0: [{ type: 'field_input', name: 'CITY', text: 'London' }],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#0288D1',
                    tooltip: 'Fetch weather data for the given city name'
                },
                {
                    type: 'weather_get_for_location',
                    message0: 'fetch weather for lat %1 lon %2',
                    args0: [
                        { type: 'field_number', name: 'LAT', value: 51.5, step: 0.1 },
                        { type: 'field_number', name: 'LON', value: -0.1, step: 0.1 }
                    ],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#0288D1',
                    tooltip: 'Fetch weather for given latitude and longitude'
                },
                {
                    type: 'weather_temperature',
                    message0: 'temperature',
                    output: 'Number',
                    colour: '#01579B',
                    tooltip: 'Get the current temperature in Celsius'
                },
                {
                    type: 'weather_condition',
                    message0: 'weather condition',
                    output: 'String',
                    colour: '#01579B',
                    tooltip: 'Get the current weather condition description'
                },
                {
                    type: 'weather_humidity',
                    message0: 'humidity',
                    output: 'Number',
                    colour: '#01579B',
                    tooltip: 'Get the current humidity percentage'
                },
                {
                    type: 'weather_wind_speed',
                    message0: 'wind speed',
                    output: 'Number',
                    colour: '#01579B',
                    tooltip: 'Get the current wind speed in km/h'
                },
                {
                    type: 'weather_is_raining',
                    message0: 'is raining',
                    output: 'Boolean',
                    colour: '#01579B',
                    tooltip: 'Returns true if it is currently raining'
                }
            ];
            const newWeatherDefs = weatherBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newWeatherDefs.length > 0) {
                Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newWeatherDefs));
            }
        },
        registerGenerators: (_Blockly: any) => {
            const jsGen = javascriptGenerator;
            if (!jsGen) return;

            jsGen.forBlock['weather_get_for_city'] = (b: any) => {
                const city = b.getFieldValue('CITY') || 'London';
                return `if(window.runtime?.weather) await window.runtime.weather.fetchWeather('${city.replace(/'/g, "\\'")}');\n`;
            };
            jsGen.forBlock['weather_get_for_location'] = (b: any) => {
                const lat = b.getFieldValue('LAT') || 0;
                const lon = b.getFieldValue('LON') || 0;
                return `if(window.runtime?.weather) await window.runtime.weather.fetchWeatherByLocation(${lat}, ${lon});\n`;
            };
            jsGen.forBlock['weather_temperature'] = () =>
                [`window.runtime?.weather?.getTemperature()||0`, 0];
            jsGen.forBlock['weather_condition'] = () =>
                [`window.runtime?.weather?.getCondition()||''`, 0];
            jsGen.forBlock['weather_humidity'] = () =>
                [`window.runtime?.weather?.getHumidity()||0`, 0];
            jsGen.forBlock['weather_wind_speed'] = () =>
                [`window.runtime?.weather?.getWindSpeed()||0`, 0];
            jsGen.forBlock['weather_is_raining'] = () =>
                [`window.runtime?.weather?.isRaining()||false`, 0];
        },
        getToolbox: () => [
            { kind: 'label', text: 'Fetch' },
            { kind: 'block', type: 'weather_get_for_city' },
            { kind: 'block', type: 'weather_get_for_location' },
            { kind: 'label', text: 'Reporters' },
            { kind: 'block', type: 'weather_temperature' },
            { kind: 'block', type: 'weather_condition' },
            { kind: 'block', type: 'weather_humidity' },
            { kind: 'block', type: 'weather_wind_speed' },
            { kind: 'block', type: 'weather_is_raining' },
        ]
    },
    translate: {
        id: 'translate',
        name: 'Translate',
        color: '#1976D2',
        icon: '🌍',
        registerBlocks: (Blockly: any) => {
            const translateBlockDefs = [
                {
                    type: 'translate_text',
                    message0: 'translate %1 to %2',
                    args0: [
                        { type: 'field_input', name: 'TEXT', text: 'Hello' },
                        {
                            type: 'field_dropdown', name: 'TARGET_LANG',
                            options: [
                                ['English', 'en'], ['Spanish', 'es'], ['French', 'fr'],
                                ['German', 'de'], ['Italian', 'it'], ['Portuguese', 'pt'],
                                ['Russian', 'ru'], ['Japanese', 'ja'], ['Chinese', 'zh-CN'],
                                ['Korean', 'ko'], ['Arabic', 'ar'], ['Hindi', 'hi'],
                                ['Dutch', 'nl'], ['Swedish', 'sv'], ['Turkish', 'tr'],
                                ['Polish', 'pl'], ['Thai', 'th'], ['Vietnamese', 'vi'],
                                ['Indonesian', 'id'], ['Greek', 'el']
                            ]
                        }
                    ],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#1976D2',
                    tooltip: 'Translate text to the target language'
                },
                {
                    type: 'translate_set_source',
                    message0: 'set source language to %1',
                    args0: [{
                        type: 'field_dropdown', name: 'SOURCE_LANG',
                        options: [
                            ['Auto Detect', 'auto'], ['English', 'en'], ['Spanish', 'es'],
                            ['French', 'fr'], ['German', 'de'], ['Italian', 'it'],
                            ['Portuguese', 'pt'], ['Russian', 'ru'], ['Japanese', 'ja'],
                            ['Chinese', 'zh-CN'], ['Korean', 'ko'], ['Arabic', 'ar'],
                            ['Hindi', 'hi'], ['Dutch', 'nl'], ['Swedish', 'sv'],
                            ['Turkish', 'tr'], ['Polish', 'pl'], ['Thai', 'th']
                        ]
                    }],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#1976D2',
                    tooltip: 'Set the source language for translation'
                },
                {
                    type: 'translate_set_target',
                    message0: 'set target language to %1',
                    args0: [{
                        type: 'field_dropdown', name: 'TARGET_LANG',
                        options: [
                            ['English', 'en'], ['Spanish', 'es'], ['French', 'fr'],
                            ['German', 'de'], ['Italian', 'it'], ['Portuguese', 'pt'],
                            ['Russian', 'ru'], ['Japanese', 'ja'], ['Chinese', 'zh-CN'],
                            ['Korean', 'ko'], ['Arabic', 'ar'], ['Hindi', 'hi'],
                            ['Dutch', 'nl'], ['Swedish', 'sv'], ['Turkish', 'tr'],
                            ['Polish', 'pl'], ['Thai', 'th'], ['Vietnamese', 'vi']
                        ]
                    }],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#1976D2',
                    tooltip: 'Set the default target language'
                },
                {
                    type: 'translate_last_result',
                    message0: 'last translation',
                    output: 'String',
                    colour: '#0D47A1',
                    tooltip: 'Returns the last translated text'
                }
            ];
            const newDefs = translateBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newDefs.length > 0) {
                Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newDefs));
            }
        },
        registerGenerators: (_Blockly: any) => {
            const jsGen = javascriptGenerator;
            if (!jsGen) return;

            jsGen.forBlock['translate_text'] = (b: any) => {
                const text = b.getFieldValue('TEXT') || '';
                const lang = b.getFieldValue('TARGET_LANG') || 'en';
                return `if(window.runtime?.translate) await window.runtime.translate.translate('${text.replace(/'/g, "\\'")}', '${lang}');\n`;
            };
            jsGen.forBlock['translate_set_source'] = (b: any) => {
                const lang = b.getFieldValue('SOURCE_LANG') || 'auto';
                return `if(window.runtime?.translate) window.runtime.translate.setSourceLanguage('${lang}');\n`;
            };
            jsGen.forBlock['translate_set_target'] = (b: any) => {
                const lang = b.getFieldValue('TARGET_LANG') || 'en';
                return `if(window.runtime?.translate) window.runtime.translate.setTargetLanguage('${lang}');\n`;
            };
            jsGen.forBlock['translate_last_result'] = () =>
                [`window.runtime?.translate?.getLastResult()||''`, 0];
        },
        getToolbox: () => [
            { kind: 'label', text: 'Translate' },
            { kind: 'block', type: 'translate_text' },
            { kind: 'label', text: 'Settings' },
            { kind: 'block', type: 'translate_set_source' },
            { kind: 'block', type: 'translate_set_target' },
            { kind: 'label', text: 'Results' },
            { kind: 'block', type: 'translate_last_result' },
        ]
    },
    data_logger: {
        id: 'data_logger',
        name: 'Data Logger',
        color: '#FF6F00',
        icon: '📋',
        registerBlocks: (Blockly: any) => {
            const loggerBlockDefs = [
                {
                    type: 'logger_log',
                    message0: 'log %1',
                    args0: [{ type: 'field_input', name: 'VALUE', text: '0' }],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#FF6F00',
                    tooltip: 'Log a value'
                },
                {
                    type: 'logger_log_with_label',
                    message0: 'log %1 as %2',
                    args0: [
                        { type: 'field_input', name: 'VALUE', text: '0' },
                        { type: 'field_input', name: 'LABEL', text: 'data' }
                    ],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#FF6F00',
                    tooltip: 'Log a value with a label'
                },
                {
                    type: 'logger_clear',
                    message0: 'clear log',
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#FF6F00',
                    tooltip: 'Clear all logged entries'
                },
                {
                    type: 'logger_get_count',
                    message0: 'log count',
                    output: 'Number',
                    colour: '#E65100',
                    tooltip: 'Number of logged entries'
                },
                {
                    type: 'logger_get_entry',
                    message0: 'log entry %1',
                    args0: [{ type: 'field_number', name: 'INDEX', value: 1, min: 1 }],
                    output: 'String',
                    colour: '#E65100',
                    tooltip: 'Get the value at the given log index'
                },
                {
                    type: 'logger_get_label',
                    message0: 'label of log entry %1',
                    args0: [{ type: 'field_number', name: 'INDEX', value: 1, min: 1 }],
                    output: 'String',
                    colour: '#E65100',
                    tooltip: 'Get the label at the given log index'
                },
                {
                    type: 'logger_save_to_csv',
                    message0: 'save log as CSV',
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#FF6F00',
                    tooltip: 'Download log as a CSV file'
                },
                {
                    type: 'logger_on_new_entry',
                    message0: 'when new entry logged %1',
                    args0: [{ type: 'input_statement', name: 'BODY' }],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#FF6F00',
                    tooltip: 'Event: runs when a new entry is logged'
                }
            ];
            const newDefs = loggerBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newDefs.length > 0) {
                Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newDefs));
            }
        },
        registerGenerators: (_Blockly: any) => {
            const jsGen = javascriptGenerator;
            if (!jsGen) return;

            jsGen.forBlock['logger_log'] = (b: any) => {
                const value = b.getFieldValue('VALUE') || '0';
                return `if(window.runtime?.logger) window.runtime.logger.log('${value.replace(/'/g, "\\'")}');\n`;
            };
            jsGen.forBlock['logger_log_with_label'] = (b: any) => {
                const value = b.getFieldValue('VALUE') || '0';
                const label = b.getFieldValue('LABEL') || 'data';
                return `if(window.runtime?.logger) window.runtime.logger.logWithLabel('${label.replace(/'/g, "\\'")}', '${value.replace(/'/g, "\\'")}');\n`;
            };
            jsGen.forBlock['logger_clear'] = () =>
                'if(window.runtime?.logger) window.runtime.logger.clear();\n';
            jsGen.forBlock['logger_get_count'] = () =>
                [`window.runtime?.logger?.getCount()||0`, 0];
            jsGen.forBlock['logger_get_entry'] = (b: any) =>
                [`window.runtime?.logger?.getEntry(${b.getFieldValue('INDEX')})||''`, 0];
            jsGen.forBlock['logger_get_label'] = (b: any) =>
                [`window.runtime?.logger?.getLabel(${b.getFieldValue('INDEX')})||''`, 0];
            jsGen.forBlock['logger_save_to_csv'] = () =>
                'if(window.runtime?.logger) window.runtime.logger.saveToCSV();\n';
            jsGen.forBlock['logger_on_new_entry'] = (b: any) => {
                const body = jsGen.statementToCode(b, 'BODY');
                return `if(window.runtime?.logger){window.runtime.logger.onNewEntry((_log_e)=>{${body}});}\n`;
            };
        },
        getToolbox: () => [
            { kind: 'label', text: 'Log' },
            { kind: 'block', type: 'logger_log' },
            { kind: 'block', type: 'logger_log_with_label' },
            { kind: 'block', type: 'logger_clear' },
            { kind: 'block', type: 'logger_save_to_csv' },
            { kind: 'label', text: 'Events' },
            { kind: 'block', type: 'logger_on_new_entry' },
            { kind: 'label', text: 'Reporters' },
            { kind: 'block', type: 'logger_get_count' },
            { kind: 'block', type: 'logger_get_entry' },
            { kind: 'block', type: 'logger_get_label' },
        ]
    },
    computer_vision: {
        id: 'computer_vision',
        name: 'Computer Vision',
        color: '#00897B',
        icon: '👁️',
        registerBlocks: (Blockly: any) => {
            const cvBlockDefs = [
                { type: 'vision_camera_on', message0: 'camera on', previousStatement: null, nextStatement: null, colour: '#00897B', tooltip: 'Turn on the camera' },
                { type: 'vision_camera_off', message0: 'camera off', previousStatement: null, nextStatement: null, colour: '#00897B', tooltip: 'Turn off the camera' },
                { type: 'vision_analyze', message0: 'analyze frame', previousStatement: null, nextStatement: null, colour: '#00897B', tooltip: 'Run face + object detection' },
                { type: 'vision_detect_objects', message0: 'detect objects', previousStatement: null, nextStatement: null, colour: '#00897B', tooltip: 'Run object detection' },
                { type: 'vision_get_object_count', message0: 'object count', output: 'Number', colour: '#00695C', tooltip: 'Number of detected objects' },
                { type: 'vision_get_object_name', message0: 'name of object %1', args0: [{ type: 'field_number', name: 'INDEX', value: 1, min: 1 }], output: 'String', colour: '#00695C', tooltip: 'Label of object at index' },
                { type: 'vision_get_object_confidence', message0: 'confidence of object %1', args0: [{ type: 'field_number', name: 'INDEX', value: 1, min: 1 }], output: 'Number', colour: '#00695C', tooltip: 'Confidence of object at index' },
                { type: 'vision_get_object_x', message0: 'x of object %1', args0: [{ type: 'field_number', name: 'INDEX', value: 1, min: 1 }], output: 'Number', colour: '#00695C', tooltip: 'X position of object' },
                { type: 'vision_get_object_y', message0: 'y of object %1', args0: [{ type: 'field_number', name: 'INDEX', value: 1, min: 1 }], output: 'Number', colour: '#00695C', tooltip: 'Y position of object' },
                { type: 'vision_is_object_present', message0: 'is %1 present', args0: [{ type: 'field_input', name: 'NAME', text: 'person' }], output: 'Boolean', colour: '#00695C', tooltip: 'Is the named object present?' },
                { type: 'vision_draw_bounding_boxes', message0: 'bounding boxes %1', args0: [{ type: 'field_dropdown', name: 'STATE', options: [['on', 'on'], ['off', 'off']] }], previousStatement: null, nextStatement: null, colour: '#00897B', tooltip: 'Show/hide bounding boxes' },
                { type: 'vision_get_face_count', message0: 'face count', output: 'Number', colour: '#00695C', tooltip: 'Number of detected faces' },
                { type: 'vision_get_emotion', message0: 'emotion of face %1', args0: [{ type: 'field_number', name: 'INDEX', value: 1, min: 1 }], output: 'String', colour: '#00695C', tooltip: 'Emotion of face at index' },
            ];
            const newDefs = cvBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newDefs.length > 0) {
                Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newDefs));
            }
        },
        registerGenerators: (_Blockly: any) => {
            const jsGen = javascriptGenerator;
            if (!jsGen) return;

            jsGen.forBlock['vision_camera_on'] = () => 'if(window.runtime?.vision) window.runtime.vision.cameraOn_();\n';
            jsGen.forBlock['vision_camera_off'] = () => 'if(window.runtime?.vision) window.runtime.vision.cameraOff();\n';
            jsGen.forBlock['vision_analyze'] = () => 'if(window.runtime?.vision) await window.runtime.vision.analyze();\n';
            jsGen.forBlock['vision_detect_objects'] = () => 'if(window.runtime?.vision) await window.runtime.vision.detectObjects();\n';
            jsGen.forBlock['vision_get_object_count'] = () => ['window.runtime?.vision?.getObjectCount()||0', 0];
            jsGen.forBlock['vision_get_object_name'] = (b: any) => [`window.runtime?.vision?.getObjectName(${b.getFieldValue('INDEX')})||''`, 0];
            jsGen.forBlock['vision_get_object_confidence'] = (b: any) => [`window.runtime?.vision?.getObjectConfidence(${b.getFieldValue('INDEX')})||0`, 0];
            jsGen.forBlock['vision_get_object_x'] = (b: any) => [`window.runtime?.vision?.getObjectX(${b.getFieldValue('INDEX')})||0`, 0];
            jsGen.forBlock['vision_get_object_y'] = (b: any) => [`window.runtime?.vision?.getObjectY(${b.getFieldValue('INDEX')})||0`, 0];
            jsGen.forBlock['vision_is_object_present'] = (b: any) => {
                const name = b.getFieldValue('NAME') || '';
                return [`window.runtime?.vision?.isObjectPresent('${name.replace(/'/g, "\\'")}')||false`, 0];
            };
            jsGen.forBlock['vision_draw_bounding_boxes'] = (b: any) => `if(window.runtime?.vision) window.runtime.vision.setBoundingBoxes('${b.getFieldValue('STATE')}');\n`;
            jsGen.forBlock['vision_get_face_count'] = () => ['window.runtime?.vision?.getFaceCount()||0', 0];
            jsGen.forBlock['vision_get_emotion'] = (b: any) => [`window.runtime?.vision?.getEmotion(${b.getFieldValue('INDEX')})||'neutral'`, 0];
        },
        getToolbox: () => [
            { kind: 'label', text: 'Camera' },
            { kind: 'block', type: 'vision_camera_on' },
            { kind: 'block', type: 'vision_camera_off' },
            { kind: 'label', text: 'Detection' },
            { kind: 'block', type: 'vision_analyze' },
            { kind: 'block', type: 'vision_detect_objects' },
            { kind: 'block', type: 'vision_draw_bounding_boxes' },
            { kind: 'label', text: 'Objects' },
            { kind: 'block', type: 'vision_get_object_count' },
            { kind: 'block', type: 'vision_get_object_name' },
            { kind: 'block', type: 'vision_get_object_confidence' },
            { kind: 'block', type: 'vision_get_object_x' },
            { kind: 'block', type: 'vision_get_object_y' },
            { kind: 'block', type: 'vision_is_object_present' },
            { kind: 'label', text: 'Faces' },
            { kind: 'block', type: 'vision_get_face_count' },
            { kind: 'block', type: 'vision_get_emotion' },
        ]
    },
    video_player: {
        id: 'video_player',
        name: 'Video Player',
        color: '#1565C0',
        icon: '🎬',
        registerBlocks: (Blockly: any) => {
            const vpBlockDefs = [
                { type: 'video_set_source', message0: 'set video to %1', args0: [{ type: 'field_input', name: 'URL', text: 'https://example.com/video.mp4' }], previousStatement: null, nextStatement: null, colour: '#1565C0', tooltip: 'Set the video source URL' },
                { type: 'video_play', message0: 'play video', previousStatement: null, nextStatement: null, colour: '#1565C0', tooltip: 'Start playing the video' },
                { type: 'video_pause', message0: 'pause video', previousStatement: null, nextStatement: null, colour: '#1565C0', tooltip: 'Pause the video' },
                { type: 'video_stop', message0: 'stop video', previousStatement: null, nextStatement: null, colour: '#1565C0', tooltip: 'Stop the video and reset to beginning' },
                { type: 'video_show', message0: 'show video', previousStatement: null, nextStatement: null, colour: '#1565C0', tooltip: 'Show the video overlay on stage' },
                { type: 'video_hide', message0: 'hide video', previousStatement: null, nextStatement: null, colour: '#1565C0', tooltip: 'Hide the video overlay from stage' },
                { type: 'video_set_speed', message0: 'set video speed to %1', args0: [{ type: 'field_dropdown', name: 'SPEED', options: [['0.25x', '0.25'], ['0.5x', '0.5'], ['1x', '1'], ['1.5x', '1.5'], ['2x', '2']] }], previousStatement: null, nextStatement: null, colour: '#1565C0', tooltip: 'Set the video playback speed' },
                { type: 'video_set_volume', message0: 'set video volume to %1 %', args0: [{ type: 'field_number', name: 'VOLUME', value: 100, min: 0, max: 100 }], previousStatement: null, nextStatement: null, colour: '#1565C0', tooltip: 'Set the video volume (0-100%)' },
                { type: 'video_seek', message0: 'seek video to %1 seconds', args0: [{ type: 'field_number', name: 'TIME', value: 0, min: 0 }], previousStatement: null, nextStatement: null, colour: '#1565C0', tooltip: 'Seek the video to a specific time' },
                { type: 'video_set_position', message0: 'set video to x %1 y %2 size %3 %', args0: [{ type: 'field_number', name: 'X', value: 50, min: 0, max: 100 }, { type: 'field_number', name: 'Y', value: 50, min: 0, max: 100 }, { type: 'field_number', name: 'SIZE', value: 100, min: 10, max: 200 }], previousStatement: null, nextStatement: null, colour: '#1565C0', tooltip: 'Position and size the video on stage' },
                { type: 'video_set_loop', message0: 'loop video %1', args0: [{ type: 'field_dropdown', name: 'LOOP', options: [['on', 'on'], ['off', 'off']] }], previousStatement: null, nextStatement: null, colour: '#1565C0', tooltip: 'Enable or disable video looping' },
                { type: 'video_get_time', message0: 'current time', output: 'Number', colour: '#0D47A1', tooltip: 'Current playback time in seconds' },
                { type: 'video_get_duration', message0: 'video duration', output: 'Number', colour: '#0D47A1', tooltip: 'Total duration in seconds' },
                { type: 'video_is_playing', message0: 'is video playing', output: 'Boolean', colour: '#0D47A1', tooltip: 'Is the video currently playing?' },
                { type: 'video_is_loaded', message0: 'is video loaded', output: 'Boolean', colour: '#0D47A1', tooltip: 'Has the video loaded enough to play?' },
                { type: 'video_get_percent', message0: 'video progress %', output: 'Number', colour: '#0D47A1', tooltip: 'Playback progress as percentage (0-100)' },
                { type: 'video_get_source', message0: 'video source', output: 'String', colour: '#0D47A1', tooltip: 'Current video source URL' },
            ];
            const newDefs = vpBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newDefs.length > 0) {
                Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newDefs));
            }
        },
        registerGenerators: (_Blockly: any) => {
            const jsGen = javascriptGenerator;
            if (!jsGen) return;

            // Statement blocks
            jsGen.forBlock['video_set_source'] = (b: any) => `if(window.runtime?.video) window.runtime.video.setSource('${(b.getFieldValue('URL') || '').replace(/'/g, "\\'")}');\n`;
            jsGen.forBlock['video_play'] = () => 'if(window.runtime?.video) window.runtime.video.play();\n';
            jsGen.forBlock['video_pause'] = () => 'if(window.runtime?.video) window.runtime.video.pause();\n';
            jsGen.forBlock['video_stop'] = () => 'if(window.runtime?.video) window.runtime.video.stop();\n';
            jsGen.forBlock['video_show'] = () => 'if(window.runtime?.video) window.runtime.video.show();\n';
            jsGen.forBlock['video_hide'] = () => 'if(window.runtime?.video) window.runtime.video.hide();\n';
            jsGen.forBlock['video_set_speed'] = (b: any) => `if(window.runtime?.video) window.runtime.video.setSpeed(${b.getFieldValue('SPEED') || 1});\n`;
            jsGen.forBlock['video_set_volume'] = (b: any) => `if(window.runtime?.video) window.runtime.video.setVolume(${b.getFieldValue('VOLUME') || 100});\n`;
            jsGen.forBlock['video_seek'] = (b: any) => `if(window.runtime?.video) window.runtime.video.seek(${b.getFieldValue('TIME') || 0});\n`;
            jsGen.forBlock['video_set_position'] = (b: any) => `if(window.runtime?.video) window.runtime.video.setPosition(${b.getFieldValue('X') || 50}, ${b.getFieldValue('Y') || 50}, ${b.getFieldValue('SIZE') || 100});\n`;
            jsGen.forBlock['video_set_loop'] = (b: any) => `if(window.runtime?.video) window.runtime.video.setLoop('${b.getFieldValue('LOOP')}'==='on');\n`;

            // Reporter blocks
            jsGen.forBlock['video_get_time'] = () => ['window.runtime?.video?.getCurrentTime()||0', 0];
            jsGen.forBlock['video_get_duration'] = () => ['window.runtime?.video?.getDuration()||0', 0];
            jsGen.forBlock['video_is_playing'] = () => ['window.runtime?.video?.isPlaying()||false', 0];
            jsGen.forBlock['video_is_loaded'] = () => ['window.runtime?.video?.isLoaded()||false', 0];
            jsGen.forBlock['video_get_percent'] = () => ['window.runtime?.video?.getPercent()||0', 0];
            jsGen.forBlock['video_get_source'] = () => ['window.runtime?.video?.getSource()||""', 0];
        },
        getToolbox: () => [
            { kind: 'label', text: 'Playback' },
            { kind: 'block', type: 'video_set_source' },
            { kind: 'block', type: 'video_play' },
            { kind: 'block', type: 'video_pause' },
            { kind: 'block', type: 'video_stop' },
            { kind: 'label', text: 'Display' },
            { kind: 'block', type: 'video_show' },
            { kind: 'block', type: 'video_hide' },
            { kind: 'block', type: 'video_set_position' },
            { kind: 'label', text: 'Settings' },
            { kind: 'block', type: 'video_set_speed' },
            { kind: 'block', type: 'video_set_volume' },
            { kind: 'block', type: 'video_seek' },
            { kind: 'block', type: 'video_set_loop' },
            { kind: 'label', text: 'Reporters' },
            { kind: 'block', type: 'video_get_time' },
            { kind: 'block', type: 'video_get_duration' },
            { kind: 'block', type: 'video_is_playing' },
            { kind: 'block', type: 'video_is_loaded' },
            { kind: 'block', type: 'video_get_percent' },
            { kind: 'block', type: 'video_get_source' },
        ]
    },

    video_sensing: {
        id: 'video_sensing',
        name: 'Video Sensing',
        color: '#1565C0',
        icon: '📹',
        registerBlocks: (Blockly: any) => {
            const vsBlockDefs = [
                {
                    type: 'video_set_sensitivity',
                    message0: 'set motion sensitivity to %1',
                    args0: [{ type: 'field_number', name: 'THRESHOLD', value: 30, min: 1, max: 100 }],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#0D47A1',
                    tooltip: 'Set the motion detection threshold (1-100)',
                },
                {
                    type: 'video_sense_motion',
                    message0: 'motion detected?',
                    output: 'Boolean',
                    colour: '#1565C0',
                    tooltip: 'True when motion level exceeds the sensitivity threshold',
                },
                {
                    type: 'video_motion_level',
                    message0: 'motion level',
                    output: 'Number',
                    colour: '#0D47A1',
                    tooltip: 'Current motion intensity (0-100)',
                },
                {
                    type: 'video_sense_direction',
                    message0: 'motion direction',
                    output: 'Number',
                    colour: '#0D47A1',
                    tooltip: 'Dominant direction of motion (0-360 degrees)',
                },
            ];
            const newDefs = vsBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newDefs.length > 0) {
                Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newDefs));
            }
        },
        registerGenerators: (_Blockly: any) => {
            const jsGen = javascriptGenerator;
            if (!jsGen) return;

            jsGen.forBlock['video_set_sensitivity'] = (b: any) =>
                `if(window.runtime?.videoSensing) window.runtime.videoSensing.setSensitivity(${b.getFieldValue('THRESHOLD') || 30});\n`;
            jsGen.forBlock['video_sense_motion'] = () =>
                ['window.runtime?.videoSensing?.isMotionDetected()||false', 0];
            jsGen.forBlock['video_motion_level'] = () =>
                ['window.runtime?.videoSensing?.getMotionLevel()||0', 0];
            jsGen.forBlock['video_sense_direction'] = () =>
                ['window.runtime?.videoSensing?.getDirection()||0', 0];
        },
        getToolbox: () => [
            { kind: 'label', text: 'Motion Detection' },
            { kind: 'block', type: 'video_set_sensitivity' },
            { kind: 'block', type: 'video_sense_motion' },
            { kind: 'block', type: 'video_motion_level' },
            { kind: 'block', type: 'video_sense_direction' },
        ]
    },

    qr_scanner: {
        id: 'qr_scanner',
        name: 'QR Code Scanner',
        color: '#6A1B9A',
        icon: '📷',
        registerBlocks: (Blockly: any) => {
            const qrBlockDefs = [
                {
                    type: 'qr_scan_camera',
                    message0: 'scan QR from camera',
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#6A1B9A',
                    tooltip: 'Capture a frame from the camera and scan for a QR code',
                },
                {
                    type: 'qr_scan_image',
                    message0: 'scan QR from image %1',
                    args0: [{ type: 'field_input', name: 'SOURCE', text: '' }],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#6A1B9A',
                    tooltip: 'Scan a QR code from an image URL or data URI',
                },
                {
                    type: 'qr_get_text',
                    message0: 'QR text',
                    output: 'String',
                    colour: '#4A148C',
                    tooltip: 'Returns the text from the last scanned QR code',
                },
                {
                    type: 'qr_get_count',
                    message0: 'QR scan count',
                    output: 'Number',
                    colour: '#4A148C',
                    tooltip: 'Total number of successful QR scans this session',
                },
            ];
            const newDefs = qrBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newDefs.length > 0) {
                Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newDefs));
            }
        },
        registerGenerators: (_Blockly: any) => {
            const jsGen = javascriptGenerator;
            if (!jsGen) return;

            jsGen.forBlock['qr_scan_camera'] = () =>
                `await window.runtime?.qrScanner?.scanCamera();\n`;
            jsGen.forBlock['qr_scan_image'] = (b: any) =>
                `await window.runtime?.qrScanner?.scanImage('${(b.getFieldValue('SOURCE') || '').replace(/'/g, "\\'")}');\n`;
            jsGen.forBlock['qr_get_text'] = () =>
                ['window.runtime?.qrScanner?.getText()||""', 0];
            jsGen.forBlock['qr_get_count'] = () =>
                ['window.runtime?.qrScanner?.getCount()||0', 0];
        },
        getToolbox: () => [
            { kind: 'label', text: 'QR Scanning' },
            { kind: 'block', type: 'qr_scan_camera' },
            { kind: 'block', type: 'qr_scan_image' },
            { kind: 'label', text: 'Results' },
            { kind: 'block', type: 'qr_get_text' },
            { kind: 'block', type: 'qr_get_count' },
        ]
    },

    physics_engine: {
        id: 'physics_engine',
        name: 'Physics Engine',
        color: '#E65100',
        icon: '⚙',
        registerBlocks: (Blockly: any) => {
            const phBlockDefs = [
                {
                    type: 'physics_start',
                    message0: 'start physics',
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#E65100',
                    tooltip: 'Start the physics simulation engine',
                },
                {
                    type: 'physics_stop',
                    message0: 'stop physics',
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#E65100',
                    tooltip: 'Stop the physics simulation',
                },
                {
                    type: 'physics_set_gravity',
                    message0: 'set gravity x %1 y %2',
                    args0: [
                        { type: 'field_number', name: 'GX', value: 0 },
                        { type: 'field_number', name: 'GY', value: 1 }
                    ],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#E65100',
                    tooltip: 'Set gravity vector',
                },
                {
                    type: 'physics_add_body',
                    message0: 'add physics to sprite %1',
                    args0: [{ type: 'field_input', name: 'SPRITE', text: '' }],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#E65100',
                    tooltip: 'Add a physics body to a sprite',
                },
                {
                    type: 'physics_add_force',
                    message0: 'apply force x %1 y %2 to sprite %3',
                    args0: [
                        { type: 'field_number', name: 'FX', value: 0 },
                        { type: 'field_number', name: 'FY', value: -0.01 },
                        { type: 'field_input', name: 'SPRITE', text: '' }
                    ],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#E65100',
                    tooltip: 'Apply a force to a sprite',
                },
                {
                    type: 'physics_set_bounce',
                    message0: 'set bounce to %1',
                    args0: [{ type: 'field_number', name: 'VALUE', value: 0.5, min: 0, max: 1 }],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#E65100',
                    tooltip: 'Set bounce (restitution)',
                },
                {
                    type: 'physics_set_mass',
                    message0: 'set mass to %1',
                    args0: [{ type: 'field_number', name: 'VALUE', value: 1, min: 0.01 }],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#E65100',
                    tooltip: 'Set mass',
                },
                {
                    type: 'physics_set_static',
                    message0: 'set sprite %1 static %2',
                    args0: [
                        { type: 'field_input', name: 'SPRITE', text: '' },
                        { type: 'field_dropdown', name: 'VALUE', options: [['yes', 'yes'], ['no', 'no']] }
                    ],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#E65100',
                    tooltip: 'Make body static or dynamic',
                },
                {
                    type: 'physics_get_velocity_x',
                    message0: 'velocity x of sprite %1',
                    args0: [{ type: 'field_input', name: 'SPRITE', text: '' }],
                    output: 'Number',
                    colour: '#BF360C',
                    tooltip: 'Horizontal velocity',
                },
                {
                    type: 'physics_get_velocity_y',
                    message0: 'velocity y of sprite %1',
                    args0: [{ type: 'field_input', name: 'SPRITE', text: '' }],
                    output: 'Number',
                    colour: '#BF360C',
                    tooltip: 'Vertical velocity',
                },
                {
                    type: 'physics_on_collision',
                    message0: 'when sprite %1 collides with %2',
                    args0: [
                        { type: 'field_input', name: 'SPRITE1', text: '' },
                        { type: 'field_input', name: 'SPRITE2', text: '' }
                    ],
                    nextStatement: null,
                    colour: '#BF360C',
                    tooltip: 'When two sprites collide',
                    hat: 'event',
                },
            ];
            const newDefs = phBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newDefs.length > 0) {
                Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newDefs));
            }
        },
        registerGenerators: (_Blockly: any) => {
            const jsGen = javascriptGenerator;
            if (!jsGen) return;

            jsGen.forBlock['physics_start'] = () =>
                'if(window.runtime?.physics) window.runtime.physics.start();\n';
            jsGen.forBlock['physics_stop'] = () =>
                'if(window.runtime?.physics) window.runtime.physics.stop();\n';
            jsGen.forBlock['physics_set_gravity'] = (b: any) =>
                `if(window.runtime?.physics) window.runtime.physics.setGravity(${b.getFieldValue('GX') || 0}, ${b.getFieldValue('GY') || 1});\n`;
            jsGen.forBlock['physics_add_body'] = (b: any) =>
                `if(window.runtime?.physics) window.runtime.physics.addBody('${(b.getFieldValue('SPRITE') || '').replace(/'/g, "\\'")}');\n`;
            jsGen.forBlock['physics_add_force'] = (b: any) =>
                `if(window.runtime?.physics) window.runtime.physics.addForce('${(b.getFieldValue('SPRITE') || '').replace(/'/g, "\\'")}', ${b.getFieldValue('FX') || 0}, ${b.getFieldValue('FY') || -0.01});\n`;
            jsGen.forBlock['physics_set_bounce'] = (b: any) => {
                const spr = `(window.__activeSpriteId||'')`;
                return `if(window.runtime?.physics) window.runtime.physics.setBounce(${spr}, ${b.getFieldValue('VALUE') || 0.5});\n`;
            };
            jsGen.forBlock['physics_set_mass'] = (b: any) => {
                const spr = `(window.__activeSpriteId||'')`;
                return `if(window.runtime?.physics) window.runtime.physics.setMass(${spr}, ${b.getFieldValue('VALUE') || 1});\n`;
            };
            jsGen.forBlock['physics_set_static'] = (b: any) =>
                `if(window.runtime?.physics) window.runtime.physics.setStatic('${(b.getFieldValue('SPRITE') || '').replace(/'/g, "\\'")}', '${b.getFieldValue('VALUE')}'==='yes');\n`;
            jsGen.forBlock['physics_get_velocity_x'] = (b: any) =>
                [`window.runtime?.physics?.getVelocityX('${(b.getFieldValue('SPRITE') || '').replace(/'/g, "\\'")}')||0`, 0];
            jsGen.forBlock['physics_get_velocity_y'] = (b: any) =>
                [`window.runtime?.physics?.getVelocityY('${(b.getFieldValue('SPRITE') || '').replace(/'/g, "\\'")}')||0`, 0];
            jsGen.forBlock['physics_on_collision'] = () => '';
        },
        getToolbox: () => [
            { kind: 'label', text: 'Simulation' },
            { kind: 'block', type: 'physics_start' },
            { kind: 'block', type: 'physics_stop' },
            { kind: 'block', type: 'physics_set_gravity' },
            { kind: 'label', text: 'Bodies' },
            { kind: 'block', type: 'physics_add_body' },
            { kind: 'block', type: 'physics_add_force' },
            { kind: 'block', type: 'physics_set_bounce' },
            { kind: 'block', type: 'physics_set_mass' },
            { kind: 'block', type: 'physics_set_static' },
            { kind: 'label', text: 'Sensing' },
            { kind: 'block', type: 'physics_get_velocity_x' },
            { kind: 'block', type: 'physics_get_velocity_y' },
            { kind: 'block', type: 'physics_on_collision' },
        ]
    },

    makey_makey: {
        id: 'makey_makey',
        name: 'Makey Makey',
        color: '#00897B',
        icon: '🔌',
        registerBlocks: (Blockly: any) => {
            const mmBlockDefs = [
                {
                    type: 'makey_on_key',
                    message0: 'when makey makey %1 pressed',
                    args0: [{
                        type: 'field_dropdown',
                        name: 'KEY',
                        options: [
                            ['up', 'UP'], ['down', 'DOWN'], ['left', 'LEFT'], ['right', 'RIGHT'],
                            ['space', 'SPACE'], ['click', 'CLICK'],
                            ['w', 'W'], ['a', 'A'], ['s', 'S'], ['d', 'D'],
                        ]
                    }],
                    nextStatement: null,
                    colour: '#00897B',
                    tooltip: 'When a Makey Makey key is pressed',
                    hat: 'event',
                },
                {
                    type: 'makey_set_key',
                    message0: 'map makey makey %1 to key %2',
                    args0: [
                        {
                            type: 'field_dropdown',
                            name: 'SIGNAL',
                            options: [
                                ['up', 'UP'], ['down', 'DOWN'], ['left', 'LEFT'], ['right', 'RIGHT'],
                                ['space', 'SPACE'], ['click', 'CLICK'],
                                ['w', 'W'], ['a', 'A'], ['s', 'S'], ['d', 'D'],
                            ]
                        },
                        { type: 'field_input', name: 'KEY', text: 'space' }
                    ],
                    previousStatement: null,
                    nextStatement: null,
                    colour: '#00897B',
                    tooltip: 'Map a Makey Makey input to a virtual key name',
                },
                {
                    type: 'makey_get_key',
                    message0: 'makey makey last key',
                    output: 'String',
                    colour: '#00695C',
                    tooltip: 'Last key received from Makey Makey',
                },
            ];
            const newDefs = mmBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
            if (newDefs.length > 0) {
                Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newDefs));
            }
        },
        registerGenerators: (_Blockly: any) => {
            const jsGen = javascriptGenerator;
            if (!jsGen) return;

            jsGen.forBlock['makey_on_key'] = () => '';
            jsGen.forBlock['makey_set_key'] = (b: any) =>
                `if(window.runtime?.makeyMakey) window.runtime.makeyMakey.setKeyMap('${(b.getFieldValue('SIGNAL') || '').replace(/'/g, "\\'")}', '${(b.getFieldValue('KEY') || '').replace(/'/g, "\\'")}');\n`;
            jsGen.forBlock['makey_get_key'] = () =>
                ['window.runtime?.makeyMakey?.getLastKey()||""', 0];
        },
        getToolbox: () => [
            { kind: 'label', text: 'Events' },
            { kind: 'block', type: 'makey_on_key' },
            { kind: 'label', text: 'Configuration' },
            { kind: 'block', type: 'makey_set_key' },
            { kind: 'label', text: 'Sensing' },
            { kind: 'block', type: 'makey_get_key' },
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

export function getIgniteExtension(id: string) {
    const ext = EXTENSIONS[id];
    if (ext && ext.registerIgniteBlocks && ext.getIgniteToolbox) {
        return {
            ...ext,
            registerBlocks: ext.registerIgniteBlocks,
            getToolbox: ext.getIgniteToolbox,
        };
    }
    return ext;
}
